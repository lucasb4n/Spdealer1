package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller para gerenciar condições de pagamento (tabela maspag)
 */
@RestController
@RequestMapping("/api/condicoes-pagamento")
public class CondicoesPagamentoController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista todas as condições de pagamento válidas
     * @return Lista de condições de pagamento
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listarCondicoesPagamento() {
        try {
            String sql = """
                SELECT 
                    codigo_paga as codigo,
                    descr_paga as descricao
                FROM maspag 
                ORDER BY descr_paga
                """;

            List<Map<String, Object>> condicoes = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(condicoes);

        } catch (Exception e) {
            System.err.println("Erro ao listar condições de pagamento: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Buscar condição de pagamento por código
     */
    @GetMapping("/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorCodigo(@PathVariable String codigo) {
        try {
            String sql = """
                SELECT 
                    codigo_paga as codigo,
                    descr_paga as descricao
                FROM maspag 
                WHERE codigo_paga = ?
                """;

            List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, codigo);
            
            if (resultado.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(resultado.get(0));

        } catch (Exception e) {
            System.err.println("Erro ao buscar condição de pagamento: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
}
