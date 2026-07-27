package com.spdealer.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.spdealer.api.model.TicketRelation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO: TicketRelationDTO
 * Retornado pelo endpoint GET /api/v1/tickets/{id}/related
 * 
 * Exemplo de ticket relacionado:
 * {
 *   "id": 20,
 *   "taskId": "TASK-108",
 *   "title": "Cadastro de Clientes",
 *   "currentStageId": 5,
 *   "priorityKey": "HIGH",
 *   "relationType": "parent",
 *   "relationLabel": "Pai",
 *   "notes": "Task principal que originou este trabalho"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketRelationDTO {
    
    private Long id;
    
    private String taskId;
    
    private String title;
    
    private Integer currentStageId;
    
    private String priorityKey;
    
    /**
     * Tipo de relacionamento: parent, child, blocker, blocked_by, related
     */
    private String relationType;
    
    /**
     * Label legível: "Pai", "Filho", "Bloqueia", etc
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String relationLabel;
    
    /**
     * Notas sobre o relacionamento
     */
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private String notes;
    
    /**
     * Factory method para converter Entity para DTO
     */
    public static TicketRelationDTO fromEntity(TicketRelation relation, 
                                                Long relatedTaskId,
                                                String relatedTaskTaskId,
                                                String relatedTaskTitle,
                                                Integer relatedTaskStageId,
                                                String relatedTaskPriority) {
        return TicketRelationDTO.builder()
            .id(relatedTaskId)
            .taskId(relatedTaskTaskId)
            .title(relatedTaskTitle)
            .currentStageId(relatedTaskStageId)
            .priorityKey(relatedTaskPriority)
            .relationType(relation.getRelationType().name())
            .relationLabel(relation.getRelationType().getLabel())
            .notes(relation.getNotes())
            .build();
    }
}
