package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.boleto.ws.basa.BasaApiClient;
import br.com.seprocom.api.utils.StrUtils;
import br.com.sprsoftware.api.boleto.config.BasaConfig;
import br.com.sprsoftware.api.boleto.model.Boleto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service("basaIntegration")
public class BasaIntegrationService implements BancoIntegrationService {

    @Autowired
    private BasaConfig basaConfig;

    private BasaApiClient getClient() {
        return basaConfig.getBasaClient();
    }

    @Override
    public Map<String, Object> emitir(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Banco da Amazonia em modo mock - configure a apikey na tabela bancos (codigo_bco='006')");
            return erro;
        }

        String dataVencimento = formatarData(autoriza.getVencimentoAut());
        String dataEmissao = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        double valor = autoriza.getValorcanAut() != null
                ? autoriza.getValorcanAut().doubleValue()
                : 0.0;

        String pagadorDoc = StrUtils.somenteNumeros(autoriza.getControleAut());
        if (pagadorDoc == null || pagadorDoc.length() < 11) {
            pagadorDoc = "11222333000181";
        }

        String pagadorNome = autoriza.getNumapo1Aut() != null ? autoriza.getNumapo1Aut() : "PAGADOR NAO INFORMADO";
        String pagadorEndereco = autoriza.getNumapo2Aut() != null ? autoriza.getNumapo2Aut() : "ENDERECO NAO INFORMADO";

        String nossoNumeroStr = String.format("%07d", autoriza.getId());

        LinkedHashMap<String, Object> pagadorMap = new LinkedHashMap<>();
        pagadorMap.put("cpfCnpj", pagadorDoc);
        pagadorMap.put("nome", pagadorNome);
        pagadorMap.put("endereco", pagadorEndereco);

        LinkedHashMap<String, Object> boletoMap = new LinkedHashMap<>();
        boletoMap.put("agencia", basaConfig.getAgencia());
        boletoMap.put("conta", basaConfig.getConta());
        boletoMap.put("convenio", basaConfig.getConvenio());
        boletoMap.put("nossoNumero", nossoNumeroStr);
        boletoMap.put("seuNumero", autoriza.getId().toString());
        boletoMap.put("valor", valor);
        boletoMap.put("dataEmissao", dataEmissao);
        boletoMap.put("dataVencimento", dataVencimento);
        boletoMap.put("pagador", pagadorMap);

        Map<String, Object> respMap = getClient().incluirBoleto(boletoMap);

        String nossoNumero = extractString(respMap, "nossoNumero");
        if (nossoNumero == null) {
            nossoNumero = nossoNumeroStr;
        }
        String linhaDigitavel = extractString(respMap, "linhaDigitavel");
        String codigoBarras = extractString(respMap, "codigoBarras");
        String pixQrcode = extractString(respMap, "pixQrcode");

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", respMap);
        resultado.put("nossoNumero", nossoNumero);
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
            erro.put("mensagem", "Banco da Amazonia em modo mock - configure a apikey");
            return erro;
        }

        String nossoNumero = autoriza.getId().toString();
        Map<String, Object> respMap = getClient().consultarBoleto(nossoNumero);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", respMap);
        resultado.put("situacao", extractString(respMap, "situacao"));
        return resultado;
    }

    @Override
    public Map<String, Object> baixar(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Banco da Amazonia em modo mock - configure a apikey");
            return erro;
        }

        String nossoNumero = autoriza.getId().toString();
        Map<String, Object> respMap = getClient().baixarBoleto(nossoNumero);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", respMap);
        return resultado;
    }

    @Override
    public Map<String, Object> alterarVencimento(Boleto autoriza, String novaData) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Banco da Amazonia em modo mock - configure a apikey");
            return erro;
        }

        String nossoNumero = autoriza.getId().toString();
        String dataFormatada = formatarData(novaData);
        Map<String, Object> respMap = getClient().alterarVencimento(nossoNumero, dataFormatada);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", respMap);
        return resultado;
    }

    private String formatarData(Object dt) {
        if (dt == null) return null;
        String s = dt.toString().trim();
        if (s.contains("T")) {
            s = s.substring(0, s.indexOf("T"));
        }
        if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return s;
        }
        if (s.matches("\\d{2}/\\d{2}/\\d{4}")) {
            String[] parts = s.split("/");
            return parts[2] + "-" + parts[1] + "-" + parts[0];
        }
        return s;
    }

    private String extractString(Map<String, Object> map, String key) {
        if (map == null) return null;
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }
}
