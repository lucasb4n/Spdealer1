import React, { useEffect, useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import DynamicDashboard from 'components/DynamicDashboard';
import DashboardSelector from 'components/DashboardSelector';
import { useAuth } from '../contexts/AuthContext';
import type { Dashboard as DashboardType } from 'hooks/useDashboardList';
import { 
  FaChartBar, 
  FaUsers, 
  FaFileInvoiceDollar, 
  FaGears as FaCogs, 
  FaArrowRight 
} from 'react-icons/fa6';

import { useNavigate } from 'react-router-dom';

const ChartBarIcon = FaChartBar as any;
const UsersIcon = FaUsers as any;
const FileInvoiceDollarIcon = FaFileInvoiceDollar as any;
const CogsIcon = FaCogs as any;
const ArrowRightIcon = FaArrowRight as any;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--background-light, #F1F5F9);
  flex: 1;
`;

const GreetingSection = styled.div`
  padding: 28px 32px 20px;
  background: linear-gradient(135deg, #0F172A 0%, #134E4A 50%, #115E59 100%);
  color: #F8FAFC;
  position: relative;
  overflow: hidden;
  animation: ${fadeIn} 0.4s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: -80%;
    right: -20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -50%;
    left: 10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(217, 119, 6, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const GreetingContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
`;

const GreetingText = styled.div`
  flex: 1;
  min-width: 300px;
`;

const GreetingTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
`;

const GreetingSubtitle = styled.p`
  font-size: 14px;
  color: rgba(203, 213, 225, 0.8);
  margin: 0;
  font-weight: 400;
`;

const TimeDisplay = styled.div`
  font-size: 13px;
  color: rgba(203, 213, 225, 0.6);
  margin-top: 8px;
  font-variant-numeric: tabular-nums;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: flex-start;
`;

const QuickActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #E2E8F0;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 200ms ease;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.2);
    color: #F8FAFC;
    transform: translateY(-1px);
  }

  svg {
    font-size: 14px;
    color: var(--primary-300, #5EEAD4);
  }
`;

const SelectorArea = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 32px;
  background: #FFFFFF;
  border-bottom: 1px solid var(--slate-200, #E2E8F0);
  min-height: 40px;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
`;

const SelectorLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--slate-600, #475569);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    color: var(--primary-600, #0D9488);
    font-size: 14px;
  }
`;

const SelectorWrapper = styled.div`
  flex: 1;
  min-width: 200px;
  max-width: 400px;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  width: 100%;
  height: 100%;
`;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFormattedDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
}

function getFormattedTime(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardIdToLoad, setDashboardIdToLoad] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(getFormattedTime());

  const greeting = useMemo(() => getGreeting(), []);
  const dateStr = useMemo(() => getFormattedDate(), []);
  const firstName = useMemo(() => {
    const name = user?.name || user?.username || 'Usuário';
    return name.split(' ')[0];
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getFormattedTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.userId) {
      if (user.defaultDashboardId !== undefined && user.defaultDashboardId !== null) {
        setDashboardIdToLoad(user.defaultDashboardId);
        setLoading(false);
      } else {
        setDashboardIdToLoad(undefined);
        setLoading(false);
      }
    } else {
      setError('Usuário não autenticado. Redirecionando para login.');
      setLoading(false);
    }
  }, [user]);

  const handleDashboardSelect = (selectedDashboard: DashboardType) => {
    setDashboardIdToLoad(selectedDashboard.id);
  };

  const handleDashboardChange = (dashboardId: number) => {
    setDashboardIdToLoad(dashboardId);
  };

  if (loading) {
    return (
      <DashboardContainer style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--slate-500)', fontSize: 14 }}>Carregando dashboard...</div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--danger)', fontSize: 14 }}>Erro: {error}</div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Dashboard Selector */}
      <SelectorArea>
        <SelectorLabel>
          <ChartBarIcon />
          Dashboard:
        </SelectorLabel>
        <SelectorWrapper>
          <DashboardSelector
            userId={user?.userId ? Number(user.userId) : undefined}
            currentDashboardId={dashboardIdToLoad}
            onDashboardSelect={handleDashboardSelect}
          />
        </SelectorWrapper>
      </SelectorArea>

      {/* Dashboard Content */}
      <ContentArea>
        <DynamicDashboard
          userId={user?.userId ? Number(user.userId) : undefined}
          dashboardId={dashboardIdToLoad}
          dashboardName="Workspace"
          onDashboardChange={handleDashboardChange}
        />
      </ContentArea>
    </DashboardContainer>
  );
};

export default Dashboard;













