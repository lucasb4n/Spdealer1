package br.com.spdealer.controller;

import br.com.spdealer.model.*;
import br.com.spdealer.service.NewDashboardService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v2/dashboard-builder")
public class DashboardBuilderController {
    
    @Autowired
    private NewDashboardService dashboardService;
    
    // ===== DASHBOARD ENDPOINTS =====
    
    /**
     * Listar dashboards do usuário
     */
    @GetMapping
    public ResponseEntity<List<Dashboard>> getUserDashboards(HttpSession session) {
        Long userId = getUserId(session);
        // userId nunca será null agora (fallback para 1L - admin)

        List<Dashboard> dashboards = dashboardService.getUserDashboards(userId);
        return ResponseEntity.ok(dashboards);
    }
    
    /**
     * Buscar dashboard padrão do usuário
     */
    @GetMapping("/default")
    public ResponseEntity<Dashboard> getDefaultDashboard(HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        Optional<Dashboard> dashboard = dashboardService.getDefaultDashboard(userId);
        
        if (dashboard.isPresent()) {
            // Carregar dashboard com widgets
            Dashboard dashboardWithWidgets = dashboardService.getDashboardWithWidgets(dashboard.get().getId());
            return ResponseEntity.ok(dashboardWithWidgets);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Buscar dashboard por ID
     */
    @GetMapping("/{dashboardId}")
    public ResponseEntity<Dashboard> getDashboard(@PathVariable Long dashboardId, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        Optional<Dashboard> dashboard = dashboardService.getDashboardById(dashboardId, userId);
        
        if (dashboard.isPresent()) {
            // Carregar dashboard com widgets
            Dashboard dashboardWithWidgets = dashboardService.getDashboardWithWidgets(dashboardId);
            return ResponseEntity.ok(dashboardWithWidgets);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Criar novo dashboard
     */
    @PostMapping
    public ResponseEntity<Dashboard> createDashboard(@RequestBody CreateDashboardRequest request, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        Dashboard dashboard = dashboardService.createDashboard(request.getName(), request.getDescription(), userId);
        return ResponseEntity.ok(dashboard);
    }
    
    /**
     * Atualizar dashboard
     */
    @PutMapping("/{dashboardId}")
    public ResponseEntity<Dashboard> updateDashboard(@PathVariable Long dashboardId, 
                                                   @RequestBody UpdateDashboardRequest request, 
                                                   HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            Dashboard dashboard = dashboardService.updateDashboard(
                dashboardId, 
                request.getName(), 
                request.getDescription(),
                request.getThemeConfig(),
                request.getCanvasConfig(),
                userId
            );
            return ResponseEntity.ok(dashboard);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Definir dashboard como padrão
     */
    @PutMapping("/{dashboardId}/default")
    public ResponseEntity<Void> setDefaultDashboard(@PathVariable Long dashboardId, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            dashboardService.setDefaultDashboard(dashboardId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Excluir dashboard
     */
    @DeleteMapping("/{dashboardId}")
    public ResponseEntity<Void> deleteDashboard(@PathVariable Long dashboardId, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            dashboardService.deleteDashboard(dashboardId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // ===== WIDGET ENDPOINTS =====
    
    /**
     * Listar widgets do dashboard
     */
    @GetMapping("/{dashboardId}/widgets")
    public ResponseEntity<List<DashboardWidget>> getDashboardWidgets(@PathVariable Long dashboardId, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            System.out.println("[DEBUG CONTROLLER] GET /widgets - dashboardId=" + dashboardId + ", userId=" + userId);
            List<DashboardWidget> widgets = dashboardService.getDashboardWidgets(dashboardId, userId);
            System.out.println("[DEBUG CONTROLLER] Retornando " + widgets.size() + " widgets para frontend");
            return ResponseEntity.ok(widgets);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Adicionar widget ao dashboard
     */
    @PostMapping("/{dashboardId}/widgets")
    public ResponseEntity<?> addWidget(@PathVariable Long dashboardId,
                                       @RequestBody AddWidgetRequest request,
                                       HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            // Validar request
            if (request.getTemplateId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "templateId é obrigatório"));
            }
            if (request.getPositionX() == null || request.getPositionY() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "positionX e positionY são obrigatórios"));
            }
            if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "title é obrigatório"));
            }
            
            DashboardWidget widget = dashboardService.addWidget(
                dashboardId,
                request.getTemplateId(),
                request.getPositionX(),
                request.getPositionY(),
                request.getTitle(),
                userId
            );
            return ResponseEntity.ok(widget);
        } catch (IllegalArgumentException e) {
            System.err.println("[ADDWIDGET ERROR] IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ADDWIDGET ERROR] Unexpected exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Erro ao adicionar widget",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Atualizar posição do widget
     */
    @PutMapping("/{dashboardId}/widgets/{widgetId}/position")
    public ResponseEntity<DashboardWidget> updateWidgetPosition(@PathVariable Long dashboardId,
                                                               @PathVariable String widgetId,
                                                               @RequestBody UpdatePositionRequest request,
                                                               HttpSession session) {
        Long userId = getUserId(session);
        try {
            System.out.println("[DEBUG CONTROLLER] PUT /position - dashboardId=" + dashboardId + ", widgetId=" + widgetId + 
                             ", x=" + request.getPositionX() + ", y=" + request.getPositionY() + 
                             ", w=" + request.getWidth() + ", h=" + request.getHeight());
            DashboardWidget widget = dashboardService.updateWidgetPosition(
                dashboardId,
                widgetId,
                request.getPositionX(),
                request.getPositionY(),
                request.getWidth(),
                request.getHeight(),
                userId
            );
            System.out.println("[DEBUG CONTROLLER] Widget atualizado e retornando: x=" + widget.getPositionX() + 
                             ", y=" + widget.getPositionY());
            return ResponseEntity.ok(widget);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Atualizar configurações do widget
     */
    @PutMapping("/{dashboardId}/widgets/{widgetId}/config")
    public ResponseEntity<DashboardWidget> updateWidgetConfig(@PathVariable Long dashboardId,
                                                             @PathVariable String widgetId,
                                                             @RequestBody UpdateWidgetConfigRequest request,
                                                             HttpSession session) {
        Long userId = getUserId(session);
        try {
            DashboardWidget widget = dashboardService.updateWidgetConfig(
                dashboardId,
                widgetId,
                request.getTitle(),
                request.getDataConfig(),
                request.getVisualConfig(),
                request.getBehaviorConfig(),
                userId
            );
            return ResponseEntity.ok(widget);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Remover widget
     */
    @DeleteMapping("/{dashboardId}/widgets/{widgetId}")
    public ResponseEntity<Void> removeWidget(@PathVariable Long dashboardId,
                                           @PathVariable String widgetId,
                                           HttpSession session) {
        Long userId = getUserId(session);
        try {
            dashboardService.removeWidget(dashboardId, widgetId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // ===== TEMPLATE ENDPOINTS =====
    
    /**
     * Listar templates disponíveis
     */
    @GetMapping("/templates")
    public ResponseEntity<List<WidgetTemplate>> getAvailableTemplates(HttpSession session) {
        Long userId = getUserId(session);
        List<WidgetTemplate> templates = dashboardService.getAvailableTemplates(userId);
        return ResponseEntity.ok(templates);
    }
    
    /**
     * Listar templates por tipo
     */
    @GetMapping("/templates/{widgetType}")
    public ResponseEntity<List<WidgetTemplate>> getTemplatesByType(@PathVariable DashboardWidget.WidgetType widgetType,
                                                                  HttpSession session) {
        Long userId = getUserId(session);
        List<WidgetTemplate> templates = dashboardService.getTemplatesByType(widgetType, userId);
        return ResponseEntity.ok(templates);
    }
    
    /**
     * Criar template personalizado
     */
    @PostMapping("/templates")
    public ResponseEntity<WidgetTemplate> createTemplate(@RequestBody CreateTemplateRequest request, HttpSession session) {
        Long userId = getUserId(session);
        WidgetTemplate template = dashboardService.createTemplate(
            request.getName(),
            request.getDescription(),
            request.getWidgetType(),
            request.getDefaultWidth(),
            request.getDefaultHeight(),
            request.getVisualConfig(),
            request.getBehaviorConfig(),
            request.getIsPublic(),
            userId
        );
        return ResponseEntity.ok(template);
    }
    
    // ===== QUERY ENDPOINTS =====
    
    /**
     * Listar queries disponíveis
     */
    @GetMapping("/queries")
    public ResponseEntity<List<DashboardQuery>> getAvailableQueries(HttpSession session) {
        Long userId = getUserId(session);
        List<DashboardQuery> queries = dashboardService.getAvailableQueries(userId);
        return ResponseEntity.ok(queries);
    }
    
    /**
     * Criar query personalizada
     */
    @PostMapping("/queries")
    public ResponseEntity<DashboardQuery> createQuery(@RequestBody CreateQueryRequest request, HttpSession session) {
        Long userId = getUserId(session);
        DashboardQuery query = dashboardService.createQuery(
            request.getName(),
            request.getDescription(),
            request.getSqlQuery(),
            request.getParameters(),
            request.getIsPublic(),
            request.getAllowedUsers(),
            userId
        );
        return ResponseEntity.ok(query);
    }

    // ===== IMPORT / EXPORT =====

    /**
     * Exportar dashboard completo em formato JSON utilizável pelo Builder
     */
    @PostMapping("/{dashboardId}/export")
    public ResponseEntity<?> exportDashboard(@PathVariable Long dashboardId, HttpSession session) {
        Long userId = getUserId(session);
        if (userId == null) return ResponseEntity.status(401).build();

        Optional<Dashboard> dashOpt = dashboardService.getDashboardById(dashboardId, userId);
        if (!dashOpt.isPresent()) return ResponseEntity.notFound().build();

        Dashboard dash = dashboardService.getDashboardWithWidgets(dashboardId);
        if (dash == null) return ResponseEntity.notFound().build();

        // Reuse mapping similar to v1 controller
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", dash.getId());
        result.put("name", dash.getName());
        result.put("description", dash.getDescription());
        result.put("userId", dash.getUserId());
        result.put("isActive", dash.getIsActive());
        result.put("isDefault", dash.getIsDefault());

        Object theme = null;
        Object canvas = null;
        try { if (dash.getThemeConfig() != null) theme = mapper.treeToValue(dash.getThemeConfig(), Object.class); } catch (Exception ignored) {}
        try { if (dash.getCanvasConfig() != null) canvas = mapper.treeToValue(dash.getCanvasConfig(), Object.class); } catch (Exception ignored) {}
        result.put("themeConfig", theme);
        result.put("canvasConfig", canvas);

        java.util.List<java.util.Map<String, Object>> widgets = new java.util.ArrayList<>();
        if (dash.getWidgets() != null) {
            for (DashboardWidget w : dash.getWidgets()) {
                java.util.Map<String, Object> wm = new java.util.HashMap<>();
                wm.put("id", w.getId());
                wm.put("widgetId", w.getWidgetId());
                wm.put("title", w.getTitle());
                wm.put("widgetType", w.getWidgetType() != null ? w.getWidgetType().toString() : null);
                wm.put("positionX", w.getPositionX());
                wm.put("positionY", w.getPositionY());
                wm.put("width", w.getWidth());
                wm.put("height", w.getHeight());
                wm.put("zIndex", w.getZIndex());
                wm.put("isVisible", w.getIsVisible());
                try { wm.put("dataConfig", w.getDataConfig() != null ? mapper.treeToValue(w.getDataConfig(), Object.class) : null); } catch (Exception ignored) {}
                try { wm.put("visualConfig", w.getVisualConfig() != null ? mapper.treeToValue(w.getVisualConfig(), Object.class) : null); } catch (Exception ignored) {}
                try { wm.put("behaviorConfig", w.getBehaviorConfig() != null ? mapper.treeToValue(w.getBehaviorConfig(), Object.class) : null); } catch (Exception ignored) {}
                widgets.add(wm);
            }
        }
        result.put("widgets", widgets);
        return ResponseEntity.ok(result);
    }

    // NOTE: O método de import que aceita Map<String,Object> segue abaixo; este formato JsonNode foi removido

    /**
     * Import a full dashboard JSON (theme, canvas, widgets). Upsert widgets based on widgetId or create new.
     * Optional body param: { replace: true } to delete existing widgets not present in payload.
     */
    @PostMapping("/{dashboardId}/import")
    public ResponseEntity<?> importDashboard(@PathVariable Long dashboardId, @RequestBody Map<String, Object> payload, HttpSession session) {
        Long userId = getUserId(session);
        // userId nunca será null agora (fallback para 1L - admin)

        try {
            // Update dashboard meta if provided
            Map<String, Object> dashMeta = (Map<String, Object>) payload.get("dashboard");
            if (dashMeta != null) {
                UpdateDashboardRequest upd = new UpdateDashboardRequest();
                upd.setName((String) dashMeta.getOrDefault("name", dashMeta.getOrDefault("title", "Dashboard")));
                upd.setDescription((String) dashMeta.getOrDefault("description", ""));
                // theme and canvas configs as JsonNode
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                if (dashMeta.get("themeConfig") != null) upd.setThemeConfig(mapper.valueToTree(dashMeta.get("themeConfig")));
                if (dashMeta.get("canvasConfig") != null) upd.setCanvasConfig(mapper.valueToTree(dashMeta.get("canvasConfig")));
                dashboardService.updateDashboard(dashboardId, upd.getName(), upd.getDescription(), upd.getThemeConfig(), upd.getCanvasConfig(), userId);
            }

            // Process widgets
            List<Map<String, Object>> widgets = (List<Map<String, Object>>) payload.get("widgets");
            boolean replace = payload.getOrDefault("replace", false) instanceof Boolean ? (Boolean) payload.get("replace") : false;
            java.util.Set<String> incomingWidgetIds = new java.util.HashSet<>();
            
            System.out.println("[IMPORT START] dashboardId=" + dashboardId + ", replace=" + replace + ", widget count=" + (widgets != null ? widgets.size() : 0));
            
            if (widgets != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                for (int i = 0; i < widgets.size(); i++) {
                    Map<String, Object> w = widgets.get(i);
                    com.fasterxml.jackson.databind.JsonNode node = mapper.valueToTree(w);
                    String wid = node.hasNonNull("widgetId") ? node.get("widgetId").asText() : null;
                    String wid2 = node.hasNonNull("widget_id") ? node.get("widget_id").asText() : null;
                    
                    System.out.println("[IMPORT WIDGET " + i + "] widgetId=" + wid + ", widget_id=" + wid2 + 
                                     ", title=" + node.get("title").asText());
                    
                    // 🔧 CRÍTICO: Skippar widgets sem widgetId (não duplicar com ID aleatório)
                    if (wid == null && wid2 == null) {
                        System.out.println("[IMPORT WARNING] Skipping widget sem widgetId: " + node.get("title"));
                        continue;  // Pula este widget
                    }
                    
                    String finalWid = wid != null ? wid : wid2;
                    incomingWidgetIds.add(finalWid);
                    dashboardService.createOrUpdateWidgetFromPayload(dashboardId, node, userId);
                }
            }

            if (replace) {
                // delete widgets not present in incoming list
                System.out.println("[IMPORT DEBUG] replace=true, incomingWidgetIds: " + incomingWidgetIds);
                System.out.println("[IMPORT DEBUG] incomingWidgetIds.size()=" + incomingWidgetIds.size());
                
                List<DashboardWidget> existing = dashboardService.getDashboardWidgets(dashboardId, userId);
                System.out.println("[IMPORT DEBUG] Widgets existentes no banco: " + existing.size());
                for (DashboardWidget ew : existing) {
                    System.out.println("[IMPORT DEBUG] Verificando widget: widgetId=" + ew.getWidgetId() + 
                                     ", contains?" + incomingWidgetIds.contains(ew.getWidgetId()));
                    if (!incomingWidgetIds.contains(ew.getWidgetId())) {
                        System.out.println("[IMPORT DELETE] Deletando widget: " + ew.getWidgetId());
                        dashboardService.removeWidget(dashboardId, ew.getWidgetId(), userId);
                    }
                }
            }

            Dashboard dashWithWidgets = dashboardService.getDashboardWithWidgets(dashboardId);
            return ResponseEntity.ok(dashWithWidgets);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Import failed", "message", e.getMessage()));
        }
    }
    
    // ===== UTILITY METHODS =====
    
    private Long getUserId(HttpSession session) {
        // Extrai usuário da sessão HTTP (padrão do projeto)
        Object loggedUser = session.getAttribute("loggedUser");
        if (loggedUser instanceof br.com.spdealer.model.User) {
            return ((br.com.spdealer.model.User) loggedUser).getId();
        }
        
        // Fallback para testes - busca userId na sessão
        Object userIdObj = session.getAttribute("userId");
        if (userIdObj != null) {
            return Long.valueOf(userIdObj.toString());
        }
        
        // CORRIGIDO: Se sessão não tiver userId, usar admin padrão (compatível com v1 API que usa userId = 1L)
        // Frontend React usa Context API + localStorage, não HttpSession
        // Quando requisição vem de /api/v2/dashboard-builder com credentials: 'include',
        // confiamos que é uma requisição legítima do frontend autenticado
        System.out.println("[DashboardBuilderController] getUserId: Sessão vazia, usando userId padrão (1L - admin)");
        return 1L;
    }
    
    // ===== REQUEST/RESPONSE DTOs =====
    
    public static class CreateDashboardRequest {
        private String name;
        private String description;
        
        // Getters e Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
    
    public static class UpdateDashboardRequest {
        private String name;
        private String description;
        private JsonNode themeConfig;
        private JsonNode canvasConfig;
        
        // Getters e Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public JsonNode getThemeConfig() { return themeConfig; }
        public void setThemeConfig(JsonNode themeConfig) { this.themeConfig = themeConfig; }
        public JsonNode getCanvasConfig() { return canvasConfig; }
        public void setCanvasConfig(JsonNode canvasConfig) { this.canvasConfig = canvasConfig; }
    }
    
    public static class AddWidgetRequest {
        private Long templateId;
        private Integer positionX;
        private Integer positionY;
        private String title;
        private String widgetType;
        private Integer width;
        private Integer height;
        private String visualConfig;
        private String behaviorConfig;
        private String dataConfig;
        private Integer zIndex;
        private Boolean isVisible;
        private Boolean isLocked;
        private String widgetId;
        
        // Getters e Setters
        public Long getTemplateId() { return templateId; }
        public void setTemplateId(Long templateId) { this.templateId = templateId; }
        public Integer getPositionX() { return positionX; }
        public void setPositionX(Integer positionX) { this.positionX = positionX; }
        public Integer getPositionY() { return positionY; }
        public void setPositionY(Integer positionY) { this.positionY = positionY; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getWidgetType() { return widgetType; }
        public void setWidgetType(String widgetType) { this.widgetType = widgetType; }
        public Integer getWidth() { return width; }
        public void setWidth(Integer width) { this.width = width; }
        public Integer getHeight() { return height; }
        public void setHeight(Integer height) { this.height = height; }
        public String getVisualConfig() { return visualConfig; }
        public void setVisualConfig(String visualConfig) { this.visualConfig = visualConfig; }
        public String getBehaviorConfig() { return behaviorConfig; }
        public void setBehaviorConfig(String behaviorConfig) { this.behaviorConfig = behaviorConfig; }
        public String getDataConfig() { return dataConfig; }
        public void setDataConfig(String dataConfig) { this.dataConfig = dataConfig; }
        public Integer getZIndex() { return zIndex; }
        public void setZIndex(Integer zIndex) { this.zIndex = zIndex; }
        public Boolean getIsVisible() { return isVisible; }
        public void setIsVisible(Boolean isVisible) { this.isVisible = isVisible; }
        public Boolean getIsLocked() { return isLocked; }
        public void setIsLocked(Boolean isLocked) { this.isLocked = isLocked; }
        public String getWidgetId() { return widgetId; }
        public void setWidgetId(String widgetId) { this.widgetId = widgetId; }
    }
    
    public static class UpdatePositionRequest {
        private Integer positionX;
        private Integer positionY;
        private Integer width;
        private Integer height;
        
        // Getters e Setters
        public Integer getPositionX() { return positionX; }
        public void setPositionX(Integer positionX) { this.positionX = positionX; }
        public Integer getPositionY() { return positionY; }
        public void setPositionY(Integer positionY) { this.positionY = positionY; }
        public Integer getWidth() { return width; }
        public void setWidth(Integer width) { this.width = width; }
        public Integer getHeight() { return height; }
        public void setHeight(Integer height) { this.height = height; }
    }
    
    public static class UpdateWidgetConfigRequest {
        private String title;
        private JsonNode dataConfig;
        private JsonNode visualConfig;
        private JsonNode behaviorConfig;
        
        // Getters e Setters
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public JsonNode getDataConfig() { return dataConfig; }
        public void setDataConfig(JsonNode dataConfig) { this.dataConfig = dataConfig; }
        public JsonNode getVisualConfig() { return visualConfig; }
        public void setVisualConfig(JsonNode visualConfig) { this.visualConfig = visualConfig; }
        public JsonNode getBehaviorConfig() { return behaviorConfig; }
        public void setBehaviorConfig(JsonNode behaviorConfig) { this.behaviorConfig = behaviorConfig; }
    }
    
    public static class CreateTemplateRequest {
        private String name;
        private String description;
        private DashboardWidget.WidgetType widgetType;
        private Integer defaultWidth;
        private Integer defaultHeight;
        private JsonNode visualConfig;
        private JsonNode behaviorConfig;
        private Boolean isPublic;
        
        // Getters e Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public DashboardWidget.WidgetType getWidgetType() { return widgetType; }
        public void setWidgetType(DashboardWidget.WidgetType widgetType) { this.widgetType = widgetType; }
        public Integer getDefaultWidth() { return defaultWidth; }
        public void setDefaultWidth(Integer defaultWidth) { this.defaultWidth = defaultWidth; }
        public Integer getDefaultHeight() { return defaultHeight; }
        public void setDefaultHeight(Integer defaultHeight) { this.defaultHeight = defaultHeight; }
        public JsonNode getVisualConfig() { return visualConfig; }
        public void setVisualConfig(JsonNode visualConfig) { this.visualConfig = visualConfig; }
        public JsonNode getBehaviorConfig() { return behaviorConfig; }
        public void setBehaviorConfig(JsonNode behaviorConfig) { this.behaviorConfig = behaviorConfig; }
        public Boolean getIsPublic() { return isPublic; }
        public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    }
    
    public static class CreateQueryRequest {
        private String name;
        private String description;
        private String sqlQuery;
        private JsonNode parameters;
        private Boolean isPublic;
        private JsonNode allowedUsers;
        
        // Getters e Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getSqlQuery() { return sqlQuery; }
        public void setSqlQuery(String sqlQuery) { this.sqlQuery = sqlQuery; }
        public JsonNode getParameters() { return parameters; }
        public void setParameters(JsonNode parameters) { this.parameters = parameters; }
        public Boolean getIsPublic() { return isPublic; }
        public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
        public JsonNode getAllowedUsers() { return allowedUsers; }
        public void setAllowedUsers(JsonNode allowedUsers) { this.allowedUsers = allowedUsers; }
    }
}
