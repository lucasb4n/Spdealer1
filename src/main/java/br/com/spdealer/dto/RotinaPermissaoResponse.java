package br.com.spdealer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RotinaPermissaoResponse {

    private Long usuarioId;
    private String nomeUsuario;
    private Long grupoId;
    private String nomeGrupo;
    private boolean admin;
    private boolean diretoria;
    private boolean financeiro;
    private boolean vendas;
    private boolean compras;
    private boolean estoque;
    private List<RotinaItem> rotinas;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RotinaItem {
        private Long id;
        private String codigo;
        private String descricao;
        private String tipo;
        private boolean permitida;
    }
}
