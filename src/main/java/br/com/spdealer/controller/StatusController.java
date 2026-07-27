package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
public class StatusController {
    private final DataSource dataSource;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    public StatusController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/api/status")
    public Map<String, Object> status() {
        Map<String, Object> map = new HashMap<>();
        map.put("backend", true);
        // Tenta ler a versão do backend do MANIFEST.MF
        String version = "1.0.0";
        try {
            Package pkg = getClass().getPackage();
            if (pkg != null && pkg.getImplementationVersion() != null) {
                version = pkg.getImplementationVersion();
            }
        } catch (Exception ignored) {}
        map.put("backendVersion", version);
        // Testa conexão com o banco
        try (Connection conn = dataSource.getConnection()) {
            map.put("db", true);
            map.put("dbUrl", dbUrl);
        } catch (Exception e) {
            map.put("db", false);
            map.put("dbUrl", dbUrl);
        }
        return map;
    }
}
