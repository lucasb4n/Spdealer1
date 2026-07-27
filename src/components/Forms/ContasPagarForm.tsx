import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from 'services/apiConfig';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faEdit, 
  faTrash, 
  faSearch, 
  faPlus,
  faTimes,
  faFileInvoice,
  faCalendarAlt,
  faMoneyBillWave,
  faBuilding
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
  background: linear-gradient(135deg, #dc2626, #991b1b);
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
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }

  &.currency {
    text-align: right;
    background-color: #fff1f2;
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
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
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
          background: #dc2626;
          color: white;
          &:hover:not(:disabled) { background: #b91c1c; }
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

interface ContasPagarFormData {
  // Dados principais
  codigo_pag: string;
  numdup_pag: string;
  parcela_pag: string;
  tipodoc_pag: string;
  tpcob_pag: string;
  cgccpf_pag: string;
  dtmovi_pag: string;
  dtemissi_pag: string;
  dtvenci_pag: string;
  dtpagi_pag: string;
  banco_pag: string;
  nossonumero_pag: string;
  
  // Valores
  vlrdup_pag: number;
  vlrdesc_pag: number;
  vlracre_pag: number;
  vlrpag_pag: number;
  vlrsal_pag: number;
  vlrir_pag: number;
  vlriss_pag: number;
  vlrpis_pag: number;
  vlrcofins_pag: number;
  vlrcsll_pag: number;
  vlrinss_pag: number;
  vlrdescob_pag: number;
  vlrdev_pag: number;
  
  // Outros
  obs_pag: string;
  condic_pag: string;
  status_pag: string;
}

const ContasPagarForm: React.FC = () => {
  const [formData, setFormData] = useState<ContasPagarFormData>({
    codigo_pag: '',
    numdup_pag: '',
    parcela_pag: '001',
    tipodoc_pag: 'DUPLICATA',
    tpcob_pag: 'BOLETO',
    cgccpf_pag: '',
    dtmovi_pag: new Date().toISOString().split('T')[0],
    dtemissi_pag: new Date().toISOString().split('T')[0],
    dtvenci_pag: '',
    dtpagi_pag: '',
    banco_pag: '',
    nossonumero_pag: '',
    
    vlrdup_pag: 0,
    vlrdesc_pag: 0,
    vlracre_pag: 0,
    vlrpag_pag: 0,
    vlrsal_pag: 0,
    vlrir_pag: 0,
    vlriss_pag: 0,
    vlrpis_pag: 0,
    vlrcofins_pag: 0,
    vlrcsll_pag: 0,
    vlrinss_pag: 0,
    vlrdescob_pag: 0,
    vlrdev_pag: 0,
    
    obs_pag: '',
    condic_pag: '',
    status_pag: 'A'
  });

  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'novo' | 'edicao' | 'visualizacao'>('novo');

  useEffect(() => {
    carregarFornecedores();
    calcularSaldo();
  }, []);

  useEffect(() => {
    calcularSaldo();
  }, [formData.vlrdup_pag, formData.vlrpag_pag, formData.vlrdesc_pag, formData.vlracre_pag]);

  const carregarFornecedores = async () => {
    try {
      // Usar a mesma API de clientes, mas filtrar por tipo fornecedor se necessário
      const response = await fetch(`${API_BASE_URL}/clientes`);
      if (response.ok) {
        const data = await response.json();
        setFornecedores(data); // Filtrar por tipo fornecedor se necessário
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const calcularSaldo = () => {
    const saldo = formData.vlrdup_pag + formData.vlracre_pag - formData.vlrpag_pag - formData.vlrdesc_pag;
    setFormData(prev => ({ ...prev, vlrsal_pag: Math.max(0, saldo) }));
  };

  const handleInputChange = (field: keyof ContasPagarFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFornecedorChange = (codigoFornecedor: string) => {
    const fornecedor = fornecedores.find(f => f.codigo_cli.toString() === codigoFornecedor);
    if (fornecedor) {
      setFormData(prev => ({
        ...prev,
        codigo_pag: codigoFornecedor,
        cgccpf_pag: fornecedor.cgccpf_cli || ''
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
      
      const response = await fetch(`${API_BASE_URL}/pagar`, {
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
            numdup_pag: '',
            vlrdup_pag: 0,
            vlrsal_pag: 0,
            obs_pag: ''
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
          <FontAwesomeIcon icon={faFileInvoice} size="lg" />
          <Title>Manutenção - Contas a Pagar</Title>
        </Header>

        <FormContent>
          <FormGrid>
            {/* Lado Esquerdo - Formulário Principal */}
            <div>
              {/* Dados Principais */}
              <FormSection>
                <SectionTitle>
                  <FontAwesomeIcon icon={faBuilding} />
                  Dados do Documento
                </SectionTitle>

                <FormRow className="four-cols">
                  <FormGroup>
                    <Label>Código Fornecedor *</Label>
                    <Select 
                      value={formData.codigo_pag}
                      onChange={(e) => handleFornecedorChange(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {fornecedores.map(fornecedor => (
                        <option key={fornecedor.codigo_cli} value={fornecedor.codigo_cli}>
                          {fornecedor.codigo_cli} - {fornecedor.nome_cli}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Número *</Label>
                    <Input 
                      type="text"
                      value={formData.numdup_pag}
                      onChange={(e) => handleInputChange('numdup_pag', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Parcela</Label>
                    <Input 
                      type="text"
                      value={formData.parcela_pag}
                      onChange={(e) => handleInputChange('parcela_pag', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>CGC/CNPJ</Label>
                    <Input 
                      type="text"
                      value={formData.cgccpf_pag}
                      onChange={(e) => handleInputChange('cgccpf_pag', e.target.value)}
                      disabled
                    />
                  </FormGroup>
                </FormRow>

                <FormRow className="three-cols">
                  <FormGroup>
                    <Label>Tipo Documento</Label>
                    <Select 
                      value={formData.tipodoc_pag}
                      onChange={(e) => handleInputChange('tipodoc_pag', e.target.value)}
                    >
                      <option value="DUPLICATA">Duplicata</option>
                      <option value="NOTA_FISCAL">Nota Fiscal</option>
                      <option value="RECIBO">Recibo</option>
                      <option value="BOLETO">Boleto</option>
                      <option value="OUTROS">Outros</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Tipo Cobrança</Label>
                    <Select 
                      value={formData.tpcob_pag}
                      onChange={(e) => handleInputChange('tpcob_pag', e.target.value)}
                    >
                      <option value="BOLETO">Boleto</option>
                      <option value="TRANSFERENCIA">Transferência</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="DINHEIRO">Dinheiro</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Nosso Número</Label>
                    <Input 
                      type="text"
                      value={formData.nossonumero_pag}
                      onChange={(e) => handleInputChange('nossonumero_pag', e.target.value)}
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
                      value={formData.dtemissi_pag}
                      onChange={(e) => handleInputChange('dtemissi_pag', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Vencimento *</Label>
                    <Input 
                      type="date"
                      value={formData.dtvenci_pag}
                      onChange={(e) => handleInputChange('dtvenci_pag', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Movimento</Label>
                    <Input 
                      type="date"
                      value={formData.dtmovi_pag}
                      onChange={(e) => handleInputChange('dtmovi_pag', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Pagamento</Label>
                    <Input 
                      type="date"
                      value={formData.dtpagi_pag}
                      onChange={(e) => handleInputChange('dtpagi_pag', e.target.value)}
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
                    <Label>Valor Documento *</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdup_pag}
                      onChange={(e) => handleInputChange('vlrdup_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Desconto</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdesc_pag}
                      onChange={(e) => handleInputChange('vlrdesc_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Acréscimo</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlracre_pag}
                      onChange={(e) => handleInputChange('vlracre_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Pago</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrpag_pag}
                      onChange={(e) => handleInputChange('vlrpag_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow className="two-cols">
                  <FormGroup>
                    <Label>Saldo</Label>
                    <Input 
                      type="text"
                      value={formatarMoeda(formData.vlrsal_pag)}
                      disabled
                      style={{ 
                        backgroundColor: formData.vlrsal_pag > 0 ? '#fef3c7' : '#d1fae5',
                        fontWeight: 'bold'
                      }}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Status</Label>
                    <Select 
                      value={formData.status_pag}
                      onChange={(e) => handleInputChange('status_pag', e.target.value)}
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
                      value={formData.vlrir_pag}
                      onChange={(e) => handleInputChange('vlrir_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor INSS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrinss_pag}
                      onChange={(e) => handleInputChange('vlrinss_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor PIS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrpis_pag}
                      onChange={(e) => handleInputChange('vlrpis_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor COFINS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrcofins_pag}
                      onChange={(e) => handleInputChange('vlrcofins_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor CSLL</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrcsll_pag}
                      onChange={(e) => handleInputChange('vlrcsll_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor ISS</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlriss_pag}
                      onChange={(e) => handleInputChange('vlriss_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Desp. Cartório</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdescob_pag}
                      onChange={(e) => handleInputChange('vlrdescob_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Valor Devolução</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="currency"
                      value={formData.vlrdev_pag}
                      onChange={(e) => handleInputChange('vlrdev_pag', parseFloat(e.target.value) || 0)}
                    />
                  </FormGroup>
                </ValuesGrid>

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
                    value={formData.obs_pag}
                    onChange={(e) => handleInputChange('obs_pag', e.target.value)}
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

export default ContasPagarForm;













