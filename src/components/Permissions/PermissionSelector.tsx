import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { MenuService } from 'services/MenuService';
import { CustomSwitch } from '../Common/CustomSwitch';
import type { MenuGroup, MenuItem as MenuItemType } from 'menu';

export interface UserPermission {
  programId: number;
  visivel: boolean;
  editar: boolean;
  excluir: boolean;
  visualizar: boolean;
}

interface ProgramOption {
  id: number;
  codigo: string;
  descricao: string;
  tipo?: string;
}

interface PermissionSelectorProps {
  value: UserPermission[];
  onChange: (selected: UserPermission[]) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

const Container = styled.div`
  margin-top: 24px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 100%;
  max-width: 280px;
  font-size: 13px;
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Grid = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 100px 100px 100px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const GroupRow = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  color: #334155;
  &:hover { background: #e2e8f0; }
`;

const RoutineRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 100px 100px 100px;
  padding: 10px 16px;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: background 0.2s;
  &:hover { background: #f8fafc; }
`;

const RoutineInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const RoutineName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
`;

const RoutineCode = styled.span`
  font-size: 11px;
  color: #64748b;
`;

const Column = styled.div`
  display: flex;
  justify-content: center;
`;

export const PermissionSelector: React.FC<PermissionSelectorProps> = ({
  value = [],
  onChange,
  label = 'Rotinas permitidas',
  helperText,
  disabled = false,
  className
}) => {
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await MenuService.getAllMenuGroups();
        setMenuGroups(data);
        // Expand first 3 groups by default
        const initExpand: Record<number, boolean> = {};
        data.slice(0, 3).forEach(g => initExpand[g.id] = true);
        setExpandedGroups(initExpand);
      } catch (err) {
        console.error('Erro ao carregar menus:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getPermission = (programId: number): UserPermission => {
    return value.find(p => String(p.programId) === String(programId)) || {
      programId,
      visivel: false,
      editar: false,
      excluir: false,
      visualizar: false
    };
  };

  const handleUpdatePermission = (programId: number, field: keyof UserPermission, val: boolean) => {
    if (disabled) return;
    const current = getPermission(programId);
    const updated = { ...current, [field]: val };
    
    // Se ligar Visível, ligar Visualizar por padrão
    if (field === 'visivel' && val) updated.visualizar = true;
    // Se ligar Editar ou Excluir, ligar Visualizar por padrão
    if ((field === 'editar' || field === 'excluir') && val) updated.visualizar = true;

    const newValue = [...value.filter(p => String(p.programId) !== String(programId))];
    
    // Agora SEMPRE adiciona o registro, mesmo que visivel/editar/etc sejam false,
    // para que o backend receba o estado 'false' explícito e possa bloquear o item do grupo.
    newValue.push(updated);
    
    onChange(newValue);
  };

  const renderItem = (item: MenuItemType, level: number = 0) => {
    const perm = getPermission(item.id);
    const hasChildren = item.filhos && item.filhos.length > 0;

    return (
      <React.Fragment key={item.id}>
        <RoutineRow style={{ paddingLeft: 16 + (level * 20) }}>
          <RoutineInfo>
            <RoutineName>{item.name}</RoutineName>
            <RoutineCode>{item.codigo || item.route}</RoutineCode>
          </RoutineInfo>
          
          <Column>
            <CustomSwitch size="small" checked={perm.visivel} onChange={(v) => handleUpdatePermission(item.id, 'visivel', v)} disabled={disabled} />
          </Column>
          <Column>
            <CustomSwitch size="small" checked={perm.visualizar} onChange={(v) => handleUpdatePermission(item.id, 'visualizar', v)} disabled={disabled} />
          </Column>
          <Column>
            <CustomSwitch size="small" checked={perm.editar} onChange={(v) => handleUpdatePermission(item.id, 'editar', v)} disabled={disabled} />
          </Column>
          <Column>
            <CustomSwitch size="small" checked={perm.excluir} onChange={(v) => handleUpdatePermission(item.id, 'excluir', v)} disabled={disabled} />
          </Column>
        </RoutineRow>
        {hasChildren && item.filhos?.map(child => renderItem(child, level + 1))}
      </React.Fragment>
    );
  };

  if (loading) return <div>Carregando estrutura de permissões...</div>;

  return (
    <Container className={className}>
      <Header>
        <Title>{label}</Title>
        <SearchInput 
          placeholder="Buscar rotina..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
        />
      </Header>
      
      {helperText && <div style={{ marginBottom: 16, fontSize: '13px', color: '#64748b' }}>{helperText}</div>}

      <Grid>
        <TableHeader>
          <div>Rotina / Funcionalidade</div>
          <Column>Visível</Column>
          <Column>Visualizar</Column>
          <Column>Editar</Column>
          <Column>Excluir</Column>
        </TableHeader>

        {menuGroups.map(group => (
          <div key={group.id}>
            <GroupRow onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}>
              <span style={{ marginRight: 8 }}>{expandedGroups[group.id] ? '▼' : '▶'}</span>
              {group.name}
            </GroupRow>
            {expandedGroups[group.id] && group.items?.map(item => renderItem(item))}
          </div>
        ))}
      </Grid>
    </Container>
  );
};













