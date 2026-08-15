package br.com.seprocom.api.boleto.ws.asaas;

import br.com.seprocom.api.utils.*;
import br.com.seprocom.api.utils.http.HttpRequest;
import java.util.*;

public class AsaasApiClient {

    private static final String URL_SANDBOX = "https://api-sandbox.asaas.com/v3";
    private static final String URL_PRODUCAO = "https://api.asaas.com/v3";

    private String baseUrl;
    private String apiKey;
    private boolean mockMode;

    public AsaasApiClient(String apiKey, String ambiente) {
        this.apiKey = apiKey != null ? apiKey.trim() : null;
        this.mockMode = StrUtils.isNullOrEmpty(this.apiKey);
        if (ambiente != null && ("producao".equalsIgnoreCase(ambiente.trim()) || "p".equalsIgnoreCase(ambiente.trim()) || "prod".equalsIgnoreCase(ambiente.trim()))) {
            baseUrl = URL_PRODUCAO;
        } else {
            baseUrl = URL_SANDBOX;
        }
    }

    private LinkedHashMap<String, String> getHeaders() {
        LinkedHashMap<String, String> h = new LinkedHashMap<>();
        h.put("access_token", apiKey);
        h.put("Content-Type", "application/json");
        h.put("User-Agent", "SPDealer");
        return h;
    }

    private String get(String path) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + path)
                .method("GET")
                .headers(getHeaders())
                .timeout(5000)
                .send();
        if (resp.getCode() >= 400) {
            String errorMsg = parseAsaasError(resp.getBody());
            throw new RuntimeException(errorMsg);
        }
        return resp.getBody();
    }

    private String post(String path, String body) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + path)
                .method("POST")
                .headers(getHeaders())
                .body(body)
                .timeout(5000)
                .send();
        if (resp.getCode() >= 400) {
            String errorMsg = parseAsaasError(resp.getBody());
            throw new RuntimeException(errorMsg);
        }
        return resp.getBody();
    }

    private String delete(String path) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + path)
                .method("DELETE")
                .headers(getHeaders())
                .send();
        if (resp.getCode() >= 400) {
            String errorMsg = parseAsaasError(resp.getBody());
            throw new RuntimeException(errorMsg);
        }
        return resp.getBody();
    }

    private String parseAsaasError(String responseBody) {
        if (responseBody == null || responseBody.trim().isEmpty()) {
            return "Erro sem resposta da API Asaas";
        }
        try {
            Map<String, Object> map = JsonUtils.toMap(responseBody);
            Object errorsObj = map.get("errors");
            if (errorsObj instanceof List && !((List<?>) errorsObj).isEmpty()) {
                Object first = ((List<?>) errorsObj).get(0);
                if (first instanceof Map) {
                    Map<?, ?> errMap = (Map<?, ?>) first;
                    String desc = (String) errMap.get("description");
                    String code = (String) errMap.get("code");
                    if (desc != null && !desc.trim().isEmpty()) {
                        return "Erro Asaas (" + (code != null ? code : "ERRO") + "): " + desc;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return "Erro Asaas: " + responseBody;
    }

    public Map<String, Object> criarCustomer(String nome, String cpfCnpj, String endereco) throws Exception {
        LinkedHashMap<String, Object> body = new LinkedHashMap<>();
        body.put("name", nome != null ? nome : "NAO INFORMADO");
        body.put("cpfCnpj", StrUtils.somenteNumeros(cpfCnpj));
        if (endereco != null) {
            body.put("address", endereco);
        }
        String json = post("/customers", JsonUtils.serialize(body));
        return JsonUtils.toMap(json);
    }

    public Map<String, Object> listarCustomers(String cpfCnpj) throws Exception {
        String numeros = StrUtils.somenteNumeros(cpfCnpj);
        if (numeros == null) numeros = "";
        String json = get("/customers?cpfCnpj=" + numeros);
        return JsonUtils.toMap(json);
    }

    public Map<String, Object> criarPayment(String customerId, double valor, String dueDate,
                                             String externalReference) throws Exception {
        LinkedHashMap<String, Object> body = new LinkedHashMap<>();
        body.put("customer", customerId);
        body.put("billingType", "BOLETO");
        body.put("value", valor);
        body.put("dueDate", dueDate);
        if (externalReference != null) {
            body.put("externalReference", externalReference);
        }
        String json = post("/payments", JsonUtils.serialize(body));
        return JsonUtils.toMap(json);
    }

    public Map<String, Object> consultarPayment(String paymentId) throws Exception {
        String json = get("/payments/" + paymentId);
        return JsonUtils.toMap(json);
    }

    public Map<String, Object> baixarPayment(String paymentId) throws Exception {
        String json = delete("/payments/" + paymentId);
        return JsonUtils.toMap(json);
    }

    public Map<String, Object> getIdentificationField(String paymentId) throws Exception {
        String json = get("/payments/" + paymentId + "/identificationField");
        return JsonUtils.toMap(json);
    }

    public Map<String, Object> alterarVencimento(String paymentId, String novaData) throws Exception {
        LinkedHashMap<String, Object> body = new LinkedHashMap<>();
        body.put("dueDate", novaData);
        String json = post("/payments/" + paymentId, JsonUtils.serialize(body));
        return JsonUtils.toMap(json);
    }

    public boolean isMockMode() { return mockMode; }
    public String getBaseUrl() { return baseUrl; }
}
