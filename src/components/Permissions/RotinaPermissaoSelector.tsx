import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Switch } from '../Switch/Switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface RotinaPermissaoItem {
  id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  permitida: boolean;
}

interface RotinaPermissaoResponse {
  usuarioId: number;
  nomeUsuario: string;
  grupoId: number | null;
  nomeGrupo: string | null;
  admin: boolean;
  diretoria: boolean;
  financeiro: boolean;
  vendas: boolean;
  compras: boolean;
  estoque: boolean;
  rotinas: RotinaPermissaoItem[];
}

interface RotinaPermissaoSelectorProps {
  usuarioId: number;
  onPermissionChange?: (codigo: string, permitida: boolean) => void;
  readOnly?: boolean;
  className?: string;
}

const Container = styled.div`
  margin-top: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserInfo = styled.div`
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 6px;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 300px;
  font-size: 13px;
  background: #fff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const Grid = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #f9fafb;
`;

const GroupContainer = styled.div`
  margin-bottom: 20px;
`;

const GroupHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
`;

const ItemContainer = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  margin-left: 12px;
`;

const ItemCodigo = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
`;

const ItemDescricao = styled.div`
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6b7280;
  gap: 8px;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #ef4444;
  gap: 8px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-size: 14px;
`;

const typeLabels: Record<string, string> = {
  M: 'Menus',
  R: 'Relatórios',
  O: 'Operações'
};

const typeColors: Record<string, string> = {
  M: '#3b82f6',
  R: '#8b5cf6',
  O: '#10b981'
};

export const RotinaPermissaoSelector: React.FC<RotinaPermissaoSelectorProps> = ({
  usuarioId,
  onPermissionChange,
  readOnly = false,
  className
}) => {
  const [data, setData] = useState<RotinaPermissaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPermissoes = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/rotinas/permissao/${usuarioId}`, {
        credentials: 'include',
        signal
      });
      if (!response.ok) {
        const txt = await response.text().catch(() => null);
        throw new Error(txt || `Erro ${response.status} ao carregar permissões`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        setError((err as Error).message || 'Erro ao carregar permissões');
      }
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    const controller = new AbortController();
    loadPermissoes(controller.signal);
    return () => controller.abort();
  }, [loadPermissoes]);

  const filteredRotinas = useMemo(() => {
    if (!data?.rotinas) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data.rotinas;
    return data.rotinas.filter(rotina =>
      rotina.codigo.toLowerCase().includes(term) ||
      rotina.descricao.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const rotinasByCategory = useMemo(() => {
    return filteredRotinas.reduce((acc, rotina) => {
      const category = typeLabels[rotina.tipo || ''] || 'Outros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(rotina);
      return acc;
    }, {} as Record<string, RotinaPermissaoItem[]>);
  }, [filteredRotinas]);

  const handleToggle = (rotina: RotinaPermissaoItem) => {
    if (readOnly) return;
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rotinas: prev.rotinas.map(r =>
          r.codigo === rotina.codigo ? { ...r, permitida: !r.permitida } : r
        )
      };
    });
    onPermissionChange?.(rotina.codigo, !rotina.permitida);
  };

  if (loading) {
    return (
      <Container className={className}>
        <LoadingContainer>
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Carregando permissões...</span>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className={className}>
        <ErrorContainer>
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </ErrorContainer>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button onClick={() => loadPermissoes()}>Recarregar</button>
        </div>
      </Container>
    );
  }

  return (
    <Container className={className}>
      <Header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Title>Rotinas de Permissão</Title>
          {data && (
            <UserInfo>
              {data.nomeUsuario} ({data.nomeGrupo || 'Sem grupo'})
              {data.admin && ' • ADMIN'}
              {data.financeiro && ' • FINANCEIRO'}
              {data.diretoria && ' • DIRETORIA'}
            </UserInfo>
          )}
        </div>
        <SearchInput
          placeholder="Buscar rotina..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Header>

      <Grid>
        {Object.keys(rotinasByCategory).length === 0 && (
          <EmptyMessage>Nenhuma rotina encontrada.</EmptyMessage>
        )}
        {Object.entries(rotinasByCategory).map(([category, rotinas]) => (
          <GroupContainer key={category}>
            <GroupHeader>
              {category}
              <span style={{ marginLeft: 8, color: '#9ca3af' }}>
                ({rotinas.length})
              </span>
            </GroupHeader>
            {rotinas.map(rotina => (
              <ItemContainer key={rotina.codigo}>
                <Switch
                  label=""
                  checked={rotina.permitida}
                  onChange={() => handleToggle(rotina)}
                  disabled={readOnly}
                />
                <ItemInfo>
                  <ItemCodigo style={{ color: typeColors[rotina.tipo] || '#1f2937' }}>
                    {rotina.codigo}
                  </ItemCodigo>
                  <ItemDescricao>{rotina.descricao}</ItemDescricao>
                </ItemInfo>
              </ItemContainer>
            ))}
          </GroupContainer>
        ))}
      </Grid>
    </Container>
  );
};













