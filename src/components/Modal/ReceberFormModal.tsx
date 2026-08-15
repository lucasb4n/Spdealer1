/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from 'services/apiConfig';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faTimes,
  faArrowLeft,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';

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
}

interface ReceberFormModalProps {
  mode: 'create' | 'edit';
  conta: ContaReceber | null;
  onClose: () => void;
  onSave: (contaData: Partial<ContaReceber>) => void;
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
  padding: 15px 25px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  letter-spacing: 0.5px;

  span {
    color: #ef4444;
    margin-left: 2px;
  }
`;

const Input = styled.input<{ $error?: boolean }>`
  padding: 7px 12px;
  border: 1px solid ${props => (props.$error ? '#ef4444' : '#d1d5db')};
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  &.currency {
    text-align: right;
    background-color: #eff6ff;
  }
`;

const Select = styled.select<{ $error?: boolean }>`
  padding: 7px 12px;
  border: 1px solid ${props => (props.$error ? '#ef4444' : '#d1d5db')};
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  transition: all 0.2s ease;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  margin: 15px 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 6px;
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
  color: ${props => (props.$isActive ? '#3b82f6' : '#6b7280')};
  font-size: 14px;
  font-weight: ${props => (props.$isActive ? '600' : '500')};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid ${props => (props.$isActive ? '#3b82f6' : 'transparent')};
  margin-bottom: -2px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
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
    background: rgba(59, 130, 246, 0.05);
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

const HelpButton = styled.button`
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  padding: 0 8px;
  margin-left: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const HelpPopup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 10001;
  padding: 0;
`;

const HelpHeader = styled.div`
  background: #3b82f6;
  color: white;
  padding: 16px 20px;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const HelpContent = styled.div`
  padding: 24px;

  h4 {
    color: #374151;
    font-size: 16px;
    font-weight: 600;
    margin: 20px 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;

    &:first-child {
      margin-top: 0;
    }
  }

  p {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.6;
    margin: 8px 0;
  }

  ul {
    margin: 8px 0;
    padding-left: 24px;

    li {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.8;
      margin: 4px 0;

      strong {
        color: #374151;
      }
    }
  }

  code {
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #ef4444;
  }
`;

const HelpOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  backdrop-filter: blur(2px);
`;

const CloseHelpButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const CompactFormRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const CompactFormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

// ============= COMPONENTE PRINCIPAL =============
const ReceberFormModal: React.FC<ReceberFormModalProps> = ({
  mode,
  conta,
  onClose,
  onSave,
}) => {
  // ============= ESTADOS =============
  const [formData, setFormData] = useState<Partial<ContaReceber>>({
    codigo_rec: '',
    numdup_rec: '',
    parcela_rec: '001',
    tipodoc_rec: '',
    tpcob_rec: '',
    dpto_rec: '',
    cgccpf_rec: '',
    dtmovi_rec: new Date().toISOString().split('T')[0],
    dtemissi_rec: new Date().toISOString().split('T')[0],
    dtvenci_rec: '',
    dtpagi_rec: '',
    banco_rec: '',
    codigo_bol: '',
    nossonumero_rec: '',
    vlrdup_rec: 0,
    vlrdesc_rec: 0,
    vlracre_rec: 0,
    vlrmulta_rec: 0,
    vlrpag_rec: 0,
    vlrsal_rec: 0,
    vlrir_rec: 0,
    vlriss_rec: 0,
    vlrpis_rec: 0,
    vlrcofins_rec: 0,
    vlrcsll_rec: 0,
    vlrinss_rec: 0,
    vlrdescob_rec: 0,
    vlrdev_rec: 0,
    obs_rec: '',
    condic_rec: '',
    status_rec: 'A',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'historico'>('dados');
  const [historicoRecebidos, setHistoricoRecebidos] = useState<any[]>([]);

  // Estados para listas dinâmicas
  const [tiposDocumento, setTiposDocumento] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [tiposCobranca, setTiposCobranca] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);

  // ============= ESTADO - PESQUISA DE CLIENTE (F4) =============
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteSort, setClienteSort] = useState<{
    field: string;
    dir: 'asc' | 'desc';
  }>({ field: 'nome_cli', dir: 'asc' });

  // ============= LIFECYCLE =============
  // 1. PRIMEIRO: Carregar listas dinâmicas ao montar (SEMPRE)
  useEffect(() => {
    loadMasterData();
  }, []);

  // 2. DEPOIS: Setar dados do formulário quando em modo edit (DEPOIS de carregar listas)
  useEffect(() => {
    if (mode === 'edit' && conta) {
      setFormData(conta);
    }
  }, [mode, conta]);

  useEffect(() => {
    calcularSaldo();
  }, [
    formData.vlrdup_rec,
    formData.vlrpag_rec,
    formData.vlrdesc_rec,
    formData.vlracre_rec,
  ]);

  // Carregar histórico de recebimentos quando modo é edit
  useEffect(() => {
    if (mode === 'edit' && conta && conta.id) {
      loadHistoricoRecebimentos(conta.id);
    }
  }, [mode, conta]);

  // ============= CARREGAR LISTAS DINÂMICAS =============
  const loadMasterData = async () => {
    try {
        const [tiposDoc, deptos, tiposCob, bancosList] = await Promise.all([
        fetch(`${API_BASE_URL}/masdoc`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/masdep`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/mascob`).then(r => r.json()).catch(() => []),
        fetch(`${API_BASE_URL}/bancos`).then(r => r.json()).catch(() => []),
      ]);
      
      setTiposDocumento(Array.isArray(tiposDoc) ? tiposDoc : []);
      setDepartamentos(Array.isArray(deptos) ? deptos : []);
      setTiposCobranca(Array.isArray(tiposCob) ? tiposCob : []);
      setBancos(Array.isArray(bancosList) ? bancosList : []);
    } catch (error) {
      console.error('Erro ao carregar dados mestres:', error);
      // Garantir arrays vazios em caso de erro
      setTiposDocumento([]);
      setDepartamentos([]);
      setTiposCobranca([]);
      setBancos([]);
    }
  };

  // Após carregar lists ou alterar formData em modo edit, garantir que o valor atual exista
  useEffect(() => {
    // helper para verificar e injetar opção ausente
    const ensureOption = (list: any[], value: any, setList: (v: any[]) => void, labelFallback?: string) => {
      if (!value) return;
      const exists = list.some((it: any) => {
        const v = it.codigo || it.codigo_doc || it.id || it.cod || it.codigo_bco || it.codigo_dep || it.codigo_cob;
        return String(v) === String(value);
      });
      if (!exists) {
        const temp = { codigo: value, descricao: labelFallback || String(value) };
        setList([...(list || []), temp]);
      }
    };

    if (mode === 'edit' && formData) {
      ensureOption(tiposDocumento, formData.tipodoc_rec, setTiposDocumento, `Atualmente: ${formData.tipodoc_rec}`);
      ensureOption(departamentos, formData.dpto_rec, setDepartamentos, `Atualmente: ${formData.dpto_rec}`);
      ensureOption(tiposCobranca, formData.tpcob_rec, setTiposCobranca, `Atualmente: ${formData.tpcob_rec}`);
      ensureOption(bancos, formData.banco_rec, setBancos, `Atualmente: ${formData.banco_rec}`);
    }
  }, [tiposDocumento, departamentos, tiposCobranca, bancos, formData, mode]);

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

    if (!formData.codigo_rec?.trim())
      newErrors.codigo_rec = 'Cliente obrigatório';
    if (!formData.numdup_rec?.trim())
      newErrors.numdup_rec = 'Duplicata obrigatória';
    if (
      !formData.vlrdup_rec ||
      (formData.vlrdup_rec as number) <= 0
    )
      newErrors.vlrdup_rec = 'Valor deve ser maior que 0';
    if (!formData.dtvenci_rec?.trim())
      newErrors.dtvenci_rec = 'Vencimento obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============= FORMATAÇÃO =============
  const formatCurrency = (value: number | undefined | null): string => {
    if (!value && value !== 0) return '';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (text: string): number => {
    if (!text) return 0;
    const cleaned = text.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleCurrencyChange = (field: keyof ContaReceber, value: string) => {
    const numericValue = parseCurrency(value);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
    setHasUnsavedChanges(true);
  };

  // ============= CÁLCULOS =============
  const calcularSaldo = () => {
    const saldo =
      (formData.vlrdup_rec || 0) +
      (formData.vlracre_rec || 0) -
      (formData.vlrpag_rec || 0) -
      (formData.vlrdesc_rec || 0);
    setFormData(prev => ({
      ...prev,
      vlrsal_rec: Math.max(0, saldo),
    }));
  };

  // ============= CARREGAR HISTÓRICO DE RECEBIMENTOS =============
  const loadHistoricoRecebimentos = async (receberID: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/documentos-abertos/historico-recebimentos/${receberID}`
      );
      if (response.ok) {
        const data = await response.json();
        setHistoricoRecebidos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de recebimentos:', error);
      setHistoricoRecebidos([]);
    }
  };

  // ============= HANDLERS - FORMULÁRIO =============
  const handleInputChange = (
    field: keyof ContaReceber,
    value: any
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // ============= HANDLERS - HELP =============
  const handleToggleHelp = () => {
    setShowHelp(!showHelp);
  };

  const handleCloseHelp = () => {
    setShowHelp(false);
  };

  // ============= LISTENERS - TECLADO =============
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - Fechar help se estiver aberto, senão fechar modal
      if (e.key === 'Escape') {
        if (showHelp) {
          e.stopPropagation();
          handleCloseHelp();
        } else {
          handleClose();
        }
      }
      // Ctrl+S - Salvar
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl+Enter - Salvar e fechar
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, formData, hasUnsavedChanges]);

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  // referenciar para evitar warning de variável atribuída e não usada
  void formatarMoeda;

  // ============= HANDLERS - BOTÕES =============
  const handleSave = async () => {
    if (!validate() || loading) return;

    setLoading(true);
    try {
      onSave(formData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndClose = async () => {
    if (!validate() || loading) return;

    setLoading(true);
    try {
      onSave(formData);
      setHasUnsavedChanges(false);
      onClose();
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

  // ============= PESQUISA DE CLIENTE (F4) =============
  const openClienteModal = async () => {
    setShowClienteModal(true);
    setLoadingClientes(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/clientes?cliforn_cli=C&limit=5000`
      );
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        // Filtrar apenas clientes (cliforn_cli = 'C' ou 'A')
        setClientes(
          list.filter(
            (c: any) =>
              !c.cliforn_cli ||
              String(c.cliforn_cli).toUpperCase() === 'C' ||
              String(c.cliforn_cli).toUpperCase() === 'A'
          )
        );
      } else {
        setClientes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleClienteSelect = (row: any) => {
    if (!row) return;
    handleInputChange('codigo_rec', String(row.codigo_cli || ''));
    handleInputChange('cgccpf_rec', String(row.cgccpf_cli || row.cpf_cnpj_cli || '').replace(/\D/g, ''));
    setShowClienteModal(false);
    setClienteSearch('');
  };

  const handleClienteSort = (field: string) => {
    setClienteSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getClientesOrdenados = () => {
    const term = clienteSearch.toLowerCase().trim();
    const filtered = clientes.filter((c: any) => {
      if (!term) return true;
      return String(c.nome_cli || '').toLowerCase().includes(term);
    });
    const { field, dir } = clienteSort;
    return [...filtered].sort((a: any, b: any) => {
      const va = String(a[field] ?? '').toLocaleLowerCase();
      const vb = String(b[field] ?? '').toLocaleLowerCase();
      const cmp = va.localeCompare(vb, 'pt-BR', { numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });
  };

  // ============= RENDER =============
  const title =
    mode === 'create' ? 'Nova Conta a Receber' : 'Editar Contas a Receber';

  return (
    <ModalOverlay onClick={handleBackdropClick}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <ModalHeader>
          <ModalTitle>
            📝 {title}
            <HelpButton onClick={handleToggleHelp} title="Ajuda (Clique para ver instruções)">
              <FontAwesomeIcon icon={faQuestionCircle} />
            </HelpButton>
          </ModalTitle>
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

        {/* ABAS */}
        {mode === 'edit' && conta && conta.id && (
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
              title="Histórico de recebimentos parciais"
            >
              📊 Histórico de Parciais ({historicoRecebidos.length})
            </TabButton>
          </TabsContainer>
        )}

        {/* CONTENT */}
        <ModalContent>
          {activeTab === 'dados' && (
            <TabContent>
          {/* SEÇÃO: DADOS PRINCIPAIS */}
          <SectionTitle>Dados Principais</SectionTitle>
          <CompactFormRow>
            <CompactFormGroup style={{ flex: '0 0 100px' }}>
              <Label>
                Cliente<span>*</span>
              </Label>
              <Input
                type="text"
                maxLength={7}
                value={formData.codigo_rec || ''}
                onChange={e => handleInputChange('codigo_rec', e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'F4') {
                    e.preventDefault();
                    e.stopPropagation();
                    openClienteModal();
                  }
                }}
                placeholder="Código (F4 pesquisa)"
                $error={!!errors.codigo_rec}
              />
              {errors.codigo_rec && (
                <ErrorMessage>{errors.codigo_rec}</ErrorMessage>
              )}
            </CompactFormGroup>

            <CompactFormGroup style={{ flex: '0 0 150px' }}>
              <Label>
                Duplicata<span>*</span>
              </Label>
              <Input
                type="text"
                maxLength={12}
                value={formData.numdup_rec || ''}
                onChange={e => handleInputChange('numdup_rec', e.target.value)}
                placeholder="Número"
                $error={!!errors.numdup_rec}
              />
              {errors.numdup_rec && (
                <ErrorMessage>{errors.numdup_rec}</ErrorMessage>
              )}
            </CompactFormGroup>

            <CompactFormGroup style={{ flex: '0 0 80px' }}>
              <Label>Parcela</Label>
              <Input
                type="text"
                maxLength={5}
                value={formData.parcela_rec || ''}
                onChange={e => handleInputChange('parcela_rec', e.target.value)}
                placeholder="001"
              />
            </CompactFormGroup>

            <CompactFormGroup style={{ flex: '1' }}>
              <Label>Tipo de Documento</Label>
              <Select
                value={formData.tipodoc_rec || ''}
                onChange={e => handleInputChange('tipodoc_rec', e.target.value)}
              >
                <option value="">Selecione...</option>
                {tiposDocumento.map((doc: any) => {
                  const val = doc.codigo || doc.codigo_doc || doc.id || doc.cod || doc.codigo_docu || doc.codigo_tipo;
                  const label = doc.descricao || doc.nome || doc.label || doc.descr || String(val);
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </Select>
            </CompactFormGroup>
          </CompactFormRow>

          {/* SEÇÃO: DATAS */}
          <SectionTitle>Datas</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>Data Emissão</Label>
              <Input
                type="date"
                value={formData.dtemissi_rec || ''}
                onChange={e => handleInputChange('dtemissi_rec', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                Data Vencimento<span>*</span>
              </Label>
              <Input
                type="date"
                value={formData.dtvenci_rec || ''}
                onChange={e => handleInputChange('dtvenci_rec', e.target.value)}
                $error={!!errors.dtvenci_rec}
              />
              {errors.dtvenci_rec && (
                <ErrorMessage>{errors.dtvenci_rec}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Data Pagamento</Label>
              <Input
                type="date"
                value={formData.dtpagi_rec || ''}
                onChange={e => handleInputChange('dtpagi_rec', e.target.value)}
              />
            </FormGroup>
          </FormGrid>

          {/* SEÇÃO: VALORES */}
          <SectionTitle>Valores</SectionTitle>
          <ValuesGrid>
            <FormGroup>
              <Label>
                Valor Original<span>*</span>
              </Label>
              <Input
                type="text"
                className="currency"
                value={formatCurrency(formData.vlrdup_rec)}
                onChange={e => handleCurrencyChange('vlrdup_rec', e.target.value)}
                $error={!!errors.vlrdup_rec}
              />
              {errors.vlrdup_rec && (
                <ErrorMessage>{errors.vlrdup_rec}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Desconto</Label>
              <Input
                type="text"
                className="currency"
                value={formatCurrency(formData.vlrdesc_rec)}
                onChange={e => handleCurrencyChange('vlrdesc_rec', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Acréscimo</Label>
              <Input
                type="text"
                className="currency"
                value={formatCurrency(formData.vlracre_rec)}
                onChange={e => handleCurrencyChange('vlracre_rec', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Multa</Label>
              <Input
                type="text"
                className="currency"
                value={formatCurrency(formData.vlrmulta_rec)}
                onChange={e => handleCurrencyChange('vlrmulta_rec', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>Valor Pago</Label>
              <Input
                type="text"
                className="currency"
                value={formatCurrency(formData.vlrpag_rec)}
                onChange={e => handleCurrencyChange('vlrpag_rec', e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <strong>Saldo</strong>
              </Label>
              <Input
                type="text"
                value={formatCurrency(formData.vlrsal_rec)}
                disabled
              />
            </FormGroup>

            <FormGroup>
              <Label>ISS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlriss_rec || 0}
                onChange={e =>
                  handleInputChange('vlriss_rec', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>PIS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrpis_rec || 0}
                onChange={e =>
                  handleInputChange('vlrpis_rec', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>COFINS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrcofins_rec || 0}
                onChange={e =>
                  handleInputChange(
                    'vlrcofins_rec',
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>CSLL</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrcsll_rec || 0}
                onChange={e =>
                  handleInputChange('vlrcsll_rec', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>INSS</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrinss_rec || 0}
                onChange={e =>
                  handleInputChange('vlrinss_rec', parseFloat(e.target.value) || 0)
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Desp. Cartório</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrdescob_rec || 0}
                onChange={e =>
                  handleInputChange(
                    'vlrdescob_rec',
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Devolução</Label>
              <Input
                type="number"
                step="0.01"
                className="currency"
                value={formData.vlrdev_rec || 0}
                onChange={e =>
                  handleInputChange('vlrdev_rec', parseFloat(e.target.value) || 0)
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
                value={formData.dpto_rec || ''}
                onChange={e => handleInputChange('dpto_rec', e.target.value)}
              >
                <option value="">Selecione...</option>
                {departamentos.map((dep: any) => {
                  const val = dep.codigo || dep.codigo_dep || dep.id || dep.cod || dep.codigo_departamento;
                  const label = dep.descricao || dep.nome || dep.label || String(val);
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Banco</Label>
              <Select
                value={formData.banco_rec || ''}
                onChange={e => handleInputChange('banco_rec', e.target.value)}
              >
                <option value="">Selecione...</option>
                {bancos.map((banco: any) => {
                  const val = banco.codigo || banco.codigo_bco || banco.id || banco.cod;
                  const label = banco.descricao || banco.nome_bco || banco.nomefan_bco || banco.nome || String(val);
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Nosso Número</Label>
              <Input
                type="text"
                value={formData.nossonumero_rec || ''}
                onChange={e =>
                  handleInputChange('nossonumero_rec', e.target.value)
                }
                placeholder="Nosso número"
              />
            </FormGroup>

            <FormGroup>
              <Label>Cód. Boleto</Label>
              <Input
                type="text"
                value={formData.codigo_bol || ''}
                onChange={e =>
                  handleInputChange('codigo_bol', e.target.value)
                }
                placeholder="Código do boleto"
              />
            </FormGroup>

            <FormGroup>
              <Label>Tipo de Cobrança</Label>
              <Select
                value={formData.tpcob_rec || ''}
                onChange={e => handleInputChange('tpcob_rec', e.target.value)}
              >
                <option value="">Selecione...</option>
                {tiposCobranca.map((cob: any) => {
                  const val = cob.codigo || cob.codigo_cob || cob.id || cob.cod;
                  const label = cob.descricao || cob.nome || String(val);
                  return (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  );
                })}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Condição Pagamento</Label>
              <Input
                type="text"
                value={formData.condic_rec || ''}
                onChange={e => handleInputChange('condic_rec', e.target.value)}
                placeholder="Digite a condição de pagamento"
                maxLength={50}
              />
            </FormGroup>

            <FormGroup>
              <Label>Status</Label>
              <Select
                value={formData.status_rec || ''}
                onChange={e => handleInputChange('status_rec', e.target.value)}
              >
                <option value="A">Aberto</option>
                <option value="P">Pago</option>
                <option value="C">Cancelado</option>
              </Select>
            </FormGroup>
          </FormGrid>

          {/* SEÇÃO: OBSERVAÇÕES */}
          <SectionTitle>Observações</SectionTitle>
          <FormGroup>
            <Textarea
              rows={4}
              value={formData.obs_rec || ''}
              onChange={e => handleInputChange('obs_rec', e.target.value)}
              placeholder="Digite observações adicionais..."
            />
          </FormGroup>
            </TabContent>
          )}

          {activeTab === 'historico' && (
            <TabContent>
              {historicoRecebidos.length > 0 ? (
                <>
                  <SectionTitle>📊 Histórico de Recebimentos Parciais</SectionTitle>
                  <HistoricoTable>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Valor Recebido</th>
                        <th>Acréscimo</th>
                        <th>Banco</th>
                        <th>Operação</th>
                        <th>Usuário</th>
                        <th>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicoRecebidos.map((recebimento, idx) => (
                        <tr key={idx}>
                          <td>{new Date(recebimento.dtpagi_rec).toLocaleDateString('pt-BR')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            R$ {(recebimento.vlrpag_rec || 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            R$ {(recebimento.vlracre_rec || 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{recebimento.cxbco_rec || '-'}</td>
                          <td>{recebimento.opercai_rec || '-'}</td>
                          <td>{recebimento.usuario_rec || '-'}</td>
                          <td>{recebimento.observabai_rec || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </HistoricoTable>
                </>
              ) : (
                <EmptyMessage>
                  📭 Nenhum recebimento parcial registrado para este documento
                </EmptyMessage>
              )}
            </TabContent>
          )}
        </ModalContent>
      </ModalContainer>

      {/* HELP POPUP */}
      {showHelp && (
        <>
          <HelpOverlay onClick={handleCloseHelp} />
          <HelpPopup>
            <HelpHeader>
              <h3>💡 Ajuda - Contas a Receber</h3>
              <CloseHelpButton onClick={handleCloseHelp} title="Fechar (ESC)">
                ×
              </CloseHelpButton>
            </HelpHeader>
            <HelpContent>
              <h4>📋 Atalhos de Teclado</h4>
              <ul>
                <li><strong>ESC</strong> - Fecha esta ajuda ou cancela o formulário</li>
                <li><strong>Ctrl+S</strong> - Salva o registro</li>
                <li><strong>Ctrl+Enter</strong> - Salva o registro e fecha o formulário</li>
              </ul>

              <h4>📝 Campos Obrigatórios</h4>
              <p>Os campos marcados com <code>*</code> (asterisco vermelho) são obrigatórios:</p>
              <ul>
                <li><strong>Cliente</strong> - Código do cliente (obrigatório)</li>
                <li><strong>Data Vencimento</strong> - Data de vencimento do título</li>
                <li><strong>Valor Original</strong> - Valor total do título (deve ser maior que 0)</li>
              </ul>

              <h4>💰 Cálculo de Valores</h4>
              <p>O <strong>Saldo</strong> é calculado automaticamente:</p>
              <ul>
                <li>Saldo = Valor Original + Acréscimo + Multa - Desconto - Valor Pago</li>
                <li>Valores devem ser formatados como: <code>1.254,00</code></li>
                <li>Não é necessário digitar "R$" - apenas os números</li>
              </ul>

              <h4>📅 Formatação de Datas</h4>
              <p>Todas as datas seguem o formato brasileiro:</p>
              <ul>
                <li>Formato: <code>DD/MM/AAAA</code></li>
                <li>Exemplo: 12/11/2025</li>
                <li>O sistema converte automaticamente para o banco de dados</li>
              </ul>

              <h4>🏢 Listas Dinâmicas</h4>
              <p>Os seguintes campos carregam opções do banco de dados:</p>
              <ul>
                <li><strong>Tipo de Documento</strong> - Lista de tipos cadastrados (NF, Duplicata, Boleto, etc.)</li>
                <li><strong>Departamento</strong> - Departamentos da empresa</li>
                <li><strong>Banco</strong> - Bancos cadastrados no sistema</li>
                <li><strong>Tipo de Cobrança</strong> - Formas de cobrança disponíveis</li>
              </ul>

              <h4>📝 Campos de Texto Livre</h4>
              <ul>
                <li><strong>Condição de Pagamento</strong> - Digite manualmente (ex: "À Vista", "30 dias", etc.)</li>
                <li><strong>Nosso Número</strong> - Número do boleto ou identificador bancário</li>
                <li><strong>Observações</strong> - Informações adicionais sobre o título</li>
              </ul>

              <h4>⚠️ Alterações Não Salvas</h4>
              <p>Se você tentar fechar o formulário com alterações não salvas, o sistema irá:</p>
              <ul>
                <li>Exibir um alerta de confirmação</li>
                <li>Permitir que você cancele e volte para continuar editando</li>
                <li>Ou confirme e descarte as alterações</li>
              </ul>

              <h4>❓ Precisa de Mais Ajuda?</h4>
              <p>Entre em contato com o suporte técnico se tiver dúvidas sobre:</p>
              <ul>
                <li>Cadastro de clientes</li>
                <li>Configuração de departamentos</li>
                <li>Regras de negócio específicas</li>
              </ul>
            </HelpContent>
          </HelpPopup>
        </>
)}

      {/* MODAL PESQUISA DE CLIENTE (F4) */}
      {showClienteModal && (
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
          onClick={() => setShowClienteModal(false)}
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
                Pesquisar Cliente
              </h3>
              <button
                onClick={() => setShowClienteModal(false)}
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
                  value={clienteSearch}
                  onChange={e => setClienteSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                {clienteSearch && (
                  <button
                    onClick={() => setClienteSearch('')}
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
              {loadingClientes ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Carregando clientes...
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                    {clientes.length > 0
                      ? `Exibindo ${getClientesOrdenados().length} de ${clientes.length} cliente(s)`
                      : 'Nenhum cliente encontrado'}
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
                          onClick={() => handleClienteSort('codigo_cli')}
                          style={{ padding: '8px 12px', textAlign: 'left', width: 110, cursor: 'pointer', userSelect: 'none', textDecoration: clienteSort.field === 'codigo_cli' ? 'underline' : 'none' }}
                          title="Clique para ordenar"
                        >
                          Código {clienteSort.field === 'codigo_cli' && (clienteSort.dir === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleClienteSort('nome_cli')}
                          style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', textDecoration: clienteSort.field === 'nome_cli' ? 'underline' : 'none' }}
                          title="Clique para ordenar"
                        >
                          Nome {clienteSort.field === 'nome_cli' && (clienteSort.dir === 'asc' ? '▲' : '▼')}
                        </th>
                        <th
                          onClick={() => handleClienteSort('cpf_cnpj_cli')}
                          style={{ padding: '8px 12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', textDecoration: clienteSort.field === 'cpf_cnpj_cli' ? 'underline' : 'none' }}
                          title="Clique para ordenar"
                        >
                          Documento {clienteSort.field === 'cpf_cnpj_cli' && (clienteSort.dir === 'asc' ? '▲' : '▼')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getClientesOrdenados()
                        .slice(0, 200)
                        .map((c: any) => (
                          <tr
                            key={c.codigo_cli}
                            onClick={() => handleClienteSelect(c)}
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
                            <td style={{ padding: '8px 12px' }}>{c.codigo_cli}</td>
                            <td style={{ padding: '8px 12px' }}>{c.nome_cli}</td>
                            <td style={{ padding: '8px 12px' }}>{c.cpf_cnpj_cli || c.cgccpf_cli || ''}</td>
                          </tr>
                        ))}
                      {getClientesOrdenados().length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}
                          >
                            Nenhum cliente encontrado
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
              Clique em um cliente para selecionar
            </div>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
};
export default ReceberFormModal;













