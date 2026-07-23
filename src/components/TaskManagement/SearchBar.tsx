// src/components/TaskManagement/SearchBar.tsx
import React from 'react';
import styled from 'styled-components';

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  min-width: 250px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
  }
`;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Buscar...' }) => {
  return (
    <SearchInput
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};

export default SearchBar;













