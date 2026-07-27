package br.com.seprocom.api.boleto.ws.bradesco.commons;

import br.com.seprocom.api.boleto.ws.WsBase;
import br.com.seprocom.api.icp.*;
import br.com.seprocom.api.utils.*;
import br.com.seprocom.api.utils.http.*;
import java.security.*;
import java.util.*;

public class ApiProxy implements java.io.Serializable {

    private static final long serialVersionUID = 1L;
    private static final Date OLD_DATE = new Date(1L);

    private final boolean producao;
    private X509Cert cert;
    private String client_id;
    private Date expireAt = OLD_DATE;
    private String access_token;
    private String private_key;
    private String serverUrl;
    private String jti;
    private Map authResponse;
    private final String xBradAlgorithm = "SHA256";
    private String xBradTimestamp;

    public ApiProxy(boolean producao, Map config) throws SprException {
        this.producao = producao;
        this.client_id = (String) config.get("client_id");
        if (client_id == null || client_id.trim().isEmpty()) {
            throw new SprException("client_id e obrigatorio para Bradesco ApiProxy");
        }

        this.serverUrl = producao
                ? "https://openapi.bradesco.com.br"
                : "https://proxy.api.prebanco.com.br";

        String keyPem = (String) config.get("KEY");
        String cerPem = (String) config.get("CER");
        if (keyPem != null && cerPem != null) {
            this.cert = new X509CertPEM(cerPem, keyPem, null);
        } else {
            String pfxArquivo = (String) config.get("PFX_ARQUIVO");
            String pfxSenha = (String) config.get("PFX_SENHA");
            if (pfxArquivo != null) {
                this.cert = new X509CertA1(pfxArquivo, null, pfxSenha);
            } else {
                throw new SprException("Certificado Bradesco nao configurado (KEY+CER ou PFX_ARQUIVO+PFX_SENHA)");
            }
        }
        this.private_key = this.cert.getKeyString();
    }

    public static ApiProxy get(Object config) throws SprException {
        if (config == null || WsBase.isMock(config)) return null;
        Map map = (Map) config;
        Boolean prod = (Boolean) map.get("producao");
        if (prod == null) prod = false;
        return new ApiProxy(prod, map);
    }

    private void auth() throws SprException {
        if (expireAt != null && expireAt.after(new Date())) return;

        String authUrl = producao
                ? "https://auth.bradesco.com.br/oauth/token"
                : "https://auth.prebanco.com.br/oauth/token";

        LinkedHashMap<String, String> headers = new LinkedHashMap<>();
        headers.put("Content-Type", "application/json");

        LinkedHashMap<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("grant_type", "client_credentials");
        bodyMap.put("client_id", client_id);

        HttpRequest.Response resp = new HttpRequest(authUrl)
                .method("POST")
                .headers(headers)
                .body(JsonUtils.toJson(bodyMap))
                .send();

        if (!resp.isSuccess()) {
            throw new SprException("Falha na autenticacao Bradesco: " + resp.getBody());
        }

        authResponse = JsonUtils.toMap(resp.getBody());
        access_token = (String) authResponse.get("access_token");
        Integer expiresIn = (Integer) authResponse.get("expires_in");
        expireAt = new Date(System.currentTimeMillis() + (expiresIn != null ? expiresIn : 3600) * 1000L);
    }

    public Map sendRequest(String httpMethod, String url, String contentType, String body) throws SprException {
        auth();
        String token = getToken();
        String timestamp = String.valueOf(System.currentTimeMillis());
        String signature = getXBradSignature(jti, timestamp, body);

        LinkedHashMap<String, String> headers = new LinkedHashMap<>();
        headers.put("Authorization", "Bearer " + token);
        headers.put("x-bradesco-client-id", client_id);
        headers.put("x-bradesco-api-version", "1.0.0");
        headers.put("x-bradesco-signature", signature);
        headers.put("x-bradesco-timestamp", timestamp);
        if (contentType != null) {
            headers.put("Content-Type", contentType);
        }

        if ("GET".equals(httpMethod)) {
            return HttpRequest.get(url, headers, true);
        } else if ("POST".equals(httpMethod) || "PUT".equals(httpMethod) || "DELETE".equals(httpMethod)) {
            return HttpRequest.call(httpMethod, url, headers, body, true);
        } else {
            throw new SprException("Metodo nao suportado: " + httpMethod);
        }
    }

    public Map getCert() throws SprException {
        String url = serverUrl + "/gateway/api/v1/certificado";
        return sendRequest("GET", url, null, null);
    }

    public String getXBradSignature(String jti, String timestamp, String body) throws SprException {
        try {
            String method = "POST";
            String path = "/gateway/api/v1/boleto";
            String apiVersion = "1.0.0";

            StringBuilder sb = new StringBuilder();
            sb.append(method).append("\n");
            sb.append(path).append("\n");
            sb.append(jti != null ? jti : "").append("\n");
            sb.append(timestamp).append("\n");
            sb.append(apiVersion).append("\n");
            sb.append(serverUrl).append("\n");
            sb.append(xBradAlgorithm).append("\n");
            sb.append(body != null ? body : "");

            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(cert.getPrivateKey());
            sig.update(sb.toString().getBytes("UTF-8"));
            byte[] signed = sig.sign();
            return Base64.getEncoder().encodeToString(signed);
        } catch (Exception e) {
            throw new SprException("Erro ao assinar requisicao Bradesco: " + e.getMessage(), e);
        }
    }

    private static String encodePEM(byte[] data, String label) {
        String base64 = Base64.getEncoder().encodeToString(data);
        StringBuilder sb = new StringBuilder();
        sb.append("-----BEGIN ").append(label).append("-----\n");
        for (int i = 0; i < base64.length(); i += 64) {
            sb.append(base64.substring(i, Math.min(i + 64, base64.length()))).append("\n");
        }
        sb.append("-----END ").append(label).append("-----\n");
        return sb.toString();
    }

    public String getClientId() { return client_id; }
    public boolean isProducao() { return producao; }
    public String getServerUrl() { return serverUrl; }
    public X509Cert getCertInfo() { return cert; }
    public javax.net.ssl.SSLSocketFactory getSSLSocketFactory() { return cert.getSSLSocketFactory(); }
    public String getAccessToken() { return access_token; }
    public String getPrivateKey() { return private_key; }

    private String getToken() {
        return access_token;
    }
}
