/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useMemo } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faCalculator, 
  // faSearch, // Removido: não utilizado
  faPlus, 
  faTrash,
  faBank,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

import { 
  FormularioCaixa, 
  DocumentoSelecionado, 
  Banco, 
  OperacaoCaixa, 
  Departamento 
} from 'CaixaBancos';
import { CaixaBancosService } from 'services/CaixaBancosService';

// Animação do spinner
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

// Overlay para mostrar progresso de salvamento
const SaveProgressOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const SaveProgressCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 40px 60px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const SpinnerIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
  animation: ${spin} 1s linear infinite;
`;

const SuccessIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr; /* reduzir largura para otimizar espaço */
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
`;

const SectionTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;

  &.full-width {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// Componente de busca incremental para Cliente/Fornecedor
const SearchableSelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
`;

const Textarea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  width: 100%;
  transition: border-color 0.2s ease;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchResultItem = styled.div<{ $selected?: boolean }>`
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  background-color: ${props => props.$selected ? '#dbeafe' : 'white'};

  &:hover {
    background-color: #f3f4f6;
  }

  &:last-child {
    border-bottom: none;
  }

  span {
    display: block;
    font-size: 13px;

    &.client-code {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 2px;
    }

    &.client-name {
      color: #6b7280;
      font-size: 12px;
    }
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
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
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover:not(:disabled) { background: #dc2626; }
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

// DocumentosSection removed — usamos DocumentosGrid diretamente no layout

const DocumentosGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const DocumentosColumn = styled.div`
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const DocumentosTableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const DocumentosTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: white;

  th, td {
    padding: 8px 6px;
    text-align: left;
    border-bottom: 1px solid #e1e5e9;
  }

  th {
    background: #f8fafc;
    font-weight: 600;
    color: #374151;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody tr:hover {
    background: #f1f5f9;
  }

  td:last-child {
    text-align: center;
    width: 60px;
  }
`;

const ValidationMessage = styled.div<{ type: 'success' | 'error' | 'warning' }>`
  padding: 12px;
  border-radius: 6px;
  margin: 15px 0;
  font-weight: 500;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        `;
      case 'warning':
        return `
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        `;
      default:
        return '';
    }
  }}
`;

// Floating payment form overlay
const FloatingOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const FloatingCard = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 480px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 24px;
`;

const FloatingTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
`;

const FloatingGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const FloatingField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.full-width {
    grid-column: 1 / -1;
  }
`;

const FloatingLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const FloatingInput = styled.input`
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  &:disabled, &[readonly] {
    background: #f3f4f6;
    color: #6b7280;
  }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 2px solid #e5e7eb;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
`;

const PartialPaymentBadge = styled.div`
  background: #fef3c7;
  color: #92400e;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 12px;
`;

const FloatingActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

interface CaixaBancosFormProps {
  initialPayload?: any;
  onClose?: (refresh?: boolean) => void;
  readOnlyPrimary?: boolean;
}

const CaixaBancosForm: React.FC<CaixaBancosFormProps> = ({ initialPayload, onClose, readOnlyPrimary = false }) => {
  // ✅ NOVO: Modo consulta (read-only) e modo edição
  const isReadOnly = readOnlyPrimary === true;
  const isEditMode = initialPayload?._mode === 'editar';

  // Pode desvincular documento se estiver em modo edição
  // (o parent component já validou a permissão de editar antes de abrir o form)
  const podeExcluirDocumento = !isReadOnly;
  
  const [formulario, setFormulario] = useState<FormularioCaixa>({
    banco_codigo: '',
    banco_nome: '',
    data_movimento: new Date().toLocaleDateString('pt-BR'),
    operacao_codigo: '',
    operacao_descricao: '',
    debito_credito: 'D',
    tipo_documento: '',
    departamento_codigo: '',
    departamento_descricao: '',
    valor_total: 0,
    historico: '',
    documentos_selecionados: []
  });

  const [bancos, setBancos] = useState<Banco[]>([]);
  const [operacoes, setOperacoes] = useState<OperacaoCaixa[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);
  const [filtroClienteSearch, setFiltroClienteSearch] = useState('');
  const [clienteInputFocused, setClienteInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState<{message: string; success: boolean} | null>(null);
  const [savingEstorno, setSavingEstorno] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ message: string; title?: string; type?: 'success' | 'error' | 'warning' | 'info'; callback?: () => void } | null>(null);

  const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'warning', title?: string, callback?: () => void) => {
    setCustomAlert({ message, type, title, callback });
  };

  const [loadingClientes, setLoadingClientes] = useState(false);
  const [documentosDisponiveis, setDocumentosDisponiveis] = useState<any[]>([]);
  const [validacao, setValidacao] = useState<any>(null);
  const initialProcessingRef = useRef<boolean>(false);
  const documentosDisponiveisFullRef = useRef<any[]>([]);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedDocForPayment, setSelectedDocForPayment] = useState<any | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    dtpag: '',
    dtpagi: '',
    vlrsal: 0,
    valor_pago: 0,
    desconto: 0,
    juros: 0,
    multa: 0
  });

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // ✅ NOVO: Processar initialPayload quando chegar (com CHAVE COMPOSTA)
  // ⚠️ IMPORTANTE: Aguarda carregarDadosIniciais() terminar para garantir que
  // os selects (Bancos, Operações, etc) já foram populados
  useEffect(() => {
    if (initialPayload && !loading) {
      processarInitialPayload(initialPayload);
    }
  }, [initialPayload, loading]);

  // ✅ CRÍTICO: Disparar processarInitialPayload quando arrays estão REALMENTE carregadas
  // Aguarda: loading=false AND arrays tem dados
  useEffect(() => {
    if (
      initialPayload &&
      !loading &&
      bancos.length > 0 &&
      operacoes.length > 0 &&
      departamentos.length > 0
    ) {
      console.log('[CaixaBancosForm] 🔥 Arrays prontas, disparando processarInitialPayload');
      console.log('[CaixaBancosForm] Bancos:', bancos.length, 'Operações:', operacoes.length, 'Departamentos:', departamentos.length);
      processarInitialPayload(initialPayload);
    }
  }, [loading, bancos.length, operacoes.length, departamentos.length, initialPayload]);

  // ✅ Função dedicada para processar initialPayload (editar movimento)
  const processarInitialPayload = async (payload: any) => {
    // sinalizador para suprimir efeitos que limpam documentos enquanto processamos o payload
    initialProcessingRef.current = true;
    try {
      console.log('[CaixaBancosForm.processarInitialPayload] ⏳ INICIANDO PROCESSAMENTO');
      // Identificar origem da abertura para diferenciar payloads (report vs caixa list)
      const pageLocation = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : (document && document.referrer) || 'unknown';
      console.log('[CaixaBancosForm.processarInitialPayload] Origem da abertura (pageLocation/referrer):', pageLocation);
      console.log('[CaixaBancosForm.processarInitialPayload] ⤷ Chaves do payload:', Object.keys(payload || {}));
      console.log('[CaixaBancosForm.processarInitialPayload] Payload recebido:', payload);
      console.log('[CaixaBancosForm.processarInitialPayload] Estado de loading:', loading);
      console.log('[CaixaBancosForm.processarInitialPayload] Bancos carregados:', bancos.length, '- Arrays:', bancos.map((b: any) => b.nome_bco));
      console.log('[CaixaBancosForm.processarInitialPayload] Operações carregadas:', operacoes.length, '- Arrays:', operacoes.map((o: any) => o.descr_ocai));
      console.log('[CaixaBancosForm.processarInitialPayload] Departamentos carregados:', departamentos.length, '- Arrays:', departamentos.map((d: any) => `${d.codigo_scd}:${d.descr_scd}`));
      
      const mapped: any = {};

      const parseCurrency = (v: any): number => {
        if (v == null) return 0;
        if (typeof v === 'number') return Math.round(v * 100) / 100;
        let s = String(v).trim();
        // remove currency symbol and spaces
        s = s.replace(/R\$|\s/g, '');
        // replace thousand separators (.) and normalize decimal comma to dot
        s = s.replace(/\./g, '').replace(/,/g, '.');
        const n = parseFloat(s);
        return isNaN(n) ? 0 : Math.round(n * 100) / 100;
      };
      
      // ✅ Mapear campos primários do caixa
      // ✅ CORRIGIDO: usar codbanco_cai (código do banco)
      if (payload.codbanco_cai) mapped.banco_codigo = payload.codbanco_cai;
      if (payload.dtmovi_cai) mapped.data_movimento = CaixaBancosService.formatarData(payload.dtmovi_cai);
      if (payload.seq_cai || payload.sequencia) {
        mapped.sequencia = payload.seq_cai || payload.sequencia;
        console.log('[CaixaBancosForm] Sequência definida:', mapped.sequencia);
      }
      if (payload.tipo_documento) {
        mapped.tipo_documento = payload.tipo_documento;
        console.log('[CaixaBancosForm] Tipo de documento definido:', mapped.tipo_documento);
      }
      
      // ✅ Mapear CHAVE COMPOSTA para vincular documentos
      mapped.cliente_cai = payload.cliente_cai;  // Para buscar documentos vinculados
      mapped.dtmovi_cai = payload.dtmovi_cai;
      mapped.seq_cai = payload.seq_cai;
      
      // ✅ Campos adicionais do caixa
      if (payload.valor_cai || payload.valor) {
        mapped.valor_total = parseCurrency(payload.valor_cai || payload.valor);
      }
      if (payload.dc_cai) {
        mapped.debito_credito = payload.dc_cai === 'C' ? 'C' : 'D';
      }
      
      // ✅ NOVO: Popular BANCO (tolerante: comparar por código com normalização, numérico e por nome)
      if (payload.nome_cai || payload.codbanco_cai) {
        const rawVal = payload.codbanco_cai ? String(payload.codbanco_cai).trim() : '';
        const nameVal = payload.nome_cai ? String(payload.nome_cai).trim() : '';

        const findBancoTolerante = () => {
          if (!bancos || bancos.length === 0) return null;
          // 1) igualdade direta (string)
          let banco = bancos.find((b: any) => String(b.codigo_bco).trim() === rawVal);
          if (banco) return banco;

          // 2) remover zeros à esquerda e comparar
          if (rawVal) {
            const norm = rawVal.replace(/^0+/, '');
            banco = bancos.find((b: any) => String(b.codigo_bco).replace(/^0+/, '') === norm);
            if (banco) return banco;
          }

          // 3) comparar numericamente quando possível
          if (rawVal && !isNaN(Number(rawVal))) {
            const nVal = Number(rawVal);
            banco = bancos.find((b: any) => !isNaN(Number(b.codigo_bco)) && Number(b.codigo_bco) === nVal);
            if (banco) return banco;
          }

          // 4) busca por nome (case-insensitive, contains)
          if (nameVal) {
            const lc = nameVal.toLowerCase();
            banco = bancos.find((b: any) => (b.nome_bco || b.nomefan_bco || '').toLowerCase().includes(lc));
            if (banco) return banco;
          }

          // 5) tentar match por nome alternativo vindo no payload
          const altName = payload.nomefan_bco || payload.banco_nome || payload.banco || '';
          if (altName) {
            const lcAlt = String(altName).toLowerCase();
            banco = bancos.find((b: any) => (b.nome_bco || b.nomefan_bco || '').toLowerCase().includes(lcAlt));
            if (banco) return banco;
          }

          return null;
        };

        const bancoBuscado = findBancoTolerante();
        if (bancoBuscado) {
          mapped.banco_codigo = bancoBuscado.codigo_bco;
          mapped.banco_nome = bancoBuscado.nome_bco || bancoBuscado.nomefan_bco;
          mapped.banco = bancoBuscado.nome_bco || bancoBuscado.nomefan_bco;
          console.log('[CaixaBancosForm] Banco (tolerante) encontrado:', { codigo: bancoBuscado.codigo_bco, nome: mapped.banco_nome });
        } else if (payload.codbanco_cai) {
          // Fallback: usar código direto para permitir edição ou apenas exibição
          mapped.banco_codigo = payload.codbanco_cai;
          mapped.banco_nome = payload.nome_cai || payload.nomefan_bco || '';
          console.log('[CaixaBancosForm] ⚠️ Banco não encontrado na lista, usando código direto/fallback:', payload.codbanco_cai);
        }
      }
      
      // ✅ NOVO: Popular OPERAÇÃO (usando operacao_ocai que é o código)
      // aceitar múltiplas variações de nomes de campo para operação
      const operacaoPayload = payload.operacao_cai || payload.operacao_ocai || payload.oper_cai || payload.operacao || payload.operacao_codigo || payload.operacao_id;
      if (operacaoPayload) {
        // Procurar operação na lista carregada por CÓDIGO primeiro (mais confiável)
        const normOpPayload = String(operacaoPayload).trim();
        const normOpPayloadNoZeros = normOpPayload.replace(/^0+/, '');
        const operBuscada = operacoes.find((o: any) => {
          const code = String(o.operacao_ocai || '').trim();
          const codeNoZeros = code.replace(/^0+/, '');
          const descr = String(o.descr_ocai || '').toLowerCase();
          return code === normOpPayload || codeNoZeros === normOpPayloadNoZeros || descr.includes(normOpPayload.toLowerCase());
        });
        if (operBuscada) {
          mapped.operacao_codigo = operBuscada.operacao_ocai;
          mapped.operacao_descricao = operBuscada.descr_ocai;
          mapped.operacao = operBuscada.descr_ocai;
          console.log('[CaixaBancosForm] Operação encontrada:', { codigo: operBuscada.operacao_ocai, descricao: operBuscada.descr_ocai });
        } else {
          // Fallback: usar código direto
          mapped.operacao_codigo = operacaoPayload;
          mapped.operacao_descricao = payload.oper_cai || payload.operacao || '';
          console.log('[CaixaBancosForm] ⚠️ Operação não encontrada na lista, usando código direto:', operacaoPayload);
        }
      }
      
      
      // ✅ NOVO: Popular CENTRO DE CUSTO (usando dpto_cai - tabela scodep, não masdep!)
      // IMPORTANTE: dpto_cai armazena código do centro de custo (tabela scodep)
      //             masdep é departamento, NÃO é usado para caixa/bancos
      // aceitar variações para centro de custo / departamento
      const dptoPayload = payload.dpto_cai || payload.dpto || payload.departamento || payload.departamento_codigo || payload.dep_cai;
      if (dptoPayload) {
        // Procurar centro de custo na lista (buscar por CÓDIGO - mais confiável)
        const normDpto = String(dptoPayload).trim();
        const normDptoNoZeros = normDpto.replace(/^0+/, '');
        const depBuscado = departamentos?.find((d: any) => {
          const code = String(d.codigo_scd || '').trim();
          const codeNoZeros = code.replace(/^0+/, '');
          return code === normDpto || codeNoZeros === normDptoNoZeros || String(d.descr_scd || '').toLowerCase().includes(normDpto.toLowerCase());
        });
        if (depBuscado) {
          mapped.departamento_codigo = depBuscado.codigo_scd;
          mapped.departamento_descricao = depBuscado.descr_scd;
          console.log('[CaixaBancosForm] Centro de custo encontrado (scodep):', { codigo: depBuscado.codigo_scd, descricao: depBuscado.descr_scd });
        } else {
          // Fallback: usar código direto
          mapped.departamento_codigo = dptoPayload;
          console.log('[CaixaBancosForm] ⚠️ Centro de custo não encontrado na lista, usando código direto:', dptoPayload);
        }
      }
      
      if (payload.histor_cai) {
        mapped.historico = payload.histor_cai;
      }

      // ✅ CRÍTICO: Popular documentos selecionados direto do payload (já vem de abrirFormularioCaixaPopup)
      // aceitar várias chaves possíveis para documentos vinculados
      const docsPayload = payload.documentos_vinculados || payload.documentos_selecionados || payload.documentosSelecionados || payload.documentos || payload.documentos_vinc;
      console.log('[CaixaBancosForm.processarInitialPayload] 📄 Verificando documentos vinculados no payload...');
      console.log('[CaixaBancosForm.processarInitialPayload] docsPayload (possíveis chaves):', docsPayload);
      if (Array.isArray(docsPayload) && docsPayload.length > 0) {
        console.log('[CaixaBancosForm.processarInitialPayload] Chaves do primeiro documento:', Object.keys(docsPayload[0]));
      }
      console.log('[CaixaBancosForm.processarInitialPayload] É array?:', Array.isArray(docsPayload));
      console.log('[CaixaBancosForm.processarInitialPayload] Comprimento:', docsPayload?.length || 0);

      if (docsPayload && Array.isArray(docsPayload) && docsPayload.length > 0) {
        console.log('[CaixaBancosForm.processarInitialPayload] ✅ Documentos vinculados encontrados! Mapeando...');
        mapped.documentos_selecionados = docsPayload.map((d: any) => {
          const mapped_doc = {
            id: d.id || d.receber_id || d.pagar_id,
            tipo: d.tipo || payload.tipo_documento || 'R',
            codigo_cliente: d.codigo_cliente || d.codigo_rec || d.codigo_pag || '',
            nome_cliente: d.nome_cliente || d.nomefan_cli || d.nomefan_for || '',
            documento: d.documento || d.numdup_rec || d.numdup_pag || '',
            parcela: d.parcela || d.parc_rec || d.parc_pag || '',
            valor_original: parseCurrency(d.valor_original ?? d.vlrtot ?? d.vlrtot_rec ?? d.vlrtot_pag),
            valor_aberto: parseCurrency(d.valor_aberto ?? d.vlrsal ?? d.vlrsal_rec ?? d.vlrsal_pag),
            valor_selecionado: parseCurrency(d.valor_selecionado ?? d.vlrsal ?? d.vlrsal_rec ?? d.vlrsal_pag),
            acrescimo: parseCurrency(d.acrescimo ?? d.vlracre ?? d.vlracre_rec ?? d.vlracre_pag),
            desconto: parseCurrency(d.desconto ?? d.vlrdesc ?? d.vlrdesc_rec ?? d.vlrdesc_pag),
            data_vencimento: d.data_vencimento || ''
          };
          console.log('[CaixaBancosForm] Documento mapeado:', mapped_doc);
          return mapped_doc;
        });
        console.log('[CaixaBancosForm.processarInitialPayload] ✅ Total de documentos mapeados:', mapped.documentos_selecionados.length);
      } else {
        console.log('[CaixaBancosForm.processarInitialPayload] ⚠️ Nenhum documento vinculado no payload');
      }
      
      console.log('[CaixaBancosForm] Dados mapeados:', mapped);
      setFormulario(prev => ({ ...prev, ...mapped }));

      // Se o payload não trouxe documentos vinculados, tentar buscar vinculados no backend
      // usando a chave composta (codbanco / dtmovi / seq). Primeiro tentamos RECEBER, depois PAGAR.
      if ((!docsPayload || (Array.isArray(docsPayload) && docsPayload.length === 0))
          && mapped.banco_codigo && mapped.dtmovi_cai && mapped.seq_cai) {
        try {
          console.log('[CaixaBancosForm] Tentando buscar documentos vinculados no backend (receber/pagar)...');
          // manter flag de processamento enquanto buscamos
          initialProcessingRef.current = true;

          // procurar em RECEBER
          const receber = await CaixaBancosService.buscarDocumentosReceberVinculados(mapped.banco_codigo, mapped.dtmovi_cai, mapped.seq_cai);
          if (Array.isArray(receber) && receber.length > 0) {
            console.log('[CaixaBancosForm] Documentos RECEBER vinculados encontrados:', receber.length);
            const mappedDocs: DocumentoSelecionado[] = receber.map((d: any) => ({
              id: d.receber_id || d.id,
              tipo: 'R',
              codigo_cliente: d.codigo_rec || d.codigo_cli || d.codigo_cliente || '',
              nome_cliente: d.nome_cli || d.nomfan_cli || '',
              documento: d.numdup_rec || d.documento || '',
              parcela: d.parcela || d.parc_rec || d.parc || '',
              valor_original: parseCurrency(d.vlrtot_rec ?? d.vlrtot),
              valor_aberto: parseCurrency(d.vlrsal_rec ?? d.vlrsal),
              // ✅ CORRIGIDO: Se é vinculado, o valor selecionado deve ser o valor que foi PAGO no movimento
              valor_selecionado: parseCurrency(d.vlrpag_rec ?? d.vlrpag ?? d.vlrsal_rec ?? d.vlrsal),
              juros: parseCurrency(d.vlracre_rec ?? d.vlracre ?? d.juros),
              multa: parseCurrency(d.vlrmulta_rec ?? d.vlrmulta ?? d.multa),
              pago: parseCurrency(d.vlrpag_rec ?? d.vlrpag ?? d.pago),
              acrescimo: parseCurrency(d.vlracre_rec ?? d.vlracre),
              desconto: parseCurrency(d.vlrdesc_rec ?? d.vlrdesc),
              data_vencimento: d.dtvenci_rec || d.dtvenci || ''
            })) as DocumentoSelecionado[];
            const docCliCod = mappedDocs[0]?.codigo_cliente || mapped.codigo_cliente || '';
            const docCliNom = mappedDocs[0]?.nome_cliente || mapped.nome_cliente || '';
            if (docCliCod) {
              setFiltroClienteSearch(docCliNom ? `${String(docCliCod).trim()} - ${String(docCliNom).trim()}` : String(docCliCod).trim());
            }

            setFormulario(prev => ({
              ...prev,
              tipo_documento: 'R',
              codigo_cliente: docCliCod || prev.codigo_cliente,
              nome_cliente: docCliNom || prev.nome_cliente,
              documentos_selecionados: mappedDocs
            }));
            setDocumentosDisponiveis([]);
          } else {
            // tentar PAGAR
            const pagar = await CaixaBancosService.buscarDocumentosPagarVinculados(mapped.banco_codigo, mapped.dtmovi_cai, mapped.seq_cai);
            if (Array.isArray(pagar) && pagar.length > 0) {
              console.log('[CaixaBancosForm] Documentos PAGAR vinculados encontrados:', pagar.length);
              const mappedDocs: DocumentoSelecionado[] = pagar.map((d: any) => ({
                id: d.pagar_id || d.id,
                tipo: 'P',
                codigo_cliente: d.codigo_pag || d.codigo_for || d.codigo_fornecedor || '',
                nome_cliente: d.nome_for || d.nomfan_for || '',
                documento: d.numdup_pag || d.documento || '',
                parcela: d.parcela || d.parc_pag || d.parc || '',
                valor_original: parseCurrency(d.vlrtot_pag ?? d.vlrtot),
                valor_aberto: parseCurrency(d.vlrsal_pag ?? d.vlrsal),
                // ✅ CORRIGIDO: Se é vinculado, o valor selecionado deve ser o valor que foi PAGO no movimento
                valor_selecionado: parseCurrency(d.vlrpag_pag ?? d.vlrpag ?? d.vlrsal_pag ?? d.vlrsal),
                juros: parseCurrency(d.vlracre_pag ?? d.vlracre ?? d.juros),
                multa: parseCurrency(d.vlrmulta_pag ?? d.vlrmulta ?? d.multa),
                pago: parseCurrency(d.vlrpag_pag ?? d.vlrpag ?? d.pago),
                acrescimo: parseCurrency(d.vlracre_pag ?? d.vlracre),
                desconto: parseCurrency(d.vlrdesc_pag ?? d.vlrdesc),
                data_vencimento: d.dtvenci_pag || d.dtvenci || ''
              })) as DocumentoSelecionado[];

              const docCliCod = mappedDocs[0]?.codigo_cliente || mapped.codigo_cliente || '';
              const docCliNom = mappedDocs[0]?.nome_cliente || mapped.nome_cliente || '';
              if (docCliCod) {
                setFiltroClienteSearch(docCliNom ? `${String(docCliCod).trim()} - ${String(docCliNom).trim()}` : String(docCliCod).trim());
              }

              setFormulario(prev => ({
                ...prev,
                tipo_documento: 'P',
                codigo_cliente: docCliCod || prev.codigo_cliente,
                nome_cliente: docCliNom || prev.nome_cliente,
                documentos_selecionados: mappedDocs
              }));
              setDocumentosDisponiveis([]);
            } else {
              console.log('[CaixaBancosForm] Nenhum documento vinculado encontrado no backend');
              setFormulario(prev => ({ ...prev, documentos_selecionados: [] }));
            }
          }
        } catch (err) {
          console.warn('[CaixaBancosForm] Erro ao buscar documentos vinculados automaticamente:', err);
          // manter estado atual, não sobrescrever documentos existentes
        } finally {
          setTimeout(() => {
            initialProcessingRef.current = false;
          }, 100);
        }
      } else {
        // Documentos disponíveis vazios quando o payload explicitamente não traz documentos
        setDocumentosDisponiveis([]);
        console.log('[CaixaBancosForm.processarInitialPayload] ℹ️ Nenhum documento vinculado encontrado no payload');
        // liberar flag de processamento
        setTimeout(() => {
          initialProcessingRef.current = false;
        }, 100);
      }

      console.log('[CaixaBancosForm.processarInitialPayload] ✅ PROCESSAMENTO CONCLUÍDO');
    } catch (e) {
      console.error('[CaixaBancosForm] ❌ Erro ao processar initialPayload:', e);
      setTimeout(() => {
        initialProcessingRef.current = false;
      }, 100);
    }
  };

  // Fechar o formulário com ESC e voltar para o workspace/menu anterior
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();  // ⚠️ Previne propagação
        e.stopPropagation();  // ⚠️ Previne propagação
        try {
          if (onClose) {
            console.log('[CaixaBancosForm] 🔴 ESC pressionado - chamando onClose()');
            onClose(false);
            return;
          }
          window.history.back();
        } catch (err) {
          console.warn('Não foi possível navegar para trás:', err);
        }
      }
    };

    window.addEventListener('keydown', handleEsc, true);  // true = capture phase para garantir prioridade
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [onClose]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (formulario.tipo_documento && formulario.codigo_cliente) {
      carregarDocumentosAbertos();
    }
  }, [formulario.tipo_documento, formulario.codigo_cliente]);

  // ✅ Buscar nome do cliente quando a lista de clientes carregar (após initialPayload)
  useEffect(() => {
    if (clientes.length > 0 && formulario.codigo_cliente && !formulario.nome_cliente) {
      const found = clientes.find((c: any) =>
        String(c.codigo_cli).trim() === String(formulario.codigo_cliente).trim()
      );
      if (found) {
        const nome_encontrado = found.nomfan_cli || found.nome_cli || '';
        if (nome_encontrado) {
          setFormulario(prev => ({ ...prev, nome_cliente: nome_encontrado }));
          setFiltroClienteSearch(`${formulario.codigo_cliente} - ${nome_encontrado}`);
        }
      }
    }
  }, [clientes]);

  // ✅ Ao mudar tipo de documento, carregar a lista de clientes/fornecedores correspondente
  useEffect(() => {
    if (formulario.tipo_documento) {
      carregarClientes();
    }
  }, [formulario.tipo_documento]);

  // ✅ Sincronizar valor_total com a soma dos documentos selecionados no grid (apenas se houver documentos)
  useEffect(() => {
    if (initialProcessingRef.current) {
      console.log('[CaixaBancosForm] Supressão de sincronização de valor_total durante processamento do payload inicial');
      return;
    }
    if (formulario.tipo_documento === 'R' || formulario.tipo_documento === 'P') {
      if (formulario.documentos_selecionados.length > 0) {
        const soma = formulario.documentos_selecionados.reduce((acc, doc) => acc + (doc.valor_selecionado || 0), 0);
        if (formulario.valor_total !== soma) {
          setFormulario(prev => ({
            ...prev,
            valor_total: parseFloat(soma.toFixed(2))
          }));
        }
      }
    }
  }, [formulario.documentos_selecionados, formulario.tipo_documento]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    validarFormulario();
  }, [formulario.valor_total, formulario.documentos_selecionados]);

  const carregarDadosIniciais = async () => {
    try {
      setLoading(true);
      setErro(null);
      const [bancosData, operacoesData, departamentosData] = await Promise.all([
        CaixaBancosService.listarBancos(),
        CaixaBancosService.listarOperacoesCaixa(),
        CaixaBancosService.listarDepartamentos()
      ]);

      console.log('📊 Dados carregados:', { bancos: bancosData.length, operacoes: operacoesData.length, departamentos: departamentosData.length });

      if (!bancosData || bancosData.length === 0) {
        setErro('⚠️ Nenhum banco disponível. Verifique a conexão com o banco de dados.');
      }

      setBancos(bancosData);
      setOperacoes(operacoesData);
      setDepartamentos(departamentosData);
    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
      setErro(`Erro ao carregar dados: ${error instanceof Error ? error.message : String(error)}`);
      setBancos([]);
      setOperacoes([]);
      setDepartamentos([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOVO: Carrega documentos DISPONÍVEIS para um cliente/fornecedor específico
  // Esses são documentos que NÃO foram vinculados a nenhum movimento de caixa ainda
  const carregarDocumentosAbertosComCliente = async (codigoCliente: string, tipoDoc: string) => {
    if (!codigoCliente || !tipoDoc) {
      console.warn('[CaixaBancosForm.carregarDocumentosAbertosComCliente] Cliente ou tipo ausente', { codigoCliente, tipoDoc });
      documentosDisponiveisFullRef.current = [];
      setDocumentosDisponiveis([]);
      return;
    }

    try {
      console.log('[CaixaBancosForm.carregarDocumentosAbertosComCliente] Carregando para', { codigoCliente, tipoDoc });
      let documentos: any[] = [];
      if (tipoDoc === 'R') {
        // ✅ Contas a Receber: usar função DISPONÍVEIS (sem cxbco_rec)
        documentos = await CaixaBancosService.listarDocumentosReceberDisponiveis(codigoCliente);
      } else if (tipoDoc === 'P') {
        // ✅ Contas a Pagar: usar função DISPONÍVEIS (sem cxbco_pag)
        documentos = await CaixaBancosService.listarDocumentosPagarDisponiveis(codigoCliente);
      }
      console.log(`[CaixaBancosForm.carregarDocumentosAbertosComCliente] Carregados ${documentos.length} documentos disponíveis`);
      documentosDisponiveisFullRef.current = documentos;
      setDocumentosDisponiveis(documentos);
    } catch (error) {
      console.error('[CaixaBancosForm.carregarDocumentosAbertosComCliente] Erro:', error);
      documentosDisponiveisFullRef.current = [];
      setDocumentosDisponiveis([]);
    }
  };

  // DEPRECATED: Use carregarDocumentosAbertosComCliente ao invés
  const carregarDocumentosAbertos = async () => {
    if (!formulario.codigo_cliente) {
      setDocumentosDisponiveis([]);
      return;
    }

    try {
      let documentos = [];
      if (formulario.tipo_documento === 'R') {
        // Contas a Receber: documentos em aberto (dtpagi_rec IS NULL)
        documentos = await CaixaBancosService.listarDocumentosReceberDisponiveis(String(formulario.codigo_cliente));
      } else {
        // Contas a Pagar: documentos em aberto (dtpagi_pag IS NULL)
        documentos = await CaixaBancosService.listarDocumentosPagarDisponiveis(String(formulario.codigo_cliente));
      }
      documentosDisponiveisFullRef.current = documentos;
      setDocumentosDisponiveis(documentos);
    } catch (error) {
      console.error('Erro ao carregar documentos abertos:', error);
      documentosDisponiveisFullRef.current = [];
      setDocumentosDisponiveis([]);
    }
  };

  const carregarClientes = async (term?: string) => {
    try {
      setLoadingClientes(true);
      const tipoCliente = formulario.tipo_documento === 'R' ? 'C' : 'F';
      // Support optional server-side query param 'q' for containing search
      const qterm = (term ?? filtroClienteSearch) && (term ?? filtroClienteSearch).trim().length > 0 ? `&q=${encodeURIComponent((term ?? filtroClienteSearch).trim())}` : '';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/clientes?cliforn_cli=${tipoCliente}${qterm}&limit=100`);
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      const data = await response.json();
      setClientes(data);
      setClientesFiltrados(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
      setClientesFiltrados([]);
      return [];
    } finally {
      setLoadingClientes(false);
    }
  };

  const validarFormulario = () => {
    if (formulario.valor_total > 0 && formulario.documentos_selecionados.length > 0) {
      const validacao = CaixaBancosService.validarMovimento(
        formulario.valor_total, 
        formulario.documentos_selecionados
      );
      setValidacao(validacao);
    } else {
      setValidacao(null);
    }
  };

  const handleInputChange = (field: keyof FormularioCaixa, value: any) => {
    setFormulario(prev => ({ ...prev, [field]: value }));
  };

  const handleTipoDocumentoChange = async (novoTipo: FormularioCaixa['tipo_documento']) => {
    // 1. Atualizar o tipo_documento no formulário e limpar os dados de cliente/documento
    setFormulario(prev => ({
      ...prev,
      tipo_documento: novoTipo,
      codigo_cliente: undefined,
      nome_cliente: undefined,
      documentos_selecionados: []
    }));
    setFiltroClienteSearch('');
    setDocumentosDisponiveis([]);
    
    // 2. Carregar os clientes/fornecedores baseados no novo tipo
    if (novoTipo) {
      try {
        setLoadingClientes(true);
        const tipoCliente = novoTipo === 'R' ? 'C' : 'F';
        const response = await fetch(`${process.env.REACT_APP_API_URL}/clientes?cliforn_cli=${tipoCliente}&limit=100`);
        if (!response.ok) throw new Error('Erro ao buscar clientes');
        const data = await response.json();
        setClientes(data);
        setClientesFiltrados(data);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setClientes([]);
        setClientesFiltrados([]);
      } finally {
        setLoadingClientes(false);
      }
    } else {
      setClientes([]);
      setClientesFiltrados([]);
    }
  };

  const handleBancoChange = (codigoBanco: string) => {
    const banco = bancos.find(b => b.codigo_bco === codigoBanco);
    setFormulario(prev => ({
      ...prev,
      banco_codigo: codigoBanco,
      banco_nome: banco?.nome_bco || ''
    }));
  };

  const handleOperacaoChange = (codigoOperacao: string) => {
    const operacao = operacoes.find(o => o.operacao_ocai === codigoOperacao);
    // Prefer common fields: tipo_ocai, dc_ocai, dc
    const dcValue = operacao?.tipo_ocai || (operacao as any)?.dc_ocai || (operacao as any)?.dc;
    const dcNormalized = dcValue === 'C' ? 'C' : 'D';
    setFormulario(prev => ({
      ...prev,
      operacao_codigo: codigoOperacao,
      operacao_descricao: operacao?.descr_ocai || '',
      // Auto-preencher D/C baseado na operação (aceita tipo_ocai ou dc_ocai)
      debito_credito: dcNormalized
    }));
  };

  const handleDepartamentoChange = (codigoDepartamento: string) => {
    const departamento = departamentos.find(d => d.codigo_scd === codigoDepartamento);
    setFormulario(prev => ({
      ...prev,
      departamento_codigo: codigoDepartamento,
      departamento_descricao: departamento?.descr_scd || ''
    }));
  };

  // Filtrar clientes/fornecedores com busca incremental
  // Debounced search: update filtro and perform dynamic search (containing)
  const clienteSearchTimer = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const handleClienteSearchChange = (termo: string) => {
    setFiltroClienteSearch(termo);
    // immediate local filter to provide instant feedback while server search is debounced
    const termoTrimImmediate = termo.trim();
    if (termoTrimImmediate === '') {
      setClientesFiltrados(clientes);
    } else {
      const termoLowerImmediate = termoTrimImmediate.toLowerCase();
      const localFiltered = (clientes || []).filter((cliente: any) => {
        const codeMatch = String(cliente.codigo_cli || '').includes(termoTrimImmediate);
        const name = (cliente.nome_cli || cliente.nomfan_cli || '').toLowerCase();
        const nameMatch = name.includes(termoLowerImmediate);
        return codeMatch || nameMatch;
      });
      setClientesFiltrados(localFiltered);
    }

    if (clienteSearchTimer.current) clearTimeout(clienteSearchTimer.current);
    clienteSearchTimer.current = setTimeout(async () => {
      const termoTrim = termo.trim();
      if (termoTrim === '') {
        setClientesFiltrados(clientes);
        return;
      }

      // Try server-side filtering if available, otherwise fallback to client-side contains
      try {
        const data = await carregarClientes(termoTrim); // pass immediate term
        const termoLower = termoTrim.toLowerCase();
        const filtrados = (data || []).filter((cliente: any) => {
          const codeMatch = String(cliente.codigo_cli || '').includes(termoTrim);
          const name = (cliente.nome_cli || cliente.nomfan_cli || '').toLowerCase();
          const nameMatch = name.includes(termoLower);
          return codeMatch || nameMatch;
        });
        setClientesFiltrados(filtrados.length ? filtrados : data);
      } catch (err) {
        console.error('Erro na busca de clientes:', err);
        setClientesFiltrados(clientes);
      }
    }, 300);
    // Reafirmar foco para evitar perda inesperada ao atualizar clientes
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // ✅ Handler ao selecionar cliente da lista de busca
  const handleClienteSelect = (cliente: any) => {
    console.log('[CaixaBancosForm.handleClienteSelect] Cliente selecionado:', cliente);
    handleInputChange('codigo_cliente', cliente.codigo_cli);
    handleInputChange('nome_cliente', cliente.nome_cli || cliente.nomfan_cli);
    setFiltroClienteSearch(`${cliente.codigo_cli} - ${cliente.nomfan_cli || cliente.nome_cli}`);
    
    // ✅ Colapsar dropdown imediatamente
    setClienteInputFocused(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    
    // ✅ IMEDIATAMENTE carregar documentos disponíveis deste cliente
    carregarDocumentosAbertosComCliente(cliente.codigo_cli, formulario.tipo_documento);
  };

  // Quando tipo_documento muda, resetar filtro e mostrar todos os clientes
  // NOTE: Não incluir `clientes` nas dependências, para não limpar o filtro
  // enquanto o usuário digita (causava desaparecimento da lista).
  useEffect(() => {
    setFiltroClienteSearch('');
    setClientesFiltrados(clientes);
  }, [formulario.tipo_documento]);

  // Memoize displayed clientes to avoid re-creating arrays on each render
  const displayedClientes = useMemo(() => {
    return (clientesFiltrados && clientesFiltrados.length > 0) ? clientesFiltrados : clientes;
  }, [clientesFiltrados, clientes]);

  // Keep focus on input if user is typing and client list updates
  useEffect(() => {
    if (filtroClienteSearch && clienteInputFocused) {
      searchInputRef.current?.focus();
    }
  }, [displayedClientes.length, filtroClienteSearch, clienteInputFocused]);

  const adicionarDocumento = (documento: any) => {
    // ✅ Validar que tipo_documento está setado
    if (!formulario.tipo_documento) {
      showAlert('Selecione o tipo de documento (Receber/Pagar) antes de adicionar', 'warning', 'Aviso');
      return;
    }

    // ✅ Validar que documento não está duplicado
    const docId = documento.receber_id || documento.pagar_id;
    if (formulario.documentos_selecionados.some(sel => sel.id === docId)) {
      showAlert('Documento já foi selecionado', 'warning', 'Aviso');
      return;
    }

    // ✅ Sempre usar tipo_documento do formulário como FONTE DE VERDADE
    const documentoSelecionado: DocumentoSelecionado = {
      id: docId,
      tipo: formulario.tipo_documento as 'R' | 'P',
      codigo_cliente: formulario.codigo_cliente || documento.codigo_rec || documento.codigo_pag,
      nome_cliente: formulario.nome_cliente || documento.nome_cli || 'Nome não informado',
      documento: documento.numdup_rec || documento.numdup_pag || documento.docto_rec || documento.docto_pag,
      parcela: documento.parc_rec || documento.parc_pag,
      valor_original: documento.vlrtot_rec || documento.vlrtot_pag,
      valor_aberto: documento.vlrsal_rec || documento.vlrsal_pag,
      valor_selecionado: documento.vlrsal_rec || documento.vlrsal_pag,
      juros: documento.vlracre_rec || documento.vlracre_pag || 0,
      multa: documento.vlrmulta_rec || documento.vlrmulta_pag || documento.vlrmult_pag || 0,
      desconto: documento.vlrdesc_rec || documento.vlrdesc_pag || 0,
      pago: documento.vlrpag_rec || documento.vlrpag_pag || 0,
      acrescimo: 0, // Deprecado, mas mantido para compatibilidade
      // ✅ Aceitar AMBAS as variações de data (novo padrão + legado)
      data_vencimento: documento.dtvenci_rec || documento.dtvenci_pag || documento.dtvenc_rec || documento.dtvenc_pag || ''
    };

    console.log('[CaixaBancosForm.adicionarDocumento] Adicionando:', documentoSelecionado);
    
    // ✅ NOVO: Popular o cliente automaticamente
    setFormulario(prev => ({
      ...prev,
      codigo_cliente: documento.codigo_rec || documento.codigo_pag || prev.codigo_cliente,
      nome_cliente: documento.nome_cli || prev.nome_cliente,
      documentos_selecionados: [...prev.documentos_selecionados, documentoSelecionado]
    }));
    
    // ✅ Limpar o filtro de busca
    setFiltroClienteSearch('');
  };

  const abrirFormularioPagamento = (doc: any) => {
    const vlrsal = doc.vlrsal_rec || doc.vlrsal_pag || 0;
    setSelectedDocForPayment(doc);
    setPaymentFormData({
      dtpag: doc.dtpag_rec || doc.dtpag_pag || '',
      dtpagi: doc.dtpagi_rec || doc.dtpagi_pag || '',
      vlrsal,
      valor_pago: vlrsal,
      desconto: doc.vlrdesc_rec || doc.vlrdesc_pag || 0,
      juros: doc.vlracre_rec || doc.vlracre_pag || 0,
      multa: doc.vlrmulta_rec || doc.vlrmulta_pag || doc.vlrmult_pag || 0
    });
    setShowPaymentForm(true);
  };

  const fecharFormularioPagamento = () => {
    setShowPaymentForm(false);
    setSelectedDocForPayment(null);
  };

  const totalizarPagamento = (data: typeof paymentFormData) => {
    return (data.valor_pago || 0) + (data.juros || 0) + (data.multa || 0) - (data.desconto || 0);
  };

  const confirmarPagamento = () => {
    const doc = selectedDocForPayment;
    if (!doc) return;

    const docId = doc.receber_id || doc.pagar_id;
    if (formulario.documentos_selecionados.some(sel => sel.id === docId)) {
      showAlert('Documento já foi selecionado', 'warning', 'Aviso');
      return;
    }

    const totalPago = totalizarPagamento(paymentFormData);

    const docSelecionado: DocumentoSelecionado = {
      id: docId,
      tipo: formulario.tipo_documento as 'R' | 'P',
      codigo_cliente: formulario.codigo_cliente || doc.codigo_rec || doc.codigo_pag,
      nome_cliente: formulario.nome_cliente || doc.nome_cli || 'Nome não informado',
      documento: doc.numdup_rec || doc.numdup_pag || doc.docto_rec || doc.docto_pag,
      parcela: doc.parc_rec || doc.parc_pag,
      valor_original: doc.vlrtot_rec || doc.vlrtot_pag,
      valor_aberto: paymentFormData.vlrsal,
      valor_selecionado: paymentFormData.valor_pago,
      juros: paymentFormData.juros,
      multa: paymentFormData.multa,
      desconto: paymentFormData.desconto,
      pago: doc.vlrpag_rec || doc.vlrpag_pag || 0,
      acrescimo: paymentFormData.juros + paymentFormData.multa,
      data_vencimento: doc.dtvenci_rec || doc.dtvenci_pag || doc.dtvenc_rec || doc.dtvenc_pag || ''
    };

    setFormulario(prev => ({
      ...prev,
      codigo_cliente: doc.codigo_rec || doc.codigo_pag || prev.codigo_cliente,
      nome_cliente: doc.nome_cli || prev.nome_cliente,
      documentos_selecionados: [...prev.documentos_selecionados, docSelecionado]
    }));

    // Remover da lista de disponíveis
    const docDisponivelId = doc.receber_id || doc.pagar_id;
    setDocumentosDisponiveis(prev => prev.filter(d => (d.receber_id || d.pagar_id) !== docDisponivelId));

    setFiltroClienteSearch('');
    setShowPaymentForm(false);
    setSelectedDocForPayment(null);
  };

  const removerDocumento = async (index: number) => {
    if (isEditMode) {
      // Em modo edição, desvincula do banco de dados primeiro
      const doc = formulario.documentos_selecionados[index];
      if (!doc || !doc.id) {
        // Se não tiver ID (documento novo não salvo), só remove do state
        setFormulario(prev => ({
          ...prev,
          documentos_selecionados: prev.documentos_selecionados.filter((_, i) => i !== index)
        }));
        return;
      }

      const seqCai = initialPayload?.seq_cai;
      if (!seqCai) {
        showAlert('Sequência do movimento não encontrada', 'error', 'Erro');
        return;
      }

      const banco = formulario.banco_codigo;
      const dataMovimento = CaixaBancosService.converterParaFormatoSQL(formulario.data_movimento);

      if (!banco || !dataMovimento) {
        showAlert('Banco ou data do movimento não preenchidos', 'warning', 'Validação');
        return;
      }

      try {
        setLoading(true);
        await CaixaBancosService.desvincularDocumento(
          seqCai,
          doc.tipo,
          doc.id,
          banco,
          dataMovimento
        );
      } catch (error: any) {
        showAlert(`Erro ao desvincular documento: ${error.message}`, 'error', 'Erro');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    // Remove do state local (tanto em edição quanto em novo)
    const docRemovido = formulario.documentos_selecionados[index];
    setFormulario(prev => ({
      ...prev,
      documentos_selecionados: prev.documentos_selecionados.filter((_, i) => i !== index)
    }));

    // Re-adicionar à lista de disponíveis
    if (docRemovido) {
      const originalDoc = documentosDisponiveisFullRef.current.find(d =>
        (d.receber_id || d.pagar_id) === docRemovido.id
      );
      if (originalDoc) {
        setDocumentosDisponiveis(prev => [...prev, originalDoc]);
      }
    }
  };

  const processarMovimento = async () => {
    // Se tipo_documento for Receber ou Pagar, exigir cliente/fornecedor selecionado
    if ((formulario.tipo_documento === 'R' || formulario.tipo_documento === 'P') && !formulario.codigo_cliente) {
      showAlert('Selecione o cliente/fornecedor para o tipo financeiro selecionado', 'warning', 'Aviso');
      return;
    }

    if (!validacao?.valido) {
      showAlert('Corrija a validação antes de processar o movimento', 'warning', 'Aviso');
      return;
    }

    try {
      setLoading(true);
      const resultado = await CaixaBancosService.processarMovimento(formulario);
      
      showAlert(`Movimento processado com sucesso!\nSequência: ${resultado.sequencia}\nDocumentos atualizados: ${resultado.documentos_atualizados}`, 'success', 'Sucesso');
      
      // Limpar formulário
      setFormulario({
        banco_codigo: '',
        banco_nome: '',
        data_movimento: new Date().toLocaleDateString('pt-BR'),
        operacao_codigo: '',
        operacao_descricao: '',
        debito_credito: 'D',
        tipo_documento: '',
        departamento_codigo: '',
        departamento_descricao: '',
        valor_total: 0,
        historico: '',
        documentos_selecionados: []
      });
      
    } catch (error: any) {
      showAlert(`Erro ao processar movimento: ${error.message}`, 'error', 'Erro');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOVO: Salvar movimento editado (modo edição)
  const salvarMovimento = async () => {
    if (!initialPayload?.seq_cai) {
      showAlert('Sequência do movimento não encontrada. Não é possível salvar.', 'error', 'Erro');
      return;
    }

    // Validar campos editáveis
    if (!formulario.banco_codigo) {
      showAlert('Selecione o banco.', 'warning', 'Validação');
      return;
    }
    if (!formulario.data_movimento) {
      alert('Informe a data do movimento.');
      return;
    }

    // O valor_editavel permite alterar o valor do lançamento
    const valorOriginal = initialPayload?.valor_cai || 0;
    const valorNovo = formulario.valor_total;

    try {
      setLoading(true);
      setSaveProgress({ message: 'Salvando movimento...', success: false });
      
      const resultado = await CaixaBancosService.atualizarMovimentoCaixa({
        id: initialPayload.seq_cai,
        seq_cai: initialPayload.seq_cai,
        filial_cai: initialPayload.filial_cai || '001',
        tipocai_cai: initialPayload.tipocai_cai || '001',
        cliforn_cai: initialPayload.cliforn_cai || '   ',
        codbanco_cai: formulario.banco_codigo,
        dtmovi_cai: formulario.data_movimento.split('/').reverse().join('-'), // YYYY-MM-DD
        original_codbanco_cai: initialPayload.codbanco_cai,
        original_dtmovi_cai: initialPayload.dtmovi_cai,
        original_filial_cai: initialPayload.filial_cai || '001',
        sequencia: formulario.sequencia || initialPayload.seq_cai,
        dc_cai: formulario.debito_credito,
        valor_cai: formulario.valor_total,
        historico_cai: formulario.historico,
        operacao_cai: formulario.operacao_codigo,
        dpto_cai: formulario.departamento_codigo,
        cliente_cai: String(formulario.codigo_cliente || ''),
        valor_original: valorOriginal,
        valor_novo: valorNovo,
        documentos_selecionados: formulario.documentos_selecionados || []
      });

      if (resultado.sucesso) {
        // Mostrar mensagem de progresso da propagação do saldo
        const propagacao = resultado.propagacao;
        if (propagacao && propagacao.mensagem) {
          setSaveProgress({ message: `Atualizando saldos... ${propagacao.mensagem}`, success: true });
        } else {
          setSaveProgress({ message: 'Saldo atualizado com sucesso!', success: true });
        }
        
        // Pequeno delay para mostrar o feedback visual
        setTimeout(() => {
          showAlert(
            `Movimento atualizado com sucesso!\nSequência: ${resultado.seq_cai}\nSaldo atualizado para todas as datas a partir de ${formulario.data_movimento}.`,
            'success',
            'Sucesso',
            () => { if (onClose) onClose(true); }
          );
        }, 500);
      } else {
        setSaveProgress({ message: `Erro: ${resultado.erro || 'Erro desconhecido'}`, success: false });
        showAlert(`Erro ao atualizar: ${resultado.erro || 'Erro desconhecido'}`, 'error', 'Erro');
      }
    } catch (error: any) {
      setSaveProgress({ message: `Erro: ${error.message}`, success: false });
      showAlert(`Erro ao salvar movimento: ${error.message}`, 'error', 'Erro');
    } finally {
      setLoading(false);
      // Limpar progresso após alguns segundos
      setTimeout(() => setSaveProgress(null), 3000);
    }
  };

  const confirmarEstorno = () => {
    if (!initialPayload?.seq_cai) {
      showAlert('Sequência do movimento não encontrada.', 'error', 'Erro');
      return;
    }

    showAlert(
      'Tem certeza que deseja estornar este movimento?\n\n' +
      '• Todos os documentos vinculados serão desvinculados\n' +
      '• O saldo em aberto dos documentos será restaurado\n' +
      '• O movimento será marcado como ESTORNADO (lote_cai = E)\n' +
      '• Os saldos do caixacab serão ajustados\n\n' +
      'Esta operação não pode ser desfeita.',
      'warning',
      'Confirmar Estorno',
      async () => {
        try {
          setSavingEstorno(true);
          const banco = formulario.banco_codigo || initialPayload.codbanco_cai;
          const dataMovimento = initialPayload.dtmovi_cai;
          const filial = initialPayload.filial_cai || '001';

          if (!banco || !dataMovimento) {
            showAlert('Banco ou data do movimento não encontrados.', 'error', 'Erro');
            setSavingEstorno(false);
            return;
          }

          const resultado = await CaixaBancosService.estornarMovimento(
            initialPayload.seq_cai,
            banco,
            dataMovimento,
            filial
          );

          if (resultado.sucesso) {
            showAlert(
              `Movimento estornado com sucesso!\n${resultado.mensagem || ''}`,
              'success',
              'Estorno Concluído',
              () => { if (onClose) onClose(true); }
            );
            // Limpar formulário
            setFormulario(prev => ({
              ...prev,
              documentos_selecionados: []
            }));
            setDocumentosDisponiveis([]);
          } else {
            showAlert(resultado.erro || 'Erro ao estornar movimento.', 'error', 'Erro');
          }
        } catch (error: any) {
          showAlert(`Erro ao estornar: ${error.message}`, 'error', 'Erro');
        } finally {
          setSavingEstorno(false);
        }
      }
    );
  };

  return (
    <Container>
      {/* 🔴 HEADER COM BOTÃO FECHAR */}
      {/* Header label foi movido para dentro do FormGrid com botão Fechar */}

      {/* 🟡 SAVE PROGRESS OVERLAY */}
      {saveProgress && (
        <SaveProgressOverlay>
          <SaveProgressCard>
            {saveProgress.success ? (
              <SuccessIcon>⏳</SuccessIcon>
            ) : (
              <SpinnerIcon><FontAwesomeIcon icon={faSpinner} /></SpinnerIcon>
            )}
            <h3 style={{ 
              marginBottom: '15px', 
              color: saveProgress.success ? '#059669' : '#3b82f6',
              fontSize: '18px'
            }}>
              {saveProgress.success ? 'Atualizando Saldos...' : 'Salvando...'}
            </h3>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              marginBottom: '10px'
            }}>
              Por favor, aguarde...
            </p>
            <p style={{ 
              color: saveProgress.success ? '#059669' : '#dc2626', 
              fontSize: '13px',
              maxWidth: '400px'
            }}>
              {saveProgress.message}
            </p>
          </SaveProgressCard>
        </SaveProgressOverlay>
      )}

      {/* 🔴 LOADING STATE */}
      {loading && !saveProgress && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#666'
        }}>
          <h3>⏳ Carregando dados do formulário...</h3>
          <p>Buscando bancos, operações e departamentos...</p>
        </div>
      )}

      {/* 🔴 ERROR STATE */}
      {erro && !loading && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee',
          border: '1px solid #f88',
          borderRadius: '6px',
          color: '#c33',
          marginBottom: '20px'
        }}>
          <h4>⚠️ Erro ao Carregar Formulário</h4>
          <p>{erro}</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            <strong>Dica:</strong> Verifique se o backend está rodando em http://localhost:8080 e os endpoints estão disponíveis:
            <ul>
              <li>/api/bancos</li>
              <li>/api/operacoes-caixa</li>
              <li>/api/departamentos</li>
            </ul>
          </p>
          <button onClick={() => carregarDadosIniciais()} style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            🔄 Tentar Novamente
          </button>
        </div>
      )}

      {/* ✅ FORM CONTENT - Only render if data loaded */}
      {!loading && !erro && (
      <>
      {/* Header removed to optimize vertical space.
          The modal container (caller) must render the title and the close button
          on the same line as 'Editar Movimento de Caixa' / 'Incluir Movimento de Caixa'. */}

      <FormGrid>
        <FormSection>
          <SectionTitle>
            <FontAwesomeIcon icon={faBank} />
            Dados Bancários
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Banco *</Label>
              <Select 
                value={formulario.banco_codigo} 
                onChange={(e) => handleBancoChange(e.target.value)}
                disabled={isReadOnly || isEditMode}
              >
                <option value="">Selecione um banco</option>
                {(bancos || []).map(banco => (
                  <option key={banco.codigo_bco} value={banco.codigo_bco}>
                    {banco.codigo_bco} - {banco.nome_bco}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Data Movimento *</Label>
              <Input 
                type="date" 
                value={formulario.data_movimento.split('/').reverse().join('-')}
                onChange={(e) => {
                  const dataISO = e.target.value;
                  const dataFormatada = CaixaBancosService.formatarData(dataISO);
                  handleInputChange('data_movimento', dataFormatada);
                }}
                disabled={isReadOnly || isEditMode}
              />
            </FormGroup>
            <FormGroup>
              <Label>Sequência</Label>
              <Input 
                type="number" 
                value={formulario.sequencia || ''}
                onChange={(e) => handleInputChange('sequencia', parseInt(e.target.value))}
                placeholder="Auto"
                disabled={true}
              />
            </FormGroup>
          </FormRow>
          {/* Historico: mover para logo abaixo da Sequência e tornar texto longo */}
          <FormRow className="full-width">
            <FormGroup>
              <Label>Histórico</Label>
              <Textarea
                value={formulario.historico}
                onChange={(e) => handleInputChange('historico', e.target.value)}
                placeholder="Descrição do movimento"
                disabled={isReadOnly && !isEditMode}
              />
            </FormGroup>
          </FormRow>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FontAwesomeIcon icon={faCalculator} />
            Operação
          </SectionTitle>
          
          <FormRow>
            <FormGroup>
              <Label>Operação de Caixa *</Label>
              <Select 
                value={formulario.operacao_codigo}
                onChange={(e) => handleOperacaoChange(e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Selecione uma operação</option>
                {operacoes.map(operacao => (
                  <option key={operacao.operacao_ocai} value={operacao.operacao_ocai}>
                    {operacao.operacao_ocai} - {operacao.descr_ocai}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>D/C *</Label>
              <Select 
                value={formulario.debito_credito}
                onChange={(e) => handleInputChange('debito_credito', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="D">Débito</option>
                <option value="C">Crédito</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Financeiro</Label>
              <Select 
                value={formulario.tipo_documento}
                onChange={(e) => handleTipoDocumentoChange(e.target.value as FormularioCaixa['tipo_documento'])}
                disabled={isReadOnly}
              >
                <option value="">Selecione</option>
                <option value="R">Contas a Receber</option>
                <option value="P">Contas a Pagar</option>
              </Select>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>Centro de Custo *</Label>
              <Select 
                value={formulario.departamento_codigo}
                onChange={(e) => handleDepartamentoChange(e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Selecione um departamento</option>
                {departamentos.map(dept => (
                  <option key={dept.codigo_scd} value={dept.codigo_scd}>
                    {dept.codigo_scd} - {dept.descr_scd}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Valor Total *</Label>
              <Input 
                type="text" 
                value={CaixaBancosService.formatarMoeda(formulario.valor_total)}
                onChange={(e) => {
                  // Remove tudo que não for dígito
                  const rawDigits = e.target.value.replace(/\D/g, '');
                  if (!rawDigits) {
                    handleInputChange('valor_total', 0);
                    return;
                  }
                  // Converte para float dividindo por 100 para manter o deslocamento de centavos
                  const parsed = parseFloat(rawDigits) / 100;
                  handleInputChange('valor_total', isNaN(parsed) ? 0 : parsed);
                }}
                disabled={isReadOnly && !isEditMode}
              />
            </FormGroup>
            <FormGroup>
              {/* Placeholder column kept for grid symmetry */}
            </FormGroup>
          </FormRow>

          {/* Selecione o Cliente agora ocupa largura completa (igual ao Historico) */}
          <FormRow className="full-width">
            <FormGroup>
              <Label>
                {formulario.tipo_documento === 'R' ? 'Selecione o Cliente' : formulario.tipo_documento === 'P' ? 'Selecione o Fornecedor' : 'Cliente / Fornecedor'}
                { (formulario.tipo_documento === 'R' || formulario.tipo_documento === 'P') ? ' *' : '' }
              </Label>
              <SearchableSelectContainer>
                <SearchInput
                  type="text"
                  placeholder={loadingClientes ? 'Carregando...' : `Digite nome ou código do ${formulario.tipo_documento === 'R' ? 'cliente' : formulario.tipo_documento === 'P' ? 'fornecedor' : 'cliente/fornecedor'}`}
                  value={filtroClienteSearch}
                  onChange={(e) => handleClienteSearchChange(e.target.value)}
                  disabled={loadingClientes || isReadOnly}
                  ref={(el) => { searchInputRef.current = el; }}
                  onFocus={() => setClienteInputFocused(true)}
                  onBlur={() => setTimeout(() => setClienteInputFocused(false), 150)}
                  autoComplete="off"
                />
                {clienteInputFocused && (
                  <SearchResults onMouseDown={(e) => { e.preventDefault(); }}>
                    {loadingClientes ? (
                      <SearchResultItem>
                        <span className="client-name">Carregando...</span>
                      </SearchResultItem>
                    ) : displayedClientes && displayedClientes.length > 0 ? (
                        displayedClientes.map(cliente => (
                        <SearchResultItem
                          key={cliente.codigo_cli}
                          $selected={formulario.codigo_cliente === cliente.codigo_cli}
                          onMouseDown={(e) => { e.preventDefault(); handleClienteSelect(cliente); }}
                        >
                          <span className="client-code">{cliente.codigo_cli} - {cliente.nomfan_cli || cliente.nome_cli}</span>
                          <span className="client-name">{cliente.nome_cli}</span>
                        </SearchResultItem>
                      ))
                    ) : (
                      <SearchResultItem>
                        <span className="client-name">Nenhum resultado encontrado</span>
                      </SearchResultItem>
                    )}
                  </SearchResults>
                )}
              </SearchableSelectContainer>
            </FormGroup>
          </FormRow>
        </FormSection>
      </FormGrid>
      {validacao && (
        <ValidationMessage type={validacao.valido ? 'success' : 'error'}>
          {validacao.valido 
            ? `✓ Valores conferem - Total: ${CaixaBancosService.formatarMoeda(validacao.valor_documentos)}`
            : validacao.mensagem
          }
        </ValidationMessage>
      )}

      <DocumentosGrid>
        <DocumentosColumn>
          <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>
            Documentos Disponíveis ({formulario.tipo_documento === 'R' ? 'Receber' : 'Pagar'})
          </h4>
          <DocumentosTableContainer>
            <DocumentosTable>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>{formulario.tipo_documento === 'P' ? 'Fornecedor' : 'Cliente'}</th>
                  <th style={{ textAlign: 'left' }}>Documento</th>
                  <th style={{ textAlign: 'center', width: 60 }}>Parcela</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ textAlign: 'right' }}>Juros</th>
                  <th style={{ textAlign: 'right' }}>Multa</th>
                  <th style={{ textAlign: 'right' }}>Desconto</th>
                  <th style={{ textAlign: 'right' }}>Pago</th>
                  <th style={{ textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {documentosDisponiveis.map((doc, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'left' }}>
                      {doc.codigo_rec || doc.codigo_pag || 'N/I'}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      {doc.numdup_rec || doc.numdup_pag || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {String(doc.parc_rec || doc.parc_pag || '').padStart(2, '0')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.vlrdup_rec || doc.vlrdup_pag || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.vlracre_rec || doc.vlracre_pag || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.vlrmulta_rec || doc.vlrmulta_pag || doc.vlrmult_pag || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.vlrdesc_rec || doc.vlrdesc_pag || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.vlrpag_rec || doc.vlrpag_pag || 0)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!isReadOnly && (
                        <Button 
                          $variant="primary" 
                          onClick={() => abrirFormularioPagamento(doc)}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentosTable>
          </DocumentosTableContainer>
        </DocumentosColumn>

        <DocumentosColumn>
          <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>Documentos Selecionados</h4>
          <DocumentosTableContainer>
            <DocumentosTable>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>{formulario.tipo_documento === 'P' ? 'Fornecedor' : 'Cliente'}</th>
                  <th style={{ textAlign: 'left' }}>Documento</th>
                  <th style={{ textAlign: 'center', width: 60 }}>Parcela</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ textAlign: 'right' }}>Juros</th>
                  <th style={{ textAlign: 'right' }}>Multa</th>
                  <th style={{ textAlign: 'right' }}>Desconto</th>
                  <th style={{ textAlign: 'right' }}>Pago</th>
                  <th style={{ textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {formulario.documentos_selecionados.map((doc, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'left' }}>{doc.nome_cliente || 'N/I'}</td>
                    <td style={{ textAlign: 'left' }}>
                      {doc.documento || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {String(doc.parcela || '').padStart(2, '0')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.valor_selecionado || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.juros || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.multa || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.desconto || 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {CaixaBancosService.formatarMoeda(doc.pago || 0)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {podeExcluirDocumento && (
                        <Button 
                          $variant="danger" 
                          onClick={() => removerDocumento(index)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DocumentosTable>
          </DocumentosTableContainer>
        </DocumentosColumn>
      </DocumentosGrid>

      {/* 🟣 Floating payment form */}
      {showPaymentForm && selectedDocForPayment && (
        <FloatingOverlay onClick={fecharFormularioPagamento}>
          <FloatingCard onClick={e => e.stopPropagation()}>
            <FloatingTitle>
              Detalhes do Pagamento
              <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280', display: 'block', marginTop: 4 }}>
                {selectedDocForPayment.codigo_rec || selectedDocForPayment.codigo_pag || 'N/I'} — 
                {(selectedDocForPayment.numdup_rec || selectedDocForPayment.numdup_pag)}-
                {(selectedDocForPayment.parcela_rec || selectedDocForPayment.parcela_pag)}
              </span>
            </FloatingTitle>

            <FloatingGrid>
              <FloatingField>
                <FloatingLabel>Saldo em Aberto (vlrsal)</FloatingLabel>
                <FloatingInput
                  value={CaixaBancosService.formatarMoeda(paymentFormData.vlrsal)}
                  readOnly
                />
              </FloatingField>
              <FloatingField>
                <FloatingLabel>Banco</FloatingLabel>
                <FloatingInput
                  value={formulario.banco_nome || formulario.banco_codigo}
                  readOnly
                />
              </FloatingField>
            </FloatingGrid>

            <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0 16px' }} />

            <FloatingGrid>
              <FloatingField className="full-width">
                <FloatingLabel>Valor Pago *</FloatingLabel>
                <FloatingInput
                  type="text"
                  value={CaixaBancosService.formatarMoeda(paymentFormData.valor_pago)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const val = raw ? parseFloat(raw) / 100 : 0;
                    setPaymentFormData(prev => ({ ...prev, valor_pago: val }));
                  }}
                  autoFocus
                />
              </FloatingField>
              <FloatingField>
                <FloatingLabel>Juros (vlracre)</FloatingLabel>
                <FloatingInput
                  type="text"
                  value={CaixaBancosService.formatarMoeda(paymentFormData.juros)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const val = raw ? parseFloat(raw) / 100 : 0;
                    setPaymentFormData(prev => ({ ...prev, juros: val }));
                  }}
                />
              </FloatingField>
              <FloatingField>
                <FloatingLabel>Multa (vlrmulta)</FloatingLabel>
                <FloatingInput
                  type="text"
                  value={CaixaBancosService.formatarMoeda(paymentFormData.multa)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const val = raw ? parseFloat(raw) / 100 : 0;
                    setPaymentFormData(prev => ({ ...prev, multa: val }));
                  }}
                />
              </FloatingField>
              <FloatingField>
                <FloatingLabel>Desconto (vlrdesc)</FloatingLabel>
                <FloatingInput
                  type="text"
                  value={CaixaBancosService.formatarMoeda(paymentFormData.desconto)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const val = raw ? parseFloat(raw) / 100 : 0;
                    setPaymentFormData(prev => ({ ...prev, desconto: val }));
                  }}
                />
              </FloatingField>
            </FloatingGrid>

            {(() => {
              const total = totalizarPagamento(paymentFormData);
              const isPartial = total < paymentFormData.vlrsal;
              return (
                <>
                  <TotalRow>
                    <span>Total do Pagamento</span>
                    <span>{CaixaBancosService.formatarMoeda(total)}</span>
                  </TotalRow>
                  {isPartial && (
                    <PartialPaymentBadge>
                      ⚠️ Pagamento Parcial — Saldo restante:{' '}
                      {CaixaBancosService.formatarMoeda(paymentFormData.vlrsal - total)}
                    </PartialPaymentBadge>
                  )}
                </>
              );
            })()}

            <FloatingActions>
              <Button $variant="secondary" onClick={fecharFormularioPagamento}>
                Cancelar
              </Button>
              <Button $variant="primary" onClick={confirmarPagamento}>
                Confirmar
              </Button>
            </FloatingActions>
          </FloatingCard>
        </FloatingOverlay>
      )}

      <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
        {/* Esquerda: botão Estornar (apenas em modo edição) */}
        {isEditMode && (
          <Button 
            $variant="danger" 
            onClick={confirmarEstorno}
            disabled={loading || savingEstorno}
            style={{ background: '#dc2626' }}
          >
            <FontAwesomeIcon icon={faTrash} />
            {savingEstorno ? 'Estornando...' : 'Estornar Movimento'}
          </Button>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* ✅ NOVO: Modo edição - mostrar botão Salvar */}
          {isEditMode && (
            <Button 
              $variant="success" 
              onClick={salvarMovimento}
              disabled={loading || savingEstorno}
            >
              <FontAwesomeIcon icon={faSave} style={loading ? {animation: `${spin} 1s linear infinite`, opacity: 0.7} : undefined} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
          {/* Modo inclusão - mostrar botão Processar Movimento */}
          {!isReadOnly && !isEditMode && (
            <Button 
              $variant="primary" 
              onClick={processarMovimento}
              disabled={!validacao?.valido || loading}
            >
              <FontAwesomeIcon icon={faSave} />
              {loading ? 'Processando...' : 'Processar Movimento'}
            </Button>
          )}
          {/* Modo consulta - mostrar mensagem */}
          {isReadOnly && !isEditMode && (
            <span style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
              📋 Modo de Consulta (Somente Leitura)
            </span>
          )}
        </div>
      </div>

      {/* 🟢 CUSTOM ALERT MODAL OVERLAY */}
      {customAlert && (
        <SaveProgressOverlay style={{ zIndex: 10000 }}>
          <SaveProgressCard style={{ minWidth: '350px', maxWidth: '500px', padding: '30px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>
              {customAlert.type === 'success' ? '✅' : customAlert.type === 'error' ? '❌' : customAlert.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <h3 style={{ 
              marginBottom: '15px', 
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: 600
            }}>
              {customAlert.title || (customAlert.type === 'success' ? 'Sucesso' : customAlert.type === 'error' ? 'Erro' : customAlert.type === 'warning' ? 'Aviso' : 'Informação')}
            </h3>
            <p style={{ 
              color: '#4b5563', 
              fontSize: '14px',
              marginBottom: '20px',
              whiteSpace: 'pre-line',
              lineHeight: '1.5'
            }}>
              {customAlert.message}
            </p>
            <Button 
              $variant={customAlert.type === 'success' ? 'success' : customAlert.type === 'error' ? 'danger' : 'primary'}
              onClick={() => {
                const cb = customAlert.callback;
                setCustomAlert(null);
                if (cb) cb();
              }}
              style={{ width: '100%', padding: '10px' }}
            >
              OK
            </Button>
          </SaveProgressCard>
        </SaveProgressOverlay>
      )}
      </>
      )}
    </Container>
  );
};

export default CaixaBancosForm;













