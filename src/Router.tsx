// src/Router.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import App from './App';
import Login from 'pages/Login';
import { NotificationProvider } from './contexts/NotificationContext';

// Componente de rota protegida usando o contexto
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-fullscreen">Carregando autenticação...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota de Login */}
          <Route path="/login" element={
            <NotificationProvider>
              <Login />
            </NotificationProvider>
          } />
          {/* Rotas Protegidas */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;













