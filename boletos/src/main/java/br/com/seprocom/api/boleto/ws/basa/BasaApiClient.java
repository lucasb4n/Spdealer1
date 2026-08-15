package br.com.seprocom.api.boleto.ws.basa;

import br.com.seprocom.api.utils.*;
import br.com.seprocom.api.utils.http.HttpRequest;
import java.util.*;

public class BasaApiClient {

    private static final String DEFAULT_SANDBOX = "https://sandbox.bancoamazonia.com.br/api/v1";
    private static final String DEFAULT_PRODUCAO = "https://api.bancoamazonia.com.br/api/v1";

    private String baseUrl;
    private String apiKey;
    private boolean mockMode;

    public BasaApiClient(String apiKey, String ambiente, String urlSandbox, String urlProd) {
        this.apiKey = apiKey != null ? apiKey.trim() : null;
        this.mockMode = StrUtils.isNullOrEmpty(this.apiKey);

        boolean isProd = ambiente != null && (
                "producao".equalsIgnoreCase(ambiente.trim()) ||
                "p".equalsIgnoreCase(ambiente.trim()) ||
                "prod".equalsIgnoreCase(ambiente.trim())
        );

        if (isProd) {
            this.baseUrl = !StrUtils.isNullOrEmpty(urlProd) ? urlProd.trim() : DEFAULT_PRODUCAO;
        } else {
            this.baseUrl = !StrUtils.isNullOrEmpty(urlSandbox) ? urlSandbox.trim() : DEFAULT_SANDBOX;
        }
    }

    private LinkedHashMap<String, String> getHeaders() {
        LinkedHashMap<String, String> h = new LinkedHashMap<>();
        if (apiKey != null && !apiKey.isEmpty()) {
            if (apiKey.toLowerCase().startsWith("bearer ")) {
                h.put("Authorization", apiKey);
            } else {
                h.put("Authorization", "Bearer " + apiKey);
            }
        }
        h.put("Content-Type", "application/json");
        h.put("Accept", "application/json");
        h.put("User-Agent", "SPDealer");
        return h;
    }

    public Map<String, Object> incluirBoleto(Map<String, Object> payload) throws Exception {
        String body = JsonUtils.serialize(payload);
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/boletos")
                .method("POST")
                .headers(getHeaders())
                .body(body)
                .timeout(5000)
                .send();

        if (resp.getCode() >= 400) {
            throw new RuntimeException("Erro Banco da Amazonia (" + resp.getCode() + "): " + resp.getBody());
        }
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> consultarBoleto(String nossoNumero) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/boletos/" + nossoNumero)
                .method("GET")
                .headers(getHeaders())
                .timeout(5000)
                .send();

        if (resp.getCode() >= 400) {
            throw new RuntimeException("Erro ao consultar boleto Banco da Amazonia (" + resp.getCode() + "): " + resp.getBody());
        }
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> baixarBoleto(String nossoNumero) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/boletos/" + nossoNumero + "/baixar")
                .method("POST")
                .headers(getHeaders())
                .timeout(5000)
                .send();

        if (resp.getCode() >= 400) {
            throw new RuntimeException("Erro ao baixar boleto Banco da Amazonia (" + resp.getCode() + "): " + resp.getBody());
        }
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> alterarVencimento(String nossoNumero, String novaData) throws Exception {
        LinkedHashMap<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("dataVencimento", novaData);
        String body = JsonUtils.serialize(bodyMap);

        HttpRequest.Response resp = new HttpRequest(baseUrl + "/boletos/" + nossoNumero + "/vencimento")
                .method("PATCH")
                .headers(getHeaders())
                .body(body)
                .timeout(5000)
                .send();

        if (resp.getCode() >= 400) {
            throw new RuntimeException("Erro ao alterar vencimento Banco da Amazonia (" + resp.getCode() + "): " + resp.getBody());
        }
        return JsonUtils.toMap(resp.getBody());
    }

    public boolean isMockMode() { return mockMode; }
    public String getBaseUrl() { return baseUrl; }
}
