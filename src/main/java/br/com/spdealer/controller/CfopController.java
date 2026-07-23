package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cfop")
public class CfopController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todos os CFOPs com paginação
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        
        try {
            String whereClause = "";
            if (search != null && !search.isEmpty()) {
                whereClause = " WHERE codigo_cfo LIKE ? OR titulo_cfo LIKE ? OR descr_cfo LIKE ?";
            }
            
            String countSql = "SELECT COUNT(*) FROM mascfo" + whereClause;
            
            String sql = """
                SELECT codigo_cfo, titulo_cfo, descr_cfo, operest_cfo, opersai_cfo, 
                       operimp_cfo, operrem_cfo, operdem_cfo, operdev_cfo, opertrans_cfo,
                       cst_cfo, csticms_cfo, contacfo
                FROM mascfo
                """ + whereClause + """
                ORDER BY codigo_cfo ASC
                LIMIT ? OFFSET ?
                """;

            Object[] searchParams = search != null && !search.isEmpty() 
                ? new Object[]{"%" + search + "%", "%" + search + "%", "%" + search + "%", size, page * size}
                : new Object[]{size, page * size};

            Object[] countParams = search != null && !search.isEmpty()
                ? new Object[]{"%" + search + "%", "%" + search + "%", "%" + search + "%"}
                : new Object[]{};

            int total = jdbcTemplate.queryForObject(countSql, Integer.class, countParams);

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
            System.err.println("Erro ao listar CFOPs: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao listar CFOPs"
            ));
        }
    }

    /**
     * Busca um CFOP pelo código
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable String codigo) {
        try {
            String sql = "SELECT * FROM mascfo WHERE codigo_cfo = ?";
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "CFOP não encontrado"
                ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", resultados.get(0)
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar CFOP: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar CFOP"
            ));
        }
    }

    /**
     * Cria um novo CFOP
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> data) {
        try {
            validateRequired(data, "codigo_cfo", "titulo_cfo");

            String checkSql = "SELECT COUNT(*) FROM mascfo WHERE codigo_cfo = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, data.get("codigo_cfo"));
            
            if (exists > 0) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "CFOP já existe",
                    "field", "codigo_cfo"
                ));
            }

            String sql = """
                INSERT INTO mascfo (codigo_cfo, titulo_cfo, descr_cfo, recusto_cfo, grdemvolvo_cfo,
                                   operest_cfo, opersai_cfo, operimp_cfo, operrem_cfo, operdem_cfo,
                                   operdev_cfo, opernaovalcre_cfo, opersub_cfo, opertrans_cfo, operfrete_cfo,
                                   operserv_cfo, opercredpis_cfo, opernaolpa_cfo, operusada_cfo, opercredipi_cfo,
                                   opercolise_cfo, opernaolis_cfo, cst_cfo, cstred_cfo, operfinan_cfo,
                                   contacfo, csticms_cfo, csticmsred_cfo, opernaokar_cfo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

            jdbcTemplate.update(sql,
                data.get("codigo_cfo"),
                data.get("titulo_cfo"),
                data.get("descr_cfo"),
                data.get("recusto_cfo"),
                data.get("grdemvolvo_cfo"),
                data.get("operest_cfo"),
                data.get("opersai_cfo"),
                data.get("operimp_cfo"),
                data.get("operrem_cfo"),
                data.get("operdem_cfo"),
                data.get("operdev_cfo"),
                data.get("opernaovalcre_cfo"),
                data.get("opersub_cfo"),
                data.get("opertrans_cfo"),
                data.get("operfrete_cfo"),
                data.get("operserv_cfo"),
                data.get("opercredpis_cfo"),
                data.get("opernaolpa_cfo"),
                data.get("operusada_cfo"),
                data.get("opercredipi_cfo"),
                data.get("opercolise_cfo"),
                data.get("opernaolis_cfo"),
                data.get("cst_cfo"),
                data.get("cstred_cfo"),
                data.get("operfinan_cfo"),
                data.get("contacfo"),
                data.get("csticms_cfo"),
                data.get("csticmsred_cfo"),
                data.get("opernaokar_cfo")
            );

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "CFOP criado com sucesso",
                "data", data
            ));

        } catch (ValidationException e) {
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "field", e.getField()
            ));
        } catch (Exception e) {
            System.err.println("Erro ao criar CFOP: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao criar CFOP"
            ));
        }
    }

    /**
     * Atualiza um CFOP existente
     */
    @PutMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable String codigo,
            @RequestBody Map<String, Object> data) {
        try {
            String checkSql = "SELECT COUNT(*) FROM mascfo WHERE codigo_cfo = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "CFOP não encontrado"
                ));
            }

            String sql = """
                UPDATE mascfo SET titulo_cfo = ?, descr_cfo = ?, recusto_cfo = ?, grdemvolvo_cfo = ?,
                    operest_cfo = ?, opersai_cfo = ?, operimp_cfo = ?, operrem_cfo = ?, operdem_cfo = ?,
                    operdev_cfo = ?, opernaovalcre_cfo = ?, opersub_cfo = ?, opertrans_cfo = ?, operfrete_cfo = ?,
                    operserv_cfo = ?, opercredpis_cfo = ?, opernaolpa_cfo = ?, operusada_cfo = ?, opercredipi_cfo = ?,
                    opercolise_cfo = ?, opernaolis_cfo = ?, cst_cfo = ?, cstred_cfo = ?, operfinan_cfo = ?,
                    contacfo = ?, csticms_cfo = ?, csticmsred_cfo = ?, opernaokar_cfo = ?
                WHERE codigo_cfo = ?
                """;

            jdbcTemplate.update(sql,
                data.get("titulo_cfo"),
                data.get("descr_cfo"),
                data.get("recusto_cfo"),
                data.get("grdemvolvo_cfo"),
                data.get("operest_cfo"),
                data.get("opersai_cfo"),
                data.get("operimp_cfo"),
                data.get("operrem_cfo"),
                data.get("operdem_cfo"),
                data.get("operdev_cfo"),
                data.get("opernaovalcre_cfo"),
                data.get("opersub_cfo"),
                data.get("opertrans_cfo"),
                data.get("operfrete_cfo"),
                data.get("operserv_cfo"),
                data.get("opercredpis_cfo"),
                data.get("opernaolpa_cfo"),
                data.get("operusada_cfo"),
                data.get("opercredipi_cfo"),
                data.get("opercolise_cfo"),
                data.get("opernaolis_cfo"),
                data.get("cst_cfo"),
                data.get("cstred_cfo"),
                data.get("operfinan_cfo"),
                data.get("contacfo"),
                data.get("csticms_cfo"),
                data.get("csticmsred_cfo"),
                data.get("opernaokar_cfo"),
                codigo
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "CFOP atualizado com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao atualizar CFOP: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao atualizar CFOP"
            ));
        }
    }

    /**
     * Exclui um CFOP
     */
    @DeleteMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> excluir(@PathVariable String codigo) {
        try {
            String checkSql = "SELECT COUNT(*) FROM mascfo WHERE codigo_cfo = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, codigo);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "CFOP não encontrado"
                ));
            }

            String sql = "DELETE FROM mascfo WHERE codigo_cfo = ?";
            jdbcTemplate.update(sql, codigo);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "CFOP excluído com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao excluir CFOP: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao excluir CFOP"
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
