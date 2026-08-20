// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NavigationProvider } from './contexts/NavigationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';

import Dashboard from 'pages/Dashboard';
import Usuarios from 'pages/Usuarios';
import Grupos from 'pages/Grupos';
import UserGroups from 'pages/UserGroups';
import Dashboards from 'pages/Dashboards';
import ClienteList from 'components/Lists/ClienteList';
import ClienteEditar from 'pages/Clientes/ClienteEditar';
import FornecedorList from 'components/Lists/FornecedorList';
import FornecedorFormPage from 'components/Forms/FornecedorFormPage';
import RecebimentoList from 'components/Lists/RecebimentoList';
import PagamentoList from 'components/Lists/PagamentoList';
// CaixaList removed (deprecated). Use CaixaBancos as the canonical Caixa e Bancos page.
import CaixaMovimentoPage from 'pages/CaixaMovimentoPage';
import CaixaConsolidacaoForm from 'components/Forms/CaixaConsolidacaoForm';

import RelatorioCrud from 'pages/RelatorioCrud';
import RelatoriosFinanceirosPage from 'pages/RelatoriosFinanceirosPage';
import DashboardBuilder from 'pages/DashboardBuilder';
// import FormBuilderHost from './formbuilder/formbuild';
// import FlowForm from './formbuilder/FlowForm';
import FinanceiroConfig from 'pages/FinanceiroConfig';
// import CaixaBancos from 'pages/CaixaBancos';
import CaixaFormularioLocalizar from 'components/Forms/CaixaFormularioLocalizar';
import ManutencaoFluxoCaixaPage from 'pages/ManutencaoFluxoCaixaPage';
import PreviewCaixa from 'pages/PreviewCaixa';
import ToolsTaskManager from 'pages/ToolsTaskManager';
import FormBuilderHost from './formbuilder/formbuild';
import FormBuilderMain from './formbuilder/FormBuilderMain';
import SqlEditor from './report/SqlEditor';
// import FlowForm from './formbuilder/FlowForm';  // Desabilitado temporariamente - @reactflow/core issue
import ReceberListPage from 'pages/ReceberListPage';
import PagarListPage from 'pages/PagarListPage';
import ClienteListPage from 'pages/Clientes/ClienteListPage';
import IncluirRegistro from './Lucas/Cadastro de Clientes/IncluirRegistro/Frontend/IncluirRegistro';
import EstoqueConsultaPage from 'pages/EstoqueConsultaPage';
import CadastroEstoquePage from 'pages/Estoque/CadastroEstoquePage';
import EntradaMercadoriaPage from 'pages/Compras/EntradaMercadoriaPage';
import ManutencaoOrdemCompraPage from 'pages/Compras/ManutencaoOrdemCompraPage';
import OrdemCompraFormPage from 'pages/Compras/OrdemCompraFormPage';
import ParametrosGerais from 'pages/ParametrosGerais';
import TiposFornecedores from 'pages/TiposFornecedores';
import InventarioPage from 'pages/InventarioPage';
import ManutencaoTipoTmoForm from 'pages/Servico/Manutencao/ManutencaoTipoTmoForm';
import ManutencaoTipoTmoList from 'pages/Servico/Manutencao/ManutencaoTipoTmoList';
import ManutencaoGrupoReparoList from 'pages/Servico/Manutencao/ManutencaoGrupoReparoList';
import ManutencaoModelosPage from 'pages/Servico/Manutencao/ManutencaoModelosPage';
import ServicoPorTipo from './refatorado/servico/ServicoPorTipo';
import MenuAdminForm from './refatorado/frontend/MenuAdminForm';
import DictionaryLocalizar from 'components/DictionaryCrud/DictionaryLocalizar';
import OperacoesPage from 'pages/Cadastros/OperacoesPage';
import DepartamentosPage from 'pages/Cadastros/DepartamentosPage';
import TiposOsPage from 'pages/Cadastros/TiposOsPage';
import GrupoItensPage from 'pages/Cadastros/GrupoItensPage';
import NiveisPrecoPage from 'pages/Cadastros/NiveisPrecoPage';
import NaturezaItensPage from 'pages/Cadastros/NaturezaItensPage';
// import FlowRunnerPage from './refatorado/flow/FlowRunnerPage'; // Módulo desabilitado
// import FlowEditorPage from './refatorado/flow/FlowEditorPage'; // Módulo desabilitado
import NfeForm from 'components/Forms/NfeForm';
import OrcamentoPage from 'pages/Vendas/OrcamentoPage';
import ReportsLanding from 'pages/ReportsLanding';
import ConfiguracoesGeraisModule from 'components/Modules/ConfiguracoesGeraisModule';
import Login from 'pages/Login';
import ClienteFormOriginalDemo from 'pages/ClienteFormOriginalDemo';
import ManualPage from 'pages/ManualPage';
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <NavigationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={
            <WorkspaceLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/workspace" replace />} />
                <Route path="/workspace" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/grupos" element={<Grupos />} />
                <Route path="/usuarios/grupos" element={<UserGroups />} />
                <Route path="/dashboards" element={<Dashboards />} />
                <Route path="/financeiro" element={<FinanceiroConfig />} />
                <Route path="/financeiro/relatorio" element={<RelatorioCrud />} />
                <Route path="/financeiro/relatorios" element={<RelatoriosFinanceirosPage />} />
                <Route path="/financeiro/dashboard-fluxo-caixa" element={<Navigate to="/financeiro/caixa" replace />} />
                <Route path="/financeiro/manutencao-fluxo-caixa" element={<ManutencaoFluxoCaixaPage />} />
                <Route path="/ferramentas/dashboard-builder" element={<DashboardBuilder onClose={() => window.history.back()} />} />
                <Route path="/dashboard-builder" element={<DashboardBuilder onClose={() => window.history.back()} />} />
                <Route path="/ferramentas/tarefas" element={<ToolsTaskManager />} />
                <Route path="/form-builder" element={<FormBuilderHost />} />
                <Route path="/ferramentas/form-builder" element={<FormBuilderHost />} />
                <Route path="/ferramentas/form-builder-editor" element={<FormBuilderMain />} />
                <Route path="/financeiro/form-builder" element={<FormBuilderMain />} />
                <Route path="/ferramentas/sql-editor" element={<SqlEditor />} />
                <Route path="/cadastros/clientes" element={<ClienteListPage />} />
                <Route path="/cadastros/clientes/localizar" element={<ClienteListPage />} />
                <Route path="/cadastros/clientes/incluir-registro" element={<IncluirRegistro />} />
                <Route path="/cadastros/clientes/novo" element={<ClienteEditar />} />
                <Route path="/cadastros/clientes/:id/edit" element={<ClienteEditar />} />
                <Route path="/cadastros/fornecedores" element={<FornecedorList />} />
                <Route path="/cadastros/fornecedores/novo" element={<FornecedorFormPage />} />
                <Route path="/cadastros/fornecedores/:id/edit" element={<FornecedorFormPage />} />
                <Route path="/cadastros/operacoes" element={<OperacoesPage />} />
                <Route path="/parametros/departamentos" element={<DepartamentosPage />} />
                <Route path="/cadastros/tipos-os" element={<TiposOsPage />} />
                <Route path="/cadastros/grupo-itens" element={<GrupoItensPage />} />
                <Route path="/cadastros/niveis-preco" element={<NiveisPrecoPage />} />
                <Route path="/cadastros/natureza-itens" element={<NaturezaItensPage />} />
                <Route path="/financeiro/recebimentos" element={<RecebimentoList />} />
                <Route path="/financeiro/receber" element={<ReceberListPage />} />
                <Route path="/financeiro/pagamentos" element={<PagamentoList />} />
                <Route path="/financeiro/pagar" element={<PagarListPage />} />
                <Route path="/financeiro/caixa" element={<CaixaFormularioLocalizar />} />
                <Route path="/financeiro/caixa/movimento/novo" element={<CaixaMovimentoPage />} />
                <Route path="/financeiro/caixa/movimento/:id/edit" element={<CaixaMovimentoPage />} />
                <Route path="/financeiro/caixa/consolidacao/novo" element={<CaixaConsolidacaoForm />} />
                <Route path="/financeiro/caixa/consolidacao/:banco/edit" element={<CaixaConsolidacaoForm />} />
                <Route path="/preview/caixa" element={<PreviewCaixa />} />
                <Route path="/estoque/consulta" element={<EstoqueConsultaPage />} />
                <Route path="/pecas/consulta-estoque" element={<EstoqueConsultaPage />} />
                <Route path="/pecas/cadastro-estoque/:fab/:codprod/edit" element={<CadastroEstoquePage />} />
                <Route path="/pecas/cadastro-estoque" element={<CadastroEstoquePage />} />
                <Route path="/pecas/inventario" element={<InventarioPage />} />
                <Route path="/financeiro/nfe_saida" element={<NfeForm />} />
                <Route path="/fiscal/nfe" element={<NfeForm />} />
                <Route path="/fiscal/nfe/saida" element={<NfeForm />} />
                <Route path="/nfe/monitor" element={<NfeForm />} />
                <Route path="/pecas/compras/nfe" element={<NfeForm />} />
                <Route path="/pecas/compras/entrada-mercadoria" element={<EntradaMercadoriaPage />} />
                <Route path="/pecas/compras/manutencao-ordem-compra" element={<ManutencaoOrdemCompraPage />} />
                <Route path="/pecas/compras/manutencao-ordem-compra/nova" element={<OrdemCompraFormPage />} />
                <Route path="/pecas/compras/manutencao-ordem-compra/editar/:empre/:origem/:nrordem" element={<OrdemCompraFormPage />} />
                <Route path="/parametros/geral" element={<ParametrosGerais />} />
                <Route path="/parametros/configuracoes" element={<ConfiguracoesGeraisModule />} />
                <Route path="/parametros/tipos-fornecedores" element={<TiposFornecedores />} />
                <Route path="/parametros/programas-permissoes" element={<MenuAdminForm />} />
                <Route path="/parametros/dictionary/:table/localizar" element={<DictionaryLocalizar />} />
                <Route path="/servico/manutencao/tipo-tmo" element={<ManutencaoTipoTmoList />} />
                <Route path="/servico/manutencao/tipo-tmo/cad" element={<ManutencaoTipoTmoForm />} />
                <Route path="/servico/manutencao/tipo-tmo/:id/edit" element={<ManutencaoTipoTmoForm />} />
                <Route path="/servico/manutencao/grupo-reparo" element={<ManutencaoGrupoReparoList />} />
                <Route path="/servico/manutencao/modelos-maquina" element={<ManutencaoModelosPage />} />
                <Route path="/servico/por-tipo" element={<ServicoPorTipo />} />
                <Route path="/vendas/orcamento" element={<OrcamentoPage />} />
                <Route path="/vendas/orcamento/:numero" element={<OrcamentoPage />} />
                <Route path="/demo/cliente-form-original" element={<ClienteFormOriginalDemo />} />
                <Route path="/relatorios" element={<ReportsLanding />} />
                <Route path="/manual" element={<ManualPage />} />
                <Route path="*" element={<Navigate to="/workspace" replace />} />
              </Routes>
            </WorkspaceLayout>
          } />
        </Routes>
      </NavigationProvider>
    </NotificationProvider>
  );
}

export default App;













