package br.com.spdealer.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/flows")
public class FlowController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listAll() {
        try {
            String sql = "SELECT id, name, description, version, params, visual_config, data_config FROM v_flow_definitions ORDER BY name";
            List<Map<String, Object>> defs = jdbcTemplate.queryForList(sql);
            for (Map<String, Object> def : defs) {
                normalizeJsonFields(def, List.of("params", "visual_config", "data_config"));
            }

            // Também tentar buscar flows criados via editor (tabela flows)
            try {
                String sql2 = "SELECT id, name, description, NULL as version, params, visual_config, data_config FROM flows ORDER BY name";
                List<Map<String, Object>> custom = jdbcTemplate.queryForList(sql2);
                for (Map<String, Object> c : custom) normalizeJsonFields(c, List.of("params", "visual_config", "data_config"));
                // unir listas (defs primeiro, custom depois)
                defs.addAll(custom);
            } catch (Exception ex) {
                // se a tabela flows não existir, ignorar
            }

            return ResponseEntity.ok(defs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable String id) {
        try {
            Map<String, Object> def = null;
            try {
                def = jdbcTemplate.queryForMap(
                        "SELECT id, name, description, version, params, visual_config, data_config FROM v_flow_definitions WHERE id = ?",
                        id
                );
            } catch (Exception ex) {
                // não encontrado na view, tentar tabela flows
                try {
                    def = jdbcTemplate.queryForMap(
                            "SELECT id, name, description, NULL as version, params, visual_config, data_config FROM flows WHERE id = ?",
                            id
                    );
                } catch (Exception ex2) {
                    throw ex2;
                }
            }
            normalizeJsonFields(def, List.of("params", "visual_config", "data_config"));

            List<Map<String, Object>> steps = jdbcTemplate.queryForList(
                    "SELECT id, flow_id, type, label, x, y, inputs, outputs, params, meta FROM v_flow_steps WHERE flow_id = ? ORDER BY id",
                    id
            );
            for (Map<String, Object> s : steps) {
                normalizeJsonFields(s, List.of("inputs", "outputs", "params", "meta"));
            }

            List<Map<String, Object>> conns = jdbcTemplate.queryForList(
                    "SELECT id, flow_id, from_step_id, from_port, to_step_id, to_port, `condition` FROM v_flow_connections WHERE flow_id = ? ORDER BY id",
                    id
            );

            Map<String, Object> result = new LinkedHashMap<>();
            result.putAll(def);
            result.put("steps", steps);
            result.put("connections", conns);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFlow(@RequestBody Map<String, Object> payload) {
        try {
            String id = payload.containsKey("id") && payload.get("id") != null && !String.valueOf(payload.get("id")).isBlank()
                    ? String.valueOf(payload.get("id"))
                    : UUID.randomUUID().toString();
            String name = payload.containsKey("name") ? String.valueOf(payload.get("name")) : id;
            String description = payload.containsKey("description") ? String.valueOf(payload.get("description")) : null;

            String paramsJson = payload.containsKey("params") ? objectMapper.writeValueAsString(payload.get("params")) : null;
            String visualJson = payload.containsKey("visual_config") ? objectMapper.writeValueAsString(payload.get("visual_config")) : null;
            String dataJson = payload.containsKey("data_config") ? objectMapper.writeValueAsString(payload.get("data_config")) : null;

            String jsonPayload = objectMapper.writeValueAsString(payload);

            String insert = "INSERT INTO flows (id, name, description, params, visual_config, data_config, json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
            jdbcTemplate.update(insert, id, name, description, paramsJson, visualJson, dataJson, jsonPayload);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("id", id);
            resp.put("name", name);
            resp.put("description", description);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyMap());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateFlow(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        try {
            String name = payload.containsKey("name") ? String.valueOf(payload.get("name")) : id;
            String description = payload.containsKey("description") ? String.valueOf(payload.get("description")) : null;
            String paramsJson = payload.containsKey("params") ? objectMapper.writeValueAsString(payload.get("params")) : null;
            String visualJson = payload.containsKey("visual_config") ? objectMapper.writeValueAsString(payload.get("visual_config")) : null;
            String dataJson = payload.containsKey("data_config") ? objectMapper.writeValueAsString(payload.get("data_config")) : null;
            String jsonPayload = objectMapper.writeValueAsString(payload);

            String update = "INSERT INTO flows (id, name, description, params, visual_config, data_config, json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW()) "
                    + "ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), params = VALUES(params), visual_config = VALUES(visual_config), data_config = VALUES(data_config), json = VALUES(json), updated_at = NOW()";
            jdbcTemplate.update(update, id, name, description, paramsJson, visualJson, dataJson, jsonPayload);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("id", id);
            resp.put("name", name);
            resp.put("description", description);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Collections.emptyMap());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlow(@PathVariable String id) {
        try {
            String del = "DELETE FROM flows WHERE id = ?";
            jdbcTemplate.update(del, id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    private void normalizeJsonFields(Map<String, Object> map, List<String> fields) {
        for (String f : fields) {
            Object v = map.get(f);
            map.put(f, tryParseJson(v));
        }
    }

    private Object tryParseJson(Object value) {
        if (value == null) return null;
        try {
            if (value instanceof String) {
                String s = (String) value;
                if (s.isBlank()) return null;
                char c = s.trim().charAt(0);
                if (c == '{' || c == '[') {
                    return objectMapper.readValue(s, Object.class);
                }
                return s;
            }
            return value;
        } catch (Exception ex) {
            return value;
        }
    }
}
