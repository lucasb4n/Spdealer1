import React from 'react';
import styled from 'styled-components';
import { GrupoItem } from './GrupoItemTypes';

interface GrupoItensFormProps {
  data: Partial<GrupoItem>;
  onChange: (campo: keyof GrupoItem, valor: any) => void;
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

const FormGroupFull = styled(FormGroup)`
  grid-column: 1 / -1;
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

const GrupoItensForm: React.FC<GrupoItensFormProps> = ({ data, onChange, mode }) => {
  const handleChange = (campo: keyof GrupoItem, valor: any) => {
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
              type="number"
              value={data.grupo_gru || ''}
              onChange={(e) => handleChange('grupo_gru', parseInt(e.target.value) || 0)}
              disabled={mode === 'edit'}
              min={1}
              max={999}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Descrição <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.descr_gru || ''}
              onChange={(e) => handleChange('descr_gru', e.target.value)}
              maxLength={50}
              required
            />
          </FormGroup>
        </FormGrid>
      </GroupBox>

      <GroupBox>
        <GroupBoxTitle>Margem e Comissão</GroupBoxTitle>
        <FieldGroup>
          <FormGroup>
            <Label>Percentual Margem</Label>
            <Input
              type="number"
              step="0.001"
              value={data.perc_gru || ''}
              onChange={(e) => handleChange('perc_gru', parseFloat(e.target.value) || 0)}
              max={999.999}
            />
          </FormGroup>

          <FormGroup>
            <Label>Percentual Comissão</Label>
            <Input
              type="number"
              step="0.01"
              value={data.percom_gru || ''}
              onChange={(e) => handleChange('percom_gru', parseFloat(e.target.value) || 0)}
              max={99.99}
            />
          </FormGroup>
        </FieldGroup>
      </GroupBox>

      <GroupBox>
        <GroupBoxTitle>Configurações</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Preço em Dólar</Label>
            <Select
              value={data.dolar_gru || 'N'}
              onChange={(e) => handleChange('dolar_gru', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Consumo</Label>
            <Select
              value={data.consumo_gru || 'N'}
              onChange={(e) => handleChange('consumo_gru', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
            <HelpText>S=Grupo de itens para consumo interno</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Destaca IPI</Label>
            <Select
              value={data.ipi_gru || 'N'}
              onChange={(e) => handleChange('ipi_gru', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
            <HelpText>S=Destaca valor de IPI na NF</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Usar Preço de Custo</Label>
            <Select
              value={data.usacusto_gru || 'N'}
              onChange={(e) => handleChange('usacusto_gru', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Não Imprimir Categoria NF</Label>
            <Select
              value={data.semfab_gru || 'N'}
              onChange={(e) => handleChange('semfab_gru', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
            <HelpText>S=Não informa código da categoria</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Tipo Preço FOB</Label>
            <Select
              value={data.fob_gru || 'N'}
              onChange={(e) => handleChange('fob_gru', e.target.value)}
            >
              <option value="S">S - FOB</option>
              <option value="N">N - Não FOB</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </GroupBox>
    </form>
  );
};

export default GrupoItensForm;













