package br.com.sprsoftware.api.boleto.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "boleto")
public class Boleto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "codigo_bol")
    private Long id;

    @Column(name = "empresa_ger", length = 3)
    private String empresaGer;

    @Column(name = "codigo_bco", length = 3)
    private String bancoAut;

    @Column(name = "codigo_ccte")
    private Long codigoCcte;

    @Column(name = "codigo_remc")
    private Long codigoRemc = 0L;

    @Column(name = "codigo_retc")
    private Long codigoRetc = 0L;

    @Column(name = "nro_documento_bol", length = 20)
    private String nroDocumentoBol;

    @Column(name = "nosso_numero_bol", length = 20)
    private String nossoNumero;

    @Column(name = "nosso_numero_dv_bol", length = 1)
    private String nossoNumeroDv;

    @Column(name = "dt_processamento_bol")
    private LocalDate dataautAut;

    @Column(name = "dt_vencimento_bol")
    private LocalDate vencimentoAut;

    @Column(name = "dt_pagamento_bol")
    private LocalDate pagoAut;

    @Column(name = "dt_desconto_bol")
    private LocalDate dtDescontoBol;

    @Column(name = "vlr_boleto_bol")
    private BigDecimal valorcanAut;

    @Column(name = "vlr_tarifa_bol")
    private BigDecimal vlrTarifaBol = BigDecimal.ZERO;

    @Column(name = "vlr_recebido_bol")
    private BigDecimal vlrRecebidoBol = BigDecimal.ZERO;

    @Column(name = "vlr_juros_bol")
    private BigDecimal vlrJurosBol = BigDecimal.ZERO;

    @Column(name = "vlr_multa_bol")
    private BigDecimal vlrMultaBol = BigDecimal.ZERO;

    @Column(name = "vlr_desconto_bol")
    private BigDecimal vlrDescontoBol = BigDecimal.ZERO;

    @Column(name = "linha_digitavel_bol", length = 60)
    private String linhaDigitavel;

    @Column(name = "codigo_barra_bol", length = 50)
    private String codigoBarras;

    @Column(name = "codigo_barra_dv_bol", length = 1)
    private String codigoBarraDvBol;

    @Column(name = "campo_livre_bol", length = 40)
    private String campoLivre;

    @Column(name = "campo_livre_dv_bol", length = 1)
    private String campoLivreDvBol;

    @Column(name = "status_bol", length = 1)
    private String statusBol = "1";

    @Column(name = "instrucao_bol", length = 500)
    private String msgAut;

    @Column(name = "descricao_acrescimo_bol", length = 500)
    private String descricaoAcrescimoBol;

    @Column(name = "descricao_abatimento_bol", length = 500)
    private String descricaoAbatimentoBol;

    @Column(name = "referencia_bol", length = 15)
    private String referenciaBol;

    @Column(name = "selecionado_bol", length = 1)
    private String selecionadoBol = "N";

    @Column(name = "canal_liquidacao_bol", length = 3)
    private String canalLiquidacaoBol;

    @Column(name = "lote_retorno_bol", length = 50)
    private String loteRetornoBol;

    @Column(name = "tipo_pessoa_sacado_bol", length = 2)
    private String tipoPessoaSacadoBol;

    @Column(name = "cpf_sacado_bol", length = 20)
    private String controleAut;

    @Column(name = "nome_sacado_bol", length = 60)
    private String numapo1Aut;

    @Column(name = "endereco_sacado_bol", length = 100)
    private String numapo2Aut;

    @Column(name = "bairro_sacado_bol", length = 50)
    private String bairroSacadoBol;

    @Column(name = "cep_sacado_bol", length = 10)
    private String cepSacadoBol;

    @Column(name = "cidade_sacado_bol", length = 40)
    private String cidadeSacadoBol;

    @Column(name = "uf_sacado_bol", length = 2)
    private String ufSacadoBol;

    @Column(name = "ativo_bol", length = 1)
    private String ativoBol;

    @Column(name = "lote_remessa_bol")
    private Long loteRemessaBol;

    @Column(name = "instrucao_protesto_bol", length = 100)
    private String instrucaoProtestoBol;

    @Column(name = "dias_protesto_bol", length = 3)
    private String diasProtestoBol;

    @Column(name = "apistatus_bol", length = 15)
    private String situacaoDescricao;

    // Transient fields for compatibility
    @Transient
    private String tipoAut = "B";

    @Transient
    private String arquivoPdf;

    public String getArquivoPdf() { return arquivoPdf; }
    public void setArquivoPdf(String arquivoPdf) { this.arquivoPdf = arquivoPdf; }

    @Transient
    private String codapiAut;

    @Transient
    private String codbolAut;

    @Transient
    private String enviaAut;

    @Transient
    private String celularAut;

    @Transient
    private String alteradoAut;

    @Transient
    private String servidorResposta;

    @Transient
    private String pixQrcode;

    @Transient
    private String pixTxid;

    @Transient
    private String sucesso;

    @Transient
    private LocalDateTime dataenvAut;

    // Getters and Setters with safe length truncation
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmpresaGer() { return empresaGer; }
    public void setEmpresaGer(String empresaGer) {
        this.empresaGer = empresaGer != null && empresaGer.length() > 3 ? empresaGer.substring(0, 3) : empresaGer;
    }

    public String getBancoAut() { return bancoAut; }
    public void setBancoAut(String bancoAut) {
        this.bancoAut = bancoAut != null && bancoAut.length() > 3 ? bancoAut.substring(0, 3) : bancoAut;
    }

    public Long getCodigoCcte() { return codigoCcte; }
    public void setCodigoCcte(Long codigoCcte) { this.codigoCcte = codigoCcte; }

    public Long getCodigoRemc() { return codigoRemc; }
    public void setCodigoRemc(Long codigoRemc) { this.codigoRemc = codigoRemc; }

    public Long getCodigoRetc() { return codigoRetc; }
    public void setCodigoRetc(Long codigoRetc) { this.codigoRetc = codigoRetc; }

    public String getNroDocumentoBol() { return nroDocumentoBol; }
    public void setNroDocumentoBol(String nroDocumentoBol) {
        this.nroDocumentoBol = nroDocumentoBol != null && nroDocumentoBol.length() > 20 ? nroDocumentoBol.substring(0, 20) : nroDocumentoBol;
    }

    public String getNossoNumero() { return nossoNumero; }
    public void setNossoNumero(String nossoNumero) {
        this.nossoNumero = nossoNumero != null && nossoNumero.length() > 20 ? nossoNumero.substring(0, 20) : nossoNumero;
    }

    public String getNossonumero() { return nossoNumero; }
    public void setNossonumero(String nossonumero) {
        setNossoNumero(nossonumero);
    }

    public String getNossoNumeroDv() { return nossoNumeroDv; }
    public void setNossoNumeroDv(String nossoNumeroDv) {
        this.nossoNumeroDv = nossoNumeroDv != null && nossoNumeroDv.length() > 1 ? nossoNumeroDv.substring(0, 1) : nossoNumeroDv;
    }

    public LocalDate getDataautAut() { return dataautAut; }
    public void setDataautAut(LocalDate dataautAut) { this.dataautAut = dataautAut; }

    public LocalDate getVencimentoAut() { return vencimentoAut; }
    public void setVencimentoAut(LocalDate vencimentoAut) { this.vencimentoAut = vencimentoAut; }

    public LocalDate getPagoAut() { return pagoAut; }
    public void setPagoAut(LocalDate pagoAut) { this.pagoAut = pagoAut; }

    public LocalDate getDtDescontoBol() { return dtDescontoBol; }
    public void setDtDescontoBol(LocalDate dtDescontoBol) { this.dtDescontoBol = dtDescontoBol; }

    public BigDecimal getValorcanAut() { return valorcanAut; }
    public void setValorcanAut(BigDecimal valorcanAut) { this.valorcanAut = valorcanAut; }

    public BigDecimal getVlrTarifaBol() { return vlrTarifaBol; }
    public void setVlrTarifaBol(BigDecimal vlrTarifaBol) { this.vlrTarifaBol = vlrTarifaBol; }

    public BigDecimal getVlrRecebidoBol() { return vlrRecebidoBol; }
    public void setVlrRecebidoBol(BigDecimal vlrRecebidoBol) { this.vlrRecebidoBol = vlrRecebidoBol; }

    public BigDecimal getVlrJurosBol() { return vlrJurosBol; }
    public void setVlrJurosBol(BigDecimal vlrJurosBol) { this.vlrJurosBol = vlrJurosBol; }

    public BigDecimal getVlrMultaBol() { return vlrMultaBol; }
    public void setVlrMultaBol(BigDecimal vlrMultaBol) { this.vlrMultaBol = vlrMultaBol; }

    public BigDecimal getVlrDescontoBol() { return vlrDescontoBol; }
    public void setVlrDescontoBol(BigDecimal vlrDescontoBol) { this.vlrDescontoBol = vlrDescontoBol; }

    public String getLinhaDigitavel() { return linhaDigitavel; }
    public void setLinhaDigitavel(String linhaDigitavel) {
        this.linhaDigitavel = linhaDigitavel != null && linhaDigitavel.length() > 60 ? linhaDigitavel.substring(0, 60) : linhaDigitavel;
    }

    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras != null && codigoBarras.length() > 50 ? codigoBarras.substring(0, 50) : codigoBarras;
    }

    public String getCodigoBarraDvBol() { return codigoBarraDvBol; }
    public void setCodigoBarraDvBol(String codigoBarraDvBol) {
        this.codigoBarraDvBol = codigoBarraDvBol != null && codigoBarraDvBol.length() > 1 ? codigoBarraDvBol.substring(0, 1) : codigoBarraDvBol;
    }

    public String getCampoLivre() { return campoLivre; }
    public void setCampoLivre(String campoLivre) {
        this.campoLivre = campoLivre != null && campoLivre.length() > 40 ? campoLivre.substring(0, 40) : campoLivre;
    }

    public String getCampoLivreDvBol() { return campoLivreDvBol; }
    public void setCampoLivreDvBol(String campoLivreDvBol) {
        this.campoLivreDvBol = campoLivreDvBol != null && campoLivreDvBol.length() > 1 ? campoLivreDvBol.substring(0, 1) : campoLivreDvBol;
    }

    public String getStatusBol() { return statusBol; }
    public void setStatusBol(String statusBol) { this.statusBol = statusBol; }

    public String getMsgAut() { return msgAut; }
    public void setMsgAut(String msgAut) {
        this.msgAut = msgAut != null && msgAut.length() > 500 ? msgAut.substring(0, 500) : msgAut;
    }

    public String getDescricaoAcrescimoBol() { return descricaoAcrescimoBol; }
    public void setDescricaoAcrescimoBol(String descricaoAcrescimoBol) {
        this.descricaoAcrescimoBol = descricaoAcrescimoBol != null && descricaoAcrescimoBol.length() > 500 ? descricaoAcrescimoBol.substring(0, 500) : descricaoAcrescimoBol;
    }

    public String getDescricaoAbatimentoBol() { return descricaoAbatimentoBol; }
    public void setDescricaoAbatimentoBol(String descricaoAbatimentoBol) {
        this.descricaoAbatimentoBol = descricaoAbatimentoBol != null && descricaoAbatimentoBol.length() > 500 ? descricaoAbatimentoBol.substring(0, 500) : descricaoAbatimentoBol;
    }

    public String getReferenciaBol() { return referenciaBol; }
    public void setReferenciaBol(String referenciaBol) {
        this.referenciaBol = referenciaBol != null && referenciaBol.length() > 15 ? referenciaBol.substring(0, 15) : referenciaBol;
    }

    public String getSelecionadoBol() { return selecionadoBol; }
    public void setSelecionadoBol(String selecionadoBol) { this.selecionadoBol = selecionadoBol; }

    public String getCanalLiquidacaoBol() { return canalLiquidacaoBol; }
    public void setCanalLiquidacaoBol(String canalLiquidacaoBol) {
        this.canalLiquidacaoBol = canalLiquidacaoBol != null && canalLiquidacaoBol.length() > 3 ? canalLiquidacaoBol.substring(0, 3) : canalLiquidacaoBol;
    }

    public String getLoteRetornoBol() { return loteRetornoBol; }
    public void setLoteRetornoBol(String loteRetornoBol) {
        this.loteRetornoBol = loteRetornoBol != null && loteRetornoBol.length() > 50 ? loteRetornoBol.substring(0, 50) : loteRetornoBol;
    }

    public String getTipoPessoaSacadoBol() { return tipoPessoaSacadoBol; }
    public void setTipoPessoaSacadoBol(String tipoPessoaSacadoBol) {
        this.tipoPessoaSacadoBol = tipoPessoaSacadoBol != null && tipoPessoaSacadoBol.length() > 2 ? tipoPessoaSacadoBol.substring(0, 2) : tipoPessoaSacadoBol;
    }

    public String getControleAut() { return controleAut; }
    public void setControleAut(String controleAut) {
        this.controleAut = controleAut != null && controleAut.length() > 20 ? controleAut.substring(0, 20) : controleAut;
    }

    public String getNumapo1Aut() { return numapo1Aut; }
    public void setNumapo1Aut(String numapo1Aut) {
        this.numapo1Aut = numapo1Aut != null && numapo1Aut.length() > 60 ? numapo1Aut.substring(0, 60) : numapo1Aut;
    }

    public String getNumapo2Aut() { return numapo2Aut; }
    public void setNumapo2Aut(String numapo2Aut) {
        this.numapo2Aut = numapo2Aut != null && numapo2Aut.length() > 100 ? numapo2Aut.substring(0, 100) : numapo2Aut;
    }

    public String getBairroSacadoBol() { return bairroSacadoBol; }
    public void setBairroSacadoBol(String bairroSacadoBol) {
        this.bairroSacadoBol = bairroSacadoBol != null && bairroSacadoBol.length() > 50 ? bairroSacadoBol.substring(0, 50) : bairroSacadoBol;
    }

    public String getCepSacadoBol() { return cepSacadoBol; }
    public void setCepSacadoBol(String cepSacadoBol) {
        this.cepSacadoBol = cepSacadoBol != null && cepSacadoBol.length() > 10 ? cepSacadoBol.substring(0, 10) : cepSacadoBol;
    }

    public String getCidadeSacadoBol() { return cidadeSacadoBol; }
    public void setCidadeSacadoBol(String cidadeSacadoBol) {
        this.cidadeSacadoBol = cidadeSacadoBol != null && cidadeSacadoBol.length() > 40 ? cidadeSacadoBol.substring(0, 40) : cidadeSacadoBol;
    }

    public String getUfSacadoBol() { return ufSacadoBol; }
    public void setUfSacadoBol(String ufSacadoBol) {
        this.ufSacadoBol = ufSacadoBol != null && ufSacadoBol.length() > 2 ? ufSacadoBol.substring(0, 2) : ufSacadoBol;
    }

    public String getAtivoBol() { return ativoBol; }
    public void setAtivoBol(String ativoBol) { this.ativoBol = ativoBol; }

    public Long getLoteRemessaBol() { return loteRemessaBol; }
    public void setLoteRemessaBol(Long loteRemessaBol) { this.loteRemessaBol = loteRemessaBol; }

    public String getInstrucaoProtestoBol() { return instrucaoProtestoBol; }
    public void setInstrucaoProtestoBol(String instrucaoProtestoBol) {
        this.instrucaoProtestoBol = instrucaoProtestoBol != null && instrucaoProtestoBol.length() > 100 ? instrucaoProtestoBol.substring(0, 100) : instrucaoProtestoBol;
    }

    public String getDiasProtestoBol() { return diasProtestoBol; }
    public void setDiasProtestoBol(String diasProtestoBol) {
        this.diasProtestoBol = diasProtestoBol != null && diasProtestoBol.length() > 3 ? diasProtestoBol.substring(0, 3) : diasProtestoBol;
    }

    public String getSituacaoDescricao() { return situacaoDescricao; }
    public void setSituacaoDescricao(String situacaoDescricao) {
        this.situacaoDescricao = situacaoDescricao != null && situacaoDescricao.length() > 15 ? situacaoDescricao.substring(0, 15) : situacaoDescricao;
    }

    public String getTipoAut() { return tipoAut; }
    public void setTipoAut(String tipoAut) { this.tipoAut = tipoAut; }

    public String getCodapiAut() { return codapiAut; }
    public void setCodapiAut(String codapiAut) { this.codapiAut = codapiAut; }

    public String getCodbolAut() { return codbolAut; }
    public void setCodbolAut(String codbolAut) { this.codbolAut = codbolAut; }

    public String getEnviaAut() { return enviaAut; }
    public void setEnviaAut(String enviaAut) { this.enviaAut = enviaAut; }

    public String getCelularAut() { return celularAut; }
    public void setCelularAut(String celularAut) { this.celularAut = celularAut; }

    public String getAlteradoAut() { return alteradoAut; }
    public void setAlteradoAut(String alteradoAut) { this.alteradoAut = alteradoAut; }

    public String getServidorResposta() { return servidorResposta; }
    public void setServidorResposta(String servidorResposta) { this.servidorResposta = servidorResposta; }

    public String getPixQrcode() { return pixQrcode; }
    public void setPixQrcode(String pixQrcode) { this.pixQrcode = pixQrcode; }

    public String getPixTxid() { return pixTxid; }
    public void setPixTxid(String pixTxid) { this.pixTxid = pixTxid; }

    public String getSucesso() { return sucesso; }
    public void setSucesso(String sucesso) { this.sucesso = sucesso; }

    public LocalDateTime getDataenvAut() { return dataenvAut; }
    public void setDataenvAut(LocalDateTime dataenvAut) { this.dataenvAut = dataenvAut; }
}
