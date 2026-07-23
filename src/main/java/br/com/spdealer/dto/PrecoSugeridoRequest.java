package br.com.spdealer.dto;

import java.math.BigDecimal;

public class PrecoSugeridoRequest {
    private String fab;
    private String codigo;
    private BigDecimal precoInformado;
    private String ufDestino;
    private Integer deposito;

    public String getFab() { return fab; }
    public void setFab(String fab) { this.fab = fab; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public BigDecimal getPrecoInformado() { return precoInformado; }
    public void setPrecoInformado(BigDecimal precoInformado) { this.precoInformado = precoInformado; }
    public String getUfDestino() { return ufDestino; }
    public void setUfDestino(String ufDestino) { this.ufDestino = ufDestino; }
    public Integer getDeposito() { return deposito; }
    public void setDeposito(Integer deposito) { this.deposito = deposito; }
}
