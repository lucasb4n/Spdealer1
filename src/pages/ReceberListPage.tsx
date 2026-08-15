import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoiceDollar,
  faPlus,
  faPencil,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import { AgGridTable } from 'components/AgGridTable/AgGridTable';
import ReceberFormModal from 'components/Modal/ReceberFormModal';
import ClienteAnaliseFinanceiraModal from 'components/Modal/ClienteAnaliseFinanceiraModal';
import { formatarDocumento } from 'utils/formatters';
import { parseDateLocal } from 'utils/dateUtils';
import { API_BASE_URL } from 'services/apiConfig';

// ============= TIPOS =============
interface ContaReceber {
  id?: number;
  codigo_rec: string;
  numdup_rec: string;
  parcela_rec: string;
  tipodoc_rec: string;
  tpcob_rec: string;
  dpto_rec: string;
  cgccpf_rec: string;
  dtmovi_rec: string;
  dtemissi_rec: string;
  dtvenci_rec: string;
  dtpagi_rec: string;
  banco_rec: string;
  codigo_bol?: string; // Código do boleto
  nomefan_bco?: string; // Nome do banco (via JOIN receber.banco_rec = bancos.codigo_bco)
  nossonumero_rec: string;
  vlrdup_rec: number;
  vlrdesc_rec: number;
  vlracre_rec: number;
  vlrmulta_rec: number;
  vlrpag_rec: number;
  vlrsal_rec: number;
  vlrir_rec: number;
  vlriss_rec: number;
  vlrpis_rec: number;
  vlrcofins_rec: number;
  vlrcsll_rec: number;
  vlrinss_rec: number;
  vlrdescob_rec: number;
  vlrdev_rec: number;
  obs_rec: string;
  condic_rec: string;
  status_rec: string;
  cliente_nome?: string;
  nivel_cliente?: string; // Diamante, Ouro, Prata, Bronze
  codigo_banco?: string; // Campo para obter o código do banco
}

// ============= STYLED COMPONENTS =============
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
  margin-bottom: 25px;
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
    color: #3b82f6;
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

const SearchInput = styled.input`
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
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
  transition: all 0.2s ease;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover:not(:disabled) { background: #2563eb; }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover:not(:disabled) { background: #059669; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover:not(:disabled) { background: #e5e7eb; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
  border-left: 4px solid #3b82f6;

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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

// ============= COMPONENTE PRINCIPAL =============
const ReceberListPage: React.FC = () => {
  // ============= ESTADOS =============
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [filteredContas, setFilteredContas] = useState<ContaReceber[]>([]);
  // baseFilteredContas armazena o resultado do filtro por status/data (sem quick filter)
  const [baseFilteredContas, setBaseFilteredContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ABERTOS'); // Padrão: carregar ABERTOS
  const [quickFilterText, setQuickFilterText] = useState('');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [niveisClientes, setNiveisClientes] = useState<Map<string, string>>(new Map());
  const [tendenciasClientes, setTendenciasClientes] = useState<Map<string, string>>(new Map());

  // KPIs - Específicos para Contas a Receber (Atrasados)
  const [kpis, setKpis] = useState({
    total: 0,
    totalAtrasados: 0, // Total em R$ de todas as contas atrasadas
    atrasados30: 0,    // Atrasados mais de 30 dias
    atrasados60: 0,    // Atrasados mais de 60 dias
    atrasados90: 0,    // Atrasados mais de 90 dias
    atrasados120: 0,   // Atrasados mais de 120 dias
  });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedConta, setSelectedConta] = useState<ContaReceber | null>(null);
  
  // Modal de Análise Financeira
  const [isAnaliseModalOpen, setIsAnaliseModalOpen] = useState(false);
  const [selectedCodigoCliente, setSelectedCodigoCliente] = useState('');

  // ============= CARREGAR DADOS =============
  const loadContas = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/receber`);
      if (response.ok) {
        const data = await response.json();
        setContas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      setContas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNiveisClientes = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/receber/niveis-clientes`);
      if (resp.ok) {
        const data = await resp.json();
        const mapN = new Map<string, string>();
        const mapT = new Map<string, string>();
        (data || []).forEach((item: any) => {
          if (item && item.codigo_cli) {
            mapN.set(item.codigo_cli, item.nivel || 'Bronze');
            mapT.set(item.codigo_cli, item.tendencia || 'estavel');
          }
        });
        setNiveisClientes(mapN);
        setTendenciasClientes(mapT);
      }
    } catch (err) {
      console.error('Erro ao carregar niveis de clientes:', err);
    }
  };

  // ============= LIFECYCLE =============
  useEffect(() => {
    loadContas();
    loadNiveisClientes();
  }, []);

  // Botão Processar: força recarregar dados do backend (opcionalmente por código cliente se o quickFilterText for numérico)
  const handleProcessarReceber = async () => {
    setLoading(true);
    try {
      const codigoNum = quickFilterText && /^\d+$/.test(quickFilterText.trim()) ? quickFilterText.trim() : null;
      const qs = codigoNum ? `?codigoCliente=${codigoNum}` : '';
      const response = await fetch(`${API_BASE_URL}/receber${qs}`);
      if (response.ok) {
        const data = await response.json();
        setContas(Array.isArray(data) ? data : []);
        // reaplica filtros locais
        filterAndUpdateKpis();
      } else {
        console.error('Erro ao processar consulta receber:', response.status);
      }
    } catch (err) {
      console.error('Erro no handleProcessarReceber:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndUpdateKpis = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filtered = contas;

    console.log('[ReceberListPage] Aplicando filtro:', statusFilter, 'Total registros:', contas.length);

    if (dataInicial && dataFinal) {
      const dtInicio = parseDateLocal(dataInicial) || new Date(dataInicial);
      const dtFim = parseDateLocal(dataFinal) || new Date(dataFinal);
      dtInicio.setHours(0, 0, 0, 0);
      dtFim.setHours(23, 59, 59, 999);

      filtered = filtered.filter(c => {
        if (statusFilter === 'PAGO') {
          if (!c.dtpagi_rec) return false;
          const dtPagamento = parseDateLocal(c.dtpagi_rec);
          if (!dtPagamento) return false;
          return dtPagamento >= dtInicio && dtPagamento <= dtFim;
        }
        const dtVencimento = parseDateLocal(c.dtvenci_rec);
        if (!dtVencimento) return false;
        return dtVencimento >= dtInicio && dtVencimento <= dtFim;
      });
    }

    if (statusFilter === 'VENCIDOS') {
      filtered = filtered.filter(c => {
        const vencimento = parseDateLocal(c.dtvenci_rec);
        if (!vencimento) return false;
        vencimento.setHours(0, 0, 0, 0);
        const naoFoiPago = !c.dtpagi_rec || c.dtpagi_rec === '';
        const statusAberto = !c.status_rec || c.status_rec === '';
        const temSaldo = (c.vlrsal_rec || 0) > 0;
        return vencimento < today && naoFoiPago && statusAberto && temSaldo;
      });
    } else if (statusFilter === 'ABERTOS') {
      filtered = filtered.filter(c => {
        const vencimento = parseDateLocal(c.dtvenci_rec);
        if (!vencimento) return false;
        vencimento.setHours(0, 0, 0, 0);
        const naoFoiPago = !c.dtpagi_rec || c.dtpagi_rec === '';
        const statusAberto = !c.status_rec || c.status_rec === '';
        const temSaldo = (c.vlrsal_rec || 0) > 0;
        return vencimento >= today && naoFoiPago && statusAberto && temSaldo;
      });
    } else if (statusFilter === 'PAGO') {
      filtered = filtered.filter(c => c.dtpagi_rec && c.dtpagi_rec !== '');
    } else if (statusFilter === 'CANCELADO') {
      filtered = filtered.filter(c => c.status_rec === 'C');
    }

    filtered = filtered.filter(c => c.status_rec !== 'E');

    console.log('[ReceberListPage] Registros após filtro:', filtered.length);
    // Atualiza o conjunto base (resultado dos filtros de status/data)
    setBaseFilteredContas(filtered);

    const total = contas.length;

    const contasAtrasadas = contas.filter(c => {
      const vencimento = parseDateLocal(c.dtvenci_rec);
      if (!vencimento) return false;
      const naoFoiPago = !c.dtpagi_rec || c.dtpagi_rec === '';
      const statusAberto = !c.status_rec || c.status_rec === '';
      const temSaldo = (c.vlrsal_rec || 0) > 0;

      return vencimento < today && naoFoiPago && statusAberto && temSaldo;
    });

    const atrasados30 = contasAtrasadas.filter(c => {
      const vencimento = parseDateLocal(c.dtvenci_rec);
      if (!vencimento) return false;
      const diasAtraso = Math.floor((today.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      return diasAtraso >= 30 && diasAtraso < 60;
    }).reduce((sum, c) => sum + (c.vlrsal_rec || 0), 0);

    const atrasados60 = contasAtrasadas.filter(c => {
      const vencimento = parseDateLocal(c.dtvenci_rec);
      if (!vencimento) return false;
      const diasAtraso = Math.floor((today.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      return diasAtraso >= 60 && diasAtraso < 90;
    }).reduce((sum, c) => sum + (c.vlrsal_rec || 0), 0);

    const atrasados90 = contasAtrasadas.filter(c => {
      const vencimento = parseDateLocal(c.dtvenci_rec);
      if (!vencimento) return false;
      const diasAtraso = Math.floor((today.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      return diasAtraso >= 90 && diasAtraso < 120;
    }).reduce((sum, c) => sum + (c.vlrsal_rec || 0), 0);

    const atrasados120 = contasAtrasadas.filter(c => {
      const vencimento = parseDateLocal(c.dtvenci_rec);
      if (!vencimento) return false;
      const diasAtraso = Math.floor((today.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      return diasAtraso >= 120;
    }).reduce((sum, c) => sum + (c.vlrsal_rec || 0), 0);

    const totalAtrasados = atrasados30 + atrasados60 + atrasados90 + atrasados120;

    setKpis({
      total,
      totalAtrasados,
      atrasados30,
      atrasados60,
      atrasados90,
      atrasados120,
    });
  }, [contas, statusFilter, dataInicial, dataFinal]);

  useEffect(() => {
    // Recalcula filtros e KPIs quando as dependências do callback mudam.
    filterAndUpdateKpis();
  }, [filterAndUpdateKpis]);

  // Aplicar quick filter APENAS ao re-renderizar com novo quickFilterText
  // NOTE: Removido filteredContas das dependências para evitar loop infinito
  useEffect(() => {
    const textLower = quickFilterText.toLowerCase();

    if (!quickFilterText || quickFilterText.trim() === '') {
      // Sem quick filter: exibir os resultados base já calculados
      setFilteredContas(baseFilteredContas);
      return;
    }

    // Aplicar filtro de texto aos dados que já têm status/data aplicado (baseFilteredContas)
    const quickFiltered = baseFilteredContas.filter(conta => {
      return (
        (conta.numdup_rec?.toString().toLowerCase().includes(textLower)) ||
        (conta.parcela_rec?.toString().toLowerCase().includes(textLower)) ||
        (conta.cgccpf_rec?.toString().toLowerCase().includes(textLower)) ||
        (conta.cliente_nome?.toLowerCase().includes(textLower)) ||
        (conta.codigo_rec?.toString().toLowerCase().includes(textLower)) ||
        (conta.tpcob_rec?.toLowerCase().includes(textLower)) ||
        (conta.banco_rec?.toLowerCase().includes(textLower)) ||
        (conta.dtvenci_rec?.toString().includes(quickFilterText)) ||
        (conta.dtpagi_rec?.toString().includes(quickFilterText)) ||
        (conta.obs_rec?.toLowerCase().includes(textLower))
      );
    });
    
    console.log('[ReceberListPage] Quick filter aplicado:', quickFilterText, 'Resultados:', quickFiltered.length);
    setFilteredContas(quickFiltered);
  }, [quickFilterText, baseFilteredContas]);

  // Referência intencional para evitar warning de variável atribuída e não usada
  void loading;


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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case '⏰ Atrasados':
        return '#ef4444';
      case '📅 Abertos':
        return '#3b82f6';
      case '✓ Pagos':
        return '#10b981';
      case '✗ Cancelados':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  const getStatusLabel = (conta: ContaReceber): string => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(conta.dtvenci_rec);
    vencimento.setHours(0, 0, 0, 0);
    
    const foiPago = conta.dtpagi_rec && conta.dtpagi_rec !== '';
    const statusCancelado = conta.status_rec === 'C';
    const statusExcluido = conta.status_rec === 'E';
    const statusVazio = !conta.status_rec || conta.status_rec === '';
    
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
    
    // Atrasados (⏰) - vencimento < hoje E não pago E status vazio/nulo
    if (vencimento < hoje && !foiPago && statusVazio) {
      return '⏰ Atrasados';
    }
    
    // Abertos (📅) - vencimento >= hoje E não pago E status vazio/nulo
    if (vencimento >= hoje && !foiPago && statusVazio) {
      return '📅 Abertos';
    }
    
    return '📅 Abertos';
  };

  // ============= CALCULAR TOTAIS PARA RODAPÉ =============
  const pinnedBottomRowData = React.useMemo(() => {
    if (filteredContas.length === 0) return [];
    
    const totalVlrDup = filteredContas.reduce((sum, c) => sum + (Number(c.vlrdup_rec) || 0), 0);
    const totalVlrSal = filteredContas.reduce((sum, c) => sum + (Number(c.vlrsal_rec) || 0), 0);
    
    return [{
      numdup_rec: 'TOTAIS:',
      parcela_rec: '',
      cgccpf_rec: '',
      cliente_rec: '',
      dtemissi_rec: '',
      dtvenci_rec: '',
      dtpagi_rec: '',
      vlrdup_rec: totalVlrDup,
      vlrsal_rec: totalVlrSal,
      nivel_cliente: '', // Remove nível no rodapé
      status_rec: '',    // Remove status no rodapé
    }];
  }, [filteredContas]);

  const getStatusFromData = (conta: ContaReceber): string => {
    const today = new Date();
    
    // Se tem data de pagamento, está pago
    if (conta.dtpagi_rec && conta.dtpagi_rec !== '') {
      return 'Pago';
    }
    
    // Se status é cancelado
    if (conta.status_rec === 'C') {
      return 'Cancelado';
    }
    
    // Se venceu e não foi pago
    const vencimento = new Date(conta.dtvenci_rec);
    if (vencimento < today && (!conta.dtpagi_rec || conta.dtpagi_rec === '')) {
      return 'Atrasado';
    }
    
    // Caso padrão: aberto
    return 'Aberto';
  };

  // Referência intencional para evitar warning de variável atribuída e não usada
  void getStatusFromData;

  // ============= HANDLERS - MODAL =============
  const handleNewConta = () => {
    setModalMode('create');
    setSelectedConta(null);
    setIsModalOpen(true);
  };

  const handleEditConta = (conta: ContaReceber) => {
    setModalMode('edit');
    setSelectedConta(conta);
    setIsModalOpen(true);
  };

  const handleCancelarConta = async (conta: ContaReceber) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar esta conta?'
    );
    if (confirmed) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/receber/${conta.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...conta,
              status_rec: 'C',  // Cancelado
            }),
          }
        );
        if (response.ok) {
          loadContas();
          alert('Conta cancelada com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao cancelar conta:', error);
        alert('Erro ao cancelar conta');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConta(null);
  };

  // ============= UPDATE BANCO (EDITÁVEL NA GRID) =============
  const handleUpdateBanco = async (conta: ContaReceber, novoBanco: string) => {
    if (novoBanco === conta.banco_rec) {
      return; // Nenhuma mudança
    }
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/receber/${conta.id}/banco`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ banco_rec: novoBanco }),
        }
      );
      
      if (response.ok) {
        console.log(`✅ Banco atualizado: ${conta.banco_rec} → ${novoBanco}`);
        loadContas(); // Recarregar dados
      } else {
        console.error('Erro ao atualizar banco');
        alert('Erro ao atualizar banco');
      }
    } catch (error) {
      console.error('Erro ao atualizar banco:', error);
      alert('Erro ao atualizar banco');
    }
  };

  const handleSaveConta = async (contaData: Partial<ContaReceber>) => {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url =
        modalMode === 'create'
          ? `${API_BASE_URL}/receber`
          : `${API_BASE_URL}/receber/${selectedConta?.id}`;

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
  const columnDefs = [
    {
      field: 'nivel',
      headerName: 'Nível',
      width: 130,
      pinned: 'left',
      cellRenderer: (params: any) => {
        // Não renderizar na linha de totais
        if (params.data.numdup_rec === 'TOTAIS:') {
          return null;
        }
        
        const nivel = niveisClientes.get(params.data.codigo_rec) || 'Bronze';
        const tendencia = tendenciasClientes.get(params.data.codigo_rec) || 'estavel';
        let icon = '';
        let color = '';
        let trendIcon = '➡️'; // Estável (padrão)
        
        switch (nivel) {
          case 'Diamante':
            icon = '💎';
            color = '#0ea5e9'; // Azul claro
            break;
          case 'Ouro':
            icon = '🥇';
            color = '#f59e0b'; // Dourado
            break;
          case 'Prata':
            icon = '🥈';
            color = '#94a3b8'; // Prata
            break;
          default:
            icon = '🥉';
            color = '#a16207'; // Bronze
        }
        
        // Determinar ícone de tendência
        if (tendencia === 'melhorando') {
          trendIcon = '↗️';
        } else if (tendencia === 'piorando') {
          trendIcon = '↘️';
        }
        
        return (
          <span
            style={{
              color,
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => {
              // Priorizar o código do cliente (clientes.codigo_cli) quando cliforn_cli === 'C'
              const d: any = params.data || {};
              let codigoCliente = '';

              if (d.cliforn_cli === 'C' && d.codigo_cli) {
                codigoCliente = d.codigo_cli;
              } else if (d.codigo_cli) {
                // Mesmo sem flag, se existir codigo_cli, preferir
                codigoCliente = d.codigo_cli;
              } else if (d.codigo_cliente) {
                codigoCliente = d.codigo_cliente;
              } else if (d.cliente && (d.cliente.codigo_cli || d.cliente.codigo)) {
                codigoCliente = d.cliente.codigo_cli || d.cliente.codigo;
              } else if (d.codigo_rec) {
                // fallback: algumas fontes podem expor o cliente no campo codigo_rec (menos ideal)
                codigoCliente = d.codigo_rec;
              } else if (d.codigo_pag) {
                // fallback adicional para casos de pagar/receber mal mapeados
                codigoCliente = d.codigo_pag;
              }

              console.log('[ReceberListPage] Abrindo Análise Financeira - codigo passado:', codigoCliente, 'origem:', d);
              setSelectedCodigoCliente(String(codigoCliente || ''));
              setIsAnaliseModalOpen(true);
            }}
            title={`Clique para ver análise financeira - Nível ${nivel} - Tendência: ${tendencia === 'melhorando' ? 'Melhorando ↗️' : tendencia === 'piorando' ? 'Piorando ↘️' : 'Estável ➡️'}`}
          >
            {icon} {nivel} {trendIcon}
          </span>
        );
      },
    },
    {
      field: 'numdup_rec',
      headerName: 'Duplicata',
      width: 100,
      pinned: 'left',
      cellRenderer: (params: any) => {
        // Se for linha de totais, renderizar em negrito
        if (params.data.numdup_rec === 'TOTAIS:') {
          return (
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {params.value}
            </span>
          );
        }
        // Caso contrário, renderizar normalmente
        return params.value;
      },
    },
    { field: 'parcela_rec', headerName: 'Parcela', width: 80 },
    {
      field: 'cgccpf_rec',
      headerName: 'Documento',
      width: 150,
      valueFormatter: (params: any) => {
        // Passar o tipo para o formatador quando disponível (tipopessoa_rec = 'F' ou 'J')
        const tipo = params.data?.tipopessoa_rec || params.data?.tipopessoa_cli || undefined;
        return formatarDocumento(params.value, tipo as any);
      }
    },
    { 
      field: 'cliente_nome', 
      headerName: 'Cliente', 
      width: 250, 
      filter: true
    },
    { 
      field: 'tpcob_rec', 
      headerName: 'Tipo de Cobrança', 
      width: 150, 
      filter: true
    },
    {
      field: 'codigo_banco',
      headerName: 'Cód. Banco',
      width: 120,
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: [
          '001',
          '001-BB',
          '001-CEF',
          '001-ITAU',
          '001-BRADESCO',
          '001-SANTANDER',
        ],
      },
      onCellEditingStopped: (params: any) => {
        if (params.newValue && params.newValue !== params.oldValue) {
          handleUpdateBanco(params.data, params.newValue);
        }
      },
    },
    {
      field: 'banco_rec',
      headerName: 'Banco',
      width: 140,
      editable: true,
      cellEditor: 'agRichSelectCellEditor',
      cellEditorParams: {
        values: [
          '001',
          '001-BB',
          '001-CEF',
          '001-ITAU',
          '001-BRADESCO',
          '001-SANTANDER',
        ],
      },
      onCellEditingStopped: (params: any) => {
        if (params.newValue && params.newValue !== params.oldValue) {
          handleUpdateBanco(params.data, params.newValue);
        }
      },
    },
    {
      field: 'nomefan_bco',
      headerName: 'Banco',
      width: 140,
    },
    {
      field: 'codigo_bol',
      headerName: 'Cód. Boleto',
      width: 120,
      editable: true,
    },
    {
      field: 'dtmovi_rec',
      headerName: 'Emissão',
      width: 120,
      valueFormatter: (params: any) => formatarData(params.value),
    },
    {
      field: 'dtvenci_rec',
      headerName: 'Vencimento',
      width: 120,
      valueFormatter: (params: any) => formatarData(params.value),
    },
    {
      field: 'dtpagi_rec',
      headerName: 'Pago',
      width: 120,
      valueFormatter: (params: any) => formatarData(params.value),
    },
    {
      field: 'vlrdup_rec',
      headerName: 'Valor Original',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      valueGetter: (params: any) => Number(params.data?.vlrdup_rec) || 0,
      cellStyle: { textAlign: 'right' },
      aggFunc: 'sum',
      enableValue: true,
    },
    {
      field: 'vlrsal_rec',
      headerName: 'Saldo',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      valueGetter: (params: any) => Number(params.data?.vlrsal_rec) || 0,
      cellStyle: { textAlign: 'right' },
      aggFunc: 'sum',
      enableValue: true,
    },
    {
      field: 'status_rec',
      headerName: 'Status',
      width: 130,
      cellRenderer: (params: any) => {
        // Não renderizar na linha de totais
        if (params.data.numdup_rec === 'TOTAIS:') {
          return null;
        }
        
        const statusLabel = getStatusLabel(params.data);
        const statusColor = getStatusColor(statusLabel);
        
        // Não renderizar se for excluído (E)
        if (!statusLabel) return null;
        
        return (
          <span
            style={{
              color: statusColor,
              fontWeight: 600,
            }}
          >
            {statusLabel}
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
        // Não renderizar na linha de totais
        if (params.data.numdup_rec === 'TOTAIS:') {
          return null;
        }
        
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '100%' }}>
            <button
              onClick={() => handleEditConta(params.data)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: '#3b82f6',
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
  ];

  // ============= RENDER =============
  return (
    <Container>
      {/* HEADER */}
      <Header>
        <Title>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
          Contas a Receber
        </Title>
        <HeaderActions>
          <Button $variant="primary" onClick={handleNewConta}>
            <FontAwesomeIcon icon={faPlus} />
            Nova Conta
          </Button>
        </HeaderActions>
      </Header>

      {/* KPI CARDS - ATRASADOS */}
      <KPISection>
        <KPICard>
          <KPILabel>Total Atrasados</KPILabel>
          <KPIValue>{formatarMoeda(kpis.totalAtrasados)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>Atrasados +30 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.atrasados30)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>Atrasados +60 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.atrasados60)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>Atrasados +90 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.atrasados90)}</KPIValue>
        </KPICard>
        <KPICard className="danger">
          <KPILabel>Atrasados +120 dias</KPILabel>
          <KPIValue>{formatarMoeda(kpis.atrasados120)}</KPIValue>
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
        <FilterSelect
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="TODOS">Todos</option>
          <option value="ATRASADOS">⏰ Atrasados</option>
          <option value="ABERTOS">📅 Abertos</option>
          <option value="PAGO">✓ Pagos</option>
          <option value="CANCELADO">✗ Cancelados</option>
        </FilterSelect>
        <SearchInput
          type="text"
          placeholder="Buscar por qualquer campo..."
          value={quickFilterText}
          onChange={e => setQuickFilterText(e.target.value)}
        />
        <Button $variant="primary" onClick={handleProcessarReceber} disabled={loading} title="Processar consulta no servidor">
          {loading ? 'Processando...' : 'Processar'}
        </Button>
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

      {/* MODAL */}
      {isModalOpen && (
        <ReceberFormModal
          mode={modalMode}
          conta={selectedConta}
          onClose={handleCloseModal}
          onSave={handleSaveConta}
        />
      )}

      {/* MODAL DE ANÁLISE FINANCEIRA */}
      <ClienteAnaliseFinanceiraModal
        isOpen={isAnaliseModalOpen}
        onClose={() => setIsAnaliseModalOpen(false)}
        codigoCliente={selectedCodigoCliente}
      />
    </Container>
  );
};

export default ReceberListPage;













