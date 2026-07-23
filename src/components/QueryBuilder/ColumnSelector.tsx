/**
 * ColumnSelector.tsx
 * 
 * Componente para selecionar e configurar colunas da query
 * Permite adicionar aggregações (SUM, COUNT, AVG) para colunas numéricas
 */

import React from 'react';
import styled from 'styled-components';
import { SelectedColumn, DatabaseColumn, AggregationType } from 'queryBuilder';

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

const Item = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 120px 100px auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ColumnName = styled.span`
  font-weight: 500;
  color: #1f2937;
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

interface ColumnSelectorProps {
  columns: SelectedColumn[];
  availableColumns: DatabaseColumn[];
  onAddColumn: () => void;
  onUpdateColumn: (index: number, field: keyof SelectedColumn, value: any) => void;
  onRemoveColumn: (index: number) => void;
  aggregationOptions: AggregationType[];
}

const isNumericColumn = (column: DatabaseColumn): boolean => {
  if (!column.data_type) return false;
  const numericTypes = ['int', 'decimal', 'float', 'double', 'bigint', 'numeric'];
  return numericTypes.some((type) => column.data_type.toLowerCase().includes(type));
};

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  availableColumns,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  aggregationOptions,
}) => {
  return (
    <Container>
      <Header>
        <Label>Colunas Selecionadas</Label>
        <AddButton onClick={onAddColumn}>+ Adicionar Coluna</AddButton>
      </Header>

      {columns.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>
          Nenhuma coluna selecionada. Clique em "Adicionar Coluna" para começar.
        </div>
      ) : (
        <List>
          {columns.map((col, idx) => {
            const columnDef = availableColumns.find(
              (c) => c.column_name === col.column
            );
            const isNumeric = columnDef && isNumericColumn(columnDef);

            return (
              <Item key={idx}>
                <Checkbox type="checkbox" checked={true} onChange={() => onRemoveColumn(idx)} />
                <ColumnName>{col.column}</ColumnName>

                {isNumeric ? (
                  <Select
                    value={col.aggregation || ''}
                    onChange={(e) => onUpdateColumn(idx, 'aggregation', e.target.value || undefined)}
                  >
                    <option value="">Nenhuma</option>
                    {aggregationOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>Texto/Data</span>
                )}

                <Input
                  type="text"
                  placeholder="Alias"
                  value={col.alias || ''}
                  onChange={(e) => onUpdateColumn(idx, 'alias', e.target.value || undefined)}
                />

                <RemoveButton onClick={() => onRemoveColumn(idx)}>✕</RemoveButton>
              </Item>
            );
          })}
        </List>
      )}
    </Container>
  );
};

export default ColumnSelector;













