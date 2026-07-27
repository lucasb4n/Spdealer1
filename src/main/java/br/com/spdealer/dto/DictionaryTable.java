package br.com.spdealer.dto;

import java.sql.Timestamp;

/**
 * DTO para dictionary_tables
 * 
 * Representa metadados de uma tabela do sistema
 * Usado pelo FormBuilder para Reverse Engineering
 */
public class DictionaryTable {
    
    private Integer id;
    private String tableName;
    private String displayName;
    private Boolean isProjectSpecific;
    private String description;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    
    // Constructors
    public DictionaryTable() {}
    
    public DictionaryTable(String tableName, String displayName) {
        this.tableName = tableName;
        this.displayName = displayName;
    }
    
    // Getters and Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public String getTableName() {
        return tableName;
    }
    
    public void setTableName(String tableName) {
        this.tableName = tableName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
    
    public Boolean getIsProjectSpecific() {
        return isProjectSpecific;
    }
    
    public void setIsProjectSpecific(Boolean isProjectSpecific) {
        this.isProjectSpecific = isProjectSpecific;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Timestamp getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
    
    public Timestamp getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @Override
    public String toString() {
        return "DictionaryTable{" +
                "id=" + id +
                ", tableName='" + tableName + '\'' +
                ", displayName='" + displayName + '\'' +
                ", isProjectSpecific=" + isProjectSpecific +
                '}';
    }
}
