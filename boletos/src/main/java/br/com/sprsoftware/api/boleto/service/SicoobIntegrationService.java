package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.boleto.ws.sicoob.SicoobApiClient;
import br.com.seprocom.api.utils.StrUtils;
import br.com.sprsoftware.api.boleto.config.SicoobConfig;
import br.com.sprsoftware.api.boleto.model.Boleto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service("sicoobIntegration")
public class SicoobIntegrationService implements BancoIntegrationService {

    @Autowired
    private SicoobConfig sicoobConfig;

    private SicoobApiClient getClient() {
        return sicoobConfig.getSicoobClient();
    }

    @Override
    public Map<String, Object> emitir(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicoob em modo mock - configure client_id e client_secret na tabela bancos (codigo_bco='756')");
            return erro;
        }

        String numeroContrato = sicoobConfig.getConvenioNumero();
        if (numeroContrato == null || numeroContrato.trim().isEmpty()) {
            numeroContrato = "1";
        }
        int modalidade = Integer.parseInt(sicoobConfig.getModalidade());

        String dataVencimento = formatarData(autoriza.getVencimentoAut());
        String dataEmissao = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        double valor = autoriza.getValorcanAut() != null
                ? autoriza.getValorcanAut().doubleValue()
                : 0.0;

        String pagadorDoc = autoriza.getControleAut();
        String pagadorNome = autoriza.getNumapo1Aut();
        String pagadorEndereco = autoriza.getNumapo2Aut();

        String docNumeros = StrUtils.somenteNumeros(pagadorDoc);
        if (docNumeros == null || docNumeros.length() < 11) {
            docNumeros = "11222333000181";
        }

        int nossoNumeroInt = gerarNossoNumero(autoriza.getId());

        String benDocumento = "12345678000195";
        String benNome = "CARTORIO PROTESTO TESTE";
        if (sicoobConfig.getCodigoBeneficiario() != null) {
            benNome = "BENEFICIARIO " + sicoobConfig.getCodigoBeneficiario();
        }

        LinkedHashMap<String, Object> pagador = new LinkedHashMap<>();
        pagador.put("numeroCpfCnpj", docNumeros);
        pagador.put("nome", pagadorNome != null ? pagadorNome : "PAGADOR NAO INFORMADO");
        pagador.put("endereco", pagadorEndereco != null ? pagadorEndereco : "ENDERECO NAO INFORMADO");
        pagador.put("bairro", "CENTRO");
        pagador.put("cidade", "BRASILIA");
        pagador.put("cep", "70000000");
        pagador.put("uf", "DF");
        pagador.put("email", "pagador@email.com");

        LinkedHashMap<String, Object> beneficiarioFinal = new LinkedHashMap<>();
        beneficiarioFinal.put("numeroCpfCnpj", benDocumento);
        beneficiarioFinal.put("nome", benNome);

        LinkedHashMap<String, Object> boletoJson = new LinkedHashMap<>();
        boletoJson.put("numeroContratoCobranca", Integer.parseInt(numeroContrato));
        boletoJson.put("codigoModalidade", modalidade);
        boletoJson.put("codigoEspecieDocumento", "DM");
        boletoJson.put("dataEmissao", dataEmissao);
        boletoJson.put("nossoNumero", nossoNumeroInt);
        boletoJson.put("seuNumero", autoriza.getId().toString());
        boletoJson.put("identificacaoBoletoEmpresa", autoriza.getId().toString());
        boletoJson.put("identificacaoEmissaoBoleto", 1);
        boletoJson.put("identificacaoDistribuicaoBoleto", 1);
        boletoJson.put("valor", valor);
        boletoJson.put("dataVencimento", dataVencimento);
        boletoJson.put("aceite", true);
        boletoJson.put("codigoCadastrarPIX", 1);
        boletoJson.put("pagador", pagador);
        boletoJson.put("beneficiarioFinal", beneficiarioFinal);

        System.out.println("[Sicoob] Enviando boleto: numeroContrato=" + numeroContrato
                + " modalidade=" + modalidade + " nossoNumero=" + nossoNumeroInt
                + " valor=" + valor + " vencimento=" + dataVencimento
                + " pagadorDoc=" + docNumeros + " pagadorNome=" + pagadorNome);

        Map<String, Object> resposta = getClient().incluirBoleto(boletoJson);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("resposta", resposta);

        List<?> mensagens = extractMensagens(resposta);
        if (mensagens != null && !mensagens.isEmpty()) {
            String msg = mensagens.toString();
            Map<String, Object> primeira = (Map<String, Object>) mensagens.get(0);
            if (primeira != null && primeira.get("mensagem") != null) {
                msg = primeira.get("mensagem").toString();
            }
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Sicoob: " + msg);
            return resultado;
        }

        resultado.put("sucesso", true);

        Map<String, Object> resultadoObj = extractResultado(resposta);
        if (resultadoObj != null) {
            resultado.put("nossoNumero", extractString(resultadoObj, "nossoNumero"));
            resultado.put("linhaDigitavel", extractString(resultadoObj, "linhaDigitavel"));
            resultado.put("codigoBarras", extractString(resultadoObj, "codigoBarras"));
            resultado.put("pixQrcode", extractString(resultadoObj, "qrCode"));
        } else {
            resultado.put("nossoNumero", String.valueOf(nossoNumeroInt));
        }

        return resultado;
    }

    @Override
    public Map<String, Object> consultar(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicoob em modo mock - configure as credenciais");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        String numeroContrato = sicoobConfig.getConvenioNumero();
        if (numeroContrato == null) numeroContrato = "1";
        String modalidade = sicoobConfig.getModalidade();
        if (modalidade == null) modalidade = "1";

        Map<String, Object> resposta = getClient().consultarBoleto(numeroContrato, modalidade, nossoNumero);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("resposta", resposta);

        List<?> mensagens = extractMensagens(resposta);
        if (mensagens != null && !mensagens.isEmpty()) {
            String msg = mensagens.toString();
            Map<String, Object> primeira = (Map<String, Object>) mensagens.get(0);
            if (primeira != null && primeira.get("mensagem") != null) {
                msg = primeira.get("mensagem").toString();
            }
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Sicoob: " + msg);
            return resultado;
        }

        resultado.put("sucesso", true);

        Map<String, Object> resultadoObj = extractResultado(resposta);
        if (resultadoObj != null) {
            resultado.put("situacao", extractString(resultadoObj, "situacao"));
        }

        return resultado;
    }

    @Override
    public Map<String, Object> baixar(Boleto autoriza) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicoob em modo mock - configure as credenciais");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        String numeroContrato = sicoobConfig.getConvenioNumero();
        if (numeroContrato == null) numeroContrato = "1";
        String modalidade = sicoobConfig.getModalidade();
        if (modalidade == null) modalidade = "1";

        Map<String, Object> resposta = getClient().baixarBoleto(nossoNumero, numeroContrato, modalidade);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("resposta", resposta);

        List<?> mensagens = extractMensagens(resposta);
        if (mensagens != null && !mensagens.isEmpty()) {
            String msg = mensagens.toString();
            Map<String, Object> primeira = (Map<String, Object>) mensagens.get(0);
            if (primeira != null && primeira.get("mensagem") != null) {
                msg = primeira.get("mensagem").toString();
            }
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Sicoob: " + msg);
            return resultado;
        }

        resultado.put("sucesso", true);

        return resultado;
    }

    @Override
    public Map<String, Object> alterarVencimento(Boleto autoriza, String novaData) throws Exception {
        if (getClient().isMockMode()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Sicoob em modo mock - configure as credenciais");
            return erro;
        }

        String nossoNumero = getNossoNumero(autoriza);
        if (nossoNumero == null || nossoNumero.trim().isEmpty()) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Nosso numero nao encontrado no registro");
            return erro;
        }

        String numeroContrato = sicoobConfig.getConvenioNumero();
        if (numeroContrato == null) numeroContrato = "1";
        String modalidade = sicoobConfig.getModalidade();
        if (modalidade == null) modalidade = "1";

        Map<String, Object> resposta = getClient().alterarVencimento(nossoNumero, numeroContrato, modalidade, novaData);

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("resposta", resposta);

        List<?> mensagens = extractMensagens(resposta);
        if (mensagens != null && !mensagens.isEmpty()) {
            String msg = mensagens.toString();
            Map<String, Object> primeira = (Map<String, Object>) mensagens.get(0);
            if (primeira != null && primeira.get("mensagem") != null) {
                msg = primeira.get("mensagem").toString();
            }
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Sicoob: " + msg);
            return resultado;
        }

        resultado.put("sucesso", true);

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
            return LocalDate.now().plusDays(30).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        }
        return data.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private int gerarNossoNumero(Long id) {
        long base = id != null ? id : System.currentTimeMillis() % 1000000;
        return (int) (base % 100000000);
    }

    private Map<String, Object> extractResultado(Map<String, Object> map) {
        if (map == null) return null;
        Object obj = map.get("resultado");
        if (obj instanceof Map) {
            return (Map<String, Object>) obj;
        }
        return null;
    }

    private List<?> extractMensagens(Map<String, Object> map) {
        if (map == null) return null;
        Object obj = map.get("mensagens");
        if (obj instanceof List) {
            return (List<?>) obj;
        }
        return null;
    }

    private String extractString(Map<String, Object> map, String field) {
        if (map == null) return null;
        Object val = map.get(field);
        return val != null ? val.toString() : null;
    }
}
