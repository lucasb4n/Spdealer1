package com.spdealer.api.service;

import com.spdealer.api.dto.SearchResultDTO;
import com.spdealer.api.dto.TicketRelationDTO;
import com.spdealer.api.model.TicketRelation;
import com.spdealer.api.repository.TicketRelationRepository;
import com.spdealer.api.repository.TaskManagementSearchRepositoryCustom;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service: TicketSearchService
 * Lógica de negócio para busca global e relacionamentos
 * 
 * Responsabilidades:
 * 1. Buscar tickets por termo (título, descrição, module)
 * 2. Recuperar relacionamentos de um ticket
 * 3. Criar novos relacionamentos
 * 4. Validações e regras de negócio
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TicketSearchService {

    private final TicketRelationRepository ticketRelationRepository;
    private final TaskManagementSearchRepositoryCustom taskManagementSearchRepository;

    /**
     * Busca global de tickets por termo
     * 
     * @param searchTerm Termo de busca (mínimo 2 caracteres)
     * @param limit Número máximo de resultados (default: 20)
     * @return Lista de SearchResultDTO ordenados por relevância
     * 
     * Exemplo:
     * searchTickets("TASK-111", 20) → retorna TASK-111 como first result
     * searchTickets("cadastro", 20) → retorna todos com "cadastro" no título/descrição
     */
    public List<SearchResultDTO> searchTickets(String searchTerm, int limit) {
        log.info("Buscando tickets com termo: '{}' (limite: {})", searchTerm, limit);

        // Validação: mínimo 2 caracteres
        if (searchTerm == null || searchTerm.trim().length() < 2) {
            log.warn("Termo de busca inválido: {} caracteres", 
                     searchTerm == null ? 0 : searchTerm.length());
            return Collections.emptyList();
        }

        try {
            String normalizedTerm = searchTerm.trim().toUpperCase();
            List<SearchResultDTO> results = taskManagementSearchRepository
                    .searchByTerm(normalizedTerm);

            log.info("Busca retornou {} resultados", results.size());
            return results;

        } catch (Exception e) {
            log.error("Erro ao buscar tickets: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Busca por módulo específico
     * 
     * Módulos válidos: clientes, fornecedores, receber, pagar, caixa, etc
     */
    public List<SearchResultDTO> searchByModule(String moduleKey, int limit) {
        log.info("Buscando tickets do módulo: {} (limite: {})", moduleKey, limit);

        if (moduleKey == null || moduleKey.trim().isEmpty()) {
            log.warn("Módulo inválido");
            return Collections.emptyList();
        }

        try {
            List<SearchResultDTO> results = taskManagementSearchRepository
                    .searchByModule(moduleKey.toLowerCase());
            log.info("Busca por módulo retornou {} resultados", results.size());
            return results;

        } catch (Exception e) {
            log.error("Erro ao buscar por módulo: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Busca por prioridade
     * 
     * Prioridades válidas: HIGH, MEDIUM, LOW, CRITICAL
     */
    public List<SearchResultDTO> searchByPriority(String priorityKey, int limit) {
        log.info("Buscando tickets por prioridade: {} (limite: {})", priorityKey, limit);

        if (priorityKey == null || priorityKey.trim().isEmpty()) {
            log.warn("Prioridade inválida");
            return Collections.emptyList();
        }

        try {
            List<SearchResultDTO> results = taskManagementSearchRepository
                    .searchByPriority(priorityKey.toUpperCase());
            log.info("Busca por prioridade retornou {} resultados", results.size());
            return results;

        } catch (Exception e) {
            log.error("Erro ao buscar por prioridade: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Recupera todos os relacionamentos de um ticket
     * 
     * @param ticketId ID do ticket (ex: 23 para TASK-111)
     * @return Lista de TicketRelationDTO com dados do ticket relacionado
     * 
     * Exemplo de retorno:
     * [
     *   {id: 20, taskId: "TASK-108", title: "...", relationType: "parent"},
     *   {id: 21, taskId: "TASK-109", title: "...", relationType: "child"},
     *   {id: 14, taskId: "TASK-104", title: "...", relationType: "related"}
     * ]
     */
    public List<TicketRelationDTO> getRelatedTickets(Long ticketId) {
        log.info("Buscando tickets relacionados ao ID: {}", ticketId);

        if (ticketId == null || ticketId <= 0) {
            log.warn("ID de ticket inválido: {}", ticketId);
            return Collections.emptyList();
        }

        try {
            List<TicketRelation> relations = ticketRelationRepository
                    .findRelatedByTicketId(ticketId);

            log.info("Encontrados {} relacionamentos para ticket {}", relations.size(), ticketId);

            // TODO: Aqui você precisaria fazer JOIN com a tabela task_management
            // para recuperar dados do ticket relacionado (taskId, title, stage, etc)
            // Por enquanto, retornando DTO básico

            return relations.stream()
                    .map(relation -> TicketRelationDTO.builder()
                            .id(relation.getRelatedTicketId())
                            .taskId("TASK-" + relation.getRelatedTicketId()) // Placeholder
                            .relationType(relation.getRelationType().name())
                            .relationLabel(relation.getRelationType().getLabel())
                            .notes(relation.getNotes())
                            .build())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Erro ao buscar relacionamentos: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Cria um novo relacionamento entre dois tickets
     * 
     * @param ticketId ID do ticket origem
     * @param relatedTicketId ID do ticket destino
     * @param relationType Tipo de relacionamento (parent, child, blocker, etc)
     * @param notes Notas sobre o relacionamento
     * @param userId ID do usuário que criou
     * @return true se criado com sucesso, false se já existia
     */
    @Transactional
    public boolean createRelationship(Long ticketId, Long relatedTicketId, 
                                      String relationType, String notes, Integer userId) {
        log.info("Criando relacionamento: {} -> {} (tipo: {})", 
                 ticketId, relatedTicketId, relationType);

        // Validações
        if (ticketId == null || ticketId <= 0) {
            log.warn("Ticket ID inválido: {}", ticketId);
            return false;
        }

        if (relatedTicketId == null || relatedTicketId <= 0) {
            log.warn("Related Ticket ID inválido: {}", relatedTicketId);
            return false;
        }

        if (ticketId.equals(relatedTicketId)) {
            log.warn("Não é permitido criar relacionamento consigo mesmo");
            return false;
        }

        // Verificar se já existe
        if (ticketRelationRepository.exists(ticketId, relatedTicketId)) {
            log.warn("Relacionamento já existe entre {} e {}", ticketId, relatedTicketId);
            return false;
        }

        try {
            TicketRelation relation = TicketRelation.builder()
                    .ticketId(ticketId)
                    .relatedTicketId(relatedTicketId)
                    .relationType(TicketRelation.RelationType.valueOf(relationType))
                    .notes(notes)
                    .createdByUserId(userId)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            ticketRelationRepository.save(relation);
            log.info("Relacionamento criado com sucesso: ID {}", relation.getId());
            return true;

        } catch (IllegalArgumentException e) {
            log.error("Tipo de relacionamento inválido: {}", relationType, e);
            return false;
        } catch (Exception e) {
            log.error("Erro ao criar relacionamento: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Remove um relacionamento
     */
    @Transactional
    public boolean deleteRelationship(Long ticketId, Long relatedTicketId) {
        log.info("Removendo relacionamento: {} -> {}", ticketId, relatedTicketId);

        try {
            Optional<TicketRelation> relation = ticketRelationRepository
                    .findRelationship(ticketId, relatedTicketId);

            if (relation.isPresent()) {
                ticketRelationRepository.delete(relation.get());
                log.info("Relacionamento removido com sucesso");
                return true;
            } else {
                log.warn("Relacionamento não encontrado");
                return false;
            }

        } catch (Exception e) {
            log.error("Erro ao remover relacionamento: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Atualiza o stage/status de um ticket (Kanban drag-and-drop)
     * 
     * @param ticketId ID do ticket
     * @param newStageId Novo stage (2=To Do, 3=In Progress, 4=Review, 5=Done)
     * @return true se atualizado com sucesso, false caso contrário
     * 
     * Exemplo:
     * updateTicketStage(23, 5) → Move ticket 23 para Done
     */
    @Transactional
    public boolean updateTicketStage(Long ticketId, Long newStageId) {
        log.info("Atualizando stage do ticket {}: novo stage = {}", ticketId, newStageId);

        try {
            // Validações
            if (ticketId == null || ticketId <= 0) {
                log.warn("ID do ticket inválido: {}", ticketId);
                return false;
            }

            if (newStageId == null || newStageId < 2 || newStageId > 5) {
                log.warn("Stage ID inválido: {}. Deve estar entre 2 e 5", newStageId);
                return false;
            }

            // Executar update via query customizada
            int rowsUpdated = taskManagementSearchRepository.updateTaskStage(ticketId, newStageId);

            if (rowsUpdated > 0) {
                log.info("✅ Ticket {} movido para stage {} com sucesso", ticketId, newStageId);
                return true;
            } else {
                log.warn("Nenhuma linha foi atualizada - ticket {} pode não existir", ticketId);
                return false;
            }

        } catch (Exception e) {
            log.error("❌ Erro ao atualizar stage: {}", e.getMessage(), e);
            return false;
        }
    }
}
