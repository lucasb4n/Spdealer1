package br.com.spdealer.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/servico/manutencao/modelos")
public class ManutencaoModelosController {

    @Autowired
    private JdbcTemplate jdbc;

    private static final Logger logger = LoggerFactory.getLogger(ManutencaoModelosController.class);

    @GetMapping
    public List<Map<String, Object>> list() {
        String sql = "SELECT TRIM(m.codigo_mod) as codigo_mod, TRIM(m.modelo_mod) as modelo_mod, " +
                     "TRIM(m.fabricante_mod) as fabricante_mod, TRIM(f.fab_descricao) as fab_descricao, " +
                     "TRIM(m.grupo_mod) as grupo_mod, TRIM(m.dtalter_mod) as dtalter_mod " +
                     "FROM modelos m " +
                     "LEFT JOIN fabric f ON m.fabricante_mod = f.fab_codigo " +
                     "ORDER BY m.codigo_mod";
        try {
            return jdbc.queryForList(sql);
        } catch (Exception ex) {
            logger.error("Erro ao listar modelos", ex);
            throw ex;
        }
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable String codigo) {
        String sql = "SELECT TRIM(m.codigo_mod) as codigo_mod, TRIM(m.modelo_mod) as modelo_mod, " +
                     "TRIM(m.fabricante_mod) as fabricante_mod, TRIM(f.fab_descricao) as fab_descricao, " +
                     "TRIM(m.grupo_mod) as grupo_mod, TRIM(m.dtalter_mod) as dtalter_mod " +
                     "FROM modelos m " +
                     "LEFT JOIN fabric f ON m.fabricante_mod = f.fab_codigo " +
                     "WHERE m.codigo_mod = ?";
        List<Map<String, Object>> rows = jdbc.queryForList(sql, codigo);
        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        String sql = "INSERT INTO modelos (codigo_mod, dtalter_mod, modelo_mod, fabricante_mod, grupo_mod) VALUES (?, ?, ?, ?, ?)";
        
        String codigo = (String) body.get("codigo_mod");
        String modelo = (String) body.get("modelo_mod");
        String fabricante = (String) body.get("fabricante_mod");
        String grupo = (String) body.get("grupo_mod");
        
        // Formato yyyymmdd para dtalter_mod
        String dtalter = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        if (codigo == null || codigo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Código do modelo é obrigatório."));
        }

        try {
            jdbc.update(sql, codigo, dtalter, modelo, fabricante, grupo);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Erro ao criar modelo de maquina", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao criar modelo de máquina: " + e.getMessage()));
        }
    }

    @PutMapping("/{codigo}")
    public ResponseEntity<?> update(@PathVariable String codigo, @RequestBody Map<String, Object> body) {
        String sql = "UPDATE modelos SET dtalter_mod = ?, modelo_mod = ?, fabricante_mod = ?, grupo_mod = ? WHERE codigo_mod = ?";
        
        String modelo = (String) body.get("modelo_mod");
        String fabricante = (String) body.get("fabricante_mod");
        String grupo = (String) body.get("grupo_mod");
        
        String dtalter = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        try {
            int updated = jdbc.update(sql, dtalter, modelo, fabricante, grupo, codigo);
            if (updated > 0) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Erro ao atualizar modelo de maquina", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao atualizar modelo de máquina: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{codigo}")
    public ResponseEntity<?> delete(@PathVariable String codigo) {
        String sql = "DELETE FROM modelos WHERE codigo_mod = ?";
        try {
            int updated = jdbc.update(sql, codigo);
            if (updated > 0) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Erro ao deletar modelo de maquina", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao deletar modelo de máquina: " + e.getMessage()));
        }
    }

    // Lookup de modelos de componente (modcomp)
    @GetMapping("/modcomp")
    public List<Map<String, Object>> listModComp() {
        String sql = "SELECT TRIM(CODIGO_MDC) as codigo, TRIM(DESC_MDC) as descricao FROM modcomp ORDER BY DESC_MDC";
        return jdbc.queryForList(sql);
    }

    @PostMapping("/modcomp")
    public ResponseEntity<?> createModComp(@RequestBody Map<String, Object> body) {
        String sql = "INSERT INTO modcomp (CODIGO_MDC, DESC_MDC) VALUES (?, ?)";
        String codigo = (String) body.get("codigo");
        String descricao = (String) body.get("descricao");

        if (codigo == null || codigo.trim().isEmpty() || descricao == null || descricao.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Código e descrição são obrigatórios."));
        }
        if (codigo.trim().length() > 10) {
            return ResponseEntity.badRequest().body(Map.of("error", "O código do modelo de componente deve ter no máximo 10 caracteres."));
        }
        if (descricao.trim().length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("error", "A descrição do modelo de componente deve ter no máximo 100 caracteres."));
        }

        try {
            jdbc.update(sql, codigo, descricao);
            return ResponseEntity.ok(Map.of("codigo", codigo, "descricao", descricao));
        } catch (Exception e) {
            logger.error("Erro ao cadastrar modelo de componente", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao cadastrar modelo de componente: " + e.getMessage()));
        }
    }

    // Cadastro de fabricante (fabric)
    @PostMapping("/fabric")
    public ResponseEntity<?> createFabric(@RequestBody Map<String, Object> body) {
        String sql = "INSERT INTO fabric (fab_codigo, fab_descricao, fab_dtalter) VALUES (?, ?, ?)";
        String codigo = (String) body.get("codigo");
        String descricao = (String) body.get("descricao");
        String dtalter = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        if (codigo == null || codigo.trim().isEmpty() || descricao == null || descricao.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Código e descrição são obrigatórios."));
        }
        if (codigo.trim().length() > 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "O código do fabricante deve ter no máximo 4 caracteres."));
        }
        if (descricao.trim().length() > 50) {
            return ResponseEntity.badRequest().body(Map.of("error", "A descrição do fabricante deve ter no máximo 50 caracteres."));
        }

        try {
            jdbc.update(sql, codigo, descricao, dtalter);
            return ResponseEntity.ok(Map.of("codigo", codigo, "descricao", descricao));
        } catch (Exception e) {
            logger.error("Erro ao cadastrar fabricante", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao cadastrar fabricante: " + e.getMessage()));
        }
    }

    // Lookup de grupos (valores distintos de modelos.grupo_mod)
    @GetMapping("/grupos")
    public List<String> listGrupos() {
        String sql = "SELECT DISTINCT TRIM(grupo_mod) FROM modelos WHERE grupo_mod IS NOT NULL AND TRIM(grupo_mod) <> '' ORDER BY TRIM(grupo_mod)";
        return jdbc.queryForList(sql, String.class);
    }
}
