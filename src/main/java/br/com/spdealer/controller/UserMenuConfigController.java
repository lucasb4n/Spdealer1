package br.com.spdealer.controller;

import br.com.spdealer.model.UserMenuConfig;
import br.com.spdealer.repository.UserMenuConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/user-menu-config")
@RequiredArgsConstructor
public class UserMenuConfigController {
    private final UserMenuConfigRepository userMenuConfigRepository;

    @GetMapping("/user/{userId}")
    public List<UserMenuConfig> listByUser(@PathVariable Long userId) {
        return userMenuConfigRepository.findByUserId(userId);
    }

    @PostMapping
    public UserMenuConfig create(@RequestBody UserMenuConfig config) {
        return userMenuConfigRepository.save(config);
    }

    @PutMapping("/{id}")
    public UserMenuConfig update(@PathVariable Long id, @RequestBody UserMenuConfig config) {
        config.setId(id);
        return userMenuConfigRepository.save(config);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userMenuConfigRepository.deleteById(id);
    }
}
