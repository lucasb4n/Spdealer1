package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/operacoes")
public class OperacoesController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todas as operações com paginação
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String ativo) {
        
        try {
            String countSql = "SELECT COUNT(*) FROM masope";
            StringBuilder whereClause = new StringBuilder();
            
            if (search != null && !search.isEmpty()) {
                whereClause.append(" WHERE (codigo_ope LIKE ? OR descr_ope LIKE ?)");
            }
            if (ativo != null && !ativo.isEmpty()) {
                if (whereClause.length() > 0) {
                    whereClause.append(" AND ativo_ope = ?");
                } else {
                    whereClause.append(" WHERE ativo_ope = ?");
                }
            }
            
            int total = jdbcTemplate.queryForObject(
                countSql.replace("SELECT COUNT(*) FROM masope", "SELECT COUNT(*) FROM masope" + whereClause),
                Integer.class,
                buildWhereParams(search, ativo)
            );

            String sql = """
                SELECT codigo_ope, descr_ope, ativo_ope, cfosub_ope, icms_ope, 
                       piscofins_ope, sinal_ope, valor_ope
                FROM masope
                """ + whereClause + """
                ORDER BY codigo_ope ASC
                LIMIT ? OFFSET ?
                """;

            Object[] params = buildWhereParams(search, ativo);
            Object[] queryParams = new Object[params.length + 2];
            System.arraycopy(params, 0, queryParams, 0, params.length);
            queryParams[params.length] = size;
            queryParams[params.length + 1] = page * size;

            List<Map<String, Object>> registros = jdbcTemplate.queryForList(sql, queryParams);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", registros);
            response.put("pagination", Map.of(
                "total", total,
                "page", page,
                "size", size,
                "totalPages", (int) Math.ceil((double) total / size)
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erro ao listar operações: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao listar operações"
            ));
        }
    }

    /**
     * Busca uma operação pelo código
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable Integer codigo) {
        try {
            String sql = "SELECT * FROM masope WHERE codigo_ope = ?";
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Operação não encontrada"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", resultados.get(0)
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar operação: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar operação"
            ));
        }
    }

    /**
     * Cria uma nova operação
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> data) {
        try {
            validateRequired(data, "codigo_ope", "descr_ope");

            String checkSql = "SELECT COUNT(*) FROM masope WHERE codigo_ope = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, data.get("codigo_ope"));
            
            if (exists > 0) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Código já existe",
                    "field", "codigo_ope"
                ));
            }

            String sql = buildInsertSql(data);
            jdbcTemplate.update(sql, buildInsertParams(data));

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "Operação criada com sucesso",
                "data", data
            ));

        } catch (ValidationException e) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "field", e.getField()
            ));
        } catch (Exception e) {
            System.err.println("Erro ao criar operação: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao criar operação"
            ));
        }
    }

    /**
     * Atualiza uma operação existente
     */
    @PutMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable Integer codigo,
            @RequestBody Map<String, Object> data) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masope WHERE codigo_ope = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Operação não encontrada"
                ));
            }

            Object novoCodigo = data.get("codigo_ope");
            if (novoCodigo != null && !codigo.equals(novoCodigo)) {
                String newCheckSql = "SELECT COUNT(*) FROM masope WHERE codigo_ope = ? AND codigo_ope != ?";
                int newExists = jdbcTemplate.queryForObject(newCheckSql, Integer.class, novoCodigo, codigo);
                if (newExists > 0) {
                    return ResponseEntity.status(400).body(Map.of(
                        "success", false,
                        "error", "Novo código já existe",
                        "field", "codigo_ope"
                    ));
                }
            }

            String sql = buildUpdateSql(data);
            jdbcTemplate.update(sql, buildUpdateParams(data, codigo));

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Operação atualizada com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao atualizar operação: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao atualizar operação"
            ));
        }
    }

    /**
     * Exclui uma operação
     */
    @DeleteMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> excluir(@PathVariable Integer codigo) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masope WHERE codigo_ope = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Operação não encontrada"
                ));
            }

            String sql = "DELETE FROM masope WHERE codigo_ope = ?";
            jdbcTemplate.update(sql, codigo);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Operação excluída com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao excluir operação: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao excluir operação"
            ));
        }
    }

    /**
     * Lookup para autocomplete
     */
    @GetMapping("/lookup")
    public ResponseEntity<List<Map<String, Object>>> lookup(
            @RequestParam(required = false) String term) {
        try {
            String sql;
            List<Map<String, Object>> resultados;

            if (term != null && !term.isEmpty()) {
                sql = """
                    SELECT codigo_ope, descr_ope, cfosub_ope, icms_ope
                    FROM masope
                    WHERE ativo_ope = 'S' 
                      AND (codigo_ope LIKE ? OR descr_ope LIKE ?)
                    ORDER BY codigo_ope ASC
                    LIMIT 100
                    """;
                String likeTerm = "%" + term + "%";
                resultados = jdbcTemplate.queryForList(sql, likeTerm, likeTerm);
            } else {
                sql = """
                    SELECT codigo_ope, descr_ope, cfosub_ope, icms_ope
                    FROM masope
                    WHERE ativo_ope = 'S'
                    ORDER BY codigo_ope ASC
                    LIMIT 100
                    """;
                resultados = jdbcTemplate.queryForList(sql);
            }

            return ResponseEntity.ok(resultados);

        } catch (Exception e) {
            System.err.println("Erro no lookup: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(List.of());
        }
    }

    // ============== HELPERS ==============

    private Object[] buildWhereParams(String search, String ativo) {
        if (search != null && !search.isEmpty() && ativo != null && !ativo.isEmpty()) {
            return new Object[]{"%" + search + "%", "%" + search + "%", ativo};
        } else if (search != null && !search.isEmpty()) {
            return new Object[]{"%" + search + "%", "%" + search + "%"};
        } else if (ativo != null && !ativo.isEmpty()) {
            return new Object[]{ativo};
        }
        return new Object[]{};
    }

    private String buildInsertSql(Map<String, Object> data) {
        StringBuilder sql = new StringBuilder("INSERT INTO masope (");
        StringBuilder values = new StringBuilder(" VALUES (");

        for (String key : data.keySet()) {
            sql.append(toSnakeCase(key)).append(", ");
            values.append("?, ");
        }

        sql.setLength(sql.length() - 2);
        values.setLength(values.length() - 2);

        return sql + ")" + values + ")";
    }

    private Object[] buildInsertParams(Map<String, Object> data) {
        return data.values().toArray();
    }

    private String buildUpdateSql(Map<String, Object> data) {
        StringBuilder sql = new StringBuilder("UPDATE masope SET ");

        for (String key : data.keySet()) {
            sql.append(toSnakeCase(key)).append(" = ?, ");
        }

        sql.setLength(sql.length() - 2);
        sql.append(" WHERE codigo_ope = ?");

        return sql.toString();
    }

    private Object[] buildUpdateParams(Map<String, Object> data, Integer codigo) {
        Object[] params = new Object[data.size() + 1];
        int i = 0;
        for (Object val : data.values()) {
            params[i++] = val;
        }
        params[i] = codigo;
        return params;
    }

    private String toSnakeCase(String str) {
        return str.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    private void validateRequired(Map<String, Object> data, String... fields) throws ValidationException {
        for (String field : fields) {
            Object value = data.get(field);
            if (value == null || (value instanceof String && ((String) value).isEmpty())) {
                throw new ValidationException("Campo obrigatório: " + field, field);
            }
        }
    }

    // ============== INNER CLASS ==============

    public static class ValidationException extends Exception {
        private final String field;

        public ValidationException(String message, String field) {
            super(message);
            this.field = field;
        }

        public String getField() {
            return field;
        }
    }
}
