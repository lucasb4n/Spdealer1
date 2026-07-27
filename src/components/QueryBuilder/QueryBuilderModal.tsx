/**
 * QueryBuilderModal.tsx
 * 
 * Modal principal do Query Builder Gráfico
 * Integra TableSelector, ColumnSelector, JoinBuilder, FilterBuilder, PreviewPanel
 * Gerencia estado global e sincroniza mudanças em tempo real
 * 
 * @component
 * @example
 * <QueryBuilderModal
 *   isOpen={true}
 *   onClose={() => setIsOpen(false)}
 *   onSave={(name, config) => saveQuery(name, config)}
 * />
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import {
  QueryBuilderConfig,
  DatabaseTable,
  DatabaseColumn,
  SelectedColumn,
  JoinConfig,
  FilterCondition,
  QueryPreviewResult,
  FilterOperator,
  DEFAULT_QUERY_CONFIG,
  AGGREGATION_OPTIONS,
  FILTER_OPERATORS,
} from 'queryBuilder';
import { QueryBuilderService, DashboardQueryService } from 'services/QueryBuilderService';
import TableSelector from './TableSelector';
import ColumnSelector from './ColumnSelector';
import JoinBuilder from './JoinBuilder';
import FilterBuilder from './FilterBuilder';
import PreviewPanel from './PreviewPanel';
import SaveQueryDialog from './SaveQueryDialog';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const ModalContainer = styled(Modal)`
  .modal-lg {
    max-width: 95vw;
    max-height: 95vh;
  }

  .modal-body {
    padding: 0;
    height: 70vh;
    display: flex;
    background: #ffffff;
  }
`;

const BuilderPanel = styled.div`
  flex: 1;
  padding: 20px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  background: #fafafa;

  /* Scroll customizado */
  &::-webkit-scrollbar {
    width: 8px;
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

const PreviewPanelContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #ffffff;

  &::-webkit-scrollbar {
    width: 8px;
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

const SectionContainer = styled.div`
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FooterContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
`;

const SaveButton = styled(Button as any)`
  background: #10b981;
  border: none;
  padding: 8px 20px;

  &:hover {
    background: #059669;
  }
`;

const PreviewButton = styled(Button as any)`
  background: #3b82f6;
  border: none;
  padding: 8px 16px;

  &:hover {
    background: #2563eb;
  }
`;

const CancelButton = styled(Button as any)`
  background: #6b7280;
  border: none;
  padding: 8px 16px;

  &:hover {
    background: #4b5563;
  }
`;

const ErrorAlert = styled(Alert)`
  margin-bottom: 16px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface QueryBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (queryName: string, config: QueryBuilderConfig) => Promise<void>;
  initialConfig?: QueryBuilderConfig;
  initialQueryName?: string;
  existingQueryId?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const QueryBuilderModal: React.FC<QueryBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = DEFAULT_QUERY_CONFIG,
  initialQueryName = '',
  existingQueryId,
}) => {
  // State
  const [config, setConfig] = useState<QueryBuilderConfig>(initialConfig);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [columns, setColumns] = useState<DatabaseColumn[]>([]);
  const [sql, setSql] = useState('');
  const [previewResult, setPreviewResult] = useState<QueryPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Stable ref to access latest config inside callbacks without forcing re-creation
  const configRef = useRef<QueryBuilderConfig>(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // Stable generateSQLPreview so handlers can safely include it in dependency arrays
  const generateSQLPreview = useCallback(async (newConfig?: QueryBuilderConfig) => {
    try {
      const configToUse = newConfig || configRef.current;

      // Validar config
      const validation = await QueryBuilderService.validateConfig(configToUse);
      if (!validation.valid) {
        setValidationError(validation.error || 'Erro de validação');
        setSql('');
        return;
      }

      // Gerar SQL
      const sqlStr = await QueryBuilderService.generateSQL(configToUse);
      setSql(sqlStr);
      setValidationError(null);
    } catch (err) {
      setSql('');
      setValidationError(err instanceof Error ? err.message : 'Erro ao gerar SQL');
    }
  }, []);

  // ========================================================================
  // LOAD INITIAL DATA
  // ========================================================================

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar tabelas disponíveis
      const tablesData = await QueryBuilderService.getTables();
      setTables(tablesData);

      // Carregar colunas para a tabela selecionada (se houver)
      if (configRef.current.baseTable && configRef.current.baseTable.name) {
        await loadColumnsForTable(configRef.current.baseTable.name);
      }

      // Gerar SQL preview
      await generateSQLPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [generateSQLPreview]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, loadInitialData]);

  const loadColumnsForTable = async (tableName: string) => {
    try {
      // Função auxiliar que busca colunas da tabela específica
      const allColumns = await QueryBuilderService.getTables();
      const tableData = allColumns.find((t) => t.table_name === tableName);

      if (tableData) {
        // Aqui você precisaria ter um endpoint que retorne colunas
        // Por enquanto, usar mock ou fazer nova chamada
        setColumns([]);
      }
    } catch (err) {
      console.error('Erro ao carregar colunas:', err);
    }
  };

  // ========================================================================
  // HANDLERS - TABELA
  // ========================================================================

  const handleTableChange = useCallback(async (tableName: string) => {
    const newConfig = { ...config, baseTable: { name: tableName, alias: tableName } };
    setConfig(newConfig);
    setValidationError(null);

    await loadColumnsForTable(tableName);
    await generateSQLPreview(newConfig);
  }, [config, generateSQLPreview]);

  // ========================================================================
  // HANDLERS - COLUNAS
  // ========================================================================

  const handleAddColumn = useCallback(() => {
    if (!columns.length) {
      setValidationError('Nenhuma coluna disponível');
      return;
    }

    const newColumn: SelectedColumn = {
      column: columns[0].column_name,
      table: config.baseTable.name,
      alias: undefined,
      aggregation: undefined,
    };

    const newConfig = {
      ...config,
      columns: [...config.columns, newColumn],
    };
    setConfig(newConfig);
    generateSQLPreview(newConfig);
  }, [config, columns, generateSQLPreview]);

  const handleUpdateColumn = useCallback(
    (index: number, field: keyof SelectedColumn, value: any) => {
      const newColumns = [...config.columns];
      newColumns[index] = { ...newColumns[index], [field]: value };

      const newConfig = { ...config, selectedColumns: newColumns };
      setConfig(newConfig);
      generateSQLPreview(newConfig);
    },
    [config, generateSQLPreview]
  );

  const handleRemoveColumn = useCallback((index: number) => {
    const newConfig = {
      ...config,
      selectedColumns: config.columns.filter((_, i) => i !== index),
    };
    setConfig(newConfig);
    generateSQLPreview(newConfig);
  }, [config, generateSQLPreview]);

  // ========================================================================
  // HANDLERS - JOINS
  // ========================================================================

  const handleAddJoin = useCallback(() => {
    if (tables.length < 2) {
      setValidationError('É necessário ter pelo menos 2 tabelas para fazer JOIN');
      return;
    }

    const newJoin: JoinConfig = {
      type: 'INNER',
      table: tables.find((t) => t.table_name !== config.baseTable.name)?.table_name || '',
      alias: '',
      on: {
        operator: '=',
        leftTable: config.baseTable.name,
        leftColumn: '',
        rightTable: '',
        rightColumn: '',
      },
    };

    const newConfig = {
      ...config,
      joins: [...(config.joins || []), newJoin],
    };
    setConfig(newConfig);
    generateSQLPreview(newConfig);
  }, [config, tables, generateSQLPreview]);

  const handleUpdateJoin = useCallback(
    (index: number, joinUpdate: Partial<JoinConfig>) => {
      const newJoins = [...(config.joins || [])];
      newJoins[index] = { ...newJoins[index], ...joinUpdate };

      const newConfig = { ...config, joins: newJoins };
      setConfig(newConfig);
      generateSQLPreview(newConfig);
    },
    [config, generateSQLPreview]
  );

  const handleRemoveJoin = useCallback((index: number) => {
    const newConfig = {
      ...config,
      joins: (config.joins || []).filter((_, i) => i !== index),
    };
    setConfig(newConfig);
    generateSQLPreview(newConfig);
  }, [config, generateSQLPreview]);

  // ========================================================================
  // HANDLERS - FILTROS
  // ========================================================================

  const handleAddFilter = useCallback(() => {
    if (!config.columns.length) {
      setValidationError('Adicione colunas antes de criar filtros');
      return;
    }

    const newFilter: FilterCondition = {
      column: config.columns[0].column,
      operator: '=',
      value: '',
      logical: (config.filters || []).length > 0 ? 'AND' : undefined,
    };

    const newConfig = {
      ...config,
      filters: [...(config.filters || []), newFilter],
    };
    setConfig(newConfig);
    generateSQLPreview(newConfig);
  }, [config, generateSQLPreview]);

  const handleUpdateFilter = useCallback(
    (index: number, filterUpdate: Partial<FilterCondition>) => {
      const newFilters = [...(config.filters || [])];
      newFilters[index] = { ...newFilters[index], ...filterUpdate };

      const newConfig = { ...config, filters: newFilters };
      setConfig(newConfig);
      generateSQLPreview(newConfig);
    },
    [config, generateSQLPreview]
  );

  const handleRemoveFilter = useCallback((index: number) => {
    const newConfig = {
      ...config,
      filters: (config.filters || []).filter((_, i) => i !== index),
    };
    setConfig(newConfig);
    generateSQLPreview(newConfig);
  }, [config, generateSQLPreview]);

  // ========================================================================
  // HANDLERS - ORDER BY (none currently wired)
  // ========================================================================
  // HANDLERS - LIMIT
  // ========================================================================

  const handleLimitChange = useCallback((limit: number) => {
    const newConfig = { ...configRef.current, limit };
    setConfig(newConfig);
    generateSQLPreview(newConfig);
  }, [generateSQLPreview]);

  // generateSQLPreview moved earlier and implemented as a stable useCallback

  const handleExecutePreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await QueryBuilderService.previewQuery(config);
      setPreviewResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar preview');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // SAVE QUERY
  // ========================================================================

  const handleSaveQuery = async (queryName: string) => {
    try {
      setLoading(true);
      setError(null);

      // Salvar via callback ou serviço
      if (existingQueryId) {
        await DashboardQueryService.updateQuery(existingQueryId, {
          name: queryName,
          config: config,
        });
      } else {
        await onSave(queryName, config);
      }

      setShowSaveDialog(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar query');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <>
      <ModalContainer show={isOpen} onHide={onClose} size="lg" fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Query Builder Gráfico</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading && (
            <LoadingOverlay>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </Spinner>
            </LoadingOverlay>
          )}

          <BuilderPanel>
            {error && <ErrorAlert variant="danger">{error}</ErrorAlert>}
            {validationError && <ErrorAlert variant="warning">{validationError}</ErrorAlert>}

            <SectionContainer>
              <TableSelector
                tables={tables}
                selected={config.baseTable.name}
                onChange={handleTableChange}
              />
            </SectionContainer>

            <SectionContainer>
              <ColumnSelector
                columns={config.columns}
                availableColumns={columns}
                onAddColumn={handleAddColumn}
                onUpdateColumn={handleUpdateColumn}
                onRemoveColumn={handleRemoveColumn}
                aggregationOptions={Object.keys(AGGREGATION_OPTIONS) as any[]}
              />
            </SectionContainer>

            <SectionContainer>
              <JoinBuilder
                joins={config.joins || []}
                tables={tables}
                baseTable={config.baseTable.name}
                onAddJoin={handleAddJoin}
                onUpdateJoin={handleUpdateJoin}
                onRemoveJoin={handleRemoveJoin}
              />
            </SectionContainer>

            <SectionContainer>
              <FilterBuilder
                filters={config.filters || []}
                columns={config.columns}
                filterOperators={Object.entries(FILTER_OPERATORS).map(([value, label]) => ({ value: value as FilterOperator, label }))}
                onAddFilter={handleAddFilter}
                onUpdateFilter={handleUpdateFilter}
                onRemoveFilter={handleRemoveFilter}
              />
            </SectionContainer>

            <SectionContainer>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: 600, fontSize: '14px' }}>Limite de Registros</label>
              </div>
              <input
                type="number"
                min="1"
                max="10000"
                value={config.limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value, 10))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  width: '100%',
                }}
              />
            </SectionContainer>
          </BuilderPanel>

          <PreviewPanelContainer>
            <PreviewPanel
              sql={sql}
              previewResult={previewResult}
              loading={loading}
              onExecutePreview={handleExecutePreview}
            />
          </PreviewPanelContainer>
        </Modal.Body>

        <Modal.Footer>
          <FooterContainer>
            {React.createElement(CancelButton as any, { onClick: onClose }, 'Cancelar')}
            {React.createElement(PreviewButton as any, { onClick: handleExecutePreview, disabled: loading === true || !sql }, loading ? 'Executando...' : 'Executar Preview')}
            {React.createElement(SaveButton as any, { onClick: () => setShowSaveDialog(true), disabled: !sql }, 'Salvar Query')}
          </FooterContainer>
        </Modal.Footer>
      </ModalContainer>

      {/* Save Dialog */}
      <SaveQueryDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveQuery}
        initialName={initialQueryName}
      />
    </>
  );
};

export default QueryBuilderModal;














