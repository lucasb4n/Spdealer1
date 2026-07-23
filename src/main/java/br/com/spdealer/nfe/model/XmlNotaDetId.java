package br.com.spdealer.nfe.model;

import java.io.Serializable;

/**
 * Classe de ID composto para XmlNotaDet (tabela xmlnotadet)
 */
public class XmlNotaDetId implements Serializable {

    private static final long serialVersionUID = 1L;

    private String id;
    private Integer nItem;

    public XmlNotaDetId() {
    }

    public XmlNotaDetId(String id, Integer nItem) {
        this.id = id;
        this.nItem = nItem;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getNItem() {
        return nItem;
    }

    public void setNItem(Integer nItem) {
        this.nItem = nItem;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        XmlNotaDetId that = (XmlNotaDetId) o;
        return id.equals(that.id) && nItem.equals(that.nItem);
    }

    @Override
    public int hashCode() {
        return id.hashCode() + nItem.hashCode();
    }
}
