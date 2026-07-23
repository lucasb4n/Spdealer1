
package br.com.spdealer.service;

import br.com.spdealer.model.Dashboard;
import br.com.spdealer.model.DashboardLayout;
import br.com.spdealer.model.DashboardWidget;
import br.com.spdealer.repository.DashboardLayoutRepository;
import br.com.spdealer.repository.DashboardRepository;
import br.com.spdealer.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Collections;
import java.util.Optional;
import java.time.LocalDateTime;

@Service
public class DashboardService {
    
    @Autowired
    private DashboardRepository dashboardRepository;
    /**
     * Salva novo dashboard na estrutura das 5 tabelas
     */
    public Map<String, Object> saveDashboard(Long userId, String title, String description, Map<String, Object> themeConfig, Map<String, Object> canvasConfig) {
        // 1. Inserir dashboard principal
        String insertDashboardSql = "INSERT INTO dashboards (user_id, name, description, theme_config, canvas_config, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())";
        jdbcTemplate.update(insertDashboardSql, userId, title, description,
            themeConfig != null ? themeConfig.toString() : "{}",
            canvasConfig != null ? canvasConfig.toString() : "{}"
        );
        // 2. Buscar o dashboard recém-criado
        String selectSql = "SELECT id, name, description, theme_config, canvas_config, is_active FROM dashboards WHERE user_id = ? ORDER BY created_at DESC LIMIT 1";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(selectSql, userId);
        if (rows.isEmpty()) {
            throw new RuntimeException("Falha ao criar dashboard");
        }
        Map<String, Object> dashboard = rows.get(0);
        // 3. Retornar dados básicos
        Map<String, Object> result = new HashMap<>();
        result.put("id", dashboard.get("id"));
        result.put("title", dashboard.get("name"));
        result.put("description", dashboard.get("description"));
        result.put("theme_config", dashboard.get("theme_config"));
        result.put("canvas_config", dashboard.get("canvas_config"));
        result.put("is_active", dashboard.get("is_active"));
        return result;
    }
    /**
     * Cria um dashboard vazio para o usuário (fallback)
     */
    public Map<String, Object> createEmptyDashboard(Long userId) {
        Map<String, Object> empty = new HashMap<>();
        empty.put("id", 0L);
        empty.put("title", "Dashboard vazio");
        empty.put("description", "Nenhum dashboard encontrado para o usuário");
        empty.put("theme_config", Collections.emptyMap());
        empty.put("canvas_config", Collections.emptyMap());
        empty.put("widgets", Collections.emptyList());
        empty.put("is_active", false);
        return empty;
    }

    /**
     * Valida se a query SQL é segura (apenas SELECT permitido)
     */
    public boolean isSelectQuerySafe(String sqlQuery) {
        if (sqlQuery == null) return false;
        String upper = sqlQuery.trim().toUpperCase();
        // Permitir WITH (CTEs) e SELECT como início de query
        if (!upper.startsWith("WITH") && !upper.startsWith("SELECT")) return false;
        String[] forbidden = {"DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "CREATE", "GRANT", "REVOKE", "TRUNCATE", "EXEC", "EXECUTE"};
        for (String word : forbidden) {
            if (upper.contains(word)) return false;
        }
        return true;
    }

    /**
     * Busca dashboard por ID com seus widgets (usando JPA para serializar JsonNode corretamente)
     */
    public Optional<Dashboard> getDashboardByIdWithWidgets(Long id, Long userId) {
        System.out.println("\n[DashboardService] ========== BUSCANDO DASHBOARD ==========");
        System.out.println("[DashboardService] Buscando dashboard id=" + id + " userId=" + userId);
        Optional<Dashboard> dashOpt = dashboardRepository.findByIdAndUserId(id, userId);
        
        if (dashOpt.isPresent()) {
            Dashboard dash = dashOpt.get();
            System.out.println("[DashboardService] ✅ Dashboard encontrado: " + dash.getName());
            System.out.println("[DashboardService] Canvas config: " + (dash.getCanvasConfig() != null ? dash.getCanvasConfig().toString() : "NULL!!!"));
            System.out.println("[DashboardService] Theme config: " + (dash.getThemeConfig() != null ? dash.getThemeConfig().toString() : "NULL!!!"));
            // Force lazy load dos widgets
            if (dash.getWidgets() != null) {
                System.out.println("[DashboardService] Widgets count: " + dash.getWidgets().size());
                for (DashboardWidget w : dash.getWidgets()) {
                    System.out.println("[DashboardService]   - Widget: " + w.getWidgetId() + " (type=" + w.getWidgetType() + ")");
                }
            } else {
                System.out.println("[DashboardService] Widgets: NULL");
            }
        } else {
            System.out.println("[DashboardService] ❌ Dashboard NÃO encontrado!");
        }
        System.out.println("[DashboardService] ========================================\n");
        
        return dashOpt;
    }

    
    @Autowired
    private DashboardLayoutRepository repository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // =========== MÉTODOS PARA NOVA ESTRUTURA 5 TABELAS ===========
    
    /**
     * Busca dashboard completo com widgets para um usuário
     * Usa a nova estrutura de 5 tabelas: dashboards, dashboard_widgets, dashboard_queries, widget_templates, dashboard_audit_log
     */
    public Map<String, Object> getDashboardByUserId(Long userId) {
        try {
            // 1. Buscar dashboard principal
            String userSql = "SELECT default_dashboard_id FROM users WHERE codigo_usu = ?";
            List<Map<String, Object>> userRows = jdbcTemplate.queryForList(userSql, userId);
            Long dashboardId;
            if (!userRows.isEmpty() && userRows.get(0).get("default_dashboard_id") != null) {
                dashboardId = ((Number) userRows.get(0).get("default_dashboard_id")).longValue();
            } else {
                String fallbackSql = "SELECT id FROM dashboards WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1";
                List<Map<String, Object>> fallbackRows = jdbcTemplate.queryForList(fallbackSql, userId);
                if (!fallbackRows.isEmpty()) {
                    dashboardId = ((Number) fallbackRows.get(0).get("id")).longValue();
                } else {
                    return createEmptyDashboard(userId);
                }
            }
            // Buscar dados do dashboard
            String dashboardSql = "SELECT id, name, description, theme_config, canvas_config, is_active FROM dashboards WHERE id = ? AND is_active = 1 LIMIT 1";
            List<Map<String, Object>> dashboardRows = jdbcTemplate.queryForList(dashboardSql, dashboardId);
            if (dashboardRows.isEmpty()) {
                return createEmptyDashboard(userId);
            }
            Map<String, Object> dashboard = dashboardRows.get(0);

            // 2. Buscar widgets do dashboard
            String widgetsSql = """
                SELECT dw.id, dw.title, dw.widget_type, dw.position_x, dw.position_y, 
                       dw.width, dw.height, dw.data_config, dw.visual_config, dw.behavior_config,
                       dw.query_id, dq.sql_query
                FROM dashboard_widgets dw
                LEFT JOIN dashboard_queries dq ON dq.id = dw.query_id
                WHERE dw.dashboard_id = ? AND dw.is_visible = 1
                ORDER BY dw.position_y, dw.position_x
            """;

            List<Map<String, Object>> widgets = jdbcTemplate.queryForList(widgetsSql, dashboardId);

            // 3. Montar resposta
            Map<String, Object> result = new HashMap<>();
            result.put("id", dashboard.get("id"));
            result.put("title", dashboard.get("name")); // Corrigido para 'name'
            result.put("description", dashboard.get("description"));
            result.put("theme_config", dashboard.get("theme_config"));
            result.put("canvas_config", dashboard.get("canvas_config"));
            result.put("widgets", widgets);
            result.put("is_active", dashboard.get("is_active"));

            System.out.println("[DASHBOARD-DEBUG] Retorno para userId=" + userId + ": " + result);

            return result;
            
        } catch (DataAccessException e) {
            // Spring JdbcTemplate já fez rollback automático aqui
            System.err.println("🔴 [DashboardService] Erro BD ao buscar dashboard: " + e.getMessage());
            e.printStackTrace();
            return createEmptyDashboard(userId);
        } catch (Exception e) {
            System.err.println("🔴 [DashboardService] Erro geral ao buscar dashboard: " + e.getMessage());
            e.printStackTrace();
            return createEmptyDashboard(userId);
        }
    }

    /**
     * Executa query SQL de um widget específico e retorna os dados
     */
    public Object executeWidgetQuery(Long widgetId, Object... params) {
        try {
            System.out.println("[WIDGET-QUERY] executeWidgetQuery called. widgetId=" + widgetId + " params=" + java.util.Arrays.toString(params));
            String sql = "SELECT dq.sql_query, dw.widget_type FROM dashboard_widgets dw LEFT JOIN dashboard_queries dq ON dq.id = dw.query_id WHERE dw.id = ? AND dw.is_visible = 1 LIMIT 1";
            List<Map<String, Object>> queryRows = jdbcTemplate.queryForList(sql, widgetId);
            System.out.println("[WIDGET-QUERY] SQL para buscar query do widget: " + sql);
            System.out.println("[WIDGET-QUERY] Resultado da busca: " + queryRows);
            if (queryRows.isEmpty()) {
                System.out.println("[WIDGET-QUERY] Nenhuma query encontrada para widgetId=" + widgetId);
                return null;
            }

            String sqlQuery = queryRows.get(0).get("sql_query") != null ? String.valueOf(queryRows.get(0).get("sql_query")) : null;
            // Pre-process stored queries: when they filter by dtvenci_rec or dtvenci_pag,
            // prefer dtfluxo if present by using COALESCE(dtfluxo_*, dtvenci_*).
            // This keeps the same placeholder count and reproduces the logic used
            // in buscarFluxoCaixaDia without changing parameter passing.
            if (sqlQuery != null) {
                // replace occurrences of dtvenci_rec and dtvenci_pag with COALESCE expressions
                // use case-insensitive replacement
                sqlQuery = sqlQuery.replaceAll("(?i)\\bdtvenci_rec\\b", "COALESCE(dtfluxo_rec, dtvenci_rec)");
                sqlQuery = sqlQuery.replaceAll("(?i)\\bdtvenci_pag\\b", "COALESCE(dtfluxo_pag, dtvenci_pag)");
                System.out.println("[WIDGET-QUERY] sqlQuery after dtvenci->coalesce preprocess: " + sqlQuery);
            }
            Object widgetTypeObj = queryRows.get(0).get("widget_type");
            String widgetType = widgetTypeObj != null ? String.valueOf(widgetTypeObj) : "";
            System.out.println("[WIDGET-QUERY] sqlQuery extracted (raw): " + (sqlQuery == null ? "<null>" : sqlQuery));
            System.out.println("[WIDGET-QUERY] sqlQuery extraída: " + sqlQuery);
            System.out.println("[WIDGET-QUERY] widgetType extraído: " + widgetType);

            // Validação de segurança: apenas SELECT permitido
            if (!isSelectQuerySafe(sqlQuery)) {
                System.out.println("[WIDGET-QUERY] Query bloqueada por segurança: " + sqlQuery);
                throw new SecurityException("Apenas queries SELECT são permitidas para widgets. Operação bloqueada.");
            }

            Object result = null;
            try {
                // Ajuste: contar placeholders '?' na query e, se necessário, expandir os parâmetros
                int placeholders = 0;
                if (sqlQuery != null) {
                    placeholders = sqlQuery.length() - sqlQuery.replace("?", "").length();
                }
                System.out.println("[WIDGET-QUERY] placeholders detected: " + placeholders);

                Object[] execParams = params;
                System.out.println("[WIDGET-QUERY] initial execParams: " + java.util.Arrays.toString(execParams));
                if (placeholders > 0) {
                    // Se não foram fornecidos params, tentar recuperar filial da sessao (login)
                    if (params == null || params.length == 0) {
                        try {
                            org.springframework.web.context.request.ServletRequestAttributes attrs = (org.springframework.web.context.request.ServletRequestAttributes)
                                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                            if (attrs != null) {
                                jakarta.servlet.http.HttpSession sess = attrs.getRequest().getSession(false);
                                if (sess != null) {
                                    Object sessFil = sess.getAttribute("id_fil");
                                    if (sessFil != null) {
                                        Object[] expanded = new Object[placeholders];
                                        for (int i = 0; i < placeholders; i++) expanded[i] = sessFil;
                                        execParams = expanded;
                                        System.out.println("[WIDGET-QUERY] Usando filial da sessao para preencher parametros: " + sessFil);
                                    } else {
                                        System.out.println("[WIDGET-QUERY] Sessao encontrada, mas id_fil nao presente");
                                    }
                                } else {
                                    System.out.println("[WIDGET-QUERY] Nao ha sessao HTTP disponivel para preencher parametros");
                                }
                            }
                        } catch (Exception e) {
                            System.err.println("[WIDGET-QUERY] Erro ao tentar obter filial da sessao: " + e.getMessage());
                        }
                    }

                        // Se ainda não temos execParams suficientemente longos, expandir quando necessário.
                        if (execParams == null || execParams.length == 0) {
                            if (params == null || params.length == 0) {
                                System.out.println("[WIDGET-QUERY] Query requer parametros e nenhum parametro/filial foi fornecido. Aborting exec.");
                                return null;
                            }
                            // inicializa execParams com os params fornecidos para permitir expansão abaixo
                            execParams = params;
                        }

                        // Se o número de parâmetros fornecidos for menor que o número de placeholders, expandir repetindo o último valor
                        if (execParams.length < placeholders) {
                            Object[] expanded = new Object[placeholders];
                            for (int i = 0; i < placeholders; i++) {
                                expanded[i] = execParams[Math.min(i, execParams.length - 1)];
                            }
                            execParams = expanded;
                            System.out.println("[WIDGET-QUERY] Expandindo parametros para corresponder aos placeholders: " + placeholders + ", novos params length=" + execParams.length + ", values=" + java.util.Arrays.toString(execParams));
                        }
                }
                System.out.println("[WIDGET-QUERY] Executando tipo='" + widgetType + "' com params=" + java.util.Arrays.toString(execParams));
                switch (widgetType.toLowerCase()) {
                    case "kpi":
                        System.out.println("[WIDGET-QUERY] Executando query para KPI: " + sqlQuery);
                        if (execParams != null && execParams.length > 0) {
                            result = jdbcTemplate.queryForMap(sqlQuery, execParams);
                        } else {
                            result = jdbcTemplate.queryForMap(sqlQuery);
                        }
                        break;
                    case "chart":
                        System.out.println("[WIDGET-QUERY] Executando query para Chart: " + sqlQuery);
                        if (execParams != null && execParams.length > 0) {
                            result = jdbcTemplate.queryForList(sqlQuery, execParams);
                        } else {
                            result = jdbcTemplate.queryForList(sqlQuery);
                        }
                        break;
                    case "aggrid":
                        System.out.println("[WIDGET-QUERY] Executando query para AgGrid: " + sqlQuery);
                        if (execParams != null && execParams.length > 0) {
                            result = jdbcTemplate.queryForList(sqlQuery, execParams);
                        } else {
                            result = jdbcTemplate.queryForList(sqlQuery);
                        }
                        break;
                    default:
                        System.out.println("[WIDGET-QUERY] Executando query para tipo desconhecido: " + widgetType + " | " + sqlQuery);
                        if (execParams != null && execParams.length > 0) {
                            result = jdbcTemplate.queryForList(sqlQuery, execParams);
                        } else {
                            result = jdbcTemplate.queryForList(sqlQuery);
                        }
                        break;
                }
                System.out.println("[WIDGET-QUERY] Resultado da execução da query do widget: " + result);
            } catch (Exception exQuery) {
                System.err.println("[WIDGET-QUERY] Erro ao executar SQL do widget: " + exQuery.getMessage());
                exQuery.printStackTrace();
                result = null;
            }
            return result;
        } catch (Exception e) {
            System.err.println("[NEW-DASHBOARD] Erro ao executar query do widget: " + e.getMessage());
            return null;
        }
    }
    // ...existing code...
    // Mapeamento seguro de queryId para SQL
    public String getSqlForQueryId(String queryId) {
        // Mapeamento dos principais widgets do dashboard com cálculos corretos de TREND
        // TREND = comparação de últimos 7 dias vs 7 dias anteriores (14 dias no total)
        switch (queryId) {
            case "kpiReceber":
                // Total a Receber: soma de contas em aberto não pagas
                return "SELECT COALESCE(SUM(vlrsal_rec), 0) as value " +
                    "FROM receber " +
                    "WHERE dtpagi_rec IS NULL " +
                    "AND (status_rec IS NULL OR status_rec = '') " +
                    "AND vlrsal_rec > 0";

            case "kpiPagar":
                // Total a Pagar: soma de contas em aberto não pagas
                return "SELECT COALESCE(SUM(vlrsal_pag), 0) as value " +
                    "FROM pagar " +
                    "WHERE dtpagi_pag IS NULL " +
                    "AND (status_pag IS NULL OR status_pag = '') " +
                    "AND vlrsal_pag > 0";

            case "kpiCaixa":
                // Saldo atual em caixa: débitos (D) menos créditos (C)
                return "SELECT COALESCE(SUM(CASE WHEN DC_CAI = 'C' THEN valor_cai WHEN DC_CAI = 'D' THEN -valor_cai ELSE 0 END), 0) as value " +
                    "FROM caixa " +
                    "WHERE dtmovi_cai >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)";

            case "graficoFluxo":
                return "SELECT dtmovi_cai as mes, SUM(valor_cai) as valor FROM caixa GROUP BY dtmovi_cai ORDER BY dtmovi_cai DESC LIMIT 30";
            
            case "listaAtrasos":
                // Tabela RECEBER com JOIN em CLIENTES
                // Retorna: Cliente, Documento (CNPJ/CPF), Saldo (formato moeda), Vencimento (DD/MM/AAAA), Dias_Atraso
                return "SELECT " +
                    "c.nome_cli AS Cliente, " +
                    "CASE WHEN c.tipopessoa_cli = 'F' THEN " +
                        "CONCAT(SUBSTRING(LPAD(r.cgccpf_rec,11,'0'), 1, 3), '.', SUBSTRING(LPAD(r.cgccpf_rec,11,'0'), 4, 3), '.', SUBSTRING(LPAD(r.cgccpf_rec,11,'0'), 7, 3), '-', SUBSTRING(LPAD(r.cgccpf_rec,11,'0'), 10, 2)) " +
                    "WHEN c.tipopessoa_cli = 'J' THEN " +
                        "CONCAT(SUBSTRING(LPAD(r.cgccpf_rec,14,'0'), 1, 2), '.', SUBSTRING(LPAD(r.cgccpf_rec,14,'0'), 3, 3), '.', SUBSTRING(LPAD(r.cgccpf_rec,14,'0'), 6, 3), '/', SUBSTRING(LPAD(r.cgccpf_rec,14,'0'), 9, 4), '-', SUBSTRING(LPAD(r.cgccpf_rec,14,'0'), 13, 2)) " +
                    "ELSE r.cgccpf_rec END AS Documento, " +
                    "r.vlrsal_rec AS Saldo, " +
                    "DATE_FORMAT(r.dtvenci_rec, '%d/%m/%Y') AS Vencimento, " +
                    "DATEDIFF(CURDATE(), r.dtvenci_rec) AS Dias_Atraso " +
                "FROM receber r " +
                "INNER JOIN clientes c ON c.codigo_cli = r.codigo_rec AND c.cliforn_cli = 'C' " +
                "WHERE r.dtpagi_rec IS NULL " +
                "AND (r.status_rec IS NULL OR r.status_rec = '') " +
                "AND r.dtvenci_rec < CURDATE() " +
                "AND r.vlrsal_rec > 0 " +
                "ORDER BY r.dtvenci_rec ASC " +
                "LIMIT 50";
            
            case "aggrid_saldo_caixa":
                // Tabela CAIXACAB com JOIN em BANCOS
                // Retorna: Banco, Saldo Atual, Última Atualização (DD/MM/AAAA)
                // Filtro: filial_cai = session.id_fil, banco_cai = '001' (fixo operacional), empresa_ger = session.empresa_ger
                try {
                    jakarta.servlet.http.HttpSession sess = ((org.springframework.web.context.request.ServletRequestAttributes)
                        org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes())
                        .getRequest().getSession(false);
                    String empresa = "001";
                    String filial = "001";
                    if (sess != null) {
                        Object empAttr = sess.getAttribute("empresa_ger");
                        if (empAttr != null) empresa = String.valueOf(empAttr);
                        Object filAttr = sess.getAttribute("id_fil");
                        if (filAttr != null) filial = String.valueOf(filAttr);
                    }
                    return "SELECT " +
                        "b.nomefan_bco AS Banco, " +
                        "cc.saldo_cai AS 'Saldo Atual', " +
                        "DATE_FORMAT(cc.dtmovi_cai, '%d/%m/%Y') AS 'Última Atualização' " +
                    "FROM caixacab cc " +
                    "INNER JOIN bancos b ON b.empresa_ger = '" + empresa + "' AND cc.banco_cai = b.codigo_bco " +
                    "WHERE cc.filial_cai = '" + filial + "' " +
                    "AND cc.banco_cai = '001' " +
                    "AND DATE(cc.dtmovi_cai) = CURDATE() " +
                    "ORDER BY cc.dtmovi_cai DESC, b.nomefan_bco ASC " +
                    "LIMIT 1071";
                } catch (Exception e) {
                    // Fallback seguro
                    return "SELECT " +
                        "b.nomefan_bco AS Banco, " +
                        "cc.saldo_cai AS 'Saldo Atual', " +
                        "DATE_FORMAT(cc.dtmovi_cai, '%d/%m/%Y') AS 'Última Atualização' " +
                    "FROM caixacab cc " +
                    "INNER JOIN bancos b ON b.empresa_ger = '001' AND cc.banco_cai = b.codigo_bco " +
                    "WHERE cc.filial_cai = '001' " +
                    "AND cc.banco_cai = '001' " +
                    "AND DATE(cc.dtmovi_cai) = CURDATE() " +
                    "ORDER BY cc.dtmovi_cai DESC, b.nomefan_bco ASC " +
                    "LIMIT 1071";
                }
            // Exemplos anteriores mantidos para compatibilidade
            case "totalReceberAberto":
                return "SELECT SUM(valor) as value FROM contas_receber WHERE status = 'aberto'";
            case "fluxoCaixaMensal":
                return "SELECT mes, saldo FROM fluxo_caixa WHERE ano = ? ORDER BY mes";
            case "contasPagarPorCategoria":
                return "SELECT categoria, SUM(valor) as valor FROM contas_pagar GROUP BY categoria";
            case "ultimasContasReceber":
                return "SELECT documento, cliente, valor FROM contas_receber ORDER BY data DESC LIMIT ?";
            // Adicione outros mapeamentos conforme necessário
            default:
                return null;
        }
    }
    
    public java.util.Optional<br.com.spdealer.model.User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public List<DashboardLayout> findAllLayouts() {
        return repository.findAll();
    }

    public DashboardLayout saveLayout(DashboardLayout layout) {
        return repository.save(layout);
    }

    public DashboardLayout getLayoutByUsuario(Long usuarioId) {
        return repository.findFirstByUsuarioIdAndAtivoTrue(usuarioId);
    }

    public void deleteLayout(Long id) {
        repository.deleteById(id);
    }

    // Métodos para buscar dados reais dos widgets/KPIs (mock antigos, podem ser removidos se não usados)
    public Number getTotalReceber(Map<String, Object> params) {
        return 12345.67;
    }

    public Number getTotalPagar(Map<String, Object> params) {
        return 8901.23;
    }

    public Object getFluxoCaixaSeries(Map<String, Object> params) {
        return java.util.Arrays.asList(
            Map.of("mes", "Jan", "valor", 1000),
            Map.of("mes", "Fev", "valor", 2000),
            Map.of("mes", "Mar", "valor", 1500)
        );
    }

    // --------- Métodos dinâmicos para dashboard ---------

    // Executa uma query SQL que retorna um valor único (KPI)
    public Object executeKpiQuery(String sql, Map<String, Object> params) {
        try {
            return jdbcTemplate.queryForObject(sql, params == null ? new Object[]{} : params.values().toArray(), Object.class);
        } catch (Exception e) {
            return null;
        }
    }

    // Executa uma query SQL que retorna uma lista de objetos (para listas e gráficos)
    public List<Map<String, Object>> executeListQuery(String sql, Map<String, Object> params) {
        try {
            int placeholders = 0;
            if (sql != null) {
                placeholders = sql.length() - sql.replace("?", "").length();
            }

            Object[] execParams = null;
            if (params != null && !params.isEmpty()) {
                execParams = params.values().toArray();
            } else {
                // Tentar preencher filial a partir da sessao HTTP se a query tiver placeholders
                if (placeholders > 0) {
                    try {
                        org.springframework.web.context.request.ServletRequestAttributes attrs = (org.springframework.web.context.request.ServletRequestAttributes)
                                org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                        if (attrs != null) {
                            jakarta.servlet.http.HttpSession sess = attrs.getRequest().getSession(false);
                            if (sess != null) {
                                Object sessFil = sess.getAttribute("id_fil");
                                if (sessFil != null) {
                                    execParams = new Object[placeholders];
                                    for (int i = 0; i < placeholders; i++) execParams[i] = sessFil;
                                    System.out.println("[EXEC-LIST] Usando filial da sessao para preencher parametros: " + sessFil);
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("[EXEC-LIST] Erro ao obter sessao para preencher parametros: " + e.getMessage());
                    }
                }
            }

            // Se ainda temos execParams curto e params fornecidos parcialmente, expandir repetindo o ultimo valor
            if (placeholders > 0) {
                if (execParams == null) {
                    // nenhum param disponível
                    System.out.println("[EXEC-LIST] Query requer parametros e nenhum parametro foi fornecido. Retornando vazio.");
                    return Collections.emptyList();
                }
                if (execParams.length < placeholders) {
                    Object[] expanded = new Object[placeholders];
                    for (int i = 0; i < placeholders; i++) {
                        expanded[i] = execParams[Math.min(i, execParams.length - 1)];
                    }
                    execParams = expanded;
                    System.out.println("[EXEC-LIST] Expandindo parametros para corresponder aos placeholders: " + placeholders + ", novos params length=" + execParams.length + ", values=" + java.util.Arrays.toString(execParams));
                }
            }

            if (execParams != null && execParams.length > 0) {
                return jdbcTemplate.queryForList(sql, execParams);
            } else {
                return jdbcTemplate.queryForList(sql);
            }
        } catch (Exception e) {
            System.err.println("[EXEC-LIST] Erro ao executar query: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    // Para gráficos, pode ser igual ao executeListQuery (mantém flexível para evoluções)
    public List<Map<String, Object>> executeChartQuery(String sql, Map<String, Object> params) {
        return executeListQuery(sql, params);
    }
}
