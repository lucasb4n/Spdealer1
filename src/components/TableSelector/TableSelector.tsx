import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

/**
 * TableSelector Component
 * 
 * Permite ao usuário selecionar qual tabela/entidade trabalhar dinamicamente.
 * Suporta:
 * - Seleção de tabelas
 * - Ícones e labels customizados
 * - Salvar preferência do usuário em localStorage
 * - Sugestões baseadas em histórico
 * 
 * Fase 5.7.4 - Integração Multi-Tabela
 * 
 * @props {string} selectedTable - Tabela selecionada atualmente
 * @props {(table: string) => void} onTableChange - Callback ao mudar tabela
 */

export interface TableInfo {
  name: string;          // Nome técnico (ex: masfab)
  label: string;         // Nome legível (ex: Produtos)
  icon: string;          // Emoji (ex: 📦)
  color: string;         // Cor (ex: #3b82f6)
  description?: string;  // Descrição (ex: Gerenciar catálogo de produtos)
}

export interface TableSelectorProps {
  selectedTable: string;
  onTableChange: (tableName: string) => void;
  tables?: TableInfo[];
}

/**
 * Tabelas padrão do SPDealer
 */
const DEFAULT_TABLES: TableInfo[] = [
  {
    name: 'masfab',
    label: 'Produtos',
    icon: '📦',
    color: '#3b82f6',
    description: 'Catálogo de produtos, estoque e preços',
  },
  {
    name: 'clientes',
    label: 'Clientes',
    icon: '👥',
    color: '#10b981',
    description: 'Cadastro de clientes PJ',
  },
  {
    name: 'fornecedores',
    label: 'Fornecedores',
    icon: '🏢',
    color: '#f59e0b',
    description: 'Cadastro de fornecedores',
  },
  {
    name: 'receber',
    label: 'Contas a Receber',
    icon: '💰',
    color: '#06b6d4',
    description: 'Contas e títulos a receber',
  },
  {
    name: 'pagar',
    label: 'Contas a Pagar',
    icon: '💳',
    color: '#8b5cf6',
    description: 'Contas e títulos a pagar',
  },
  {
    name: 'caixa',
    label: 'Caixa e Bancos',
    icon: '🏦',
    color: '#ec4899',
    description: 'Movimentação de caixa e bancos',
  },
  {
    name: 'usuarios',
    label: 'Usuários',
    icon: '👤',
    color: '#6366f1',
    description: 'Gerenciar usuários do sistema',
  },
  {
    name: 'departamentos',
    label: 'Departamentos',
    icon: '🏗️',
    color: '#14b8a6',
    description: 'Estrutura organizacional',
  },
];

/**
 * Styled Components
 */
const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SelectorLabel = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
`;

const TableButton = styled.button<{ $isActive: boolean; $color?: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid ${props => props.$isActive ? (props.$color || '#3b82f6') : '#e5e7eb'};
  background: ${props => props.$isActive 
    ? `${props.$color || '#3b82f6'}15` 
    : '#f9fafb'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 13px;

  &:hover {
    border-color: ${props => props.$color || '#3b82f6'};
    background: ${props => `${props.$color || '#3b82f6'}08`};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  span:first-child {
    font-size: 24px;
  }

  span:last-child {
    color: ${props => props.$isActive ? (props.$color || '#3b82f6') : '#6b7280'};
    font-weight: 600;
  }
`;

const Tooltip = styled.div<{ visible?: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: ${props => props.visible ? 1 : 0};
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 1000;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid #1f2937;
  }
`;

const TableButtonWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const RecentTablesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
`;

const RecentLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const RecentTablesRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const RecentTableChip = styled.button<{ $color?: string }>`
  padding: 4px 12px;
  border: 1px solid ${props => props.$color || '#3b82f6'};
  background: ${props => `${props.$color || '#3b82f6'}10`};
  color: ${props => props.$color || '#3b82f6'};
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background: ${props => `${props.$color || '#3b82f6'}20`};
    transform: scale(1.05);
  }
`;

/**
 * Component
 */
const TableSelector: React.FC<TableSelectorProps> = ({
  selectedTable,
  onTableChange,
  tables = DEFAULT_TABLES,
}) => {
  const [recentTables, setRecentTables] = useState<string[]>([]);

  // Carregar tabelas recentes
  useEffect(() => {
    const stored = localStorage.getItem('recent_tables');
    if (stored) {
      try {
        setRecentTables(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar tabelas recentes:', e);
      }
    }
  }, []);

  // Atualizar tabelas recentes ao mudar
  const handleTableSelect = (tableName: string) => {
    onTableChange(tableName);

    // Adicionar à lista de recentes
    const updated = [
      tableName,
      ...recentTables.filter(t => t !== tableName),
    ].slice(0, 5); // Manter apenas as 5 mais recentes

    setRecentTables(updated);
    localStorage.setItem('recent_tables', JSON.stringify(updated));
  };

  const getTableInfo = (name: string): TableInfo | undefined => {
    return tables.find(t => t.name === name);
  };

  // selectedInfo intentionally unused here — removed to silence lint warning

  return (
    <SelectorContainer>
      <SelectorLabel>🗂️ Selecionar Tabela/Entidade</SelectorLabel>

      <TablesGrid>
        {tables.map(table => (
          <TableButtonWrapper key={table.name}>
            <TableButton
              $isActive={selectedTable === table.name}
              $color={table.color}
              onClick={() => handleTableSelect(table.name)}
              title={table.description}
            >
              <span>{table.icon}</span>
              <span>{table.label}</span>
            </TableButton>
            <Tooltip visible={selectedTable === table.name}>
              {table.description || table.label}
            </Tooltip>
          </TableButtonWrapper>
        ))}
      </TablesGrid>

      {/* Tabelas Recentes */}
      {recentTables.length > 1 && (
        <RecentTablesSection>
          <RecentLabel>⏱️ Recentemente Acessadas</RecentLabel>
          <RecentTablesRow>
            {recentTables
              .slice(1, 4)
              .map(tableName => {
                const info = getTableInfo(tableName);
                return info ? (
                  <RecentTableChip
                    key={tableName}
                    $color={info.color}
                    onClick={() => handleTableSelect(tableName)}
                  >
                    {info.icon} {info.label}
                  </RecentTableChip>
                ) : null;
              })}
          </RecentTablesRow>
        </RecentTablesSection>
      )}
    </SelectorContainer>
  );
};

export default TableSelector;













