package br.com.spdealer.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/menus/permissions")
public class MenuPermissionController {

    @GetMapping("/{userId}")
    public List<MenuPermissionDTO> getPermissions(@PathVariable Long userId) {
        // TODO: Substituir por consulta real ao banco de permissões do usuário
        // Permissões de exemplo: todos os menus liberados
        List<MenuPermissionDTO> permissions = new ArrayList<>();
        // Exemplo: ids dos menus que existem no sistema
        List<Long> menuIds = Arrays.asList(1L,2L,3L,4L,5L,6L,7L,8L,9L,10L,11L,12L,13L,14L,15L,16L,17L,18L,19L);
        for (Long menuId : menuIds) {
            MenuPermissionDTO dto = new MenuPermissionDTO();
            dto.setUserId(userId);
            dto.setMenuId(menuId);
            dto.setPermissao(new Permissao(true, true, true, true));
            permissions.add(dto);
        }
        return permissions;
    }

    public static class MenuPermissionDTO {
        private Long userId;
        private Long menuId;
        private Permissao permissao;
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Long getMenuId() { return menuId; }
        public void setMenuId(Long menuId) { this.menuId = menuId; }
        public Permissao getPermissao() { return permissao; }
        public void setPermissao(Permissao permissao) { this.permissao = permissao; }
    }

    public static class Permissao {
        private boolean visualizar;
        private boolean incluir;
        private boolean alterar;
        private boolean excluir;
        public Permissao() {}
        public Permissao(boolean visualizar, boolean incluir, boolean alterar, boolean excluir) {
            this.visualizar = visualizar;
            this.incluir = incluir;
            this.alterar = alterar;
            this.excluir = excluir;
        }
        public boolean isVisualizar() { return visualizar; }
        public void setVisualizar(boolean visualizar) { this.visualizar = visualizar; }
        public boolean isIncluir() { return incluir; }
        public void setIncluir(boolean incluir) { this.incluir = incluir; }
        public boolean isAlterar() { return alterar; }
        public void setAlterar(boolean alterar) { this.alterar = alterar; }
        public boolean isExcluir() { return excluir; }
        public void setExcluir(boolean excluir) { this.excluir = excluir; }
    }
}
