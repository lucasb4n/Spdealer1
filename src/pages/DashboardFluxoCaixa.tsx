import React, { useEffect, useState } from 'react';
import DynamicDashboard from 'components/DynamicDashboard';
import { DynamicPageContainer, PageHeader, PageTitle, PageSubtitle } from 'styles/PageContainers';

const Container = DynamicPageContainer;

const DashboardFluxoCaixa: React.FC = () => {
  const [dashboardId, setDashboardId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function findDashboard() {
      try {
        setLoading(true);
        const resp = await fetch('/api/v2/dashboards');
        if (!resp.ok) throw new Error(`Falha ao listar dashboards (${resp.status})`);
        const list = await resp.json();
        // Procurar dashboard cujo nome/title contenha 'fluxo' (case-insensitive)
        const found = (list || []).find((d: any) => {
          const name = (d.name || d.title || '').toString().toLowerCase();
          return name.includes('fluxo');
        });
        if (!cancelled) {
          if (found && found.id) {
            setDashboardId(Number(found.id));
          } else {
            setError('Dashboard de Fluxo de Caixa não encontrado.');
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    findDashboard();
    return () => { cancelled = true; };
  }, []);

  return (
    <Container>
      <PageHeader>
        <PageTitle>Dashboard Fluxo de Caixa</PageTitle>
        <PageSubtitle>Visão consolidada do fluxo de caixa</PageSubtitle>
      </PageHeader>

      <div style={{ flex: 1, minHeight: 0 }}>
        {loading && <div>Carregando dashboard...</div>}
        {error && <div style={{ color: 'red' }}>Erro: {error}</div>}
        {!loading && !error && dashboardId && (
          <div style={{ height: '100%', minHeight: 400 }}>
            <DynamicDashboard dashboardId={dashboardId} />
          </div>
        )}
      </div>
    </Container>
  );
};

export default DashboardFluxoCaixa;













