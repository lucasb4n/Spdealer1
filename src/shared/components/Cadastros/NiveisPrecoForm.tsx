import React from 'react';
import styled from 'styled-components';
import { NivelPreco } from './NivelPrecoTypes';

interface NiveisPrecoFormProps {
  data: Partial<NivelPreco>;
  onChange: (campo: keyof NivelPreco, valor: any) => void;
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

const NiveisPrecoForm: React.FC<NiveisPrecoFormProps> = ({ data, onChange, mode }) => {
  const handleChange = (campo: keyof NivelPreco, valor: any) => {
    onChange(campo, valor);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <GroupBox>
        <GroupBoxTitle>Dados do Nível de Preço</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Código <span className="required">*</span></Label>
            <Input
              type="number"
              value={data.nivel_niv || ''}
              onChange={(e) => handleChange('nivel_niv', parseInt(e.target.value) || 0)}
              disabled={mode === 'edit'}
              min={1}
              max={999}
              required
            />
            <HelpText>Código do nível de preço (1-999)</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Descrição <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.descr_niv || ''}
              onChange={(e) => handleChange('descr_niv', e.target.value)}
              maxLength={50}
              required
            />
            <HelpText>Ex: Balcão, Atacado, Varejo</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Percentual (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.perc_niv || ''}
              onChange={(e) => handleChange('perc_niv', parseFloat(e.target.value) || 0)}
              max={999.99}
            />
            <HelpText>Percentual de acréscimo ou desconto</HelpText>
          </FormGroup>
        </FormGrid>
      </GroupBox>
    </form>
  );
};

export default NiveisPrecoForm;













