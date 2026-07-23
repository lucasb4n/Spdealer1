import React from 'react';
import styled from 'styled-components';
import { TipoOs } from './TipoOsTypes';

interface TiposOsFormProps {
  data: Partial<TipoOs>;
  onChange: (campo: keyof TipoOs, valor: any) => void;
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

const Select = styled.select`
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
`;

const FieldGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
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

const TiposOsForm: React.FC<TiposOsFormProps> = ({ data, onChange, mode }) => {
  const handleChange = (campo: keyof TipoOs, valor: any) => {
    onChange(campo, valor);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <GroupBox>
        <GroupBoxTitle>Dados Principais</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Código <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.codigo_os || ''}
              onChange={(e) => handleChange('codigo_os', e.target.value)}
              disabled={mode === 'edit'}
              maxLength={2}
              required
            />
            <HelpText>Código do tipo de O.S. (2 caracteres)</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Descrição <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.descr_os || ''}
              onChange={(e) => handleChange('descr_os', e.target.value)}
              maxLength={50}
              required
            />
          </FormGroup>
        </FormGrid>
      </GroupBox>

      <GroupBox>
        <GroupBoxTitle>Configurações de Valorização</GroupBoxTitle>
        <FieldGroup>
          <FormGroup>
            <Label>Valorização</Label>
            <Select
              value={data.valor_os || 'C'}
              onChange={(e) => handleChange('valor_os', e.target.value)}
            >
              <option value="C">C - Custo</option>
              <option value="V">V - Venda</option>
              <option value="R">R - Reposição</option>
              <option value="G">G - Garantia</option>
              <option value="M">M - Média</option>
            </Select>
            <HelpText>C= Custo, V= Venda, R= Reposição, G= Garantia, M= Média</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Código p/ Totalizar</Label>
            <Input
              type="text"
              value={data.total_os || ''}
              onChange={(e) => handleChange('total_os', e.target.value)}
              maxLength={2}
            />
            <HelpText>V1-V4, D1-D4, I1-I4</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Acréscimo (%)</Label>
            <Input
              type="number"
              step="0.0001"
              value={data.acres_os || ''}
              onChange={(e) => handleChange('acres_os', parseFloat(e.target.value) || 0)}
              max={9.9999}
            />
          </FormGroup>
        </FieldGroup>
      </GroupBox>

      <GroupBox>
        <GroupBoxTitle>Emissão Fiscal</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Emite Serviços NF</Label>
            <Select
              value={data.emisernf_os || 'N'}
              onChange={(e) => handleChange('emisernf_os', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Emite Peças NF</Label>
            <Select
              value={data.emipecnf_os || 'N'}
              onChange={(e) => handleChange('emipecnf_os', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>O.S. Interna</Label>
            <Select
              value={data.interna_os || 'N'}
              onChange={(e) => handleChange('interna_os', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </GroupBox>

      <GroupBox>
        <GroupBoxTitle>Departamento e Custo</GroupBoxTitle>
        <FieldGroup>
          <FormGroup>
            <Label>Departamento</Label>
            <Input
              type="number"
              value={data.depto_os || ''}
              onChange={(e) => handleChange('depto_os', parseInt(e.target.value) || 0)}
              max={999}
            />
          </FormGroup>

          <FormGroup>
            <Label>C.Custo</Label>
            <Input
              type="number"
              value={data.ccusto_os || ''}
              onChange={(e) => handleChange('ccusto_os', parseInt(e.target.value) || 0)}
              max={999}
            />
          </FormGroup>
        </FieldGroup>
      </GroupBox>

      <GroupBox>
        <GroupBoxTitle>Valores e Comissões</GroupBoxTitle>
        <FieldGroup>
          <FormGroup>
            <Label>Valor da Mão de Obra</Label>
            <Input
              type="number"
              step="0.01"
              value={data.valormo_os || ''}
              onChange={(e) => handleChange('valormo_os', parseFloat(e.target.value) || 0)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Comissão (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.comissao_os || ''}
              onChange={(e) => handleChange('comissao_os', parseFloat(e.target.value) || 0)}
              max={99.99}
            />
          </FormGroup>
        </FieldGroup>
      </GroupBox>
    </form>
  );
};

export default TiposOsForm;













