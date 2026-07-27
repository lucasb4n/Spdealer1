import React, { useState, useEffect } from 'react';
// import './Header.css';  // ← DEPRECATED: Remover header.css. Estilos agora vêm de AppHeader.css
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faUser } from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
  sidebarCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, sidebarCollapsed }) => {
  const { user } = useAuth();
  const [showUserPopup, setShowUserPopup] = useState(false);

  useEffect(() => {
    if (!showUserPopup) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserPopup(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showUserPopup]);


  // Usa a variável CSS --sidebar-width para garantir alinhamento imediato
  const headerLeft = 'calc(var(--sidebar-width, 250px) + 8px)';

  return (
    <>
      <div
        className={`app-header${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}
        style={{
          left: headerLeft
        }}
      >
        <div className="header-left">
          <img src={process.env.PUBLIC_URL + '/logo.jpg'} alt="Logo da Empresa" className="header-logo" />
          <h2 className="header-title" style={{ marginLeft: 12 }}>{title}</h2>
        </div>
        <div className="header-right">
          <button className="header-icon-btn" title="Notificações">
            <FontAwesomeIcon icon={faBell} />
            <span className="header-badge">5</span>
          </button>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className="header-icon-btn" title="Usuário" onClick={() => setShowUserPopup(v => !v)}>
              <FontAwesomeIcon icon={faUser} />
            </button>
          </div>
        </div>
      </div>
      {showUserPopup && (
        <div
          className="user-popup-float"
          tabIndex={-1}
          style={{
            position: 'fixed',
            top: 64,
            right: 32,
            zIndex: 1200
          }}
        >
          <div className="user-popup-panel">
            <button className="popup-close" onClick={() => setShowUserPopup(false)} title="Fechar">×</button>
            <div className="popup-title">{user?.name || 'Usuário'}</div>
            <div className="popup-label">Cargo</div>
            <div className="popup-info">{user?.role || '-'}</div>
            <div className="popup-label">Email</div>
            <div className="popup-info">{user?.email || '-'}</div>
            <div className="popup-label">Celular</div>
            <div className="popup-info">{user?.celular || '-'}</div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;













