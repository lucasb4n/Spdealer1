import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTags,
  faPlus,
  faSearch,
  faPencil,
  faTrash,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { AgGridTable } from 'components/AgGridTable/AgGridTable';
import { API_BASE_URL } from 'services/apiConfig';
import { NivelPreco } from 'shared/components/Cadastros/NivelPrecoTypes';
import NiveisPrecoForm from 'shared/components/Cadastros/NiveisPrecoForm';

interface PaginationInfo {
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

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
  max-width: 600px;
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

const NiveisPrecoPage: React.FC = () => {
  const [niveis, setNiveis] = useState<NivelPreco[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 0,
    size: 50,
    totalPages: 0,
  });

  const [search, setSearch] = useState('');
  const [modo, setModo] = useState<'localizar' | 'editar' | 'incluir'>('localizar');
  const [formData, setFormData] = useState<Partial<NivelPreco>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: '50',
      });

      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE_URL}/niveis-preco?${params}`);
      const data = await response.json();

      if (data.success) {
        setNiveis(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('[NiveisPrecoPage] Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    if (modo === 'localizar') {
      carregarDados();
    }
  }, [carregarDados, modo]);

  const handleNovo = () => {
    setFormData({
      nivel_niv: 0,
      descr_niv: '',
      perc_niv: 0,
    });
    setModo('incluir');
    setShowModal(true);
  };

  const handleEditar = (nivel: NivelPreco) => {
    setFormData(nivel);
    setModo('editar');
    setShowModal(true);
  };

  const handleExcluir = async (nivel: NivelPreco) => {
    if (!window.confirm(`Excluir nível "${nivel.descr_niv}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/niveis-preco/${nivel.nivel_niv}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Nível de preço excluído com sucesso!');
        carregarDados();
      } else {
        alert('Erro ao excluir');
      }
    } catch (error) {
      console.error('[NiveisPrecoPage] Erro ao excluir:', error);
      alert('Erro ao excluir');
    }
  };

  const handleGravar = async () => {
    try {
      const url = modo === 'incluir'
        ? `${API_BASE_URL}/niveis-preco`
        : `${API_BASE_URL}/niveis-preco/${formData.nivel_niv}`;

      const method = modo === 'incluir' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Nível de preço ${modo === 'incluir' ? 'criado' : 'atualizado'} com sucesso!`);
        setShowModal(false);
        setModo('localizar');
        carregarDados();
      } else {
        alert(data.error || 'Erro ao gravar');
      }
    } catch (error) {
      console.error('[NiveisPrecoPage] Erro ao gravar:', error);
      alert('Erro ao gravar');
    }
  };

  const handleCancelar = () => {
    setShowModal(false);
    setModo('localizar');
    setFormData({});
  };

  const handleBuscar = () => {
    setCurrentPage(0);
    carregarDados();
  };

  const handleLimparFiltros = () => {
    setSearch('');
    setCurrentPage(0);
  };

  const handleFormChange = (campo: keyof NivelPreco, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const columnDefs = [
    {
      field: 'nivel_niv',
      headerName: 'Código',
      width: 100,
      pinned: 'left',
      sortable: true,
      filter: true,
    },
    {
      field: 'descr_niv',
      headerName: 'Descrição',
      width: 350,
      sortable: true,
      filter: true,
    },
    {
      field: 'perc_niv',
      headerName: 'Percentual',
      width: 120,
      valueFormatter: (params: any) => params.value?.toFixed(2) + '%' || '0.00%',
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
          <ActionButton onClick={() => handleEditar(params.data)} title="Editar">
            <FontAwesomeIcon icon={faPencil} color="#2563eb" />
          </ActionButton>
          <ActionButton onClick={() => handleExcluir(params.data)} title="Excluir">
            <FontAwesomeIcon icon={faTrash} color="#dc2626" />
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faTags} color="#2563eb" />
          Cadastro de Níveis de Preço
        </Title>
        <ButtonPrimary onClick={handleNovo}>
          <FontAwesomeIcon icon={faPlus} />
          Novo Nível
        </ButtonPrimary>
      </Header>

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

      <GridContainer>
        <AgGridTable
          rowData={niveis}
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

      {showModal && (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && handleCancelar()}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                {modo === 'editar' ? '✏️ Editar Nível de Preço' : '➕ Novo Nível de Preço'}
              </ModalTitle>
              <CloseButton onClick={handleCancelar}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <NiveisPrecoForm
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

export default NiveisPrecoPage;













