package br.com.seprocom.api.utils.http;

import br.com.seprocom.api.utils.SprException;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.LinkedHashMap;
import java.util.Map;

public class HttpRequest {

    private String url;
    private String method = "GET";
    private Map<String, String> headers;
    private String body;
    private int timeout = 30000;

    public HttpRequest(String url) {
        this.url = url;
        this.headers = new LinkedHashMap<>();
    }

    public HttpRequest method(String method) {
        this.method = method;
        return this;
    }

    public HttpRequest headers(Map<String, String> headers) {
        if (headers != null) {
            this.headers.putAll(headers);
        }
        return this;
    }

    public HttpRequest body(String body) {
        this.body = body;
        return this;
    }

    public HttpRequest timeout(int timeout) {
        this.timeout = timeout;
        return this;
    }

    public Response send() {
        HttpURLConnection conn = null;
        try {
            URL urlObj = new URL(url);
            conn = (HttpURLConnection) urlObj.openConnection();
            conn.setRequestMethod(method);
            conn.setConnectTimeout(timeout);
            conn.setReadTimeout(timeout);

            for (Map.Entry<String, String> entry : headers.entrySet()) {
                conn.setRequestProperty(entry.getKey(), entry.getValue());
            }

            if (body != null && !body.isEmpty()) {
                conn.setDoOutput(true);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(body.getBytes("UTF-8"));
                    os.flush();
                }
            }

            int code = conn.getResponseCode();
            String responseBody = readStream(code < 400 ? conn.getInputStream() : conn.getErrorStream());

            return new Response(code, responseBody);
        } catch (Exception e) {
            throw new SprException("Erro ao executar requisicao HTTP: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    private String readStream(InputStream is) throws IOException {
        if (is == null) return "";
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\n");
        }
        reader.close();
        return sb.toString().trim();
    }

    public static Map<String, Object> get(String url, LinkedHashMap<String, String> headers, boolean swallowErrors) {
        try {
            HttpRequest req = new HttpRequest(url).method("GET");
            if (headers != null) {
                req.headers(headers);
            }
            Response resp = req.send();
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("code", resp.getCode());
            result.put("body", resp.getBody());
            result.put("success", resp.isSuccess());
            return result;
        } catch (Exception e) {
            if (swallowErrors) {
                Map<String, Object> result = new java.util.LinkedHashMap<>();
                result.put("code", 0);
                result.put("body", e.getMessage());
                result.put("success", false);
                return result;
            }
            throw e;
        }
    }

    public static Map<String, Object> post(String url, String contentType, String accept, String body, boolean swallowErrors) {
        return call("POST", url, null, body, swallowErrors);
    }

    public static Map<String, Object> call(String method, String url, LinkedHashMap<String, String> headers, String body, boolean swallowErrors) {
        try {
            HttpRequest req = new HttpRequest(url).method(method);
            if (headers != null) {
                req.headers(headers);
            }
            if (body != null) {
                req.body(body);
            }
            Response resp = req.send();
            Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("code", resp.getCode());
            result.put("body", resp.getBody());
            result.put("success", resp.isSuccess());
            return result;
        } catch (Exception e) {
            if (swallowErrors) {
                Map<String, Object> result = new java.util.LinkedHashMap<>();
                result.put("code", 0);
                result.put("body", e.getMessage());
                result.put("success", false);
                return result;
            }
            throw e;
        }
    }

    public static class Response {
        private final int code;
        private final String body;

        public Response(int code, String body) {
            this.code = code;
            this.body = body;
        }

        public int getCode() {
            return code;
        }

        public String getBody() {
            return body;
        }

        public boolean isSuccess() {
            return code >= 200 && code < 300;
        }
    }
}
