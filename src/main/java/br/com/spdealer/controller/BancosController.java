package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bancos")
public class BancosController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todos os bancos ativos da empresa
     * @return Lista de bancos
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarBancos() {
        try {
            String sql = """
                SELECT codigo_bco, nome_bco, empresa_ger, agenc_bco, conta_bco
                FROM bancos 
                WHERE empresa_ger = '001' 
                ORDER BY nome_bco ASC
                """;
            
            List<Map<String, Object>> bancos = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(bancos);
            
        } catch (Exception e) {
            System.err.println("Erro ao listar bancos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Busca banco por código
     * @param codigo Código do banco
     * @return Dados do banco
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarBancoPorCodigo(@PathVariable String codigo) {
        try {
            String sql = """
                SELECT codigo_bco, nome_bco, empresa_ger, agenc_bco, conta_bco
                FROM bancos 
                WHERE empresa_ger = '001' AND codigo_bco = ?
                """;
            
            Map<String, Object> banco = jdbcTemplate.queryForMap(sql, codigo);
            return ResponseEntity.ok(banco);
            
        } catch (Exception e) {
            System.err.println("Erro ao buscar banco: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
