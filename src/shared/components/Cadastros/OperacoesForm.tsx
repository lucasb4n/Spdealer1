import React from 'react';
import styled from 'styled-components';
import { Operacao } from './OperacaoTypes';

interface OperacoesFormProps {
  data: Partial<Operacao>;
  onChange: (campo: keyof Operacao, valor: any) => void;
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

const OperacoesForm: React.FC<OperacoesFormProps> = ({ data, onChange, mode }) => {
  const handleChange = (campo: keyof Operacao, valor: any) => {
    onChange(campo, valor);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {/* DADOS PRINCIPAIS */}
      <GroupBox>
        <GroupBoxTitle>Dados Principais</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Código</Label>
            <Input
              type="number"
              value={data.codigo_ope || ''}
              onChange={(e) => handleChange('codigo_ope', parseInt(e.target.value) || 0)}
              disabled={mode === 'edit'}
              min={1}
              max={999}
            />
          </FormGroup>

          <FormGroup>
            <Label>Descrição <span className="required">*</span></Label>
            <Input
              type="text"
              value={data.descr_ope || ''}
              onChange={(e) => handleChange('descr_ope', e.target.value)}
              maxLength={50}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Ativo</Label>
            <Select
              value={data.ativo_ope || 'S'}
              onChange={(e) => handleChange('ativo_ope', e.target.value)}
            >
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </GroupBox>

      {/* CFOP */}
      <GroupBox>
        <GroupBoxTitle>CFOP - Código Fiscal de Operações</GroupBoxTitle>
        <FieldGroup>
          <FormGroup>
            <Label>CFOP Contribuinte</Label>
            <Input
              type="number"
              value={data.codope_ope || ''}
              onChange={(e) => handleChange('codope_ope', parseInt(e.target.value) || 0)}
              max={99999}
            />
          </FormGroup>

          <FormGroup>
            <Label>CFOP Não Contribuinte</Label>
            <Input
              type="number"
              value={data.codopef_ope || ''}
              onChange={(e) => handleChange('codopef_ope', parseInt(e.target.value) || 0)}
              max={99999}
            />
          </FormGroup>

          <FormGroup>
            <Label>CFOP Subst. Tributária</Label>
            <Input
              type="number"
              value={data.cfosub_ope || ''}
              onChange={(e) => handleChange('cfosub_ope', parseInt(e.target.value) || 0)}
              max={99999}
            />
          </FormGroup>
        </FieldGroup>

        <FieldGroup style={{ marginTop: '16px' }}>
          <FormGroup>
            <Label>CFOP 1 Contribuinte</Label>
            <Input
              type="number"
              value={data.codope1_ope || ''}
              onChange={(e) => handleChange('codope1_ope', parseInt(e.target.value) || 0)}
              max={99999}
            />
          </FormGroup>

          <FormGroup>
            <Label>CFOP 1 Não Contribuinte</Label>
            <Input
              type="number"
              value={data.codope1f_ope || ''}
              onChange={(e) => handleChange('codope1f_ope', parseInt(e.target.value) || 0)}
              max={99999}
            />
          </FormGroup>

          <FormGroup>
            <Label>CFOP Subst. Não Contribuinte</Label>
            <Input
              type="number"
              value={data.cfosubf_ope || ''}
              onChange={(e) => handleChange('cfosubf_ope', parseInt(e.target.value) || 0)}
              max={99999}
            />
          </FormGroup>
        </FieldGroup>
      </GroupBox>

      {/* TRIBUTAÇÃO */}
      <GroupBox>
        <GroupBoxTitle>Tributação</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>% ICMS</Label>
            <Input
              type="number"
              step="0.001"
              value={data.icms_ope || ''}
              onChange={(e) => handleChange('icms_ope', parseFloat(e.target.value) || 0)}
              max={99.999}
            />
          </FormGroup>

          <FormGroup>
            <Label>% Redução Base ICMS</Label>
            <Input
              type="number"
              step="0.001"
              value={data.icmsub_ope || ''}
              onChange={(e) => handleChange('icmsub_ope', parseFloat(e.target.value) || 0)}
              max={99.999}
            />
          </FormGroup>

          <FormGroup>
            <Label>% Alíquota ISS</Label>
            <Input
              type="number"
              step="0.01"
              value={data.aliqiss_ope || ''}
              onChange={(e) => handleChange('aliqiss_ope', parseFloat(e.target.value) || 0)}
              max={99.99}
            />
          </FormGroup>

          <FormGroup>
            <Label>ISS Retido</Label>
            <Select
              value={data.issret_ope || 'N'}
              onChange={(e) => handleChange('issret_ope', e.target.value)}
            >
              <option value="N">Não</option>
              <option value="S">Sim</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Incide PIS/COFINS</Label>
            <Select
              value={data.piscofins_ope || 'N'}
              onChange={(e) => handleChange('piscofins_ope', e.target.value)}
            >
              <option value="N">Não</option>
              <option value="S">Sim</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Não Trib. ICMS</Label>
            <Select
              value={data.naotrib_ope || 0}
              onChange={(e) => handleChange('naotrib_ope', parseInt(e.target.value) || 0)}
            >
              <option value={0}>Não</option>
              <option value={1}>Sim</option>
            </Select>
          </FormGroup>
        </FormGrid>
      </GroupBox>

      {/* CST - PIS/COFINS/IPI */}
      <GroupBox>
        <GroupBoxTitle>CST - Código de Situação Tributária</GroupBoxTitle>
        <FieldGroup>
          <FormGroup>
            <Label>CST PIS</Label>
            <Input
              type="number"
              value={data.cstmpis_ope || ''}
              onChange={(e) => handleChange('cstmpis_ope', parseInt(e.target.value) || 0)}
              max={99}
            />
          </FormGroup>

          <FormGroup>
            <Label>CST COFINS</Label>
            <Input
              type="number"
              value={data.cstmcofins_ope || ''}
              onChange={(e) => handleChange('cstmcofins_ope', parseInt(e.target.value) || 0)}
              max={99}
            />
          </FormGroup>

          <FormGroup>
            <Label>CST IPI</Label>
            <Input
              type="number"
              value={data.cstipi_ope || ''}
              onChange={(e) => handleChange('cstipi_ope', parseInt(e.target.value) || 0)}
              max={99}
            />
          </FormGroup>
        </FieldGroup>
      </GroupBox>

      {/* CLASSIFICAÇÃO */}
      <GroupBox>
        <GroupBoxTitle>Classificação e Comportamento</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>Valorização</Label>
            <Select
              value={data.valor_ope || 'C'}
              onChange={(e) => handleChange('valor_ope', e.target.value)}
            >
              <option value="P">P - Preço Público</option>
              <option value="G">G - Preço Garantia</option>
              <option value="C">C - Custo Médio</option>
              <option value="R">R - Custo de Reposição</option>
              <option value="M">M - Preço Médio</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Sinal</Label>
            <Select
              value={data.sinal_ope || '+'}
              onChange={(e) => handleChange('sinal_ope', e.target.value)}
            >
              <option value="+">+ (Positivo)</option>
              <option value="-">- (Negativo)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>% Acréscimo</Label>
            <Input
              type="number"
              step="0.000001"
              value={data.acr_ope || ''}
              onChange={(e) => handleChange('acr_ope', parseFloat(e.target.value) || 0)}
              max={9.999999}
            />
          </FormGroup>

          <FormGroup>
            <Label>% IR Retido</Label>
            <Input
              type="number"
              step="0.01"
              value={data.irf_ope || ''}
              onChange={(e) => handleChange('irf_ope', parseFloat(e.target.value) || 0)}
              max={99.99}
            />
          </FormGroup>

          <FormGroup>
            <Label>Paga Comissão</Label>
            <Select
              value={data.pgcomi_ope || 'N'}
              onChange={(e) => handleChange('pgcomi_ope', e.target.value)}
            >
              <option value="N">Não</option>
              <option value="S">Sim</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Trib. Fiscal (Impressora)</Label>
            <Input
              type="text"
              value={data.tribfisc_ope || ''}
              onChange={(e) => handleChange('tribfisc_ope', e.target.value)}
              maxLength={2}
            />
          </FormGroup>
        </FormGrid>
      </GroupBox>

      {/* IPI */}
      <GroupBox>
        <GroupBoxTitle>IPI - Devolução</GroupBoxTitle>
        <FormGrid>
          <FormGroup>
            <Label>IPI Devolução</Label>
            <Select
              value={data.ipidev_ope || 'N'}
              onChange={(e) => handleChange('ipidev_ope', e.target.value)}
            >
              <option value="N">Não</option>
              <option value="I">I - Impresso no campo IPI</option>
              <option value="O">O - Observação NF com IPI</option>
              <option value="C">C - Calcula e soma na Base ICMS</option>
            </Select>
            <HelpText>I=Imprime no campo IPI, O=Observação NF, C=Calcula e soma BC ICMS</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>IPI não soma na BC ICMS</Label>
            <Select
              value={data.ipidevnaosoma_ope || 'N'}
              onChange={(e) => handleChange('ipidevnaosoma_ope', e.target.value)}
            >
              <option value="N">Não</option>
              <option value="S">Sim</option>
            </Select>
            <HelpText>Se S, não soma valor de IPI na base de cálculo do ICMS</HelpText>
          </FormGroup>
        </FormGrid>
      </GroupBox>

      {/* OBSERVAÇÕES */}
      <GroupBox>
        <GroupBoxTitle>Observações</GroupBoxTitle>
        <FormGroupFull>
          <Label>Observação NF</Label>
          <Input
            type="text"
            value={data.observacao_ope || ''}
            onChange={(e) => handleChange('observacao_ope', e.target.value)}
            maxLength={100}
          />
        </FormGroupFull>
      </GroupBox>
    </form>
  );
};

export default OperacoesForm;













