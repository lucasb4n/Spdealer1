package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Endpoint de teste para verificar conexão com banco
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Teste simples de conexão
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM clientes", Integer.class);
            response.put("status", "OK");
            response.put("database", "Connected");
            response.put("clientCount", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Teste simples para listar poucos clientes
     */
    @GetMapping("/clientes-sample")
    public ResponseEntity<List<Map<String, Object>>> clientesSample() {
        try {
            String sql = "SELECT codigo_cli, nome_cli, cgccpf_cli, cliforn_cli FROM clientes LIMIT 10";
            List<Map<String, Object>> clientes = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
}
