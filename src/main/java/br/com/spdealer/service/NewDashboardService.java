package br.com.spdealer.service;

import br.com.spdealer.model.*;
import br.com.spdealer.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service("newDashboardService")
@Transactional
public class NewDashboardService {
    
    @Autowired
    private DashboardRepository dashboardRepository;
    
    @Autowired
    private DashboardWidgetRepository widgetRepository;
    
    @Autowired
    private WidgetTemplateRepository templateRepository;
    
    @Autowired
    private DashboardQueryRepository queryRepository;
    
    @Autowired
    private DashboardAuditLogRepository auditRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // ===== DASHBOARD MANAGEMENT =====
    
    /**
     * Criar novo dashboard para usuário
     */
    public Dashboard createDashboard(String name, String description, Long userId) {
        Dashboard dashboard = new Dashboard(name, userId);
        dashboard.setDescription(description);
        
        // Se for o primeiro dashboard, definir como padrão
        if (!dashboardRepository.existsByUserIdAndIsDefaultTrue(userId)) {
            dashboard.setIsDefault(true);
        }
        
        Dashboard saved = dashboardRepository.save(dashboard);
        
        // Log de auditoria
        logAudit(saved.getId(), null, userId, DashboardAuditLog.AuditAction.CREATE, null, null);
        
        return saved;
    }
    
    /**
     * Buscar dashboards do usuário
     */
    public List<Dashboard> getUserDashboards(Long userId) {
        return dashboardRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    /**
     * Buscar dashboard padrão do usuário
     */
    public Optional<Dashboard> getDefaultDashboard(Long userId) {
        return dashboardRepository.findByUserIdAndIsDefaultTrueAndIsActiveTrue(userId);
    }
    
    /**
     * Buscar dashboard por ID com validação de usuário
     */
    public Optional<Dashboard> getDashboardById(Long dashboardId, Long userId) {
        return dashboardRepository.findByIdAndUserId(dashboardId, userId);
    }

    /**
     * Buscar dashboard por ID com validação de usuário e widgets carregados
     * Evita LazyInitializationException ao acessar widgets fora da transação
     */
    public Optional<Dashboard> getDashboardByIdWithWidgets(Long dashboardId, Long userId) {
        Optional<Dashboard> dashOpt = dashboardRepository.findByIdAndUserId(dashboardId, userId);
        if (dashOpt.isPresent()) {
            Dashboard dash = dashOpt.get();
            List<DashboardWidget> widgets = widgetRepository.findByDashboardIdOrderByZIndexAsc(dashboardId);
            if (dash.getWidgets() == null) {
                dash.setWidgets(widgets);
            } else {
                dash.getWidgets().clear();
                dash.getWidgets().addAll(widgets);
            }
        }
        return dashOpt;
    }
    
    /**
     * Atualizar dashboard
     */
    public Dashboard updateDashboard(Long dashboardId, String name, String description, 
                                   JsonNode themeConfig, JsonNode canvasConfig, Long userId) {
        Optional<Dashboard> dashboardOpt = getDashboardById(dashboardId, userId);
        
        if (!dashboardOpt.isPresent()) {
            throw new IllegalArgumentException("Dashboard não encontrado ou sem permissão");
        }
        
        Dashboard dashboard = dashboardOpt.get();
        JsonNode oldConfig = createDashboardSnapshot(dashboard);
        
        dashboard.setName(name);
        dashboard.setDescription(description);
        dashboard.setThemeConfig(themeConfig);
        dashboard.setCanvasConfig(canvasConfig);
        
        Dashboard saved = dashboardRepository.save(dashboard);
        
        // Log de auditoria
        JsonNode newConfig = createDashboardSnapshot(saved);
        logAudit(dashboardId, null, userId, DashboardAuditLog.AuditAction.UPDATE, oldConfig, newConfig);
        
        return saved;
    }
    
    /**
     * Definir dashboard como padrão
     */
    public void setDefaultDashboard(Long dashboardId, Long userId) {
        Optional<Dashboard> dashboardOpt = getDashboardById(dashboardId, userId);
        
        if (!dashboardOpt.isPresent()) {
            throw new IllegalArgumentException("Dashboard não encontrado");
        }
        
        // Remover padrão atual
        dashboardRepository.unsetDefaultDashboard(userId);
        
        // Definir novo padrão
        Dashboard dashboard = dashboardOpt.get();
        dashboard.setIsDefault(true);
        dashboardRepository.save(dashboard);
    }
    
    /**
     * Excluir dashboard (soft delete)
     */
    public void deleteDashboard(Long dashboardId, Long userId) {
        Optional<Dashboard> dashboardOpt = getDashboardById(dashboardId, userId);
        
        if (!dashboardOpt.isPresent()) {
            throw new IllegalArgumentException("Dashboard não encontrado");
        }
        
        Dashboard dashboard = dashboardOpt.get();
        dashboard.setIsActive(false);
        dashboardRepository.save(dashboard);
        
        // Log de auditoria
        logAudit(dashboardId, null, userId, DashboardAuditLog.AuditAction.DELETE, null, null);
    }
    
    // ===== WIDGET MANAGEMENT =====
    
    /**
     * Adicionar widget ao dashboard
     */
    public DashboardWidget addWidget(Long dashboardId, Long templateId, Integer positionX, 
                                   Integer positionY, String title, Long userId) {
        // Validar dashboard
        Optional<Dashboard> dashboardOpt = getDashboardById(dashboardId, userId);
        if (!dashboardOpt.isPresent()) {
            throw new IllegalArgumentException("Dashboard não encontrado");
        }
        
        // Buscar template
        Optional<WidgetTemplate> templateOpt = templateRepository.findById(templateId);
        if (!templateOpt.isPresent()) {
            throw new IllegalArgumentException("Template não encontrado");
        }
        
        WidgetTemplate template = templateOpt.get();
        
        // Criar widget
        String widgetId = "widget_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        DashboardWidget widget = new DashboardWidget(widgetId, title, template.getWidgetType(), dashboardId);
        
        widget.setPositionX(positionX);
        widget.setPositionY(positionY);
        widget.setWidth(template.getDefaultWidth());
        widget.setHeight(template.getDefaultHeight());
        widget.setZIndex(widgetRepository.getNextZIndex(dashboardId));
        widget.setVisualConfig(template.getDefaultVisualConfig());
        widget.setBehaviorConfig(template.getDefaultBehaviorConfig());
        
        DashboardWidget saved = widgetRepository.save(widget);
        
        // Log de auditoria
        JsonNode newConfig = createWidgetSnapshot(saved);
        logAudit(dashboardId, saved.getId(), userId, DashboardAuditLog.AuditAction.CREATE, null, newConfig);
        
        return saved;
    }
    
    /**
     * Buscar widgets de um dashboard
     */
    public List<DashboardWidget> getDashboardWidgets(Long dashboardId, Long userId) {
        // Validar acesso ao dashboard
        if (!getDashboardById(dashboardId, userId).isPresent()) {
            throw new IllegalArgumentException("Dashboard não encontrado");
        }
        
        List<DashboardWidget> widgets = widgetRepository.findByDashboardIdAndIsVisibleTrueOrderByZIndexAsc(dashboardId);
        
        // 🔍 DEBUG: Log dos widgets sendo retornados
        System.out.println("[DEBUG getDashboardWidgets] dashboardId=" + dashboardId + ", userId=" + userId);
        System.out.println("[DEBUG getDashboardWidgets] Retornando " + widgets.size() + " widgets:");
        for (DashboardWidget w : widgets) {
            System.out.println("  - " + w.getWidgetId() + ": x=" + w.getPositionX() + ", y=" + w.getPositionY() + 
                             ", w=" + w.getWidth() + ", h=" + w.getHeight());
        }
        
        return widgets;
    }
    
    /**
     * Atualizar posição do widget
     */
    public DashboardWidget updateWidgetPosition(Long dashboardId, String widgetId, Integer positionX, 
                                              Integer positionY, Integer width, Integer height, Long userId) {
        DashboardWidget widget = getWidgetWithValidation(dashboardId, widgetId, userId);
        
        JsonNode oldConfig = createWidgetSnapshot(widget);
        
        widget.setPositionX(positionX);
        widget.setPositionY(positionY);
        widget.setWidth(width);
        widget.setHeight(height);
        
        DashboardWidget saved = widgetRepository.save(widget);
        
        // Log de auditoria
        JsonNode newConfig = createWidgetSnapshot(saved);
        logAudit(dashboardId, saved.getId(), userId, DashboardAuditLog.AuditAction.MOVE, oldConfig, newConfig);
        
        return saved;
    }
    
    /**
     * Atualizar configurações do widget
     */
    public DashboardWidget updateWidgetConfig(Long dashboardId, String widgetId, String title,
                                            JsonNode dataConfig, JsonNode visualConfig, 
                                            JsonNode behaviorConfig, Long userId) {
        DashboardWidget widget = getWidgetWithValidation(dashboardId, widgetId, userId);
        
        JsonNode oldConfig = createWidgetSnapshot(widget);
        
        widget.setTitle(title);
        widget.setDataConfig(dataConfig);
        widget.setVisualConfig(visualConfig);
        widget.setBehaviorConfig(behaviorConfig);
        
        DashboardWidget saved = widgetRepository.save(widget);
        
        // Log de auditoria
        JsonNode newConfig = createWidgetSnapshot(saved);
        logAudit(dashboardId, saved.getId(), userId, DashboardAuditLog.AuditAction.UPDATE, oldConfig, newConfig);
        
        return saved;
    }

    /**
     * Create or update a widget using a full payload (used by import functionality).
     * If widgetId exists, update; otherwise create a new widget (using a default template fallback).
     */
    public DashboardWidget createOrUpdateWidgetFromPayload(Long dashboardId, JsonNode widgetPayload, Long userId) {
        String widgetId = widgetPayload.hasNonNull("widgetId") ? widgetPayload.get("widgetId").asText() : null;
        String title = widgetPayload.hasNonNull("title") ? widgetPayload.get("title").asText() : "";
        Integer positionX = widgetPayload.hasNonNull("positionX") ? widgetPayload.get("positionX").asInt() : 0;
        Integer positionY = widgetPayload.hasNonNull("positionY") ? widgetPayload.get("positionY").asInt() : 0;
        Integer width = widgetPayload.hasNonNull("width") ? widgetPayload.get("width").asInt() : 300;
        Integer height = widgetPayload.hasNonNull("height") ? widgetPayload.get("height").asInt() : 200;
        Integer zIndex = widgetPayload.hasNonNull("zIndex") ? widgetPayload.get("zIndex").asInt() : widgetRepository.getNextZIndex(dashboardId);
        JsonNode visualConfig = widgetPayload.hasNonNull("visualConfig") ? widgetPayload.get("visualConfig") : null;
        JsonNode behaviorConfig = widgetPayload.hasNonNull("behaviorConfig") ? widgetPayload.get("behaviorConfig") : null;
        JsonNode dataConfig = widgetPayload.hasNonNull("dataConfig") ? widgetPayload.get("dataConfig") : null;
        String widgetTypeStr = widgetPayload.hasNonNull("widgetType") ? widgetPayload.get("widgetType").asText() : "kpi";

        DashboardWidget existing = null;
        if (widgetId != null) {
            Optional<DashboardWidget> opt = widgetRepository.findByDashboardIdAndWidgetId(dashboardId, widgetId);
            if (opt.isPresent()) existing = opt.get();
        }

        if (existing != null) {
            // Update
            existing.setTitle(title);
            existing.setPositionX(positionX);
            existing.setPositionY(positionY);
            existing.setWidth(width);
            existing.setHeight(height);
            existing.setZIndex(zIndex);
            if (visualConfig != null) existing.setVisualConfig(visualConfig);
            if (behaviorConfig != null) existing.setBehaviorConfig(behaviorConfig);
            if (dataConfig != null) existing.setDataConfig(dataConfig);
            DashboardWidget saved = widgetRepository.save(existing);
            logAudit(dashboardId, saved.getId(), userId, DashboardAuditLog.AuditAction.UPDATE, null, createWidgetSnapshot(saved));
            return saved;
        } else {
            // Create using fallback template
            // Find any available template as fallback
            List<WidgetTemplate> allTemplates = templateRepository.findAll();
            Long fallbackTemplateId = allTemplates.isEmpty() ? 1L : allTemplates.get(0).getId();
            DashboardWidget created = addWidget(dashboardId, fallbackTemplateId, positionX, positionY, title, userId);
            // apply overrides
            created.setWidth(width);
            created.setHeight(height);
            created.setZIndex(zIndex);
            if (visualConfig != null) created.setVisualConfig(visualConfig);
            if (behaviorConfig != null) created.setBehaviorConfig(behaviorConfig);
            if (dataConfig != null) created.setDataConfig(dataConfig);
            // if widgetId provided, set as external id
            if (widgetId != null) created.setWidgetId(widgetId);
            DashboardWidget saved = widgetRepository.save(created);
            logAudit(dashboardId, saved.getId(), userId, DashboardAuditLog.AuditAction.CREATE, null, createWidgetSnapshot(saved));
            return saved;
        }
    }
    
    /**
     * Remover widget
     */
    public void removeWidget(Long dashboardId, String widgetId, Long userId) {
        DashboardWidget widget = getWidgetWithValidation(dashboardId, widgetId, userId);
        
        JsonNode oldConfig = createWidgetSnapshot(widget);
        
        widgetRepository.delete(widget);
        
        // Log de auditoria
        logAudit(dashboardId, widget.getId(), userId, DashboardAuditLog.AuditAction.DELETE, oldConfig, null);
    }
    
    // ===== TEMPLATE MANAGEMENT =====
    
    /**
     * Buscar templates disponíveis para o usuário
     */
    public List<WidgetTemplate> getAvailableTemplates(Long userId) {
        return templateRepository.findAvailableForUser(userId);
    }
    
    /**
     * Buscar templates por tipo
     */
    public List<WidgetTemplate> getTemplatesByType(DashboardWidget.WidgetType widgetType, Long userId) {
        return templateRepository.findByWidgetTypeAvailableForUser(widgetType, userId);
    }
    
    /**
     * Criar template personalizado
     */
    public WidgetTemplate createTemplate(String name, String description, DashboardWidget.WidgetType widgetType,
                                       Integer defaultWidth, Integer defaultHeight, JsonNode visualConfig,
                                       JsonNode behaviorConfig, Boolean isPublic, Long userId) {
        WidgetTemplate template = new WidgetTemplate(name, widgetType, description);
        template.setDefaultWidth(defaultWidth);
        template.setDefaultHeight(defaultHeight);
        template.setDefaultVisualConfig(visualConfig);
        template.setDefaultBehaviorConfig(behaviorConfig);
        template.setIsPublic(isPublic);
        template.setCreatedBy(userId);
        
        return templateRepository.save(template);
    }
    
    // ===== QUERY MANAGEMENT =====
    
    /**
     * Buscar queries disponíveis para o usuário
     */
    public List<DashboardQuery> getAvailableQueries(Long userId) {
        return queryRepository.findAvailableForUser(userId);
    }
    
    /**
     * Executar query com validação de permissão
     */
    public Optional<DashboardQuery> getQueryWithPermission(Long queryId, Long userId) {
        return queryRepository.findByIdWithPermission(queryId, userId);
    }
    
    /**
     * Criar query personalizada
     */
    public DashboardQuery createQuery(String name, String description, String sqlQuery, 
                                    JsonNode parameters, Boolean isPublic, JsonNode allowedUsers, Long userId) {
        DashboardQuery query = new DashboardQuery(name, description, sqlQuery, userId);
        query.setParameters(parameters);
        query.setIsPublic(isPublic);
        query.setAllowedUsers(allowedUsers);
        
        return queryRepository.save(query);
    }
    
    // ===== UTILITY METHODS =====
    
    private DashboardWidget getWidgetWithValidation(Long dashboardId, String widgetId, Long userId) {
        // Validar acesso ao dashboard
        if (!getDashboardById(dashboardId, userId).isPresent()) {
            throw new IllegalArgumentException("Dashboard não encontrado");
        }
        
        // Buscar widget
        Optional<DashboardWidget> widgetOpt = widgetRepository.findByDashboardIdAndWidgetId(dashboardId, widgetId);
        if (!widgetOpt.isPresent()) {
            throw new IllegalArgumentException("Widget não encontrado");
        }
        
        DashboardWidget widget = widgetOpt.get();
        if (widget.getIsLocked()) {
            throw new IllegalArgumentException("Widget está bloqueado para edição");
        }
        
        return widget;
    }
    
    private void logAudit(Long dashboardId, Long widgetId, Long userId, DashboardAuditLog.AuditAction action,
                         JsonNode oldConfig, JsonNode newConfig) {
        DashboardAuditLog log = new DashboardAuditLog(dashboardId, widgetId, userId, action, oldConfig, newConfig);
        auditRepository.save(log);
    }
    
    private JsonNode createDashboardSnapshot(Dashboard dashboard) {
        try {
            return objectMapper.valueToTree(dashboard);
        } catch (Exception e) {
            return null;
        }
    }
    
    private JsonNode createWidgetSnapshot(DashboardWidget widget) {
        try {
            return objectMapper.valueToTree(widget);
        } catch (Exception e) {
            return null;
        }
    }

    // ===== NEW METHODS FOR REST API =====
    
    /**
     * Buscar dashboard padrão do usuário atual
     */
    public Dashboard getDefaultDashboardForCurrentUser() {
        // TODO: Implementar obtenção do usuário atual do contexto de segurança
        Long currentUserId = getCurrentUserId();
        return getDefaultDashboardForUser(currentUserId);
    }
    
    /**
     * Buscar dashboard padrão de um usuário específico
     */
    public Dashboard getDefaultDashboardForUser(Long userId) {
        Optional<Dashboard> dashboard = dashboardRepository.findByUserIdAndIsDefaultTrue(userId);
        if (dashboard.isPresent()) {
            Dashboard dash = dashboard.get();
            // Carrega widgets para evitar lazy em endpoints REST
            List<DashboardWidget> widgets = widgetRepository.findByDashboardIdOrderByZIndexAsc(dash.getId());
            if (dash.getWidgets() == null) {
                dash.setWidgets(widgets);
            } else {
                dash.getWidgets().clear();
                dash.getWidgets().addAll(widgets);
            }
            return dash;
        }
        return null;
    }
    
    /**
     * Buscar dashboard com widgets carregados
     */
    public Dashboard getDashboardWithWidgets(Long dashboardId) {
        Optional<Dashboard> dashboard = dashboardRepository.findById(dashboardId);
        if (dashboard.isPresent()) {
            Dashboard dash = dashboard.get();
            // Carregar widgets do dashboard
            List<DashboardWidget> widgets = widgetRepository.findByDashboardIdOrderByPositionY(dashboardId);
            if (dash.getWidgets() == null) {
                dash.setWidgets(widgets);
            } else {
                dash.getWidgets().clear();
                dash.getWidgets().addAll(widgets);
            }
            return dash;
        }
        return null;
    }
    
    /**
     * Buscar todos os dashboards do usuário atual
     */
    public List<Dashboard> getDashboardsForCurrentUser() {
        Long currentUserId = getCurrentUserId();
        return dashboardRepository.findByUserIdOrderByIsDefaultDesc(currentUserId);
    }
    
    /**
     * Criar dashboard com validação
     */
    public Dashboard createDashboard(Dashboard dashboard) {
        if (dashboard.getUserId() == null) {
            dashboard.setUserId(getCurrentUserId());
        }
        return createDashboard(dashboard.getName(), dashboard.getDescription(), dashboard.getUserId());
    }
    
    /**
     * Atualizar dashboard existente
     */
    public Dashboard updateDashboard(Dashboard dashboard) {
        Optional<Dashboard> existingOpt = dashboardRepository.findById(dashboard.getId());
        if (existingOpt.isPresent()) {
            Dashboard existing = existingOpt.get();
            
            // Verificar se o usuário tem permissão
            if (!existing.getUserId().equals(getCurrentUserId())) {
                throw new RuntimeException("Usuário não tem permissão para editar este dashboard");
            }
            
            existing.setName(dashboard.getName());
            existing.setDescription(dashboard.getDescription());
            existing.setThemeConfig(dashboard.getThemeConfig());
            existing.setCanvasConfig(dashboard.getCanvasConfig());
            existing.setIsActive(dashboard.getIsActive());
            
            return dashboardRepository.save(existing);
        }
        return null;
    }
    
    /**
     * Deletar dashboard
     */
    public boolean deleteDashboard(Long dashboardId) {
        Optional<Dashboard> dashboard = dashboardRepository.findById(dashboardId);
        if (dashboard.isPresent()) {
            Dashboard dash = dashboard.get();
            
            // Verificar se o usuário tem permissão
            if (!dash.getUserId().equals(getCurrentUserId())) {
                throw new RuntimeException("Usuário não tem permissão para deletar este dashboard");
            }
            
            dashboardRepository.deleteById(dashboardId);
            return true;
        }
        return false;
    }
    
    /**
     * Buscar widgets por dashboard ID
     */
    public List<DashboardWidget> getWidgetsByDashboardId(Long dashboardId) {
        return widgetRepository.findByDashboardIdOrderByPositionY(dashboardId);
    }
    
    /**
     * Obter ID do usuário atual (placeholder - implementar com Spring Security)
     */
    private Long getCurrentUserId() {
        // TODO: Implementar com Spring Security Context
        // Por enquanto, retorna ID fixo para demonstração
        return 1L;
    }

    // Public wrapper to expose current user id for controllers when necessary
    public Long getCurrentUserIdPublic() {
        return getCurrentUserId();
    }
}