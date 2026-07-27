import React from 'react';
import styled from 'styled-components';
import { Departamento } from './DepartamentoTypes';

interface DepartamentosFormProps {
  data: Partial<Departamento>;
  onChange: (campo: keyof Departamento, valor: any) => void;
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

const DepartamentosForm: React.FC<DepartamentosFormProps> = ({ data, onChange, mode }) => {
  const handleChange = (campo: keyof Departamento, valor: any) => {
    onChange(campo, valor);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {/* DADOS PRINCIPAIS */}
      <GroupBox>
        <GroupBoxTitle>Dados do Departamento</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Filial</Label>
            <Input
              type="text"
              value={data.filial_dep || ''}
              onChange={(e) => handleChange('filial_dep', e.target.value)}
              disabled={mode === 'edit'}
              maxLength={3}
            />
          </FormGroup>

          <FormGroup>
            <Label>Código <span className="required">*</span></Label>
            <Input
              type="number"
              value={data.codigo_dep || ''}
              onChange={(e) => handleChange('codigo_dep', parseInt(e.target.value) || 0)}
              disabled={mode === 'edit'}
              min={1}
              max={9999999}
            />
          </FormGroup>

          <FormGroupFull>
            <Label>Descrição <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.descr_dep || ''}
              onChange={(e) => handleChange('descr_dep', e.target.value)}
              maxLength={50}
              required
            />
          </FormGroupFull>

          <FormGroup>
            <Label>Gerente</Label>
            <Input
              type="text"
              value={data.ger_dep || ''}
              onChange={(e) => handleChange('ger_dep', e.target.value)}
              maxLength={30}
            />
          </FormGroup>

          <FormGroup>
            <Label>Sigla</Label>
            <Input
              type="text"
              value={data.sigla_dep || ''}
              onChange={(e) => handleChange('sigla_dep', e.target.value)}
              maxLength={2}
            />
          </FormGroup>
        </FormGrid>
      </GroupBox>

      {/* CONTAS CONTÁBEIS */}
      <GroupBox>
        <GroupBoxTitle>Contas Contábeis</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Conta</Label>
            <Input
              type="text"
              value={data.conta_dep || ''}
              onChange={(e) => handleChange('conta_dep', e.target.value)}
              maxLength={13}
            />
            <HelpText>Código da conta contábil</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Código Banco</Label>
            <Input
              type="text"
              value={data.codbco_dep || ''}
              onChange={(e) => handleChange('codbco_dep', e.target.value)}
              maxLength={3}
            />
          </FormGroup>

          <FormGroup>
            <Label>Conta Cliente</Label>
            <Input
              type="text"
              value={data.contacli_dep || ''}
              onChange={(e) => handleChange('contacli_dep', e.target.value)}
              maxLength={10}
            />
          </FormGroup>

          <FormGroup>
            <Label>Conta Fornecedor</Label>
            <Input
              type="text"
              value={data.contafor_dep || ''}
              onChange={(e) => handleChange('contafor_dep', e.target.value)}
              maxLength={10}
            />
          </FormGroup>
        </FormGrid>
      </GroupBox>
    </form>
  );
};

export default DepartamentosForm;













