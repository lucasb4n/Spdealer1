package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.utils.StrUtils;
import br.com.sprsoftware.api.boleto.config.AsaasConfig;
import br.com.sprsoftware.api.boleto.model.Boleto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service("asaasIntegration")
public class AsaasIntegrationService implements BancoIntegrationService {

    @Autowired
    private AsaasConfig asaasConfig;

    private br.com.seprocom.api.boleto.ws.asaas.AsaasApiClient getClient() {
        return asaasConfig.getAsaasClient();
    }

    @Override
    public Map<String, Object> emitir(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Asaas em modo mock - configure a apikey na tabela bancos (codigo_bco='461')");
            return erro;
        }

        String documento = autoriza.getControleAut();
        String nome = autoriza.getNumapo1Aut();
        String endereco = autoriza.getNumapo2Aut();
        String dataVencimento = formatarData(autoriza.getVencimentoAut());
        double valor = autoriza.getValorcanAut() != null
                ? autoriza.getValorcanAut().doubleValue()
                : 0.0;

        String docNumeros = StrUtils.somenteNumeros(documento);
        if (docNumeros == null || docNumeros.length() < 11) {
            documento = "11222333000181";
        } else {
            documento = docNumeros;
        }

        String customerId = buscarOuCriarCustomer(documento, nome, endereco);

        String contaId = autoriza.getId().toString();

        Map<String, Object> paymentResp = getClient().criarPayment(
                customerId, valor, dataVencimento, contaId);

        String paymentId = extractString(paymentResp, "id");

        Map<String, Object> identResp = null;
        String linhaDigitavel = null;
        String codigoBarras = null;
        if (paymentId != null) {
            try {
                identResp = getClient().getIdentificationField(paymentId);
                linhaDigitavel = extractString(identResp, "identificationField");
                codigoBarras = extractString(identResp, "barCode");
            } catch (Exception e) {
                System.err.println("[Asaas] Erro ao buscar identificationField: " + e.getMessage());
            }
        }

        String pixQrcode = extractString(paymentResp, "pixQrcode");
        if (pixQrcode == null) {
            pixQrcode = extractNestedString(paymentResp, "pix", "qrcode");
        }
        // Fallback: se nao veio no create, busca no GET payment
        if (pixQrcode == null && paymentId != null) {
            try {
                Map<String, Object> fullResp = getClient().consultarPayment(paymentId);
                pixQrcode = extractNestedString(fullResp, "pix", "qrcode");
            } catch (Exception e) {
                System.err.println("[Asaas] Erro ao buscar pix: " + e.getMessage());
            }
        }

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", paymentResp);
        resultado.put("nossoNumero", paymentId);
        resultado.put("linhaDigitavel", linhaDigitavel);
        resultado.put("codigoBarras", codigoBarras);
        resultado.put("pixQrcode", pixQrcode);

        return resultado;
    }

    @Override
    public Map<String, Object> consultar(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Asaas em modo mock - configure a apikey");
            return erro;
        }

        String paymentId = getPaymentId(autoriza);
        if (paymentId == null || paymentId.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Payment ID nao encontrado no registro");
            return erro;
        }

        Map<String, Object> resposta = getClient().consultarPayment(paymentId);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);
        resultado.put("situacao", extractString(resposta, "status"));

        return resultado;
    }

    @Override
    public Map<String, Object> baixar(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Asaas em modo mock - configure a apikey");
            return erro;
        }

        String paymentId = getPaymentId(autoriza);
        if (paymentId == null || paymentId.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Payment ID nao encontrado no registro");
            return erro;
        }

        Map<String, Object> resposta = getClient().baixarPayment(paymentId);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);

        return resultado;
    }

    @Override
    public Map<String, Object> alterarVencimento(Boleto autoriza, String novaData) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Asaas em modo mock - configure a apikey");
            return erro;
        }

        String paymentId = getPaymentId(autoriza);
        if (paymentId == null || paymentId.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Payment ID nao encontrado no registro");
            return erro;
        }

        Map<String, Object> resposta = getClient().alterarVencimento(paymentId, novaData);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);

        return resultado;
    }

    private String buscarOuCriarCustomer(String documento, String nome, String endereco) throws Exception {
        Map<String, Object> searchResp = getClient().listarCustomers(documento);
        Object dataObj = searchResp.get("data");
        if (dataObj instanceof List && !((List<?>) dataObj).isEmpty()) {
            Object first = ((List<?>) dataObj).get(0);
            if (first instanceof Map) {
                String id = extractString((Map<String, Object>) first, "id");
                if (id != null) return id;
            }
        }

        Map<String, Object> createResp = getClient().criarCustomer(nome, documento, endereco);
        return extractString(createResp, "id");
    }

    private String getPaymentId(Boleto autoriza) {
        String id = autoriza.getNossonumero();
        if (id == null || id.trim().isEmpty()) {
            id = autoriza.getNossoNumero();
        }
        return id;
    }

    private String formatarData(LocalDate data) {
        if (data == null) {
            return LocalDate.now().plusDays(30).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        }
        return data.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private String extractString(Map<String, Object> map, String field) {
        if (map == null) return null;
        Object val = map.get(field);
        return val != null ? val.toString() : null;
    }

    private String extractNestedString(Map<String, Object> map, String parent, String field) {
        if (map == null) return null;
        Object nested = map.get(parent);
        if (nested instanceof Map) {
            Object val = ((Map<?, ?>) nested).get(field);
            return val != null ? val.toString() : null;
        }
        return null;
    }
}
