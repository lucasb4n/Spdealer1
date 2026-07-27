package br.com.sprsoftware.api.boleto.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "boletos")
public class Boleto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tipo_aut")
    private String tipoAut;

    @Column(name = "numapo1_aut")
    private String numapo1Aut;

    @Column(name = "numapo2_aut")
    private String numapo2Aut;

    @Column(name = "controle_aut")
    private String controleAut;

    @Column(name = "dataaut_aut")
    private LocalDate dataautAut;

    @Column(name = "vencimento_aut")
    private LocalDate vencimentoAut;

    @Column(name = "pago_aut")
    private LocalDate pagoAut;

    @Column(name = "valorcan_aut")
    private BigDecimal valorcanAut;

    @Column(name = "dataenv_aut")
    private LocalDateTime dataenvAut;

    @Column(name = "banco_aut")
    private String bancoAut;

    @Column(name = "codapi_aut")
    private String codapiAut;

    @Column(name = "codbol_aut")
    private String codbolAut;

    @Column(name = "msg_aut", length = 500)
    private String msgAut;

    @Column(name = "envia_aut")
    private String enviaAut;

    @Column(name = "celular_aut")
    private String celularAut;

    @Column(name = "alterado_aut")
    private String alteradoAut;

    @Column(name = "API_DATA_COMPILACAO")
    private String apiDataCompilacao;

    @Column(name = "API_VERSAO")
    private String apiVersao;

    @Column(name = "ARQUIVO_PDF")
    private String arquivoPdf;

    @Column(name = "CAMPO_LIVRE")
    private String campoLivre;

    @Column(name = "CODIGO_BARRAS")
    private String codigoBarras;

    @Column(name = "LINHA_DIGITAVEL")
    private String linhaDigitavel;

    @Column(name = "NOSSO_NUMERO")
    private String nossoNumero;

    @Column(name = "NOSSO_NUMERO_COMPLETO")
    private String nossoNumeroCompleto;

    @Column(name = "NOSSO_NUMERO_DV")
    private String nossoNumeroDv;

    @Column(name = "SERVIDOR_RESPOSTA", length = 10000)
    private String servidorResposta;

    @Column(name = "PIX_QRCODE")
    private String pixQrcode;

    @Column(name = "PIX_TXID")
    private String pixTxid;

    @Column(name = "REQUISICAO")
    private String requisicao;

    @Column(name = "REQUISICAO_URL")
    private String requisicaoUrl;

    @Column(name = "HTTPS_STATUS_CODE")
    private String httpsStatusCode;

    @Column(name = "txid")
    private String txid;

    @Column(name = "cooperativa")
    private String cooperativa;

    @Column(name = "posto")
    private String posto;

    @Column(name = "nossonumero")
    private String nossonumero;

    @Column(name = "Intimacert")
    private String intimacert;

    @Column(name = "Intimaint")
    private String intimaint;

    @Column(name = "SITUACAO_DESCRICAO")
    private String situacaoDescricao;

    @Column(name = "SUCESSO")
    private String sucesso;

    @Column(name = "CANCELADO")
    private String cancelado;

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTipoAut() { return tipoAut; }
    public void setTipoAut(String tipoAut) { this.tipoAut = tipoAut; }

    public String getNumapo1Aut() { return numapo1Aut; }
    public void setNumapo1Aut(String numapo1Aut) { this.numapo1Aut = numapo1Aut; }

    public String getNumapo2Aut() { return numapo2Aut; }
    public void setNumapo2Aut(String numapo2Aut) { this.numapo2Aut = numapo2Aut; }

    public String getControleAut() { return controleAut; }
    public void setControleAut(String controleAut) { this.controleAut = controleAut; }

    public LocalDate getDataautAut() { return dataautAut; }
    public void setDataautAut(LocalDate dataautAut) { this.dataautAut = dataautAut; }

    public LocalDate getVencimentoAut() { return vencimentoAut; }
    public void setVencimentoAut(LocalDate vencimentoAut) { this.vencimentoAut = vencimentoAut; }

    public LocalDate getPagoAut() { return pagoAut; }
    public void setPagoAut(LocalDate pagoAut) { this.pagoAut = pagoAut; }

    public BigDecimal getValorcanAut() { return valorcanAut; }
    public void setValorcanAut(BigDecimal valorcanAut) { this.valorcanAut = valorcanAut; }

    public LocalDateTime getDataenvAut() { return dataenvAut; }
    public void setDataenvAut(LocalDateTime dataenvAut) { this.dataenvAut = dataenvAut; }

    public String getBancoAut() { return bancoAut; }
    public void setBancoAut(String bancoAut) { this.bancoAut = bancoAut; }

    public String getCodapiAut() { return codapiAut; }
    public void setCodapiAut(String codapiAut) { this.codapiAut = codapiAut; }

    public String getCodbolAut() { return codbolAut; }
    public void setCodbolAut(String codbolAut) { this.codbolAut = codbolAut; }

    public String getMsgAut() { return msgAut; }
    public void setMsgAut(String msgAut) { this.msgAut = msgAut; }

    public String getEnviaAut() { return enviaAut; }
    public void setEnviaAut(String enviaAut) { this.enviaAut = enviaAut; }

    public String getCelularAut() { return celularAut; }
    public void setCelularAut(String celularAut) { this.celularAut = celularAut; }

    public String getAlteradoAut() { return alteradoAut; }
    public void setAlteradoAut(String alteradoAut) { this.alteradoAut = alteradoAut; }

    public String getApiDataCompilacao() { return apiDataCompilacao; }
    public void setApiDataCompilacao(String apiDataCompilacao) { this.apiDataCompilacao = apiDataCompilacao; }

    public String getApiVersao() { return apiVersao; }
    public void setApiVersao(String apiVersao) { this.apiVersao = apiVersao; }

    public String getArquivoPdf() { return arquivoPdf; }
    public void setArquivoPdf(String arquivoPdf) { this.arquivoPdf = arquivoPdf; }

    public String getCampoLivre() { return campoLivre; }
    public void setCampoLivre(String campoLivre) { this.campoLivre = campoLivre; }

    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }

    public String getLinhaDigitavel() { return linhaDigitavel; }
    public void setLinhaDigitavel(String linhaDigitavel) { this.linhaDigitavel = linhaDigitavel; }

    public String getNossoNumero() { return nossoNumero; }
    public void setNossoNumero(String nossoNumero) { this.nossoNumero = nossoNumero; }

    public String getNossoNumeroCompleto() { return nossoNumeroCompleto; }
    public void setNossoNumeroCompleto(String nossoNumeroCompleto) { this.nossoNumeroCompleto = nossoNumeroCompleto; }

    public String getNossoNumeroDv() { return nossoNumeroDv; }
    public void setNossoNumeroDv(String nossoNumeroDv) { this.nossoNumeroDv = nossoNumeroDv; }

    public String getServidorResposta() { return servidorResposta; }
    public void setServidorResposta(String servidorResposta) { this.servidorResposta = servidorResposta; }

    public String getPixQrcode() { return pixQrcode; }
    public void setPixQrcode(String pixQrcode) { this.pixQrcode = pixQrcode; }

    public String getPixTxid() { return pixTxid; }
    public void setPixTxid(String pixTxid) { this.pixTxid = pixTxid; }

    public String getRequisicao() { return requisicao; }
    public void setRequisicao(String requisicao) { this.requisicao = requisicao; }

    public String getRequisicaoUrl() { return requisicaoUrl; }
    public void setRequisicaoUrl(String requisicaoUrl) { this.requisicaoUrl = requisicaoUrl; }

    public String getHttpsStatusCode() { return httpsStatusCode; }
    public void setHttpsStatusCode(String httpsStatusCode) { this.httpsStatusCode = httpsStatusCode; }

    public String getTxid() { return txid; }
    public void setTxid(String txid) { this.txid = txid; }

    public String getCooperativa() { return cooperativa; }
    public void setCooperativa(String cooperativa) { this.cooperativa = cooperativa; }

    public String getPosto() { return posto; }
    public void setPosto(String posto) { this.posto = posto; }

    public String getNossonumero() { return nossonumero; }
    public void setNossonumero(String nossonumero) { this.nossonumero = nossonumero; }

    public String getIntimacert() { return intimacert; }
    public void setIntimacert(String intimacert) { this.intimacert = intimacert; }

    public String getIntimaint() { return intimaint; }
    public void setIntimaint(String intimaint) { this.intimaint = intimaint; }

    public String getSituacaoDescricao() { return situacaoDescricao; }
    public void setSituacaoDescricao(String situacaoDescricao) { this.situacaoDescricao = situacaoDescricao; }

    public String getSucesso() { return sucesso; }
    public void setSucesso(String sucesso) { this.sucesso = sucesso; }

    public String getCancelado() { return cancelado; }
    public void setCancelado(String cancelado) { this.cancelado = cancelado; }

}
