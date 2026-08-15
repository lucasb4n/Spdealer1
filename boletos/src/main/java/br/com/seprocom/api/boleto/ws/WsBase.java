package br.com.seprocom.api.boleto.ws;

import br.com.seprocom.api.utils.*;
import br.com.seprocom.api.utils.http.*;
import java.security.MessageDigest;
import java.util.*;

public class WsBase {

    protected String endpoint;
    protected String clientId;
    protected String clientSecret;
    protected String token;
    protected Map<String, Object> authResponse;
    protected boolean mockMode = false;

    public WsBase(String endpoint) {
        this.endpoint = endpoint;
    }

    public void authenticate(String clientId, String clientSecret, Map<String, String> extraParams) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        try {
            HttpRequest req = new HttpRequest(endpoint + "/oauth/token")
                    .method("POST")
                    .headers(new LinkedHashMap<String, String>() {{
                        put("Content-Type", "application/x-www-form-urlencoded");
                    }});

            StringBuilder body = new StringBuilder();
            body.append("grant_type=client_credentials");
            body.append("&client_id=").append(clientId);
            body.append("&client_secret=").append(clientSecret);

            if (extraParams != null) {
                for (Map.Entry<String, String> entry : extraParams.entrySet()) {
                    body.append("&").append(entry.getKey()).append("=").append(entry.getValue());
                }
            }

            req.body(body.toString());
            HttpRequest.Response response = req.send();
            if (!response.isSuccess()) {
                throw new SprException("Falha na autenticacao: " + response.getBody());
            }
            authResponse = JsonUtils.toMap(response.getBody());
            token = (String) authResponse.get("access_token");
        } catch (SprException e) {
            throw e;
        } catch (Exception e) {
            throw new SprException("Erro ao autenticar no servico: " + e.getMessage(), e);
        }
    }

    protected HttpRequest.Response doGet(String path) {
        return doRequest("GET", path, null);
    }

    protected HttpRequest.Response doPost(String path, Object body) {
        String bodyStr = (body instanceof String) ? (String) body : JsonUtils.toJson(body);
        return doRequest("POST", path, bodyStr);
    }

    protected HttpRequest.Response doRequest(String method, String path, String body) {
        try {
            HttpRequest req = new HttpRequest(endpoint + path)
                    .method(method)
                    .headers(getDefaultHeaders());
            if (body != null) req.body(body);
            return req.send();
        } catch (Exception e) {
            throw new SprException("Erro ao executar requisicao: " + e.getMessage(), e);
        }
    }

    protected Map<String, String> getDefaultHeaders() {
        LinkedHashMap<String, String> h = new LinkedHashMap<>();
        h.put("Content-Type", "application/json");
        h.put("Authorization", "Bearer " + token);
        return h;
    }

    public static String sign(String data, String algorithm, String key) {
        try {
            MessageDigest md = MessageDigest.getInstance(algorithm);
            byte[] digest = md.digest(data.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                int val = 0xFF & b;
                String hex = Integer.toHexString(val);
                if (hex.length() == 1) sb.append('0');
                sb.append(hex);
            }
            return sb.toString();
        } catch (Exception e) {
            throw new SprException("Erro ao assinar dados", e);
        }
    }

    public static boolean isMock(Object obj) {
        if (obj instanceof Boolean) return (Boolean) obj;
        return obj == null;
    }

    public static boolean isMock(boolean b) {
        return b;
    }

    public static String generateUUID() {
        return UUID.randomUUID().toString();
    }

    public static void debug(String... msgs) {
        StringBuilder sb = new StringBuilder("[DEBUG] ");
        for (String m : msgs) {
            sb.append(m).append(" ");
        }
        System.out.println(sb.toString().trim());
    }

    public static void debug(Object... msgs) {
        StringBuilder sb = new StringBuilder("[DEBUG] ");
        for (Object m : msgs) {
            sb.append(m != null ? m.toString() : "null").append(" ");
        }
        System.out.println(sb.toString().trim());
    }

    public String getToken() {
        return token;
    }

    public Map<String, Object> getAuthResponse() {
        return authResponse;
    }

    public void setMockMode(boolean mockMode) {
        this.mockMode = mockMode;
    }
}
