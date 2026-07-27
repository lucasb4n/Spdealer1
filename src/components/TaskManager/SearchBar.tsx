import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faClock, faTag } from '@fortawesome/free-solid-svg-icons';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const SearchBarContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 20px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 0 12px;
  transition: all 0.3s ease-in-out;

  &:focus-within {
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  &:hover {
    border-color: #adb5bd;
  }
`;

const SearchIcon = styled(FontAwesomeIcon)`
  color: #6c757d;
  margin-right: 8px;
  font-size: 14px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  padding: 10px 8px;
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  outline: none;
  background-color: transparent;

  &::placeholder {
    color: #adb5bd;
  }

  &:focus {
    outline: none;
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease-in-out;
  font-size: 14px;

  &:hover {
    color: #212529;
  }
`;

const SuggestionsDropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  max-height: 400px;
  overflow-y: auto;
  display: ${(p) => (p.$isOpen ? 'block' : 'none')};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;

    &:hover {
      background: #555;
    }
  }
`;

const SuggestionCategory = styled.div`
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
`;

const SuggestionItem = styled.button<{ $isHighlighted?: boolean }>`
  width: 100%;
  padding: 10px 16px;
  border: none;
  background-color: ${(p) => (p.$isHighlighted ? '#e7f1ff' : '#ffffff')};
  color: #212529;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease-in-out;
  border-left: 3px solid ${(p) => (p.$isHighlighted ? '#0d6efd' : 'transparent')};

  &:hover {
    background-color: #f8f9fa;
    border-left-color: #0d6efd;
  }

  &:active {
    background-color: #e7f1ff;
  }
`;

const SuggestionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
`;

const SuggestionContent = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const SuggestionTitle = styled.span`
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SuggestionMeta = styled.span`
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyMessage = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: #6c757d;
  font-style: italic;
`;

const PriorityBadge = styled.span<{ $priority?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
  background-color: ${(p) => {
    switch (p.$priority?.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return '#dc3545';
      case 'MEDIUM':
        return '#ffc107';
      case 'LOW':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }};
`;

const ModuleBadge = styled.span<{ $module?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: #ffffff;
  flex-shrink: 0;
  background-color: ${(p) => {
    switch (p.$module?.toLowerCase()) {
      case 'clientes':
        return '#007bff';
      case 'fornecedores':
        return '#6f42c1';
      case 'receber':
        return '#28a745';
      case 'pagar':
        return '#dc3545';
      case 'caixa':
        return '#ffc107';
      case 'relatorios':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  }};
`;

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResult {
  id: number;
  task_id: string;
  title: string;
  description?: string;
  priority_key?: string;
  module_key?: string;
  current_stage_id?: number;
  created_at?: string;
  type: 'ticket' | 'task';
}

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
  debounceDelay?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SearchBar: React.FC<SearchBarProps> = ({
  onResultSelect,
  placeholder = 'Buscar por ticket, task, título, módulo...',
  debounceDelay = 300,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // API CALL - SEARCH
  // =========================================================================

  const performSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/tickets/search?q=${encodeURIComponent(query)}&type=global`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[SearchBar] API Response:', data);

      if (data.success && Array.isArray(data.results)) {
        setSuggestions(data.results);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('[SearchBar] Erro na busca:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleInputChange = (value: string) => {
    setSearchQuery(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, debounceDelay);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelectResult = (result: SearchResult) => {
    console.log('[SearchBar] Ticket selecionado:', result);
    setSearchQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onResultSelect(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectResult(suggestions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  // =========================================================================
  // EFFECTS
  // =========================================================================

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // =========================================================================
  // RENDER - GROUP SUGGESTIONS
  // =========================================================================

  const ticketSuggestions = suggestions.filter((s) => s.type === 'ticket');
  const taskSuggestions = suggestions.filter((s) => s.type === 'task');

  return (
    <SearchBarContainer ref={containerRef}>
      <SearchInputWrapper>
        <SearchIcon icon={faSearch} />
        <SearchInput
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        {searchQuery && (
          <ClearButton onClick={handleClear} title="Limpar busca">
            <FontAwesomeIcon icon={faTimes} />
          </ClearButton>
        )}
      </SearchInputWrapper>

      <SuggestionsDropdown $isOpen={isOpen}>
        {isLoading && (
          <EmptyMessage>
            <FontAwesomeIcon icon={faSearch} style={{ marginRight: '6px' }} />
            Buscando...
          </EmptyMessage>
        )}

        {!isLoading && suggestions.length === 0 && searchQuery.length >= 2 && (
          <EmptyMessage>
            Nenhum resultado encontrado para "{searchQuery}"
          </EmptyMessage>
        )}

        {!isLoading && ticketSuggestions.length > 0 && (
          <>
            <SuggestionCategory>
              <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px' }} />
              Tickets ({ticketSuggestions.length})
            </SuggestionCategory>
            {ticketSuggestions.map((result, idx) => (
              <SuggestionItem
                key={`ticket-${result.id}`}
                $isHighlighted={
                  highlightedIndex === idx ||
                  highlightedIndex ===
                    ticketSuggestions.findIndex((s) => s.id === result.id)
                }
                onClick={() => handleSelectResult(result)}
                title={result.title}
              >
                <SuggestionIcon>
                  {result.priority_key && (
                    <PriorityBadge $priority={result.priority_key}>
                      {result.priority_key.charAt(0).toUpperCase()}
                    </PriorityBadge>
                  )}
                </SuggestionIcon>

                <SuggestionContent>
                  <SuggestionTitle>{result.task_id}</SuggestionTitle>
                  <SuggestionMeta>{result.title}</SuggestionMeta>
                </SuggestionContent>

                {result.module_key && (
                  <ModuleBadge $module={result.module_key}>
                    {result.module_key}
                  </ModuleBadge>
                )}
              </SuggestionItem>
            ))}
          </>
        )}

        {!isLoading && taskSuggestions.length > 0 && (
          <>
            <SuggestionCategory>
              <FontAwesomeIcon icon={faTag} style={{ marginRight: '6px' }} />
              Tasks ({taskSuggestions.length})
            </SuggestionCategory>
            {taskSuggestions.map((result, idx) => (
              <SuggestionItem
                key={`task-${result.id}`}
                $isHighlighted={
                  highlightedIndex ===
                  ticketSuggestions.length +
                    taskSuggestions.findIndex((s) => s.id === result.id)
                }
                onClick={() => handleSelectResult(result)}
                title={result.title}
              >
                <SuggestionIcon>
                  {result.priority_key && (
                    <PriorityBadge $priority={result.priority_key}>
                      {result.priority_key.charAt(0).toUpperCase()}
                    </PriorityBadge>
                  )}
                </SuggestionIcon>

                <SuggestionContent>
                  <SuggestionTitle>{result.task_id}</SuggestionTitle>
                  <SuggestionMeta>{result.title}</SuggestionMeta>
                </SuggestionContent>

                {result.module_key && (
                  <ModuleBadge $module={result.module_key}>
                    {result.module_key}
                  </ModuleBadge>
                )}
              </SuggestionItem>
            ))}
          </>
        )}
      </SuggestionsDropdown>
    </SearchBarContainer>
  );
};

export default SearchBar;













