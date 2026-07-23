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
 * Serviço de Fluxo de Caixa Tradicional (Simples e Prático)
 * 
 * Fornece análise de:
 * - Fluxo diário (DATA | A RECEBER | A PAGAR | SALDO)
 * - Análise semanal (saúde financeira)
 * - Resumo por períodos (+30, +60, +90 dias)
 * - Recomendações de melhor/pior dia para pagamentos
 */
@Service
public class FluxoCaixaTradicionalService {

    private static final Logger logger = LoggerFactory.getLogger(FluxoCaixaTradicionalService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Retorna fluxo de caixa diário (30 dias)
     * Estrutura: DATA | A RECEBER | A PAGAR | SALDO | STATUS
     */
    public List<Map<String, Object>> obterFluxoDiario30(Integer filial) {
        try {
            if (filial == null) filial = 1;
            
            String sql = "SELECT * FROM vw_fluxo_caixa_diario_30d";
            
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            logger.info("[FluxoCaixa] Fluxo diário 30 dias: {} registros", result.size());
            
            return result;
        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao obter fluxo diário", e);
            return new ArrayList<>();
        }
    }

    /**
     * Retorna análise semanal (saúde financeira por semana)
     * Inclui status e recomendações
     */
    public List<Map<String, Object>> obterAnaliseeSemanal() {
        try {
            String sql = "SELECT * FROM vw_fluxo_caixa_semanal_30d";
            
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            logger.info("[FluxoCaixa] Análise semanal: {} semanas", result.size());
            
            return result;
        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao obter análise semanal", e);
            return new ArrayList<>();
        }
    }

    /**
     * Retorna resumo dos períodos: +30, +60, +90 dias
     * Com status de saúde e observações
     */
    public List<Map<String, Object>> obterResumoPeriodos() {
        try {
            String sql = "SELECT * FROM vw_fluxo_caixa_resumo_periodos ORDER BY periodo";
            
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            logger.info("[FluxoCaixa] Resumo períodos: {} períodos analisados", result.size());
            
            return result;
        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao obter resumo de períodos", e);
            return new ArrayList<>();
        }
    }

    /**
     * Retorna TOP 5 melhores dias para agendar pagamentos (próximos 30 dias)
     */
    public List<Map<String, Object>> obterMelhoresDias() {
        try {
            String sql = "SELECT * FROM vw_fluxo_dias_recomendacao " +
                        "WHERE ranking_melhor_dia IS NOT NULL AND ranking_melhor_dia <= 5 " +
                        "ORDER BY ranking_melhor_dia ASC LIMIT 5";
            
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            logger.info("[FluxoCaixa] Melhores dias: {} dias encontrados", result.size());
            
            return result;
        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao obter melhores dias", e);
            return new ArrayList<>();
        }
    }

    /**
     * Retorna TOP 5 piores dias para agendar pagamentos (próximos 30 dias)
     */
    public List<Map<String, Object>> obterPioresDias() {
        try {
            String sql = "SELECT * FROM vw_fluxo_dias_recomendacao " +
                        "WHERE ranking_pior_dia IS NOT NULL AND ranking_pior_dia <= 5 " +
                        "ORDER BY ranking_pior_dia ASC LIMIT 5";
            
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            logger.info("[FluxoCaixa] Piores dias: {} dias encontrados", result.size());
            
            return result;
        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao obter piores dias", e);
            return new ArrayList<>();
        }
    }

    /**
     * Retorna resumo consolidado: saúde atual + recomendações
     */
    public Map<String, Object> obterResumogeral() {
        try {
            Map<String, Object> resumo = new HashMap<>();

            // 1. Resumo dos períodos
            resumo.put("periodos", obterResumoPeriodos());

            // 2. Análise semanal
            resumo.put("semanas", obterAnaliseeSemanal());

            // 3. Melhores dias
            resumo.put("melhoresDias", obterMelhoresDias());

            // 4. Piores dias
            resumo.put("pioresDias", obterPioresDias());

            // 5. Status geral
            Map<String, Object> statusGeral = new HashMap<>();
            
            String sqlStatus = "SELECT " +
                "CASE " +
                "  WHEN SUM(CASE WHEN tipo='PAGAR' THEN valor ELSE 0 END) > " +
                "       SUM(CASE WHEN tipo='RECEBER' THEN valor ELSE 0 END) " +
                "  THEN 'CRÍTICO' " +
                "  WHEN SUM(CASE WHEN tipo='PAGAR' THEN valor ELSE 0 END) * 0.8 >= " +
                "       SUM(CASE WHEN tipo='RECEBER' THEN valor ELSE 0 END) " +
                "  THEN 'ATENÇÃO' " +
                "  ELSE 'NORMAL' " +
                "END as status " +
                "FROM (SELECT vlrsal_rec as valor, 'RECEBER' as tipo FROM receber WHERE filial_rec='001' AND (status_rec='' OR status_rec IS NULL) AND vlrsal_rec > 0 AND dtvenci_rec >= CURDATE() AND dtvenci_rec <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) " +
                "UNION ALL " +
                "SELECT vlrsal_pag as valor, 'PAGAR' as tipo FROM pagar WHERE filial_pag='001' AND (status_pag='' OR status_pag IS NULL) AND vlrsal_pag > 0 AND dtvenci_pag >= CURDATE() AND dtvenci_pag <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) dados";
            
            List<Map<String, Object>> statusResult = jdbcTemplate.queryForList(sqlStatus);
            if (!statusResult.isEmpty()) {
                statusGeral.put("status_30dias", statusResult.get(0).get("status"));
            }

            resumo.put("status_geral", statusGeral);

            logger.info("[FluxoCaixa] Resumo geral gerado com sucesso");

            return resumo;
        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao gerar resumo geral", e);
            return new HashMap<>();
        }
    }

    /**
     * Retorna indicador de saúde financeira para dashboard KPI
     */
    public Map<String, Object> obterKPISaude() {
        try {
            Map<String, Object> kpi = new HashMap<>();

            String sql = "SELECT " +
                "SUM(CASE WHEN tipo='RECEBER' THEN valor ELSE 0 END) as total_receber, " +
                "SUM(CASE WHEN tipo='PAGAR' THEN valor ELSE 0 END) as total_pagar, " +
                "SUM(CASE WHEN tipo='RECEBER' THEN valor ELSE 0 END) - " +
                "SUM(CASE WHEN tipo='PAGAR' THEN valor ELSE 0 END) as saldo_total " +
                "FROM (SELECT vlrsal_rec as valor, 'RECEBER' as tipo FROM receber WHERE filial_rec='001' AND (status_rec='' OR status_rec IS NULL) AND vlrsal_rec > 0 AND dtvenci_rec >= CURDATE() AND dtvenci_rec <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) " +
                "UNION ALL " +
                "SELECT vlrsal_pag as valor, 'PAGAR' as tipo FROM pagar WHERE filial_pag='001' AND (status_pag='' OR status_pag IS NULL) AND vlrsal_pag > 0 AND dtvenci_pag >= CURDATE() AND dtvenci_pag <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) dados";

            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            if (!result.isEmpty()) {
                Map<String, Object> dados = result.get(0);
                
                BigDecimal totalReceber = (BigDecimal) dados.get("total_receber");
                BigDecimal totalPagar = (BigDecimal) dados.get("total_pagar");
                BigDecimal saldoTotal = (BigDecimal) dados.get("saldo_total");

                kpi.put("total_receber", totalReceber != null ? totalReceber.doubleValue() : 0.0);
                kpi.put("total_pagar", totalPagar != null ? totalPagar.doubleValue() : 0.0);
                kpi.put("saldo_total", saldoTotal != null ? saldoTotal.doubleValue() : 0.0);
                
                // Saúde
                if (totalPagar.compareTo(totalReceber) > 0) {
                    kpi.put("saude", "CRÍTICO");
                    kpi.put("cor", "#dc3545");
                } else if (totalPagar.compareTo(totalReceber.multiply(new BigDecimal("0.8"))) >= 0) {
                    kpi.put("saude", "ATENÇÃO");
                    kpi.put("cor", "#ffc107");
                } else {
                    kpi.put("saude", "NORMAL");
                    kpi.put("cor", "#28a745");
                }
            }

            logger.info("[FluxoCaixa] KPI de saúde gerado");

            return kpi;
        } catch (Exception e) {
            logger.error("[FluxoCaixa] Erro ao gerar KPI de saúde", e);
            return new HashMap<>();
        }
    }
}
