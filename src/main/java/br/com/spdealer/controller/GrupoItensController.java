package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grupos-itens")
public class GrupoItensController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        
        try {
            String countSql = "SELECT COUNT(*) FROM masgru";
            StringBuilder whereClause = new StringBuilder();
            
            if (search != null && !search.isEmpty()) {
                whereClause.append(" WHERE CAST(grupo_gru AS CHAR) LIKE ? OR descr_gru LIKE ?");
            }
            
            int total = jdbcTemplate.queryForObject(
                countSql.replace("SELECT COUNT(*) FROM masgru", "SELECT COUNT(*) FROM masgru" + whereClause),
                Integer.class,
                buildWhereParams(search)
            );

            String sql = """
                SELECT grupo_gru, descr_gru, perc_gru, percom_gru, dolar_gru,
                       consumo_gru, fob_gru, ipi_gru, usacusto_gru, semfab_gru
                FROM masgru
                """ + whereClause + """
                ORDER BY grupo_gru ASC
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
            System.err.println("Erro ao listar grupos de itens: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao listar grupos de itens"
            ));
        }
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable Integer codigo) {
        try {
            String sql = "SELECT * FROM masgru WHERE grupo_gru = ?";
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Grupo de itens não encontrado"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", resultados.get(0)
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar grupo de itens: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar grupo de itens"
            ));
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> data) {
        try {
            validateRequired(data, "grupo_gru", "descr_gru");

            String checkSql = "SELECT COUNT(*) FROM masgru WHERE grupo_gru = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, data.get("grupo_gru"));
            
            if (exists > 0) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Código já existe",
                    "field", "grupo_gru"
                ));
            }

            String sql = buildInsertSql(data);
            jdbcTemplate.update(sql, buildInsertParams(data));

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "Grupo de itens criado com sucesso",
                "data", data
            ));

        } catch (ValidationException e) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "field", e.getField()
            ));
        } catch (Exception e) {
            System.err.println("Erro ao criar grupo de itens: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao criar grupo de itens"
            ));
        }
    }

    @PutMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable Integer codigo,
            @RequestBody Map<String, Object> data) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masgru WHERE grupo_gru = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Grupo de itens não encontrado"
                ));
            }

            String sql = buildUpdateSql(data);
            jdbcTemplate.update(sql, buildUpdateParams(data, codigo));

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Grupo de itens atualizado com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao atualizar grupo de itens: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao atualizar grupo de itens"
            ));
        }
    }

    @DeleteMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> excluir(@PathVariable Integer codigo) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masgru WHERE grupo_gru = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Grupo de itens não encontrado"
                ));
            }

            String sql = "DELETE FROM masgru WHERE grupo_gru = ?";
            jdbcTemplate.update(sql, codigo);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Grupo de itens excluído com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao excluir grupo de itens: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao excluir grupo de itens"
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
                    SELECT grupo_gru, descr_gru
                    FROM masgru
                    WHERE CAST(grupo_gru AS CHAR) LIKE ? OR descr_gru LIKE ?
                    ORDER BY grupo_gru ASC
                    LIMIT 100
                    """;
                String likeTerm = "%" + term + "%";
                resultados = jdbcTemplate.queryForList(sql, likeTerm, likeTerm);
            } else {
                sql = """
                    SELECT grupo_gru, descr_gru
                    FROM masgru
                    ORDER BY grupo_gru ASC
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
        StringBuilder sql = new StringBuilder("INSERT INTO masgru (");
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
        StringBuilder sql = new StringBuilder("UPDATE masgru SET ");

        for (String key : data.keySet()) {
            sql.append(toSnakeCase(key)).append(" = ?, ");
        }

        sql.setLength(sql.length() - 2);
        sql.append(" WHERE grupo_gru = ?");

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
