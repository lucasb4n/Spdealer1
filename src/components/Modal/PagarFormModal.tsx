/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faTimes,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { API_BASE_URL } from 'services/apiConfig';

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
  vlrinss_pag?: number;
  vlrdescob_pag?: number;
  vlrdev_pag?: number;
  ap_pag?: string;
  condic_pag?: string;
  // Adicione aqui se necessário
}

interface PagarFormModalProps {
  mode: 'create' | 'edit';
  conta: ContaPagar | null;
  onClose: () => void;
  onSave: (contaData: Partial<ContaPagar>) => void;
}

// ============= STYLED COMPONENTS =============
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const ModalHeader = styled.div`
  background: #f3f4f6;
  color: #374151;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    font-size: 20px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #10b981;
          color: white;
          &:hover:not(:disabled) { background: #059669; }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.3); }
        `;
      case 'danger':
        return `
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.2); }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.3); }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalContent = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 25px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 120px 180px 100px 1fr;
  gap: 15px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  span {
    color: #ef4444;
    margin-left: 2px;
  }
`;

const Input = styled.input<{ $error?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${props => (props.$error ? '#ef4444' : '#d1d5db')};
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  &.currency {
    text-align: right;
    background-color: #fff1f2;
  }
`;

const Select = styled.select<{ $error?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${props => (props.$error ? '#ef4444' : '#d1d5db')};
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  transition: all 0.2s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea<{ $error?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${props => (props.$error ? '#ef4444' : '#d1d5db')};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

const SectionTitle = styled.h3`
  color: #2c3e50;
  margin: 25px 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 10px;
`;

// ============= ABAS (TABS) =============
const TabsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
  gap: 0;
`;

const TabButton = styled.button<{ $isActive: boolean }>`
  padding: 12px 24px;
  border: none;
  background: transparent;
  color: ${props => (props.$isActive ? '#dc2626' : '#6b7280')};
  font-size: 14px;
  font-weight: ${props => (props.$isActive ? '600' : '500')};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid ${props => (props.$isActive ? '#dc2626' : 'transparent')};
  margin-bottom: -2px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: #dc2626;
    background: rgba(220, 38, 38, 0.05);
  }

  svg {
    font-size: 16px;
  }
`;

const TabContent = styled.div`
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const HistoricoTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  thead {
    background: #f3f4f6;
    border-bottom: 2px solid #e5e7eb;
  }

  th {
    padding: 12px 8px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 10px 8px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 13px;
    color: #374151;
  }

  tbody tr:hover {
    background: rgba(220, 38, 38, 0.05);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const EmptyMessage = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;

  svg {
    font-size: 32px;
    margin-bottom: 10px;
    opacity: 0.5;
  }
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const KeyboardHint = styled.div`
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #7f1d1d;

  strong {
    color: #991b1b;
  }
`;

// ============= COMPONENTE PRINCIPAL =============
const PagarFormModal: React.FC<PagarFormModalProps> = ({
  mode,
  conta,
  onClose,
  onSave,
}) => {
  // ============= ESTADOS =============
  const [formData, setFormData] = useState<Partial<ContaPagar>>({
    codigo_pag: '',
    numnf_pag: '',
    numdup_pag: '',
    parcela_pag: '001',
    tipodoc_pag: '',
    tpcob_pag: '',
    dpto_pag: null,
    cgccpf_pag: '',
    tipopessoa_pag: '',
    dtmovi_pag: new Date().toISOString().split('T')[0],
    dtemissi_pag: new Date().toISOString().split('T')[0],
    dtvenci_pag: '',
    dtpagi_pag: null,
    banco_pag: '',
    nossonumero_pag: '',
    vlrdup_pag: 0,
    vlrdesc_pag: null,
    vlracre_pag: null,
    vlrpag_pag: null,
    vlrsal_pag: 0,
    vlrir_pag: null,
    vlriss_pag: null,
    vlrpis_pag: null,
    vlrcofins_pag: null,
    vlrcsll_pag: null,
    vlrinss_pag: null,
    vlrdescob_pag: null,
    vlrdev_pag: null,
    obs_pag: '',
    condic_pag: '',
    status_pag: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'historico'>('dados');
  const [historicoPagos, setHistoricoPagos] = useState<any[]>([]);

  // Estados para listas dinâmicas
  const [tiposDocumento, setTiposDocumento] = useState<Array<{codigo: string, descricao: string}>>([]);
  const [tiposCobranca, setTiposCobranca] = useState<Array<{codigo: string, descricao: string}>>([]);
  const [departamentos, setDepartamentos] = useState<Array<{codigo: string, descricao: string}>>([]);
  const [bancos, setBancos] = useState<Array<{codigo: string, descricao: string}>>([]);

  // ============= ESTADO - PESQUISA DE FORNECEDOR (F4) =============
  const [showFornecedorModal, setShowFornecedorModal] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [fornecedorSearch, setFornecedorSearch] = useState('');
  const [fornecedorSort, setFornecedorSort] = useState<{
    field: string;
    dir: 'asc' | 'desc';
  }>({ field: 'nome_cli', dir: 'asc' });

  // ============= LIFECYCLE =============
  // 1. PRIMEIRO: Carregar listas dinâmicas ao montar (SEMPRE)
  useEffect(() => {
    loadMasterData();
  }, []);

  // 2. DEPOIS: Setar dados do formulário quando em modo edit
  useEffect(() => {
    if (mode === 'edit' && conta) {
      // Normalizar alguns campos usando os dados mestres carregados
      const mapped: any = { ...conta };

      // mapear tipo de documento (pode estar salvo como descricao ou codigo)
      if (tiposDocumento && tiposDocumento.length > 0) {
        const td = tiposDocumento.find(t => t.codigo === conta.tipodoc_pag || t.descricao === conta.tipodoc_pag);
        if (td) mapped.tipodoc_pag = td.codigo;
      }

      // mapear tipo de cobranca
      if (tiposCobranca && tiposCobranca.length > 0) {
        const tc = tiposCobranca.find(t => t.codigo === conta.tpcob_pag || t.descricao === conta.tpcob_pag);
        if (tc) mapped.tpcob_pag = tc.codigo;
      }

      // departamentos/bancos normalmente já usam codigo; garantir string
      if (conta.dpto_pag != null) mapped.dpto_pag = String(conta.dpto_pag);
      if (conta.banco_pag != null) mapped.banco_pag = String(conta.banco_pag);

      setFormData(mapped);
      // Carregar histórico de pagamentos
      if (conta.pagar_id) {
        loadHistoricoPagamentos(conta.pagar_id);
      }
    }
  }, [mode, conta, tiposDocumento, tiposCobranca]);

  useEffect(() => {
    calcularSaldo();
  }, [
    formData.vlrdup_pag,
    formData.vlrpag_pag,
    formData.vlrdesc_pag,
    formData.vlracre_pag,
  ]);

  // ============= CARREGAR DADOS MASTER =============
  const loadMasterData = async () => {
    try {
      const [tiposDoc, tiposCob, deptos, bancosList] = await Promise.all([
        fetch(`${API_BASE_URL}/masdocp`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/mascobp`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/masdep`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/bancos`).then(r => r.json()).catch(() => []),
      ]);
      
      // Preferir `codigo_docp` quando disponível
      const normTiposDoc = (Array.isArray(tiposDoc) ? tiposDoc : []).map((d: any) => ({ codigo: d.codigo_docp || d.codigo || d.codigo_doc || (d.codigo?.toString?.() || ''), descricao: d.descr_docp || d.descricao || d.descr || '' })).filter((x: any) => x.codigo);
      const normTiposCob = (Array.isArray(tiposCob) ? tiposCob : []).map((d: any) => ({ codigo: d.codigo || d.codigo_cob || d.codigo_cobp || d.codigo?.toString?.() || '', descricao: d.descr_cobp || d.descricao || d.descr || d.nomefan_bco || '' })).filter((x: any) => x.codigo);
      const normDeptos = (Array.isArray(deptos) ? deptos : []).map((d: any) => ({ codigo: d.codigo_dep || d.codigo || d.codigo_dep?.toString?.() || '', descricao: d.descr_dep || d.descricao || d.descr || '' })).filter((x: any) => x.codigo);
      const normBancos = (Array.isArray(bancosList) ? bancosList : []).map((d: any) => ({ codigo: d.codigo_bco || d.codigo || d.codigo?.toString?.() || '', descricao: d.nome_bco || d.nomefan_bco || d.descricao || d.nome || '' })).filter((x: any) => x.codigo);

      setTiposDocumento(normTiposDoc);
      setTiposCobranca(normTiposCob);
      setDepartamentos(normDeptos);
      setBancos(normBancos);
    } catch (error) {
      console.error('Erro ao carregar dados mestres:', error);
      // Garantir arrays vazios em caso de erro
      setTiposDocumento([]);
      setTiposCobranca([]);
      setDepartamentos([]);
      setBancos([]);
    }
  };

  // ============= TECLAS DE ATALHO =============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC: Fechar modal
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }

      // Ctrl+S ou Cmd+S: Salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl+Enter ou Cmd+Enter: Salvar e fechar
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, hasUnsavedChanges, mode, loading]);

  // ============= VALIDAÇÃO =============
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo_pag?.trim())
      newErrors.codigo_pag = 'Fornecedor obrigatório';
    if (!formData.numdup_pag?.trim())
      newErrors.numdup_pag = 'Documento obrigatório';
    if (
      !formData.vlrdup_pag ||
      (formData.vlrdup_pag as number) <= 0
    )
      newErrors.vlrdup_pag = 'Valor deve ser maior que 0';
    if (!formData.dtvenci_pag?.trim())
      newErrors.dtvenci_pag = 'Vencimento obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============= CÁLCULOS =============
  const calcularSaldo = () => {
    const saldo =
      (formData.vlrdup_pag || 0) +
      (formData.vlracre_pag || 0) -
      (formData.vlrpag_pag || 0) -
      (formData.vlrdesc_pag || 0);
    setFormData(prev => ({
      ...prev,
      vlrsal_pag: Math.max(0, saldo),
    }));
  };

  // ============= CARREGAR HISTÓRICO DE PAGAMENTOS =============
  const loadHistoricoPagamentos = async (pagarID: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/documentos-abertos/historico-pagamentos/${pagarID}`
      );
      if (response.ok) {
        const data = await response.json();
        setHistoricoPagos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de pagamentos:', error);
      setHistoricoPagos([]);
    }
  };

  // ============= HANDLERS - FORMULÁRIO =============
  const handleInputChange = (
    field: keyof ContaPagar,
    value: any
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);

    // Limpar erro ao usuário começar a editar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  // ============= HANDLERS - BOTÕES =============
  const handleSave = async () => {
    if (!validate() || loading) return;

    setLoading(true);
    try {
      const payload: any = { ...formData };
      if (mode === 'create') {
        payload.vlrsal_pag = payload.vlrdup_pag;
      }
      onSave(payload);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Deseja descartar as alterações?\n\nClique OK para abandonar ou Cancelar para continuar editando.'
      );
      if (confirmed) {
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ============= PESQUISA DE FORNECEDOR (F4) =============
  const openFornecedorModal = async () => {
    setShowFornecedorModal(true);
    setLoadingFornecedores(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/clientes?cliforn_cli=F&limit=5000`
      );
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        // Filtrar apenas fornecedores (cliforn_cli = 'F' ou 'A')
        setFornecedores(
          list.filter(
            (c: any) =>
              !c.cliforn_cli ||
              String(c.cliforn_cli).toUpperCase() === 'F' ||
              String(c.cliforn_cli).toUpperCase() === 'A'
          )
        );
      } else {
        setFornecedores([]);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      setFornecedores([]);
    } finally {
      setLoadingFornecedores(false);
    }
  };

  const handleFornecedorSelect = (row: any) => {
    if (!row) return;
    handleInputChange('codigo_pag', String(row.codigo_cli || ''));
    handleInputChange('cgccpf_pag', String(row.cgccpf_cli || row.cpf_cnpj_cli || '').replace(/\D/g, ''));
    handleInputChange('tipopessoa_pag', String(row.tipopessoa_cli || row.tipopessoa_for || ''));
    setShowFornecedorModal(false);
    setFornecedorSearch('');
  };

  const handleFornecedorSort = (field: string) => {
    setFornecedorSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getFornecedoresOrdenados = () => {
    const term = fornecedorSearch.toLowerCase().trim();
    const filtered = fornecedores.filter((f: any) => {
      if (!term) return true;
      return String(f.nome_cli || '').toLowerCase().includes(term);
    });
    const { field, dir } = fornecedorSort;
    return [...filtered].sort((a: any, b: any) => {
      const va = String(a[field] ?? '').toLocaleLowerCase();
      const vb = String(b[field] ?? '').toLocaleLowerCase();
      const cmp = va.localeCompare(vb, 'pt-BR', { numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });
  };

  // ============= RENDER =============
  const title =
    mode === 'create' ? 'Nova Conta a Pagar' : 'Editar Contas a Pagar';

  return (
    <ModalOverlay onClick={handleBackdropClick}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <ModalHeader>
          <ModalTitle>📝 {title}</ModalTitle>
          <ModalActions>
            <Button $variant="secondary" onClick={handleClose} title="Voltar">
              <FontAwesomeIcon icon={faArrowLeft} />
              Voltar
            </Button>
            <Button $variant="danger" onClick={handleClose} title="Cancelar">
              <FontAwesomeIcon icon={faTimes} />
              Cancelar
            </Button>
            <Button
              $variant="primary"
              onClick={handleSave}
              disabled={loading}
              title="Salvar (Ctrl+S)"
            >
              <FontAwesomeIcon icon={faSave} />
              💾 Gravar
            </Button>
          </ModalActions>
        </ModalHeader>

        {/* TABS - Only visible in edit mode */}
        {mode === 'edit' && conta && conta.pagar_id && (
          <TabsContainer>
            <TabButton
              $isActive={activeTab === 'dados'}
              onClick={() => setActiveTab('dados')}
              title="Dados do documento"
            >
              📋 Dados
            </TabButton>
            <TabButton
              $isActive={activeTab === 'historico'}
              onClick={() => setActiveTab('historico')}
              title="Histórico de pagamentos parciais"
            >
              📊 Histórico de Parciais ({historicoPagos.length})
            </TabButton>
          </TabsContainer>
        )}

        {/* CONTENT */}
        <ModalContent>
          {activeTab === 'dados' && (
            <TabContent>
          <KeyboardHint>
            <strong>Atalhos:</strong> ESC para fechar | Ctrl+S para salvar |
            Ctrl+Enter para salvar e fechar
          </KeyboardHint>

          {/* SEÇÃO: DADOS PRINCIPAIS */}
          <SectionTitle>Dados Principais</SectionTitle>
          <FormRow>
            <FormGroup>
              <Label>
                Fornecedor<span>*</span>
              </Label>
              <Input
                type="text"
                maxLength={7}
                value={formData.codigo_pag || ''}
                onChange={e => handleInputChange('codigo_pag', e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'F4') {
                    e.preventDefault();
                    e.stopPropagation();
                    openFornecedorModal();
                  }
                }}
                placeholder="Código (F4 pesquisa)"
                $error={!!errors.codigo_pag}
              />
              {errors.codigo_pag && (
                <ErrorMessage>{errors.codigo_pag}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>
                Documento<span>*</span>
              </Label>
              <Input
                type="text"
                maxLength={30}
                value={formData.numdup_pag || ''}
                onChange={e => handleInputChange('numdup_pag', e.target.value)}
                placeholder="Nº Documento"
                $error={!!errors.numdup_pag}
              />
              {errors.numdup_pag && (
                <ErrorMessage>{errors.numdup_pag}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Parcela</Label>
              <Input
                type="text"
                maxLength={5}
                value={formData.parcela_pag || ''}
                onChange={e => handleInputChange('parcela_pag', e.target.value)}
                placeholder="001"
              />
            </FormGroup>

            <FormGroup>
              <Label>Tipo de Documento</Label>
              <Select
                value={formData.tipodoc_pag || ''}
                onChange={e => handleInputChange('tipodoc_pag', e.target.value)}
              >
                <option value="">Selecione...</option>
                {tiposDocumento.map(doc => (
                  <option key={doc.codigo} value={doc.codigo}>
                    {doc.descricao}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>

          {/* SEÇÃO: DATAS */}
          <SectionTitle>Datas</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>Data Emissão</Label>
              <Input
                type="date"
                value={formData.dtemissi_pag || ''}
                onChange={e => handleInputChange('dtemissi_pag', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                Data Vencimento<span>*</span>
              </Label>
              <Input
                type="date"
                value={formData.dtvenci_pag || ''}
                onChange={e => handleInputChange('dtvenci_pag', e.target.value)}
                $error={!!errors.dtvenci_pag}
              />
              {errors.dtvenci_pag && (
                <ErrorMessage>{errors.dtvenci_pag}</ErrorMessage>
              )}
            </FormGroup>

            {mode === 'edit' && (
              <FormGroup>
                <Label>Data Pagamento</Label>
                <Input
                  type="date"
                  value={formData.dtpagi_pag || ''}
                  onChange={e => handleInputChange('dtpagi_pag', e.target.value)}
                />
              </FormGroup>
            )}
          </FormGrid>

          {/* SEÇÃO: VALORES */}
          <SectionTitle>Valores</SectionTitle>
          <ValuesGrid>
            <FormGroup>
              <Label>
                Valor Documento<span>*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrdup_pag || 0}
                onChange={e =>
                  handleInputChange('vlrdup_pag', parseFloat(e.target.value) || 0)
                }
                $error={!!errors.vlrdup_pag}
              />
              {errors.vlrdup_pag && (
                <ErrorMessage>{errors.vlrdup_pag}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Desconto</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrdesc_pag || 0}
                onChange={e =>
                  handleInputChange('vlrdesc_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Acréscimo</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlracre_pag || 0}
                onChange={e =>
                  handleInputChange('vlracre_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Valor Pago</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrpag_pag || 0}
                onChange={e =>
                  handleInputChange('vlrpag_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <strong>Saldo</strong>
              </Label>
              <Input
                type="text"
                value={formatarMoeda(formData.vlrsal_pag || 0)}
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>IR</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrir_pag || 0}
                onChange={e =>
                  handleInputChange('vlrir_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>ISS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlriss_pag || 0}
                onChange={e =>
                  handleInputChange('vlriss_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>PIS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrpis_pag || 0}
                onChange={e =>
                  handleInputChange('vlrpis_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>COFINS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrcofins_pag || 0}
                onChange={e =>
                  handleInputChange('vlrcofins_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>CSLL</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrcsll_pag || 0}
                onChange={e =>
                  handleInputChange('vlrcsll_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>INSS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrinss_pag || 0}
                onChange={e =>
                  handleInputChange('vlrinss_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Desp. Cartório</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrdescob_pag || 0}
                onChange={e =>
                  handleInputChange('vlrdescob_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Devolução</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrdev_pag || 0}
                onChange={e =>
                  handleInputChange('vlrdev_pag', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>
          </ValuesGrid>

          {/* SEÇÃO: COMPLEMENTARES */}
          <SectionTitle>Informações Complementares</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>Departamento</Label>
              <Select
                value={formData.dpto_pag || ''}
                onChange={e => handleInputChange('dpto_pag', e.target.value)}
              >
                <option value="">Selecione...</option>
                {departamentos.map(dpt => (
                  <option key={dpt.codigo} value={dpt.codigo}>
                    {dpt.descricao}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Banco</Label>
              <Select
                value={formData.banco_pag || ''}
                onChange={e => handleInputChange('banco_pag', e.target.value)}
              >
                <option value="">Selecione...</option>
                {bancos.map(bco => (
                  <option key={bco.codigo} value={bco.codigo}>
                    {bco.descricao}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Nosso Número</Label>
              <Input
                type="text"
                value={formData.nossonumero_pag || ''}
                onChange={e =>
                  handleInputChange('nossonumero_pag', e.target.value)
                }
                placeholder="Nosso número"
              />
            </FormGroup>

            <FormGroup>
              <Label>Tipo de Cobrança</Label>
              <Select
                value={formData.tpcob_pag || ''}
                onChange={e => handleInputChange('tpcob_pag', e.target.value)}
              >
                <option value="">Selecione...</option>
                {tiposCobranca.map(cob => (
                  <option key={cob.codigo} value={cob.codigo}>
                    {cob.descricao}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Autorização</Label>
              <Select
                value={formData.ap_pag || ''}
                onChange={e => handleInputChange('ap_pag', e.target.value)}
              >
                <option value="">Não Autorizado</option>
                <option value="S">Autorizado</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Condição Pagamento</Label>
              <Input
                type="text"
                value={formData.condic_pag || ''}
                onChange={e => handleInputChange('condic_pag', e.target.value)}
                placeholder="Digite a condição de pagamento"
                maxLength={50}
              />
            </FormGroup>

            {/* Status removido do modal por solicitação (mantido internamente) */}
          </FormGrid>

          {/* SEÇÃO: OBSERVAÇÕES */}
          <SectionTitle>Observações</SectionTitle>
          <FormGroup>
            <Textarea
              rows={4}
              value={formData.obs_pag || ''}
              onChange={e => handleInputChange('obs_pag', e.target.value)}
              placeholder="Digite observações adicionais..."
            />
          </FormGroup>
            </TabContent>
          )}

          {/* TAB 2: HISTÓRICO DE PAGAMENTOS */}
          {activeTab === 'historico' && (
            <TabContent>
              {historicoPagos.length > 0 ? (
                <>
                  <SectionTitle>📊 Histórico de Pagamentos Parciais</SectionTitle>
                  <HistoricoTable>
                    <thead>
                      <tr>
                        <th>Data Pgto</th>
                        <th>Valor Pgto</th>
                        <th>Acréscimo</th>
                        <th>Caixa/Banco</th>
                        <th>Operação</th>
                        <th>Usuário</th>
                        <th>Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoPagos.map((pagto, idx) => (
                        <tr key={idx}>
                          <td>{pagto.dtpagi_pag ? new Date(pagto.dtpagi_pag).toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="amount">
                            {pagto.vlrpag_pag ? `R$ ${pagto.vlrpag_pag.toFixed(2).replace('.', ',')}` : '-'}
                          </td>
                          <td className="amount">
                            {pagto.vlracre_pag ? `R$ ${pagto.vlracre_pag.toFixed(2).replace('.', ',')}` : '-'}
                          </td>
                          <td>{pagto.cxbco_pag || '-'}</td>
                          <td>{pagto.opercai_pag || '-'}</td>
                          <td>{pagto.usuario_pag || '-'}</td>
                          <td className="obs">{pagto.observabai_pag || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </HistoricoTable>
                </>
              ) : (
                <EmptyMessage>
                  📭 Nenhum pagamento parcial registrado para este documento
                </EmptyMessage>
              )}
            </TabContent>
          )}
        </ModalContent>
      </ModalContainer>

      {/* MODAL PESQUISA DE FORNECEDOR (F4) */}
      {showFornecedorModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowFornecedorModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '90vw',
              maxWidth: 700,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#1e293b',
                }}
              >
                Pesquisar Fornecedor
              </h3>
              <button
                onClick={() => setShowFornecedorModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '0 1.25rem' }}>
              <div
                style={{
                  marginBottom: '12px',
                  marginTop: '12px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="🔍 Pesquisar por nome..."
                  value={fornecedorSearch}
                  onChange={e => setFornecedorSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                {fornecedorSearch && (
                  <button
                    onClick={() => setFornecedorSearch('')}
                    style={{
                      padding: '10px 16px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>
              {loadingFornecedores ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Carregando fornecedores...
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                    {fornecedores.length > 0
                      ? `Exibindo ${getFornecedoresOrdenados().length} de ${fornecedores.length} fornecedor(es)`
                      : 'Nenhum fornecedor encontrado'}
                  </div>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f3f4f6', color: '#374151' }}>
                        <th
                          onClick={() => handleFornecedorSort('codigo_cli')}
                          style={{ padding: '8px 12px', textAlign: 'left', width: 110, cursor: 'pointer', userSelect: 'none', textDecoration: fornecedorSort.field === 'codigo_cli' ? 'underline' : 'none' }}
                          title="Clique para ordenar"
                        >
                          Código {fornecedorSort.field === 'codigo_cli' && (fornecedorSort.dir === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleFornecedorSort('nome_cli')}
                          style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', textDecoration: fornecedorSort.field === 'nome_cli' ? 'underline' : 'none' }}
                          title="Clique para ordenar"
                        >
                          Nome {fornecedorSort.field === 'nome_cli' && (fornecedorSort.dir === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleFornecedorSort('cpf_cnpj_cli')}
                          style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', textDecoration: fornecedorSort.field === 'cpf_cnpj_cli' ? 'underline' : 'none' }}
                          title="Clique para ordenar"
                        >
                          Documento {fornecedorSort.field === 'cpf_cnpj_cli' && (fornecedorSort.dir === 'asc' ? '▲' : '▼')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFornecedoresOrdenados()
                        .slice(0, 200)
                        .map((f: any) => (
                          <tr
                            key={f.codigo_cli}
                            onClick={() => handleFornecedorSelect(f)}
                            style={{
                              cursor: 'pointer',
                              borderBottom: '1px solid #e5e7eb',
                            }}
                            onMouseEnter={e =>
                              (e.currentTarget.style.background = '#f9fafb')
                            }
                            onMouseLeave={e =>
                              (e.currentTarget.style.background = 'transparent')
                            }
                          >
                            <td style={{ padding: '8px 12px' }}>{f.codigo_cli}</td>
                            <td style={{ padding: '8px 12px' }}>{f.nome_cli}</td>
                            <td style={{ padding: '8px 12px' }}>{f.cpf_cnpj_cli || f.cgccpf_cli || ''}</td>
                          </tr>
                        ))}
                      {getFornecedoresOrdenados().length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}
                          >
                            Nenhum fornecedor encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div
              style={{
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'right',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              Clique em um fornecedor para selecionar
            </div>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
};

export default PagarFormModal;













