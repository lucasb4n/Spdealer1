import React, { useEffect } from 'react';
import './UserProfilePanel.css';

interface UserProfilePanelProps {
  user: { username: string; name: string; email?: string };
  onClose: () => void;
}

const UserProfilePanel: React.FC<UserProfilePanelProps> = ({ user, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="user-profile-panel-float">
      <div className="user-profile-panel-content">
        <div className="user-profile-panel-header">
          <span>Perfil do Usuário</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="user-profile-panel-body">
          <div><b>Usuário:</b> {user.username}</div>
          <div><b>Nome:</b> {user.name}</div>
          {user.email && <div><b>Email:</b> {user.email}</div>}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePanel;













