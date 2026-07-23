package com.spdealer.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

/**
 * DTO: SearchResultDTO
 * Retornado pelo endpoint GET /api/v1/tickets/search
 * 
 * Exemplo:
 * {
 *   "id": 23,
 *   "taskId": "TASK-111",
 *   "title": "Ajuste de Validacoes",
 *   "description": "Validar CPF e Email",
 *   "priorityKey": "MEDIUM",
 *   "moduleKey": "clientes",
 *   "currentStageId": 3,
 *   "estimatedHours": 5.0
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SearchResultDTO {
    
    private Long id;
    
    private String taskId;
    
    private String title;
    
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private String description;
    
    private String priorityKey;
    
    private String moduleKey;
    
    private Integer currentStageId;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Double estimatedHours;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDate dueDate;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String categoryKey;
    
    /**
     * Flag de destaque: 1 se é resultado exato por task_id, 0 caso contrário
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer isExactMatch;
}
