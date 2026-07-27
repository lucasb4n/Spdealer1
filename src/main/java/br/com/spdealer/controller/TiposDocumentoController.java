package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller para gerenciar tipos de documento (tabela masdoc)
 */
@RestController
@RequestMapping("/api/tipos-documento")
public class TiposDocumentoController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todos os tipos de documento válidos
     * @return Lista de tipos de documento
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarTiposDocumento() {
        try {
            String sql = """
                SELECT 
                    codigo_doc as codigo,
                    descr_doc as descricao
                FROM masdoc 
                ORDER BY descr_doc
                """;

            List<Map<String, Object>> tipos = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(tipos);

        } catch (Exception e) {
            System.err.println("Erro ao listar tipos de documento: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Buscar tipo de documento por código
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorCodigo(@PathVariable String codigo) {
        try {
            String sql = """
                SELECT 
                    codigo_doc as codigo,
                    descr_doc as descricao
                FROM masdoc 
                WHERE codigo_doc = ?
                """;

            List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, codigo);
            
            if (resultado.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(resultado.get(0));

        } catch (Exception e) {
            System.err.println("Erro ao buscar tipo de documento: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
}
