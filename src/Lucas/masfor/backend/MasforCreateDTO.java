package br.com.spdealer.refatorado.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para criação de Tipo de Fornecedor
 * Data: 17 de janeiro de 2026
 */
public class MasforCreateDTO {

    @NotBlank(message = "Código é obrigatório")
    @Size(max = 30, message = "Código deve ter no máximo 30 caracteres")
    private String tipo_for;

    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 200, message = "Descrição deve ter no máximo 200 caracteres")
    private String descr_for;

    public MasforCreateDTO() {
    }

    public MasforCreateDTO(String tipo_for, String descr_for) {
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
}
