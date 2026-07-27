package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.utils.JsonUtils;
import br.com.sprsoftware.api.boleto.model.Boleto;
import br.com.sprsoftware.api.boleto.repository.BoletoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BoletoService {

    @Autowired
    protected BoletoRepository repository;

    @Autowired
    protected BancoServiceFactory bancoFactory;

    public Page<Boleto> listar(String banco, String sucesso, String numapo, LocalDate inicio, LocalDate fim, int page, int size) {
        return repository.buscarComFiltros(banco, sucesso, numapo, inicio, fim, PageRequest.of(page, size));
    }

    public Optional<Boleto> buscarPorId(Long id) {
        return repository.findById(id);
    }

    public Map<String, Object> obterStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", repository.count());
        stats.put("enviados", repository.countByEnviaAut("S"));
        stats.put("sucesso1", repository.countBySucesso("1"));
        stats.put("sucessoOK", repository.countBySucesso("OK"));
        return stats;
    }

    public Map<String, Object> emitirBanco(Long id) {
        Optional<Boleto> opt = repository.findById(id);
        if (!opt.isPresent()) {
            return erro("Registro nao encontrado: " + id);
        }

        Boleto autoriza = opt.get();
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", autoriza.getId());

        try {
            BancoIntegrationService banco = bancoFactory.get(autoriza.getBancoAut());
            Map<String, Object> resposta = banco.emitir(autoriza);

            if (Boolean.FALSE.equals(resposta.getOrDefault("sucesso", false))) {
                resultado.putAll(resposta);
                autoriza.setMsgAut((String) resposta.get("mensagem"));
                autoriza.setSucesso("ERRO");
                repository.save(autoriza);
                return resultado;
            }

            String nossoNumero = (String) resposta.get("nossoNumero");
            String linhaDigitavel = (String) resposta.get("linhaDigitavel");
            String codigoBarras = (String) resposta.get("codigoBarras");
            String pixQrcode = (String) resposta.get("pixQrcode");

            if (nossoNumero != null) autoriza.setNossonumero(nossoNumero);
            if (nossoNumero != null) autoriza.setNossoNumero(nossoNumero);
            if (linhaDigitavel != null) autoriza.setLinhaDigitavel(linhaDigitavel);
            if (codigoBarras != null) autoriza.setCodigoBarras(codigoBarras);
            if (pixQrcode != null) autoriza.setPixQrcode(pixQrcode);

            Object respostaObj = resposta.get("resposta");
            autoriza.setServidorResposta(JsonUtils.toJson(respostaObj));
            autoriza.setSituacaoDescricao("EMITIDO");
            autoriza.setSucesso("OK");
            autoriza.setDataenvAut(LocalDateTime.now());
            autoriza.setEnviaAut("S");
            repository.save(autoriza);

            resultado.put("sucesso", true);
            resultado.put("mensagem", "Boleto emitido com sucesso");
            resultado.put("resposta", resposta);
        } catch (Exception e) {
            autoriza.setMsgAut(e.getMessage());
            autoriza.setSituacaoDescricao("ERRO EMISSAO");
            autoriza.setSucesso("ERRO");
            repository.save(autoriza);

            resultado.put("sucesso", false);
            resultado.put("mensagem", e.getMessage());
        }

        return resultado;
    }

    public Map<String, Object> enviarParaBanco(Long id) {
        Optional<Boleto> opt = repository.findById(id);
        if (!opt.isPresent()) {
            return erro("Registro nao encontrado: " + id);
        }

        Boleto autoriza = opt.get();
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", autoriza.getId());

        try {
            BancoIntegrationService banco = bancoFactory.get(autoriza.getBancoAut());
            Map<String, Object> resposta = banco.consultar(autoriza);

            if (Boolean.FALSE.equals(resposta.getOrDefault("sucesso", false))) {
                resultado.putAll(resposta);
                autoriza.setMsgAut((String) resposta.get("mensagem"));
                autoriza.setSucesso("ERRO");
                repository.save(autoriza);
                return resultado;
            }

            Object respostaObj = resposta.get("resposta");
            autoriza.setServidorResposta(JsonUtils.toJson(respostaObj));
            autoriza.setSituacaoDescricao((String) resposta.get("situacao"));
            autoriza.setSucesso("OK");
            autoriza.setDataenvAut(LocalDateTime.now());
            repository.save(autoriza);

            resultado.put("sucesso", true);
            resultado.put("mensagem", "Consulta realizada com sucesso");
            resultado.put("resposta", resposta);
        } catch (Exception e) {
            autoriza.setMsgAut(e.getMessage());
            autoriza.setSituacaoDescricao("ERRO CONSULTA");
            autoriza.setSucesso("ERRO");
            repository.save(autoriza);

            resultado.put("sucesso", false);
            resultado.put("mensagem", e.getMessage());
        }

        return resultado;
    }

    public Map<String, Object> baixarBanco(Long id) {
        Optional<Boleto> opt = repository.findById(id);
        if (!opt.isPresent()) {
            return erro("Registro nao encontrado: " + id);
        }

        Boleto autoriza = opt.get();
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", autoriza.getId());

        try {
            BancoIntegrationService banco = bancoFactory.get(autoriza.getBancoAut());
            Map<String, Object> resposta = banco.baixar(autoriza);

            if (Boolean.FALSE.equals(resposta.getOrDefault("sucesso", false))) {
                resultado.putAll(resposta);
                autoriza.setMsgAut((String) resposta.get("mensagem"));
                autoriza.setSucesso("ERRO");
                repository.save(autoriza);
                return resultado;
            }

            Object respostaObj = resposta.get("resposta");
            autoriza.setServidorResposta(JsonUtils.toJson(respostaObj));
            autoriza.setSituacaoDescricao("BAIXADO");
            autoriza.setSucesso("OK");
            autoriza.setDataenvAut(LocalDateTime.now());
            repository.save(autoriza);

            resultado.put("sucesso", true);
            resultado.put("mensagem", "Boleto baixado com sucesso");
            resultado.put("resposta", resposta);
        } catch (Exception e) {
            autoriza.setMsgAut(e.getMessage());
            autoriza.setSituacaoDescricao("ERRO BAIXA");
            autoriza.setSucesso("ERRO");
            repository.save(autoriza);

            resultado.put("sucesso", false);
            resultado.put("mensagem", e.getMessage());
        }

        return resultado;
    }

    protected Map<String, Object> erro(String msg) {
        Map<String, Object> erro = new LinkedHashMap<>();
        erro.put("sucesso", false);
        erro.put("mensagem", msg);
        return erro;
    }
}
