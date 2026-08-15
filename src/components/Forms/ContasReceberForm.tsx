import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { API_BASE_URL } from 'services/apiConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faEdit, 
  faTrash, 
  faSearch, 
  faPlus,
  faTimes,
  faFileInvoiceDollar,
  faCalendarAlt,
  faMoneyBillWave,
  faUser
} from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8f9fa;
`;

const FormContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #3b82f6, #1e40af);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`;

const FormContent = styled.div`
  padding: 25px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 25px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;

  &.three-cols {
    grid-template-columns: repeat(3, 1fr);
  }

  &.four-cols {
    grid-template-columns: repeat(4, 1fr);
  }

  &.two-cols {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  &.currency {
    text-align: right;
    background-color: #fff9f5;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

  const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
    ${props => {
      switch (props.$variant) {
        case 'primary':
          return `
            background: #3b82f6;
            color: white;
            &:hover:not(:disabled) { background: #2563eb; }
          `;
        case 'success':
          return `
            background: #10b981;
            color: white;
            &:hover:not(:disabled) { background: #059669; }
          `;
        case 'danger':
          return `
            background: #ef4444;
            color: white;
            &:hover:not(:disabled) { background: #dc2626; }
          `;
        case 'warning':
          return `
            background: #f59e0b;
            color: white;
            &:hover:not(:disabled) { background: #d97706; }
          `;
        default:
          return `
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
            &:hover:not(:disabled) { background: #e5e7eb; }
          `;
      }
    }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
`;

const ValuesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

interface ContasReceberForm {
  // Dados principais
  codigo_rec: string;
  numdup_rec: string;
  parcela_rec: string;
  tipodoc_rec: string;
  tpcob_rec: string;
  dpto_rec: string;
  cgccpf_rec: string;
  dtmovi_rec: string;
  dtemissi_rec: string;
  dtvenci_rec: string;
  dtpagi_rec: string;
  banco_rec: string;
  codigo_bol?: string; // Código do boleto
  nossonumero_rec: string;
  
  // Valores
  vlrdup_rec: number;
  vlrdesc_rec: number;
  vlracre_rec: number;
  vlrpag_rec: number;
  vlrsal_rec: number;
  vlrir_rec: number;
  vlriss_rec: number;
  vlrpis_rec: number;
  vlrcofins_rec: number;
  vlrcsll_rec: number;
  vlrinss_rec: number;
  vlrdescob_rec: number;
  vlrdev_rec: number;
  
  // Outros
  obs_rec: string;
  condic_rec: string;
  status_rec: string;
}

const ContasReceberForm: React.FC = () => {
  const [formData, setFormData] = useState<ContasReceberForm>({
    codigo_rec: '',
    numdup_rec: '',
    parcela_rec: '001',
    tipodoc_rec: '',
    tpcob_rec: '',
    dpto_rec: '',
    cgccpf_rec: '',
    dtmovi_rec: new Date().toISOString().split('T')[0],
    dtemissi_rec: new Date().toISOString().split('T')[0],
    dtvenci_rec: '',
    dtpagi_rec: '',
    banco_rec: '',
    codigo_bol: '',
    nossonumero_rec: '',
    
    vlrdup_rec: 0,
    vlrdesc_rec: 0,
    vlracre_rec: 0,
    vlrpag_rec: 0,
    vlrsal_rec: 0,
    vlrir_rec: 0,
    vlriss_rec: 0,
    vlrpis_rec: 0,
    vlrcofins_rec: 0,
    vlrcsll_rec: 0,
    vlrinss_rec: 0,
    vlrdescob_rec: 0,
    vlrdev_rec: 0,
    
    obs_rec: '',
    condic_rec: '',
    status_rec: 'A'
  });

  const [clientes, setClientes] = useState<any[]>([]);
  
  // Estados para dados das tabelas auxiliares
  const [tabelasAuxiliares, setTabelasAuxiliares] = useState({
    tiposDocumento: [] as any[],
    tiposCobranca: [] as any[],
    departamentos: [] as any[],
    condicoesPagamento: [] as any[],
    bancos: [] as any[]
  });
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'novo' | 'edicao' | 'visualizacao'>('novo');
  // evitar warning de variável atribuída e não usada
  void setModo;

  useEffect(() => {
    carregarClientes();
    carregarDadosAuxiliares();
    calcularSaldo();
  }, []);

  useEffect(() => {
    calcularSaldo();
  }, [formData.vlrdup_rec, formData.vlrpag_rec, formData.vlrdesc_rec, formData.vlracre_rec]);

  const carregarClientes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clientes`);
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarDadosAuxiliares = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tabelas-auxiliares/formulario-receber`);
      if (response.ok) {
        const dados = await response.json();
        setTabelasAuxiliares(dados);
      } else {
        console.error('Erro ao carregar dados auxiliares');
      }
    } catch (error) {
      console.error('Erro ao carregar dados auxiliares:', error);
    }
  };

  const calcularSaldo = () => {
    const saldo = formData.vlrdup_rec + formData.vlracre_rec - formData.vlrpag_rec - formData.vlrdesc_rec;
    setFormData(prev => ({ ...prev, vlrsal_rec: Math.max(0, saldo) }));
  };

  const handleInputChange = (field: keyof ContasReceberForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClienteChange = (codigoCliente: string) => {
    const cliente = clientes.find(c => c.codigo_cli.toString() === codigoCliente);
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        codigo_rec: codigoCliente,
        cgccpf_rec: cliente.cgccpf_cli || ''
      }));
    }
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const salvarDocumento = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/receber`, {
        method: modo === 'novo' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Documento salvo com sucesso!');
        if (modo === 'novo') {
          // Limpar formulário
          setFormData({
            ...formData,
            numdup_rec: '',
            vlrdup_rec: 0,
            vlrsal_rec: 0,
            obs_rec: ''
          });
        }
      } else {
        throw new Error('Erro ao salvar documento');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FormContainer>
        <Header>
          <FontAwesomeIcon icon={faFileInvoiceDollar} size="lg" />
          <Title>Manutenção - Contas a Receber</Title>
        </Header>

        <FormContent>
          <FormGrid>
            {/* Lado Esquerdo - Formulário Principal */}
            <div>
              {/* Dados Principais */}
              <FormSection>
                <SectionTitle>
                  <FontAwesomeIcon icon={faUser} />
                  Dados do Documento
                </SectionTitle>

                <FormRow className="four-cols">
                  <FormGroup>
                    <Label>Código Cliente *</Label>
                    <Select 
                      value={formData.codigo_rec}
                      onChange={(e) => handleClienteChange(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {clientes.map(cliente => (
                        <option key={cliente.codigo_cli} value={cliente.codigo_cli}>
                          {cliente.codigo_cli} - {cliente.nome_cli}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Número *</Label>
                    <Input 
                      type="text"
                      value={formData.numdup_rec}
                      onChange={(e) => handleInputChange('numdup_rec', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Parcela</Label>
                    <Input 
                      type="text"
                      value={formData.parcela_rec}
                      onChange={(e) => handleInputChange('parcela_rec', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>CGC/CPF</Label>
                    <Input 
                      type="text"
                      value={formData.cgccpf_rec}
                      onChange={(e) => handleInputChange('cgccpf_rec', e.target.value)}
                      disabled
                    />
                  </FormGroup>
                </FormRow>

                <FormRow className="three-cols">
                  <FormGroup>
                    <Label>Tipo Documento</Label>
                    <Select 
                      value={formData.tipodoc_rec}
                      onChange={(e) => handleInputChange('tipodoc_rec', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {tabelasAuxiliares.tiposDocumento.map((tipo: any) => (
                        <option key={tipo.codigo} value={tipo.codigo}>
                          {tipo.descricao}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Tipo Cobrança</Label>
                    <Select 
                      value={formData.tpcob_rec}
                      onChange={(e) => handleInputChange('tpcob_rec', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {tabelasAuxiliares.tiposCobranca.map((tipo: any) => (
                        <option key={tipo.codigo} value={tipo.codigo}>
                          {tipo.descricao}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Nosso Número</Label>
                    <Input 
                      type="text"
                      value={formData.nossonumero_rec}
                      onChange={(e) => handleInputChange('nossonumero_rec', e.target.value)}
                    />
                  </FormGroup>
                </FormRow>
              </FormSection>

              {/* Datas */}
              <FormSection>
                <SectionTitle>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  Datas
                </SectionTitle>

                <FormRow className="four-cols">
                  <FormGroup>
                    <Label>Emissão *</Label>
                    <Input 
                      type="date"
                      value={formData.dtemissi_rec}
                      onChange={(e) => handleInputChange('dtemissi_rec', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Vencimento *</Label>
                    <Input 
                      type="date"
                      value={formData.dtvenci_rec}
                      onChange={(e) => handleInputChange('dtvenci_rec', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Movimento</Label>
                    <Input 
                      type="date"
                      value={formData.dtmovi_rec}
                      onChange={(e) => handleInputChange('dtmovi_rec', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Pagamento</Label>
                    <Input 
                      type="date"
                      value={formData.dtpagi_rec}
                      onChange={(e) => handleInputChange('dtpagi_rec', e.target.value)}
                    />
                  </FormGroup>
                </FormRow>
              </FormSection>

              {/* Valores Principais */}
              <FormSection>
                <SectionTitle>
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                  Valores Principais
                </SectionTitle>

                <FormRow className="four-cols">
                  <FormGroup>
                    <Label>Valor Duplicata *</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdup_rec}
                      onChange={(e) => handleInputChange('vlrdup_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Desconto</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdesc_rec}
                      onChange={(e) => handleInputChange('vlrdesc_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Acréscimo</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlracre_rec}
                      onChange={(e) => handleInputChange('vlracre_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Pago</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrpag_rec}
                      onChange={(e) => handleInputChange('vlrpag_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow className="two-cols">
                  <FormGroup>
                    <Label>Saldo</Label>
                    <Input 
                      type="text"
                      value={formatarMoeda(formData.vlrsal_rec)}
                      disabled
                      style={{ 
                        backgroundColor: formData.vlrsal_rec > 0 ? '#fef3c7' : '#d1fae5',
                        fontWeight: 'bold'
                      }}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Status</Label>
                    <Select 
                      value={formData.status_rec}
                      onChange={(e) => handleInputChange('status_rec', e.target.value)}
                    >
                      <option value="A">Ativo</option>
                      <option value="P">Pago</option>
                      <option value="C">Cancelado</option>
                    </Select>
                  </FormGroup>
                </FormRow>
              </FormSection>
            </div>

            {/* Lado Direito - Valores Detalhados */}
            <div>
              <FormSection>
                <SectionTitle>
                  Valores Detalhados
                </SectionTitle>

                <ValuesGrid>
                  <FormGroup>
                    <Label>Valor I.R.R.F.</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrir_rec}
                      onChange={(e) => handleInputChange('vlrir_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor INSS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrinss_rec}
                      onChange={(e) => handleInputChange('vlrinss_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor PIS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrpis_rec}
                      onChange={(e) => handleInputChange('vlrpis_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor COFINS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrcofins_rec}
                      onChange={(e) => handleInputChange('vlrcofins_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor CSLL</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrcsll_rec}
                      onChange={(e) => handleInputChange('vlrcsll_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor ISS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlriss_rec}
                      onChange={(e) => handleInputChange('vlriss_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Desp. Cartório</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdescob_rec}
                      onChange={(e) => handleInputChange('vlrdescob_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Devolução</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdev_rec}
                      onChange={(e) => handleInputChange('vlrdev_rec', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>
                </ValuesGrid>

                {/* Dados Complementares */}
                <FormRow className="three-cols" style={{ marginTop: '20px' }}>
                  <FormGroup>
                    <Label>Departamento</Label>
                    <Select 
                      value={formData.dpto_rec}
                      onChange={(e) => handleInputChange('dpto_rec', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {tabelasAuxiliares.departamentos.map((dept: any) => (
                        <option key={dept.codigo} value={dept.codigo}>
                          {dept.descricao}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Banco</Label>
                    <Select 
                      value={formData.banco_rec}
                      onChange={(e) => handleInputChange('banco_rec', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {tabelasAuxiliares.bancos.map((banco: any) => (
                        <option key={banco.codigo} value={banco.codigo}>
                          {banco.descricao}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Cód. Boleto</Label>
                    <Input
                      type="text"
                      value={formData.codigo_bol || ''}
                      onChange={(e) => handleInputChange('codigo_bol', e.target.value)}
                      placeholder="Código do boleto"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Condição Pagamento</Label>
                    <Select 
                      value={formData.condic_rec}
                      onChange={(e) => handleInputChange('condic_rec', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {tabelasAuxiliares.condicoesPagamento.map((cond: any) => (
                        <option key={cond.codigo} value={cond.codigo}>
                          {cond.descricao}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                </FormRow>

                <FormGroup style={{ marginTop: '20px' }}>
                  <Label>Observações</Label>
                  <textarea
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      resize: 'vertical'
                    }}
                    value={formData.obs_rec}
                    onChange={(e) => handleInputChange('obs_rec', e.target.value)}
                  />
                </FormGroup>
              </FormSection>
            </div>
          </FormGrid>

          <ButtonGroup>
            <Button $variant="primary" onClick={salvarDocumento} disabled={loading}>
              <FontAwesomeIcon icon={faSave} />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>

            <Button $variant="primary">
              <FontAwesomeIcon icon={faEdit} />
              Editar
            </Button>

            <Button $variant="danger">
              <FontAwesomeIcon icon={faTrash} />
              Excluir
            </Button>

            <Button $variant="secondary">
              <FontAwesomeIcon icon={faSearch} />
              Buscar
            </Button>

            <Button $variant="warning">
              <FontAwesomeIcon icon={faPlus} />
              Novo
            </Button>

            <Button>
              <FontAwesomeIcon icon={faTimes} />
              Cancelar
            </Button>
          </ButtonGroup>
        </FormContent>
      </FormContainer>
    </Container>
  );
};

export default ContasReceberForm;













