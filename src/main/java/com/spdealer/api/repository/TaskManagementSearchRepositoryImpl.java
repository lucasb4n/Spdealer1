package com.spdealer.api.repository;

import com.spdealer.api.dto.SearchResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Repository: TaskManagementSearchRepositoryImpl
 * Implementação concreta de busca em task_management usando JdbcTemplate
 * 
 * Queries SQL diretas contra MariaDB
 * Não depende de entidades JPA
 */
@Repository("taskManagementSearchRepository")
@RequiredArgsConstructor
@Slf4j
public class TaskManagementSearchRepositoryImpl implements TaskManagementSearchRepositoryCustom {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Busca tarefas por termo (task_id, title, description)
     * Prioriza matches exatos em task_id
     */
    @Override
    public List<SearchResultDTO> searchByTerm(String searchTerm) {
        log.info("[TaskManagementSearchRepositoryImpl] Buscando por termo: '{}'", searchTerm);
        
        if (searchTerm == null || searchTerm.trim().length() < 2) {
            log.warn("[TaskManagementSearchRepositoryImpl] Termo muito curto: '{}'", searchTerm);
            return List.of();
        }

        String likePattern = "%" + searchTerm + "%";
        
        String sql = """
            SELECT 
                id, 
                task_id, 
                title, 
                description, 
                priority_key, 
                module_key, 
                current_stage_id, 
                estimated_hours, 
                due_date, 
                category_key,
                CASE WHEN task_id LIKE ? THEN 1 ELSE 0 END as is_exact_match
            FROM task_management
            WHERE 
                task_id LIKE ? 
                OR title LIKE ? 
                OR description LIKE ?
            ORDER BY 
                is_exact_match DESC,
                task_id ASC
            LIMIT 50
            """;

        try {
            List<SearchResultDTO> results = jdbcTemplate.query(sql, 
                new Object[]{searchTerm + "%", likePattern, likePattern, likePattern},
                (rs, rowNum) -> SearchResultDTO.builder()
                    .id(rs.getLong("id"))
                    .taskId(rs.getString("task_id"))
                    .title(rs.getString("title"))
                    .description(rs.getString("description"))
                    .priorityKey(rs.getString("priority_key"))
                    .moduleKey(rs.getString("module_key"))
                    .currentStageId(rs.getInt("current_stage_id"))
                    .estimatedHours(rs.getObject("estimated_hours") != null ? 
                        rs.getDouble("estimated_hours") : null)
                    .dueDate(rs.getDate("due_date") != null ? 
                        rs.getDate("due_date").toLocalDate() : null)
                    .categoryKey(rs.getString("category_key"))
                    .isExactMatch(rs.getBoolean("is_exact_match") ? 1 : 0)
                    .build()
            );

            log.info("[TaskManagementSearchRepositoryImpl] ✅ {} resultados encontrados", results.size());
            return results;

        } catch (Exception e) {
            log.error("[TaskManagementSearchRepositoryImpl] ❌ Erro ao buscar por termo: {}", e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Busca tarefas por módulo específico
     */
    @Override
    public List<SearchResultDTO> searchByModule(String moduleKey) {
        log.info("[TaskManagementSearchRepositoryImpl] Buscando por módulo: '{}'", moduleKey);
        
        if (moduleKey == null || moduleKey.trim().isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT 
                id, task_id, title, description, priority_key, module_key, 
                current_stage_id, estimated_hours, due_date, category_key
            FROM task_management
            WHERE module_key = ?
            ORDER BY task_id ASC
            LIMIT 50
            """;

        try {
            List<SearchResultDTO> results = jdbcTemplate.query(sql, 
                new Object[]{moduleKey},
                (rs, rowNum) -> SearchResultDTO.builder()
                    .id(rs.getLong("id"))
                    .taskId(rs.getString("task_id"))
                    .title(rs.getString("title"))
                    .description(rs.getString("description"))
                    .priorityKey(rs.getString("priority_key"))
                    .moduleKey(rs.getString("module_key"))
                    .currentStageId(rs.getInt("current_stage_id"))
                    .estimatedHours(rs.getObject("estimated_hours") != null ? 
                        rs.getDouble("estimated_hours") : null)
                    .dueDate(rs.getDate("due_date") != null ? 
                        rs.getDate("due_date").toLocalDate() : null)
                    .categoryKey(rs.getString("category_key"))
                    .isExactMatch(0)
                    .build()
            );

            log.info("[TaskManagementSearchRepositoryImpl] ✅ {} resultados encontrados por módulo", results.size());
            return results;

        } catch (Exception e) {
            log.error("[TaskManagementSearchRepositoryImpl] ❌ Erro ao buscar por módulo: {}", e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Busca tarefas por prioridade
     */
    @Override
    public List<SearchResultDTO> searchByPriority(String priorityKey) {
        log.info("[TaskManagementSearchRepositoryImpl] Buscando por prioridade: '{}'", priorityKey);
        
        if (priorityKey == null || priorityKey.trim().isEmpty()) {
            return List.of();
        }

        String sql = """
            SELECT 
                id, task_id, title, description, priority_key, module_key, 
                current_stage_id, estimated_hours, due_date, category_key
            FROM task_management
            WHERE priority_key = ?
            ORDER BY task_id ASC
            LIMIT 50
            """;

        try {
            List<SearchResultDTO> results = jdbcTemplate.query(sql, 
                new Object[]{priorityKey},
                (rs, rowNum) -> SearchResultDTO.builder()
                    .id(rs.getLong("id"))
                    .taskId(rs.getString("task_id"))
                    .title(rs.getString("title"))
                    .description(rs.getString("description"))
                    .priorityKey(rs.getString("priority_key"))
                    .moduleKey(rs.getString("module_key"))
                    .currentStageId(rs.getInt("current_stage_id"))
                    .estimatedHours(rs.getObject("estimated_hours") != null ? 
                        rs.getDouble("estimated_hours") : null)
                    .dueDate(rs.getDate("due_date") != null ? 
                        rs.getDate("due_date").toLocalDate() : null)
                    .categoryKey(rs.getString("category_key"))
                    .isExactMatch(0)
                    .build()
            );

            log.info("[TaskManagementSearchRepositoryImpl] ✅ {} resultados encontrados por prioridade", results.size());
            return results;

        } catch (Exception e) {
            log.error("[TaskManagementSearchRepositoryImpl] ❌ Erro ao buscar por prioridade: {}", e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Atualiza o stage/status de uma tarefa (Kanban drag-and-drop)
     */
    @Override
    public int updateTaskStage(Long taskId, Long newStageId) {
        log.info("[TaskManagementSearchRepositoryImpl] Atualizando tarefa {} para stage {}", taskId, newStageId);

        try {
            if (taskId == null || newStageId == null) {
                log.warn("[TaskManagementSearchRepositoryImpl] Parâmetros nulos: taskId={}, stageId={}", taskId, newStageId);
                return 0;
            }

            String sql = """
                UPDATE task_management 
                SET current_stage_id = ?,
                    updated_at = NOW()
                WHERE id = ?
            """;

            int rowsUpdated = jdbcTemplate.update(sql, newStageId, taskId);

            if (rowsUpdated > 0) {
                log.info("[TaskManagementSearchRepositoryImpl] ✅ Tarefa {} movida para stage {}", taskId, newStageId);
            } else {
                log.warn("[TaskManagementSearchRepositoryImpl] ⚠️ Nenhuma linha atualizada - tarefa {} pode não existir", taskId);
            }

            return rowsUpdated;

        } catch (Exception e) {
            log.error("[TaskManagementSearchRepositoryImpl] ❌ Erro ao atualizar stage: {}", e.getMessage(), e);
            return 0;
        }
    }
}
