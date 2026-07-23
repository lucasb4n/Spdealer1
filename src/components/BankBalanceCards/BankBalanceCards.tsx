import styled from 'styled-components';
import { useEffect, useState } from 'react';

const BankCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
`;

const BankCard = styled.div<{ $isSelected?: boolean }>`
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  border: 2px solid #0369a1;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  ${props => props.$isSelected && `
    background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%);
    border-color: #0284c7;
    box-shadow: 0 4px 16px rgba(3, 105, 161, 0.3);
  `}

  &:hover {
    box-shadow: 0 4px 12px rgba(3, 105, 161, 0.15);
    transform: translateY(-2px);
    ${props => props.$isSelected && `
      box-shadow: 0 6px 16px rgba(3, 105, 161, 0.35);
    `}
  }

  &::after {
    ${props => props.$isSelected && `
      content: '✓';
      position: absolute;
      top: 8px;
      right: 8px;
      background: #10b981;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
    `}
  }
`;

const BankName = styled.div<{ $isSelected?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$isSelected ? '#fff' : '#0369a1'};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BankBalance = styled.div<{ $isSelected?: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.$isSelected ? '#fff' : '#0369a1'};
  font-variant-numeric: tabular-nums;
`;

const BankCardsTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '🏦';
    font-size: 18px;
  }
`;

const Container = styled.div`
  width: 100%;
`;

interface BankData {
  codigo_bco?: string;
  banco?: string;
  nomefan_bco?: string;
  nome_bco?: string;
  saldo?: string | number;
  saldo_cai?: string | number;
}

interface BankBalanceCardsProps {
  bankData?: BankData[];
  selectedBanco?: string;
  onSelectBanco?: (codigoBanco: string) => void;
}

const formatarMoeda = (valor: number | string): string => {
  if (typeof valor === 'string') {
    valor = parseFloat(valor);
  }
  if (isNaN(valor)) {
    valor = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
};

export const BankBalanceCards = ({ bankData = [], selectedBanco = '', onSelectBanco }: BankBalanceCardsProps) => {
  const [saldoBancos, setSaldoBancos] = useState<BankData[]>([]);
  const [carregando, setCarregando] = useState(!bankData || bankData.length === 0);

  useEffect(() => {
    // Se receber dados via props, usar diretamente
    if (bankData && bankData.length > 0) {
      setSaldoBancos(bankData);
      setCarregando(false);
      return;
    }

    // Se não receber dados via props, buscar da API (apenas UMA VEZ no mount)
    const carregarDados = async () => {
      try {
        setCarregando(true);
        const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${baseURL}/dashboard/queries/3/execute`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (response.ok) {
          let data = await response.json();
          
          // Suportar ambos os formatos de resposta
          if (Array.isArray(data)) {
            setSaldoBancos(data);
          } else if (data.data && Array.isArray(data.data)) {
            setSaldoBancos(data.data);
          } else {
            setSaldoBancos([]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar saldo dos bancos:', error);
        setSaldoBancos([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependência vazia: carrega APENAS no mount

  if (carregando) {
    return (
      <Container>
        <BankCardsTitle>SALDO DAS CONTAS BANCÁRIAS</BankCardsTitle>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          ⏳ Carregando saldos bancários...
        </div>
      </Container>
    );
  }

  // NÃO renderizar nada se não houver dados
  if (!saldoBancos || saldoBancos.length === 0) {
    return (
      <Container>
        <BankCardsTitle>SALDO DAS CONTAS BANCÁRIAS</BankCardsTitle>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          ℹ️ Nenhuma conta bancária disponível
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <BankCardsTitle>SALDO DAS CONTAS BANCÁRIAS</BankCardsTitle>
      <BankCardsContainer>
        {saldoBancos.map((banco, idx) => {
          const nomeBanco = banco.nomefan_bco || banco.nome_bco || banco.banco || 'Banco';
          const codigoBanco = banco.codigo_bco || banco.banco || '';
          const saldoBanco = parseFloat(String(banco.saldo || banco.saldo_cai || 0));
          const isSelected = selectedBanco === codigoBanco;
          
          return (
            <BankCard 
              key={idx}
              $isSelected={isSelected}
              onClick={() => onSelectBanco?.(codigoBanco)}
            >
              <BankName $isSelected={isSelected}>{nomeBanco}</BankName>
              <BankBalance $isSelected={isSelected}>{formatarMoeda(saldoBanco)}</BankBalance>
            </BankCard>
          );
        })}
      </BankCardsContainer>
    </Container>
  );
};

export default BankBalanceCards;













