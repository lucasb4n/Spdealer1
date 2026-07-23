package br.com.spdealer.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import br.com.spdealer.config.WidgetTypeDeserializer;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dashboard_widgets")
public class DashboardWidget {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonProperty("dashboard_id")
    @Column(name = "dashboard_id", nullable = false)
    private Long dashboardId;
    
    @JsonProperty("widget_type")
    @JsonDeserialize(using = WidgetTypeDeserializer.class)
    @Convert(converter = WidgetTypeConverter.class)
    @Column(name = "widget_type", nullable = false)
    private WidgetType widgetType;
    
    @JsonProperty("widget_id")
    @Column(name = "widget_id", length = 50, nullable = false)
    private String widgetId;
    
    @Column(name = "title", length = 100, nullable = false)
    private String title;
    
    // Posicionamento absoluto
    @JsonProperty("position_x")
    @Column(name = "position_x", nullable = false)
    private Integer positionX = 0;
    
    @JsonProperty("position_y")
    @Column(name = "position_y", nullable = false)
    private Integer positionY = 0;
    
    @Column(name = "width", nullable = false)
    private Integer width = 300;
    
    @Column(name = "height", nullable = false)
    private Integer height = 200;
    
    @JsonProperty("z_index")
    @Column(name = "z_index", nullable = false)
    private Integer zIndex = 1;
    
    // Referência à query (pode ser NULL se o widget usa chave textual ou SQL embutido)
    @JsonProperty("query_id")
    @Column(name = "query_id")
    private Long queryId;

    // Configurações JSON
    @JsonProperty("data_config")
    @Column(name = "data_config", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode dataConfig;
    
    @JsonProperty("visual_config")
    @Column(name = "visual_config", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode visualConfig;
    
    @JsonProperty("behavior_config")
    @Column(name = "behavior_config", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode behaviorConfig;
    
    // Estado
    @JsonProperty("is_visible")
    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;
    
    @JsonProperty("is_locked")
    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("created_at")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @JsonProperty("updated_at")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dashboard_id", insertable = false, updatable = false)
    @JsonBackReference
    private Dashboard dashboard;
    
    // Enum para tipos de widget
    public enum WidgetType {
        KPI("kpi"),
        CHART("chart"),
        LIST("list"),
        AGGRID("aggrid"),
        CHAT("chat"),
        TEXT("text"),
        IMAGE("image"),
    CONTAINER("container");
        
        private final String value;
        
        WidgetType(String value) {
            this.value = value;
        }
        
        @com.fasterxml.jackson.annotation.JsonValue
        public String getValue() {
            return value;
        }
        
        // Desserializador customizado do Jackson para aceitar tanto o valor quanto o nome
        @com.fasterxml.jackson.annotation.JsonCreator
        public static WidgetType fromValue(String value) {
            if (value == null) return null;
            
            for (WidgetType type : WidgetType.values()) {
                if (type.value.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("No enum constant for value: " + value);
        }
    }
    
    // Constructors
    public DashboardWidget() {}
    
    public DashboardWidget(String widgetId, String title, WidgetType widgetType, Long dashboardId) {
        this.widgetId = widgetId;
        this.title = title;
        this.widgetType = widgetType;
        this.dashboardId = dashboardId;
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
    
    public Long getDashboardId() {
        return dashboardId;
    }
    
    public void setDashboardId(Long dashboardId) {
        this.dashboardId = dashboardId;
    }
    
    public WidgetType getWidgetType() {
        return widgetType;
    }
    
    public void setWidgetType(WidgetType widgetType) {
        this.widgetType = widgetType;
    }
    
    public String getWidgetId() {
        return widgetId;
    }
    
    public void setWidgetId(String widgetId) {
        this.widgetId = widgetId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public Integer getPositionX() {
        return positionX;
    }
    
    public void setPositionX(Integer positionX) {
        this.positionX = positionX;
    }
    
    public Integer getPositionY() {
        return positionY;
    }
    
    public void setPositionY(Integer positionY) {
        this.positionY = positionY;
    }
    
    public Integer getWidth() {
        return width;
    }
    
    public void setWidth(Integer width) {
        this.width = width;
    }
    
    public Integer getHeight() {
        return height;
    }
    
    public void setHeight(Integer height) {
        this.height = height;
    }
    
    public Integer getZIndex() {
        return zIndex;
    }
    
    public void setZIndex(Integer zIndex) {
        this.zIndex = zIndex;
    }
    
    public Long getQueryId() {
        return queryId;
    }

    public void setQueryId(Long queryId) {
        this.queryId = queryId;
    }

    public JsonNode getDataConfig() {
        return dataConfig;
    }
    
    public void setDataConfig(JsonNode dataConfig) {
        this.dataConfig = dataConfig;
    }
    
    public JsonNode getVisualConfig() {
        return visualConfig;
    }
    
    public void setVisualConfig(JsonNode visualConfig) {
        this.visualConfig = visualConfig;
    }
    
    public JsonNode getBehaviorConfig() {
        return behaviorConfig;
    }
    
    public void setBehaviorConfig(JsonNode behaviorConfig) {
        this.behaviorConfig = behaviorConfig;
    }
    
    public Boolean getIsVisible() {
        return isVisible;
    }
    
    public void setIsVisible(Boolean isVisible) {
        this.isVisible = isVisible;
    }
    
    public Boolean getIsLocked() {
        return isLocked;
    }
    
    public void setIsLocked(Boolean isLocked) {
        this.isLocked = isLocked;
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
    
    public Dashboard getDashboard() {
        return dashboard;
    }
    
    public void setDashboard(Dashboard dashboard) {
        this.dashboard = dashboard;
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
        return "DashboardWidget{" +
                "id=" + id +
                ", dashboardId=" + dashboardId +
                ", widgetType=" + widgetType +
                ", widgetId='" + widgetId + '\'' +
                ", title='" + title + '\'' +
                ", positionX=" + positionX +
                ", positionY=" + positionY +
                ", width=" + width +
                ", height=" + height +
                ", zIndex=" + zIndex +
                ", isVisible=" + isVisible +
                ", isLocked=" + isLocked +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}