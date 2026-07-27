// src/main/java/com/spdealer/api/service/ClassificationFilterService.java
package com.spdealer.api.service;

import com.spdealer.api.dto.ClassificationFilterDTO;
import com.spdealer.api.dto.TaskDTO;
import com.spdealer.api.entity.ClassificationType;
import com.spdealer.api.entity.ClassificationValue;
import com.spdealer.api.entity.TaskClassification;
import com.spdealer.api.entity.TaskManagement;
import com.spdealer.api.repository.ClassificationTypeRepository;
import com.spdealer.api.repository.ClassificationValueRepository;
import com.spdealer.api.repository.TaskClassificationRepository;
import com.spdealer.api.repository.TaskManagementRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ClassificationFilterService
 * 
 * Responsavel por:
 * 1. Retornar tipos de classificacao (Projeto, Modulo, etc)
 * 2. Retornar valores de cada tipo
 * 3. Filtrar tarefas por classificacoes
 * 
 * Trabalha com as tabelas:
 * - classification_types (13 tipos)
 * - classification_values (69 valores)
 * - task_classifications (link entre tarefas e classificacoes)
 * - task_management (tarefas)
 */
@Slf4j
@Service
public class ClassificationFilterService {

    @Autowired
    private ClassificationTypeRepository classificationTypeRepository;

    @Autowired
    private ClassificationValueRepository classificationValueRepository;

    @Autowired
    private TaskClassificationRepository taskClassificationRepository;

    @Autowired
    private TaskManagementRepository taskManagementRepository;

    /**
     * Retorna todos os tipos de classificacao
     * 
     * @return Lista com 13 tipos: Projeto, Modulo, Tipo de Trabalho, etc
     */
    public List<ClassificationTypeDTO> getAllClassificationTypes() {
        log.info("Buscando todos os tipos de classificacao");
        
        List<ClassificationType> types = classificationTypeRepository.findAll();
        
        return types.stream()
            .map(this::convertTypeToDTO)
            .sorted(Comparator.comparing(ClassificationTypeDTO::getOrdem))
            .collect(Collectors.toList());
    }

    /**
     * Retorna os valores de um tipo de classificacao especifico
     * 
     * Exemplo: getAllValuesByTypeKey("projeto") retorna: spdealer, outro-projeto, etc
     * 
     * @param typeKey - Chave do tipo (ex: "projeto", "modulo", "tipo_trabalho")
     * @return Lista de valores para esse tipo
     */
    public List<ClassificationValueDTO> getValuesByTypeKey(String typeKey) {
        log.info("Buscando valores para tipo: {}", typeKey);
        
        ClassificationType type = classificationTypeRepository.findByTypeKey(typeKey)
            .orElseThrow(() -> new RuntimeException("Tipo de classificacao nao encontrado: " + typeKey));
        
        List<ClassificationValue> values = classificationValueRepository.findByClassificationType(type);
        
        return values.stream()
            .map(this::convertValueToDTO)
            .sorted(Comparator.comparing(ClassificationValueDTO::getOrdem))
            .collect(Collectors.toList());
    }

    /**
     * Filtra tarefas aplicando criterios de classificacao
     * 
     * Workflow:
     * 1. Se nao ha filtros ativos, retorna todas as tarefas
     * 2. Se ha filtros, busca task_ids que correspondem aos filtros
     * 3. Retorna as tarefas paginadas
     * 
     * @param filters - DTO com filtros (projeto, modulo, etc)
     * @param pageable - Configuracao de paginacao
     * @return Page com tarefas filtradas
     */
    public Page<TaskDTO> filterTasks(ClassificationFilterDTO filters, Pageable pageable) {
        log.info("Filtrando tarefas com: {}", filters);
        
        if (!filters.hasActiveFilters()) {
            log.debug("Nenhum filtro ativo, retornando todas as tarefas");
            Page<TaskManagement> allTasks = taskManagementRepository.findAll(pageable);
            return allTasks.map(this::convertTaskToDTO);
        }

        // Busca as tarefas que correspondem aos filtros
        List<Long> matchingTaskIds = findTaskIdsByFilters(filters);
        
        if (matchingTaskIds.isEmpty()) {
            log.debug("Nenhuma tarefa encontrada com os filtros especificados");
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        // Busca as tarefas com paginacao
        Page<TaskManagement> tasks = taskManagementRepository.findAllByIdIn(matchingTaskIds, pageable);
        
        return tasks.map(this::convertTaskToDTO);
    }

    /**
     * Encontra IDs de tarefas que correspondem aos filtros
     * 
     * Logica:
     * 1. Se tem filtro de projeto, busca tasks com essa classificacao
     * 2. Se tem filtro de modulo, INTERSECTA com resultado anterior
     * 3. Repete para cada filtro ativo
     * 4. Retorna apenas as tarefas que correspondem a TODOS os filtros
     * 
     * @param filters - Filtros a aplicar
     * @return Set de task_ids que correspondem a todos os filtros
     */
    private List<Long> findTaskIdsByFilters(ClassificationFilterDTO filters) {
        Set<Long> resultSet = null; // null significa "primeira iteracao"
        
        // Filtro: Projeto
        if (filters.getProjeto() != null) {
            Set<Long> projetos = findTaskIdsByValue("projeto", filters.getProjeto());
            resultSet = intersectSets(resultSet, projetos);
        }
        
        // Filtro: Modulo
        if (filters.getModulo() != null) {
            Set<Long> modulos = findTaskIdsByValue("modulo", filters.getModulo());
            resultSet = intersectSets(resultSet, modulos);
        }
        
        // Filtro: Tipo de Trabalho
        if (filters.getTipoTrabalho() != null) {
            Set<Long> tipos = findTaskIdsByValue("tipo_trabalho", filters.getTipoTrabalho());
            resultSet = intersectSets(resultSet, tipos);
        }
        
        // Filtro: Categoria
        if (filters.getCategoria() != null) {
            Set<Long> categorias = findTaskIdsByValue("categoria", filters.getCategoria());
            resultSet = intersectSets(resultSet, categorias);
        }
        
        // Filtro: Prioridade (busca em task_management.priority_key, nao em classificacoes)
        if (filters.getPrioridade() != null) {
            Set<Long> prioridades = findTaskIdsByPriority(filters.getPrioridade());
            resultSet = intersectSets(resultSet, prioridades);
        }
        
        return resultSet != null ? new ArrayList<>(resultSet) : new ArrayList<>();
    }

    /**
     * Busca tasks que tem uma classificacao especifica
     * 
     * Query (conceitual):
     * SELECT DISTINCT task_id FROM task_classifications tc
     * WHERE tc.classification_type_id = (tipo desejado)
     * AND tc.classification_value_id = (valor desejado)
     * 
     * @param typeKey - Ex: "projeto"
     * @param value - Ex: "spdealer"
     * @return Set de task_ids
     */
    private Set<Long> findTaskIdsByValue(String typeKey, String value) {
        log.debug("Buscando tasks com {}={}", typeKey, value);
        
        ClassificationType type = classificationTypeRepository.findByTypeKey(typeKey)
            .orElseThrow(() -> new RuntimeException("Tipo nao encontrado: " + typeKey));
        
        ClassificationValue classValue = classificationValueRepository
            .findByClassificationTypeAndValueKey(type, value)
            .orElseThrow(() -> new RuntimeException("Valor nao encontrado: " + typeKey + "=" + value));
        
        // Busca em task_classifications
        List<TaskClassification> classifications = taskClassificationRepository
            .findByClassificationValue(classValue);
        
        Set<Long> taskIds = classifications.stream()
            .map(tc -> tc.getTaskManagement().getId())
            .collect(Collectors.toSet());
        
        log.debug("Encontradas {} tasks para {}={}", taskIds.size(), typeKey, value);
        return taskIds;
    }

    /**
     * Busca tasks por prioridade
     * 
     * Query (conceitual):
     * SELECT id FROM task_management WHERE priority_key = ?
     * 
     * @param priorityKey - Ex: "high", "medium", "low"
     * @return Set de task_ids
     */
    private Set<Long> findTaskIdsByPriority(String priorityKey) {
        log.debug("Buscando tasks com prioridade: {}", priorityKey);
        
        List<TaskManagement> tasks = taskManagementRepository.findByPriorityKey(priorityKey);
        
        Set<Long> taskIds = tasks.stream()
            .map(TaskManagement::getId)
            .collect(Collectors.toSet());
        
        log.debug("Encontradas {} tasks com prioridade {}", taskIds.size(), priorityKey);
        return taskIds;
    }

    /**
     * Faz intersecao entre dois conjuntos
     * 
     * Logica:
     * - Se resultSet eh null (primeira vez), retorna o novo set
     * - Caso contrario, retorna apenas elementos que existem em AMBOS
     * 
     * Exemplo:
     * resultSet = {1, 2, 3}
     * newSet = {2, 3, 4}
     * resultado = {2, 3}
     * 
     * @param resultSet - Resultado anterior (pode ser null)
     * @param newSet - Novo conjunto a intersectar
     * @return Set com intersecao
     */
    private Set<Long> intersectSets(Set<Long> resultSet, Set<Long> newSet) {
        if (resultSet == null) {
            return newSet;
        }
        
        Set<Long> intersection = new HashSet<>(resultSet);
        intersection.retainAll(newSet);
        
        log.debug("Intersecao: {} AND {} = {}", resultSet.size(), newSet.size(), intersection.size());
        return intersection;
    }

    /**
     * Converte ClassificationType entity para DTO
     */
    private ClassificationTypeDTO convertTypeToDTO(ClassificationType type) {
        return ClassificationTypeDTO.builder()
            .id(type.getId())
            .typeKey(type.getTypeKey())
            .typeName(type.getTypeName())
            .ordem(type.getOrdem())
            .build();
    }

    /**
     * Converte ClassificationValue entity para DTO
     */
    private ClassificationValueDTO convertValueToDTO(ClassificationValue value) {
        return ClassificationValueDTO.builder()
            .id(value.getId())
            .valueKey(value.getValueKey())
            .valueName(value.getValueName())
            .ordem(value.getOrdem())
            .typeKey(value.getClassificationType().getTypeKey())
            .build();
    }

    /**
     * Converte TaskManagement entity para DTO
     */
    private TaskDTO convertTaskToDTO(TaskManagement task) {
        return TaskDTO.builder()
            .id(task.getId())
            .taskId(task.getTaskId())
            .title(task.getTitle())
            .priorityKey(task.getPriorityKey())
            .currentStageId(task.getCurrentStageId())
            .dueDate(task.getDueDate())
            .build();
    }

    // ============================================================
    // DTOs AUXILIARES (para uso interno - copiar para arquivo separado depois)
    // ============================================================

    public static class ClassificationTypeDTO {
        public Long id;
        public String typeKey;
        public String typeName;
        public Integer ordem;

        // Builder pattern
        public static ClassificationTypeDTOBuilder builder() {
            return new ClassificationTypeDTOBuilder();
        }

        public static class ClassificationTypeDTOBuilder {
            private Long id;
            private String typeKey;
            private String typeName;
            private Integer ordem;

            public ClassificationTypeDTOBuilder id(Long id) { this.id = id; return this; }
            public ClassificationTypeDTOBuilder typeKey(String typeKey) { this.typeKey = typeKey; return this; }
            public ClassificationTypeDTOBuilder typeName(String typeName) { this.typeName = typeName; return this; }
            public ClassificationTypeDTOBuilder ordem(Integer ordem) { this.ordem = ordem; return this; }

            public ClassificationTypeDTO build() {
                ClassificationTypeDTO dto = new ClassificationTypeDTO();
                dto.id = this.id;
                dto.typeKey = this.typeKey;
                dto.typeName = this.typeName;
                dto.ordem = this.ordem;
                return dto;
            }
        }

        // Getters
        public Long getId() { return id; }
        public String getTypeKey() { return typeKey; }
        public String getTypeName() { return typeName; }
        public Integer getOrdem() { return ordem; }
    }

    public static class ClassificationValueDTO {
        public Long id;
        public String valueKey;
        public String valueName;
        public Integer ordem;
        public String typeKey;

        // Builder pattern
        public static ClassificationValueDTOBuilder builder() {
            return new ClassificationValueDTOBuilder();
        }

        public static class ClassificationValueDTOBuilder {
            private Long id;
            private String valueKey;
            private String valueName;
            private Integer ordem;
            private String typeKey;

            public ClassificationValueDTOBuilder id(Long id) { this.id = id; return this; }
            public ClassificationValueDTOBuilder valueKey(String valueKey) { this.valueKey = valueKey; return this; }
            public ClassificationValueDTOBuilder valueName(String valueName) { this.valueName = valueName; return this; }
            public ClassificationValueDTOBuilder ordem(Integer ordem) { this.ordem = ordem; return this; }
            public ClassificationValueDTOBuilder typeKey(String typeKey) { this.typeKey = typeKey; return this; }

            public ClassificationValueDTO build() {
                ClassificationValueDTO dto = new ClassificationValueDTO();
                dto.id = this.id;
                dto.valueKey = this.valueKey;
                dto.valueName = this.valueName;
                dto.ordem = this.ordem;
                dto.typeKey = this.typeKey;
                return dto;
            }
        }

        // Getters
        public Long getId() { return id; }
        public String getValueKey() { return valueKey; }
        public String getValueName() { return valueName; }
        public Integer getOrdem() { return ordem; }
        public String getTypeKey() { return typeKey; }
    }
}
