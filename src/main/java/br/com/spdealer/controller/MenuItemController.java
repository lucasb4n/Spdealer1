package br.com.spdealer.controller;

import br.com.spdealer.model.MenuItem;
import br.com.spdealer.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemController {
    private final MenuItemRepository menuItemRepository;

    @GetMapping
    public List<MenuItem> listAll() {
        return menuItemRepository.findAll();
    }

    @GetMapping("/group/{groupId}")
    public List<MenuItem> listByGroup(@PathVariable Long groupId) {
    return menuItemRepository.findByGroup_IdOrderByOrder(groupId);
    }

    @PostMapping
    public MenuItem create(@RequestBody MenuItem item) {
        return menuItemRepository.save(item);
    }

    @PutMapping("/{id}")
    public MenuItem update(@PathVariable Long id, @RequestBody MenuItem item) {
        item.setId(id);
        return menuItemRepository.save(item);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        menuItemRepository.deleteById(id);
    }
}
