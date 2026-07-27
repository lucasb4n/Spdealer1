package br.com.spdealer.service;

import br.com.spdealer.dto.FilterCriteriaDTO;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * FilterService
 * 
 * Serviço para processar filtros avançados do frontend e converter em SQL WHERE clauses seguro.
 * 
 * Features:
 * - Validação de nomes de campo (whitelist)
 * - Prevenção de SQL injection (parametrizado)
 * - Suporte a múltiplos operadores (contains, equals, >, <, >=, <=, between, in)
 * - Tratamento de tipos (string, número, data)
 * - Logging de erros
 * 
 * Uso:
 *   List<FilterCriteriaDTO> filters = ...;
 *   WhereClause where = filterService.buildWhereClause(filters, allowedFields);
 *   String sql = "SELECT * FROM tabela " + where.getSql();
 *   Object[] params = where.getParameters();
 */
@Service
public class FilterService {

    private static final Logger logger = LoggerFactory.getLogger(FilterService.class);
    
    // Padrão de validação para nomes de campo (apenas alfanuméricos, underscore, ponto)
    private static final Pattern FIELD_NAME_PATTERN = Pattern.compile("^[a-zA-Z_][a-zA-Z0-9_\\.]*$");

    /**
     * Resultado da construção de WHERE clause
     * Contém SQL e parâmetros parametrizados (safe from SQL injection)
     */
    public static class WhereClause {
        private final String sql;
        private final List<Object> parameters;

        public WhereClause(String sql, List<Object> parameters) {
            this.sql = sql;
            this.parameters = parameters;
        }

        public String getSql() {
            return sql;
        }

        public List<Object> getParameters() {
            return parameters;
        }

        public Object[] getParametersArray() {
            return parameters.toArray();
        }

        @Override
        public String toString() {
            return "WhereClause{" +
                    "sql='" + sql + '\'' +
                    ", paramCount=" + parameters.size() +
                    '}';
        }
    }

    /**
     * Constrói uma WHERE clause segura a partir de filtros
     * 
     * @param filters Lista de critérios de filtro do frontend
     * @param allowedFields Whitelist de campos permitidos (validação de segurança)
     * @return WhereClause com SQL parametrizado + lista de parâmetros
     * @throws IllegalArgumentException se validação falhar
     */
    public WhereClause buildWhereClause(List<FilterCriteriaDTO> filters, List<String> allowedFields) 
            throws IllegalArgumentException {
        
        if (filters == null || filters.isEmpty()) {
            return new WhereClause("", new ArrayList<>());
        }

        List<String> whereParts = new ArrayList<>();
        List<Object> parameters = new ArrayList<>();

        for (FilterCriteriaDTO filter : filters) {
            try {
                // Validar campo
                if (!isValidFieldName(filter.getField())) {
                    logger.warn("Campo inválido detectado: {}", filter.getField());
                    throw new IllegalArgumentException("Campo inválido: " + filter.getField());
                }

                // Validar contra whitelist (se fornecida)
                if (allowedFields != null && !allowedFields.isEmpty()) {
                    if (!allowedFields.contains(filter.getField())) {
                        logger.warn("Campo não permitido: {}", filter.getField());
                        throw new IllegalArgumentException("Campo não permitido: " + filter.getField());
                    }
                }

                // Construir condição baseado no operador
                String operator = filter.getOperator();
                String condition = buildCondition(filter, parameters);
                
                if (!condition.isEmpty()) {
                    whereParts.add(condition);
                }

            } catch (IllegalArgumentException e) {
                logger.error("Erro ao processar filtro: {}", filter, e);
                throw e;
            }
        }

        // Juntar todas as condições com AND
        String whereClause = whereParts.isEmpty() ? "" : "WHERE " + String.join(" AND ", whereParts);
        return new WhereClause(whereClause, parameters);
    }

    /**
     * Constrói uma condição SQL individual baseada no operador
     * Adiciona parâmetros à lista (safe para SQL injection)
     * 
     * @param filter Critério do filtro
     * @param parameters Lista acumulada de parâmetros
     * @return Condição SQL (ex: "campo LIKE ?")
     */
    private String buildCondition(FilterCriteriaDTO filter, List<Object> parameters) {
        String field = filter.getField();
        String operator = filter.getOperator();
        Object value = filter.getValue();

        switch (operator) {
            case "contains":
                // Campo LIKE %valor%
                if (value == null) {
                    return "";
                }
                parameters.add("%" + value.toString() + "%");
                return field + " LIKE ?";

            case "equals":
                // Campo = valor
                if (value == null) {
                    return field + " IS NULL";
                }
                parameters.add(value);
                return field + " = ?";

            case ">":
                // Campo > valor
                if (value == null) {
                    return "";
                }
                parameters.add(value);
                return field + " > ?";

            case "<":
                // Campo < valor
                if (value == null) {
                    return "";
                }
                parameters.add(value);
                return field + " < ?";

            case ">=":
                // Campo >= valor
                if (value == null) {
                    return "";
                }
                parameters.add(value);
                return field + " >= ?";

            case "<=":
                // Campo <= valor
                if (value == null) {
                    return "";
                }
                parameters.add(value);
                return field + " <= ?";

            case "between":
                // Campo BETWEEN valueFrom AND valueTo
                Object valueFrom = filter.getValueFrom();
                Object valueTo = filter.getValueTo();
                if (valueFrom == null || valueTo == null) {
                    return "";
                }
                parameters.add(valueFrom);
                parameters.add(valueTo);
                return field + " BETWEEN ? AND ?";

            case "in":
                // Campo IN (valor1, valor2, ...)
                if (value == null) {
                    return "";
                }
                
                List<String> inValues = new ArrayList<>();
                if (value instanceof List) {
                    // Se for array/lista
                    List<?> valueList = (List<?>) value;
                    for (Object v : valueList) {
                        parameters.add(v);
                        inValues.add("?");
                    }
                } else {
                    // Se for string com valores separados por vírgula
                    String[] parts = value.toString().split(",");
                    for (String part : parts) {
                        parameters.add(part.trim());
                        inValues.add("?");
                    }
                }
                
                if (inValues.isEmpty()) {
                    return "";
                }
                return field + " IN (" + String.join(", ", inValues) + ")";

            default:
                logger.warn("Operador não suportado: {}", operator);
                return "";
        }
    }

    /**
     * Valida se um nome de campo é válido (segurança contra SQL injection)
     * Apenas permite: letras, números, underscore, ponto (table.field)
     * 
     * @param fieldName Nome do campo a validar
     * @return true se válido, false caso contrário
     */
    private boolean isValidFieldName(String fieldName) {
        if (fieldName == null || fieldName.trim().isEmpty()) {
            return false;
        }
        
        // Verificar padrão
        if (!FIELD_NAME_PATTERN.matcher(fieldName).matches()) {
            return false;
        }
        
        // Evitar palavras-chave SQL perigosas
        String lowerField = fieldName.toLowerCase();
        String[] dangerousKeywords = {"drop", "delete", "insert", "update", "truncate", "exec", "execute"};
        for (String keyword : dangerousKeywords) {
            if (lowerField.contains(keyword)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Constrói WHERE clause incluindo filtro de busca global (search term)
     * 
     * @param filters Critérios de filtro específicos
     * @param searchTerm Termo de busca global (busca em múltiplos campos)
     * @param searchFields Campos onde buscar (ex: nome_cli, descricao_xxx)
     * @param allowedFields Whitelist de campos permitidos
     * @return WhereClause combinada (filtros AND busca)
     */
    public WhereClause buildWhereClauseWithSearch(
            List<FilterCriteriaDTO> filters,
            String searchTerm,
            List<String> searchFields,
            List<String> allowedFields) {
        
        List<String> whereParts = new ArrayList<>();
        List<Object> parameters = new ArrayList<>();

        // Adicionar filtros específicos
        if (filters != null && !filters.isEmpty()) {
            WhereClause filterClause = buildWhereClause(filters, allowedFields);
            if (!filterClause.getSql().isEmpty()) {
                // Remover "WHERE " do início
                String sqlPart = filterClause.getSql().replaceFirst("^WHERE ", "");
                whereParts.add("(" + sqlPart + ")");
                parameters.addAll(filterClause.getParameters());
            }
        }

        // Adicionar busca global (se searchTerm não vazio)
        if (searchTerm != null && !searchTerm.trim().isEmpty() && searchFields != null && !searchFields.isEmpty()) {
            List<String> searchConditions = new ArrayList<>();
            String searchValue = "%" + searchTerm.trim() + "%";

            for (String field : searchFields) {
                if (isValidFieldName(field)) {
                    searchConditions.add(field + " LIKE ?");
                    parameters.add(searchValue);
                }
            }

            if (!searchConditions.isEmpty()) {
                whereParts.add("(" + String.join(" OR ", searchConditions) + ")");
            }
        }

        // Juntar com AND
        String whereClause = whereParts.isEmpty() ? "" : "WHERE " + String.join(" AND ", whereParts);
        return new WhereClause(whereClause, parameters);
    }

    /**
     * Registra filtro para debug/auditoria
     */
    public void logFilter(List<FilterCriteriaDTO> filters) {
        logger.debug("Filtros recebidos: {}", 
            filters.stream()
                .map(FilterCriteriaDTO::toString)
                .collect(Collectors.toList())
        );
    }
}
