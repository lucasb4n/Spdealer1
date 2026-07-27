package br.com.seprocom.api.boleto.ws.sicredi;

import br.com.seprocom.api.boleto.ws.WsBase;
import br.com.seprocom.api.utils.*;
import br.com.seprocom.api.utils.http.HttpRequest;
import java.util.*;

public class ApiProxy {

    private static final String AMBIENTE_SANDBOX = "https://api-parceiro.sicredi.com.br/sb";
    private static final String AMBIENTE_PRODUCAO = "https://api-parceiro.sicredi.com.br/api";

    private String baseUrl;
    private String apiKey;
    private String username;
    private String password;
    private String cooperativeCode;
    private String branchId;
    private String codigoBeneficiario;
    private String accessToken;
    private Date expireAt;
    private Map<String, Object> authResponse;
    private boolean mockMode;

    public ApiProxy(String apiKey, String username, String password,
                    String cooperativeCode, String branchId, String codigoBeneficiario) {
        this(apiKey, username, password, cooperativeCode, branchId, codigoBeneficiario, false);
    }

    public ApiProxy(String apiKey, String username, String password,
                    String cooperativeCode, String branchId, String codigoBeneficiario,
                    boolean producao) {
        this.apiKey = apiKey;
        this.username = username;
        this.password = password;
        this.cooperativeCode = cooperativeCode;
        this.branchId = branchId;
        this.codigoBeneficiario = codigoBeneficiario;
        this.baseUrl = producao ? AMBIENTE_PRODUCAO : AMBIENTE_SANDBOX;
        this.mockMode = StrUtils.isNullOrEmpty(apiKey);
    }

    public static ApiProxy fromEnv() {
        String apiKey = firstNonEmpty(System.getProperty("sicredi.apiKey"), System.getenv("SICREDI_API_KEY"));
        String username = firstNonEmpty(System.getProperty("sicredi.username"), System.getenv("SICREDI_USERNAME"));
        String password = firstNonEmpty(System.getProperty("sicredi.password"), System.getenv("SICREDI_PASSWORD"));
        String coop = firstNonEmpty(System.getProperty("sicredi.cooperativeCode"), System.getenv("SICREDI_COOPERATIVE_CODE"));
        String branch = firstNonEmpty(System.getProperty("sicredi.branchId"), System.getenv("SICREDI_BRANCH_ID"));
        String ben = firstNonEmpty(System.getProperty("sicredi.codigoBeneficiario"), System.getenv("SICREDI_CODIGO_BENEFICIARIO"));
        String ambiente = firstNonEmpty(System.getProperty("sicredi.ambiente"), System.getenv("SICREDI_AMBIENTE"));
        boolean producao = "producao".equalsIgnoreCase(ambiente) || "production".equalsIgnoreCase(ambiente);
        return new ApiProxy(apiKey, username, password, coop, branch, ben, producao);
    }

    private static String firstNonEmpty(String a, String b) {
        if (a != null && !a.trim().isEmpty()) return a;
        if (b != null && !b.trim().isEmpty()) return b;
        return null;
    }

    public void auth() throws Exception {
        if (mockMode) return;
        if (accessToken != null && expireAt != null && new Date().before(expireAt)) return;

        String url = baseUrl + "/auth/openapi/token";
        LinkedHashMap<String, String> headers = new LinkedHashMap<>();
        headers.put("Content-Type", "application/x-www-form-urlencoded");
        headers.put("x-api-key", apiKey);
        headers.put("context", "COBRANCA");

        StringBuilder body = new StringBuilder();
        body.append("username=").append(username);
        body.append("&password=").append(password);
        body.append("&scope=cobranca");
        body.append("&grant_type=password");

        HttpRequest.Response resp = new HttpRequest(url)
                .method("POST")
                .headers(headers)
                .body(body.toString())
                .send();

        if (!resp.isSuccess()) {
            throw new SprException("Falha na autenticacao Sicredi: " + resp.getBody());
        }

        authResponse = JsonUtils.toMap(resp.getBody());
        accessToken = (String) authResponse.get("access_token");
        Integer expiresIn = (Integer) authResponse.get("expires_in");
        expireAt = new Date(System.currentTimeMillis() + (expiresIn != null ? expiresIn : 3600) * 1000L);
    }

    private LinkedHashMap<String, String> getHeaders() {
        LinkedHashMap<String, String> h = new LinkedHashMap<>();
        h.put("Authorization", "Bearer " + accessToken);
        h.put("Content-Type", "application/json");
        h.put("cooperativa", cooperativeCode);
        h.put("posto", branchId);
        h.put("codigoBeneficiario", codigoBeneficiario);
        h.put("x-api-key", apiKey);
        return h;
    }

    public Map<String, Object> registrarBoleto(Map<String, Object> boletoJson) throws Exception {
        auth();
        String json = JsonUtils.serialize(boletoJson);
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos")
                .method("POST")
                .headers(getHeaders())
                .body(json)
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> consultarBoleto(String nossoNumero) throws Exception {
        auth();
        String url = baseUrl + "/cobranca/boleto/v1/boletos"
                + "?nossoNumero=" + nossoNumero
                + "&codigoBeneficiario=" + codigoBeneficiario;
        HttpRequest.Response resp = new HttpRequest(url)
                .method("GET")
                .headers(getHeaders())
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> baixarBoleto(String nossoNumero) throws Exception {
        auth();
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos/" + nossoNumero + "/baixa")
                .method("PATCH")
                .headers(getHeaders())
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> alterarDataVencimento(String nossoNumero, String novaData) throws Exception {
        auth();
        String body = JsonUtils.toJson(new LinkedHashMap<String, String>() {{ put("dataVencimento", novaData); }});
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos/" + nossoNumero + "/data-vencimento")
                .method("PATCH")
                .headers(getHeaders())
                .body(body)
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> alterarDesconto(String nossoNumero, Double desc1, Double desc2, Double desc3) throws Exception {
        auth();
        LinkedHashMap<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("valorDesconto1", desc1);
        bodyMap.put("valorDesconto2", desc2);
        bodyMap.put("valorDesconto3", desc3);
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos/" + nossoNumero + "/desconto")
                .method("POST")
                .headers(getHeaders())
                .body(JsonUtils.toJson(bodyMap))
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> alterarJuros(String nossoNumero, Double valorAbatimento) throws Exception {
        auth();
        LinkedHashMap<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("valorAbatimento", valorAbatimento);
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos/" + nossoNumero + "/juros")
                .method("POST")
                .headers(getHeaders())
                .body(JsonUtils.toJson(bodyMap))
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> alterarSeuNumero(String nossoNumero, String novoSeuNumero) throws Exception {
        auth();
        LinkedHashMap<String, String> bodyMap = new LinkedHashMap<>();
        bodyMap.put("seuNumero", novoSeuNumero);
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos/" + nossoNumero + "/seu-numero")
                .method("POST")
                .headers(getHeaders())
                .body(JsonUtils.toJson(bodyMap))
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> instruirProtesto(String nossoNumero) throws Exception {
        auth();
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos/" + nossoNumero + "/protesto")
                .method("POST")
                .headers(getHeaders())
                .body("{}")
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public Map<String, Object> sustarProtestoBaixar(String nossoNumero) throws Exception {
        auth();
        HttpRequest.Response resp = new HttpRequest(baseUrl + "/cobranca/boleto/v1/boletos/" + nossoNumero + "/sustar-protesto")
                .method("POST")
                .headers(getHeaders())
                .body("{}")
                .send();
        return JsonUtils.toMap(resp.getBody());
    }

    public static TreeMap<String, Object> gerarBoletoJson(
            String benNome, String benDocumento, String benCep, String benCidade,
            String benLogradouro, String benNumeroEndereco, String benUf, String benTipoPessoa,
            String pagNome, String pagDocumento, String pagCep, String pagCidade,
            String pagEndereco, String pagUf, String pagTipoPessoa,
            String codigoBeneficiario, String seuNumero, String dataVencimento, Double valor,
            String especieDocumento, String tipoCobranca,
            List<String> informativos, List<String> mensagens) {

        TreeMap<String, Object> boleto = new TreeMap<>();

        LinkedHashMap<String, Object> beneficiarioFinal = new LinkedHashMap<>();
        beneficiarioFinal.put("nome", benNome);
        beneficiarioFinal.put("documento", benDocumento);
        beneficiarioFinal.put("cep", benCep);
        beneficiarioFinal.put("cidade", benCidade);
        beneficiarioFinal.put("logradouro", benLogradouro);
        beneficiarioFinal.put("numeroEndereco", benNumeroEndereco);
        beneficiarioFinal.put("uf", benUf);
        beneficiarioFinal.put("tipoPessoa", benTipoPessoa);
        boleto.put("beneficiarioFinal", beneficiarioFinal);

        LinkedHashMap<String, Object> pagador = new LinkedHashMap<>();
        pagador.put("nome", pagNome);
        pagador.put("documento", pagDocumento);
        pagador.put("cep", pagCep);
        pagador.put("cidade", pagCidade);
        pagador.put("endereco", pagEndereco);
        pagador.put("uf", pagUf);
        pagador.put("tipoPessoa", pagTipoPessoa);
        boleto.put("pagador", pagador);

        boleto.put("codigoBeneficiario", codigoBeneficiario);
        boleto.put("seuNumero", seuNumero);
        boleto.put("dataVencimento", dataVencimento);
        boleto.put("valor", valor);
        boleto.put("especieDocumento", especieDocumento != null ? especieDocumento : "DUPLICATA_MERCANTIL_INDICACAO");
        boleto.put("tipoCobranca", tipoCobranca != null ? tipoCobranca : "HIBRIDO");

        if (informativos != null && !informativos.isEmpty()) {
            boleto.put("informativos", informativos);
        }
        if (mensagens != null && !mensagens.isEmpty()) {
            boleto.put("mensagens", mensagens);
        }

        return boleto;
    }

    public boolean isMockMode() { return mockMode; }
    public String getBaseUrl() { return baseUrl; }
    public String getAccessToken() { return accessToken; }
    public String getCooperativeCode() { return cooperativeCode; }
    public String getBranchId() { return branchId; }
    public String getCodigoBeneficiario() { return codigoBeneficiario; }
}
