import React, { useState } from 'react';
import styled from 'styled-components';
import { Input } from '../Input/Input';
import { Modal } from '../Modal/Modal';
import { DataTable } from '../DataTable/DataTable';

const LookupInputWrapper = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333333;
  font-size: 0.95rem;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
`;

const StyledLookupInput = styled(Input)`
  flex-grow: 1;
  margin-bottom: 0;
`;

const IconButton = styled.button`
  background-color: #3f51b5;
  color: white;
  border: none;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  padding: 10px 15px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-left: -1px;

  &:hover {
    background-color: #303f9f;
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #888888;
  font-size: 1rem;
  cursor: pointer;
  margin-left: 5px;
  transition: color 0.2s ease;

  &:hover {
    color: #F44336;
  }
`;

const ModalSearchInput = styled(Input)`
  margin-bottom: 20px;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 15px;
  gap: 10px;
  color: #333333;

  button {
    background-color: #f0f0f0;
    color: #333333;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #e0e0e0;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

interface LookupInputProps<T> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (item: T) => void;
  onClear: () => void;
  modalTitle: string;
  searchPlaceholder?: string;
  lookupData: T[];
  lookupColumns: { key: keyof T; header: string }[];
}

export const LookupInput = <T extends { id?: any }>(
  {
    label,
    value,
    onValueChange,
    onSelect,
    onClear,
    modalTitle,
    searchPlaceholder = 'Buscar...',
    lookupData,
    lookupColumns,
  }: LookupInputProps<T>
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredData = lookupData.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsModalOpen(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <LookupInputWrapper>
      {label && <Label>{label}</Label>}
      <InputGroup>
        <StyledLookupInput
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={label}
          readOnly
        />
        <IconButton onClick={() => setIsModalOpen(true)} type="button">
          🔍
        </IconButton>
        {value && (
          <ClearButton onClick={onClear} type="button">
            ✖
          </ClearButton>
        )}
      </InputGroup>

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={modalTitle}>
        <ModalSearchInput
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DataTable
          columns={lookupColumns}
          data={paginatedData}
          onRowClick={handleSelect}
        />
        <Pagination>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            Anterior
          </button>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Próxima
          </button>
        </Pagination>
      </Modal>
    </LookupInputWrapper>
  );
};













