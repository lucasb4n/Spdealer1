package br.com.spdealer.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dashboard_audit_log")
public class DashboardAuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "dashboard_id", nullable = false)
    private Long dashboardId;
    
    @Column(name = "widget_id")
    private Long widgetId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private AuditAction action;
    
    @Column(name = "old_config", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode oldConfig;
    
    @Column(name = "new_config", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode newConfig;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dashboard_id", insertable = false, updatable = false)
    private Dashboard dashboard;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "widget_id", insertable = false, updatable = false)
    private DashboardWidget widget;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    public enum AuditAction {
        CREATE("create"),
        UPDATE("update"),
        DELETE("delete"),
        MOVE("move"),
        RESIZE("resize");
        
        private final String value;
        
        AuditAction(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    // Constructors
    public DashboardAuditLog() {}
    
    public DashboardAuditLog(Long dashboardId, Long userId, AuditAction action) {
        this.dashboardId = dashboardId;
        this.userId = userId;
        this.action = action;
        this.createdAt = LocalDateTime.now();
    }
    
    public DashboardAuditLog(Long dashboardId, Long widgetId, Long userId, AuditAction action, 
                           JsonNode oldConfig, JsonNode newConfig) {
        this.dashboardId = dashboardId;
        this.widgetId = widgetId;
        this.userId = userId;
        this.action = action;
        this.oldConfig = oldConfig;
        this.newConfig = newConfig;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getDashboardId() {
        return dashboardId;
    }
    
    public void setDashboardId(Long dashboardId) {
        this.dashboardId = dashboardId;
    }
    
    public Long getWidgetId() {
        return widgetId;
    }
    
    public void setWidgetId(Long widgetId) {
        this.widgetId = widgetId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public AuditAction getAction() {
        return action;
    }
    
    public void setAction(AuditAction action) {
        this.action = action;
    }
    
    public JsonNode getOldConfig() {
        return oldConfig;
    }
    
    public void setOldConfig(JsonNode oldConfig) {
        this.oldConfig = oldConfig;
    }
    
    public JsonNode getNewConfig() {
        return newConfig;
    }
    
    public void setNewConfig(JsonNode newConfig) {
        this.newConfig = newConfig;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public Dashboard getDashboard() {
        return dashboard;
    }
    
    public void setDashboard(Dashboard dashboard) {
        this.dashboard = dashboard;
    }
    
    public DashboardWidget getWidget() {
        return widget;
    }
    
    public void setWidget(DashboardWidget widget) {
        this.widget = widget;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "DashboardAuditLog{" +
                "id=" + id +
                ", dashboardId=" + dashboardId +
                ", widgetId=" + widgetId +
                ", userId=" + userId +
                ", action=" + action +
                ", createdAt=" + createdAt +
                '}';
    }
}