package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operacoes-caixa")
public class OperacoesCaixaController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todas as operações de caixa
     * @return Lista de operações
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarOperacoesCaixa() {
        try {
            String sql = """
                SELECT operacao_ocai, descr_ocai, filial_ocai
                FROM mascai 
                WHERE filial_ocai = '001'
                ORDER BY descr_ocai ASC
                """;
            
            List<Map<String, Object>> operacoes = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(operacoes);
            
        } catch (Exception e) {
            System.err.println("Erro ao listar operações de caixa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }
}
