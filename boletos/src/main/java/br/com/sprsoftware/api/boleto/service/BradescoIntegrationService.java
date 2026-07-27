package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.boleto.ws.bradesco.commons.ApiProxy;
import br.com.seprocom.api.utils.JsonUtils;
import br.com.sprsoftware.api.boleto.model.Boleto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service("bradescoIntegration")
public class BradescoIntegrationService implements BancoIntegrationService {

    @Autowired(required = false)
    @Qualifier("bradescoProxy")
    private ApiProxy bradescoProxy;

    @Override
    public Map<String, Object> emitir(Boleto autoriza) throws Exception {
        if (bradescoProxy == null) {
            return mockError("Bradesco nao configurado - verifique certificado e credenciais");
        }

        String dataVencimento = formatarData(autoriza.getVencimentoAut());
        Double valor = autoriza.getValorcanAut() != null
                ? autoriza.getValorcanAut().doubleValue()
                : 0.0;

        LinkedHashMap<String, Object> boleto = new LinkedHashMap<>();
        boleto.put("dataVencimento", dataVencimento);
        boleto.put("valorNominal", valor);
        boleto.put("codigoBeneficiario", bradescoProxy.getClientId());

        String pagadorDoc = autoriza.getControleAut();
        String pagadorNome = autoriza.getNumapo1Aut();

        LinkedHashMap<String, Object> pagador = new LinkedHashMap<>();
        pagador.put("tipoPessoa", 2);
        LinkedHashMap<String, Object> dadosPagador = new LinkedHashMap<>();
        dadosPagador.put("documento", pagadorDoc != null ? pagadorDoc : "12345678000199");
        dadosPagador.put("nome", pagadorNome != null ? pagadorNome : "PAGADOR TESTE");
        pagador.put("dadosPessoa", dadosPagador);
        boleto.put("pagador", pagador);

        boleto.put("descricao", "Boleto emitido via SPR");
        boleto.put("dataEmissao", formatarData(LocalDate.now()));

        String body = JsonUtils.toJson(boleto);
        String url = bradescoProxy.getServerUrl() + "/gateway/api/v1/boleto";
        Map<String, Object> resposta = bradescoProxy.sendRequest("POST", url, "application/json", body);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);
        resultado.put("httpCode", resposta.get("code"));
        resultado.put("body", resposta.get("body"));

        if (resposta.get("body") instanceof String) {
            Map<String, Object> bodyMap = JsonUtils.toMap((String) resposta.get("body"));
            resultado.put("nossoNumero", extractField(bodyMap, "nossoNumero"));
            resultado.put("linhaDigitavel", extractField(bodyMap, "linhaDigitavel"));
            resultado.put("codigoBarras", extractField(bodyMap, "codigoDeBarras"));
        }

        return resultado;
    }

    @Override
    public Map<String, Object> consultar(Boleto autoriza) throws Exception {
        if (bradescoProxy == null) {
            return mockError("Bradesco nao configurado - verifique certificado e credenciais");
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        String url = bradescoProxy.getServerUrl() + "/gateway/api/v1/boleto/" + nossoNumero;
        Map<String, Object> resposta = bradescoProxy.sendRequest("GET", url, null, null);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);

        if (resposta.get("body") instanceof String) {
            Map<String, Object> bodyMap = JsonUtils.toMap((String) resposta.get("body"));
            resultado.put("situacao", extractField(bodyMap, "situacaoAtual"));
        }

        return resultado;
    }

    @Override
    public Map<String, Object> baixar(Boleto autoriza) throws Exception {
        if (bradescoProxy == null) {
            return mockError("Bradesco nao configurado - verifique certificado e credenciais");
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        LinkedHashMap<String, Object> baixaBody = new LinkedHashMap<>();
        baixaBody.put("dataBaixa", formatarData(LocalDate.now()));
        baixaBody.put("tipoBaixa", 1);

        String body = JsonUtils.toJson(baixaBody);
        String url = bradescoProxy.getServerUrl() + "/gateway/api/v1/boleto/" + nossoNumero + "/baixa";
        Map<String, Object> resposta = bradescoProxy.sendRequest("POST", url, "application/json", body);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);

        return resultado;
    }

    @Override
    public Map<String, Object> alterarVencimento(Boleto autoriza, String novaData) throws Exception {
        if (bradescoProxy == null) {
            return mockError("Bradesco nao configurado - verifique certificado e credenciais");
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        LinkedHashMap<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("dataVencimento", novaData);

        String body = JsonUtils.toJson(bodyMap);
        String url = bradescoProxy.getServerUrl() + "/gateway/api/v1/boleto/" + nossoNumero + "/data-vencimento";
        Map<String, Object> resposta = bradescoProxy.sendRequest("POST", url, "application/json", body);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);

        return resultado;
    }

    private Map<String, Object> mockError(String msg) {
        Map<String, Object> erro = new LinkedHashMap<>();
        erro.put("sucesso", false);
        erro.put("mensagem", msg);
        return erro;
    }

    private String getNossoNumero(Boleto autoriza) {
        String nn = autoriza.getNossonumero();
        if (nn == null || nn.trim().isEmpty()) {
            nn = autoriza.getNossoNumero();
        }
        return nn;
    }

    private String formatarData(LocalDate data) {
        if (data == null) return null;
        return data.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private String extractField(Map<String, Object> map, String field) {
        if (map == null) return null;
        Object val = map.get(field);
        return val != null ? val.toString() : null;
    }
}
