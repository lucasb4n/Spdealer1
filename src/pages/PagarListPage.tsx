import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar,
  faPlus,
  faPencil,
  faBan,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { AgGridTable } from 'components/AgGridTable/AgGridTable';
import PagarFormModal from 'components/Modal/PagarFormModal';
import { formatarDocumento } from 'utils/formatters';
import { API_BASE_URL } from 'services/apiConfig';
import { RelatoriosService } from 'services/RelatoriosService';
import styled2 from 'styled-components';

// Container principal da página
const Container = styled.div`
  padding: 20px;
  width: 100%;
  height: 100%;
  background-color: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  color: #1f2937;
  margin: 0;

  svg {
    color: #dc2626;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #dc2626;
  color: white;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// ============= TIPOS =============
/**
 * Interface ContaPagar
 *
 * Chave composta: (codigo_pag, numdup_pag, parcela_pag)
 * Só será gerado um novo registro se essa chave não existir.
 * pagar_id é autoincremento para controle interno.
 *
 * Obrigatórios: pagar_id, codigo_pag, numdup_pag, parcela_pag
 * Demais campos opcionais.
 */
interface ContaPagar {
  pagar_id: number;
  codigo_pag: string;
  numdup_pag: string;
  parcela_pag: string;
  fornecedor_nome?: string;
  notaent_pag?: string;
  cgccpf_pag?: string;
  tpcob_pag?: string;
  banco_pag?: string;
  nomefan_bco?: string; // Nome do banco (via JOIN)
  dtemissi_pag?: string;
  dtmovi_pag?: string;
  dtvenci_pag?: string;
  dtpagi_pag?: string;
  obs_pag?: string;
  dpto_pag?: string;
  tipopessoa_pag?: string;
  vlrdup_pag?: number;
  vlrsal_pag?: number;
  status_pag?: string | null;
   numnf_pag?: string;
  tipodoc_pag?: string;
  nossonumero_pag?: string;
  vlrnf_pag?: number;
  codfor_pag?: string;
  codemp_pag?: string;
  codfil_pag?: string;
  codcc_pag?: string;
  codsubcc_pag?: string;
  codproj_pag?: string;
  codconta_pag?: string;
  codplano_pag?: string;
  codhistorico_pag?: string;
  historico_pag?: string;
  usuario_pag?: string;
  dtcad_pag?: string;
  dtalt_pag?: string;
  dtcancel_pag?: string;
  motivo_cancel_pag?: string;
  vlrdesc_pag?: number;
  vlracre_pag?: number;
  vlrpag_pag?: number;
  vlrir_pag?: number;
  vlrpis_pag?: number;
  vlrcsll_pag?: number;
  vlrcofins_pag?: number;
  vlriss_pag?: number;
  vlroutros_pag?: number;
  vlrretencao_pag?: number;
  vlrliq_pag?: number;
  vlrjuros_pag?: number;
  // Outros campos opcionais para compatibilidade máxima
  vlrinss_pag?: number;
  vlrdescob_pag?: number;
  vlrdev_pag?: number;
  condic_pag?: string;
  // Adicione aqui se necessário
}
const SearchInput = styled.input`
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;


const KPISection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const KPICard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #dc2626;

  &.danger {
    border-left-color: #ef4444;
  }

  &.success {
    border-left-color: #10b981;
  }

  &.warning {
    border-left-color: #f59e0b;
  }
`;

const KPILabel = styled.label`
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const KPIValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled2.button`
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  cursor: pointer;
  font-weight: 600;
  color: #dc2626;
  transition: all 0.15s ease;

  &:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.06); }
`;

const FilterSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const DateInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const DateLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  margin-right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const GridSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
`;

const FooterInfo = styled.div`
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  padding: 0 20px 20px;
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;
  animation: fadeIn 0.2s ease-in-out;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ConfirmContainer = styled.div`
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ConfirmHeader = styled.div`
  padding: 16px 20px;
  background-color: #fee2e2;
  border-bottom: 1px solid #fca5a5;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #991b1b;
`;

const ConfirmBody = styled.div`
  padding: 20px;
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
`;

const ConfirmCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
`;

const ConfirmFooter = styled.div`
  padding: 14px 20px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const BtnCancelModal = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f3f4f6; }
`;

const BtnConfirmModal = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #ef4444;
  color: white;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #dc2626; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// ============= COMPONENTE PRINCIPAL =============
const PagarListPage: React.FC = () => {
  // ============= ESTADOS =============
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [filteredContas, setFilteredContas] = useState<ContaPagar[]>([]);
  // baseFilteredContas: resultado após aplicar filtros de período/status (antes do quick search)
  const [baseFilteredContas, setBaseFilteredContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilterText, setQuickFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ABERTOS'); // Padrão: carregar ABERTOS
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  // Novo: campo para seleção do tipo de data
  const [dateField, setDateField] = useState<'dtemissi_pag' | 'dtmovi_pag' | 'dtpagi_pag' | 'dtvenci_pag'>('dtvenci_pag');

  // KPIs - Específicos para Contas a Pagar (A Vencer + Vencidos)
  const [kpis, setKpis] = useState({
    total: 0,
    vencidos: 0,       // Vencidos (independente do período)
    aVencer30: 0,      // A vencer em até 30 dias
    aVencer60: 0,      // A vencer em até 60 dias
    aVencer90: 0,      // A vencer em até 90 dias
    aVencer120: 0,     // A vencer em até 120 dias
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedConta, setSelectedConta] = useState<ContaPagar | null>(null);
  const [departamentos, setDepartamentos] = useState<Array<{ codigo: string; descricao: string }>>([]);
  const [tiposDocumento, setTiposDocumento] = useState<Array<{ codigo: string; descricao: string }>>([]);

  // Confirmation Modal
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [contaParaCancelar, setContaParaCancelar] = useState<ContaPagar | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // ============= LIFECYCLE =============
  useEffect(() => {
    loadContas();
    // carregar departamentos por filial (backend usa sessão)
    (async () => {
      try {
        const [deps, docs] = await Promise.all([
          RelatoriosService.buscarDepartamentos(),
          // para tipos de documento usados em Contas a Pagar
          fetch(`${API_BASE_URL}/masdocp`).then(r => r.json()).catch(() => []),
        ]);

        if (Array.isArray(deps)) {
          // Normalizar para { codigo, descricao }
          const normalized = deps.map((d: any) => ({ codigo: d.codigo_dep || d.codigo || (d.codigo_dep?.toString && d.codigo_dep.toString()) || '', descricao: d.descr_dep || d.descricao || '' }));
          setDepartamentos(normalized.filter((x: any) => x.codigo));
        }

        if (Array.isArray(docs)) {
          // Preferir explicitamente o campo `codigo_docp` quando existir
          const normDocs = docs.map((d: any) => ({ codigo: d.codigo_docp || d.codigo || d.codigo_doc || (d.codigo?.toString && d.codigo.toString()) || '', descricao: d.descr_docp || d.descricao || d.descr || d.descricao_doc || '' })).filter((x: any) => x.codigo);
          setTiposDocumento(normDocs);
        }
      } catch (err) {
        console.warn('Não foi possível carregar departamentos:', err);
        setDepartamentos([]);
      }
    })();
  }, []);

  // Forçar processamento/recarga do backend agora (botão 'Processar')
  const handleProcessar = async () => {
    setLoading(true);
    try {
      // Se o termo de busca for um número, assumimos que é um código de fornecedor
      const codigoNum = searchTerm && /^\d+$/.test(searchTerm.trim()) ? searchTerm.trim() : null;
      const qs = codigoNum ? `?codigoFornecedor=${codigoNum}` : '';
      const response = await fetch(`${API_BASE_URL}/pagar${qs}`);
      if (response.ok) {
        const data = await response.json();
        setContas(Array.isArray(data) ? data : []);
        // garante que filtros locais sejam reaplicados
        filterAndUpdateKpis();
      } else {
        console.error('Erro ao processar consulta no backend:', response.status);
      }
    } catch (err) {
      console.error('Erro no handleProcessar:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndUpdateKpis = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filtered = contas;
    
    console.log('[PagarListPage] Aplicando filtro:', statusFilter, 'Total registros:', contas.length);
    
    if (dataInicial && dataFinal && dateField) {
      const dtInicio = new Date(dataInicial);
      const dtFim = new Date(dataFinal);
      dtInicio.setHours(0, 0, 0, 0);
      dtFim.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => {
        const valorData = (c as any)[dateField];
        if (!valorData) return false;
        const data = new Date(valorData);
        return data >= dtInicio && data <= dtFim;
      });
    }
    
    if (statusFilter === 'VENCIDOS') {
      filtered = filtered.filter(c => {
        const vencimento = new Date(c.dtvenci_pag || '');
        const naoFoiPago = !c.dtpagi_pag || c.dtpagi_pag === '';
        const statusAberto = !c.status_pag || c.status_pag === '' || c.status_pag === null;
        const temSaldo = (c.vlrsal_pag || 0) > 0;
        return vencimento < today && naoFoiPago && statusAberto && temSaldo;
      });
    } else if (statusFilter === 'A_VENCER' || statusFilter === 'ABERTOS') {
      filtered = filtered.filter(c => {
        const vencimento = new Date(c.dtvenci_pag || '');
        const naoFoiPago = !c.dtpagi_pag || c.dtpagi_pag === '';
        const statusAberto = !c.status_pag || c.status_pag === '' || c.status_pag === null;
        const temSaldo = (c.vlrsal_pag || 0) > 0;
        return vencimento > today && naoFoiPago && statusAberto && temSaldo;
      });
    } else if (statusFilter === 'PAGO') {
      filtered = filtered.filter(c => c.dtpagi_pag && c.dtpagi_pag !== '');
    } else if (statusFilter === 'CANCELADO') {
      filtered = filtered.filter(c => c.status_pag === 'C');
    }

    filtered = filtered.filter(c => c.status_pag !== 'E');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        c =>
          (c.fornecedor_nome?.toLowerCase().includes(term) || false) ||
          (c.notaent_pag?.toLowerCase().includes(term) || false) ||
          c.codigo_pag.toLowerCase().includes(term)
      );
    }

    console.log('[PagarListPage] Registros após filtro:', filtered.length);
    // armazenar como base (antes do quick-search)
    setBaseFilteredContas(filtered);

    const total = contas.length;

    const contasVencidas = contas.filter(c => {
      const vencimento = new Date(c.dtvenci_pag || '');
      const naoFoiPago = !c.dtpagi_pag || c.dtpagi_pag === '';
      const statusAberto = !c.status_pag || c.status_pag === '' || c.status_pag === null;
      const temSaldo = (c.vlrsal_pag || 0) > 0;
      return vencimento < today && naoFoiPago && statusAberto && temSaldo;
    }).reduce((sum, c) => sum + (c.vlrsal_pag || 0), 0);

    const contasAVencer = contas.filter(c => {
      const vencimento = new Date(c.dtvenci_pag || '');
      const naoFoiPago = !c.dtpagi_pag || c.dtpagi_pag === '';
      const statusAberto = !c.status_pag || c.status_pag === '' || c.status_pag === null;
      const temSaldo = (c.vlrsal_pag || 0) > 0;
      return vencimento > today && naoFoiPago && statusAberto && temSaldo;
    });

    const aVencer30 = contasAVencer.filter(c => {
      const vencimento = new Date(c.dtvenci_pag || '');
      const diasAte = Math.floor((vencimento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diasAte >= 0 && diasAte <= 30;
    }).reduce((sum, c) => sum + (c.vlrsal_pag || 0), 0);

    const aVencer60 = contasAVencer.filter(c => {
      const vencimento = new Date(c.dtvenci_pag || '');
      const diasAte = Math.floor((vencimento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diasAte > 30 && diasAte <= 60;
    }).reduce((sum, c) => sum + (c.vlrsal_pag || 0), 0);

    const aVencer90 = contasAVencer.filter(c => {
      const vencimento = new Date(c.dtvenci_pag || '');
      const diasAte = Math.floor((vencimento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diasAte > 60 && diasAte <= 90;
    }).reduce((sum, c) => sum + (c.vlrsal_pag || 0), 0);

    const aVencer120 = contasAVencer.filter(c => {
      const vencimento = new Date(c.dtvenci_pag || '');
      const diasAte = Math.floor((vencimento.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diasAte > 90 && diasAte <= 120;
    }).reduce((sum, c) => sum + (c.vlrsal_pag || 0), 0);

    setKpis({
      total,
      vencidos: contasVencidas,
      aVencer30,
      aVencer60,
      aVencer90,
      aVencer120,
    });
  }, [contas, searchTerm, statusFilter, dataInicial, dataFinal, dateField]);

  useEffect(() => {
    filterAndUpdateKpis();
  }, [filterAndUpdateKpis]);

  // Aplicar quick filter APENAS ao re-renderizar com novo quickFilterText
  // NOTE: Removido filteredContas das dependências para evitar loop infinito
  useEffect(() => {
    const textLower = quickFilterText.toLowerCase();

    if (!quickFilterText || quickFilterText.trim() === '') {
      // Sem quick filter: mostrar o resultado base (após filtros de período/status)
      setFilteredContas(baseFilteredContas);
      return;
    }

    // Aplicar quick filter sobre o conjunto já filtrado por período/status
    const quickFiltered = baseFilteredContas.filter(conta => {
      return (
        (conta.numdup_pag?.toString().toLowerCase().includes(textLower)) ||
        (conta.parcela_pag?.toString().toLowerCase().includes(textLower)) ||
        (conta.cgccpf_pag?.toString().toLowerCase().includes(textLower)) ||
        (conta.fornecedor_nome?.toLowerCase().includes(textLower)) ||
        (conta.codigo_pag?.toString().toLowerCase().includes(textLower)) ||
        (conta.tpcob_pag?.toLowerCase().includes(textLower)) ||
        (conta.banco_pag?.toLowerCase().includes(textLower)) ||
        (conta.dtvenci_pag?.toString().includes(quickFilterText)) ||
        (conta.dtpagi_pag?.toString().includes(quickFilterText)) ||
        (conta.obs_pag?.toLowerCase().includes(textLower)) ||
        (conta.notaent_pag?.toString().toLowerCase().includes(textLower))
      );
    });

    console.log('[PagarListPage] Quick filter aplicado:', quickFilterText, 'Resultados:', quickFiltered.length);
    setFilteredContas(quickFiltered);
  }, [quickFilterText, baseFilteredContas]);

  // Referências intencionais para evitar warnings de variáveis atribuídas e não usadas
  void loading;
  void setSearchTerm;


  // ============= CARREGAR DADOS =============
  const loadContas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/pagar`);
      if (response.ok) {
        const data = await response.json();
        setContas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
      setContas([]);
    } finally {
      setLoading(false);
    }
  };

  // filterAndUpdateKpis already defined above

  // ============= CALCULAR TOTAIS PARA RODAPÉ =============
  const pinnedBottomRowData = React.useMemo(() => {
    if (filteredContas.length === 0) return [];
    
    const totalVlrDup = filteredContas.reduce((sum, c) => sum + (Number(c.vlrdup_pag) || 0), 0);
    const totalVlrSal = filteredContas.reduce((sum, c) => sum + (Number(c.vlrsal_pag) || 0), 0);
    
    return [{
      dtemissi_pag: '',
      numdup_pag: '',
      notaent_pag: 'TOTAIS:',
      parcela_pag: '',
      cgccpf_pag: '',
      fornecedor_nome: '',
      tpcob_pag: '',
      dtmovi_pag: '',
      dtvenci_pag: '',
      dtpagi_pag: '',
      vlrdup_pag: totalVlrDup,
      vlrsal_pag: totalVlrSal,
      status_pag: '',
    }];
  }, [filteredContas]);

  // ============= FORMATADORES =============
  const formatarMoeda = (valor: number | null | undefined): string => {
    if (valor == null || isNaN(Number(valor))) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(valor));
  };

  const formatarData = (data: string | null | undefined): string => {
    if (!data || typeof data !== 'string') return '-';
    const [year, month, day] = data.split('-');
    return `${day}/${month}/${year}`;
  };


  // Lógica de status igual Contas a Receber, adaptando para _pag
  const getStatusColor = (status: string): string => {
    switch (status) {
      case '✗ Cancelados':
        return '#ef4444';
      case '✓ Pagos':
        return '#6b7280';
      case '⏰ Vencidos':
        return '#dc2626';
      case '⏰ Atrasados':
        return '#dc2626';
      case '📅 Abertos':
        return '#3b82f6';
      default:
        return '#3b82f6';
    }
  };

  const getStatusLabel = (conta: any): string => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.dtvenci_pag || '');
    vencimento.setHours(0, 0, 0, 0);

    const foiPago = conta.dtpagi_pag && conta.dtpagi_pag !== '';
    const statusCancelado = conta.status_pag === 'C';
    const statusExcluido = conta.status_pag === 'E';
    const statusVazio = !conta.status_pag || conta.status_pag === '';

    // Nunca listar excluídos (E)
    if (statusExcluido) {
      return '';
    }

    // Cancelado (✗)
    if (statusCancelado) {
      return '✗ Cancelados';
    }

    // Pago (✓)
    if (foiPago) {
      return '✓ Pagos';
    }

    // Vencidos (⏰) - vencimento < hoje E não pago E status vazio/nulo
    if (vencimento < hoje && !foiPago && statusVazio) {
      return '⏰ Vencidos';
    }

    // Abertos (📅) - vencimento >= hoje E não pago E status vazio/nulo
    if (vencimento >= hoje && !foiPago && statusVazio) {
      return '📅 Abertos';
    }

    return '📅 Abertos';
  };

  // ============= HANDLERS - MODAL =============

  const handleNewConta = () => {
    setModalMode('create');
    setSelectedConta(null);
    setIsModalOpen(true);
  };

  const handleEditConta = (conta: ContaPagar) => {
    setModalMode('edit');
    setSelectedConta(conta);
    setIsModalOpen(true);
  };

  const handleCancelarConta = (conta: ContaPagar) => {
    setContaParaCancelar(conta);
    setShowConfirmCancelModal(true);
  };

  const confirmarCancelamento = async () => {
    if (!contaParaCancelar) return;
    setIsCanceling(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/pagar/${contaParaCancelar.pagar_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...contaParaCancelar,
            status_pag: 'C',
          }),
        }
      );
      if (response.ok) {
        setShowConfirmCancelModal(false);
        setContaParaCancelar(null);
        loadContas();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.mensagem || 'Erro ao cancelar conta');
      }
    } catch (error) {
      console.error('Erro ao cancelar conta:', error);
      alert('Erro ao cancelar conta');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConta(null);
  };

  // ============= UPDATE DEPARTAMENTO (EDITÁVEL NA GRID) =============
  const handleUpdateDepartamento = async (conta: ContaPagar, novoDpto: string) => {
    if (novoDpto === conta.dpto_pag) {
      return; // Nenhuma mudança
    }
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/pagar/${conta.pagar_id}/departamento`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dpto_pag: novoDpto }),
        }
      );
      
      if (response.ok) {
        console.log(`✅ Departamento atualizado: ${conta.dpto_pag} → ${novoDpto}`);
        loadContas(); // Recarregar dados
      } else {
        console.error('Erro ao atualizar departamento');
        alert('Erro ao atualizar departamento');
      }
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      alert('Erro ao atualizar departamento');
    }
  };

  // ============= UPDATE TIPO DOCUMENTO (EDITÁVEL NA GRID) =============
  const handleUpdateTipoDocumento = async (conta: ContaPagar, novoTipoDoc: string) => {
    if (novoTipoDoc === conta.tipodoc_pag) {
      return; // Nenhuma mudança
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/pagar/${conta.pagar_id}/tipodoc`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipodoc_pag: novoTipoDoc }),
        }
      );

      if (response.ok) {
        console.log(`✅ Tipo documento atualizado: ${conta.tipodoc_pag} → ${novoTipoDoc}`);
        loadContas(); // Recarregar dados
      } else {
        console.error('Erro ao atualizar tipo de documento');
        alert('Erro ao atualizar tipo de documento');
      }
    } catch (error) {
      console.error('Erro ao atualizar tipo de documento:', error);
      alert('Erro ao atualizar tipo de documento');
    }
  };

  const handleSaveConta = async (contaData: Partial<ContaPagar>) => {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url =
        modalMode === 'create'
          ? `${API_BASE_URL}/pagar`
          : `${API_BASE_URL}/pagar/${selectedConta?.pagar_id}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contaData),
      });

      if (response.ok) {
        loadContas();
        handleCloseModal();
        alert(
          modalMode === 'create'
            ? 'Conta criada com sucesso!'
            : 'Conta atualizada com sucesso!'
        );
      }
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      alert('Erro ao salvar conta');
    }
  };

  // ============= COLUNAS AG-GRID =============
  const columnDefs = React.useMemo(() => [
    // 1) Documento (primeira coluna) - ligada a pagar.notaent_pag
    {
      field: 'notaent_pag',
      headerName: 'Documento',
      width: 180,
      pinned: 'left',
      cellRenderer: (params: any) => {
        if (params.value === 'TOTAIS:') {
          return <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{params.value}</span>;
        }
        return params.value;
      },
    },
    // 2) Autorizado (editável) - antes da Emissão
    {
      field: 'ap_pag',
      headerName: 'Autorizado',
      width: 110,
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: ['Sim', 'Não'],
      },
      cellRenderer: (params: any) => {
        if (params.data?.notaent_pag === 'TOTAIS:') return '';
        return params.value === 'S' || params.value === 'Sim' ? 'Sim' : 'Não';
      },
      onCellEditingStopped: async (params: any) => {
        try {
          const newVal = params.newValue;
          const oldVal = params.oldValue === 'S' ? 'Sim' : (params.oldValue === 'N' ? 'Não' : params.oldValue);
          if (newVal === oldVal) return;
          const ap = newVal === 'Sim' ? 'S' : 'N';
          const resp = await fetch(`${API_BASE_URL}/pagar/${params.data.pagar_id}/autorizacao`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ap_pag: ap }),
          });
          if (resp.ok) {
            loadContas();
          } else {
            console.error('Erro ao atualizar autorizacao');
            alert('Erro ao atualizar autorização');
            loadContas();
          }
        } catch (e) {
          console.error('Erro ao atualizar autorizacao:', e);
          alert('Erro ao atualizar autorização');
          loadContas();
        }
      }
    },
    {
      field: 'dtemissi_pag',
      headerName: 'Emissão',
      width: 110,
      valueFormatter: (params: any) => {
        // Oculta na linha de totais
        if (params.data?.notaent_pag === 'TOTAIS:') return '';
        return formatarData(params.value);
      },
    },
    {
      field: 'numdup_pag',
      headerName: 'Duplicata',
      width: 120,
      cellRenderer: (params: any) => {
        if (params.data?.notaent_pag === 'TOTAIS:') {
          return <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{params.value}</span>;
        }
        return params.value;
      },
    },
    { field: 'parcela_pag', headerName: 'Parcela', width: 80, cellRenderer: (params: any) => params.data?.notaent_pag === 'TOTAIS:' ? '' : params.value },
    {
      field: 'cgccpf_pag',
      headerName: 'CPF/CNPJ',
      width: 150,
      valueFormatter: (params: any) => {
        if (params.data?.notaent_pag === 'TOTAIS:') return '';
        const tipo = params.data?.tipopessoa_pag === 'J' ? 'J' : undefined;
        return formatarDocumento(params.value, tipo as any);
      }
    },
    {
      field: 'fornecedor_nome',
      headerName: 'Fornecedor',
      width: 200,
      filter: true,
      cellRenderer: (params: any) => params.data?.notaent_pag === 'TOTAIS:' ? '' : params.value,
    },
    {
      field: 'tpcob_pag',
      headerName: 'Tipo de Cobrança',
      width: 150,
      filter: true,
      cellRenderer: (params: any) => params.data?.notaent_pag === 'TOTAIS:' ? '' : params.value,
    },
    {
      field: 'nomefan_bco',
      headerName: 'Banco',
      width: 140,
    },
    {
      field: 'dpto_pag',
      headerName: 'Departamento',
      width: 140,
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: departamentos && departamentos.length > 0 ? departamentos.map(d => d.codigo) : [
          '001','002','003','004','005','006','007','008','009','010'
        ],
      },
      cellRenderer: (params: any) => {
        if (params.data?.notaent_pag === 'TOTAIS:') return '';
        const code = params.value;
        const found = departamentos.find((d: any) => d.codigo === code);
        return found ? found.descricao : code;
      },
      onCellEditingStopped: (params: any) => {
        if (params.newValue && params.newValue !== params.oldValue) {
          handleUpdateDepartamento(params.data, params.newValue);
        }
      },
    },
    {
      field: 'tipodoc_pag',
      headerName: 'Tipo Documento',
      width: 180,
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: tiposDocumento && tiposDocumento.length > 0 ? tiposDocumento.map(t => t.codigo) : [''],
      },
      valueGetter: (params: any) => {
        // Garantir que o valor passado ao editor seja o CÓDIGO.
        const raw = params.data?.tipodoc_pag;
        if (!raw && raw !== 0) return '';
        const found = tiposDocumento.find((t: any) => String(t.codigo) === String(raw) || String(t.descricao) === String(raw));
        return found ? found.codigo : raw;
      },
      cellRenderer: (params: any) => {
        if (params.data?.notaent_pag === 'TOTAIS:') return '';
        const code = params.value;
        const found = tiposDocumento.find((t: any) => String(t.codigo) === String(code));
        return found ? found.descricao : code;
      },
      onCellEditingStopped: (params: any) => {
        if (params.newValue && params.newValue !== params.oldValue) {
          handleUpdateTipoDocumento(params.data, params.newValue);
        }
      },
    },
    {
      field: 'dtmovi_pag',
      headerName: 'Entrada',
      width: 110,
      valueFormatter: (params: any) => params.data?.notaent_pag === 'TOTAIS:' ? '' : formatarData(params.value),
    },
    {
      field: 'dtvenci_pag',
      headerName: 'Vencimento',
      width: 120,
      valueFormatter: (params: any) => params.data?.notaent_pag === 'TOTAIS:' ? '' : formatarData(params.value),
    },
    {
      field: 'dtpagi_pag',
      headerName: 'Pago',
      width: 110,
      valueFormatter: (params: any) => params.data?.notaent_pag === 'TOTAIS:' ? '' : formatarData(params.value),
    },
    {
      field: 'vlrdup_pag',
      headerName: 'Valor Original',
      width: 140,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      valueGetter: (params: any) => Number(params.data?.vlrdup_pag) || 0,
      cellStyle: { textAlign: 'right' },
      aggFunc: 'sum',
      enableValue: true,
    },
    {
      field: 'vlrsal_pag',
      headerName: 'Saldo',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      valueGetter: (params: any) => Number(params.data?.vlrsal_pag) || 0,
      cellStyle: { textAlign: 'right' },
      aggFunc: 'sum',
      enableValue: true,
    },
    {
      field: 'status_pag',
      headerName: 'Status',
      width: 100,
      cellRenderer: (params: any) => {
        if (params.data?.notaent_pag === 'TOTAIS:') return null;
        const label = getStatusLabel(params.data);
        if (!label) return null;
        return (
          <span
            style={{
              color: getStatusColor(label),
              fontWeight: 600,
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 100,
      pinned: 'right',
      sortable: false,
      cellRenderer: (params: any) => {
        if (params.data?.notaent_pag === 'TOTAIS:') return null;
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '100%' }}>
            <button
              onClick={() => handleEditConta(params.data)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#dc2626',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Editar"
            >
              <FontAwesomeIcon icon={faPencil} />
            </button>
            <button
              onClick={() => handleCancelarConta(params.data)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#ef4444',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Cancelar"
            >
              <FontAwesomeIcon icon={faBan} />
            </button>
          </div>
        );
      },
    },
  ], [departamentos, tiposDocumento, handleCancelarConta, handleUpdateDepartamento, handleUpdateTipoDocumento]);

  // ============= RENDER =============
  return (
    <Container>

      {/* HEADER */}
      <Header>
        <Title>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          Contas a Pagar
        </Title>
        <HeaderActions>
          <Button onClick={handleNewConta}>
            <FontAwesomeIcon icon={faPlus} />
            Nova Conta
          </Button>
        </HeaderActions>
      </Header>

      {/* KPI CARDS - VENCIDOS + A VENCER */}
      <KPISection>
        <KPICard className="danger" style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #dc2626' }}>
          <KPILabel style={{ color: '#991b1b', fontWeight: 'bold' }}>🔴 VENCIDOS</KPILabel>
          <KPIValue style={{ color: '#dc2626', fontSize: '20px' }}>{formatarMoeda(kpis.vencidos)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>A Vencer +30 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.aVencer30)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>A Vencer +60 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.aVencer60)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>A Vencer +90 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.aVencer90)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>A Vencer +120 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.aVencer120)}</KPIValue>
        </KPICard>
      </KPISection>


      {/* FILTRO */}
      <FilterSection>
        <DateLabel>
          Período:
          <DateInput
            type="date"
            value={dataInicial}
            onChange={e => setDataInicial(e.target.value)}
            placeholder="Data Inicial"
          />
        </DateLabel>
        <DateLabel>
          até
          <DateInput
            type="date"
            value={dataFinal}
            onChange={e => setDataFinal(e.target.value)}
            placeholder="Data Final"
          />
        </DateLabel>
        {/* Novo: Seletor de campo de data */}
        <FilterSelect
          value={dateField}
          onChange={e => setDateField(e.target.value as any)}
          style={{ minWidth: 140 }}
        >
          <option value="dtemissi_pag">Emissão</option>
          <option value="dtmovi_pag">Movimento</option>
          <option value="dtvenci_pag">Vencimento</option>
          <option value="dtpagi_pag">Pagamento</option>
        </FilterSelect>
        <FilterSelect
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="TODOS">Todos</option>
          <option value="VENCIDOS">🔴 Vencidos</option>
          <option value="A_VENCER">⏰ A Vencer</option>
          <option value="PAGO">✓ Pagos</option>
          <option value="CANCELADO">✗ Cancelados</option>
        </FilterSelect>
        <SearchInput
          type="text"
          placeholder="Buscar por qualquer campo..."
          value={quickFilterText}
          onChange={e => setQuickFilterText(e.target.value)}
        />
        <ActionButton onClick={handleProcessar} title="Processar consulta no servidor">
          {loading ? 'Processando...' : 'Processar'}
        </ActionButton>
      </FilterSection>

      {/* GRID */}
      <GridSection>
        <AgGridTable
          columnDefs={columnDefs}
          rowData={filteredContas}
          quickFilterText={quickFilterText}
          pinnedBottomRowData={pinnedBottomRowData}
        />
      </GridSection>

      <FooterInfo>
        Total: {filteredContas.length} registro(s)
      </FooterInfo>

      {/* MODAL EDIT / CREATE */}
      {isModalOpen && (
        <PagarFormModal
          mode={modalMode}
          conta={selectedConta}
          onClose={handleCloseModal}
          onSave={handleSaveConta}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {showConfirmCancelModal && contaParaCancelar && (
        <ConfirmOverlay onClick={() => setShowConfirmCancelModal(false)}>
          <ConfirmContainer onClick={e => e.stopPropagation()}>
            <ConfirmHeader>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626' }} />
              Confirmar Cancelamento
            </ConfirmHeader>
            <ConfirmBody>
              <p style={{ margin: 0 }}>Tem certeza que deseja cancelar esta conta a pagar?</p>
              <ConfirmCard>
                <div><strong>Documento:</strong> {contaParaCancelar.notaent_pag || contaParaCancelar.numdup_pag || contaParaCancelar.pagar_id}</div>
                <div><strong>Fornecedor:</strong> {contaParaCancelar.fornecedor_nome || contaParaCancelar.codigo_pag}</div>
                <div><strong>Valor Saldo:</strong> {formatarMoeda(contaParaCancelar.vlrsal_pag ?? contaParaCancelar.vlrdup_pag)}</div>
              </ConfirmCard>
            </ConfirmBody>
            <ConfirmFooter>
              <BtnCancelModal onClick={() => setShowConfirmCancelModal(false)}>
                Voltar
              </BtnCancelModal>
              <BtnConfirmModal onClick={confirmarCancelamento} disabled={isCanceling}>
                {isCanceling ? 'Cancelando...' : 'Sim, Cancelar Conta'}
              </BtnConfirmModal>
            </ConfirmFooter>
          </ConfirmContainer>
        </ConfirmOverlay>
      )}
    </Container>
  );
};

export default PagarListPage;













