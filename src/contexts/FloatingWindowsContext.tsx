import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FloatingWindow } from 'components/TabSystem/FloatingWindowManager';

interface WindowState extends FloatingWindow {
  zIndex: number;
}

interface FloatingWindowsContextType {
  windows: WindowState[];
  minimizedWindows: WindowState[];
  createWindow: (
    title: string,
    component: React.ReactNode,
    options?: {
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      icon?: any;
    }
  ) => string;
  closeWindow: (windowId: string) => void;
  updateWindow: (windowId: string, updates: Partial<WindowState>) => void;
  minimizeAll: () => void;
  restoreAll: () => void;
  closeAll: () => void;
}

const FloatingWindowsContext = createContext<FloatingWindowsContextType | undefined>(undefined);

interface FloatingWindowsProviderProps {
  children: ReactNode;
}

export const FloatingWindowsProvider: React.FC<FloatingWindowsProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextId, setNextId] = useState(1);
  const [highestZIndex, setHighestZIndex] = useState(1001);

  const createWindow = useCallback((
    title: string,
    component: React.ReactNode,
    options?: {
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      icon?: any;
    }
  ) => {
    const id = `window-${nextId}`;
    setNextId(prev => prev + 1);
    
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);

    const newWindow: WindowState = {
      id,
      title,
      component,
      x: options?.x ?? Math.random() * 200 + 50,
      y: options?.y ?? Math.random() * 100 + 50,
      width: options?.width ?? 1200,
      height: options?.height ?? 750,
      isMaximized: false,
      isMinimized: false,
      icon: options?.icon,
      zIndex: newZIndex
    };

    setWindows(prev => [...prev, newWindow]);
    return id;
  }, [nextId, highestZIndex]);

  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
  }, []);

  const updateWindow = useCallback((windowId: string, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, ...updates } : w
    ));
  }, []);

  const minimizeAll = useCallback(() => {
    setWindows(prev => prev.map(w => ({ ...w, isMinimized: true })));
  }, []);

  const restoreAll = useCallback(() => {
    setWindows(prev => prev.map(w => ({ ...w, isMinimized: false })));
  }, []);

  const closeAll = useCallback(() => {
    setWindows([]);
  }, []);

  const minimizedWindows = windows.filter(w => w.isMinimized);

  const value: FloatingWindowsContextType = {
    windows,
    minimizedWindows,
    createWindow,
    closeWindow,
    updateWindow,
    minimizeAll,
    restoreAll,
    closeAll
  };

  return (
    <FloatingWindowsContext.Provider value={value}>
      {children}
    </FloatingWindowsContext.Provider>
  );
};

export const useFloatingWindows = (): FloatingWindowsContextType => {
  const context = useContext(FloatingWindowsContext);
  if (context === undefined) {
    throw new Error('useFloatingWindows must be used within a FloatingWindowsProvider');
  }
  return context;
};













