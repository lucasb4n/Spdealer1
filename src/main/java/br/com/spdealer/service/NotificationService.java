package br.com.spdealer.service;

import br.com.spdealer.dto.NotificationDTO;
import br.com.spdealer.model.Notification;
import br.com.spdealer.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * NotificationService - Lógica de negócio para Notificações
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Buscar notificações de um usuário (paginado)
     * Compatível com Controller que passa Integer
     */
    public Page<NotificationDTO> findNotificationsByUser(Integer userId, Pageable pageable) {
        log.info("[NotificationService] Buscando notificações do usuário: {}", userId);
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId.longValue(), pageable);
        return notifications.map(this::convertToDTO);
    }

    /**
     * Buscar notificações não-lidas de um usuário (paginado)
     */
    public Page<NotificationDTO> findUnreadNotificationsByUser(Integer userId, Pageable pageable) {
        log.info("[NotificationService] Buscando notificações não-lidas do usuário: {}", userId);
        List<Notification> unreadList = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId.longValue());
        List<NotificationDTO> dtoList = unreadList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Retornar como Page (simular paginação manual)
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), dtoList.size());
        List<NotificationDTO> pageContent = dtoList.subList(start, end);
        
        return new PageImpl<>(pageContent, pageable, dtoList.size());
    }

    /**
     * Contar notificações não-lidas de um usuário
     */
    public long countUnreadNotificationsByUser(Integer userId) {
        log.info("[NotificationService] Contando notificações não-lidas do usuário: {}", userId);
        return notificationRepository.countByUserIdAndIsReadFalse(userId.longValue());
    }

    /**
     * Marcar notificação como lida
     */
    public NotificationDTO markAsRead(Long notificationId, Integer userId) {
        log.info("[NotificationService] Marcando notificação {} como lida para usuário {}", notificationId, userId);
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada"));
        
        if (!notification.getUserId().equals(userId.longValue())) {
            throw new IllegalArgumentException("Usuário não autorizado");
        }
        
        notification.setRead(true);
        notification.setUpdatedAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notification);
        
        return convertToDTO(saved);
    }

    /**
     * Marcar todas as notificações como lidas
     * Retorna quantidade atualizada
     */
    public int markAllAsRead(Integer userId) {
        log.info("[NotificationService] Marcando todas as notificações como lidas para usuário: {}", userId);
        
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId.longValue());
        unread.forEach(notification -> {
            notification.setRead(true);
            notification.setUpdatedAt(LocalDateTime.now());
        });
        notificationRepository.saveAll(unread);
        
        return unread.size();
    }

    /**
     * Deletar notificação
     */
    public void deleteNotification(Long notificationId, Integer userId) {
        log.info("[NotificationService] Deletando notificação {} para usuário {}", notificationId, userId);
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada"));
        
        if (!notification.getUserId().equals(userId.longValue())) {
            throw new IllegalArgumentException("Usuário não autorizado");
        }
        
        notificationRepository.delete(notification);
    }

    /**
     * Deletar todas as notificações de um usuário
     * Retorna quantidade deletada
     */
    public int deleteAllNotifications(Integer userId) {
        log.info("[NotificationService] Deletando todas as notificações para usuário: {}", userId);
        
        List<Notification> notifications = notificationRepository.findByUserId(userId.longValue());
        notificationRepository.deleteAll(notifications);
        
        return notifications.size();
    }

    /**
     * Enviar notificação para usuário específico
     */
    public NotificationDTO sendNotification(Integer targetUserId, String title, String message, String type, String actionUrl) {
        log.info("[NotificationService] Enviando notificação para usuário: {}", targetUserId);
        
        Notification notification = new Notification();
        notification.setUserId(targetUserId.longValue());
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type != null ? type : "info");
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        return convertToDTO(saved);
    }

    /**
     * Broadcast - Enviar notificação para todos os usuários
     * Retorna quantidade de usuários que receberão
     */
    public int broadcastNotification(String title, String message, String type) {
        log.info("[NotificationService] Enviando notificação broadcast para todos os usuários");
        
        // Nota: Nesta implementação básica, apenas logamos
        // Em produção, você buscaria todos os usuários ativos
        log.warn("[NotificationService] Broadcast para todos os usuários não implementado completamente");
        
        return 0;
    }

    /**
     * Converter entidade para DTO
     */
    private NotificationDTO convertToDTO(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getUserId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getUpdatedAt()
        );
    }
}
