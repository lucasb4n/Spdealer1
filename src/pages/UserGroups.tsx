import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSearch, faShieldAlt, faFilter } from '@fortawesome/free-solid-svg-icons';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { UserGroupForm } from 'components/Forms/UserGroupForm';
import { useFloatingWindows } from '../contexts/FloatingWindowsContext';
import { UserGroupFormDto } from 'components/Forms/UserGroupForm';

interface UserGroup {
  id: number;
  nome: string;
  descricao?: string;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  programas: Array<{ id: number; codigo: string; descricao: string }>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 300px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled(FontAwesomeIcon)`
  position: absolute;
  left: 12px;
  color: #6b7280;
  pointer-events: none;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  ${props => {
  switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: #fff;
          &:hover:not(:disabled) {
            background: #2563eb;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: #fff;
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
      default:
        return `
          background: #6b7280;
          color: #fff;
          &:hover:not(:disabled) {
            background: #4b5563;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
`;

const StatCard = styled.div`
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
`;

const FilterSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
`;

const GridContainer = styled.div`
  flex: 1;
  margin: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;

  .ag-theme-alpine {
    height: 100%;
    --ag-header-background-color: #f8fafc;
    --ag-header-foreground-color: #374151;
    --ag-border-color: #e5e7eb;
    --ag-row-hover-color: #f0f9ff;
  }
`;

const StatusBadge = styled.span<{ status: 'active' | 'inactive' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  ${props => props.status === 'active' ? `
    background: #dcfce7;
    color: #166534;
  ` : `
    background: #fee2e2;
    color: #991b1b;
  `}
`;

const ActionCell = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' }>`
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s ease;
  ${props => props.$variant === 'edit' ? `
    background: #3b82f6;
    color: #fff;
    &:hover {
      background: #2563eb;
    }
  ` : `
    background: #ef4444;
    color: #fff;
    &:hover {
      background: #dc2626;
    }
  `}
`;

function UserGroups() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'INATIVO'>('TODOS');
  const { createWindow } = useFloatingWindows();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users-groups', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setGroups(Array.isArray(data) ? data : []);
      } else {
        console.error('Erro ao carregar grupos de usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar grupos de usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (group?: UserGroup) => {
    createWindow(
      group ? 'Editar Grupo de Usuários' : 'Novo Grupo de Usuários',
      <UserGroupForm
        group={group ? {
          ...group,
          permissionProgramIds: group.programas ? group.programas.map(p => ({
            programId: p.id,
            visivel: true,
            visualizar: true,
            editar: true,
            excluir: true
          })) : []
        } : undefined}
        isEditing={Boolean(group)}
        onCancel={() => {}}
        onSave={async (formData: UserGroupFormDto) => {
          const method = formData.id ? 'PUT' : 'POST';
          const url = formData.id ? `/api/users-groups/${formData.id}` : '/api/users-groups';
          const response = await fetch(url, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: formData.nome,
              descricao: formData.descricao,
              status: formData.status,
              observacoes: formData.observacoes,
              permissionProgramIds: formData.permissionProgramIds.map(p => p.programId)
            })
          });
          if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.message || 'Não foi possível salvar o grupo');
          }
          await loadGroups();
          return Promise.resolve();
        }}
      />,
      {
        width: 1000,
        height: 700,
        icon: faShieldAlt
      }
    );
  };

  const handleDeleteGroup = async (group: UserGroup) => {
    if (!window.confirm(`Tem certeza que deseja excluir o grupo ${group.nome}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/users-groups/${group.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        await loadGroups();
      } else {
        alert('Não foi possível remover o grupo');
      }
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      alert('Não foi possível remover o grupo');
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = !searchTerm ||
      group.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.descricao && group.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'TODOS' ||
      (statusFilter === 'ATIVO' && group.status === 'ativo') ||
      (statusFilter === 'INATIVO' && group.status === 'inativo');
    return matchesSearch && matchesStatus;
  });

  const columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 90, sortable: true, filter: 'agNumberColumnFilter' },
    { field: 'nome', headerName: 'Nome', width: 220, sortable: true, filter: 'agTextColumnFilter' },
    { field: 'descricao', headerName: 'Descrição', width: 250, sortable: true, filter: 'agTextColumnFilter' },
    { field: 'status', headerName: 'Status', width: 130, sortable: true, filter: 'agTextColumnFilter',
      cellRenderer: (params: any) => (
        <StatusBadge status={params.value === 'ativo' ? 'active' : 'inactive'}>
          {params.value === 'ativo' ? 'Ativo' : 'Inativo'}
        </StatusBadge>
      )
    },
    { field: 'programCount', headerName: 'Rotinas', width: 120, sortable: true, filter: 'agNumberColumnFilter',
      valueGetter: (params: any) => params.data.programas?.length || 0
    },
    {
      headerName: 'Ações',
      field: 'actions',
      width: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <ActionCell>
          <ActionButton $variant="edit" onClick={() => openForm(params.data)}>
            <FontAwesomeIcon icon={faEdit} />
          </ActionButton>
          <ActionButton $variant="delete" onClick={() => handleDeleteGroup(params.data)}>
            <FontAwesomeIcon icon={faTrash} />
          </ActionButton>
        </ActionCell>
      )
    }
  ];

  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status === 'ativo').length;
  const inactiveGroups = groups.filter(g => g.status === 'inativo').length;

  return (
    <Container>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faShieldAlt} />
          Grupos de Usuários
        </Title>
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
          <Button $variant="primary" onClick={() => openForm()}>
            <FontAwesomeIcon icon={faPlus} />
            Novo Grupo
          </Button>
        </Controls>
      </Header>

      <StatsContainer>
        <StatCard>
          <StatLabel>Total de Grupos</StatLabel>
          <StatValue>{totalGroups}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Grupos Ativos</StatLabel>
          <StatValue>{activeGroups}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Grupos Inativos</StatLabel>
          <StatValue>{inactiveGroups}</StatValue>
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
            rowData={filteredGroups}
            columnDefs={columnDefs}
            defaultColDef={{
              sortable: true,
              filter: true,
              flex: 1
            }}
            onGridReady={(params: GridReadyEvent) => params.api.sizeColumnsToFit()}
            pagination
            paginationPageSize={50}
            suppressRowClickSelection
            rowSelection="single"
            loading={loading}
          />
        </div>
      </GridContainer>
    </Container>
  );
}

export default UserGroups;













