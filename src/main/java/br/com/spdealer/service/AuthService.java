package br.com.spdealer.service;

import br.com.spdealer.model.User;
import br.com.spdealer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Autentica um usuário verificando username e password
     * @param username nome de usuário
     * @param password senha informada
     * @return Optional<User> se autenticado com sucesso, vazio se falhou
     */
    public Optional<User> authenticate(String username, String password) {
        System.out.println("[AUTH-DEBUG] Tentando autenticar usuário: " + username);
        
        Optional<User> userOptional = userRepository.findByUsername(username);
        
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            System.out.println("[AUTH-DEBUG] Usuário encontrado no banco: " + user.getUsername());
            System.out.println("[AUTH-DEBUG] Senha no banco: " + user.getPassword());
            System.out.println("[AUTH-DEBUG] Ativo: " + user.getActive());
            System.out.println("[AUTH-DEBUG] ID do Grupo: " + user.getGroupId());
            
            if (user.getActive() != null && !user.getActive()) {
                System.out.println("[AUTH-DEBUG] FALHA: Usuário inativo!");
                return Optional.empty();
            }

            if (isPasswordValid(user.getPassword(), password)) {
                System.out.println("[AUTH-DEBUG] SUCESSO: Senha válida!");
                return Optional.of(user);
            } else {
                System.out.println("[AUTH-DEBUG] FALHA: Senha informada [" + password + "] não confere com a do banco!");
            }
        } else {
            System.out.println("[AUTH-DEBUG] FALHA: Usuário não encontrado no banco!");
        }
        
        return Optional.empty();
    }
    
    private boolean isPasswordValid(String storedPassword, String inputPassword) {
        if (storedPassword == null || inputPassword == null) return false;
        
        // Comparação bruta (sem criptografia conforme solicitado)
        return storedPassword.trim().equals(inputPassword.trim());
    }
    
    /**
     * Busca usuário por username
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}