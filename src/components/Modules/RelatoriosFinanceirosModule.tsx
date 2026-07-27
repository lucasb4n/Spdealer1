import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faChevronRight, faChevronDown, faMoneyBillWave, faFileInvoiceDollar, faCashRegister, faCalendarAlt, faDownload, faFilter, faInfoCircle, faFileCsv, faFilePdf, faSync, faCheck, faExclamationTriangle, faTrash, faPlus, faEdit, faHandshake } from '@fortawesome/free-solid-svg-icons';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { RelatoriosService } from 'services/RelatoriosService';
import { CaixaBancosService } from 'services/CaixaBancosService';
import { PrevisaoFinanceiraService } from 'services/PrevisaoFinanceiraService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { hasPermission, parsePermissions } from 'utils/permissionUtils';
import RegistrarLancamentoModal from 'components/RegistrarLancamentoModal';
import CaixaBancosForm from 'components/Forms/CaixaBancosForm';
import MultiSelectDropdown from '../MultiSelectDropdown';
/* eslint-disable react-hooks/exhaustive-deps */

/*
  Opção A aplicada: silenciar avisos de "react-hooks/exhaustive-deps" neste arquivo
  (não alterar arrays de dependência automaticamente conforme orientação do time).
*/
/* eslint-disable react-hooks/exhaustive-deps */

// TODO: revisar e corrigir dependências de React Hooks neste arquivo.
// Remover esta nota quando `useEffect`/`useCallback`/`useMemo` estiverem com dependências corretas.

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SubMenu = styled.div`
  display: flex;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
`;

const SubMenuItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  background: ${props => props.$active ? '#f0f9ff' : 'transparent'};
  color: ${props => props.$active ? '#0369a1' : '#6b7280'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid ${props => props.$active ? '#0369a1' : 'transparent'};
  white-space: nowrap;

  &:hover {
    background: #f0f9ff;
    color: #0369a1;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 24px;
`;

const FilterCard = styled.div`
  background: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  margin-bottom: 0;
  flex-shrink: 0;
  position: relative;
  z-index: 100; /* Garante que o dropdown flutue sobre a tabela */
`;

const FilterTitle = styled.h3<{ $collapsed?: boolean }>`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
  transition: color 0.2s ease;
  
  &:hover {
    color: #3b82f6;
  }
  
  svg.chevron {
    transition: transform 0.3s ease;
    transform: ${(props) => props.$collapsed ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const FilterContent = styled.div<{ $collapsed: boolean }>`
  max-height: ${props => props.$collapsed ? '0' : '900px'};
  overflow: ${props => props.$collapsed ? 'hidden' : 'visible'};
  opacity: ${props => props.$collapsed ? '0' : '1'};
  transition: max-height 0.25s ease, opacity 0.25s ease;
  margin-top: ${props => props.$collapsed ? '0' : '4px'};
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #374151;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;


const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: #fff;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case 'success':
        return `
          background: #10b981;
          color: #fff;
          &:hover:not(:disabled) { background: #059669; }
        `;
      default:
        return `
          background: #6b7280;
          color: #fff;
          &:hover:not(:disabled) { background: #4b5563; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultTable = styled.div`
  flex: 1;
  overflow: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const ResultCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: visible; /* IMPORTANTE: permitir dropdown flutuar se necessário */
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
`;


const AgGridContainer = styled.div`
  width: 100%;
  height: 100%;
  
  .ag-root.ag-unselectable.ag-layout-normal {
    border: none;
  }
  
  .ag-header-cell-text {
    font-weight: 600;
    color: #374151;
  }
  
  .ag-cell {
    font-size: 14px;
    color: #1f2937;
  }
  
  .ag-footer-cell-text {
    font-weight: 600;
    color: #059669;
  }
`;

const PeriodCardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/* SectionTitle and CardsGrid removed (unused styled components) */

const PeriodCardButton = styled.button<{ $isSelected: boolean; $color: string }>`
  padding: 6px 10px;
  border: 2px solid ${(props) => (props.$isSelected ? props.$color : '#e6e7ea')};
  background: ${(props) => (props.$isSelected ? `${props.$color}10` : '#ffffff')};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  text-align: center;
  font-family: inherit;
  min-height: 40px;

  &:hover {
    border-color: ${(props) => props.$color};
    background: ${(props) => `${props.$color}14`};
    transform: translateY(-1px);
  }

  .period-value {
    font-size: 14px;
    font-weight: 700;
    color: ${(props) => props.$color};
    min-width: 28px;
    text-align: center;
  }

  .period-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 600;
  }
`;

const RenegociacaoCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  overflow-x: auto;
  max-height: 70vh;
  flex: 1;
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 12px 0;
`;

const ReadonlyField = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5 }}>{label}</span>
    <span style={{ fontSize: 14, color: '#1f2937', padding: '6px 10px', background: '#f1f5f9', borderRadius: 4, border: '1px solid #e5e7eb' }}>{value || '—'}</span>
  </div>
);

const EditableField = ({ label, value, onChange, readOnly }: { label: string; value: string; onChange?: React.ChangeEventHandler<HTMLInputElement>; readOnly?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5 }}>{label}</span>
    <input
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      style={{
        padding: '6px 10px',
        border: '2px solid #e5e7eb',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
        width: '100%',
        background: readOnly ? '#f1f5f9' : '#fff',
        color: readOnly ? '#475569' : '#1f2937',
        transition: 'border-color 0.2s'
      }}
      onFocus={(e) => { if (!readOnly) e.target.style.borderColor = '#3b82f6'; }}
      onBlur={(e) => { if (!readOnly) e.target.style.borderColor = '#e5e7eb'; }}
    />
  </div>
);

type TipoRelatorio = 'receber' | 'pagar' | 'fluxo' | 'consulta_caixa' | 'renegociacao';

interface FiltroRelatorio {
  tipo: TipoRelatorio;
  tipoDataFiltro: string;
  dataFiltroInicial: string;
  dataFiltroFinal: string;
  pessoaTipo: string;
  tipoCobranca: string;
  tipoDocumento: string;
  tiposDocumento?: string[]; // Múltiplos tipos de documento selecionados
  departamento: string;
  centroCusto: string;
  faixaAtraso: string;
  soEmAberto: boolean;
  soPagos: boolean;
  folhaPagamento?: boolean; // Flag para relatório de folha de pagamento
  tipoCampoData?: string;
  dataini?: string;
  datafim?: string;
}

interface RelatoriosFinanceirosModuleProps {
  height?: string;
}

const RelatoriosFinanceirosModule: React.FC<RelatoriosFinanceirosModuleProps> = ({ height = '100%' }) => {
  const [tipoAtivo, setTipoAtivo] = useState<TipoRelatorio>('receber');
  const [filtros, setFiltros] = useState<FiltroRelatorio>({
    tipo: 'receber',
    tipoDataFiltro: 'vencimento',
    dataFiltroInicial: '',
    dataFiltroFinal: '',
    pessoaTipo: '',
    tipoCobranca: '',
    tipoDocumento: '',
    tiposDocumento: [], // Inicializar array vazio para múltipla seleção
    departamento: '',
    centroCusto: '',
    faixaAtraso: '',
    soEmAberto: false,
    soPagos: false,
    folhaPagamento: false, // Inicializar flag de folha de pagamento
    tipoCampoData: undefined
  });

  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  // search input state removed (unused) — AG Grid quick filter used directly
  const [collapseFilter, setCollapseFilter] = useState(false);
  const [consultaCollapseFilter, setConsultaCollapseFilter] = useState(false);
  const [renegociacaoCollapseFilter, setRenegociacaoCollapseFilter] = useState(false);
  const [filtrosAlterados, setFiltrosAlterados] = useState(false);
  const [periodCollapsed, setPeriodCollapsed] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);
  const [totalRow, setTotalRow] = useState<any>(null);
  const [opcoesCobranca, setOpcoesCobranca] = useState<any[]>([]);
  const [opcoesTipoDocumento, setOpcoesTipoDocumento] = useState<any[]>([]);
  const [opcoesDeptos, setOpcoesDeptos] = useState<any[]>([]);
  const [consultaDados, setConsultaDados] = useState<any[]>([]);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [consultaDataInicial, setConsultaDataInicial] = useState('');
  const [consultaDataFinal, setConsultaDataFinal] = useState('');
  const [consultaTipoData, setConsultaTipoData] = useState('caixa');
  const [consultaCentroCusto, setConsultaCentroCusto] = useState('');
  const [consultaOperacao, setConsultaOperacao] = useState('');
  const [consultaMascai] = useState('');
  const [renegociacaoTipo, setRenegociacaoTipo] = useState('receber');
  const [renegociacaoSearch, setRenegociacaoSearch] = useState('');
  const [renegociacaoDados, setRenegociacaoDados] = useState<any[]>([]);
  const [renegociacaoLoading, setRenegociacaoLoading] = useState(false);
  const [renegociacaoSuggestions, setRenegociacaoSuggestions] = useState<string[]>([]);
  const [renegociacaoShowDropdown, setRenegociacaoShowDropdown] = useState(false);
  const [renegociacaoTotalRow, setRenegociacaoTotalRow] = useState<any>(null);
  const renegociacaoBlockAutoComplete = useRef(false);
  const [renegociacaoSelectedRow, setRenegociacaoSelectedRow] = useState<any>(null);
  const [renegociacaoSelectedRows, setRenegociacaoSelectedRows] = useState<any[]>([]);
  const [isBulkRenegociacao, setIsBulkRenegociacao] = useState(false);
  const [paginaSelecionados, setPaginaSelecionados] = useState(0);
  const [renegociacaoCollapseTable, setRenegociacaoCollapseTable] = useState(false);

  const [showSimulacaoModal, setShowSimulacaoModal] = useState(false);
  const [simulacaoForm, setSimulacaoForm] = useState({
    valorTotal: 0, entrada: 0, parcelas: 1, juros: 0, valorParcelas: 0,
    motivo: '', vencimento: '', diaVencimento: ''
  });
  const [simulacaoParcelas, setSimulacaoParcelas] = useState<{ valor: string; data: string }[]>([]);
  const [simulacaoProcessing, setSimulacaoProcessing] = useState(false);
  const [numdupError, setNumdupError] = useState('');
  const [renegociacaoForm, setRenegociacaoForm] = useState({
    codigo: '', numero: '', documento: '', cliente: '', dpto: '',
    tipoCobranca: '', tipoDocumento: '', movimentacao: '',
    valorRenegociado: 0, entrada: 0, parcelas: 1, juros: 0, desconto: 0,
    valorParcelas: 0, motivo: '', vencimento: '', diaVencimento: '',
    receberId: null as number | null, pagarId: null as number | null
  });
  const [renegociacaoParcelas, setRenegociacaoParcelas] = useState<{ valor: string; data: string }[]>([]);
  const renegociacaoParcelasRef = useRef(renegociacaoParcelas);
  renegociacaoParcelasRef.current = renegociacaoParcelas;

  const [opcoesOperacoesCaixa, setOpcoesOperacoesCaixa] = useState<any[]>([]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [filterOnlyHoje] = useState<boolean>(false);
  const [bancoSelecionado, setBancoSelecionado] = useState<string>('');
  // NOVO: Tracking de banco por documento - permite selecionar bancos diferentes por documento
  const [documentBanks, setDocumentBanks] = useState<Record<string, string>>({});
  const [bancoOptions, setBancoOptions] = useState<string[]>([]);
  const [saldosPorBanco, setSaldosPorBanco] = useState<Record<string, number>>({});
  const [authorizedRows, setAuthorizedRows] = useState<Set<string>>(new Set());
  const [previsoesPorOperacao, setPrevisoesPorOperacao] = useState<any>({});
  const [detalhesPorData, setDetalhesPorData] = useState<Record<string, any[]>>({});
  const [fluxoGlobalKPIs, setFluxoGlobalKPIs] = useState<any | null>(null);
  const [showRegistrarModal, setShowRegistrarModal] = useState(false);
  const [modalDocumentoIds, setModalDocumentoIds] = useState<number[]>([]);
  // NOVO: Banco por documento para passar ao modal
  const [modalDocumentBanks, setModalDocumentBanks] = useState<Record<string, string>>({});
  const [modalTipo, setModalTipo] = useState<'RECEBER' | 'PAGAR'>('RECEBER');
  const [modalOperacao, setModalOperacao] = useState<number>(500);
  const [modalReloadKey, setModalReloadKey] = useState<string | null>(null);
  const [modalInitialValor, setModalInitialValor] = useState<number>(0);
  const [showCaixaPopup, setShowCaixaPopup] = useState<boolean>(false);
  const [caixaPopupPayload, setCaixaPopupPayload] = useState<any>(null);
  const [caixaPopupReadOnlyPrimary, setCaixaPopupReadOnlyPrimary] = useState<boolean>(true);

  // Estados para Previsão Financeira na Linha de Grupo
  const [previsaoPorData, setPrevisaoPorData] = useState<Record<string, any>>({});
  const [carregandoPrevisao, setCarregandoPrevisao] = useState(false);

  const { user } = useAuth();
  const { hasPermission: hasNavPermission, permissions: navPermissions, menuGroups } = useNavigation();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Controle de Permissão Granular
  const userPerms = useMemo(() => parsePermissions(user?.permissions), [user?.permissions]);
  
  // Tenta encontrar o menuId dinamicamente a partir dos menuGroups
  const menuIdRelatorios = useMemo(() => {
    if (!menuGroups) return 422; // Fallback para o ID conhecido
    
    // Procura por um item de menu que aponte para esta rota
    for (const group of menuGroups) {
      if (!group.items) continue;
      for (const item of group.items) {
        // Verifica o item principal
        if (item.route === '/financeiro/relatorios' || item.path === '/financeiro/relatorios') {
          return item.id;
        }
        // Verifica filhos
        if (item.filhos) {
          for (const filho of item.filhos) {
            if (filho.route === '/financeiro/relatorios' || filho.path === '/financeiro/relatorios') {
              return filho.id;
            }
          }
        }
      }
    }
    return 422;
  }, [menuGroups]);

  // Tenta validar tanto pelo context (fresco da API) quanto pelo localStorage (fallback)
  // Adicionado fallback para temQualquerAlterar devido à inconsistência de IDs no backend (422 vs 1-19)
  const temQualquerAlterar = navPermissions?.some(p => p.permissao?.alterar === true);
  const podeEditarCaixa = isAdmin || hasNavPermission(menuIdRelatorios, 'alterar') || hasPermission(userPerms, menuIdRelatorios, 'editar') || temQualquerAlterar;
  
  // Rotinas Financeiras (IDs fixos para estas por enquanto, a menos que encontremos dinamicamente também)
  const podeEditarReceber = isAdmin || hasNavPermission(412, 'alterar') || hasPermission(userPerms, 412, 'editar') || temQualquerAlterar;
  const podeEditarPagar = isAdmin || hasNavPermission(413, 'alterar') || hasPermission(userPerms, 413, 'editar') || temQualquerAlterar;
  const [hasSearchedConsulta, setHasSearchedConsulta] = useState(false);
  const navigate = useNavigate();

  // Sempre que `consultaDados` for atualizado, tentar aplicar ao gridApi
  useEffect(() => {
    try {
      if (!consultaDados || consultaDados.length === 0) return;
      const tryApply = (api: any) => {
        try {
          if (api && typeof api.setRowData === 'function') {
            api.setRowData(consultaDados);
            console.debug('[DEBUG-CONSULTA-CAIXA] useEffect: gridApi.setRowData aplicado, rows=', consultaDados.length);
            return true;
          }
        } catch (e) { /* noop */ }
        return false;
      };

      if (tryApply(gridApi)) return;
      if (tryApply((window as any).__agGridApi)) return;

      // Se ainda não aplicável, guardar dados para serem aplicados quando o grid estiver pronto
      try { (window as any).__lastConsultaCaixa = consultaDados; } catch (e) { }
      console.debug('[DEBUG-CONSULTA-CAIXA] useEffect: gridApi não disponível, dados salvos em window.__lastConsultaCaixa');
    } catch (e) {
      console.warn('[DEBUG-CONSULTA-CAIXA] useEffect erro ao aplicar rowData', e);
    }
  }, [consultaDados, gridApi]);
  const dtemissaoWarningReceberShown = React.useRef(false);
  const dtemissaoWarningPagarShown = React.useRef(false);

  // Fechar o formulário com ESC -> volta para menu principal ('/')
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        try { navigate('/'); } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);
  // Note: helpers and some other helpers/persistence are defined later in the file to avoid redeclaration

  // Carregar opções de Tipo de Cobrança e Departamentos ao montar o componente
  React.useEffect(() => {
    carregarOpcoesCobranca();
    carregarTiposDocumento();
    carregarDepartamentos();
    // carregar operações de caixa para a aba de consulta
    import('../../services/CaixaBancosService').then(m => {
      m.CaixaBancosService.listarOperacoesCaixa()
        .then((ops: any[]) => {
          // Normalizar diferentes formatos retornados pelo backend
          const normalized = (ops || []).map(op => {
            if (!op) return null;
            const codigo = op.operacao_ocai || op.codigo || op.id || op.codigo_ocai || op.operacao || String(op);
            const descricao = op.descr_ocai || op.descricao || op.label || op.descr || (typeof op === 'string' ? op : undefined);
            return { codigo, descricao };
          }).filter(Boolean);
          setOpcoesOperacoesCaixa(normalized as any[]);
        })
        .catch(() => setOpcoesOperacoesCaixa([]));
    }).catch(() => { });
  }, [tipoAtivo]);

  // Quando sai do Fluxo de Caixa ou muda de tipo, resetar dados se ainda estiverem vazios
  // para garantir nova renderização do AG Grid
  React.useEffect(() => {
    if (tipoAtivo !== 'fluxo' && dados.length === 0) {
      setGridApi(null);
    }
  }, [tipoAtivo]);

  const carregarOpcoesCobranca = async () => {
    try {
      // Passar o tipo correto baseado no tipoAtivo (receber ou pagar)
      const tipo = tipoAtivo === 'receber' ? 'receber' : 'pagar';
      const opcoes = await RelatoriosService.buscarTiposCobranca(tipo);
      setOpcoesCobranca(opcoes);
    } catch (error) {
      console.error('Erro ao carregar opções de cobrança:', error);
      // Fallback: usando dados mocados se falhar a chamada
      setOpcoesCobranca([
        { codigo: '001', descricao: 'À Vista' },
        { codigo: '002', descricao: 'Boleto' },
        { codigo: '003', descricao: 'Crediário' },
        { codigo: '004', descricao: 'Cheque' },
        { codigo: '005', descricao: 'Transferência' },
        { codigo: '006', descricao: 'Cartão' }
      ]);
    }
  };

  const carregarTiposDocumento = async (filtrarPorFolha: boolean = false) => {
    try {
      console.log('🔄 Carregando tipos de documento...', filtrarPorFolha ? '(Apenas FOLHA)' : '(Todos)');

      let url = '/api/tabelas-auxiliares/tipos-documento';
      const params = new URLSearchParams();

      if (filtrarPorFolha) {
        params.append('abrev', 'FOLHA');
      }
      if (filtros.tipo === 'pagar') {
        params.append('tipo', 'pagar');
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      console.log('📡 URL:', url);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const tipos = await response.json();
        console.log('✅ Tipos de documento recebidos:', tipos);
        console.log('📊 Total de tipos:', tipos.length);

        const mapeados = tipos.map((t: any) => ({
          codigo: t.codigo || t.codigo_doc || t.codigo_docp,
          descricao: t.descricao || t.descr_doc || t.descr_docp,
          abrev: t.abrev || t.abrev_doc || t.abrev_docp
        }));

        console.log('✅ Tipos mapeados:', mapeados);
        setOpcoesTipoDocumento(mapeados);
      } else {
        throw new Error('Erro ao carregar tipos de documento');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tipos de documento:', error);
      setOpcoesTipoDocumento([]);
    }
  };

  // Recarregar tipos de documento quando checkbox Folha de Pagamento mudar
  useEffect(() => {
    if (filtros.tipo === 'pagar') {
      carregarTiposDocumento(filtros.folhaPagamento || false);
    }
  }, [filtros.folhaPagamento, filtros.tipo]);

  // Lê query param `tab` para abrir a aba diretamente (ex: /financeiro/relatorios?tab=consulta_caixa)
  const location = useLocation();

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'consulta_caixa') {
        handleSubMenuClick('consulta_caixa');
      } else if (tab === 'fluxo') {
        handleSubMenuClick('fluxo');
      } else if (tab === 'receber' || tab === 'pagar') {
        // força mudança para receber/pagar se solicitado
        handleSubMenuClick(tab as TipoRelatorio);
      }
    } catch (e) {
      // não bloquear em caso de erro de parsing
      console.warn('Erro ao ler query param tab:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Evitar chamar carregarPrevisoesPorDatas durante o render; usar useEffect
  React.useEffect(() => {
    if (filtros.tipo !== 'fluxo') return;
    try {
      const datas = Array.from(new Set((dados || []).map((r: any) => {
        const rawVenci = pickField(r, ['dtvenci_rec', 'dtvenci', 'dtvenc', 'dtvenc_rec', 'dtvenci_pag']) || r.data || r.dtmovi_cai || r.dtmovi || r.dtmovi_rec || r.dtmovi_pag || r.datai || '';
        return formatYMDUTC(rawVenci);
      }).filter((x: any) => x)));
      if (datas.length > 0) {
        carregarPrevisoesPorDatas(datas);
      }
    } catch (e) {
      // noop
    }
  }, [dados, filtros.tipo]);

  const carregarDepartamentos = async () => {
    try {
      const deptos = await RelatoriosService.buscarDepartamentos();
      setOpcoesDeptos(deptos);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      setOpcoesDeptos([]);
    }
  };

  // Calcular saldos por banco sempre que os dados mudarem
  React.useEffect(() => {
    try {
      const map: Record<string, number> = {};
      (dados || []).forEach((r: any) => {
        const names = [r.nomefan_bco, r.nome_bco, r.banco, r.banco_nome, r.cliente_banco];
        const bancoName = names.find((n: any) => n) || 'OUTROS';
        const key = String(bancoName || 'OUTROS');
        const valor = Number(r.vlrsal_rec ?? r.vlrsal_pag ?? r.valor ?? r.vlr ?? 0) || 0;
        map[key] = (map[key] || 0) + valor;
      });
      setSaldosPorBanco(map);
      // manter opções de banco derivadas dos dados
      const opts = Object.keys(map);
      setBancoOptions(opts);
    } catch (e) {
      setSaldosPorBanco({});
    }
  }, [dados, user]);

  // Carregar bancos e saldos a partir de dashboard_queries.id = 15 (cards de bancos)
  const carregarBancosDashboard = React.useCallback(async () => {
    try {
      const params: any = {};
      // 1) Preferir filial vinda da sessão (AuthContext)
      try {
        if (user) {
          const u: any = user as any;
          const candidatesUser = ['codigoFilSelecionado', 'codigo_filial', 'codigoFilial', 'filial', 'id_fil', 'codigoFil', 'defaultFilial', 'filialSelecionada', 'filial'];
          for (const k of candidatesUser) {
            if (u[k]) { params.filial = String(u[k]); break; }
          }
          if (!params.filial && (u.filial || u.filialId || u.id_fil)) {
            params.filial = String(u.filial || u.filialId || u.id_fil);
          }
        }
      } catch (e) {
        // ignore
      }

      // 2) Em seguida, tentar localStorage (compatibilidade retroativa)
      if (!params.filial) {
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            const candidates = ['codigoFilSelecionado', 'codigo_filial', 'codigoFilial', 'filial', 'id_fil', 'codigoFil', 'defaultFilial', 'filialSelecionada'];
            for (const k of candidates) {
              if (parsed[k]) { params.filial = String(parsed[k]); break; }
            }
            if (!params.filial) {
              for (const v of Object.values(parsed)) {
                if (typeof v === 'string' && /^\d{1,4}$/.test(v)) { params.filial = v; break; }
              }
            }
          }
        } catch (e) {
          // ignorar erros de parse
        }
      }

      // Garantir filial padrão caso não exista (evita retorno vazio da dashboard query)
      if (!params.filial) {
        params.filial = '001';
      }
      // Normalizar filial para 3 dígitos ('1' -> '001') pois backend costuma esperar 3 dígitos
      try {
        params.filial = String(params.filial || '001').padStart(3, '0');
      } catch (e) {
        params.filial = '001';
      }
      try { console.debug('[carregarBancosDashboard] calling dashboard-query 15 with params=', params); } catch (e) { }
      const resp = await RelatoriosService.executarDashboardQuery(15, params);
      const rows = resp?.rows || [];
      const map: Record<string, number> = {};
      const opts: string[] = [];
      rows.forEach((r: any) => {
        const banco = r.Banco || r.banco || r.nomefan_bco || r.nome_bco || r.banco_nome || r.cliente_banco || 'OUTROS';
        // suportar diferentes nomes de campo retornados (com/sem underscore ou espaço)
        const saldo = Number(r['Saldo Atual'] ?? r['Saldo_Atual'] ?? r.saldo ?? r.saldo_cai ?? r.valor ?? r.amount ?? 0) || 0;
        const key = String(banco || 'OUTROS');
        if (!opts.includes(key)) opts.push(key);
        map[key] = (map[key] || 0) + saldo;
      });
      // Debug: log para inspeção em console do navegador
      try { console.debug('[carregarBancosDashboard] rowsCount=', rows.length, 'opts=', opts, 'map=', map); } catch (e) { }
      const normalizeKeys = (m: Record<string, number>) => {
        const out: Record<string, number> = {};
        Object.keys(m || {}).forEach(k => {
          const key = String(k || '').trim();
          if (!key) return;
          out[key] = (out[key] || 0) + Number(m[k] || 0);
        });
        return out;
      };

      const setIfHas = (optsArr: string[], mapObj: Record<string, number>) => {
        const filteredOpts = Array.from(new Set((optsArr || []).map((x: any) => String(x || '').trim()).filter((x: string) => x.length > 0)));
        const normalizedMap = normalizeKeys(mapObj);
        if (filteredOpts.length > 0) {
          setBancoOptions(filteredOpts);
          setSaldosPorBanco(normalizedMap);
          return true;
        }
        return false;
      };

      if (!setIfHas(opts, map)) {
        // Fallback: se a dashboard query não retornou linhas, tentar derivar bancos a partir dos dados já carregados
        console.warn('Dashboard query id=15 retornou vazio - usando fallback a partir de `dados`.');
        const fallbackMap: Record<string, number> = {};
        (dados || []).forEach((r: any) => {
          const names = [r.nomefan_bco, r.nome_bco, r.banco, r.banco_nome, r.cliente_banco];
          const bancoName = names.find((n: any) => n) || 'OUTROS';
          const key = String(bancoName || 'OUTROS');
          const valor = Number(r.vlrsal_rec ?? r.vlrsal_pag ?? r.valor ?? r.vlr ?? 0) || 0;
          fallbackMap[key] = (fallbackMap[key] || 0) + valor;
        });
        const fallbackOpts = Object.keys(fallbackMap);
        if (!setIfHas(fallbackOpts, fallbackMap)) {
          // Último recurso: tentar chamada com filial padrão '001' (muitos ambientes usam '001')
          try {
            const filialRetry = params.filial || '001';
            const retryResp = await RelatoriosService.executarDashboardQuery(15, { filial: filialRetry });
            const retryRows = retryResp?.rows || [];
            const retryMap: Record<string, number> = {};
            const retryOpts: string[] = [];
            retryRows.forEach((r: any) => {
              const banco = r.Banco || r.banco || r.nomefan_bco || r.nome_bco || r.banco_nome || r.cliente_banco || 'OUTROS';
              const saldo = Number(r['Saldo Atual'] ?? r['Saldo_Atual'] ?? r.saldo ?? r.saldo_cai ?? r.valor ?? r.amount ?? 0) || 0;
              const key = String(banco || 'OUTROS');
              if (!retryOpts.includes(key)) retryOpts.push(key);
              retryMap[key] = (retryMap[key] || 0) + saldo;
            });
            if (!setIfHas(retryOpts, retryMap)) {
              // Nada encontrado: não sobrescrever opções existentes - apenas setar OUTROS se estiver vazio
              setBancoOptions(prev => (Array.isArray(prev) && prev.length > 0) ? prev : ['OUTROS']);
              setSaldosPorBanco(prev => (prev && Object.keys(prev).length > 0) ? prev : { 'OUTROS': 0 });
            }
          } catch (e) {
            console.warn('Retentativa dashboard query id=15 com filial=001 falhou:', e);
            setBancoOptions(prev => (Array.isArray(prev) && prev.length > 0) ? prev : ['OUTROS']);
            setSaldosPorBanco(prev => (prev && Object.keys(prev).length > 0) ? prev : { 'OUTROS': 0 });
          }
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar bancos via dashboard query id=3:', err);
    }
  }, [dados, user]);

  // Quando o tipo for fluxo, carregar os bancos/saldos via dashboard query
  React.useEffect(() => {
    if (filtros.tipo === 'fluxo') {
      carregarBancosDashboard();
    }
  }, [filtros.tipo, carregarBancosDashboard]);

  // Quando o usuário abrir a aba 'consulta_caixa', garantir que as opções de banco sejam carregadas
  React.useEffect(() => {
    if (tipoAtivo === 'consulta_caixa') {
      // Tentar carregar bancos do dashboard (cards) para popular o select de bancos
      carregarBancosDashboard();
      // Também tentar derivar opções a partir dos dados já existentes
      if ((dados || []).length > 0) {
        const bancosSet = new Set<string>(bancoOptions || []);
        (dados || []).forEach((r: any) => {
          const names = [r.nomefan_bco, r.nome_bco, r.banco, r.banco_nome, r.cliente_banco];
          names.forEach((n: any) => { if (n) bancosSet.add(String(n)); });
        });
        const novos = Array.from(bancosSet);
        if (novos.length > 0) setBancoOptions(novos);
      }
    }
  }, [tipoAtivo]);

  // Carregar KPIs globais do Fluxo (totais financeiros independentes da seleção)
  const carregarFluxoKPIs = React.useCallback(async () => {
    try {
      // Tentativa 1: pedir ao backend via mesmo endpoint sem filtros (se suportado)
      let resp: any = null;
      // Construir filtro mínimo usando as datas atuais do estado para consistência
      const globalFiltro: FiltroRelatorio = {
        ...filtros,
        tipo: 'fluxo',
        tipoDataFiltro: filtros.tipoDataFiltro || 'vencimento',
        dataFiltroInicial: filtros.dataFiltroInicial || filtros.dataini || formatYMDUTC(new Date()),
        dataFiltroFinal: filtros.dataFiltroFinal || filtros.datafim || formatYMDUTC(new Date()),
        soEmAberto: filtros.soEmAberto,
        soPagos: filtros.soPagos
      };
      try {
        resp = await RelatoriosService.buscarFluxoCaixa(globalFiltro);
      } catch (e) {
        try { console.debug('[carregarFluxoKPIs] buscarFluxoCaixa com filtro global falhou:', e); } catch (er) { }
        resp = null;
      }

      let rows: any[] = [];
      if (Array.isArray(resp)) rows = resp;
      else if (resp && Array.isArray(resp.rows)) rows = resp.rows;
      else if (resp && Array.isArray(resp.data)) rows = resp.data;
      else if (resp && Array.isArray(resp.value)) rows = resp.value; // suportar backend que retorna { value: [...] }

      // Filtrar linhas que representam subtotais/rolling windows (ex: subtotal_30dias)
      // para evitar dupla contagem quando o backend retorna linhas de detalhe + subtotal.
      const detectTipoLinha = (r: any): string | null => {
        if (!r || typeof r !== 'object') return null;
        const candidateKeys = Object.keys(r || []);
        // procurar por possíveis nomes de campo que indiquem tipo de linha
        const patterns = [/isTipoLinha/i, /tipoLinha/i, /is_tipo_linha/i, /tipo_linha/i, /linhaTipo/i, /isTipo/i, /is_subtotal/i, /subtotal/i, /tipo/i];
        for (const k of candidateKeys) {
          for (const p of patterns) {
            if (p.test(k)) {
              const val = r[k];
              if (val === undefined || val === null) return '';
              return String(val || '').trim();
            }
          }
        }
        return null;
      };

      const rowsFiltered = (rows || []).filter((r: any) => {
        try {
          if (!r) return false;
          const tipo = detectTipoLinha(r);
          if (tipo === null) return true; // sem meta-informacao -> manter
          const v = String(tipo || '').toLowerCase();
          // aceitar somente linhas explicitamente normais / detalhe
          if (v === '' || v === 'normal' || v === 'item' || v === 'detail' || v === 'detalhe' || v === 'linha') return true;
          // caso contrário (subtotal_30dias, subtotal, rolling, total_...), ignorar
          return false;
        } catch (e) {
          return true;
        }
      });

      // Deduplicar linhas por documento para evitar contagem duplicada
      const dedupeRowsByDoc = (arr: any[]) => {
        const seen = new Set<string>();
        const out: any[] = [];
        for (const r of arr) {
          try {
            // tentar extrair uma chave única de documento (preferir ids/numdup/docto)
            const docId = pickField(r, ['receber_id', 'codigo_rec', 'numdup_rec', 'docto_rec', 'codigo_rec']) || pickField(r, ['pagar_id', 'codigo_pag', 'numdup_pag', 'docto_pag', 'codigo_pag']);
            const tipoFlag = (r.tipo || r.__origem || (r.dc && String(r.dc).toUpperCase() === 'C' ? 'ENTRADA' : 'SAIDA') || '').toString();
            const key = `${tipoFlag}::${String(docId || '').trim()}::${formatYMDUTC(r.data || r.dtvenci_rec || r.dtvenci_pag || r.dtmovi || '')}`;
            if (!key || key === '::::') {
              // fallback: usar combinação de valor+data+descricao curta
              const fallback = `${String(r.valor || r.vlrsal_rec || r.vlrsal_pag || 0)}::${formatYMDUTC(r.data || r.dtvenci_rec || r.dtvenci_pag || '')}`;
              if (seen.has(fallback)) continue;
              seen.add(fallback);
              out.push(r);
            } else {
              if (seen.has(key)) continue;
              seen.add(key);
              out.push(r);
            }
          } catch (e) {
            out.push(r);
          }
        }
        return out;
      };

      const rowsDedup = dedupeRowsByDoc(rowsFiltered);

      if (!rows || rows.length === 0) {
        // fallback: tentar derivar a partir do estado `dados` já carregado
        rows = dados || [];
      }

      // Agregar entradas/saidas (usar lista filtrada para evitar subtotais)
      const gruposData: Record<string, { entradas: number; saidas: number }> = (rowsDedup || []).reduce((acc: Record<string, { entradas: number; saidas: number }>, row: any) => {
        // Use explicit vencimento field as grouping key (same as mestre/lista)
        const rawVenci = pickField(row, ['dtvenci_rec', 'dtvenci', 'dtvenc', 'dtvenc_rec', 'dtvenci_pag', 'dtvenci_rec']) || row.data || row.dtmovi_cai || row.dtmovi || row.dtmovi_rec || row.dtmovi_pag || row.datai || '';
        const key = formatYMDUTC(rawVenci) || '_ALL_';
        if (!acc[key]) acc[key] = { entradas: 0, saidas: 0 };

        let e = Number(row.entradas ?? 0) || 0;
        let s = Number(row.saidas ?? 0) || 0;
        if (!e && !s) {
          e = Number(row.vlrsal_rec ?? row.vlrdup_rec ?? row.valor ?? row.amount ?? 0) || 0;
          s = Number(row.vlrsal_pag ?? row.vlrdup_pag ?? 0) || 0;
          if ((!e && !s) && row.dc) {
            const v = Number(row.valor ?? row.amount ?? 0) || 0;
            if (String(row.dc).toUpperCase() === 'C') e = v; else s = v;
          }
        }

        acc[key].entradas += Number(e) || 0;
        acc[key].saidas += Number(s) || 0;
        return acc;
      }, {} as Record<string, { entradas: number; saidas: number }>);

      const totalEntradas: number = Object.values(gruposData).reduce((s: number, g: { entradas: number; saidas: number }) => s + (Number(g.entradas) || 0), 0);
      const totalSaidas: number = Object.values(gruposData).reduce((s: number, g: { entradas: number; saidas: number }) => s + (Number(g.saidas) || 0), 0);
      const saldoFinal: number = totalEntradas - totalSaidas;

      // Também buscar detalhes do dia (HOJE) no backend para garantir que o card HOJE reflita o total do servidor
      let entradasHoje = 0;
      let saidasHoje = 0;
      try {
        const hojeKey = formatYMDUTC(new Date());
        const detalhesHoje: any = await RelatoriosService.buscarDetalhesFluxoDia(hojeKey, false);
        if (detalhesHoje) {
          // Se o backend retornar 'totais', usar diretamente
          if (detalhesHoje.totais && (detalhesHoje.totais.entradas !== undefined || detalhesHoje.totais.saidas !== undefined)) {
            entradasHoje = Number(detalhesHoje.totais.entradas || 0) || 0;
            saidasHoje = Number(detalhesHoje.totais.saidas || 0) || 0;
          } else if (Array.isArray(detalhesHoje.titulos)) {
            // Backend retorna { data, titulos: [...] } (formato combinado)
            detalhesHoje.titulos.forEach((t: any) => {
              const tipo = t.tipo || '';
              const valor = Number(t.vlrsal_rec || t.vlrsal_pag || t.vlrdup_rec || t.vlrdup_pag || t.valor || 0) || 0;
              if (tipo === 'ENTRADA') entradasHoje += valor;
              else saidasHoje += valor;
            });
          } else {
            // Caso contrário, somar arrays receber/pagar
            if (Array.isArray(detalhesHoje.receber)) entradasHoje = detalhesHoje.receber.reduce((s: number, r: any) => s + (Number(r.vlrsal_rec || r.vlrdup_rec || r.valor || 0) || 0), 0);
            if (Array.isArray(detalhesHoje.pagar)) saidasHoje = detalhesHoje.pagar.reduce((s: number, r: any) => s + (Number(r.vlrsal_pag || r.vlrdup_pag || r.valor || 0) || 0), 0);
          }
        }
      } catch (errDetalhes) {
        // se falhar, manter entradasHoje/saidasHoje calculadas via rowsDedup (se houvesse)
        try {
          const hojeKey = formatYMDUTC(new Date());
          entradasHoje = Number((gruposData[hojeKey] && gruposData[hojeKey].entradas) || 0) || 0;
          saidasHoje = Number((gruposData[hojeKey] && gruposData[hojeKey].saidas) || 0) || 0;
        } catch (e) {
          entradasHoje = 0; saidasHoje = 0;
        }
      }

      setFluxoGlobalKPIs({ totalEntradas, totalSaidas, saldoFinal, entradasHoje, saidasHoje, saldoHoje: entradasHoje - saidasHoje });
    } catch (e) {
      console.warn('Erro ao carregar fluxoGlobalKPIs:', e);
      setFluxoGlobalKPIs(null);
    }
  }, [filtros.dataFiltroInicial, filtros.dataFiltroFinal, filtros.soEmAberto]);

  React.useEffect(() => {
    // Só disparar se for fluxo e houver datas definidas para evitar busca vazia no mount
    if (filtros.tipo === 'fluxo' && (filtros.dataFiltroInicial || filtros.dataini)) {
      carregarFluxoKPIs();
    }
  }, [filtros.tipo, filtros.dataFiltroInicial, filtros.dataFiltroFinal, carregarFluxoKPIs]);

  // Heurísticas para identificar se uma linha do detalhe pertence a RECEBER ou PAGAR
  function isReceberRow(row: any): boolean {
    if (!row) return false;
    const receberIndicators = ['receber_id', 'vlrsal_rec', 'vlrdup_rec', 'codigo_rec', 'numdup_rec', 'dtemissi_rec', 'dtvenci_rec'];
    return receberIndicators.some(k => Object.prototype.hasOwnProperty.call(row, k));
  }
  function isPagarRow(row: any): boolean {
    if (!row) return false;
    const pagarIndicators = ['pagar_id', 'vlrsal_pag', 'vlrdup_pag', 'codigo_pag', 'numdup_pag', 'dtemissi_pag', 'dtvenci_pag'];
    return pagarIndicators.some(k => Object.prototype.hasOwnProperty.call(row, k));
  }

  // KPIs do Fluxo calculados a partir dos dados carregados
  // Helpers reintroduzidos: parse e formatação local (movidos antes do uso para evitar ReferenceError)
  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  function formatarData(data: string) {
    if (!data) return '';
    // Usar parseDateLocal para evitar que strings 'YYYY-MM-DD' sejam interpretadas como UTC
    // (o que pode causar off-by-one em fusos negativos como -03:00)
    const d = parseDateLocal(data);
    if (!d) return '';
    return d.toLocaleDateString('pt-BR');
  }

  function parseDateLocal(value: any): Date | null {
    if (!value) return null;
    try {
      if (value instanceof Date) return value;
      const s = String(value).trim();
      // DD/MM/YYYY
      const matchDMY = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (matchDMY) {
        const [, d, m, y] = matchDMY;
        return new Date(Number(y), Number(m) - 1, Number(d));
      }
      // YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS(.sss)Z? -> treat as local date (ignore time/fuso)
      const matchYMD = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
      if (matchYMD) {
        const [, y, m, d] = matchYMD;
        return new Date(Number(y), Number(m) - 1, Number(d));
      }

      // Compact YMD like YYYYMMDD
      const matchYMD8 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
      if (matchYMD8) {
        const [, y, m, d] = matchYMD8;
        return new Date(Number(y), Number(m) - 1, Number(d));
      }

      // Fallback: let Date parse (may include time and timezone)
      return new Date(s);
    } catch (e) {
      return null;
    }
  }

  // formatYMDLocal removed (unused)

  // Normaliza uma data para YYYY-MM-DD usando a interpretação UTC
  // Recebe Date | string e retorna string YYYY-MM-DD considerando componentes UTC.
  function formatYMDUTC(dateLike: any): string {
    if (!dateLike) return '';
    try {
      if (dateLike instanceof Date) {
        const y = dateLike.getUTCFullYear();
        const m = String(dateLike.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateLike.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      const s = String(dateLike).trim();
      // DD/MM/YYYY -> convertendo diretamente
      const matchDMY = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (matchDMY) {
        const [, dd, mm, yyyy] = matchDMY;
        return `${yyyy}-${mm}-${dd}`;
      }
      // YYYY-MM-DD (com ou sem time) -> extrair a parte Y-M-D
      const matchYMD = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
      if (matchYMD) {
        const [, yyyy, mm, dd] = matchYMD;
        return `${yyyy}-${mm}-${dd}`;
      }
      // fallback: deixar o Date tentar interpretar e usar UTC
      const dt = new Date(s);
      if (isNaN(dt.getTime())) return '';
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch (e) {
      return '';
    }
  }

  function parseNumeric(valor: any): number {
    if (valor == null) return 0;
    if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
    const s = String(valor).replace(/R\$|\s/g, '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function onlyNumbers(v: string) { return v.replace(/\D/g, ''); }

  function applyMaskMoneyInput(e: React.ChangeEvent<HTMLInputElement>) {
    let v = onlyNumbers(e.target.value);
    if (v === '') return '0,00';
    v = v.padStart(3, '0');
    const intPart = v.slice(0, -2).replace(/^0+/, '') || '0';
    const decPart = v.slice(-2);
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart;
  }

  function parseMaskMoney(value: string): number {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  }

  function applyMaskPct(e: React.ChangeEvent<HTMLInputElement>) {
    let v = onlyNumbers(e.target.value);
    if (v === '') return '0,00';
    v = v.padStart(3, '0');
    const intPart = v.slice(0, -2).replace(/^0+/, '') || '0';
    const decPart = v.slice(-2);
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + decPart;
  }

  function parseMaskPct(value: string): number {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  }

  function applyMaskDate(e: React.ChangeEvent<HTMLInputElement>) {
    let v = onlyNumbers(e.target.value);
    const prevLen = v.length;
    if (prevLen > 8) v = v.slice(0, 8);
    let formatted = '';
    if (prevLen > 4) {
      formatted = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
    } else if (prevLen > 2) {
      formatted = v.slice(0, 2) + '/' + v.slice(2);
    } else {
      formatted = v;
    }
    return formatted;
  }

  // Normaliza data dd/MM/aaaa, YYYY-MM-DD ou DDMMYYYY para dd/MM/aaaa
  function normalizarData(valor: string): string {
    if (!valor) return '';
    const s = String(valor).trim();
    if (s.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = s.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    if (s.match(/^\d{8}$/)) {
      return `${s.slice(0,2)}/${s.slice(2,4)}/${s.slice(4,8)}`;
    }
    if (s.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return s;
    }
    return s;
  }

  function calcularDiasAtraso(dataVencimento: string): number {
    if (!dataVencimento) return 0;
    const venc = parseDateLocal(dataVencimento);
    if (!venc) return 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    venc.setHours(0, 0, 0, 0);
    const diffMs = hoje.getTime() - venc.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  function calcularJurosDocumento(saldo: number, dataVencimento: string, txjuroBco: number, vlracreExistente: number): number {
    if (vlracreExistente > 0 || txjuroBco <= 0) return 0;
    const dias = calcularDiasAtraso(dataVencimento);
    if (dias === 0) return 0;
    const taxaDiaria = txjuroBco / 100 / 30;
    const valorJuros = saldo * (Math.pow(1 + taxaDiaria, dias) - 1);
    return Math.round(valorJuros * 100) / 100;
  }

  // Renegociação: recalcular valor base por parcela (truncado, sem residual)
  function recalcularValorParcelas(form: typeof renegociacaoForm): number {
    if (form.parcelas <= 0) return 0;
    const jurosDecimal = form.juros / 100;
    const base = (form.valorRenegociado - form.desconto) * (1 + jurosDecimal) - form.entrada;
    if (base <= 0) return 0;
    return Math.floor((base / form.parcelas) * 100) / 100;
  }

  function calcularParcelasComResidual(form: typeof renegociacaoForm): { valorTruncado: number; residual: number } {
    const base = (form.valorRenegociado - form.desconto) * (1 + form.juros / 100) - form.entrada;
    if (base <= 0 || form.parcelas <= 0) return { valorTruncado: 0, residual: 0 };
    const valorTruncado = Math.floor((base / form.parcelas) * 100) / 100;
    const residual = parseFloat((base - valorTruncado * form.parcelas).toFixed(2));
    return { valorTruncado, residual };
  }

  function gerarParcelas(form: typeof renegociacaoForm): { valor: string; data: string }[] {
    const parcelas: { valor: string; data: string }[] = [];
    const numParcelas = Math.max(1, form.parcelas || 1);
    const { valorTruncado, residual } = calcularParcelasComResidual(form);

    if (form.entrada > 0) {
      const hoje = new Date();
      parcelas.push({
        valor: formatarMoeda(form.entrada),
        data: hoje.toLocaleDateString('pt-BR')
      });
    }

    const dia = form.diaVencimento ? parseInt(onlyNumbers(form.diaVencimento), 10) : 0;

    for (let i = 0; i < numParcelas; i++) {
      const valorReal = (i === numParcelas - 1) ? valorTruncado + residual : valorTruncado;
      let dt: Date;

      if (dia > 0) {
        const hoje = new Date();
        const mesAlvo = hoje.getMonth() + 1 + i;
        const anoAlvo = hoje.getFullYear() + Math.floor(mesAlvo / 12);
        const mesNormalizado = mesAlvo % 12;
        const ultimoDia = new Date(anoAlvo, mesNormalizado + 1, 0).getDate();
        dt = new Date(anoAlvo, mesNormalizado, Math.min(dia, ultimoDia));
      } else {
        const baseDate = form.vencimento ? parseDateLocal(form.vencimento) : null;
        if (baseDate) {
          dt = new Date(baseDate);
          dt.setMonth(dt.getMonth() + i);
        } else {
          dt = new Date();
          dt.setMonth(dt.getMonth() + i);
        }
      }

      parcelas.push({
        valor: formatarMoeda(valorReal),
        data: dt.toLocaleDateString('pt-BR')
      });
    }

    return parcelas;
  }

  function calcularParcelasComResidualSimulacao(form: typeof simulacaoForm) {
    const base = form.valorTotal * (1 + form.juros / 100) - form.entrada;
    if (base <= 0 || form.parcelas <= 0) return { valorTruncado: 0, residual: 0 };
    const valorTruncado = Math.floor((base / form.parcelas) * 100) / 100;
    const residual = parseFloat((base - valorTruncado * form.parcelas).toFixed(2));
    return { valorTruncado, residual };
  }

  function gerarParcelasSimulacao(form: typeof simulacaoForm): { valor: string; data: string }[] {
    const parcelas: { valor: string; data: string }[] = [];
    const numParcelas = Math.max(1, form.parcelas || 1);
    const { valorTruncado, residual } = calcularParcelasComResidualSimulacao(form);

    if (form.entrada > 0) {
      const hoje = new Date();
      parcelas.push({
        valor: formatarMoeda(form.entrada),
        data: hoje.toLocaleDateString('pt-BR')
      });
    }

    const dia = form.diaVencimento ? parseInt(onlyNumbers(form.diaVencimento), 10) : 0;

    for (let i = 0; i < numParcelas; i++) {
      const valorReal = (i === numParcelas - 1) ? valorTruncado + residual : valorTruncado;
      let dt: Date;

      if (dia > 0) {
        const hoje = new Date();
        const mesAlvo = hoje.getMonth() + 1 + i;
        const anoAlvo = hoje.getFullYear() + Math.floor(mesAlvo / 12);
        const mesNormalizado = mesAlvo % 12;
        const ultimoDia = new Date(anoAlvo, mesNormalizado + 1, 0).getDate();
        dt = new Date(anoAlvo, mesNormalizado, Math.min(dia, ultimoDia));
      } else {
        const baseDate = form.vencimento ? parseDateLocal(form.vencimento) : null;
        if (baseDate) {
          dt = new Date(baseDate);
          dt.setMonth(dt.getMonth() + i);
        } else {
          dt = new Date();
        }
      }

      parcelas.push({
        valor: formatarMoeda(valorReal),
        data: dt.toLocaleDateString('pt-BR')
      });
    }

    return parcelas;
  }

  // Retorna documento MASCARADO (CPF/CNPJ) - apenas últimos 2 dígitos visíveis
  // Procura em vários nomes de campo possíveis (compatibilidade com diferentes queries)
  function getMaskedDocumento(det: any, suffix?: 'rec' | 'pag' | ''): string {
    if (!det) return '';
    const sfx = suffix || '';
    const possibleTipoKeys = [
      `tipopessoa_${sfx}`,
      `tipopessoa${sfx ? '_' + sfx : ''}`,
      `tipo_pessoa`,
      `tipo`,
      `tipopessoa`,
      `cliforn_cli`
    ];
    // aceitar também campos já formatados/formatados pelo backend/frontend (ex.: cgccpf_rec_formatted)
    const possibleCpfKeys = [
      `cgccpf_${sfx}`,
      `cgccpf${sfx ? '_' + sfx : ''}`,
      `cgccpf`,
      `cgccpf_${sfx}_formatted`,
      `cgccpf${sfx ? '_' + sfx + '_formatted' : '_formatted'}`,
      `cgccpf_formatted`,
      `cgc_cpf`,
      `cpf`,
      `cnpj`,
      `documento`,
      `document`,
      `cgccpf_rec`,
      `cgccpf_pag`,
      `cpf_cli`,
      `cpf_for`,
      `cgccpf_cli`
    ];

    let tipoPessoa: any = '';
    for (const k of possibleTipoKeys) {
      if (Object.prototype.hasOwnProperty.call(det, k) && det[k]) { tipoPessoa = det[k]; break; }
    }

    // Se existir campo já formatado (ex.: cgccpf_rec_formatted), usar como está (mantém comportamento do AG Grid)
    for (const k of possibleCpfKeys) {
      if (Object.prototype.hasOwnProperty.call(det, k) && det[k]) {
        // se o campo encontrado já contém caracteres não numéricos e aparenta estar formatado, retornamos diretamente
        const candidate = det[k];
        if (typeof candidate === 'string' && /\D/.test(candidate)) {
          return String(candidate);
        }
        // caso contrário, guarda para processamento numérico
        var rawVal: any = candidate;
        break;
      }
    }

    if (typeof rawVal === 'undefined' || rawVal == null) rawVal = '';

    if (!rawVal) return '';
    const digits = String(rawVal).replace(/\D/g, '');
    if (!digits) return '';

    const isCPF = (String(tipoPessoa).toUpperCase() === 'F') || digits.length === 11;
    const isCNPJ = (String(tipoPessoa).toUpperCase() === 'J') || digits.length === 14;

    // Manter comportamento compatível com AG-Grid: mascarar mostrando apenas os 2 últimos dígitos
    if (isCPF && digits.length >= 11) {
      const d = digits.slice(-11);
      // Full formatted: 000.000.000-00
      const last2 = d.slice(-2);
      // manter formato padrão com hífen antes dos 2 últimos dígitos
      return `***.***.***-${last2}`;
    }
    if (isCNPJ && digits.length >= 14) {
      const d = digits.slice(-14);
      // Full formatted: 00.000.000/0000-00
      const last2 = d.slice(-2);
      // tentar preservar o separador original que o backend pode ter usado
      const rawStr = String(rawVal || '');
      // procurar um separador não numérico imediatamente antes dos 2 últimos dígitos
      const sepMatch = rawStr.match(/(\D)(\d{2})\s*$/);
      const sep = sepMatch ? sepMatch[1] : '-';
      return `**.***.***/****${sep}${last2}`;
    }

    return String(rawVal);
  }

  // Retorna documento COMPLETO E FORMATADO (CPF/CNPJ) - todos os dígitos visíveis
  // Procura em vários nomes de campo possíveis (compatibilidade com diferentes queries)
  function getFormattedDocumento(det: any, suffix?: 'rec' | 'pag' | ''): string {
    if (!det) return '';
    const sfx = suffix || '';
    const possibleTipoKeys = [
      `tipopessoa_${sfx}`,
      `tipopessoa${sfx ? '_' + sfx : ''}`,
      `tipo_pessoa`,
      `tipo`,
      `tipopessoa`,
      `cliforn_cli`
    ];
    const possibleCpfKeys = [
      `cgccpf_${sfx}`,
      `cgccpf${sfx ? '_' + sfx : ''}`,
      `cgccpf`,
      `cgccpf_${sfx}_formatted`,
      `cgccpf${sfx ? '_' + sfx + '_formatted' : '_formatted'}`,
      `cgccpf_formatted`,
      `cgc_cpf`,
      `cpf`,
      `cnpj`,
      `documento`,
      `document`,
      `cgccpf_rec`,
      `cgccpf_pag`,
      `cpf_cli`,
      `cpf_for`,
      `cgccpf_cli`
    ];

    let tipoPessoa: any = '';
    for (const k of possibleTipoKeys) {
      if (Object.prototype.hasOwnProperty.call(det, k) && det[k]) { tipoPessoa = det[k]; break; }
    }

    // Se existir campo já formatado, usar como está
    for (const k of possibleCpfKeys) {
      if (Object.prototype.hasOwnProperty.call(det, k) && det[k]) {
        const candidate = det[k];
        if (typeof candidate === 'string' && /\D/.test(candidate)) {
          return String(candidate);
        }
        var rawVal: any = candidate;
        break;
      }
    }

    if (typeof rawVal === 'undefined' || rawVal == null) rawVal = '';

    if (!rawVal) return '';
    const digits = String(rawVal).replace(/\D/g, '');
    if (!digits) return '';

    const isCPF = (String(tipoPessoa).toUpperCase() === 'F') || digits.length === 11;
    const isCNPJ = (String(tipoPessoa).toUpperCase() === 'J') || digits.length === 14;

    // Formatar COMPLETO (sem mascarar)
    if (isCPF && digits.length >= 11) {
      const d = digits.slice(-11);
      // Formato: 000.000.000-00
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    }
    if (isCNPJ && digits.length >= 14) {
      const d = digits.slice(-14);
      // Formato: 00.000.000/0000-00
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
    }

    return String(rawVal);
  }

  // Helper: retorna o primeiro campo não nulo/undef dentre uma lista de chaves possíveis
  function pickField(det: any, candidates: string[]): any {
    if (!det) return null;
    for (const k of candidates) {
      if (Object.prototype.hasOwnProperty.call(det, k) && det[k] != null && String(det[k]).toString().trim() !== '') {
        return det[k];
      }
    }
    return null;
  }

  // Detecta linhas geradas como subtotal/agrupamento pelo backend
  function isSubtotalRow(r: any): boolean {
    if (!r || typeof r !== 'object') return false;
    try {
      const keys = Object.keys(r || {});
      for (const k of keys) {
        const lk = String(k).toLowerCase();
        if (lk.indexOf('subtotal') >= 0 || lk.indexOf('tipo_linha') >= 0 || lk.indexOf('is_tipo_linha') >= 0 || lk.indexOf('is_tipo') >= 0 || lk.indexOf('linha_tipo') >= 0) {
          const v = String(r[k] || '').toLowerCase();
          if (!v) return true; // chave existe sem valor -> provável subtotal/marker
          // considerar normal/item/detalhe como válido, caso contrário é subtotal/rolling
          if (['normal', 'item', 'detalhe', 'linha', 'detail'].indexOf(v) === -1) return true;
        }
      }

      // casos comuns: backend pode retornar campo 'subtotal' booleano ou _subtotal
      if (r.subtotal === true || r._subtotal === true) return true;
      // ou campos que contenham 'total' mas não contenham identificador de documento
      for (const k of keys) {
        const lk = String(k).toLowerCase();
        if (lk.indexOf('total') >= 0 && !Object.prototype.hasOwnProperty.call(r, 'receber_id') && !Object.prototype.hasOwnProperty.call(r, 'pagar_id')) {
          return true;
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  // Helper: busca por chave usando padrões (case-insensitive, contains)
  function findByPattern(det: any, patterns: string[]): any {
    if (!det) return null;
    const keys = Object.keys(det || {});
    const lowerKeys = keys.map(k => String(k).toLowerCase());
    for (const p of patterns) {
      const lp = p.toLowerCase();
      // 1) exact match
      let idx = lowerKeys.indexOf(lp);
      if (idx >= 0) {
        const v = det[keys[idx]];
        if (v != null && String(v).trim() !== '') return v;
      }
      // 2) contains
      idx = lowerKeys.findIndex(k => k.indexOf(lp) >= 0);
      if (idx >= 0) {
        const v = det[keys[idx]];
        if (v != null && String(v).trim() !== '') return v;
      }
    }
    return null;
  }
  const fluxoKpis = React.useMemo(() => {
    if (filtros.tipo !== 'fluxo') return null;
    try {
      // Agrupar por data normalizada (YYYY-MM-DD)
      // Deduplicar linhas por documento antes de agregar (evita duplicidade entre fontes)
      const dedupeRowsByDocLocal = (arr: any[]) => {
        const seen = new Set<string>();
        const out: any[] = [];
        for (const r of (arr || [])) {
          try {
            const docId = pickField(r, ['receber_id', 'codigo_rec', 'numdup_rec', 'docto_rec', 'codigo_rec']) || pickField(r, ['pagar_id', 'codigo_pag', 'numdup_pag', 'docto_pag', 'codigo_pag']);
            const tipoFlag = (r.tipo || r.__origem || (r.dc && String(r.dc).toUpperCase() === 'C' ? 'ENTRADA' : 'SAIDA') || '').toString();
            const key = `${tipoFlag}::${String(docId || '').trim()}::${formatYMDUTC(r.data || r.dtvenci_rec || r.dtvenci_pag || r.dtmovi || '')}`;
            if (!key || key === '::::') {
              const fallback = `${String(r.valor || r.vlrsal_rec || r.vlrsal_pag || 0)}::${formatYMDUTC(r.data || r.dtvenci_rec || r.dtvenci_pag || '')}`;
              if (seen.has(fallback)) continue;
              seen.add(fallback);
              out.push(r);
            } else {
              if (seen.has(key)) continue;
              seen.add(key);
              out.push(r);
            }
          } catch (e) {
            out.push(r);
          }
        }
        return out;
      };

      const dedupedDados = dedupeRowsByDocLocal(dados || []);

      const gruposData = (dedupedDados || []).reduce((acc: any, row: any) => {
        // Ignorar linhas que representam subtotais/agrupamentos retornados pelo backend
        if (row && row.isTipoLinha && String(row.isTipoLinha).toLowerCase() !== 'normal') {
          return acc;
        }

        const raw = row.data || row.dtmovi_cai || row.dtmovi || row.dtmovi_rec || row.dtvenci_rec || row.dtmovi_pag || row.datai || '';
        const key = formatYMDUTC(raw);
        if (!acc[key]) acc[key] = { entradas: 0, saidas: 0 };

        // Usar row.tipo para evitar que row.valor (setado pelo backend)
        // polua a categoria oposta (ENTRADA vira saida e vice-versa)
        let e = 0;
        let s = 0;
        const rowTipo = row.tipo || '';
        if (rowTipo === 'ENTRADA') {
          e = Number(row.vlrsal_rec ?? row.vlrdup_rec ?? row.valor ?? row.amount ?? 0) || 0;
        } else if (rowTipo === 'SAÍDA') {
          s = Number(row.vlrsal_pag ?? row.vlrdup_pag ?? 0) || 0;
        } else {
          // Sem tipo: fallback completo (dados do fallback local ou sem tipo)
          e = Number(row.entradas ?? 0) || Number(row.vlrsal_rec ?? row.vlrdup_rec ?? row.valor ?? row.amount ?? 0) || 0;
          s = Number(row.saidas ?? 0) || Number(row.vlrsal_pag ?? row.vlrdup_pag ?? 0) || 0;
          if ((!e && !s) && row.dc) {
            const v = Number(row.valor ?? row.amount ?? 0) || 0;
            if (String(row.dc).toUpperCase() === 'C') e = v; else s = v;
          }
        }

        acc[key].entradas += e;
        acc[key].saidas += s;
        return acc;
      }, {});

      const grupos = Object.keys(gruposData).map(k => ({ dataKey: k, ...gruposData[k] }));
      const todayKey = formatYMDUTC(new Date());
      const gruposFiltrados = filterOnlyHoje ? grupos.filter((g: any) => g.dataKey === todayKey) : grupos;

      const totalEntradas = gruposFiltrados.reduce((s: number, g: any) => s + (Number(g.entradas) || 0), 0);
      const totalSaidas = gruposFiltrados.reduce((s: number, g: any) => s + (Number(g.saidas) || 0), 0);

      const hojeGroup = grupos.find((g: any) => g.dataKey === todayKey) || { entradas: 0, saidas: 0 };
      const entradasHoje = Number(hojeGroup.entradas) || 0;
      const saidasHoje = Number(hojeGroup.saidas) || 0;

      return {
        totalEntradas,
        totalSaidas,
        saldoFinal: totalEntradas - totalSaidas,
        entradasHoje,
        saidasHoje,
        saldoHoje: entradasHoje - saidasHoje
      };
    } catch (e) {
      console.warn('Erro calculando fluxoKpis', e);
      return null;
    }
  }, [dados, filtros.tipo, filterOnlyHoje]);

  const subMenuItems = [
    {
      key: 'receber' as TipoRelatorio,
      label: 'Contas a Receber',
      icon: faMoneyBillWave,
      color: '#059669'
    },
    {
      key: 'pagar' as TipoRelatorio,
      label: 'Contas a Pagar',
      icon: faFileInvoiceDollar,
      color: '#dc2626'
    },
    {
      key: 'fluxo' as TipoRelatorio,
      label: 'Fluxo de Caixa',
      icon: faCashRegister,
      color: '#7c3aed'
    }
    , {
      key: 'consulta_caixa' as TipoRelatorio,
      label: 'Consulta caixa e bancos',
      icon: faSearch,
      color: '#059669'
    }
    , {
      key: 'renegociacao' as TipoRelatorio,
      label: 'Renegociação',
      icon: faHandshake,
      color: '#0891b2'
    }
  ];

  const handleSubMenuClick = (tipo: TipoRelatorio) => {
    setTipoAtivo(tipo);
    setFiltrosAlterados(false);
    // IMPORTANTE: Resetar gridApi quando muda de tab para evitar estado inconsistente
    setGridApi(null);
    setTotalRow(null);
    if (tipo !== 'renegociacao') {
      setRenegociacaoDados([]);
    }

    // If switching to fluxo, set sensible defaults (HOJE) and fetch immediately
    if (tipo === 'fluxo') {
      const hoje = new Date();
      const dataFinal = new Date(hoje);
      dataFinal.setDate(dataFinal.getDate()); // default period = today
      const newFiltros: FiltroRelatorio = {
        ...filtros,
        tipo: 'fluxo',
        tipoCampoData: filtros.tipoCampoData || undefined,
        faixaAtraso: '',
        dataFiltroInicial: formatYMDUTC(hoje),
        dataFiltroFinal: formatYMDUTC(dataFinal)
      };
      setFiltros(newFiltros);
      setDados([]);
      buscarDados(newFiltros);
    } else {
      setFiltros(prev => ({
        ...prev,
        tipo,
        tipoCampoData: tipo === 'receber' ? 'dtvenci_rec' : (tipo === 'pagar' ? 'dtvenci_pag' : prev.tipoCampoData)
      }));
      setDados([]);
    }
  };

  const handleFilterChange = (field: keyof FiltroRelatorio, value: any) => {
    setFiltrosAlterados(true);
    // Se mudou o checkbox Folha de Pagamento, limpar seleção de tipos de documento
    if (field === 'folhaPagamento') {
      setFiltros(prev => ({
        ...prev,
        [field]: value,
        tiposDocumento: [], // Limpar array de múltiplas seleções
        tipoDocumento: ''   // Limpar seleção única
      }));
    } else {
      setFiltros(prev => ({ ...prev, [field]: value }));
    }
  };

  // handleSearchChange removed (searchText state unused). Use AG-Grid quick filter directly via `gridApi.setQuickFilter` where needed.

  // Recalcular TOTAL baseado nos dados filtrados
  const recalcularTotal = () => {
    if (!gridApi || !gridApi.forEachNodeAfterFilter) return;

    const visibleRows: any[] = [];
    gridApi.forEachNodeAfterFilter((node: any) => {
      if (node.data) {
        visibleRows.push(node.data);
      }
    });

    console.log('🔍 DEBUG recalcularTotal:', {
      tipoAtivo,
      visibleRowsCount: visibleRows.length,
      primeiraLinha: visibleRows[0],
      ultimaLinha: visibleRows[visibleRows.length - 1]
    });

    // Função auxiliar para extrair número de string ou número
    const extrairNumero = (valor: any): number => {
      if (typeof valor === 'number') {
        return isNaN(valor) ? 0 : valor;
      }
      if (!valor) return 0;

      const str = String(valor).trim();
      // Remove R$, espaços, remove ponto de milhar, substitui vírgula por ponto
      const limpo = str
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '') // Remove ponto de milhar
        .replace(/,/g, '.'); // Converte vírgula para ponto

      const num = parseFloat(limpo);
      return isNaN(num) ? 0 : num;
    };

    if (tipoAtivo === 'receber') {
      const sumValorDup = visibleRows.reduce((sum, row) => {
        const valor = extrairNumero(row.vlrdup_rec);
        console.log('  vlrdup_rec:', row.vlrdup_rec, '→', valor);
        return sum + valor;
      }, 0);

      const sumSaldo = visibleRows.reduce((sum, row) => {
        const valor = extrairNumero(row.vlrsal_rec);
        console.log('  vlrsal_rec:', row.vlrsal_rec, '→', valor);
        return sum + valor;
      }, 0);

      const newTotal = {
        nome_cli: '✓ TOTAL:',
        vlrdup_rec: sumValorDup,
        vlrsal_rec: sumSaldo
      };
      console.log('✅ TOTAL Receber:', newTotal);
      setTotalRow(newTotal);
    } else {
      const sumValorDup = visibleRows.reduce((sum, row) => {
        const valor = extrairNumero(row.vlrdup_pag);
        console.log('  vlrdup_pag:', row.vlrdup_pag, '→', valor);
        return sum + valor;
      }, 0);

      const sumSaldo = visibleRows.reduce((sum, row) => {
        const valor = extrairNumero(row.vlrsal_pag);
        console.log('  vlrsal_pag:', row.vlrsal_pag, '→', valor);
        return sum + valor;
      }, 0);

      const newTotal = {
        nome_for: '✓ TOTAL:',
        vlrdup_pag: sumValorDup,
        vlrsal_pag: sumSaldo
      };
      console.log('✅ TOTAL Pagar:', newTotal);
      setTotalRow(newTotal);
    }
  };

  const buscarRenegociacao = async () => {
    try {
      setRenegociacaoLoading(true);
      const filtrosBusca: any = {
        tipo: renegociacaoTipo,
        tipoDataFiltro: 'vencimento',
        soEmAberto: true,
        soPagos: false,
        userId: user?.userId
      };
      if (renegociacaoSearch.trim()) {
        filtrosBusca.nomeCliente = renegociacaoSearch.trim();
      }
      const resultado = await RelatoriosService.buscarRelatorioFinanceiro(filtrosBusca as any);
      let dadosFiltrados = resultado || [];
      if (renegociacaoSearch.trim()) {
        const termoBusca = renegociacaoSearch.trim().toLowerCase();
        dadosFiltrados = dadosFiltrados.filter((r: any) => {
          const nome = (r.nome_cli || '').toLowerCase();
          return nome === termoBusca || nome.startsWith(termoBusca) || nome.includes(termoBusca);
        });
      }
      setRenegociacaoDados(dadosFiltrados);
      setRenegociacaoSuggestions([]);
      setRenegociacaoShowDropdown(false);
      renegociacaoBlockAutoComplete.current = true;
    } catch (error: any) {
      console.error('Erro ao buscar dados para renegociação:', error);
      const msgErro = error.response?.data?.[0]?.erro || error.response?.data?.erro || error.message;
      alert(`Erro ao buscar dados: ${msgErro || 'Verifique os filtros e tente novamente.'}`);
    } finally {
      setRenegociacaoLoading(false);
    }
  };

  const buscarSugestoesClientes = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setRenegociacaoSuggestions([]);
      setRenegociacaoShowDropdown(false);
      return;
    }
    try {
      const filtrosBusca: any = {
        tipo: renegociacaoTipo,
        tipoDataFiltro: 'vencimento',
        soEmAberto: true,
        soPagos: false,
        nomeCliente: termo,
        userId: user?.userId
      };
      const resultado = await RelatoriosService.buscarRelatorioFinanceiro(filtrosBusca as any);
      const seen = new Set<string>();
      const nomes: string[] = [];
      resultado.forEach((r: any) => {
        const nome = r.nome_cli;
        if (nome && !seen.has(nome)) {
          seen.add(nome);
          nomes.push(nome);
        }
      });
      setRenegociacaoSuggestions(nomes.slice(0, 15));
      setRenegociacaoShowDropdown(nomes.length > 0);
    } catch (e) {
      // ignore autocomplete errors
    }
  }, [renegociacaoTipo, user?.userId]);

  const recalcularTotalRenegociacao = useCallback((rows: any[]) => {
    if (!rows || rows.length === 0) {
      setRenegociacaoTotalRow(null);
      return;
    }
    const isReceber = renegociacaoTipo === 'receber';
    const sumValor = rows.reduce((acc: number, r: any) => acc + (Number(r[isReceber ? 'vlrdup_rec' : 'vlrdup_pag']) || 0), 0);
    const sumSaldo = rows.reduce((acc: number, r: any) => acc + (Number(r[isReceber ? 'vlrsal_rec' : 'vlrsal_pag']) || 0), 0);
    if (isReceber) {
      setRenegociacaoTotalRow({ nome_cli: '✓ TOTAL:', vlrdup_rec: sumValor, vlrsal_rec: sumSaldo });
    } else {
      setRenegociacaoTotalRow({ nome_for: '✓ TOTAL:', vlrdup_pag: sumValor, vlrsal_pag: sumSaldo });
    }
  }, [renegociacaoTipo]);

  useEffect(() => {
    if (renegociacaoDados.length > 0) {
      recalcularTotalRenegociacao(renegociacaoDados);
    } else {
      setRenegociacaoTotalRow(null);
    }
  }, [renegociacaoDados, recalcularTotalRenegociacao]);

  useEffect(() => {
    if (renegociacaoBlockAutoComplete.current) return;
    if (renegociacaoSearch.trim().length < 2) {
      setRenegociacaoDados([]);
      setRenegociacaoTotalRow(null);
      setRenegociacaoSuggestions([]);
      setRenegociacaoShowDropdown(false);
      return;
    }
    const timer = setTimeout(() => {
      if (renegociacaoBlockAutoComplete.current) return;
      buscarSugestoesClientes(renegociacaoSearch.trim());
      buscarRenegociacao();
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renegociacaoSearch, renegociacaoTipo, user?.userId]);

  const buscarConsultaCaixa = async () => {
    try {
      console.log('[DEBUG-CONSULTA-CAIXA] buscarConsultaCaixa() iniciada');
      setConsultaLoading(true);
      setHasSearchedConsulta(true);

      const params: any = {
        dataInicial: consultaDataInicial || undefined,
        dataFinal: consultaDataFinal || undefined,
        tipoData: consultaTipoData || 'caixa',
        centroCusto: (consultaCentroCusto && consultaCentroCusto !== 'Todos') ? consultaCentroCusto : undefined,
        operacao: (consultaOperacao && consultaOperacao !== 'Todos') ? consultaOperacao : undefined,
        mascai: consultaMascai || undefined
      };
      if (bancoSelecionado && bancoSelecionado !== 'Todos') params.banco = bancoSelecionado;

      console.log('[DEBUG-CONSULTA-CAIXA] params:', params);
      const resp = await RelatoriosService.buscarConsultaCaixa(params);
      console.log('[DEBUG-CONSULTA-CAIXA] resp bruta:', resp);
      const data = Array.isArray(resp) ? resp : [];

      // Buscar previsões de receitas e despesas por operação
      let previsoes: any = {};
      try {
        const prevRec = await RelatoriosService.buscarPrevisaoReceitas();
        const prevDesp = await RelatoriosService.buscarPrevisaoDespesas();

        if (Array.isArray(prevRec)) {
          prevRec.forEach((p: any) => {
            const keyDescr = `C-${p.descr_ocai || p.operacao_ocai}`;
            previsoes[keyDescr] = { ...p, tipo: 'C', previsto: p.valor_previsto || 0, desvioper: p.percentual_desvio || 0 };
            const keyOper = `C-${p.operacao_ocai}`;
            if (!previsoes[keyOper]) {
              previsoes[keyOper] = { ...p, tipo: 'C', previsto: p.valor_previsto || 0, desvioper: p.percentual_desvio || 0 };
            }
          });
        }
        if (Array.isArray(prevDesp)) {
          prevDesp.forEach((p: any) => {
            const keyDescr = `D-${p.descr_ocai || p.operacao_ocai}`;
            previsoes[keyDescr] = { ...p, tipo: 'D', previsto: p.valor_previsto || 0, desvioper: p.percentual_desvio || 0 };
            const keyOper = `D-${p.operacao_ocai}`;
            if (!previsoes[keyOper]) {
              previsoes[keyOper] = { ...p, tipo: 'D', previsto: p.valor_previsto || 0, desvioper: p.percentual_desvio || 0 };
            }
          });
        }
        setPrevisoesPorOperacao(previsoes);
      } catch (e) {
        console.warn('[DEBUG-CONSULTA-CAIXA] Erro ao buscar previsões:', e);
      }

      // Normalizar campos para o AG Grid
      const mapped = data.map((r: any) => {
        const out: any = { ...r };
        // data: 20251218 -> 2025-12-18
        try {
          if (typeof out.dtmovi_cai === 'string') {
            const s = out.dtmovi_cai.trim().replace(/-/g, '');
            if (/^\d{8}$/.test(s)) {
              out.dtmovi_cai = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
            }
          }
        } catch (e) { /* noop */ }

        // valor como número
        try {
          const vRaw = out.valor_cai !== undefined ? out.valor_cai : out.valor;
          out.valor_cai = vRaw ? Number(vRaw) : 0;
        } catch (e) { out.valor_cai = 0; }

        if (!out.nome_cai || String(out.nome_cai).trim() === '') {
          out.nome_cai = out.banco_cai || out.codbanco_cai || '';
        }

        return out;
      });

      console.log('[DEBUG-CONSULTA-CAIXA] mapped final:', mapped);
      setConsultaDados(mapped);

      // Aplicar no gridApi se disponível
      if (gridApi) {
        gridApi.setRowData(mapped);
      } else {
        (window as any).__lastConsultaCaixa = mapped;
      }

      return mapped;
    } catch (err) {
      console.error('Erro buscarConsultaCaixa', err);
      setConsultaDados([]);
      return [];
    } finally {
      setConsultaLoading(false);
    }
  };

  const abrirFormularioCaixaPopup = async (row: any) => {
    try {
      console.log('[abrirFormularioCaixaPopup] ========== INICIANDO FLUXO DE EDIÇÃO ==========');
      console.log('[abrirFormularioCaixaPopup] Row completo recebido:', row);
      console.log('[abrirFormularioCaixaPopup] Keys disponíveis no row:', Object.keys(row));

      // (filial_cai, tipocai_cai, cliforn_cai, codbanco_cai, dtmovi_cai, seq_cai)
      const filial_cai = row.filial_cai || row.filial || '001';
      const tipocai_cai = row.tipocai_cai || '001'; // TIPO: '001'=Caixa/Bancos, '002'=Viagem
      const cliforn_cai = '   '; // SEMPRE VAZIO - nunca tem valor
      const codbanco_cai = row.codbanco_cai || row.codigo_cliente || ''; // Código do banco
      const dtmovi_cai = row.dtmovi_cai || row.data || row.dtmovi || '';
      const seq_cai = row.seq_cai || row.sequencia || row.seq || row.id || null;

      // ✅ DIAGNÓSTICO: Verificar formato da data
      console.log('[abrirFormularioCaixaPopup] 🔍 DIAGNÓSTICO DE DATA:');
      console.log('[abrirFormularioCaixaPopup]   row.dtmovi_cai (raw):', row.dtmovi_cai, '| tipo:', typeof row.dtmovi_cai);
      console.log('[abrirFormularioCaixaPopup]   row.data:', row.data, '| tipo:', typeof row.data);
      console.log('[abrirFormularioCaixaPopup]   row.dtmovi:', row.dtmovi, '| tipo:', typeof row.dtmovi);
      console.log('[abrirFormularioCaixaPopup]   dtmovi_cai (final):', dtmovi_cai, '| tipo:', typeof dtmovi_cai, '| length:', dtmovi_cai.length);
      console.log('[abrirFormularioCaixaPopup]   Esperado: YYYY-MM-DD format (ex: 2025-12-01)');
      if (dtmovi_cai && dtmovi_cai !== '' && !dtmovi_cai.includes('-') && dtmovi_cai.length !== 8) {
        console.error('[abrirFormularioCaixaPopup]   ❌ ERRO: Data em formato desconhecido!', dtmovi_cai);
      }

      // ✅ NOVO: Determinar tipo_documento (R=Receber, P=Pagar)
      // Se houver documentos vinculados, usar seu tipo; caso contrário, inferir de dc_cai ou usar padrão
      let tipo_documento = 'R'; // padrão
      if (row.documentos_vinculados && Array.isArray(row.documentos_vinculados) && row.documentos_vinculados.length > 0) {
        tipo_documento = row.documentos_vinculados[0].tipo || 'R';
      } else if (row.tipo === 'P' || row.dc_cai === 'P') {
        tipo_documento = 'P';
      }

      const payload: any = {
        // Chave primária completa
        filial_cai,
        tipocai_cai,
        cliforn_cai,
        codbanco_cai,
        dtmovi_cai,
        seq_cai,
        // ✅ NOVO: tipo_documento (necessário para buscar documentos corretamente)
        tipo_documento,
        // ✅ NOVO: cliente_cai (ALIAS de codbanco_cai, necessário para CaixaBancosForm buscar documentos)
        cliente_cai: row.clifor_cai || codbanco_cai,
        // ✅ NOVO: codigo_cliente (necessário para carregarDocumentosAbertosComCliente)
        codigo_cliente: row.clifor_cai || codbanco_cai,
        clifor_cai: row.clifor_cai || '',
        // Campos adicionais para população do formulário
        oper_cai: row.oper_cai || row.operacao || '',
        operacao_ocai: row.operacao_ocai || null, // ✅ NOVO: Código da operação (não descrição)
        operacao_cai: row.operacao_cai || null,
        dc_cai: row.dc_cai || row.tipo || '',
        valor_cai: row.valor_cai || row.valor || 0,
        histor_cai: row.histor_cai || row.historico || '',
        nome_cai: row.nome_cai || row.banco || '',
        dpto_cai: row.dpto_cai || row.centro_custo || '', // ✅ NOVO: Centro de custo
        documentos_vinculados: row.documentos_vinculados || row.linked_documents || undefined
      };

      console.log('[abrirFormularioCaixaPopup] Payload mapeado:', payload);
      console.log('[abrirFormularioCaixaPopup] Chave primária: filial=', filial_cai, 'tipocai=', tipocai_cai, 'dtmovi=', dtmovi_cai, 'seq=', seq_cai);

      console.log('[abrirFormularioCaixaPopup] Chave primária:', { filial_cai, tipocai_cai, cliforn_cai, codbanco_cai, dtmovi_cai, seq_cai });

      // ✅ NOVO FLUXO: Se não temos documentos_vinculados no payload, buscar via CHAVE_REC_A14 e CHAVE_PAG_A12
      // Sempre buscar documentos, independentemente se buscarLancamentoPorId funcionou ou não
      if (seq_cai && seq_cai !== null && seq_cai !== undefined) {
        try {
          console.log('[abrirFormularioCaixaPopup] 🔍 Buscando documentos vinculados com parâmetros:', { codbanco_cai, dtmovi_cai, seq_cai });

          // CHAVE_REC_A14: (cxbco_rec, dtpagi_rec, seqcai_rec) → (codbanco_cai, dtmovi_cai, seq_cai)
          // CHAVE_PAG_A12: (cxbco_pag, dtpagi_pag, seqcai_pag) → (codbanco_cai, dtmovi_cai, seq_cai)
          // 
          // ⚠️ NOTA IMPORTANTE - INCOMPATIBILIDADE DE TIPOS (Sistema Legado):
          //    - caixa.codbanco_cai = CHAR(5) armazena código do banco (ex: "00003")
          //    - receber.cxbco_rec = DECIMAL(5) - tipo numérico
          //    - pagar.cxbco_pag = DECIMAL(5) - tipo numérico
          //    O Backend DEVE fazer CAST SQL: WHERE cxbco_rec = CAST(codbanco_cai AS DECIMAL(5))
          //    Não podemos corrigir isso agora pois o sistema legado usa a mesma BD.

          const [docsReceber, docsPagar] = await Promise.all([
            CaixaBancosService.buscarDocumentosReceberVinculados(codbanco_cai, dtmovi_cai, seq_cai)
              .then(docs => {
                console.log('[abrirFormularioCaixaPopup] ✅ Documentos RECEBER retornados:', docs ? docs.length : 0, 'registros');
                return docs || [];
              })
              .catch(err => {
                console.warn('[abrirFormularioCaixaPopup] ⚠️ Erro ao buscar RECEBER:', err);
                return [];
              }),
            CaixaBancosService.buscarDocumentosPagarVinculados(codbanco_cai, dtmovi_cai, seq_cai)
              .then(docs => {
                console.log('[abrirFormularioCaixaPopup] ✅ Documentos PAGAR retornados:', docs ? docs.length : 0, 'registros');
                return docs || [];
              })
              .catch(err => {
                console.warn('[abrirFormularioCaixaPopup] ⚠️ Erro ao buscar PAGAR:', err);
                return [];
              })
          ]);

          // Consolidar documentos vinculados
          const documentosVinculados: any[] = [];

          if (docsReceber && docsReceber.length > 0) {
            console.log('[abrirFormularioCaixaPopup] 📄 Documentos RECEBER vinculados:', docsReceber);
            docsReceber.forEach((doc: any) => {
              documentosVinculados.push({
                id: doc.receber_id || doc.codigo_rec || doc.id,
                tipo: 'R',
                codigo_cliente: doc.codigo_rec || doc.codigo_cli || codbanco_cai,
                nome_cliente: doc.nome_cli || doc.nomefan_cli || '',
                documento: doc.numdup_rec || doc.docto_rec || doc.documento || '',
                parcela: doc.parcela_rec || doc.parc_rec || doc.parcela || '',
                valor_original: parseNumeric(doc.vlrdup_rec || doc.vlrtot_rec || doc.valor || 0) || 0,
                valor_aberto: parseNumeric(doc.vlrsal_rec || doc.valor || 0) || 0,
                valor_selecionado: parseNumeric(doc.vlrpag_rec || doc.vlrsal_rec || doc.valor || 0) || 0,
                juros: parseNumeric(doc.vlracre_rec || 0) || 0,
                multa: parseNumeric(doc.vlrmulta_rec || 0) || 0,
                desconto: parseNumeric(doc.vlrdesc_rec || 0) || 0,
                pago: parseNumeric(doc.vlrpag_rec || 0) || 0,
                acrescimo: 0,
                data_vencimento: doc.dtvenci_rec || doc.dtvenci || doc.dtvenc || ''
              });
            });
          }

          if (docsPagar && docsPagar.length > 0) {
            console.log('[abrirFormularioCaixaPopup] 📄 Documentos PAGAR vinculados:', docsPagar);
            docsPagar.forEach((doc: any) => {
              documentosVinculados.push({
                id: doc.pagar_id || doc.codigo_pag || doc.id,
                tipo: 'P',
                codigo_cliente: doc.codigo_pag || doc.codigo_for || codbanco_cai,
                nome_cliente: doc.nome_cli || doc.nomefan_for || doc.nome_for || '',
                documento: doc.numdup_pag || doc.docto_pag || doc.documento || '',
                parcela: doc.parcela_pag || doc.parc_pag || doc.parcela || '',
                valor_original: parseNumeric(doc.vlrdup_pag || doc.vlrtot_pag || doc.valor || 0) || 0,
                valor_aberto: parseNumeric(doc.vlrsal_pag || doc.valor || 0) || 0,
                valor_selecionado: parseNumeric(doc.vlrpag_pag || doc.vlrsal_pag || doc.valor || 0) || 0,
                juros: parseNumeric(doc.vlracre_pag || 0) || 0,
                multa: parseNumeric(doc.vlrmulta_pag || 0) || 0,
                desconto: parseNumeric(doc.vlrdesc_pag || 0) || 0,
                pago: parseNumeric(doc.vlrpag_pag || 0) || 0,
                acrescimo: 0,
                data_vencimento: doc.dtvenci_pag || doc.dtvenci || doc.dtvenc || ''
              });
            });
          }

          console.log('[abrirFormularioCaixaPopup] 📋 Total de documentos consolidados:', documentosVinculados.length);
          if (documentosVinculados.length > 0) {
            console.log('[abrirFormularioCaixaPopup] ✅ Documentos consolidados:', documentosVinculados);
            payload.documentos_vinculados = documentosVinculados;
          } else {
            console.log('[abrirFormularioCaixaPopup] ℹ️ Nenhum documento vinculado encontrado');
            payload.documentos_vinculados = [];
          }
        } catch (e) {
          console.error('[abrirFormularioCaixaPopup] ❌ Erro ao buscar documentos vinculados:', e);
          payload.documentos_vinculados = [];
        }
      } else {
        console.warn('[abrirFormularioCaixaPopup] ⚠️ Sequência não disponível para buscar documentos');
        payload.documentos_vinculados = [];
      }

      console.log('[abrirFormularioCaixaPopup] ✅ Payload final completo:', payload);
      console.log('[abrirFormularioCaixaPopup] ✅ Campos críticos:', {
        tipocai_cai: payload.tipocai_cai,
        codbanco_cai: payload.codbanco_cai,
        dtmovi_cai: payload.dtmovi_cai,
        seq_cai: payload.seq_cai,
        valor_cai: payload.valor_cai,
        dc_cai: payload.dc_cai,
        oper_cai: payload.oper_cai,
        histor_cai: payload.histor_cai
      });

      // Modo CONSULTA: abrir como somente leitura a partir da aba de Relatórios
      // Garantir que o payload contenha o código/nome do banco para o formulário
      try {
        payload.codbanco_cai = payload.codbanco_cai || codbanco_cai || payload.cliente_cai || payload.codigo_cliente || payload.banco_cai || '';
        payload.nome_cai = payload.nome_cai || row.nome_bco || row.nomefan_bco || row.banco || payload.nome_cai || '';
      } catch (e) { /* noop */ }

      setCaixaPopupReadOnlyPrimary(true);
      payload._mode = 'consulta';
      console.log('[abrirFormularioCaixaPopup] 🚀 CHAMANDO setCaixaPopupPayload (modo=consulta) ...');
      setCaixaPopupPayload(payload);
      console.log('[abrirFormularioCaixaPopup] 🎯 ABRINDO MODAL setShowCaixaPopup(true) (modo=consulta)');
      setShowCaixaPopup(true);
      console.log('[abrirFormularioCaixaPopup] ========== FIM DO FLUXO ==========');
    } catch (e) {
      console.error('[abrirFormularioCaixaPopup] ❌ ERRO CRÍTICO:', e);
      console.error('[abrirFormularioCaixaPopup] Stack:', e instanceof Error ? e.stack : 'sem stack');
    }
  };

  // Abrir formulário em modo INCLUIR (novo movimento)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const abrirFormularioCaixaIncluir = () => {
    try {
      const hoje = new Date();
      const dt = hoje.toISOString().slice(0, 10); // YYYY-MM-DD
      const payload: any = {
        filial_cai: (user && (user as any).filialId) || '001',
        tipocai_cai: '001',
        cliforn_cai: '   ',
        codbanco_cai: '',
        dtmovi_cai: dt,
        seq_cai: null,
        tipo_documento: 'R',
        cliente_cai: '',
        codigo_cliente: '',
        oper_cai: '',
        operacao_ocai: null,
        dc_cai: 'D',
        valor_cai: 0,
        histor_cai: '',
        nome_cai: '',
        dpto_cai: ''
      };
      setCaixaPopupReadOnlyPrimary(false);
      payload._mode = 'incluir';
      setCaixaPopupPayload(payload);
      setShowCaixaPopup(true);
    } catch (e) {
      console.error('[abrirFormularioCaixaIncluir] Erro ao abrir popup de inclusão:', e);
    }
  };

  // ✅ NOVO: Abrir formulário em modo EDITAR (editar movimento existente)
  const abrirFormularioCaixaEditar = async (row: any) => {
    try {
      console.log('[abrirFormularioCaixaEditar] ========== INICIANDO FLUXO DE EDIÇÃO ==========');
      console.log('[abrirFormularioCaixaEditar] Row completo recebido:', row);

      const filial_cai = row.filial_cai || row.filial || '001';
      const tipocai_cai = row.tipocai_cai || '001';
      const cliforn_cai = row.cliforn_cai || '   ';
      const codbanco_cai = row.codbanco_cai || row.codigo_cliente || '';
      const dtmovi_cai = row.dtmovi_cai || row.data || row.dtmovi || '';
      const seq_cai = row.seq_cai || row.sequencia || row.seq || row.id || null;

      // Determinar tipo_documento
      let tipo_documento = 'R';
      if (row.tipo_documento) {
        tipo_documento = row.tipo_documento;
      } else if (row.tipo === 'P' || row.dc_cai === 'P') {
        tipo_documento = 'P';
      }

      const payload: any = {
        filial_cai,
        tipocai_cai,
        cliforn_cai,
        codbanco_cai,
        dtmovi_cai,
        seq_cai,
        tipo_documento,
        // ✅ CRÍTICO: cliente_cai deve ser o código do cliente/fornecedor (clifor_cai), não o banco
        cliente_cai: row.clifor_cai || codbanco_cai,
        codigo_cliente: row.clifor_cai || codbanco_cai,
        clifor_cai: row.clifor_cai || '',
        oper_cai: row.oper_cai || row.operacao || '',
        operacao_ocai: row.operacao_ocai || null,
        operacao_cai: row.operacao_cai || null, // ✅ CRÍTICO: Código da operação
        dc_cai: row.dc_cai || row.tipo || '',
        valor_cai: row.valor_cai || row.valor || 0,
        histor_cai: row.histor_cai || row.historico || '',
        nome_cai: row.nome_cai || row.banco || '',
        dpto_cai: row.dpto_cai || row.centro_custo || '' // ✅ CRÍTICO: Centro de custo
      };

      console.log('[abrirFormularioCaixaEditar] Payload inicial:', payload);

      // ✅ NOVO FLUXO: Buscar documentos vinculados via CHAVE_REC_A14 e CHAVE_PAG_A12
      if (seq_cai && seq_cai !== null && seq_cai !== undefined) {
        try {
          console.log('[abrirFormularioCaixaEditar] 🔍 Buscando documentos vinculados com parâmetros:', { codbanco_cai, dtmovi_cai, seq_cai });

          const [docsReceber, docsPagar] = await Promise.all([
            CaixaBancosService.buscarDocumentosReceberVinculados(codbanco_cai, dtmovi_cai, seq_cai)
              .then(docs => {
                console.log('[abrirFormularioCaixaEditar] ✅ Documentos RECEBER retornados:', docs ? docs.length : 0, 'registros');
                return docs || [];
              })
              .catch(err => {
                console.warn('[abrirFormularioCaixaEditar] ⚠️ Erro ao buscar RECEBER:', err);
                return [];
              }),
            CaixaBancosService.buscarDocumentosPagarVinculados(codbanco_cai, dtmovi_cai, seq_cai)
              .then(docs => {
                console.log('[abrirFormularioCaixaEditar] ✅ Documentos PAGAR retornados:', docs ? docs.length : 0, 'registros');
                return docs || [];
              })
              .catch(err => {
                console.warn('[abrirFormularioCaixaEditar] ⚠️ Erro ao buscar PAGAR:', err);
                return [];
              })
          ]);

          // Consolidar documentos vinculados
          const documentosVinculados: any[] = [];

          if (docsReceber && docsReceber.length > 0) {
            console.log('[abrirFormularioCaixaEditar] 📄 Documentos RECEBER vinculados:', docsReceber);
            docsReceber.forEach((doc: any) => {
              documentosVinculados.push({
                id: doc.receber_id || doc.codigo_rec || doc.id,
                tipo: 'R',
                codigo_cliente: doc.codigo_rec || doc.codigo_cli || codbanco_cai,
                nome_cliente: doc.nome_cli || doc.nomefan_cli || '',
                documento: doc.numdup_rec || doc.docto_rec || doc.documento || '',
                parcela: doc.parcela_rec || doc.parc_rec || doc.parcela || '',
                valor_original: parseNumeric(doc.vlrdup_rec || doc.vlrtot_rec || doc.valor || 0) || 0,
                valor_aberto: parseNumeric(doc.vlrsal_rec || doc.valor || 0) || 0,
                valor_selecionado: parseNumeric(doc.vlrpag_rec || doc.vlrsal_rec || doc.valor || 0) || 0,
                juros: parseNumeric(doc.vlracre_rec || 0) || 0,
                multa: parseNumeric(doc.vlrmulta_rec || 0) || 0,
                desconto: parseNumeric(doc.vlrdesc_rec || 0) || 0,
                pago: parseNumeric(doc.vlrpag_rec || 0) || 0,
                acrescimo: 0,
                data_vencimento: doc.dtvenci_rec || doc.dtvenci || doc.dtvenc || ''
              });
            });
          }

          if (docsPagar && docsPagar.length > 0) {
            console.log('[abrirFormularioCaixaEditar] 📄 Documentos PAGAR vinculados:', docsPagar);
            docsPagar.forEach((doc: any) => {
              documentosVinculados.push({
                id: doc.pagar_id || doc.codigo_pag || doc.id,
                tipo: 'P',
                codigo_cliente: doc.codigo_pag || doc.codigo_for || codbanco_cai,
                nome_cliente: doc.nome_cli || doc.nomefan_for || doc.nome_for || '',
                documento: doc.numdup_pag || doc.docto_pag || doc.documento || '',
                parcela: doc.parcela_pag || doc.parc_pag || doc.parcela || '',
                valor_original: parseNumeric(doc.vlrdup_pag || doc.vlrtot_pag || doc.valor || 0) || 0,
                valor_aberto: parseNumeric(doc.vlrsal_pag || doc.valor || 0) || 0,
                valor_selecionado: parseNumeric(doc.vlrpag_pag || doc.vlrsal_pag || doc.valor || 0) || 0,
                juros: parseNumeric(doc.vlracre_pag || 0) || 0,
                multa: parseNumeric(doc.vlrmulta_pag || 0) || 0,
                desconto: parseNumeric(doc.vlrdesc_pag || 0) || 0,
                pago: parseNumeric(doc.vlrpag_pag || 0) || 0,
                acrescimo: 0,
                data_vencimento: doc.dtvenci_pag || doc.dtvenci || doc.dtvenc || ''
              });
            });
          }

          console.log('[abrirFormularioCaixaEditar] 📋 Total de documentos consolidados:', documentosVinculados.length);
          if (documentosVinculados.length > 0) {
            console.log('[abrirFormularioCaixaEditar] ✅ Documentos consolidados:', documentosVinculados);
            payload.documentos_vinculados = documentosVinculados;
          } else {
            console.log('[abrirFormularioCaixaEditar] ℹ️ Nenhum documento vinculado encontrado');
            payload.documentos_vinculados = [];
          }
        } catch (e) {
          console.error('[abrirFormularioCaixaEditar] ❌ Erro ao buscar documentos vinculados:', e);
          payload.documentos_vinculados = [];
        }
      } else {
        console.warn('[abrirFormularioCaixaEditar] ⚠️ Sequência não disponível para buscar documentos');
        payload.documentos_vinculados = [];
      }

      console.log('[abrirFormularioCaixaEditar] ✅ Payload final completo:', payload);

      // Modo EDIÇÃO: abrir como edição ou visualização dependendo da permissão
      const mustBeReadOnly = !podeEditarCaixa;
      setCaixaPopupReadOnlyPrimary(mustBeReadOnly);
      payload._mode = mustBeReadOnly ? 'visualizar' : 'editar';

      console.log(`[abrirFormularioCaixaEditar] 🚀 CHAMANDO setCaixaPopupPayload (modo=${payload._mode}, readOnly=${mustBeReadOnly}) ...`);
      setCaixaPopupPayload(payload);
      console.log(`[abrirFormularioCaixaEditar] 🎯 ABRINDO MODAL setShowCaixaPopup(true) (podeEditar=${podeEditarCaixa})`);
      setShowCaixaPopup(true);
      console.log('[abrirFormularioCaixaEditar] ========== FIM DO FLUXO ==========');
    } catch (e) {
      console.error('[abrirFormularioCaixaEditar] ❌ ERRO CRÍTICO:', e);
      console.error('[abrirFormularioCaixaEditar] Stack:', e instanceof Error ? e.stack : 'sem stack');
    }
  };

  // Função para toggle expand/collapse no Fluxo de Caixa
  const toggleExpandir = async (data: string) => {
    // Suporta tanto datas (YYYY-MM-DD) quanto chaves de operação (C-OPERACAO ou D-OPERACAO)
    // Se for uma data válida (exatamente YYYY-MM-DD com 10 chars), usa formatYMDUTC
    // Se for uma chave de operação (começa com C- ou D-), usa como-é
    let key = data;
    const isDate = data && /^\d{4}-\d{2}-\d{2}$/.test(data); // formato YYYY-MM-DD exato

    console.log('[toggleExpandir] 🔄 Toggle chamado com data:', data, 'isDate:', isDate);

    if (isDate) {
      try {
        key = formatYMDUTC(data);
      } catch (e) {
        // Se falhar na formatação, usa a string original
        key = data;
      }
    }
    // else: key = data já contém C-OPERACAO ou D-OPERACAO, usa como está

    console.log('[toggleExpandir] Chave final:', key, 'expandedDates atual:', Array.from(expandedDates));

    const novo = new Set(expandedDates);

    if (novo.has(key)) {
      console.log('[toggleExpandir] ❌ Removendo chave (colapsar):', key);
      novo.delete(key);
      setExpandedDates(novo);
      return;
    }

    // Ao expandir
    console.log('[toggleExpandir] ✅ Adicionando chave (expandir):', key);
    novo.add(key);
    console.log('[toggleExpandir] expandedDates novo estado:', Array.from(novo));
    setExpandedDates(novo);

    // Atualizar filtros para usar a data selecionada em futuras exportações (apenas se for data)
    if (isDate) {
      try {
        setFiltros(prev => ({
          ...prev,
          dataFiltroInicial: key,
          dataFiltroFinal: key,
          dataini: key,
          datafim: key
        }));
      } catch (e) {
        // ignore
      }
    }

    // Se for operação (não data), não precisa buscar backend - dados já estão em consultaDados
    if (!isDate) {
      // Operação: dados já estão agrupados, só expandir visualmente
      return;
    }

    try {
      if (!detalhesPorData[key]) {
        const resp = await RelatoriosService.buscarDetalhesFluxoDia(key, filtros.soEmAberto);

        // Normalizar formato: o backend pode retornar { receber: [], pagar: [], totais: {} }
        // ou um array já concatenado. Convert to homogeneous array of rows.
        let detalhesArray: any[] = [];
        if (Array.isArray(resp)) {
          detalhesArray = resp;
        } else if (resp && typeof resp === 'object') {
          const receber: any[] = resp.receber || [];
          const pagar: any[] = resp.pagar || [];
          // Marcar origem para possibilitar tratamento diferenciado se necessário
          const rNorm = receber.map(r => ({ ...r, __origem: 'receber' }));
          const pNorm = pagar.map(p => ({ ...p, __origem: 'pagar' }));
          detalhesArray = [...rNorm, ...pNorm];
          // Backend retorna { data, titulos: [...] } se não houver separação receber/pagar
          if (detalhesArray.length === 0 && Array.isArray(resp.titulos)) {
            detalhesArray = resp.titulos;
          }
        }

        try {
          // Log temporário para debug: visualizar nomes de campos retornados pelo backend
          if ((detalhesArray || []).length > 0) {
            try { console.debug('[buscarDetalhesFluxoDia] amostra keys =', Object.keys(detalhesArray[0]).slice(0, 40)); } catch (e) { }
            try { console.debug('[buscarDetalhesFluxoDia] sample row =', detalhesArray[0]); } catch (e) { }
          } else {
            try { console.debug('[buscarDetalhesFluxoDia] detalhesArray vazio para key=', key); } catch (e) { }
          }
        } catch (e) {
          // ignore
        }

        // Garantir que bancoOptions contenha bancos detectados nos detalhes
        try {
          const bancosSet = new Set<string>(bancoOptions);
          detalhesArray.forEach((row: any) => {
            const names = [row.nomefan_bco, row.nome_bco, row.banco, row.banco_nome, row.cliente_banco, row.banco_autorizado];
            names.forEach((n: any) => { if (n) bancosSet.add(String(n)); });
          });
          const novos = Array.from(bancosSet);
          if (novos.length > 0) setBancoOptions(novos);
        } catch (e) {
          // ignore
        }

        setDetalhesPorData(prev => ({ ...prev, [key]: detalhesArray }));
      }
    } catch (err) {
      console.warn('Falha ao carregar detalhes do dia via backend:', err);
      // Mantemos os detalhes já presentes em dados (se existirem)
    }
  };

  const handleAtualizarDepartamento = async (event: any) => {
    try {
      const { data, newValue, oldValue } = event;

      if (newValue === oldValue) return; // Sem mudanças

      const tipo = tipoAtivo === 'receber' ? 'receber' : 'pagar';
      // Usar ID (receber_id ou pagar_id) como chave primária
      const codigo = tipo === 'receber' ? data.receber_id : data.pagar_id;

      const resultado = await RelatoriosService.atualizarDepartamento(tipo, codigo, newValue);

      if (resultado.sucesso) {
        console.log('✅ Departamento atualizado com sucesso:', resultado);
        // Atualizar valor na linha imediatamente (sem reload)
        data[event.colDef.field] = newValue;
        event.api.redrawRows({ rowNodes: [event.rowIndex] });
      } else {
        console.error('❌ Erro ao atualizar:', resultado.mensagem);
        // Restaurar valor anterior
        data[event.colDef.field] = oldValue;
        event.api.redrawRows({ rowNodes: [event.rowIndex] });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar departamento:', error);
    }
  };

  const handleAtualizarTipoCobranca = async (event: any) => {
    try {
      const { data, newValue, oldValue } = event;

      if (newValue === oldValue) return; // Sem mudanças

      const tipo = tipoAtivo === 'receber' ? 'receber' : 'pagar';
      // Usar ID (receber_id ou pagar_id) como chave primária
      const codigo = tipo === 'receber' ? data.receber_id : data.pagar_id;

      const resultado = await RelatoriosService.atualizarTipoCobranca(tipo, codigo, newValue);

      if (resultado.sucesso) {
        console.log('✅ Tipo de cobrança atualizado com sucesso:', resultado);
        // Atualizar valor na linha imediatamente (sem reload)
        data[event.colDef.field] = newValue;
        event.api.redrawRows({ rowNodes: [event.rowIndex] });
      } else {
        console.error('❌ Erro ao atualizar:', resultado.mensagem);
        // Restaurar valor anterior
        data[event.colDef.field] = oldValue;
        event.api.redrawRows({ rowNodes: [event.rowIndex] });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar tipo de cobrança:', error);
    }
  };

  const handleAtualizarDtFluxo = async (tipo: 'receber' | 'pagar', id: number, novaData: string, callback?: (sucesso: boolean) => void) => {
    try {
      const routineId = tipo === 'receber' ? 412 : 413;
      if (tipo === 'receber' ? !podeEditarReceber : !podeEditarPagar) {
        console.warn('Bloqueado: Sem permissão de edição para esta rotina');
        if (callback) callback(false);
        return;
      }

      const resultado = await RelatoriosService.atualizarDtFluxo(tipo, id, novaData);
      if (resultado.sucesso) {
        console.log('✅ Data de fluxo atualizada');
        if (callback) callback(true);
      } else {
        console.error('❌ Erro ao atualizar dtFluxo:', resultado.mensagem);
        if (callback) callback(false);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar data de fluxo:', error);
      if (callback) callback(false);
    }
  };

  const handleSalvarRenegociacao = async () => {
    try {
      const { receberId, pagarId, motivo, movimentacao, codigo: codigoCliente } = renegociacaoForm;
      if (!motivo.trim()) {
        alert('Por favor, preencha o campo Motivo.');
        return;
      }
      if (renegociacaoParcelas.length === 0) {
        alert('Gere as parcelas antes de salvar.');
        return;
      }
      const tipo = movimentacao === 'receber' ? 'receber' : 'pagar';
      const row = renegociacaoSelectedRow;
      if (!row) {
        alert('Erro: dados do documento original não encontrados.');
        return;
      }
      const isReceber = tipo === 'receber';
      const tipodocOriginal = isReceber ? (row.tipodoc_rec || '') : (row.tipodoc_pag || '');
      const filial = isReceber ? (row.filial_rec || '001') : (row.filial_pag || '001');
      const dpto = isReceber ? (row.dpto_rec ?? null) : (row.dpto_pag ?? null);
      const tpcob = isReceber ? (row.tpcob_rec || row.tipocob_rec || '') : (row.tpcob_pag || row.tipocob_pag || '');
      const cgccpf = isReceber ? (row.cgccpf_rec || '') : (row.cgccpf_pag || '');
      const usuario = user?.name || user?.username || '';
      const parcelasData = renegociacaoParcelasRef.current.map(p => ({
        valor: parseFloat(p.valor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
        data: p.data
      }));
      const codCli = parseInt(codigoCliente, 10) || Number(row.codigo_cli || row.codigo_for || 0);

      if (isBulkRenegociacao) {
        if (!renegociacaoForm.numero.trim()) {
          alert('Informe o Número para o novo documento.');
          return;
        }
        if (numdupError) {
          alert('Corrija o Número antes de salvar.');
          return;
        }
        const rows = renegociacaoSelectedRows;
        const docIds: number[] = rows.map((r: any) =>
          Number(isReceber ? (r.receber_id || r.codigo_rec) : (r.pagar_id || r.codigo_pag))
        ).filter((id: number) => id > 0);

        const resultado = await RelatoriosService.salvarRenegociacaoLote({
          tipo, codigos: docIds, motivo, usuario,
          tipodocOriginal, codigoCliente: codCli, filial, dpto, tpcob, cgccpf,
          numdup: renegociacaoForm.numero,
          desconto: renegociacaoForm.desconto,
          parcelas: parcelasData
        });
        if (resultado?.sucesso) {
          alert(resultado.mensagem || 'Renegociação em lote salva com sucesso!');
          setRenegociacaoSelectedRow(null);
          setIsBulkRenegociacao(false);
          setRenegociacaoForm({
            codigo: '', numero: '', documento: '', cliente: '', dpto: '', tipoCobranca: '',
            tipoDocumento: 'Renegociação', movimentacao: 'receber',
            valorRenegociado: 0, entrada: 0, parcelas: 1, juros: 0, desconto: 0, valorParcelas: 0,
            motivo: '', vencimento: '', diaVencimento: '',
            receberId: null, pagarId: null
          });
          setRenegociacaoParcelas([]);
          setRenegociacaoSelectedRows([]);
          if (gridApi) gridApi.deselectAll();
          buscarRenegociacao();
        } else {
          alert(resultado?.mensagem || 'Falha ao salvar renegociação em lote.');
        }
      } else {
        const docId = receberId || pagarId;
        if (!docId) {
          alert('Erro: documento não identificado.');
          return;
        }
        const resultado = await RelatoriosService.salvarRenegociacao({
          tipo, codigo: docId, motivo, usuario,
          tipodocOriginal, codigoCliente: codCli,
          filial, dpto, tpcob, cgccpf,
          desconto: renegociacaoForm.desconto,
          parcelas: parcelasData
        });
        if (resultado?.sucesso) {
          alert('Renegociação salva com sucesso! ' + (resultado.mensagem || ''));
          setRenegociacaoSelectedRow(null);
          setRenegociacaoForm({
            codigo: '', numero: '', documento: '', cliente: '', dpto: '', tipoCobranca: '',
            tipoDocumento: 'Renegociação', movimentacao: 'receber',
            valorRenegociado: 0, entrada: 0, parcelas: 1, juros: 0, desconto: 0, valorParcelas: 0,
            motivo: '', vencimento: '', diaVencimento: '',
            receberId: null, pagarId: null
          });
          setRenegociacaoParcelas([]);
          buscarRenegociacao();
        } else {
          alert(resultado?.mensagem || 'Falha ao salvar renegociação.');
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar renegociação:', error);
      alert(error.message || 'Erro ao salvar renegociação.');
    }
  };

  const handleSimularRenegociacao = () => {
    const rows = renegociacaoSelectedRows;
    if (!rows || rows.length === 0) {
      alert('Selecione ao menos um registro.');
      return;
    }

    const isReceberBulk = rows[0].receber_id != null || rows[0].codigo_rec != null;
    const total = rows.reduce((sum: number, r: any) => {
      const saldo = Number(isReceberBulk ? r.vlrsal_rec : r.vlrsal_pag || 0);
      const juros = calcularJurosDocumento(saldo, isReceberBulk ? r.dtvenci_rec : r.dtvenci_pag, Number(r.txjuro_bco || 0), Number(isReceberBulk ? (r.vlracre_rec || 0) : (r.vlracre_pag || 0)));
      return sum + saldo + juros;
    }, 0);
    const isReceber = isReceberBulk;
    const firstVenc = normalizarData(
      isReceber ? (rows[0].dtvenci_rec || '') : (rows[0].dtvenci_pag || '')
    );
    const firstRow = rows[0];

    setRenegociacaoSelectedRow(firstRow);
    setRenegociacaoForm({
      codigo: [...new Set(rows.map((r: any) => isReceber ? (r.codigo_rec || '') : (r.codigo_pag || '')))].join(', '),
      numero: '',
      documento: isReceber ? (firstRow.cgccpf_rec_formatted || firstRow.cgccpf_rec || '') : (firstRow.cgccpf_pag_formatted || firstRow.cgccpf_pag || ''),
      cliente: isReceber ? (firstRow.nome_cli || '') : (firstRow.nome_for || ''),
      dpto: firstRow.descr_dep || '',
      tipoCobranca: isReceber ? (firstRow.tpcob_rec || firstRow.tipocob_rec || '') : (firstRow.tpcob_pag || firstRow.tipocob_pag || ''),
      tipoDocumento: 'Renegociação',
      movimentacao: isReceber ? 'receber' : 'pagar',
      valorRenegociado: total,
      entrada: 0,
      parcelas: 1,
      juros: 0,
      desconto: 0,
      valorParcelas: total,
      motivo: '',
      vencimento: firstVenc,
      diaVencimento: '',
      receberId: null,
      pagarId: null
    });
    setRenegociacaoParcelas([]);
    setNumdupError('');
    setRenegociacaoCollapseFilter(true);
    setPaginaSelecionados(0);
    setIsBulkRenegociacao(true);
  };

  const handleConfirmarSimulacao = async () => {
    const rows = renegociacaoSelectedRows;
    if (!rows || rows.length === 0) return;

    const motivo = simulacaoForm.motivo.trim();
    if (!motivo) {
      alert('Preencha o motivo da renegociação.');
      return;
    }

    const parcelas = simulacaoParcelas;
    if (parcelas.length === 0) {
      alert('Gere as parcelas antes de confirmar.');
      return;
    }

    setSimulacaoProcessing(true);

    try {
      const isReceber = rows[0].receber_id != null || rows[0].codigo_rec != null;
      const docIds: number[] = rows.map((r: any) =>
        Number(isReceber ? (r.receber_id || r.codigo_rec) : (r.pagar_id || r.codigo_pag))
      ).filter((id: number) => id > 0);

      const codigoCliente = Number(rows[0].codigo_cli || rows[0].codigo_for || 0);
      const usuario = user?.name || user?.username || '';
      const filial = isReceber ? (rows[0].filial_rec || '001') : (rows[0].filial_pag || '001');
      const dpto = isReceber ? (rows[0].dpto_rec ?? null) : (rows[0].dpto_pag ?? null);
      const tpcob = isReceber ? (rows[0].tpcob_rec || rows[0].tipocob_rec || '') : (rows[0].tpcob_pag || rows[0].tipocob_pag || '');
      const cgccpf = isReceber ? (rows[0].cgccpf_rec || '') : (rows[0].cgccpf_pag || '');
      const tipodocOriginal = isReceber ? (rows[0].tipodoc_rec || '') : (rows[0].tipodoc_pag || '');

      const parcelasData = parcelas.map(p => ({
        valor: parseFloat(p.valor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0,
        data: p.data
      }));

      const resultado = await RelatoriosService.salvarRenegociacaoLote({
        tipo: isReceber ? 'receber' : 'pagar',
        codigos: docIds,
        motivo,
        usuario,
        tipodocOriginal,
        codigoCliente,
        filial,
        dpto,
        tpcob,
        cgccpf,
        parcelas: parcelasData
      });

      if (resultado?.sucesso) {
        alert(resultado.mensagem || 'Renegociação em lote concluída com sucesso.');
        setShowSimulacaoModal(false);
        setRenegociacaoSelectedRows([]);
        if (gridApi) gridApi.deselectAll();
        buscarRenegociacao();
      } else {
        alert(resultado?.mensagem || 'Falha ao salvar renegociação em lote.');
      }
    } catch (error: any) {
      console.error('Erro na simulação em lote:', error);
      alert(error.message || 'Erro ao processar simulação em lote.');
    } finally {
      setSimulacaoProcessing(false);
    }
  };

  const onGridReady = (event: any) => {
    setGridApi(event.api);
    try { (window as any).__agGridApi = event.api; } catch (e) { }
    // Se houver dados pendentes de consulta (quando a busca ocorreu antes do grid estar pronto), aplicar agora
    try {
      const pending = (window as any).__lastConsultaCaixa;
      if (pending && Array.isArray(pending) && pending.length > 0) {
        try { event.api.setRowData(pending); console.debug('[DEBUG-CONSULTA-CAIXA] onGridReady aplicou window.__lastConsultaCaixa, rows=', pending.length); } catch (e) { }
        try { (window as any).__lastConsultaCaixa = null; } catch (e) { }
      }
    } catch (e) { /* noop */ }
    // Adicionar listener para recalcular TOTAL quando filtro muda
    event.api.addEventListener('filterChanged', () => {
      setTimeout(() => recalcularTotal(), 100);
    });
  };


  const buscarDados = async (overrideFiltros?: FiltroRelatorio) => {
    const usedFiltros = overrideFiltros || filtros;

    // Resetar gridApi para forçar nova renderização do AG Grid
    // Isso é crítico quando volta de Fluxo para Contas a Receber/Pagar
    if (usedFiltros.tipo !== 'fluxo') {
      setGridApi(null);
    }

    setLoading(true);
    (window as any)._hasSearchedFinanceiro = true;
    // Validação de datas
    if (usedFiltros.dataFiltroInicial && usedFiltros.dataFiltroFinal) {
      if (usedFiltros.dataFiltroInicial > usedFiltros.dataFiltroFinal) {
        alert('Atenção: A data inicial não pode ser posterior à data final.');
        setLoading(false);
        return;
      }
    }
    try {
      let resultado;
      if (usedFiltros.tipo === 'fluxo') {
        resultado = await RelatoriosService.buscarFluxoCaixa(usedFiltros);
      } else if (usedFiltros.tipo === 'consulta_caixa') {
        // Para a aba Consulta Caixa e Bancos usamos um endpoint distinto (GET)
        // e filtros separados. Invocar buscarConsultaCaixa que já gerencia os estados
        const resp = await buscarConsultaCaixa();
        resultado = { data: resp };
      } else {
        const filtrosComUser = {
          ...usedFiltros,
          userId: user?.userId
        };
        console.log('📤 Enviando filtros para backend:', filtrosComUser);
        resultado = await RelatoriosService.buscarRelatorioFinanceiro(filtrosComUser);
        console.log('📥 Resposta do backend:', resultado);
      }
      // Normalizar diferentes formatos de resposta do backend:
      // - array direct
      // - { rows: [...] } or { data: [...] } or { value: [...] }
      // - or nested objects containing the first array (e.g. { result: { rows: [...] } })
      let rowsNormalized: any[] = [];
      const findFirstArray = (obj: any): any[] => {
        if (!obj) return [];
        if (Array.isArray(obj)) return obj;
        // direct known keys
        if (obj && Array.isArray(obj.rows)) return obj.rows;
        if (obj && Array.isArray(obj.data)) return obj.data;
        if (obj && Array.isArray(obj.value)) return obj.value;
        // scan one level deep for first array
        for (const k of Object.keys(obj)) {
          try {
            const v = obj[k];
            if (Array.isArray(v)) return v;
            if (v && typeof v === 'object') {
              // nested object with rows/data/value
              if (Array.isArray(v.rows)) return v.rows;
              if (Array.isArray(v.data)) return v.data;
              if (Array.isArray(v.value)) return v.value;
            }
          } catch (e) {
            // ignore
          }
        }
        return [];
      };

      rowsNormalized = findFirstArray(resultado);

      // Enriquecer dados com campos formatados para exibição (documento formatado)
      const processed = (rowsNormalized || []).map((r: any) => ({
        ...r,
        cgccpf_rec_formatted: getMaskedDocumento(r, 'rec'),
        cgccpf_pag_formatted: getMaskedDocumento(r, 'pag')
      }));
      setDados(processed);
      try { console.debug('[Relatorios] buscarDados -> dados length:', (processed || []).length, 'sample:', (processed || [])[0]); } catch (e) { }
      // Extrair opções de bancos disponíveis (se houver campo de banco nas linhas)
      try {
        const bancosSet = new Set<string>();
        // usar rowsNormalized/processed para detectar bancos ao invés de `resultado` cru
        (rowsNormalized || processed || []).forEach((r: any) => {
          const names = [r.nomefan_bco, r.nome_bco, r.Banco, r.banco, r.banco_nome, r.cliente_banco];
          names.forEach((n: any) => { if (n) bancosSet.add(String(n)); });
        });
        const bancosArr = Array.from(bancosSet).filter(Boolean);
        // Só atualizar opções de banco se encontrarmos ao menos uma opção válida.
        // Caso contrário, preservamos `bancoOptions` carregadas anteriormente
        // (por exemplo, vindas de `carregarBancosDashboard`). Isso evita que
        // o clique em período (30/60/90) remova os cards quando o endpoint
        // de fluxo não retorna campos de banco.
        if (bancosArr.length > 0) {
          setBancoOptions(bancosArr);
        } else {
          try { console.debug('[buscarDados] nenhum banco detectado no resultado; preservando bancoOptions existentes.'); } catch (e) { }
        }
        // se ainda não houver seleção, e existir pelo menos um banco, manter vazio (usuário escolhe)
      } catch (e) {
        try { console.warn('Erro extraindo bancos do resultado:', e); } catch (err) { }
        // Não limpar bancoOptions em caso de erro: manter o estado atual para não esconder cards
      }

      // Inicializar TOTAL com todos os dados usando rowsNormalized (safe)
      if (tipoAtivo === 'receber') {
        setTotalRow({
          nome_cli: '✓ TOTAL:',
          vlrdup_rec: rowsNormalized.reduce((sum: number, row: any) => sum + (parseFloat(row.vlrdup_rec) || 0), 0),
          vlrsal_rec: rowsNormalized.reduce((sum: number, row: any) => sum + (parseFloat(row.vlrsal_rec) || 0), 0)
        });
      } else {
        setTotalRow({
          nome_for: '✓ TOTAL:',
          vlrdup_pag: rowsNormalized.reduce((sum: number, row: any) => sum + (parseFloat(row.vlrdup_pag) || 0), 0),
          vlrsal_pag: rowsNormalized.reduce((sum: number, row: any) => sum + (parseFloat(row.vlrsal_pag) || 0), 0)
        });
      }
      setFiltrosAlterados(false);
    } catch (error: any) {
      console.error('Erro ao buscar relatório:', error);
      const msgErro = error.response?.data?.[0]?.erro || error.response?.data?.erro || error.message;
      alert(`Erro ao gerar relatório: ${msgErro || 'Verifique os filtros e tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar dados do AG Grid para CSV
  const exportarCSV = () => {
    if (!gridApi) {
      alert('Erro: Grid não está pronto para exportação.');
      return;
    }

    try {
      const fileName = `relatorio_${filtros.tipo}_${new Date().toISOString().split('T')[0]}.csv`;
      gridApi.exportDataAsCsv({
        fileName: fileName,
        columnSeparator: ';',
        processCellCallback: (params: any) => {
          // Formatar valores para CSV
          if (params.value === null || params.value === undefined) return '';
          if (typeof params.value === 'number') {
            return params.value.toString().replace('.', ',');
          }
          return params.value;
        }
      });
      console.log('✅ CSV exportado com sucesso:', fileName);
    } catch (error) {
      console.error('❌ Erro ao exportar CSV:', error);
      alert('Erro ao exportar CSV. Verifique o console.');
    }
  };

  const exportarRelatorio = async () => {
    try {
      setExportandoPDF(true);
      // Garantir que o filtro 'tipo' está preenchido
      if (!filtros.tipo) {
        alert('Erro: Tipo de relatório não identificado.');
        return;
      }

      // Usar novo endpoint específico para Contas a Pagar com filtro de data dinâmico
      if (filtros.tipo === 'pagar') {
        // Converter datas para formato YYYY-MM-DD se necessário
        const dataini = filtros.dataFiltroInicial || formatYMDUTC(new Date(new Date().getFullYear(), 0, 1));
        const datafim = filtros.dataFiltroFinal || formatYMDUTC(new Date());

        // Verificar se é relatório de Folha de Pagamento (flag folhaPagamento)
        if (filtros.folhaPagamento) {
          console.log('📄 Exportando Relatório de Folha de Pagamento PDF');
          // Exportar relatório específico de Folha de Pagamento
          await RelatoriosService.exportarRelatorioFolhaPagamentoPDF({
            ...filtros,
            dataini,
            datafim,
            tipoCampoData: filtros.tipoCampoData || 'dtvenci_pag'
          });
        } else {
          console.log('📄 Exportando Relatório de Contas a Pagar PDF (via motor especializado)');

          // Capturar labels para o cabeçalho do PDF
          const tipoCobrancaLabel = (opcoesCobranca.find(o => o.codigo === filtros.tipoCobranca))?.descricao || filtros.tipoCobranca;
          const tiposDocumentoLabels = (filtros.tiposDocumento || []).map(cod =>
            (opcoesTipoDocumento.find(o => o.codigo === cod))?.descricao || cod
          );

          // Usar motor de exportação especializado para Contas a Pagar
          await RelatoriosService.exportarRelatorioPagarPDF({
            ...filtros,
            dataini,
            datafim,
            tipoCampoData: filtros.tipoCampoData || 'dtvenci_pag',
            tipoCobrancaLabel,
            tiposDocumentoLabels
          });
        }
      } else if (filtros.tipo === 'fluxo') {
        // Exportar Fluxo: incluir mestre (KPIs) e detalhe do dia (HOJE) para o relatório
        const hojeKey = formatYMDUTC(new Date());
        const dataini = filtros.dataFiltroInicial || hojeKey;
        const datafim = filtros.dataFiltroFinal || hojeKey;

        // preparar payload com mestre e detalhes do dia (se existirem)
        const payload: any = {
          ...filtros,
          dataini,
          datafim,
          tipoCampoData: filtros.tipoCampoData || 'dtvenci_rec'
        };

        // incluir KPIs calculados como mestre
        if (fluxoKpis) payload.mestre = fluxoKpis;

        // incluir detalhes do dia (preferir cache local 'detalhesPorData')
        const detalhesHoje = detalhesPorData[hojeKey] || [];
        payload.detalhesHoje = detalhesHoje;

        await RelatoriosService.exportarRelatorioFinanceiro(payload);
      } else if (filtros.tipo === 'receber') {
        console.log('📄 Exportando Relatório de Contas a Receber PDF (via motor especializado)');

        // Capturar labels para o cabeçalho do PDF
        const tipoCobrancaLabel = (opcoesCobranca.find(o => o.codigo === filtros.tipoCobranca))?.descricao || filtros.tipoCobranca;
        const tiposDocumentoLabels = (filtros.tiposDocumento || []).map(cod =>
          (opcoesTipoDocumento.find(o => o.codigo === cod))?.descricao || cod
        );

        // Usar motor de exportação especializado para Contas a Receber
        await RelatoriosService.exportarRelatorioReceberPDF({
          ...filtros,
          tipoCobrancaLabel,
          tiposDocumentoLabels
        });
      } else {
        // Para outros tipos (como fluxo ou consulta_caixa), usar método genérico
        // Garantindo que tipoCampo seja resolvido sem erro de inferência de tipo
        const tipoDefault = (filtros.tipo as string) === 'receber' ? 'dtvenci_rec' : 'dtvenci_pag';
        const tipoCampo = filtros.tipoCampoData || tipoDefault;
        await RelatoriosService.exportarRelatorioFinanceiro({ ...filtros, tipoCampoData: tipoCampo });
      }

      alert('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Erro ao gerar PDF:\n${errorMsg}`);
    } finally {
      setExportandoPDF(false);
    }
  };


  // Persistência simples de seleção (faixaAtraso + banco) para melhorar UX
  React.useEffect(() => {
    try {
      const savedFaixa = localStorage.getItem('relatorios.faixaAtraso');
      const savedBanco = localStorage.getItem('relatorios.bancoSelecionado');
      if (savedFaixa) {
        setFiltros(prev => (prev && prev.faixaAtraso) ? prev : ({ ...prev, faixaAtraso: savedFaixa }));
      }
      if (savedBanco) {
        setBancoSelecionado(prev => prev || savedBanco);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      if (filtros.faixaAtraso) localStorage.setItem('relatorios.faixaAtraso', String(filtros.faixaAtraso));
      else localStorage.removeItem('relatorios.faixaAtraso');
      if (bancoSelecionado) localStorage.setItem('relatorios.bancoSelecionado', bancoSelecionado);
      else localStorage.removeItem('relatorios.bancoSelecionado');
    } catch (e) {
      // ignore
    }
  }, [filtros.faixaAtraso, bancoSelecionado]);

  // ESC para fechar painéis/expansões
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setExpandedDates(new Set());
        setCollapseFilter(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /**
   * Carrega dados de previsão para as datas agrupadas no fluxo de caixa
   * Chamado uma vez quando os dados do fluxo são carregados
   */
  const carregarPrevisoesPorDatas = async (datas: string[]) => {
    if (!datas || datas.length === 0) return;

    try {
      setCarregandoPrevisao(true);
      const filial = '001'; // Filial padrão do SPDealer

      // Buscar previsões para todas as datas em paralelo
      const previsoes = await PrevisaoFinanceiraService.buscarPrevisaoPorDatas(filial, datas);

      setPrevisaoPorData(previsoes);
    } catch (error) {
      console.error('[RelatoriosFinanceiros] Erro ao carregar previsões:', error);
      // Não quebrar a tela se falhar em carregar previsão
    } finally {
      setCarregandoPrevisao(false);
    }
  };

  const renderTabelaResultados = () => {
    const currentDados = filtros.tipo === 'consulta_caixa' ? consultaDados : dados;
    const currentLoading = filtros.tipo === 'consulta_caixa' ? consultaLoading : loading;

    console.log('[DEBUG-RENDER] renderTabelaResultados() - tipo:', filtros.tipo, 'currentDados.length:', currentDados.length, 'loading:', currentLoading);

    if (currentDados.length === 0 && currentLoading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          <FontAwesomeIcon icon={faSpinner} spin size="2x" style={{ marginBottom: '16px' }} />
          <p>Lendo dados do servidor...</p>
        </div>
      );
    }

    // Fluxo de Caixa: Expandir/Colapsar por Data (sem Enterprise)
    if (filtros.tipo === 'fluxo') {
      // Agrupar dados por dataKey (YYYY-MM-DD) para evitar formatos inconsistentes
      const gruposData = dados.reduce((acc: any, row: any) => {
        // Ignorar linhas de subtotal/agrupamento vindas do backend para evitar dupla contagem
        if (isSubtotalRow(row)) return acc;
        // Mestre: usar explicitamente o campo de vencimento (dtvenci_rec) como chave de agrupamento
        const rawVenci = pickField(row, ['dtvenci_rec', 'dtvenci', 'dtvenc', 'dtvenc_rec', 'dtvenci_pag', 'dtvenci_rec']) || row.data || row.dtmovi_cai || row.dtmovi || row.dtmovi_rec || row.dtmovi_pag || row.datai || '';
        const dataKey = formatYMDUTC(rawVenci);
        if (!acc[dataKey]) {
          acc[dataKey] = {
            dataKey,
            dataOriginal: rawVenci,
            entradas: 0,
            saidas: 0,
            saldo: 0,
            detalhes: []
          };
        }
        // Calcular entradas/saidas: usar row.tipo para evitar que row.valor
        // (setado pelo backend como vlrdup_rec/ vlrdup_pag) polua a categoria oposta
        let e = 0;
        let s = 0;
        const rowTipo = row.tipo || '';
        if (rowTipo === 'ENTRADA') {
          e = parseNumeric(row.vlrsal_rec ?? row.vlrdup_rec ?? row.valor ?? row.amount ?? 0) || 0;
        } else if (rowTipo === 'SAÍDA') {
          s = parseNumeric(row.vlrsal_pag ?? row.vlrdup_pag ?? row.valor ?? 0) || 0;
        } else {
          // Sem tipo definido: usar fallback completo (ex: dados do fallback local)
          e = Number(row.entradas ?? 0) || parseNumeric(row.vlrsal_rec ?? row.vlrdup_rec ?? row.valor ?? row.amount ?? 0) || 0;
          s = Number(row.saidas ?? 0) || parseNumeric(row.vlrsal_pag ?? row.vlrdup_pag ?? row.valor ?? 0) || 0;
        }
        acc[dataKey].entradas += e;
        acc[dataKey].saidas += s;
        acc[dataKey].saldo += (Number(row.saldo) || (e - s));
        // Armazenar a linha inteira como detalhe (para garantir que a data e campos estejam acessíveis)
        acc[dataKey].detalhes.push(row);
        return acc;
      }, {});

      const grupos = Object.values(gruposData).sort((a: any, b: any) => {
        // Ordenar por dataKey (YYYY-MM-DD) - mais antigo primeiro
        return a.dataKey.localeCompare(b.dataKey);
      });

      // Carregar previsões para as datas agrupadas
      // Nota: não chamar `carregarPrevisoesPorDatas` diretamente durante o render
      // para evitar setState dentro do fluxo de render (causa de re-render infinito).
      // A chamada é feita por um useEffect abaixo quando `dados` ou `filtros.tipo` mudam.


      // Aplicar filtro 'Somente HOJE' se ativado (usar data local para evitar offset UTC)
      const todayKey = formatYMDUTC(new Date());
      const gruposFiltrados = filterOnlyHoje ? (grupos as any[]).filter((g: any) => {
        try { return String(g.dataKey) === todayKey; } catch (e) { return false; }
      }) : grupos;

      // Calcular totais gerais (respeitar filtro HOJE quando ativo)
      const totalEntradas: number = (gruposFiltrados as any[]).reduce((sum: number, g: any) => sum + (Number(g.entradas) || 0), 0);
      const totalSaidas: number = (gruposFiltrados as any[]).reduce((sum: number, g: any) => sum + (Number(g.saidas) || 0), 0);
      // Referenciar variáveis para evitar warnings de "assigned but never used".
      void totalEntradas;
      void totalSaidas;

      // Card HOJE: calcular valores para o card de hoje (evita IIFE direto no JSX)
      const hojeGroup = (grupos as any[]).find((g: any) => {
        try { return String(g.dataKey) === todayKey; } catch (e) { return false; }
      });
      const entradasHoje = hojeGroup ? Number((hojeGroup as any).entradas) || 0 : 0;
      const saidasHoje = hojeGroup ? Number((hojeGroup as any).saidas) || 0 : 0;
      void entradasHoje;
      void saidasHoje;

      return (
        <>
          {/* Lista de Datas com Expandir/Colapsar */}
          <div style={{ padding: '0 24px', maxHeight: '60vh', overflowY: 'auto' }}>
            {gruposFiltrados.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <FontAwesomeIcon icon={faInfoCircle} size="2x" style={{ marginBottom: '16px', color: '#9ca3af' }} />
                <p style={{ fontSize: '16px', fontWeight: '500' }}>Nenhum registro de fluxo encontrado para o período e filtros selecionados.</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Tente ajustar as datas ou remover filtros para ver mais resultados.</p>
              </div>
            ) : (
              gruposFiltrados.map((grupo: any) => (
                <div key={grupo.dataKey} id={`grupo-${grupo.dataKey}`} style={{ marginBottom: '12px' }}>
                  {/* Linha da Data (Cabeçalho Expandível) */}
                  <div
                    onClick={() => toggleExpandir(grupo.dataKey)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FontAwesomeIcon
                        icon={expandedDates.has(grupo.dataKey) ? faChevronDown : faChevronRight}
                        style={{ color: '#6b7280', width: '16px' }}
                      />
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                        📅 {formatarData(grupo.dataOriginal)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      {(() => {
                        // Se detalhesPorData existir, usar soma dos detalhes como fonte da verdade
                        const detalhesArr: any[] = detalhesPorData[grupo.dataKey] ?? grupo.detalhes ?? [];
                        const receberListHdr = detalhesArr.filter(d => d.__origem === 'receber');
                        const pagarListHdr = detalhesArr.filter(d => d.__origem === 'pagar');
                        const totalReceberHdr = receberListHdr.length > 0
                          ? receberListHdr.reduce((s: number, r: any) => s + parseNumeric(r.vlrsal_rec ?? r.vlrdup_rec ?? r.valor ?? 0), 0)
                          : Number(grupo.entradas || 0);
                        const totalPagarHdr = pagarListHdr.length > 0
                          ? pagarListHdr.reduce((s: number, r: any) => s + parseNumeric(r.vlrsal_pag ?? r.vlrdup_pag ?? r.valor ?? 0), 0)
                          : Number(grupo.saidas || 0);
                        const saldoHdr = totalReceberHdr - totalPagarHdr;

                        // Dados de previsão para esta data
                        const prevData = previsaoPorData[grupo.dataKey];
                        const recebasPrevistas = prevData?.receitas_previstas || 0;
                        const despesasPrevistas = prevData?.despesas_previstas || 0;
                        const saldoPrevisto = prevData?.saldo_previsto || (recebasPrevistas - despesasPrevistas);

                        return (
                          <>
                            {/* COLUNA REALIZADO */}
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Entradas (Real)</div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#059669' }}>
                                {formatarMoeda(totalReceberHdr)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Saídas (Real)</div>
                              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#dc2626' }}>
                                {formatarMoeda(totalPagarHdr)}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '110px' }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Saldo (Real)</div>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: saldoHdr >= 0 ? '#059669' : '#dc2626'
                              }}>
                                {formatarMoeda(saldoHdr)}
                              </div>
                            </div>

                            {/* COLUNA PREVISTO (se houver dados) */}
                            {prevData && (
                              <>
                                <div style={{ textAlign: 'right', borderLeft: '1px solid #e5e7eb', paddingLeft: '12px' }}>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Entradas (Prev.)</div>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#2563eb' }}>
                                    {formatarMoeda(recebasPrevistas)}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Saídas (Prev.)</div>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#7c3aed' }}>
                                    {formatarMoeda(despesasPrevistas)}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '110px' }}>
                                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>Saldo (Prev.)</div>
                                  <div style={{
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    color: saldoPrevisto >= 0 ? '#2563eb' : '#7c3aed'
                                  }}>
                                    {formatarMoeda(saldoPrevisto)}
                                  </div>
                                </div>
                              </>
                            )}
                            {carregandoPrevisao && (
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                (carregando previsão...)
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {expandedDates.has(grupo.dataKey) && (
                    <div style={{
                      background: '#f9fafb',
                      borderLeft: '1px solid #e5e7eb',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      borderRadius: '0 0 6px 6px',
                      padding: '16px',
                      overflow: 'hidden'
                    }}>
                      {/* Toolbar do detalhe: Processar seleção */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
                        {(() => {
                          const detalhesAll: any[] = detalhesPorData[grupo.dataKey] ?? grupo.detalhes ?? [];
                          const receberListIds = new Set((detalhesAll.filter(d => d.__origem === 'receber' || isReceberRow(d)).map(d => 'R-' + String(d.receber_id ?? d.id ?? ''))));
                          const pagarListIds = new Set((detalhesAll.filter(d => d.__origem === 'pagar' || isPagarRow(d)).map(d => 'P-' + String(d.pagar_id ?? d.id ?? ''))));
                          const availableIds = new Set<string>();
                          receberListIds.forEach(id => availableIds.add(id));
                          pagarListIds.forEach(id => availableIds.add(id));
                          const selectedForGroup = Array.from(authorizedRows).filter(id => availableIds.has(id));
                          const selectedCount = selectedForGroup.length;
                          const selectedTipo = selectedForGroup.every(s => s.startsWith('R-')) ? 'RECEBER' : (selectedForGroup.every(s => s.startsWith('P-')) ? 'PAGAR' : 'MIXED');

                          return (
                            <>
                              <Button $variant="secondary" type="button" onClick={() => {
                                if (selectedCount === 0) {
                                  alert('Nenhum documento autorizado nesta data para limpar.');
                                  return;
                                }
                                const copy = new Set(authorizedRows);
                                selectedForGroup.forEach(id => copy.delete(id));
                                setAuthorizedRows(copy);
                              }}>
                                Limpar Seleção
                              </Button>

                              <Button $variant="primary" type="button" onClick={() => {
                                // Verificar se todos os documentos selecionados têm banco atribuído
                                const docsSemBanco = selectedForGroup.filter(id => !documentBanks[id]);
                                if (docsSemBanco.length > 0) {
                                  alert(`Selecione um banco para cada documento antes de processar.\nDocumentos sem banco: ${docsSemBanco.length}`);
                                  return;
                                }
                                if (selectedCount === 0) { alert('Selecione documentos autorizados para processar.'); return; }
                                if (selectedTipo === 'MIXED') { alert('Não é permitido misturar Receber e Pagar no mesmo lançamento.'); return; }
                                const documentoIdsNums = selectedForGroup.map(s => Number(String(s).split('-')[1] || '0')).filter(n => n > 0);
                                // calcular soma local a partir dos detalhes para exibir no modal
                                const detalhesMap: Record<string, any> = {};
                                detalhesAll.forEach((d: any) => {
                                  const rid = d.receber_id ?? d.pagar_id ?? d.id;
                                  if (rid != null) detalhesMap[String(rid)] = d;
                                });
                                let somaLocal = 0;
                                documentoIdsNums.forEach(idn => {
                                  const det = detalhesMap[String(idn)];
                                  if (det) {
                                    const v = (det.vlrsal_rec ?? det.vlrsal_pag ?? det.vlrdup_rec ?? det.vlrdup_pag ?? det.valor ?? 0);
                                    somaLocal += Number(v) || 0;
                                  }
                                });
                                setModalDocumentoIds(documentoIdsNums);
                                // Passar os bancos específicos de cada documento para o modal
                                const banksForModal: Record<string, string> = {};
                                selectedForGroup.forEach((id: string) => {
                                  if (documentBanks[id]) {
                                    banksForModal[id] = documentBanks[id];
                                  }
                                });
                                setModalDocumentBanks(banksForModal);
                                setModalInitialValor(somaLocal);
                                setModalTipo(selectedTipo === 'RECEBER' ? 'RECEBER' : 'PAGAR');
                                setModalOperacao(selectedTipo === 'RECEBER' ? 500 : 600);
                                setModalReloadKey(grupo.dataKey);
                                setShowRegistrarModal(true);
                              }}
                                disabled={selectedCount === 0 || (selectedTipo === 'RECEBER' ? !podeEditarReceber : !podeEditarPagar)}
                              >
                                Processar ({selectedCount})
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                      {/* label intentionally removed to save vertical space */}
                      {/* Lista customizada: separar Receber e Pagar em duas colunas com totais */}
                      {
                        (detalhesPorData[grupo.dataKey] ?? grupo.detalhes ?? []).length > 0 && (() => {
                          const detalhes: any[] = (detalhesPorData[grupo.dataKey] ?? grupo.detalhes ?? []);
                          const receberList = detalhes.filter(d => d.__origem === 'receber' || isReceberRow(d));
                          const pagarList = detalhes.filter(d => d.__origem === 'pagar' || isPagarRow(d));

                          const totalReceber = receberList.reduce((s: number, r: any) => s + parseNumeric(r.vlrsal_rec ?? r.vlrdup_rec ?? r.valor ?? 0), 0);
                          const totalPagar = pagarList.reduce((s: number, r: any) => s + parseNumeric(r.vlrsal_pag ?? r.vlrdup_pag ?? r.valor ?? 0), 0);

                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '12px', color: '#374151', minWidth: 0 }}>
                              <div style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <div style={{ fontWeight: 700 }}>Receber ({receberList.length})</div>
                                  <div style={{ fontWeight: 700, color: '#059669' }}>{formatarMoeda(totalReceber)}</div>
                                </div>
                                {/* Header da lista: primeira coluna = Atualizar */}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#374151', minWidth: 0 }}>
                                  <div style={{ width: '36px', textAlign: 'center', fontWeight: 700 }}>Atualizar</div>
                                  <div style={{ width: '110px', textAlign: 'left', fontWeight: 700 }}>Código</div>
                                  <div style={{ width: '110px', textAlign: 'left', fontWeight: 700 }}>Emissão</div>
                                  <div style={{ width: '140px', textAlign: 'left', fontWeight: 700 }}>Cobrança</div>
                                  <div style={{ width: '160px', textAlign: 'left', fontWeight: 700 }}>Documento</div>
                                  <div style={{ width: '180px', textAlign: 'left', fontWeight: 700 }}>Cliente</div>
                                  <div style={{ width: '120px', textAlign: 'right', fontWeight: 700 }}>Valor</div>
                                </div>
                                <div>
                                  {receberList.map((det: any, idx: number) => {
                                    const idKey = 'R-' + String(det.receber_id ?? det.id ?? idx);
                                    // localizar data de emissao com vários candidatos e fallback por padrão de nome
                                    let rowDateEmissao = pickField(det, ['dtemissi_rec', 'dtemiss_rec', 'dtemiss', 'dtemissi', 'dtemissrec', 'dtemissi_rec', 'dtemiss_rec', 'dtmovi_rec', 'dtemissi', 'data', 'dtmovi', 'dtemiss_rec']);
                                    if (!rowDateEmissao) {
                                      rowDateEmissao = findByPattern(det, ['emiss', 'emissao', 'dtemiss', 'dtemissi', 'data']);
                                    }
                                    const rowDateVenci = pickField(det, ['dtvenci_rec', 'dtvenc', 'dtvenci', 'dtvenci_rec', 'dtvenc_rec']) || findByPattern(det, ['venci', 'vencimento', 'dtvenc', 'dtvenci']);
                                    // Se backend não fornecer campo de emissão (`dtemissi_rec`), não usar o vencimento como fallback
                                    // (mestre usa `dtvenci_rec`; o detalhe deve exibir apenas `dtemissi_rec`).
                                    if (!rowDateEmissao && rowDateVenci) {
                                      if (!dtemissaoWarningReceberShown.current) {
                                        try { console.debug('[detalhe] dtemissao ausente (receber) - campo `dtemissi_rec` ausente, não usar dtvenci como fallback no detalhe'); } catch (e) { }
                                        dtemissaoWarningReceberShown.current = true;
                                      }
                                      // keep rowDateEmissao undefined so detalhe shows empty when emission date missing
                                    }
                                    const codigoParts = [] as string[];
                                    if (det.codigo_rec) codigoParts.push(String(det.codigo_rec));
                                    if (det.numdup_rec) codigoParts.push(String(det.numdup_rec));
                                    if (det.parcela_rec) codigoParts.push(String(det.parcela_rec));
                                    const codigo = codigoParts.join(' ');
                                    const cliente = det.nome_cli || det.cliente || '';
                                    // Documento FORMATADO COMPLETO (compatível com vários nomes de campo)
                                    let documento = getFormattedDocumento(det, 'rec');
                                    if (!documento) {
                                      // tentar extrair explicitamente tipo de pessoa e campo cgccpf_rec/cgccpf
                                      const tipoPessoaRaw = pickField(det, ['tipopessoa_rec', 'tipopessoa', 'tipo_pessoa', 'tipo', 'cliforn_cli']);
                                      const rawDoc = pickField(det, ['cgccpf_rec', 'cgccpf', 'cpf', 'cnpj', 'documento', 'document', 'cpf_cli', 'cpf_cli_rec', 'cgccpf_cli', 'cgc_cpf', 'cgccpf_pag']) || findByPattern(det, ['cpf', 'cnpj', 'cgccpf', 'document', 'doc']);
                                      if (rawDoc) {
                                        const constructed: any = {};
                                        if (tipoPessoaRaw) constructed['tipopessoa'] = tipoPessoaRaw;
                                        constructed['cgccpf_rec'] = rawDoc;
                                        constructed['cgccpf'] = rawDoc;
                                        constructed['cpf'] = rawDoc;
                                        constructed['cnpj'] = rawDoc;
                                        constructed['document'] = rawDoc;
                                        documento = getFormattedDocumento(constructed, 'rec');
                                      }
                                      if (!documento) {
                                        documento = '';
                                        try { console.warn('[detalhe] documento ausente para linha', det); } catch (e) { }
                                      }
                                    }
                                    if (!documento) documento = '-';
                                    const valor = det.vlrsal_rec ?? det.vlrdup_rec ?? det.valor ?? null;
                                    // Obter banco específico deste documento ou usar o banco selecionado global como default
                                    const docBanco = documentBanks[idKey] || bancoSelecionado;
                                    const isDocSelected = authorizedRows.has(idKey);
                                    return (
                                      <div key={idKey} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', minWidth: 0 }}>
                                        <div style={{ width: '36px', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <input
                                              type="checkbox"
                                              checked={isDocSelected}
                                              disabled={!podeEditarReceber}
                                              onChange={() => {
                                                // Se não tem banco definido, usar o banco selecionado global como default
                                                if (!documentBanks[idKey] && bancoSelecionado) {
                                                  setDocumentBanks(prev => ({ ...prev, [idKey]: bancoSelecionado }));
                                                }
                                                const copy = new Set(authorizedRows);
                                                if (copy.has(idKey)) copy.delete(idKey); else copy.add(idKey);
                                                setAuthorizedRows(copy);
                                              }}
                                            />
                                            {/* Dropdown para selecionar banco por documento - permite bancos diferentes */}
                                            <select
                                              value={docBanco || ''}
                                              disabled={!podeEditarReceber}
                                              onChange={(e) => {
                                                const novoBanco = e.target.value;
                                                setDocumentBanks(prev => ({ ...prev, [idKey]: novoBanco }));
                                                // Se o documento já estava selecionado, manter seleção; se não, selecionar
                                                if (!authorizedRows.has(idKey) && novoBanco) {
                                                  const copy = new Set(authorizedRows);
                                                  copy.add(idKey);
                                                  setAuthorizedRows(copy);
                                                }
                                              }}
                                              style={{ fontSize: '10px', marginTop: '2px', padding: '2px', width: '60px' }}
                                            >
                                              <option value="">--</option>
                                              {bancoOptions.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                        <div style={{ width: '110px', color: '#374151' }}>{codigo}</div>
                                        <div style={{ width: '110px', color: '#6b7280' }}>{rowDateEmissao ? formatarData(rowDateEmissao) : ''}</div>
                                        <div style={{ width: '120px', color: '#6b7280', fontWeight: 600 }}>{det.tpcob_rec || det.tpcob || ''}</div>
                                        <div style={{ width: '140px', color: '#374151' }}>{documento}</div>
                                        <div style={{ width: '180px', color: '#374151' }}>{cliente}</div>
                                        <div style={{ width: '120px', textAlign: 'right', fontWeight: 700 }}>{valor ? formatarMoeda(Number(valor)) : ''}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e5e7eb', overflow: 'hidden', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <div style={{ fontWeight: 700 }}>Pagar ({pagarList.length})</div>
                                  <div style={{ fontWeight: 700, color: '#dc2626' }}>{formatarMoeda(totalPagar)}</div>
                                </div>
                                {/* Header da lista: primeira coluna = Autorizar */}
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#374151', minWidth: 0 }}>
                                  <div style={{ width: '36px', textAlign: 'center', fontWeight: 700 }}>Autorizar</div>
                                  <div style={{ width: '110px', textAlign: 'left', fontWeight: 700 }}>Código</div>
                                  <div style={{ width: '110px', textAlign: 'left', fontWeight: 700 }}>Emissão</div>
                                  <div style={{ width: '140px', textAlign: 'left', fontWeight: 700 }}>Cobrança</div>
                                  <div style={{ width: '160px', textAlign: 'left', fontWeight: 700 }}>Documento</div>
                                  <div style={{ width: '180px', textAlign: 'left', fontWeight: 700 }}>Fornecedor</div>
                                  <div style={{ width: '120px', textAlign: 'right', fontWeight: 700 }}>Valor</div>
                                </div>
                                <div>
                                  {pagarList.map((det: any, idx: number) => {
                                    const idKey = 'P-' + String(det.pagar_id ?? det.id ?? idx);
                                    let rowDateEmissao = pickField(det, ['dtemissi_pag', 'dtemiss_pag', 'dtemiss', 'dtemissi', 'dtemisspag', 'dtemissi_pag', 'dtemiss_pag', 'dtmovi_pag', 'data', 'dtmovi']);
                                    if (!rowDateEmissao) rowDateEmissao = findByPattern(det, ['emiss', 'emissao', 'dtemiss', 'data', 'dtmovi', 'dtemissi']);
                                    const rowDateVenci = pickField(det, ['dtvenci_pag', 'dtvenc_pag', 'dtvenc', 'dtvenci']) || findByPattern(det, ['venci', 'vencimento', 'dtvenc', 'dtvenci']);
                                    if (!rowDateEmissao && rowDateVenci) {
                                      if (!dtemissaoWarningPagarShown.current) {
                                        try { console.debug('[detalhe] dtemissao ausente (pag) - campo `dtemissi_pag` ausente, não usar dtvenci como fallback no detalhe'); } catch (e) { }
                                        dtemissaoWarningPagarShown.current = true;
                                      }
                                      // keep rowDateEmissao undefined so detalhe shows empty when emission date missing
                                    }
                                    const codigoPartsP = [] as string[];
                                    if (det.codigo_pag) codigoPartsP.push(String(det.codigo_pag));
                                    if (det.numdup_pag) codigoPartsP.push(String(det.numdup_pag));
                                    if (det.parcela_pag) codigoPartsP.push(String(det.parcela_pag));
                                    const codigo = codigoPartsP.join(' ');
                                    // Alguns endpoints/queries retornam o nome do fornecedor em `nome_cli`
                                    // (ex.: quando a tabela clientes foi usada como fonte com cliforn_cli='F').
                                    // Usar `nome_for`/`fornecedor` e, se ausente, tentar `nome_cli` como fallback.
                                    const fornecedor = det.nome_for || det.fornecedor || det.nome_cli || '';
                                    let documentoP = getFormattedDocumento(det, 'pag');
                                    if (!documentoP) {
                                      const tipoPessoaRawP = pickField(det, ['tipopessoa_pag', 'tipopessoa', 'tipo_pessoa', 'tipo', 'cliforn_cli']);
                                      const rawDocP = pickField(det, ['cgccpf_pag', 'cgccpf', 'cpf', 'cnpj', 'documento', 'document', 'cpf_for', 'cgccpf_for']) || findByPattern(det, ['cpf', 'cnpj', 'cgccpf', 'document', 'doc']);
                                      if (rawDocP) {
                                        const constructedP: any = {};
                                        if (tipoPessoaRawP) constructedP['tipopessoa'] = tipoPessoaRawP;
                                        constructedP['cgccpf_pag'] = rawDocP;
                                        constructedP['cgccpf'] = rawDocP;
                                        constructedP['cpf'] = rawDocP;
                                        constructedP['cnpj'] = rawDocP;
                                        constructedP['document'] = rawDocP;
                                        documentoP = getFormattedDocumento(constructedP, 'pag');
                                      }
                                      if (!documentoP) {
                                        documentoP = '';
                                        try { console.warn('[detalhe] documento ausente (pag) para linha', det); } catch (e) { }
                                      }
                                    }
                                    if (!documentoP) documentoP = '-';
                                    const valor = det.vlrsal_pag ?? det.vlrdup_pag ?? det.valor ?? null;
                                    // Obter banco específico deste documento ou usar o banco selecionado global como default
                                    const docBanco = documentBanks[idKey] || bancoSelecionado;
                                    const isDocSelected = authorizedRows.has(idKey);
                                    return (
                                      <div key={idKey} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #e5e7eb', minWidth: 0 }}>
                                        <div style={{ width: '36px', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <input
                                              type="checkbox"
                                              checked={isDocSelected}
                                              disabled={!podeEditarPagar}
                                              onChange={() => {
                                                // Se não tem banco definido, usar o banco selecionado global como default
                                                if (!documentBanks[idKey] && bancoSelecionado) {
                                                  setDocumentBanks(prev => ({ ...prev, [idKey]: bancoSelecionado }));
                                                }
                                                const copy = new Set(authorizedRows);
                                                if (copy.has(idKey)) copy.delete(idKey); else copy.add(idKey);
                                                setAuthorizedRows(copy);
                                              }}
                                            />
                                            {/* Dropdown para selecionar banco por documento - permite bancos diferentes */}
                                            <select
                                              value={docBanco || ''}
                                              disabled={!podeEditarPagar}
                                              onChange={(e) => {
                                                const novoBanco = e.target.value;
                                                setDocumentBanks(prev => ({ ...prev, [idKey]: novoBanco }));
                                                // Se o documento já estava selecionado, manter seleção; se não, selecionar
                                                if (!authorizedRows.has(idKey) && novoBanco) {
                                                  const copy = new Set(authorizedRows);
                                                  copy.add(idKey);
                                                  setAuthorizedRows(copy);
                                                }
                                              }}
                                              style={{ fontSize: '10px', marginTop: '2px', padding: '2px', width: '60px' }}
                                            >
                                              <option value="">--</option>
                                              {bancoOptions.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                        <div style={{ width: '110px', color: '#374151' }}>{codigo}</div>
                                        <div style={{ width: '110px', color: '#6b7280' }}>{rowDateEmissao ? formatarData(rowDateEmissao) : ''}</div>
                                        <div style={{ width: '120px', color: '#6b7280', fontWeight: 600 }}>{det.tpcob_pag || det.tpcob || ''}</div>
                                        <div style={{ width: '140px', color: '#374151' }}>{documentoP}</div>
                                        <div style={{ width: '180px', color: '#374151' }}>{fornecedor}</div>
                                        <div style={{ width: '120px', textAlign: 'right', fontWeight: 700 }}>{valor ? formatarMoeda(Number(valor)) : ''}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      }
                    </div>
                  )}
                </div>
              )))}
          </div>
        </>
      );
    }

    // Contas a Receber: SEM coluna Tipo, COM coluna Documento, "Clientes"
    const columnDefsReceber = [
        {
          field: 'codigo_rec',
          headerName: 'Código',
          width: 80,
          getQuickFilterText: (params: any) => params.value || ''
        },
        {
          field: 'numdup_rec',
          headerName: 'Número',
          width: 90,
          getQuickFilterText: (params: any) => params.value || ''
        },
        {
          field: 'parcela_rec',
          headerName: 'Parc.',
          width: 50,
          getQuickFilterText: (params: any) => params.value || ''
        },
        {
          field: 'cgccpf_rec_formatted',
          headerName: 'Documento',
          width: 154,
          getQuickFilterText: (params: any) => params.value || ''
        },
        {
          field: 'nome_cli',
          headerName: 'Clientes',
          width: 250,
          getQuickFilterText: (params: any) => params.value || ''
        },
        {
          field: 'descr_dep',
          headerName: 'Dpto',
          width: 182,
          editable: podeEditarReceber,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: opcoesDeptos.map((d: any) => d.codigo_dep)
          },
          valueFormatter: (params: any) => {
            if (!params.value) return '';
            const depto = opcoesDeptos.find((d: any) => d.codigo_dep === params.value);
            return depto ? depto.descr_dep : params.value;
          },
          onCellValueChanged: (event: any) => handleAtualizarDepartamento(event)
        },
        {
          field: 'tpcob_rec',
          headerName: 'Tipo de Cobrança',
          width: 150,
          editable: podeEditarReceber,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: {
            values: opcoesCobranca.map((c: any) => c.codigo)
          },
          valueFormatter: (params: any) => {
            if (!params.value) return '';
            const cob = opcoesCobranca.find((c: any) => c.codigo === params.value);
            return cob ? cob.descricao : params.value;
          },
          filter: 'agTextColumnFilter',
          filterParams: {
            filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
            textFormatter: (value: string) => value,
            debounceMs: 200,
            // Adicionar lista de valores para sugestões
            values: opcoesCobranca.map((c: any) => c.descricao)
          },
          onCellValueChanged: (event: any) => handleAtualizarTipoCobranca(event),
          getQuickFilterText: (params: any) => {
            if (!params.value) return '';
            const cob = opcoesCobranca.find((c: any) => c.codigo === params.value);
            return cob ? cob.descricao : params.value;
          }
        },
        {
          field: 'descr_doc',
          headerName: 'Tipo de Documento',
          width: 150,
          // valueGetter tenta múltiplas chaves que podem conter a descrição
          valueGetter: (params: any) => {
            const r = params.data || {};
            return r.descr_doc || r.descr_docp || r.descr_doc_pag || r.descr_docp_pag || r.descr_docp || r.descr_doc || r.descricao || r.descr_docp || r.tipodoc_pag || r.tipodoc || r.tipodoc_rec || r.tipodoc_pag || r.tipodoc || '';
          },
          getQuickFilterText: (params: any) => {
            const v = params?.value ?? '';
            return String(v || '');
          },
          filter: 'agTextColumnFilter',
          filterParams: {
            filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
            debounceMs: 200
          }
        },
        {
          field: 'dtmovi_rec',
          headerName: 'Movimento',
          width: 110,
          valueFormatter: (params: any) => formatarData(params.value),
          getQuickFilterText: (params: any) => formatarData(params.value)
        },
        {
          field: 'dtvenci_rec',
          headerName: 'Vencimento',
          width: 110,
          valueFormatter: (params: any) => formatarData(params.value),
          getQuickFilterText: (params: any) => formatarData(params.value)
        },
        {
          field: 'dtpagi_rec',
          headerName: 'Pago',
          width: 110,
          valueFormatter: (params: any) => formatarData(params.value),
          getQuickFilterText: (params: any) => formatarData(params.value)
        },
        {
          field: 'vlrdup_rec',
          headerName: 'Valor Original (R$)',
          width: 140,
          valueFormatter: (params: any) => formatarMoeda(params.value),
          getQuickFilterText: (params: any) => formatarMoeda(params.value)
        },
        {
          field: 'vlrsal_rec',
          headerName: 'Saldo (R$)',
          width: 140,
          valueFormatter: (params: any) => formatarMoeda(params.value),
          getQuickFilterText: (params: any) => formatarMoeda(params.value),
          cellStyle: (params: any) => ({
            color: params.value > 0 ? '#dc2626' : '#059669',
            fontWeight: params.value > 0 ? 'bold' : 'normal'
          })
        },
        {
          headerName: 'Status',
          width: 90,
          cellRenderer: (params: any) => {
            const saldo = params.data?.vlrsal_rec || 0;
            const status = saldo > 0 ? 'Em Aberto' : 'Pago';
            return (
              <span style={{
                color: saldo > 0 ? '#dc2626' : '#059669',
                fontWeight: 'bold'
              }}>
                {status}
              </span>
            );
          },
          getQuickFilterText: (params: any) => {
            const saldo = params.data?.vlrsal_rec || 0;
            return saldo > 0 ? 'Em Aberto' : 'Pago';
          }
        },
        {
          headerName: 'Dias em Atraso',
          width: 120,
          cellRenderer: (params: any) => {
            const dtvenci = new Date(params.data?.dtvenci_rec);
            const saldo = params.data?.vlrsal_rec || 0;

            // Se tem saldo (não pago), calcula em relação a hoje
            if (saldo > 0) {
              const hoje = new Date();
              const diffTime = Math.floor((hoje.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

              if (diffTime < 0) {
                return <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>A Vencer</span>;
              } else if (diffTime === 0) {
                return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Vence Hoje</span>;
              } else {
                return (
                  <span style={{
                    color: '#dc2626',
                    fontWeight: 'bold',
                    backgroundColor: '#fee2e2',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {diffTime} dias
                  </span>
                );
              }
            }
            // Se pago (saldo = 0), calcula em relação à data de pagamento
            else {
              const dtpagi = params.data?.dtpagi_rec;
              if (!dtpagi) {
                return <span style={{ color: '#059669', fontWeight: 'bold' }}>Pago</span>;
              }

              const dataPagamento = new Date(dtpagi);
              const diffTime = Math.floor((dataPagamento.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

              if (diffTime <= 0) {
                // Pago no dia ou antes do vencimento
                return <span style={{ color: '#059669', fontWeight: 'bold' }}>Pago</span>;
              } else {
                // Pago depois do vencimento
                return (
                  <span style={{
                    color: '#dc2626',
                    fontWeight: 'bold',
                    backgroundColor: '#fee2e2',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {diffTime} dias
                  </span>
                );
              }
            }
          },
          getQuickFilterText: (params: any) => {
            const dtvenci = new Date(params.data?.dtvenci_rec);
            const saldo = params.data?.vlrsal_rec || 0;

            // Se tem saldo (não pago), calcula em relação a hoje
            if (saldo > 0) {
              const hoje = new Date();
              const diffTime = Math.floor((hoje.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

              if (diffTime < 0) {
                return 'A Vencer';
              } else if (diffTime === 0) {
                return 'Vence Hoje';
              } else {
                return `${diffTime} dias`;
              }
            }
            // Se pago (saldo = 0), calcula em relação à data de pagamento
            else {
              const dtpagi = params.data?.dtpagi_rec;
              if (!dtpagi) {
                return 'Pago';
              }

              const dataPagamento = new Date(dtpagi);
              const diffTime = Math.floor((dataPagamento.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

              if (diffTime <= 0) {
                return 'Pago';
              } else {
                return `${diffTime} dias`;
              }
            }
          }
        }
      ];

    let columnDefsPagar;

    if (filtros.tipo === 'receber') {
      const columnDefs = columnDefsReceber;
      return (
        <ResultTable>
          <AgGridContainer className="ag-theme-quartz">
            <AgGridReact
              columnDefs={columnDefs}
              rowData={dados}
              pinnedBottomRowData={totalRow ? [totalRow] : []}
              defaultColDef={{ resizable: true, sortable: true, filter: true, floatingFilter: true }}
              pagination={true}
              paginationPageSize={50}
              domLayout="normal"
              onFilterChanged={recalcularTotal}
              onGridReady={onGridReady}
              overlayNoRowsTemplate={`<div style="padding: 20px; text-align: center;"><div style="font-size: 24px; color: #6b7280; margin-bottom: 10px;">🔍</div><div>Nenhum resultado encontrado. Ajuste os filtros e tente novamente.</div></div>`}
            />
          </AgGridContainer>
        </ResultTable>
      );
    }

    // Consulta Caixa e Bancos: Lista com agrupamento por Tipo (C/D) → Operação → Data
    if (filtros.tipo === 'consulta_caixa') {
      // Estrutura: agrupar primeiro por dc_cai (C/D), depois por oper_cai, depois por data
      const gruposPorTipo: any = {
        'C': { tipo: 'C', label: 'Crédito', operacoes: {}, total: 0 },
        'D': { tipo: 'D', label: 'Débito', operacoes: {}, total: 0 }
      };

      // Primeiro agrupamento: por tipo (C/D) e operação
      (consultaDados || []).forEach((row: any) => {
        const tipo = row.dc_cai || 'D';
        const operacao = row.oper_cai || 'Sem Operação';
        const valor = parseNumeric(row.valor_cai ?? row.valor ?? 0) || 0;

        if (!gruposPorTipo[tipo]) {
          gruposPorTipo[tipo] = { tipo, label: tipo === 'C' ? 'Crédito' : 'Débito', operacoes: {}, total: 0 };
        }

        if (!gruposPorTipo[tipo].operacoes[operacao]) {
          gruposPorTipo[tipo].operacoes[operacao] = {
            operacao,
            valor_total: 0,
            creditos: 0,
            debitos: 0,
            dc_cai: tipo,
            detalhes: []
          };
        }

        gruposPorTipo[tipo].operacoes[operacao].valor_total += valor;
        gruposPorTipo[tipo].total += valor;

        if (tipo === 'C') {
          gruposPorTipo[tipo].operacoes[operacao].creditos += valor;
        } else {
          gruposPorTipo[tipo].operacoes[operacao].debitos += valor;
        }

        gruposPorTipo[tipo].operacoes[operacao].detalhes.push(row);
      });

      // Ordenar dentro de cada tipo: operações alfabética, e detalhes por data crescente
      Object.values(gruposPorTipo).forEach((tipoGroup: any) => {
        Object.values(tipoGroup.operacoes).forEach((op: any) => {
          op.detalhes.sort((a: any, b: any) => {
            const dataA = a.dtmovi_cai ? String(a.dtmovi_cai).replace(/\D/g, '') : '99999999';
            const dataB = b.dtmovi_cai ? String(b.dtmovi_cai).replace(/\D/g, '') : '99999999';
            return dataA.localeCompare(dataB); // Crescente
          });
        });
      });

      // Montar lista de tipos ordenada: C primeiro, depois D
      const tiposOrdenados = [gruposPorTipo['C'], gruposPorTipo['D']].filter(t => Object.keys(t.operacoes).length > 0);

      // Calcular totais gerais
      const totalCreditos = tiposOrdenados.find((t: any) => t.tipo === 'C')?.total || 0;
      const totalDebitos = tiposOrdenados.find((t: any) => t.tipo === 'D')?.total || 0;
      const totalConsulta = totalCreditos - totalDebitos;

      return (
        <div style={{ padding: '0 24px', maxHeight: '65vh', overflowY: 'auto' }}>
          {(consultaDados || []).length === 0 && !consultaLoading && (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Nenhum movimento encontrado</h3>
              <p style={{ fontSize: '14px' }}>Tente ajustar os filtros de data ou banco para encontrar o que procura.</p>
            </div>
          )}
          {/* Renderizar por Tipo (C/D) e depois por Operação dentro de cada tipo */}
          {tiposOrdenados.map((tipoGroup: any) => (
            <div key={tipoGroup.tipo} style={{ marginBottom: '24px' }}>
              {/* Subtítulo por Tipo */}
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: tipoGroup.tipo === 'C' ? '#059669' : '#dc2626',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {tipoGroup.tipo === 'C' ? '📥 CRÉDITOS' : '📤 DÉBITOS'}
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280' }}>
                  ({(Object.values(tipoGroup.operacoes) as any[]).reduce((sum: number, op: any) => sum + (op.detalhes?.length || 0), 0)} lançamentos)
                </span>
              </div>

              {/* Linha de Cabeçalhos */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 14px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                <div>OPERAÇÃO</div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>REALIZADO</div>
                  <div style={{ textAlign: 'right', minWidth: '110px' }}>PREVISTO</div>
                  <div style={{ textAlign: 'right', minWidth: '90px' }}>ÍNDICE</div>
                </div>
              </div>

              {/* Renderizar Operações dentro deste Tipo */}
              {Object.values(tipoGroup.operacoes).map((grupo: any) => {
                const expandKey = `${tipoGroup.tipo}-${grupo.operacao}`;
                return (
                  <div key={expandKey} id={`operacao-${expandKey}`} style={{ marginBottom: '12px' }}>
                    {/* Cabeçalho Expansível */}
                    <div
                      onClick={() => toggleExpandir(expandKey)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px 6px 0 0',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FontAwesomeIcon
                          icon={expandedDates.has(expandKey) ? faChevronDown : faChevronRight}
                          style={{ color: '#6b7280', width: '16px' }}
                        />
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {grupo.operacao} ({grupo.detalhes.length})
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        {/* Realizado */}
                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: grupo.dc_cai === 'C' ? '#059669' : '#dc2626',
                          }}>
                            {grupo.dc_cai === 'C' ? '+' : '-'} {formatarMoeda(Math.abs(grupo.valor_total))}
                          </div>
                        </div>

                        {/* Previsto */}
                        {(() => {
                          // Tentar múltiplas chaves de lookup
                          const tipo = tipoGroup.tipo; // 'C' ou 'D'
                          const operacao = grupo.operacao; // ex: "RECEBIMENTO MATERIAL USO E CONSUMO DIVERSO"
                          let prevKey = `${tipo}-${operacao}`;
                          let prevData = previsoesPorOperacao[prevKey];

                          // Se não encontrar, tentar outras chaves
                          if (!prevData || prevData.previsto === undefined || prevData.previsto === 0) {
                            // Tentar com valor numérico do operacao_ocai (se foi extraído assim)
                            for (let key of Object.keys(previsoesPorOperacao)) {
                              if (key.startsWith(`${tipo}-`) && key.includes(operacao.substring(0, 30))) {
                                prevData = previsoesPorOperacao[key];
                                prevKey = key;
                                break;
                              }
                            }
                          }

                          const prevValue = prevData?.previsto || 0;
                          return (
                            <div style={{ textAlign: 'right', minWidth: '110px' }}>
                              <div style={{
                                fontSize: '13px',
                                color: prevValue > 0 ? '#2563eb' : '#999',
                                fontWeight: prevValue > 0 ? '600' : '400'
                              }}>
                                {prevValue > 0 ? formatarMoeda(prevValue) : '—'}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Índice (Realizado / Previsto) */}
                        {(() => {
                          // Tentar múltiplas chaves de lookup
                          const tipo = tipoGroup.tipo;
                          const operacao = grupo.operacao;
                          let prevKey = `${tipo}-${operacao}`;
                          let prevData = previsoesPorOperacao[prevKey];

                          // Se não encontrar, tentar outras chaves
                          if (!prevData || prevData.previsto === undefined || prevData.previsto === 0) {
                            for (let key of Object.keys(previsoesPorOperacao)) {
                              if (key.startsWith(`${tipo}-`) && key.includes(operacao.substring(0, 30))) {
                                prevData = previsoesPorOperacao[key];
                                prevKey = key;
                                break;
                              }
                            }
                          }

                          const prevValue = prevData?.previsto || 0;
                          const indice = prevValue > 0 ? ((Math.abs(grupo.valor_total) / prevValue) * 100).toFixed(1) : 0;
                          const indiceNum = Number(indice);
                          return (
                            <div style={{ textAlign: 'right', minWidth: '90px' }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: prevValue > 0 ? '600' : '400',
                                color: indiceNum > 100 ? '#dc2626' : (prevValue > 0 ? '#059669' : '#999'),
                              }}>
                                {prevValue > 0 ? `${indice}%` : '—'}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    {(() => {
                      const isExpanded = expandedDates.has(expandKey);
                      if (grupo.operacao === 'PRO-LABORE') {
                        console.log('[RENDER-OPERACAO] PRO-LABORE - expandKey:', expandKey, 'isExpanded:', isExpanded, 'expandedDates:', Array.from(expandedDates));
                      }
                      return isExpanded;
                    })() && (
                        <div style={{ background: '#f9fafb', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', borderRadius: '0 0 6px 6px', padding: '8px 0' }}>
                          {grupo.detalhes.map((row: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 16px', borderBottom: idx < grupo.detalhes.length - 1 ? '1px solid #e5e7eb' : 'none', fontSize: '13px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, color: '#1f2937', marginBottom: '4px' }}>
                                  {row.nome_cai || row.tipocai_cai || row.codbanco_cai || '—'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginTop: '4px', flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: '12px', color: '#6b7280', minWidth: '90px' }}>
                                    📅 {formatarData(row.dtmovi_cai)}
                                  </div>
                                  {row.seq_cai && (
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                      Seq: {row.seq_cai}
                                    </div>
                                  )}
                                  {row.descr_dpto && (
                                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>
                                      🏢 {row.descr_dpto}
                                    </div>
                                  )}
                                  {row.histor_cai && (
                                    <div style={{ fontSize: '12px', color: '#4b5563', fontStyle: 'italic', flex: 1 }}>
                                      📝 {row.histor_cai}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', marginRight: '12px', minWidth: '140px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: row.dc_cai === 'C' ? '#059669' : '#dc2626', marginBottom: '4px' }}>
                                  {row.dc_cai === 'C' ? '+' : '-'} {formatarMoeda(row.valor_cai || row.valor || 0)}
                                </div>
                                {row.vlrprev_cai && (
                                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                    Previsto: {formatarMoeda(row.vlrprev_cai)}
                                  </div>
                                )}
                              </div>
                              <button
                                className={`btn btn-sm ${podeEditarCaixa ? 'btn-primary' : 'btn-info'}`}
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  whiteSpace: 'nowrap',
                                  marginLeft: '8px',
                                  background: podeEditarCaixa ? undefined : '#0ea5e9',
                                  borderColor: podeEditarCaixa ? undefined : '#0ea5e9'
                                }}
                                onClick={() => abrirFormularioCaixaEditar(row)}
                              >
                                <FontAwesomeIcon icon={podeEditarCaixa ? faEdit : faSearch} style={{ marginRight: '4px', fontSize: '10px' }} />
                                {podeEditarCaixa ? 'Editar' : 'Visualizar'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })}

              {/* Subtotal por Tipo */}
              <div style={{
                background: tipoGroup.tipo === 'C' ? '#d1fae5' : '#fee2e2',
                border: `2px solid ${tipoGroup.tipo === 'C' ? '#059669' : '#dc2626'}`,
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: tipoGroup.tipo === 'C' ? '#059669' : '#dc2626' }}>
                  Subtotal {tipoGroup.label}
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  {/* Realizado */}
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: tipoGroup.tipo === 'C' ? '#059669' : '#dc2626' }}>
                      {tipoGroup.tipo === 'C' ? '+' : '-'} {formatarMoeda(Math.abs(tipoGroup.total))}
                    </div>
                  </div>

                  {/* Previsto (Soma de todas operações deste tipo) */}
                  {(() => {
                    const prevValue = Object.values(tipoGroup.operacoes).reduce((sum: number, op: any) => {
                      const prevKey = `${tipoGroup.tipo}-${op.operacao}`;
                      return sum + (previsoesPorOperacao[prevKey]?.previsto || 0);
                    }, 0) as number;
                    return (
                      <div style={{ textAlign: 'right', minWidth: '110px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#666',
                        }}>
                          {prevValue > 0 ? formatarMoeda(Number(prevValue)) : '—'}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Índice (Realizado / Previsto) */}
                  {(() => {
                    const prevValue = Object.values(tipoGroup.operacoes).reduce((sum: number, op: any) => {
                      const prevKey = `${tipoGroup.tipo}-${op.operacao}`;
                      return sum + (previsoesPorOperacao[prevKey]?.previsto || 0);
                    }, 0) as number;
                    const indice = prevValue > 0 ? ((Math.abs(tipoGroup.total) / prevValue) * 100).toFixed(1) : 0;
                    const indiceNum = Number(indice);
                    return (
                      <div style={{ textAlign: 'right', minWidth: '90px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: indiceNum > 100 ? '#dc2626' : '#059669',
                        }}>
                          {prevValue > 0 ? `${indice}%` : '—'}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}

          {/* Linha de Total GERAL - Destacada e sempre visível */}
          <div style={{
            position: 'sticky',
            bottom: 0,
            marginTop: '24px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '3px solid #059669',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
            zIndex: 10
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💰 TOTAL GERAL FILTRADO
            </div>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
              {/* Total Créditos - Realizado */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#a0aec0' }}>Créditos (Real)</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>
                  {formatarMoeda(totalCreditos)}
                </div>
              </div>

              {/* Total Créditos - Previsto */}
              {(() => {
                const prevCred = Object.values(gruposPorTipo['C']?.operacoes || {}).reduce((sum: number, op: any) => {
                  const prevKey = `C-${op.operacao}`;
                  return sum + (previsoesPorOperacao[prevKey]?.previsto || 0);
                }, 0) as number;
                return (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>Créditos (Prev)</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>
                      {prevCred > 0 ? formatarMoeda(Number(prevCred)) : '—'}
                    </div>
                  </div>
                );
              })()}

              {/* Total Créditos - Índice */}
              {(() => {
                const prevCred = Object.values(gruposPorTipo['C']?.operacoes || {}).reduce((sum: number, op: any) => {
                  const prevKey = `C-${op.operacao}`;
                  return sum + (previsoesPorOperacao[prevKey]?.previsto || 0);
                }, 0) as number;
                const indiceCred = prevCred > 0 ? ((totalCreditos / prevCred) * 100).toFixed(1) : 0;
                const indiceCreditNum = Number(indiceCred);
                return (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>Créditos (Índice)</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: indiceCreditNum > 100 ? '#dc2626' : '#059669' }}>
                      {prevCred > 0 ? `${indiceCred}%` : '—'}
                    </div>
                  </div>
                );
              })()}

              {/* Total Débitos - Realizado */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#a0aec0' }}>Débitos (Real)</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>
                  {formatarMoeda(totalDebitos)}
                </div>
              </div>

              {/* Total Débitos - Previsto */}
              {(() => {
                const prevDeb = Object.values(gruposPorTipo['D']?.operacoes || {}).reduce((sum: number, op: any) => {
                  const prevKey = `D-${op.operacao}`;
                  return sum + (previsoesPorOperacao[prevKey]?.previsto || 0);
                }, 0) as number;
                return (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>Débitos (Prev)</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b7280' }}>
                      {prevDeb > 0 ? formatarMoeda(Number(prevDeb)) : '—'}
                    </div>
                  </div>
                );
              })()}

              {/* Total Débitos - Índice */}
              {(() => {
                const prevDeb = Object.values(gruposPorTipo['D']?.operacoes || {}).reduce((sum: number, op: any) => {
                  const prevKey = `D-${op.operacao}`;
                  return sum + (previsoesPorOperacao[prevKey]?.previsto || 0);
                }, 0) as number;
                const indiceDeb = prevDeb > 0 ? ((totalDebitos / prevDeb) * 100).toFixed(1) : 0;
                const indiceDebNum = Number(indiceDeb);
                return (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#a0aec0' }}>Débitos (Índice)</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: indiceDebNum > 100 ? '#dc2626' : '#059669' }}>
                      {prevDeb > 0 ? `${indiceDeb}%` : '—'}
                    </div>
                  </div>
                );
              })()}

              {/* Total Líquido */}
              <div style={{ textAlign: 'right', minWidth: '180px' }}>
                <div style={{ fontSize: '12px', color: '#a0aec0' }}>Total</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: totalConsulta >= 0 ? '#10b981' : '#dc2626',
                  backgroundColor: totalConsulta >= 0 ? '#d1fae5' : '#fee2e2',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  {formatarMoeda(totalConsulta)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Contas a Pagar: SEM coluna Tipo, COM coluna Documento, "Fornecedores"
    columnDefsPagar = [
      {
        field: 'codigo_pag',
        headerName: 'Código',
        width: 80,
        getQuickFilterText: (params: any) => params.value || ''
      },
      {
        field: 'numdup_pag',
        headerName: 'Número',
        width: 90,
        getQuickFilterText: (params: any) => params.value || ''
      },
      {
        field: 'parcela_pag',
        headerName: 'Parc.',
        width: 50,
        getQuickFilterText: (params: any) => params.value || ''
      },
      {
        field: 'cgccpf_pag_formatted',
        headerName: 'Documento',
        width: 154,
        getQuickFilterText: (params: any) => params.value || ''
      },
      {
        field: 'nome_for',
        headerName: 'Fornecedores',
        width: 250,
        getQuickFilterText: (params: any) => params.value || ''
      },
      {
        field: 'descr_dep',
        headerName: 'Dpto',
        width: 182,
        editable: podeEditarPagar,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: opcoesDeptos.map((d: any) => d.codigo)
        },
        valueFormatter: (params: any) => {
          if (!params.value) return '';
          const depto = opcoesDeptos.find((d: any) => d.codigo === params.value);
          return depto ? depto.descricao : params.value;
        },
        onCellValueChanged: (event: any) => handleAtualizarDepartamento(event)
      },
      {
        field: 'tpcob_pag',
        headerName: 'Tipo de Cobrança',
        width: 150,
        editable: podeEditarPagar,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: opcoesCobranca.map((c: any) => c.codigo)
        },
        valueFormatter: (params: any) => {
          if (!params.value) return '';
          const cob = opcoesCobranca.find((c: any) => c.codigo === params.value);
          return cob ? cob.descricao : params.value;
        },
        filter: 'agTextColumnFilter',
        filterParams: {
          filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
          textFormatter: (value: string) => value,
          debounceMs: 200,
          // Adicionar lista de valores para sugestões
          values: opcoesCobranca.map((c: any) => c.descricao)
        },
        onCellValueChanged: (event: any) => handleAtualizarTipoCobranca(event),
        getQuickFilterText: (params: any) => {
          if (!params.value) return '';
          const cob = opcoesCobranca.find((c: any) => c.codigo === params.value);
          return cob ? cob.descricao : params.value;
        }
      },
      {
        field: 'descr_doc',
        headerName: 'Tipo de Documento',
        width: 150,
        valueGetter: (params: any) => {
          const r = params.data || {};
          return r.descr_doc || r.descr_docp || r.descr_doc_pag || r.descr_docp_pag || r.descr_docp || r.descr_doc || r.descricao || r.descr_docp || r.tipodoc_pag || r.tipodoc || r.tipodoc_pag || r.tipodoc || '';
        },
        getQuickFilterText: (params: any) => {
          const v = params?.value ?? '';
          return String(v || '');
        },
        filter: 'agTextColumnFilter',
        filterParams: {
          filterOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
          debounceMs: 200
        }
      },
      {
        field: 'dtmovi_pag',
        headerName: 'Movimento',
        width: 110,
        valueFormatter: (params: any) => formatarData(params.value),
        getQuickFilterText: (params: any) => formatarData(params.value)
      },
      {
        field: 'dtvenci_pag',
        headerName: 'Vencimento',
        width: 110,
        valueFormatter: (params: any) => formatarData(params.value),
        getQuickFilterText: (params: any) => formatarData(params.value)
      },
      {
        field: 'dtpagi_pag',
        headerName: 'Pago',
        width: 110,
        valueFormatter: (params: any) => formatarData(params.value),
        getQuickFilterText: (params: any) => formatarData(params.value)
      },
      {
        field: 'vlrdup_pag',
        headerName: 'Valor Original (R$)',
        width: 140,
        valueFormatter: (params: any) => formatarMoeda(params.value),
        getQuickFilterText: (params: any) => formatarMoeda(params.value)
      },
      {
        field: 'vlrsal_pag',
        headerName: 'Saldo (R$)',
        width: 140,
        valueFormatter: (params: any) => formatarMoeda(params.value),
        getQuickFilterText: (params: any) => formatarMoeda(params.value),
        cellStyle: (params: any) => ({
          color: params.value > 0 ? '#dc2626' : '#059669',
          fontWeight: params.value > 0 ? 'bold' : 'normal'
        })
      },
      {
        headerName: 'Status',
        width: 90,
        cellRenderer: (params: any) => {
          const saldo = params.data?.vlrsal_pag || 0;
          const status = saldo > 0 ? 'Em Aberto' : 'Pago';
          return (
            <span style={{
              color: saldo > 0 ? '#dc2626' : '#059669',
              fontWeight: 'bold'
            }}>
              {status}
            </span>
          );
        },
        getQuickFilterText: (params: any) => {
          const saldo = params.data?.vlrsal_pag || 0;
          return saldo > 0 ? 'Em Aberto' : 'Pago';
        }
      },
      {
        headerName: 'Dias em Atraso',
        width: 120,
        cellRenderer: (params: any) => {
          const dtvenci = new Date(params.data?.dtvenci_pag);
          const saldo = params.data?.vlrsal_pag || 0;

          // Se tem saldo (não pago), calcula em relação a hoje
          if (saldo > 0) {
            const hoje = new Date();
            const diffTime = Math.floor((hoje.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

            if (diffTime < 0) {
              return <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>A Vencer</span>;
            } else if (diffTime === 0) {
              return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Vence Hoje</span>;
            } else {
              return (
                <span style={{
                  color: '#dc2626',
                  fontWeight: 'bold',
                  backgroundColor: '#fee2e2',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {diffTime} dias
                </span>
              );
            }
          }
          // Se pago (saldo = 0), calcula em relação à data de pagamento
          else {
            const dtpagi = params.data?.dtpagi_pag;
            if (!dtpagi) {
              return <span style={{ color: '#059669', fontWeight: 'bold' }}>Pago</span>;
            }

            const dataPagamento = new Date(dtpagi);
            const diffTime = Math.floor((dataPagamento.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

            if (diffTime <= 0) {
              // Pago no dia ou antes do vencimento
              return <span style={{ color: '#059669', fontWeight: 'bold' }}>Pago</span>;
            } else {
              // Pago depois do vencimento
              return (
                <span style={{
                  color: '#dc2626',
                  fontWeight: 'bold',
                  backgroundColor: '#fee2e2',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {diffTime} dias
                </span>
              );
            }
          }
        },
        getQuickFilterText: (params: any) => {
          const dtvenci = new Date(params.data?.dtvenci_pag);
          const saldo = params.data?.vlrsal_pag || 0;

          // Se tem saldo (não pago), calcula em relação a hoje
          if (saldo > 0) {
            const hoje = new Date();
            const diffTime = Math.floor((hoje.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

            if (diffTime < 0) {
              return 'A Vencer';
            } else if (diffTime === 0) {
              return 'Vence Hoje';
            } else {
              return `${diffTime} dias`;
            }
          }
          // Se pago (saldo = 0), calcula em relação à data de pagamento
          else {
            const dtpagi = params.data?.dtpagi_pag;
            if (!dtpagi) {
              return 'Pago';
            }

            const dataPagamento = new Date(dtpagi);
            const diffTime = Math.floor((dataPagamento.getTime() - dtvenci.getTime()) / (1000 * 60 * 60 * 24));

            if (diffTime <= 0) {
              return 'Pago';
            } else {
              return `${diffTime} dias`;
            }
          }
        }
      }
    ];
    // Renegociação: reaproveita as mesmas columnDefs de Receber ou Pagar
    if (filtros.tipo === 'renegociacao') {
      const isReceber = renegociacaoTipo === 'receber';
      const baseCols = isReceber ? columnDefsReceber : (columnDefsPagar || []);
      const checkboxCol = {
        headerName: '',
        field: '_checkbox',
        width: 48,
        minWidth: 48,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        checkboxSelection: true,
        sortable: false,
        filter: false,
        floatingFilter: false,
        resizable: false,
        pinned: 'left' as const,
        suppressMenu: true
      };
      const columnDefsRen = [checkboxCol, ...baseCols];
      const rowDataRen = renegociacaoDados;
      const pinnedBottom = renegociacaoTotalRow ? [renegociacaoTotalRow] : [];
      const handleSelectionChanged = () => {
        const api = gridApi;
        if (!api) return;
        const selected = api.getSelectedRows();
        if (selected.length <= 1) {
          setRenegociacaoSelectedRows(selected);
          return;
        }
        const clientes = new Set(selected.map((r: any) => r.cgccpf_rec || r.cgccpf_pag || r.nome_cli || r.nome_for));
        if (clientes.size > 1) {
          alert('Selecione apenas registros do mesmo cliente.');
          api.deselectAll();
          setRenegociacaoSelectedRows([]);
          return;
        }
        setRenegociacaoSelectedRows(selected);
      };
      const handleRowDoubleClick = (params: any) => {
        const row = params.data;
        setRenegociacaoSelectedRow(row);
        const isReceberRow = row.receber_id != null || row.codigo_rec != null;
        const rowId = isReceberRow ? (row.receber_id || row.codigo_rec) : (row.pagar_id || row.codigo_pag);
        setRenegociacaoForm({
          codigo: isReceberRow ? (row.codigo_rec || '') : (row.codigo_pag || ''),
          numero: isReceberRow ? (row.numdup_rec || '') : (row.numdup_pag || ''),
          documento: isReceberRow ? (row.cgccpf_rec_formatted || row.cgccpf_rec || '') : (row.cgccpf_pag_formatted || row.cgccpf_pag || ''),
          cliente: isReceberRow ? (row.nome_cli || '') : (row.nome_for || ''),
          dpto: row.descr_dep || '',
          tipoCobranca: isReceberRow ? (row.tpcob_rec || row.tipocob_rec || '') : (row.tpcob_pag || row.tipocob_pag || ''),
          tipoDocumento: 'Renegociação',
          movimentacao: isReceberRow ? 'receber' : 'pagar',
          valorRenegociado: (() => { const s = Number(isReceberRow ? row.vlrsal_rec : row.vlrsal_pag || 0); return s + calcularJurosDocumento(s, isReceberRow ? row.dtvenci_rec : row.dtvenci_pag, Number(row.txjuro_bco || 0), Number(isReceberRow ? (row.vlracre_rec || 0) : (row.vlracre_pag || 0))); })(),
          entrada: 0,
          parcelas: 1,
          juros: 0,
          desconto: 0,
          valorParcelas: 0,
          motivo: '',
          vencimento: normalizarData(isReceberRow ? (row.dtvenci_rec || '') : (row.dtvenci_pag || '')),
          diaVencimento: '',
          receberId: isReceberRow ? rowId : null,
          pagarId: isReceberRow ? null : rowId
        });
        setRenegociacaoParcelas([]);
      };
      return (
        <ResultTable>
          <AgGridContainer className="ag-theme-quartz">
            <AgGridReact
              columnDefs={columnDefsRen}
              rowData={rowDataRen}
              pinnedBottomRowData={pinnedBottom}
              defaultColDef={{ resizable: true, sortable: true, filter: true, floatingFilter: true }}
              rowSelection="multiple"
              pagination={true}
              paginationPageSize={50}
              domLayout="normal"
              onGridReady={onGridReady}
              onRowDoubleClicked={handleRowDoubleClick}
              onSelectionChanged={handleSelectionChanged}
              overlayNoRowsTemplate={`<div style="padding: 20px; text-align: center;"><div style="font-size: 24px; color: #6b7280; margin-bottom: 10px;">🔍</div><div>Nenhum resultado encontrado. Ajuste os filtros e tente novamente.</div></div>`}
            />
          </AgGridContainer>
        </ResultTable>
      );
    }

    return (
      <ResultTable>
        <AgGridContainer className="ag-theme-quartz">
          <AgGridReact
            columnDefs={columnDefsPagar}
            rowData={dados}
            pinnedBottomRowData={totalRow ? [totalRow] : []}
            defaultColDef={{ resizable: true, sortable: true, filter: true, floatingFilter: true }}
            pagination={true}
            paginationPageSize={50}
            domLayout="normal"
            onFilterChanged={recalcularTotal}
            onGridReady={onGridReady}
            overlayNoRowsTemplate={`<div style="padding: 20px; text-align: center;"><div style="font-size: 24px; color: #6b7280; margin-bottom: 10px;">🔍</div><div>Nenhum resultado encontrado. Ajuste os filtros e tente novamente.</div></div>`}
          />
        </AgGridContainer>
      </ResultTable>
    );
  };

  return (
    <Container style={{ height }}>
      <Header style={{ marginBottom: '8px' }}>
        <Title>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          Relatórios Financeiros
        </Title>
      </Header>

      <SubMenu>
        {subMenuItems.map(item => (
          <SubMenuItem
            key={item.key}
            $active={tipoAtivo === item.key}
            onClick={() => handleSubMenuClick(item.key)}
          >
            <FontAwesomeIcon icon={item.icon} style={{ color: item.color }} />
            {item.label}
          </SubMenuItem>
        ))}
      </SubMenu>

      <Content>
        {tipoAtivo !== 'consulta_caixa' && tipoAtivo !== 'renegociacao' && (
          <FilterCard>
            {tipoAtivo === 'fluxo' ? (
              // Exibir cards de período APENAS para Fluxo de Caixa
              <PeriodCardsContainer style={{ gap: 12 }}>
                <FilterTitle $collapsed={periodCollapsed} onClick={() => setPeriodCollapsed(!periodCollapsed)} style={{ marginTop: 0 }}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  Período de Análise
                  <FontAwesomeIcon icon={periodCollapsed ? faChevronRight : faChevronDown} className="chevron" />
                </FilterTitle>
                <FilterContent $collapsed={periodCollapsed}>
                  {/* Layout: bancos acima, depois botões de período à direita com Exportar PDF */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <div style={{ flex: '1 1 auto' }}>
                      {/* Bank cards: agora aparecem antes dos period buttons */}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        {bancoOptions && bancoOptions.length > 0 ? bancoOptions.map((b) => (
                          <div
                            key={b}
                            onClick={() => {
                              setBancoSelecionado(b);
                              try {
                                const hoje = formatYMDUTC(new Date());
                                const novo = new Set(expandedDates);
                                novo.add(hoje);
                                setExpandedDates(novo);
                                setTimeout(() => {
                                  const el = document.getElementById(`grupo-${hoje}`);
                                  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 150);
                              } catch (e) { /* ignore */ }
                            }}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              border: bancoSelecionado === b ? '2px solid #0369a1' : '1px solid #e5e7eb',
                              background: bancoSelecionado === b ? '#eff6ff' : '#fff',
                              minWidth: 140,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{b}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{(saldosPorBanco[b] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                          </div>
                        )) : (
                          <div style={{ color: '#9ca3af', fontSize: 13 }}>Nenhum banco encontrado nos resultados</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Period buttons (30/60/90/120) */}
                        <PeriodCardButton
                          $isSelected={filtros.faixaAtraso === '30'}
                          $color="#0369a1"
                          onClick={() => {
                            const hoje = new Date();
                            const dataFinal = new Date(hoje);
                            dataFinal.setDate(dataFinal.getDate() + 30);
                            const newFiltros: FiltroRelatorio = {
                              ...filtros,
                              faixaAtraso: '30',
                              dataFiltroInicial: formatYMDUTC(hoje),
                              dataFiltroFinal: formatYMDUTC(dataFinal),
                              tipo: 'fluxo'
                            };
                            setFiltros(newFiltros);
                            setDados([]);
                            buscarDados(newFiltros);
                          }}
                        >
                          <span className="period-value">30</span>
                          <span className="period-label">dias</span>
                        </PeriodCardButton>
                        <PeriodCardButton
                          $isSelected={filtros.faixaAtraso === '60'}
                          $color="#0369a1"
                          onClick={() => {
                            const hoje = new Date();
                            const dataFinal = new Date(hoje);
                            dataFinal.setDate(dataFinal.getDate() + 60);
                            const newFiltros: FiltroRelatorio = {
                              ...filtros,
                              faixaAtraso: '60',
                              dataFiltroInicial: formatYMDUTC(hoje),
                              dataFiltroFinal: formatYMDUTC(dataFinal),
                              tipo: 'fluxo'
                            };
                            setFiltros(newFiltros);
                            setDados([]);
                            buscarDados(newFiltros);
                          }}
                        >
                          <span className="period-value">60</span>
                          <span className="period-label">dias</span>
                        </PeriodCardButton>
                        <PeriodCardButton
                          $isSelected={filtros.faixaAtraso === '90'}
                          $color="#0369a1"
                          onClick={() => {
                            const hoje = new Date();
                            const dataFinal = new Date(hoje);
                            dataFinal.setDate(dataFinal.getDate() + 90);
                            const newFiltros: FiltroRelatorio = {
                              ...filtros,
                              faixaAtraso: '90',
                              dataFiltroInicial: formatYMDUTC(hoje),
                              dataFiltroFinal: formatYMDUTC(dataFinal),
                              tipo: 'fluxo'
                            };
                            setFiltros(newFiltros);
                            setDados([]);
                            buscarDados(newFiltros);
                          }}
                        >
                          <span className="period-value">90</span>
                          <span className="period-label">dias</span>
                        </PeriodCardButton>
                        <PeriodCardButton
                          $isSelected={filtros.faixaAtraso === '120'}
                          $color="#0369a1"
                          onClick={() => {
                            const hoje = new Date();
                            const dataFinal = new Date(hoje);
                            dataFinal.setDate(dataFinal.getDate() + 120);
                            const newFiltros: FiltroRelatorio = {
                              ...filtros,
                              faixaAtraso: '120',
                              dataFiltroInicial: formatYMDUTC(hoje),
                              dataFiltroFinal: formatYMDUTC(dataFinal),
                              tipo: 'fluxo'
                            };
                            setFiltros(newFiltros);
                            setDados([]);
                            buscarDados(newFiltros);
                          }}
                        >
                          <span className="period-value">120</span>
                          <span className="period-label">dias</span>
                        </PeriodCardButton>
                      </div>

                      {/* Botões Exportar CSV e PDF alinhados com os period buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {dados.length > 0 && (
                          <>
                            <Button type="button" onClick={exportarCSV} style={{ marginLeft: 0, background: '#059669', borderColor: '#059669' }}>
                              <FontAwesomeIcon icon={faDownload} />
                              Exportar CSV
                            </Button>
                            <Button
                              type="button"
                              onClick={exportarRelatorio}
                              style={{ marginLeft: 0 }}
                              disabled={exportandoPDF}
                            >
                              <FontAwesomeIcon icon={exportandoPDF ? faSpinner : faDownload} spin={exportandoPDF} />
                              {exportandoPDF ? 'Gerando...' : 'Exportar PDF'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fluxo KPIs (abaixo, ocupando menos espaço) */}
                  {filtros.tipo === 'fluxo' && (
                    <div style={{ marginTop: 8, marginBottom: 4 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        <div style={{ padding: '8px 12px', borderRadius: 8, minHeight: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: fluxoKpis && fluxoKpis.saldoHoje >= 0 ? '#d1fae5' : '#fee2e2', border: `2px solid ${fluxoKpis && fluxoKpis.saldoHoje >= 0 ? '#059669' : '#dc2626'}` }}>
                          <div style={{ fontSize: 11, color: fluxoKpis && fluxoKpis.saldoHoje >= 0 ? '#047857' : '#b91c1c', fontWeight: 600 }}>📅 HOJE</div>
                          <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{fluxoGlobalKPIs ? formatarMoeda(fluxoGlobalKPIs.saldoHoje) : (fluxoKpis ? formatarMoeda(fluxoKpis.saldoHoje) : '-')}</div>
                        </div>
                        <div style={{ padding: '8px 12px', borderRadius: 8, minHeight: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#d1fae5', border: '2px solid #059669' }}>
                          <div style={{ fontSize: 11, color: '#047857', fontWeight: 600 }}>💰 Total a Receber</div>
                          <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{(fluxoGlobalKPIs ? formatarMoeda(fluxoGlobalKPIs.totalEntradas) : (fluxoKpis ? formatarMoeda(fluxoKpis.totalEntradas) : '-'))}</div>
                        </div>
                        <div style={{ padding: '8px 12px', borderRadius: 8, minHeight: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fee2e2', border: '2px solid #dc2626' }}>
                          <div style={{ fontSize: 11, color: '#b91c1c', fontWeight: 600 }}>💸 Total a Pagar</div>
                          <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{(fluxoGlobalKPIs ? formatarMoeda(fluxoGlobalKPIs.totalSaidas) : (fluxoKpis ? formatarMoeda(fluxoKpis.totalSaidas) : '-'))}</div>
                        </div>
                        <div style={{ padding: '8px 12px', borderRadius: 8, minHeight: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: (fluxoGlobalKPIs ? (fluxoGlobalKPIs.saldoFinal >= 0 ? '#d1fae5' : '#fee2e2') : (fluxoKpis && fluxoKpis.saldoFinal >= 0 ? '#d1fae5' : '#fee2e2')), border: `2px solid ${(fluxoGlobalKPIs ? (fluxoGlobalKPIs.saldoFinal >= 0 ? '#059669' : '#dc2626') : (fluxoKpis && fluxoKpis.saldoFinal >= 0 ? '#059669' : '#dc2626'))}` }}>
                          <div style={{ fontSize: 11, color: (fluxoGlobalKPIs ? (fluxoGlobalKPIs.saldoFinal >= 0 ? '#047857' : '#b91c1c') : (fluxoKpis && fluxoKpis.saldoFinal >= 0 ? '#047857' : '#b91c1c')), fontWeight: 600 }}>📈 Saldo Projetado</div>
                          <div style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{(fluxoGlobalKPIs ? formatarMoeda(fluxoGlobalKPIs.saldoFinal) : (fluxoKpis ? formatarMoeda(fluxoKpis.saldoFinal) : '-'))}</div>
                        </div>
                      </div>
                    </div>
                  )}

                </FilterContent>
              </PeriodCardsContainer>
            ) : (
              // Exibir filtros tradicionais APENAS para Receber e Pagar
              <>
                <FilterTitle $collapsed={collapseFilter} onClick={() => setCollapseFilter(!collapseFilter)}>
                  <FontAwesomeIcon icon={faFilter} />
                  Filtros do Relatório
                  <FontAwesomeIcon icon={faChevronRight} className="chevron" />
                </FilterTitle>

                <FilterContent $collapsed={collapseFilter}>
                  <FilterGrid>
                    <FilterGroup>
                      <Label>Tipo de Data</Label>
                      <Select
                        value={filtros.tipoDataFiltro}
                        onChange={(e) => handleFilterChange('tipoDataFiltro', e.target.value)}
                      >
                        <option value="vencimento">Data de Vencimento</option>
                        <option value="pagamento">Data de Pagamento</option>
                        <option value="emissao">Data de Emissão</option>
                      </Select>
                    </FilterGroup>

                    <FilterGroup>
                      <Label>Data Inicial</Label>
                      <Input
                        type="date"
                        value={filtros.dataFiltroInicial}
                        onChange={(e) => handleFilterChange('dataFiltroInicial', e.target.value)}
                      />
                    </FilterGroup>

                    <FilterGroup>
                      <Label>Data Final</Label>
                      <Input
                        type="date"
                        value={filtros.dataFiltroFinal}
                        onChange={(e) => handleFilterChange('dataFiltroFinal', e.target.value)}
                      />
                    </FilterGroup>

                    <FilterGroup style={{ minWidth: '15%' }}>
                      <Label>Tipo de Cobrança</Label>
                      <Select
                        value={filtros.tipoCobranca}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          console.log('📝 Tipo de cobrança selecionado:', selectedValue);
                          handleFilterChange('tipoCobranca', selectedValue);
                        }}
                      >
                        <option value="">Todos</option>
                        {opcoesCobranca.map(opcao => (
                          <option key={opcao.codigo} value={opcao.descricao}>
                            {opcao.descricao}
                          </option>
                        ))}
                      </Select>
                    </FilterGroup>

                    <FilterGroup style={{ minWidth: '15%' }}>
                      <Label>Tipo de Documento</Label>
                      <MultiSelectDropdown
                        placeholder="Selecione os documentos..."
                        options={opcoesTipoDocumento.map(opt => ({ value: opt.descricao, label: opt.descricao }))}
                        selectedValues={filtros.tiposDocumento || []}
                        onChange={(vals) => handleFilterChange('tiposDocumento', vals)}
                      />
                    </FilterGroup>

                    <FilterGroup style={{ minWidth: '12%' }}>
                      <Label>Faixa de Atraso (dias)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 30"
                        value={filtros.faixaAtraso}
                        onChange={(e) => handleFilterChange('faixaAtraso', e.target.value)}
                      />
                    </FilterGroup>
                  </FilterGrid>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Checkbox
                        type="checkbox"
                        id="soEmAberto"
                        checked={filtros.soEmAberto}
                        onChange={(e) => handleFilterChange('soEmAberto', e.target.checked)}
                      />
                      <CheckboxLabel htmlFor="soEmAberto">
                        Apenas em Aberto
                      </CheckboxLabel>

                      <Checkbox
                        type="checkbox"
                        id="soPagos"
                        checked={filtros.soPagos}
                        onChange={(e) => handleFilterChange('soPagos', e.target.checked)}
                      />
                      <CheckboxLabel htmlFor="soPagos">
                        Apenas Pagos
                      </CheckboxLabel>

                      {filtros.tipo === 'pagar' && (
                        <>
                          <Checkbox
                            type="checkbox"
                            id="folhaPagamento"
                            checked={filtros.folhaPagamento || false}
                            onChange={(e) => handleFilterChange('folhaPagamento', e.target.checked)}
                          />
                          <CheckboxLabel htmlFor="folhaPagamento">
                            Folha de Pagamento
                          </CheckboxLabel>
                        </>
                      )}

                      <ButtonGroup style={{ marginLeft: 'auto', gap: '12px' }}>
                        {dados.length > 0 && !filtrosAlterados ? (
                          <>
                            <Button type="button" onClick={exportarCSV} style={{ background: '#059669', borderColor: '#059669' }}>
                              <FontAwesomeIcon icon={faDownload} />
                              Exportar CSV
                            </Button>
                            <Button
                              type="button"
                              onClick={exportarRelatorio}
                              disabled={exportandoPDF}
                              $variant="success"
                            >
                              <FontAwesomeIcon icon={exportandoPDF ? faSpinner : faDownload} spin={exportandoPDF} />
                              {exportandoPDF ? 'Gerando...' : 'Gerar Relatório'}
                            </Button>
                          </>
                        ) : (
                          <Button type="button" onClick={() => buscarDados()} disabled={loading} $variant="primary">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
                            {loading ? 'Buscando...' : 'BUSCAR'}
                          </Button>
                        )}
                      </ButtonGroup>
                    </div>
                  </div>
                </FilterContent>
              </>
            )}
          </FilterCard>
        )}

        {tipoAtivo === 'consulta_caixa' && (
          <FilterCard>
            <FilterTitle $collapsed={consultaCollapseFilter} onClick={() => setConsultaCollapseFilter(!consultaCollapseFilter)}>
              <FontAwesomeIcon icon={faFilter} />
              Filtros do Relatório
              <FontAwesomeIcon icon={consultaCollapseFilter ? faChevronRight : faChevronDown} className="chevron" />
            </FilterTitle>

            <FilterContent $collapsed={consultaCollapseFilter}>
              <FilterGrid>
                <FilterGroup>
                  <Label>Data Inicial</Label>
                  <Input type="date" value={consultaDataInicial} onChange={(e) => setConsultaDataInicial(e.target.value)} />
                </FilterGroup>
                <FilterGroup>
                  <Label>Data Final</Label>
                  <Input type="date" value={consultaDataFinal} onChange={(e) => setConsultaDataFinal(e.target.value)} />
                </FilterGroup>
                <FilterGroup>
                  <Label>Tipo de Data</Label>
                  <Select value={consultaTipoData} onChange={(e) => setConsultaTipoData(e.target.value)}>
                    <option value="caixa">Data do Caixa</option>
                    <option value="pagamento">Data de Pagamento</option>
                    <option value="competencia">Data de Movimento (Competência)</option>
                  </Select>
                </FilterGroup>
                <FilterGroup>
                  <Label>Centro de Custo</Label>
                  <MultiSelectDropdown
                    placeholder="Todos os centros..."
                    options={opcoesDeptos.map((d: any) => ({ value: d.codigo, label: d.descricao }))}
                    selectedValues={consultaCentroCusto ? [consultaCentroCusto] : []}
                    onChange={(vals) => setConsultaCentroCusto(vals[0] || '')}
                  />
                </FilterGroup>
                <FilterGroup>
                  <Label>Operação de Caixa</Label>
                  <MultiSelectDropdown
                    placeholder="Todas as operações..."
                    options={opcoesOperacoesCaixa.map((op: any) => ({ value: op.codigo, label: op.descricao }))}
                    selectedValues={consultaOperacao ? [consultaOperacao] : []}
                    onChange={(vals) => setConsultaOperacao(vals[0] || '')}
                  />
                </FilterGroup>
                <FilterGroup>
                  <Label>Banco</Label>
                  <Select value={bancoSelecionado} onChange={(e) => setBancoSelecionado(e.target.value)}>
                    <option value="">Todos</option>
                    {bancoOptions.map((b: any) => (<option key={b} value={b}>{b}</option>))}
                  </Select>
                </FilterGroup>
              </FilterGrid>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button $variant="primary" type="button" onClick={buscarConsultaCaixa} disabled={consultaLoading}>{consultaLoading ? 'Buscando...' : 'Buscar'}</Button>
              </div>
            </FilterContent>
          </FilterCard>
        )}

        {tipoAtivo === 'renegociacao' && (
          <FilterCard>
            <FilterTitle $collapsed={renegociacaoCollapseFilter} onClick={() => setRenegociacaoCollapseFilter(!renegociacaoCollapseFilter)}>
              <FontAwesomeIcon icon={faFilter} />
              Filtros da Renegociação
              <FontAwesomeIcon icon={renegociacaoCollapseFilter ? faChevronRight : faChevronDown} className="chevron" />
            </FilterTitle>

            <FilterContent $collapsed={renegociacaoCollapseFilter}>
              <FilterGrid>
                <FilterGroup>
                  <Label>Financeiro</Label>
                  <Select value={renegociacaoTipo} onChange={(e) => {
                    setRenegociacaoTipo(e.target.value);
                    setRenegociacaoSearch('');
                    setRenegociacaoDados([]);
                    setRenegociacaoSuggestions([]);
                    setRenegociacaoShowDropdown(false);
                    setRenegociacaoTotalRow(null);
                  }}>
                    <option value="receber">Contas a Receber</option>
                    <option value="pagar">Contas a Pagar</option>
                  </Select>
                </FilterGroup>
                <FilterGroup style={{ position: 'relative' }}>
                  <Label>Buscar por Nome</Label>
                  <Input
                    type="text"
                    value={renegociacaoSearch}
                    onChange={(e) => {
                      setRenegociacaoSearch(e.target.value);
                      renegociacaoBlockAutoComplete.current = false;
                      if (!e.target.value.trim()) {
                        setRenegociacaoShowDropdown(false);
                        setRenegociacaoSuggestions([]);
                      }
                    }}
                    onFocus={() => {
                      if (renegociacaoSuggestions.length > 0) {
                        setRenegociacaoShowDropdown(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setRenegociacaoShowDropdown(false), 200)}
                    placeholder="Digite o nome para busca dinâmica..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        buscarRenegociacao();
                        setRenegociacaoShowDropdown(false);
                        setRenegociacaoSuggestions([]);
                      }
                    }}
                  />
                  {renegociacaoShowDropdown && renegociacaoSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
                      maxHeight: 240, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      {renegociacaoSuggestions.map((nome, idx) => (
                        <div key={idx}
                          onMouseDown={() => {
                            renegociacaoBlockAutoComplete.current = true;
                            setRenegociacaoSearch(nome);
                            setRenegociacaoShowDropdown(false);
                            setRenegociacaoSuggestions([]);
                            setTimeout(() => buscarRenegociacao(), 50);
                          }}
                          style={{
                            padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                            borderBottom: idx < renegociacaoSuggestions.length - 1 ? '1px solid #f3f4f6' : 'none'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                          {nome}
                        </div>
                      ))}
                    </div>
                  )}
                </FilterGroup>
              </FilterGrid>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button $variant="primary" type="button" onClick={() => { buscarRenegociacao(); setRenegociacaoShowDropdown(false); setRenegociacaoSuggestions([]); }} disabled={renegociacaoLoading}>{renegociacaoLoading ? 'Buscando...' : 'Buscar'}</Button>
                {renegociacaoSelectedRows.length > 0 && (
                  <Button $variant="primary" type="button" onClick={handleSimularRenegociacao} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                    Simulação ({renegociacaoSelectedRows.length})
                  </Button>
                )}
              </div>
            </FilterContent>
          </FilterCard>
        )}

        {(() => {
          // Render resultados quando houver dados ou loading, incluindo a aba de consulta de caixa
          const shouldRenderResultados = filtros.tipo === 'consulta_caixa'
            ? (consultaLoading || hasSearchedConsulta)
            : filtros.tipo === 'renegociacao'
              ? (renegociacaoLoading || renegociacaoDados.length > 0)
              : (loading || dados.length > 0 || !!(window as any)._hasSearchedFinanceiro);
          return shouldRenderResultados;
        })() && !(filtros.tipo === 'renegociacao' && isBulkRenegociacao) && (
            <ResultCard style={(filtros.tipo === 'receber' || filtros.tipo === 'pagar') ? { flex: 0.9, maxHeight: '90%' } : undefined}>
              {renderTabelaResultados()}
            </ResultCard>
          )}
        {filtros.tipo === 'renegociacao' && isBulkRenegociacao && renegociacaoSelectedRows.length > 0 && (
          (() => {
            const ITEMS_POR_PAGINA = 10;
            const totalPaginas = Math.max(1, Math.ceil(renegociacaoSelectedRows.length / ITEMS_POR_PAGINA));
            const paginaAtual = Math.min(paginaSelecionados, totalPaginas - 1);
            const inicio = paginaAtual * ITEMS_POR_PAGINA;
            const paginatedRows = renegociacaoSelectedRows.slice(inicio, inicio + ITEMS_POR_PAGINA);
            const isRec = renegociacaoTipo === 'receber';
            const totalValor = renegociacaoSelectedRows.reduce((s: number, r: any) => s + Number(isRec ? r.vlrdup_rec : r.vlrdup_pag || 0), 0);
            const totalSaldo = renegociacaoSelectedRows.reduce((s: number, r: any) => s + Number(isRec ? r.vlrsal_rec : r.vlrsal_pag || 0), 0);
            const totalJuros = renegociacaoSelectedRows.reduce((s: number, r: any) => s + calcularJurosDocumento(Number(isRec ? r.vlrsal_rec : r.vlrsal_pag || 0), isRec ? r.dtvenci_rec : r.dtvenci_pag, Number(r.txjuro_bco || 0), Number(isRec ? (r.vlracre_rec || 0) : (r.vlracre_pag || 0))), 0);
            const totalSaldoJuros = totalSaldo + totalJuros;
            return (
              <ResultCard style={{ flex: '0 0 auto', minHeight: 0 }}>
                <FilterTitle $collapsed={renegociacaoCollapseTable} onClick={() => setRenegociacaoCollapseTable(!renegociacaoCollapseTable)} style={{ padding: '14px 16px', margin: 0, borderBottom: renegociacaoCollapseTable ? 'none' : '1px solid #e5e7eb', background: '#f8fafc', borderRadius: '8px 8px 0 0' }}>
                  <FontAwesomeIcon icon={faFileInvoiceDollar} />
                  Documentos Selecionados
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: 4, marginLeft: 4 }}>
                    {renegociacaoSelectedRows.length}
                  </span>
                  <FontAwesomeIcon icon={renegociacaoCollapseTable ? faChevronRight : faChevronDown} className="chevron" style={{ marginLeft: 'auto' }} />
                </FilterTitle>
                <FilterContent $collapsed={renegociacaoCollapseTable}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Código</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Número</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>{isRec ? 'Cliente' : 'Fornecedor'}</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Documento</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Vencimento</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Dias Atraso</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Valor</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Valor Juros</th>
                          <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.03em' }}>Saldo + Juros</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRows.map((row: any, idx: number) => (
                          <tr key={inicio + idx} style={{ borderBottom: '1px solid #f1f5f9', background: (inicio + idx) % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '10px 14px', color: '#2563eb', fontWeight: 600 }}>{isRec ? row.codigo_rec : row.codigo_pag}</td>
                            <td style={{ padding: '10px 14px', color: '#1e293b' }}>{isRec ? row.numdup_rec : row.numdup_pag}</td>
                            <td style={{ padding: '10px 14px', color: '#1e293b', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isRec ? row.nome_cli : row.nome_for}</td>
                            <td style={{ padding: '10px 14px', color: '#1e293b' }}>{isRec ? (row.cgccpf_rec_formatted || row.cgccpf_rec) : (row.cgccpf_pag_formatted || row.cgccpf_pag)}</td>
                            <td style={{ padding: '10px 14px', color: '#1e293b' }}>{formatarData(isRec ? row.dtvenci_rec : row.dtvenci_pag)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'center', color: '#dc2626', fontWeight: 700, fontSize: 13 }}>{calcularDiasAtraso(isRec ? row.dtvenci_rec : row.dtvenci_pag)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#1e293b', fontWeight: 600 }}>{formatarMoeda(isRec ? row.vlrdup_rec : row.vlrdup_pag)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#ea580c', fontWeight: 600 }}>{formatarMoeda(calcularJurosDocumento(Number(isRec ? row.vlrsal_rec : row.vlrsal_pag || 0), isRec ? row.dtvenci_rec : row.dtvenci_pag, Number(row.txjuro_bco || 0), Number(isRec ? (row.vlracre_rec || 0) : (row.vlracre_pag || 0))))}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{formatarMoeda((isRec ? Number(row.vlrsal_rec) : Number(row.vlrsal_pag) || 0) + calcularJurosDocumento(Number(isRec ? row.vlrsal_rec : row.vlrsal_pag || 0), isRec ? row.dtvenci_rec : row.dtvenci_pag, Number(row.txjuro_bco || 0), Number(isRec ? (row.vlracre_rec || 0) : (row.vlracre_pag || 0))))}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                          <td colSpan={6} style={{ padding: '10px 14px', fontWeight: 700, fontSize: 12, color: '#1f2937' }}>TOTAL</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1f2937', fontSize: 12 }}>{formatarMoeda(totalValor)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#ea580c', fontSize: 12 }}>{formatarMoeda(totalJuros)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 12 }}>{formatarMoeda(totalSaldoJuros)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {totalPaginas > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <button
                        onClick={() => setPaginaSelecionados(p => Math.max(0, p - 1))}
                        disabled={paginaAtual === 0}
                        style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: paginaAtual === 0 ? '#f3f4f6' : '#fff', cursor: paginaAtual === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12, color: paginaAtual === 0 ? '#9ca3af' : '#374151' }}
                      >Anterior</button>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{paginaAtual + 1} de {totalPaginas}</span>
                      <button
                        onClick={() => setPaginaSelecionados(p => Math.min(totalPaginas - 1, p + 1))}
                        disabled={paginaAtual >= totalPaginas - 1}
                        style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, background: paginaAtual >= totalPaginas - 1 ? '#f3f4f6' : '#fff', cursor: paginaAtual >= totalPaginas - 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 12, color: paginaAtual >= totalPaginas - 1 ? '#9ca3af' : '#374151' }}
                      >Próximo</button>
                    </div>
                  )}
                </FilterContent>
              </ResultCard>
            );
          })()
        )}
        {filtros.tipo === 'renegociacao' && renegociacaoSelectedRow && (
          <RenegociacaoCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Formulário de Renegociação</h3>
                {isBulkRenegociacao && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                    Lote ({renegociacaoSelectedRows?.length || 0} docs)
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sp-btn sp-btn--secondary" onClick={() => { setRenegociacaoSelectedRow(null); setIsBulkRenegociacao(false); setRenegociacaoParcelas([]); setRenegociacaoSelectedRows([]); setPaginaSelecionados(0); }} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#f3f4f6', cursor: 'pointer', fontWeight: 600 }}>Limpar</button>
                <button className="sp-btn sp-btn--primary" onClick={handleSalvarRenegociacao} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Salvar Renegociação</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <ReadonlyField label="Código" value={renegociacaoForm.codigo} />
              {isBulkRenegociacao ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5 }}>Número *</span>
                  <input
                    type="text"
                    value={renegociacaoForm.numero}
                    onChange={async (e) => {
                      const v = onlyNumbers(e.target.value).slice(0, 20);
                      setRenegociacaoForm(p => ({ ...p, numero: v }));
                      setNumdupError('');
                      if (v.length >= 1) {
                        try {
                          const isReceber = renegociacaoForm.movimentacao === 'receber';
                          const codCli = Number(renegociacaoSelectedRows?.[0]?.codigo_cli || renegociacaoSelectedRows?.[0]?.codigo_for || 0);
                          const resp = await RelatoriosService.verificarNumdup(codCli, v, isReceber ? 'receber' : 'pagar');
                          if (resp?.existe) {
                            setNumdupError('Número já existe para este cliente.');
                          }
                        } catch { /* ignore check errors */ }
                      }
                    }}
                    placeholder="Novo número do documento"
                    style={{
                      padding: '6px 10px',
                      border: `2px solid ${numdupError ? '#ef4444' : '#e5e7eb'}`,
                      borderRadius: 6,
                      fontSize: 14,
                      outline: 'none',
                      width: '100%',
                      background: numdupError ? '#fff5f5' : '#fff',
                      color: '#1f2937',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { if (!numdupError) e.target.style.borderColor = '#3b82f6'; }}
                    onBlur={(e) => { if (!numdupError) e.target.style.borderColor = '#e5e7eb'; }}
                  />
                  {numdupError && <span style={{ fontSize: 12, color: '#ef4444' }}>{numdupError}</span>}
                </div>
              ) : (
                <ReadonlyField label="Número" value={renegociacaoForm.numero} />
              )}
              <ReadonlyField label="Documento" value={renegociacaoForm.documento} />
              <ReadonlyField label="Cliente" value={renegociacaoForm.cliente} />
              <ReadonlyField label="DPTO" value={renegociacaoForm.dpto} />
              <ReadonlyField label="Tipo Cobrança" value={renegociacaoForm.tipoCobranca} />
              <ReadonlyField label="Tipo Documento" value={renegociacaoForm.tipoDocumento} />
              <ReadonlyField label="Movimentação" value={renegociacaoForm.movimentacao === 'receber' ? 'A Receber' : 'A Pagar'} />
            </div>
            <Divider />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <EditableField
                label="Valor Renegociado"
                value={formatarMoeda(renegociacaoForm.valorRenegociado)}
                onChange={(e) => {
                  const masked = applyMaskMoneyInput(e);
                  const val = parseMaskMoney(masked);
                  setRenegociacaoForm(p => ({ ...p, valorRenegociado: val }));
                  setRenegociacaoParcelas([]);
                  e.target.value = masked;
                }}
              />
              <EditableField
                label="Desconto"
                value={formatarMoeda(renegociacaoForm.desconto)}
                onChange={(e) => {
                  const masked = applyMaskMoneyInput(e);
                  const val = parseMaskMoney(masked);
                  setRenegociacaoForm(p => ({ ...p, desconto: val }));
                  setRenegociacaoParcelas([]);
                  e.target.value = masked;
                }}
              />
              <EditableField
                label="Entrada"
                value={formatarMoeda(renegociacaoForm.entrada)}
                onChange={(e) => {
                  const masked = applyMaskMoneyInput(e);
                  const val = parseMaskMoney(masked);
                  setRenegociacaoForm(p => ({ ...p, entrada: val }));
                  setRenegociacaoParcelas([]);
                  e.target.value = masked;
                }}
              />
              <EditableField
                label="Parcelas"
                value={renegociacaoForm.parcelas > 0 ? String(renegociacaoForm.parcelas) : ''}
                onChange={(e) => {
                  const cleaned = onlyNumbers(e.target.value);
                  if (cleaned === '') {
                    setRenegociacaoForm(p => ({ ...p, parcelas: 0 }));
                    setRenegociacaoParcelas([]);
                    return;
                  }
                  const val = Math.max(1, Math.min(999, parseInt(cleaned, 10)));
                  setRenegociacaoForm(p => ({ ...p, parcelas: val }));
                  setRenegociacaoParcelas([]);
                }}
              />
              <EditableField
                label="Juros (%)"
                value={renegociacaoForm.juros > 0 ? String(renegociacaoForm.juros).replace('.', ',') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
                  const val = parseFloat(raw) || 0;
                  setRenegociacaoForm(p => ({ ...p, juros: Math.min(val, 100) }));
                  setRenegociacaoParcelas([]);
                }}
              />
              <EditableField
                label="Valor Parcelas"
                value={formatarMoeda(recalcularValorParcelas(renegociacaoForm))}
                readOnly
              />
              <EditableField
                label="Motivo"
                value={renegociacaoForm.motivo}
                onChange={(e) => setRenegociacaoForm(p => ({ ...p, motivo: e.target.value }))}
              />
              <EditableField
                label="Vencimento"
                value={renegociacaoForm.vencimento}
                onChange={(e) => {
                  const masked = applyMaskDate(e);
                  setRenegociacaoForm(p => ({ ...p, vencimento: masked }));
                  setRenegociacaoParcelas([]);
                  e.target.value = masked;
                }}
              />
              <EditableField
                label="Dia de Vencimento"
                value={renegociacaoForm.diaVencimento}
                onChange={(e) => {
                  const v = onlyNumbers(e.target.value).slice(0, 2);
                  const dia = parseInt(v, 10);
                  if (v !== '' && (dia < 1 || dia > 31)) return;
                  setRenegociacaoForm(p => ({ ...p, diaVencimento: v }));
                  setRenegociacaoParcelas([]);
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className="sp-btn sp-btn--primary" onClick={() => {
                const parcelas = gerarParcelas(renegociacaoForm);
                setRenegociacaoParcelas(parcelas);
              }} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Gerar Parcelas</button>
            </div>
            {renegociacaoParcelas.length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', height: Math.min(renegociacaoParcelas.length * 42 + 40, 300) }}>
                <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
                  <AgGridReact
                    rowData={renegociacaoParcelas.map((p, i) => ({ ...p, index: i + 1 }))}
                    columnDefs={[
                      { field: 'index', headerName: '#', width: 60, editable: false, cellStyle: { textAlign: 'center' } },
                      { field: 'valor', headerName: 'Valor', width: 160, editable: false, cellStyle: { textAlign: 'right' } },
                      {
                        field: 'data',
                        headerName: 'Data',
                        width: 140,
                        editable: true,
                        cellEditor: 'agTextCellEditor',
                        valueParser: (params: any) => {
                          const v = String(params.newValue || '').replace(/\D/g, '');
                          if (v.length !== 8) return params.oldValue;
                          return `${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4,8)}`;
                        }
                      }
                    ]}
                    defaultColDef={{ resizable: true, sortable: false, filter: false }}
                    domLayout="normal"
                    onCellValueChanged={(e) => {
                      if (e.colDef.field === 'data') {
                        const next = [...renegociacaoParcelasRef.current];
                        next[e.rowIndex] = { ...next[e.rowIndex], data: e.newValue };
                        setRenegociacaoParcelas(next);
                        renegociacaoParcelasRef.current = next;
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </RenegociacaoCard>
        )}
      </Content>
      {/* Modal de edição rápida do Caixa/Bancos (abrir CaixaBancosForm em overlay) */}
      {showCaixaPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '98%', maxWidth: 1386, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 12 }}>
            {/* Cabeçalho com Resumo dos Dados */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  {caixaPopupPayload && caixaPopupPayload._mode === 'incluir' ? 'Incluir Movimento de Caixa' : caixaPopupPayload && caixaPopupPayload._mode === 'editar' ? 'Editar Movimento de Caixa' : 'Movimento de Caixa'}
                </h3>
                {caixaPopupPayload && (
                  <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '16px' }}>
                    <span>📅 {caixaPopupPayload.dtmovi_cai ? formatarData(caixaPopupPayload.dtmovi_cai) : 'Data não definida'}</span>
                    <span>🏦 {caixaPopupPayload.tipocai_cai || 'Banco não definido'}</span>
                    <span>💰 {formatarMoeda(caixaPopupPayload.valor_cai || 0)}</span>
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowCaixaPopup(false);
                    setCaixaPopupPayload(null);
                    setCaixaPopupReadOnlyPrimary(true);
                  }}
                  title="Fechar"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#f3f4f6',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ✕ Fechar
                </button>
              </div>
            </div>
            <CaixaBancosForm
              initialPayload={caixaPopupPayload}
              readOnlyPrimary={caixaPopupReadOnlyPrimary}
              onClose={(refresh?: boolean) => {
                setShowCaixaPopup(false);
                setCaixaPopupPayload(null);
                setCaixaPopupReadOnlyPrimary(true);
                if (refresh) buscarConsultaCaixa();
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de registro de lançamento (reutiliza componente existente) */}
      <RegistrarLancamentoModal
        visible={showRegistrarModal}
        documentoIds={modalDocumentoIds}
        initialTipo={modalTipo}
        initialBanco={Object.keys(modalDocumentBanks).length > 0 ? Object.values(modalDocumentBanks)[0] : bancoSelecionado || '001'}
        initialOperacao={modalOperacao}
        initialValor={modalInitialValor}
        onClose={async (refresh?: boolean) => {
          setShowRegistrarModal(false);
          if (refresh && modalReloadKey) {
            try {
              const resp = await RelatoriosService.buscarDetalhesFluxoDia(modalReloadKey, filtros.soEmAberto);
              // normalizar: backend pode retornar { receber: [], pagar: [] } ou array
              let detalhesArray: any[] = [];
              if (Array.isArray(resp)) detalhesArray = resp;
              else if (resp && typeof resp === 'object') {
                const receber: any[] = resp.receber || [];
                const pagar: any[] = resp.pagar || [];
                const rNorm = receber.map(r => ({ ...r, __origem: 'receber' }));
                const pNorm = pagar.map(p => ({ ...p, __origem: 'pagar' }));
                detalhesArray = [...rNorm, ...pNorm];
                if (detalhesArray.length === 0 && Array.isArray(resp.titulos)) {
                  detalhesArray = resp.titulos;
                }
              }
              setDetalhesPorData(prev => ({ ...prev, [modalReloadKey]: detalhesArray }));
            } catch (e) {
              console.warn('Erro ao recarregar detalhes apos registro:', e);
            }
            setModalReloadKey(null);
          }
        }}
      />

      {showSimulacaoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 700, maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1f2937' }}>Simulação de Renegociação em Lote</h3>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowSimulacaoModal(false)} disabled={simulacaoProcessing}>✕ Fechar</button>
            </div>

            <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <span style={{ fontWeight: 600, color: '#166534' }}>
                {renegociacaoSelectedRows.length} registro(s) selecionado(s) do mesmo cliente — Valor total: {formatarMoeda(simulacaoForm.valorTotal)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Motivo *</label>
                <input type="text" className="form-control" value={simulacaoForm.motivo}
                  onChange={e => setSimulacaoForm(p => ({ ...p, motivo: e.target.value }))}
                  placeholder="Ex: Renegociação em lote" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Valor Total (R$)</label>
                <input type="text" className="form-control" value={formatarMoeda(simulacaoForm.valorTotal)} readOnly />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Entrada (R$)</label>
                <input type="text" className="form-control" value={simulacaoForm.entrada > 0 ? String(simulacaoForm.entrada) : ''}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '');
                    const num = v ? parseInt(v, 10) : 0;
                    setSimulacaoForm(p => ({ ...p, entrada: num }));
                  }}
                  placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Parcelas</label>
                <input type="number" className="form-control" min={1} max={999} value={simulacaoForm.parcelas}
                  onChange={e => setSimulacaoForm(p => ({ ...p, parcelas: parseInt(e.target.value, 10) || 1 }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Juros (%)</label>
                <input type="text" className="form-control" value={simulacaoForm.juros > 0 ? String(simulacaoForm.juros).replace('.', ',') : ''}
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
                    const num = parseFloat(v) || 0;
                    setSimulacaoForm(p => ({ ...p, juros: num }));
                  }}
                  placeholder="0" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Vencimento</label>
                <input type="text" className="form-control" value={simulacaoForm.vencimento}
                  onChange={e => {
                    const masked = applyMaskDate(e);
                    setSimulacaoForm(p => ({ ...p, vencimento: masked }));
                  }}
                  placeholder="dd/mm/aaaa" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Dia de Vencimento</label>
                <input type="text" className="form-control" value={simulacaoForm.diaVencimento}
                  onChange={e => {
                    const v = onlyNumbers(e.target.value).slice(0, 2);
                    const dia = parseInt(v, 10);
                    if (v !== '' && (dia < 1 || dia > 31)) return;
                    setSimulacaoForm(p => ({ ...p, diaVencimento: v }));
                  }}
                  placeholder="Ex: 15" />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => {
                  const parcelas = gerarParcelasSimulacao(simulacaoForm);
                  setSimulacaoParcelas(parcelas);
                }} style={{ width: '100%' }}>
                  Gerar Parcelas
                </button>
              </div>
            </div>

            {simulacaoParcelas.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', height: Math.min(simulacaoParcelas.length * 42 + 40, 250) }}>
                  <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
                    <AgGridReact
                      rowData={simulacaoParcelas.map((p, i) => ({ ...p, index: i + 1 }))}
                      columnDefs={[
                        { field: 'index', headerName: '#', width: 60, cellStyle: { textAlign: 'center' } },
                        { field: 'valor', headerName: 'Valor', width: 180, cellStyle: { textAlign: 'right' } },
                        { field: 'data', headerName: 'Data', width: 160 }
                      ]}
                      defaultColDef={{ resizable: true, sortable: false, filter: false }}
                      domLayout="normal"
                    />
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280', textAlign: 'right' }}>
                  Total parcelas: {formatarMoeda(simulacaoParcelas.reduce((s, p) => s + (parseFloat(p.valor.replace(/[R$\s.]/g, '').replace(',', '.')) || 0), 0))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowSimulacaoModal(false)} disabled={simulacaoProcessing}>Cancelar</button>
              <button className="btn btn-success" onClick={handleConfirmarSimulacao} disabled={simulacaoProcessing || simulacaoParcelas.length === 0}>
                {simulacaoProcessing ? 'Processando...' : 'Confirmar Renegociação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export { RelatoriosFinanceirosModule };













