package br.com.spdealer.service;

import br.com.spdealer.model.User;
import br.com.spdealer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component; // MUDOU DE @Service PARA @Component

import java.util.Arrays;
import java.util.List;

// TEMPORARIAMENTE DESABILITADO PARA TESTE
// @Service
@Component
@RequiredArgsConstructor
public class CustomUserDetailsService { // implements UserDetailsService {

    private final UserRepository userRepository;

    // MÉTODO COMENTADO TEMPORARIAMENTE PARA TESTE
    /*
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + username));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UsernameNotFoundException("Usuário inativo: " + username);
        }

        List<SimpleGrantedAuthority> authorities = Arrays.stream(user.getRoles().split(","))
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.trim().toUpperCase()))
                .toList();

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }
    */
}