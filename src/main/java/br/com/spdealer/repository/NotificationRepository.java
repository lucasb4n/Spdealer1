package br.com.spdealer.repository;

import br.com.spdealer.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Buscar notificações do usuário ordenadas por data (mais recentes primeiro)
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Buscar notificações não lidas do usuário
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    
    // Buscar todas as notificações não lidas do usuário
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
    
    // Buscar todas as notificações do usuário
    List<Notification> findByUserId(Long userId);
    
    // Contar notificações não lidas
    Long countByUserIdAndIsReadFalse(Long userId);
}
