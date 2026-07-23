import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notify = useCallback((type: NotificationType, message: string, duration = 3000) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, type, message, duration }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
        {notifications.map((n) => (
          <div key={n.id} style={{
            background: n.type === 'success' ? '#22c55e' : n.type === 'error' ? '#ef4444' : n.type === 'info' ? '#2563eb' : '#f59e42',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: 8,
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            opacity: 0.98,
            marginBottom: 10,
            minWidth: 220,
            textAlign: 'center',
          }}>{n.message}</div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};













