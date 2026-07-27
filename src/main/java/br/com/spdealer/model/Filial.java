package br.com.spdealer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "masfil")
public class Filial {
    
    // Empresa mestre (sempre '001')
    private static final String EMPRESA_GER_FIXO = "001";
    
    @Id
    @Column(name = "codigo_fil")
    private String codigoFil;
    
    @Column(name = "nome_fil")
    private String nomeFil;
    
    @Column(name = "nomeabr_fil")
    private String nomeabrFil;
    
    @Column(name = "endereco_fil")
    private String enderecoFil;
    
    @Column(name = "numero_fil")
    private String numeroFil;
    
    @Column(name = "fone_fil")
    private String foneFil;
    
    @Column(name = "cnpj_fil")
    private String cnpjFil;

    public String getCodigoFil() {
        return codigoFil;
    }

    public void setCodigoFil(String codigoFil) {
        this.codigoFil = codigoFil;
    }

    public String getEmpresaGer() {
        return EMPRESA_GER_FIXO;
    }

    public String getNomeFil() {
        return nomeFil;
    }

    public void setNomeFil(String nomeFil) {
        this.nomeFil = nomeFil;
    }

    public String getNomeabrFil() {
        return nomeabrFil;
    }

    public void setNomeabrFil(String nomeabrFil) {
        this.nomeabrFil = nomeabrFil;
    }

    public String getEnderecoFil() {
        return enderecoFil;
    }

    public void setEnderecoFil(String enderecoFil) {
        this.enderecoFil = enderecoFil;
    }

    public String getNumeroFil() {
        return numeroFil;
    }

    public void setNumeroFil(String numeroFil) {
        this.numeroFil = numeroFil;
    }

    public String getFoneFil() {
        return foneFil;
    }

    public void setFoneFil(String foneFil) {
        this.foneFil = foneFil;
    }

    public String getCnpjFil() {
        return cnpjFil;
    }

    public void setCnpjFil(String cnpjFil) {
        this.cnpjFil = cnpjFil;
    }

    @Override
    public String toString() {
        return "Filial{" +
                "codigoFil='" + codigoFil + '\'' +
                ", empresaGer='" + EMPRESA_GER_FIXO + '\'' +
                ", nomeFil='" + nomeFil + '\'' +
                ", cnpjFil='" + cnpjFil + '\'' +
                '}';
    }
}
