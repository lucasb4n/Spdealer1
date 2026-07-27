import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faSearch, faTimes, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label?: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
  font-family: inherit;
`;

const SelectedDisplay = styled.div<{ $isOpen: boolean; $hasSelection: boolean }>`
  padding: 8px 12px;
  background: #fff;
  border: 1px solid ${props => props.$isOpen ? '#3b82f6' : '#d1d5db'};
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 40px;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'};

  &:hover {
    border-color: ${props => props.$isOpen ? '#3b82f6' : '#9ca3af'};
  }

  .clear-icon:hover {
    color: #ef4444 !important;
  }
`;

const Placeholder = styled.span`
  color: #9ca3af;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SelectionText = styled.span`
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Badge = styled.span`
  background: #3b82f6;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 4px;
`;

const DropdownPortal = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  overflow: hidden;
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SearchContainer = styled.div`
  padding: 8px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  width: 100%;
  font-size: 13px;
  outline: none;
  color: #374151;

  &::placeholder {
    color: #9ca3af;
  }
`;

const OptionsList = styled.div`
  max-height: 250px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 10px;
  }
`;

const OptionItem = styled.div<{ $isSelected: boolean }>`
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${props => props.$isSelected ? '#1e40af' : '#374151'};
  background: ${props => props.$isSelected ? '#eff6ff' : 'transparent'};
  transition: all 0.15s ease;

  &:hover {
    background: ${props => props.$isSelected ? '#dbeafe' : '#f3f4f6'};
  }
`;

const CheckboxIcon = styled.div<{ $isSelected: boolean }>`
  color: ${props => props.$isSelected ? '#3b82f6' : '#d1d5db'};
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionButtons = styled.div`
  padding: 8px;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
`;

const ActionBtn = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  background: transparent;
  border: none;
  color: ${props => {
    if (props.$variant === 'danger') return '#ef4444';
    if (props.$variant === 'primary') return '#3b82f6';
    return '#6b7280';
  }};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: ${props => {
      if (props.$variant === 'danger') return 'rgba(239, 68, 68, 0.08)';
      if (props.$variant === 'primary') return 'rgba(59, 130, 246, 0.08)';
      return 'rgba(107, 114, 128, 0.08)';
    }};
  }
`;

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Selecione as opções...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const label = String(opt.label || '').toLowerCase();
    const value = String(opt.value || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();
    return label.includes(search) || value.includes(search);
  });

  const toggleOption = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const toggleAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return <Placeholder>{placeholder}</Placeholder>;
    if (selectedValues.length === 1) {
      const opt = options.find(o => o.value === selectedValues[0]);
      return <SelectionText>{opt ? opt.label : selectedValues[0]}</SelectionText>;
    }
    return (
      <SelectionText>
        {selectedValues.length} selecionados
        <Badge>{selectedValues.length}</Badge>
      </SelectionText>
    );
  };

  return (
    <DropdownContainer ref={containerRef}>
      <SelectedDisplay 
        $isOpen={isOpen} 
        $hasSelection={selectedValues.length > 0}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
          {getDisplayText()}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedValues.length > 0 && (
            <FontAwesomeIcon 
              icon={faTimes} 
              className="clear-icon"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              style={{ 
                fontSize: 14, 
                color: '#9ca3af',
                padding: '4px',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }} 
            />
          )}
          <FontAwesomeIcon icon={faChevronDown} style={{ 
            fontSize: 12, 
            color: '#6b7280',
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)'
          }} />
        </div>
      </SelectedDisplay>

      {isOpen && (
        <DropdownPortal>
          <SearchContainer>
            <FontAwesomeIcon icon={faSearch} style={{ color: '#9ca3af', fontSize: 13 }} />
            <SearchInput 
              autoFocus
              placeholder="Pesquisar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <FontAwesomeIcon 
                icon={faTimes} 
                className="cursor-pointer"
                style={{ color: '#9ca3af', cursor: 'pointer' }}
                onClick={() => setSearchTerm('')}
              />
            )}
          </SearchContainer>
          
          <OptionsList>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                Nenhuma opção encontrada
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <OptionItem 
                    key={opt.value} 
                    $isSelected={isSelected}
                    onClick={() => toggleOption(opt.value)}
                  >
                    <CheckboxIcon $isSelected={isSelected}>
                      <FontAwesomeIcon icon={isSelected ? faCheckSquare : faSquare} />
                    </CheckboxIcon>
                    {opt.label}
                  </OptionItem>
                );
              })
            )}
          </OptionsList>

          <ActionButtons>
            <div style={{ display: 'flex', gap: '4px' }}>
              <ActionBtn $variant="primary" onClick={toggleAll}>
                <FontAwesomeIcon icon={faCheckSquare} />
                {selectedValues.length === options.length ? 'Nenhum' : 'Todos'}
              </ActionBtn>
              <ActionBtn $variant="danger" onClick={clearAll}>
                <FontAwesomeIcon icon={faTimes} />
                Limpar
              </ActionBtn>
            </div>
            <ActionBtn onClick={() => setIsOpen(false)}>Fechar</ActionBtn>
          </ActionButtons>
        </DropdownPortal>
      )}
    </DropdownContainer>
  );
};

export default MultiSelectDropdown;













