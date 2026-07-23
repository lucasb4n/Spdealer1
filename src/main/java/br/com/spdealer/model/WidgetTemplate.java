package br.com.spdealer.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "widget_templates")
public class WidgetTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Convert(converter = WidgetTypeConverter.class)
    @Column(name = "widget_type", nullable = false)
    private DashboardWidget.WidgetType widgetType;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    // Configurações padrão
    @Column(name = "default_width", nullable = false)
    private Integer defaultWidth = 300;
    
    @Column(name = "default_height", nullable = false)
    private Integer defaultHeight = 200;
    
    @Column(name = "default_visual_config", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode defaultVisualConfig;
    
    @Column(name = "default_behavior_config", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode defaultBehaviorConfig;
    
    // Controle de acesso
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", insertable = false, updatable = false)
    private User creator;
    
    // Constructors
    public WidgetTemplate() {}
    
    public WidgetTemplate(String name, DashboardWidget.WidgetType widgetType, String description) {
        this.name = name;
        this.widgetType = widgetType;
        this.description = description;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public DashboardWidget.WidgetType getWidgetType() {
        return widgetType;
    }
    
    public void setWidgetType(DashboardWidget.WidgetType widgetType) {
        this.widgetType = widgetType;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getDefaultWidth() {
        return defaultWidth;
    }
    
    public void setDefaultWidth(Integer defaultWidth) {
        this.defaultWidth = defaultWidth;
    }
    
    public Integer getDefaultHeight() {
        return defaultHeight;
    }
    
    public void setDefaultHeight(Integer defaultHeight) {
        this.defaultHeight = defaultHeight;
    }
    
    public JsonNode getDefaultVisualConfig() {
        return defaultVisualConfig;
    }
    
    public void setDefaultVisualConfig(JsonNode defaultVisualConfig) {
        this.defaultVisualConfig = defaultVisualConfig;
    }
    
    public JsonNode getDefaultBehaviorConfig() {
        return defaultBehaviorConfig;
    }
    
    public void setDefaultBehaviorConfig(JsonNode defaultBehaviorConfig) {
        this.defaultBehaviorConfig = defaultBehaviorConfig;
    }
    
    public Boolean getIsPublic() {
        return isPublic;
    }
    
    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }
    
    public Long getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public User getCreator() {
        return creator;
    }
    
    public void setCreator(User creator) {
        this.creator = creator;
    }
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "WidgetTemplate{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", widgetType=" + widgetType +
                ", description='" + description + '\'' +
                ", defaultWidth=" + defaultWidth +
                ", defaultHeight=" + defaultHeight +
                ", isPublic=" + isPublic +
                ", createdBy=" + createdBy +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}