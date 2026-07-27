import React, { useState, useEffect } from 'react';
/* eslint-disable @typescript-eslint/no-unused-vars */
import styled from 'styled-components';
import ListForm from 'components/Forms/ListForm';
import DevLogButton from 'components/Dev/DevLogButton';
import DynamicFormBuilder from 'components/Form/DynamicFormBuilder';
import DynamicAgGridTable from 'components/Table/DynamicAgGridTable';
import EntityFormModal from 'components/Modal/EntityFormModal';
import SearchFilterBar, { FilterCriteria } from 'components/SearchFilterBar/SearchFilterBar';
import TableSelector from 'components/TableSelector/TableSelector';
import DictionaryFormService, { FormConfig } from 'services/DictionaryFormService';
import type { FormData } from 'components/Form/DynamicFormBuilder';

const HostContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  padding: 12px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color, #e9ecef);
`;

const Title = styled.h2`
  margin: 0;
  color: var(--text-color-dark, #2c3e50);
  font-size: 1.5rem;
  font-weight: 600;
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Tabs = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--border-color, #e9ecef);
  background-color: var(--bg-light, #f8f9fa);
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  border: none;
  background: ${props => props.$active ? 'var(--color-primary, #007bff)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--text-color, #495057)'};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? 'var(--color-primary, #007bff)' : 'var(--bg-light, #e9ecef)'};
  }
`;

const TabContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid var(--border-color, #e9ecef);
`;

const GridSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  background: white;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid var(--border-color, #e9ecef);
  overflow: auto;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-color-muted, #6c757d);
`;

const ErrorMessage = styled.div`
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid var(--color-danger, #dc3545);
  border-radius: 4px;
  padding: 16px;
  color: var(--color-danger, #dc3545);
  margin: 16px;
`;

const SuccessMessage = styled.div`
  background-color: rgba(40, 167, 69, 0.1);
  border: 1px solid var(--color-success, #28a745);
  border-radius: 4px;
  padding: 16px;
  color: var(--color-success, #28a745);
  margin: 16px;
`;

// Props para FormBuilderHost
export interface FormBuilderHostProps {
  initialConfig?: Record<string, any> | null;
  formId?: string;
  formName?: string;
  /**
   * Nome da tabela para carregar FormConfig dinamicamente
   * Ex: "masfab", "clientes", "fornecedores"
   */
  tableName?: string;
}

/**
 * FormBuilderHost - Host para FormBuilder com suporte a:
 * 1. ListForm (original)
 * 2. Config JSON (original)
 * 3. Dictionary-Driven CRUD (novo)
 */
export const FormBuilderHost: React.FC<FormBuilderHostProps> = ({
  initialConfig,
  formId = 'form_exemplo',
  formName = 'Formulário Dinâmico',
  tableName = 'masfab', // Padrão: masfab
}) => {
  // Estado para tabs
  type TabMode = 'legacy' | 'dictionary-crud';
  const [activeTab, setActiveTab] = useState<TabMode>('dictionary-crud');

  // Estado para seleção de tabela (Fase 5.7.4)
  const [selectedTable, setSelectedTable] = useState(tableName || 'masfab');

  // Estado para dictionary-driven CRUD
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gridRefreshTrigger, setGridRefreshTrigger] = useState(0);

  // Estado para modal de edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEntity, setSelectedEntity] = useState<FormData | null>(null);

  // Estado para filtros avançados (Fase 5.7.3)
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar FormConfig quando selectedTable muda
  useEffect(() => {
    if (!selectedTable) return;

    const loadFormConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        const config = await DictionaryFormService.getFormConfig(selectedTable);
        setFormConfig(config);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar configuração';
        setError(errorMsg);
        console.error('Erro ao carregar FormConfig:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFormConfig();
  }, [selectedTable]);

  // Handler: Submit do formulário
  const handleFormSubmit = async (data: Record<string, any>) => {
    try {
      if (!formConfig) throw new Error('Configuração não carregada');

      // Chamar API para gravar
      await DictionaryFormService.createRecord(formConfig.tableName, data);

      setSuccessMessage(`Registro em ${formConfig.tableLabel} gravado com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 5000);

      // Recarregar grid
      setGridRefreshTrigger(prev => prev + 1);

      // Limpar formulário
      setFormConfig(config => config ? { ...config } : null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao gravar registro';
      setError(errorMsg);
      console.error('Erro ao gravar registro:', err);
    }
  };

  // Handler: Editar linha (double-click na grid)
  const handleEditRow = (rowData: any) => {
    console.log('Edit row:', rowData);
    setModalMode('edit');
    setSelectedEntity(rowData);
    setIsModalOpen(true);
  };

  // Handler: Deletar linha
  const handleDeleteRow = (rowData: any) => {
    console.log('Delete row:', rowData);
    setGridRefreshTrigger(prev => prev + 1);
  };

  // Handler: Fechar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntity(null);
  };

  // Handler: Salvar via modal (edição)
  const handleSaveModal = async (formData: FormData) => {
    try {
      if (!formConfig) throw new Error('Configuração não carregada');

      const primaryKeyField = formConfig.primaryKeyField || 'id';
      const id = selectedEntity?.[primaryKeyField];

      if (!id) throw new Error('ID não encontrado');

      // Chamar API para atualizar
      await DictionaryFormService.updateRecord(formConfig.tableName, primaryKeyField, id, formData);

      setSuccessMessage(`Registro atualizado com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 5000);

      // Recarregar grid
      setGridRefreshTrigger(prev => prev + 1);

      // Fechar modal
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao atualizar registro:', err);
      throw err;
    }
  };

  // Handlers para filtros (Fase 5.7.3)
  const handleFilterChange = (newFilters: FilterCriteria[]) => {
    setFilters(newFilters);
    // Trigger refresh da grid com novos filtros
    setGridRefreshTrigger(prev => prev + 1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    // Trigger refresh da grid com novo termo de busca
    setGridRefreshTrigger(prev => prev + 1);
  };

  // Handler: Mudar tabela (Fase 5.7.4)
  const handleTableChange = (newTableName: string) => {
    if (newTableName !== selectedTable) {
      setSelectedTable(newTableName);
      // Limpar filtros ao trocar de tabela
      setFilters([]);
      setSearchTerm('');
      setGridRefreshTrigger(0);
    }
  };

  const showConfig = initialConfig && Object.keys(initialConfig).length > 0;

  return (
    <HostContainer>
      <Header>
        <Title>{formName}</Title>
        {/* <DevLogButton /> Removido para evitar overlay duplicado */}
      </Header>

      {/* Tabs para mudar entre modos */}
      <Tabs>
        <Tab
          $active={activeTab === 'dictionary-crud'}
          onClick={() => setActiveTab('dictionary-crud')}
        >
          📋 CRUD Dinâmico ({tableName})
        </Tab>
        <Tab
          $active={activeTab === 'legacy'}
          onClick={() => setActiveTab('legacy')}
        >
          🔧 Modo Legado
        </Tab>
      </Tabs>

      <Content>
        {/* TAB 1: Dictionary-Driven CRUD (NOVO) */}
        {activeTab === 'dictionary-crud' && (
          <TabContent>
            {/* Table Selector (Fase 5.7.4) */}
            {!loading && (
              <div style={{ padding: '16px', background: 'white', borderRadius: '4px', marginBottom: '12px' }}>
                <TableSelector
                  selectedTable={selectedTable}
                  onTableChange={handleTableChange}
                />
              </div>
            )}

            {loading && (
              <LoadingSpinner>
                Carregando configuração de {selectedTable}...
              </LoadingSpinner>
            )}

            {error && (
              <ErrorMessage>
                <strong>Erro:</strong> {error}
              </ErrorMessage>
            )}

            {successMessage && (
              <SuccessMessage>
                <strong>Sucesso:</strong> {successMessage}
              </SuccessMessage>
            )}

            {formConfig && !loading && (
              <>
                {/* Seção: Formulário */}
                <FormSection>
                  <h3>{formConfig.tableLabel} - Novo Registro</h3>
                  {formConfig.description && <p>{formConfig.description}</p>}
                  
                  <DynamicFormBuilder
                    fields={formConfig.formFields}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                      setSuccessMessage(null);
                      setError(null);
                    }}
                    submitLabel="💾 Gravar"
                    cancelLabel="❌ Cancelar"
                  />
                </FormSection>

                {/* Seção: Filtros Avançados (Fase 5.7.3) */}
                <SearchFilterBar
                  tableName={formConfig.tableName}
                  fields={formConfig.formFields}
                  onFilterChange={handleFilterChange}
                  onSearchChange={handleSearchChange}
                />

                {/* Seção: Grid de Listagem */}
                <GridSection>
                  <DynamicAgGridTable
                    tableName={formConfig.tableName}
                    onEditRow={handleEditRow}
                    onDeleteRow={handleDeleteRow}
                    refreshTrigger={gridRefreshTrigger}
                    pageSize={10}
                    filters={filters}
                    searchTerm={searchTerm}
                  />
                </GridSection>
              </>
            )}
          </TabContent>
        )}

        {/* TAB 2: Modo Legado (ORIGINAL) */}
        {activeTab === 'legacy' && (
          <TabContent>
            {showConfig ? (
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {JSON.stringify(initialConfig, null, 2)}
              </pre>
            ) : (
              <ListForm formId={formId} formName={formName} />
            )}
          </TabContent>
        )}
      </Content>

      {/* Modal de Edição */}
      {isModalOpen && formConfig && (
        <EntityFormModal
          tableName={formConfig.tableName}
          mode={modalMode}
          entity={selectedEntity}
          onClose={handleCloseModal}
          onSave={handleSaveModal}
        />
      )}
    </HostContainer>
  );
};

export default FormBuilderHost;















