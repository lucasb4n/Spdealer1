package br.com.spdealer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpConnectTimeoutException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.ConnectException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class RtcCalculadoraProxyService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;

    public RtcCalculadoraProxyService(
            ObjectMapper objectMapper,
            @Value("${rtc.calculadora.base-url:}") String baseUrl
    ) {
        this.objectMapper = objectMapper;
        this.baseUrl = baseUrl == null ? "" : baseUrl.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }
    public record ProxyResponse(int status, String contentType, String body) {}

    private URI buildUri(String pathWithLeadingSlash) {
        if (baseUrl.isBlank()) {
            throw new IllegalStateException("RTC calculadora base-url nao configurada. Defina rtc.calculadora.base-url (ex: http://localhost:8081)");
        }
        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (!pathWithLeadingSlash.startsWith("/")) {
            pathWithLeadingSlash = "/" + pathWithLeadingSlash;
        }
        return URI.create(normalizedBase + pathWithLeadingSlash);
    }

    private static String pickContentType(Map<String, List<String>> headers) {
        if (headers == null) return null;
        for (Map.Entry<String, List<String>> e : headers.entrySet()) {
            if (e.getKey() != null && e.getKey().equalsIgnoreCase("content-type")) {
                if (e.getValue() != null && !e.getValue().isEmpty()) return e.getValue().get(0);
            }
        }
        return null;
    }

    public ProxyResponse postJson(String path, JsonNode requestBody) throws Exception {
        URI uri = buildUri(path);
        String json = objectMapper.writeValueAsString(requestBody);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        return new ProxyResponse(resp.statusCode(), pickContentType(resp.headers().map()), resp.body() == null ? "" : resp.body());
    }

    public ProxyResponse postXml(String path, String xmlBody) throws Exception {
        URI uri = buildUri(path);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", MediaType.APPLICATION_XML_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(xmlBody == null ? "" : xmlBody))
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        return new ProxyResponse(resp.statusCode(), pickContentType(resp.headers().map()), resp.body() == null ? "" : resp.body());
    }

    public ProxyResponse get(String path) throws Exception {
        URI uri = buildUri(path);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(60))
                .GET()
                .build();

        HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        return new ProxyResponse(resp.statusCode(), pickContentType(resp.headers().map()), resp.body() == null ? "" : resp.body());
    }

    public JsonNode calcularRegimeGeral(JsonNode requestBody) throws Exception {
        if (baseUrl.isBlank()) {
            throw new IllegalStateException("RTC calculadora base-url nao configurada. Defina rtc.calculadora.base-url (recomendado em DEV: http://localhost:18081 se voce rodar a calculadora via Docker com port mapping)");
        }

        String normalizedBase = normalizeBaseUrl(baseUrl);
        String path = "/api/calculadora/regime-geral";

        try {
            ProxyResponse resp = postJson(path, requestBody);
            if (resp.status >= 200 && resp.status < 300) {
                if (resp.body == null || resp.body.isBlank()) return objectMapper.createObjectNode();
                return objectMapper.readTree(resp.body);
            }
            throw new RuntimeException("Erro RTC (" + resp.status + "): " + (resp.body == null ? "" : resp.body));
        } catch (RtcHttpException ex) {
            // Tentativa automatica quando a calculadora estiver rodando em outra porta (comum em setups offline)
            String alt = alternativePortBaseUrl(normalizedBase);
            if (alt != null && (ex.isConnectionFailure() || ex.statusCode == 404)) {
                return postJson(URI.create(alt + path), requestBody);
            }
            throw ex;
        }
    }

    private String normalizeBaseUrl(String raw) {
        String s = raw == null ? "" : raw.trim();
        if (s.endsWith("/")) s = s.substring(0, s.length() - 1);
        return s;
    }

    private String alternativePortBaseUrl(String normalizedBase) {
        if (normalizedBase == null) return null;
        // regras simples (sem tentar ser parser completo de URL)
        if (normalizedBase.contains(":8080")) return normalizedBase.replace(":8080", ":8081");
        if (normalizedBase.contains(":8081")) return normalizedBase.replace(":8081", ":8080");
        if (normalizedBase.contains(":18080")) return normalizedBase.replace(":18080", ":18081");
        if (normalizedBase.contains(":18081")) return normalizedBase.replace(":18081", ":18080");
        return null;
    }

    private JsonNode postJson(URI uri, JsonNode requestBody) throws Exception {
        String json = objectMapper.writeValueAsString(requestBody);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        try {
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            int status = resp.statusCode();
            String body = resp.body() == null ? "" : resp.body();

            if (status >= 200 && status < 300) {
                if (body.isBlank()) {
                    return objectMapper.createObjectNode();
                }
                return objectMapper.readTree(body);
            }

            throw new RtcHttpException(status, body, false);
        } catch (HttpConnectTimeoutException | ConnectException e) {
            throw new RtcHttpException(0, e.getMessage(), true);
        }
    }

    private static class RtcHttpException extends RuntimeException {
        final int statusCode;
        final String responseBody;
        final boolean connectionFailure;

        RtcHttpException(int statusCode, String responseBody, boolean connectionFailure) {
            super(buildMessage(statusCode, responseBody, connectionFailure));
            this.statusCode = statusCode;
            this.responseBody = responseBody;
            this.connectionFailure = connectionFailure;
        }

        boolean isConnectionFailure() {
            return connectionFailure;
        }

        private static String buildMessage(int statusCode, String responseBody, boolean connectionFailure) {
            if (connectionFailure) {
                return "Falha de conexao ao chamar calculadora RTC (verifique se a calculadora offline esta rodando e se as portas estao acessiveis). Detalhe: " + (responseBody == null ? "" : responseBody);
            }
            return "Erro RTC (" + statusCode + "): " + (responseBody == null ? "" : responseBody);
        }
    }
}
