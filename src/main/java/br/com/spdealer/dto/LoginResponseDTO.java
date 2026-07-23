// src/main/java/br/com/spdealer/dto/LoginResponseDTO.java
package br.com.spdealer.dto; // Garanta que este pacote esteja correto

import br.com.spdealer.model.User; // Importa a entidade User

public class LoginResponseDTO {
    private Long userId;
    private String username;
    private String name;
    private String email;
    private String celular;
    private String role;
    private String permissions;
    private Long defaultDashboardId;
    
    @com.fasterxml.jackson.annotation.JsonProperty("group")
    private Long groupId; // <--- CAMPO CRÍTICO PARA O DASHBOARD

    // Construtor que recebe a entidade User para popular o DTO
    public LoginResponseDTO(User user) {
        this.userId = user.getId();
        this.username = user.getUsername();
        this.name = user.getName();
        this.email = user.getEmail();
        this.celular = user.getCelular();
        this.role = user.getRole();
        this.permissions = user.getPermissions();
        this.defaultDashboardId = user.getDefaultDashboardId(); // <--- POPULANDO O defaultDashboardId
        this.groupId = user.getGroupId();
    }

    // Getters para todas as propriedades (necessários para serialização JSON)
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getCelular() { return celular; }
    public String getRole() { return role; }
    public String getPermissions() { return permissions; }
    public Long getDefaultDashboardId() { return defaultDashboardId; } // <--- GETTER DO defaultDashboardId
    public Long getGroupId() { return groupId; }

    // Setters são opcionais se você usar apenas o construtor para criar o objeto
    // public void setUserId(Long userId) { this.userId = userId; }
    // ...
}