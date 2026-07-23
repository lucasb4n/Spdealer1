package br.com.spdealer.dto;

import java.util.List;

public record UserGroupResponse(
        Long id,
        String nome,
        String descricao,
        String status,
        String observacoes,
        List<ProgramSummary> programas
) {
    public record ProgramSummary(Long id, String codigo, String descricao) {}
}
