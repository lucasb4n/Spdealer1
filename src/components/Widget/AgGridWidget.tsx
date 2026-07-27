import React, { useMemo, useRef } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { AgGridReact } from 'ag-grid-react';
import { useWidgetData } from '../../contexts/WidgetDataContext';
import 'ag-grid-community/styles/ag-theme-quartz.css';
// import '@fortawesome/fontawesome-free/css/all.min.css'; // Commented: FontAwesome CSS issues

// Função utilitária para garantir que apenas string/número seja renderizado
function getSafeText(value: any): string | number {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(getSafeText).join(', ');
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return '';
}

// Converte valores CSS básicos: se for número, acrescenta 'px', senão retorna como string
function toCssSize(v: any, fallback = ''): string {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'number') return `${v}px`;
  if (typeof v === 'string') return v;
  return String(v);
}

const currencyFormatter = (value: any) => {
  const numeric = typeof value === 'number'
    ? value
    : Number(String(value ?? '').replace(/[^0-9,-]+/g, '').replace(',', '.'));
  if (Number.isFinite(numeric)) {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric);
    } catch {
      return numeric;
    }
  }
  return value ?? '';
};

const cnpjFormatter = (value: any) => {
  const clean = String(value ?? '').replace(/\D/g, '');
  if (clean.length !== 14) return value ?? '';
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
};

const cpfFormatter = (value: any) => {
  const clean = String(value ?? '').replace(/\D/g, '');
  if (clean.length !== 11) return value ?? '';
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
};

const cpfCnpjFormatter = (value: any) => {
  const clean = String(value ?? '').replace(/\D/g, '');
  if (clean.length === 14) return cnpjFormatter(value);
  if (clean.length === 11) return cpfFormatter(value);
  return value ?? '';
};

/**
 * Formatter para documentos SEMPRE com 14 dígitos
 * Preserva zeros à esquerda
 * Exemplos:
 * - 00053213564905 → 000.532.135.649-05
 * - 77574119000100 → 77.574.119/0001-00
 */
const documento14Formatter = (value: any) => {
  const clean = String(value ?? '').replace(/\D/g, '');
  if (clean.length !== 14) {
    console.warn('[documento14Formatter] Documento sem 14 dígitos:', { value, clean, tamanho: clean.length });
    return value ?? '';
  }
  // Formato: XX.XXX.XXX/XXXX-XX (CNPJ pattern para 14 dígitos)
  return `${clean.substring(0, 2)}.${clean.substring(2, 5)}.${clean.substring(5, 8)}/${clean.substring(8, 12)}-${clean.substring(12, 14)}`;
};

interface AgGridWidgetProps {
  config: any;
  data: any;
  theme?: any;
  visual?: any;
  widgetId?: string | number;
}

const StyledCard = styled.div<{ $vc?: any }>`
  background: ${(p: any) => p.$vc?.card_bg ?? '#fff'};
  border-radius: ${(p: any) => toCssSize(p.$vc?.card_radius ?? 14)};
  box-shadow: ${(p: any) => p.$vc?.card_shadow ?? '0 2px 12px rgba(34,51,106,0.10)'};
  padding: ${(p: any) => p.$vc?.card_padding ?? '24px'};
  margin-bottom: ${(p: any) => p.$vc?.card_margin_bottom ?? '32px'};
  max-width: ${(p: any) => p.$vc?.card_max_width ?? '1000px'};
  margin-left: ${(p: any) => p.$vc?.card_margin_left ?? 'auto'};
  margin-right: ${(p: any) => p.$vc?.card_margin_right ?? 'auto'};
  border: ${(p: any) => (p.$vc?.card_border_width && p.$vc?.card_border
    ? `${p.$vc.card_border_width}px solid ${p.$vc.card_border}`
    : '1.5px solid #e3e8f0')};
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const TitleRow = styled.div<{ $vc?: any }>`
  display: flex;
  align-items: center;
  gap: ${(p: any) => p.$vc?.title_gap ?? '12px'};
  margin-bottom: ${(p: any) => p.$vc?.title_margin_bottom ?? '16px'};
  justify-content: ${(p: any) => p.$vc?.title_align ?? 'flex-start'};
`;

const TitleIcon = styled.i<{ $vc?: any }>`
  font-size: ${(p: any) => p.$vc?.title_icon_size ?? '1.15rem'};
  color: ${(p: any) => p.$vc?.title_icon_color ?? p.$vc?.title_color ?? '#2563eb'};
`;

const TitleEl = styled.div<{ $vc?: any }>`
  font-size: ${(p: any) => p.$vc?.title_font_size ?? '1.15rem'};
  font-weight: ${(p: any) => p.$vc?.title_font_weight ?? 600};
  color: ${(p: any) => p.$vc?.title_color ?? '#333'};
  text-align: ${(p: any) => p.$vc?.title_align ?? 'left'};
`;

const GridWrapper = styled.div<{ $vc?: any }>`
  flex: 1;
  height: 100%;
  width: 100%;
  background: ${(p: any) => p.$vc?.header_bg ?? 'transparent'};
  color: ${(p: any) => p.$vc?.header_color ?? 'inherit'};
  font-weight: ${(p: any) => p.$vc?.header_font_weight ?? 'inherit'};
  font-size: ${(p: any) => p.$vc?.row_font_size ?? '0.95rem'};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  
  /* Garantir que AG Grid renderiza dentro do espaço */
  .ag-root {
    height: 100%;
    width: 100%;
  }

  /* ✅ NOVO: Estilo para linha de totalizações (pinned bottom row) */
  .ag-pinned-bottom-row {
    background-color: #f5f5f5 !important;
    border-top: 2px solid #2563eb !important;
    font-weight: bold !important;
  }

  .ag-pinned-bottom-row .ag-cell {
    background-color: #f5f5f5 !important;
    border-bottom: 1px solid #d0d0d0 !important;
    font-weight: 700 !important;
    color: #222 !important;
    padding: 10px 12px !important;
  }

  .ag-pinned-bottom-row .ag-cell:first-child {
    color: #2563eb !important;
  }

  /* Desabilitar hover effects na linha de total */
  .ag-pinned-bottom-row:hover {
    background-color: #f5f5f5 !important;
  }
`;

const LabelEl = styled.div<{ $vc?: any }>`
  font-size: ${(p: any) => p.$vc?.label_font_size ?? '0.98rem'};
  color: ${(p: any) => p.$vc?.label_color ?? '#888'};
  margin-top: ${(p: any) => p.$vc?.label_margin_top ?? '8px'};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ActionBtn = styled.button<{ $vc?: any }>`
  background: ${(p: any) => p.$vc?.actions_bg ?? '#f4f6fa'};
  color: ${(p: any) => p.$vc?.actions_icon_color ?? '#2563eb'};
  border: none;
  border-radius: ${(p: any) => (p.$vc?.actions_radius ? `${p.$vc.actions_radius}px` : '6px')};
  margin-right: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${(p: any) => p.$vc?.actions_hover_bg ?? undefined};
  }
`;

const NoDataBox = styled.div<{ $vc?: any }>`
  padding: 20px;
  text-align: center;
  color: ${(p: any) => p.$vc?.no_data_color ?? '#999'};
  background-color: transparent;
  font-weight: 500;
`;

const AgGridWidget: React.FC<AgGridWidgetProps> = ({ config, data, theme, visual, widgetId }) => {
  // Buscar dados do contexto se disponível
  const contextData = useWidgetData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dataFromContext = useMemo(() => {
    if (widgetId && contextData) {
      const retrieved = contextData.get(widgetId);
      // DEBUG - EXPANDIDO
      if (config?.title?.includes('Saldo') || config?.title?.includes('Caixa')) {
        const debugInfo = {
          widgetId,
          retrieved: retrieved ? { rowsCount: retrieved.rows?.length, colsCount: retrieved.columns?.length, keys: Object.keys(retrieved || {}) } : null,
          contextDataType: typeof contextData,
        };
        console.debug('[AgGridWidget] Context lookup:', debugInfo);
        console.log('[AgGridWidget] Context lookup JSON:', JSON.stringify(debugInfo, null, 2));
      }
      return retrieved;
    }
    return undefined;
  }, [widgetId, contextData]);
  
  // ⚠️ CRÍTICO: 'data' é CONFIGURAÇÃO (config widget), não dados!
  // Os dados REAIS vêm do contextData (rows/columns)
  // Nunca usar 'data' como source de dados - usar 'data' apenas para config
  const actualRowsData = dataFromContext || (data && Array.isArray(data.rows) ? data : undefined);

  // DEBUG - EXPANDIDO
  if (config?.title?.includes('Saldo') || config?.title?.includes('Caixa')) {
    const debugResolution = {
      widgetId,
      hasContextData: !!dataFromContext,
      hasDataProp: !!data,
      dataFromContextKeys: dataFromContext ? Object.keys(dataFromContext) : [],
      actualRowsDataRowsCount: actualRowsData?.rows?.length,
      actualRowsDataColsCount: actualRowsData?.columns?.length,
    };
    console.debug('[AgGridWidget] Data resolution:', debugResolution);
    console.log('[AgGridWidget] Data resolution JSON:', JSON.stringify(debugResolution, null, 2));
  }

  const visualConfig = visual ?? config?.visual_config ?? {};
  const gridConfig = config?.data_config ?? {};
  const gridRef = useRef<any>(null);

  const gridClass = visualConfig.aggrid_theme ?? 'ag-theme-quartz';

  const rowData = Array.isArray(actualRowsData?.rows) ? actualRowsData.rows : Array.isArray(actualRowsData) ? actualRowsData : [];
  
  // DEBUG - EXPANDIDO
  if (config?.title?.includes('Saldo') || config?.title?.includes('Caixa')) {
    const debugRowData = {
      rowDataLength: rowData.length,
      firstRow: rowData[0] ? { ...rowData[0] } : null,
      actualRowsDataExists: !!actualRowsData,
      actualRowsDataKeys: actualRowsData ? Object.keys(actualRowsData) : [],
    };
    console.debug('[AgGridWidget] Row data:', debugRowData);
    console.log('[AgGridWidget] Row data JSON:', JSON.stringify(debugRowData, null, 2));
  }
  
  // ✅ CRÍTICO: Memoizar a geração de columnDefs para evitar re-renders infinitos
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columnDefs = useMemo(() => {
    // PRIORIDADE: Usar colunas retornadas pelo backend (mais confiáveis)
    const backendColumnDefs = (Array.isArray(actualRowsData?.columns) && actualRowsData.columns.length > 0)
      ? actualRowsData.columns
      : undefined;
    
    // DEBUG - EXPANDIDO
    if (config?.title?.includes('Saldo') || config?.title?.includes('Caixa')) {
      const debugCols = {
        hasBackendCols: !!backendColumnDefs,
        backendColsCount: backendColumnDefs?.length,
        backendColsFields: backendColumnDefs?.slice(0, 3).map((c: any) => c.field),
        visualConfigCols: visualConfig.columnDefs?.length,
        gridConfigCols: gridConfig.columnDefs?.length,
        usedSource: backendColumnDefs ? 'BACKEND' : visualConfig.columnDefs ? 'VISUAL_CONFIG' : gridConfig.columnDefs ? 'GRID_CONFIG' : 'NONE',
      };
      console.debug('[AgGridWidget] Column generation:', debugCols);
      console.log('[AgGridWidget] Column generation JSON:', JSON.stringify(debugCols, null, 2));
    }
    
    // Fallback: Usar colunas do visual_config/data_config se backend não retornar
    let cols = backendColumnDefs ??
      ((Array.isArray(visualConfig.columnDefs) ? visualConfig.columnDefs : undefined)
      ?? (Array.isArray(gridConfig.columnDefs) ? gridConfig.columnDefs : undefined)
      ?? []);

    let result = [...cols];
    if (!result.length && rowData.length > 0 && typeof rowData[0] === 'object') {
      const headerMap: Record<string, string> = {
        filial_cai: 'Filial',
        cliente_cai: 'Conta',
        nomefan_bco: 'Banco/Caixa',
        saldo_cai: 'Saldo',
      };

      result = Object.keys(rowData[0]).map(key => {
        const sample = rowData[0][key];
        const column: any = {
          headerName: headerMap[key] ?? key,
          field: key,
          sortable: true,
          filter: true,
          resizable: true,
          headerClass: 'aggrid-header',
          cellStyle: {
            borderBottom: `1px solid ${visualConfig.row_border ?? '#e3e8f0'}`,
            fontSize: visualConfig.row_font_size ?? '0.98rem',
            color: visualConfig.row_color ?? '#444',
          },
        };

        // Detectar campo "documento" com 14 dígitos e aplicar formatter
        if (key.toLowerCase() === 'documento' || key.toLowerCase().includes('doc')) {
          // Validar se realmente tem 14 dígitos
          const clean = String(sample ?? '').replace(/\D/g, '');
          if (clean.length === 14) {
            column.valueFormatter = (params: any) => documento14Formatter(params?.value);
            console.debug(`[AgGridWidget] Aplicando documento14Formatter para coluna: ${key}`);
          }
        } else if (typeof sample === 'number' || (typeof sample === 'string' && /^-?\d+(?:[.,]\d+)?$/.test(sample))) {
          column.filter = 'agNumberColumnFilter';
          column.valueFormatter = (params: any) => currencyFormatter(params?.value);
          column.cellStyle = { ...column.cellStyle, textAlign: 'right' };
        } else if (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample)) {
          column.filter = 'agDateColumnFilter';
        }

        return column;
      });

      const preferred = ['cliente_cai', 'nomefan_bco', 'saldo_cai'];
      const present = result.reduce((acc: Record<string, any>, c: any) => {
        acc[c.field] = c;
        return acc;
      }, {});

      const ordered: any[] = [];
      for (const key of preferred) {
        if (present[key]) ordered.push(present[key]);
      }
      for (const col of result) {
        if (!ordered.find((existing: any) => existing.field === col.field)) ordered.push(col);
      }

      ordered.forEach(col => {
        if (col.field === 'cliente_cai') col.width = col.width ?? 120;
        if (col.field === 'nomefan_bco' || col.field === 'nome_bco') col.width = col.width ?? 240;
        if (col.field && String(col.field).toLowerCase().includes('saldo')) col.width = col.width ?? 170;
      });

      // Ajustes específicos de ordem solicitados:
      // - Inserir `historico_cai` logo após a coluna do banco
      // - Mover `seq_cai` para imediatamente após `dtmovi_cai`
      const mutable = [...ordered];
      const bankFields = ['banco_cai', 'nomefan_bco', 'nome_bco'];

      // posicionar historico_cai após coluna de banco (se existir)
      const idxHistorico = mutable.findIndex(c => c.field === 'historico_cai');
      if (idxHistorico !== -1) {
        const [histCol] = mutable.splice(idxHistorico, 1);
        const idxBank = mutable.findIndex(c => bankFields.includes(String(c.field)));
        const insertAt = idxBank !== -1 ? idxBank + 1 : mutable.length;
        mutable.splice(insertAt, 0, histCol);
      }

      // mover seq_cai para logo após dtmovi_cai
      const idxSeq = mutable.findIndex(c => c.field === 'seq_cai');
      const idxDtmovi = mutable.findIndex(c => c.field === 'dtmovi_cai');
      if (idxSeq !== -1 && idxDtmovi !== -1) {
        const [seqCol] = mutable.splice(idxSeq, 1);
        const newPos = mutable.findIndex(c => c.field === 'dtmovi_cai');
        mutable.splice(newPos + 1, 0, seqCol);
      }

      result = mutable;
    }
    
    return result;
  }, [actualRowsData, visualConfig, gridConfig, rowData]);

  const actions = Array.isArray(visualConfig.actions) ? visualConfig.actions : [];
  const actionsIcons = Array.isArray(visualConfig.actions_icons) ? visualConfig.actions_icons : [];
  const actionsTooltips = Array.isArray(visualConfig.actions_tooltips) ? visualConfig.actions_tooltips : [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sanitizedColumnDefs = useMemo(() => {
    if (!Array.isArray(columnDefs)) return [];
    return columnDefs.map((col: any) => {
      const copy = { ...col };
      if (Object.prototype.hasOwnProperty.call(copy, 'type')) delete copy.type;

      // Handle cellFormatter (alias for valueFormatter)
      if (typeof copy.cellFormatter === 'string') {
        if (copy.cellFormatter === 'documentFormatter' || copy.cellFormatter === 'documento') {
          copy.valueFormatter = (params: any) => cpfCnpjFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        } else if (copy.cellFormatter === 'currencyFormatter' || copy.cellFormatter === 'currency') {
          copy.valueFormatter = (params: any) => currencyFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'right' };
          copy.filter = copy.filter ?? 'agNumberColumnFilter';
        } else if (copy.cellFormatter === 'cpfFormatter') {
          copy.valueFormatter = (params: any) => cpfFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        } else if (copy.cellFormatter === 'cnpjFormatter') {
          copy.valueFormatter = (params: any) => cnpjFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        }
        // Remove cellFormatter after processing
        delete copy.cellFormatter;
      }

      if (typeof copy.valueFormatter === 'string') {
        if (copy.valueFormatter === 'currency') {
          copy.valueFormatter = (params: any) => currencyFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'right' };
          copy.filter = copy.filter ?? 'agNumberColumnFilter';
        }
        if (copy.valueFormatter === 'percent') {
          copy.valueFormatter = (params: any) => {
            const numeric = Number(params?.value);
            if (Number.isFinite(numeric)) return `${numeric.toFixed(2)}%`;
            return params?.value ?? '';
          };
        }
        if (copy.valueFormatter === 'cnpj') {
          copy.valueFormatter = (params: any) => cnpjFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        }
        if (copy.valueFormatter === 'cpf') {
          copy.valueFormatter = (params: any) => cpfFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        }
        if (copy.valueFormatter === 'cpf_cnpj' || copy.valueFormatter === 'documento') {
          copy.valueFormatter = (params: any) => cpfCnpjFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        }
      }

      if (!copy.valueFormatter && copy.field && String(copy.field).toLowerCase().includes('valor')) {
        copy.valueFormatter = (params: any) => currencyFormatter(params?.value);
        copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: copy.cellStyle?.textAlign ?? 'right' };
        copy.filter = copy.filter ?? 'agNumberColumnFilter';
      }

      // Nota: não atribuímos `aggFunc` automaticamente para evitar necessidade
      // de módulos enterprise (RowGrouping/Pivot/TreeData). As somas são
      // calculadas manualmente em `pinnedBottomRowData` para compatibilidade.

      // Auto-detect document fields (cgccpf, documento, cnpj, cpf)
      if (!copy.valueFormatter && copy.field) {
        const fieldLower = String(copy.field).toLowerCase();
        if (fieldLower.includes('cgccpf') || fieldLower.includes('documento')) {
          copy.valueFormatter = (params: any) => cpfCnpjFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        } else if (fieldLower.includes('cnpj')) {
          copy.valueFormatter = (params: any) => cnpjFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        } else if (fieldLower.includes('cpf')) {
          copy.valueFormatter = (params: any) => cpfFormatter(params?.value);
          copy.cellStyle = { ...(copy.cellStyle || {}), textAlign: 'left' };
        }
      }

      return copy;
    });
  }, [columnDefs]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultSortModel = useMemo(() => {
    const sort = visualConfig.default_sort ?? gridConfig.default_sort;
    if (Array.isArray(sort)) return sort;
    if (sort && typeof sort === 'object') return [sort];
    return undefined;
  }, [gridConfig.default_sort, visualConfig.default_sort]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const configuredRowHeight = useMemo(() => {
    const rh = Number(visualConfig.row_height ?? gridConfig.row_height);
    if (Number.isFinite(rh) && rh > 0) return rh;
    return undefined;
  }, [gridConfig.row_height, visualConfig.row_height]);

  // ✅ NOVO: Calcular totalizações para colunas com aggFunc
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pinnedBottomRowData = useMemo(() => {
    if (!Array.isArray(rowData) || rowData.length === 0 || !Array.isArray(sanitizedColumnDefs)) {
      return undefined;
    }

    // Verificar se há alguma coluna com aggFunc
    const colsWithAgg = sanitizedColumnDefs.filter((col: any) => col.aggFunc === 'sum' || col.aggFunc === 'avg' || col.aggFunc === 'min' || col.aggFunc === 'max');
    if (colsWithAgg.length === 0) return undefined;

    const totalRow: Record<string, any> = {};

    // Calcular somas para cada coluna com aggFunc
    colsWithAgg.forEach((col: any) => {
      if (!col.field) return;

      if (col.aggFunc === 'sum') {
        const sum = rowData.reduce((acc: number, row: any) => {
          const value = row[col.field];
          const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9,-]+/g, '').replace(',', '.'));
          return acc + (Number.isFinite(numeric) ? numeric : 0);
        }, 0);
        totalRow[col.field] = sum;
      } else if (col.aggFunc === 'avg') {
        const sum = rowData.reduce((acc: number, row: any) => {
          const value = row[col.field];
          const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9,-]+/g, '').replace(',', '.'));
          return acc + (Number.isFinite(numeric) ? numeric : 0);
        }, 0);
        totalRow[col.field] = rowData.length > 0 ? sum / rowData.length : 0;
      } else if (col.aggFunc === 'min') {
        const values = rowData.map((row: any) => {
          const value = row[col.field];
          const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9,-]+/g, '').replace(',', '.'));
          return Number.isFinite(numeric) ? numeric : Infinity;
        }).filter(v => v !== Infinity);
        totalRow[col.field] = values.length > 0 ? Math.min(...values) : 0;
      } else if (col.aggFunc === 'max') {
        const values = rowData.map((row: any) => {
          const value = row[col.field];
          const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^0-9,-]+/g, '').replace(',', '.'));
          return Number.isFinite(numeric) ? numeric : -Infinity;
        }).filter(v => v !== -Infinity);
        totalRow[col.field] = values.length > 0 ? Math.max(...values) : 0;
      }
    });

    // Adicionar label na primeira coluna
    if (sanitizedColumnDefs.length > 0 && sanitizedColumnDefs[0].field) {
      totalRow[sanitizedColumnDefs[0].field] = 'TOTAL';
    }

    return [totalRow];
  }, [rowData, sanitizedColumnDefs]);

  // Validação: se config é undefined, retornar placeholder (após todos os hooks)
  if (!config) {
    return (
      <StyledCard>
        <NoDataBox>
          Configuração da tabela indisponível
        </NoDataBox>
      </StyledCard>
    );
  }

  return (
    <StyledCard $vc={visualConfig} className="dashboard-aggrid">
      {visualConfig.title ? (
        <TitleRow $vc={visualConfig}>
          {visualConfig.title_icon ? (
            <TitleIcon $vc={visualConfig} className={visualConfig.title_icon} />
          ) : null}
          <TitleEl $vc={visualConfig}>{getSafeText(visualConfig.title)}</TitleEl>
        </TitleRow>
      ) : null}
      <GridWrapper $vc={visualConfig} className={gridClass}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={sanitizedColumnDefs}
          pinnedBottomRowData={pinnedBottomRowData}
          defaultColDef={{
            headerClass: 'aggrid-header',
            headerStyle: {
              background: visualConfig.header_bg ?? '#f4f6fa',
              color: visualConfig.header_color ?? '#333',
              fontWeight: visualConfig.header_font_weight ?? 600,
            },
            resizable: true,
            sortable: true,
            filter: true,
          }}
          sortingOrder={['desc', 'asc', null]}
          onGridReady={params => {
            if (defaultSortModel) {
              const anyApi = params.api as any;
              if (typeof anyApi.applyColumnState === 'function') {
                anyApi.applyColumnState({ state: defaultSortModel });
              } else if (typeof (params.api as any).setSortModel === 'function') {
                (params.api as any).setSortModel(defaultSortModel);
              }
            }
            if (configuredRowHeight) {
              const anyApi = params.api as any;
              if (typeof anyApi.setGridOption === 'function') {
                anyApi.setGridOption('rowHeight', configuredRowHeight);
                params.api.resetRowHeights();
              }
            }
          }}
          domLayout="normal"
        />
      </GridWrapper>
      {visualConfig.label ? (
        <LabelEl $vc={visualConfig} className="aggrid-label">
          {getSafeText(visualConfig.label)}
        </LabelEl>
      ) : null}
      {actions.length > 0 ? (
        <ActionRow>
          {actions.map((action: string, idx: number) => (
            <ActionBtn key={action} $vc={visualConfig} title={actionsTooltips[idx] ?? ''}>
              <i className={`fa-solid ${actionsIcons[idx] ?? ''}`}></i>
            </ActionBtn>
          ))}
        </ActionRow>
      ) : null}
    </StyledCard>
  );
};

export default AgGridWidget;













