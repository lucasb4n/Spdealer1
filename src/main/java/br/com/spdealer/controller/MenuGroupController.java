package br.com.spdealer.controller;

import br.com.spdealer.model.User;
import br.com.spdealer.model.UserMenuConfig;
import br.com.spdealer.repository.UserMenuConfigRepository;
import br.com.spdealer.repository.UserRepository;
import br.com.spdealer.repository.UserGroupPermissionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;

import br.com.spdealer.model.MenuGroup;
import br.com.spdealer.model.MenuItem;
import br.com.spdealer.repository.MenuGroupRepository;
import br.com.spdealer.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import lombok.Data;

@RestController
@RequiredArgsConstructor
public class MenuGroupController {
    private final MenuGroupRepository menuGroupRepository;
    private final MenuItemRepository menuItemRepository;

    @Autowired
    private UserMenuConfigRepository userMenuConfigRepository;

    @Autowired
    private UserGroupPermissionRepository userGroupPermissionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping(value = {"/api/menu-groups/{userId}", "/api/menu-groups/user/{userId}"}, produces = "application/json;charset=UTF-8")
    public List<MenuGroupDTO> listByUser(@PathVariable Long userId) {
        System.out.println("[MENU-DEBUG-V2] listByUser v20240417_5 chamado para userId: " + userId);
        User usuario = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        System.out.println("[MENU-DEBUG] Usuário: " + usuario.getUsername() + ", GroupId: " + usuario.getGroupId());

        // Se for Admin (Grupo 1) - Retorna TUDO que for ativo
        if (Long.valueOf(1).equals(usuario.getGroupId())) {
            List<MenuGroup> allGroups = menuGroupRepository.findByActiveOrderByOrder(true);
            List<MenuItem> allActiveItems = menuItemRepository.findByActiveWithGroupOrderByOrder(true);
            System.out.println("[MENU-DEBUG] Admin Bypass: Groups=" + allGroups.size() + ", Items=" + allActiveItems.size());
            System.out.println("[MENU-DEBUG] Admin Bypass item IDs: " + allActiveItems.stream().map(i -> String.valueOf(i.getId())).collect(java.util.stream.Collectors.joining(",")));
            System.out.println("[MENU-DEBUG] Item 1704 in result: " + allActiveItems.stream().anyMatch(i -> i.getId() != null && i.getId() == 1704L));
            return convertToDTOs(allGroups, allActiveItems);
        }


        // 2. Processar Overrides Individuais do JSON de permissões
        Set<Long> forbiddenProgIds = new HashSet<>();
        Set<Long> forcedVisibleProgIds = new HashSet<>();
        
        // 2.1 Adicionar permissões do GRUPO do usuário
        if (usuario.getGroupId() != null) {
            List<br.com.spdealer.model.UserGroupPermission> perms = userGroupPermissionRepository.findByGroupId(usuario.getGroupId());
            System.out.println("[MENU-DEBUG] Encontradas " + perms.size() + " permissões para o grupo " + usuario.getGroupId());
            perms.stream()
                .filter(p -> p.getPermitido() != null && p.getPermitido())
                .forEach(p -> {
                    if (p.getProgram() != null) {
                        forcedVisibleProgIds.add(p.getProgram().getId());
                    }
                });
            System.out.println("[MENU-DEBUG] Programas permitidos via Grupo (" + usuario.getGroupId() + "): " + forcedVisibleProgIds.size());
        }

        String permissionsJson = usuario.getPermissions();
        if (permissionsJson != null && !permissionsJson.isEmpty()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(permissionsJson);
                if (root.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode node : root) {
                        if (node.isNumber()) {
                            // Caso antigo/simples: apenas o ID do programa
                            forcedVisibleProgIds.add(node.asLong());
                        } else if (node.isObject() && node.has("programId")) {
                            // Caso novo: objeto com flags de CRUD
                            long progId = node.get("programId").asLong();
                            
                            // Na dúvida, se qualquer flag de visibilidade estiver ativa, mostramos no menu
                            boolean isVisivel = node.path("visivel").asBoolean(false) || 
                                              node.path("visualizar").asBoolean(false);
                            
                            if (isVisivel) forcedVisibleProgIds.add(progId);
                            else forbiddenProgIds.add(progId);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("[MENU-DEBUG] Erro JSON: " + e.getMessage());
            }
        }

        List<MenuGroup> groups = menuGroupRepository.findByActiveOrderByOrder(true);
        List<MenuItem> rawItems = menuItemRepository.findByActiveWithGroupOrderByOrder(true);
        Map<Long, MenuItem> allItemsMap = rawItems.stream().collect(Collectors.toMap(MenuItem::getId, i -> i));
        
        System.out.println("[MENU-DEBUG] total raw items: " + rawItems.size());

        // 3. Map visibility from config (menuItemId -> visible)
        Map<Long, Boolean> configMap = userMenuConfigRepository.findByUserId(userId)
            .stream()
            .collect(Collectors.toMap(UserMenuConfig::getMenuItemId, UserMenuConfig::getVisible, (a, b) -> a));
        
        boolean hasConfigForUser = !configMap.isEmpty();
        System.out.println("[MENU-DEBUG] Modo de filtragem: " + (hasConfigForUser ? "RESTRITIVO (WhiteList via Config)" : "PADRÃO (Tudo Permitido)"));

        Set<Long> allowedIds = new HashSet<>();
        for (MenuItem item : rawItems) {
            // A. Determinar Permissão de Segurança (Base)
            boolean basePermitted = false;
            
            // Itens que não requerem permissão são permitidos por padrão
            if (Boolean.FALSE.equals(item.getRequerPermissao())) {
                basePermitted = true;
            } else {
                Long programId = (item.getProgram() != null) ? item.getProgram().getId() : null;
                
                // 1. Prioridade: Bloqueios individuais no JSON
                if (forbiddenProgIds.contains(item.getId()) || (programId != null && forbiddenProgIds.contains(programId))) {
                    basePermitted = false;
                }
                // 2. Liberações individuais no JSON
                else if (forcedVisibleProgIds.contains(item.getId()) || (programId != null && forcedVisibleProgIds.contains(programId))) {
                    basePermitted = true;
                }
                // 3. Fallback: Configuração manual na tabela (Whitelist Legada)
                else if (configMap.getOrDefault(item.getId(), false)) {
                    basePermitted = true;
                }
            }

            // B. Tomada de Decisão Final (Hierarquia de Filtros)
            boolean isAllowed = false;
            
            if (hasConfigForUser) {
                Boolean configVisible = configMap.get(item.getId());
                if (configVisible != null) {
                    // Modo Restritivo: a configuração do admin é AUTORITATIVA.
                    // Se o admin marcou visível=true, o item é exibido.
                    // Se visível=false (ou não está no mapa), está oculto.
                    // Nota: se o item foi explicitamente BLOQUEADO pelo JSON de permissões,
                    // esse bloqueio ainda prevalece.
                    boolean notForbidden = !(item.getProgram() != null
                            && forbiddenProgIds.contains(item.getProgram().getId()));
                    isAllowed = configVisible && notForbidden;
                } else {
                    // Item não está no configMap do usuário: oculto por padrão (whitelist estrita)
                    isAllowed = false;
                }
            } else {
                // Sem configuração manual: usa o basePermitted do grupo/JSON
                isAllowed = basePermitted;
            }

            // C. Inclusão recursiva de ancestrais
            if (isAllowed) {
                System.out.println("[MENU-DEBUG] Item ALLOWED for user " + userId + ": " + item.getName() + " (ID: " + item.getId() + ") - Parent: " + item.getParentId());
                MenuItem current = item;
                while (current != null) {
                    allowedIds.add(current.getId());
                    current = (current.getParentId() != null) ? allItemsMap.get(current.getParentId()) : null;
                }
            }
        }

        System.out.println("[MENU-DEBUG] User " + userId + " total allowed IDs: " + allowedIds.size());
        List<MenuItem> filteredItems = rawItems.stream()
            .filter(item -> allowedIds.contains(item.getId()))
            .collect(Collectors.toList());
        
        System.out.println("[MENU-DEBUG] Final Items filtered (including ancestors): " + filteredItems.size());
        if (filteredItems.isEmpty() && !rawItems.isEmpty()) {
            System.out.println("[MENU-DEBUG] ALERTA: Nenhum item passou pelo filtro, mas existem itens ativos no banco.");
        }
        return convertToDTOs(groups, filteredItems);
    }

    private List<MenuGroupDTO> convertToDTOs(List<MenuGroup> groups, List<MenuItem> items) {
        if (items == null || items.isEmpty()) return new ArrayList<>();

        // Group items by group ID
        Map<Long, List<MenuItem>> itemsByGroup = items.stream()
            .filter(i -> i.getGroupId() != null)
            .collect(Collectors.groupingBy(MenuItem::getGroupId));

        List<MenuGroupDTO> result = new ArrayList<>();
        for (MenuGroup group : groups) {
            List<MenuItem> groupItems = itemsByGroup.getOrDefault(group.getId(), new ArrayList<>());
            if (!groupItems.isEmpty()) {
                MenuGroupDTO gDto = new MenuGroupDTO();
                gDto.setId(group.getId());
                gDto.setName(group.getName());
                gDto.setIcon(group.getIcon());
                
                // Build tree for this group
                List<MenuItemDTO> roots = groupItems.stream()
                    .filter(i -> i.getParentId() == null)
                    .map(i -> convertItemToDTO(i, groupItems))
                    .collect(Collectors.toList());
                
                gDto.setItems(roots);
                result.add(gDto);
            }
        }
        return result;
    }

    private MenuItemDTO convertItemToDTO(MenuItem item, List<MenuItem> allInGroup) {
        MenuItemDTO dto = new MenuItemDTO();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setIcon(item.getIcon());
        dto.setRoute(item.getRoute());
        
        List<MenuItemDTO> children = allInGroup.stream()
            .filter(i -> item.getId().equals(i.getParentId()))
            .map(i -> convertItemToDTO(i, allInGroup))
            .collect(Collectors.toList());
            
        dto.setFilhos(children);
        return dto;
    }

    @GetMapping(value = "/api/menu-groups", produces = "application/json;charset=UTF-8")
    public List<MenuGroupDTO> listAll() {
        List<MenuGroup> groups = menuGroupRepository.findByActiveOrderByOrder(true);
        List<MenuItem> allItems = menuItemRepository.findByActiveOrderByOrder(true);
        return convertToDTOs(groups, allItems);
    }

    @Data
    public static class MenuGroupDTO {
        private Long id;
        private String name;
        private String icon;
        private Integer order;
        private Boolean active;
        private List<MenuItemDTO> items;
    }

    @Data
    public static class MenuItemDTO {
        private Long id;
        private Long parentId;
        private String codigo;
        private String name;
        private String icon;
        private String route;
        private Integer order;
        private Integer nivel;
        private Boolean active;
        private List<MenuItemDTO> filhos = new ArrayList<>();
    }
    @GetMapping(value = "/api/menu-groups/version")
    public Map<String, String> getVersion() {
        return Map.of(
            "version", "20240417_v8_double_check_ids",
            "status", "running",
            "timestamp", java.time.LocalDateTime.now().toString()
        );
    }

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @GetMapping(value = "/api/menu-groups/debug-sql")
    public Map<String, Object> debugSql() {
        List<Object[]> rows = entityManager.createNativeQuery(
            "SELECT id, nome, ativo, parent_id, menu_group_id, ordem FROM menu_items WHERE id = 1704")
            .getResultList();
        Map<String, Object> result = new HashMap<>();
        result.put("found", !rows.isEmpty());
        if (!rows.isEmpty()) {
            Object[] row = rows.get(0);
            result.put("id", row[0]);
            result.put("nome", row[1]);
            result.put("ativo", row[2]);
            result.put("parent_id", row[3]);
            result.put("menu_group_id", row[4]);
            result.put("ordem", row[5]);
        }
        return result;
    }

    @GetMapping(value = "/api/menu-groups/debug/{userId}")
    public Map<String, Object> debugPerms(@PathVariable Long userId) {
        User usuario = userRepository.findById(userId).orElse(null);
        if (usuario == null) return Map.of("error", "User not found");
        
        Set<Long> forced = new HashSet<>();
        String json = usuario.getPermissions();
        if (json != null) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(json);
                if (root.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode node : root) {
                        if (node.isNumber()) forced.add(node.asLong());
                        else if (node.isObject() && node.has("programId")) {
                            long pid = node.get("programId").asLong();
                            if (node.path("visivel").asBoolean(false) || node.path("visualizar").asBoolean(false)) {
                                forced.add(pid);
                            }
                        }
                    }
                }
            } catch (Exception e) {}
        }

        return Map.of(
            "userId", userId,
            "forcedIds", forced,
            "permissionsJson", json != null ? json : "null"
        );
    }
}
