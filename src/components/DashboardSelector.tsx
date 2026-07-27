import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faStar, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useDashboardList, Dashboard } from 'hooks/useDashboardList';

interface DashboardSelectorProps {
  userId?: number | string;
  currentDashboardId?: number;
  onDashboardSelect: (dashboard: Dashboard) => void;
}

// Styled Components

const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  flex: 1;
  min-width: 200px;
`;

const DropdownButton = styled.button<{ $isOpen?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #adb5bd;
    background-color: #f8f9fa;
  }

  &:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  ${(p) => p.$isOpen && `
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  `}
`;

const DropdownIcon = styled.span<{ $isOpen?: boolean }>`
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s ease-in-out;
  transform: ${(p) => (p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  color: #6c757d;
`;

const DropdownContent = styled.div<{ $isOpen?: boolean }>`
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  display: ${(p) => (p.$isOpen ? 'block' : 'none')};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;

    &:hover {
      background: #555;
    }
  }
`;

const DropdownItem = styled.button<{ $isActive?: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: none;
  background-color: ${(p) => (p.$isActive ? '#e7f1ff' : '#ffffff')};
  color: #212529;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.15s ease-in-out;
  border-left: 3px solid ${(p) => (p.$isActive ? '#0d6efd' : 'transparent')};

  &:first-child {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  &:last-child {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  &:hover {
    background-color: #f8f9fa;
  }

  &:active {
    background-color: #e7f1ff;
  }
`;

const DashboardItemContent = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;

const DashboardItemText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const DashboardItemName = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DashboardItemDesc = styled.span`
  font-size: 11px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DefaultBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background-color: #ffc107;
  color: #000;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
`;

const LoadingMessage = styled.div`
  padding: 10px 12px;
  font-size: 13px;
  color: #6c757d;
  text-align: center;
`;

const ErrorMessage = styled.div`
  padding: 10px 12px;
  font-size: 13px;
  color: #dc3545;
  text-align: center;
`;

const EmptyMessage = styled.div`
  padding: 10px 12px;
  font-size: 13px;
  color: #6c757d;
  text-align: center;
  font-style: italic;
`;

/**
 * DashboardSelector - Componente seletor dinâmico de dashboards
 * 
 * Localizado logo abaixo do header do formulário principal,
 * permite ao usuário escolher entre dashboards autorizados.
 */
export const DashboardSelector: React.FC<DashboardSelectorProps> = ({
  userId,
  currentDashboardId,
  onDashboardSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { dashboards, loading, error } = useDashboardList(userId);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Log de depuração: userId e dashboards
  useEffect(() => {
    console.log('[DashboardSelector] userId:', userId);
    console.log('[DashboardSelector] dashboards:', dashboards);
  }, [userId, dashboards]);

  // Encontra o dashboard atual
  const currentDashboard = dashboards.find((d) => d.id === currentDashboardId);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Calcula se deve mostrar fallback (carregando/erro/vazio genuíno)
  const hasNoDashboards = !dashboards || dashboards.length === 0;
  const shouldShowFallback = hasNoDashboards && !loading && error !== null;
  
  // Se não tem dashboards e NÃO está carregando E há erro, mostrar fallback desabilitado
  // Caso contrário, mostrar o componente com state apropriado (loading ou normal)
  if (shouldShowFallback) {
    return (
      <DropdownWrapper ref={dropdownRef}>
        <DropdownButton
          ref={buttonRef}
          $isOpen={false}
          onClick={() => {}}
          disabled
          title={error || 'Nenhum dashboard disponível'}
          style={{ opacity: 0.6, cursor: 'not-allowed' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
            <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '13px', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Erro: {error}
            </span>
          </span>
          <DropdownIcon $isOpen={false}>
            <FontAwesomeIcon icon={faChevronDown} />
          </DropdownIcon>
        </DropdownButton>
        <DropdownContent $isOpen={false}>
          <ErrorMessage>{error}</ErrorMessage>
        </DropdownContent>
      </DropdownWrapper>
    );
  }

  const handleSelectDashboard = (dashboard: Dashboard) => {
    onDashboardSelect(dashboard);
    setIsOpen(false);
  };

  // Renderiza dropdown habilitado mesmo se carregando ou sem dashboards
  // (sem erro) - usuário pode interagir ou ver loading state
  return (
    <DropdownWrapper ref={dropdownRef}>
      <DropdownButton
        ref={buttonRef}
        $isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        title={currentDashboard?.name || (loading ? 'Carregando dashboards...' : 'Selecione um dashboard')}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '13px', flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {loading ? '⏳ Carregando...' : (currentDashboard?.name || 'Selecione um dashboard')}
          </span>
        </span>
        <DropdownIcon $isOpen={isOpen}>
          <FontAwesomeIcon icon={faChevronDown} />
        </DropdownIcon>
      </DropdownButton>

      <DropdownContent $isOpen={isOpen}>
        {loading && <LoadingMessage>Carregando dashboards...</LoadingMessage>}

        {error && (
          <ErrorMessage>
            Erro: {error}
          </ErrorMessage>
        )}

        {!loading && !error && dashboards.length === 0 && (
          <EmptyMessage>Nenhum dashboard disponível</EmptyMessage>
        )}

        {!loading && !error && dashboards.length > 0 && (
          dashboards.map((dashboard) => (
            <DropdownItem
              key={dashboard.id}
              $isActive={currentDashboardId === dashboard.id}
              onClick={() => handleSelectDashboard(dashboard)}
              title={dashboard.description || dashboard.name}
              >
                <DashboardItemContent>
                  <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '13px', flexShrink: 0 }} />
                  <DashboardItemText>
                    <DashboardItemName>{dashboard.name}</DashboardItemName>
                    {dashboard.description && (
                      <DashboardItemDesc>{dashboard.description}</DashboardItemDesc>
                    )}
                  </DashboardItemText>
                </DashboardItemContent>

                {dashboard.isDefault && (
                  <DefaultBadge>
                    <FontAwesomeIcon icon={faStar} style={{ fontSize: '10px' }} />
                    Padrao
                  </DefaultBadge>
                )}
              </DropdownItem>
            ))
          )}
        </DropdownContent>
      </DropdownWrapper>
    );
  };

export default DashboardSelector;













