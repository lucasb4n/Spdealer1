import { useState, useCallback } from 'react';
import { FloatingWindow } from 'components/TabSystem/FloatingWindowManager';

interface WindowState extends FloatingWindow {
  zIndex: number;
}

export const useFloatingWindows = () => {
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

  const bringToFront = useCallback((windowId: string) => {
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    updateWindow(windowId, { zIndex: newZIndex });
  }, [highestZIndex, updateWindow]);

  const minimizeAll = useCallback(() => {
    setWindows(prev => prev.map(w => ({ ...w, isMinimized: true })));
  }, []);

  const restoreAll = useCallback(() => {
    setWindows(prev => prev.map(w => ({ ...w, isMinimized: false })));
  }, []);

  const closeAll = useCallback(() => {
    setWindows([]);
  }, []);

  const getWindow = useCallback((windowId: string) => {
    return windows.find(w => w.id === windowId);
  }, [windows]);

  const hasWindows = windows.length > 0;
  const visibleWindows = windows.filter(w => !w.isMinimized);
  const minimizedWindows = windows.filter(w => w.isMinimized);

  return {
    windows,
    createWindow,
    closeWindow,
    updateWindow,
    bringToFront,
    minimizeAll,
    restoreAll,
    closeAll,
    getWindow,
    hasWindows,
    visibleWindows,
    minimizedWindows
  };
};













