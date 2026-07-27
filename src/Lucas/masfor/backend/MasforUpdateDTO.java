package br.com.spdealer.refatorado.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para atualização de Tipo de Fornecedor
 * Data: 17 de janeiro de 2026
 */
public class MasforUpdateDTO {

    @NotBlank(message = "Descrição é obrigatória")
    @Size(max = 200, message = "Descrição deve ter no máximo 200 caracteres")
    private String descr_for;

    public MasforUpdateDTO() {
    }

    public MasforUpdateDTO(String descr_for) {
        this.descr_for = descr_for;
    }

    public String getDescr_for() {
        return descr_for;
    }

    public void setDescr_for(String descr_for) {
        this.descr_for = descr_for;
    }
}
