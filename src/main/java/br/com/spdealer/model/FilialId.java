package br.com.spdealer.model;

import java.io.Serializable;
import java.util.Objects;

/**
 * Chave primária composta para a entidade Filial
 * Representa a combinação de empresa_ger + codigo_fil
 */
public class FilialId implements Serializable {
    private static final long serialVersionUID = 1L;

    private String empresaGer;
    private String codigoFil;

    public FilialId() {
    }

    public FilialId(String empresaGer, String codigoFil) {
        this.empresaGer = empresaGer;
        this.codigoFil = codigoFil;
    }

    public String getEmpresaGer() {
        return empresaGer;
    }

    public void setEmpresaGer(String empresaGer) {
        this.empresaGer = empresaGer;
    }

    public String getCodigoFil() {
        return codigoFil;
    }

    public void setCodigoFil(String codigoFil) {
        this.codigoFil = codigoFil;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FilialId filialId = (FilialId) o;
        return Objects.equals(empresaGer, filialId.empresaGer) &&
               Objects.equals(codigoFil, filialId.codigoFil);
    }

    @Override
    public int hashCode() {
        return Objects.hash(empresaGer, codigoFil);
    }

    @Override
    public String toString() {
        return "FilialId{" +
                "empresaGer='" + empresaGer + '\'' +
                ", codigoFil='" + codigoFil + '\'' +
                '}';
    }
}
