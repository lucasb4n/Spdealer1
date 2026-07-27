import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FloatingWindow } from './FloatingWindowManager';
import { faTimes, faWindowMinimize, faWindowRestore } from '@fortawesome/free-solid-svg-icons';

interface TaskbarProps {
  minimizedWindows: FloatingWindow[];
  onRestoreWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
  onMinimizeAll: () => void;
  onRestoreAll: () => void;
  onCloseAll: () => void;
}

const TaskbarContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: rgba(15, 23, 42, 0.98);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  padding: 0 12px;
  z-index: 99999;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
`;

const TaskbarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
`;

const TaskbarSpacer = styled.div`
  flex: 1;
`;

const TaskbarButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: ${props => {
    switch (props.$variant) {
      case 'danger':
        return 'rgba(239, 68, 68, 0.15)';
      case 'secondary':
        return 'rgba(75, 85, 99, 0.3)';
      default:
        return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  color: ${props => props.$variant === 'danger' ? '#fca5a5' : '#e2e8f0'};
  font-size: 11px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: ${props => {
      switch (props.$variant) {
        case 'danger':
          return 'rgba(239, 68, 68, 0.3)';
        case 'secondary':
          return 'rgba(75, 85, 99, 0.5)';
        default:
          return 'rgba(255, 255, 255, 0.12)';
      }
    }};
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    transform: translateY(-1px);
  }

  svg {
    transform: scale(0.85);
  }
`;

const WindowButton = styled(TaskbarButton)`
  background: rgba(13, 148, 136, 0.1);
  border-color: rgba(13, 148, 136, 0.3);
  color: #5eead4;
  max-width: 160px;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 1.5px;
    background: #0d9488;
    transition: width 0.2s ease;
    border-radius: 4px 4px 0 0;
  }

  &:hover {
    background: rgba(13, 148, 136, 0.2);
    border-color: rgba(13, 148, 136, 0.5);
    
    &::after {
      width: 40%;
    }
  }

  .window-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100px;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    margin-left: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(239, 68, 68, 0.5);
      color: #fff;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WindowCount = styled.span`
  background: rgba(13, 148, 136, 0.2);
  color: #5eead4;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid rgba(13, 148, 136, 0.3);
`;

const Taskbar: React.FC<TaskbarProps> = ({
  minimizedWindows,
  onRestoreWindow,
  onCloseWindow,
  onMinimizeAll,
  onRestoreAll,
  onCloseAll
}) => {
  const handleWindowClose = (e: React.MouseEvent, windowId: string) => {
    e.stopPropagation();
    onCloseWindow(windowId);
  };

  return (
    <TaskbarContainer>
      <TaskbarSection>
        {minimizedWindows.map(window => (
          <WindowButton
            key={window.id}
            onClick={() => onRestoreWindow(window.id)}
            title={`Restaurar: ${window.title}`}
          >
            {window.icon && <FontAwesomeIcon icon={window.icon} size="sm" />}
            <span className="window-title">{window.title}</span>
            <span
              className="close-btn"
              onClick={(e) => handleWindowClose(e, window.id)}
              title="Fechar janela"
            >
              <FontAwesomeIcon icon={faTimes} size="xs" />
            </span>
          </WindowButton>
        ))}
      </TaskbarSection>

      <TaskbarSpacer />

      {minimizedWindows.length > 0 && (
        <TaskbarSection>
          <WindowCount>
            {minimizedWindows.length} janela{minimizedWindows.length !== 1 ? 's' : ''}
          </WindowCount>
        </TaskbarSection>
      )}

      <TaskbarSection>
        <ActionButtons>
          <TaskbarButton
            onClick={onMinimizeAll}
            title="Minimizar todas as janelas"
            $variant="secondary"
          >
            <FontAwesomeIcon icon={faWindowMinimize} size="sm" />
          </TaskbarButton>

          {minimizedWindows.length > 0 && (
            <TaskbarButton
              onClick={onRestoreAll}
              title="Restaurar todas as janelas"
            >
              <FontAwesomeIcon icon={faWindowRestore} size="sm" />
              Restaurar
            </TaskbarButton>
          )}

          {minimizedWindows.length > 0 && (
            <TaskbarButton
              onClick={onCloseAll}
              title="Fechar todas as janelas"
              $variant="danger"
            >
              <FontAwesomeIcon icon={faTimes} size="sm" />
              Fechar Todas
            </TaskbarButton>
          )}
        </ActionButtons>
      </TaskbarSection>
    </TaskbarContainer>
  );
};

export { Taskbar };













