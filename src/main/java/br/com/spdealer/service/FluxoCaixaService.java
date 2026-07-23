package br.com.spdealer.service;

import br.com.spdealer.model.DashboardQuery;
import br.com.spdealer.repository.DashboardQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

/**
 * FluxoCaixaService
 *
 * Service para gerenciar Fluxo de Caixa (12 meses esperado vs real).
 * Usa QueryBuilder existente (DashboardQuery) para executar queries dinâmicas.
 *
 * Arquitetura:
 * 1. fluxo_caixa_linhas: Define estrutura (11 linhas: SALDO, RECIBOS, Clientes, etc)
 *    - Cada linha tem referência para query_id (FK dashboard_queries)
 * 2. fluxo_caixa_dados: Armazena valores mensais
 *    - valor_esperado: entrada do usuário
 *    - valor_real: calculado diariamente via scheduler
 * 3. DashboardQuery: Queries reutilizáveis
 *    - FC-001-Clientes: SELECT SUM(vlrsal_rec) FROM receber WHERE mes/ano
 *    - FC-007-Compras: SELECT SUM(vlrdup_pag) FROM pagar WHERE mes/ano
 *    - FC-009-Folha: SELECT SUM(vlrsalario) FROM folha_pagamento WHERE mes/ano
 *    - etc
 *
 * Fluxo:
 * 1. GET /api/v1/fluxo-caixa/12meses/{ano}
 *    - Busca fluxo_caixa_linhas (11 linhas)
 *    - Busca fluxo_caixa_dados (12 meses)
 *    - Não executa queries aqui (lazy load)
 *    - Retorna estrutura com valores esperados
 *
 * 2. GET /api/v1/fluxo-caixa/linha/{id}/dados
 *    - Lazy load: executa query para valor_real
 *    - Usa DashboardQuery -> query_id -> sql_query
 *    - Substitui :ano, :mes em parameterized queries
 *    - Retorna valor_real calculado
 *
 * 3. POST /api/v1/fluxo-caixa/linha/{id}/mes/{ano}/{mes}
 *    - Atualiza valor_esperado para um mês específico
 *    - Exemplo: POST /api/v1/fluxo-caixa/linha/3/mes/2025/01
 *    - Body: { "valor_esperado": 50000.00 }
 *
 * 4. @Scheduled(cron = "0 59 23 * * *") - DAILY 23:59
 *    - Executa atualizarValoresReais()
 *    - Para cada fluxo_caixa_linha com eh_calculada=1
 *    - Executa query e atualiza valor_real em fluxo_caixa_dados
 *    - Calcula variacao = valor_real - valor_esperado
 */
@Service
@RequiredArgsConstructor
public class FluxoCaixaService {

    private static final Logger logger = LoggerFactory.getLogger(FluxoCaixaService.class);

    private final JdbcTemplate jdbcTemplate;
    private final DashboardQueryRepository queryRepository;
    private final DashboardService dashboardService;

    /**
     * Busca 12 meses de Fluxo de Caixa (estrutura + valores esperados)
     * Não executa queries aqui (lazy load).
     *
     * @param ano Ano (ex: 2025)
     * @return Mapa com: linhas (11 linhas), meses (12 meses com valores)
     */
    public Map<String, Object> get12Meses(Integer ano) {
        logger.info("[FluxoCaixa] Buscando 12 meses para ano: {}", ano);

        Map<String, Object> resultado = new HashMap<>();

        // 1. Buscar linhas (estrutura)
        String sqlLinhas = """
            SELECT id, codigo_linha, descricao, tipo_linha, query_id, eh_calculada, ordem, nivel_hierarquia
            FROM fluxo_caixa_linhas
            ORDER BY ordem ASC
            """;
        List<Map<String, Object>> linhas = jdbcTemplate.queryForList(sqlLinhas);
        logger.info("[FluxoCaixa] {} linhas encontradas", linhas.size());

        // 2. Buscar dados para os 12 meses
        List<Map<String, Object>> linhasComDados = new ArrayList<>();
        for (Map<String, Object> linha : linhas) {
            Long linhaId = ((Number) linha.get("id")).longValue();
            Long queryId = linha.get("query_id") != null ? ((Number) linha.get("query_id")).longValue() : null;
            Boolean ehCalculada = (Boolean) linha.get("eh_calculada");

            // Buscar dados de 12 meses
            List<Map<String, Object>> meses = new ArrayList<>();
            for (int mes = 1; mes <= 12; mes++) {
                String sqlDados = """
                    SELECT valor_esperado, valor_real, variacao
                    FROM fluxo_caixa_dados
                    WHERE fluxo_caixa_linha_id = ? AND YEAR(ano_mes) = ? AND MONTH(ano_mes) = ?
                    LIMIT 1
                    """;
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(sqlDados, linhaId, ano, mes);

                Map<String, Object> mesData = new HashMap<>();
                mesData.put("mes", mes);
                if (!rows.isEmpty()) {
                    mesData.putAll(rows.get(0));
                } else {
                    // Inicializar com zeros se não existir
                    mesData.put("valor_esperado", 0);
                    mesData.put("valor_real", null);
                    mesData.put("variacao", null);
                }
                meses.add(mesData);
            }

            linha.put("meses", meses);
            linha.put("queryId", queryId);
            linha.put("ehCalculada", ehCalculada);
            linhasComDados.add(linha);
        }

        resultado.put("ano", ano);
        resultado.put("linhas", linhasComDados);
        logger.info("[FluxoCaixa] Estrutura 12 meses preparada com sucesso");

        return resultado;
    }

    /**
     * Salva valor_esperado para um mês específico de uma linha.
     * Cria registro em fluxo_caixa_dados se não existir.
     *
     * @param linhaId ID da linha (fluxo_caixa_linha.id)
     * @param ano Ano (ex: 2025)
     * @param mes Mês (1-12)
     * @param valorEsperado Valor esperado para aquele mês
     * @param userId ID do usuário fazendo a atualização
     */
    public void saveValorEsperado(Long linhaId, Integer ano, Integer mes, BigDecimal valorEsperado, Long userId) {
        logger.info("[FluxoCaixa] Salvando valor esperado - linha: {}, ano: {}, mes: {}, valor: {}", 
            linhaId, ano, mes, valorEsperado);

        LocalDate data = LocalDate.of(ano, mes, 1);

        // Verificar se já existe registro
        String sqlCheck = """
            SELECT id FROM fluxo_caixa_dados
            WHERE fluxo_caixa_linha_id = ? AND ano_mes = ?
            LIMIT 1
            """;
        List<Map<String, Object>> existente = jdbcTemplate.queryForList(sqlCheck, linhaId, data);

        if (!existente.isEmpty()) {
            // UPDATE
            String sqlUpdate = """
                UPDATE fluxo_caixa_dados
                SET valor_esperado = ?, usuario_atualizacao = ?, data_atualizacao = NOW()
                WHERE fluxo_caixa_linha_id = ? AND ano_mes = ?
                """;
            jdbcTemplate.update(sqlUpdate, valorEsperado, userId, linhaId, data);
            logger.info("[FluxoCaixa] Valor esperado ATUALIZADO");
        } else {
            // INSERT
            String sqlInsert = """
                INSERT INTO fluxo_caixa_dados 
                (fluxo_caixa_linha_id, ano_mes, valor_esperado, usuario_criacao, data_criacao)
                VALUES (?, ?, ?, ?, NOW())
                """;
            jdbcTemplate.update(sqlInsert, linhaId, data, valorEsperado, userId);
            logger.info("[FluxoCaixa] Valor esperado CRIADO");
        }
    }

    /**
     * Executa query e retorna valor_real para uma linha em um mês específico.
     * Lazy load: executado sob demanda ou via scheduler.
     *
     * @param linhaId ID da linha (fluxo_caixa_linha.id)
     * @param ano Ano (ex: 2025)
     * @param mes Mês (1-12)
     * @return BigDecimal com resultado da query
     */
    public BigDecimal getValorReal(Long linhaId, Integer ano, Integer mes) {
        logger.info("[FluxoCaixa] Calculando valor real - linha: {}, ano: {}, mes: {}", linhaId, ano, mes);

        try {
            // 1. Buscar query_id da linha
            String sqlLinha = "SELECT query_id FROM fluxo_caixa_linhas WHERE id = ? LIMIT 1";
            List<Map<String, Object>> linhas = jdbcTemplate.queryForList(sqlLinha, linhaId);

            if (linhas.isEmpty()) {
                logger.warn("[FluxoCaixa] Linha {} não encontrada", linhaId);
                return BigDecimal.ZERO;
            }

            Long queryId = (Long) linhas.get(0).get("query_id");
            if (queryId == null) {
                logger.warn("[FluxoCaixa] Linha {} não tem query_id associada", linhaId);
                return BigDecimal.ZERO;
            }

            // 2. Buscar SQL da query (dashboard_queries)
            Optional<DashboardQuery> queryOpt = queryRepository.findById(queryId);
            if (queryOpt.isEmpty()) {
                logger.warn("[FluxoCaixa] Query {} não encontrada no dashboard_queries", queryId);
                return BigDecimal.ZERO;
            }

            String sqlQuery = queryOpt.get().getSqlQuery();
            if (sqlQuery == null || sqlQuery.isEmpty()) {
                logger.warn("[FluxoCaixa] Query {} não possui sql_query", queryId);
                return BigDecimal.ZERO;
            }

            // 3. Substituir parâmetros :ano e :mes
            String sqlParametrizado = sqlQuery
                .replace(":ano", ano.toString())
                .replace(":mes", mes.toString())
                .replace("?", "");  // Remove placeholders residuais

            logger.debug("[FluxoCaixa] SQL parametrizado: {}", sqlParametrizado);

            // 4. Validar segurança
            if (!dashboardService.isSelectQuerySafe(sqlParametrizado)) {
                logger.warn("[FluxoCaixa] Query bloqueada por falha de segurança");
                return BigDecimal.ZERO;
            }

            // 5. Executar e retornar resultado
            Object result = jdbcTemplate.queryForObject(sqlParametrizado, Object.class);
            BigDecimal valor = result != null ? new BigDecimal(result.toString()) : BigDecimal.ZERO;

            logger.info("[FluxoCaixa] Valor real calculado: {}", valor);
            return valor;

        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao calcular valor real", e);
            return BigDecimal.ZERO;
        }
    }

    /**
     * Executa scheduler diariamente às 23:59 para atualizar valores_reais
     * para todos os meses de todos as linhas calculadas (eh_calculada = 1).
     *
     * Lógica:
     * 1. Buscar todas as linhas com eh_calculada = 1
     * 2. Para cada linha, executar query e buscar valor_real
     * 3. Atualizar valor_real em fluxo_caixa_dados
     * 4. Calcular variacao = valor_real - valor_esperado
     */
    @Scheduled(cron = "0 59 23 * * *")  // 23:59 diariamente
    public void atualizarValoresReais() {
        logger.info("[FluxoCaixa-Scheduler] ⏰ Iniciando atualização de valores reais (23:59)");

        try {
            // 1. Buscar linhas calculadas
            String sqlLinhas = """
                SELECT id, codigo_linha, descricao, query_id
                FROM fluxo_caixa_linhas
                WHERE eh_calculada = 1
                """;
            List<Map<String, Object>> linhas = jdbcTemplate.queryForList(sqlLinhas);
            logger.info("[FluxoCaixa-Scheduler] {} linhas calculadas para atualizar", linhas.size());

            int totalAtualizacoes = 0;

            for (Map<String, Object> linha : linhas) {
                Long linhaId = ((Number) linha.get("id")).longValue();
                Long queryId = ((Number) linha.get("query_id")).longValue();
                String codigoLinha = (String) linha.get("codigo_linha");

                logger.debug("[FluxoCaixa-Scheduler] Processando linha: {} ({})", codigoLinha, linhaId);

                // 2. Para cada mês do ano atual
                int anoAtual = LocalDate.now().getYear();
                for (int mes = 1; mes <= 12; mes++) {
                    try {
                        BigDecimal valorReal = getValorReal(linhaId, anoAtual, mes);
                        
                        // 3. Buscar valor_esperado
                        LocalDate data = LocalDate.of(anoAtual, mes, 1);
                        String sqlExpectativa = """
                            SELECT valor_esperado FROM fluxo_caixa_dados
                            WHERE fluxo_caixa_linha_id = ? AND ano_mes = ?
                            LIMIT 1
                            """;
                        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sqlExpectativa, linhaId, data);
                        BigDecimal valorEsperado = !rows.isEmpty() 
                            ? (BigDecimal) rows.get(0).get("valor_esperado") 
                            : BigDecimal.ZERO;

                        // 4. Calcular variacao
                        BigDecimal variacao = valorReal.subtract(valorEsperado);

                        // 5. Atualizar fluxo_caixa_dados
                        String sqlUpdate = """
                            UPDATE fluxo_caixa_dados
                            SET valor_real = ?, variacao = ?, data_atualizacao = NOW()
                            WHERE fluxo_caixa_linha_id = ? AND ano_mes = ?
                            """;
                        int updates = jdbcTemplate.update(sqlUpdate, valorReal, variacao, linhaId, data);
                        
                        if (updates > 0) {
                            totalAtualizacoes++;
                            logger.debug("[FluxoCaixa-Scheduler] {} {}/{}: real={}, esperado={}, var={}",
                                codigoLinha, anoAtual, mes, valorReal, valorEsperado, variacao);
                        }

                    } catch (Exception e) {
                        logger.error("[FluxoCaixa-Scheduler] Erro ao atualizar {}/{}: {}", codigoLinha, mes, e.getMessage());
                    }
                }
            }

            logger.info("[FluxoCaixa-Scheduler] ✅ Conclusão: {} registros atualizados", totalAtualizacoes);

        } catch (Exception e) {
            logger.error("[FluxoCaixa-Scheduler] ❌ Erro crítico no scheduler", e);
        }
    }

    /**
     * Calcula variação mensal: (valor_real - valor_esperado) / valor_esperado * 100
     * Usada para exibir % de desvio no frontend.
     */
    public Double calcularVariacaoPercentual(BigDecimal valorReal, BigDecimal valorEsperado) {
        if (valorEsperado == null || valorEsperado.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return valorReal.subtract(valorEsperado)
            .divide(valorEsperado)
            .multiply(new BigDecimal(100))
            .doubleValue();
    }

    /**
     * Valida se query_id existe e tem sql_query válida
     */
    public boolean validarQueryId(Long queryId) {
        if (queryId == null) return false;
        
        Optional<DashboardQuery> queryOpt = queryRepository.findById(queryId);
        if (queryOpt.isEmpty()) return false;
        
        String sql = queryOpt.get().getSqlQuery();
        return sql != null && !sql.isEmpty();
    }
}
