import React from 'react';
import styled from 'styled-components';
import { NaturezaItem } from './NaturezaItemTypes';

interface NaturezaItensFormProps {
  data: Partial<NaturezaItem>;
  onChange: (campo: keyof NaturezaItem, valor: any) => void;
  mode: 'create' | 'edit';
}

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;

  .required {
    color: #dc2626;
  }
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: #f9fafb;
  text-transform: uppercase;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &:disabled {
    background: #e5e7eb;
    cursor: not-allowed;
  }
`;

const GroupBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const GroupBoxTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 700;
  color: #0056b3;
  border-bottom: 2px solid #0056b3;
  padding-bottom: 8px;
`;

const HelpText = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

const AlertBox = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #92400e;
`;

const NaturezaItensForm: React.FC<NaturezaItensFormProps> = ({ data, onChange, mode }) => {
  const handleChange = (campo: keyof NaturezaItem, valor: any) => {
    onChange(campo, valor);
  };

  const isReserved = data.natureza_nat && ['X', 'L', 'V', 'S'].includes(data.natureza_nat.toUpperCase());

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {isReserved && (
        <AlertBox>
          ⚠️ Códigos X, L, V, S são reservados para uso do sistema e não podem ser alterados.
        </AlertBox>
      )}

      <GroupBox>
        <GroupBoxTitle>Dados da Natureza de Item</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Código <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.natureza_nat || ''}
              onChange={(e) => handleChange('natureza_nat', e.target.value.toUpperCase())}
              disabled={mode === 'edit'}
              maxLength={1}
              required
            />
            <HelpText>1 caractere (X, L, V, S são reservados)</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Descrição <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.descricao_nat || ''}
              onChange={(e) => handleChange('descricao_nat', e.target.value)}
              maxLength={30}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>C.Custo</Label>
            <Input
              type="number"
              value={data.ccusto_nat || ''}
              onChange={(e) => handleChange('ccusto_nat', parseInt(e.target.value) || 0)}
              max={999}
            />
            <HelpText>Centro de custo (opcional)</HelpText>
          </FormGroup>
        </FormGrid>
      </GroupBox>
    </form>
  );
};

export default NaturezaItensForm;













