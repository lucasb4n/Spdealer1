import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faFileDownload } from '@fortawesome/free-solid-svg-icons';
import ModalSelecionarDocumentos from './Modal/ModalSelecionarDocumentos';
import CaixaOperacaoSelector from './Caixa/CaixaOperacaoSelector';
import { useAuth } from '../contexts/AuthContext';

interface MovimentoCaixa {
  id?: number;
  dtmovi_cai: string;
  banco_cai: string;
  dc_cai: 'C' | 'D';
  valor_cai: number;
  historico_cai: string;
  cliente_cai?: string;
  departamento?: string;
  operacao_ocai?: string;
  totalBaixa?: number;
}

interface FormularioMovimentoCaixaProps {
  isOpen: boolean;
  modo?: 'novo' | 'editar';
  movimento?: MovimentoCaixa;
  onSalvar: (movimento: MovimentoCaixa) => void;
  onCancel: () => void;
  bancos?: any[];
  // NOTA: filial_id é agora obtido automaticamente do useAuth()
  // Se houver necessidade de sobrescrever, passar como prop (opcional)
  filial_id?: string | number;
}

// ============================================================
// STYLED COMPONENTS
// ============================================================

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    align-items: flex-end;
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 8px 8px 0 0;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Title = styled.h2`
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 24px;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e5e7eb;
    color: #1f2937;
  }
`;

const FormContainer = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;

  span.required {
    color: #ef4444;
  }
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
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

  &.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background-color: white;
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

  &.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;

  input {
    cursor: pointer;
  }
`;

const TextArea = styled.textarea`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  font-size: 12px;
  margin: 4px 0 0 0;
  font-weight: 500;
`;

const FooterActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 0 0 8px 8px;
  position: sticky;
  bottom: 0;
  z-index: 10;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;

    button {
      width: 100%;
    }
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  ${props => {
    switch (props.$variant) {
      case 'primary':
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

// ============================================================
// COMPONENT
// ============================================================

const FormularioMovimentoCaixa: React.FC<FormularioMovimentoCaixaProps> = ({
  isOpen,
  movimento,
  onSalvar,
  onCancel,
  bancos,
  filial_id: filial_id_prop
}) => {
  // ========================================================
  // OBTER FILIAL DA SESSÃO VIA useAuth()
  // ========================================================
  const { user } = useAuth();

  // Lógica: Tentar filial_id_prop primeiro (override), depois usuário
  // Se houver necessidade de hardcode, usar '001' como fallback
  const filial_id = filial_id_prop || user?.userId || '001';

  console.log('[FormularioMovimentoCaixa] Filial em uso:', filial_id);

  const [formData, setFormData] = useState<MovimentoCaixa>({
    dtmovi_cai: new Date().toISOString().split('T')[0],
    banco_cai: '',
    dc_cai: 'C',
    valor_cai: 0,
    historico_cai: '',
    operacao_ocai: '',
  });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showModalBaixa, setShowModalBaixa] = useState(false);

  /**
   * HANDLER: Quando usuário seleciona uma operação
   */
  const handleSelectOperacao = (operacao: any) => {
    setFormData(prev => ({
      ...prev,
      operacao_ocai: operacao.id,
      cliente_cai: operacao.codigo_cli,
      valor_cai: operacao.valor || prev.valor_cai,
      historico_cai: `${operacao.nome_cli} - Título ${operacao.titulo_id}`
    }));
  };

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (movimento) {
      setFormData(movimento);
    } else {
      setFormData({
        dtmovi_cai: new Date().toISOString().split('T')[0],
        banco_cai: '',
        dc_cai: 'C',
        valor_cai: 0,
        historico_cai: '',
        operacao_ocai: '',
      });
    }
    setErros({});
  }, [movimento, isOpen]);

  // Validar campo individualmente (em tempo real)
  const validarCampo = (nome: string, valor: any): string => {
    switch (nome) {
      case 'dtmovi_cai':
        if (!valor) return 'Data é obrigatória';
        const data = new Date(valor);
        if (data > new Date()) return 'Data não pode ser futura';
        return '';

      case 'banco_cai':
        if (!valor) return 'Banco é obrigatório';
        return '';

      case 'valor_cai':
        if (valor <= 0) return 'Valor deve ser maior que 0';
        if (!/^\d+(\.\d{1,2})?$/.test(valor.toString())) return 'Formato de valor inválido';
        return '';

      case 'historico_cai':
        if (!valor || valor.trim() === '') return 'Descrição é obrigatória';
        if (valor.length < 3) return 'Descrição deve ter pelo menos 3 caracteres';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    // Parsesr valores numéricos
    if (name === 'valor_cai') {
      parsedValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    // Validar em tempo real
    const erro = validarCampo(name, parsedValue);
    setErros(prev => ({
      ...prev,
      [name]: erro
    }));
  };

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    novosErros.dtmovi_cai = validarCampo('dtmovi_cai', formData.dtmovi_cai);
    novosErros.banco_cai = validarCampo('banco_cai', formData.banco_cai);
    novosErros.valor_cai = validarCampo('valor_cai', formData.valor_cai);
    novosErros.historico_cai = validarCampo('historico_cai', formData.historico_cai);

    setErros(novosErros);

    return Object.values(novosErros).every(erro => erro === '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    // ✅ Validação de consistência entre valor do movimento e total das baixas (se houver baixas)
    if (formData.totalBaixa && formData.totalBaixa > 0) {
      const totalBaixa = Math.round(formData.totalBaixa * 100) / 100;
      const valorCai = Math.round(formData.valor_cai * 100) / 100;
      
      if (Math.abs(totalBaixa - valorCai) > 0.01) {
        alert(`Inconsistência: O valor total das baixas (${totalBaixa.toFixed(2)}) não coincide com o valor do movimento (${valorCai.toFixed(2)})`);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    // Simular delay de API
    setTimeout(() => {
      onSalvar(formData);
      setLoading(false);
    }, 500);
  };

  const handleLimpar = () => {
    setFormData({
      dtmovi_cai: new Date().toISOString().split('T')[0],
      banco_cai: '',
      dc_cai: 'C',
      valor_cai: 0,
      historico_cai: '',
    });
    setErros({});
  };

  const handleBaixarDocumentos = () => {
    // Validar se movimento foi salvo
    if (!movimento || !movimento.id) {
      alert('Salve o movimento primeiro antes de baixar documentos');
      return;
    }

    // Validar se é Crédito ou Débito
    if (formData.dc_cai !== 'C' && formData.dc_cai !== 'D') {
      alert('Tipo de operação inválido');
      return;
    }

    setShowModalBaixa(true);
  };

  const handleConfirmarBaixa = async (documentos: any[], totalSelecionado: number) => {
    try {
      setLoading(true);

      // Extrair IDs dos documentos
      const documentoIds = documentos.map((doc: any) => doc.codigo_rec || doc.codigo_pag);

      const requestBody = {
        tipo: formData.dc_cai === 'C' ? 'RECEBER' : 'PAGAR',
        documentoIds,
        totalBaixa: totalSelecionado,
        dataMovimento: formData.dtmovi_cai,
        movimentoId: movimento?.id,
        operacao: 100,
        sequencia: 1,
        clienteFornecedor: formData.cliente_cai || 'AUTO'
      };

      const response = await fetch(
        `/api/v1/caixa/movimento/${movimento?.id}/baixar-documentos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao baixar documentos: ${response.status}`);
      }

      const result = await response.json();
      alert(`✅ ${result.registrosAtualizados} documentos marcados como pagos`);
      setShowModalBaixa(false);
    } catch (error) {
      alert(`❌ Erro ao processar baixa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay $isOpen={isOpen} onClick={onCancel}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>
            {movimento ? '✏️ Editar Movimento' : '➕ Novo Movimento'}
          </Title>
          <CloseButton onClick={onCancel} title="Fechar formulário">
            <FontAwesomeIcon icon={faTimes} />
          </CloseButton>
        </Header>

        <form onSubmit={handleSubmit}>
          <FormContainer>
            <FormGrid>
              {/* Data */}
              <FormGroup>
                <Label>
                  Data de Movimento
                  <span className="required">*</span>
                </Label>
                <Input
                  type="date"
                  name="dtmovi_cai"
                  value={formData.dtmovi_cai}
                  onChange={handleChange}
                  className={erros.dtmovi_cai ? 'error' : ''}
                  disabled={loading}
                />
                {erros.dtmovi_cai && <ErrorMessage>{erros.dtmovi_cai}</ErrorMessage>}
              </FormGroup>

              {/* Banco */}
              <FormGroup>
                <Label>
                  Banco
                  <span className="required">*</span>
                </Label>
                <Select
                  name="banco_cai"
                  value={formData.banco_cai}
                  onChange={handleChange}
                  className={erros.banco_cai ? 'error' : ''}
                  disabled={loading}
                >
                  <option value="">Selecione um banco</option>
                  {(bancos || []).map(banco => (
                    <option key={banco.codigo_bco} value={banco.codigo_bco}>
                      {banco.codigo_bco} - {banco.nome_bco}
                    </option>
                  ))}
                </Select>
                {erros.banco_cai && <ErrorMessage>{erros.banco_cai}</ErrorMessage>}
              </FormGroup>

              {/* Tipo C/D */}
              <FullWidth>
                <FormGroup>
                  <Label>
                    Tipo de Operação
                    <span className="required">*</span>
                  </Label>
                  <RadioGroup>
                    <RadioLabel>
                      <input
                        type="radio"
                        name="dc_cai"
                        value="C"
                        checked={formData.dc_cai === 'C'}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      💚 Crédito (Entrada)
                    </RadioLabel>
                    <RadioLabel>
                      <input
                        type="radio"
                        name="dc_cai"
                        value="D"
                        checked={formData.dc_cai === 'D'}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      ❤️ Débito (Saída)
                    </RadioLabel>
                  </RadioGroup>
                </FormGroup>
              </FullWidth>

              {/* NOVO: Seleção de Operação (Cliente/Fornecedor) */}
              <FullWidth>
                <CaixaOperacaoSelector
                  dc_cai={formData.dc_cai as 'C' | 'D' | ''}
                  banco_cai={formData.banco_cai}
                  onSelectOperacao={handleSelectOperacao}
                  disabled={loading}
                  filial_id={filial_id}
                />
              </FullWidth>

              {/* Valor */}
              <FormGroup>
                <Label>
                  Valor (R$)
                  <span className="required">*</span>
                </Label>
                <Input
                  type="number"
                  name="valor_cai"
                  value={formData.valor_cai || ''}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={erros.valor_cai ? 'error' : ''}
                  disabled={loading}
                />
                {erros.valor_cai && <ErrorMessage>{erros.valor_cai}</ErrorMessage>}
              </FormGroup>

              {/* Descrição */}
              <FullWidth>
                <FormGroup>
                  <Label>
                    Descrição / Histórico
                    <span className="required">*</span>
                  </Label>
                  <TextArea
                    name="historico_cai"
                    value={formData.historico_cai}
                    onChange={handleChange}
                    placeholder="Descreva o movimento (ex: Depósito de vendas, Pagamento de fornecedor)"
                    className={erros.historico_cai ? 'error' : ''}
                    disabled={loading}
                  />
                  {erros.historico_cai && <ErrorMessage>{erros.historico_cai}</ErrorMessage>}
                </FormGroup>
              </FullWidth>
            </FormGrid>
          </FormContainer>

          <FooterActions>
            <Button onClick={handleLimpar} disabled={loading} title="Limpar formulário">
              Limpar
            </Button>
            <Button onClick={onCancel} disabled={loading} title="Cancelar operação">
              Cancelar
            </Button>
            {movimento && (formData.dc_cai === 'C' || formData.dc_cai === 'D') && (
              <Button
                type="button"
                onClick={handleBaixarDocumentos}
                disabled={loading}
                title={`Baixar documentos (${formData.dc_cai === 'C' ? 'Receber' : 'Pagar'})`}
              >
                <FontAwesomeIcon icon={faFileDownload} />
                Baixar Documentos
              </Button>
            )}
            <Button
              type="submit"
              $variant="primary"
              disabled={loading}
              title="Salvar movimento"
            >
              <FontAwesomeIcon icon={faSave} />
              {loading ? 'Salvando...' : movimento ? 'Atualizar' : 'Salvar'}
            </Button>
          </FooterActions>
        </form>

        {/* MODAL: Selecionar Documentos para Baixar */}
        {showModalBaixa && movimento && (
          <ModalSelecionarDocumentos
            isOpen={showModalBaixa}
            tipo={formData.dc_cai === 'C' ? 'RECEBER' : 'PAGAR'}
            valorMovimento={formData.valor_cai}
            clienteFornecedorId={formData.cliente_cai || ''}
            onConfirm={handleConfirmarBaixa}
            onCancel={() => setShowModalBaixa(false)}
          />
        )}
      </Modal>
    </Overlay>
  );
};

export default FormularioMovimentoCaixa;

















