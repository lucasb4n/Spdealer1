/**
 * src/components/Forms/FormRenderer.tsx
 * Renderizador de Campos Dinâmicos de Formulários
 * SPDealer - 25 de Outubro de 2025
 */

import React from 'react';
import styled from 'styled-components';
import { FormField } from 'forms';
import DynamicField from './DynamicField';

// Props para FormRenderer
export interface FormRendererProps {
  formId: string;
  fields: FormField[];
  data: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  mode: 'create' | 'edit' | 'view';
  errors?: Record<string, string>;
  theme?: any;
}

// ============================================================================
// Styled Components
// ============================================================================

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;

  &:not(:first-child) {
    border-top: 1px solid var(--border-color, #e9ecef);
    padding-top: 16px;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 8px 0;
  color: var(--text-color-dark, #2c3e50);
  font-size: 1rem;
  font-weight: 600;
`;

const FormGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$columns || 2}, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color-dark, #2c3e50);

  span {
    color: #dc3545;
    margin-left: 2px;
  }
`;

const HelpText = styled.small`
  color: #666;
  font-size: 0.8rem;
  margin-top: 2px;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 4px;
  padding: 4px 8px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 3px;
`;

// ============================================================================
// Component
// ============================================================================

const FormRenderer: React.FC<FormRendererProps> = ({
  formId,
  fields,
  data,
  onChange,
  mode,
  errors = {},
  theme,
}) => {
  // ============================================================================
  // Field Filtering
  // ============================================================================

  const getVisibleFields = (): FormField[] => {
    return fields
      .filter((field) => {
        switch (mode) {
          case 'create':
            return field.visivel_insercao;
          case 'edit':
            return field.visivel_edicao;
          case 'view':
            return field.visivel_listagem;
          default:
            return true;
        }
      })
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  };

  const getFieldReadOnly = (field: FormField): boolean => {
    if (mode === 'view') return true;
    if (field.somente_leitura) return true;
    if (mode === 'create') return !field.visivel_insercao;
    if (mode === 'edit') return !field.visivel_edicao;
    return false;
  };

  // ============================================================================
  // Group Fields by Section
  // ============================================================================

  const groupFieldsBySection = (visibleFields: FormField[]) => {
    const sections: { [key: string]: FormField[] } = {};

    visibleFields.forEach((field) => {
      const section = field.tabela_banco || 'Informações Gerais';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(field);
    });

    return sections;
  };

  // ============================================================================
  // Render
  // ============================================================================

  const visibleFields = getVisibleFields();
  const sections = groupFieldsBySection(visibleFields);

  if (visibleFields.length === 0) {
    return (
      <FormContainer>
        <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
          Nenhum campo disponível para este formulário
        </div>
      </FormContainer>
    );
  }

  return (
    <FormContainer onSubmit={(e) => e.preventDefault()}>
      {Object.entries(sections).map(([sectionTitle, sectionFields]) => (
        <FormSection key={sectionTitle}>
          {sectionTitle !== 'Informações Gerais' && (
            <SectionTitle>{sectionTitle}</SectionTitle>
          )}

          <FormGrid $columns={2}>
            {sectionFields.map((field) => (
              <FormGroup key={field.id}>
                <Label>
                  {field.label}
                  {field.requerido && <span>*</span>}
                </Label>

                <DynamicField
                  field={field}
                  value={data[field.nome] || ''}
                  onChange={onChange}
                  error={errors[field.nome]}
                  disabled={getFieldReadOnly(field)}
                  readOnly={getFieldReadOnly(field)}
                  theme={theme}
                />

                <HelpText></HelpText>

                {errors[field.nome] && (
                  <ErrorMessage>{errors[field.nome]}</ErrorMessage>
                )}
              </FormGroup>
            ))}
          </FormGrid>
        </FormSection>
      ))}
    </FormContainer>
  );
};

export default FormRenderer;













