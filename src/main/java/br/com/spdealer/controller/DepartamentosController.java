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
@RequestMapping("/api/v1/departamentos")
public class DepartamentosController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todos os departamentos com paginação
     * Filtra por filial da sessão
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        
        try {
            String whereClause = "";
            if (search != null && !search.isEmpty()) {
                whereClause = " WHERE (CAST(codigo_dep AS CHAR) LIKE ? OR descr_dep LIKE ?)";
            }
            
            String countSql = "SELECT COUNT(*) FROM masdep" + whereClause;
            String sql = """
                SELECT filial_dep, codigo_dep, descr_dep, ger_dep, sigla_dep, 
                       conta_dep, contacli_dep, contafor_dep, codbco_dep
                FROM masdep
                """ + whereClause + """
                ORDER BY CAST(codigo_dep AS UNSIGNED) ASC
                LIMIT ? OFFSET ?
                """;

            Object[] searchParams = search != null && !search.isEmpty() 
                ? new Object[]{"%" + search + "%", "%" + search + "%", size, page * size}
                : new Object[]{size, page * size};

            int total = jdbcTemplate.queryForObject(
                countSql,
                Integer.class,
                search != null && !search.isEmpty() ? new Object[]{"%" + search + "%", "%" + search + "%"} : new Object[]{}
            );

            List<Map<String, Object>> registros = jdbcTemplate.queryForList(sql, searchParams);

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
            System.err.println("Erro ao listar departamentos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao listar departamentos"
            ));
        }
    }

    /**
     * Busca um departamento específico
     */
    @GetMapping("/{filial}/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorId(
            @PathVariable String filial,
            @PathVariable BigDecimal codigo) {
        try {
            String sql = """
                SELECT filial_dep, codigo_dep, descr_dep, ger_dep, sigla_dep,
                       conta_dep, contacli_dep, contafor_dep, codbco_dep
                FROM masdep
                WHERE filial_dep = ? AND codigo_dep = ?
                """;

            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, filial, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Departamento não encontrado"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", resultados.get(0)
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar departamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar departamento"
            ));
        }
    }

    /**
     * Cria um novo departamento
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> data) {
        try {
            validateRequired(data, "filial_dep", "codigo_dep", "descr_dep");

            String checkSql = "SELECT COUNT(*) FROM masdep WHERE filial_dep = ? AND codigo_dep = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, 
                data.get("filial_dep"), data.get("codigo_dep"));
            
            if (exists > 0) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Departamento já existe",
                    "field", "codigo_dep"
                ));
            }

            String sql = """
                INSERT INTO masdep (filial_dep, codigo_dep, descr_dep, ger_dep, sigla_dep, 
                                   conta_dep, contacli_dep, contafor_dep, codbco_dep)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

            jdbcTemplate.update(sql,
                data.get("filial_dep"),
                data.get("codigo_dep"),
                data.get("descr_dep"),
                data.get("ger_dep"),
                data.get("sigla_dep"),
                data.get("conta_dep"),
                data.get("contacli_dep"),
                data.get("contafor_dep"),
                data.get("codbco_dep")
            );

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "Departamento criado com sucesso",
                "data", data
            ));

        } catch (ValidationException e) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "field", e.getField()
            ));
        } catch (Exception e) {
            System.err.println("Erro ao criar departamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao criar departamento"
            ));
        }
    }

    /**
     * Atualiza um departamento existente
     */
    @PutMapping("/{filial}/{codigo}")
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable String filial,
            @PathVariable BigDecimal codigo,
            @RequestBody Map<String, Object> data) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masdep WHERE filial_dep = ? AND codigo_dep = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, filial, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Departamento não encontrado"
                ));
            }

            String sql = """
                UPDATE masdep SET 
                    descr_dep = ?,
                    ger_dep = ?,
                    sigla_dep = ?,
                    conta_dep = ?,
                    contacli_dep = ?,
                    contafor_dep = ?,
                    codbco_dep = ?
                WHERE filial_dep = ? AND codigo_dep = ?
                """;

            jdbcTemplate.update(sql,
                data.get("descr_dep"),
                data.get("ger_dep"),
                data.get("sigla_dep"),
                data.get("conta_dep"),
                data.get("contacli_dep"),
                data.get("contafor_dep"),
                data.get("codbco_dep"),
                filial,
                codigo
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Departamento atualizado com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao atualizar departamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao atualizar departamento"
            ));
        }
    }

    /**
     * Exclui um departamento
     */
    @DeleteMapping("/{filial}/{codigo}")
    public ResponseEntity<Map<String, Object>> excluir(
            @PathVariable String filial,
            @PathVariable BigDecimal codigo) {
        try {
            String checkSql = "SELECT COUNT(*) FROM masdep WHERE filial_dep = ? AND codigo_dep = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, filial, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Departamento não encontrado"
                ));
            }

            String sql = "DELETE FROM masdep WHERE filial_dep = ? AND codigo_dep = ?";
            jdbcTemplate.update(sql, filial, codigo);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Departamento excluído com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao excluir departamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao excluir departamento"
            ));
        }
    }

    // ============== HELPERS ==============

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
