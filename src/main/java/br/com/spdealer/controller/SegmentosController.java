package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/segmentos")
public class SegmentosController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todos os segmentos da tabela maspub
     * @return Lista de segmentos com codigo_pub e descr_pub
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarSegmentos() {
        try {
            String sql = "SELECT codigo_pub, descr_pub FROM maspub ORDER BY descr_pub ASC";
            List<Map<String, Object>> segmentos = jdbcTemplate.queryForList(sql);
            
            return ResponseEntity.ok(segmentos);
            
        } catch (Exception e) {
            System.err.println("Erro ao listar segmentos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Busca segmento por código
     * @param codigo Código do segmento
     * @return Dados do segmento
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarSegmentoPorCodigo(@PathVariable String codigo) {
        try {
            String sql = "SELECT codigo_pub, descr_pub FROM maspub WHERE codigo_pub = ?";
            Map<String, Object> segmento = jdbcTemplate.queryForMap(sql, codigo);
            
            return ResponseEntity.ok(segmento);
            
        } catch (Exception e) {
            System.err.println("Erro ao buscar segmento: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
