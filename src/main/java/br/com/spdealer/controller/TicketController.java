package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

/**
 * Controller REST para gerenciamento de Tickets
 * Endpoints para CRUD de tarefas com suporte a sistema de tickets YYYYNNNNNNNN
 */
@RestController
@RequestMapping("/api/v1/tickets")
public class TicketController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ============================================================================
    // 1. BUSCAR TICKET POR NÚMERO (GET /tickets/{ticketNumber})
    // ============================================================================
    @GetMapping("/{ticketNumber}")
    public ResponseEntity<?> getTicketByNumber(@PathVariable Long ticketNumber) {
        try {
            String sql = "SELECT id, ticket_number, task_id, title, description, " +
                        "current_stage_id, priority_key, estimated_hours, actual_hours, " +
                        "due_date, tags, created_at, updated_at FROM task_management " +
                        "WHERE ticket_number = ?";
            
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, ticketNumber);
            
            if (result.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("success", false, "error", "Ticket não encontrado")
                );
            }
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "ticket", result
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao buscar ticket: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 2. LISTAR TODOS OS TICKETS ABERTOS (GET /tickets/status/open)
    // ============================================================================
    @GetMapping("/status/open")
    public ResponseEntity<?> getOpenTickets(
        @RequestParam(defaultValue = "0") Integer page,
        @RequestParam(defaultValue = "10") Integer size
    ) {
        try {
            int offset = page * size;
            String sql = "SELECT id, ticket_number, task_id, title, current_stage_id, " +
                        "priority_key, estimated_hours, due_date, created_at " +
                        "FROM task_management WHERE current_stage_id != 5 " +
                        "ORDER BY due_date ASC LIMIT ? OFFSET ?";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, size, offset);
            
            String countSql = "SELECT COUNT(*) FROM task_management WHERE current_stage_id != 5";
            Long total = jdbcTemplate.queryForObject(countSql, Long.class);
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "total", total,
                    "page", page,
                    "size", size,
                    "tickets", results
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao listar tickets: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 3. FILTRAR TICKETS POR PRIORIDADE (GET /tickets/priority/{priority})
    // ============================================================================
    @GetMapping("/priority/{priority}")
    public ResponseEntity<?> getTicketsByPriority(
        @PathVariable String priority,
        @RequestParam(defaultValue = "0") Integer page,
        @RequestParam(defaultValue = "10") Integer size
    ) {
        try {
            int offset = page * size;
            String sql = "SELECT id, ticket_number, task_id, title, current_stage_id, " +
                        "priority_key, estimated_hours, due_date FROM task_management " +
                        "WHERE priority_key = ? AND current_stage_id != 5 " +
                        "ORDER BY due_date ASC LIMIT ? OFFSET ?";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, priority, size, offset);
            
            String countSql = "SELECT COUNT(*) FROM task_management WHERE priority_key = ? AND current_stage_id != 5";
            Long total = jdbcTemplate.queryForObject(countSql, Long.class, priority);
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "total", total,
                    "priority", priority,
                    "page", page,
                    "tickets", results
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao filtrar por prioridade: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 4. LISTAR TICKETS POR ESTÁGIO KANBAN (GET /tickets/status/{stageId})
    // ============================================================================
    @GetMapping("/status/{stageId}")
    public ResponseEntity<?> getTicketsByStage(@PathVariable Integer stageId) {
        try {
            String sql = "SELECT id, ticket_number, task_id, title, priority_key, " +
                        "estimated_hours, actual_hours, due_date, blocked_reason " +
                        "FROM task_management WHERE current_stage_id = ? " +
                        "ORDER BY priority_key DESC, due_date ASC";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, stageId);
            
            Map<Integer, String> stageLabels = Map.of(
                2, "📝 Em Aberto",
                3, "🔄 Processando",
                4, "⏳ Aguardando Aprovação",
                5, "✅ Concluído",
                6, "❌ Negado"
            );
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "stage_id", stageId,
                    "stage_name", stageLabels.getOrDefault(stageId, "Desconhecido"),
                    "count", results.size(),
                    "tickets", results
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao listar por estágio: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 5. BUSCAR TICKET POR TASK_ID (GET /tickets/search/{taskId})
    // ============================================================================
    @GetMapping("/search/{taskId}")
    public ResponseEntity<?> searchByTaskId(@PathVariable String taskId) {
        try {
            String sql = "SELECT id, ticket_number, task_id, title, description, " +
                        "current_stage_id, priority_key, estimated_hours, due_date " +
                        "FROM task_management WHERE task_id LIKE ?";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, "%" + taskId + "%");
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "search_term", taskId,
                    "count", results.size(),
                    "tickets", results
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao buscar: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 6. RESUMO DO KANBAN BOARD (GET /tickets/kanban/summary)
    // ============================================================================
    @GetMapping("/kanban/summary")
    public ResponseEntity<?> getKanbanSummary() {
        try {
            Map<Integer, String> stages = Map.of(
                2, "Em Aberto",
                3, "Processando",
                4, "Aguardando Aprovação",
                5, "Concluído",
                6, "Negado"
            );
            
            Map<String, Object> summary = new HashMap<>();
            List<Map<String, Object>> allTickets = new ArrayList<>();
            
            for (Integer stageId : stages.keySet()) {
                String sql = "SELECT id, ticket_number, task_id, title, priority_key, " +
                            "estimated_hours, due_date, blocked_reason " +
                            "FROM task_management WHERE current_stage_id = ? " +
                            "ORDER BY priority_key DESC, due_date ASC";
                
                List<Map<String, Object>> tickets = jdbcTemplate.queryForList(sql, stageId);
                
                Map<String, Object> stageData = new HashMap<>();
                stageData.put("stage_id", stageId);
                stageData.put("stage_name", stages.get(stageId));
                stageData.put("count", tickets.size());
                stageData.put("tickets", tickets);
                
                summary.put("stage_" + stageId, stageData);
                allTickets.addAll(tickets);
            }
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "total_tickets", allTickets.size(),
                    "stages", summary
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao gerar summary: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 7. MOVER TICKET PARA NOVO ESTÁGIO (PUT /tickets/{id}/stage)
    // ============================================================================
    @PutMapping("/{id}/stage")
    public ResponseEntity<?> moveTicketToStage(
        @PathVariable Long id,
        @RequestBody Map<String, Object> request
    ) {
        try {
            Integer stageId = ((Number) request.get("stage_id")).intValue();
            
            String updateSql = "UPDATE task_management SET current_stage_id = ?, updated_at = NOW() WHERE id = ?";
            int updated = jdbcTemplate.update(updateSql, stageId, id);
            
            if (updated == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("success", false, "error", "Ticket não encontrado")
                );
            }
            
            String selectSql = "SELECT id, ticket_number, task_id, title, current_stage_id FROM task_management WHERE id = ?";
            Map<String, Object> result = jdbcTemplate.queryForMap(selectSql, id);
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "message", "Ticket movido com sucesso",
                    "ticket", result
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao mover ticket: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 8. ATUALIZAR TICKET (PUT /tickets/{id})
    // ============================================================================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTicket(
        @PathVariable Long id,
        @RequestBody Map<String, Object> request
    ) {
        try {
            String title = (String) request.getOrDefault("title", null);
            String description = (String) request.getOrDefault("description", null);
            String priority = (String) request.getOrDefault("priority_key", null);
            Object estimatedHours = request.getOrDefault("estimated_hours", null);
            String dueDate = (String) request.getOrDefault("due_date", null);
            
            List<String> updates = new ArrayList<>();
            List<Object> params = new ArrayList<>();
            
            if (title != null) {
                updates.add("title = ?");
                params.add(title);
            }
            if (description != null) {
                updates.add("description = ?");
                params.add(description);
            }
            if (priority != null) {
                updates.add("priority_key = ?");
                params.add(priority);
            }
            if (estimatedHours != null) {
                updates.add("estimated_hours = ?");
                params.add(estimatedHours);
            }
            if (dueDate != null) {
                updates.add("due_date = ?");
                params.add(dueDate);
            }
            
            updates.add("updated_at = NOW()");
            params.add(id);
            
            if (updates.size() == 1) {
                return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", "Nenhum campo para atualizar")
                );
            }
            
            String updateSql = "UPDATE task_management SET " + String.join(", ", updates) + " WHERE id = ?";
            int updatedRows = jdbcTemplate.update(updateSql, params.toArray());
            
            if (updatedRows == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("success", false, "error", "Ticket não encontrado")
                );
            }
            
            String selectSql = "SELECT id, ticket_number, task_id, title, priority_key FROM task_management WHERE id = ?";
            Map<String, Object> result = jdbcTemplate.queryForMap(selectSql, id);
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "message", "Ticket atualizado com sucesso",
                    "ticket", result
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao atualizar: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 9. DELETAR TICKET (DELETE /tickets/{id})
    // ============================================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        try {
            String deleteSql = "DELETE FROM task_management WHERE id = ?";
            int deleted = jdbcTemplate.update(deleteSql, id);
            
            if (deleted == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of("success", false, "error", "Ticket não encontrado")
                );
            }
            
            return ResponseEntity.ok(
                Map.of(
                    "success", true,
                    "message", "Ticket deletado com sucesso"
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "error", "Erro ao deletar: " + e.getMessage())
            );
        }
    }

    // ============================================================================
    // 10. CRIAR NOVO TICKET (POST /tickets/create)
    // ============================================================================
    @PostMapping("/create")
    public ResponseEntity<?> createTicket(@RequestBody Map<String, Object> request) {
        try {
            String taskId = (String) request.getOrDefault("task_id", "TASK-" + System.currentTimeMillis());
            String title = (String) request.get("title");
            String description = (String) request.getOrDefault("description", "");
            String priority = (String) request.getOrDefault("priority_key", "NORMAL");
            Object estimatedHours = request.getOrDefault("estimated_hours", 0.0);
            String dueDate = (String) request.getOrDefault("due_date", null);
            
            if (title == null || title.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("success", false, "error", "Título é obrigatório")
                );
            }
            
            String insertSql = "INSERT INTO task_management " +
                "(task_id, title, description, current_stage_id, priority_key, " +
                "estimated_hours, due_date, tags, category, created_at, updated_at) " +
                "VALUES (?, ?, ?, 2, ?, ?, ?, ?, 'Ticket', NOW(), NOW())";
            
            jdbcTemplate.update(insertSql,
                taskId, title, description, priority, estimatedHours, dueDate, priority.toLowerCase()
            );
            
            // Recuperar o ticket criado com o número gerado
            String selectSql = "SELECT id, ticket_number, task_id, title FROM task_management WHERE task_id = ? LIMIT 1";
            Map<String, Object> result = jdbcTemplate.queryForMap(selectSql, taskId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                    "success", true,
                    "message", "Ticket criado com sucesso",
                    "ticket_number", result.get("ticket_number"),
                    "task_id", result.get("task_id"),
                    "id", result.get("id")
                )
            );
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of("success", false, "error", "Erro ao criar ticket: " + e.getMessage())
            );
        }
    }
}
