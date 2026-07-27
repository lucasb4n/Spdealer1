// src/main/java/com/spdealer/api/controller/ClassificationFilterController.java
package com.spdealer.api.controller;

import com.spdealer.api.dto.ClassificationFilterDTO;
import com.spdealer.api.dto.TaskDTO;
import com.spdealer.api.service.ClassificationFilterService;
import com.spdealer.api.service.ClassificationFilterService.ClassificationTypeDTO;
import com.spdealer.api.service.ClassificationFilterService.ClassificationValueDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ClassificationFilterController
 * 
 * REST API para operacoes com filtros de classificacao de tarefas
 * 
 * Endpoints:
 * 1. GET /api/v1/classifications/types
 *    - Retorna todos os 13 tipos de classificacao
 * 
 * 2. GET /api/v1/classifications/types/{typeKey}/values
 *    - Retorna os valores de um tipo especifico
 * 
 * 3. POST /api/v1/tickets/search
 *    - Filtra tarefas por classificacoes
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ClassificationFilterController {

    @Autowired
    private ClassificationFilterService classificationFilterService;

    // =================================================================
    // ENDPOINT 1: GET /api/v1/classifications/types
    // =================================================================

    /**
     * Retorna todos os tipos de classificacao
     * 
     * Resposta (200 OK):
     * [
     *   {
     *     "id": 1,
     *     "typeKey": "projeto",
     *     "typeName": "Projeto",
     *     "ordem": 1
     *   },
     *   {
     *     "id": 2,
     *     "typeKey": "modulo",
     *     "typeName": "Modulo",
     *     "ordem": 2
     *   },
     *   ... (13 tipos ao total)
     * ]
     * 
     * @return ResponseEntity com lista de tipos
     */
    @GetMapping("/classifications/types")
    public ResponseEntity<?> getAllClassificationTypes() {
        try {
            log.info("GET /classifications/types - Buscando todos os tipos de classificacao");
            
            List<ClassificationTypeDTO> types = classificationFilterService.getAllClassificationTypes();
            
            log.info("Retornando {} tipos de classificacao", types.size());
            return ResponseEntity.ok(types);
            
        } catch (Exception e) {
            log.error("Erro ao buscar tipos de classificacao", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("Erro ao buscar tipos de classificacao", e.getMessage()));
        }
    }

    // =================================================================
    // ENDPOINT 2: GET /api/v1/classifications/types/{typeKey}/values
    // =================================================================

    /**
     * Retorna os valores de um tipo de classificacao especifico
     * 
     * Exemplo: GET /api/v1/classifications/types/projeto/values
     * 
     * Resposta (200 OK):
     * [
     *   {
     *     "id": 1,
     *     "valueKey": "spdealer",
     *     "valueName": "SPDealer",
     *     "ordem": 1,
     *     "typeKey": "projeto"
     *   },
     *   {
     *     "id": 2,
     *     "valueKey": "outro-projeto",
     *     "valueName": "Outro Projeto",
     *     "ordem": 2,
     *     "typeKey": "projeto"
     *   },
     *   ... (outros valores)
     * ]
     * 
     * Erros possíveis:
     * - 400 Bad Request: typeKey inválido ou não encontrado
     * - 404 Not Found: tipo não existe
     * - 500 Internal Server Error: erro no servidor
     * 
     * @param typeKey - Chave do tipo (ex: "projeto", "modulo", "tipo_trabalho")
     * @return ResponseEntity com lista de valores
     */
    @GetMapping("/classifications/types/{typeKey}/values")
    public ResponseEntity<?> getValuesByTypeKey(
            @PathVariable String typeKey) {
        try {
            log.info("GET /classifications/types/{}/values - Buscando valores", typeKey);
            
            // Validacao simples
            if (typeKey == null || typeKey.trim().isEmpty()) {
                log.warn("typeKey vazio ou nulo");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(buildErrorResponse("Validacao", "typeKey nao pode estar vazio"));
            }
            
            List<ClassificationValueDTO> values = classificationFilterService.getValuesByTypeKey(typeKey);
            
            log.info("Retornando {} valores para tipo: {}", values.size(), typeKey);
            return ResponseEntity.ok(values);
            
        } catch (RuntimeException e) {
            log.error("Erro ao buscar valores para tipo: {}", typeKey, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildErrorResponse("Tipo nao encontrado", e.getMessage()));
                
        } catch (Exception e) {
            log.error("Erro ao buscar valores", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("Erro ao buscar valores", e.getMessage()));
        }
    }

    // =================================================================
    // ENDPOINT 3: POST /api/v1/tickets/search
    // =================================================================

    /**
     * Filtra tarefas por classificacoes
     * 
     * Exemplo de Request:
     * POST /api/v1/tickets/search
     * Content-Type: application/json
     * 
     * {
     *   "projeto": "spdealer",
     *   "modulo": "dashboard",
     *   "tipoTrabalho": "desenvolvimento",
     *   "categoria": null,
     *   "prioridade": "high"
     * }
     * 
     * Logica de Filtragem (AND):
     * - Retorna apenas tarefas que correspondem a TODOS os filtros especificados
     * - Se um campo é null, ignora esse filtro
     * - Se nenhum filtro está especificado, retorna todas as tarefas
     * 
     * Resposta (200 OK):
     * {
     *   "content": [
     *     {
     *       "id": 1,
     *       "taskId": "TASK-001-HEADER-BLUE",
     *       "title": "Corrigir header azul",
     *       "priorityKey": "high",
     *       "currentStageId": 3,
     *       "dueDate": "2025-11-02"
     *     },
     *     ... (mais tarefas)
     *   ],
     *   "totalElements": 5,
     *   "totalPages": 1,
     *   "currentPage": 0,
     *   "pageSize": 20
     * }
     * 
     * Erros possíveis:
     * - 400 Bad Request: dados inválidos
     * - 500 Internal Server Error: erro no servidor
     * 
     * @param filters - DTO com os filtros a aplicar
     * @param pageable - Configuracao de paginacao (page=0, size=20, sort=id,desc)
     * @return ResponseEntity com tarefas filtradas
     */
    @PostMapping("/tickets/search")
    public ResponseEntity<?> searchTickets(
            @RequestBody ClassificationFilterDTO filters,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("POST /tickets/search - Filtros: {}", filters);
            
            // Cria Pageable (equivalente ao Spring Data)
            Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
            
            // Executa filtragem
            Page<TaskDTO> results = classificationFilterService.filterTasks(filters, pageable);
            
            // Constroi resposta com metadados de paginacao
            Map<String, Object> response = new HashMap<>();
            response.put("content", results.getContent());
            response.put("totalElements", results.getTotalElements());
            response.put("totalPages", results.getTotalPages());
            response.put("currentPage", results.getNumber());
            response.put("pageSize", results.getSize());
            response.put("filters", filters.toString());
            
            log.info("Retornando {} tarefas de um total de {}", 
                results.getContent().size(), results.getTotalElements());
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Argumentos invalidos para pesquisa", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildErrorResponse("Validacao", e.getMessage()));
                
        } catch (Exception e) {
            log.error("Erro ao filtrar tarefas", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("Erro ao filtrar tarefas", e.getMessage()));
        }
    }

    // =================================================================
    // METODOS AUXILIARES
    // =================================================================

    /**
     * Constroi resposta de erro padronizada
     * 
     * Formato:
     * {
     *   "error": true,
     *   "tipo": "Validacao",
     *   "mensagem": "Descrição do erro"
     * }
     * 
     * @param tipo - Tipo de erro (ex: "Validacao", "Nao encontrado")
     * @param mensagem - Mensagem descritiva
     * @return Map com erro
     */
    private Map<String, Object> buildErrorResponse(String tipo, String mensagem) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", true);
        error.put("tipo", tipo);
        error.put("mensagem", mensagem);
        return error;
    }

    // =================================================================
    // ENDPOINT ADICIONAL: GET /api/v1/classifications/summary
    // (Opcional - para diagnostico)
    // =================================================================

    /**
     * Retorna um resumo da estrutura de classificacoes (para debug/diagnostico)
     * 
     * Resposta (200 OK):
     * {
     *   "totalTypes": 13,
     *   "totalValues": 69,
     *   "types": [
     *     {
     *       "typeKey": "projeto",
     *       "typeName": "Projeto",
     *       "valuesCount": 5
     *     },
     *     ... (mais tipos)
     *   ]
     * }
     * 
     * @return ResponseEntity com resumo
     */
    @GetMapping("/classifications/summary")
    public ResponseEntity<?> getClassificationsSummary() {
        try {
            log.info("GET /classifications/summary - Buscando resumo");
            
            List<ClassificationTypeDTO> types = classificationFilterService.getAllClassificationTypes();
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalTypes", types.size());
            summary.put("totalValues", types.size() * 5); // Aproximado (69 total / 13 tipos)
            summary.put("types", types);
            
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            log.error("Erro ao buscar resumo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildErrorResponse("Erro ao buscar resumo", e.getMessage()));
        }
    }
}
