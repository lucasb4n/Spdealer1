package br.com.spdealer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.sql.Timestamp;

/**
 * DTO para dictionary_columns
 * 
 * Representa metadados completos de uma coluna do sistema
 * Usado pelo FormBuilder para gerar campos dinamicamente
 */
public class DictionaryColumn {
    
    // Identificação
    private Integer id;
    private String tableName;
    private String columnName;
    
    // Tipo de Dados
    private String dataType;
    private Integer characterMaximumLength;
    private Integer numericPrecision;
    private Integer numericScale;
    
    // Layout e UI
    @JsonProperty("aba")
    private String aba; // Qual aba/tab o campo aparece
    
    @JsonProperty("tabulation")
    private Integer tabulation; // Ordem de tabulação
    
    @JsonProperty("width")
    private Integer width; // Largura no formulário (pixels)
    
    @JsonProperty("widthAggrid")
    private Integer widthAggrid; // Largura no AG-Grid (pixels)
    
    // Metadata e Constraints
    private Boolean isNullable;
    private Boolean isPrimaryKey;
    private Boolean isForeignKey;
    
    // FormBuilder Específico
    @JsonProperty("isCheckbox")
    private Boolean isCheckbox; // Renderizar como checkbox
    
    @JsonProperty("isLista")
    private Boolean isLista; // Renderizar como select/dropdown
    
    @JsonProperty("table")
    private String table; // Tabela de referência (FK ou lista)
    
    @JsonProperty("formVisible")
    private Boolean formVisible; // Aparece no formulário
    
    @JsonProperty("searchVisible")
    private Boolean searchVisible; // Aparece no filtro/busca
    
    // Display
    @JsonProperty("alias")
    private String alias; // Label de exibição
    
    private String defaultValue;
    private String description;
    
    // Timestamps
    private Timestamp createdAt;
    private Timestamp updatedAt;
    
    // Constructors
    public DictionaryColumn() {}
    
    public DictionaryColumn(String tableName, String columnName, String dataType) {
        this.tableName = tableName;
        this.columnName = columnName;
        this.dataType = dataType;
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
    
    public String getColumnName() {
        return columnName;
    }
    
    public void setColumnName(String columnName) {
        this.columnName = columnName;
    }
    
    public String getDataType() {
        return dataType;
    }
    
    public void setDataType(String dataType) {
        this.dataType = dataType;
    }
    
    public Integer getCharacterMaximumLength() {
        return characterMaximumLength;
    }
    
    public void setCharacterMaximumLength(Integer characterMaximumLength) {
        this.characterMaximumLength = characterMaximumLength;
    }
    
    public Integer getNumericPrecision() {
        return numericPrecision;
    }
    
    public void setNumericPrecision(Integer numericPrecision) {
        this.numericPrecision = numericPrecision;
    }
    
    public Integer getNumericScale() {
        return numericScale;
    }
    
    public void setNumericScale(Integer numericScale) {
        this.numericScale = numericScale;
    }
    
    public String getAba() {
        return aba;
    }
    
    public void setAba(String aba) {
        this.aba = aba;
    }
    
    public Integer getTabulation() {
        return tabulation;
    }
    
    public void setTabulation(Integer tabulation) {
        this.tabulation = tabulation;
    }
    
    public Integer getWidth() {
        return width;
    }
    
    public void setWidth(Integer width) {
        this.width = width;
    }
    
    public Integer getWidthAggrid() {
        return widthAggrid;
    }
    
    public void setWidthAggrid(Integer widthAggrid) {
        this.widthAggrid = widthAggrid;
    }
    
    public Boolean getIsNullable() {
        return isNullable;
    }
    
    public void setIsNullable(Boolean isNullable) {
        this.isNullable = isNullable;
    }
    
    public Boolean getIsPrimaryKey() {
        return isPrimaryKey;
    }
    
    public void setIsPrimaryKey(Boolean isPrimaryKey) {
        this.isPrimaryKey = isPrimaryKey;
    }
    
    public Boolean getIsForeignKey() {
        return isForeignKey;
    }
    
    public void setIsForeignKey(Boolean isForeignKey) {
        this.isForeignKey = isForeignKey;
    }
    
    public Boolean getIsCheckbox() {
        return isCheckbox;
    }
    
    public void setIsCheckbox(Boolean isCheckbox) {
        this.isCheckbox = isCheckbox;
    }
    
    public Boolean getIsLista() {
        return isLista;
    }
    
    public void setIsLista(Boolean isLista) {
        this.isLista = isLista;
    }
    
    public String getTable() {
        return table;
    }
    
    public void setTable(String table) {
        this.table = table;
    }
    
    public Boolean getFormVisible() {
        return formVisible;
    }
    
    public void setFormVisible(Boolean formVisible) {
        this.formVisible = formVisible;
    }
    
    public Boolean getSearchVisible() {
        return searchVisible;
    }
    
    public void setSearchVisible(Boolean searchVisible) {
        this.searchVisible = searchVisible;
    }
    
    public String getAlias() {
        return alias;
    }
    
    public void setAlias(String alias) {
        this.alias = alias;
    }
    
    public String getDefaultValue() {
        return defaultValue;
    }
    
    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
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
        return "DictionaryColumn{" +
                "tableName='" + tableName + '\'' +
                ", columnName='" + columnName + '\'' +
                ", dataType='" + dataType + '\'' +
                ", alias='" + alias + '\'' +
                ", aba='" + aba + '\'' +
                ", formVisible=" + formVisible +
                ", searchVisible=" + searchVisible +
                '}';
    }
}
