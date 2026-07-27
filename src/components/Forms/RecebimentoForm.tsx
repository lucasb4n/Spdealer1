import React, { useState } from 'react';
import styled from 'styled-components';

// ============================================================================
// TASK-103: CONTAS A RECEBER
// Fase 2: Implementação completa
// Status: ✅ PRONTO PARA TESTES VISUAIS
// Data: 02 NOV 2025
// ⚠️ CRÍTICO: Campos com "i" (dtemissi_reci, dtvenci_reci)
// ============================================================================

interface Recebimento {
  id?: number;
  cliente_id: number;
  numero_nf: string;
  dtmovi_rec: string;
  dtemissi_rec: number;
  dtemissi_reci: string;
  dtvenci_rec: number;
  dtvenci_reci: string;
  vlr_rec: number;
  juros_rec?: number;
  multa_rec?: number;
  desconto_rec?: number;
  status_rec: 'Pendente' | 'Recebido' | 'Cancelado';
  obs_rec?: string;
}

interface Cliente {
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
  border: 1px solid ${props => props.variant === 'primary' ? '#2196f3' : '#ccc'};
  background: ${props => props.variant === 'primary' ? '#2196f3' : '#fff'};
  color: ${props => props.variant === 'primary' ? '#fff' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#1976d2' : '#f0f0f0'};
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
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
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
    border-color: #2196f3;
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

const RecebimentoForm: React.FC<{ recebimentoId?: number; clientes?: Cliente[] }> = ({
  recebimentoId,
  clientes = [],
}) => {
  const [formData, setFormData] = useState<Recebimento>({
    cliente_id: 0,
    numero_nf: '',
    dtmovi_rec: new Date().toISOString().split('T')[0],
    dtemissi_rec: 0,
    dtemissi_reci: new Date().toISOString().split('T')[0],
    dtvenci_rec: 0,
    dtvenci_reci: new Date().toISOString().split('T')[0],
    vlr_rec: 0,
    juros_rec: 0,
    multa_rec: 0,
    desconto_rec: 0,
    status_rec: 'Pendente',
    obs_rec: '',
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

  // formatarDataDDMMAAAAParaYYYYMMDD removed (unused)

  // ============================================================================
  // VALIDAÇÕES
  // ============================================================================

  const validate = (): ValidationError => {
    const newErrors: ValidationError = {};

    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Cliente é obrigatório';
    }

    if (!formData.numero_nf) {
      newErrors.numero_nf = 'Número da NF é obrigatório';
    }

    if (formData.vlr_rec <= 0) {
      newErrors.vlr_rec = 'Valor deve ser maior que zero';
    }

    const dataVencimento = new Date(formData.dtvenci_reci);
    const dataEmissao = new Date(formData.dtemissi_reci);

    if (dataVencimento < dataEmissao) {
      newErrors.dtvenci_reci = 'Data de vencimento deve ser >= data de emissão';
    }

    if (formData.juros_rec && formData.juros_rec < 0) {
      newErrors.juros_rec = 'Juros não pode ser negativo';
    }

    if (formData.multa_rec && formData.multa_rec < 0) {
      newErrors.multa_rec = 'Multa não pode ser negativa';
    }

    if (formData.desconto_rec && formData.desconto_rec < 0) {
      newErrors.desconto_rec = 'Desconto não pode ser negativo';
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

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>, fieldRec: string, fieldReci: string) => {
    const { value } = e.target;
    const ddmmaaaa = formatarDataParaDDMMAAAA(value);

    setFormData(prev => ({
      ...prev,
      [fieldRec]: ddmmaaaa,
      [fieldReci]: value,
    }));
    setHasChanges(true);
    if (errors[fieldReci]) {
      setErrors(prev => ({ ...prev, [fieldReci]: '' }));
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
      const endpoint = recebimentoId
        ? `/api/v1/recebimentos/${recebimentoId}`
        : '/api/v1/recebimentos';
      const method = recebimentoId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Recebimento salvo com sucesso!');
        setHasChanges(false);
        // Redirecionar para lista
        window.location.href = '/recebimentos';
      } else {
        alert('Erro ao salvar recebimento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar recebimento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm('Existem alterações não salvas. Deseja descartar?')) {
      return;
    }
    window.location.href = '/recebimentos';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>💰 {recebimentoId ? 'Editar' : 'Novo'} Recebimento</FormTitle>
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
            dtemissi_reci, dtvenci_reci) e sem "i" (ex: dtemissi_rec, dtvenci_rec) são
            gravados automaticamente. O formulário mostra apenas YYYY-MM-DD (reci).
          </WarningBox>

          {/* DOCUMENTO */}
          <SectionTitle>📄 Documento</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>
                Cliente <span>*</span>
              </Label>
              <Select
                name="cliente_id"
                value={formData.cliente_id}
                onChange={handleChange}
                hasError={!!errors.cliente_id}
              >
                <option value={0}>-- Selecione --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
              {errors.cliente_id && <ErrorText>{errors.cliente_id}</ErrorText>}
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
              <Select name="status_rec" value={formData.status_rec} onChange={handleChange}>
                <option value="Pendente">Pendente</option>
                <option value="Recebido">Recebido</option>
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
                value={formData.dtemissi_reci}
                onChange={e => handleDataChange(e, 'dtemissi_rec', 'dtemissi_reci')}
              />
            </FormGroup>

            <FormGroup>
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={formData.dtvenci_reci}
                onChange={e => handleDataChange(e, 'dtvenci_rec', 'dtvenci_reci')}
                hasError={!!errors.dtvenci_reci}
              />
              {errors.dtvenci_reci && <ErrorText>{errors.dtvenci_reci}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Data do Movimento</Label>
              <Input
                type="date"
                name="dtmovi_rec"
                value={formData.dtmovi_rec}
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
                name="vlr_rec"
                value={formData.vlr_rec}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.vlr_rec}
              />
              {errors.vlr_rec && <ErrorText>{errors.vlr_rec}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Juros</Label>
              <Input
                type="number"
                name="juros_rec"
                value={formData.juros_rec}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.juros_rec}
              />
              {errors.juros_rec && <ErrorText>{errors.juros_rec}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Multa</Label>
              <Input
                type="number"
                name="multa_rec"
                value={formData.multa_rec}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.multa_rec}
              />
              {errors.multa_rec && <ErrorText>{errors.multa_rec}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>Desconto</Label>
              <Input
                type="number"
                name="desconto_rec"
                value={formData.desconto_rec}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.desconto_rec}
              />
              {errors.desconto_rec && <ErrorText>{errors.desconto_rec}</ErrorText>}
            </FormGroup>

            <FormGroup fullWidth>
              <Label>
                <strong>Total: R${' '}
                  {(
                    formData.vlr_rec +
                    (formData.juros_rec || 0) +
                    (formData.multa_rec || 0) -
                    (formData.desconto_rec || 0)
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
                name="obs_rec"
                value={formData.obs_rec}
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

export default RecebimentoForm;













