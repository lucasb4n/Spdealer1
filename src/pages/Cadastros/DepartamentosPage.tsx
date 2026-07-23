import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faPlus,
  faSearch,
  faPencil,
  faTrash,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { AgGridTable } from 'components/AgGridTable/AgGridTable';
import { API_BASE_URL } from 'services/apiConfig';
import { Departamento } from 'shared/components/Cadastros/DepartamentoTypes';
import DepartamentosForm from 'shared/components/Cadastros/DepartamentosForm';

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
  min-width: 300px;

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
  max-width: 800px;
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

// ============= COMPONENTE =============
const DepartamentosPage: React.FC = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 0,
    size: 50,
    totalPages: 0,
  });

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modo, setModo] = useState<'localizar' | 'editar' | 'incluir'>('localizar');
  const [formData, setFormData] = useState<Partial<Departamento>>({});

  // ============= CARREGAR DADOS =============
  const carregarDepartamentos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '50',
      });

      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE_URL}/v1/departamentos?${params}`);
      const data = await response.json();

      if (data.success) {
        setDepartamentos(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('[DepartamentosPage] Erro ao carregar departamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    if (modo === 'localizar') {
      carregarDepartamentos();
    }
  }, [carregarDepartamentos, modo]);

  // ============= HANDLERS =============
  const handleNovo = () => {
    setFormData({
      filial_dep: '001',
      codigo_dep: 0,
      descr_dep: '',
      ger_dep: '',
      sigla_dep: '',
      conta_dep: '',
      contacli_dep: '',
      contafor_dep: '',
      codbco_dep: '',
    });
    setModo('incluir');
    setShowModal(true);
  };

  const handleEditar = (departamento: Departamento) => {
    setFormData(departamento);
    setModo('editar');
    setShowModal(true);
  };

  const handleExcluir = async (departamento: Departamento) => {
    if (!window.confirm(`Excluir departamento "${departamento.descr_dep}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/departamentos/${departamento.filial_dep}/${departamento.codigo_dep}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        alert('Departamento excluído com sucesso!');
        carregarDepartamentos();
      } else {
        alert('Erro ao excluir departamento');
      }
    } catch (error) {
      console.error('[DepartamentosPage] Erro ao excluir:', error);
      alert('Erro ao excluir departamento');
    }
  };

  const handleGravar = async () => {
    try {
      const url = modo === 'incluir'
        ? `${API_BASE_URL}/v1/departamentos`
        : `${API_BASE_URL}/v1/departamentos/${formData.filial_dep}/${formData.codigo_dep}`;

      const method = modo === 'incluir' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Departamento ${modo === 'incluir' ? 'criado' : 'atualizado'} com sucesso!`);
        setShowModal(false);
        setModo('localizar');
        carregarDepartamentos();
      } else {
        alert(data.error || 'Erro ao gravar');
      }
    } catch (error) {
      console.error('[DepartamentosPage] Erro ao gravar:', error);
      alert('Erro ao gravar departamento');
    }
  };

  const handleCancelar = () => {
    setShowModal(false);
    setModo('localizar');
    setFormData({});
  };

  const handleBuscar = () => {
    setCurrentPage(0);
    carregarDepartamentos();
  };

  const handleLimparFiltros = () => {
    setSearch('');
    setCurrentPage(0);
  };

  const handleFormChange = (campo: keyof Departamento, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  // ============= COLUNAS AG-GRID =============
  const columnDefs = [
    {
      field: 'filial_dep',
      headerName: 'Filial',
      width: 80,
      sortable: true,
      filter: true,
    },
    {
      field: 'codigo_dep',
      headerName: 'Código',
      width: 100,
      sortable: true,
      filter: true,
    },
    {
      field: 'descr_dep',
      headerName: 'Descrição',
      width: 300,
      sortable: true,
      filter: true,
    },
    {
      field: 'ger_dep',
      headerName: 'Gerente',
      width: 200,
      sortable: true,
      filter: true,
    },
    {
      field: 'sigla_dep',
      headerName: 'Sigla',
      width: 80,
      sortable: true,
    },
    {
      field: 'conta_dep',
      headerName: 'Conta',
      width: 120,
      sortable: true,
    },
    {
      field: 'codbco_dep',
      headerName: 'Banco',
      width: 80,
      sortable: true,
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
          <FontAwesomeIcon icon={faBuilding} color="#2563eb" />
          Cadastro de Departamentos/Centro de Custos
        </Title>
        <ButtonPrimary onClick={handleNovo}>
          <FontAwesomeIcon icon={faPlus} />
          Novo Departamento
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
          rowData={departamentos}
          columnDefs={columnDefs}
          loading={loading}
          pagination={true}
          paginationPageSize={50}
        />

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', fontSize: '14px' }}>
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
        </div>
      </GridContainer>

      {/* MODAL DE EDIÇÃO/INCLUSÃO */}
      {showModal && (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && handleCancelar()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {modo === 'editar' ? '✏️ Editar Departamento' : '➕ Novo Departamento'}
              </ModalTitle>
              <CloseButton onClick={handleCancelar}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <DepartamentosForm
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

export default DepartamentosPage;













