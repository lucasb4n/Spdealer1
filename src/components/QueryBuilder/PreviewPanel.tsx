/**
 * PreviewPanel.tsx
 * 
 * Painel de preview com SQL e dados
 */

import React from 'react';
import styled from 'styled-components';
import { QueryPreviewResult } from 'queryBuilder';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
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

const ExecuteButton = styled.button`
  padding: 6px 14px;
  font-size: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const SQLBox = styled.pre`
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px;
  border-radius: 6px;
  font-size: 11px;
  overflow-x: auto;
  max-height: 120px;
  margin: 0;
  border: 1px solid #374151;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #374151;
  }
  &::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 3px;
  }
`;

const ErrorBox = styled.div`
  background: #fecaca;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
`;

const DataTableWrapper = styled.div`
  flex: 1;
  overflow: auto;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th {
    background: #f3f4f6;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid #d1d5db;
    border-right: 1px solid #d1d5db;
    white-space: nowrap;
    position: sticky;
    top: 0;
  }

  th:last-child {
    border-right: none;
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    border-right: 1px solid #f0f0f0;
  }

  td:last-child {
    border-right: none;
  }

  tbody tr:hover {
    background: #f9fafb;
  }

  tbody tr:nth-child(even) {
    background: #fafafa;
  }
`;

const InfoBox = styled.div`
  padding: 10px 12px;
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 12px;
  font-weight: 500;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #9ca3af;
  font-size: 13px;
  font-style: italic;
`;

interface PreviewPanelProps {
  sql: string;
  previewResult?: QueryPreviewResult | null;
  loading?: boolean;
  error?: string | null;
  onExecutePreview: () => Promise<void>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  sql,
  previewResult,
  loading,
  error,
  onExecutePreview,
}) => {
  return (
    <Container>
      <Header>
        <Label>SQL Preview</Label>
        <ExecuteButton onClick={onExecutePreview} disabled={loading || !sql}>
          {loading ? 'Executando...' : 'Executar'}
        </ExecuteButton>
      </Header>

      {sql ? (
        <SQLBox>{sql}</SQLBox>
      ) : (
        <SQLBox>-- Configure a query para ver o SQL gerado</SQLBox>
      )}

      {error && <ErrorBox>❌ {error}</ErrorBox>}

      {previewResult ? (
        <>
          <DataTableWrapper>
            {previewResult.rows.length > 0 ? (
              <DataTable>
                <thead>
                  <tr>
                    {previewResult.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewResult.rows.map((row, idx) => (
                    <tr key={idx}>
                      {previewResult.columns.map((col) => (
                        <td key={`${idx}-${col}`}>{String(row[col] ?? '-')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            ) : (
              <EmptyState>Nenhum dado retornado</EmptyState>
            )}
          </DataTableWrapper>

          <InfoBox>
            ℹ️ {previewResult.rowCount} registros retornados ({previewResult.executionTime}ms)
            {previewResult.rowCount >= 10 && (
              <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                (mostrando 10 primeiros)
              </span>
            )}
          </InfoBox>
        </>
      ) : (
        <EmptyState>Clique em "Executar" para visualizar dados</EmptyState>
      )}
    </Container>
  );
};

export default PreviewPanel;













