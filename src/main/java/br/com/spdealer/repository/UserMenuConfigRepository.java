package br.com.spdealer.repository;

import br.com.spdealer.model.UserMenuConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserMenuConfigRepository extends JpaRepository<UserMenuConfig, Long> {
    
    List<UserMenuConfig> findByUserId(Long userId);
    
    Optional<UserMenuConfig> findByUserIdAndMenuItemId(Long userId, Long menuItemId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);
    
    void deleteByUserIdAndMenuItemId(Long userId, Long menuItemId);
    
    List<UserMenuConfig> findByMenuItemId(Long menuItemId);
}