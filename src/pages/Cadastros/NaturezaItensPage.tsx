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
import { NaturezaItem } from 'shared/components/Cadastros/NaturezaItemTypes';
import NaturezaItensForm from 'shared/components/Cadastros/NaturezaItensForm';

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

const ReservedBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: #fee2e2;
  color: #dc2626;
`;

const NaturezaItensPage: React.FC = () => {
  const [naturezas, setNaturezas] = useState<NaturezaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 0,
    size: 50,
    totalPages: 0,
  });

  const [search, setSearch] = useState('');
  const [modo, setModo] = useState<'localizar' | 'editar' | 'incluir'>('localizar');
  const [formData, setFormData] = useState<Partial<NaturezaItem>>({});
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

      const response = await fetch(`${API_BASE_URL}/natureza-itens?${params}`);
      const data = await response.json();

      if (data.success) {
        setNaturezas(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('[NaturezaItensPage] Erro ao carregar:', error);
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
      natureza_nat: '',
      descricao_nat: '',
      ccusto_nat: 0,
    });
    setModo('incluir');
    setShowModal(true);
  };

  const handleEditar = (natureza: NaturezaItem) => {
    setFormData(natureza);
    setModo('editar');
    setShowModal(true);
  };

  const handleExcluir = async (natureza: NaturezaItem) => {
    if (['X', 'L', 'V', 'S'].includes(natureza.natureza_nat.toUpperCase())) {
      alert('Esta natureza é reservada para uso do sistema e não pode ser excluída.');
      return;
    }

    if (!window.confirm(`Excluir natureza "${natureza.descricao_nat}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/natureza-itens/${natureza.natureza_nat}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Natureza de item excluída com sucesso!');
        carregarDados();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir');
      }
    } catch (error) {
      console.error('[NaturezaItensPage] Erro ao excluir:', error);
      alert('Erro ao excluir');
    }
  };

  const handleGravar = async () => {
    try {
      const url = modo === 'incluir'
        ? `${API_BASE_URL}/natureza-itens`
        : `${API_BASE_URL}/natureza-itens/${formData.natureza_nat}`;

      const method = modo === 'incluir' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Natureza de item ${modo === 'incluir' ? 'criada' : 'atualizada'} com sucesso!`);
        setShowModal(false);
        setModo('localizar');
        carregarDados();
      } else {
        alert(data.error || 'Erro ao gravar');
      }
    } catch (error) {
      console.error('[NaturezaItensPage] Erro ao gravar:', error);
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

  const handleFormChange = (campo: keyof NaturezaItem, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const isReserved = (codigo: string) => ['X', 'L', 'V', 'S'].includes(codigo.toUpperCase());

  const columnDefs = [
    {
      field: 'natureza_nat',
      headerName: 'Código',
      width: 100,
      pinned: 'left',
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {params.value}
          {isReserved(params.value) && <ReservedBadge>Reservado</ReservedBadge>}
        </div>
      ),
    },
    {
      field: 'descricao_nat',
      headerName: 'Descrição',
      width: 350,
      sortable: true,
      filter: true,
    },
    {
      field: 'ccusto_nat',
      headerName: 'C.Custo',
      width: 100,
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
          <ActionButton 
            onClick={() => handleExcluir(params.data)} 
            title="Excluir"
            disabled={isReserved(params.data.natureza_nat)}
          >
            <FontAwesomeIcon 
              icon={faTrash} 
              color={isReserved(params.data.natureza_nat) ? '#d1d5db' : '#dc2626'} 
            />
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faTag} color="#2563eb" />
          Cadastro de Natureza de Itens
        </Title>
        <ButtonPrimary onClick={handleNovo}>
          <FontAwesomeIcon icon={faPlus} />
          Nova Natureza
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
          rowData={naturezas}
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
                {modo === 'editar' ? '✏️ Editar Natureza de Item' : '➕ Nova Natureza de Item'}
              </ModalTitle>
              <CloseButton onClick={handleCancelar}>
                <FontAwesomeIcon icon={faTimes} />
              </CloseButton>
            </ModalHeader>

            <ModalBody>
              <NaturezaItensForm
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

export default NaturezaItensPage;













