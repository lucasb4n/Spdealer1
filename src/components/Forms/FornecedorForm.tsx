import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSearch, faSpinner, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { Fornecedor, FornecedoresService } from 'services/FornecedoresService';
import { CnpjService } from 'services/CnpjService';
import CpfService from 'services/CpfService';
import DadosAdicionais, { DadosAdicionaisData } from '../../refatorado/DadosAdicionais';
import { DocumentoFormatterService } from 'services/DocumentoFormatterService';
import { useFormEscapeHandler } from 'hooks/useFormEscapeHandler';
import { useFormDirtyState } from 'hooks/useFormDirtyState';
import { ConfirmDiscardChangesModal } from 'components/Modal/ConfirmDiscardChangesModal';

interface FornecedorFormProps {
  fornecedor?: Fornecedor;
  onSave: (fornecedor: Fornecedor) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const FormContainer = styled.div`
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 100%;
`;

const FormHeader = styled.div`
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #cbd5e1;
`;

const FormTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.01em;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 6px 8px;
  margin-bottom: 12px;
`;

const FormGroup = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}
`;

const HorizontalFormGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 1 / -1;
`;

const LabelLeft = styled.label`
  width: 120px;
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const Label = styled.label`
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: block;
  margin-bottom: 2px;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 0 8px;
  height: 1.75rem;
  min-height: 1.75rem;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#cbd5e1'};
  border-radius: 4px;
  font-size: 12px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 2px ${props => props.hasError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'};
  }

  &:disabled {
    background: #f1f5f9;
    color: #475569;
    cursor: not-allowed;
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  padding: 0 8px;
  height: 1.75rem;
  min-height: 1.75rem;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#cbd5e1'};
  border-radius: 4px;
  font-size: 12px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 2px ${props => props.hasError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'};
  }
`;

/* TextArea removed (unused) */

const ErrorMessage = styled.span`
  font-size: 11px;
  color: #ef4444;
  margin-top: 2px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary'; loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 28px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.15s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: #2563eb;
    color: #fff;
    &:hover:not(:disabled) {
      background: #1d4ed8;
    }
  ` : `
    background: #64748b;
    color: #fff;
    &:hover:not(:disabled) {
      background: #475569;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CnpjButton = styled.button`
  padding: 0 12px;
  height: 1.75rem;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover:not(:disabled) {
    background: #047857;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CnpjContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  width: 100%;
`;

const CepButton = styled.button`
  padding: 0 12px;
  height: 1.75rem;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CepContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  width: 100%;
`;

const TabsContainer = styled.div`
  display: flex;
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
  padding: 0 8px;
  gap: 2px;
  margin: 12px 0 16px 0;
  border-radius: 4px;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 6px 12px;
  height: 28px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${props => props.$active ? '#fff' : '#64748b'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { 
    color: #94a3b8; 
    background: rgba(255, 255, 255, 0.03);
  }

  ${props => props.$active && 'border-bottom-color: #3b82f6; background: rgba(59, 130, 246, 0.08);'}
`;

const FornecedorForm: React.FC<FornecedorFormProps> = ({ fornecedor, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState<Partial<Fornecedor>>({
    tipopessoa_cli: 'J', // Fornecedores geralmente são CNPJ ('J') por padrão
    cliforn_cli: 'F',
    ...fornecedor
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'endereco' | 'financeiros' | 'adicionais'>('endereco');

  // Estado inicial para detectar mudanças
  const initialValues = {
    tipopessoa_cli: 'J',
    cliforn_cli: 'F',
    ...fornecedor
  };

  // Hook para detectar mudanças não salvas
  const { isDirty } = useFormDirtyState(initialValues, formData as any, ['id']);

  // Função para mostrar modal de confirmação
  const showConfirmDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setShowConfirmModal(true);
      
      const handleConfirm = () => {
        setShowConfirmModal(false);
        resolve(true);
      };
      
      const handleCancel = () => {
        setShowConfirmModal(false);
        resolve(false);
      };
      
      // Adiciona handlers temporários ao modal
      setTimeout(() => {
        const modal = document.querySelector('[data-confirm-modal-fornecedor]');
        if (modal) {
          (modal as any)._handleConfirm = handleConfirm;
          (modal as any)._handleCancel = handleCancel;
        }
      }, 0);
    });
  };

  // Hook para lidar com ESC
  useFormEscapeHandler({
    onEscape: onCancel,
    hasUnsavedChanges: isDirty,
    showConfirmDialog,
    isEnabled: true
  });

  // Carregar tipos de fornecedores (masfor)
  const [tiposFornecedores, setTiposFornecedores] = useState<Array<{ tipo_for: any; descr_for: string }>>([]);

  useEffect(() => {
    if (fornecedor) {
      // debug: inspecionar dados recebidos pelo formulário
      // Remover/ajustar este log após diagnóstico
      // eslint-disable-next-line no-console
      console.debug('DEBUG: FornecedorForm received fornecedor prop:', fornecedor);
      setFormData({ ...fornecedor });
    }

    const fetchTipos = async () => {
      try {
        const tipos = await FornecedoresService.getTiposFornecedores();
        setTiposFornecedores(tipos || []);
      } catch (err) {
        console.warn('Não foi possível carregar tipos de fornecedores (masfor)', err);
      }
    };

    fetchTipos();
  }, [fornecedor]);

  const handleInputChange = (field: keyof Fornecedor, value: string) => {
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Atualiza o estado usando o estado anterior para decidir formatação
    setFormData(prev => {
      let newVal = value;

      if (field === 'cgccpf_cli') {
        if (prev.tipopessoa_cli === 'F') {
          newVal = DocumentoFormatterService.formatarCPF(value);
        } else {
          newVal = DocumentoFormatterService.formatarCNPJ(value);
        }
      }

      if (field === 'fone_cli' || field === 'fone1_cli' || field === 'celular_cli') {
        newVal = FornecedoresService.formatarTelefone(value);
      }

      if (field === 'cep_cli') {
        const cepLimpo = value.replace(/\D/g, '');
        newVal = cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
      }

      return { ...prev, [field]: newVal };
    });
  };

  // Tipo: F = CPF (pessoa física), J = CNPJ (pessoa jurídica)
  const handleTipoPessoaChange = (tipo: 'F' | 'J') => {
    setFormData(prev => ({
      ...prev,
      tipopessoa_cli: tipo,
      cgccpf_cli: '', // Limpar documento ao trocar tipo
      inscest_cli: '',
      inscmun_cli: '',
      ident_cli: '',
      orgemis_cli: '',
      sexo_cli: undefined
    }));
  };

  const handleDadosAdicionaisChange = (next: DadosAdicionaisData) => {
    setFormData(prev => ({ ...prev, ...next }));
  };

  const buscarCEP = async () => {
    if (!formData.cep_cli) return;

    setCepLoading(true);
    try {
      const dadosCep = await FornecedoresService.buscarCEP(formData.cep_cli);
      if (dadosCep) {
        setFormData(prev => ({
          ...prev,
          logra_cli: dadosCep.logradouro,
          bairro_cli: dadosCep.bairro,
          cidade_cli: dadosCep.localidade,
          uf_cli: dadosCep.uf
        }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, cep_cli: 'CEP não encontrado' }));
    } finally {
      setCepLoading(false);
    }
  };

  const consultarDocumento = async () => {
    if (!formData.cgccpf_cli) return;

    setDocLoading(true);
    try {
      if (formData.tipopessoa_cli === 'J') {
        // CNPJ
        // Verificar se CNPJ já existe na base
        const cnpjExiste = await CnpjService.verificarCnpjExistente(formData.cgccpf_cli, 'F');
        if (cnpjExiste) {
          setErrors(prev => ({ ...prev, cgccpf_cli: 'CNPJ já cadastrado no sistema' }));
          return;
        }

        const dadosCnpj = await CnpjService.consultarCnpj(formData.cgccpf_cli);
        if (dadosCnpj) {
          setFormData(prev => ({
            ...prev,
            nome_cli: dadosCnpj.nome_cli,
            nomefan_cli: dadosCnpj.nomefan_cli,
            logra_cli: dadosCnpj.logra_cli,
            cep_cli: dadosCnpj.cep_cli,
            bairro_cli: dadosCnpj.bairro_cli,
            cidade_cli: dadosCnpj.cidade_cli,
            uf_cli: dadosCnpj.uf_cli,
            email_cli: dadosCnpj.email_cli,
            fone_cli: dadosCnpj.fone_cli,
            prof_cli: dadosCnpj.atividade_principal
          }));

          setErrors(prev => ({ ...prev, cgccpf_cli: '', nome_cli: '' }));
        }
      } else {
        // CPF
        const dadosCpf = await CpfService.consultarCpf(formData.cgccpf_cli);
        if (dadosCpf) {
          // Mapear campos retornados para o formulário quando disponíveis
          setFormData(prev => ({
            ...prev,
            nome_cli: (dadosCpf as any).nome || (dadosCpf as any).nome_cli || prev.nome_cli,
            nomefan_cli: (dadosCpf as any).nome_fantasia || (dadosCpf as any).nomefan_cli || prev.nomefan_cli,
            logra_cli: (dadosCpf as any).logradouro || (dadosCpf as any).logra_cli || prev.logra_cli,
            cep_cli: (dadosCpf as any).cep || (dadosCpf as any).cep_cli || prev.cep_cli,
            bairro_cli: (dadosCpf as any).bairro || (dadosCpf as any).bairro_cli || prev.bairro_cli,
            cidade_cli: (dadosCpf as any).municipio || (dadosCpf as any).cidade_cli || prev.cidade_cli,
            uf_cli: (dadosCpf as any).uf || (dadosCpf as any).uf_cli || prev.uf_cli,
            email_cli: (dadosCpf as any).email || (dadosCpf as any).email_cli || prev.email_cli
          }));

          setErrors(prev => ({ ...prev, cgccpf_cli: '', nome_cli: '' }));
        }
      }
    } catch (error: any) {
      setErrors(prev => ({ ...prev, cgccpf_cli: error.message || 'Erro ao consultar documento' }));
    } finally {
      setDocLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações obrigatórias
    if (!formData.nome_cli?.trim()) {
      newErrors.nome_cli = 'Nome/Razão Social é obrigatório';
    }

      if (!formData.cgccpf_cli?.trim()) {
        newErrors.cgccpf_cli = 'Documento é obrigatório';
      } else if (formData.tipopessoa_cli === 'F' && !FornecedoresService.validarCPF(formData.cgccpf_cli)) {
      newErrors.cgccpf_cli = 'CPF inválido';
      } else if (formData.tipopessoa_cli === 'J' && !FornecedoresService.validarCNPJ(formData.cgccpf_cli)) {
      newErrors.cgccpf_cli = 'CNPJ inválido';
    }

    if (formData.email_cli && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_cli)) {
      newErrors.email_cli = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateToISO = (value?: string) => {
    if (!value) return undefined;
    // Se já estiver no formato YYYY-MM-DD, retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let savedFornecedor: Fornecedor;
      
      // Preparar payload conforme regras:
      // - `tipopessoa_cli` já é 'C' ou 'J'
      // - `cgccpf_cli` enviar apenas dígitos
      // - `tipofor_cli` receber o código `tipo_for` da tabela `masfor`
      // - datas em formato YYYY-MM-DD
      const payload: any = {
        ...formData,
        cliforn_cli: 'F',
        // garantir ambos os nomes de coluna para compatibilidade
        codigo_clli: (formData as any).codigo_clli || (formData as any).codigo_cli || (formData as any).codigo_for,
        codigo_cli: (formData as any).codigo_clli || (formData as any).codigo_cli || (formData as any).codigo_for,
        tipopessoa_cli: formData.tipopessoa_cli,
        cgccpf_cli: (formData.cgccpf_cli || '').replace(/\D/g, ''),
        tipofor_cli: (formData as any).tipofor_cli || (formData as any).tipofor || (formData as any).tipo_for,
        inscest_cli: formData.inscest_cli,
        datacad_cli: formatDateToISO((formData as any).datacad_cli) || formatDateToISO((formData as any).datacad),
        datalt_cli: formatDateToISO((formData as any).datalt_cli) || formatDateToISO((formData as any).datalt),
        nome_cli: formData.nome_cli,
        nomefan_cli: formData.nomefan_cli
      };

      if (isEditing && (formData as any).codigo_cli) {
        savedFornecedor = await FornecedoresService.updateFornecedor((formData as any).codigo_cli, payload);
      } else {
        savedFornecedor = await FornecedoresService.createFornecedor(payload as any);
      }
      
      onSave(savedFornecedor);
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      // Propagar mensagem do backend para exibir no formulário
      const msg = (error as any)?.message || 'Falha ao salvar fornecedor';
      setErrors(prev => ({ ...prev, form: msg }));
    } finally {
      setLoading(false);
    }
  };

  const isPessoaFisica = formData.tipopessoa_cli === 'F';

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </FormTitle>
      </FormHeader>

      {/* CABEÇALHO: 4 linhas conforme especificação do usuário */}
      <FormGrid>
        {/* Linha 01: Codigo, Tipo (CNPJ/CPF), Documento */}
        <FormGroup>
          <Label>Codigo</Label>
          <Input
            type="text"
            value={(formData as any).codigo_clli || (formData as any).codigo_cli || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, codigo_clli: e.target.value.slice(0,5) }))}
            maxLength={5}
            placeholder="Máx. 5 caracteres"
          />
        </FormGroup>

        <FormGroup>
          <Label>Tipo</Label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label>
              <input
                type="radio"
                name="tipoPessoa"
                checked={formData.tipopessoa_cli === 'J'}
                onChange={() => handleTipoPessoaChange('J')}
              />{' '}
              CNPJ
            </label>
            <label>
              <input
                type="radio"
                name="tipoPessoa"
                checked={formData.tipopessoa_cli === 'F'}
                onChange={() => handleTipoPessoaChange('F')}
              />{' '}
              CPF
            </label>
          </div>
        </FormGroup>

        <FormGroup>
          <Label>Documento</Label>
          <CnpjContainer>
            <Input
              type="text"
              value={formData.cgccpf_cli || ''}
              onChange={(e) => handleInputChange('cgccpf_cli', e.target.value)}
              placeholder={formData.tipopessoa_cli === 'F' ? '000.000.000-00' : '00.000.000/0000-00'}
              hasError={!!errors.cgccpf_cli}
            />
            <CnpjButton
              type="button"
              onClick={consultarDocumento}
              disabled={docLoading || !formData.cgccpf_cli}
              title={formData.tipopessoa_cli === 'J' ? 'Consultar CNPJ' : 'Consultar CPF'}
            >
              {docLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
              {docLoading ? 'Consultando...' : 'Consultar'}
            </CnpjButton>
          </CnpjContainer>
          {errors.cgccpf_cli && <ErrorMessage>{errors.cgccpf_cli}</ErrorMessage>}
        </FormGroup>

        {/* Linha 02: Tipo Fornecedor (masfor), I.E/RG, Data Cad. */}
        <FormGroup>
          <Label>Tipo Fornecedor</Label>
          <Select
            value={(formData as any).tipofor_cli || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, tipofor_cli: e.target.value }))}
          >
            <option value="">Selecione</option>
            {tiposFornecedores.map(t => (
              <option key={String(t.tipo_for)} value={t.tipo_for}>{t.descr_for}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>I.E/RG</Label>
          <Input
            type="text"
            value={formData.inscest_cli || ''}
            onChange={(e) => handleInputChange('inscest_cli', e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <Label>Data Cad.</Label>
          <Input
            type="date"
            value={(formData as any).datacad_cli || (formData as any).datacad_cli || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, datacad_cli: e.target.value }))}
          />
        </FormGroup>

        <FormGroup>
          <Label>Data Ult. Alteração</Label>
          <Input
            type="date"
            value={(formData as any).datalt_cli || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, datalt_cli: e.target.value }))}
          />
        </FormGroup>

        {/* Linha 03: Razão Social (label à esquerda), Data Ult. Alteração */}
        <HorizontalFormGroup>
          <LabelLeft>Razão Social</LabelLeft>
          <div style={{ flex: 1 }}>
            <Input
              type="text"
              value={formData.nome_cli || ''}
              onChange={(e) => handleInputChange('nome_cli', e.target.value)}
              hasError={!!errors.nome_cli}
            />
            {errors.nome_cli && <ErrorMessage>{errors.nome_cli}</ErrorMessage>}
          </div>
        </HorizontalFormGroup>

        {/* Linha 04: Nome Fantasia */}
        {/* Linha 04: Nome Fantasia (label à esquerda) */}
        <HorizontalFormGroup>
          <LabelLeft>Nome Fantasia</LabelLeft>
          <div style={{ flex: 1 }}>
            <Input
              type="text"
              value={formData.nomefan_cli || ''}
              onChange={(e) => handleInputChange('nomefan_cli', e.target.value)}
            />
          </div>
        </HorizontalFormGroup>
      </FormGrid>

      <TabsContainer>
        <TabButton $active={activeTab === 'endereco'} onClick={() => setActiveTab('endereco')}>Endereço</TabButton>
        <TabButton $active={activeTab === 'financeiros'} onClick={() => setActiveTab('financeiros')}>Dados Financeiros</TabButton>
        <TabButton $active={activeTab === 'adicionais'} onClick={() => setActiveTab('adicionais')}>Dados Adicionais</TabButton>
      </TabsContainer>

      {/* Aba: Dados Adicionais (refatorado) */}
      {activeTab === 'adicionais' && (
        <div style={{ marginTop: 12 }}>
          <DadosAdicionais
            value={{
              trib_cli: (formData as any).trib_cli,
              precsub_cli: (formData as any).precsub_cli,
              codativ1_cli: (formData as any).codativ1_cli,
              codativ2_cli: (formData as any).codativ2_cli,
              codativ3_cli: (formData as any).codativ3_cli,
              codativ4_cli: (formData as any).codativ4_cli
            }}
            onChange={handleDadosAdicionaisChange}
          />
        </div>
      )}

      {/* Aba: Endereço */}
      {activeTab === 'endereco' && (
        <FormGrid>
          {/* Linha 01: Endereço */}
          <FormGroup fullWidth>
            <Label>Endereço</Label>
            <Input
              type="text"
              value={formData.logra_cli || ''}
              onChange={(e) => handleInputChange('logra_cli', e.target.value)}
            />
          </FormGroup>

          {/* Linha 02: Bairro, Cidade */}
          <FormGroup>
            <Label>Bairro</Label>
            <Input
              type="text"
              value={formData.bairro_cli || ''}
              onChange={(e) => handleInputChange('bairro_cli', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Cidade</Label>
            <Input
              type="text"
              value={formData.cidade_cli || ''}
              onChange={(e) => handleInputChange('cidade_cli', e.target.value)}
            />
          </FormGroup>

          {/* Linha 03: CEP + Consultar, UF */}
          <FormGroup>
            <Label>CEP</Label>
            <CepContainer>
              <Input
                type="text"
                value={formData.cep_cli || ''}
                onChange={(e) => handleInputChange('cep_cli', e.target.value)}
                placeholder="00000-000"
                hasError={!!errors.cep_cli}
              />
              <CepButton
                type="button"
                onClick={buscarCEP}
                disabled={cepLoading || !formData.cep_cli}
              >
                {cepLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
                {cepLoading ? 'Consultando...' : 'Consultar'}
              </CepButton>
            </CepContainer>
            {errors.cep_cli && <ErrorMessage>{errors.cep_cli}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label>UF</Label>
            <Input
              type="text"
              value={formData.uf_cli || ''}
              onChange={(e) => handleInputChange('uf_cli', e.target.value.toUpperCase().slice(0,2))}
              placeholder="UF"
            />
          </FormGroup>

          {/* Linha 04: Insc. Municipal, Email */}
          <FormGroup>
            <Label>Insc. Municipal</Label>
            <Input
              type="text"
              value={formData.inscmun_cli || ''}
              onChange={(e) => handleInputChange('inscmun_cli', e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={formData.email_cli || ''}
              onChange={(e) => handleInputChange('email_cli', e.target.value)}
              hasError={!!errors.email_cli}
            />
            {errors.email_cli && <ErrorMessage>{errors.email_cli}</ErrorMessage>}
          </FormGroup>

          {/* Linha 05: Contato, Fone */}
          <FormGroup>
            <Label>Contato</Label>
            <Input
              type="text"
              value={formData.celular_cli || ''}
              onChange={(e) => handleInputChange('celular_cli', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </FormGroup>

          <FormGroup>
            <Label>Fone</Label>
            <Input
              type="text"
              value={formData.fone_cli || ''}
              onChange={(e) => handleInputChange('fone_cli', e.target.value)}
              placeholder="(00) 0000-0000"
            />
          </FormGroup>

          {/* Linha 06: Ativo/Inativo (groupbox) e checkbox Atualizado */}
          <FormGroup fullWidth>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div>
                <Label>Ativo / Inativo</Label>
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  <label>
                    <input
                      type="radio"
                      name="ativoStatus"
                      checked={String((formData as any).ativoinativo_cli || '').toUpperCase() === 'A'}
                      onChange={() => setFormData(prev => ({ ...(prev as any), ativoinativo_cli: 'A' }))}
                    />{' '}
                    Ativo
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="ativoStatus"
                      checked={String((formData as any).ativoinativo_cli || '').toUpperCase() === 'I' || !((formData as any).ativoinativo_cli)}
                      onChange={() => setFormData(prev => ({ ...(prev as any), ativoinativo_cli: 'I' }))}
                    />{' '}
                    Inativo
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={Boolean((formData as any).atualizado_cli === 'S' || (formData as any).atualizado_cli === true)}
                    onChange={(e) => setFormData(prev => ({ ...(prev as any), atualizado_cli: e.target.checked ? 'S' : '' }))}
                  />
                  Atualizado
                </label>
              </div>
            </div>
          </FormGroup>
        </FormGrid>
      )}

      {/* Aba: Dados Financeiros */}
      {activeTab === 'financeiros' && (
        <>
          <FormGrid>
            {/* Linha 01: Banco, Agencia */}
            <FormGroup>
              <Label>Banco</Label>
              <Input
                type="text"
                value={formData.banco_cli || ''}
                onChange={(e) => handleInputChange('banco_cli', e.target.value)}
                placeholder="Banco"
              />
            </FormGroup>

            <FormGroup>
              <Label>Agência</Label>
              <Input
                type="text"
                value={formData.agenc_cli || ''}
                onChange={(e) => handleInputChange('agenc_cli', e.target.value)}
                placeholder="Agência"
              />
            </FormGroup>

            {/* Linha 02: Conta, Cidade */}
            <FormGroup>
              <Label>Conta</Label>
              <Input
                type="text"
                value={formData.conta_cli || ''}
                onChange={(e) => handleInputChange('conta_cli', e.target.value)}
                placeholder="Conta"
              />
            </FormGroup>

            <FormGroup>
              <Label>Cidade</Label>
              <Input
                type="text"
                value={formData.cidbco_cli || ''}
                onChange={(e) => handleInputChange('cidbco_cli', e.target.value)}
                placeholder="Cidade"
              />
            </FormGroup>

            {/* Linha 03: Banco (alternativo), Agencia (alternativo) */}
            <FormGroup>
              <Label>Banco (opcional)</Label>
              <Input
                type="text"
                value={formData.banco1_cli || ''}
                onChange={(e) => handleInputChange('banco1_cli', e.target.value)}
                placeholder="Banco (opcional)"
              />
            </FormGroup>

            <FormGroup>
              <Label>Agência (opcional)</Label>
              <Input
                type="text"
                value={formData.agenc1_cli || ''}
                onChange={(e) => handleInputChange('agenc1_cli', e.target.value)}
                placeholder="Agência (opcional)"
              />
            </FormGroup>

            {/* Linha 04: Conta (alternativo), Cidade (alternativo) */}
            <FormGroup>
              <Label>Conta (opcional)</Label>
              <Input
                type="text"
                value={formData.conta1_cli || ''}
                onChange={(e) => handleInputChange('conta1_cli', e.target.value)}
                placeholder="Conta (opcional)"
              />
            </FormGroup>

            <FormGroup>
              <Label>Cidade (opcional)</Label>
              <Input
                type="text"
                value={formData.cidbco1_cli || ''}
                onChange={(e) => handleInputChange('cidbco1_cli', e.target.value)}
                placeholder="Cidade (opcional)"
              />
            </FormGroup>
          </FormGrid>
        </>
      )}

      

      <ButtonGroup>
  <Button type="button" $variant="secondary" onClick={onCancel}>
          <FontAwesomeIcon icon={faTimes} />
          Cancelar
        </Button>
        <Button 
          type="button" 
          $variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </ButtonGroup>
        {errors.form && <ErrorMessage style={{ gridColumn: '1 / -1' }}>{errors.form}</ErrorMessage>}

      {/* Modal de confirmação para abandonar alterações */}
      <div data-confirm-modal-fornecedor>
        <ConfirmDiscardChangesModal
          isOpen={showConfirmModal}
          onConfirm={() => {
            const modal = document.querySelector('[data-confirm-modal-fornecedor]') as any;
            if (modal?._handleConfirm) modal._handleConfirm();
          }}
          onCancel={() => {
            const modal = document.querySelector('[data-confirm-modal-fornecedor]') as any;
            if (modal?._handleCancel) modal._handleCancel();
          }}
          title="Abandonar Alterações no Fornecedor?"
          message="Você possui alterações não salvas no cadastro do fornecedor. Tem certeza que deseja fechar este formulário? Todas as alterações serão perdidas."
        />
      </div>
    </FormContainer>
  );
};

export { FornecedorForm };













