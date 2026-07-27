/**
 * DynamicAgGridTable.tsx
 * 
 * Componente AG-Grid dinâmico que renderiza tabelas baseado em FormConfig da dictionary.
 * - Carrega colunas: gridColumns do visual_config
 * - Carrega dados: GET /api/{tableName}
 * - Features: sorting, filtering, double-click, delete
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridReadyEvent,
  GridApi,
  RowDoubleClickedEvent,
  GridOptions,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import DictionaryFormService, { GridColumnDef } from 'services/DictionaryFormService';
import { EntityFormModal } from '../Form/EntityFormModal';

/** Props do componente DynamicAgGridTable */
interface DynamicAgGridTableProps {
  tableName: string;
  onEditRow?: (rowData: any) => void;
  onDeleteRow?: (id: any) => void;
  onSelectionChange?: (selectedRows: any[]) => void;
  refreshTrigger?: number;
  pageSize?: number;
  filters?: Array<{
    fieldName: string;
    operator: 'contains' | 'equals' | '>' | '<' | '>=' | '<=' | 'between' | 'in';
    value: string | number | (string | number)[];
    valueFrom?: string | number;
    valueTo?: string | number;
  }>;
  searchTerm?: string;
}

/** Interface para estado do modal CRUD */
interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete';
  recordData: any | null;
}

/** Estilos container */
const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  margin-top: 24px;

  .ag-theme-quartz {
    --ag-header-background-color: #f0f2f5;
    --ag-header-foreground-color: #1a1a1a;
    --ag-row-hover-color: #e6e8eb;
    --ag-selected-row-background-color: #e3f2fd;
    --ag-borders-side-color: #e0e0e0;
    height: 400px;
  }
`;

const GridHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 2px solid #e0e0e0;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }
`;

const GridStats = styled.div`
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;

  span {
    display: flex;
    gap: 6px;
    align-items: center;

    strong {
      color: #1a1a1a;
    }
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: rgba(255, 255, 255, 0.9);

  div {
    text-align: center;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f0f2f5;
      border-top-color: #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 4px;
  padding: 12px 16px;
  color: #c62828;
  font-size: 14px;
  margin-bottom: 12px;

  strong {
    display: block;
    margin-bottom: 6px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;

  button {
    padding: 8px 16px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;

    &:hover {
      background: #1565c0;
    }

    &:disabled {
      background: #bdbdbd;
      cursor: not-allowed;
    }

    &.delete {
      background: #dc3545;

      &:hover:not(:disabled) {
        background: #c82333;
      }
    }

    &.edit {
      background: #2196f3;

      &:hover:not(:disabled) {
        background: #1976d2;
      }
    }
  }
`;

/**
 * DynamicAgGridTable
 * 
 * Renderiza tabela AG-Grid com dados e colunas carregados dinamicamente
 * da configuração dictionary + FormConfig
 */
export const DynamicAgGridTable: React.FC<DynamicAgGridTableProps> = ({
  tableName,
  onEditRow,
  onDeleteRow,
  onSelectionChange,
  refreshTrigger = 0,
  pageSize = 10,
  filters = [],
  searchTerm = '',
}) => {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

    // Estado para totalização filtrada
    const [filteredRowsCount, setFilteredRowsCount] = useState<number>(0);

  // Estado para modal CRUD
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    recordData: null,
  });
  const [formFields, setFormFields] = useState<any[]>([]);
  
  // Ref para debounce de filtros/busca
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string>('');

  // Função para formatar CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
    if (!value) return '';
    const onlyDigits = value.replace(/\D/g, '');
    if (onlyDigits.length === 11) {
      // CPF: 000.000.000-00
      return onlyDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (onlyDigits.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return onlyDigits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  /**
   * Carregar dados do backend via DictionaryFormService
   * Passa filtros e termo de busca como parâmetros de API
   * NOTA: Declarado antes dos handlers para ser usado em handleModalSuccess
   */
  const loadRowData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir query parameters a partir dos filtros e busca
      const queryParams: Record<string, any> = {};
      
      // Adicionar termo de busca (para busca global)
      if (searchTerm && searchTerm.trim()) {
        queryParams.search = searchTerm.trim();
      }
      
      // Adicionar filtros individuais
      if (filters && filters.length > 0) {
        queryParams.filters = filters.map(f => ({
          field: f.fieldName,
          operator: f.operator,
          value: f.value,
          valueFrom: f.valueFrom,
          valueTo: f.valueTo,
        }));
      }
      
      // Fazer requisição com filtros/busca como parâmetros
      const data = await DictionaryFormService.getTableData(tableName, queryParams);
      setRowData(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err: any) {
      setError(`Erro carregando dados: ${err.message}`);
      console.error('DynamicAgGridTable - loadRowData:', err);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  }, [tableName, filters, searchTerm]);

  /**
   * Carregar campos do formulário para usar no modal
   */
  const loadFormFields = useCallback(async () => {
    try {
      const formConfig = await DictionaryFormService.getFormConfig(tableName);
      if (formConfig?.formFields) {
        setFormFields(formConfig.formFields);
      }
    } catch (err: any) {
      console.error('DynamicAgGridTable - loadFormFields:', err);
    }
  }, [tableName]);

  /**
   * Handler: Abrir modal para criar novo registro
   */
  const handleCreateNew = useCallback(() => {
    setModalState({
      isOpen: true,
      mode: 'create',
      recordData: null,
    });
  }, []);

  /**
   * Handler: Abrir modal para editar registro
   */
  const handleEditRecord = useCallback((record: any) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      recordData: record,
    });
  }, []);

  /**
   * Handler: Abrir modal para deletar registro
   */
  const handleDeleteRecord = useCallback((record: any) => {
    setModalState({
      isOpen: true,
      mode: 'delete',
      recordData: record,
    });
  }, []);

  /**
   * Handler: Fechar modal
   */
  const handleCloseModal = useCallback(() => {
    setModalState({
      isOpen: false,
      mode: 'create',
      recordData: null,
    });
  }, []);

  /**
   * Handler: Sucesso na operação do modal (refazer busca de dados)
   */
  const handleModalSuccess = useCallback(() => {
    handleCloseModal();
    // Recarregar dados da grid
    loadRowData();
  }, [handleCloseModal, loadRowData]);

  /**
   * Carregar colunas do FormConfig via DictionaryFormService
   */
  const loadColumnDefs = useCallback(async () => {
    try {
      const formConfig = await DictionaryFormService.getFormConfig(tableName);
      if (!formConfig?.gridColumns || formConfig.gridColumns.length === 0) {
        throw new Error(`Nenhuma coluna configurada para ${tableName}`);
      }

      // Mapear GridColumnDef → ColDef (AG-Grid)
      const agColDefs: ColDef[] = formConfig.gridColumns.map((col: GridColumnDef) => ({
        field: col.field,
        headerName: col.headerName,
        width: col.width || 120,
        filter: col.filter !== false ? 'agTextColumnFilter' : false,
        sortable: col.sortable !== false,
        editable: false,
        valueFormatter:
          col.field === 'documento' || col.headerName?.toLowerCase().includes('documento')
            ? (params: any) => formatCpfCnpj(params.value)
            : undefined,
      }));

      // Adicionar coluna de ações (Edit/Delete) - ✅ Usando cellRendererFramework (React component)
      agColDefs.push({
        headerName: 'Ações',
        width: 140,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: (props: any) => (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%' }}>
            <button
              onClick={() => handleEditClick(props.data)}
              style={{
                padding: '4px 8px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
              title="Editar registro"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDeleteClick(props.data)}
              style={{
                padding: '4px 8px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
              }}
              title="Excluir registro"
            >
              🗑️
            </button>
          </div>
        ),
      });

      setColumnDefs(agColDefs);
      setError(null);
    } catch (err: any) {
      setError(`Erro carregando colunas: ${err.message}`);
      console.error('DynamicAgGridTable - loadColumnDefs:', err);
    }
  }, [tableName]);

  /**
   * Handle quando grid está pronto (GridReady event)
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onGridReady = useCallback(
    (event: GridReadyEvent) => {
      setGridApi(event.api);
      try {
        event.api.sizeColumnsToFit();
      } catch (e) {
        // ignore
      }
    },
    []
  );

  /**
   * Handle double-click em linha (editar)
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent) => {
      handleEditRecord(event.data);
    },
    [handleEditRecord]
  );

  /**
   * Handle botão Editar
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleEditClick = useCallback(
    (rowData: any) => {
      handleEditRecord(rowData);
    },
    [handleEditRecord]
  );

  /**
   * Handle botão Excluir
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDeleteClick = useCallback(
    (rowData: any) => {
      handleDeleteRecord(rowData);
    },
    [handleDeleteRecord]
  );

  /**
   * Handle seleção de linhas
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onSelectionChanged = useCallback(() => {
    if (gridApi) {
      const selected = gridApi.getSelectedRows();
      setSelectedRows(selected);
      if (onSelectionChange) {
        onSelectionChange(selected);
      }
    }
  }, [gridApi, onSelectionChange]);

  /**
   * Efeito: Carregar colunas ao montar ou tableName mudar
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadColumnDefs();
    loadFormFields();
  }, [tableName, loadColumnDefs, loadFormFields]);

  /**
   * Efeito: Carregar dados ao montar, tableName mudar, refreshTrigger mudar, filtros ou searchTerm mudar
   * ✅ CORRIGIDO: Inline fetch function + debounce para evitar múltiplas requisições
   */
  useEffect(() => {
    // Limpar timeout anterior se houver
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Cria uma chave para detectar se esta requisição é diferente da última
    const fetchKey = JSON.stringify({
      tableName,
      refreshTrigger,
      filters: filters.map(f => ({ ...f })),
      searchTerm,
    });

    // Se a requisição é idêntica à última, não fazer nada
    if (fetchKey === lastFetchRef.current) {
      return;
    }

    // Debounce de 300ms para evitar requisições frequentes (busca em tempo real)
    filterTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        // Construir query parameters a partir dos filtros e busca
        const queryParams: Record<string, any> = {};
        
        // Adicionar termo de busca (para busca global)
        if (searchTerm && searchTerm.trim()) {
          queryParams.search = searchTerm.trim();
        }
        
        // Adicionar filtros individuais
        if (filters && filters.length > 0) {
          queryParams.filters = filters.map(f => ({
            field: f.fieldName,
            operator: f.operator,
            value: f.value,
            valueFrom: f.valueFrom,
            valueTo: f.valueTo,
          }));
        }
        
        // Fazer requisição com filtros/busca como parâmetros
        const data = await DictionaryFormService.getTableData(tableName, queryParams);
        setRowData(Array.isArray(data) ? data : data.data || []);
        setError(null);
        
        // Registrar esta requisição como a última
        lastFetchRef.current = fetchKey;
      } catch (err: any) {
        setError(`Erro carregando dados: ${err.message}`);
        console.error('DynamicAgGridTable - fetchData:', err);
        setRowData([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [tableName, refreshTrigger, filters, searchTerm]);

  /**
   * Opções AG-Grid
   */
  const gridOptions: GridOptions = {
    pagination: true,
    paginationPageSize: pageSize,
    domLayout: 'normal',
    rowSelection: 'multiple',
    suppressRowClickSelection: false,
    animateRows: true,
  };

  // Atualiza total filtrado sempre que gridApi, rowData, filtros ou busca mudam
  useEffect(() => {
    if (gridApi) {
      setFilteredRowsCount(gridApi.getDisplayedRowCount());
    } else {
      setFilteredRowsCount(rowData.length);
    }
  }, [gridApi, rowData, filters, searchTerm]);

  if (loading && rowData.length === 0) {
    return (
      <LoadingOverlay>
        <div>
          <div className="spinner" />
          <p>Carregando dados de {tableName}...</p>
        </div>
      </LoadingOverlay>
    );
  }

  return (
    <GridContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <GridHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📊 Listagem de {tableName}</h3>
          <button
            onClick={handleCreateNew}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#45a049')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#4CAF50')}
            title="Criar novo registro"
          >
            ➕ Novo
          </button>
        </div>
        <GridStats>
          <span>
            Total: <strong>{filteredRowsCount}</strong>
          </span>
          <span>
            Selecionados: <strong>{selectedRows.length}</strong>
          </span>
        </GridStats>
      </GridHeader>

      <div
        className="ag-theme-quartz"
        style={{
          height: '400px',
          width: '100%',
        }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          onRowDoubleClicked={onRowDoubleClicked}
          onSelectionChanged={onSelectionChanged}
          rowBuffer={10}
          defaultColDef={{
            flex: 1,
            minWidth: 100,
            resizable: true,
          }}
          enableCellTextSelection
        />
      </div>

      <ActionButtons>
        <button
          onClick={() => loadRowData()}
          title="Recarregar dados"
        >
          🔄 Recarregar
        </button>
        <button
          onClick={() => {
            if (selectedRows.length === 0) {
              alert('Selecione pelo menos um registro');
              return;
            }
            if (onDeleteRow && selectedRows.length === 1) {
              onDeleteRow(selectedRows[0]);
            }
          }}
          disabled={selectedRows.length === 0}
          className="delete"
        >
          🗑️ Excluir ({selectedRows.length})
        </button>
      </ActionButtons>

      {/* Modal CRUD - CREATE, EDIT, DELETE */}
      <EntityFormModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        tableName={tableName}
        recordData={modalState.recordData}
        fields={formFields}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </GridContainer>
  );
};

export default DynamicAgGridTable;













