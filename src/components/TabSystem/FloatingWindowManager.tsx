import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faMinus, faCompress, faExpand } from '@fortawesome/free-solid-svg-icons'; 

interface FloatingWindow {
  id: string;
  title: string;
  component: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  icon?: any;
}

interface FloatingWindowManagerProps {
  windows: FloatingWindow[];
  onWindowClose: (windowId: string) => void;
  onWindowUpdate: (windowId: string, updates: Partial<FloatingWindow>) => void;
}

const WindowOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
`;

const WindowContainer = styled.div<{ 
  x: number; 
  y: number; 
  width: number; 
  height: number; 
  $isMaximized: boolean;
  $isMinimized: boolean;
  $zIndex: number;
}>`
  position: absolute;
  left: ${props => props.$isMaximized ? 0 : props.x}px;
  top: ${props => props.$isMaximized ? 0 : props.y}px;
  width: ${props => props.$isMaximized ? '100vw' : props.width}px;
  height: ${props => props.$isMaximized ? '100vh' : (props.$isMinimized ? 'auto' : props.height)}px;
  background: #fff;
  border-radius: ${props => props.$isMaximized ? 0 : 8}px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  z-index: ${props => props.$zIndex};
  display: ${props => props.$isMinimized ? 'none' : 'flex'};
  flex-direction: column;
  overflow: hidden;
  transition: ${props => props.$isMaximized ? 'all 0.3s ease' : 'none'};
`;

const WindowHeader = styled.div<{ $isDragging: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
  user-select: none;
  border-radius: 8px 8px 0 0;
`;

const WindowTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const WindowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WindowActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  &.close:hover {
    background: #ef4444;
    color: #fff;
  }
`;

const WindowContent = styled.div`
  flex: 1;
  overflow: auto;
  background: #fff;
`;

const ResizeHandle = styled.div<{ $position: string }>`
  position: absolute;
  background: transparent;
  
  ${props => {
    switch (props.$position) {
      case 'n':
        return 'top: -3px; left: 3px; right: 3px; height: 6px; cursor: n-resize;';
      case 's':
        return 'bottom: -3px; left: 3px; right: 3px; height: 6px; cursor: s-resize;';
      case 'e':
        return 'right: -3px; top: 3px; bottom: 3px; width: 6px; cursor: e-resize;';
      case 'w':
        return 'left: -3px; top: 3px; bottom: 3px; width: 6px; cursor: w-resize;';
      case 'ne':
        return 'top: -3px; right: -3px; width: 6px; height: 6px; cursor: ne-resize;';
      case 'nw':
        return 'top: -3px; left: -3px; width: 6px; height: 6px; cursor: nw-resize;';
      case 'se':
        return 'bottom: -3px; right: -3px; width: 6px; height: 6px; cursor: se-resize;';
      case 'sw':
        return 'bottom: -3px; left: -3px; width: 6px; height: 6px; cursor: sw-resize;';
      default:
        return '';
    }
  }}
`;

const FloatingWindowManager: React.FC<FloatingWindowManagerProps> = ({
  windows,
  onWindowClose,
  onWindowUpdate
}) => {
  const [dragging, setDragging] = useState<{ windowId: string; startX: number; startY: number } | null>(null);
  const [resizing, setResizing] = useState<{ windowId: string; handle: string; startX: number; startY: number } | null>(null);
  const [highestZIndex, setHighestZIndex] = useState(1001);

  const handleMouseDown = (e: React.MouseEvent, windowId: string, action: 'drag' | 'resize', handle?: string) => {
    e.preventDefault();
    
    // Trazer janela para frente
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    onWindowUpdate(windowId, { zIndex: newZIndex } as any);

    if (action === 'drag') {
      setDragging({
        windowId,
        startX: e.clientX,
        startY: e.clientY
      });
    } else if (action === 'resize' && handle) {
      setResizing({
        windowId,
        handle,
        startX: e.clientX,
        startY: e.clientY
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const window = windows.find(w => w.id === dragging.windowId);
        if (window && !window.isMaximized) {
          const deltaX = e.clientX - dragging.startX;
          const deltaY = e.clientY - dragging.startY;
          
          onWindowUpdate(dragging.windowId, {
            x: Math.max(0, window.x + deltaX),
            y: Math.max(0, window.y + deltaY)
          });
          
          setDragging({
            ...dragging,
            startX: e.clientX,
            startY: e.clientY
          });
        }
      }

      if (resizing) {
        const window = windows.find(w => w.id === resizing.windowId);
        if (window && !window.isMaximized) {
          const deltaX = e.clientX - resizing.startX;
          const deltaY = e.clientY - resizing.startY;
          
          let updates: Partial<FloatingWindow> = {};
          
          // Lógica de redimensionamento baseada no handle
          if (resizing.handle.includes('e')) {
            updates.width = Math.max(300, window.width + deltaX);
          }
          if (resizing.handle.includes('s')) {
            updates.height = Math.max(200, window.height + deltaY);
          }
          if (resizing.handle.includes('w')) {
            const newWidth = Math.max(300, window.width - deltaX);
            updates.width = newWidth;
            updates.x = window.x + (window.width - newWidth);
          }
          if (resizing.handle.includes('n')) {
            const newHeight = Math.max(200, window.height - deltaY);
            updates.height = newHeight;
            updates.y = window.y + (window.height - newHeight);
          }
          
          onWindowUpdate(resizing.windowId, updates);
          
          setResizing({
            ...resizing,
            startX: e.clientX,
            startY: e.clientY
          });
        }
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };

    if (dragging || resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, windows, onWindowUpdate]);

  const toggleMaximize = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (window) {
      onWindowUpdate(windowId, {
        isMaximized: !window.isMaximized
      });
    }
  };

  const toggleMinimize = (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (window) {
      onWindowUpdate(windowId, {
        isMinimized: !window.isMinimized
      });
    }
  };

  return (
    <WindowOverlay>
      {windows.map(window => (
        <WindowContainer
          key={window.id}
          x={window.x}
          y={window.y}
          width={window.width}
          height={window.height}
          $isMaximized={window.isMaximized}
          $isMinimized={window.isMinimized}
          $zIndex={(window as any).zIndex || 1001}
        >
          <WindowHeader
            $isDragging={dragging?.windowId === window.id}
            onMouseDown={(e) => handleMouseDown(e, window.id, 'drag')}
          >
            <WindowTitle>
              {window.icon && <FontAwesomeIcon icon={window.icon} size="sm" />}
              {window.title}
            </WindowTitle>
            
            <WindowActions>
              <WindowActionButton
                onClick={() => toggleMinimize(window.id)}
                title="Minimizar"
              >
                <FontAwesomeIcon icon={faMinus} size="xs" />
              </WindowActionButton>
              
              <WindowActionButton
                onClick={() => toggleMaximize(window.id)}
                title={window.isMaximized ? "Restaurar" : "Maximizar"}
              >
                <FontAwesomeIcon icon={window.isMaximized ? faCompress : faExpand} size="xs" />
              </WindowActionButton>
              
              <WindowActionButton
                className="close"
                onClick={() => onWindowClose(window.id)}
                title="Fechar"
              >
                <FontAwesomeIcon icon={faTimes} size="xs" />
              </WindowActionButton>
            </WindowActions>
          </WindowHeader>

          <WindowContent>
            {window.component}
          </WindowContent>

          {!window.isMaximized && !window.isMinimized && (
            <>
              {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(handle => (
                <ResizeHandle
                  key={handle}
                  $position={handle}
                  onMouseDown={(e) => handleMouseDown(e, window.id, 'resize', handle)}
                />
              ))}
            </>
          )}
        </WindowContainer>
      ))}
    </WindowOverlay>
  );
};

export { FloatingWindowManager };
export type { FloatingWindow };













