package br.com.spdealer.controller;

import br.com.spdealer.model.MenuGroup;
import br.com.spdealer.model.MenuItem;
import br.com.spdealer.repository.MenuGroupRepository;
import br.com.spdealer.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class MenuAdminController {
    private final MenuGroupRepository menuGroupRepository;
    private final MenuItemRepository menuItemRepository;

    // List full menu with items (admin view)
    @GetMapping("/menu")
    public List<MenuGroup> listFullMenu() {
        return menuGroupRepository.findAllWithItemsByOrderByOrder();
    }

    // CRUD MenuGroup
    @PostMapping("/menu-groups")
    public MenuGroup createGroup(@RequestBody MenuGroup group) {
        if (group.getActive() == null) group.setActive(true);
        return menuGroupRepository.save(group);
    }

    @PutMapping("/menu-groups/{id}")
    public MenuGroup updateGroup(@PathVariable Long id, @RequestBody MenuGroup group) {
        group.setId(id);
        return menuGroupRepository.save(group);
    }

    @DeleteMapping("/menu-groups/{id}")
    public void deleteGroup(@PathVariable Long id) {
        Optional<MenuGroup> g = menuGroupRepository.findById(id);
        if (g.isPresent()) {
            MenuGroup mg = g.get();
            mg.setActive(false);
            menuGroupRepository.save(mg);
        }
    }

    // CRUD MenuItem
    @PostMapping("/menu-items")
    public MenuItem createItem(@RequestBody Map<String, Object> payload) {
        MenuItem item = mapToMenuItem(payload, null);
        if (item.getActive() == null) item.setActive(true);
        return menuItemRepository.save(item);
    }

    @PutMapping("/menu-items/{id}")
    public MenuItem updateItem(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        MenuItem item = mapToMenuItem(payload, id);
        item.setId(id);
        return menuItemRepository.save(item);
    }

    @DeleteMapping("/menu-items/{id}")
    public void deleteItem(@PathVariable Long id) {
        Optional<MenuItem> it = menuItemRepository.findById(id);
        if (it.isPresent()) {
            MenuItem mi = it.get();
            mi.setActive(false);
            menuItemRepository.save(mi);
        }
    }

    /**
     * Reorder and reparent menu items in batch.
     * payload: [{ id, parentId, menuGroupId, ordem }]
     */
    @PostMapping("/menu-items/reorder")
    public void reorder(@RequestBody List<Map<String, Object>> list) {
        for (Map<String, Object> m : list) {
            Number nid = (Number) m.get("id");
            if (nid == null) continue;
            Long id = nid.longValue();
            Optional<MenuItem> opt = menuItemRepository.findById(id);
            if (!opt.isPresent()) continue;
            MenuItem mi = opt.get();
            // parentId may be null
            Number parentN = (Number) m.get("parentId");
            if (parentN != null) mi.setParentId(parentN.longValue()); else mi.setParentId(null);
            Number groupN = (Number) m.get("menuGroupId");
            if (groupN != null) {
                menuGroupRepository.findById(groupN.longValue()).ifPresent(mi::setGroup);
            }
            Number ordem = (Number) m.get("ordem");
            if (ordem != null) mi.setOrder(ordem.intValue());
            menuItemRepository.save(mi);
        }
    }

    // Helper: map payload to MenuItem entity (partial)
    private MenuItem mapToMenuItem(Map<String, Object> payload, Long existingId) {
        MenuItem mi = new MenuItem();
        if (existingId != null) mi.setId(existingId);
        Object nome = payload.getOrDefault("name", payload.get("nome"));
        if (nome != null) mi.setName(String.valueOf(nome));
        Object rota = payload.getOrDefault("route", payload.get("rota"));
        if (rota != null) mi.setRoute(String.valueOf(rota));
        Object icon = payload.get("icon");
        if (icon != null) mi.setIcon(String.valueOf(icon));
        Object ordem = payload.getOrDefault("order", payload.get("ordem"));
        if (ordem instanceof Number) mi.setOrder(((Number) ordem).intValue());
        Object active = payload.getOrDefault("active", payload.get("ativo"));
        if (active instanceof Boolean) mi.setActive((Boolean) active);
        // permissao_codigo
        Object perm = payload.get("permissaoCodigo");
        if (perm == null) perm = payload.get("permissao_codigo");
        if (perm != null) mi.setPermissaoCodigo(String.valueOf(perm));
        // group
        Object groupId = payload.getOrDefault("menuGroupId", payload.get("menu_group_id"));
        if (groupId instanceof Number) {
            menuGroupRepository.findById(((Number) groupId).longValue()).ifPresent(mi::setGroup);
        }
        // parentId
        Object parentId = payload.get("parentId");
        if (parentId instanceof Number) mi.setParentId(((Number) parentId).longValue());
        return mi;
    }
}
