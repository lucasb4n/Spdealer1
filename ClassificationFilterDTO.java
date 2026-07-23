// src/main/java/com/spdealer/api/dto/ClassificationFilterDTO.java
package com.spdealer.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO para filtros de classificacao de tarefas
 * Utilizado para buscar tarefas por Projeto, Modulo, Tipo de Trabalho, Categoria, Prioridade
 * 
 * Exemplo:
 * {
 *   "projeto": "spdealer",
 *   "modulo": "dashboard",
 *   "tipoTrabalho": "desenvolvimento",
 *   "categoria": "feature",
 *   "prioridade": "high"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassificationFilterDTO {
    
    /**
     * Projeto: ex: "spdealer"
     * Opcional - se nulo, ignora filtro
     */
    @JsonProperty("projeto")
    private String projeto;
    
    /**
     * Modulo: ex: "dashboard", "financeiro", "crm"
     * Opcional - se nulo, ignora filtro
     */
    @JsonProperty("modulo")
    private String modulo;
    
    /**
     * Tipo de Trabalho: ex: "desenvolvimento", "bug_fix", "refactor"
     * Opcional - se nulo, ignora filtro
     */
    @JsonProperty("tipoTrabalho")
    private String tipoTrabalho;
    
    /**
     * Categoria: ex: "feature", "bug", "maintenance"
     * Opcional - se nulo, ignora filtro
     */
    @JsonProperty("categoria")
    private String categoria;
    
    /**
     * Prioridade: ex: "high", "medium", "low"
     * Opcional - se nulo, ignora filtro
     */
    @JsonProperty("prioridade")
    private String prioridade;
    
    /**
     * Verifica se ha algum filtro ativo
     * @return true se pelo menos 1 filtro está definido
     */
    public boolean hasActiveFilters() {
        return projeto != null || modulo != null || tipoTrabalho != null 
            || categoria != null || prioridade != null;
    }
    
    /**
     * Retorna representacao em string dos filtros ativos
     * Util para logging
     * 
     * @return ex: "projeto=spdealer, modulo=dashboard"
     */
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        if (projeto != null) sb.append("projeto=").append(projeto).append(", ");
        if (modulo != null) sb.append("modulo=").append(modulo).append(", ");
        if (tipoTrabalho != null) sb.append("tipoTrabalho=").append(tipoTrabalho).append(", ");
        if (categoria != null) sb.append("categoria=").append(categoria).append(", ");
        if (prioridade != null) sb.append("prioridade=").append(prioridade).append(", ");
        
        String result = sb.toString();
        if (result.endsWith(", ")) {
            result = result.substring(0, result.length() - 2);
        }
        return result.isEmpty() ? "no filters" : result;
    }
}
