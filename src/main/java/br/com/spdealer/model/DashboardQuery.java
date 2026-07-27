package br.com.spdealer.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dashboard_queries")
public class DashboardQuery {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "sql_query", columnDefinition = "TEXT", nullable = false)
    private String sqlQuery;
    
    @Column(name = "parameters", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode parameters;
    
    // Controle de acesso e segurança
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;
    
    @Column(name = "created_by", nullable = false)
    private Long createdBy;
    
    @Column(name = "allowed_users", columnDefinition = "JSON")
    @Convert(converter = JsonNodeConverter.class)
    private JsonNode allowedUsers;
    
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
    public DashboardQuery() {}
    
    public DashboardQuery(String name, String description, String sqlQuery, Long createdBy) {
        this.name = name;
        this.description = description;
        this.sqlQuery = sqlQuery;
        this.createdBy = createdBy;
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
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getSqlQuery() {
        return sqlQuery;
    }
    
    public void setSqlQuery(String sqlQuery) {
        this.sqlQuery = sqlQuery;
    }
    
    public JsonNode getParameters() {
        return parameters;
    }
    
    public void setParameters(JsonNode parameters) {
        this.parameters = parameters;
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
    
    public JsonNode getAllowedUsers() {
        return allowedUsers;
    }
    
    public void setAllowedUsers(JsonNode allowedUsers) {
        this.allowedUsers = allowedUsers;
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
    
    /**
     * Verifica se o usuário tem permissão para usar esta query
     */
    public boolean hasPermission(Long userId) {
        // Se for pública, qualquer um pode usar
        if (isPublic) {
            return true;
        }
        
        // Se for o criador, pode usar
        if (createdBy.equals(userId)) {
            return true;
        }
        
        // Verificar na lista de usuários permitidos
        if (allowedUsers != null && allowedUsers.isArray()) {
            for (var allowedUser : allowedUsers) {
                if (allowedUser.asLong() == userId) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    @Override
    public String toString() {
        return "DashboardQuery{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", isPublic=" + isPublic +
                ", createdBy=" + createdBy +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}