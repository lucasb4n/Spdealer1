package br.com.spdealer.controller;

import org.springframework.core.env.Environment;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.Duration;

@RestController
@RequestMapping("/api/assets/logo")
public class AssetsController {

    private final Environment env;

    public AssetsController(Environment env) {
        this.env = env;
    }

    private boolean isDevProfile() {
        String[] profiles = env.getActiveProfiles();
        for (String p : profiles) {
            if ("dev".equalsIgnoreCase(p)) return true;
        }
        return false;
    }

    @GetMapping("/{key}")
    public ResponseEntity<?> getLogo(@PathVariable String key) throws IOException {
        String filename = null;
        switch (key) {
            case "login":
                filename = "assets/login.jpg";
                break;
            case "sidebar":
                filename = "assets/sidebar.jpg";
                break;
            case "system":
                filename = "assets/logo.jpg";
                break;
            default:
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        Resource resource = new ClassPathResource("static/" + filename);
        HttpHeaders headers = new HttpHeaders();

        if (!resource.exists()) {
            // fallback: retornar um SVG simples em runtime para evitar 404s durante desenvolvimento
            String svg = "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='80'><rect width='100%' height='100%' fill='#0b5fff'/><text x='50%' y='50%' font-size='18' fill='white' dominant-baseline='middle' text-anchor='middle'>SPDealer</text></svg>";
            headers.setContentType(MediaType.valueOf("image/svg+xml"));
            if (isDevProfile()) {
                // permitir caching leve em dev para reduzir chamadas repetidas durante desenvolvimento
                headers.setCacheControl(CacheControl.maxAge(Duration.ofMinutes(1)).cachePublic());
            } else {
                headers.setCacheControl(CacheControl.noStore());
            }
            return new ResponseEntity<>(svg.getBytes(java.nio.charset.StandardCharsets.UTF_8), headers, HttpStatus.OK);
        }

        headers.setContentType(MediaType.IMAGE_JPEG);
        if (isDevProfile()) {
            headers.setCacheControl(CacheControl.maxAge(Duration.ofMinutes(1)).cachePublic());
        } else {
            headers.setCacheControl(CacheControl.noCache());
        }
        return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }
}
