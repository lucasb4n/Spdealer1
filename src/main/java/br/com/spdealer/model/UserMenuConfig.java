package br.com.spdealer.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_menu_config")
public class UserMenuConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "usuario_id", nullable = false)
    private Long userId;
    
    @Column(name = "menu_item_id", nullable = false)
    private Long menuItemId;
    
    @Column(name = "visivel", nullable = false)
    private Boolean visible = true;
    
    @Column(name = "ordem", nullable = false)
    private Integer order = 0;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Boolean getVisible() {
        return visible;
    }

    public void setVisible(Boolean visible) {
        this.visible = visible;
    }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
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

    // Builder pattern methods (replacing Lombok @Builder)
    public static UserMenuConfigBuilder builder() {
        return new UserMenuConfigBuilder();
    }

    public static class UserMenuConfigBuilder {
        private Long userId;
        private Long menuItemId;
        private Boolean visible = true;
        private Integer order = 0;

        public UserMenuConfigBuilder userId(Long userId) {
            this.userId = userId;
            return this;
        }

        public UserMenuConfigBuilder menuItemId(Long menuItemId) {
            this.menuItemId = menuItemId;
            return this;
        }

        public UserMenuConfigBuilder visible(Boolean visible) {
            this.visible = visible;
            return this;
        }

        public UserMenuConfigBuilder order(Integer order) {
            this.order = order;
            return this;
        }

        public UserMenuConfig build() {
            UserMenuConfig config = new UserMenuConfig();
            config.userId = this.userId;
            config.menuItemId = this.menuItemId;
            config.visible = this.visible;
            config.order = this.order;
            return config;
        }
    }
}