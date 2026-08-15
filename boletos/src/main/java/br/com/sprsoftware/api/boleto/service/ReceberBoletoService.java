package br.com.sprsoftware.api.boleto.service;

import br.com.seprocom.api.utils.JsonUtils;
import br.com.sprsoftware.api.boleto.model.Boleto;
import br.com.sprsoftware.api.boleto.model.ContaReceberDado;
import br.com.sprsoftware.api.boleto.repository.BoletoRepository;
import br.com.sprsoftware.api.boleto.repository.ReceberContaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReceberBoletoService {

    @Autowired
    private ReceberContaRepository contaRepository;

    @Autowired
    private BoletoRepository boletoRepository;

    @Autowired
    private BancoServiceFactory bancoFactory;

    public Map<String, Object> listar(String banco, LocalDate inicio, LocalDate fim, int page, int size) {
        List<ContaReceberDado> content = contaRepository.listar(banco, inicio, fim, page, size);
        long total = contaRepository.contar(banco, inicio, fim);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", total);
        response.put("totalPages", size > 0 ? (total + size - 1) / size : 0);
        response.put("currentPage", page);
        response.put("pageSize", size);
        return response;
    }

    public Map<String, Object> buscar(Long receberId) {
        Optional<ContaReceberDado> opt = contaRepository.buscarPorId(receberId);
        Map<String, Object> response = new LinkedHashMap<>();
        if (opt.isEmpty()) {
            response.put("sucesso", false);
            response.put("mensagem", "Conta a receber nao encontrada: " + receberId);
            return response;
        }
        ContaReceberDado conta = opt.get();
        response.put("sucesso", true);
        response.put("conta", conta);
        Map<String, Object> boletoInfo = buscarBoletoInfo(conta);
        if (boletoInfo != null) {
            response.put("boleto", boletoInfo);
        }
        return response;
    }

    public Map<String, Object> emitirBanco(Long receberId) {
        Optional<ContaReceberDado> opt = contaRepository.buscarPorId(receberId);
        if (opt.isEmpty()) {
            return erro("Conta a receber nao encontrada: " + receberId);
        }
        ContaReceberDado conta = opt.get();
        if (conta.banco() == null || conta.banco().trim().isEmpty()) {
            return erro("Conta a receber " + receberId + " sem banco informado (banco_rec vazio)");
        }
        if (!BancoServiceFactory.isBancoSuportado(conta.banco().trim())) {
            return erro("Banco nao suportado: " + conta.banco().trim()
                    + " (bancos suportados: " + BancoServiceFactory.getBancosSuportados().keySet() + ")");
        }
        if (conta.valorSaldo() == null || conta.valorSaldo().signum() <= 0) {
            return erro("Conta a receber " + receberId + " sem saldo em aberto (vlrsal_rec <= 0)");
        }

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", receberId);
        resultado.put("receberId", receberId);

        try {
            Boleto boleto = obterOuCriarBoleto(conta);
            resultado.put("boletoId", boleto.getId());

            BancoIntegrationService banco = bancoFactory.get(conta.banco().trim());
            Map<String, Object> resposta = banco.emitir(boleto);

            if (Boolean.FALSE.equals(resposta.getOrDefault("sucesso", false))) {
                boleto.setMsgAut((String) resposta.get("mensagem"));
                boleto.setSituacaoDescricao("ERRO EMISSAO");
                boleto.setSucesso("ERRO");
                boleto.setDataenvAut(LocalDateTime.now());
                boletoRepository.save(boleto);

                resultado.put("sucesso", false);
                resultado.put("mensagem", resposta.get("mensagem") != null
                        ? resposta.get("mensagem") : "Erro na emissao do boleto");
                return resultado;
            }

            String nossoNumero = (String) resposta.get("nossoNumero");
            String linhaDigitavel = (String) resposta.get("linhaDigitavel");
            String codigoBarras = (String) resposta.get("codigoBarras");
            String pixQrcode = (String) resposta.get("pixQrcode");

            if (nossoNumero != null) {
                boleto.setNossonumero(nossoNumero);
                boleto.setNossoNumero(nossoNumero);
                contaRepository.atualizarNossoNumero(receberId, nossoNumero);
            }
            if (linhaDigitavel != null) {
                boleto.setLinhaDigitavel(linhaDigitavel);
            }
            if (codigoBarras != null) {
                boleto.setCodigoBarras(codigoBarras);
            }
            if (pixQrcode != null) {
                boleto.setPixQrcode(pixQrcode);
            }
            boleto.setServidorResposta(JsonUtils.toJson(resposta.get("resposta")));
            boleto.setSituacaoDescricao("EMITIDO");
            boleto.setSucesso("OK");
            boleto.setDataenvAut(LocalDateTime.now());
            boleto.setEnviaAut("S");
            boletoRepository.save(boleto);

            resultado.put("sucesso", true);
            resultado.put("mensagem", "Boleto emitido com sucesso");
            resultado.put("nossoNumero", nossoNumero);
            resultado.put("linhaDigitavel", linhaDigitavel);
            resultado.put("codigoBarras", codigoBarras);
            resultado.put("pixQrcode", pixQrcode);
            resultado.put("resposta", resposta);
        } catch (Exception e) {
            resultado.put("sucesso", false);
            resultado.put("mensagem", e.getMessage());
            marcarErro(receberId, e.getMessage(), "ERRO EMISSAO");
        }
        return resultado;
    }

    public Map<String, Object> enviarParaBanco(Long receberId) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", receberId);
        resultado.put("receberId", receberId);

        Optional<Boleto> opt = buscarBoletoVinculado(receberId);
        if (opt.isEmpty()) {
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Boleto nao emitido para a conta a receber " + receberId);
            return resultado;
        }
        Boleto boleto = opt.get();
        if (!temBanco(boleto)) {
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Banco nao informado no registro");
            return resultado;
        }
        if (!temNossoNumero(boleto)) {
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Nosso numero nao encontrado no registro");
            return resultado;
        }

        try {
            BancoIntegrationService banco = bancoFactory.get(boleto.getBancoAut());
            Map<String, Object> resposta = banco.consultar(boleto);

            if (Boolean.FALSE.equals(resposta.getOrDefault("sucesso", false))) {
                boleto.setMsgAut((String) resposta.get("mensagem"));
                boleto.setSucesso("ERRO");
                boleto.setDataenvAut(LocalDateTime.now());
                boletoRepository.save(boleto);

                resultado.put("sucesso", false);
                resultado.put("mensagem", resposta.get("mensagem") != null
                        ? resposta.get("mensagem") : "Erro na consulta do boleto");
                return resultado;
            }

            boleto.setServidorResposta(JsonUtils.toJson(resposta.get("resposta")));
            boleto.setSituacaoDescricao((String) resposta.get("situacao"));
            boleto.setSucesso("OK");
            boleto.setDataenvAut(LocalDateTime.now());
            boletoRepository.save(boleto);

            resultado.put("sucesso", true);
            resultado.put("mensagem", "Consulta realizada com sucesso");
            resultado.put("situacao", resposta.get("situacao"));
            resultado.put("resposta", resposta);
        } catch (Exception e) {
            boleto.setMsgAut(e.getMessage());
            boleto.setSituacaoDescricao("ERRO CONSULTA");
            boleto.setSucesso("ERRO");
            boletoRepository.save(boleto);

            resultado.put("sucesso", false);
            resultado.put("mensagem", e.getMessage());
        }
        return resultado;
    }

    public Map<String, Object> baixarBanco(Long receberId) {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("id", receberId);
        resultado.put("receberId", receberId);

        Optional<Boleto> opt = buscarBoletoVinculado(receberId);
        if (opt.isEmpty()) {
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Boleto nao emitido para a conta a receber " + receberId);
            return resultado;
        }
        Boleto boleto = opt.get();
        if (!temNossoNumero(boleto)) {
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Nosso numero nao encontrado no registro");
            return resultado;
        }

        try {
            BancoIntegrationService banco = bancoFactory.get(boleto.getBancoAut());
            Map<String, Object> resposta = banco.baixar(boleto);

            if (Boolean.FALSE.equals(resposta.getOrDefault("sucesso", false))) {
                boleto.setMsgAut((String) resposta.get("mensagem"));
                boleto.setSucesso("ERRO");
                boleto.setDataenvAut(LocalDateTime.now());
                boletoRepository.save(boleto);

                resultado.put("sucesso", false);
                resultado.put("mensagem", resposta.get("mensagem") != null
                        ? resposta.get("mensagem") : "Erro na baixa do boleto");
                return resultado;
            }

            boleto.setServidorResposta(JsonUtils.toJson(resposta.get("resposta")));
            boleto.setSituacaoDescricao("BAIXADO");
            boleto.setSucesso("OK");
            boleto.setDataenvAut(LocalDateTime.now());
            boletoRepository.save(boleto);

            resultado.put("sucesso", true);
            resultado.put("mensagem", "Boleto baixado com sucesso");
            resultado.put("resposta", resposta);
        } catch (Exception e) {
            boleto.setMsgAut(e.getMessage());
            boleto.setSituacaoDescricao("ERRO BAIXA");
            boleto.setSucesso("ERRO");
            boletoRepository.save(boleto);

            resultado.put("sucesso", false);
            resultado.put("mensagem", e.getMessage());
        }
        return resultado;
    }

    public Map<String, Object> obterStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", contaRepository.contar(null, null, null));
        stats.put("abertas", contaRepository.contarAbertas());
        stats.put("comBoleto", contaRepository.contarComBoleto());
        stats.put("saldoAberto", contaRepository.somarSaldoAberto());
        return stats;
    }

    private Boleto obterOuCriarBoleto(ContaReceberDado conta) {
        Long boletoId = null;
        if (conta.codigoBol() != null && !conta.codigoBol().trim().isEmpty()) {
            try {
                boletoId = Long.valueOf(conta.codigoBol().trim());
            } catch (NumberFormatException ignored) {
            }
        }
        Boleto boleto = boletoId != null ? boletoRepository.findById(boletoId).orElse(null) : null;
        boolean novo = boleto == null;
        if (novo) {
            boleto = new Boleto();
        }
        preencherDadosTitulo(boleto, conta);
        boleto = boletoRepository.save(boleto);
        if (novo) {
            contaRepository.atualizarCodigoBol(conta.receberId(), boleto.getId());
        }
        return boleto;
    }

    private void preencherDadosTitulo(Boleto boleto, ContaReceberDado conta) {
        boleto.setTipoAut("B");
        boleto.setNumapo1Aut(conta.nomePagador() != null && !conta.nomePagador().trim().isEmpty()
                ? conta.nomePagador() : "PAGADOR NAO INFORMADO");
        boleto.setNumapo2Aut(conta.enderecoPagador());
        boleto.setControleAut(conta.cgccpf());
        boleto.setDataautAut(conta.dtEmissao() != null ? conta.dtEmissao() : LocalDate.now());
        boleto.setVencimentoAut(conta.dtVencimento());
        boleto.setPagoAut(conta.dtPagamento());
        boleto.setValorcanAut(conta.valorSaldo() != null ? conta.valorSaldo() : BigDecimal.ZERO);
        boleto.setBancoAut(conta.banco() != null ? conta.banco().trim() : null);
        boleto.setNroDocumentoBol(conta.numdup() != null ? conta.numdup() : String.valueOf(conta.receberId()));
        boleto.setEmpresaGer(conta.filial() != null ? conta.filial() : "000");
        boleto.setBairroSacadoBol(conta.bairroPagador());
        boleto.setCidadeSacadoBol(conta.cidadePagador());
        boleto.setUfSacadoBol(conta.ufPagador());
        boleto.setCepSacadoBol(conta.cepPagador());
        boleto.setCelularAut(conta.celularPagador() != null && !conta.celularPagador().trim().isEmpty()
                ? conta.celularPagador() : conta.telefonePagador());
        if (conta.nossoNumero() != null && !conta.nossoNumero().trim().isEmpty()) {
            boleto.setNossonumero(conta.nossoNumero().trim());
            boleto.setNossoNumero(conta.nossoNumero().trim());
        }
    }

    private Optional<Boleto> buscarBoletoVinculado(Long receberId) {
        Optional<ContaReceberDado> opt = contaRepository.buscarPorId(receberId);
        if (opt.isEmpty()) {
            return Optional.empty();
        }
        ContaReceberDado conta = opt.get();
        if (conta.codigoBol() == null || conta.codigoBol().trim().isEmpty()) {
            return Optional.empty();
        }
        try {
            return boletoRepository.findById(Long.valueOf(conta.codigoBol().trim()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private Map<String, Object> buscarBoletoInfo(ContaReceberDado conta) {
        if (conta.codigoBol() == null || conta.codigoBol().trim().isEmpty()) {
            return null;
        }
        Optional<Boleto> opt;
        try {
            opt = boletoRepository.findById(Long.valueOf(conta.codigoBol().trim()));
        } catch (NumberFormatException e) {
            return null;
        }
        if (opt.isEmpty()) {
            return null;
        }
        Boleto b = opt.get();
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", b.getId());
        info.put("nossoNumero", b.getNossonumero() != null ? b.getNossonumero() : b.getNossoNumero());
        info.put("linhaDigitavel", b.getLinhaDigitavel());
        info.put("codigoBarras", b.getCodigoBarras());
        info.put("pixQrcode", b.getPixQrcode());
        info.put("situacao", b.getSituacaoDescricao());
        info.put("sucesso", b.getSucesso());
        info.put("mensagem", b.getMsgAut());
        info.put("dataEnvio", b.getDataenvAut());
        return info;
    }

    private void marcarErro(Long receberId, String mensagem, String situacao) {
        try {
            buscarBoletoVinculado(receberId).ifPresent(boleto -> {
                boleto.setMsgAut(mensagem);
                boleto.setSituacaoDescricao(situacao);
                boleto.setSucesso("ERRO");
                boleto.setDataenvAut(LocalDateTime.now());
                boletoRepository.save(boleto);
            });
        } catch (Exception ignored) {
        }
    }

    private boolean temNossoNumero(Boleto boleto) {
        String nn = boleto.getNossonumero();
        if (nn == null || nn.trim().isEmpty()) {
            nn = boleto.getNossoNumero();
        }
        return nn != null && !nn.trim().isEmpty();
    }

    private boolean temBanco(Boleto boleto) {
        return boleto.getBancoAut() != null && !boleto.getBancoAut().trim().isEmpty();
    }

    private Map<String, Object> erro(String msg) {
        Map<String, Object> erro = new LinkedHashMap<>();
        erro.put("sucesso", false);
        erro.put("mensagem", msg);
        return erro;
    }
}
