/**
 * TableSelector.tsx
 * 
 * Componente para selecionar a tabela base da query
 * Mostra dropdown com todas as tabelas disponíveis e descrição
 */

import React from 'react';
import styled from 'styled-components';
import { DatabaseTable } from 'queryBuilder';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 14px;
  color: #374151;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Help = styled.small`
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
`;

interface TableSelectorProps {
  tables: DatabaseTable[];
  selected?: string;
  onChange: (tableName: string) => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ tables, selected, onChange }) => {
  const selectedTable = tables.find((t) => t.table_name === selected);

  return (
    <Container>
      <Label>Tabela Principal</Label>
      <Select value={selected || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- Selecione uma tabela --</option>
        {tables.map((table) => (
          <option key={table.table_name} value={table.table_name}>
            {table.display_name || table.table_name}
          </option>
        ))}
      </Select>
      {selectedTable?.description && <Help>{selectedTable.description}</Help>}
    </Container>
  );
};

export default TableSelector;













