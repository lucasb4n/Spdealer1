import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Remova esta linha
import { 
  
  faChartLine, 
  faArrowRight,
  faCog,
  faUserPlus,
  faLayerGroup,
  faTree
} from '@fortawesome/free-solid-svg-icons';
import { useFloatingWindows } from '../../contexts/FloatingWindowsContext';
import UsuarioForm from '../Forms/UsuarioForm';
import GrupoForm from '../Forms/GrupoForm';
import ConfiguracaoMenuForm from '../Forms/ConfiguracaoMenuForm';
import DashboardBuilder from 'pages/DashboardBuilder';

const ConfigContainer = styled.div`
  padding: 32px;
  background: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  margin-bottom: 40px;
  text-align: center;
`;

const Title = styled.h1`
  color: #1e293b;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 1.1rem;
  margin: 12px 0 0 0;
  font-weight: 400;
`;

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ConfigCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: #3b82f6;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const CardIcon = styled.div<{ bgColor: string; iconColor: string }>`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: ${props => props.bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  transition: all 0.3s ease;

  .icon {
    font-size: 28px;
    color: ${props => props.iconColor};
  }

  ${ConfigCard}:hover & {
    transform: scale(1.1);
  }
`;

const CardTitle = styled.h3`
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const CardDescription = styled.p`
  color: #64748b;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const CardAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #3b82f6;
  font-weight: 600;
  font-size: 1rem;

  .arrow {
    transition: transform 0.3s ease;
  }

  ${ConfigCard}:hover & .arrow {
    transform: translateX(4px);
  }
`;

const ConfigSection = styled.div`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  color: #1e293b;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 24px 0;
  text-align: center;
`;

interface ConfiguracoesModuleProps {}

export const ConfiguracoesModule: React.FC<ConfiguracoesModuleProps> = () => {
  const { createWindow } = useFloatingWindows();

  const handleOpenUsuarios = () => {
    console.log('Abrindo formulário de usuários...');
    createWindow(
      'Cadastro de Usuários',
      <UsuarioForm 
        onSave={async (usuario) => {
          console.log('Usuário salvo:', usuario);
          return Promise.resolve();
        }}
        onCancel={() => console.log('Cancelado')}
        isEditing={false}
      />,
      {
        width: 1100,
        height: 700,
        icon: faUserPlus
      }
    );
  };

  const handleOpenGrupos = () => {
    console.log('Abrindo formulário de grupos...');
    createWindow(
      'Cadastro de Grupos',
      <GrupoForm 
        onSave={async (grupo) => {
          console.log('Grupo salvo:', grupo);
          return Promise.resolve();
        }}
        onCancel={() => console.log('Cancelado')}
        isEditing={false}
      />,
      {
        width: 900,
        height: 600,
        icon: faLayerGroup
      }
    );
  };

  const handleOpenDashboardBuilder = () => {
    console.log('Abrindo Dashboard Builder...');
    createWindow(
      'Dashboard Builder',
      <DashboardBuilder dashboardId={0} onClose={() => {}} />,
      {
        width: 1400,
        height: 900,
        icon: faChartLine
      }
    );
  };

  const handleOpenConfiguracaoMenus = () => {
    console.log('Abrindo configuração de menus...');
    createWindow(
      'Configuração de Menus',
      <ConfiguracaoMenuForm />,
      {
        width: 1300,
        height: 800,
        icon: faTree
      }
    );
  };

  const configItems = [
    {
      id: 'usuarios',
      title: 'Cadastro de Usuários',
      description: 'Gerenciar usuários do sistema, criar novos acessos, definir permissões e controlar privilégios de cada usuário.',
      icon: faUserPlus,
      bgColor: '#dbeafe',
      iconColor: '#2563eb',
      action: handleOpenUsuarios
    },
    {
      id: 'grupos',
      title: 'Cadastro de Grupos',
      description: 'Criar e configurar grupos de usuários, definir permissões por grupo e organizar acessos por departamento.',
      icon: faLayerGroup,
      bgColor: '#dcfce7',
      iconColor: '#16a34a',
      action: handleOpenGrupos
    },
    {
      id: 'configuracao-menus',
      title: 'Configuração de Menus',
      description: 'Configurar menus e permissões por usuário, definir visibilidade e estrutura hierárquica dos menus.',
      icon: faTree,
      bgColor: '#f3e8ff',
      iconColor: '#7c3aed',
      action: handleOpenConfiguracaoMenus
    },
    {
      id: 'dashboard-builder',
      title: 'Dashboard Builder',
      description: 'Construir e personalizar dashboards, criar widgets personalizados e configurar visualizações de dados.',
      icon: faChartLine,
      bgColor: '#fef3c7',
      iconColor: '#d97706',
      action: handleOpenDashboardBuilder
    }
  ];

  return (
    <ConfigContainer>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faCog} />
          Configurações do Sistema
        </Title>
        <Subtitle>
          Gerencie usuários, grupos, permissões e personalize dashboards
        </Subtitle>
      </Header>

      <ConfigSection>
        <SectionTitle>Gestão de Usuários e Permissões</SectionTitle>
        <ConfigGrid>
          {configItems.slice(0, 3).map((item) => (
            <ConfigCard key={item.id} onClick={item.action}>
              <CardIcon bgColor={item.bgColor} iconColor={item.iconColor}>
                <FontAwesomeIcon icon={item.icon} className="icon" />
              </CardIcon>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
              <CardAction>
                <span>Acessar configuração</span>
                <FontAwesomeIcon icon={faArrowRight} className="arrow" />
              </CardAction>
            </ConfigCard>
          ))}
        </ConfigGrid>
      </ConfigSection>

      <ConfigSection>
        <SectionTitle>Personalização e Interface</SectionTitle>
        <ConfigGrid>
          {configItems.slice(3).map((item) => (
            <ConfigCard key={item.id} onClick={item.action}>
              <CardIcon bgColor={item.bgColor} iconColor={item.iconColor}>
                <FontAwesomeIcon icon={item.icon} className="icon" />
              </CardIcon>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
              <CardAction>
                <span>Acessar configuração</span>
                <FontAwesomeIcon icon={faArrowRight} className="arrow" />
              </CardAction>
            </ConfigCard>
          ))}
        </ConfigGrid>
      </ConfigSection>
    </ConfigContainer>
  );
};

export default ConfiguracoesModule;













