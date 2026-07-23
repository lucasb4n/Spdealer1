package com.spdealer.api.repository;

import com.spdealer.api.dto.SearchResultDTO;

import java.util.List;

/**
 * Interface: TaskManagementSearchRepositoryCustom
 * Define as operações de busca customizadas
 */
public interface TaskManagementSearchRepositoryCustom {

    /**
     * Busca tarefas por termo (task_id, title, description)
     */
    List<SearchResultDTO> searchByTerm(String searchTerm);

    /**
     * Busca por módulo específico
     */
    List<SearchResultDTO> searchByModule(String moduleKey);

    /**
     * Busca por prioridade
     */
    List<SearchResultDTO> searchByPriority(String priorityKey);

    /**
     * Atualiza o stage de uma tarefa (Kanban drag-and-drop)
     * @param taskId ID da tarefa
     * @param newStageId Novo stage (2, 3, 4, 5)
     * @return número de linhas atualizadas
     */
    int updateTaskStage(Long taskId, Long newStageId);
}
