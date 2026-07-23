package br.com.spdealer.dto;

import java.util.List;

public record UserGroupRequest(
        String nome,
        String descricao,
        String status,
        String observacoes,
        List<Long> permissionProgramIds
) {}
