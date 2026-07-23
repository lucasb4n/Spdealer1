// src/pages/ToolsTaskManager.tsx
/**
 * Página de Gerenciador de Tarefas (Kanban)
 * Integrada ao menu: Parametros → Ferramentas → Gerenciador de Tarefas
 * 
 * Responsabilidades:
 * - Renderizar componente KanbanBoard
 * - Verificar autenticação do usuário
 * - Gerenciar estado global de tarefas
 * - Integração com contextos de notificação
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import TaskManagerKanban from 'components/TaskManager/TaskManagerKanban';
import { useAuth } from '../contexts/AuthContext'; // Ajustar import conforme seu projeto
import { useFloatingWindows } from '../contexts/FloatingWindowsContext';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
`;

const PageHeader = styled.header`
  background: white;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  color: #333;
  
  small {
    display: block;
    font-size: 14px;
    color: #999;
    margin-top: 5px;
  }
`;

const PageContent = styled.main`
  flex: 1;
  overflow: hidden;
  padding: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
  color: #999;
`;

const ToolsTaskManager: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const { windows, createWindow, closeWindow } = useFloatingWindows();
  const [windowId, setWindowId] = useState<string | null>(null);
  const createdRef = React.useRef(false);
  const windowIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Abrir o Kanban em janela flutuante (uma única instância) — criar apenas uma vez quando o carregamento terminar
  useEffect(() => {
    if (isLoading) return;
    if (createdRef.current) return;

    // verificar se já existe uma janela com este título
    const existing = windows.find(w => w.title === 'Gerenciador de Tickets');
    if (existing) {
      setWindowId(existing.id);
      windowIdRef.current = existing.id;
      createdRef.current = true;
      return;
    }

    const id = createWindow('Gerenciador de Tickets', <TaskManagerKanban /> , { width: 1200, height: 750 });
    setWindowId(id);
    windowIdRef.current = id;
    createdRef.current = true;
    // NOTA: não fechamos a janela aqui no cleanup, para evitar fechar/reativar em loop quando o provider atualizar `windows`.
  }, [isLoading, windows, createWindow]);

  // Fechar a janela apenas no unmount da página
  useEffect(() => {
    return () => {
      const id = windowIdRef.current;
      if (id) {
        try { closeWindow(id); } catch (e) { /* ignore */ }
      }
    };
  }, [closeWindow]);

  // Handler global para ESC fechar a janela do Kanban
  useEffect(() => {
    if (!windowId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWindow(windowId);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [windowId, closeWindow]);

  // Verificar autenticação
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader>
          <PageTitle>
            Gerenciador de Tarefas
            <small>Carregando...</small>
          </PageTitle>
        </PageHeader>
        <PageContent>
          <LoadingContainer>Carregando kanban...</LoadingContainer>
        </PageContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Oculta header da página quando a janela flutuante do Kanban estiver aberta */}
      {!windowId && (
        <PageHeader>
          <PageTitle>
            Gerenciador de Tarefas
            <small>Janela flutuante</small>
          </PageTitle>
        </PageHeader>
      )}
      <PageContent>
        {/* A janela principal do Kanban é aberta via FloatingWindowsProvider. */}
        {!windowId && (
          <LoadingContainer>
            <div>
              Kanban não aberto. <button onClick={() => {
                const id = createWindow('Gerenciador de Tickets', <TaskManagerKanban /> , { width: 1200, height: 750 });
                setWindowId(id);
              }}>Abrir Gerenciador de Tickets</button>
            </div>
          </LoadingContainer>
        )}
      </PageContent>
    </PageContainer>
  );
};

export default ToolsTaskManager;













