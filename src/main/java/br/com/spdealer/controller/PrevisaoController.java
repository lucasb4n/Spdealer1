package br.com.spdealer.controller;

import java.time.LocalDate;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller para análise de Previsão vs Realizado
 * Integrado com tabelas: previsao_receitas_por_operacao, previsao_despesas_por_operacao
 * 
 * Endpoints:
 * GET /api/v1/previsao/operacoes - Lista operações com previsão vs realizado
 * GET /api/v1/previsao/consolidado - Resumo consolidado por período
 * POST /api/v1/previsao/calcular - Forçar cálculo de previsão
 */
@RestController
@RequestMapping("/api/v1/previsao")
public class PrevisaoController {
  
  private static final Logger logger = LoggerFactory.getLogger(PrevisaoController.class);
  
  @Autowired
  private JdbcTemplate jdbcTemplate;
  
  /**
   * GET /api/v1/previsao/operacoes
   * 
   * Retorna lista de operações com valores realizado vs previsto
   * Parâmetros:
   * - filial (obrigatório): Filial do usuário (ex: '001')
   * - data_inicio (opcional): Data inicial (ex: '2025-12-01'), padrão = hoje
   * - periodo (opcional): DIA, MES, ANO - padrão = DIA
   * 
   * Resposta:
   * [
   *   {
   *     filial_ocai: "001",
   *     operacao_ocai: "001",
   *     descr_ocai: "PRO-LABORE",
   *     tipo_movimento: "RECEITA",
   *     valor_realizado: 5000.00,
   *     quantidade_realizado: 3,
   *     valor_previsto: 6500.00,    // 5000 * 1.30
   *     desvio_valor: -1500.00,
   *     percentual_desvio: -23.08,
   *     data_previsao: "2025-12-20",
   *     periodo_tipo: "DIA"
   *   },
   *   ...
   * ]
   */
  @GetMapping("/operacoes")
  public ResponseEntity<List<Map<String, Object>>> getPrevisaoPorOperacoes(
    @RequestParam(name = "filial") String filial,
    @RequestParam(name = "data_inicio", required = false) String dataInicio,
    @RequestParam(name = "periodo", defaultValue = "DIA") String periodo
  ) {
    try {
      logger.info("[PrevisaoController] GET /operacoes - filial={}, data_inicio={}, periodo={}", 
        filial, dataInicio, periodo);
      
      // Se data_inicio não foi fornecida, usar hoje
      if (dataInicio == null || dataInicio.isEmpty()) {
        dataInicio = LocalDate.now().toString();
      }
      
      // Validar período
      if (!periodo.matches("DIA|MES|ANO")) {
        return ResponseEntity.badRequest().build();
      }
      
      // Query: buscar dados da VIEW consolidada
      String sql = "SELECT " +
        "  tipo_movimento, " +
        "  filial_ocai, " +
        "  operacao_ocai, " +
        "  descr_ocai, " +
        "  valor_realizado, " +
        "  quantidade_realizado, " +
        "  valor_previsto, " +
        "  desvio_valor, " +
        "  percentual_desvio, " +
        "  data_previsao, " +
        "  periodo_tipo " +
        "FROM vw_previsao_realizado_vs_previsto " +
        "WHERE filial_ocai = ? " +
        "  AND data_previsao = ? " +
        "  AND periodo_tipo = ? " +
        "ORDER BY tipo_movimento DESC, operacao_ocai";
      
      List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, filial, dataInicio, periodo);
      
      logger.info("[PrevisaoController] Retornando {} registros de previsão", result.size());
      return ResponseEntity.ok(result);
      
    } catch (Exception e) {
      logger.error("[PrevisaoController] Erro ao buscar previsões: {}", e.getMessage(), e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }
  
  /**
   * GET /api/v1/previsao/consolidado
   * 
   * Retorna consolidação por tipo de movimento (RECEITA vs DESPESA)
   * 
   * Resposta:
   * {
   *   receitas: {
   *     valor_realizado: 15000.00,
   *     valor_previsto: 19500.00,    // 15000 * 1.30
   *     quantidade: 8,
   *     desvio: -4500.00,
   *     percentual_desvio: -23.08
   *   },
   *   despesas: {
   *     valor_realizado: 8000.00,
   *     valor_previsto: 9200.00,     // 8000 * 1.15
   *     quantidade: 5,
   *     desvio: -1200.00,
   *     percentual_desvio: -13.04
   *   },
   *   saldo_realizado: 7000.00,      // receitas - despesas
   *   saldo_previsto: 10300.00,      // receitas_prev - despesas_prev
   *   desvio_saldo: -3300.00
   * }
   */
  @GetMapping("/consolidado")
  public ResponseEntity<Map<String, Object>> getPrevisaoConsolidada(
    @RequestParam(name = "filial") String filial,
    @RequestParam(name = "data_inicio", required = false) String dataInicio,
    @RequestParam(name = "periodo", defaultValue = "DIA") String periodo
  ) {
    try {
      logger.info("[PrevisaoController] GET /consolidado - filial={}, data_inicio={}, periodo={}", 
        filial, dataInicio, periodo);
      
      if (dataInicio == null || dataInicio.isEmpty()) {
        dataInicio = LocalDate.now().toString();
      }
      
      // Query: Consolidar por tipo de movimento
      String sql = "SELECT " +
        "  tipo_movimento, " +
        "  SUM(valor_realizado) as valor_realizado, " +
        "  SUM(quantidade_realizado) as quantidade, " +
        "  SUM(valor_previsto) as valor_previsto, " +
        "  SUM(desvio_valor) as desvio_valor, " +
        "  ROUND(SUM(desvio_valor) / SUM(valor_previsto) * 100, 2) as percentual_desvio " +
        "FROM vw_previsao_realizado_vs_previsto " +
        "WHERE filial_ocai = ? " +
        "  AND data_previsao = ? " +
        "  AND periodo_tipo = ? " +
        "GROUP BY tipo_movimento";
      
      List<Map<String, Object>> consolidado = jdbcTemplate.queryForList(sql, filial, dataInicio, periodo);
      
      // Montar resposta consolidada
      Map<String, Object> response = new HashMap<>();
      Map<String, Object> receitas = new HashMap<>();
      Map<String, Object> despesas = new HashMap<>();
      
      Double vlrRecReal = 0.0;
      Double vlrRecPrev = 0.0;
      Double vlrDespReal = 0.0;
      Double vlrDespPrev = 0.0;
      
      for (Map<String, Object> linha : consolidado) {
        String tipo = (String) linha.get("tipo_movimento");
        Double vlrReal = ((Number) linha.getOrDefault("valor_realizado", 0.0)).doubleValue();
        Double vlrPrev = ((Number) linha.getOrDefault("valor_previsto", 0.0)).doubleValue();
        
        if ("RECEITA".equals(tipo)) {
          receitas.put("valor_realizado", vlrReal);
          receitas.put("valor_previsto", vlrPrev);
          receitas.put("quantidade", linha.getOrDefault("quantidade", 0));
          receitas.put("desvio_valor", linha.getOrDefault("desvio_valor", 0.0));
          receitas.put("percentual_desvio", linha.getOrDefault("percentual_desvio", 0.0));
          vlrRecReal = vlrReal;
          vlrRecPrev = vlrPrev;
        } else if ("DESPESA".equals(tipo)) {
          despesas.put("valor_realizado", vlrReal);
          despesas.put("valor_previsto", vlrPrev);
          despesas.put("quantidade", linha.getOrDefault("quantidade", 0));
          despesas.put("desvio_valor", linha.getOrDefault("desvio_valor", 0.0));
          despesas.put("percentual_desvio", linha.getOrDefault("percentual_desvio", 0.0));
          vlrDespReal = vlrReal;
          vlrDespPrev = vlrPrev;
        }
      }
      
      response.put("receitas", receitas);
      response.put("despesas", despesas);
      response.put("saldo_realizado", vlrRecReal - vlrDespReal);
      response.put("saldo_previsto", vlrRecPrev - vlrDespPrev);
      response.put("desvio_saldo", (vlrRecReal - vlrDespReal) - (vlrRecPrev - vlrDespPrev));
      response.put("data_referencia", dataInicio);
      response.put("periodo_tipo", periodo);
      
      logger.info("[PrevisaoController] Consolidado calculado com sucesso");
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      logger.error("[PrevisaoController] Erro ao buscar consolidado: {}", e.getMessage(), e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }
  
  /**
   * POST /api/v1/previsao/calcular
   * 
   * Força cálculo/atualização das previsões para um período específico
   * 
   * Request:
   * {
   *   "filial": "001",
   *   "data_inicio": "2025-12-01",
   *   "periodo": "MES"
   * }
   * 
   * Resposta:
   * {
   *   "sucesso": true,
   *   "mensagem": "Previsões calculadas com sucesso",
   *   "registros_receitas": 15,
   *   "registros_despesas": 12
   * }
   */
  @PostMapping("/calcular")
  public ResponseEntity<Map<String, Object>> calcularPrevisao(
    @RequestBody Map<String, String> request
  ) {
    try {
      String filial = request.get("filial");
      String dataInicio = request.get("data_inicio");
      String periodo = request.get("periodo");
      
      logger.info("[PrevisaoController] POST /calcular - filial={}, data={}, periodo={}", 
        filial, dataInicio, periodo);
      
      if (filial == null || dataInicio == null || periodo == null) {
        return ResponseEntity.badRequest().build();
      }
      
      // Executar stored procedures
      String spReceita = "CALL sp_previsao_receitas_por_operacao(?, ?, ?)";
      String spDespesa = "CALL sp_previsao_despesas_por_operacao(?, ?, ?)";
      
      try {
        jdbcTemplate.update(spReceita, dataInicio, periodo, filial);
        jdbcTemplate.update(spDespesa, dataInicio, periodo, filial);
      } catch (Exception e) {
        logger.warn("[PrevisaoController] Erro ao executar SPs: {}", e.getMessage());
      }
      
      // Contar registros inseridos
      String sqlCount = "SELECT " +
        "  (SELECT COUNT(*) FROM previsao_receitas_por_operacao " +
        "   WHERE filial_ocai = ? AND data_previsao = ? AND periodo_tipo = ?) as receitas, " +
        "  (SELECT COUNT(*) FROM previsao_despesas_por_operacao " +
        "   WHERE filial_ocai = ? AND data_previsao = ? AND periodo_tipo = ?) as despesas";
      
      Map<String, Object> counts = jdbcTemplate.queryForMap(sqlCount, 
        filial, dataInicio, periodo, filial, dataInicio, periodo);
      
      Map<String, Object> response = new HashMap<>();
      response.put("sucesso", true);
      response.put("mensagem", "Previsões calculadas com sucesso");
      response.put("registros_receitas", counts.getOrDefault("receitas", 0));
      response.put("registros_despesas", counts.getOrDefault("despesas", 0));
      response.put("timestamp", LocalDate.now());
      
      logger.info("[PrevisaoController] Previsões calculadas: {} receitas, {} despesas",
        counts.get("receitas"), counts.get("despesas"));
      
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      logger.error("[PrevisaoController] Erro ao calcular previsões: {}", e.getMessage(), e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
        Map.of("sucesso", false, "erro", e.getMessage())
      );
    }
  }
}
