package br.com.spdealer.nfe.model;

import java.io.Serializable;

/**
 * Classe de ID composto para XmlPagar (tabela xmlpagar)
 */
public class XmlPagarId implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private Integer parc;
    private String nDup;

    public XmlPagarId() {
    }

    public XmlPagarId(String id, Integer parc, String nDup) {
        this.id = id;
        this.parc = parc;
        this.nDup = nDup;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getParc() {
        return parc;
    }

    public void setParc(Integer parc) {
        this.parc = parc;
    }

    public String getnDup() {
        return nDup;
    }

    public void setnDup(String nDup) {
        this.nDup = nDup;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        XmlPagarId that = (XmlPagarId) o;
        return id.equals(that.id) && parc.equals(that.parc) && nDup.equals(that.nDup);
    }

    @Override
    public int hashCode() {
        return id.hashCode() + parc.hashCode() + nDup.hashCode();
    }
}
