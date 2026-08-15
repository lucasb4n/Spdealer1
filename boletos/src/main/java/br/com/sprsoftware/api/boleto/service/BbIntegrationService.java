package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.boleto.ws.bb.BbApiProxy;
import br.com.seprocom.api.utils.JsonUtils;
import br.com.seprocom.api.utils.StrUtils;
import br.com.sprsoftware.api.boleto.model.Boleto;
import br.com.sprsoftware.api.boleto.config.BbConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service("bbIntegration")
public class BbIntegrationService implements BancoIntegrationService {

    @Autowired
    private BbConfig bbConfig;

    private BbApiProxy getProxy() {
        return bbConfig.getBbProxy();
    }

    @Override
    public Map<String, Object> emitir(Boleto autoriza) throws Exception {
        if (getProxy().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "BB em modo mock - configure as credenciais na tabela bancos (codigo_bco='001')");
            return erro;
        }

        String dataVencimento = formatarData(autoriza.getVencimentoAut());
        String dataEmissao = LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        Double valor = autoriza.getValorcanAut() != null
                ? autoriza.getValorcanAut().doubleValue()
                : 0.0;

        String pagadorDoc = autoriza.getControleAut();
        String pagadorDocNumeros = StrUtils.somenteNumeros(pagadorDoc);
        if (pagadorDocNumeros == null || pagadorDocNumeros.length() < 11) {
            pagadorDocNumeros = "11222333000181";
        }
        String pagadorNome = autoriza.getNumapo1Aut();
        String pagadorEndereco = autoriza.getNumapo2Aut();
        String pagadorCep = "70000000";
        String pagadorCidade = "BRASILIA";
        String pagadorBairro = "CENTRO";
        String pagadorUf = "DF";
        String pagadorTelefone = "6130000000";

        int tipoInscricao = detectarTipoInscricao(pagadorDocNumeros);
        String numeroInscricao = pagadorDocNumeros;

        String numeroConvenio = bbConfig.getConvenio();
        String nossoNumero = gerarNossoNumero(numeroConvenio, autoriza.getId());

        LinkedHashMap<String, Object> pagador = new LinkedHashMap<>();
        pagador.put("tipoInscricao", tipoInscricao);
        pagador.put("numeroInscricao", numeroInscricao);
        pagador.put("nome", pagadorNome != null ? pagadorNome : "PAGADOR NAO INFORMADO");
        pagador.put("endereco", pagadorEndereco != null ? pagadorEndereco : "ENDERECO NAO INFORMADO");
        pagador.put("cep", apenasNumeros(pagadorCep));
        pagador.put("cidade", pagadorCidade);
        pagador.put("bairro", pagadorBairro);
        pagador.put("uf", pagadorUf);
        pagador.put("telefone", pagadorTelefone);

        LinkedHashMap<String, Object> boletoJson = new LinkedHashMap<>();
        boletoJson.put("numeroConvenio", numeroConvenio != null ? Integer.parseInt(numeroConvenio) : 0);
        boletoJson.put("numeroCarteira", bbConfig.getCarteira() != null ? Integer.parseInt(bbConfig.getCarteira()) : 17);
        boletoJson.put("numeroVariacaoCarteira", bbConfig.getVariacaoCarteira() != null ? Integer.parseInt(bbConfig.getVariacaoCarteira()) : 35);
        boletoJson.put("codigoModalidade", bbConfig.getModalidade() != null ? Integer.parseInt(bbConfig.getModalidade()) : 1);
        boletoJson.put("dataEmissao", dataEmissao);
        boletoJson.put("dataVencimento", dataVencimento);
        boletoJson.put("valorOriginal", valor);
        boletoJson.put("codigoAceite", "A");
        boletoJson.put("codigoTipoTitulo", 2);
        boletoJson.put("descricaoTipoTitulo", "DUPLICATA MERCANTIL");
        boletoJson.put("indicadorPermissaoRecebimentoParcial", "N");
        boletoJson.put("numeroTituloBeneficiario", autoriza.getId().toString());
        boletoJson.put("numeroTituloCliente", nossoNumero);
        boletoJson.put("pagador", pagador);
        boletoJson.put("indicadorPix", "S");

        Map<String, Object> resposta = getProxy().registrarBoleto(boletoJson);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);
        resultado.put("nossoNumero", extractString(resposta, "numero"));
        resultado.put("linhaDigitavel", extractString(resposta, "linhaDigitavel"));
        resultado.put("codigoBarras", extractString(resposta, "codigoBarraNumerico"));

        Object pixObj = resposta.get("pix");
        if (pixObj instanceof Map) {
            resultado.put("pixQrcode", extractString((Map<String, Object>) pixObj, "qrcode"));
        }

        return resultado;
    }

    @Override
    public Map<String, Object> consultar(Boleto autoriza) throws Exception {
        if (getProxy().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "BB em modo mock - configure as credenciais");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        String convenio = bbConfig.getConvenio();

        Map<String, Object> resposta = getProxy().consultarBoleto(nossoNumero, convenio);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);
        resultado.put("situacao", extractString(resposta, "estadoTituloCobranca"));

        return resultado;
    }

    @Override
    public Map<String, Object> baixar(Boleto autoriza) throws Exception {
        if (getProxy().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "BB em modo mock - configure as credenciais");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        String convenio = bbConfig.getConvenio();

        Map<String, Object> resposta = getProxy().baixarBoleto(nossoNumero, convenio);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("sucesso", true);
        resultado.put("resposta", resposta);

        return resultado;
    }

    @Override
    public Map<String, Object> alterarVencimento(Boleto autoriza, String novaData) throws Exception {
        if (getProxy().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "BB em modo mock - configure as credenciais");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        String convenio = bbConfig.getConvenio();

        Map<String, Object> resposta = getProxy().alterarVencimento(nossoNumero, convenio, novaData);

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
        if (data == null) {
            return LocalDate.now().plusDays(30).format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        }
        return data.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
    }

    private String gerarNossoNumero(String convenio, Long id) {
        if (convenio == null) convenio = "0000000";
        String convPadded = String.format("%07d", Integer.parseInt(convenio.replaceAll("\\D", "")));
        String seqPadded = String.format("%010d", id != null ? id : 1);
        return "000" + convPadded + seqPadded;
    }

    private int detectarTipoInscricao(String documento) {
        if (documento == null) return 2;
        String nums = StrUtils.somenteNumeros(documento);
        if (nums.length() <= 11) return 1;
        return 2;
    }

    private String apenasNumeros(String s) {
        if (s == null) return "";
        return s.replaceAll("[^0-9]", "");
    }

    private String extractString(Map<String, Object> map, String field) {
        if (map == null) return null;
        Object val = map.get(field);
        return val != null ? val.toString() : null;
    }
}
