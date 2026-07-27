package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * FluxoCaixaProjetadoService - Serviço de Projeção de Fluxo de Caixa (90 dias)
 * 
 * Diferente de FluxoCaixaService que trata de 12 meses Esperado vs Real,
 * este serviço trata da PROJEÇÃO DIÁRIA de caixa para os próximos 90 dias.
 *
 * Responsabilidades:
 * - Calcular fluxo de caixa diário (receber - pagar)
 * - Gerar saldos acumulados
 * - Indicadores de risco (POSITIVO, ATENÇÃO, CRÍTICO)
 * - Resumos mensais
 * - Identificar melhores dias para pagamento
 * - Detalhes de documentos por dia (drill-down)
 *
 * Usados em: /api/v1/fluxo-caixa-projetado/*
 */
@Service
public class FluxoCaixaProjetadoService {

    private static final Logger logger = LoggerFactory.getLogger(FluxoCaixaProjetadoService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * 1️⃣ Obter fluxo de caixa consolidado por dia (próximos 90 dias)
     * 
     * Agrupa receber + pagar por data, calcula saldos diários e acumulados.
     * Utiliza COALESCE(dtfluxo_pag, dtvenci_pag) para respeitar datas alternativas de fluxo.
     * Utiliza campos com "i" (dtvenci_reci, dtemissi_reci, etc)
     *
     * @param filial Código da filial (ex: '001')
     * @return Lista de mapas com dados diários
     */
    public List<Map<String, Object>> obterFluxoCaixaDiario(String filial) {
        logger.info("[FluxoProj] Buscando fluxo de caixa diário para próximos 90 dias - Filial: {}", filial);

        String sql = """
            SELECT 
              data AS data_projecao,
              SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) AS total_receber,
              SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END) AS total_pagar,
              (SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) - 
               SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END)) AS saldo_diario,
              SUM(SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) - 
                  SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END)) 
                OVER (ORDER BY data) AS saldo_acumulado,
              SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN 1 ELSE 0 END) AS qtd_receber,
              SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN 1 ELSE 0 END) AS qtd_pagar,
              DATE_FORMAT(data, '%Y-%m') AS mes_projecao,
              DAYNAME(data) AS dia_semana,
              DATE_FORMAT(data, '%d/%m/%Y') AS data_exibicao
            FROM (
              SELECT 
                rec.dtvenci_rec AS data,
                rec.vlrsal_rec AS valor,
                'RECEBER' AS tipo_movimento
              FROM receber rec
              WHERE rec.filial_rec = ?
                AND rec.vlrsal_rec > 0
                AND (rec.status_rec IS NULL OR rec.status_rec = '')
                AND rec.dtvenci_rec >= CURDATE()
                AND rec.dtvenci_rec <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
                
              UNION ALL
              
              SELECT 
                COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) AS data,
                pag.vlrsal_pag AS valor,
                'PAGAR' AS tipo_movimento
              FROM pagar pag
              WHERE pag.filial_pag = ?
                AND pag.vlrsal_pag > 0
                AND (pag.status_pag IS NULL OR pag.status_pag = '')
                AND COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) >= CURDATE()
                AND COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            ) AS fluxo_consolidado
            
            GROUP BY data
            ORDER BY data
            """;

        List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, filial, filial);
        
        // Adicionar indicador de risco
        BigDecimal totalReceitaProjetada = resultado.stream()
            .map(dia -> new BigDecimal(dia.get("total_receber").toString()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        for (Map<String, Object> dia : resultado) {
            BigDecimal saldoAcum = new BigDecimal(dia.get("saldo_acumulado").toString());
            String indicador = calcularIndicadorRisco(saldoAcum, totalReceitaProjetada);
            dia.put("indicador", indicador);
            dia.put("cor_indicador", obterCorIndicador(indicador));
        }

        logger.info("[FluxoProj] {} dias com movimento encontrados", resultado.size());
        return resultado;
    }

    /**
     * 2️⃣ Calcular indicador de risco (POSITIVO, ATENÇÃO, CRÍTICO)
     * 
     * Lógica:
     * - POSITIVO: saldo > 0
     * - ATENÇÃO: 0 >= saldo > -5% da receita
     * - CRÍTICO: saldo <= -5% da receita
     *
     * @param saldoAcumulado Saldo acumulado do dia em reais
     * @param receitaTotal Total de receita projetada
     * @return String com indicador
     */
    public String calcularIndicadorRisco(BigDecimal saldoAcumulado, BigDecimal receitaTotal) {
        if (saldoAcumulado.compareTo(BigDecimal.ZERO) > 0) {
            return "POSITIVO";
        }

        BigDecimal limiteAtencao = receitaTotal.multiply(new BigDecimal("0.05")).negate();
        if (saldoAcumulado.compareTo(limiteAtencao) >= 0) {
            return "ATENÇÃO";
        }

        return "CRÍTICO";
    }

    /**
     * 3️⃣ Obter cor para indicador (para visualização no AG Grid)
     *
     * @param indicador Tipo de indicador
     * @return String com código de cor (HEX ou Bootstrap)
     */
    public String obterCorIndicador(String indicador) {
        switch (indicador) {
            case "POSITIVO":
                return "#28a745";  // Verde
            case "ATENÇÃO":
                return "#ffc107";  // Amarelo
            case "CRÍTICO":
                return "#dc3545";  // Vermelho
            default:
                return "#6c757d";  // Cinza
        }
    }

    /**
     * 4️⃣ Obter resumo por mês
     * Usa COALESCE(dtfluxo_pag, dtvenci_pag) para respeitar datas alternativas em Pagar
     *
     * @param filial Código da filial
     * @return Lista de mapas com dados mensais
     */
    public List<Map<String, Object>> obterResumoMensal(String filial) {
        logger.info("[FluxoProj] Buscando resumo mensal - Filial: {}", filial);

        String sql = """
            SELECT 
              DATE_FORMAT(data, '%Y-%m') AS mes,
              CONCAT(DATE_FORMAT(data, '%m'), '/', DATE_FORMAT(data, '%Y')) AS mes_exibicao,
              DATE_FORMAT(MIN(data), '%d/%m/%Y') AS primeira_data,
              DATE_FORMAT(MAX(data), '%d/%m/%Y') AS ultima_data,
              COUNT(DISTINCT data) AS dias_com_movimento,
              SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) AS total_receber_mes,
              SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END) AS total_pagar_mes,
              (SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) - 
               SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END)) AS saldo_mes,
              COUNT(DISTINCT CASE WHEN tipo_movimento = 'RECEBER' THEN id_movimento END) AS qtd_receber_mes,
              COUNT(DISTINCT CASE WHEN tipo_movimento = 'PAGAR' THEN id_movimento END) AS qtd_pagar_mes,
              ROUND(SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) / NULLIF(COUNT(DISTINCT data), 0), 2) AS media_receber_dia,
              ROUND(SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END) / NULLIF(COUNT(DISTINCT data), 0), 2) AS media_pagar_dia
            FROM (
              SELECT 
                rec.dtvenci_rec AS data,
                rec.vlrsal_rec AS valor,
                'RECEBER' AS tipo_movimento,
                rec.receber_id AS id_movimento
              FROM receber rec
              WHERE rec.filial_rec = ?
                AND rec.vlrsal_rec > 0
                AND (rec.status_rec IS NULL OR rec.status_rec = '')
                AND rec.dtvenci_rec >= CURDATE()
                AND rec.dtvenci_rec <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
                
              UNION ALL
              
              SELECT 
                COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) AS data,
                pag.vlrsal_pag AS valor,
                'PAGAR' AS tipo_movimento,
                pag.pagar_id AS id_movimento
              FROM pagar pag
              WHERE pag.filial_pag = ?
                AND pag.vlrsal_pag > 0
                AND (pag.status_pag IS NULL OR pag.status_pag = '')
                AND COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) >= CURDATE()
                AND COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            ) AS fluxo_consolidado
            
            GROUP BY DATE_FORMAT(data, '%Y-%m')
            ORDER BY mes ASC
            """;

        List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, filial, filial);
        logger.info("[FluxoProj] {} meses com movimento encontrados", resultado.size());
        return resultado;
    }

    /**
     * 5️⃣ Obter melhores dias para pagar (análise de score)
     * Usa COALESCE(dtfluxo_pag, dtvenci_pag) para respeitar datas alternativas
     *
     * Score = 40% peso saldo acumulado + 60% peso recebimentos
     * Filtra apenas dias com saldo acumulado > 0
     *
     * @param filial Código da filial
     * @return Lista dos 5 melhores dias ordenados por score
     */
    public List<Map<String, Object>> obterMelhorDiasPagar(String filial) {
        logger.info("[FluxoProj] Buscando melhor dias para pagar - Filial: {}", filial);

        String sql = """
            SELECT 
              data AS dia_recomendado,
              data_exibicao,
              total_receber,
              total_pagar,
              saldo_diario,
              saldo_acumulado,
              score_recomendacao,
              CASE 
                WHEN score_recomendacao >= 0.8 THEN 'Excelente'
                WHEN score_recomendacao >= 0.6 THEN 'Bom'
                WHEN score_recomendacao >= 0.4 THEN 'Aceitavel'
                ELSE 'Nao recomendado'
              END AS qualidade_dia
            FROM (
              SELECT 
                data,
                DATE_FORMAT(data, '%d/%m/%Y') AS data_exibicao,
                total_receber,
                total_pagar,
                saldo_diario,
                saldo_acumulado,
                ROUND(
                  (saldo_acumulado / MAX(saldo_acumulado) OVER () * 0.4) +
                  (total_receber / NULLIF(MAX(total_receber) OVER (), 0) * 0.6),
                  2
                ) AS score_recomendacao
              FROM (
                SELECT 
                  data,
                  SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) AS total_receber,
                  SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END) AS total_pagar,
                  (SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) - 
                   SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END)) AS saldo_diario,
                  SUM(SUM(CASE WHEN tipo_movimento = 'RECEBER' THEN valor ELSE 0 END) - 
                      SUM(CASE WHEN tipo_movimento = 'PAGAR' THEN valor ELSE 0 END)) 
                    OVER (ORDER BY data) AS saldo_acumulado
                FROM (
                  SELECT rec.dtvenci_rec AS data, rec.vlrsal_rec AS valor, 'RECEBER' AS tipo_movimento
                  FROM receber rec
                  WHERE rec.filial_rec = ? AND rec.vlrsal_rec > 0 AND (rec.status_rec IS NULL OR rec.status_rec = '')
                    AND rec.dtvenci_rec >= CURDATE() AND rec.dtvenci_rec <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
                  
                  UNION ALL
                  
                  SELECT COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) AS data, pag.vlrsal_pag AS valor, 'PAGAR' AS tipo_movimento
                  FROM pagar pag
                  WHERE pag.filial_pag = ? AND pag.vlrsal_pag > 0 AND (pag.status_pag IS NULL OR pag.status_pag = '')
                    AND COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) >= CURDATE() AND COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
                ) AS fluxo_consolidado
                GROUP BY data
              ) AS fluxo_scored
              WHERE saldo_acumulado > 0
            ) AS melhores_dias_scored
            
            ORDER BY score_recomendacao DESC
            LIMIT 5
            """;

        List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, filial, filial);
        logger.info("[FluxoProj] {} melhores dias encontrados", resultado.size());
        return resultado;
    }

    /**
     * 6️⃣ Obter detalhes de documentos para um dia específico (drill-down)
     *
     * Retorna lista de receber + pagar para um dia, com informações de cliente/fornecedor.
     * Para Pagar, usa COALESCE(dtfluxo_pag, dtvenci_pag) para respeitar datas alternativas.
     * Usado quando usuário clica no "+" no AG Grid para expandir o dia.
     *
     * @param filial Código da filial
     * @param data Data do movimento
     * @return Lista de documentos do dia
     */
    public List<Map<String, Object>> obterDetalhesDocumentosPorDia(String filial, LocalDate data) {
        logger.info("[FluxoProj] Buscando detalhes de documentos para {} - Filial: {}", data, filial);

        String sql = """
            SELECT 
              'RECEBER' AS tipo_movimento,
              'receber' AS tipo_documento,
              rec.numdup_rec AS numero_documento,
              rec.parcela_rec AS parcela,
              rec.vlrsal_rec AS valor,
              CASE WHEN rec.tipopessoa_rec = 'F' THEN
                CONCAT(SUBSTRING(LPAD(rec.cgccpf_rec,11,'0'),1,3),'.',SUBSTRING(LPAD(rec.cgccpf_rec,11,'0'),4,3),'.',SUBSTRING(LPAD(rec.cgccpf_rec,11,'0'),7,3),'-',SUBSTRING(LPAD(rec.cgccpf_rec,11,'0'),10,2))
              WHEN rec.tipopessoa_rec = 'J' THEN
                CONCAT(SUBSTRING(LPAD(rec.cgccpf_rec,14,'0'),1,2),'.',SUBSTRING(LPAD(rec.cgccpf_rec,14,'0'),3,3),'.',SUBSTRING(LPAD(rec.cgccpf_rec,14,'0'),6,3),'/',SUBSTRING(LPAD(rec.cgccpf_rec,14,'0'),9,4),'-',SUBSTRING(LPAD(rec.cgccpf_rec,14,'0'),13,2))
              ELSE rec.cgccpf_rec END AS cnpj_cpf,
              CASE rec.tipopessoa_rec WHEN 'J' THEN 'CNPJ' ELSE 'CPF' END AS tipo_pessoa,
              cli.nome_cli AS nome_pessoa,
              rec.dtvenci_rec AS data_vencimento,
              DATE_FORMAT(rec.dtvenci_rec, '%d/%m/%Y') AS data_vencimento_exibicao,
              rec.dtemissi_rec AS data_emissao,
              DATE_FORMAT(rec.dtemissi_rec, '%d/%m/%Y') AS data_emissao_exibicao,
              rec.status_rec AS status,
              rec.receber_id AS id_movimento
            FROM receber rec
            LEFT JOIN clientes cli ON cli.cliforn_cli = 'C' AND rec.codigo_rec = cli.codigo_cli
            WHERE rec.filial_rec = ? AND rec.dtvenci_rec = ? 
              AND rec.vlrsal_rec > 0
              AND (rec.status_rec IS NULL OR rec.status_rec = '')
            
            UNION ALL
            
            SELECT 
              'PAGAR' AS tipo_movimento,
              'pagar' AS tipo_documento,
              pag.numdup_pag AS numero_documento,
              pag.parcela_pag AS parcela,
              pag.vlrsal_pag AS valor,
              CASE WHEN pag.tipopessoa_pag = 'F' THEN
                CONCAT(SUBSTRING(LPAD(pag.cgccpf_pag,11,'0'),1,3),'.',SUBSTRING(LPAD(pag.cgccpf_pag,11,'0'),4,3),'.',SUBSTRING(LPAD(pag.cgccpf_pag,11,'0'),7,3),'-',SUBSTRING(LPAD(pag.cgccpf_pag,11,'0'),10,2))
              WHEN pag.tipopessoa_pag = 'J' THEN
                CONCAT(SUBSTRING(LPAD(pag.cgccpf_pag,14,'0'),1,2),'.',SUBSTRING(LPAD(pag.cgccpf_pag,14,'0'),3,3),'.',SUBSTRING(LPAD(pag.cgccpf_pag,14,'0'),6,3),'/',SUBSTRING(LPAD(pag.cgccpf_pag,14,'0'),9,4),'-',SUBSTRING(LPAD(pag.cgccpf_pag,14,'0'),13,2))
              ELSE pag.cgccpf_pag END AS cnpj_cpf,
              CASE pag.tipopessoa_pag WHEN 'J' THEN 'CNPJ' ELSE 'CPF' END AS tipo_pessoa,
              cli.nome_cli AS nome_pessoa,
              pag.dtvenci_pag AS data_vencimento,
              DATE_FORMAT(pag.dtvenci_pag, '%d/%m/%Y') AS data_vencimento_exibicao,
              pag.dtemissi_pag AS data_emissao,
              DATE_FORMAT(pag.dtemissi_pag, '%d/%m/%Y') AS data_emissao_exibicao,
              pag.status_pag AS status,
              pag.pagar_id AS id_movimento
            FROM pagar pag
            LEFT JOIN clientes cli ON cli.cliforn_cli = 'F' AND pag.codigo_pag = cli.codigo_cli
            WHERE pag.filial_pag = ? AND COALESCE(pag.dtfluxo_pag, pag.dtvenci_pag) = ? 
              AND pag.vlrsal_pag > 0
              AND (pag.status_pag IS NULL OR pag.status_pag = '')
            
            ORDER BY tipo_movimento DESC, valor DESC
            """;

        List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, filial, data, filial, data);
        logger.info("[FluxoProj] {} documentos encontrados para {}", resultado.size(), data);
        return resultado;
    }

    /**
     * 7️⃣ Calcular análise de risco completa
     *
     * Retorna estatísticas gerais de risco para os próximos 90 dias.
     *
     * @param filial Código da filial
     * @return Mapa com indicadores de risco
     */
    public Map<String, Object> calcularAnaliseRisco(String filial) {
        logger.info("[FluxoProj] Calculando análise de risco - Filial: {}", filial);

        Map<String, Object> analise = new LinkedHashMap<>();

        List<Map<String, Object>> fluxo = obterFluxoCaixaDiario(filial);

        if (fluxo.isEmpty()) {
            analise.put("status", "SEM_DADOS");
            logger.warn("[FluxoProj] Sem dados de projeção para os próximos 90 dias");
            return analise;
        }

        // Calcular estatísticas
        BigDecimal saldoMax = BigDecimal.ZERO;
        BigDecimal saldoMin = BigDecimal.ZERO;
        BigDecimal totalReceber = BigDecimal.ZERO;
        BigDecimal totalPagar = BigDecimal.ZERO;
        int diasCriticos = 0;
        int diasAtencao = 0;

        for (Map<String, Object> dia : fluxo) {
            BigDecimal saldoAcum = new BigDecimal(dia.get("saldo_acumulado").toString());
            BigDecimal receber = new BigDecimal(dia.get("total_receber").toString());
            BigDecimal pagar = new BigDecimal(dia.get("total_pagar").toString());
            String indicador = (String) dia.get("indicador");

            if (saldoAcum.compareTo(saldoMax) > 0) saldoMax = saldoAcum;
            if (saldoAcum.compareTo(saldoMin) < 0) saldoMin = saldoAcum;

            totalReceber = totalReceber.add(receber);
            totalPagar = totalPagar.add(pagar);

            if ("CRÍTICO".equals(indicador)) diasCriticos++;
            if ("ATENÇÃO".equals(indicador)) diasAtencao++;
        }

        BigDecimal totalLiquido = totalReceber.subtract(totalPagar);
        double percentualCritico = (diasCriticos * 100.0) / fluxo.size();
        double percentualAtencao = (diasAtencao * 100.0) / fluxo.size();

        analise.put("status", "OK");
        analise.put("saldo_maximo", saldoMax);
        analise.put("saldo_minimo", saldoMin);
        analise.put("total_receita_projetada", totalReceber);
        analise.put("total_despesa_projetada", totalPagar);
        analise.put("total_liquido", totalLiquido);
        analise.put("dias_criticos", diasCriticos);
        analise.put("dias_atencao", diasAtencao);
        analise.put("dias_positivos", fluxo.size() - diasCriticos - diasAtencao);
        analise.put("dias_analisados", fluxo.size());
        analise.put("percentual_critico", String.format("%.1f%%", percentualCritico));
        analise.put("percentual_atencao", String.format("%.1f%%", percentualAtencao));

        logger.info("[FluxoProj] Análise concluída: {} dias críticos, {} dias atenção", diasCriticos, diasAtencao);
        return analise;
    }

    /**
     * 8️⃣ Gerar recomendação de estratégia de pagamento
     *
     * @param filial Código da filial
     * @return String com recomendações formatadas
     */
    public String gerarRecomendacaoPagamento(String filial) {
        logger.info("[FluxoProj] Gerando recomendação de pagamento - Filial: {}", filial);

        Map<String, Object> analise = calcularAnaliseRisco(filial);

        if ("SEM_DADOS".equals(analise.get("status"))) {
            return "⚠️  Sem dados de projeção disponível para os próximos 90 dias.";
        }

        List<Map<String, Object>> melhorDias = obterMelhorDiasPagar(filial);

        StringBuilder recomendacao = new StringBuilder();
        recomendacao.append("📊 RECOMENDAÇÃO DE ESTRATÉGIA DE PAGAMENTO\n\n");

        recomendacao.append("1️⃣  ANÁLISE DE RISCO (próximos 90 dias)\n");
        recomendacao.append(String.format("   💰 Saldo máximo: R$ %.2f\n", analise.get("saldo_maximo")));
        recomendacao.append(String.format("   📉 Saldo mínimo: R$ %.2f\n", analise.get("saldo_minimo")));
        recomendacao.append(String.format("   ⚠️  Dias críticos: %d (%s)\n", 
            analise.get("dias_criticos"), analise.get("percentual_critico")));
        recomendacao.append(String.format("   ⚡ Dias em atenção: %d (%s)\n",
            analise.get("dias_atencao"), analise.get("percentual_atencao")));

        recomendacao.append("\n2️⃣  MELHORES DIAS PARA PAGAR\n");
        if (melhorDias.isEmpty()) {
            recomendacao.append("   ❌ Nenhum dia com saldo acumulado positivo\n");
        } else {
            for (int i = 0; i < Math.min(5, melhorDias.size()); i++) {
                Map<String, Object> dia = melhorDias.get(i);
                recomendacao.append(String.format("   %d. %s - Score: %.2f (%s)\n",
                    i + 1, dia.get("data_exibicao"), dia.get("score_recomendacao"), dia.get("qualidade_dia")));
            }
        }

        recomendacao.append("\n3️⃣  AÇÃO RECOMENDADA\n");
        int diasCriticos = Integer.parseInt(analise.get("dias_criticos").toString());
        if (diasCriticos > fluxo.size() / 3) {
            recomendacao.append("   🚨 CRÍTICO: Concentrar pagamentos nos dias com maior saldo\n");
            recomendacao.append("   🚨 Negociar prazos com fornecedores\n");
            recomendacao.append("   🚨 Considerar linhas de crédito de curto prazo\n");
        } else if (diasCriticos > 0) {
            recomendacao.append("   ⚠️  ATENÇÃO: Monitorar fluxo diariamente\n");
            recomendacao.append("   ⚠️  Evitar pagamentos nos dias críticos\n");
        } else {
            recomendacao.append("   ✅ Caixa em situação confortável\n");
            recomendacao.append("   ✅ Pode manter operações normais\n");
        }

        return recomendacao.toString();
    }

    // Placeholder para uso interno
    private List<Map<String, Object>> fluxo = Collections.emptyList();
}
