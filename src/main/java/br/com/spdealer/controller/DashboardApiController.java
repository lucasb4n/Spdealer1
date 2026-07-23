package br.com.spdealer.controller;

import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import br.com.spdealer.model.Dashboard;
import br.com.spdealer.repository.DashboardRepository;
import br.com.spdealer.repository.DashboardConfigRepository;
import br.com.spdealer.service.DashboardConfigService;
import br.com.spdealer.service.DashboardService;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v2")
public class DashboardApiController {
    @Autowired
    private br.com.spdealer.repository.DashboardWidgetRepository widgetRepository;
    
    @Autowired
    private DashboardRepository dashboardRepository;

    @Autowired
    private DashboardService dashboardService;
    
    @Autowired
    private DashboardConfigService dashboardConfigService;
    
    // =========== NOVOS ENDPOINTS PARA ESTRUTURA 5 TABELAS ===========
    
    /**
     * Busca dashboard completo com widgets usando nova estrutura 5 tabelas
     */
    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<?> getDashboardByUserId(@PathVariable Long userId) {
        try {
            System.out.println("[NEW-DASHBOARD] Buscando dashboard para usuário: " + userId);
            
            Map<String, Object> dashboard = dashboardService.getDashboardByUserId(userId);
            
            System.out.println("[NEW-DASHBOARD] Dashboard encontrado: " + dashboard.get("title"));
            
            return ResponseEntity.ok(dashboard);
            
        } catch (Exception e) {
            System.err.println("[NEW-DASHBOARD] Erro ao buscar dashboard: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "error", "Erro ao buscar dashboard",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Executa query de um widget específico
     */
    @GetMapping("/widget/{widgetId}/data")
    public ResponseEntity<?> getWidgetData(@PathVariable Long widgetId,
                                           @RequestParam(required = false) Long filial,
                                           HttpSession session) {
        try {
            System.out.println("[NEW-DASHBOARD] Executando query para widget: " + widgetId + " (filial param=" + filial + ")");

            Object data;
            if (filial != null) {
                data = dashboardService.executeWidgetQuery(widgetId, filial);
            } else {
                Object sessionFilial = session.getAttribute("id_fil");
                if (sessionFilial != null) {
                    System.out.println("[NEW-DASHBOARD] Usando filial da sessao: " + sessionFilial);
                    data = dashboardService.executeWidgetQuery(widgetId, sessionFilial);
                } else {
                    data = dashboardService.executeWidgetQuery(widgetId);
                }
            }

            if (data == null) {
                return ResponseEntity.status(404).body(Map.of(
                    "error", "Widget não encontrado ou sem query definida"
                ));
            }

            return ResponseEntity.ok(Map.of("data", data));

        } catch (Exception e) {
            System.err.println("[NEW-DASHBOARD] Erro ao executar query do widget: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Erro ao executar query do widget",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Salva novo dashboard na estrutura 5 tabelas
     */
    @PostMapping("/dashboard")
    public ResponseEntity<?> createDashboard(@RequestBody Map<String, Object> request) {
        try {
            Long userId = ((Number) request.get("userId")).longValue();
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            Map<String, Object> themeConfig = (Map<String, Object>) request.get("themeConfig");
            Map<String, Object> canvasConfig = (Map<String, Object>) request.get("canvasConfig");
            
            System.out.println("[NEW-DASHBOARD] Criando dashboard: " + title + " para usuário: " + userId);
            
            Map<String, Object> result = dashboardService.saveDashboard(userId, title, description, themeConfig, canvasConfig);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("[NEW-DASHBOARD] Erro ao criar dashboard: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "error", "Erro ao criar dashboard",
                "message", e.getMessage()
            ));
        }
    }

    // =========== ENDPOINTS LEGADOS (mantidos para compatibilidade) ===========


    @GetMapping("/dashboards")
    public ResponseEntity<?> getDashboards(@RequestParam(required = false) Long userId) {
        try {
            // Por simplicidade, vamos usar userId=1 (admin) se não fornecido
            Long targetUserId = (userId != null) ? userId : 1L;
            
            System.out.println("[DASHBOARD] Buscando dashboards para usuário: " + targetUserId);
            
            // Buscar todos os dashboards do usuário
            List<Dashboard> dashboards = dashboardRepository.findByUserIdAndIsActiveTrue(targetUserId);
            
            System.out.println("[DASHBOARD] Encontrados " + dashboards.size() + " dashboards");
            
            // Criar resposta simplificada sem widgets para evitar problemas de serialização
            List<Map<String, Object>> simplifiedDashboards = dashboards.stream()
                .map(dashboard -> {
                    Map<String, Object> dashboardMap = new java.util.HashMap<>();
                    dashboardMap.put("id", dashboard.getId());
                    dashboardMap.put("name", dashboard.getName() != null ? dashboard.getName() : "Dashboard " + dashboard.getId());
                    dashboardMap.put("title", dashboard.getName() != null ? dashboard.getName() : "Dashboard " + dashboard.getId());
                    dashboardMap.put("description", dashboard.getDescription() != null ? dashboard.getDescription() : "");
                    dashboardMap.put("isDefault", dashboard.getIsDefault());
                    dashboardMap.put("isActive", dashboard.getIsActive());
                    dashboardMap.put("userId", dashboard.getUserId());
                    dashboardMap.put("createdAt", dashboard.getCreatedAt());
                    dashboardMap.put("updatedAt", dashboard.getUpdatedAt());
                    return dashboardMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(simplifiedDashboards);
            
        } catch (Exception e) {
            System.err.println("[DASHBOARD] Erro ao buscar dashboards: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @PostMapping("/dashboards")
    public ResponseEntity<?> createDashboard(@RequestBody Map<String, Object> dashboardData, @RequestParam(required = false) Long userId) {
        try {
            // Por simplicidade, vamos usar userId=1 (admin) se não fornecido
            Long targetUserId = (userId != null) ? userId : 1L;
            
            String name = (String) dashboardData.get("name");
            String description = (String) dashboardData.getOrDefault("description", "");
            
            System.out.println("[DASHBOARD] Criando dashboard '" + name + "' para usuário: " + targetUserId);
            
            // Criar dashboard simples por enquanto
            Dashboard newDashboard = new Dashboard();
            newDashboard.setName(name);
            newDashboard.setDescription(description);
            newDashboard.setUserId(targetUserId);
            newDashboard.setIsActive(true);
            newDashboard.setIsDefault(false);
            
            Dashboard savedDashboard = dashboardRepository.save(newDashboard);
            
            System.out.println("[DASHBOARD] Dashboard criado com ID: " + savedDashboard.getId());
            return ResponseEntity.ok(savedDashboard);
            
        } catch (Exception e) {
            System.err.println("[DASHBOARD] Erro ao criar dashboard: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @GetMapping("/dashboards/{id}")
    public ResponseEntity<?> getDashboardById(@PathVariable Long id) {
        try {
            System.out.println("[DASHBOARD] Buscando dashboard com ID: " + id);
            
            Optional<Dashboard> dashboardOpt = dashboardRepository.findById(id);
            
            if (dashboardOpt.isPresent()) {
                Dashboard dashboard = dashboardOpt.get();
                System.out.println("[DASHBOARD] Dashboard encontrado com sucesso: " + dashboard.getName());
                return ResponseEntity.ok(buildDashboardResponse(dashboard));
            } else {
                System.out.println("[DASHBOARD] Dashboard não encontrado com ID: " + id);
                return ResponseEntity.status(404).body(Map.of("error", "Dashboard não encontrado"));
            }
            
        } catch (Exception e) {
            System.err.println("[DASHBOARD] Erro ao buscar dashboard: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @GetMapping("/dashboards/default")
    public ResponseEntity<?> getDefaultDashboard(@RequestParam(required = false) Long userId) {
        try {
            System.out.println("[DASHBOARD] Buscando dashboard padrão para usuário: " + userId);
            
            // 1) Buscar dashboard padrão específico do usuário
            if (userId != null) {
                Optional<Dashboard> userDefault = dashboardRepository.findByUserIdAndIsDefaultTrue(userId);
                if (userDefault.isPresent()) {
                    System.out.println("[DASHBOARD] Dashboard padrão do usuário encontrado: " + userDefault.get().getName());
                    return ResponseEntity.ok(buildDashboardResponse(userDefault.get()));
                }
            }
            
            // SEM fallback global: cada usuário só vê seu próprio dashboard.
            // Se o usuário não tem dashboard, o frontend renderiza área vazia.
            System.out.println("[DASHBOARD] Nenhum dashboard padrão encontrado para o usuário " + userId);
            return ResponseEntity.ok(Map.of("message", "Nenhum dashboard padrão configurado"));
            
        } catch (Exception e) {
            System.err.println("[DASHBOARD] Erro ao buscar dashboard padrão: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @GetMapping("/dashboards/templates")
    public ResponseEntity<?> getWidgetTemplates() {
        try {
            System.out.println("[DASHBOARD] Buscando templates de widgets");
            
            // Retornar templates fixos por enquanto
            List<Map<String, Object>> templates = List.of(
                Map.of(
                    "id", 1,
                    "name", "KPI Simples",
                    "widgetType", "kpi",
                    "description", "Indicador de performance",
                    "defaultWidth", 200,
                    "defaultHeight", 100,
                    "defaultVisualConfig", Map.of("color", "#2563eb"),
                    "defaultBehaviorConfig", Map.of()
                ),
                Map.of(
                    "id", 2,
                    "name", "Gráfico de Linha",
                    "widgetType", "chart",
                    "description", "Gráfico de linhas temporais",
                    "defaultWidth", 400,
                    "defaultHeight", 300,
                    "defaultVisualConfig", Map.of("chartType", "line"),
                    "defaultBehaviorConfig", Map.of()
                ),
                Map.of(
                    "id", 3,
                    "name", "Lista de Dados",
                    "widgetType", "list",
                    "description", "Lista de registros",
                    "defaultWidth", 300,
                    "defaultHeight", 200,
                    "defaultVisualConfig", Map.of(),
                    "defaultBehaviorConfig", Map.of()
                ),
                Map.of(
                    "id", 4,
                    "name", "AG Grid Avançado",
                    "widgetType", "aggrid",
                    "description", "Tabela com filtros, pesquisa e totalizadores",
                    "defaultWidth", 600,
                    "defaultHeight", 400,
                    "defaultVisualConfig", Map.of(
                        "showHeader", true,
                        "showFilter", true,
                        "showTotals", true,
                        "showSearch", true,
                        "gridTheme", "ag-theme-alpine"
                    ),
                    "defaultBehaviorConfig", Map.of("maxItems", 100)
                )
            );
            
            System.out.println("[DASHBOARD] Retornando " + templates.size() + " templates");
            return ResponseEntity.ok(templates);
            
        } catch (Exception e) {
            System.err.println("[DASHBOARD] Erro ao buscar templates: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @GetMapping("/dashboards/{dashboardId}/widgets")
    public ResponseEntity<?> getDashboardWidgets(@PathVariable Long dashboardId) {
        try {
            System.out.println("[DASHBOARD] Buscando widgets para dashboard: " + dashboardId);
            
            // Buscar widgets reais do banco de dados
            List<br.com.spdealer.model.DashboardWidget> widgets = widgetRepository.findByDashboardIdAndIsVisibleTrueOrderByZIndexAsc(dashboardId);
            
            // Converter para formato JSON
            List<Map<String, Object>> widgetMaps = widgets.stream()
                .map(widget -> {
                    Map<String, Object> widgetMap = new java.util.HashMap<>();
                    widgetMap.put("id", widget.getId());
                    widgetMap.put("widgetId", widget.getWidgetId());
                    widgetMap.put("title", widget.getTitle());
                    widgetMap.put("widgetType", widget.getWidgetType().toString());
                    widgetMap.put("positionX", widget.getPositionX());
                    widgetMap.put("positionY", widget.getPositionY());
                    widgetMap.put("width", widget.getWidth());
                    widgetMap.put("height", widget.getHeight());
                    widgetMap.put("zIndex", widget.getZIndex());
                    widgetMap.put("isVisible", widget.getIsVisible());
                    widgetMap.put("isLocked", widget.getIsLocked());
                    widgetMap.put("visualConfig", widget.getVisualConfig());
                    widgetMap.put("behaviorConfig", widget.getBehaviorConfig());
                    widgetMap.put("dataConfig", widget.getDataConfig());
                    return widgetMap;
                })
                .collect(java.util.stream.Collectors.toList());
            
            System.out.println("[DASHBOARD] Retornando " + widgetMaps.size() + " widgets");
            return ResponseEntity.ok(widgetMaps);
            
        } catch (Exception e) {
            System.err.println("[DASHBOARD] Erro ao buscar widgets: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @PostMapping("/dashboards/{dashboardId}/widgets")
    public ResponseEntity<?> createWidget(@PathVariable Long dashboardId, @RequestBody Map<String, Object> widgetData) {
        try {
            System.out.println("[DASHBOARD] Criando widget para dashboard: " + dashboardId);
            System.out.println("[DASHBOARD] Dados do widget: " + widgetData);
            
            // Simular criação de widget usando HashMap para evitar limite do Map.of
            Map<String, Object> newWidget = new java.util.HashMap<>();
            newWidget.put("id", System.currentTimeMillis()); // ID temporário
            newWidget.put("widgetId", "widget_" + System.currentTimeMillis());
            newWidget.put("title", widgetData.getOrDefault("title", "Novo Widget"));
            newWidget.put("widgetType", "kpi"); // Por padrão
            newWidget.put("positionX", widgetData.getOrDefault("positionX", 0));
            newWidget.put("positionY", widgetData.getOrDefault("positionY", 0));
            newWidget.put("width", 200);
            newWidget.put("height", 100);
            newWidget.put("zIndex", 1);
            newWidget.put("isVisible", true);
            newWidget.put("isLocked", false);
            
            System.out.println("[DASHBOARD] Widget criado com sucesso");
            return ResponseEntity.ok(newWidget);
            
        } catch (Exception e) {
            System.err.println("[DASHBOARD] Erro ao criar widget: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    // ================================
    // NOVOS ENDPOINTS PARA CONFIG JSON
    // ================================

    @GetMapping("/dashboards/config")
    public ResponseEntity<?> getDashboardConfig(@RequestParam(required = false) Long userId) {
        try {
            // Por simplicidade, vamos usar userId=1 (admin) se não fornecido
            Long targetUserId = (userId != null) ? userId : 1L;
            
            System.out.println("[CONFIG] Buscando configuração para usuário: " + targetUserId);
            
            Map<String, Object> config = dashboardConfigService.getDashboardConfig(targetUserId);
            
            if (config != null) {
                System.out.println("[CONFIG] Configuração encontrada para usuário: " + targetUserId);
                return ResponseEntity.ok(config);
            } else {
                System.out.println("[CONFIG] Nenhuma configuração encontrada, criando padrão");
                Map<String, Object> defaultConfig = dashboardConfigService.createDefaultConfig();
                return ResponseEntity.ok(defaultConfig);
            }
            
        } catch (Exception e) {
            System.err.println("[CONFIG] Erro ao buscar configuração: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @PostMapping("/dashboards/config")
    public ResponseEntity<?> saveDashboardConfig(@RequestBody Map<String, Object> config, @RequestParam(required = false) Long userId) {
        try {
            // Por simplicidade, vamos usar userId=1 (admin) se não fornecido
            Long targetUserId = (userId != null) ? userId : 1L;
            
            System.out.println("[CONFIG] Salvando configuração para usuário: " + targetUserId);
            
            // Validar configuração
            if (!dashboardConfigService.isValidConfig(config)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Configuração inválida"));
            }
            
            // Salvar configuração
            dashboardConfigService.saveDashboardConfig(targetUserId, config);
            
            System.out.println("[CONFIG] Configuração salva com sucesso para usuário: " + targetUserId);
            return ResponseEntity.ok(Map.of("message", "Configuração salva com sucesso"));
            
        } catch (Exception e) {
            System.err.println("[CONFIG] Erro ao salvar configuração: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    @GetMapping("/dashboards/config/widgets")
    public ResponseEntity<?> getDashboardWidgetsFromConfig(@RequestParam(required = false) Long userId) {
        try {
            // Por simplicidade, vamos usar userId=1 (admin) se não fornecido
            Long targetUserId = (userId != null) ? userId : 1L;
            
            System.out.println("[CONFIG] Buscando widgets da configuração para usuário: " + targetUserId);
            
            Map<String, Object> config = dashboardConfigService.getDashboardConfig(targetUserId);
            
            if (config != null && config.containsKey("widgets")) {
                Map<String, Object> widgets = (Map<String, Object>) config.get("widgets");
                System.out.println("[CONFIG] Retornando " + widgets.size() + " widgets da configuração");
                return ResponseEntity.ok(widgets);
            } else {
                System.out.println("[CONFIG] Nenhum widget encontrado na configuração");
                return ResponseEntity.ok(Map.of());
            }
            
        } catch (Exception e) {
            System.err.println("[CONFIG] Erro ao buscar widgets da configuração: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro interno do servidor"));
        }
    }

    // ============================
    // Método auxiliar compartilhado
    // ============================
    private Map<String, Object> buildDashboardResponse(Dashboard dashboard) {
        Map<String, Object> dashboardMap = new java.util.HashMap<>();
        dashboardMap.put("id", dashboard.getId());
        dashboardMap.put("name", dashboard.getName() != null ? dashboard.getName() : "Dashboard " + dashboard.getId());
        dashboardMap.put("title", dashboard.getName() != null ? dashboard.getName() : "Dashboard " + dashboard.getId());
        dashboardMap.put("description", dashboard.getDescription() != null ? dashboard.getDescription() : "");
        dashboardMap.put("isDefault", dashboard.getIsDefault());
        dashboardMap.put("isActive", dashboard.getIsActive());
        dashboardMap.put("userId", dashboard.getUserId());
        dashboardMap.put("createdAt", dashboard.getCreatedAt());
        dashboardMap.put("updatedAt", dashboard.getUpdatedAt());

        // Buscar e incluir widgets do dashboard
        try {
            List<br.com.spdealer.model.DashboardWidget> widgets = widgetRepository.findByDashboardIdOrderByPositionY(dashboard.getId());
            System.out.println("[DASHBOARD] Widgets encontrados para dashboard " + dashboard.getId() + ": " + widgets.size());

            List<Map<String, Object>> widgetsList = new java.util.ArrayList<>();
            for (br.com.spdealer.model.DashboardWidget widget : widgets) {
                Map<String, Object> widgetMap = new java.util.HashMap<>();
                widgetMap.put("id", widget.getId());
                widgetMap.put("dashboard_id", widget.getDashboardId());
                widgetMap.put("widget_id", widget.getWidgetId());
                widgetMap.put("title", widget.getTitle());
                widgetMap.put("widget_type", widget.getWidgetType());
                widgetMap.put("position_x", widget.getPositionX());
                widgetMap.put("position_y", widget.getPositionY());
                widgetMap.put("width", widget.getWidth());
                widgetMap.put("height", widget.getHeight());
                widgetMap.put("z_index", widget.getZIndex());
                widgetMap.put("is_visible", widget.getIsVisible());
                widgetMap.put("is_locked", widget.getIsLocked());
                widgetMap.put("query_id", widget.getQueryId());
                widgetMap.put("data_config", widget.getDataConfig());
                widgetMap.put("visual_config", widget.getVisualConfig());
                widgetMap.put("behavior_config", widget.getBehaviorConfig());
                widgetsList.add(widgetMap);
            }
            dashboardMap.put("widgets", widgetsList);
        } catch (Exception widgetErr) {
            System.err.println("[DASHBOARD] Erro ao buscar widgets: " + widgetErr.getMessage());
            dashboardMap.put("widgets", new java.util.ArrayList<>());
        }

        return dashboardMap;
    }
}