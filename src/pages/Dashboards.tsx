import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faStar,
  faEye,
  faCog,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
// import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Dashboard {
  id: number;
  name: string;
  description?: string;
  config: any;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Styled Components
const DashboardsContainer = styled.div`
  padding: 24px;
  background-color: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #2563eb;
          color: white;
          &:hover { background: #1d4ed8; }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background: #e5e7eb; }
        `;
    }
  }}
`;

const DashboardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const DashboardCard = styled.div<{ isDefault?: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid ${props => props.isDefault ? '#2563eb' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const DashboardCardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const DashboardIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
`;

const DashboardInfo = styled.div`
  flex: 1;
  margin-left: 16px;
`;

const DashboardName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const DashboardDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
`;

const DashboardBadge = styled.span<{ type: 'default' | 'active' }>`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  
  ${props => props.type === 'default' ? `
    background: #dbeafe;
    color: #1e40af;
  ` : `
    background: #d1fae5;
    color: #065f46;
  `}
`;

const DashboardMeta = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
`;

const DashboardDate = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const DashboardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: #2563eb;
    color: white;
    &:hover { background: #1d4ed8; }
  ` : props.$variant === 'danger' ? `
    background: #ef4444;
    color: white;
    &:hover { background: #dc2626; }
  ` : `
    background: #f3f4f6;
    color: #6b7280;
    &:hover { background: #e5e7eb; color: #374151; }
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateText = styled.div`
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const EmptyStateDescription = styled.div`
  font-size: 14px;
  margin-bottom: 24px;
`;

function Dashboards() {
  // ...existing code...
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/v2/dashboards`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboards(data);
      } else {
        console.error('Error loading dashboards:', response.statusText);
        setDashboards([]);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const createNewDashboard = () => {
    // Navigate to create new dashboard (you can implement a modal or separate page)
    navigate('/dashboard-builder');
  };

  const viewDashboard = (dashboard: Dashboard) => {
    // Navigate to view dashboard with specific ID
    navigate(`/dashboard?id=${dashboard.id}`);
  };

  const editDashboard = (dashboard: Dashboard) => {
    // Navigate to dashboard builder with specific dashboard ID
    navigate(`/dashboard-builder?id=${dashboard.id}`);
  };

  const setAsDefault = async (dashboard: Dashboard) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/v2/dashboards/${dashboard.id}/set-default`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh dashboards list
        fetchDashboards();
      } else {
        console.error('Error setting dashboard as default');
      }
    } catch (error) {
      console.error('Error setting dashboard as default:', error);
    }
  };

  const deleteDashboard = async (dashboard: Dashboard) => {
    if (dashboard.isDefault) {
      alert('Não é possível excluir o dashboard padrão');
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir o dashboard "${dashboard.name}"?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/v2/dashboards/${dashboard.id}` , {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // Refresh dashboards list
          fetchDashboards();
        } else {
          console.error('Error deleting dashboard');
        }
      } catch (error) {
        console.error('Error deleting dashboard:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardsContainer>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          Carregando dashboards...
        </div>
      </DashboardsContainer>
    );
  }

  return (
    <DashboardsContainer>
      <Header>
        <Title>Meus Dashboards</Title>
        <HeaderActions>
          <ActionButton $variant="primary" onClick={createNewDashboard}>
            <FontAwesomeIcon icon={faPlus} />
            Novo Dashboard
          </ActionButton>
        </HeaderActions>
      </Header>

      {dashboards.length === 0 ? (
        <EmptyState>
          <EmptyStateIcon>
            <FontAwesomeIcon icon={faChartLine} />
          </EmptyStateIcon>
          <EmptyStateText>Nenhum dashboard encontrado</EmptyStateText>
          <EmptyStateDescription>
            Crie seu primeiro dashboard para começar a visualizar seus dados
          </EmptyStateDescription>
          <ActionButton $variant="primary" onClick={createNewDashboard}>
            <FontAwesomeIcon icon={faPlus} />
            Criar Primeiro Dashboard
          </ActionButton>
        </EmptyState>
      ) : (
        <DashboardsGrid>
          {dashboards.map((dashboard) => (
            <DashboardCard 
              key={dashboard.id} 
              isDefault={dashboard.isDefault}
              onClick={() => viewDashboard(dashboard)}
            >
              <DashboardCardHeader>
                <DashboardIcon>
                  <FontAwesomeIcon icon={faChartLine} />
                </DashboardIcon>
                <DashboardInfo>
                  <DashboardName>{dashboard.name}</DashboardName>
                  <DashboardDescription>
                    {dashboard.description || 'Sem descrição'}
                  </DashboardDescription>
                </DashboardInfo>
                {dashboard.isDefault && (
                  <DashboardBadge type="default">
                    <FontAwesomeIcon icon={faStar} style={{ marginRight: '4px' }} />
                    Padrão
                  </DashboardBadge>
                )}
              </DashboardCardHeader>
              
              <DashboardMeta>
                <DashboardDate>
                  Atualizado em {formatDate(dashboard.updatedAt)}
                </DashboardDate>
                <DashboardActions onClick={(e) => e.stopPropagation()}>
                  <IconButton 
                    $variant="secondary" 
                    onClick={() => viewDashboard(dashboard)}
                    title="Visualizar"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </IconButton>
                  <IconButton 
                    $variant="primary" 
                    onClick={() => editDashboard(dashboard)}
                    title="Editar"
                  >
                    <FontAwesomeIcon icon={faCog} />
                  </IconButton>
                  {!dashboard.isDefault && (
                    <>
                      <IconButton 
                        $variant="secondary" 
                        onClick={() => setAsDefault(dashboard)}
                        title="Definir como padrão"
                      >
                        <FontAwesomeIcon icon={faStar} />
                      </IconButton>
                      <IconButton 
                        $variant="danger" 
                        onClick={() => deleteDashboard(dashboard)}
                        title="Excluir"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </IconButton>
                    </>
                  )}
                </DashboardActions>
              </DashboardMeta>
            </DashboardCard>
          ))}
        </DashboardsGrid>
      )}
    </DashboardsContainer>
  );
}

export default Dashboards;













