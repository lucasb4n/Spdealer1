package br.com.spdealer.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mds")
public class MdsController {

    @Autowired
    private JdbcTemplate jdbc;

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(value = "search", required = false) String search) {
        String sql = "SELECT codigo_mds, descr_mds FROM mds";
        Object[] params = new Object[] {};
        if (search != null && !search.trim().isEmpty()) {
            sql += " WHERE LOWER(descr_mds) LIKE ?";
            params = new Object[] { "%" + search.toLowerCase() + "%" };
        }
        sql += " ORDER BY descr_mds";
        return jdbc.queryForList(sql, params);
    }

    @GetMapping("/{modelo}/maos")
    public List<Map<String, Object>> maosByModelo(@PathVariable("modelo") String modelo) {
        // Retorna códigos de mão de obra (codmo_tmo) associados ao modelo informado.
        // Usa DISTINCT para evitar duplicatas quando houver joins que causem linhas repetidas
        // e aplica trim no parâmetro recebido.
        String modeloParam = modelo == null ? "" : modelo.trim();
        String sql = "SELECT DISTINCT t.codmo_tmo AS codigo, COALESCE(tt.descr_ttmo, t.descr_tmo) AS descricao, tt.tipo_ttmo AS tipo_ttmo "
                + "FROM tmo t LEFT JOIN tipotmo tt ON t.tipo_tmo = tt.tipo_ttmo "
                + "WHERE t.modelo_tmo = ? ORDER BY COALESCE(tt.descr_ttmo, t.descr_tmo)";
        return jdbc.queryForList(sql, new Object[] { modeloParam });
    }

    @GetMapping("/tipotmo")
    public List<Map<String, Object>> listTipoTmo(@RequestParam(value = "search", required = false) String search) {
        String sql = "SELECT tipo_ttmo AS tipo, descr_ttmo AS descricao FROM tipotmo";
        Object[] params = new Object[] {};
        if (search != null && !search.trim().isEmpty()) {
            sql += " WHERE LOWER(COALESCE(descr_ttmo, tipo_ttmo)) LIKE ? OR LOWER(tipo_ttmo) LIKE ?";
            String s = "%" + search.trim().toLowerCase() + "%";
            params = new Object[] { s, s };
        }
        sql += " ORDER BY COALESCE(descr_ttmo, tipo_ttmo)";
        return jdbc.queryForList(sql, params);
    }
}
