package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

@Service
public class CpfProxyService {

    @Value("${cpf.oauth.token-url:https://apigateway.conectagov.estaleiro.serpro.gov.br/oauth2/jwt-token}")
    private String tokenUrl;

    @Value("${cpf.api.url:https://apigateway.conectagov.estaleiro.serpro.gov.br/api-cpf-light/v2/consulta/cpf}")
    private String cpfApiUrl;

    @Value("${cpf.oauth.client-id:}")
    private String clientId;

    @Value("${cpf.oauth.client-secret:}")
    private String clientSecret;

    private final RestTemplate rest = new RestTemplate();

    // Cache simples em memória
    private String cachedToken;
    private Instant tokenExpiresAt = Instant.EPOCH;

    private synchronized String getToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiresAt)) {
            return cachedToken;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        String body = String.format("grant_type=client_credentials&client_id=%s&client_secret=%s", clientId, clientSecret);

        HttpEntity<String> req = new HttpEntity<>(body, headers);

        ResponseEntity<Map> resp = rest.postForEntity(tokenUrl, req, Map.class);
        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
            throw new RuntimeException("Erro obtendo token OAuth2 CPF: " + resp.getStatusCode());
        }

        Map<String, Object> bodyMap = resp.getBody();
        Object access = bodyMap.get("access_token");
        Object expiresIn = bodyMap.get("expires_in");

        if (access == null) throw new RuntimeException("Resposta de token sem access_token");

        cachedToken = access.toString();
        long expSeconds = 7200; // fallback 2h
        if (expiresIn != null) {
            try { expSeconds = Long.parseLong(expiresIn.toString()); } catch (Exception ignored) {}
        }

        // definir margem de 60s
        tokenExpiresAt = Instant.now().plusSeconds(Math.max(30, expSeconds - 60));
        return cachedToken;
    }

    public Map<String, Object> consultarCpf(String cpf) {
        String token = getToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        String payload = String.format("{\"cpf\":\"%s\"}", cpf.replaceAll("\\D",""));

        HttpEntity<String> req = new HttpEntity<>(payload, headers);

        ResponseEntity<Map> resp = rest.postForEntity(cpfApiUrl, req, Map.class);
        if (!resp.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Erro na consulta CPF: " + resp.getStatusCode());
        }

        return resp.getBody();
    }
}
