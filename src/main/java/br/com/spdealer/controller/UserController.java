package br.com.spdealer.controller;

import br.com.spdealer.model.User;
import br.com.spdealer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);
    private final UserRepository userRepository;


    @GetMapping
    public List<User> listAll() {
        return userRepository.findAll();
    }

    // Os métodos POST e PUT já aceitam todos os campos do User, incluindo email e celular

    @PostMapping
    public ResponseEntity<?> create(@RequestBody User user) {
        try {
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                Map<String, String> m = new HashMap<>();
                m.put("message", "username is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(m);
            }
            User saved = userRepository.save(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            log.error("Erro ao criar usuário: {}", e.getMessage(), e);
            Map<String, String> m = new HashMap<>();
            m.put("message", "Erro ao criar usuário");
            m.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(m);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody User user) {
        try {
            User existing = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
                existing.setUsername(user.getUsername());
            }
            if (user.getName() != null) existing.setName(user.getName());
            if (user.getEmail() != null) existing.setEmail(user.getEmail());
            if (user.getCelular() != null) existing.setCelular(user.getCelular());
            if (user.getRole() != null) existing.setRole(user.getRole());
            if (user.getActive() != null) existing.setActive(user.getActive());
            if (user.getPermissions() != null) existing.setPermissions(user.getPermissions());
            if (user.getMenuConfig() != null) existing.setMenuConfig(user.getMenuConfig());
            if (user.getGroupId() != null) existing.setGroupId(user.getGroupId());
            if (user.getDefaultDashboardId() != null) existing.setDefaultDashboardId(user.getDefaultDashboardId());

            // Só atualiza senha se vier preenchida
            if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
                existing.setPassword(user.getPassword());
            }

            User saved = userRepository.save(existing);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Erro ao atualizar usuário id {}: {}", id, e.getMessage(), e);
            Map<String, String> m = new HashMap<>();
            m.put("message", "Erro ao atualizar usuário");
            m.put("detail", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(m);
        }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        userRepository.deleteById(id);
    }

    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
