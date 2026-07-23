package br.com.spdealer.controller;

import br.com.spdealer.service.RtcCalculadoraProxyService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Endpoints de compatibilidade com a UI oficial da calculadora offline.
 * A UI costuma chamar diretamente /api/calculadora/*.
 *
 * Este controller apenas faz proxy para a calculadora configurada em rtc.calculadora.base-url,
 * evitando CORS e permitindo hospedar a UI dentro do SPDealer.
 */
@RestController
@RequestMapping("/api/calculadora")
public class CalculadoraCompatController {

    @Autowired
    private RtcCalculadoraProxyService proxy;

    @PostMapping("/regime-geral")
    public ResponseEntity<?> regimeGeral(@RequestBody JsonNode body) {
        try {
            var resp = proxy.postJson("/api/calculadora/regime-geral", body);
            if (resp.status() >= 200 && resp.status() < 300) {
                // tenta devolver JSON (se vier texto, devolve string mesmo)
                try {
                    return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(new com.fasterxml.jackson.databind.ObjectMapper().readTree(resp.body()));
                } catch (Exception ignored) {
                    return ResponseEntity.ok().body(resp.body());
                }
            }
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Erro ao chamar calculadora RTC", "status", resp.status(), "body", resp.body()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Falha ao chamar calculadora RTC", "message", e.getMessage()));
        }
    }

    @PostMapping("/xml/generate")
    public ResponseEntity<?> generateXml(
            @RequestParam(name = "tipo") String tipo,
            @RequestBody JsonNode body
    ) {
        try {
            String path = "/api/calculadora/xml/generate?tipo=" + encode(tipo);
            var resp = proxy.postJson(path, body);
            MediaType ct = safeMediaType(resp.contentType(), MediaType.APPLICATION_XML);
            return ResponseEntity.status(resp.status()).contentType(ct).body(resp.body());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Falha ao chamar calculadora RTC", "message", e.getMessage()));
        }
    }

    @PostMapping("/xml/validate")
    public ResponseEntity<?> validateXml(
            @RequestParam(name = "tipo") String tipo,
            @RequestParam(name = "subtipo", required = false) String subtipo,
            @RequestBody String xml
    ) {
        try {
            String path = "/api/calculadora/xml/validate?tipo=" + encode(tipo);
            if (subtipo != null && !subtipo.isBlank()) {
                path += "&subtipo=" + encode(subtipo);
            }
            var resp = proxy.postXml(path, xml);
            MediaType ct = safeMediaType(resp.contentType(), MediaType.APPLICATION_JSON);
            return ResponseEntity.status(resp.status()).contentType(ct).body(resp.body());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", "Falha ao chamar calculadora RTC", "message", e.getMessage()));
        }
    }

    /**
     * Proxy completo para endpoints de "dados-abertos" usados pela UI oficial.
     * Exemplos (na calculadora):
     * - GET /api/calculadora/dados-abertos/ufs
     * - GET /api/calculadora/dados-abertos/municipios?uf=SP
     * - GET /api/calculadora/dados-abertos/ncm?termo=0101
     */
    @GetMapping({"/dados-abertos", "/dados-abertos/", "/dados-abertos/**"})
    public ResponseEntity<?> dadosAbertosProxy(HttpServletRequest request) {
        try {
            String requestUri = request.getRequestURI() == null ? "" : request.getRequestURI();
            String query = request.getQueryString();

            // Extrai o trecho a partir de /api/calculadora (funciona tanto em JAR quanto em WAR /spdealer)
            String marker = "/api/calculadora";
            int idx = requestUri.indexOf(marker);
            String tail = idx >= 0 ? requestUri.substring(idx + marker.length()) : requestUri;
            if (tail.isBlank()) tail = "/";
            if (!tail.startsWith("/")) tail = "/" + tail;

            String path = "/api/calculadora" + tail;
            if (query != null && !query.isBlank()) {
                path += "?" + query;
            }

            var resp = proxy.get(path);
            MediaType ct = safeMediaType(resp.contentType(), MediaType.APPLICATION_JSON);
            return ResponseEntity.status(resp.status()).contentType(ct).body(resp.body());
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Falha ao chamar calculadora RTC", "message", e.getMessage()));
        }
    }

    private static String encode(String s) {
        if (s == null) return "";
        return java.net.URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private static MediaType safeMediaType(String raw, MediaType fallback) {
        try {
            if (raw == null || raw.isBlank()) return fallback;
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_TYPE, raw);
            return headers.getContentType() == null ? fallback : headers.getContentType();
        } catch (Exception e) {
            return fallback;
        }
    }
}
