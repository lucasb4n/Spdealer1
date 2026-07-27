// src/main/java/br/com/spdealer/controller/AuthRestController.java
package br.com.spdealer.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import br.com.spdealer.model.User;
import br.com.spdealer.repository.UserRepository;
import br.com.spdealer.dto.LoginResponseDTO;
import br.com.spdealer.service.AuthService;
import jakarta.servlet.http.HttpSession;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthRestController {
    
    // Log prefix for easy grep
    private static final String LOG_PREFIX = "[PRO-MAX-AUTH]";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @PostMapping({"/login", "/auth/login"})
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload, HttpSession session) {
        // Robust extraction (supports login/username and senha/password)
        String rawUser = payload.getOrDefault("username", payload.get("login"));
        String rawPass = payload.getOrDefault("password", payload.get("senha"));
        String empresa = payload.getOrDefault("empresaSelecionada", "001");
        String filial  = payload.get("codigoFilSelecionado");

        if (rawUser == null || rawPass == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Credenciais nulas. Verifique payload (login/senha ou username/password)."));
        }

        try {
            String username = rawUser.trim();
            String password = rawPass.trim();

            System.out.println(LOG_PREFIX + " DEBUG: Tentativa de login -> [" + username + "] no banco MariaDB.");

            // Utiliza AuthService para autenticação (trata hashes e fallbacks)
            Optional<User> userOpt = authService.authenticate(username, password);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                System.out.println(LOG_PREFIX + " OK: Usuário autenticado: " + user.getUsername());

                // Grava na sessão
                session.setAttribute("user_id", user.getId());
                session.setAttribute("userId", user.getId()); // Compatibilidade com RelatoriosFinanceirosController
                session.setAttribute("nome_usu", user.getName());
                session.setAttribute("username", user.getUsername());
                session.setAttribute("role", user.getRole());
                session.setAttribute("empresa_ger", empresa.trim());
                if (filial != null) session.setAttribute("id_fil", filial.trim());

                LoginResponseDTO responseDTO = new LoginResponseDTO(user);
                return ResponseEntity.ok(responseDTO);
            } else {
                System.out.println(LOG_PREFIX + " FAIL: Usuário não encontrado, inativo ou senha incorreta: " + username);
            }

            return ResponseEntity.status(401).body(Map.of(
                "error", "Acesso Negado.",
                "message", "Usuário ou senha inválidos no banco de dados ERP.",
                "hint", "Verifique se o usuário '" + username + "' está ativo na tabela erp.users."
            ));
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println(LOG_PREFIX + " ERROR: Exceção no login: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal Server Error",
                "message", "Ocorreu um erro no servidor: " + e.getMessage(),
                "stack", e.toString()
            ));
        }
    }

}
