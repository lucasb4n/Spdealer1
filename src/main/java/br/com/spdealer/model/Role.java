package br.com.spdealer.model;

public enum Role {
    USER("ROLE_USER"),
    ADMIN("ROLE_ADMIN"),
    GERENTE("ROLE_GERENTE");

    private final String role;
    
    Role(String role) {
        this.role = role;
    }
    
    public String getRole() {
        return role;
    }
}