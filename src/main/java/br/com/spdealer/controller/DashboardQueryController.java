package br.com.spdealer.controller;

import br.com.spdealer.model.DashboardQuery;
import br.com.spdealer.repository.DashboardQueryRepository;
import br.com.spdealer.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/dashboard-queries")
// CORS configurado globalmente em CorsConfig.java
public class DashboardQueryController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardQueryController.class);

    @Autowired
    private DashboardQueryRepository queryRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DashboardService dashboardService;

    /**
     * Executa uma DashboardQuery por ID.
     * Body (opcional): { "parameters": { ... } }
     */
    @PostMapping("/{id}/execute")
    public ResponseEntity<?> executeQuery(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session, HttpServletRequest request) {
        try {
            logger.info("📨 [DashboardQueryController] Requisição recebida para Query ID: {}", id);
            
            Optional<DashboardQuery> qOpt = queryRepository.findById(id);
            if (qOpt.isEmpty()) {
                logger.warn("⚠️ [DashboardQueryController] Query ID: {} não encontrada no banco", id);
                return ResponseEntity.status(404).body(Map.of("error", "Query não encontrada"));
            }

            DashboardQuery query = qOpt.get();
            String sql = query.getSqlQuery();
            logger.info("✅ [DashboardQueryController] Query ID: {} carregada com nome: {}", id, query.getName());

            if (!dashboardService.isSelectQuerySafe(sql)) {
                logger.warn("⚠️ [DashboardQueryController] Query ID: {} falhou na validação de segurança", id);
                return ResponseEntity.status(403).body(Map.of("error", "Query não permitida"));
            }

            // Parâmetros (pode ser Map com parâmetros nomeados ou posições)
            Object paramsObj = (body != null) ? body.get("parameters") : null;
            // Se parâmetro vazio for enviado, tratar como null para usar fallback da sessão
            if (paramsObj instanceof Map && ((Map<?,?>) paramsObj).isEmpty()) {
                paramsObj = null;
            }
            // Se nenhum parâmetro foi enviado pelo frontend, tentar recuperar filial da sessão
            if (paramsObj == null) {
                // 1) tentar ler parâmetro 'filial' nos query params (ex: ?filial=1)
                try {
                    String filialParam = (request != null) ? request.getParameter("filial") : null;
                    if (filialParam != null && !filialParam.isBlank()) {
                        java.util.Map<String, Object> defaultParams = new java.util.LinkedHashMap<>();
                        defaultParams.put("filial", filialParam);
                        paramsObj = defaultParams;
                        logger.info("🔵 [DashboardQueryController] Usando filial do query param como parâmetro: {}", filialParam);
                    }
                } catch (Exception e) {
                    logger.warn("⚠️ [DashboardQueryController] Falha ao ler filial do query param: {}", e.getMessage());
                }

                // 2) se não houver query param, tentar usar sessão
                if (paramsObj == null) {
                    try {
                        Object filAttr = (session != null) ? session.getAttribute("id_fil") : null;
                        if (filAttr != null) {
                            java.util.Map<String, Object> defaultParams = new java.util.LinkedHashMap<>();
                            defaultParams.put("filial", String.valueOf(filAttr));
                            paramsObj = defaultParams;
                            logger.info("🔵 [DashboardQueryController] Usando filial da sessão como parâmetro: {}", filAttr);
                        }
                    } catch (Exception e) {
                        logger.warn("⚠️ [DashboardQueryController] Falha ao ler filial da sessão: {}", e.getMessage());
                    }
                }
            }
            Object result;
            try {
                logger.info("🔵 [DashboardQueryController] Executando query ID: {} | SQL length: {}", id, sql.length());
                logger.debug("🔵 [DashboardQueryController] SQL Query: {}", sql);

                // Se o serviço de dashboard oferece execução com parâmetros, use-o para evitar duplicar lógica
                List<Map<String, Object>> rows;
                if (paramsObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> paramsMapRaw = (Map<String, Object>) paramsObj;
                    // Coerce to LinkedHashMap to preserve insertion order and log values for diagnostics
                    java.util.Map<String, Object> paramsMap = new java.util.LinkedHashMap<>();
                    paramsMap.putAll(paramsMapRaw);
                    logger.info("🔍 [DashboardQueryController] Parâmetros recebidos: {}", paramsMap);
                    rows = dashboardService.executeListQuery(sql, paramsMap);
                } else {
                    logger.info("🔍 [DashboardQueryController] Nenhum parâmetro no body. Chamando executeListQuery sem params.");
                    rows = dashboardService.executeListQuery(sql, null);
                }

                logger.info("🟢 [DashboardQueryController] Query ID: {} executada com sucesso | {} linhas retornadas", id, rows.size());

                // Derivar columns automaticamente a partir das chaves da primeira linha
                List<Map<String, Object>> columns = java.util.Collections.emptyList();
                if (rows != null && !rows.isEmpty()) {
                    Map<String, Object> first = rows.get(0);
                    java.util.List<Map<String, Object>> cols = new java.util.ArrayList<>();
                    for (String key : first.keySet()) {
                        Map<String, Object> colDef = new java.util.HashMap<>();
                        colDef.put("field", key);
                        // headerName default: transforma underscore/camelcase em título simples
                        String header = key.replaceAll("_", " ");
                        header = header.substring(0, 1).toUpperCase() + header.substring(1);
                        colDef.put("headerName", header);

                        // Heurística de tipo baseada no nome do campo (prioritária)
                        String lname = key.toLowerCase();
                        boolean nameIndicatesCurrency = lname.contains("saldo") || lname.contains("valor") || lname.contains("vlr") || lname.contains("total") || lname.contains("amount");
                        if (lname.contains("id") && lname.length() <= 5) {
                            // ids curtos podem ser tratados como strings (fallback)
                        }

                        if (nameIndicatesCurrency) {
                            colDef.put("type", "number");
                            colDef.put("valueFormatter", "currency");
                        } else {
                            // se o nome não indicar, inferir a partir do sample
                            Object sample = first.get(key);
                            if (sample instanceof Number) {
                                colDef.put("type", "number");
                            } else if (sample instanceof Boolean) {
                                colDef.put("type", "boolean");
                            } else if (sample instanceof java.util.Date) {
                                colDef.put("type", "date");
                            } else if (sample instanceof String) {
                                String s = (String) sample;
                                if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
                                    colDef.put("type", "date");
                                }
                            }
                        }

                        cols.add(colDef);
                    }
                    columns = cols;
                }

                result = Map.of("rows", rows, "columns", columns);
            } catch (DataAccessException e) {
                // Spring JdbcTemplate já fez rollback automático aqui
                logger.error("🔴 [DashboardQueryController] ERRO BD ao executar Query ID: {} | Exception: {} | Message: {}", 
                    id, e.getClass().getSimpleName(), e.getMessage());
                logger.error("🔴 [DashboardQueryController] Stack trace:", e);
                return ResponseEntity.status(500).body(Map.of("error", "Falha ao executar SQL (erro de banco)", "details", e.getMessage()));
            } catch (Exception e) {
                logger.error("🔴 [DashboardQueryController] ERRO geral ao executar Query ID: {} | Exception: {} | Message: {}", 
                    id, e.getClass().getSimpleName(), e.getMessage());
                logger.error("🔴 [DashboardQueryController] Stack trace:", e);
                return ResponseEntity.status(500).body(Map.of("error", "Falha ao executar SQL", "details", e.getMessage()));
            }

            return ResponseEntity.ok(result);
        } catch (DataAccessException ex) {
            logger.error("🔴 [DashboardQueryController] ERRO BD crítico: {}", ex.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Erro de banco de dados", "message", ex.getMessage()));
        } catch (Exception ex) {
            logger.error("🔴 [DashboardQueryController] ERRO interno crítico: {}", ex.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno", "message", ex.getMessage()));
        }
    }

    /**
     * Executa uma DashboardQuery mapeada por chave/string (ex: "kpiCaixa").
     * Utiliza o mapeamento localizado em DashboardService.getSqlForQueryId
     */
    @PostMapping("/key/{key}/execute")
    public ResponseEntity<?> executeQueryByKey(@PathVariable String key, @RequestBody(required = false) Map<String, Object> body) {
        try {
            // tenta obter SQL mapeado para a chave
            String sql = dashboardService.getSqlForQueryId(key);
            if (sql == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Query key não mapeada"));
            }

            if (!dashboardService.isSelectQuerySafe(sql)) {
                return ResponseEntity.status(403).body(Map.of("error", "Query não permitida"));
            }

            List<Map<String, Object>> rows;
            try {
                rows = jdbcTemplate.queryForList(sql);
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("error", "Falha ao executar SQL mapeado", "details", e.getMessage()));
            }

            // Derivar columns automaticamente a partir das chaves da primeira linha
            List<Map<String, Object>> columns = java.util.Collections.emptyList();
            if (rows != null && !rows.isEmpty()) {
                Map<String, Object> first = rows.get(0);
                java.util.List<Map<String, Object>> cols = new java.util.ArrayList<>();
                for (String keyName : first.keySet()) {
                    Map<String, Object> colDef = new java.util.HashMap<>();
                    colDef.put("field", keyName);
                    String header = keyName.replaceAll("_", " ");
                    header = header.substring(0, 1).toUpperCase() + header.substring(1);
                    colDef.put("headerName", header);
                    // heurística simples de tipo
                    Object sample = first.get(keyName);
                    if (sample instanceof Number) {
                        colDef.put("type", "number");
                    } else if (sample instanceof Boolean) {
                        colDef.put("type", "boolean");
                    } else if (sample instanceof java.util.Date) {
                        colDef.put("type", "date");
                    }
                    cols.add(colDef);
                }
                columns = cols;
            }

            Map<String, Object> result = Map.of("rows", rows, "columns", columns);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno", "message", ex.getMessage()));
        }
    }
}
