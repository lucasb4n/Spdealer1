package com.spdealer.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity: TicketRelation
 * Representa relacionamentos entre tickets/tarefas no sistema Kanban
 * 
 * Exemplo de uso:
 * - ticket_id=108 → related_ticket_id=109 (relation_type='parent') 
 *   → TASK-108 é pai de TASK-109
 */
@Entity
@Table(name = "tickets_related", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"ticket_id", "related_ticket_id", "relation_type"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "related_ticket_id", nullable = false)
    private Long relatedTicketId;

    @Column(name = "relation_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private RelationType relationType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by_user_id")
    private Integer createdByUserId;

    /**
     * Hook do Hibernate: auto-preencher timestamps antes de inserir
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /**
     * Hook do Hibernate: auto-preencher updated_at antes de atualizar
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RelationType {
        parent("Pai"),
        child("Filho"),
        blocker("Bloqueia"),
        blocked_by("Bloqueado por"),
        related("Relacionado");

        private final String label;

        RelationType(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}
