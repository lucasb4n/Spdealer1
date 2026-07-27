package br.com.spdealer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "codigo_usu")
    private Long id;
    
    @Column(name = "login_usu")
    private String username;
    

    @Column(name = "nome_usu")
    private String name;

    @Column(name = "email_usu")
    private String email;

    @Column(name = "celular_usu")
    private String celular;

    @Column(name = "role")
    private String role;
    
    @Column(name = "password")
    private String password;
    
    @Column(name = "active")
    private Boolean active;
    
    @Column(name = "permissions", columnDefinition = "TEXT")
    private String permissions;
    
    @Column(name = "menu_config", columnDefinition = "TEXT")
    private String menuConfig;
    
    @Column(name = "default_dashboard_id")
    private Long defaultDashboardId;

    @Column(name = "group_id")
    private Long groupId;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCelular() {
        return celular;
    }

    public void setCelular(String celular) {
        this.celular = celular;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getPermissions() {
        return permissions;
    }

    public void setPermissions(String permissions) {
        this.permissions = permissions;
    }

    public String getMenuConfig() {
        return menuConfig;
    }

    public void setMenuConfig(String menuConfig) {
        this.menuConfig = menuConfig;
    }

    public Long getDefaultDashboardId() {
        return defaultDashboardId;
    }

    public void setDefaultDashboardId(Long defaultDashboardId) {
        this.defaultDashboardId = defaultDashboardId;
    }

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    // Alias para compatibilidade com lógica legada de "group"
    public Long getGroup() {
        return groupId;
    }
}