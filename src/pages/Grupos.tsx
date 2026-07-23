import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch, faLayerGroup, faFilter, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { GrupoForm } from 'components/Forms/GrupoForm';
import { useFloatingWindows } from '../contexts/FloatingWindowsContext';

interface Grupo {
  id: number;
  nome: string;
  descricao?: string;
  status: 'ativo' | 'inativo';
  permissoes: string[];
  icone?: string;
  ordem: number;
  ativo: boolean;
  dataCriacao?: string;
  usuariosCount?: number;
  observacoes?: string;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background-light, #F1F5F9);
  animation: ${fadeIn} 0.3s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: #FFFFFF;
  border-bottom: 1px solid var(--slate-200, #E2E8F0);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--slate-800, #1E293B);
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.01em;
  svg { color: var(--accent-600, #D97706); }
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 9px 14px 9px 38px;
  border: 1.5px solid var(--slate-300, #CBD5E1);
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  width: 280px;
  color: var(--slate-800, #1E293B);
  background: var(--slate-50, #F8FAFC);
  transition: border-color 200ms ease, box-shadow 200ms ease;

  &:focus {
    outline: none;
    border-color: var(--primary-600, #0D9488);
    box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
    background: #FFFFFF;
  }

  &::placeholder { color: var(--slate-400, #94A3B8); }
`;

const SearchIcon = styled(FontAwesomeIcon)`
  position: absolute;
  left: 12px;
  color: var(--slate-400, #94A3B8);
  pointer-events: none;
  font-size: 13px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 200ms ease;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: var(--accent-600, #D97706);
          color: #FFFFFF;
          &:hover:not(:disabled) {
            background: var(--accent-700, #B45309);
            box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25);
            transform: translateY(-1px);
          }
        `;
      case 'danger':
        return `
          background: var(--danger, #DC2626);
          color: #FFFFFF;
          &:hover:not(:disabled) { background: #B91C1C; }
        `;
      default:
        return `
          background: var(--slate-100, #F1F5F9);
          color: var(--slate-700, #334155);
          border: 1px solid var(--slate-300, #CBD5E1);
          &:hover:not(:disabled) { background: var(--slate-200, #E2E8F0); }
        `;
    }
  }}

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 28px;
  background: #FFFFFF;
  border-bottom: 1px solid var(--slate-200, #E2E8F0);
  font-size: 13px;
  color: var(--slate-500, #64748B);
  svg { font-size: 12px; }
`;

const FilterSelect = styled.select`
  padding: 7px 12px;
  border: 1.5px solid var(--slate-300, #CBD5E1);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  background: #FFFFFF;
  color: var(--slate-700, #334155);
  cursor: pointer;
  &:focus { outline: none; border-color: var(--primary-600, #0D9488); }
`;

const GridContainer = styled.div`
  flex: 1;
  margin: 16px 28px 28px;
  background: #FFFFFF;
  border-radius: var(--card-radius, 12px);
  box-shadow: var(--card-shadow);
  border: 1px solid var(--slate-200, #E2E8F0);
  overflow: hidden;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 28px;
  background: #FFFFFF;
  border-bottom: 1px solid var(--slate-200, #E2E8F0);
`;

const StatCard = styled.div`
  padding: 14px 18px;
  background: var(--slate-50, #F8FAFC);
  border-radius: 10px;
  border: 1px solid var(--slate-200, #E2E8F0);
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 140px;
  transition: all 200ms ease;
  &:hover {
    border-color: var(--accent-200, #FDE68A);
    background: var(--accent-50, #FFFBEB);
  }
`;

const StatIcon = styled.div<{ $bg?: string; $color?: string }>`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${props => props.$bg || 'var(--accent-100, #FEF3C7)'};
  color: ${props => props.$color || 'var(--accent-700, #B45309)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
`;

const StatInfo = styled.div``;

const StatLabel = styled.div`
  font-size: 11px;
  color: var(--slate-500, #64748B);
  margin-bottom: 2px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.04em;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: var(--slate-800, #1E293B);
  letter-spacing: -0.02em;
`;

const StatusBadge = styled.span<{ status: 'active' | 'inactive' }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  ${props => props.status === 'active' ? `
    background: var(--success-bg, #D1FAE5);
    color: var(--success, #059669);
  ` : `
    background: var(--danger-bg, #FEE2E2);
    color: var(--danger, #DC2626);
  `}
`;

const ActionCell = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' }>`
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 150ms ease;
  ${props => props.$variant === 'edit' ? `
    background: var(--accent-100, #FEF3C7);
    color: var(--accent-700, #B45309);
    &:hover { background: var(--accent-200, #FDE68A); }
  ` : `
    background: var(--danger-bg, #FEE2E2);
    color: var(--danger, #DC2626);
    &:hover { background: #FECACA; }
  `}
`;

function Grupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const { createWindow } = useFloatingWindows();

  useEffect(() => { loadGrupos(); }, []);

  const loadGrupos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users-groups', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setGrupos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewGrupo = () => {
    createWindow(
      'Novo Grupo',
      <GrupoForm onSave={handleSaveGrupo} onCancel={() => {}} isEditing={false} />,
      { width: 900, height: 600, icon: faPlus }
    );
  };

  const handleEditGrupo = (grupo: Grupo) => {
    const grupoCompatible = {
      ...grupo,
      status: grupo.status || (grupo.ativo ? 'ativo' : 'inativo') as 'ativo' | 'inativo',
      permissoes: grupo.permissoes || []
    };
    createWindow(
      'Editar Grupo',
      <GrupoForm grupo={grupoCompatible} onSave={handleSaveGrupo} onCancel={() => {}} isEditing={true} />,
      { width: 900, height: 600, icon: faEdit }
    );
  };

  const handleDeleteGrupo = async (grupo: Grupo) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo ${grupo.nome}?`)) {
      try {
        const response = await fetch(`/api/users-groups/${grupo.id}`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) loadGrupos();
        else alert('Erro ao excluir grupo');
      } catch (error) {
        alert('Erro ao excluir grupo');
      }
    }
  };

  const handleSaveGrupo = () => { loadGrupos(); };

  const filteredGrupos = grupos.filter(grupo => {
    const matchesSearch = !searchTerm ||
      grupo.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grupo.descricao && grupo.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'TODOS' ||
      (statusFilter === 'ATIVO' && grupo.ativo) ||
      (statusFilter === 'INATIVO' && !grupo.ativo);
    return matchesSearch && matchesStatus;
  });

  const columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 70, sortable: true, filter: 'agNumberColumnFilter' },
    { field: 'nome', headerName: 'Nome', width: 200, sortable: true, filter: 'agTextColumnFilter' },
    { field: 'descricao', headerName: 'Descrição', width: 250, sortable: true, filter: 'agTextColumnFilter' },
    { field: 'ordem', headerName: 'Ordem', width: 90, sortable: true, filter: 'agNumberColumnFilter' },
    { field: 'usuariosCount', headerName: 'Usuários', width: 100, sortable: true, filter: 'agNumberColumnFilter',
      valueFormatter: (params: any) => params.value || 0 },
    {
      field: 'ativo', headerName: 'Status', width: 100, sortable: true, filter: 'agTextColumnFilter',
      cellRenderer: (params: any) => (
        <StatusBadge status={params.value ? 'active' : 'inactive'}>
          {params.value ? 'Ativo' : 'Inativo'}
        </StatusBadge>
      )
    },
    {
      headerName: 'Ações', field: 'actions', width: 110, sortable: false, filter: false,
      cellRenderer: (params: any) => (
        <ActionCell>
          <ActionButton $variant="edit" onClick={() => handleEditGrupo(params.data)} title="Editar">
            <FontAwesomeIcon icon={faEdit} />
          </ActionButton>
          <ActionButton $variant="delete" onClick={() => handleDeleteGrupo(params.data)} title="Excluir">
            <FontAwesomeIcon icon={faTrash} />
          </ActionButton>
        </ActionCell>
      )
    }
  ];

  const onGridReady = (params: GridReadyEvent) => { params.api.sizeColumnsToFit(); };
  const totalGrupos = grupos.length;
  const gruposAtivos = grupos.filter(g => g.ativo).length;
  const gruposInativos = grupos.filter(g => !g.ativo).length;

  return (
    <Container>
      <Header>
        <Title><FontAwesomeIcon icon={faLayerGroup} /> Cadastro de Grupos</Title>
        <Controls>
          <SearchContainer>
            <SearchIcon icon={faSearch} />
            <SearchInput
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          <Button $variant="primary" onClick={handleNewGrupo}>
            <FontAwesomeIcon icon={faPlus} /> Novo Grupo
          </Button>
        </Controls>
      </Header>

      <StatsContainer>
        <StatCard>
          <StatIcon $bg="var(--accent-100)" $color="var(--accent-700)">
            <FontAwesomeIcon icon={faLayerGroup} />
          </StatIcon>
          <StatInfo>
            <StatLabel>Total</StatLabel>
            <StatValue>{totalGrupos}</StatValue>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon $bg="var(--success-bg)" $color="var(--success)">
            <FontAwesomeIcon icon={faCheckCircle} />
          </StatIcon>
          <StatInfo>
            <StatLabel>Ativos</StatLabel>
            <StatValue>{gruposAtivos}</StatValue>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon $bg="var(--danger-bg)" $color="var(--danger)">
            <FontAwesomeIcon icon={faTimesCircle} />
          </StatIcon>
          <StatInfo>
            <StatLabel>Inativos</StatLabel>
            <StatValue>{gruposInativos}</StatValue>
          </StatInfo>
        </StatCard>
      </StatsContainer>

      <FilterContainer>
        <FontAwesomeIcon icon={faFilter} />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'TODOS' | 'ATIVO' | 'INATIVO')}
        >
          <option value="TODOS">Todos os Status</option>
          <option value="ATIVO">Apenas Ativos</option>
          <option value="INATIVO">Apenas Inativos</option>
        </FilterSelect>
      </FilterContainer>

      <GridContainer>
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            rowData={filteredGrupos}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, flex: 1 }}
            onGridReady={onGridReady}
            pagination={true}
            paginationPageSize={50}
            suppressRowClickSelection={true}
            rowSelection="single"
            loading={loading}
          />
        </div>
      </GridContainer>
    </Container>
  );
}

export default Grupos;













