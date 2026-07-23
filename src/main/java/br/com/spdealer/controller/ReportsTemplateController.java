package br.com.spdealer.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportsTemplateController {

    private static final Logger logger = LoggerFactory.getLogger(ReportsTemplateController.class);

    public static class SaveTemplateRequest {
        public String name;
        public String content;
    }

    @PostMapping("/templates")
    public ResponseEntity<?> saveTemplate(@RequestBody SaveTemplateRequest req) {
        try {
            if (req == null || req.name == null || req.name.isBlank() || req.content == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name and content are required"));
            }

            // sanitize name: allow letters, numbers, underscore, hyphen
            String safe = req.name.replaceAll("[^A-Za-z0-9_\\-]", "_");
            if (safe.contains("..") || safe.contains("/") || safe.contains("\\")) {
                return ResponseEntity.badRequest().body(Map.of("error", "invalid name"));
            }

            Path targetDir = Paths.get("src/main/resources/templates/reports");
            if (!Files.exists(targetDir)) Files.createDirectories(targetDir);

            Path target = targetDir.resolve(safe + ".html");
            Files.writeString(target, req.content, StandardCharsets.UTF_8);

            logger.info("Saved report template: {}", target.toString());
            return ResponseEntity.status(201).body(Map.of("path", target.toString()));
        } catch (Exception e) {
            logger.error("Erro ao salvar template: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
