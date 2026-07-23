package br.com.spdealer.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private Path historyFile() {
        String projectRoot = System.getProperty("user.dir");
        Path dir = Paths.get(projectRoot, "data");
        if (!Files.exists(dir)) {
            try { Files.createDirectories(dir); } catch (IOException ignored) {}
        }
        return dir.resolve("report_history.json");
    }

    @GetMapping("/tables")
    public ResponseEntity<List<String>> listTables() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
                String.class);
        return ResponseEntity.ok(tables);
    }

    @GetMapping("/columns")
    public ResponseEntity<List<String>> listColumns(@RequestParam("table") String table) {
        List<String> cols = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? ORDER BY ordinal_position",
                new Object[]{table}, String.class);
        return ResponseEntity.ok(cols);
    }

    @PostMapping("/execute")
    public ResponseEntity<Object> executeSql(@RequestBody Map<String, Object> body) {
        try {
            String sql = (String) body.get("sql");
            int limit = body.get("limit") instanceof Number ? ((Number) body.get("limit")).intValue() : 200;
            if (sql == null) return ResponseEntity.badRequest().body(Map.of("error", "sql is required"));
            String s = sql.trim();
            String upper = s.toUpperCase();
            if (!upper.startsWith("SELECT")) return ResponseEntity.status(403).body(Map.of("error", "Only SELECT queries allowed"));
            if (s.contains(";")) return ResponseEntity.status(400).body(Map.of("error", "Semicolons not allowed"));
            String safe = s;
            if (!upper.contains(" LIMIT ")) {
                safe = safe + " LIMIT " + limit;
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(safe);
            // save to history
            saveToHistory(s);
            Map<String, Object> resp = new HashMap<>();
            resp.put("rows", rows);
            resp.put("count", rows.size());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(resp);
        }
    }

    private synchronized void saveToHistory(String sql) {
        try {
            Path hf = historyFile();
            List<String> list = new ArrayList<>();
            if (Files.exists(hf)) {
                try {
                    list = objectMapper.readValue(Files.readAllBytes(hf), new TypeReference<List<String>>(){});
                } catch (Exception ignored) {}
            }
            list.add(0, sql);
            if (list.size() > 200) list = list.subList(0, 200);
            objectMapper.writeValue(hf.toFile(), list);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<Object> history() {
        try {
            Path hf = historyFile();
            if (!Files.exists(hf)) return ResponseEntity.ok(List.of());
            List<String> list = objectMapper.readValue(Files.readAllBytes(hf), new TypeReference<List<String>>(){});
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
