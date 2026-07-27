package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/niveis-preco")
public class NiveisPrecoController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        
        try {
            String countSql = "SELECT COUNT(*) FROM masniv";
            StringBuilder whereClause = new StringBuilder();
            
            if (search != null && !search.isEmpty()) {
                whereClause.append(" WHERE CAST(nivel_niv AS CHAR) LIKE ? OR descr_niv LIKE ?");
            }
            
            int total = jdbcTemplate.queryForObject(
                countSql.replace("SELECT COUNT(*) FROM masniv", "SELECT COUNT(*) FROM masniv" + whereClause),
                Integer.class,
                buildWhereParams(search)
            );

            String sql = """
                SELECT nivel_niv, descr_niv, perc_niv
                FROM masniv
                """ + whereClause + """
                ORDER BY nivel_niv ASC
                LIMIT ? OFFSET ?
                """;

            Object[] params = buildWhereParams(search);
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
            System.err.println("Erro ao listar níveis de preço: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao listar níveis de preço"
            ));
        }
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable Integer codigo) {
        try {
            String sql = "SELECT * FROM masniv WHERE nivel_niv = ?";
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Nível de preço não encontrado"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", resultados.get(0)
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar nível de preço: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar nível de preço"
            ));
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> data) {
        try {
            validateRequired(data, "nivel_niv", "descr_niv");

            String checkSql = "SELECT COUNT(*) FROM masniv WHERE nivel_niv = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, data.get("nivel_niv"));
            
            if (exists > 0) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Código já existe",
                    "field", "nivel_niv"
                ));
            }

            String sql = buildInsertSql(data);
            jdbcTemplate.update(sql, buildInsertParams(data));

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "Nível de preço criado com sucesso",
                "data", data
            ));

        } catch (ValidationException e) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "field", e.getField()
            ));
        } catch (Exception e) {
            System.err.println("Erro ao criar nível de preço: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao criar nível de preço"
            ));
        }
    }

    @PutMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable Integer codigo,
            @RequestBody Map<String, Object> data) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masniv WHERE nivel_niv = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Nível de preço não encontrado"
                ));
            }

            String sql = buildUpdateSql(data);
            jdbcTemplate.update(sql, buildUpdateParams(data, codigo));

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Nível de preço atualizado com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao atualizar nível de preço: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao atualizar nível de preço"
            ));
        }
    }

    @DeleteMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> excluir(@PathVariable Integer codigo) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masniv WHERE nivel_niv = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Nível de preço não encontrado"
                ));
            }

            String sql = "DELETE FROM masniv WHERE nivel_niv = ?";
            jdbcTemplate.update(sql, codigo);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Nível de preço excluído com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao excluir nível de preço: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao excluir nível de preço"
            ));
        }
    }

    @GetMapping("/lookup")
    public ResponseEntity<List<Map<String, Object>>> lookup(
            @RequestParam(required = false) String term) {
        try {
            String sql;
            List<Map<String, Object>> resultados;

            if (term != null && !term.isEmpty()) {
                sql = """
                    SELECT nivel_niv, descr_niv
                    FROM masniv
                    WHERE CAST(nivel_niv AS CHAR) LIKE ? OR descr_niv LIKE ?
                    ORDER BY nivel_niv ASC
                    LIMIT 100
                    """;
                String likeTerm = "%" + term + "%";
                resultados = jdbcTemplate.queryForList(sql, likeTerm, likeTerm);
            } else {
                sql = """
                    SELECT nivel_niv, descr_niv
                    FROM masniv
                    ORDER BY nivel_niv ASC
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

    private Object[] buildWhereParams(String search) {
        if (search != null && !search.isEmpty()) {
            return new Object[]{"%" + search + "%", "%" + search + "%"};
        }
        return new Object[]{};
    }

    private String buildInsertSql(Map<String, Object> data) {
        StringBuilder sql = new StringBuilder("INSERT INTO masniv (");
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
        StringBuilder sql = new StringBuilder("UPDATE masniv SET ");

        for (String key : data.keySet()) {
            sql.append(toSnakeCase(key)).append(" = ?, ");
        }

        sql.setLength(sql.length() - 2);
        sql.append(" WHERE nivel_niv = ?");

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
