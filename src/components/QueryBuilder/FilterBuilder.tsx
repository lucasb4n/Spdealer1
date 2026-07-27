/**
 * FilterBuilder.tsx
 * 
 * Componente para criar filtros (WHERE) na query
 */

import React from 'react';
import styled from 'styled-components';
import { FilterCondition, SelectedColumn, FilterOperator } from 'queryBuilder';

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

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr 100px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
`;

const LogicalOp = styled.div`
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
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

interface FilterBuilderProps {
  filters: FilterCondition[];
  columns: SelectedColumn[];
  filterOperators: Array<{ value: FilterOperator; label: string }>;
  onAddFilter: () => void;
  onUpdateFilter: (index: number, filterUpdate: Partial<FilterCondition>) => void;
  onRemoveFilter: (index: number) => void;
}

const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filters,
  columns,
  filterOperators,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
}) => {
  return (
    <Container>
      <Header>
        <Label>Filtros (WHERE)</Label>
        <AddButton onClick={onAddFilter}>+ Adicionar Filtro</AddButton>
      </Header>

      {filters.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>
          Nenhum filtro configurado.
        </div>
      ) : (
        <List>
          {filters.map((filter, idx) => (
            <FilterRow key={idx}>
              {idx > 0 && (
                <LogicalOp>
                  <Select
                    value={filter.logical || 'AND'}
                    onChange={(e) =>
                      onUpdateFilter(idx, { logical: e.target.value as any })
                    }
                  >
                    <option value="AND">E</option>
                    <option value="OR">OU</option>
                  </Select>
                </LogicalOp>
              )}

              <Select
                value={filter.column}
                onChange={(e) => onUpdateFilter(idx, { column: e.target.value })}
              >
                <option value="">-- Coluna --</option>
                {columns.map((col, i) => (
                  <option key={i} value={col.column}>
                    {col.alias || col.column}
                  </option>
                ))}
              </Select>

              <Select
                value={filter.operator}
                onChange={(e) => onUpdateFilter(idx, { operator: e.target.value as any })}
              >
                {filterOperators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </Select>

              <Input
                type="text"
                placeholder="Valor"
                value={filter.value}
                onChange={(e) => onUpdateFilter(idx, { value: e.target.value })}
              />

              <RemoveButton onClick={() => onRemoveFilter(idx)}>✕</RemoveButton>
            </FilterRow>
          ))}
        </List>
      )}
    </Container>
  );
};

export default FilterBuilder;













