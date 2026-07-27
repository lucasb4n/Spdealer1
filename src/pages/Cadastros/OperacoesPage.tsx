import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faPlus,
  faSearch,
  faPencil,
  faTrash,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { AgGridTable } from 'components/AgGridTable/AgGridTable';
import { API_BASE_URL } from 'services/apiConfig';
import OperacoesForm from 'shared/components/Cadastros/OperacoesForm';
import { Operacao } from 'shared/components/Cadastros/OperacaoTypes';

// ============= TIPOS =============
interface PaginationInfo {
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

// ============= ESTILOS =============
const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
`;

const ButtonPrimary = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ButtonSecondary = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #4b5563;
  }
`;

const FilterSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 250px;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 120px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const GridContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const PaginationInfo = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 14px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(90deg, #0056b3, #0066cc);
  color: white;
  border-radius: 12px 12px 0 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

const StatusBadge = styled.span<{ ativo: boolean }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.ativo ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.ativo ? '#166534' : '#dc2626'};
`;

// ============= COMPONENTE =============
const OperacoesPage: React.FC = () => {
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 0,
    size: 50,
    totalPages: 0,
  });

  const [search, setSearch] = useState('');
  const [ativoFilter, setAtivoFilter] = useState<string>('');

  const [modo, setModo] = useState<'localizar' | 'editar' | 'incluir'>('localizar');
  const [formData, setFormData] = useState<Partial<Operacao>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // ============= CARREGAR DADOS =============
  const carregarOperacoes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '50',
      });

      if (search) params.append('search', search);
      if (ativoFilter) params.append('ativo', ativoFilter);

      const response = await fetch(`${API_BASE_URL}/operacoes?${params}`);
      const data = await response.json();

      if (data.success) {
        setOperacoes(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('[OperacoesPage] Erro ao carregar operações:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, ativoFilter]);

  useEffect(() => {
    if (modo === 'localizar') {
      carregarOperacoes();
    }
  }, [carregarOperacoes, modo]);

  // ============= HANDLERS =============
  const handleNovo = () => {
    setFormData({
      codigo_ope: 0,
      descr_ope: '',
      ativo_ope: 'S',
      cfosub_ope: 0,
      icms_ope: 0,
      piscofins_ope: 'N',
      sinal_ope: '+',
      valor_ope: 'C',
    });
    setModo('incluir');
    setShowModal(true);
  };

  const handleEditar = (operacao: Operacao) => {
    setFormData(operacao);
    setModo('editar');
    setShowModal(true);
  };

  const handleExcluir = async (operacao: Operacao) => {
    if (!window.confirm(`Excluir operação "${operacao.descr_ope}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/operacoes/${operacao.codigo_ope}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Operação excluída com sucesso!');
        carregarOperacoes();
      } else {
        alert('Erro ao excluir operação');
      }
    } catch (error) {
      console.error('[OperacoesPage] Erro ao excluir:', error);
      alert('Erro ao excluir operação');
    }
  };

  const handleGravar = async () => {
    try {
      const url = modo === 'incluir'
        ? `${API_BASE_URL}/operacoes`
        : `${API_BASE_URL}/operacoes/${formData.codigo_ope}`;

      const method = modo === 'incluir' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Operação ${modo === 'incluir' ? 'criada' : 'atualizada'} com sucesso!`);
        setShowModal(false);
        setModo('localizar');
        carregarOperacoes();
      } else {
        alert(data.error || 'Erro ao gravar');
      }
    } catch (error) {
      console.error('[OperacoesPage] Erro ao gravar:', error);
      alert('Erro ao gravar operação');
    }
  };

  const handleCancelar = () => {
    setShowModal(false);
    setModo('localizar');
    setFormData({});
  };

  const handleBuscar = () => {
    setCurrentPage(0);
    carregarOperacoes();
  };

  const handleLimparFiltros = () => {
    setSearch('');
    setAtivoFilter('');
    setCurrentPage(0);
  };

  const handleFormChange = (campo: keyof Operacao, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // ============= COLUNAS AG-GRID =============
  const columnDefs = [
    {
      field: 'codigo_ope',
      headerName: 'Código',
      width: 100,
      pinned: 'left',
      sortable: true,
      filter: true,
    },
    {
      field: 'descr_ope',
      headerName: 'Descrição',
      width: 350,
      sortable: true,
      filter: true,
    },
    {
      field: 'ativo_ope',
      headerName: 'Status',
      width: 100,
      cellRenderer: (params: any) => (
        <StatusBadge ativo={params.value === 'S'}>
          {params.value === 'S' ? 'Ativo' : 'Inativo'}
        </StatusBadge>
      ),
      filter: true,
    },
    {
      field: 'cfosub_ope',
      headerName: 'CFOP',
      width: 100,
      sortable: true,
      filter: true,
    },
    {
      field: 'icms_ope',
      headerName: '% ICMS',
      width: 100,
      valueFormatter: (params: any) => params.value?.toFixed(3) || '0,000',
      sortable: true,
    },
    {
      field: 'piscofins_ope',
      headerName: 'PIS/COFINS',
      width: 110,
      cellRenderer: (params: any) => (
        <span style={{ color: params.value === 'S' ? '#16a34a' : '#6b7280' }}>
          {params.value === 'S' ? 'Sim' : 'Não'}
        </span>
      ),
    },
    {
      field: 'sinal_ope',
      headerName: 'Sinal',
      width: 80,
      cellRenderer: (params: any) => params.value,
    },
    {
      field: 'valor_ope',
      headerName: 'Valorização',
      width: 120,
      cellRenderer: (params: any) => {
        const labels: Record<string, string> = {
          P: 'Preço Público',
          G: 'Preço Garantia',
          C: 'Custo Médio',
          R: 'Custo Reposição',
          M: 'Preço Médio',
        };
        return labels[params.value] || params.value;
      },
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 100,
      pinned: 'right',
      sortable: false,
      cellRenderer: (params: any) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%' }}>
          <ActionButton
            onClick={() => handleEditar(params.data)}
            title="Editar"
          >
            <FontAwesomeIcon icon={faPencil} color="#2563eb" />
          </ActionButton>
          <ActionButton
            onClick={() => handleExcluir(params.data)}
            title="Excluir"
          >
            <FontAwesomeIcon icon={faTrash} color="#dc2626" />
          </ActionButton>
        </div>
      ),
    },
  ];

  // ============= RENDER =============
  return (
    <Container>
      {/* HEADER */}
      <Header>
        <Title>
          <FontAwesomeIcon icon={faTag} color="#2563eb" />
          Cadastro de Operações
        </Title>
        <ButtonPrimary onClick={handleNovo}>
          <FontAwesomeIcon icon={faPlus} />
          Nova Operação
        </ButtonPrimary>
      </Header>

      {/* FILTROS */}
      <FilterSection>
        <FilterRow>
          <FilterGroup>
            <FilterLabel>Buscar</FilterLabel>
            <SearchInput
              type="text"
              placeholder="Código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Status</FilterLabel>
            <Select
              value={ativoFilter}
              onChange={(e) => setAtivoFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="S">Ativos</option>
              <option value="N">Inativos</option>
            </Select>
          </FilterGroup>

          <FilterGroup style={{ alignSelf: 'flex-end' }}>
            <ButtonPrimary onClick={handleBuscar}>
              <FontAwesomeIcon icon={faSearch} />
              Buscar
            </ButtonPrimary>
          </FilterGroup>

          <FilterGroup style={{ alignSelf: 'flex-end' }}>
            <ButtonSecondary onClick={handleLimparFiltros}>
              <FontAwesomeIcon icon={faTimes} />
              Limpar
            </ButtonSecondary>
          </FilterGroup>
        </FilterRow>
      </FilterSection>

      {/* GRID */}
      <GridContainer>
        <AgGridTable
          rowData={operacoes}
          columnDefs={columnDefs}
          loading={loading}
          pagination={true}
          paginationPageSize={50}
        />

        <PaginationInfo>
          <span>
            Total: {pagination.total} registros | Página {pagination.page + 1} de {pagination.totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ButtonSecondary
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={pagination.page === 0}
            >
              Anterior
            </ButtonSecondary>
            <ButtonSecondary
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={pagination.page >= pagination.totalPages - 1}
            >
              Próxima
            </ButtonSecondary>
          </div>
        </PaginationInfo>
      </GridContainer>

      {/* MODAL DE EDIÇÃO/INCLUSÃO */}
      {showModal && (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && handleCancelar()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {modo === 'editar' ? '✏️ Editar Operação' : '➕ Nova Operação'}
              </ModalTitle>
              <CloseButton onClick={handleCancelar}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <OperacoesForm
                data={formData}
                onChange={handleFormChange}
                mode={modo === 'incluir' ? 'create' : 'edit'}
              />
            </ModalBody>

            <ModalFooter>
              <ButtonSecondary onClick={handleCancelar}>
                <FontAwesomeIcon icon={faTimes} />
                Cancelar
              </ButtonSecondary>
              <ButtonPrimary onClick={handleGravar}>
                <FontAwesomeIcon icon={faCheck} />
                Gravar
              </ButtonPrimary>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default OperacoesPage;













