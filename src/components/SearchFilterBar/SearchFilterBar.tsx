import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FormFieldDef } from 'services/DictionaryFormService';

/**
 * SearchFilterBar Component
 * 
 * Sistema de filtros avançados com:
 * - Busca global por texto
 * - Múltiplos critérios de filtro
 * - Operadores: contains, equals, >, <, >=, <=, between, in
 * - Salvar/carregar filtros customizados
 * - Sincronização com AG-Grid
 * 
 * @props {string} tableName - Nome da tabela (ex: masfab)
 * @props {FormFieldDef[]} fields - Lista de campos para construir filtros
 * @props {(filters: FilterCriteria[]) => void} onFilterChange - Callback ao mudar filtros
 * @props {(search: string) => void} onSearchChange - Callback ao mudar busca global
 */

/**
 * Tipos
 */
export interface FilterCriteria {
  fieldName: string;
  operator: 'contains' | 'equals' | '>' | '<' | '>=' | '<=' | 'between' | 'in';
  value: string | number | (string | number)[];
  valueFrom?: string | number;
  valueTo?: string | number;
}

export interface SearchFilterBarProps {
  tableName: string;
  fields: FormFieldDef[];
  onFilterChange: (filters: FilterCriteria[]) => void;
  onSearchChange: (search: string) => void;
  onSaveFilter?: (filterName: string, filters: FilterCriteria[]) => void;
  onLoadFilter?: (filterId: string) => void;
}

/**
 * Styled Components
 */
const FilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #e0e0e0;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  background-color: ${props => {
    switch (props.variant) {
      case 'danger': return '#ef4444';
      case 'secondary': return '#6b7280';
      default: return '#2563eb';
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: end;
  flex-wrap: wrap;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #2563eb;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: end;
  flex-wrap: wrap;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  display: block;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const RangeInputs = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const SavedFiltersSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
`;

const BadgeButton = styled.button<{ active?: boolean }>`
  padding: 4px 12px;
  border: 1px solid ${props => props.active ? '#2563eb' : '#ccc'};
  background-color: ${props => props.active ? '#2563eb' : '#fff'};
  color: ${props => props.active ? 'white' : '#333'};
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #2563eb;
    background-color: ${props => props.active ? '#1d4ed8' : '#f0f7ff'};
  }
`;

const StatusMessage = styled.div<{ type?: 'success' | 'error' | 'info' }>`
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: ${props => {
    switch (props.type) {
      case 'error': return '#dc2626';
      case 'success': return '#16a34a';
      default: return '#2563eb';
    }
  }};
  background-color: ${props => {
    switch (props.type) {
      case 'error': return '#fee2e2';
      case 'success': return '#dcfce7';
      default: return '#dbeafe';
    }
  }};
`;

/**
 * Component
 */
const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  tableName,
  fields,
  onFilterChange,
  onSearchChange,
  onSaveFilter,
  onLoadFilter,
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [newFilterField, setNewFilterField] = useState(fields[0]?.field_name || '');
  const [newFilterOperator, setNewFilterOperator] = useState('contains');
  const [newFilterValue, setNewFilterValue] = useState('');
  const [newFilterValueFrom, setNewFilterValueFrom] = useState('');
  const [newFilterValueTo, setNewFilterValueTo] = useState('');
  const [savedFilters, setSavedFilters] = useState<{ id: string; name: string }[]>([]);
  const [filterName, setFilterName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loadedFilterId, setLoadedFilterId] = useState<string | null>(null);

  // Lifecycle: Carregar filtros salvos (simular do localStorage/backend)
  useEffect(() => {
    // Em produção, isso viria de um endpoint API
    const stored = localStorage.getItem(`filters_${tableName}`);
    if (stored) {
      try {
        setSavedFilters(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar filtros salvos:', e);
      }
    }
  }, [tableName]);

  // Lifecycle: Notificar mudanças de filtro
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Lifecycle: Notificar mudanças de busca
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearchChange]);

  /**
   * Handlers
   */
  const handleAddFilter = () => {
    if (!newFilterField || !newFilterValue) {
      showMessage('Preencha todos os campos', 'error');
      return;
    }

    // Validar valor conforme operador
    if (newFilterOperator === 'between' && (!newFilterValueFrom || !newFilterValueTo)) {
      showMessage('Para "entre", preencha ambos os valores', 'error');
      return;
    }

    const newFilter: FilterCriteria = {
      fieldName: newFilterField,
      operator: newFilterOperator as any,
      value: newFilterOperator === 'between' 
        ? newFilterValue 
        : (newFilterOperator === 'in' ? newFilterValue.split(',').map(v => v.trim()) : newFilterValue),
      valueFrom: newFilterOperator === 'between' ? newFilterValueFrom : undefined,
      valueTo: newFilterOperator === 'between' ? newFilterValueTo : undefined,
    };

    setFilters([...filters, newFilter]);
    resetFilterForm();
    showMessage('Filtro adicionado', 'success');
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
    showMessage('Filtro removido', 'info');
  };

  const handleClearAllFilters = () => {
    setFilters([]);
    setSearchTerm('');
    setLoadedFilterId(null);
    showMessage('Filtros limpos', 'info');
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      showMessage('Digite um nome para o filtro', 'error');
      return;
    }

    const id = `filter_${Date.now()}`;
    const newFilter = { id, name: filterName };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);

    // Armazenar em localStorage (em produção, seria um POST /api)
    localStorage.setItem(`filters_${tableName}`, JSON.stringify(updated));

    // Salvar conteúdo do filtro
    localStorage.setItem(`filter_content_${id}`, JSON.stringify({
      searchTerm,
      filters,
    }));

    onSaveFilter?.(filterName, filters);
    setFilterName('');
    showMessage(`Filtro "${filterName}" salvo com sucesso`, 'success');
  };

  const handleLoadFilter = (id: string) => {
    const content = localStorage.getItem(`filter_content_${id}`);
    if (!content) {
      showMessage('Erro ao carregar filtro', 'error');
      return;
    }

    try {
      const { searchTerm: savedSearch, filters: savedFilters } = JSON.parse(content);
      setSearchTerm(savedSearch);
      setFilters(savedFilters);
      setLoadedFilterId(id);
      showMessage('Filtro carregado', 'success');
      onLoadFilter?.(id);
    } catch (e) {
      showMessage('Erro ao desserializar filtro', 'error');
    }
  };

  const handleDeleteFilter = (id: string) => {
    setSavedFilters(savedFilters.filter(f => f.id !== id));
    localStorage.removeItem(`filter_content_${id}`);
    localStorage.setItem(`filters_${tableName}`, JSON.stringify(savedFilters.filter(f => f.id !== id)));
    if (loadedFilterId === id) setLoadedFilterId(null);
    showMessage('Filtro deletado', 'info');
  };

  const resetFilterForm = () => {
    setNewFilterField(fields[0]?.field_name || '');
    setNewFilterOperator('contains');
    setNewFilterValue('');
    setNewFilterValueFrom('');
    setNewFilterValueTo('');
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  /**
   * Render
   */
  return (
    <FilterContainer>
      {/* Busca Global */}
      <SearchRow>
        <SearchInput
          type="text"
          placeholder="🔍 Buscar em todos os campos..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Button variant="secondary" onClick={handleClearAllFilters}>
          Limpar Tudo
        </Button>
      </SearchRow>

      {/* Filtros Existentes */}
      {filters.length > 0 && (
        <div>
          {filters.map((filter, idx) => {
            const field = fields.find(f => f.field_name === filter.fieldName);
            const fieldLabel = field?.form_label || filter.fieldName;
            const displayValue =
              filter.operator === 'between'
                ? `${filter.valueFrom} até ${filter.valueTo}`
                : Array.isArray(filter.value)
                ? filter.value.join(', ')
                : filter.value;

            return (
              <FilterRow key={idx}>
                <strong>{fieldLabel}</strong>
                <span>{filter.operator}</span>
                <span>{displayValue}</span>
                <Button
                  variant="danger"
                  onClick={() => handleRemoveFilter(idx)}
                  style={{ marginLeft: 'auto', padding: '4px 12px' }}
                >
                  ✕ Remover
                </Button>
              </FilterRow>
            );
          })}
        </div>
      )}

      {/* Adicionar Novo Filtro */}
      <FilterRow>
        <FilterGroup>
          <div>
            <Label>Campo</Label>
            <Select
              value={newFilterField}
              onChange={e => setNewFilterField(e.target.value)}
            >
              {fields
                .filter(f => f.form_visible_edit !== false)
                .map(f => (
                  <option key={f.field_name} value={f.field_name}>
                    {f.form_label || f.field_name}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <Label>Operador</Label>
            <Select
              value={newFilterOperator}
              onChange={e => setNewFilterOperator(e.target.value)}
            >
              <option value="contains">Contém</option>
              <option value="equals">É igual a</option>
              <option value=">">Maior que</option>
              <option value="<">Menor que</option>
              <option value=">=">&gt;= Maior ou igual</option>
              <option value="<=">Menor ou igual</option>
              <option value="between">Entre</option>
              <option value="in">Em (separado por vírgula)</option>
            </Select>
          </div>

          {newFilterOperator === 'between' ? (
            <div>
              <Label>Valores</Label>
              <RangeInputs>
                <Input
                  type="text"
                  placeholder="De"
                  value={newFilterValueFrom}
                  onChange={e => setNewFilterValueFrom(e.target.value)}
                />
                <span>até</span>
                <Input
                  type="text"
                  placeholder="Até"
                  value={newFilterValueTo}
                  onChange={e => setNewFilterValueTo(e.target.value)}
                />
              </RangeInputs>
            </div>
          ) : (
            <div>
              <Label>Valor</Label>
              <Input
                type="text"
                placeholder="Digite o valor..."
                value={newFilterValue}
                onChange={e => setNewFilterValue(e.target.value)}
              />
            </div>
          )}
        </FilterGroup>

        <Button onClick={handleAddFilter}>+ Adicionar Filtro</Button>
      </FilterRow>

      {/* Salvar Filtros */}
      <FilterRow>
        <FilterGroup>
          <div>
            <Label>Nome do Filtro</Label>
            <Input
              type="text"
              placeholder="Ex: Ativos 2025"
              value={filterName}
              onChange={e => setFilterName(e.target.value)}
            />
          </div>
        </FilterGroup>
        <Button onClick={handleSaveFilter} variant="secondary">
          💾 Salvar Filtro
        </Button>
      </FilterRow>

      {/* Filtros Salvos */}
      {savedFilters.length > 0 && (
        <SavedFiltersSection>
          <Label style={{ marginBottom: 0 }}>Filtros Salvos:</Label>
          {savedFilters.map(sf => (
            <div key={sf.id} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <BadgeButton
                active={loadedFilterId === sf.id}
                onClick={() => handleLoadFilter(sf.id)}
              >
                📌 {sf.name}
              </BadgeButton>
              <Button
                variant="danger"
                onClick={() => handleDeleteFilter(sf.id)}
                style={{ padding: '4px 8px', fontSize: '11px' }}
              >
                ✕
              </Button>
            </div>
          ))}
        </SavedFiltersSection>
      )}

      {/* Status Message */}
      {message && <StatusMessage type={message.type}>{message.text}</StatusMessage>}
    </FilterContainer>
  );
};

export default SearchFilterBar;













