// src/components/AppHeader/AppHeader.tsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faBell, faUser, faBook } from '@fortawesome/free-solid-svg-icons';
import UserProfilePanel from './UserProfilePanel';
import { AssetService } from 'services/AssetService';
import './AppHeader.css';

interface AppHeaderProps {
  title?: string;
  sidebarCollapsed?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title = 'SPDealer', sidebarCollapsed = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // O logo agora é gerenciado pelo AssetService ou uma URL padrão premium
  const headerLogoUrl = useMemo(() => AssetService.getLogoUrl('system'), []);

  // Novos estados para data e hora (Removidos do Dashboard para o Header Único)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(currentTime);
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(currentTime);
  }, [currentTime]);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, [currentTime]);

  const firstName = useMemo(() => {
    const name = user?.name || user?.username || 'Usuário';
    return name.split(' ')[0];
  }, [user]);

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };


  const handleMenuItemClick = (path: string) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  return (
    <header className={`app-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <div className="logo-area" onClick={() => navigate('/dashboard')}>
          <div className="premium-logo-wrapper">
            <img 
              src={`${process.env.PUBLIC_URL || ''}/logo-estilizado.png`} 
              alt="SpDealer" 
              style={{ maxHeight: '32px', marginRight: '6px', borderRadius: '4px' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="logo-text-group">
              <span className="logo-main-text">Sp</span>
              <span className="logo-sub-text">Dealer</span>
            </div>
          </div>
          <img src={headerLogoUrl} alt="SPDealer" className="app-logo-hidden" onError={(e) => (e.currentTarget.style.display = 'none')} />
        </div>
        {title && title !== 'SPDealer' && (
          <div className="header-page-context">
            <span className="page-title">{title}</span>
          </div>
        )}
      </div>

      <div className="header-center">
        <div className="welcome-and-time">
          <div className="greeting">
            {greeting}, <span className="user-name">{firstName}</span>!
          </div>
          <div className="date-time-wrapper">
            <span className="header-date">{formattedDate}</span>
            <span className="separator">•</span>
            <span className="header-time">{formattedTime}</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="header-icons">
          <button className="icon-button" title="Manual do Sistema" onClick={() => navigate('/manual')}>
            <FontAwesomeIcon icon={faBook} />
          </button>
          <div className="settings-menu-container" ref={dropdownRef}>
            <button className="icon-button settings-button" title="Configurações" onClick={toggleDropdown}>
              <FontAwesomeIcon icon={faCog} />
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu visible">
                <Link to="/usuarios" className="dropdown-item" onClick={() => handleMenuItemClick('/usuarios')}>
                  Cadastro de Usuários
                </Link>
                <Link to="/grupos" className="dropdown-item" onClick={() => handleMenuItemClick('/grupos')}>
                  Cadastro de Grupos de Usuários
                </Link>
                <Link to="/dashboard-builder" className="dropdown-item" onClick={() => handleMenuItemClick('/dashboard-builder')}>
                  Construtor de Dashboards
                </Link>
                <Link to="/dashboards" className="dropdown-item" onClick={() => handleMenuItemClick('/dashboards')}>
                  Gerenciar Dashboards
                </Link>
              </div>
            )}
          </div>
          <button className="icon-button notification-button" title="Notificações">
            <FontAwesomeIcon icon={faBell} />
            <span className="badge">3</span>
          </button>
          <button 
            className="icon-button user-profile-button" 
            title={`Meu Perfil (${user?.username || ''})`} 
            onClick={() => setShowProfile(true)}
          >
            <FontAwesomeIcon icon={faUser} />
          </button>
        </div>
        {showProfile && user && (
          <UserProfilePanel user={user} onClose={() => setShowProfile(false)} />
        )}
      </div>
    </header>
  );
};

export default AppHeader;













