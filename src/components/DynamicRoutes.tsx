import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from 'services/api';
import { MenuService } from 'services/MenuService';

// Lazy imports for known pages — extend as needed
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const PagarListPage = lazy(() => import('../pages/PagarListPage'));
const ReceberListPage = lazy(() => import('../pages/ReceberListPage'));
const ClientesPage = lazy(() => import('../pages/ClienteListPage'));
const FornecedoresPage = lazy(() => import('../components/Lists/FornecedorList'));
const CaixaPage = lazy(() => import('../pages/CaixaBancos'));
const RelatorioCrud = lazy(() => import('../pages/RelatorioCrud'));
const NotFound = lazy(() => import('../pages/NotFound'));
const NfeSaidaPage = lazy(() => import('../pages/Financeiro/NfeSaidaPage'));
const OrcamentoPage = lazy(() => import('../pages/Vendas/OrcamentoPage'));
const MenuAdminForm = lazy(() => import('../refatorado/frontend/MenuAdminForm'));
const EntradaMercadoriaPage = lazy(() => import('../pages/Compras/EntradaMercadoriaPage'));
// const FlowRunnerPage = lazy(() => import('../refatorado/flow/FlowRunnerPage')); // TODO: módulo não existe

// Dicionário: path → component (keys normalized to lowercase)
const routeMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  '/': DashboardPage,
  '/dashboard': DashboardPage,
  '/financeiro/pagar': PagarListPage,
  '/financeiro/receber': ReceberListPage,
  '/financeiro/nfe_saida': NfeSaidaPage,
  '/financeiro/nfe_saida_emitidas': NfeSaidaPage,
  '/clientes': ClientesPage,
  '/fornecedores': FornecedoresPage,
  '/caixa': CaixaPage,
  '/relatorios': RelatorioCrud,
  '/parametros/dicionario': lazy(() => import('../pages/Dicionario')),
  '/parametros/dictionary': lazy(() => import('../pages/Dicionario')),
  '/parametros/programas-permissoes': MenuAdminForm,
  '/vendas/orcamento': OrcamentoPage,
  '/pecas/compras/entrada-mercadoria': EntradaMercadoriaPage,
  // '/parametros/flow-runner': FlowRunnerPage, // TODO: módulo não existe
  // '/parametros/flow-form': FlowRunnerPage, // TODO: módulo não existe
  // '/ferramentas/flow-form': FlowRunnerPage, // TODO: módulo não existe
  // '/parametros/ferramentas/flow-form': FlowRunnerPage, // TODO: módulo não existe
};

interface MenuItem {
  id: number;
  path: string;
  label?: string;
  parentId?: number | null;
  ordem?: number;
}

const DynamicRoutes: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadMenu() {
      try {
        // Prefer MenuService which may have richer logic; fallback to api('/menu-groups')
        const groups = await MenuService.getMenuGroupsByUser((window as any).USER_ID || 1).catch(async () => {
          const resp = await fetch(api('/menu-groups/1'));
          return resp.ok ? resp.json() : [];
        });

        // Flatten groups → items (supporting legacy shape)
        const items: MenuItem[] = [];
        if (Array.isArray(groups)) {
          groups.forEach((g: any) => {
            (g.items || g.itens || g.menuItems || []).forEach((it: any) => {
              // Suporte a diferentes nomes retornados pelo backend: 'path', 'route', 'href'
              const resolvedPath = String(it.path || it.route || it.href || '#');
              const label = it.label || it.title || it.name || it.descricao;
              items.push({ id: it.id, path: resolvedPath, label, parentId: it.parentId ?? null, ordem: it.ordem });
            });
          });
        }

        if (mounted) setMenuItems(items);
      } catch (err) {
        console.error('Erro ao carregar menu dinâmico:', err);
        if (mounted) setMenuItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadMenu();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Carregando rotas...</div>;

  // Build route entries from menuItems using routeMap; fallback to NotFound
  const dynamicRoutes = (menuItems || []).map(item => {
    const path = String(item.path || '').trim();
    if (!path || path === '#') return null;
    const normalized = path.replace(/\/$/, '').toLowerCase();
    // try direct mapping, underscore/hyphen variants
    const Component = routeMap[normalized] || routeMap[normalized.replace(/_/g, '-')] || routeMap[normalized.replace(/-/g, '_')];
    if (Component) {
      return <Route key={path} path={path} element={<Component />} />;
    }

    // Heuristic: common NFe paths may vary — map them to the same page
    if (normalized.includes('/financeiro') && normalized.includes('nfe') && normalized.includes('saida')) {
      return <Route key={path} path={path} element={<NfeSaidaPage />} />;
    }

    // Heuristic: map dictionary-related parametros routes to Dicionario page
    if (normalized.includes('/parametros') && (normalized.includes('dictionary') || normalized.includes('dicionario'))) {
      const DicionarioPage = lazy(() => import('../pages/Dicionario'));
      return <Route key={path} path={path} element={<DicionarioPage />} />;
    }

    // TODO: Heuristic: map various flow/form routes to FlowRunner page - módulo não existe
    // if (normalized.includes('flow') && normalized.includes('parametros') || normalized.includes('ferramentas') && normalized.includes('flow')) {
    //   return <Route key={path} path={path} element={<FlowRunnerPage />} />;
    // }

    // If no mapped component, try to lazy-load by convention: pages/{LastSegment}
    const tryCompName = path.split('/').filter(Boolean).slice(-1)[0];
    if (tryCompName) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const LazyComp = lazy(() => import(`../pages/${tryCompName.charAt(0).toUpperCase() + tryCompName.slice(1)}`));
        return <Route key={path} path={path} element={<LazyComp />} />;
      } catch (e) {
        // continue to NotFound fallback
      }
    }

    return <Route key={path} path={path} element={<NotFound />} />;
  });

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Routes>
        {dynamicRoutes}

        {/* Root and fallback routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default DynamicRoutes;













