package br.com.spdealer.refatorado.model;

/**
 * Modelo para Tipo de Fornecedor (masfor)
 * Data: 17 de janeiro de 2026
 */
public class Masfor {

    private String tipo_for;   // Código (PK)
    private String descr_for;  // Descrição

    public Masfor() {
    }

    public Masfor(String tipo_for, String descr_for) {
        this.tipo_for = tipo_for;
        this.descr_for = descr_for;
    }

    public String getTipo_for() {
        return tipo_for;
    }

    public void setTipo_for(String tipo_for) {
        this.tipo_for = tipo_for;
    }

    public String getDescr_for() {
        return descr_for;
    }

    public void setDescr_for(String descr_for) {
        this.descr_for = descr_for;
    }

    @Override
    public String toString() {
        return "Masfor{" +
                "tipo_for='" + tipo_for + '\'' +
                ", descr_for='" + descr_for + '\'' +
                '}';
    }
}
