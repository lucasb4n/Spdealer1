// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthUser, ClientSideDashboardConfig } from 'dashboard';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
  updateDefaultDashboardId: (dashboardId: number | undefined) => void;
  updateDashboardConfig: (config: ClientSideDashboardConfig | undefined) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para carregar o usuário do localStorage no montagem inicial
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        console.log('[AUTH] Usuário carregado do localStorage:', parsedUser);
        
        // Se dashboardConfig for uma string no localStorage, tenta parsear para objeto
        if (parsedUser.dashboardConfig && typeof parsedUser.dashboardConfig === 'string') {
          try {
            parsedUser.dashboardConfig = JSON.parse(parsedUser.dashboardConfig as string);
          } catch (e) {
            console.error("[AUTH] Erro ao parsear dashboardConfig do localStorage:", e);
            parsedUser.dashboardConfig = undefined; // Limpa se estiver corrompido
          }
        }
        setUser(parsedUser);
      } else {
        console.log('[AUTH] Nenhum usuário encontrado no localStorage.');
      }
    } catch (error) {
      console.error("Falha ao parsear usuário do localStorage:", error);
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função de login: armazena o usuário no estado e no localStorage
  const login = useCallback((userData: AuthUser) => {
    // AQUI ESTÁ A CORREÇÃO: Cria um objeto temporário para localStorage com dashboardConfig stringificado
    // Use um objeto plain para localStorage para evitar conflitos de tipagem
    const userForLocalStorage: any = { ...userData };
    if (userForLocalStorage.dashboardConfig && typeof userForLocalStorage.dashboardConfig === 'object') {
      userForLocalStorage.dashboardConfig = JSON.stringify(userForLocalStorage.dashboardConfig);
    }

    // O estado 'user' no React mantém dashboardConfig como objeto (ClientSideDashboardConfig)
    setUser(userData); 
    // O localStorage recebe o objeto com dashboardConfig stringificado
    localStorage.setItem('user', JSON.stringify(userForLocalStorage));

    console.log('[AUTH] Usuário salvo no login:', userData);
    console.log('[AUTH] Conteúdo atual do localStorage.user:', localStorage.getItem('user'));
  }, []);

  // Função de logout: remove o usuário do estado e do localStorage
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    console.log('[AUTH] Usuário deslogado. localStorage.user removido.');
  }, []);

  // Função para atualizar apenas o defaultDashboardId do usuário
  const updateDefaultDashboardId = useCallback((dashboardId: number | undefined) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, defaultDashboardId: dashboardId };
      
      // AQUI ESTÁ A CORREÇÃO: Cria objeto temporário para localStorage com dashboardConfig stringificado
      const userForLocalStorage: any = { ...updatedUser };
      if (userForLocalStorage.dashboardConfig && typeof userForLocalStorage.dashboardConfig === 'object') {
        userForLocalStorage.dashboardConfig = JSON.stringify(userForLocalStorage.dashboardConfig);
      }
      localStorage.setItem('user', JSON.stringify(userForLocalStorage));
      
      console.log(`[AUTH] defaultDashboardId atualizado para: ${dashboardId}`);
      return updatedUser;
    });
  }, []);

  // Função para atualizar apenas o dashboardConfig do usuário
  const updateDashboardConfig = useCallback((config: ClientSideDashboardConfig | undefined) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, dashboardConfig: config };

      // AQUI ESTÁ A CORREÇÃO: Cria objeto temporário para localStorage com dashboardConfig stringificado
      const userForLocalStorage: any = { ...updatedUser };
      if (userForLocalStorage.dashboardConfig && typeof userForLocalStorage.dashboardConfig === 'object') {
        userForLocalStorage.dashboardConfig = JSON.stringify(userForLocalStorage.dashboardConfig);
      }
      localStorage.setItem('user', JSON.stringify(userForLocalStorage));

      console.log(`[AUTH] dashboardConfig atualizado.`);
      return updatedUser;
    });
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const memoizedValue = useMemo(() => ({
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
    updateDefaultDashboardId,
    updateDashboardConfig,
  }), [user, isAuthenticated, login, logout, isLoading, updateDefaultDashboardId, updateDashboardConfig]);

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
};













