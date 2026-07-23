package com.spdealer.api.controller;

import com.spdealer.api.dto.SearchResultDTO;
import com.spdealer.api.dto.TicketRelationDTO;
import com.spdealer.api.service.TicketSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller: TicketSearchController
 * REST API para busca global e relacionamentos de tickets
 * 
 * Base URL: /api/v1/tickets
 * 
 * Endpoints:
 * 1. GET /search?q=term&limit=20
 * 2. GET /{id}/related
 * 3. POST /{id}/related
 * 4. DELETE /{id}/related/{relatedId}
 */
@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Slf4j
public class TicketSearchController {

    private final TicketSearchService ticketSearchService;

    /**
     * Endpoint: GET /api/v1/tickets/search?q=termo&limit=20
     * 
     * Busca global de tickets por termo
     * 
     * Exemplo:
     * GET /api/v1/tickets/search?q=TASK-111
     * GET /api/v1/tickets/search?q=cadastro&limit=50
     * 
     * Response:
     * {
     *   "success": true,
     *   "count": 3,
     *   "results": [
     *     {
     *       "id": 23,
     *       "taskId": "TASK-111",
     *       "title": "Ajuste de Validacoes",
     *       "priorityKey": "MEDIUM",
     *       "moduleKey": "clientes",
     *       "currentStageId": 3,
     *       "isExactMatch": true
     *     }
     *   ]
     * }
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchTickets(
            @RequestParam(value = "q", required = false, defaultValue = "") String query,
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit,
            @RequestParam(value = "type", required = false, defaultValue = "global") String searchType) {

        log.info("Recebido request de busca: query='{}', limit={}, type={}", query, limit, searchType);

        Map<String, Object> response = new HashMap<>();

        // Validações
        if (query == null || query.trim().isEmpty()) {
            response.put("success", false);
            response.put("error", "Query parameter 'q' é obrigatório");
            response.put("results", List.of());
            return ResponseEntity.badRequest().body(response);
        }

        if (limit < 1 || limit > 100) {
            limit = 20; // Valor padrão seguro
        }

        try {
            List<SearchResultDTO> results;

            // Suporte a diferentes tipos de busca
            switch (searchType) {
                case "module":
                    results = ticketSearchService.searchByModule(query, limit);
                    break;
                case "priority":
                    results = ticketSearchService.searchByPriority(query, limit);
                    break;
                case "global":
                default:
                    results = ticketSearchService.searchTickets(query, limit);
                    break;
            }

            response.put("success", true);
            response.put("count", results.size());
            response.put("results", results);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erro na busca: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Erro ao processar busca: " + e.getMessage());
            response.put("results", List.of());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Endpoint: GET /api/v1/tickets/{id}/related
     * 
     * Retorna todos os tickets relacionados a um ticket específico
     * 
     * Exemplo:
     * GET /api/v1/tickets/23/related
     * 
     * Response:
     * {
     *   "success": true,
     *   "ticketId": 23,
     *   "relatedCount": 3,
     *   "related": [
     *     {
     *       "id": 20,
     *       "taskId": "TASK-108",
     *       "title": "Cadastro de Clientes",
     *       "currentStageId": 5,
     *       "priorityKey": "HIGH",
     *       "relationType": "parent",
     *       "relationLabel": "Pai",
     *       "notes": "Task principal"
     *     },
     *     ...
     *   ]
     * }
     */
    @GetMapping("/{ticketId}/related")
    public ResponseEntity<Map<String, Object>> getRelatedTickets(
            @PathVariable Long ticketId) {

        log.info("Buscando relacionamentos para ticket: {}", ticketId);

        Map<String, Object> response = new HashMap<>();

        if (ticketId == null || ticketId <= 0) {
            response.put("success", false);
            response.put("error", "Ticket ID inválido");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            List<TicketRelationDTO> related = ticketSearchService.getRelatedTickets(ticketId);

            response.put("success", true);
            response.put("ticketId", ticketId);
            response.put("relatedCount", related.size());
            response.put("related", related);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erro ao buscar relacionamentos: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Erro ao processar relacionamentos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Endpoint: POST /api/v1/tickets/{ticketId}/related
     * 
     * Cria um novo relacionamento entre dois tickets
     * 
     * Exemplo:
     * POST /api/v1/tickets/23/related
     * {
     *   "relatedTicketId": 108,
     *   "relationType": "parent",
     *   "notes": "Task originária"
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "message": "Relacionamento criado com sucesso"
     * }
     */
    @PostMapping("/{ticketId}/related")
    public ResponseEntity<Map<String, Object>> createRelationship(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Object> payload) {

        log.info("Recebido request para criar relacionamento: payload={}", payload);

        Map<String, Object> response = new HashMap<>();

        // Validações
        if (ticketId == null || ticketId <= 0) {
            response.put("success", false);
            response.put("error", "Ticket ID inválido");
            return ResponseEntity.badRequest().body(response);
        }

        Long relatedTicketId = getLongFromPayload(payload, "relatedTicketId");
        String relationType = getStringFromPayload(payload, "relationType");
        String notes = getStringFromPayload(payload, "notes");

        if (relatedTicketId == null || relatedTicketId <= 0) {
            response.put("success", false);
            response.put("error", "Related Ticket ID é obrigatório");
            return ResponseEntity.badRequest().body(response);
        }

        if (relationType == null || relationType.isEmpty()) {
            response.put("success", false);
            response.put("error", "Relation Type é obrigatório");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            boolean created = ticketSearchService.createRelationship(
                    ticketId, relatedTicketId, relationType, notes, 1); // userId=1 por padrão

            if (created) {
                response.put("success", true);
                response.put("message", "Relacionamento criado com sucesso");
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                response.put("success", false);
                response.put("error", "Falha ao criar relacionamento (já pode existir)");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            log.error("Erro ao criar relacionamento: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Erro ao processar: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Endpoint: DELETE /api/v1/tickets/{ticketId}/related/{relatedTicketId}
     * 
     * Remove um relacionamento entre dois tickets
     * 
     * Exemplo:
     * DELETE /api/v1/tickets/23/related/108
     * 
     * Response:
     * {
     *   "success": true,
     *   "message": "Relacionamento removido com sucesso"
     * }
     */
    @DeleteMapping("/{ticketId}/related/{relatedTicketId}")
    public ResponseEntity<Map<String, Object>> deleteRelationship(
            @PathVariable Long ticketId,
            @PathVariable Long relatedTicketId) {

        log.info("Deletando relacionamento: {} -> {}", ticketId, relatedTicketId);

        Map<String, Object> response = new HashMap<>();

        if (ticketId == null || ticketId <= 0 || relatedTicketId == null || relatedTicketId <= 0) {
            response.put("success", false);
            response.put("error", "Ticket IDs inválidos");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            boolean deleted = ticketSearchService.deleteRelationship(ticketId, relatedTicketId);

            if (deleted) {
                response.put("success", true);
                response.put("message", "Relacionamento removido com sucesso");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Relacionamento não encontrado");
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            log.error("Erro ao remover relacionamento: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Erro ao processar: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== Helpers ====================

    /**
     * Endpoint: PUT /api/v1/tickets/{id}/stage
     * 
     * Atualiza o stage/status de um ticket (Kanban drag-and-drop)
     * 
     * Exemplo:
     * PUT /api/v1/tickets/23/stage
     * Body: { "stage_id": 5 }
     * 
     * Response:
     * {
     *   "success": true,
     *   "ticketId": 23,
     *   "newStageId": 5,
     *   "message": "Ticket movido com sucesso"
     * }
     */
    @PutMapping("/{ticketId}/stage")
    public ResponseEntity<Map<String, Object>> updateTicketStage(
            @PathVariable Long ticketId,
            @RequestBody Map<String, Object> payload) {

        log.info("Atualizando stage do ticket {}: {}", ticketId, payload);

        Map<String, Object> response = new HashMap<>();

        try {
            // Validar payload
            if (!payload.containsKey("stage_id")) {
                response.put("success", false);
                response.put("error", "Campo 'stage_id' é obrigatório");
                return ResponseEntity.badRequest().body(response);
            }

            Long stageId = getLongFromPayload(payload, "stage_id");
            if (stageId == null) {
                response.put("success", false);
                response.put("error", "stage_id deve ser um número");
                return ResponseEntity.badRequest().body(response);
            }

            // Chamar serviço para atualizar
            boolean updated = ticketSearchService.updateTicketStage(ticketId, stageId);

            if (updated) {
                response.put("success", true);
                response.put("ticketId", ticketId);
                response.put("newStageId", stageId);
                response.put("message", "Ticket movido com sucesso");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Ticket não encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

        } catch (Exception e) {
            log.error("Erro ao atualizar stage: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("error", "Erro ao processar requisição: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== Helpers ====================

    private Long getLongFromPayload(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }

    private String getStringFromPayload(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        return value != null ? value.toString() : null;
    }
}
