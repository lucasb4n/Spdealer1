// Classe mock comentada para evitar conflito de endpoint duplicado
/*
package br.com.spdealer.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;

@RestController
@RequestMapping("/api/user-menu-config")
public class UserMenuConfigMockController {
    @GetMapping("/user/{userId}")
    public List<Map<String, Object>> getUserMenuConfig(@PathVariable Long userId) {
        // Permissões completas para admin (userId=1)
        List<Map<String, Object>> configs = new ArrayList<>();
        for (long menuId = 1; menuId <= 5; menuId++) {
            Map<String, Object> config = new HashMap<>();
            config.put("userId", userId);
            config.put("menuItemId", menuId);
            config.put("permissao", Map.of(
                "visualizar", true,
                "editar", true,
                "excluir", true
            ));
            configs.add(config);
        }
        return configs;
    }
}
*/
