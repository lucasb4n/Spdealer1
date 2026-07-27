package br.com.spdealer.repository;

import br.com.spdealer.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    Optional<User> findByUsernameAndActive(String username, Boolean active);
    
    boolean existsByUsername(String username);
}