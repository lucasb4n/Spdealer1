package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/invent")
public class InventarioController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * GET /api/v1/invent/dates
     * Retorna lista de datas (YYYY-MM-DD) disponíveis na tabela invent
     */
    @GetMapping("/dates")
    public ResponseEntity<List<String>> getDates() {
        try {
            String sql = "SELECT DISTINCT DATE(data_inv) as d FROM invent WHERE data_inv IS NOT NULL ORDER BY d DESC";
            List<java.sql.Date> list = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getDate("d"));
            java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("yyyy-MM-dd");
            List<String> dates = list.stream().map(d -> d == null ? null : fmt.format(d)).filter(d -> d != null).toList();
            return ResponseEntity.ok(dates);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    /**
     * GET /api/v1/invent/by-date?date=YYYY-MM-DD
     * Retorna registros do invent filtrados pela data
     */
    @GetMapping("/by-date")
    public ResponseEntity<List<Map<String,Object>>> getByDate(@RequestParam("date") String date) {
        // Ajuste: usar colunas reais da tabela `invent` (sufixo _inv) e mapear para os nomes esperados pelo frontend
        String sql = "SELECT data_inv AS date_inv, "
            + "grupo_inv AS categoria, produto_inv AS produto, nomeprod_inv AS descricao, COALESCE(unimed_inv, '') AS unid_med, "
            + "qtde_inv AS qtde, unitario_inv AS custo_uni, (qtde_inv * unitario_inv) as custo_total "
            + "FROM invent WHERE DATE(data_inv) = ? ORDER BY grupo_inv, produto_inv";
        List<Map<String,Object>> rows = jdbcTemplate.queryForList(sql, date);
        return ResponseEntity.ok(rows);
    }

    /**
     * GET /api/v1/invent/totais-by-date?date=YYYY-MM-DD
     * Retorna totais por categoria (soma de qtde * custo_uni) para a data informada
     */
    @GetMapping("/totais-by-date")
    public ResponseEntity<List<Map<String,Object>>> getTotalsByDate(@RequestParam("date") String date) {
        try {
            // Ajuste para colunas reais: agrupar por `grupo_inv` e usar `unitario_inv`/`qtde_inv` para cálculo
            String sql = "SELECT grupo_inv AS categoria, SUM(unitario_inv * qtde_inv) AS custo "
                + "FROM invent WHERE DATE(data_inv) = ? GROUP BY grupo_inv ORDER BY grupo_inv";
            List<Map<String,Object>> rows = jdbcTemplate.queryForList(sql, date);
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
}
