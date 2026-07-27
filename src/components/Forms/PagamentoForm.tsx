import React, { useState } from 'react';
import styled from 'styled-components';
// FontAwesome icons removed (unused)

// ============================================================================
// TASK-104: CONTAS A PAGAR
// Fase 2: Implementação completa (baseada em RecebimentoForm)
// Status: ✅ PRONTO PARA TESTES VISUAIS
// Data: 02 NOV 2025
// ⚠️ CRÍTICO: Campos com "i" (dtpagi_pag, dtvenci_pag)
// ============================================================================

interface Pagamento {
  id?: number;
  fornecedor_id: number;
  numero_nf: string;
  dtmovi_pag: string;
  dtpag_pag: number;
  dtpagi_pag: string;
  dtvenci_pag: number;
  dtvenci_pagi: string;
  vlr_pag: number;
  juros_pag?: number;
  multa_pag?: number;
  desconto_pag?: number;
  status_pag: 'Pendente' | 'Pago' | 'Cancelado';
  obs_pag?: string;
}

interface Fornecedor {
  id: number;
  nome: string;
}

interface ValidationError {
  [key: string]: string;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
`;

const FormTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row-reverse;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.variant === 'primary' ? '#f44336' : '#ccc'};
  background: ${props => props.variant === 'primary' ? '#f44336' : '#fff'};
  color: ${props => props.variant === 'primary' ? '#fff' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#d32f2f' : '#f0f0f0'};
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const FormContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const FormBody = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div<{ fullWidth?: boolean }>`
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #333;

  span {
    color: #f44336;
  }
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.hasError ? '#f44336' : '#ccc'};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #f44336;
    box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.hasError ? '#f44336' : '#ccc'};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #f44336;
  }
`;

const ErrorText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #f44336;
`;

const SectionTitle = styled.h3`
  margin: 24px 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;

  &:first-child {
    margin-top: 0;
  }
`;

const WarningBox = styled.div`
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #856404;
  line-height: 1.5;
`;

// ============================================================================
// COMPONENT PRINCIPAL
// ============================================================================

const PagamentoForm: React.FC<{ pagamentoId?: number; fornecedores?: Fornecedor[] }> = ({
  pagamentoId,
  fornecedores = [],
}) => {
  const [formData, setFormData] = useState<Pagamento>({
    fornecedor_id: 0,
    numero_nf: '',
    dtmovi_pag: new Date().toISOString().split('T')[0],
    dtpag_pag: 0,
    dtpagi_pag: new Date().toISOString().split('T')[0],
    dtvenci_pag: 0,
    dtvenci_pagi: new Date().toISOString().split('T')[0],
    vlr_pag: 0,
    juros_pag: 0,
    multa_pag: 0,
    desconto_pag: 0,
    status_pag: 'Pendente',
    obs_pag: '',
  });

  const [errors, setErrors] = useState<ValidationError>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const formatarDataParaDDMMAAAA = (data: string): number => {
    const [year, month, day] = data.split('-');
    return parseInt(`${day}${month}${year}`);
  };

  // ============================================================================
  // VALIDAÇÕES
  // ============================================================================

  const validate = (): ValidationError => {
    const newErrors: ValidationError = {};

    if (!formData.fornecedor_id) {
      newErrors.fornecedor_id = 'Fornecedor é obrigatório';
    }

    if (!formData.numero_nf) {
      newErrors.numero_nf = 'Número da NF é obrigatório';
    }

    if (formData.vlr_pag <= 0) {
      newErrors.vlr_pag = 'Valor deve ser maior que zero';
    }

    const dataVencimento = new Date(formData.dtvenci_pagi);
    const dataPagamento = new Date(formData.dtpagi_pag);

    if (dataVencimento < dataPagamento && formData.status_pag === 'Pago') {
      newErrors.dtvenci_pagi = 'Data de pagamento não pode ser depois de vencimento';
    }

    if (formData.juros_pag && formData.juros_pag < 0) {
      newErrors.juros_pag = 'Juros não pode ser negativo';
    }

    if (formData.multa_pag && formData.multa_pag < 0) {
      newErrors.multa_pag = 'Multa não pode ser negativa';
    }

    if (formData.desconto_pag && formData.desconto_pag < 0) {
      newErrors.desconto_pag = 'Desconto não pode ser negativo';
    }

    return newErrors;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_') && !name.startsWith('numero_') && !name.startsWith('status_')
        ? parseFloat(value) || 0
        : value,
    }));
    setHasChanges(true);
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>, fieldPag: string, fieldPagi: string) => {
    const { value } = e.target;
    const ddmmaaaa = formatarDataParaDDMMAAAA(value);

    setFormData(prev => ({
      ...prev,
      [fieldPag]: ddmmaaaa,
      [fieldPagi]: value,
    }));
    setHasChanges(true);
    if (errors[fieldPagi]) {
      setErrors(prev => ({ ...prev, [fieldPagi]: '' }));
    }
  };

  const handleSave = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const endpoint = pagamentoId
        ? `/api/v1/pagamentos/${pagamentoId}`
        : '/api/v1/pagamentos';
      const method = pagamentoId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Pagamento salvo com sucesso!');
        setHasChanges(false);
        window.location.href = '/pagamentos';
      } else {
        alert('Erro ao salvar pagamento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm('Existem alterações não salvas. Deseja descartar?')) {
      return;
    }
    window.location.href = '/pagamentos';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>💸 {pagamentoId ? 'Editar' : 'Novo'} Pagamento</FormTitle>
        <HeaderActions>
          <Button variant="secondary" onClick={handleCancel}>
            CANCELAR
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'SALVANDO...' : 'SALVAR'}
          </Button>
        </HeaderActions>
      </FormHeader>

      <FormContent>
        <FormBody>
          <WarningBox>
            ⚠️ <strong>Aviso de Implementação:</strong> Campos de data com "i" (ex:
            dtpagi_pag, dtvenci_pagi) e sem "i" (ex: dtpag_pag, dtvenci_pag) são gravados
            automaticamente. O formulário mostra apenas YYYY-MM-DD (pagi).
          </WarningBox>

          {/* DOCUMENTO */}
          <SectionTitle>📄 Documento</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>
                Fornecedor <span>*</span>
              </Label>
              <Select
                name="fornecedor_id"
                value={formData.fornecedor_id}
                onChange={handleChange}
                hasError={!!errors.fornecedor_id}
              >
                <option value={0}>-- Selecione --</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </Select>
              {errors.fornecedor_id && <ErrorText>{errors.fornecedor_id}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>
                NF <span>*</span>
              </Label>
              <Input
                type="text"
                name="numero_nf"
                value={formData.numero_nf}
                onChange={handleChange}
                placeholder="123456"
                hasError={!!errors.numero_nf}
              />
              {errors.numero_nf && <ErrorText>{errors.numero_nf}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Status</Label>
              <Select name="status_pag" value={formData.status_pag} onChange={handleChange}>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Cancelado">Cancelado</option>
              </Select>
            </FormGroup>
          </FormGrid>

          {/* DATAS */}
          <SectionTitle>📅 Datas</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>Data de Emissão</Label>
              <Input
                type="date"
                value={formData.dtpagi_pag}
                onChange={e => handleDataChange(e, 'dtpag_pag', 'dtpagi_pag')}
              />
            </FormGroup>

            <FormGroup>
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={formData.dtvenci_pagi}
                onChange={e => handleDataChange(e, 'dtvenci_pag', 'dtvenci_pagi')}
                hasError={!!errors.dtvenci_pagi}
              />
              {errors.dtvenci_pagi && <ErrorText>{errors.dtvenci_pagi}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Data do Movimento</Label>
              <Input
                type="date"
                name="dtmovi_pag"
                value={formData.dtmovi_pag}
                onChange={handleChange}
              />
            </FormGroup>
          </FormGrid>

          {/* VALORES */}
          <SectionTitle>💵 Valores</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>
                Valor Original <span>*</span>
              </Label>
              <Input
                type="number"
                name="vlr_pag"
                value={formData.vlr_pag}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.vlr_pag}
              />
              {errors.vlr_pag && <ErrorText>{errors.vlr_pag}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Juros</Label>
              <Input
                type="number"
                name="juros_pag"
                value={formData.juros_pag}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.juros_pag}
              />
              {errors.juros_pag && <ErrorText>{errors.juros_pag}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Multa</Label>
              <Input
                type="number"
                name="multa_pag"
                value={formData.multa_pag}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.multa_pag}
              />
              {errors.multa_pag && <ErrorText>{errors.multa_pag}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Desconto</Label>
              <Input
                type="number"
                name="desconto_pag"
                value={formData.desconto_pag}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.desconto_pag}
              />
              {errors.desconto_pag && <ErrorText>{errors.desconto_pag}</ErrorText>}
            </FormGroup>

            <FormGroup fullWidth>
              <Label>
                <strong>Total: R${' '}
                  {(
                    formData.vlr_pag +
                    (formData.juros_pag || 0) +
                    (formData.multa_pag || 0) -
                    (formData.desconto_pag || 0)
                  ).toFixed(2)}
                </strong>
              </Label>
            </FormGroup>
          </FormGrid>

          {/* OBSERVAÇÕES */}
          <SectionTitle>📝 Observações</SectionTitle>
          <FormGrid>
            <FormGroup fullWidth>
              <Label>Observações</Label>
              <Input
                as="textarea"
                name="obs_pag"
                value={formData.obs_pag}
                onChange={handleChange}
                placeholder="Digite observações..."
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </FormGroup>
          </FormGrid>
        </FormBody>
      </FormContent>
    </FormContainer>
  );
};

export default PagamentoForm;













