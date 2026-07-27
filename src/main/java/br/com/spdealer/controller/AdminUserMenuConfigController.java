package br.com.spdealer.controller;

import br.com.spdealer.model.UserMenuConfig;
import br.com.spdealer.repository.UserMenuConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Endpoint administrativo para gerenciar a configuração de visibilidade
 * do menu por usuário. Usado pelo MenuAdminForm.tsx para gravar as
 * permissões de menu individuais de cada usuário.
 */
@RestController
@RequestMapping("/api/admin/user-menu-config")
@RequiredArgsConstructor
public class AdminUserMenuConfigController {

    private final UserMenuConfigRepository userMenuConfigRepository;

    /**
     * Retorna a configuração de menu de um usuário específico.
     * Chamado pelo MenuAdminForm ao selecionar um usuário no dropdown.
     */
    @GetMapping
    public ResponseEntity<List<UserMenuConfig>> listByUser(@RequestParam Long usuarioId) {
        return ResponseEntity.ok(userMenuConfigRepository.findByUserId(usuarioId));
    }

    /**
     * Salva (substitui) a configuração completa de menu de um usuário.
     * Recebe uma lista de objetos com { menu_item_id, visivel, ordem, usuario_id }.
     * Deleta os registros anteriores e insere os novos (upsert completo).
     */
    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Map<String, Object>> saveUserMenuConfig(
            @RequestBody List<Map<String, Object>> payload) {
        System.out.println("[ADMIN-MENU-CONFIG] Recebido POST para salvar config: " + (payload != null ? payload.size() : 0) + " itens");
        try {
            if (payload == null || payload.isEmpty()) {
                System.err.println("[ADMIN-MENU-CONFIG] Erro: Payload vazio");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "Payload vazio"));
            }

            // Tentar extrair o userId de várias formas
            Map<String, Object> firstItem = payload.get(0);
            Object rawUserId = firstItem.get("usuario_id");
            if (rawUserId == null) rawUserId = firstItem.get("userId");
            if (rawUserId == null) rawUserId = firstItem.get("id_usuario");
            
            if (rawUserId == null) {
                System.err.println("[ADMIN-MENU-CONFIG] Erro: usuario_id ausente no primeiro item: " + firstItem);
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "usuario_id ausente no payload", "item_exemplo", firstItem));
            }
            Long userId = ((Number) rawUserId).longValue();

            System.out.println("[ADMIN-MENU-CONFIG] Iniciando limpeza e gravação para usuário: " + userId);

            // Deletar configuração anterior
            userMenuConfigRepository.deleteByUserId(userId);

            int saved = 0;
            for (Map<String, Object> item : payload) {
                Object rawMenuItemId = item.get("menu_item_id");
                if (rawMenuItemId == null) rawMenuItemId = item.get("menuItemId");
                
                Object rawVisivel = item.get("visivel");
                if (rawVisivel == null) rawVisivel = item.get("visible");
                
                Object rawOrdem = item.get("ordem");
                if (rawOrdem == null) rawOrdem = item.get("order");

                if (rawMenuItemId == null) continue;

                UserMenuConfig config = new UserMenuConfig();
                config.setUserId(userId);
                config.setMenuItemId(((Number) rawMenuItemId).longValue());
                
                // Tratar visivel que pode vir como Boolean ou Boolean string
                if (rawVisivel instanceof Boolean) {
                    config.setVisible((Boolean) rawVisivel);
                } else if (rawVisivel instanceof Number) {
                    config.setVisible(((Number) rawVisivel).intValue() == 1);
                } else if (rawVisivel instanceof String) {
                    config.setVisible("true".equalsIgnoreCase((String) rawVisivel) || "1".equals(rawVisivel));
                } else {
                    config.setVisible(false);
                }

                config.setOrder(rawOrdem != null ? ((Number) rawOrdem).intValue() : 0);

                userMenuConfigRepository.save(config);
                saved++;
            }

            System.out.println("[ADMIN-MENU-CONFIG] Sucesso! Gravados " + saved + " itens para usuário " + userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "userId", userId,
                    "saved", saved,
                    "message", "Configuração salva com sucesso"
            ));

        } catch (Exception e) {
            System.err.println("[ADMIN-MENU-CONFIG] Erro crítico ao salvar: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
