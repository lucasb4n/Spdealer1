package br.com.spdealer.controller;

import br.com.spdealer.dto.NotificationDTO;
import br.com.spdealer.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * NotificationController - API REST para Notificações
 * 
 * Endpoints:
 * - GET  /api/v2/notifications           - Listar notificações do usuário
 * - POST /api/v2/notifications/{id}/read - Marcar como lida
 * - POST /api/v2/notifications/read-all  - Marcar todas como lidas
 * - POST /api/v2/notifications/{id}      - Deletar notificação
 * - POST /api/v2/notifications/clear-all - Limpar todas
 * - GET  /api/v2/notifications/unread    - Count de não-lidas
 * - POST /api/v2/notifications/send      - Enviar notificação (admin)
 */

@Slf4j
@RestController
@RequestMapping("/api/v2/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/v2/notifications
     * Listar todas as notificações do usuário autenticado
     * 
     * Querystring:
     * - page=0        (padrão: 0)
     * - size=20       (padrão: 20)
     * - sort=created_at,desc (padrão)
     * - unread=true   (filtrar por não-lidas)
     */
    @GetMapping
    public ResponseEntity<?> listNotifications(
            HttpSession session,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unread) {

        try {
            // Obter user_id da sessão
            Integer userId = (Integer) session.getAttribute("user_id");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            // Buscar notificações
            Pageable pageable = PageRequest.of(page, size, Sort.by("created_at").descending());
            Page<NotificationDTO> notifications;

            if (unread) {
                notifications = notificationService.findUnreadNotificationsByUser(userId, pageable);
            } else {
                notifications = notificationService.findNotificationsByUser(userId, pageable);
            }

            log.info("Fetched {} notifications for user {}", notifications.getTotalElements(), userId);

            return ResponseEntity.ok(notifications);

        } catch (Exception e) {
            log.error("Error fetching notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error fetching notifications: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v2/notifications/unread
     * Contar notificações não-lidas
     */
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadCount(HttpSession session) {
        try {
            Integer userId = (Integer) session.getAttribute("user_id");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            long unreadCount = notificationService.countUnreadNotificationsByUser(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("unread_count", unreadCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching unread count", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error fetching unread count: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v2/notifications/{id}/read
     * Marcar notificação como lida
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            HttpSession session) {

        try {
            Integer userId = (Integer) session.getAttribute("user_id");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            NotificationDTO notification = notificationService.markAsRead(id, userId);

            log.info("Notification {} marked as read by user {}", id, userId);

            return ResponseEntity.ok(notification);

        } catch (IllegalArgumentException e) {
            log.warn("Notification {} not found or access denied for user", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error marking notification as read: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v2/notifications/read-all
     * Marcar todas as notificações como lidas
     */
    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(HttpSession session) {
        try {
            Integer userId = (Integer) session.getAttribute("user_id");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            int count = notificationService.markAllAsRead(userId);

            log.info("Marked {} notifications as read for user {}", count, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("updated_count", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error marking all notifications as read: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/v2/notifications/{id}
     * Deletar notificação
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long id,
            HttpSession session) {

        try {
            Integer userId = (Integer) session.getAttribute("user_id");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            notificationService.deleteNotification(id, userId);

            log.info("Notification {} deleted by user {}", id, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("deleted_id", id);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Notification {} not found or access denied for user", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error deleting notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error deleting notification: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/v2/notifications
     * Deletar todas as notificações
     */
    @DeleteMapping
    public ResponseEntity<?> clearAllNotifications(HttpSession session) {
        try {
            Integer userId = (Integer) session.getAttribute("user_id");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            int count = notificationService.deleteAllNotifications(userId);

            log.info("Cleared {} notifications for user {}", count, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("deleted_count", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error clearing all notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error clearing notifications: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v2/notifications/send
     * Enviar notificação (ADMIN ONLY)
     * 
     * Body:
     * {
     *   "target_user_id": 1,
     *   "title": "Titulo",
     *   "message": "Mensagem",
     *   "type": "info|warning|success|error",
     *   "action_url": "/dashboard/123" (opcional)
     * }
     */
    @PostMapping("/send")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> sendNotification(
            @RequestBody SendNotificationRequest request,
            HttpSession session) {

        try {
            Integer adminUserId = (Integer) session.getAttribute("user_id");
            if (adminUserId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            // Validar request
            if (request.getTargetUserId() == null || request.getTitle() == null || request.getMessage() == null) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Missing required fields: target_user_id, title, message"));
            }

            // Enviar notificação
            NotificationDTO notification = notificationService.sendNotification(
                    request.getTargetUserId(),
                    request.getTitle(),
                    request.getMessage(),
                    request.getType() != null ? request.getType() : "info",
                    request.getActionUrl()
            );

            log.info("Notification sent to user {} by admin {}", request.getTargetUserId(), adminUserId);

            return ResponseEntity.ok(notification);

        } catch (Exception e) {
            log.error("Error sending notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error sending notification: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v2/notifications/broadcast
     * Enviar notificação para todos os usuários (ADMIN ONLY)
     * 
     * Body:
     * {
     *   "title": "Titulo",
     *   "message": "Mensagem",
     *   "type": "warning"
     * }
     */
    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> broadcastNotification(
            @RequestBody SendNotificationRequest request,
            HttpSession session) {

        try {
            Integer adminUserId = (Integer) session.getAttribute("user_id");
            if (adminUserId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not authenticated"));
            }

            if (request.getTitle() == null || request.getMessage() == null) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Missing required fields: title, message"));
            }

            // Broadcast para todos os usuários
            int count = notificationService.broadcastNotification(
                    request.getTitle(),
                    request.getMessage(),
                    request.getType() != null ? request.getType() : "info"
            );

            log.info("Broadcast notification sent to {} users by admin {}", count, adminUserId);

            Map<String, Object> response = new HashMap<>();
            response.put("recipient_count", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error broadcasting notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error broadcasting notification: " + e.getMessage()));
        }
    }

    // ========================================================================
    // Request/Response DTOs
    // ========================================================================

    /**
     * DTO para enviar notificação
     */
    public static class SendNotificationRequest {
        private Integer targetUserId;
        private String title;
        private String message;
        private String type;
        private String actionUrl;

        public SendNotificationRequest() {}

        public Integer getTargetUserId() { return targetUserId; }
        public void setTargetUserId(Integer targetUserId) { this.targetUserId = targetUserId; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getActionUrl() { return actionUrl; }
        public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
    }

    /**
     * DTO para resposta de erro
     */
    public static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
