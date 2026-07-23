package br.com.spdealer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "masger")
public class Masger {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NUMEMPR_GER")
    private Long numEmprGer;
    
    @Column(name = "NOME_GER")
    private String nomeGer;
    
    @Column(name = "CGCCPF_GER")
    private String cgccpfGer;
    
    @Column(name = "ENDGERAL_GER")
    private String endGeralGer;
    
    @Column(name = "CIDADE_GER")
    private String cidadeGer;
    
    @Column(name = "UF_GER")
    private String ufGer;
    
    @Column(name = "CEP_GER")
    private String cepGer;
    
    @Column(name = "TEL_GER")
    private String telGer;
    
    @Column(name = "TELREF_GER")
    private String telrefGer;
    
    @Column(name = "FAX_GER")
    private String faxGer;
    
    @Column(name = "EMAIL_GER")
    private String emailGer;

    // Getters and Setters
    public Long getNumEmprGer() {
        return numEmprGer;
    }

    public void setNumEmprGer(Long numEmprGer) {
        this.numEmprGer = numEmprGer;
    }

    public String getNomeGer() {
        return nomeGer;
    }

    public void setNomeGer(String nomeGer) {
        this.nomeGer = nomeGer;
    }

    public String getCgccpfGer() {
        return cgccpfGer;
    }

    public void setCgccpfGer(String cgccpfGer) {
        this.cgccpfGer = cgccpfGer;
    }

    public String getEndGeralGer() {
        return endGeralGer;
    }

    public void setEndGeralGer(String endGeralGer) {
        this.endGeralGer = endGeralGer;
    }

    public String getCidadeGer() {
        return cidadeGer;
    }

    public void setCidadeGer(String cidadeGer) {
        this.cidadeGer = cidadeGer;
    }

    public String getUfGer() {
        return ufGer;
    }

    public void setUfGer(String ufGer) {
        this.ufGer = ufGer;
    }

    public String getCepGer() {
        return cepGer;
    }

    public void setCepGer(String cepGer) {
        this.cepGer = cepGer;
    }

    public String getTelGer() {
        return telGer;
    }

    public void setTelGer(String telGer) {
        this.telGer = telGer;
    }

    public String getTelrefGer() {
        return telrefGer;
    }

    public void setTelrefGer(String telrefGer) {
        this.telrefGer = telrefGer;
    }

    public String getFaxGer() {
        return faxGer;
    }

    public void setFaxGer(String faxGer) {
        this.faxGer = faxGer;
    }

    public String getEmailGer() {
        return emailGer;
    }

    public void setEmailGer(String emailGer) {
        this.emailGer = emailGer;
    }

    @Override
    public String toString() {
        return "Masger{" +
                "numEmprGer=" + numEmprGer +
                ", nomeGer='" + nomeGer + '\'' +
                ", cgccpfGer='" + cgccpfGer + '\'' +
                ", endGeralGer='" + endGeralGer + '\'' +
                ", cidadeGer='" + cidadeGer + '\'' +
                ", ufGer='" + ufGer + '\'' +
                '}';
    }
}
