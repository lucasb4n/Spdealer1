package com.spdealer.api.repository;

import com.spdealer.api.model.TicketRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository: TicketRelationRepository
 * Acesso aos dados de relacionamentos entre tickets
 */
@Repository
public interface TicketRelationRepository extends JpaRepository<TicketRelation, Long> {

    /**
     * Encontra todos os tickets relacionados a um ticket específico
     * 
     * Exemplo: Buscar todos os relacionados ao ticket 23 (TASK-111)
     * Retorna: TASK-108 (parent), TASK-104 (related)
     */
    @Query("SELECT tr FROM TicketRelation tr WHERE tr.ticketId = :ticketId")
    List<TicketRelation> findRelatedByTicketId(@Param("ticketId") Long ticketId);

    /**
     * Encontra um relacionamento específico
     */
    @Query("SELECT tr FROM TicketRelation tr WHERE tr.ticketId = :ticketId AND tr.relatedTicketId = :relatedTicketId")
    Optional<TicketRelation> findRelationship(@Param("ticketId") Long ticketId, 
                                              @Param("relatedTicketId") Long relatedTicketId);

    /**
     * Verifica se existe um relacionamento (qualquer tipo)
     */
    @Query("SELECT COUNT(tr) > 0 FROM TicketRelation tr WHERE tr.ticketId = :ticketId AND tr.relatedTicketId = :relatedTicketId")
    boolean exists(@Param("ticketId") Long ticketId, @Param("relatedTicketId") Long relatedTicketId);

    /**
     * Encontra todos os tickets que relacionam a um ticket específico (reverso)
     * 
     * Exemplo: Quais tickets relacionam-se ao TASK-108?
     * Retorna: TASK-109 (child), TASK-110 (child)
     */
    @Query("SELECT tr FROM TicketRelation tr WHERE tr.relatedTicketId = :ticketId")
    List<TicketRelation> findReverseRelations(@Param("ticketId") Long ticketId);
}
