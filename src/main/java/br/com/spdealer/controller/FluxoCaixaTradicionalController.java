package br.com.spdealer.controller;

import br.com.spdealer.service.FluxoCaixaTradicionalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpSession;
import java.util.*;

/**
 * Controller: Fluxo de Caixa Tradicional (Simples e Prático)
 * 
 * Endpoints:
 * - GET /api/v1/fluxo-caixa-tradicional/diario       → Fluxo diário (30 dias)
 * - GET /api/v1/fluxo-caixa-tradicional/semanal      → Análise semanal
 * - GET /api/v1/fluxo-caixa-tradicional/periodos     → Resumo (+30, +60, +90)
 * - GET /api/v1/fluxo-caixa-tradicional/melhores     → Top 5 melhores dias
 * - GET /api/v1/fluxo-caixa-tradicional/piores       → Top 5 piores dias
 * - GET /api/v1/fluxo-caixa-tradicional/resumo       → Resumo completo
 * - GET /api/v1/fluxo-caixa-tradicional/kpi-saude    → KPI para dashboard
 */
@RestController
@RequestMapping("/api/v1/fluxo-caixa-tradicional")
public class FluxoCaixaTradicionalController {

    private static final Logger logger = LoggerFactory.getLogger(FluxoCaixaTradicionalController.class);

    @Autowired
    private FluxoCaixaTradicionalService fluxoCaixaService;

    /**
     * GET /api/v1/fluxo-caixa-tradicional/diario
     * Retorna fluxo de caixa diário (próximos 30 dias)
     */
    @GetMapping("/diario")
    public ResponseEntity<?> obterFluxoDiario(HttpSession session) {
        try {
            Integer filial = (Integer) session.getAttribute("id_fil");
            if (filial == null) filial = 1;

            List<Map<String, Object>> dados = fluxoCaixaService.obterFluxoDiario30(filial);

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("data", dados);
                put("count", dados.size());
            }});
        } catch (Exception e) {
            logger.error("[FluxoCaixaController] Erro ao obter fluxo diário", e);
            return ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/fluxo-caixa-tradicional/semanal
     * Retorna análise semanal com saúde financeira
     */
    @GetMapping("/semanal")
    public ResponseEntity<?> obterAnaliseSSemanal(HttpSession session) {
        try {
            List<Map<String, Object>> dados = fluxoCaixaService.obterAnaliseeSemanal();

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("data", dados);
                put("count", dados.size());
            }});
        } catch (Exception e) {
            logger.error("[FluxoCaixaController] Erro ao obter análise semanal", e);
            return ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/fluxo-caixa-tradicional/periodos
     * Retorna resumo dos períodos: +30, +60, +90 dias
     */
    @GetMapping("/periodos")
    public ResponseEntity<?> obterResumoPeriodos(HttpSession session) {
        try {
            List<Map<String, Object>> dados = fluxoCaixaService.obterResumoPeriodos();

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("data", dados);
                put("count", dados.size());
            }});
        } catch (Exception e) {
            logger.error("[FluxoCaixaController] Erro ao obter resumo de períodos", e);
            return ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/fluxo-caixa-tradicional/melhores
     * Retorna TOP 5 melhores dias para agendar pagamentos
     */
    @GetMapping("/melhores")
    public ResponseEntity<?> obterMelhoresDias(HttpSession session) {
        try {
            List<Map<String, Object>> dados = fluxoCaixaService.obterMelhoresDias();

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("data", dados);
                put("count", dados.size());
                put("titulo", "Top 5 Melhores Dias para Pagamentos");
                put("cor", "#28a745");
            }});
        } catch (Exception e) {
            logger.error("[FluxoCaixaController] Erro ao obter melhores dias", e);
            return ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/fluxo-caixa-tradicional/piores
     * Retorna TOP 5 piores dias para agendar pagamentos
     */
    @GetMapping("/piores")
    public ResponseEntity<?> obterPioresDias(HttpSession session) {
        try {
            List<Map<String, Object>> dados = fluxoCaixaService.obterPioresDias();

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("data", dados);
                put("count", dados.size());
                put("titulo", "Top 5 Piores Dias para Pagamentos");
                put("cor", "#dc3545");
            }});
        } catch (Exception e) {
            logger.error("[FluxoCaixaController] Erro ao obter piores dias", e);
            return ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/fluxo-caixa-tradicional/resumo
     * Retorna resumo completo: períodos + semanal + melhores/piores dias
     */
    @GetMapping("/resumo")
    public ResponseEntity<?> obterResumoGeral(HttpSession session) {
        try {
            Map<String, Object> resumo = fluxoCaixaService.obterResumogeral();

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("data", resumo);
            }});
        } catch (Exception e) {
            logger.error("[FluxoCaixaController] Erro ao obter resumo geral", e);
            return ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * GET /api/v1/fluxo-caixa-tradicional/kpi-saude
     * Retorna KPI de saúde financeira para dashboard
     */
    @GetMapping("/kpi-saude")
    public ResponseEntity<?> obterKPISaude(HttpSession session) {
        try {
            Map<String, Object> kpi = fluxoCaixaService.obterKPISaude();

            return ResponseEntity.ok(new HashMap<String, Object>() {{
                put("success", true);
                put("data", kpi);
            }});
        } catch (Exception e) {
            logger.error("[FluxoCaixaController] Erro ao obter KPI de saúde", e);
            return ResponseEntity.status(500).body(new HashMap<String, Object>() {{
                put("success", false);
                put("error", e.getMessage());
            }});
        }
    }

    /**
     * Health check do controller
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(new HashMap<String, Object>() {{
            put("status", "OK");
            put("service", "FluxoCaixaTradicional");
        }});
    }
}
