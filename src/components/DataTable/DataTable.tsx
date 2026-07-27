import React from 'react';
import styled from 'styled-components';

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
  font-size: 0.9rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;

  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
    color: #333333;
  }

  th {
    background-color: #f0f0f0;
    font-weight: 600;
  }

  tr {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  tr:hover {
    background-color: #f8f8f8;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const TableContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  border-radius: inherit;
`;

interface DataTableProps<T> {
  columns: { key: keyof T; header: string }[];
  data: T[];
  onRowClick: (item: T) => void;
}

export const DataTable = <T extends {}>({ columns, data, onRowClick }: DataTableProps<T>) => {
  return (
    <TableContainer>
      <StyledTable>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item: T, rowIndex) => (
              <tr key={rowIndex} onClick={() => onRowClick(item)}>
                {columns.map((col) => (
                  <td key={String(col.key)}>{String(item[col.key])}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', color: '#888888' }}>
                Nenhum resultado encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </StyledTable>
    </TableContainer>
  );
};













