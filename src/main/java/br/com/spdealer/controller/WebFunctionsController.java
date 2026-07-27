package br.com.spdealer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/web-functions")
public class WebFunctionsController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listAll(@RequestParam(name = "category", required = false) String category) {
        try {
            String baseSql = "SELECT id, code, name, category, description, params, `returns` FROM v_web_functions_catalog";
            List<Map<String, Object>> rows;
            if (category != null && !category.isBlank()) {
                rows = jdbcTemplate.queryForList(baseSql + " WHERE category = ? ORDER BY category, name", category);
            } else {
                rows = jdbcTemplate.queryForList(baseSql + " ORDER BY category, name");
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", row.get("id"));
                m.put("code", row.get("code"));
                m.put("name", row.get("name"));
                m.put("category", row.get("category"));
                m.put("description", row.get("description"));

                Object params = row.get("params");
                Object returns = row.get("returns");
                m.put("params", tryParseJson(params));
                m.put("returns", tryParseJson(returns));

                result.add(m);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    private Object tryParseJson(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof String) {
                String s = (String) value;
                if (s.isBlank()) return null;
                // Tenta parsear apenas se aparenta ser JSON
                char c = s.trim().charAt(0);
                if (c == '{' || c == '[') {
                    return objectMapper.readValue(s, Object.class);
                }
                return s; // retorna string original
            }
            return value; // já pode ser JSON mapeado pelo driver
        } catch (Exception ex) {
            // Em caso de erro de parse, devolve o valor bruto para diagnóstico
            return value;
        }
    }
}
