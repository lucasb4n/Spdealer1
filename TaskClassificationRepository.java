// src/main/java/com/spdealer/api/repository/TaskClassificationRepository.java
package com.spdealer.api.repository;

import com.spdealer.api.entity.ClassificationValue;
import com.spdealer.api.entity.TaskClassification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * TaskClassificationRepository
 * 
 * Repositorio JPA para operacoes com a tabela task_classifications
 * 
 * SQL Subjacente (conceitual):
 * CREATE TABLE task_classifications (
 *   id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 *   task_id INT UNSIGNED NOT NULL,
 *   classification_value_id INT UNSIGNED NOT NULL,
 *   FOREIGN KEY (task_id) REFERENCES task_management(id),
 *   FOREIGN KEY (classification_value_id) REFERENCES classification_values(id),
 *   UNIQUE KEY uk_task_value (task_id, classification_value_id)
 * );
 */
@Repository
public interface TaskClassificationRepository extends JpaRepository<TaskClassification, Long> {

    /**
     * Busca todas as classificacoes de uma tarefa especifica
     * 
     * SQL Gerado:
     * SELECT * FROM task_classifications WHERE task_id = ?
     * 
     * @param taskId - ID da tarefa
     * @return Lista de classificacoes
     */
    List<TaskClassification> findByTaskManagementId(Long taskId);

    /**
     * Busca todas as tarefas que tem uma classificacao especifica
     * 
     * SQL Gerado:
     * SELECT * FROM task_classifications WHERE classification_value_id = ?
     * 
     * @param classValue - Valor de classificacao
     * @return Lista de task_classifications
     */
    List<TaskClassification> findByClassificationValue(ClassificationValue classValue);

    /**
     * Busca uma classificacao especifica (task + value)
     * 
     * SQL Gerado:
     * SELECT * FROM task_classifications 
     * WHERE task_id = ? AND classification_value_id = ?
     * 
     * @param taskId - ID da tarefa
     * @param classValueId - ID do valor de classificacao
     * @return TaskClassification se existir
     */
    Optional<TaskClassification> findByTaskManagementIdAndClassificationValueId(
        Long taskId, Long classValueId);

    /**
     * QUERY CUSTOMIZADA - Busca tarefas por multiplas classificacoes
     * 
     * Logica:
     * 1. Busca tarefas que tem a classificacao1 OU classificacao2 OU ...
     * 2. Agrupa por task_id
     * 3. Filtra apenas tarefas que aparecem em TODAS as listas
     * 4. Retorna os IDs das tarefas
     * 
     * SQL Gerado (exemplo com 2 valores):
     * SELECT tc.task_id FROM task_classifications tc
     * WHERE tc.classification_value_id IN (?, ?)
     * GROUP BY tc.task_id
     * HAVING COUNT(DISTINCT tc.classification_value_id) = 2
     * 
     * @param classificationValueIds - Lista de classification_value_ids
     * @param expectedCount - Numero esperado de matches (para AND logic)
     * @return Lista de task_ids que correspondem a TODOS os valores
     */
    @Query(value = "SELECT DISTINCT tc.task_id FROM task_classifications tc " +
                   "WHERE tc.classification_value_id IN :ids " +
                   "GROUP BY tc.task_id " +
                   "HAVING COUNT(DISTINCT tc.classification_value_id) = :count",
           nativeQuery = true)
    List<Long> findTaskIdsByMultipleClassifications(
        @Param("ids") List<Long> classificationValueIds,
        @Param("count") int expectedCount);

    /**
     * QUERY CUSTOMIZADA - Retorna resumo de classificacoes por tarefa
     * 
     * Util para diagnostico e verificacao de dados
     * 
     * SQL Gerado (conceitual):
     * SELECT 
     *   tc.task_id,
     *   ct.type_name,
     *   cv.value_name,
     *   COUNT(*) as count
     * FROM task_classifications tc
     * JOIN classification_values cv ON tc.classification_value_id = cv.id
     * JOIN classification_types ct ON cv.classification_type_id = ct.id
     * GROUP BY tc.task_id, ct.type_name, cv.value_name
     * 
     * @return List<Object[]> com [task_id, type_name, value_name, count]
     */
    @Query(value = "SELECT " +
                   "  tc.task_id, " +
                   "  ct.type_name, " +
                   "  cv.value_name, " +
                   "  COUNT(*) as count " +
                   "FROM task_classifications tc " +
                   "JOIN classification_values cv ON tc.classification_value_id = cv.id " +
                   "JOIN classification_types ct ON cv.classification_type_id = ct.id " +
                   "GROUP BY tc.task_id, ct.type_name, cv.value_name " +
                   "ORDER BY tc.task_id, ct.type_name",
           nativeQuery = true)
    List<Object[]> getClassificationSummary();

    /**
     * Delete todas as classificacoes de uma tarefa
     * Util ao deletar uma tarefa
     * 
     * SQL Gerado:
     * DELETE FROM task_classifications WHERE task_id = ?
     * 
     * @param taskId - ID da tarefa
     */
    void deleteByTaskManagementId(Long taskId);
}
