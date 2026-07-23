package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/regioes")
public class RegiaoController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Map<String, Object>> listarRegioes() {
        String sql = "SELECT reg_codigo, reg_descricao FROM regiao ORDER BY reg_descricao";
        return jdbcTemplate.queryForList(sql);
    }
}
