/**
 * NotificationCenter.jsx - Centro de Notificações em Tempo Real
 * 
 * Componente React para exibir notificações via Socket.IO
 * - Ícone sino na navbar
 * - Badge com count de não-lidas
 * - Dropdown list com notificações
 * - Suporte a diferentes tipos (info, warning, success, error)
 * - Marcar como lidas/desmarcar
 * - Limpar notificações
 * 
 * Integração:
 * - Socket.IO para comunicação em tempo real
 * - Redux para gerenciamento de estado (opcional)
 * - Bootstrap 5 para estilos
 */

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import PropTypes from 'prop-types';
import './NotificationCenter.css';

/**
 * Hook customizado para Socket.IO e notificações
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    // Conectar ao Socket.IO
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 
                     `${window.location.protocol}//${window.location.host}`;
    
    socketRef.current = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
      auth: {
        userId: userId
      }
    });

    // Listener: nova notificação recebida
    socketRef.current.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Áudio de notificação (opcional)
      playNotificationSound();
    });

    // Listener: notificação marcada como lida
    socketRef.current.on('notification:read', (notificationId) => {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      updateUnreadCount();
    });

    // Listener: notificação deletada
    socketRef.current.on('notification:deleted', (notificationId) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      updateUnreadCount();
    });

    // Listener: todas as notificações marcadas como lidas
    socketRef.current.on('notification:read-all', () => {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    });

    // Listener: todas as notificações deletadas
    socketRef.current.on('notification:clear-all', () => {
      setNotifications([]);
      setUnreadCount(0);
    });

    // Listener: carregamento inicial de notificações
    socketRef.current.on('notification:load-initial', (initialNotifications) => {
      setNotifications(initialNotifications);
      updateUnreadCount(initialNotifications);
    });

    // Listener: erro de conexão
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Carregar notificações iniciais
    if (userId) {
      socketRef.current.emit('notification:load', { userId });
    }

    // Cleanup ao desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  // Função auxiliar para atualizar count de não-lidas
  const updateUnreadCount = (notifs = notifications) => {
    const count = notifs.filter(n => !n.is_read).length;
    setUnreadCount(count);
  };

  // Marcar notificação como lida
  const markAsRead = (notificationId) => {
    socketRef.current?.emit('notification:mark-read', { notificationId });
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    socketRef.current?.emit('notification:mark-all-read');
  };

  // Deletar notificação
  const deleteNotification = (notificationId) => {
    socketRef.current?.emit('notification:delete', { notificationId });
  };

  // Limpar todas as notificações
  const clearAllNotifications = () => {
    socketRef.current?.emit('notification:clear-all');
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    socket: socketRef.current
  };
};

/**
 * Som de notificação
 */
const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
    audio.play().catch(() => {
      // Silenciosamente falhar se som não conseguir tocar
    });
  } catch (e) {
    // Ignorar erros de áudio
  }
};

/**
 * Item individual de notificação
 */
const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getIconClass = () => {
    switch (notification.type) {
      case 'error': return 'bi-exclamation-circle text-danger';
      case 'warning': return 'bi-exclamation-triangle text-warning';
      case 'success': return 'bi-check-circle text-success';
      case 'info':
      default: return 'bi-info-circle text-info';
    }
  };

  const getBgClass = () => {
    if (notification.is_read) return 'notification-read';
    return 'notification-unread';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className={`notification-item ${getBgClass()}`}>
      <div className="notification-icon">
        <i className={`bi ${getIconClass()}`}></i>
      </div>
      <div className="notification-content">
        <h6 className="notification-title">{notification.title}</h6>
        <p className="notification-message">{notification.message}</p>
        <small className="notification-time text-muted">
          {formatTime(notification.created_at)}
        </small>
      </div>
      <div className="notification-actions">
        {!notification.is_read && (
          <button
            className="btn btn-sm btn-outline-primary"
            title="Marcar como lida"
            onClick={() => onMarkAsRead(notification.id)}
          >
            <i className="bi bi-check"></i>
          </button>
        )}
        <button
          className="btn btn-sm btn-outline-danger"
          title="Deletar"
          onClick={() => onDelete(notification.id)}
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['info', 'warning', 'success', 'error']),
    is_read: PropTypes.bool,
    created_at: PropTypes.string
  }).isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

/**
 * Componente Principal - NotificationCenter
 */
const NotificationCenter = ({ userId, position = 'end' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications(userId);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="notification-center" ref={dropdownRef}>
      {/* Ícone sino na navbar */}
      <button
        className="btn btn-link notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} notificações não lidas`}
        aria-label="Notificações"
      >
        <i className="bi bi-bell-fill"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className={`notification-dropdown dropdown-${position}`}>
          {/* Header */}
          <div className="notification-header">
            <h5>Notificações</h5>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button
                  className="btn btn-sm btn-link text-primary"
                  onClick={markAllAsRead}
                  title="Marcar todas como lidas"
                >
                  <small>Marcar como lidas</small>
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <i className="bi bi-inbox"></i>
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                className="btn btn-sm btn-outline-danger w-100"
                onClick={clearAllNotifications}
              >
                <i className="bi bi-trash"></i> Limpar Tudo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

NotificationCenter.propTypes = {
  userId: PropTypes.number.isRequired,
  position: PropTypes.oneOf(['start', 'end']).isRequired
};

NotificationCenter.defaultProps = {
  position: 'end'
};

export default NotificationCenter;
