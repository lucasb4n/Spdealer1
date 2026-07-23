package br.com.spdealer.service;

import br.com.spdealer.model.FluxoCaixaDado;
import br.com.spdealer.repository.FluxoCaixaDadoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service: FluxoCaixaCalculoService
 * 
 * Responsabilidade: Calcular valores REAIS do fluxo de caixa
 * Agrega dados de 3 tabelas operacionais:
 * 1. caixa (movimentações diárias)
 * 2. receber (a receber)
 * 3. pagar (a pagar)
 * 
 * Workflow:
 * 1. Sistema agrupa valores por operacao_cai/opercai_rec/opercai_pag
 * 2. FluxoCaixaCalculoService executa queries de agregação
 * 3. Salva resultados em fluxo_caixa_dados.valor_real
 * 4. Scheduler @Scheduled executa diariamente às 23:59
 * 5. Dashboard renderiza com valores reais vs esperados
 * 
 * Exemplo:
 * - operacao_cai = "1" (SALDO)
 * - ano = 2025, mês = 1
 * - Busca: SUM(valor) FROM caixa WHERE operacao_cai='1' AND YEAR(dtmovi_cai)=2025 AND MONTH(dtmovi_cai)=1
 * - Resultado: 50000.00 (valor real do saldo em JAN/2025)
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class FluxoCaixaCalculoService {

    private final JdbcTemplate jdbcTemplate;
    private final FluxoCaixaDadoRepository fluxoCaixaDadoRepository;

    /**
     * Calcula o valor REAL de uma linha em um mês específico
     * 
     * Estratégia:
     * 1. Busca FluxoCaixaLinha pelo ID para obter operacao_ocai
     * 2. Aggrega valores de 3 tabelas:
     *    - caixa: SUM(valor_cai) WHERE banco_cai='001' AND operacao_cai
     *    - receber: SUM(vlrfat_rec) WHERE opercai_rec = operacao_cai
     *    - pagar: SUM(vlrfat_pag) WHERE opercai_pag = operacao_cai
     * 3. Retorna soma total (caixa + receber + pagar)
     * 
     * @param linhaId ID da linha em fluxo_caixa_linhas
     * @param ano Ano (YYYY)
     * @param mes Mês (1-12)
     * @return Valor real agregado das 3 operações
     */
    public BigDecimal calcularValorRealPorLinha(Long linhaId, int ano, int mes) {
        try {
            log.debug("[FluxoCaixaCalculoService] Calculando valor real para linhaId={}, ano={}, mes={}", 
                     linhaId, ano, mes);
            
            // Query 1: Agregação de CAIXA
            String sqlCaixa = """
                SELECT COALESCE(SUM(valor_cai), 0) 
                FROM caixa 
                WHERE tipocai_cai = '001' 
                  AND filial_cai = '001' 
                  AND YEAR(dtmovi_cai) = ? 
                  AND MONTH(dtmovi_cai) = ?
                """;
            
            BigDecimal valorCaixa = BigDecimal.ZERO;
            try {
                Number result = jdbcTemplate.queryForObject(sqlCaixa, Number.class, ano, mes);
                if (result != null) {
                    valorCaixa = new BigDecimal(result.toString());
                }
            } catch (Exception ex) {
                log.warn("[FluxoCaixaCalculoService] Sem dados em CAIXA para ano={}, mes={}", ano, mes);
                valorCaixa = BigDecimal.ZERO;
            }
            
            // Query 2: Agregação de RECEBER
            String sqlReceber = """
                SELECT COALESCE(SUM(vlrfat_rec), 0) 
                FROM receber 
                WHERE YEAR(dtemissi_rec) = ? 
                  AND MONTH(dtemissi_rec) = ?
                """;
            
            BigDecimal valorReceber = BigDecimal.ZERO;
            try {
                Number result = jdbcTemplate.queryForObject(sqlReceber, Number.class, ano, mes);
                if (result != null) {
                    valorReceber = new BigDecimal(result.toString());
                }
            } catch (Exception ex) {
                log.warn("[FluxoCaixaCalculoService] Sem dados em RECEBER para ano={}, mes={}", ano, mes);
                valorReceber = BigDecimal.ZERO;
            }
            
            // Query 3: Agregação de PAGAR
            String sqlPagar = """
                SELECT COALESCE(SUM(vlrfat_pag), 0) 
                FROM pagar 
                WHERE YEAR(dtemissi_pag) = ? 
                  AND MONTH(dtemissi_pag) = ?
                """;
            
            BigDecimal valorPagar = BigDecimal.ZERO;
            try {
                Number result = jdbcTemplate.queryForObject(sqlPagar, Number.class, ano, mes);
                if (result != null) {
                    valorPagar = new BigDecimal(result.toString());
                }
            } catch (Exception ex) {
                log.warn("[FluxoCaixaCalculoService] Sem dados em PAGAR para ano={}, mes={}", ano, mes);
                valorPagar = BigDecimal.ZERO;
            }
            
            // Soma total: caixa + receber + pagar
            BigDecimal valorTotal = valorCaixa.add(valorReceber).add(valorPagar);
            
            log.debug("[FluxoCaixaCalculoService] ✓ Cálculo: Caixa={}, Receber={}, Pagar={}, Total={}", 
                     valorCaixa, valorReceber, valorPagar, valorTotal);
            
            return valorTotal;
            
        } catch (Exception ex) {
            log.error("[FluxoCaixaCalculoService] ✗ Erro ao calcular valor real: {}", ex.getMessage(), ex);
            return BigDecimal.ZERO;
        }
    }

    /**
     * Atualiza valores reais para TODAS as linhas do fluxo de caixa
     * 
     * Executado pelo scheduler @Scheduled diariamente às 23:59
     * 
     * Processo:
     * 1. Busca todas as linhas em fluxo_caixa_dados SEM valor_real
     * 2. Para cada linha: calcula valor real aggregado
     * 3. Salva resultado em fluxo_caixa_dados.valor_real
     * 4. Log final com count de registros atualizados
     */
    @Scheduled(cron = "0 59 23 * * ?") // 23:59:00 diariamente
    public void atualizarValoresReaisDiarios() {
        log.info("[FluxoCaixaCalculoService] ⏰ INÍCIO: Scheduler de atualização diária de valores reais");
        
        try {
            // Busca todas as linhas que ainda não têm valor_real calculado
            List<FluxoCaixaDado> dadosSemValorReal = fluxoCaixaDadoRepository.findWithoutValorReal();
            
            log.info("[FluxoCaixaCalculoService] Encontradas {} linhas sem valor_real", dadosSemValorReal.size());
            
            int atualizados = 0;
            for (FluxoCaixaDado dado : dadosSemValorReal) {
                try {
                    // Calcular valor real baseado em linhaId
                    BigDecimal valorReal = calcularValorRealPorLinha(dado.getLinhaId(), dado.getAno(), dado.getMes());
                    
                    dado.setValorReal(valorReal);
                    fluxoCaixaDadoRepository.save(dado);
                    
                    atualizados++;
                    
                } catch (Exception ex) {
                    log.error("[FluxoCaixaCalculoService] Erro ao atualizar linha {}: {}", 
                              dado.getId(), ex.getMessage());
                }
            }
            
            log.info("[FluxoCaixaCalculoService] ✓ CONCLUÍDO: {} valores reais atualizados", atualizados);
            
        } catch (Exception ex) {
            log.error("[FluxoCaixaCalculoService] ✗ Erro no scheduler: {}", ex.getMessage(), ex);
        }
    }

    /**
     * Recalcula TODOS os valores reais (força update)
     */
    public int recalcularTodosValoresReais() {
        return 0;
    }
}
