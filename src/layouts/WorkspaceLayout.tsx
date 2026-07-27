import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CollapsibleSidebar } from 'components/TabSystem/CollapsibleSidebar';
import { Modal } from 'components/Modal/Modal';
import { FloatingWindowManager } from 'components/TabSystem/FloatingWindowManager';
import { Taskbar } from 'components/TabSystem/Taskbar';
import { useFloatingWindows, FloatingWindowsProvider } from '../contexts/FloatingWindowsContext';
import AppHeader from 'components/AppHeader/AppHeader';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

const WorkspaceContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--background-light, #F1F5F9);
`;

const MainContent = styled.div<{ $sidebarCollapsed: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  min-width: 0;
  background: var(--background-light, #F1F5F9);
  overflow: hidden;
  padding: 0;
  padding-top: var(--header-height, 64px);
  margin: 0;
  margin-left: ${props => props.$sidebarCollapsed ? 'var(--sidebar-width-collapsed, 68px)' : 'var(--sidebar-width, 260px)'};
  transition: all var(--transition-slow, 300ms ease);
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  margin: 0;
`;

const DefaultContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  background: transparent;
  overflow: auto;
  box-sizing: border-box;
`;

const WelcomeTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--slate-800, #1E293B);
  margin-bottom: 12px;
  text-align: center;
  letter-spacing: -0.01em;
`;

const WelcomeText = styled.p`
  font-size: 16px;
  color: var(--slate-500, #64748B);
  margin-bottom: 32px;
  text-align: center;
  line-height: 1.6;
  max-width: 500px;
`;

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/usuarios': 'Usuários',
  '/grupos': 'Grupos',
  '/dashboards': 'Dashboards',
  '/financeiro': 'Financeiro',
  '/financeiro/relatorio': 'Relatório Financeiro',
  '/dashboard-builder': 'Dashboard Builder',
  '/workspace': 'Workspace',
};

interface WorkspaceLayoutProps {
  children?: React.ReactNode;
}

const WorkspaceLayoutContent: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || 'SPDealer';

  const {
    windows,
    minimizedWindows,
    closeWindow,
    updateWindow,
    minimizeAll,
    restoreAll,
    closeAll
  } = useFloatingWindows();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [popupMenu, setPopupMenu] = React.useState<{title: string, links: any[]} | null>(null);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleMenuItemClick = async (item: any) => {
    const rawPath = item.route || item.path || item.rota;

    if (item.filhos && item.filhos.length > 0) {
      setPopupMenu({
        title: item.descricao || item.nome,
        links: item.filhos
      });
      return;
    }

    const normalizePath = async (p: string | undefined) => {
      if (!p) return undefined;
      if (p.includes('flow-builder-editor')) return p.replace('flow-builder-editor', 'form-builder-editor');
      if (p.includes('report-builder') || p.includes('report-build')) return '/ferramentas/sql-editor';
      if (p === '/parametros/dictionary' || p === '/parametros/dictionary/') {
        try {
          const resp = await fetch('/api/dictionary/tables');
          if (resp.ok) {
            const tables = await resp.json();
            if (Array.isArray(tables) && tables.length > 0) {
              const first = tables[0];
              if (first?.frontend_route) return first.frontend_route;
              if (first?.table_name) return `/parametros/dictionary/${first.table_name}/localizar`;
            }
          }
        } catch (e) { /* ignore */ }
        return undefined;
      }
      return p;
    };

    const target = await normalizePath(rawPath);
    if (target) {
      navigate(target);
      setPopupMenu(null);
      return;
    }

    setPopupMenu(null);
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair do sistema?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <WorkspaceContainer>
      <CollapsibleSidebar
        onMenuItemClick={handleMenuItemClick}
        onLogout={handleLogout}
        sidebarCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />
      <MainContent $sidebarCollapsed={sidebarCollapsed}>
        <AppHeader title={currentTitle} sidebarCollapsed={sidebarCollapsed} />
        <ContentWrapper>
          {children || (
            <DefaultContent>
              <WelcomeTitle>Bem-vindo ao SPDealer</WelcomeTitle>
              <WelcomeText>
                Seu sistema completo de gestão empresarial.
                Escolha uma das opções do menu lateral para começar.
              </WelcomeText>
            </DefaultContent>
          )}
        </ContentWrapper>
        {/* Modal para links com navegação */}
        {popupMenu && (
          <Modal isOpen={!!popupMenu} onClose={() => setPopupMenu(null)} title={popupMenu.title}>
            <div style={{ padding: 20, minWidth: 320 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {popupMenu.links && Array.isArray(popupMenu.links) && popupMenu.links.map((link: any) => {
                  const linkPath = link.route || link.path || link.rota;
                  const linkLabel = link.nome || link.descricao || link.name || '';
                  if (!linkPath || linkPath.trim() === '') return null;
                  return (
                    <li key={link.id} style={{ marginBottom: 8 }}>
                      <button
                        onClick={() => {
                          navigate(linkPath);
                          setPopupMenu(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 14,
                          color: 'var(--primary-700, #0F766E)',
                          textDecoration: 'none',
                          fontWeight: 500,
                          fontFamily: 'Inter, sans-serif',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '10px 12px',
                          width: '100%',
                          borderRadius: '8px',
                          transition: 'background 150ms ease, color 150ms ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'var(--primary-50, #F0FDFA)';
                          e.currentTarget.style.color = 'var(--primary-800, #115E59)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = 'var(--primary-700, #0F766E)';
                        }}
                      >
                        <FontAwesomeIcon icon={typeof link.icon === 'object' ? link.icon : faCogs} style={{ marginRight: 10, fontSize: 14 }} />
                        {linkLabel}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Modal>
        )}
      </MainContent>

      <FloatingWindowManager
        windows={windows}
        onWindowClose={closeWindow}
        onWindowUpdate={updateWindow}
      />

      <Taskbar
        minimizedWindows={minimizedWindows}
        onRestoreWindow={(windowId) => updateWindow(windowId, { isMinimized: false })}
        onCloseWindow={closeWindow}
        onMinimizeAll={minimizeAll}
        onRestoreAll={restoreAll}
        onCloseAll={closeAll}
      />
    </WorkspaceContainer>
  );
};

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  return (
    <FloatingWindowsProvider>
      <WorkspaceLayoutContent>{children}</WorkspaceLayoutContent>
    </FloatingWindowsProvider>
  );
};













