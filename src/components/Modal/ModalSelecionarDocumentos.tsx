import React, { useEffect, useState } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import styled from 'styled-components';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// ============================================================================
// TIPOS
// ============================================================================

interface DocumentoReceber {
  codigo_rec: number;
  documento_rec: string;
  parcela_rec: number;
  dtvenci_rec: string;
  vlr_rec: number;
  vlrmulta_rec: number;
  vlrjuros_rec: number;
  vlrtot_rec: number;
  vlrsal_rec: number;
  status_rec: string;
  filial_rec: string;
}

interface DocumentoPagar {
  codigo_pag: number;
  documento_pag: string;
  parcela_pag: number;
  dtvenci_pag: string;
  vlr_pag: number;
  vlrmulta_pag: number;
  vlrjuros_pag: number;
  vlrtot_pag: number;
  vlrsal_pag: number;
  status_pag: string;
  filial_pag: string;
}

type Documento = DocumentoReceber | DocumentoPagar;

interface ModalSelecionarDocumentosProps {
  isOpen: boolean;
  show?: boolean;
  tipo: 'RECEBER' | 'PAGAR';
  clienteFornecedorId?: string;
  clienteOuFornecedor?: string;
  valorMovimento: number;
  dataMovimento?: string;
  onConfirm: (documentos: Documento[], totalSelecionado: number) => void | Promise<void>;
  onCancel: () => void;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const StyledModal = styled(Modal)`
  .modal-content {
    background: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  }

  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1.5rem;
    border-radius: 8px 8px 0 0;

    .modal-title {
      font-weight: 600;
      font-size: 1.2rem;
    }

    .btn-close {
      filter: brightness(0) invert(1);
    }
  }

  .modal-body {
    padding: 2rem;
    max-height: 70vh;
    overflow-y: auto;

    @media (max-width: 768px) {
      padding: 1rem;
      max-height: 50vh;
    }
  }

  .modal-footer {
    background: #f0f0f0;
    border-top: 1px solid #e0e0e0;
    padding: 1.5rem;
    border-radius: 0 0 8px 8px;

    button {
      padding: 0.6rem 1.5rem;
      font-weight: 500;
    }
  }
`;

const HeaderInfo = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .label {
      font-size: 0.9rem;
      opacity: 0.9;
      font-weight: 500;
    }

    .value {
      font-size: 1.2rem;
      font-weight: 600;
    }

    &.tipo {
      .value {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        display: inline-block;
        width: fit-content;
      }
    }
  }
`;

const WarningBox = styled.div`
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: #856404;

  @media (max-width: 768px) {
    font-size: 0.85rem;
    padding: 0.8rem;
  }
`;

const TotalBox = styled.div<{ valid: boolean }>`
  background: ${props => props.valid ? '#d4edda' : '#f8d7da'};
  border: 2px solid ${props => props.valid ? '#28a745' : '#f5c6cb'};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 0.8rem;
  }

  .total-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .label {
      font-size: 0.85rem;
      color: ${props => props.valid ? '#155724' : '#721c24'};
      opacity: 0.8;
      font-weight: 500;
    }

    .value {
      font-size: 1.3rem;
      font-weight: 700;
      color: ${props => props.valid ? '#155724' : '#721c24'};
    }
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    color: ${props => props.valid ? '#28a745' : '#dc3545'};

    &::before {
      content: '${props => props.valid ? '✓' : '✗'}';
      font-size: 1.5rem;
    }
  }
`;

const GridContainer = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;

  .ag-theme-alpine {
    --ag-font-size: 0.9rem;
    --ag-header-background-color: #667eea;
    --ag-header-foreground-color: white;
    --ag-header-cell-text-alignment: center;
    --ag-cell-horizontal-padding: 12px;
    --ag-row-hover-color: #f0f4ff;
  }

  @media (max-width: 768px) {
    .ag-theme-alpine {
      --ag-font-size: 0.8rem;
      --ag-cell-horizontal-padding: 8px;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;

  .spinner {
    color: #667eea;
  }
`;

// ============================================================================
// FORMATADORES
// ============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ModalSelecionarDocumentos: React.FC<ModalSelecionarDocumentosProps> = ({
  show,
  tipo,
  clienteOuFornecedor,
  valorMovimento,
  dataMovimento,
  onConfirm,
  onCancel,
}) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentosSelecionados, setDocumentosSelecionados] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState<any>(null);
  // rowSelection state removed (not read anywhere)

  // ========================================================================
  // BUSCAR DOCUMENTOS
  // ========================================================================

  useEffect(() => {
    if (!show || !clienteOuFornecedor) return;

    const buscarDocumentos = async () => {
      setLoading(true);
      try {
        let url = '';
        if (tipo === 'RECEBER') {
          url = `/api/v1/receber/cliente/${clienteOuFornecedor}?status=P,A`;
        } else {
          url = `/api/v1/pagar/fornecedor/${clienteOuFornecedor}?status=P,A`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setDocumentos(data || []);

        // Limpar seleção anterior
        setDocumentosSelecionados([]);

      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        // toast.error('Erro ao buscar documentos');
        setDocumentos([]);
      } finally {
        setLoading(false);
      }
    };

    buscarDocumentos();
  }, [show, clienteOuFornecedor, tipo]);

  // ========================================================================
  // HANDLERS DE SELEÇÃO
  // ========================================================================

  const handleSelectionChanged = () => {
    if (!gridApi) return;

    const selectedRows = gridApi.getSelectedRows();
    setDocumentosSelecionados(selectedRows);
  };

  // ========================================================================
  // CÁLCULOS
  // ========================================================================

  const totalSelecionado = Math.round(documentosSelecionados.reduce((sum, doc) => {
    const campo = tipo === 'RECEBER' ? 'vlrtot_rec' : 'vlrtot_pag';
    return sum + (doc[campo as keyof Documento] as number || 0);
  }, 0) * 100) / 100;

  const valoresBatem = Math.abs(totalSelecionado - valorMovimento) < 0.01;
  const diferenca = Math.round((valorMovimento - totalSelecionado) * 100) / 100;

  // ========================================================================
  // DEFINIÇÃO DAS COLUNAS AG-GRID (RECEBER)
  // ========================================================================

  const colunasReceber: any[] = [
    {
      headerName: '',
      field: 'checkbox',
      width: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      sortable: false,
      filter: false,
      pinned: 'left',
    },
    {
      headerName: 'Documento',
      field: 'documento_rec',
      width: 150,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Parcela',
      field: 'parcela_rec',
      width: 100,
      sortable: true,
      filter: true,
      type: 'numericColumn',
    },
    {
      headerName: 'Vencimento',
      field: 'dtvenci_rec',
      width: 120,
      sortable: true,
      filter: true,
      valueFormatter: (params: any) => formatDate(params.value || ''),
    },
    {
      headerName: 'Valor',
      field: 'vlr_rec',
      width: 130,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right' },
    },
    {
      headerName: 'Multa',
      field: 'vlrmulta_rec',
      width: 120,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right' },
    },
    {
      headerName: 'Juros',
      field: 'vlrjuros_rec',
      width: 120,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right' },
    },
    {
      headerName: 'Total',
      field: 'vlrtot_rec',
      width: 130,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      pinned: 'right',
    },
  ];

  // ========================================================================
  // DEFINIÇÃO DAS COLUNAS AG-GRID (PAGAR)
  // ========================================================================

  const colunasPagar: any[] = [
    {
      headerName: '',
      field: 'checkbox',
      width: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      sortable: false,
      filter: false,
      pinned: 'left',
    },
    {
      headerName: 'Documento',
      field: 'documento_pag',
      width: 150,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Parcela',
      field: 'parcela_pag',
      width: 100,
      sortable: true,
      filter: true,
      type: 'numericColumn',
    },
    {
      headerName: 'Vencimento',
      field: 'dtvenci_pag',
      width: 120,
      sortable: true,
      filter: true,
      valueFormatter: (params: any) => formatDate(params.value),
    },
    {
      headerName: 'Valor',
      field: 'vlr_pag',
      width: 130,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right' },
    },
    {
      headerName: 'Multa',
      field: 'vlrmulta_pag',
      width: 120,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right' },
    },
    {
      headerName: 'Juros',
      field: 'vlrjuros_pag',
      width: 120,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right' },
    },
    {
      headerName: 'Total',
      field: 'vlrtot_pag',
      width: 130,
      sortable: true,
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      pinned: 'right',
    },
  ];

  const colunas: any[] = tipo === 'RECEBER' ? colunasReceber : colunasPagar;

  // ========================================================================
  // HANDLERS DE CONFIRMAÇÃO
  // ========================================================================

  const handleConfirmar = async () => {
    if (!valoresBatem) {
      // toast.error('Totais não conferem!');
      console.warn('Totais não conferem!');
      return;
    }

    if (documentosSelecionados.length === 0) {
      // toast.error('Selecione pelo menos um documento');
      console.warn('Selecione pelo menos um documento');
      return;
    }

    try {
      await onConfirm(documentosSelecionados, totalSelecionado);
      // toast.success('Documentos selecionados com sucesso!');
      console.log('Documentos selecionados com sucesso!');
    } catch (error) {
      console.error('Erro ao confirmar:', error);
      // toast.error('Erro ao confirmar seleção');
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <StyledModal show={show} onHide={onCancel} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          Selecionar Documentos a{' '}
          {tipo === 'RECEBER' ? 'RECEBER' : 'PAGAR'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* INFO HEADER */}
        <HeaderInfo>
          <div className="info-item tipo">
            <span className="label">Tipo de Movimento</span>
            <span className="value">
              {tipo === 'RECEBER' ? '💰 Crédito' : '💸 Débito'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Cliente/Fornecedor</span>
            <span className="value">{clienteOuFornecedor}</span>
          </div>
          <div className="info-item">
            <span className="label">Valor do Movimento</span>
            <span className="value">{formatCurrency(valorMovimento)}</span>
          </div>
          <div className="info-item">
            <span className="label">Data do Lançamento</span>
            <span className="value">{formatDate(dataMovimento || '')}</span>
          </div>
        </HeaderInfo>

        {/* WARNING */}
        <WarningBox>
          ⚠️ Selecione documentos que totalizem EXATAMENTE{' '}
          <strong>{formatCurrency(valorMovimento)}</strong>
        </WarningBox>

        {/* LOADING */}
        {loading ? (
          <LoadingContainer>
            <Spinner animation="border" className="spinner" />
            <span>Carregando documentos...</span>
          </LoadingContainer>
        ) : documentos.length === 0 ? (
          <LoadingContainer>
            <span>
              Nenhum documento{' '}
              {tipo === 'RECEBER' ? 'a receber' : 'a pagar'} encontrado
            </span>
          </LoadingContainer>
        ) : (
          <>
            {/* GRID */}
            <GridContainer>
              <AgGridReact
                columnDefs={colunas}
                rowData={documentos}
                rowSelection="multiple"
                suppressRowClickSelection={false}
                onSelectionChanged={handleSelectionChanged}
                onGridReady={(params) => setGridApi(params.api)}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[5, 10, 20, 50]}
                theme={"ag-theme-alpine" as any}
              />
            </GridContainer>

            {/* TOTAL */}
            <TotalBox valid={valoresBatem}>
              <div className="total-item">
                <span className="label">Total Selecionado</span>
                <span className="value">{formatCurrency(totalSelecionado)}</span>
              </div>
              <div className="total-item">
                <span className="label">Diferença</span>
                <span
                  className="value"
                  style={{
                    color: valoresBatem ? '#28a745' : '#dc3545',
                  }}
                >
                  {formatCurrency(Math.abs(diferenca))}
                </span>
              </div>
              <div className="status">
                {valoresBatem ? 'VALORES BATEM! ✓' : 'DIFERENÇA DETECTADA'}
              </div>
            </TotalBox>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirmar}
          disabled={!valoresBatem || documentosSelecionados.length === 0 || loading}
        >
          Confirmar Baixa ({documentosSelecionados.length})
        </Button>
      </Modal.Footer>
    </StyledModal>
  );
};

export default ModalSelecionarDocumentos;













