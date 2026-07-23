package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.spdealer.service.NewDashboardService;
import br.com.spdealer.model.Dashboard;
import br.com.spdealer.model.DashboardWidget;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/dashboards")
public class DashboardRestController {

    @Autowired
    private NewDashboardService dashboardService;

    // Endpoint de teste simples
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "API funcionando");
        response.put("message", "Dashboard API está ativa");
        return ResponseEntity.ok(response);
    }

    // Contar dashboards por usuário (para debug)
    @GetMapping("/count/{userId}")
    public ResponseEntity<Long> countDashboards(@PathVariable Long userId) {
        try {
            List<Dashboard> dashboards = dashboardService.getUserDashboards(userId);
            return ResponseEntity.ok((long) dashboards.size());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(-1L);
        }
    }

    // Listar apenas nomes dos dashboards (para debug)
    @GetMapping("/names/{userId}")
    public ResponseEntity<List<String>> getDashboardNames(@PathVariable Long userId) {
        try {
            List<Dashboard> dashboards = dashboardService.getUserDashboards(userId);
            List<String> names = dashboards.stream()
                .map(Dashboard::getName)
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(names);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Arrays.asList("Erro: " + e.getMessage()));
        }
    }

    // Debug ultra simples - não chama service
    @GetMapping("/debug/{userId}")
    public ResponseEntity<Map<String, Object>> debugEndpoint(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("message", "Debug endpoint funcionando");
        return ResponseEntity.ok(response);
    }

    // Listar dashboards por usuário (sem widgets para debug)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserDashboards(@PathVariable Long userId) {
        try {
            List<Dashboard> dashboards = dashboardService.getUserDashboards(userId);
            List<Map<String, Object>> response = dashboards.stream()
                .map(d -> {
                    Map<String, Object> dashMap = new HashMap<>();
                    dashMap.put("id", d.getId());
                    dashMap.put("name", d.getName());
                    dashMap.put("description", d.getDescription());
                    dashMap.put("isActive", d.getIsActive());
                    dashMap.put("isDefault", d.getIsDefault());
                    dashMap.put("userId", d.getUserId());
                    return dashMap;
                })
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Buscar dashboard por ID - versão debug
    @GetMapping("/{id}/debug")
    public ResponseEntity<Map<String, Object>> getDashboardDebug(@PathVariable Long id) {
        return ResponseEntity.ok(java.util.Collections.singletonMap("debug", "id=" + id + ", funciona!"));
    }

    // Buscar dashboard por ID (DTO seguro)
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDashboard(@PathVariable Long id) {
        try {
            System.out.println("\n[DashboardRestController] GET /dashboards/" + id);
            // TODO: obter userId do contexto/auth ao invés de fixo
            Long userId = 1L;
            var dashboardOpt = dashboardService.getDashboardByIdWithWidgets(id, userId);
            if (dashboardOpt.isEmpty()) {
                System.out.println("[DashboardRestController] Dashboard não encontrado, retornando 404");
                return ResponseEntity.notFound().build();
            }

            Dashboard dash = dashboardOpt.get();
            System.out.println("[DashboardRestController] ✅ Dashboard carregado: " + dash.getName());
            
            Map<String, Object> result = new HashMap<>();
            result.put("id", dash.getId());
            result.put("name", dash.getName());
            result.put("description", dash.getDescription());
            result.put("userId", dash.getUserId());
            result.put("isActive", dash.getIsActive());
            result.put("isDefault", dash.getIsDefault());

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Object theme = null;
            Object canvas = null;
            try { 
                if (dash.getThemeConfig() != null) {
                    theme = mapper.treeToValue(dash.getThemeConfig(), Object.class);
                    System.out.println("[DashboardRestController] Theme: OK");
                } else {
                    System.out.println("[DashboardRestController] ⚠️ ThemeConfig é NULL!");
                }
            } catch (Exception ignored) {
                System.out.println("[DashboardRestController] ❌ Erro ao converter Theme: " + ignored.getMessage());
            }
            
            try { 
                if (dash.getCanvasConfig() != null) {
                    canvas = mapper.treeToValue(dash.getCanvasConfig(), Object.class);
                    System.out.println("[DashboardRestController] Canvas: OK - " + canvas.toString().substring(0, Math.min(50, canvas.toString().length())));
                } else {
                    System.out.println("[DashboardRestController] ⚠️ CanvasConfig é NULL!");
                }
            } catch (Exception ignored) {
                System.out.println("[DashboardRestController] ❌ Erro ao converter Canvas: " + ignored.getMessage());
            }
            
            result.put("themeConfig", theme);
            result.put("canvasConfig", canvas);

            // Mapear widgets manualmente para evitar problemas de serialização
            if (dash.getWidgets() != null) {
                java.util.List<Map<String, Object>> widgets = new java.util.ArrayList<>();
                for (DashboardWidget w : dash.getWidgets()) {
                    Map<String, Object> wm = new HashMap<>();
                    wm.put("id", w.getId());
                    wm.put("widget_id", w.getWidgetId());
                    wm.put("title", w.getTitle());
                    wm.put("widget_type", w.getWidgetType() != null ? w.getWidgetType().getValue() : null);
                    wm.put("position_x", w.getPositionX());
                    wm.put("position_y", w.getPositionY());
                    wm.put("width", w.getWidth());
                    wm.put("height", w.getHeight());
                    wm.put("z_index", w.getZIndex());
                    wm.put("is_visible", w.getIsVisible());
                    wm.put("query_id", w.getQueryId());

                    try { wm.put("data_config", w.getDataConfig() != null ? mapper.treeToValue(w.getDataConfig(), Object.class) : null); } catch (Exception ignored) {}
                    try { wm.put("visual_config", w.getVisualConfig() != null ? mapper.treeToValue(w.getVisualConfig(), Object.class) : null); } catch (Exception ignored) {}
                    try { wm.put("behavior_config", w.getBehaviorConfig() != null ? mapper.treeToValue(w.getBehaviorConfig(), Object.class) : null); } catch (Exception ignored) {}
                    widgets.add(wm);
                }
                result.put("widgets", widgets);
            } else {
                result.put("widgets", java.util.Collections.emptyList());
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Falha ao carregar dashboard");
            err.put("details", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    // Dashboard padrão do usuário
    @GetMapping("/user/{userId}/default")
    public ResponseEntity<Map<String, Object>> getDefaultDashboard(@PathVariable Long userId) {
        try {
            Dashboard dash = dashboardService.getDefaultDashboardForUser(userId);
            if (dash == null) {
                return ResponseEntity.notFound().build();
            }
            // Reutiliza o método acima montando a resposta
            return getDashboard(dash.getId());
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Falha ao obter dashboard padrão");
            err.put("details", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    // Buscar widgets de um dashboard
    @GetMapping("/{dashboardId}/widgets")
    public ResponseEntity<List<Map<String, Object>>> getDashboardWidgets(@PathVariable Long dashboardId) {
        try {
            List<DashboardWidget> widgets = dashboardService.getWidgetsByDashboardId(dashboardId);
            if (widgets == null) {
                return ResponseEntity.ok(new java.util.ArrayList<>());
            }
            
            List<Map<String, Object>> widgetMaps = new java.util.ArrayList<>();
            for (DashboardWidget w : widgets) {
                Map<String, Object> widgetMap = new HashMap<>();
                widgetMap.put("id", w.getId());
                widgetMap.put("title", w.getTitle());
                widgetMap.put("widgetType", w.getWidgetType().toString());
                widgetMap.put("positionX", w.getPositionX());
                widgetMap.put("positionY", w.getPositionY());
                widgetMap.put("width", w.getWidth());
                widgetMap.put("height", w.getHeight());
                widgetMap.put("isVisible", w.getIsVisible());
                widgetMaps.add(widgetMap);
            }
            
            return ResponseEntity.ok(widgetMaps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Criar novo dashboard
    @PostMapping
    public ResponseEntity<Dashboard> createDashboard(@RequestBody Dashboard dashboard) {
        try {
            Dashboard savedDashboard = dashboardService.createDashboard(dashboard);
            return ResponseEntity.ok(savedDashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Atualizar dashboard
    @PutMapping("/{id}")
    public ResponseEntity<Dashboard> updateDashboard(@PathVariable Long id, @RequestBody Dashboard dashboard) {
        try {
            dashboard.setId(id);
            Dashboard updatedDashboard = dashboardService.updateDashboard(dashboard);
            return ResponseEntity.ok(updatedDashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Excluir dashboard
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDashboard(@PathVariable Long id) {
        try {
            dashboardService.deleteDashboard(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
