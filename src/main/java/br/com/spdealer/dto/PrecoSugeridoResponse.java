package br.com.spdealer.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class PrecoSugeridoResponse {
    private boolean success;
    private String mensagem;
    private BigDecimal precoSugerido;
    private BigDecimal precoInformado;
    private BigDecimal diferenca;
    private boolean abaixo;
    private BigDecimal margemAplicada;
    private BigDecimal precoCusto;
    private String origemMargem;
    private String tipoPreco;
    private String ufDestino;
    private BigDecimal acrescimoUF;
    private List<String> detalhes;

    public PrecoSugeridoResponse() {
        this.detalhes = new ArrayList<>();
        this.success = true;
        this.precoSugerido = BigDecimal.ZERO;
        this.precoInformado = BigDecimal.ZERO;
        this.diferenca = BigDecimal.ZERO;
        this.margemAplicada = BigDecimal.ZERO;
        this.precoCusto = BigDecimal.ZERO;
        this.acrescimoUF = BigDecimal.ZERO;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }
    public BigDecimal getPrecoSugerido() { return precoSugerido; }
    public void setPrecoSugerido(BigDecimal precoSugerido) { this.precoSugerido = precoSugerido; }
    public BigDecimal getPrecoInformado() { return precoInformado; }
    public void setPrecoInformado(BigDecimal precoInformado) { this.precoInformado = precoInformado; }
    public BigDecimal getDiferenca() { return diferenca; }
    public void setDiferenca(BigDecimal diferenca) { this.diferenca = diferenca; }
    public boolean isAbaixo() { return abaixo; }
    public void setAbaixo(boolean abaixo) { this.abaixo = abaixo; }
    public BigDecimal getMargemAplicada() { return margemAplicada; }
    public void setMargemAplicada(BigDecimal margemAplicada) { this.margemAplicada = margemAplicada; }
    public BigDecimal getPrecoCusto() { return precoCusto; }
    public void setPrecoCusto(BigDecimal precoCusto) { this.precoCusto = precoCusto; }
    public String getOrigemMargem() { return origemMargem; }
    public void setOrigemMargem(String origemMargem) { this.origemMargem = origemMargem; }
    public String getTipoPreco() { return tipoPreco; }
    public void setTipoPreco(String tipoPreco) { this.tipoPreco = tipoPreco; }
    public String getUfDestino() { return ufDestino; }
    public void setUfDestino(String ufDestino) { this.ufDestino = ufDestino; }
    public BigDecimal getAcrescimoUF() { return acrescimoUF; }
    public void setAcrescimoUF(BigDecimal acrescimoUF) { this.acrescimoUF = acrescimoUF; }
    public List<String> getDetalhes() { return detalhes; }
    public void setDetalhes(List<String> detalhes) { this.detalhes = detalhes; }
    public void addDetalhe(String detalhe) { this.detalhes.add(detalhe); }
}
