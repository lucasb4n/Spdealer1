package br.com.seprocom.api.boleto.ws.sicoob;

import br.com.seprocom.api.utils.*;
import br.com.seprocom.api.utils.http.HttpRequest;
import java.util.*;

public class SicoobApiClient {

    private static final String URL_SANDBOX = "https://sandbox.sicoob.com.br/sicoob/sandbox/cobranca-bancaria/v3";
    private static final String URL_PRODUCAO = "https://api.sicoob.com.br/cobranca-bancaria/v3";

    private String baseUrl;
    private String clientId;
    private String accessToken;
    private boolean mockMode;
    private boolean producao;

    public SicoobApiClient(String clientId, String accessToken, String ambiente) {
        this.clientId = clientId;
        this.accessToken = accessToken;
        this.mockMode = StrUtils.isNullOrEmpty(clientId) || StrUtils.isNullOrEmpty(accessToken);

        if ("producao".equalsIgnoreCase(ambiente) || "production".equalsIgnoreCase(ambiente)) {
            baseUrl = URL_PRODUCAO;
            producao = true;
        } else {
            baseUrl = URL_SANDBOX;
            producao = false;
        }
    }

    public void auth() throws Exception {
        if (mockMode) return;
        if (producao) {
            throw new UnsupportedOperationException(
                    "Sicoob producao requer OAuth2 + mTLS (certificado digital ICP Brasil)");
        }
    }

    private LinkedHashMap<String, String> getHeaders() {
        LinkedHashMap<String, String> h = new LinkedHashMap<>();
        h.put("Authorization", "Bearer " + accessToken);
        h.put("client_id", clientId);
        h.put("Content-Type", "application/json");
        h.put("Accept", "application/json");
        return h;
    }

    private String get(String path) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + path)
                .method("GET")
                .headers(getHeaders())
                .send();
        return resp.getBody();
    }

    private String post(String path, String body) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + path)
                .method("POST")
                .headers(getHeaders())
                .body(body)
                .send();
        return resp.getBody();
    }

    private String patch(String path, String body) throws Exception {
        HttpRequest.Response resp = new HttpRequest(baseUrl + path)
                .method("PATCH")
                .headers(getHeaders())
                .body(body)
                .send();
        return resp.getBody();
    }

    public Map<String, Object> incluirBoleto(Map<String, Object> boletoJson) throws Exception {
        auth();
        String json = JsonUtils.serialize(boletoJson);
        String resp = post("/boletos", json);
        return JsonUtils.toMap(resp);
    }

    public Map<String, Object> consultarBoleto(String numeroContrato, String modalidade, String nossoNumero) throws Exception {
        auth();
        String path = "/boletos?numeroContrato=" + numeroContrato
                + "&modalidade=" + modalidade
                + "&nossoNumero=" + nossoNumero;
        String resp = get(path);
        return JsonUtils.toMap(resp);
    }

    public Map<String, Object> baixarBoleto(String nossoNumero, String numeroContrato, String modalidade) throws Exception {
        auth();
        LinkedHashMap<String, Object> body = new LinkedHashMap<>();
        body.put("numeroContratoCobranca", Integer.parseInt(numeroContrato));
        body.put("codigoModalidade", Integer.parseInt(modalidade));
        String resp = post("/boletos/" + nossoNumero + "/baixar", JsonUtils.serialize(body));
        return JsonUtils.toMap(resp);
    }

    public Map<String, Object> alterarVencimento(String nossoNumero, String numeroContrato,
                                                  String modalidade, String novaData) throws Exception {
        auth();
        LinkedHashMap<String, Object> body = new LinkedHashMap<>();
        LinkedHashMap<String, Object> prorrogacao = new LinkedHashMap<>();
        prorrogacao.put("dataVencimento", novaData);
        body.put("numeroContratoCobranca", Integer.parseInt(numeroContrato));
        body.put("codigoModalidade", Integer.parseInt(modalidade));
        body.put("prorrogacaoVencimento", prorrogacao);
        String resp = patch("/boletos/" + nossoNumero, JsonUtils.serialize(body));
        return JsonUtils.toMap(resp);
    }

    public boolean isMockMode() { return mockMode; }
    public boolean isProducao() { return producao; }
    public String getBaseUrl() { return baseUrl; }
    public String getClientId() { return clientId; }
}
