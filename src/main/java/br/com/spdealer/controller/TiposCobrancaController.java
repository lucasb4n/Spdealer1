package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller para gerenciar tipos de cobrança (tabela mascob)
 */
@RestController
@RequestMapping("/api/tipos-cobranca")
public class TiposCobrancaController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todos os tipos de cobrança válidos
     * @return Lista de tipos de cobrança
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarTiposCobranca() {
        try {
            String sql = """
                SELECT 
                    codigo_cob as codigo,
                    descr_cob as descricao
                FROM mascob 
                ORDER BY descr_cob
                """;

            List<Map<String, Object>> tipos = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(tipos);

        } catch (Exception e) {
            System.err.println("Erro ao listar tipos de cobrança: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Buscar tipo de cobrança por código
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorCodigo(@PathVariable String codigo) {
        try {
            String sql = """
                SELECT 
                    codigo_cob as codigo,
                    descr_cob as descricao
                FROM mascob 
                WHERE codigo_cob = ?
                """;

            List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, codigo);
            
            if (resultado.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(resultado.get(0));

        } catch (Exception e) {
            System.err.println("Erro ao buscar tipo de cobrança: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
}
