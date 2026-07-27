import React, { useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileLines, 
  faChartPie, 
  faGear, 
  faArrowTrendUp,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import '../styles/industrial-reports.css';

// Animações Brutalistas
const slideUp = keyframes`
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const scanline = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
`;

const LandingRoot = styled.div<{ $primary: string }>`
  --user-primary: ${props => props.$primary || '#FACC15'};
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
  
  /* Linha de Scan (Industrial HUD) */
  &::after {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; height: 100px;
    background: linear-gradient(to bottom, transparent, rgba(250, 204, 21, 0.05), transparent);
    animation: ${scanline} 4s linear infinite;
    pointer-events: none;
    z-index: 10;
  }
`;

const HeroSection = styled.section`
  padding: 6rem 4rem;
  background: var(--user-bg-heavy);
  border-bottom: 4px solid #1E293B;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${slideUp} 0.6s cubic-bezier(0.19, 1, 0.22, 1);
`;

const IndustrialBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #000;
  color: var(--user-primary);
  border: 1px solid #334155;
  padding: 4px 12px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  width: fit-content;
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  padding: 4rem;
  background: #0B0F1A;
`;

const ReportCategoryCard = styled.div<{ $delay: number }>`
  animation: ${slideUp} 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: ${props => props.$delay}s;
  opacity: 0;
`;

const IconBox = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: var(--user-primary);
  opacity: 0.8;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
`;

const CardDesc = styled.p`
  color: #94A3B8;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const FooterInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  color: #475569;
`;

const ReportsLanding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Recupera a cor primária dinâmica do usuário
  const userPrimaryColor = useMemo(() => {
    if (user?.dashboardConfig?.themeConfig?.primaryColor) {
      return user.dashboardConfig.themeConfig.primaryColor;
    }
    return '#FACC15'; // Safety Yellow
  }, [user]);

  const categories = [
    {
      id: 'financeiro',
      title: 'Performance Financeira',
      desc: 'Fluxo de caixa, DRE industrial e análise de rentabilidade de peças e serviços.',
      icon: <FontAwesomeIcon icon={faChartPie} />,
      ref: 'FIN-2026-X',
      route: '/financeiro/relatorios'
    },
    {
      id: 'oficina',
      title: 'Gestão de Oficina',
      desc: 'Monitoramento de TMO, produtividade por consultor e status de O.S. pesadas.',
      icon: <FontAwesomeIcon icon={faGear} />,
      ref: 'OFC-4.0',
      route: '/servico/manutencao/tipo-tmo'
    },
    {
      id: 'vendas',
      title: 'Máquinas & Implementos',
      desc: 'Conversão de leads, pipeline de vendas de escavadeiras e estoque de grande porte.',
      icon: <FontAwesomeIcon icon={faArrowTrendUp} />,
      ref: 'VEN-IND-01',
      route: '/vendas/orcamento'
    },
    {
      id: 'contabilidade',
      title: 'Auditoria & Fiscal',
      desc: 'Consolidação de impostos, balancetes e exportações para contabilidade externa.',
      icon: <FontAwesomeIcon icon={faFileLines} />,
      ref: 'AUD-SECURE',
      route: '/fiscal/nfe'
    }
  ];

  return (
    <LandingRoot className="industrial-canvas industrial-texture" $primary={userPrimaryColor}>
      <HeroSection>
        <IndustrialBadge>
          <span style={{ color: '#ef4444' }}>●</span> SYSTEM STATUS: OPERATIONAL
        </IndustrialBadge>
        
        <h1 className="industrial-h1">
          Módulo de<br />Relatórios
        </h1>
        
        <p style={{ color: '#94A3B8', maxWidth: '600px', fontSize: '1.1rem' }}>
          Plataforma analítica para gestão de concessionárias de máquinas pesadas. 
          Dados consolidados em tempo real para tomada de decisão estratégica.
        </p>
        
        <div style={{ marginTop: '2rem' }}>
          <button className="industrial-btn" onClick={() => navigate('/dashboard-builder')}>
            Configurar Dashboard <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 10 }} />
          </button>
        </div>
      </HeroSection>

      <ReportsGrid>
        {categories.map((cat, index) => (
          <ReportCategoryCard 
            key={cat.id} 
            className="industrial-card" 
            data-ref={cat.ref}
            $delay={0.2 + (index * 0.1)}
          >
            <IconBox>{cat.icon}</IconBox>
            <CardTitle>{cat.title}</CardTitle>
            <CardDesc>{cat.desc}</CardDesc>
            
            <button 
              className="industrial-btn" 
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.8rem', width: '100%' }}
              onClick={() => navigate(cat.route)}
            >
              Acessar Módulo
            </button>

            <FooterInfo style={{ marginTop: '1.5rem' }}>
              <span>ENCRYPT_V2</span>
              <span>DATA_SOURCE: MARIADB/100.x.x.63</span>
            </FooterInfo>
          </ReportCategoryCard>
        ))}
      </ReportsGrid>

      {/* KPI HUD Section */}
      <section style={{ padding: '0 4rem 4rem', background: '#0B0F1A' }}>
        <div style={{ padding: '2rem', border: '1px solid #1E293B', background: '#0F172A' }}>
          <IndustrialBadge style={{ marginBottom: '1.5rem' }}>
            Live Performance Indicators
          </IndustrialBadge>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="industrial-kpi">
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>TOTAL_ASSETS</div>
              <div className="value">42.8M</div>
            </div>
            <div className="industrial-kpi">
              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>SYS_LOAD</div>
              <div className="value">0.14ms</div>
            </div>
          </div>
        </div>
      </section>
    </LandingRoot>
  );
};

export default ReportsLanding;













