package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/natureza-itens")
public class NaturezaItensController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        
        try {
            String countSql = "SELECT COUNT(*) FROM masnat";
            StringBuilder whereClause = new StringBuilder();
            
            if (search != null && !search.isEmpty()) {
                whereClause.append(" WHERE natureza_nat LIKE ? OR descricao_nat LIKE ?");
            }
            
            int total = jdbcTemplate.queryForObject(
                countSql.replace("SELECT COUNT(*) FROM masnat", "SELECT COUNT(*) FROM masnat" + whereClause),
                Integer.class,
                buildWhereParams(search)
            );

            String sql = """
                SELECT natureza_nat, descricao_nat, ccusto_nat
                FROM masnat
                """ + whereClause + """
                ORDER BY natureza_nat ASC
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
            System.err.println("Erro ao listar natureza de itens: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao listar natureza de itens"
            ));
        }
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable String codigo) {
        try {
            String sql = "SELECT * FROM masnat WHERE natureza_nat = ?";
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Natureza de item não encontrada"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", resultados.get(0)
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar natureza de item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar natureza de item"
            ));
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> data) {
        try {
            validateRequired(data, "natureza_nat", "descricao_nat");

            String natureza = (String) data.get("natureza_nat");
            if (natureza != null && ("X".equals(natureza) || "L".equals(natureza) || 
                "V".equals(natureza) || "S".equals(natureza))) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Natureza reservada para uso do sistema",
                    "field", "natureza_nat"
                ));
            }

            String checkSql = "SELECT COUNT(*) FROM masnat WHERE natureza_nat = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, data.get("natureza_nat"));
            
            if (exists > 0) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Código já existe",
                    "field", "natureza_nat"
                ));
            }

            String sql = buildInsertSql(data);
            jdbcTemplate.update(sql, buildInsertParams(data));

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "Natureza de item criada com sucesso",
                "data", data
            ));

        } catch (ValidationException e) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "field", e.getField()
            ));
        } catch (Exception e) {
            System.err.println("Erro ao criar natureza de item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao criar natureza de item"
            ));
        }
    }

    @PutMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable String codigo,
            @RequestBody Map<String, Object> data) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masnat WHERE natureza_nat = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Natureza de item não encontrada"
                ));
            }

            if ("X".equals(codigo) || "L".equals(codigo) || "V".equals(codigo) || "S".equals(codigo)) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Natureza reservada para uso do sistema"
                ));
            }

            String sql = buildUpdateSql(data);
            jdbcTemplate.update(sql, buildUpdateParams(data, codigo));

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Natureza de item atualizada com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao atualizar natureza de item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao atualizar natureza de item"
            ));
        }
    }

    @DeleteMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> excluir(@PathVariable String codigo) {
        try {
            if ("X".equals(codigo) || "L".equals(codigo) || "V".equals(codigo) || "S".equals(codigo)) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Natureza reservada para uso do sistema"
                ));
            }

            String checkSql = "SELECT COUNT(*) FROM masnat WHERE natureza_nat = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Natureza de item não encontrada"
                ));
            }

            String sql = "DELETE FROM masnat WHERE natureza_nat = ?";
            jdbcTemplate.update(sql, codigo);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Natureza de item excluída com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao excluir natureza de item: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao excluir natureza de item"
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
                    SELECT natureza_nat, descricao_nat
                    FROM masnat
                    WHERE natureza_nat LIKE ? OR descricao_nat LIKE ?
                    ORDER BY natureza_nat ASC
                    LIMIT 100
                    """;
                String likeTerm = "%" + term + "%";
                resultados = jdbcTemplate.queryForList(sql, likeTerm, likeTerm);
            } else {
                sql = """
                    SELECT natureza_nat, descricao_nat
                    FROM masnat
                    ORDER BY natureza_nat ASC
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
        StringBuilder sql = new StringBuilder("INSERT INTO masnat (");
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
        StringBuilder sql = new StringBuilder("UPDATE masnat SET ");

        for (String key : data.keySet()) {
            sql.append(toSnakeCase(key)).append(" = ?, ");
        }

        sql.setLength(sql.length() - 2);
        sql.append(" WHERE natureza_nat = ?");

        return sql.toString();
    }

    private Object[] buildUpdateParams(Map<String, Object> data, String codigo) {
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
