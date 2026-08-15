package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.boleto.ws.sicredi.ApiProxy;
import br.com.seprocom.api.utils.JsonUtils;
import br.com.seprocom.api.utils.StrUtils;
import br.com.sprsoftware.api.boleto.model.Boleto;
import br.com.sprsoftware.api.boleto.config.SicrediConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service("sicrediIntegration")
public class SicrediIntegrationService implements BancoIntegrationService {

    @Autowired
    private SicrediConfig sicrediConfig;

    private ApiProxy getSicredi() {
        return sicrediConfig.getSicrediProxy();
    }

    @Override
    public Map<String, Object> emitir(Boleto autoriza) throws Exception {
        if (getSicredi().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicredi em modo mock - configure a x-api-key");
            return erro;
        }

        String dataVencimento = formatarData(autoriza.getVencimentoAut());
        Double valor = autoriza.getValorcanAut() != null
                ? autoriza.getValorcanAut().doubleValue()
                : 0.0;

        String pagadorDoc = autoriza.getControleAut();
        String pagadorDocNumeros = StrUtils.somenteNumeros(pagadorDoc);
        if (pagadorDocNumeros == null || pagadorDocNumeros.length() < 11) {
            pagadorDoc = "12345678000195";
        }
        String pagadorNome = autoriza.getNumapo1Aut();
        String pagadorEndereco = autoriza.getNumapo2Aut();
        String pagadorCep = "00000000";
        String pagadorCidade = "CIDADE TESTE";
        String pagadorUf = "SP";

        String benNome = getSicredi().getCodigoBeneficiario() != null
                ? "Beneficiario " + getSicredi().getCodigoBeneficiario() : "CARTORIO TESTE";
        String benDocumento = "12345678000195";
        String benCep = "00000000";
        String benCidade = "CIDADE TESTE";
        String benLogradouro = "RUA TESTE";
        String benNumero = "0";
        String benUf = "SP";
        String benTipoPessoa = "PESSOA_JURIDICA";

        TreeMap<String, Object> boletoJson = ApiProxy.gerarBoletoJson(
                benNome, benDocumento, benCep, benCidade,
                benLogradouro, benNumero, benUf, benTipoPessoa,
                pagadorNome != null ? pagadorNome : "PAGADOR TESTE",
                pagadorDoc != null ? pagadorDoc : "12345678000195",
                pagadorCep, pagadorCidade,
                pagadorEndereco != null ? pagadorEndereco : "RUA TESTE, 123",
                pagadorUf, "PESSOA_JURIDICA",
                getSicredi().getCodigoBeneficiario(),
                String.valueOf(autoriza.getId()),
                dataVencimento,
                valor,
                "DUPLICATA_MERCANTIL_INDICACAO",
                "HIBRIDO",
                null, null
        );

        Map<String, Object> resposta = getSicredi().registrarBoleto(boletoJson);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);
        resultado.put("nossoNumero", extractField(resposta, "nossoNumero"));
        resultado.put("linhaDigitavel", extractField(resposta, "linhaDigitavel"));
        resultado.put("codigoBarras", extractField(resposta, "codigoBarras"));
        resultado.put("pixQrcode", extractField(resposta, "qrCode"));

        return resultado;
    }

    @Override
    public Map<String, Object> consultar(Boleto autoriza) throws Exception {
        if (getSicredi().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicredi em modo mock - configure a x-api-key");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        Map<String, Object> resposta = getSicredi().consultarBoleto(nossoNumero);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);
        resultado.put("situacao", extractField(resposta, "situacao"));

        return resultado;
    }

    @Override
    public Map<String, Object> baixar(Boleto autoriza) throws Exception {
        if (getSicredi().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicredi em modo mock - configure a x-api-key");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        Map<String, Object> resposta = getSicredi().baixarBoleto(nossoNumero);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);
        resultado.put("statusComando", extractField(resposta, "statusComando"));

        return resultado;
    }

    @Override
    public Map<String, Object> alterarVencimento(Boleto autoriza, String novaData) throws Exception {
        if (getSicredi().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicredi em modo mock - configure a x-api-key");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        Map<String, Object> resposta = getSicredi().alterarDataVencimento(nossoNumero, novaData);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);

        return resultado;
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

    private String extractNestedField(Map<String, Object> map, String parent, String field) {
        if (map == null) return null;
        Object nested = map.get(parent);
        if (nested instanceof Map) {
            Object val = ((Map<?, ?>) nested).get(field);
            return val != null ? val.toString() : null;
        }
        return null;
    }
}
