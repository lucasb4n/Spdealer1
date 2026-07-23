/**
 * JoinBuilder.tsx
 * 
 * Componente para adicionar e configurar JOINs
 */

import React from 'react';
import styled from 'styled-components';
import { JoinConfig, DatabaseTable, FilterOperator } from 'queryBuilder';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 14px;
  color: #374151;
`;

const AddButton = styled.button`
  padding: 4px 12px;
  font-size: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #2563eb;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const JoinCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fafafa;
`;

const JoinRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
`;

const Select = styled.select`
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Input = styled.input`
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const RemoveButton = styled.button`
  padding: 4px 8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: #dc2626;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

interface JoinBuilderProps {
  joins: JoinConfig[];
  tables: DatabaseTable[];
  baseTable: string;
  onAddJoin: () => void;
  onUpdateJoin: (index: number, joinUpdate: Partial<JoinConfig>) => void;
  onRemoveJoin: (index: number) => void;
}

const JoinBuilder: React.FC<JoinBuilderProps> = ({
  joins,
  tables,
  baseTable,
  onAddJoin,
  onUpdateJoin,
  onRemoveJoin,
}) => {
  return (
    <Container>
      <Header>
        <Label>JOINs</Label>
        <AddButton onClick={onAddJoin}>+ Adicionar JOIN</AddButton>
      </Header>

      {joins.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>
          Nenhum JOIN configurado.
        </div>
      ) : (
        <List>
          {joins.map((join, idx) => (
            <JoinCard key={idx}>
              <JoinRow>
                <Select
                  value={join.type}
                  onChange={(e) => onUpdateJoin(idx, { type: e.target.value as any })}
                >
                  <option value="INNER">INNER</option>
                  <option value="LEFT">LEFT</option>
                  <option value="RIGHT">RIGHT</option>
                  <option value="FULL">FULL OUTER</option>
                </Select>

                <span style={{ fontWeight: 600 }}>JOIN</span>

                <Select
                  value={join.table}
                  onChange={(e) =>
                    onUpdateJoin(idx, {
                      table: e.target.value,
                      on: { ...join.on, rightTable: e.target.value },
                    })
                  }
                >
                  <option value="">-- Selecione tabela --</option>
                  {tables
                    .filter((t) => t.table_name !== baseTable && t.table_name !== join.table)
                    .map((t) => (
                      <option key={t.table_name} value={t.table_name}>
                        {t.display_name || t.table_name}
                      </option>
                    ))}
                </Select>

                <Spacer />

                <RemoveButton onClick={() => onRemoveJoin(idx)}>✕</RemoveButton>
              </JoinRow>

              <JoinRow>
                <span style={{ color: '#6b7280' }}>ON</span>

                <Input
                  type="text"
                  placeholder="Tabela.Coluna"
                  value={`${join.on.leftTable}.${join.on.leftColumn}`}
                  onChange={(e) => {
                    const [table, column] = e.target.value.split('.');
                    onUpdateJoin(idx, {
                      on: {
                        ...join.on,
                        leftTable: table,
                        leftColumn: column || '',
                      },
                    });
                  }}
                />

                <Select
                  value={join.on.operator}
                  onChange={(e) =>
                    onUpdateJoin(idx, {
                      on: { ...join.on, operator: e.target.value as FilterOperator },
                    })
                  }
                >
                  <option value="=">=</option>
                  <option value="&lt;">&lt;</option>
                  <option value="&gt;">&gt;</option>
                  <option value="&lt;=">&lt;=</option>
                  <option value="&gt;=">&gt;=</option>
                  <option value="&lt;&gt;">&lt;&gt;</option>
                </Select>

                <Input
                  type="text"
                  placeholder="Tabela.Coluna"
                  value={`${join.on.rightTable}.${join.on.rightColumn}`}
                  onChange={(e) => {
                    const [table, column] = e.target.value.split('.');
                    onUpdateJoin(idx, {
                      on: {
                        ...join.on,
                        rightTable: table,
                        rightColumn: column || '',
                      },
                    });
                  }}
                />
              </JoinRow>
            </JoinCard>
          ))}
        </List>
      )}
    </Container>
  );
};

export default JoinBuilder;













