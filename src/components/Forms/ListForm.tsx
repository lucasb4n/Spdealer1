/**
 * src/components/Forms/ListForm.tsx
 * Componente para Listagem de Formulários Dinâmicos
 * SPDealer - 25 de Outubro de 2025
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Tipos de formulário não utilizados diretamente aqui — removidos para evitar warnings
import ModalForm from './ModalForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
/* eslint-disable react-hooks/exhaustive-deps */

// ============================================================================
// Styled Components
// ============================================================================

const ListFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  padding: 16px;
  background: var(--background-light, #f8f9fa);
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  margin: 0;
  color: var(--text-color-dark, #2c3e50);
  font-size: 1.5rem;
  font-weight: 600;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e9ecef);
  border-radius: 4px;
  font-size: 0.95rem;
  background: white;

  &:focus {
    outline: none;
    border-color: var(--primary-color, #007bff);
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  ${(p) => {
    switch (p.$variant) {
      case 'primary':
        return `
          background: var(--primary-color, #007bff);
          color: white;
          &:hover { background: #0056b3; }
          &:active { transform: scale(0.98); }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: var(--border-color, #e9ecef);
          color: var(--text-color-dark, #2c3e50);
          &:hover { background: #dee2e6; }
        `;
    }
  }};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GridContainer = styled.div`
  flex: 1;
  min-height: 0;
  background: white;
  border: 1px solid var(--border-color, #e9ecef);
  border-radius: 4px;
  overflow: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  thead {
    position: sticky;
    top: 0;
    background: var(--background-light, #f8f9fa);
    border-bottom: 2px solid var(--border-color, #e9ecef);
  }

  th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: var(--text-color-dark, #2c3e50);
  }

  td {
    padding: 12px;
    border-bottom: 1px solid var(--border-color, #e9ecef);
    color: #333;
  }

  tbody tr:hover {
    background: #f9f9f9;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #999;
  font-size: 0.95rem;
`;

// ============================================================================
// Component Props
// ============================================================================

export interface ListFormProps {
  formId: string;
  formName?: string;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
}

// ============================================================================
// ListForm Component
// ============================================================================

const ListForm: React.FC<ListFormProps> = ({ formId, formName = 'Formulário', onEdit, onDelete }) => {
  // Estados de definição de formulário não utilizados neste componente
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formFields, _setFormFields] = useState<any[]>([]);
  // Mark intentionally unused setter as referenced to avoid lint warning
  void _setFormFields;
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // ============================================================================
  // Effects
  // ============================================================================

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadFormDefinition();
    loadRecords();
  }, [formId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    filterRecords();
  }, [searchTerm, records]);

  // ============================================================================
  // API Calls
  // ============================================================================

  const loadFormDefinition = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamada real à API
      // const response = await fetch(`/api/forms/${formId}`);
      // const data = await response.json();
      // setFormDef(data);
      // setFormFields(data.fields || []);
      console.log(`[DEBUG] Loading form definition for: ${formId}`);
    } catch (error) {
      console.error('Erro ao carregar definição do formulário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      // TODO: Implementar chamada real à API
      // const response = await fetch(`/api/forms/${formId}/data`);
      // const data = await response.json();
      // setRecords(data.rows || []);
      console.log(`[DEBUG] Loading records for form: ${formId}`);
      setRecords([]);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const handleDeleteRecord = async (record: any) => {
    if (!window.confirm('Tem certeza que deseja deletar este registro?')) {
      return;
    }

    try {
      // TODO: Implementar chamada real à API
      // await fetch(`/api/forms/${formId}/data/${record.id}`, { method: 'DELETE' });
      setRecords(records.filter((r) => r.id !== record.id));
      onDelete?.(record);
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
    }
  };

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record);
    setModalMode('edit');
    setIsModalOpen(true);
    onEdit?.(record);
  };

  const handleNewRecord = () => {
    setSelectedRecord(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (data: any) => {
    try {
      if (modalMode === 'create') {
        // TODO: Implementar POST /api/forms/{formId}/data
        const newRecord = { id: Date.now(), ...data };
        setRecords([...records, newRecord]);
      } else {
        // TODO: Implementar PUT /api/forms/{formId}/data/{id}
        const updated = records.map((r) => (r.id === selectedRecord?.id ? { ...r, ...data } : r));
        setRecords(updated);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
    }
  };

  // ============================================================================
  // Filter & Search
  // ============================================================================

  const filterRecords = () => {
    if (!searchTerm) {
      setFilteredRecords(records);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = records.filter((record) =>
      Object.values(record).some(
        (value) =>
          value &&
          String(value).toLowerCase().includes(term)
      )
    );
    setFilteredRecords(filtered);
  };

  // ============================================================================
  // Column Definitions para AG Grid
  // ============================================================================

  const getColumnDefs = () => {
    const visibleFields = (formFields || []).filter((f) => f.visivel_listagem);
    return visibleFields;
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <ListFormContainer>
        <EmptyState>Carregando formulário...</EmptyState>
      </ListFormContainer>
    );
  }

  return (
    <ListFormContainer>
      {/* Header */}
      <HeaderSection>
        <Title>{formName}</Title>
        <SearchBar>
          <FontAwesomeIcon icon={faSearch} style={{ alignSelf: 'center', color: '#999' }} />
          <SearchInput
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        <ActionButton $variant="primary" onClick={handleNewRecord}>
          <FontAwesomeIcon icon={faPlus} />
          Incluir
        </ActionButton>
      </HeaderSection>

      {/* Grid */}
      <GridContainer>
        {filteredRecords.length === 0 ? (
          <EmptyState>
            <p>Nenhum registro encontrado</p>
            <ActionButton $variant="primary" onClick={handleNewRecord}>
              <FontAwesomeIcon icon={faPlus} />
              Criar novo
            </ActionButton>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                {getColumnDefs().map((field) => (
                  <th key={field.id}>{field.label}</th>
                ))}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  {getColumnDefs().map((field) => (
                    <td key={`${record.id}-${field.nome}`}>
                      {record[field.nome]}
                    </td>
                  ))}
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <ActionButton
                      $variant="secondary"
                      onClick={() => handleEditRecord(record)}
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </ActionButton>
                    <ActionButton
                      $variant="danger"
                      onClick={() => handleDeleteRecord(record)}
                      title="Deletar"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </GridContainer>

      {/* Modal Form */}
      <ModalForm
        isOpen={isModalOpen}
        formId={formId}
        mode={modalMode}
        recordData={selectedRecord}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
      />
    </ListFormContainer>
  );
};

export default ListForm;













