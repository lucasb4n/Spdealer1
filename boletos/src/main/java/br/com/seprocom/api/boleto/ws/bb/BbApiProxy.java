package br.com.seprocom.api.boleto.ws.bb;

import br.com.seprocom.api.utils.*;
import br.com.seprocom.api.utils.http.HttpRequest;
import java.util.*;

public class BbApiProxy {

    private static final String AMBIENTE_SANDBOX = "https://api.sandbox.bb.com.br/cobrancas/v2";
    private static final String AMBIENTE_HOMOLOGACAO = "https://api.hm.bb.com.br/cobrancas/v2";
    private static final String AMBIENTE_PRODUCAO = "https://api.bb.com.br/cobrancas/v2";

    private static final String TOKEN_SANDBOX = "https://oauth.sandbox.bb.com.br/oauth/token";
    private static final String TOKEN_HOMOLOGACAO = "https://oauth.hm.bb.com.br/oauth/token";
    private static final String TOKEN_PRODUCAO = "https://oauth.bb.com.br/oauth/token";

    private String baseUrl;
    private String tokenUrl;
    private String clientId;
    private String clientSecret;
    private String appKey;
    private String accessToken;
    private Date expireAt;
    private boolean mockMode;

    public BbApiProxy(String clientId, String clientSecret, String appKey, String ambiente) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.appKey = appKey;
        this.mockMode = StrUtils.isNullOrEmpty(clientId) || StrUtils.isNullOrEmpty(clientSecret);

        if ("producao".equalsIgnoreCase(ambiente) || "production".equalsIgnoreCase(ambiente)) {
            baseUrl = AMBIENTE_PRODUCAO;
            tokenUrl = TOKEN_PRODUCAO;
        } else if ("homologacao".equalsIgnoreCase(ambiente)) {
            baseUrl = AMBIENTE_HOMOLOGACAO;
            tokenUrl = TOKEN_HOMOLOGACAO;
        } else {
            baseUrl = AMBIENTE_SANDBOX;
            tokenUrl = TOKEN_SANDBOX;
        }
    }

    public void auth() throws Exception {
        if (mockMode) return;
        if (accessToken != null && expireAt != null && new Date().before(expireAt)) return;

        String basicAuth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes("UTF-8"));

        LinkedHashMap<String, String> headers = new LinkedHashMap<>();
        headers.put("Content-Type", "application/x-www-form-urlencoded");
        headers.put("Authorization", "Basic " + basicAuth);

        String body = "grant_type=client_credentials&scope=cobrancas.boletos-requisicao cobrancas.boletos-info";

        HttpRequest.Response resp = new HttpRequest(tokenUrl)
                .method("POST")
                .headers(headers)
                .body(body)
                .send();

        if (!resp.isSuccess()) {
            throw new SprException("Falha na autenticacao BB: " + resp.getBody());
        }

        Map<String, Object> authResponse = JsonUtils.toMap(resp.getBody());
        accessToken = (String) authResponse.get("access_token");
        Integer expiresIn = (Integer) authResponse.get("expires_in");
        expireAt = new Date(System.currentTimeMillis() + (expiresIn != null ? expiresIn : 3600) * 1000L);
    }

    private LinkedHashMap<String, String> getHeaders() {
        LinkedHashMap<String, String> h = new LinkedHashMap<>();
        h.put("Authorization", "Bearer " + accessToken);
        h.put("Content-Type", "application/json");
        return h;
    }

    private String addAppKey(String url) {
        if (url.contains("?")) {
            return url + "&gw-dev-app-key=" + appKey;
        }
        return url + "?gw-dev-app-key=" + appKey;
    }

    public Map<String, Object> registrarBoleto(Map<String, Object> boletoJson) throws Exception {
        auth();
        String json = JsonUtils.serialize(boletoJson);
        HttpRequest.Response resp = new HttpRequest(addAppKey(baseUrl + "/boletos"))
                .method("POST")
                .headers(getHeaders())
                .body(json)
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> consultarBoleto(String nossoNumero, String numeroConvenio) throws Exception {
        auth();
        String url = addAppKey(baseUrl + "/boletos/" + nossoNumero)
                + "&numeroConvenio=" + numeroConvenio;
        HttpRequest.Response resp = new HttpRequest(url)
                .method("GET")
                .headers(getHeaders())
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> baixarBoleto(String nossoNumero, String numeroConvenio) throws Exception {
        auth();
        String body = JsonUtils.toJson(new LinkedHashMap<String, Object>() {{
            put("numeroConvenio", numeroConvenio);
        }});
        HttpRequest.Response resp = new HttpRequest(addAppKey(baseUrl + "/boletos/" + nossoNumero + "/baixar"))
                .method("POST")
                .headers(getHeaders())
                .body(body)
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> alterarVencimento(String nossoNumero, String numeroConvenio, String novaData) throws Exception {
        auth();
        LinkedHashMap<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("numeroConvenio", numeroConvenio);
        bodyMap.put("indicadorNovaDataVencimento", "S");
        LinkedHashMap<String, String> alteracaoData = new LinkedHashMap<>();
        alteracaoData.put("novaDataVencimento", novaData);
        bodyMap.put("alteracaoData", alteracaoData);

        HttpRequest.Response resp = new HttpRequest(addAppKey(baseUrl + "/boletos/" + nossoNumero))
                .method("PATCH")
                .headers(getHeaders())
                .body(JsonUtils.toJson(bodyMap))
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> gerarPix(String nossoNumero, String numeroConvenio) throws Exception {
        auth();
        String body = JsonUtils.toJson(new LinkedHashMap<String, Object>() {{
            put("numeroConvenio", numeroConvenio);
        }});
        HttpRequest.Response resp = new HttpRequest(addAppKey(baseUrl + "/boletos/" + nossoNumero + "/gerar-pix"))
                .method("POST")
                .headers(getHeaders())
                .body(body)
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public boolean isMockMode() { return mockMode; }
    public String getAccessToken() { return accessToken; }
}
