package br.com.spdealer.controller;

import br.com.spdealer.dto.FilterCriteriaDTO;
import br.com.spdealer.dto.ErrorResponse;
import br.com.spdealer.service.FilterService;
import br.com.spdealer.service.ValidatorService;
import br.com.spdealer.service.DataTypeConverterService;
import br.com.spdealer.service.DictionaryConfigService;
import br.com.spdealer.service.DictionaryConfigService.TableConfig;
import br.com.spdealer.service.DictionaryConfigService.ColumnConfig;
import br.com.spdealer.exception.ValidationException;
import br.com.spdealer.exception.ConversionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

/**
 * DictionaryTableController
 * 
 * Controller genérico para tabelas dictionary-driven do SPDealer.
 * 
 * Endpoints:
 *   GET  /api/{tableName}              - Listar registros (com filtros/busca opcionais)
 *   GET  /api/{tableName}/{id}         - Buscar um registro
 *   POST /api/{tableName}              - Criar novo registro
 *   PUT  /api/{tableName}/{id}         - Atualizar registro
 *   DELETE /api/{tableName}/{id}       - Deletar registro
 * 
 * Query Parameters (GET listar):
 *   - search={termo}                   - Busca global em campos configurados
 *   - filters=[{field, operator, value}]  - Array de filtros avançados (JSON)
 */
@RestController
@RequestMapping("/api")
public class DictionaryTableController {

    private static final Logger logger = LoggerFactory.getLogger(DictionaryTableController.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private FilterService filterService;

    @Autowired
    private ValidatorService validatorService;

    @Autowired
    private DataTypeConverterService converterService;

    @Autowired
    private DictionaryConfigService dictionaryConfigService;

    /**
     * GET /api/{tableName}
     * 
     * Listar registros com filtros avançados e busca global
     * 
     * Exemplo de requisição:
     *   GET /api/masfab?search=ABC&filters=[{"field":"nome_fab","operator":"contains","value":"fornecedor"}]
     * 
     * @param tableName Nome da tabela (ex: masfab, clientes)
     * @param search Termo de busca global (opcional)
     * @param filters Array JSON de filtros (opcional)
     * @return Lista de registros
     */
    @GetMapping("/{tableName}")
    public ResponseEntity<?> listRecords(
            @PathVariable String tableName,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<FilterCriteriaDTO> filters,
            HttpServletRequest request) {
        
        try {
            String resolvedTable = resolveTableName(tableName);
            logger.info("GET /api/{} (resolvido em {}) - search='{}' filters={}", tableName, resolvedTable, search, filters);

            // Carregar configuração dinâmica da tabela
            TableConfig config = dictionaryConfigService.getTableConfig(resolvedTable);
            if (config == null) {
                logger.warn("Tabela não permitida ou não encontrada: {}", tableName);
                return ResponseEntity.status(400).body(
                    Map.of("error", "Tabela não permitida: " + tableName)
                );
            }

            // Construir WHERE clause segura a partir de filtros + busca
            // Usar apenas campos configurados em dictionary_columns com search_visible=1
            FilterService.WhereClause whereClause = filterService.buildWhereClauseWithSearch(
                filters != null ? filters : new ArrayList<>(),
                search,
                config.searchFields,
                config.allowedFields
            );

            // Construir SQL base
            StringBuilder sql = new StringBuilder("SELECT * FROM " + config.tableName);
            if (!whereClause.getSql().isEmpty()) {
                sql.append(" ").append(whereClause.getSql());
            }

            // Adicionar ORDER BY usando a(s) coluna(s) PK da tabela
            String orderBy;
            if (config.primaryKeyColumns != null && !config.primaryKeyColumns.isEmpty()) {
                orderBy = String.join(", ", config.primaryKeyColumns);
            } else {
                orderBy = config.primaryKeyColumn;
            }
            sql.append(" ORDER BY ").append(orderBy).append(" DESC LIMIT 100");

            logger.debug("SQL final: {}", sql);
            logger.debug("Parâmetros: {}", whereClause.getParameters());

            // Executar query
            List<Map<String, Object>> result = jdbcTemplate.queryForList(
                sql.toString(),
                whereClause.getParametersArray()
            );

            logger.info("Retornando {} registros de {}", result.size(), tableName);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            logger.error("Erro de validação: {}", e.getMessage());
            return ResponseEntity.status(400).body(
                Map.of("error", "Erro de validação: " + e.getMessage())
            );
        } catch (Exception e) {
            logger.error("Erro ao listar registros de {}: {}", tableName, e.getMessage(), e);
            return ResponseEntity.status(500).body(
                Map.of("error", "Erro interno do servidor: " + e.getMessage())
            );
        }
    }

    /**
     * GET /api/{tableName}/{id}
     * 
     * Buscar um registro específico por ID
     */
    @GetMapping("/{tableName}/{id}")
    public ResponseEntity<?> getRecord(
            @PathVariable String tableName,
            @PathVariable String id) {
        
        try {
            String resolvedTable = resolveTableName(tableName);
            logger.info("GET /api/{}/{} (resolvido em {})", tableName, id, resolvedTable);

            // Carregar configuração dinâmica da tabela
            TableConfig config = dictionaryConfigService.getTableConfig(resolvedTable);
            if (config == null) {
                logger.warn("Tabela não permitida: {}", tableName);
                return ResponseEntity.status(400).body(
                    Map.of("error", "Tabela não permitida: " + tableName)
                );
            }

            // Suportar PK composta: id pode ser único ou composto (separador '|' ou ',')
            List<String> pkCols = (config.primaryKeyColumns != null && !config.primaryKeyColumns.isEmpty()) ?
                config.primaryKeyColumns : List.of(config.primaryKeyColumn);

            String[] idParts = id.split("[|,]");
            if (pkCols.size() != idParts.length) {
                logger.warn("Quantidade de valores de ID ({}) não corresponde ao número de colunas PK ({}) para tabela {}", idParts.length, pkCols.size(), tableName);
                return ResponseEntity.status(400).body(
                    Map.of("error", "ID inválido para tabela com chave composta. Use formato: val1|val2")
                );
            }

            StringBuilder where = new StringBuilder();
            for (int i = 0; i < pkCols.size(); i++) {
                if (i > 0) where.append(" AND ");
                where.append(pkCols.get(i)).append(" = ?");
            }

            String sql = "SELECT * FROM " + tableName + " WHERE " + where.toString() + " LIMIT 1";
            logger.debug("SQL: {}", sql);
            Object[] params = Arrays.stream(idParts).map(String::trim).toArray();
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, params);

            if (result.isEmpty()) {
                logger.warn("Registro não encontrado: {} em {}", id, tableName);
                return ResponseEntity.status(404).body(
                    Map.of("error", "Registro não encontrado")
                );
            }

            logger.info("Registro encontrado: {} em {}", id, tableName);
            return ResponseEntity.ok(result.get(0));

        } catch (Exception e) {
            logger.error("Erro ao buscar registro em {}: {}", tableName, e.getMessage(), e);
            return ResponseEntity.status(500).body(
                Map.of("error", "Erro interno: " + e.getMessage())
            );
        }
    }

    /**
     * POST /api/{tableName}
     * 
     * Criar novo registro
     * 
     * Body JSON:
     *   {
     *     "nome_fab": "Novo Fabricante",
     *     "fantasia_fab": "NF",
     *     "cnpj_fab": "12345678000100"
     *   }
     * 
     * Response:
     *   - 201 Created: { id: 123 }
     *   - 400 Bad Request: { error, fieldErrors }
     *   - 404 Not Found: { error }
     *   - 500 Internal Server Error: { error }
     */
    @PostMapping("/{tableName}")
    public ResponseEntity<?> createRecord(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> data,
            HttpServletRequest request) {
        
        try {
            String resolvedTable = resolveTableName(tableName);
            logger.info("POST /api/{} (resolvido em {}) - Criando novo registro: {}", tableName, resolvedTable, data);

            // Carregar configuração dinâmica da tabela
            TableConfig config = dictionaryConfigService.getTableConfig(resolvedTable);
            if (config == null) {
                logger.warn("Tabela não permitida: {}", tableName);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ErrorResponse(400, "Tabela não permitida: " + tableName, "INVALID_TABLE")
                );
            }

            // Validar que não está vazia
            if (data == null || data.isEmpty()) {
                logger.warn("Dados vazios ao criar em {}", tableName);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ErrorResponse(400, "Dados não fornecidos", "EMPTY_DATA")
                );
            }

            // Validar campos permitidos
            Map<String, String> fieldErrors = new HashMap<>();
            Map<String, Object> convertedData = new HashMap<>();

            for (Map.Entry<String, Object> entry : data.entrySet()) {
                String fieldName = entry.getKey();
                Object fieldValue = entry.getValue();

                // Whitelist: campo deve estar em allowedFields
                if (!config.allowedFields.contains(fieldName)) {
                    fieldErrors.put(fieldName, "Campo não permitido");
                    logger.warn("Campo não permitido: {} em {}", fieldName, tableName);
                    continue;
                }

                // Se valor é null, deixar como null
                if (fieldValue == null) {
                    convertedData.put(fieldName, null);
                } else if (fieldValue instanceof String) {
                    convertedData.put(fieldName, fieldValue);
                } else {
                    convertedData.put(fieldName, fieldValue);
                }
            }

            // Se há erros de validação, retornar 400
            if (!fieldErrors.isEmpty()) {
                logger.warn("Erros de validação: {}", fieldErrors);
                ErrorResponse errorResponse = ErrorResponse.validationError(
                    "Erros de validação encontrados",
                    fieldErrors
                );
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Construir INSERT SQL
            List<String> columns = new ArrayList<>(convertedData.keySet());
            String columnList = String.join(", ", columns);
            String placeholders = String.join(", ", Collections.nCopies(columns.size(), "?"));
            String sql = "INSERT INTO " + tableName + " (" + columnList + ") VALUES (" + placeholders + ")";

            logger.debug("SQL de inserção: {}", sql);
            logger.debug("Valores: {}", convertedData.values());

            // Executar INSERT com KeyHolder para recuperar ID gerado
            KeyHolder keyHolder = new GeneratedKeyHolder();
            int rowsAffected = jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                int index = 1;
                for (String column : columns) {
                    Object value = convertedData.get(column);
                    if (value == null) {
                        ps.setNull(index, java.sql.Types.NULL);
                    } else if (value instanceof Integer) {
                        ps.setInt(index, (Integer) value);
                    } else if (value instanceof Long) {
                        ps.setLong(index, (Long) value);
                    } else if (value instanceof java.math.BigDecimal) {
                        ps.setBigDecimal(index, (java.math.BigDecimal) value);
                    } else if (value instanceof java.time.LocalDate) {
                        ps.setDate(index, java.sql.Date.valueOf((java.time.LocalDate) value));
                    } else if (value instanceof Boolean) {
                        ps.setBoolean(index, (Boolean) value);
                    } else {
                        ps.setString(index, value.toString());
                    }
                    index++;
                }
                return ps;
            }, keyHolder);

            if (rowsAffected == 0) {
                logger.error("Falha ao inserir em {}: nenhuma linha afetada", tableName);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse(500, "Falha ao inserir registro", "INSERT_FAILED")
                );
            }

            // Recuperar ID gerado
            Number generatedId = keyHolder.getKey();
            if (generatedId == null) {
                logger.warn("Sem ID gerado para novo registro em {}", tableName);
                return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of("message", "Registro criado com sucesso")
                );
            }

            logger.info("Novo registro criado em {} com ID: {}", tableName, generatedId);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("id", generatedId, "message", "Registro criado com sucesso")
            );

        } catch (Exception e) {
            logger.error("Erro ao criar registro em {}: {}", tableName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse(500, "Erro interno do servidor: " + e.getMessage(), "INTERNAL_ERROR")
            );
        }
    }

    /**
     * PUT /api/{tableName}/{id}
     * 
     * Atualizar registro existente
     * 
     * Body JSON:
     *   {
     *     "nome_fab": "Fabricante Atualizado",
     *     "fantasia_fab": "FA"
     *   }
     * 
     * Response:
     *   - 200 OK: { id, message, data }
     *   - 400 Bad Request: { error, fieldErrors }
     *   - 404 Not Found: { error }
     *   - 500 Internal Server Error: { error }
     */
    @PutMapping("/{tableName}/{id}")
    public ResponseEntity<?> updateRecord(
            @PathVariable String tableName,
            @PathVariable String id,
            @RequestBody Map<String, Object> data,
            HttpServletRequest request) {
        
        try {
            String resolvedTable = resolveTableName(tableName);
            logger.info("PUT /api/{}/{} (resolvido em {}) - Atualizando registro: {}", tableName, id, resolvedTable, data);

            // Carregar configuração dinâmica da tabela
            TableConfig config = dictionaryConfigService.getTableConfig(resolvedTable);
            if (config == null) {
                logger.warn("Tabela não permitida: {}", tableName);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ErrorResponse(400, "Tabela não permitida: " + tableName, "INVALID_TABLE")
                );
            }

            // Validar que não está vazia
            if (data == null || data.isEmpty()) {
                logger.warn("Dados vazios ao atualizar em {}", tableName);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ErrorResponse(400, "Dados não fornecidos", "EMPTY_DATA")
                );
            }

            // Verificar se registro existe (suporta PK composta)
            List<String> pkCols = (config.primaryKeyColumns != null && !config.primaryKeyColumns.isEmpty()) ?
                config.primaryKeyColumns : List.of(config.primaryKeyColumn);
            String[] idParts = id.split("[|,]");
            if (pkCols.size() != idParts.length) {
                logger.warn("Quantidade de valores de ID ({}) não corresponde ao número de colunas PK ({}) para tabela {}", idParts.length, pkCols.size(), tableName);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ErrorResponse.validationError("ID inválido para tabela com chave composta", Map.of("id", "Formato inválido. Use val1|val2"))
                );
            }

            StringBuilder where = new StringBuilder();
            for (int i = 0; i < pkCols.size(); i++) {
                if (i > 0) where.append(" AND ");
                where.append(pkCols.get(i)).append(" = ?");
            }
            String checkSql = "SELECT * FROM " + tableName + " WHERE " + where.toString() + " LIMIT 1";
            Object[] checkParams = Arrays.stream(idParts).map(String::trim).toArray();
            List<Map<String, Object>> existing = jdbcTemplate.queryForList(checkSql, checkParams);
            if (existing.isEmpty()) {
                logger.warn("Registro não encontrado: {} em {}", id, tableName);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ErrorResponse.notFound("Registro não encontrado com ID: " + id)
                );
            }

            // Validar campos permitidos
            Map<String, String> fieldErrors = new HashMap<>();
            Map<String, Object> convertedData = new HashMap<>();

            for (Map.Entry<String, Object> entry : data.entrySet()) {
                String fieldName = entry.getKey();
                Object fieldValue = entry.getValue();

                // Whitelist: campo deve estar em allowedFields
                if (!config.allowedFields.contains(fieldName)) {
                    fieldErrors.put(fieldName, "Campo não permitido");
                    logger.warn("Campo não permitido: {} em {}", fieldName, tableName);
                    continue;
                }

                // Se valor é null, deixar como null
                if (fieldValue == null) {
                    convertedData.put(fieldName, null);
                } else if (fieldValue instanceof String) {
                    convertedData.put(fieldName, fieldValue);
                } else {
                    convertedData.put(fieldName, fieldValue);
                }
            }

            // Se há erros de validação, retornar 400
            if (!fieldErrors.isEmpty()) {
                logger.warn("Erros de validação: {}", fieldErrors);
                ErrorResponse errorResponse = ErrorResponse.validationError(
                    "Erros de validação encontrados",
                    fieldErrors
                );
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            // Construir UPDATE SQL
            List<String> setClause = new ArrayList<>();
            for (String column : convertedData.keySet()) {
                setClause.add(column + " = ?");
            }
            String sql = "UPDATE " + tableName + " SET " + String.join(", ", setClause) + " WHERE " + where.toString();

            logger.debug("SQL de atualização: {}", sql);
            logger.debug("Valores: {}", convertedData.values());

            // Executar UPDATE
            int rowsAffected = jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql);
                int index = 1;
                
                // Adicionar valores do SET clause
                for (String column : convertedData.keySet()) {
                    Object value = convertedData.get(column);
                    if (value == null) {
                        ps.setNull(index, java.sql.Types.NULL);
                    } else if (value instanceof Integer) {
                        ps.setInt(index, (Integer) value);
                    } else if (value instanceof Long) {
                        ps.setLong(index, (Long) value);
                    } else if (value instanceof java.math.BigDecimal) {
                        ps.setBigDecimal(index, (java.math.BigDecimal) value);
                    } else if (value instanceof java.time.LocalDate) {
                        ps.setDate(index, java.sql.Date.valueOf((java.time.LocalDate) value));
                    } else if (value instanceof Boolean) {
                        ps.setBoolean(index, (Boolean) value);
                    } else {
                        ps.setString(index, value.toString());
                    }
                    index++;
                }
                
                // Adicionar valor(s) do WHERE clause (PK composta suportada)
                for (String part : idParts) {
                    ps.setString(index, part.trim());
                    index++;
                }
                
                return ps;
            });

            if (rowsAffected == 0) {
                logger.error("Falha ao atualizar {} em {}: nenhuma linha afetada", id, tableName);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse(500, "Falha ao atualizar registro", "UPDATE_FAILED")
                );
            }

            logger.info("Registro {} em {} atualizado com sucesso", id, tableName);
            return ResponseEntity.status(HttpStatus.OK).body(
                Map.of(
                    "id", id,
                    "message", "Registro atualizado com sucesso",
                    "data", convertedData
                )
            );

        } catch (Exception e) {
            logger.error("Erro ao atualizar registro em {}: {}", tableName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse(500, "Erro interno do servidor: " + e.getMessage(), "INTERNAL_ERROR")
            );
        }
    }

    /**
     * DELETE /api/{tableName}/{id}
     * 
     * Deletar registro (soft-delete ou hard-delete)
     * 
     * - Se tabela tem coluna 'deleted_at': executa UPDATE deleted_at = NOW()
     * - Caso contrário: executa DELETE direto
     * 
     * Response:
     *   - 204 No Content (sucesso - sem body)
     *   - 404 Not Found: { error }
     *   - 500 Internal Server Error: { error }
     */
    @DeleteMapping("/{tableName}/{id}")
    public ResponseEntity<?> deleteRecord(
            @PathVariable String tableName,
            @PathVariable String id,
            HttpServletRequest request) {
        
        try {
            String resolvedTable = resolveTableName(tableName);
            logger.info("DELETE /api/{}/{} (resolvido em {})", tableName, id, resolvedTable);

            // Carregar configuração dinâmica da tabela
            TableConfig config = dictionaryConfigService.getTableConfig(resolvedTable);
            if (config == null) {
                logger.warn("Tabela não permitida: {}", tableName);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ErrorResponse(400, "Tabela não permitida: " + tableName, "INVALID_TABLE")
                );
            }

            // Verificar se registro existe (suporta PK composta)
            List<String> pkColsDel = (config.primaryKeyColumns != null && !config.primaryKeyColumns.isEmpty()) ?
                config.primaryKeyColumns : List.of(config.primaryKeyColumn);
            String[] idPartsDel = id.split("[|,]");
            if (pkColsDel.size() != idPartsDel.length) {
                logger.warn("Quantidade de valores de ID ({}) não corresponde ao número de colunas PK ({}) para tabela {}", idPartsDel.length, pkColsDel.size(), tableName);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ErrorResponse.notFound("ID inválido para deleção: " + id)
                );
            }

            StringBuilder whereDel = new StringBuilder();
            for (int i = 0; i < pkColsDel.size(); i++) {
                if (i > 0) whereDel.append(" AND ");
                whereDel.append(pkColsDel.get(i)).append(" = ?");
            }

            String checkSqlDel = "SELECT * FROM " + tableName + " WHERE " + whereDel.toString() + " LIMIT 1";
            Object[] checkParamsDel = Arrays.stream(idPartsDel).map(String::trim).toArray();
            List<Map<String, Object>> existingDel = jdbcTemplate.queryForList(checkSqlDel, checkParamsDel);
            if (existingDel.isEmpty()) {
                logger.warn("Registro não encontrado para deleção: {} em {}", id, tableName);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ErrorResponse.notFound("Registro não encontrado com ID: " + id)
                );
            }

            // Executar hard-delete (suporta PK composta)
            String deleteSql = "DELETE FROM " + tableName + " WHERE " + whereDel.toString();
            
            try {
                int rowsAffected = jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(deleteSql);
                    for (int i = 0; i < idPartsDel.length; i++) {
                        ps.setString(i + 1, idPartsDel[i].trim());
                    }
                    return ps;
                });
                
                if (rowsAffected > 0) {
                    logger.info("Delete executado: {} em {} (ID: {})", tableName, id);
                } else {
                    logger.error("Falha ao deletar {} em {}: nenhuma linha afetada", id, tableName);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        new ErrorResponse(500, "Falha ao deletar registro", "DELETE_FAILED")
                    );
                }
            } catch (Exception deleteError) {
                logger.error("Erro ao deletar {}: {}", tableName, deleteError.getMessage(), deleteError);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new ErrorResponse(500, "Erro ao deletar registro: " + deleteError.getMessage(), "DELETE_ERROR")
                );
            }

            logger.info("Registro deletado com sucesso: {} em {}", id, tableName);
            // 204 No Content - sem body
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();

        } catch (Exception e) {
            logger.error("Erro ao deletar registro em {}: {}", tableName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ErrorResponse(500, "Erro interno do servidor: " + e.getMessage(), "INTERNAL_ERROR")
            );
        }
    }

    private String resolveTableName(String tableName) {
        if (tableName == null) {
            return null;
        }
        if (tableName.equalsIgnoreCase("empresas")) {
            return "masger";
        }
        if (tableName.equalsIgnoreCase("filiais")) {
            return "masfil";
        }
        return tableName;
    }
}
