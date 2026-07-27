// src/components/Sidebar/Sidebar.tsx
// Sidebar principal e moderno. Sidebar.jsx está depreciado.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MenuService } from 'services/MenuService';
import type { MenuGroup } from 'menu';
import SidebarItem from '../SidebarItem';
import './Sidebar.css';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // mobile open state removed (not used)

  // Use sempre userId (number) para buscar o menu
  const userId = user?.userId;

  // Log de depuração: userId e menuGroups
  useEffect(() => {
    console.log('[Sidebar] userId:', userId);
    console.log('[Sidebar] menuGroups:', menuGroups);
  }, [userId, menuGroups]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    const loadMenu = () => {
      setLoading(true);
      MenuService.getMenuGroupsByUser(Number(userId))
        .then(data => { if (mounted) setMenuGroups(data); })
        .catch(() => { if (mounted) setError('Erro ao carregar menu'); })
        .finally(() => { if (mounted) setLoading(false); });
    };

    loadMenu();

    // Recarrega o menu quando a configuração de menu do usuário for atualizada
    const onMenuUpdated = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail || !detail.userId || Number(detail.userId) === Number(userId)) {
          loadMenu();
        }
      } catch (e) {
        loadMenu();
      }
    };
    window.addEventListener('menu-config-updated', onMenuUpdated as EventListener);

    return () => { mounted = false; window.removeEventListener('menu-config-updated', onMenuUpdated as EventListener); };
  }, [userId]);

  // Handler para fechar o menu quando um item é clicado (placeholder)
  const handleItemClick = () => {};

  // ESC fecha o menu (comportamento mobile removido)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">SpDEALER</span>
      </div>
      <nav className="sidebar-nav">
        {loading && <div className="sidebar-loading">Carregando menu...</div>}
        {error && <div className="sidebar-error">{error}</div>}
        <ul>
          {menuGroups.map(group => (
            <li key={group.id} className="sidebar-group">
              <div className="sidebar-group-title">
                {group.icon && <span className={`sidebar-group-icon ${group.icon}`} />}
                <span>{group.name}</span>
              </div>
              {group.items && group.items.length > 0 && (
                <ul className="sidebar-group-items">
                  {group.items.map(item => (
                    <SidebarItem 
                      key={item.id} 
                      item={item} 
                      isActive={false} 
                      onNavigate={navigate}
                      onItemClick={handleItemClick} // ✅ Fechar menu quando item é clicado
                    />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button
          className="sidebar-logout-btn"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}













