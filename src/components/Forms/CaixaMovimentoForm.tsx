import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';

// ============================================================================
// TASK-105: CAIXA - FORMULÁRIO DE MOVIMENTO
// Fase 2: Implementação completa
// Status: ✅ PRONTO PARA TESTES VISUAIS
// Data: 02 NOV 2025
// Nota: Operações diárias, débito/crédito com consolidação automática
// ============================================================================

interface CaixaMovimento {
  id?: number;
  dtmovi_cai: string;
  dc_cai: 'C' | 'D';
  valor_cai: number;
  filial_cai: string;
  banco_cai: string;
  cliente_cai: string;
  descricao: string;
  observacao?: string;
}

interface Banco {
  codigo_bco: string;
  nomefan_bco: string;
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
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  border-bottom: 2px solid #1565c0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: white;

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
  border: 1px solid ${props => props.variant === 'primary' ? '#fff' : '#ccc'};
  background: ${props => props.variant === 'primary' ? '#fff' : '#f0f0f0'};
  color: ${props => props.variant === 'primary' ? '#2196f3' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#e3f2fd' : '#e0e0e0'};
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
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div<{ fullWidth?: boolean; col?: number }>`
  grid-column: ${props => props.fullWidth ? '1 / -1' : props.col ? `span ${props.col}` : 'auto'};
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
  padding: 10px 12px;
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
  padding: 10px 12px;
  border: 1px solid ${props => props.hasError ? '#f44336' : '#ccc'};
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

interface DCButtonProps {
  $active: boolean;
  $type: 'C' | 'D';
}

const DCToggle = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 6px;
`;

const DCButton = styled.button<DCButtonProps>`
  flex: 1;
  padding: 10px;
  border: 2px solid ${(props) => props.$active ? (props.$type === 'C' ? '#4caf50' : '#f44336') : '#ccc'};
  background: ${(props) => props.$active ? (props.$type === 'C' ? '#e8f5e9' : '#ffebee') : '#fff'};
  color: ${(props) => props.$active ? (props.$type === 'C' ? '#2e7d32' : '#c62828') : '#999'};
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(props) => props.$type === 'C' ? '#4caf50' : '#f44336'};
  }
`;

const InfoBox = styled.div<{ type?: 'info' | 'warning' | 'error' }>`
  padding: 12px;
  background: ${props => {
    if (props.type === 'warning') return '#fff3cd';
    if (props.type === 'error') return '#ffebee';
    return '#e3f2fd';
  }};
  border-left: 4px solid ${props => {
    if (props.type === 'warning') return '#ffc107';
    if (props.type === 'error') return '#f44336';
    return '#2196f3';
  }};
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
  line-height: 1.5;
  color: ${props => {
    if (props.type === 'warning') return '#856404';
    if (props.type === 'error') return '#c62828';
    return '#01579b';
  }};
`;

const ValueDisplay = styled.div`
  padding: 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
  color: #333;
  font-size: 16px;
`;

const ErrorText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #f44336;
`;

const SectionTitle = styled.h3`
  margin: 20px 0 12px 0;
  font-size: 13px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;

  &:first-child {
    margin-top: 0;
  }
`;

// ============================================================================
// COMPONENT PRINCIPAL
// ============================================================================

const CaixaMovimentoForm: React.FC<{ movimentoId?: number; bancos?: Banco[] }> = ({
  movimentoId,
  bancos = [],
}) => {
  const [formData, setFormData] = useState<CaixaMovimento>({
    dtmovi_cai: new Date().toISOString().split('T')[0],
    dc_cai: 'C',
    valor_cai: 0,
    filial_cai: '001',
    banco_cai: '001',
    cliente_cai: '',
    descricao: '',
    observacao: '',
  });

  const [errors, setErrors] = useState<ValidationError>({});
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // VALIDAÇÕES
  // ============================================================================

  const validate = (): ValidationError => {
    const newErrors: ValidationError = {};

    if (formData.valor_cai <= 0) {
      newErrors.valor_cai = 'Valor deve ser maior que zero';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
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
      [name]: name === 'valor_cai' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDCChange = (dc: 'C' | 'D') => {
    setFormData(prev => ({ ...prev, dc_cai: dc }));
  };

  const handleSave = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const endpoint = movimentoId
        ? `/api/v1/caixa/${movimentoId}`
        : '/api/v1/caixa';
      const method = movimentoId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Movimento de caixa registrado com sucesso!');
        window.location.href = '/caixa';
      } else {
        alert('Erro ao registrar movimento');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao registrar movimento');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = '/caixa';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          <FontAwesomeIcon icon={faExchangeAlt} />
          {movimentoId ? 'Editar' : 'Novo'} Movimento de Caixa
        </FormTitle>
        <HeaderActions>
          <Button variant="secondary" onClick={handleCancel}>
            CANCELAR
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'SALVANDO...' : 'REGISTRAR'}
          </Button>
        </HeaderActions>
      </FormHeader>

      <FormContent>
        <FormBody>
          <InfoBox type="info">
            💡 <strong>Movimentos de Caixa:</strong> Registre créditos (dinheiro entrando) ou
            débitos (dinheiro saindo). A consolidação é automática no fechamento do dia.
          </InfoBox>

          {/* TIPO DE OPERAÇÃO */}
          <SectionTitle>Tipo de Operação</SectionTitle>
          <FormGrid>
            <FormGroup fullWidth col={2}>
              <Label>Débito / Crédito</Label>
              <DCToggle>
                <DCButton
                  $type="C"
                  $active={formData.dc_cai === 'C'}
                  onClick={() => handleDCChange('C')}
                >
                  ✅ CRÉDITO (+)
                </DCButton>
                <DCButton
                  $type="D"
                  $active={formData.dc_cai === 'D'}
                  onClick={() => handleDCChange('D')}
                >
                  ❌ DÉBITO (-)
                </DCButton>
              </DCToggle>
            </FormGroup>
          </FormGrid>

          {/* IDENTIFICAÇÃO */}
          <SectionTitle>Identificação</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>Data do Movimento</Label>
              <Input
                type="date"
                name="dtmovi_cai"
                value={formData.dtmovi_cai}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>Banco / Caixa</Label>
              <Select name="banco_cai" value={formData.banco_cai} onChange={handleChange}>
                <option value="001">Caixa Principal</option>
                <option value="002">Caixa de Viagem</option>
                <option value="003">Caixa de Funcionários</option>
              </Select>
            </FormGroup>
          </FormGrid>

          {/* VALORES */}
          <SectionTitle>Valor</SectionTitle>
          <FormGrid>
            <FormGroup fullWidth>
              <Label>
                Valor <span>*</span>
              </Label>
              <Input
                type="number"
                name="valor_cai"
                value={formData.valor_cai}
                onChange={handleChange}
                placeholder="0,00"
                step="0.01"
                hasError={!!errors.valor_cai}
              />
              {errors.valor_cai && <ErrorText>{errors.valor_cai}</ErrorText>}
              <ValueDisplay>
                R$ {formData.valor_cai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </ValueDisplay>
            </FormGroup>
          </FormGrid>

          {/* DESCRIÇÃO */}
          <SectionTitle>Descrição</SectionTitle>
          <FormGrid>
            <FormGroup fullWidth>
              <Label>
                Descrição <span>*</span>
              </Label>
              <Input
                as="textarea"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Ex: Recebimento cliente X, Pagamento fornecedor Y, etc"
                style={{ minHeight: '60px', resize: 'vertical' }}
                hasError={!!errors.descricao}
              />
              {errors.descricao && <ErrorText>{errors.descricao}</ErrorText>}
            </FormGroup>

            <FormGroup fullWidth>
              <Label>Observações (opcional)</Label>
              <Input
                as="textarea"
                name="observacao"
                value={formData.observacao}
                onChange={handleChange}
                placeholder="Anotações adicionais..."
                style={{ minHeight: '60px', resize: 'vertical' }}
              />
            </FormGroup>
          </FormGrid>

          <InfoBox type="warning">
            ⚠️ <strong>Importante:</strong> Operações de caixa não podem ser editadas após
            registro. Se houver erro, registre uma operação inversa (débito no crédito, ou
            vice-versa).
          </InfoBox>
        </FormBody>
      </FormContent>
    </FormContainer>
  );
};

export default CaixaMovimentoForm;













