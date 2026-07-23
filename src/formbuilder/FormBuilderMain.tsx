/**
 * FormBuilderMain.tsx
 * 
 * Formulário Principal do FormBuilder v2.0
 * 
 * Funcionalidades:
 * - Editor visual drag-and-drop
 * - Importação de formulários .tsx existentes
 * - Propriedades editáveis por campo
 * - Preview em tempo real
 * - Compilação e geração de código
 * - Versionamento e auditoria
 * 
 * Criado: 08 JAN 2026
 * Versão: 2.0
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ContextMenu } from './components/ContextMenu';
import DayPilotCalendarWrapper, { CalendarEvent } from './components/DayPilotCalendarWrapper';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface DictionaryTable {
  id: number;
  tableName?: string; // Backend retorna camelCase
  table_name?: string; // Compatibilidade com código antigo
  displayName?: string; // Backend retorna displayName
  table_label?: string; // Compatibilidade com código antigo
  description?: string;
  isProjectSpecific?: boolean;
}

// Interface para componentes disponíveis do banco (form_components)
interface FormComponent {
  component_type: string;
  component_name: string;
  component_icon: string;
  category: string;
  display_order: number;
}

// Interface para definição de uma aba individual
interface TabDefinition {
  id: string;
  label: string; // Label/título da aba (ex: "Dados Gerais", "Endereços")
  fieldIds: string[]; // IDs dos campos dentro desta aba
  icon?: string; // Ícone opcional (ex: "📋", "📍")
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  labelPosition?: 'top' | 'left' | 'bottom'; // Posição do label em relação ao campo
  labelPadding?: string; // Padding entre label e campo (ex: '8px')
  type: 'text' | 'select' | 'textarea' | 'checkbox' | 'container' | 'bevel' | 'tabs' | 'daypilot_calendar' | 'kanban' | 'card' | 'upload' | 'avisos' | 'image' | 'gallery' | 'text_long' | 'date' | 'time' | 'number' | 'email' | 'password' | 'button';
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: string;
  };
  options?: Array<{ value: string; label: string }>;
  gridColumn?: string; // Ex: "1 / 3" (span 2 columns)
  order: number;
  
  // Lista Dinâmica (is_lista)
  isDynamicList?: boolean; // Campo vem de lista dinâmica (is_lista = 1)
  referenceTable?: string; // Tabela de referência (campo 'table')
  isMultipleSelection?: boolean; // Seleção múltipla (is_checkbox = 1 AND is_lista = 1)
  
  // Localizar (search_visible)
  searchVisible?: boolean; // Campo aparece no grid de localização (search_visible = 1)
  
  // Máscara de Entrada (inputMask) - NOVO 11 JAN 2026
  inputMask?: 'none' | 'number' | 'email' | 'phone' | 'date' | 'cpf' | 'cnpj' | 'cnh' | 'rg' | 'titulo_eleitor'; // Tipo de máscara/validação
  
  // Configuração Visual (visual_config) - NOVO 11 JAN 2026
  visual_config?: Record<string, any>; // Configurações específicas de cada componente (viewType, theme, columns, etc)
  
  // Classes CSS importadas (reverse engineering)
  cssClassName?: string; // Ex: "form-group-horizontal"
  cssStyles?: Record<string, string>; // Estilos inline do HTML original (ex: {width: '40px'})
  
  // Propriedades de layout dentro do formulário
  width?: string; // Ex: '100%', '300px'
  height?: string; // Ex: 'auto', '80px'
  position?: { x: number; y: number }; // Posição absoluta (se layout livre)
  
  // Propriedades do Container/Fieldset (para agrupar campos)
  containerHeader?: string; // Título/Header do container (ex: "Dados Pessoais")
  childFields?: string[]; // IDs dos campos filhos agrupados
  containerStyle?: {
    border?: string; // Ex: '1px solid #dee2e6'
    background?: string; // Ex: '#f8f9fa'
    borderRadius?: string; // Ex: '8px'
    padding?: string; // Ex: '16px'
    margin?: string; // Ex: '16px 0'
  };
  
  // Propriedades do Tabs (para organizar campos em abas)
  tabs?: TabDefinition[]; // Array com definição de cada aba
  activeTab?: string; // ID da aba ativa (default: primeira aba)
  tabsOrientation?: 'horizontal' | 'vertical'; // Orientação das abas (default: horizontal)
  tabsStyle?: {
    borderColor?: string;
    activeColor?: string;
    backgroundColor?: string;
    padding?: string;
  };
  
  // Relacionamento com abas/containers
  parentId?: string; // ID do container/aba pai (se o campo está dentro de um)
}

interface FormDefinition {
  id?: number;
  formName: string;
  formTitle: string;
  tableName: string;
  description?: string;
  fields: FormField[];
  layout: {
    columns: number; // 1, 2, 3, ou 4 colunas
    gap: string; // Ex: "16px"
    responsive: boolean;
  };
  validation: {
    validateOnChange: boolean;
    validateOnBlur: boolean;
    showErrorSummary: boolean;
  };
  buttons: {
    submit: { label: string; visible: boolean };
    cancel: { label: string; visible: boolean };
    reset: { label: string; visible: boolean };
  };
  // CSS importado (reverse engineering)
  importedCSS?: string; // Conteúdo completo do CSS importado
  tabsContainerClass?: string; // Classe CSS do container das tabs (ex: "form-grid-empresa-2col")
}

type EditorMode = 'design' | 'preview' | 'code' | 'import';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background-primary, #f8f9fa);
  
  /* ✅ FIX CRÍTICO: Esconder checkbox da coluna Form no AG Grid */
  .no-checkbox-cell input[type="checkbox"],
  .no-checkbox-cell .ag-selection-checkbox,
  .no-checkbox-cell .ag-checkbox,
  .no-checkbox-cell .ag-checkbox-input,
  .no-checkbox-cell input {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    width: 0 !important;
    height: 0 !important;
  }
  
  /* ✅ PADRÃO SPDEALER: Botões btn-primary e btn-secondary */
  .btn-primary {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background-color: #0d6efd;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-primary:hover {
    background-color: #0b5ed7;
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    color: #212529;
    background-color: #6c757d;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-secondary:hover {
    background-color: #5c636a;
  }
  
  /* ✅ ANIMAÇÕES: Spinner e Progress Bar */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes progress-shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.8; }
    100% { opacity: 1; }
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary, #212529);
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant = 'secondary' }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: var(--primary-color, #0d6efd);
          color: white;
          &:hover { background: var(--primary-hover, #0b5ed7); }
        `;
      case 'danger':
        return `
          background: var(--danger-color, #dc3545);
          color: white;
          &:hover { background: var(--danger-hover, #bb2d3b); }
        `;
      default:
        return `
          background: var(--secondary-bg, #e9ecef);
          color: var(--text-primary, #212529);
          &:hover { background: var(--secondary-hover, #dee2e6); }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid var(--border-color, #dee2e6);
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: ${({ $active }) => $active ? 'white' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--primary-color, #0d6efd)' : 'var(--text-muted, #6c757d)'};
  border-bottom: 2px solid ${({ $active }) => $active ? 'var(--primary-color, #0d6efd)' : 'transparent'};
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: var(--primary-color, #0d6efd);
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.aside<{ $collapsed?: boolean }>`
  width: ${({ $collapsed }) => $collapsed ? '60px' : '300px'};
  background: white;
  border-right: 1px solid var(--border-color, #dee2e6);
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${({ $collapsed }) => $collapsed ? '8px' : '16px'};
  transition: width 0.3s ease-in-out, padding 0.3s ease-in-out;
  position: relative;
  
  /* Esconder textos quando colapsado */
  ${({ $collapsed }) => $collapsed && `
    .field-label,
    .section-title {
      display: none;
    }
  `}
`;

const WorkArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 24px;
`;

// PropertiesPanel removido - propriedades agora via modal (11 JAN 2026)

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #212529);
`;

const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldItem = styled.div<{ $isDragging?: boolean }>`
  padding: 12px;
  background: ${({ $isDragging }) => $isDragging ? 'var(--primary-bg-light, #cfe2ff)' : 'var(--background-secondary, #f8f9fa)'};
  border: 1px solid ${({ $isDragging }) => $isDragging ? 'var(--primary-color, #0d6efd)' : 'var(--border-color, #dee2e6)'};
  border-radius: 6px;
  cursor: ${({ $isDragging }) => $isDragging ? 'grabbing' : 'grab'};
  transition: all 0.2s;
  
  &:hover {
    background: var(--primary-bg-light, #e7f1ff);
    border-color: var(--primary-color, #0d6efd);
  }
`;

const FieldIcon = styled.span`
  margin-right: 8px;
`;

const FieldLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #212529);
`;

const Canvas = styled.div<{ $columns: number }>`
  background: white;
  border: 2px dashed var(--border-color, #dee2e6);
  border-radius: 8px;
  padding: 24px;
  min-height: 600px;
  height: 800px;
  resize: both;
  overflow: auto;
  position: relative;
  
  &:empty::before {
    content: '📋 Arraste campos aqui para posicionar livremente';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--text-muted, #6c757d);
    font-size: 16px;
    padding: 60px;
  }
`;

const DroppedField = styled.div<{ $selected: boolean }>`
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  cursor: move;
  transition: all 0.2s;
  position: absolute;
  display: block;
  width: fit-content;
  
  &:hover {
    opacity: 0.95;
  }
`;

const FieldContainer = styled.div<{ $selected: boolean; $style?: any }>`
  padding: ${({ $style }) => $style?.padding || '16px'};
  background: ${({ $style }) => $style?.background || '#f8f9fa'};
  border: ${({ $style }) => $style?.border || '2px solid #dee2e6'};
  border-color: ${({ $selected, $style }) => $selected ? '#0d6efd' : ($style?.borderColor || '#dee2e6')};
  border-radius: ${({ $style }) => $style?.borderRadius || '8px'};
  margin: 0;
  cursor: move;
  transition: all 0.2s;
  position: absolute;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ContainerHeader = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #212529);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border-color, #dee2e6);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ContainerDropZone = styled.div`
  position: relative;
  min-height: 100px;
  border: 2px dashed var(--border-color, #dee2e6);
  border-radius: 6px;
  padding: 16px;
  background: white;
  
  &:empty::before {
    content: '⬇️ Arraste campos aqui para agrupar';
    display: block;
    text-align: center;
    color: var(--text-muted, #6c757d);
    padding: 32px;
    font-size: 14px;
  }
  
  &.drag-over {
    background: var(--primary-bg-light, #e7f1ff);
    border-color: var(--primary-color, #0d6efd);
  }
`;

// ============================================================================
// STYLED COMPONENTS - TABS
// ============================================================================

const TabsContainer = styled.div`
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 8px;
  background: white;
  overflow: hidden;
  margin: 8px 0;
`;

const TabsNavigation = styled.div<{ $orientation?: 'horizontal' | 'vertical' }>`
  display: flex;
  flex-direction: ${({ $orientation }) => $orientation === 'vertical' ? 'column' : 'row'};
  gap: 0;
  background: #f8f9fa;
  border-bottom: ${({ $orientation }) => $orientation === 'vertical' ? 'none' : '2px solid var(--border-color, #dee2e6)'};
  border-right: ${({ $orientation }) => $orientation === 'vertical' ? '2px solid var(--border-color, #dee2e6)' : 'none'};
  padding: ${({ $orientation }) => $orientation === 'vertical' ? '8px' : '8px 8px 0 8px'};
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 12px 20px;
  border: none;
  background: ${({ $active }) => $active ? 'white' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--primary-color, #0d6efd)' : '#6c757d'};
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: ${({ $active }) => $active ? '3px solid var(--primary-color, #0d6efd)' : '3px solid transparent'};
  margin-bottom: ${({ $active }) => $active ? '-2px' : '0'};
  border-radius: 6px 6px 0 0;
  
  &:hover {
    background: ${({ $active }) => $active ? 'white' : '#e9ecef'};
    color: var(--primary-color, #0d6efd);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TabContentArea = styled.div`
  padding: 20px;
  min-height: 200px;
  background: white;
`;

const TabDropZone = styled.div`
  min-height: 150px;
  padding: 16px;
  border: 2px dashed var(--border-color, #dee2e6);
  border-radius: 6px;
  background: #f8f9fa;
  transition: all 0.2s;
  
  &.drag-over {
    border-color: var(--primary-color, #0d6efd);
    background: #e7f1ff;
  }
  
  &:empty::before {
    content: '📋 Arraste campos para esta aba';
    color: #6c757d;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
`;

// PropertyGroup, PropertyLabel, PropertyInput, PropertySelect, PropertyCheckbox
// REMOVIDOS (11 JAN 2026) - eram usados apenas no PropertiesPanel

const CodeEditor = styled.textarea`
  width: 100%;
  height: 600px;
  padding: 16px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 13px;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 6px;
  background: #f8f9fa;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color, #0d6efd);
  }
`;

const ImportArea = styled.div`
  border: 2px dashed var(--border-color, #dee2e6);
  border-radius: 8px;
  padding: 48px;
  text-align: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--primary-color, #0d6efd);
    background: #e7f1ff;
  }
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return `
          background: var(--success-bg, #d1e7dd);
          color: var(--success-text, #0f5132);
          border: 1px solid var(--success-border, #badbcc);
        `;
      case 'error':
        return `
          background: var(--danger-bg, #f8d7da);
          color: var(--danger-text, #842029);
          border: 1px solid var(--danger-border, #f5c2c7);
        `;
      default:
        return `
          background: var(--info-bg, #cff4fc);
          color: var(--info-text, #055160);
          border: 1px solid var(--info-border, #b6effb);
        `;
    }
  }}
`;

// Modal Overlay e Container
const ModalOverlay = styled.div<{ $show: boolean }>`
  display: ${({ $show }) => $show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #212529);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid var(--border-color, #dee2e6);
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
`;

const GridContainer = styled.div`
  height: 400px;
  width: 100%;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
`;

// ============================================================================
// CAMPO TYPES DISPONÍVEIS
// ============================================================================

const FIELD_TYPES = [
  { type: 'text', label: 'Texto', icon: '📝' },
  { type: 'select', label: 'Seleção', icon: '📋' },
  { type: 'textarea', label: 'Área de Texto', icon: '📄' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { type: 'container', label: 'Container', icon: '📦' },
  { type: 'bevel', label: 'Componente Moldura', icon: '🖼️' },
  { type: 'tabs', label: 'Aba', icon: '📑' },
  { type: 'daypilot_calendar', label: 'Calendário Avançado', icon: '📆' },
] as const;

// Máscaras disponíveis para campos de texto
// INPUT_MASKS - Removido do uso ativo (11 JAN 2026)
// Era usado apenas no PropertiesPanel (removido)
// Mantém aqui para referência futura quando implementar modal de propriedades
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const INPUT_MASKS = [
  { value: 'none', label: 'Nenhuma (Texto livre)', icon: '📝' },
  { value: 'number', label: 'Número', icon: '🔢' },
  { value: 'email', label: 'E-mail', icon: '📧' },
  { value: 'phone', label: 'Telefone', icon: '📞' },
  { value: 'date', label: 'Data', icon: '📅' },
  { value: 'cpf', label: 'CPF', icon: '🆔' },
  { value: 'cnpj', label: 'CNPJ', icon: '🏢' },
  { value: 'cnh', label: 'CNH', icon: '🚗' },
  { value: 'rg', label: 'RG', icon: '🪪' },
  { value: 'titulo_eleitor', label: 'Título de Eleitor', icon: '🗳️' },
] as const;

// ============================================================================
// HELPERS & UTILITIES
// ============================================================================

/**
 * Mapeia tipo de dado do banco para tipo de campo do formulário
 * Considera is_lista, is_checkbox e table de referência do dictionary_columns
 * 
 * @param dbType - Tipo de dado do banco (VARCHAR, INT, DATE, etc.)
 * @param isLista - Se campo é lista dinâmica (is_lista = 1)
 * @param isCheckbox - Se campo é checkbox (is_checkbox = 1)
 * @returns Tipo do campo no formulário
 */
const mapDictionaryTypeToFormType = (
  dbType: string, 
  isLista: boolean | number = false, 
  isCheckbox: boolean | number = false
): FormField['type'] => {
  // ✅ Prioridade 1: Lista dinâmica (is_lista = 1)
  // Se tem is_lista, sempre renderizar como select
  // O tipo de seleção (simples ou múltipla) é controlado por isMultipleSelection
  if (isLista === 1 || isLista === true) {
    return 'select';
  }
  
  // ✅ Prioridade 2: Checkbox isolado (is_checkbox = 1 sem is_lista)
  if (isCheckbox === 1 || isCheckbox === true) {
    return 'checkbox';
  }
  
  // ✅ Prioridade 3: Tipo de dado do banco (fallback)
  // Todos os tipos numéricos/data/email agora são TEXT com máscara
  const type = (dbType || '').toLowerCase();
  if (type.includes('bool') || type.includes('tinyint(1)')) return 'checkbox';
  if (type.includes('enum') || type.includes('set')) return 'select';
  
  // Textos grandes = textarea
  if (type.includes('text') || type.includes('longtext') || type.includes('mediumtext')) {
    return 'textarea';
  }
  
  return 'text'; // Tudo mais é TEXT (com máscara opcional)
};

/**
 * Mapeia tipo de dado do banco para máscara de entrada (inputMask)
 * NOVO 11 JAN 2026 - Substitui tipos separados por máscaras
 * 
 * @param dbType - Tipo de dado do banco (VARCHAR, INT, DATE, etc.)
 * @param columnName - Nome da coluna (para detectar CPF/CNPJ/etc)
 * @returns Tipo de máscara a ser aplicada
 */
const mapDictionaryTypeToInputMask = (
  dbType: string,
  columnName: string = ''
): FormField['inputMask'] => {
  const type = (dbType || '').toLowerCase();
  const col = (columnName || '').toLowerCase();
  
  // Detectar máscaras por tipo de dado
  if (type.includes('int') || type.includes('decimal') || type.includes('float') || type.includes('double')) {
    return 'number';
  }
  
  if (type.includes('date') || type.includes('timestamp')) {
    return 'date';
  }
  
  // Detectar máscaras por nome da coluna
  if (col.includes('email') || col.includes('mail')) return 'email';
  if (col.includes('tel') || col.includes('fone') || col.includes('phone')) return 'phone';
  if (col.includes('cpf')) return 'cpf';
  if (col.includes('cnpj')) return 'cnpj';
  if (col.includes('cnh')) return 'cnh';
  if (col.includes('rg')) return 'rg';
  if (col.includes('titulo') || col.includes('eleitor')) return 'titulo_eleitor';
  
  return 'none'; // Texto livre
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const FormBuilderMain: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  // Estados principais
  const [mode, setMode] = useState<EditorMode>('design');
  
  // Estado do Sidebar com localStorage (11 JAN 2026)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('formbuilder_sidebar_collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  // Estado para componentes disponíveis do banco (11 JAN 2026)
  const [availableComponents, setAvailableComponents] = useState<FormComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState<boolean>(false);
  
  // 🆕 Estados para Propriedades do Formulário (11 JAN 2026)
  const [formPropsCollapsed, setFormPropsCollapsed] = useState<boolean>(false);
  const [enableSearchTab, setEnableSearchTab] = useState<boolean>(true);
  
  // 🆕 Estados para Metadados de Componentes (11 JAN 2026)
  const [componentMetadata, setComponentMetadata] = useState<{
    properties: Record<string, Array<{property: string, value: string | number | boolean}>>;
    events: Record<string, Array<{event: string, action: string}>>;
  }>({ properties: {}, events: {} }); // Aba Localizar (default: true)
  
  const [availableTables, setAvailableTables] = useState<DictionaryTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DictionaryTable | null>(null);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]); // IDs das colunas selecionadas
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [newFormName, setNewFormName] = useState<string>('');
  
  // Estado para padrão Localizar/Incluir/Editar
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formMode, setFormMode] = useState<'localizar' | 'incluir' | 'editar'>('localizar');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasSearchForm, setHasSearchForm] = useState<boolean>(false); // Se tabela tem campos search_visible=1
  const [activeTabsState, setActiveTabsState] = useState<Record<string, string>>({});
  const [formDefinition, setFormDefinition] = useState<FormDefinition>({
    formName: 'novo_formulario',
    formTitle: 'Novo Formulário',
    tableName: '',
    description: '',
    fields: [],
    layout: {
      columns: 2,
      gap: '16px',
      responsive: true,
    },
    validation: {
      validateOnChange: false,
      validateOnBlur: true,
      showErrorSummary: true,
    },
    buttons: {
      submit: { label: '💾 Salvar', visible: true },
      cancel: { label: '❌ Cancelar', visible: true },
      reset: { label: '🔄 Limpar', visible: false },
    },
  });

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [previewTab, setPreviewTab] = useState<'localizar' | 'cadastro'>('localizar'); // ✅ Controla aba ativa no Preview
  const [isSavingFiles, setIsSavingFiles] = useState<boolean>(false); // ✅ Loading state para salvamento
  const [savingProgress, setSavingProgress] = useState<number>(0); // ✅ Progresso do salvamento (0-100)
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeCodeTab, setActiveCodeTab] = useState<'tsx' | 'css' | 'java' | 'sql' | 'types'>('tsx');

  // Lista de formulários já gerados (do banco `forms`)
  const [savedForms, setSavedForms] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSavedFormId, setSelectedSavedFormId] = useState<string | null>(null);

  // Logo fallback attempts (tenta vários caminhos antes de esconder a imagem)
  const logoCandidates = useMemo(() => {
    const pub = process.env.PUBLIC_URL || '';
    return [
      `${pub}/logo-formbuilder.png`,
      `${pub}/assets/logo-formbuilder.png`,
      '/spdealer/logo-formbuilder.png',
      '/spdealer/assets/logo-formbuilder.png',
      '/logo-formbuilder.png'
    ];
  }, []);

  const [logoAttemptIndex, setLogoAttemptIndex] = useState(0);
  const [logoSrc, setLogoSrc] = useState<string>(logoCandidates[0]);

  useEffect(() => {
    // Buscar formulários persistidos no banco (endpoint: /api/formbuild/forms)
    fetch('/api/formbuild/forms')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        // espera-se array de objetos com id/name
        if (Array.isArray(data)) {
          const forms = data.map((f: any) => ({ id: String(f.id), name: String(f.name) }));
          setSavedForms(forms);
          if (forms.length > 0) setSelectedSavedFormId(forms[0].id);
        }
      })
      .catch(() => {
        // silencioso: endpoint pode não existir em ambientes antigos
      });
  }, []);

  const loadFormById = async (formId: string) => {
    try {
      const res = await fetch(`/api/formbuild/forms/${encodeURIComponent(formId)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Converter formato do backend para FormDefinition usado pelo frontend
      const fields = (data.fields || []).map((f: any) => {
        let props = {} as any;
        let validations = {} as any;
        try { props = f.props ? JSON.parse(f.props) : {}; } catch(e) { props = {}; }
        try { validations = f.validations ? JSON.parse(f.validations) : {}; } catch(e) { validations = {}; }

        return {
          id: String(f.id),
          name: f.name || '',
          label: f.label || '',
          type: f.type || 'text',
          position: f.position || 0,
          width: props.width,
          height: props.height,
          required: validations.required || false,
          placeholder: props.placeholder || '',
          validation: validations
        };
      });

      const newDef: any = {
        id: data.id,
        formName: data.name || data.formTitle || 'form',
        formTitle: data.name || data.formTitle || 'Form',
        tableName: (data.form_metadata && data.form_metadata.tableName) || data.tableName || '',
        description: data.description || '',
        fields,
        layout: data.settings?.layout || formDefinition.layout,
        validation: data.settings?.validation || formDefinition.validation,
        buttons: data.settings?.buttons || formDefinition.buttons
      };

      setFormDefinition((prev) => ({ ...prev, ...newDef }));
      setStatusMessage({ text: `Formulário ${data.name} carregado.`, type: 'success' });
    } catch (err) {
      console.error('Erro ao carregar formulário:', err);
      setStatusMessage({ text: 'Erro ao carregar formulário.', type: 'error' });
    }
  };

  // Estados para redimensionamento de campos
  const [isResizing, setIsResizing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [resizeFieldId, setResizeFieldId] = useState<string | null>(null);
  const resizeDataRef = useRef<{
    fieldId: string;
    startPos: { x: number; y: number };
    startDims: { width: number; height: number };
  } | null>(null);

  // Estado para menu de contexto (botão direito do mouse)
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    target: HTMLElement | null;
    field: FormField | null;
    metadata?: { properties: Array<any>, events: Array<any> }; // 🆕 Metadados dinâmicos (11 JAN 2026)
  }>({
    show: false,
    x: 0,
    y: 0,
    target: null,
    field: null
  });

  // Auto-hide status messages
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);
  
  // 🆕 Ajustar previewTab quando enableSearchTab mudar (11 JAN 2026)
  useEffect(() => {
    if (!enableSearchTab && previewTab === 'localizar') {
      setPreviewTab('cadastro');
    }
  }, [enableSearchTab, previewTab]);
  
  // Listener para tecla ESC - fechar FormBuilder e voltar ao workspace
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/workspace');
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
  
  // 🆕 Buscar componentes disponíveis do banco (11 JAN 2026)
  useEffect(() => {
    const loadComponents = async () => {
      setLoadingComponents(true);
      try {
        const url = '/api/form-components/formbuilder/components';
        console.log('📦 Buscando componentes disponíveis do banco...');
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erro ao buscar componentes: ${response.status}`);
        }
        
        const components: FormComponent[] = await response.json();
        console.log('✅ Componentes carregados:', components.length);
        
        setAvailableComponents(components);
      } catch (error) {
        console.error('❌ Erro ao carregar componentes:', error);
        setStatusMessage({
          text: 'Erro ao carregar componentes do banco. Usando componentes padrão.',
          type: 'error'
        });
        // Fallback: usar FIELD_TYPES padrão
        setAvailableComponents([]);
      } finally {
        setLoadingComponents(false);
      }
    };
    
    loadComponents();
  }, []);
  
  // 🆕 Persistir estado do sidebar no localStorage (11 JAN 2026)
  useEffect(() => {
    localStorage.setItem('formbuilder_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // ============================================================================
  // HANDLER: Menu de Contexto (Botão Direito do Mouse)
  // ============================================================================
  
  // 🆕 Carregar propriedades e eventos dinâmicos de um componente (11 JAN 2026)
  const loadComponentMetadata = useCallback(async (componentType: string) => {
    // Verificar se já está em cache
    if (componentMetadata.properties[componentType]) {
      console.log('✅ Metadados em cache para:', componentType);
      return {
        properties: componentMetadata.properties[componentType],
        events: componentMetadata.events[componentType]
      };
    }
    
    console.log('🔍 Carregando metadados para:', componentType);
    
    try {
      // Buscar propriedades do componente
      const propsResponse = await fetch(`/api/form-components/${componentType}/properties`);
      if (!propsResponse.ok) {
        console.warn(`⚠️ Propriedades não encontradas para ${componentType}, usando padrão`);
        return { properties: [], events: [] };
      }
      
      const propsData = await propsResponse.json();
      const properties = propsData.map((p: any) => ({
        property: p.property_label || p.property_name,
        value: p.default_value || ''
      }));
      
      // Buscar eventos do componente
      const eventsResponse = await fetch(`/api/form-components/${componentType}/events`);
      const events = eventsResponse.ok ? 
        (await eventsResponse.json()).map((e: any) => ({
          event: e.event_label || e.event_name,
          action: '(Vazio)'
        })) : [];
      
      // Armazenar em cache
      setComponentMetadata(prev => ({
        properties: { ...prev.properties, [componentType]: properties },
        events: { ...prev.events, [componentType]: events }
      }));
      
      console.log(`✅ Carregados ${properties.length} props e ${events.length} eventos para ${componentType}`);
      return { properties, events };
      
    } catch (error) {
      console.error('❌ Erro ao carregar metadados:', error);
      return { properties: [], events: [] };
    }
  }, [componentMetadata]);
  
  const handleContextMenu = useCallback(async (e: React.MouseEvent, field: FormField) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Context menu opened for field:', field.name, 'type:', field.type);
    
    // 🆕 Carregar metadados dinâmicos do componente
    const metadata = await loadComponentMetadata(field.type);
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      target: e.currentTarget as HTMLElement,
      field: field,
      metadata: metadata // 🆕 Passar metadados carregados
    });
    
    // Selecionar o campo também
    setSelectedField(field);
  }, [loadComponentMetadata]);
  
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({
      show: false,
      x: 0,
      y: 0,
      target: null,
      field: null
    });
  }, []);

  // Carregar tabelas do dictionary na montagem do componente
  useEffect(() => {
    const loadDictionaryTables = async () => {
      try {
        const url = '/api/dictionary/tables';
        console.log('🔍 Carregando tabelas do dictionary...');
        console.log('📡 URL:', url);
        console.log('🌐 window.location.origin:', window.location.origin);
        
        const response = await fetch(url);
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (response.ok) {
          const tables = await response.json();
          console.log('✅ Tabelas recebidas:', tables);
          console.log('📊 Quantidade:', tables.length);
          
          if (tables.length > 0) {
            console.log('📋 Primeira tabela:', tables[0]);
            console.log('📋 Estrutura:', Object.keys(tables[0]));
          }
          
          // Normalizar campos do backend (camelCase) para frontend (snake_case)
          const normalizedTables = tables.map((table: any) => ({
            ...table,
            table_name: table.tableName || table.table_name,
            table_label: table.displayName || table.table_label || table.tableName
          }));
          
          setAvailableTables(normalizedTables);
          
          if (tables.length === 0) {
            setStatusMessage({ 
              text: '⚠️ 0 tabelas carregadas do dictionary - Banco pode estar vazio', 
              type: 'info' 
            });
          } else {
            setStatusMessage({ 
              text: `✅ ${tables.length} tabelas carregadas do dictionary`, 
              type: 'success' 
            });
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Erro ao carregar tabelas:', response.status, errorText);
          setStatusMessage({ 
            text: `⚠️ Erro ${response.status}: ${errorText || 'Não foi possível carregar tabelas do dictionary'}`, 
            type: 'error' 
          });
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dictionary_tables:', error);
        console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
        setStatusMessage({ 
          text: `⚠️ Erro de conexão ao carregar tabelas: ${error instanceof Error ? error.message : 'Desconhecido'}`, 
          type: 'error' 
        });
        // Fallback: lista vazia (usuário pode digitar manualmente)
        setAvailableTables([]);
      }
    };

    loadDictionaryTables();
  }, []);

  // Carregar colunas da tabela selecionada
  const loadTableColumns = useCallback(async (tableName: string) => {
    try {
      const url = `/api/dictionary/columns/${tableName}`;
      console.log('🔍 Carregando colunas da tabela:', tableName, '- URL:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const columns = await response.json();
        console.log('✅ Colunas recebidas (raw):', columns.length);
        console.log('📋 Primeira coluna (raw):', columns[0]);
        
        // Normalizar campos do backend (camelCase) para frontend (snake_case)
        const normalizedColumns = columns.map((col: any) => {
          const formVisible = col.formVisible !== undefined ? col.formVisible : col.form_visible;
          const isLista = col.isLista !== undefined ? col.isLista : col.is_lista;
          
          const normalized = {
            ...col,
            column_name: col.columnName || col.column_name,
            data_type: col.dataType || col.data_type,
            form_visible: formVisible,
            search_visible: col.searchVisible !== undefined ? col.searchVisible : col.search_visible,
            is_lista: isLista,
            // Label: usar alias se existir e não estiver vazio/corrompido
            label: col.alias && col.alias.trim() && !col.alias.includes('¾') && !col.alias.includes('þ') 
              ? col.alias 
              : col.columnName || col.column_name,
            // Outros campos do backend
            alias: col.alias,
            aba: col.aba,
            tabulation: col.tabulation,
            table: col.table,
            width: col.width,
            widthAggrid: col.widthAggrid,
            isNullable: col.isNullable,
            isPrimaryKey: col.isPrimaryKey,
            isForeignKey: col.isForeignKey,
            isCheckbox: col.isCheckbox,
            // Pré-selecionar campos com form_visible=1 ou true
            selected: formVisible === 1 || formVisible === true
          };
          
          // Log para debug
          if (col.columnName === 'codigo_dep') {
            console.log('🔍 Debug codigo_dep:', {
              raw: col,
              normalized: normalized,
              formVisible: formVisible,
              label: normalized.label,
              tabulation: normalized.tabulation
            });
          }
          
          return normalized;
        });
        
        console.log('✅ Colunas normalizadas:', normalizedColumns.length);
        console.log('📋 Primeira coluna normalizada:', normalizedColumns[0]);
        console.log('✔️ Campos com form_visible=1:', normalizedColumns.filter((c: any) => c.form_visible === 1 || c.form_visible === true).length);
        
        setTableColumns(normalizedColumns);
        return normalizedColumns;
      } else {
        console.error('❌ Erro ao carregar colunas:', response.status);
        setStatusMessage({ 
          text: `Erro ao carregar colunas da tabela ${tableName}`, 
          type: 'error' 
        });
        return [];
      }
    } catch (error) {
      console.error('❌ Erro ao buscar colunas:', error);
      setStatusMessage({ 
        text: `Erro de conexão ao carregar colunas`, 
        type: 'error' 
      });
      return [];
    }
  }, []);

  // Handler: Ao selecionar tabela do dropdown
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleTableSelect = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tableName = event.target.value;
    
    console.log('🔍 handleTableSelect chamado - tableName:', tableName);
    
    if (!tableName) {
      setSelectedTable(null);
      setTableColumns([]);
      setShowImportModal(false);
      return;
    }
    
    const table = availableTables.find(t => t.table_name === tableName);
    console.log('📋 Tabela encontrada:', table);
    
    if (table) {
      setSelectedTable(table);
      console.log('⏳ Carregando colunas...');
      const columns = await loadTableColumns(tableName);
      console.log('✅ Colunas carregadas:', columns.length);
      
      if (columns.length > 0) {
        console.log('🎯 Abrindo modal de importação');
        setShowImportModal(true);
        // ✅ FIX: Usar description (displayName) ao invés de table_label
        const formName = table.description || table.displayName || table.table_label || table.table_name;
        setNewFormName(formName || '');
        console.log('📝 Nome do formulário auto-fill:', formName);
      } else {
        console.warn('⚠️ Nenhuma coluna retornada!');
        setStatusMessage({
          text: `⚠️ Tabela ${tableName} não possui colunas no dictionary`,
          type: 'info'
        });
      }
    } else {
      console.error('❌ Tabela não encontrada em availableTables');
    }
  }, [availableTables, loadTableColumns]);

  // Handler: Importar formulário do dictionary
  const handleImportFromDictionary = useCallback(async () => {
    if (!selectedTable || tableColumns.length === 0 || !newFormName.trim()) {
      setStatusMessage({ 
        text: 'Preencha o nome do formulário', 
        type: 'error' 
      });
      return;
    }
    
    console.log('📋 Importando formulário:', newFormName);
    console.log('📊 Tabela:', selectedTable.table_name);
    console.log('📊 Colunas:', tableColumns.length);
    
    try {
      // Filtrar apenas colunas visíveis (form_visible = 1)
      const visibleColumns = tableColumns.filter((col: any) => 
        col.form_visible === 1 || col.form_visible === true
      );
      
      // Ordenar por tabulation
      visibleColumns.sort((a: any, b: any) => {
        const tabA = a.tabulation || 9999;
        const tabB = b.tabulation || 9999;
        return tabA - tabB;
      });
      
      console.log('✅ Colunas visíveis:', visibleColumns.length);
      
      // Agrupar por aba (se houver alias de aba)
      const tabsMap = new Map<string, any[]>();
      const fieldsWithoutTab: any[] = [];
      
      visibleColumns.forEach((col: any) => {
        const tabAlias = col.tab_alias || col.aba_alias; // Suporte a ambos nomes
        
        if (tabAlias && tabAlias.trim()) {
          if (!tabsMap.has(tabAlias)) {
            tabsMap.set(tabAlias, []);
          }
          tabsMap.get(tabAlias)!.push(col);
        } else {
          fieldsWithoutTab.push(col);
        }
      });
      
      const newFields: FormField[] = [];
      let currentY = 20;
      const fieldHeight = 40;
      const fieldGap = 12;
      
      // Se houver abas, criar componente Tabs
      if (tabsMap.size > 0) {
        const tabDefinitions: TabDefinition[] = [];
        let fieldCounter = 0; // ✅ Contador único para IDs
        
        Array.from(tabsMap.entries()).forEach(([tabAlias, columns], tabIndex) => {
          const tabId = `tab_${tabIndex}`;
          const fieldIds: string[] = [];
          
          // Criar campos para esta aba
          columns.forEach((col: any, colIndex: number) => {
            const fieldId = `field_${col.column_name}_${fieldCounter++}`; // ✅ ID único
            fieldIds.push(fieldId);
            
            // ✅ Extrair propriedades de lista dinâmica e busca
            const isLista = col.is_lista === 1 || col.is_lista === true;
            const isCheckbox = col.is_checkbox === 1 || col.is_checkbox === true;
            const refTable = col.table || col.ref_table || '';
            const searchVisible = col.search_visible === 1 || col.search_visible === true;
            
            const field: FormField = {
              id: fieldId,
              name: col.column_name,
              label: col.column_label || col.column_name,
              labelPosition: 'top', // ✅ FIX: label acima do campo (padrão SPDealer)
              labelPadding: '4px', // ✅ Espaçamento mínimo entre label e campo
              type: mapDictionaryTypeToFormType(col.data_type || col.column_type, isLista, isCheckbox),
              required: col.is_required === 1 || col.is_required === true,
              placeholder: col.placeholder || '',
              defaultValue: col.default_value || '',
              width: '300px',
              height: '38px',
              position: { x: 20, y: currentY },
              order: col.tabulation || colIndex,
              parentId: tabId,
              
              // ✅ NOVO: Máscara de entrada (inputMask)
              inputMask: mapDictionaryTypeToInputMask(col.data_type || col.column_type, col.column_name),
              
              // ✅ Lista Dinâmica (is_lista = 1)
              isDynamicList: isLista,
              referenceTable: isLista ? refTable : undefined,
              isMultipleSelection: isLista && isCheckbox,
              
              // ✅ Localizar (search_visible = 1)
              searchVisible: searchVisible
            };
            
            newFields.push(field);
            currentY += fieldHeight + fieldGap;
          });
          
          tabDefinitions.push({
            id: tabId,
            label: tabAlias,
            fieldIds: fieldIds,
            icon: '📋',
          });
          
          console.log(`📌 Aba "${tabAlias}" (${tabId}): ${fieldIds.length} campos`, fieldIds);
          
          currentY += 20; // Gap entre abas
        });
        
        // Criar componente Tabs
        const tabsField: FormField = {
          id: `tabs_${Date.now()}`,
          name: 'form_tabs',
          label: 'Formulário com Abas',
          labelPosition: 'top',
          type: 'tabs',
          required: false,
          width: '100%',
          height: 'auto',
          position: { x: 0, y: 0 },
          order: 0,
          tabs: tabDefinitions,
          activeTab: tabDefinitions[0]?.id,
          tabsOrientation: 'horizontal',
        };
        
        console.log('✅ Componente Tabs criado:', {
          totalAbas: tabDefinitions.length,
          abas: tabDefinitions.map(t => ({ id: t.id, label: t.label, fields: t.fieldIds.length }))
        });
        
        newFields.unshift(tabsField);
      }
      
      // Adicionar campos sem aba
      let fieldCounterNoTab = 10000; // ✅ Contador separado para campos sem aba
      fieldsWithoutTab.forEach((col: any, index: number) => {
        // ✅ Extrair propriedades de lista dinâmica e busca
        const isLista = col.is_lista === 1 || col.is_lista === true;
        const isCheckbox = col.is_checkbox === 1 || col.is_checkbox === true;
        const refTable = col.table || col.ref_table || '';
        const searchVisible = col.search_visible === 1 || col.search_visible === true;
        
        const field: FormField = {
          id: `field_${col.column_name}_${fieldCounterNoTab++}`, // ✅ ID único
          name: col.column_name,
          label: col.alias || col.column_label || col.column_name,
          labelPosition: 'top', // ✅ FIX: label acima do campo (padrão SPDealer)
          labelPadding: '4px', // ✅ Espaçamento mínimo entre label e campo
          type: mapDictionaryTypeToFormType(col.data_type || col.column_type, isLista, isCheckbox),
          required: col.is_required === 1 || col.is_required === true,
          placeholder: col.placeholder || '',
          defaultValue: col.default_value || '',
          width: '300px',
          height: '38px',
          position: { x: 20, y: currentY },
          order: col.tabulation || index,
          
          // ✅ NOVO: Máscara de entrada (inputMask)
          inputMask: mapDictionaryTypeToInputMask(col.data_type || col.column_type, col.column_name),
          
          // ✅ Lista Dinâmica (is_lista = 1)
          isDynamicList: isLista,
          referenceTable: isLista ? refTable : undefined,
          isMultipleSelection: isLista && isCheckbox, // Seleção múltipla quando ambos = 1
          
          // ✅ Localizar (search_visible = 1)
          searchVisible: searchVisible
        };
        
        newFields.push(field);
        currentY += fieldHeight + fieldGap;
      });
      
      // Calcular campos de busca (search_visible = 1)
      const searchColumns = newFields.filter(f => f.searchVisible === true);
      const hasSearch = searchColumns.length > 0;
      
      // ✅ FIX: Atualizar formName E formTitle (não apenas 'name')
      setFormDefinition(prev => ({
        ...prev,
        formName: selectedTable.table_name || 'form_imported', // ID técnico
        formTitle: newFormName, // Título exibido (ex: "Departamentos")
        tableName: selectedTable.table_name || '',
        fields: newFields,
      }));
      
      const searchInfo = hasSearch ? ` (${searchColumns.length} campos de busca)` : '';
      setStatusMessage({ 
        text: `✅ Formulário "${newFormName}" criado com ${newFields.length} campo(s)${searchInfo}`, 
        type: 'success' 
      });
      
      setShowImportModal(false);
      setMode('design'); // ✅ Ativar modo Design para permitir edição
      
      console.log('✅ Importação concluída:', {
        formTitle: newFormName,
        formName: selectedTable.table_name,
        totalFields: newFields.length,
        mode: 'design'
      });
      
    } catch (error) {
      console.error('❌ Erro ao importar formulário:', error);
      setStatusMessage({ 
        text: `Erro ao importar formulário: ${error instanceof Error ? error.message : 'Desconhecido'}`, 
        type: 'error' 
      });
    }
  }, [selectedTable, tableColumns, newFormName]);

  // 🆕 Handler: Importar tabela diretamente (sem modal) - 11 JAN 2026
  const handleImportFromTable = useCallback(async (tableName: string) => {
    console.log('📥 Importando tabela:', tableName);
    
    try {
      // Carregar colunas da tabela
      const columns = await loadTableColumns(tableName);
      
      if (columns.length === 0) {
        setStatusMessage({
          text: `⚠️ Tabela ${tableName} não possui colunas no dictionary`,
          type: 'info'
        });
        return;
      }
      
      // Atualizar estado das colunas
      setTableColumns(columns);
      
      // Chamar importação automática
      await handleImportFromDictionary();
      
      setStatusMessage({
        text: `✅ ${columns.length} campos importados de ${selectedTable?.table_label || tableName}`,
        type: 'success'
      });
    } catch (error) {
      console.error('❌ Erro ao importar tabela:', error);
      setStatusMessage({
        text: `Erro ao importar: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        type: 'error'
      });
    }
  }, [loadTableColumns, selectedTable, handleImportFromDictionary]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleAddField = useCallback((fieldType: typeof FIELD_TYPES[number]['type']) => {
    const isContainer = fieldType === 'container' || fieldType === 'bevel';
    
    // Calcular posição inicial em cascata (cada campo 20px abaixo do anterior)
    const lastField = formDefinition.fields[formDefinition.fields.length - 1];
    const initialX = 20;
    const initialY = lastField?.position?.y ? lastField.position.y + 80 : 20;
    
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: isContainer ? `container_${formDefinition.fields.length + 1}` : `campo_${formDefinition.fields.length + 1}`,
      label: isContainer ? `Container ${formDefinition.fields.length + 1}` : `Campo ${formDefinition.fields.length + 1}`,
      labelPosition: 'top', // Padrão: label acima do campo
      labelPadding: '8px', // Padrão: 8px de espaçamento
      type: fieldType,
      required: false,
      placeholder: '',
      order: formDefinition.fields.length,
      width: '300px', // Padrão: 300px
      height: '38px', // Padrão: altura fixa
      position: { x: initialX, y: initialY }, // Posição inicial
      inputMask: fieldType === 'text' ? 'none' : undefined, // Máscara padrão para texto
      
      // Propriedades específicas de container
      ...(isContainer && {
        containerHeader: `Seção ${formDefinition.fields.length + 1}`,
        childFields: [],
        containerStyle: {
          border: '2px solid #dee2e6',
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
        },
      }),
      
      // Propriedades específicas de tabs
      ...(fieldType === 'tabs' && {
        tabs: [
          { id: 'tab_1', label: 'Aba 1', fieldIds: [], icon: '📋' },
          { id: 'tab_2', label: 'Aba 2', fieldIds: [], icon: '📄' },
        ],
        activeTab: 'tab_1',
        tabsOrientation: 'horizontal' as const,
        tabsStyle: {
          borderColor: '#dee2e6',
          activeColor: '#0d6efd',
          backgroundColor: '#f8f9fa',
          padding: '16px',
        },
      }),
    };

    // Se há um container/bevel/tabs selecionado, adicionar o novo campo dentro dele
    if (selectedField && (selectedField.type === 'container' || selectedField.type === 'bevel')) {
      // Adicionar campo ao childFields do container
      setFormDefinition(prev => ({
        ...prev,
        fields: [
          ...prev.fields.map(f => 
            f.id === selectedField.id 
              ? { ...f, childFields: [...(f.childFields || []), newField.id] }
              : f
          ),
          newField
        ],
      }));
      setStatusMessage({ text: `✅ Campo adicionado ao ${selectedField.type === 'container' ? 'Container' : 'Componente Moldura'}`, type: 'success' });
    } else if (selectedField && selectedField.type === 'tabs' && selectedField.tabs && selectedField.tabs.length > 0) {
      // Adicionar campo à aba ativa do tabs
      const activeTabId = activeTabsState[selectedField.id] || selectedField.activeTab || selectedField.tabs[0].id;
      setFormDefinition(prev => ({
        ...prev,
        fields: [
          ...prev.fields.map(f => 
            f.id === selectedField.id 
              ? { 
                  ...f, 
                  tabs: f.tabs?.map(tab => 
                    tab.id === activeTabId 
                      ? { ...tab, fieldIds: [...tab.fieldIds, newField.id] }
                      : tab
                  )
                }
              : f
          ),
          newField
        ],
      }));
      setStatusMessage({ text: `✅ Campo adicionado à aba ativa`, type: 'success' });
    } else {
      // Adicionar campo normalmente à lista principal
      setFormDefinition(prev => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));
      setStatusMessage({ text: '✅ Campo adicionado', type: 'success' });
    }

    setSelectedField(newField);
  }, [formDefinition.fields.length, selectedField, activeTabsState]);

  const handleRemoveField = useCallback((fieldId: string) => {
    setFormDefinition(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }));

    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }

    setStatusMessage({ text: '🗑️ Campo removido', type: 'info' });
  }, [selectedField]);

  const handleUpdateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    console.log('🔧 handleUpdateField chamado:', { fieldId, updates });
    
    setFormDefinition(prev => ({
      ...prev,
      fields: prev.fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    }));
    
    // ✅ FIX: Atualizar selectedField também para refletir mudanças no painel
    setSelectedField(prev => {
      if (prev && prev.id === fieldId) {
        const updatedField = { ...prev, ...updates };
        console.log('✅ selectedField atualizado:', updatedField);
        return updatedField;
      }
      return prev;
    });
  }, []);
  
  // Handler para mover campo livremente no canvas (drag-and-drop posição absoluta)
  const handleFieldDrag = useCallback((fieldId: string, x: number, y: number) => {
    setFormDefinition(prev => ({
      ...prev,
      fields: prev.fields.map(f =>
        f.id === fieldId ? { ...f, position: { x, y } } : f
      )
    }));
  }, []);
  
  const handleReorderFields = useCallback((draggedFieldId: string, targetFieldId: string) => {
    setFormDefinition(prev => {
      const fields = [...prev.fields];
      const draggedIndex = fields.findIndex(f => f.id === draggedFieldId);
      const targetIndex = fields.findIndex(f => f.id === targetFieldId);
      
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      
      // Remove campo da posição original
      const [draggedField] = fields.splice(draggedIndex, 1);
      
      // Insere na nova posição
      fields.splice(targetIndex, 0, draggedField);
      
      // Atualiza ordem de todos os campos
      const reorderedFields = fields.map((field, index) => ({
        ...field,
        order: index
      }));
      
      return {
        ...prev,
        fields: reorderedFields
      };
    });
  }, []);

  // Handler para iniciar o redimensionamento (mousedown no handle ⤡)
  const handleResizeStart = useCallback((e: React.MouseEvent, field: FormField) => {
    e.stopPropagation(); // Evita disparar drag
    e.preventDefault();
    
    // Pega dimensões atuais do campo (parsing de px ou % para número)
    const currentWidth = field.width ? parseInt(field.width.replace(/[^\d]/g, '')) || 300 : 300;
    const currentHeight = field.height ? parseInt(field.height.replace(/[^\d]/g, '')) || 40 : 40;
    
    resizeDataRef.current = {
      fieldId: field.id,
      startPos: { x: e.clientX, y: e.clientY },
      startDims: { width: currentWidth, height: currentHeight }
    };
    
    setIsResizing(true);
    setResizeFieldId(field.id);
  }, []);

  // useEffect para lidar com mousemove e mouseup durante resize
  useEffect(() => {
    if (!isResizing || !resizeDataRef.current) return;

    const resizeData = resizeDataRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeData) return;
      
      const deltaX = e.clientX - resizeData.startPos.x;
      const deltaY = e.clientY - resizeData.startPos.y;
      
      // Calcula novas dimensões (mínimo: 100px width, 40px height)
      const newWidth = Math.max(100, resizeData.startDims.width + deltaX);
      const newHeight = Math.max(40, resizeData.startDims.height + deltaY);
      
      // Atualiza o campo com novas dimensões
      handleUpdateField(resizeData.fieldId, { 
        width: `${newWidth}px`, 
        height: `${newHeight}px` 
      });
    };
    
    const handleMouseUp = () => {
      console.log('🛑 Resize mouseup - parando redimensionamento');
      setIsResizing(false);
      setResizeFieldId(null);
      resizeDataRef.current = null;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      console.log('🧹 Limpando event listeners de resize');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleUpdateField]);

  const handleGenerateCode = useCallback(() => {
    // ✅ Gerar código completo conforme PADRAO_ESQUELETO_FORMULARIO.md
    const tableName = formDefinition.tableName || 'generic_table';
    const componentName = formDefinition.formName || 'GenericForm';
    const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    
    // 1️⃣ TSX - ListForm com AG-Grid + Modal de Edição
    const tsxCode = `/**
 * ${capitalizedName}ListForm.tsx
 * Gerado automaticamente pelo FormBuilder SPDealer
 * Baseado em: PADRAO_ESQUELETO_FORMULARIO.md v2.0
 * Data: ${new Date().toLocaleString('pt-BR')}
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Modal } from 'react-bootstrap';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './${capitalizedName}.css';

interface ${capitalizedName}Data {
${formDefinition.fields.map(f => `  ${f.name}: ${f.inputMask === 'number' ? 'number' : f.inputMask === 'date' ? 'Date' : 'string'};`).join('\n')}
}

export const ${capitalizedName}ListForm: React.FC = () => {
  const [rowData, setRowData] = useState<${capitalizedName}Data[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRecord, setSelectedRecord] = useState<${capitalizedName}Data | null>(null);
  const [searchText, setSearchText] = useState('');

  // 📋 Definição de colunas do AG-Grid (conforme padrão SPDealer)
  const columnDefs = useMemo(() => [
${formDefinition.fields.filter(f => f.searchVisible).map(f => `    {
      field: '${f.name}',
      headerName: '${f.label}',
      sortable: true,
      filter: true,
      resizable: true,
      ${f.width ? `width: ${f.width.replace('px', '')},` : ''}
    }`).join(',\n')},
    {
      headerName: '✏️',
      field: 'edit',
      width: 60,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <button onClick={() => handleEdit(params.data)} className="btn-edit">✏️</button>
      )
    },
    {
      headerName: '🗑️',
      field: 'delete',
      width: 60,
      pinned: 'right',
      cellRenderer: (params: any) => (
        <button onClick={() => handleDelete(params.data)} className="btn-delete">🗑️</button>
      )
    }
  ], []);

  // 🔄 Carregar dados do backend
  useEffect(() => {
    fetch('/api/${tableName}')
      .then(res => res.json())
      .then(data => setRowData(data))
      .catch(err => console.error('Erro ao carregar dados:', err));
  }, []);

  // ➕ Incluir novo registro
  const handleIncluir = () => {
    setModalMode('create');
    setSelectedRecord(null);
    setShowModal(true);
  };

  // ✏️ Editar registro
  const handleEdit = (record: ${capitalizedName}Data) => {
    setModalMode('edit');
    setSelectedRecord(record);
    setShowModal(true);
  };

  // 🗑️ Excluir registro
  const handleDelete = async (record: ${capitalizedName}Data) => {
    if (!confirm('Confirma exclusão?')) return;
    
    try {
      await fetch(\`/api/${tableName}/\${record.${formDefinition.fields[0]?.name || 'id'}}\`, { method: 'DELETE' });
      setRowData(prev => prev.filter(r => r !== record));
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  // 💾 Salvar (criar/atualizar)
  const handleSave = async (data: ${capitalizedName}Data) => {
    const url = modalMode === 'create' ? '/api/${tableName}' : \`/api/${tableName}/\${data.${formDefinition.fields[0]?.name || 'id'}}\`;
    const method = modalMode === 'create' ? 'POST' : 'PUT';
    
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar');
      
      const saved = await response.json();
      
      if (modalMode === 'create') {
        setRowData(prev => [...prev, saved]);
      } else {
        setRowData(prev => prev.map(r => r === selectedRecord ? saved : r));
      }
      
      setShowModal(false);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar registro!');
    }
  };

  return (
    <div className="${componentName}-list-form">
      {/* 🔍 SearchBar + Botão Incluir */}
      <div className="search-header">
        <input
          type="text"
          placeholder="🔍 Localizar..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
        <button onClick={handleIncluir} className="btn-incluir">
          ➕ Incluir
        </button>
      </div>

      {/* 📊 AG-Grid */}
      <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          quickFilterText={searchText}
          pagination={true}
          paginationPageSize={20}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true
          }}
        />
      </div>

      {/* 📝 Modal de Edição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? '➕ Incluir' : '✏️ Editar'} ${formDefinition.formTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <${capitalizedName}ModalForm
            initialData={selectedRecord}
            onSave={handleSave}
            onCancel={() => setShowModal(false)}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

// 📝 Componente do Modal de Edição
interface ${capitalizedName}ModalFormProps {
  initialData: ${capitalizedName}Data | null;
  onSave: (data: ${capitalizedName}Data) => void;
  onCancel: () => void;
}

const ${capitalizedName}ModalForm: React.FC<${capitalizedName}ModalFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<${capitalizedName}Data>(
    initialData || {
${formDefinition.fields.map(f => `      ${f.name}: ${f.inputMask === 'number' ? '0' : f.type === 'checkbox' ? 'false' : "''"},`).join('\n')}
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // ⌨️ Atalhos de teclado (conforme padrão SPDealer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'g') { e.preventDefault(); handleSubmit(e as any); }
      if (e.ctrlKey && e.key === 'x') { e.preventDefault(); onCancel(); }
      if (e.key === 'Escape') { onCancel(); }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  return (
    <form onSubmit={handleSubmit} className="modal-form">
${formDefinition.fields.map(f => `      <div className="form-field">
        <label htmlFor="${f.name}">
          ${f.label}${f.required ? ' *' : ''}
        </label>
        <input
          type="${f.type}"
          id="${f.name}"
          name="${f.name}"
          placeholder="${f.placeholder || ''}"
          required={${f.required}}
          value={formData.${f.name}}
          onChange={(e) => setFormData({...formData, ${f.name}: e.target.value})}
          className="form-control"
        />
      </div>`).join('\n\n')}

      <div className="modal-footer">
        <button type="submit" className="btn-primary">
          💾 Gravar (CTRL+G)
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          ❌ Cancelar (CTRL+X)
        </button>
      </div>
    </form>
  );
};

export default ${capitalizedName}ListForm;
`;

    // 2️⃣ CSS - Estilos conforme padrão SPDealer
    const cssCode = `/**
 * ${capitalizedName}.css
 * Estilos do Formulário (padrão SPDealer)
 * Data: ${new Date().toLocaleString('pt-BR')}
 */

/* 🎨 Container Principal */
.${componentName}-list-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--background-primary, #f8f9fa);
}

/* 🔍 SearchBar */
.search-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* ➕ Botão Incluir */
.btn-incluir {
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-incluir:hover {
  background: #218838;
}

/* ✏️🗑️ Botões de Ação (Grid) */
.btn-edit,
.btn-delete {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  transition: transform 0.1s;
}

.btn-edit:hover { transform: scale(1.2); }
.btn-delete:hover { transform: scale(1.2); color: #dc3545; }

/* 📝 Modal Form */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  font-weight: 500;
  font-size: 14px;
  color: #212529;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* 🎨 Footer Botões */
.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #dee2e6;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background: #0b5ed7;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5c636a;
}

/* 📱 Responsividade */
@media (max-width: 768px) {
  .modal-form {
    padding: 12px;
  }
  
  .search-header {
    flex-direction: column;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
`;

    // 3️⃣ JAVA - Controller + Service
    const javaCode = `/**
 * ${capitalizedName}Controller.java
 * Gerado automaticamente pelo FormBuilder SPDealer
 * Data: ${new Date().toLocaleString('pt-BR')}
 */

package br.com.spdealer.controller;

import br.com.spdealer.model.${capitalizedName};
import br.com.spdealer.service.${capitalizedName}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${tableName}")
public class ${capitalizedName}Controller {

    @Autowired
    private ${capitalizedName}Service service;

    // 📋 Listar todos
    @GetMapping
    public ResponseEntity<List<${capitalizedName}>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    // 🔍 Buscar por ID
    @GetMapping("/{id}")
    public ResponseEntity<${capitalizedName}> findById(@PathVariable Long id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // ➕ Criar
    @PostMapping
    public ResponseEntity<${capitalizedName}> create(@RequestBody ${capitalizedName} entity) {
        return ResponseEntity.ok(service.save(entity));
    }

    // ✏️ Atualizar
    @PutMapping("/{id}")
    public ResponseEntity<${capitalizedName}> update(@PathVariable Long id, @RequestBody ${capitalizedName} entity) {
        if (!service.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    // 🗑️ Excluir
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

/**
 * ${capitalizedName}Service.java
 * Service Layer
 */

package br.com.spdealer.service;

import br.com.spdealer.model.${capitalizedName};
import br.com.spdealer.repository.${capitalizedName}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ${capitalizedName}Service {

    @Autowired
    private ${capitalizedName}Repository repository;

    public List<${capitalizedName}> findAll() {
        return repository.findAll();
    }

    public Optional<${capitalizedName}> findById(Long id) {
        return repository.findById(id);
    }

    public ${capitalizedName} save(${capitalizedName} entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
`;

    // 4️⃣ SQL - Migrations
    const sqlCode = `-- ${capitalizedName} - Migration SQL
-- Data: ${new Date().toLocaleString('pt-BR')}

-- 📋 Criar tabela
CREATE TABLE IF NOT EXISTS ${tableName} (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
${formDefinition.fields.map(f => {
  let sqlType = 'VARCHAR(255)';
  if (f.inputMask === 'number') sqlType = 'DECIMAL(15,2)';
  if (f.inputMask === 'date') sqlType = 'DATE';
  if (f.type === 'checkbox') sqlType = 'TINYINT(1)';
  if (f.type === 'textarea') sqlType = 'TEXT';
  
  return `  ${f.name} ${sqlType}${f.required ? ' NOT NULL' : ''},`;
}).join('\n')}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 📊 Criar índices
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);

-- 🔍 Popular dictionary_tables
INSERT INTO dictionary_tables (table_name, table_label, description, empresa_xxx)
VALUES ('${tableName}', '${formDefinition.formTitle}', 'Gerado pelo FormBuilder', '001');

-- 🔍 Popular dictionary_columns
${formDefinition.fields.map((f, idx) => `INSERT INTO dictionary_columns (
  table_id,
  column_name,
  column_label,
  data_type,
  form_visible_default,
  form_order_default,
  search_visible_default,
  is_required
) VALUES (
  (SELECT id FROM dictionary_tables WHERE table_name = '${tableName}'),
  '${f.name}',
  '${f.label}',
  '${f.type}',
  1,
  ${(idx + 1) * 10},
  ${f.searchVisible ? 1 : 0},
  ${f.required ? 1 : 0}
);`).join('\n\n')}
`;

    // 5️⃣ TYPES - TypeScript Interfaces
    const typesCode = `/**
 * ${capitalizedName}.types.ts
 * TypeScript Types & Interfaces
 * Data: ${new Date().toLocaleString('pt-BR')}
 */

export interface ${capitalizedName}Data {
${formDefinition.fields.map(f => `  ${f.name}: ${f.inputMask === 'number' ? 'number' : f.inputMask === 'date' ? 'Date' : f.type === 'checkbox' ? 'boolean' : 'string'};`).join('\n')}
  created_at?: Date;
  updated_at?: Date;
}

export interface ${capitalizedName}FormProps {
  initialData?: ${capitalizedName}Data | null;
  onSave: (data: ${capitalizedName}Data) => void;
  onCancel: () => void;
}

export interface ${capitalizedName}ListProps {
  searchText?: string;
  onRecordClick?: (record: ${capitalizedName}Data) => void;
}
`;

    // ✅ Armazenar códigos em state (para exibir em abas)
    (window as any).generatedCodes = {
      tsx: tsxCode,
      css: cssCode,
      java: javaCode,
      sql: sqlCode,
      types: typesCode
    };

    setGeneratedCode(tsxCode); // Default: TSX
    setActiveCodeTab('tsx');
    setMode('code');
    setStatusMessage({ text: '✅ Código completo gerado com sucesso! Clique em "💾 Salvar em Refatorado" para exportar os arquivos.', type: 'success' });
  }, [formDefinition]);

  // 💾 Salvar arquivos gerados na pasta src/refatorado para homologação
  const handleSaveToRefatorado = useCallback(async () => {
    try {
      setIsSavingFiles(true);
      setSavingProgress(0);
      
      const codes = (window as any).generatedCodes;
      if (!codes) {
        setStatusMessage({ text: '❌ Nenhum código gerado. Clique em "Gerar Código" primeiro.', type: 'error' });
        setIsSavingFiles(false);
        return;
      }

      const tableName = formDefinition.tableName || 'generic_table';
      const componentName = formDefinition.formName || 'GenericForm';
      const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);

      // Preparar arquivos para salvar
      const files = [
        {
          filename: `${capitalizedName}ListForm.tsx`,
          content: codes.tsx,
          description: 'TSX (React Component)',
          folder: 'components/Forms'
        },
        {
          filename: `${capitalizedName}.css`,
          content: codes.css,
          description: 'CSS (Styles)',
          folder: 'components/Forms'
        },
        {
          filename: `${capitalizedName}.types.ts`,
          content: codes.types,
          description: 'TypeScript Types',
          folder: 'types'
        },
        {
          filename: `${capitalizedName}Controller.java`,
          content: codes.java,
          description: 'Java (Backend)',
          folder: 'backend'
        },
        {
          filename: `${tableName}_migration.sql`,
          content: codes.sql,
          description: 'SQL (Database)',
          folder: 'migrations'
        }
      ];

      // ✅ MÉTODO 1: Salvar via endpoint backend (se existir)
      try {
        const response = await fetch('/api/formbuilder/save-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            files: files.map(f => ({
              path: `src/refatorado/${f.folder}/${f.filename}`,
              content: f.content
            }))
          })
        });

        if (response.ok) {
          const result = await response.json();
          setSavingProgress(100);
          setStatusMessage({ 
            text: `✅ ${files.length} arquivos salvos em src/refatorado/!\n\n📋 Arquivos criados:\n${files.map(f => `- ${f.folder}/${f.filename}`).join('\n')}`, 
            type: 'success' 
          });
          setIsSavingFiles(false);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Endpoint de salvamento não disponível, usando download direto...');
      }

      // ✅ MÉTODO 2: Download direto dos arquivos (fallback)
      const totalFiles = files.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Atualizar progresso
        setSavingProgress(Math.round(((i + 1) / totalFiles) * 100));
        
        // Criar Blob e fazer download
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Pequeno delay para não travar o browser
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setSavingProgress(100);
      setStatusMessage({ 
        text: `✅ ${files.length} arquivos baixados!\n\n📥 Mova manualmente para:\n${files.map(f => `- src/refatorado/${f.folder}/${f.filename}`).join('\n')}\n\n💡 Dica: Crie um endpoint /api/formbuilder/save-files para salvar automaticamente`, 
        type: 'success' 
      });
      
      // Reset loading após 2 segundos
      setTimeout(() => {
        setIsSavingFiles(false);
        setSavingProgress(0);
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao salvar arquivos:', error);
      setStatusMessage({ 
        text: `❌ Erro ao salvar arquivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 
        type: 'error' 
      });
      setIsSavingFiles(false);
      setSavingProgress(0);
    }
  }, [formDefinition]);

  const handleSave = useCallback(async () => {
    try {
      // 1. Determinar se é criação ou atualização (baseado no ID existente)
      const isNewForm = !formDefinition.id;
      
      // 2. Preparar dados do formulário
      // Garantir um ID para criação (evita POST sem id que pode gerar inconsistências)
      const formIdToUse = formDefinition.id || `form_${Date.now().toString(36)}`;

      const formData = {
        id: formIdToUse,
        name: formDefinition.formName, // ✅ FIX: usar formName ao invés de name
        description: formDefinition.description || '',
        settings: JSON.stringify({
          layout: formDefinition.layout,
          validation: formDefinition.validation,
          buttons: formDefinition.buttons,
          tabsContainerClass: formDefinition.tabsContainerClass || ''
        }),
        form_metadata: JSON.stringify({
          version: '1.0',
          lastModified: new Date().toISOString(),
          fieldCount: formDefinition.fields.length,
          tableName: formDefinition.tableName,
          formTitle: formDefinition.formTitle
        })
      };

      // 3. Criar ou atualizar formulário
      const formResponse = await fetch(
        isNewForm 
          ? '/api/formbuild/forms' 
          : `/api/formbuild/forms/${formDefinition.id}`,
        {
          method: isNewForm ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      if (!formResponse.ok) {
        throw new Error(`Erro ao salvar formulário: ${formResponse.statusText}`);
      }
      
      // Obter ID retornado se criação
      const savedFormData = await formResponse.json();
      // backend retorna 'formId' (não 'id') — usar isso como fonte de verdade
      const currentFormId = savedFormData.formId || formDefinition.id;

      // 4. Salvar cada campo (com NOME técnico - CRÍTICO para geração de código)
      for (const field of formDefinition.fields) {
        const fieldId = field.id || `field-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        const fieldData = {
          id: fieldId,
          name: field.name || field.label.toLowerCase().replace(/\s+/g, '_'),  // ← CRÍTICO: nome técnico
          label: field.label,
          type: field.type,
          position: field.position || 0,
          props: JSON.stringify({
            width: field.width,
            height: field.height,
            required: field.required || false,
            placeholder: field.placeholder || '',
            maxLength: field.validation?.maxLength,
            pattern: field.validation?.pattern
          }),
          validations: JSON.stringify({
            required: field.required || false,
            pattern: field.validation?.pattern || null,
            minLength: field.validation?.minLength,
            maxLength: field.validation?.maxLength
          })
        };

        const fieldResponse = await fetch(
          field.id && !field.id.startsWith('new-')
            ? `/api/formbuild/forms/${currentFormId}/fields/${fieldId}`
            : `/api/formbuild/forms/${currentFormId}/fields`,
          {
            method: field.id && !field.id.startsWith('new-') ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fieldData)
          }
        );

        if (!fieldResponse.ok) {
          console.error(`❌ Erro ao salvar campo ${field.label}:`, fieldResponse.statusText);
        }
      }

      console.log('✅ Formulário salvo com sucesso:', formDefinition);
      
      setStatusMessage({ 
        text: '✅ Formulário salvo com sucesso!', 
        type: 'success' 
      });

      // Atualizar ID do formulário se foi criação
      if (isNewForm && currentFormId) {
        // manter como string (IDs podem ser alfanuméricos)
        setFormDefinition(prev => ({ ...prev, id: currentFormId }));
      }

    } catch (error) {
      console.error('❌ Erro ao salvar formulário:', error);
      setStatusMessage({ 
        text: `❌ Erro ao salvar formulário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 
        type: 'error' 
      });
    }
  }, [formDefinition]);

  const [isDraggingFile, setIsDraggingFile] = React.useState(false);
  
  // ✅ Parser CSS: Extrair todas as classes e suas propriedades
  const parsearCSS = (cssContent: string): Map<string, Record<string, string>> => {
    const cssMap = new Map<string, Record<string, string>>();
    
    // Regex para extrair blocos CSS: .classe { propriedade: valor; }
    const cssBlockRegex = /([.#][\w-]+(?:\s*,\s*[.#][\w-]+)*)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = cssBlockRegex.exec(cssContent)) !== null) {
      const selectors = match[1].split(',').map(s => s.trim());
      const propsBlock = match[2];
      
      // Extrair propriedades individuais
      const props: Record<string, string> = {};
      const propRegex = /([\w-]+)\s*:\s*([^;]+);/g;
      let propMatch;
      
      while ((propMatch = propRegex.exec(propsBlock)) !== null) {
        props[propMatch[1].trim()] = propMatch[2].trim();
      }
      
      // Adicionar para cada seletor
      selectors.forEach(selector => {
        const existing = cssMap.get(selector) || {};
        cssMap.set(selector, { ...existing, ...props });
      });
    }
    
    console.log(`📋 CSS parseado: ${cssMap.size} classes/seletores encontrados`);
    return cssMap;
  };

  // ✅ Parser TSX: Extrair estrutura DOM (divs, inputs, abas)
  const parsearTSXDOM = (tsxContent: string) => {
    const structure: any = {
      abas: [],
      sections: [],
      fields: []
    };
    
    // 1. Detectar abas (constante ABAS_DISPONIVEIS)
    const abasMatch = tsxContent.match(/ABAS_DISPONIVEIS\s*=\s*\[([\s\S]*?)\]/);
    if (abasMatch) {
      const abasString = abasMatch[1];
      structure.abas = abasString.match(/['"]([^'"]+)['"]/g)?.map(s => s.replace(/['"]/g, '')) || [];
    }
    
    // 2. Detectar seções de renderização por aba
    structure.abas.forEach((abaLabel: string) => {
      // Procurar bloco: {abaSelecionada === 'Empresa' && ( ... )}
      const abaRegex = new RegExp(`abaSelecionada === ['"]${abaLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][\\s\\S]*?&&[\\s\\S]*?\\(([\\s\\S]*?)(?=\\{abaSelecionada|\\{\\s*/\\*|$)`, 'i');
      const abaMatch = tsxContent.match(abaRegex);
      
      if (abaMatch) {
        const abaContent = abaMatch[1];
        
        // Extrair div principal com className
        const divMainMatch = abaContent.match(/<div\s+className=["']([^"']+)["']/);
        const mainClassName = divMainMatch ? divMainMatch[1] : null;
        
        structure.sections.push({
          aba: abaLabel,
          mainClassName,
          content: abaContent.substring(0, 500) // Amostra
        });
      }
    });
    
    return structure;
  };

  // ✅ Função auxiliar: Detectar abas e layouts REAIS (engenharia reversa fiel GENÉRICA)
  const detectarAbas = (tsxContent: string, cssContent: string | null, allFields: Array<{name: string, label: string, type: string}>) => {
    const tabs: Array<{ 
      label: string; 
      fields: Array<{name: string, label: string, type: string, x: number, y: number, width: string, height: string}> 
    }> = [];
    
    // 1. Parsear CSS (se disponível)
    let cssMap = new Map<string, Record<string, string>>();
    if (cssContent) {
      cssMap = parsearCSS(cssContent);
      console.log('✅ CSS parseado com sucesso');
    } else {
      console.log('⚠️ Nenhum CSS fornecido - usando valores padrão');
    }
    
    // 2. Parsear estrutura DOM do TSX
    const domStructure = parsearTSXDOM(tsxContent);
    console.log('✅ Estrutura DOM parseada:', domStructure);
    
    // 3. Procurar por ABAS_DISPONIVEIS = ['Empresa', 'Peças', ...]
    const abasMatch = tsxContent.match(/ABAS_DISPONIVEIS\s*=\s*\[([\s\S]*?)\]/);
    if (!abasMatch) {
      console.log('ℹ️ Nenhuma constante ABAS_DISPONIVEIS encontrada');
      return tabs;
    }
    
    const abasString = abasMatch[1];
    const abasNomes = abasString.match(/['"]([^'"]+)['"]/g)?.map(s => s.replace(/['"]/g, '')) || [];
    
    console.log('🔍 Abas encontradas:', abasNomes);
    
    // 4. Para cada aba, detectar LAYOUT e calcular posições REAIS baseado no CSS
    abasNomes.forEach(abaLabel => {
      const abaKey = abaLabel.toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, '_'); // Espaços → underscore
      
      // Procurar LAYOUT_*_2COL, LAYOUT_*_3COL, etc.
      const layoutRegex = new RegExp(`const LAYOUT_${abaKey}[^=]*=\\s*\\{([\\s\\S]*?)\\};`, 'i');
      const layoutMatch = tsxContent.match(layoutRegex);
      
      if (layoutMatch) {
        console.log(`✅ Layout encontrado para aba "${abaLabel}"`);
        
        const layoutContent = layoutMatch[1];
        const fieldsWithPositions: Array<{name: string, label: string, type: string, x: number, y: number, width: string, height: string}> = [];
        
        // Detectar className principal da aba (ex: "form-grid-empresa-2col")
        const abaBlockRegex = new RegExp(`abaSelecionada === ['"]${abaLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][\\s\\S]*?className=["']([^"']+)["']`);
        const abaBlockMatch = tsxContent.match(abaBlockRegex);
        const mainClassName = abaBlockMatch ? `.${abaBlockMatch[1]}` : null;
        
        // Buscar propriedades CSS da classe principal
        const mainCSS = mainClassName ? cssMap.get(mainClassName) : null;
        const gridGap = mainCSS?.gap ? parseInt(mainCSS.gap) : 24; // Default 24px
        
        console.log(`  Classe principal: ${mainClassName}, gap: ${gridGap}px`);
        
        // Detectar estrutura: secao1: { left: [...], right: [...] }
        const secaoRegex = /(\w+):\s*\{[\s\S]*?left:\s*\[([\s\S]*?)\][\s\S]*?right:\s*\[([\s\S]*?)\]/g;
        let secaoMatch;
        let currentY = 80; // Posição Y inicial (após abas)
        
        // Buscar largura das colunas no CSS
        const colEsqCSS = cssMap.get('.form-coluna-esq') || {};
        const fieldGap = colEsqCSS.gap ? parseInt(colEsqCSS.gap) : 12; // Default 12px
        
        while ((secaoMatch = secaoRegex.exec(layoutContent)) !== null) {
          const leftFields = secaoMatch[2].match(/['"]([^'"]+)['"]/g)?.map(s => s.replace(/['"]/g, '')) || [];
          const rightFields = secaoMatch[3].match(/['"]([^'"]+)['"]/g)?.map(s => s.replace(/['"]/g, '')) || [];
          
          console.log(`  Seção: ${leftFields.length} campos (esquerda), ${rightFields.length} campos (direita)`);
          
          // COLUNA ESQUERDA: x=20, gap vertical do CSS
          leftFields.forEach((fieldName, index) => {
            const fieldData = allFields.find(f => f.name === fieldName);
            if (fieldData) {
              fieldsWithPositions.push({
                ...fieldData,
                x: 20, // Coluna esquerda
                y: currentY + (index * (40 + fieldGap)), // 40px altura + gap do CSS
                width: '476px', // Largura calculada (50% - gap/2)
                height: '40px'
              });
            }
          });
          
          // COLUNA DIREITA: x=500 + gridGap, gap vertical do CSS
          rightFields.forEach((fieldName, index) => {
            const fieldData = allFields.find(f => f.name === fieldName);
            if (fieldData) {
              fieldsWithPositions.push({
                ...fieldData,
                x: 20 + 476 + gridGap, // Coluna direita (esquerda + largura + gap)
                y: currentY + (index * (40 + fieldGap)),
                width: '476px',
                height: '40px'
              });
            }
          });
          
          // Avançar Y para próxima seção
          const maxFields = Math.max(leftFields.length, rightFields.length);
          currentY += (maxFields * (40 + fieldGap)) + 20; // 20px entre seções
        }
        
        if (fieldsWithPositions.length > 0) {
          tabs.push({ label: abaLabel, fields: fieldsWithPositions });
          console.log(`✅ Aba "${abaLabel}": ${fieldsWithPositions.length} campos com posições do CSS`);
        }
      } else {
        // Fallback: procurar campos sem layout definido
        const camposAba = allFields.filter(field => {
          const arrayName = `CAMPOS_${abaKey}_INLINE`;
          const regex = new RegExp(`${arrayName}[\\s\\S]*?field:\\s*['"]${field.name}['"]`);
          return regex.test(tsxContent);
        });
        
        if (camposAba.length > 0) {
          // Layout cascata simples (1 coluna)
          const fieldsWithPositions = camposAba.map((field, index) => ({
            ...field,
            x: 20,
            y: 80 + (index * 52),
            width: '476px',
            height: '40px'
          }));
          
          tabs.push({ label: abaLabel, fields: fieldsWithPositions });
          console.log(`⚠️ Aba "${abaLabel}": ${camposAba.length} campos (layout cascata - sem LAYOUT definido)`);
        }
      }
    });
    
    return tabs;
  };
  
  const handleImportIMP = useCallback((file: File) => {
    console.log('🚀 handleImportIMP chamado com arquivo:', file.name);
    
    setStatusMessage({ 
      text: `⏳ Processando arquivo .IMP ${file.name}...`, 
      type: 'info' 
    });
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      
      try {
        console.log('📁 Arquivo .IMP lido com sucesso:', file.name);
        
        const detectedFields: FormField[] = [];
        
        // Fase 1: Análise do "Form Data" (Campos e Tipos)
        // Padrão: Field "NOME-CAMPO" Character(n) ou Decimal(p,q) ou Integer(n)
        const fieldMatches = Array.from(content.matchAll(/Field\s+["']([^"']+)["']\s+([A-Za-z]+)\((\d+)(?:,(\d+))?\)/g));
        
        // Fase 2: Análise de Objetos (Posições e Labels)
        // Padrão: Text "Label" At (Row, Col)
        // Padrão: Entry-Field "Field" At (Row, Col) Size (Height, Width)
        
        let yOffset = 20;
        fieldMatches.forEach((match, index) => {
          const originalName = match[1];
          const type = match[2];
          const length = parseInt(match[3]);
          const precision = match[4] ? parseInt(match[4]) : 0;
          
          // Mapeamento de Tipos conforme PADRAO_GERACAO_FORMULARIO_IMP.md
          let formFieldType: FormField['type'] = 'text';
          if (precision > 0 || type === 'Decimal' || type === 'Integer') {
            formFieldType = 'number';
          } else if (type === 'Character' && length === 1) {
            formFieldType = 'checkbox';
          } else if (originalName.toLowerCase().includes('data') || originalName.toLowerCase().includes('dt')) {
            formFieldType = 'date';
          }
          
          detectedFields.push({
            id: `imp_${Date.now()}_${index}`,
            name: originalName.replace(/-/g, '_').toLowerCase(),
            label: originalName,
            type: formFieldType,
            required: content.includes(`Validation "${originalName}" "OBR"`),
            placeholder: `Digite ${originalName.toLowerCase()}`,
            order: index,
            width: '300px',
            height: '38px',
            position: { x: 20, y: yOffset },
            labelPosition: 'top'
          });
          
          yOffset += 80;
        });
        
        if (detectedFields.length > 0) {
          setFormDefinition(prev => ({
            ...prev,
            formTitle: file.name.replace(/\.imp$/i, ''),
            fields: detectedFields
          }));
          
          setMode('design');
          setStatusMessage({ 
            text: `✅ ${detectedFields.length} campos importados do .IMP`, 
            type: 'success' 
          });
          
          alert(`✅ IMPORTAÇÃO .IMP CONCLUÍDA!\n\n📋 ${detectedFields.length} campos detectados.\n\n🎨 Layout inicial em cascata gerado.\n\nClique OK para editar no Design!`);
        } else {
          throw new Error('Nenhum campo compatível encontrado no arquivo .IMP');
        }
        
      } catch (error) {
        console.error('❌ Erro ao parsear arquivo .IMP:', error);
        setStatusMessage({ 
          text: `❌ Erro ao processar .IMP: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 
          type: 'error' 
        });
        alert(`❌ Erro ao processar arquivo .IMP!\n\nO arquivo pode estar em um formato DialogSystem não suportado.`);
      }
    };
    
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback((file: File) => {
    console.log('🚀 handleImport chamado com arquivo:', file.name);
    
    if (file.name.toLowerCase().endsWith('.imp')) {
      handleImportIMP(file);
      return;
    }
    
    // Mostrar mensagem imediata de processamento
    setStatusMessage({ 
      text: `⏳ Processando arquivo ${file.name}...`, 
      type: 'info' 
    });
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const tsxContent = e.target?.result as string;
      
      try {
        // Parser melhorado: detectar arrays de campos estilo SPDealer
        console.log('📁 Arquivo TSX lido com sucesso:', file.name);
        console.log('📄 Tamanho:', tsxContent.length, 'caracteres');
        
        // NOVO: Tentar buscar CSS correspondente (mesmo nome, extensão .css)
        const cssFileName = file.name.replace(/\.tsx?$/, '.css');
        let cssContent: string | null = null;
        
        try {
          // Tentar ler CSS do mesmo diretório (se usuário arrastar pasta ou selecionar múltiplos)
          // Ou pedir ao usuário para selecionar CSS
          console.log(`🔍 Procurando arquivo CSS: ${cssFileName}`);
          
          // TODO: Implementar seleção de CSS (por enquanto, continuar sem CSS)
          console.log('⚠️ CSS não implementado ainda - usando apenas TSX');
        } catch (cssError) {
          console.log('⚠️ Erro ao buscar CSS:', cssError);
        }
        
        const detectedFields: Array<{name: string, label: string, type: string}> = [];
        
        // 1. Detectar arrays de campos estilo: { field: 'NOME_CAMPO', label: 'Label', ... }
        const fieldArrayMatches = tsxContent.matchAll(/\{\s*field:\s*['"]([^'"]+)['"],\s*label:\s*['"]([^'"]+)['"]/g);
        for (const match of fieldArrayMatches) {
          const fieldName = match[1];
          const fieldLabel = match[2];
          if (!detectedFields.find(f => f.name === fieldName)) {
            detectedFields.push({ name: fieldName, label: fieldLabel, type: 'array-definition' });
          }
        }
        
        // 2. Detectar <input name="..." /> ou <Input name="..." />
        const inputMatches = tsxContent.matchAll(/<(?:input|Input)[^>]*name=["']([^"']+)["'][^>]*>/g);
        for (const match of inputMatches) {
          if (!detectedFields.find(f => f.name === match[1])) {
            detectedFields.push({ name: match[1], label: match[1], type: 'input-tag' });
          }
        }
        
        // 3. Detectar componentes React customizados com name prop
        const componentMatches = tsxContent.matchAll(/<[A-Z][a-zA-Z]*[^>]*name=["']([^"']+)["'][^>]*>/g);
        for (const match of componentMatches) {
          if (!detectedFields.find(f => f.name === match[1])) {
            detectedFields.push({ name: match[1], label: match[1], type: 'component' });
          }
        }
        
        // 4. Detectar useState para campos de formulário
        const stateMatches = tsxContent.matchAll(/\[(\w+),\s*set\w+\]\s*=\s*useState/g);
        for (const match of stateMatches) {
          const stateName = match[1];
          if (stateName.includes('dados') || stateName.includes('form') || stateName.includes('campo')) {
            if (!detectedFields.find(f => f.name === stateName)) {
              detectedFields.push({ name: stateName, label: stateName, type: 'state' });
            }
          }
        }
        
        console.log('🔍 Total de campos detectados:', detectedFields.length);
        console.log('📋 Detalhes dos campos:', detectedFields);
        
        if (detectedFields.length > 0) {
          // Agrupar por tipo
          const byType = detectedFields.reduce((acc, field) => {
            acc[field.type] = (acc[field.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const summary = Object.entries(byType)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ');
          
          // Converter campos detectados em FormFields
          const importedFields: FormField[] = detectedFields.map((field, index) => ({
            id: `imported_${Date.now()}_${index}`,
            name: field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            label: field.label,
            type: 'text',
            required: false,
            placeholder: `Digite ${field.label.toLowerCase()}`,
            order: index,
            width: '300px',
            height: '38px',
            position: {
              x: 20,
              y: 20 + (index * 80)
            },
            labelPosition: 'top',
            labelPadding: '8px'
          }));
          
          console.log('✅ Convertidos em FormFields:', importedFields.length);
          
          // NOVO: Detectar estrutura de abas com POSIÇÕES REAIS (engenharia reversa GENÉRICA)
          const tabsDetectadas = detectarAbas(tsxContent, cssContent, detectedFields);
          
          let fieldsToAdd: FormField[] = [];
          
          if (tabsDetectadas.length > 0) {
            // CASO 1: Arquivo com ABAS (ParametrosGerais.tsx)
            console.log('✅ Abas detectadas:', tabsDetectadas.length, tabsDetectadas.map(t => t.label));
            
            // Criar componente Tabs com todas as abas
            const tabsComponent: FormField = {
              id: `tabs_${Date.now()}`,
              name: 'tabs_principal',
              label: 'Abas do Formulário',
              type: 'tabs' as const,
              required: false,
              order: 0,
              width: '100%',
              height: 'auto',
              position: { x: 20, y: 20 },
              labelPosition: 'top' as const,
              tabs: tabsDetectadas.map((tab, tabIndex) => ({
                id: `tab_${tabIndex}`,
                label: tab.label,
                fieldIds: [] as string[]
              }))
            };
            
            // Criar campos de cada aba com POSIÇÕES EXATAS do código original
            tabsDetectadas.forEach((tab, tabIndex) => {
              tab.fields.forEach((field, fieldIndex) => {
                const formField: FormField = {
                  id: `field_tab${tabIndex}_${fieldIndex}`,
                  name: field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  label: field.label,
                  type: field.type === 'checkbox' ? 'checkbox' : 'text',
                  required: false,
                  placeholder: field.type === 'checkbox' ? undefined : `Digite ${field.label.toLowerCase()}`,
                  order: fieldIndex,
                  width: field.width,  // Largura do CSS parseado
                  height: field.height, // Altura do CSS parseado
                  position: {
                    x: field.x, // Posição X do layout
                    y: field.y  // Posição Y do layout
                  },
                  labelPosition: 'left' as const, // Labels inline conforme CSS
                  labelPadding: '8px'
                };
                
                fieldsToAdd.push(formField);
                
                // Adicionar ID do campo à aba
                if (tabsComponent.tabs && tabsComponent.tabs[tabIndex]) {
                  tabsComponent.tabs[tabIndex].fieldIds.push(formField.id);
                }
              });
            });
            
            // Adicionar componente Tabs primeiro
            fieldsToAdd.unshift(tabsComponent);
            
          } else {
            // CASO 2: Arquivo SEM ABAS (layout simples)
            console.log('ℹ️ Nenhuma aba detectada - usando layout cascata simples');
            fieldsToAdd = importedFields;
          }
          
          // Adicionar campos ao formulário
          setFormDefinition(prev => ({
            ...prev,
            formTitle: file.name.replace('.tsx', ''),
            fields: [...fieldsToAdd]
          }));
          
          // Mudar para modo Design
          setMode('design');
          
          const totalCampos = fieldsToAdd.filter(f => f.type !== 'tabs').length;
          const mensagem = tabsDetectadas.length > 0
            ? `✅ ENGENHARIA REVERSA CONCLUÍDA!\n\n📋 ${tabsDetectadas.length} aba(s) detectada(s):\n${tabsDetectadas.map(t => `  • ${t.label}: ${t.fields.length} campos`).join('\n')}\n\n🎨 Layout original preservado:\n  • Posições X,Y calculadas do código\n  • Larguras conforme CSS real\n  • Labels inline (left)\n\n🔧 Total: ${totalCampos} campos\n\nClique OK para editar no Design!`
            : `✅ ${detectedFields.length} campo(s) detectado(s) e adicionados ao canvas!\n\n🎨 Clique OK para ver no modo Design!`;
          
          setStatusMessage({ 
            text: `✅ ${totalCampos} campo(s) importado(s)`, 
            type: 'success' 
          });
          
          alert(mensagem);
        } else {
          setStatusMessage({ 
            text: `⚠️ Arquivo ${file.name} importado (${tsxContent.length} caracteres), mas nenhum campo foi detectado. Verifique o console.`, 
            type: 'info' 
          });
          
          alert(`⚠️ Nenhum campo detectado!\n\n📁 Arquivo: ${file.name}\n📄 Tamanho: ${tsxContent.length} caracteres\n\n💡 O parser procura por:\n  • Arrays: { field: 'NOME', label: 'Label' }\n  • Tags: <input name="..."/>\n  • Componentes: <TextField name="..."/>\n  • State: useState hooks\n\nVerifique o console do navegador (F12) para ver o conteúdo.`);
        }
      } catch (error) {
        console.error('❌ Erro ao parsear arquivo:', error);
        setStatusMessage({ 
          text: `❌ Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 
          type: 'error' 
        });
        
        alert(`❌ Erro ao processar arquivo!\n\n${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique o console do navegador (F12) para mais detalhes.`);
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ Erro ao ler arquivo:', error);
      setStatusMessage({ 
        text: '❌ Erro ao ler arquivo. Verifique se o arquivo está acessível.', 
        type: 'error' 
      });
      alert('❌ Erro ao ler arquivo!\n\nVerifique se o arquivo está acessível e não está corrompido.');
    };
    
    reader.readAsText(file);
  }, []);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <Container>
      {/* HEADER */}
      <Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={logoSrc}
            alt="FormBuilder Logo"
            style={{ width: 56, height: 56, objectFit: 'contain' }}
            onError={(e) => {
              const next = logoAttemptIndex + 1;
              if (next < logoCandidates.length) {
                setLogoAttemptIndex(next);
                setLogoSrc(logoCandidates[next]);
              } else {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }
            }}
          />
          <Title>FormBuilder v2.0 - {formDefinition.formTitle}</Title>
          <div style={{ marginLeft: 8, height: '56px', display: 'flex', alignItems: 'center' }}>
            {savedForms.length === 0 ? (
              <small style={{ color: 'var(--muted, #6c757d)' }}>Nenhum formulário salvo</small>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', height: '100%' }}>
                <select
                  id="savedFormSelect"
                  value={selectedSavedFormId || savedForms[0].id}
                  onChange={(e) => setSelectedSavedFormId(e.target.value)}
                  style={{ height: 56, fontSize: 16, padding: '6px 10px' }}
                >
                  {savedForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button title="Abrir formulário" onClick={() => selectedSavedFormId && loadFormById(selectedSavedFormId)} style={{ height: 56, padding: '0 12px' }}>Abrir</button>
              </div>
            )}
          </div>
        </div>
        <Toolbar>
          <Button onClick={() => setMode('design')}>🎨 Design</Button>
          <Button onClick={() => setMode('preview')}>👁️ Preview</Button>
          <Button onClick={handleGenerateCode}>⚙️ Gerar Código</Button>
          <Button onClick={() => setMode('import')}>📁 Importar</Button>
          <Button $variant="primary" onClick={handleSave}>💾 Salvar</Button>
        </Toolbar>

        {savedForms.length > 0 && (
          <div style={{ marginTop: 8, maxHeight: 112, overflowY: 'auto' }}>
            <strong>Formulários gerados:</strong>
            <ul style={{ margin: 6, paddingLeft: 18 }}>
              {savedForms.map((f) => (
                <li key={f.id} style={{ lineHeight: '1.6' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); loadFormById(f.id); }}>{f.name}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Header>

      {/* MAIN CONTENT */}
      <MainContent>
        {/* MODO DESIGN */}
        {mode === 'design' && (
          <>
            {/* SIDEBAR - Campos Disponíveis */}
            <Sidebar $collapsed={sidebarCollapsed}>
              {/* 🆕 PROPRIEDADES DO FORMULÁRIO (11 JAN 2026) */}
              {!sidebarCollapsed && (
                <div style={{ 
                  marginBottom: '24px',
                  padding: '12px',
                  background: '#f8f9fa',
                  border: '1px solid var(--border-color, #dee2e6)',
                  borderRadius: '6px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: formPropsCollapsed ? '0' : '12px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => setFormPropsCollapsed(!formPropsCollapsed)}
                  >
                    <SectionTitle className="section-title" style={{ margin: 0 }}>
                      ⚙️ Propriedades do Formulário
                    </SectionTitle>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#6c757d',
                        padding: '4px'
                      }}
                      title={formPropsCollapsed ? 'Expandir' : 'Colapsar'}
                    >
                      {formPropsCollapsed ? '▼' : '▲'}
                    </button>
                  </div>
                  
                  {!formPropsCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Nome do Formulário */}
                      <div>
                        <label style={{ 
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#495057',
                          marginBottom: '4px'
                        }}>
                          Nome do Formulário
                        </label>
                        <input
                          type="text"
                          value={newFormName}
                          onChange={(e) => setNewFormName(e.target.value)}
                          placeholder="ex: form_clientes"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      
                      {/* Lista de Tabelas */}
                      <div>
                        <label style={{ 
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#495057',
                          marginBottom: '4px'
                        }}>
                          Tabela para Importar
                        </label>
                        <select
                          value={selectedTable?.table_name || ''}
                          onChange={handleTableSelect}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Selecione uma tabela...</option>
                          {availableTables.map((table) => (
                            <option key={table.table_name} value={table.table_name}>
                              {table.table_label || table.table_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Botão Importar */}
                      <button
                        onClick={() => {
                          if (selectedTable) {
                            handleImportFromTable(selectedTable.table_name || '');
                          } else {
                            setStatusMessage({ 
                              text: '⚠️ Selecione uma tabela primeiro', 
                              type: 'error' 
                            });
                          }
                        }}
                        disabled={!selectedTable}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          background: selectedTable ? '#007bff' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: selectedTable ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s'
                        }}
                        title={selectedTable ? `Importar campos de ${selectedTable.table_label}` : 'Selecione uma tabela primeiro'}
                      >
                        📥 Importar Campos
                      </button>
                      
                      {/* Checkbox Aba Localizar */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginTop: '4px'
                      }}>
                        <input
                          type="checkbox"
                          id="enableSearchTab"
                          checked={enableSearchTab}
                          onChange={(e) => setEnableSearchTab(e.target.checked)}
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            cursor: 'pointer' 
                          }}
                        />
                        <label 
                          htmlFor="enableSearchTab"
                          style={{ 
                            fontSize: '12px',
                            color: '#495057',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          Renderizar Aba Localizar
                        </label>
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#6c757d',
                        fontStyle: 'italic',
                        marginTop: '-8px',
                        paddingLeft: '24px'
                      }}>
                        Desmarque para formulários de painel (Cards, Gráficos)
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* 📦 COMPONENTES DISPONÍVEIS */}
              <div style={{ 
                display: 'flex', 
                justifyContent: sidebarCollapsed ? 'center' : 'space-between', 
                alignItems: 'center',
                marginBottom: sidebarCollapsed ? '16px' : '12px',
                borderBottom: sidebarCollapsed ? 'none' : '1px solid var(--border-color, #dee2e6)',
                paddingBottom: sidebarCollapsed ? '0' : '8px'
              }}>
                {!sidebarCollapsed && <SectionTitle className="section-title">📦 Componentes Disponíveis</SectionTitle>}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color, #dee2e6)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: sidebarCollapsed ? '8px 12px' : '4px 8px',
                    fontSize: '16px',
                    color: '#6c757d',
                    transition: 'all 0.2s'
                  }}
                  title={sidebarCollapsed ? 'Expandir painel' : 'Colapsar painel'}
                >
                  {sidebarCollapsed ? '▶' : '◀'}
                </button>
              </div>
              
              {loadingComponents ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  <div>⏳ Carregando componentes...</div>
                </div>
              ) : (
                <FieldList>
                  {(availableComponents.length > 0 ? 
                    availableComponents.map((comp) => ({
                      type: comp.component_type,
                      label: comp.component_name,
                      icon: comp.component_icon
                    })) : 
                    FIELD_TYPES.map(({ type, label, icon }) => ({ type, label, icon }))
                  ).map(({ type, label, icon }) => (
                    <FieldItem
                      key={type}
                      onClick={() => handleAddField(type as any)}
                      title={`Adicionar componente ${label}`}
                    >
                      <FieldIcon>{icon}</FieldIcon>
                      {!sidebarCollapsed && <FieldLabel className="field-label">{label}</FieldLabel>}
                    </FieldItem>
                  ))}
                </FieldList>
              )}
            </Sidebar>

            {/* WORK AREA - Canvas */}
            <WorkArea>
              {statusMessage && (
                <StatusMessage $type={statusMessage.type}>
                  {statusMessage.text}
                </StatusMessage>
              )}
              
              <Canvas 
                $columns={formDefinition.layout.columns}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const fieldId = e.dataTransfer.getData('fieldId');
                  const offsetX = parseFloat(e.dataTransfer.getData('offsetX') || '0');
                  const offsetY = parseFloat(e.dataTransfer.getData('offsetY') || '0');
                  
                  if (fieldId) {
                    const canvasRect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, e.clientX - canvasRect.left - offsetX);
                    const y = Math.max(0, e.clientY - canvasRect.top - offsetY);
                    
                    handleFieldDrag(fieldId, x, y);
                  }
                }}
              >
                {(() => {
                  // Helper: Verificar se um campo pertence a alguma tab
                  const fieldsInTabs = new Set<string>();
                  formDefinition.fields.forEach(field => {
                    if (field.type === 'tabs' && field.tabs) {
                      field.tabs.forEach(tab => {
                        tab.fieldIds.forEach(id => fieldsInTabs.add(id));
                      });
                    }
                  });
                  
                  // Renderizar apenas campos que NÃO estão dentro de tabs
                  return formDefinition.fields
                    .filter(field => !fieldsInTabs.has(field.id)) // ✅ Excluir campos que estão em tabs
                    .sort((a, b) => a.order - b.order)
                    .map(field => {
                    // Renderizar CONTAINER
                    if (field.type === 'container' || field.type === 'bevel') {
                      const childFieldsData = formDefinition.fields.filter(f => 
                        field.childFields?.includes(f.id)
                      );
                      
                      const containerX = field.position?.x || 0;
                      const containerY = field.position?.y || 0;
                      const containerWidth = field.width || '400px';
                      const containerHeight = field.height || 'auto';
                      
                      return (
                        <FieldContainer
                          key={field.id}
                          $selected={selectedField?.id === field.id}
                          $style={field.containerStyle}
                          onClick={() => setSelectedField(field)}
                          onContextMenu={(e) => handleContextMenu(e, field)}
                          draggable
                          style={{
                            position: 'absolute',
                            left: `${containerX}px`,
                            top: `${containerY}px`,
                            width: containerWidth,
                            height: containerHeight,
                            minWidth: '300px',
                            minHeight: '150px'
                          }}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('fieldId', field.id);
                            e.dataTransfer.setData('offsetX', String(e.clientX - e.currentTarget.getBoundingClientRect().left));
                            e.dataTransfer.setData('offsetY', String(e.clientY - e.currentTarget.getBoundingClientRect().top));
                            setSelectedField(field);
                          }}
                        >
                          <ContainerHeader>
                            <div>
                              <span style={{ fontSize: '12px', color: '#6c757d', marginRight: '8px' }}>
                                {field.type === 'bevel' ? '🖼️' : '📦'}
                              </span>
                              {field.containerHeader || 'Container sem título'}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveField(field.id);
                                }}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer', 
                                  fontSize: '16px',
                                  padding: '0'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </ContainerHeader>
                          
                          <ContainerDropZone
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.add('drag-over');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('drag-over');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.remove('drag-over');
                              const draggedFieldId = e.dataTransfer.getData('fieldId');
                              
                              if (draggedFieldId && draggedFieldId !== field.id) {
                                // Adicionar campo ao container
                                const updatedChildFields = [
                                  ...(field.childFields || []),
                                  draggedFieldId
                                ];
                                handleUpdateField(field.id, { childFields: updatedChildFields });
                              }
                            }}
                          >
                            {childFieldsData.map(childField => {
                              const childElement = renderFieldComponent(childField);
                              
                              return (
                                <div 
                                  key={childField.id}
                                  style={{ 
                                    padding: '8px',
                                    marginBottom: '8px',
                                    background: 'white',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px',
                                    position: 'relative'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedField(childField);
                                  }}
                                  onContextMenu={(e) => {
                                    e.stopPropagation();
                                    handleContextMenu(e, childField);
                                  }}
                                >
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>{childField.label}</strong>
                                    {childField.required && <span style={{ color: 'red' }}> *</span>}
                                  </div>
                                  {childElement}
                                </div>
                              );
                            })}
                            
                            {/* Resize handle para container */}
                            {selectedField?.id === field.id && (
                              <div
                                draggable={false}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleResizeStart(e, field);
                                }}
                                style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  right: '4px',
                                  fontSize: '14px',
                                  color: '#000',
                                  cursor: 'nwse-resize',
                                  fontWeight: 'bold',
                                  userSelect: 'none',
                                  padding: '4px',
                                  lineHeight: '1',
                                  zIndex: 100,
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  borderRadius: '2px',
                                  border: '1px solid #dee2e6',
                                  pointerEvents: 'auto'
                                }}
                                title="Arrastar para redimensionar"
                              >
                                ⤡
                              </div>
                            )}
                          </ContainerDropZone>
                        </FieldContainer>
                      );
                    }
                    
                    // Renderizar TABS
                    if (field.type === 'tabs') {
                      const currentActiveTab = activeTabsState[field.id] || field.activeTab || field.tabs?.[0]?.id;
                      
                      return (
                        <TabsContainer
                          key={field.id}
                          onClick={() => setSelectedField(field)}
                          onContextMenu={(e) => handleContextMenu(e, field)}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('fieldId', field.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderTop = '2px solid #0d6efd';
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.borderTop = '1px solid transparent';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderTop = '1px solid transparent';
                            const draggedFieldId = e.dataTransfer.getData('fieldId');
                            if (draggedFieldId && draggedFieldId !== field.id) {
                              handleReorderFields(draggedFieldId, field.id);
                            }
                          }}
                          style={{ gridColumn: field.gridColumn || 'span 2' }}
                        >
                          <TabsNavigation $orientation={field.tabsOrientation}>
                            {field.tabs?.map(tab => (
                              <TabButton
                                key={tab.id}
                                $active={currentActiveTab === tab.id}
                                onClick={() => {
                                  console.log(`🔄 Aba clicada: "${tab.label}" (${tab.id})`, {
                                    fieldIds: tab.fieldIds,
                                    totalFieldIds: tab.fieldIds?.length || 0
                                  });
                                  setActiveTabsState(prev => ({ ...prev, [field.id]: tab.id }));
                                  handleUpdateField(field.id, { activeTab: tab.id });
                                }}
                              >
                                {tab.icon && <span style={{ marginRight: '8px' }}>{tab.icon}</span>}
                                {tab.label}
                              </TabButton>
                            ))}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveField(field.id);
                              }}
                              style={{ 
                                marginLeft: 'auto',
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                fontSize: '16px',
                                padding: '8px'
                              }}
                              title="Remover Tabs"
                            >
                              🗑️
                            </button>
                          </TabsNavigation>
                          
                          {field.tabs?.map(tab => {                            return (
                            <TabContentArea 
                              key={tab.id}
                              style={{ display: currentActiveTab === tab.id ? 'block' : 'none' }}
                            >
                              <TabDropZone
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.add('drag-over');
                                }}
                                onDragLeave={(e) => {
                                  e.currentTarget.classList.remove('drag-over');
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.currentTarget.classList.remove('drag-over');
                                  const draggedFieldId = e.dataTransfer.getData('fieldId');
                                  
                                  if (draggedFieldId && draggedFieldId !== field.id) {
                                    // Adicionar campo à aba
                                    const updatedTabs = field.tabs?.map(t => 
                                      t.id === tab.id 
                                        ? { ...t, fieldIds: [...t.fieldIds, draggedFieldId] }
                                        : t
                                    );
                                    handleUpdateField(field.id, { tabs: updatedTabs });
                                  }
                                }}
                              >
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, 1fr)',
                                  gap: '16px 24px',
                                  padding: '16px'
                                }}>
                                  {formDefinition.fields
                                    .filter(f => tab.fieldIds.includes(f.id))
                                    .map(tabField => {
                                      const tabFieldElement = renderFieldComponent(tabField);
                                      
                                      return (
                                        <div 
                                          key={tabField.id}
                                          className="form-group-horizontal"
                                          style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px',
                                            background: 'white',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '4px'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedField(tabField);
                                          }}
                                          onContextMenu={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e, tabField);
                                          }}
                                        >
                                          <label style={{
                                            minWidth: '160px',
                                            maxWidth: '160px',
                                            fontWeight: '500',
                                            fontSize: '13px',
                                            color: '#333',
                                            textAlign: 'right',
                                            paddingRight: '8px'
                                          }}>
                                            {tabField.label}
                                            {tabField.required && <span style={{ color: 'red' }}> *</span>}
                                          </label>
                                          <div style={{ flex: 1 }}>
                                            {tabFieldElement}
                                          </div>
                                          <span style={{ 
                                            fontSize: '11px', 
                                            color: '#6c757d',
                                            minWidth: '50px'
                                          }}>
                                            ({tabField.type})
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </TabDropZone>
                            </TabContentArea>
                            );
                          })}
                        </TabsContainer>
                      );
                    }
                    
                    // Renderizar CAMPO NORMAL
                    const labelPosition = field.labelPosition || 'top';
                    const labelPadding = field.labelPadding || '4px';
                    const fieldWidth = field.width || '300px';
                    const fieldHeight = field.height || '38px';
                    
                    const labelElement = (
                      <label style={{ 
                        display: 'block',
                        fontWeight: '500',
                        fontSize: '14px',
                        color: 'var(--text-primary, #212529)',
                        margin: 0,
                        padding: 0
                      }}>
                        {field.label}
                        {field.required && <span style={{ color: 'red' }}> *</span>}
                      </label>
                    );
                    
                    // 🆕 Renderizar componente especializado baseado no tipo (11 JAN 2026)
                    const renderFieldComponent = (field: FormField): React.ReactNode => {
                      const visualConfig = field.visual_config || {};
                      const commonStyle = {
                        width: field.width || '300px',
                        height: field.height || '38px',
                        boxSizing: 'border-box' as const
                      };

                      switch (field.type) {
                        // 📅 DAYPILOT CALENDAR
                        case 'daypilot_calendar':
                          return (
                            <DayPilotCalendarWrapper
                              componentType="calendar"
                              viewType={visualConfig.viewType || 'Week'}
                              theme={visualConfig.theme || 'calendar_white'}
                              startDate={visualConfig.startDate}
                              events={visualConfig.events || []}
                              onEventClick={(e: CalendarEvent) => console.log('Event clicked:', e)}
                              onEventCreate={(start: string, end: string) => console.log('Create:', start, end)}
                              height="600px"
                            />
                          );

                        // 📋 KANBAN BOARD (Preview)
                        case 'kanban':
                          return (
                            <div style={{ ...commonStyle, height: '500px', border: '1px solid #dee2e6', borderRadius: '4px', padding: '12px' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>📋 Kanban Board (Preview)</div>
                              <div style={{ display: 'flex', gap: '12px', height: 'calc(100% - 30px)' }}>
                                {['To Do', 'In Progress', 'Done'].map((col, idx) => (
                                  <div key={idx} style={{ flex: 1, background: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>{col}</div>
                                    <div style={{ background: 'white', padding: '6px', borderRadius: '4px', fontSize: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                      Task {idx + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );

                        // 🃏 CARD (Bootstrap Grid)
                        case 'card':
                          return (
                            <div style={{ ...commonStyle, height: 'auto', minHeight: '200px', border: '1px solid #dee2e6', borderRadius: '4px', padding: '16px' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '12px' }}>🃏 Card Grid (Preview)</div>
                              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visualConfig.columns || 3}, 1fr)`, gap: '12px' }}>
                                {[1, 2, 3].map((i) => (
                                  <div key={i} style={{ background: '#f8f9fa', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Card {i}</div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>Conteúdo</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );

                        // 📤 UPLOAD
                        case 'upload':
                          return (
                            <div style={{ ...commonStyle, height: '150px', border: '2px dashed #dee2e6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📤</div>
                                <div style={{ fontSize: '13px', color: '#6c757d' }}>Arraste arquivos ou clique</div>
                                <div style={{ fontSize: '11px', color: '#adb5bd', marginTop: '4px' }}>
                                  {visualConfig.upload_mode === 'multiple' ? 'Múltiplos' : 'Único'}
                                </div>
                              </div>
                            </div>
                          );

                        // 🔔 AVISOS
                        case 'avisos':
                          return (
                            <div style={{ ...commonStyle, height: '200px', border: '1px solid #ffc107', borderRadius: '4px', background: '#fff3cd', padding: '12px' }}>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🔔</span> Sistema de Avisos
                              </div>
                              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', fontSize: '12px', marginBottom: '6px' }}>⚠️ Aviso 1</div>
                              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', fontSize: '12px' }}>ℹ️ Aviso 2</div>
                            </div>
                          );

                        // 🖼️ IMAGE + CAMERA
                        case 'image':
                          return (
                            <div style={{ ...commonStyle, height: '300px', border: '1px solid #dee2e6', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#f8f9fa' }}>
                              <div style={{ flex: 1, background: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🖼️</div>
                              {visualConfig.enable_camera && (
                                <button style={{ padding: '8px 16px', border: '1px solid #007bff', background: '#007bff', color: 'white', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>📸 Tirar Foto</button>
                              )}
                            </div>
                          );

                        // 🖼️ GALLERY
                        case 'gallery':
                          return (
                            <div style={{ ...commonStyle, height: '400px', border: '1px solid #dee2e6', borderRadius: '4px', padding: '12px' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>🖼️ Galeria (Preview)</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', height: 'calc(100% - 30px)', overflow: 'auto' }}>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                  <div key={i} style={{ aspectRatio: '1', background: '#e9ecef', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🖼️</div>
                                ))}
                              </div>
                            </div>
                          );

                        // ✏️ TEXTAREA
                        case 'textarea':
                        case 'text_long':
                          return (
                            <textarea
                              placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}`}
                              style={{ width: field.width || '300px', height: field.height || '120px', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                              disabled
                            />
                          );

                        // ☑️ CHECKBOX
                        case 'checkbox':
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} disabled />
                              <span style={{ fontSize: '14px', color: '#212529' }}>{field.placeholder || 'Opção'}</span>
                            </div>
                          );

                        // 📋 SELECT
                        case 'select':
                          return (
                            <select style={{ width: field.width || '300px', height: field.height || '38px', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} disabled>
                              <option>Selecione...</option>
                              <option>Opção 1</option>
                              <option>Opção 2</option>
                            </select>
                          );

                        // 📅 DATE
                        case 'date':
                          return <input type="date" style={{ width: field.width || '200px', height: field.height || '38px', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} disabled />;

                        // ⏰ TIME
                        case 'time':
                          return <input type="time" style={{ width: field.width || '150px', height: field.height || '38px', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} disabled />;

                        // 🔢 NUMBER
                        case 'number':
                          return <input type="number" placeholder={field.placeholder || '0'} style={{ width: field.width || '150px', height: field.height || '38px', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '14px', textAlign: 'right', boxSizing: 'border-box' }} disabled />;

                        // ✉️ EMAIL
                        case 'email':
                          return <input type="email" placeholder={field.placeholder || 'email@exemplo.com'} style={{ width: field.width || '300px', height: field.height || '38px', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} disabled />;

                        // 🔘 BUTTON
                        case 'button':
                          return (
                            <button style={{ width: field.width || 'auto', height: field.height || '38px', padding: '8px 24px', border: 'none', background: visualConfig.button_color || '#007bff', color: visualConfig.text_color || 'white', borderRadius: '4px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', boxSizing: 'border-box' }} disabled>
                              {field.label || 'Botão'}
                            </button>
                          );

                        // 📝 TEXT (com inputMask)
                        case 'text':
                        case 'password':
                        default:
                          const mask = visualConfig.inputMask;
                          const maskPlaceholder = mask === 'cpf' ? '___.___.___-__' :
                                                 mask === 'cnpj' ? '__.___.___/____-__' :
                                                 mask === 'phone' ? '(__) _____-____' :
                                                 mask === 'cep' ? '_____-___' :
                                                 field.placeholder || `Digite ${field.label.toLowerCase()}`;
                          return (
                            <input
                              type={field.type === 'password' ? 'password' : 'text'}
                              placeholder={maskPlaceholder}
                              style={{ width: field.width || '300px', height: field.height || '38px', padding: '8px 12px', border: '1px solid #dee2e6', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                              disabled
                            />
                          );
                      }
                    };
                    
                    const inputElement = renderFieldComponent(field);
                    
                    const fieldX = field.position?.x || 0;
                    const fieldY = field.position?.y || 0;
                    
                    return (
                      <DroppedField
                        key={field.id}
                          $selected={selectedField?.id === field.id}
                          onClick={() => setSelectedField(field)}
                          onContextMenu={(e) => handleContextMenu(e, field)}
                          draggable
                          style={{
                            left: `${fieldX}px`,
                            top: `${fieldY}px`
                          }}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('fieldId', field.id);
                            e.dataTransfer.setData('offsetX', String(e.clientX - e.currentTarget.getBoundingClientRect().left));
                            e.dataTransfer.setData('offsetY', String(e.clientY - e.currentTarget.getBoundingClientRect().top));
                            setSelectedField(field);
                          }}
                        >
                          {/* Renderiza label e input conforme labelPosition */}
                        {labelPosition === 'top' && (
                          <div style={{ position: 'relative' }}>
                            {labelElement}
                            <div style={{ marginTop: labelPadding }}>
                              {inputElement}
                            </div>
                            
                            {/* ✅ Botão Lixeira - Posicionado no canto superior direito */}
                            {selectedField?.id === field.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveField(field.id);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0px',
                                  right: '0px',
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #dee2e6',
                                  borderTop: 'none',
                                  borderRight: 'none',
                                  borderRadius: '0 0 0 4px',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  padding: '4px 6px',
                                  lineHeight: '1',
                                  color: '#dc3545',
                                  zIndex: 101,
                                  pointerEvents: 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Excluir campo"
                              >
                                🗑️
                              </button>
                            )}
                            
                            {/* ✅ FIX: Handle de resize FORA do input, relativo ao container pai */}
                            {selectedField?.id === field.id && (
                              <div
                                draggable={false}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleResizeStart(e, field);
                                }}
                                style={{
                                  position: 'absolute',
                                  bottom: '0px', // ✅ Colado no fundo do container
                                  right: '0px',  // ✅ Colado na direita do container
                                  fontSize: '16px',
                                  color: '#6c757d',
                                  cursor: 'nwse-resize',
                                  fontWeight: 'bold',
                                  userSelect: 'none',
                                  padding: '2px',
                                  lineHeight: '1',
                                  zIndex: 100,
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '2px 0 0 0', // ✅ Arredondar apenas canto superior esquerdo
                                  border: '1px solid #dee2e6',
                                  borderRight: 'none', // ✅ Remover borda direita
                                  borderBottom: 'none', // ✅ Remover borda inferior
                                  pointerEvents: 'auto',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Arrastar para redimensionar"
                              >
                                ⤡
                              </div>
                            )}
                          </div>
                        )}
                        
                        {labelPosition === 'left' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: labelPadding, position: 'relative' }}>
                            <div style={{ minWidth: '120px' }}>
                              {labelElement}
                            </div>
                            <div>
                              {inputElement}
                            </div>
                            
                            {/* ✅ Botão Lixeira - Posicionado no canto superior direito */}
                            {selectedField?.id === field.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveField(field.id);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0px',
                                  right: '0px',
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #dee2e6',
                                  borderTop: 'none',
                                  borderRight: 'none',
                                  borderRadius: '0 0 0 4px',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  padding: '4px 6px',
                                  lineHeight: '1',
                                  color: '#dc3545',
                                  zIndex: 101,
                                  pointerEvents: 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Excluir campo"
                              >
                                🗑️
                              </button>
                            )}
                            
                            {/* ✅ FIX: Handle de resize fora do input, relativo ao container flex */}
                            {selectedField?.id === field.id && (
                              <div
                                draggable={false}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleResizeStart(e, field);
                                }}
                                style={{
                                  position: 'absolute',
                                  bottom: '0px',
                                  right: '0px',
                                  fontSize: '16px',
                                  color: '#6c757d',
                                  cursor: 'nwse-resize',
                                  fontWeight: 'bold',
                                  userSelect: 'none',
                                  padding: '2px',
                                  lineHeight: '1',
                                  zIndex: 100,
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '2px 0 0 0',
                                  border: '1px solid #dee2e6',
                                  borderRight: 'none',
                                  borderBottom: 'none',
                                  pointerEvents: 'auto',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Arrastar para redimensionar"
                              >
                                ⤡
                              </div>
                            )}
                          </div>
                        )}
                        
                        {labelPosition === 'bottom' && (
                          <div style={{ position: 'relative' }}>
                            <div>
                              {inputElement}
                            </div>
                            <div style={{ marginTop: labelPadding }}>
                              {labelElement}
                            </div>
                            
                            {/* ✅ Botão Lixeira - Posicionado no canto superior direito */}
                            {selectedField?.id === field.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveField(field.id);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0px',
                                  right: '0px',
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  border: '1px solid #dee2e6',
                                  borderTop: 'none',
                                  borderRight: 'none',
                                  borderRadius: '0 0 0 4px',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  padding: '4px 6px',
                                  lineHeight: '1',
                                  color: '#dc3545',
                                  zIndex: 101,
                                  pointerEvents: 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Excluir campo"
                              >
                                🗑️
                              </button>
                            )}
                            
                            {/* ✅ FIX: Handle de resize fora do input, relativo ao container pai */}
                            {selectedField?.id === field.id && (
                              <div
                                draggable={false}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleResizeStart(e, field);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '0px', // ✅ Colado no topo do input
                                  right: '0px',
                                  fontSize: '16px',
                                  color: '#6c757d',
                                  cursor: 'nwse-resize',
                                  fontWeight: 'bold',
                                  userSelect: 'none',
                                  padding: '2px',
                                  lineHeight: '1',
                                  zIndex: 100,
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '0 0 0 2px',
                                  border: '1px solid #dee2e6',
                                  borderRight: 'none',
                                  borderTop: 'none',
                                  pointerEvents: 'auto',
                                  width: '20px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Arrastar para redimensionar"
                              >
                                ⤡
                              </div>
                            )}
                          </div>
                        )}
                      </DroppedField>
                    );
                  });
                })()}
              </Canvas>
            </WorkArea>
            
            {/* ⚠️ PropertiesPanel REMOVIDO (11 JAN 2026) */}
            {/* Propriedades agora acessíveis via modal de contexto (clique direito no campo) */}
            {/* Espaço ganho: 320px de largura para o canvas */}
          </>
        )}

        {/* MODO PREVIEW */}
        {mode === 'preview' && (
          <WorkArea>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              {/* TABS BAR - Localizar + Cadastro (condicional) */}
              <TabBar>
                {enableSearchTab && (
                  <Tab
                    $active={previewTab === 'localizar'}
                    onClick={() => setPreviewTab('localizar')}
                  >
                    🔍 Localizar
                  </Tab>
                )}
                <Tab
                  $active={previewTab === 'cadastro'}
                  onClick={() => setPreviewTab('cadastro')}
                >
                  📝 Cadastro
                </Tab>
              </TabBar>

              {/* ABA LOCALIZAR - AG Grid (somente se enableSearchTab=true) */}
              {enableSearchTab && previewTab === 'localizar' && (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2>{formDefinition.formTitle} - Localizar</h2>
                    <button type="button" className="btn-primary">
                      ➕ Incluir
                    </button>
                  </div>
                  
                  {/* SearchBar */}
                  <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Digite para pesquisar..."
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                    <button type="button" className="btn-primary" style={{ width: '120px' }}>
                      🔍 Buscar
                    </button>
                  </div>

                  {/* AG Grid com colunas do dictionary (searchVisible = true) */}
                  <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
                    <AgGridReact
                      columnDefs={[
                        {
                          headerName: '',
                          field: 'actions',
                          width: 100,
                          pinned: 'right',
                          cellRenderer: () => (
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => setPreviewTab('cadastro')}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#dc3545' }}
                              >
                                🗑️ Excluir
                              </button>
                            </div>
                          ),
                          sortable: false,
                          filter: false,
                        },
                        ...formDefinition.fields
                          .filter(f => f.searchVisible) // Apenas campos com searchVisible=true
                          .map(f => ({
                            headerName: f.label,
                            field: f.name,
                            width: 150,
                            sortable: true,
                            filter: true,
                          }))
                      ]}
                      rowData={[
                        // Dados de exemplo para visualização
                        ...Array.from({ length: 5 }, (_, i) => {
                          const row: any = { id: i + 1 };
                          formDefinition.fields
                            .filter(f => f.searchVisible)
                            .forEach(f => {
                              row[f.name] = `Exemplo ${i + 1}`;
                            });
                          return row;
                        })
                      ]}
                      defaultColDef={{
                        flex: 1,
                        minWidth: 100,
                        resizable: true,
                      }}
                      pagination={true}
                      paginationPageSize={10}
                      domLayout="normal"
                    />
                  </div>
                </div>
              )}

              {/* ABA CADASTRO - Formulário */}
              {previewTab === 'cadastro' && (
                <div style={{ padding: '24px' }}>
                  <h2>{formDefinition.formTitle}</h2>
                  {formDefinition.description && <p>{formDefinition.description}</p>}
                  
                  <form style={{
                position: 'relative', // ✅ FIX: Posicionamento relativo para campos absolutos
                width: '100%',
                minHeight: '600px', // ✅ FIX: Altura mínima para conter campos posicionados
                background: 'var(--background-primary, #f8f9fa)',
                border: '1px solid var(--border-color, #dee2e6)',
                borderRadius: '4px',
                padding: '16px'
              }}>
                {(() => {
                  // Helper: Verificar se um campo pertence a alguma tab
                  const fieldsInTabs = new Set<string>();
                  formDefinition.fields.forEach(field => {
                    if (field.type === 'tabs' && field.tabs) {
                      field.tabs.forEach(tab => {
                        tab.fieldIds.forEach(id => fieldsInTabs.add(id));
                      });
                    }
                  });
                  
                  // Renderizar apenas campos que NÃO estão dentro de tabs
                  return formDefinition.fields
                    .filter(field => !fieldsInTabs.has(field.id)) // ✅ Excluir campos que estão em tabs
                    .map(field => {
                  // Renderizar TABS no Preview
                  if (field.type === 'tabs' && field.tabs) {
                    const currentActiveTab = activeTabsState[field.id] || field.activeTab || field.tabs[0]?.id;
                    
                    return (
                      <div key={field.id} style={{ gridColumn: '1 / -1', marginBottom: '24px' }}>
                        <div style={{ borderBottom: '2px solid #dee2e6', marginBottom: '16px' }}>
                          {field.tabs.map(tab => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setActiveTabsState(prev => ({ ...prev, [field.id]: tab.id }));
                              }}
                              style={{
                                padding: '12px 24px',
                                border: 'none',
                                background: currentActiveTab === tab.id ? '#0d6efd' : 'transparent',
                                color: currentActiveTab === tab.id ? 'white' : '#6c757d',
                                borderBottom: currentActiveTab === tab.id ? '3px solid #0d6efd' : '3px solid transparent',
                                cursor: 'pointer',
                                fontWeight: currentActiveTab === tab.id ? '600' : '400',
                                transition: 'all 0.2s'
                              }}
                            >
                              {tab.icon} {tab.label}
                            </button>
                          ))}
                        </div>
                        
                        {field.tabs.map(tab => (
                          <div 
                            key={tab.id} 
                            style={{ 
                              display: currentActiveTab === tab.id ? 'block' : 'none', // ✅ block para conter absolute
                              position: 'relative', // ✅ Container para absolute positioning
                              minHeight: '400px', // ✅ Espaço para campos posicionados
                              padding: '16px 0'
                            }}
                          >
                            {formDefinition.fields
                              .filter(f => tab.fieldIds.includes(f.id))
                              .map(tabField => {
                                const labelPosition = tabField.labelPosition || 'top';
                                const labelPadding = tabField.labelPadding || '4px'; // ✅ Fallback SPDealer compacto
                                const fieldWidth = tabField.width || '100%';
                                const fieldHeight = tabField.height || 'auto';
                                
                                const labelElement = (
                                  <label style={{ 
                                    display: 'block', 
                                    fontWeight: '500', 
                                    fontSize: '14px',
                                    margin: 0, // ✅ Remove margem padrão
                                    padding: 0  // ✅ Remove padding padrão
                                  }}>
                                    {tabField.label}
                                    {tabField.required && <span style={{ color: 'red' }}> *</span>}
                                  </label>
                                );
                                
                                const inputElement = (
                                  <input
                                    type={tabField.type === 'tabs' ? 'text' : tabField.type}
                                    placeholder={tabField.placeholder}
                                    required={tabField.required}
                                    style={{ 
                                      width: fieldWidth, 
                                      height: fieldHeight === 'auto' ? undefined : fieldHeight,
                                      padding: '8px 12px', 
                                      border: '1px solid #dee2e6', 
                                      borderRadius: '4px' 
                                    }}
                                  />
                                );
                                
                                // ✅ USAR POSICIONAMENTO ABSOLUTO IGUAL AO DESIGN MODE
                                return (
                                  <div 
                                    key={tabField.id}
                                    style={{ 
                                      position: 'absolute', // ✅ Posicionamento absoluto
                                      left: `${tabField.position?.x || 0}px`, // ✅ Coordenada X
                                      top: `${tabField.position?.y || 0}px`, // ✅ Coordenada Y
                                      width: fieldWidth // ✅ Respeitar largura
                                    }}
                                  >
                                    {labelPosition === 'top' && (
                                      <>
                                        {labelElement}
                                        <div style={{ marginTop: '4px' }}>
                                          {inputElement}
                                        </div>
                                      </>
                                    )}
                                    {labelPosition === 'left' && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ minWidth: '120px' }}>{labelElement}</div>
                                        {inputElement}
                                      </div>
                                    )}
                                    {labelPosition === 'bottom' && (
                                      <>
                                        {inputElement}
                                        <div style={{ marginTop: '4px' }}>
                                          {labelElement}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  
                  // Renderizar CAMPO NORMAL no Preview (IGUAL ao Design mode)
                  const labelPosition = field.labelPosition || 'top';
                  const labelPadding = field.labelPadding || '4px'; // ✅ Fallback SPDealer compacto
                  const fieldWidth = field.width || '100%';
                  const fieldHeight = field.height || 'auto';
                  
                  const labelElement = (
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      fontSize: '14px',
                      margin: 0, // ✅ Remove margem padrão do label
                      padding: 0  // ✅ Remove padding padrão do label
                    }}>
                      {field.label}
                      {field.required && <span style={{ color: 'red' }}> *</span>}
                    </label>
                  );
                  
                  const inputElement = (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      style={{ 
                        width: fieldWidth, 
                        height: fieldHeight === 'auto' ? undefined : fieldHeight,
                        padding: '8px 12px', 
                        border: '1px solid #dee2e6', 
                        borderRadius: '4px' 
                      }}
                    />
                  );
                  
                  // ✅ USAR POSICIONAMENTO ABSOLUTO EXATAMENTE COMO NO DESIGN MODE
                  return (
                    <div 
                      key={field.id} 
                      style={{ 
                        position: 'absolute', // ✅ Posicionamento absoluto
                        left: `${field.position?.x || 0}px`, // ✅ Coordenada X
                        top: `${field.position?.y || 0}px`, // ✅ Coordenada Y
                        width: fieldWidth // ✅ Respeitar largura configurada
                      }}
                    >
                      {labelPosition === 'top' && (
                        <>
                          {labelElement}
                          <div style={{ marginTop: '4px' }}>
                            {inputElement}
                          </div>
                        </>
                      )}
                      {labelPosition === 'left' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ minWidth: '120px' }}>{labelElement}</div>
                          {inputElement}
                        </div>
                      )}
                      {labelPosition === 'bottom' && (
                        <>
                          {inputElement}
                          <div style={{ marginTop: '4px' }}>
                            {labelElement}
                          </div>
                        </>
                      )}
                    </div>
                  );
                });
                })()}
                
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  justifyContent: 'flex-end',
                  marginTop: '24px',
                  paddingTop: '16px',
                  borderTop: '1px solid #dee2e6'
                }}>
                  {formDefinition.buttons.submit.visible && (
                    <button type="button" className="btn-primary">
                      {formDefinition.buttons.submit.label}
                    </button>
                  )}
                  {formDefinition.buttons.cancel.visible && (
                    <button type="button" className="btn-secondary">
                      {formDefinition.buttons.cancel.label}
                    </button>
                  )}
                  {formDefinition.buttons.reset.visible && (
                    <button type="button" className="btn-secondary">
                      {formDefinition.buttons.reset.label}
                    </button>
                  )}
                </div>
              </form>
                </div>
              )}
            </div>
          </WorkArea>
        )}

        {/* MODO CODE */}
        {mode === 'code' && (
          <WorkArea>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
              <SectionTitle>💻 Código Completo Gerado</SectionTitle>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button 
                  onClick={handleSaveToRefatorado} 
                  $variant="primary"
                  disabled={isSavingFiles}
                  style={{ position: 'relative', minWidth: '200px' }}
                >
                  {isSavingFiles ? (
                    <>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid white', 
                        borderTop: '2px solid transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 0.6s linear infinite',
                        marginRight: '8px'
                      }} />
                      Salvando... {savingProgress}%
                    </>
                  ) : (
                    '💾 Salvar em Refatorado'
                  )}
                </Button>
                <Button onClick={() => {
                  const currentCode = (window as any).generatedCodes?.[activeCodeTab] || generatedCode;
                  navigator.clipboard.writeText(currentCode);
                  setStatusMessage({ text: `📋 ${activeCodeTab.toUpperCase()} copiado!`, type: 'success' });
                }}>
                  📋 Copiar {activeCodeTab.toUpperCase()}
                </Button>
              </div>
            </div>
            
            {/* Barra de Progresso */}
            {isSavingFiles && savingProgress > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  background: '#e9ecef', 
                  borderRadius: '4px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    width: `${savingProgress}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #0d6efd 0%, #0b5ed7 100%)', 
                    transition: 'width 0.3s ease',
                    animation: 'progress-shimmer 1.5s infinite'
                  }} />
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#6c757d', 
                  textAlign: 'center' 
                }}>
                  Gerando arquivos... {savingProgress}%
                </div>
              </div>
            )}
            
            {/* 📑 Abas de Código */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '16px',
              borderBottom: '2px solid #dee2e6',
              paddingBottom: '8px'
            }}>
              {(['tsx', 'css', 'java', 'sql', 'types'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveCodeTab(tab);
                    setGeneratedCode((window as any).generatedCodes?.[tab] || '');
                  }}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    background: activeCodeTab === tab ? '#0d6efd' : '#f8f9fa',
                    color: activeCodeTab === tab ? 'white' : '#212529',
                    borderRadius: '4px 4px 0 0',
                    cursor: 'pointer',
                    fontWeight: activeCodeTab === tab ? '600' : '400',
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    fontSize: '12px'
                  }}
                >
                  {tab === 'tsx' && '📄 TSX (React)'}
                  {tab === 'css' && '🎨 CSS (Styles)'}
                  {tab === 'java' && '☕ JAVA (Backend)'}
                  {tab === 'sql' && '🗄️ SQL (Database)'}
                  {tab === 'types' && '📐 TYPES (TS)'}
                </button>
              ))}
            </div>
            
            <CodeEditor value={generatedCode} readOnly />
          </WorkArea>
        )}

        {/* MODO IMPORT */}
        {mode === 'import' && (
          <WorkArea>
            <SectionTitle>📁 Importar Formulário Existente (.tsx)</SectionTitle>
            <p style={{ marginBottom: '24px', color: '#6c757d' }}>
              Importe um arquivo .tsx de formulário existente para edição visual
            </p>
            
            {statusMessage && (
              <StatusMessage $type={statusMessage.type}>
                {statusMessage.text}
              </StatusMessage>
            )}
            
            <ImportArea
              onClick={() => document.getElementById('file-input')?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFile(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFile(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFile(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFile(false);
                
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  const file = files[0];
                  
                  // Validar extensão (agora também aceita .json)
                  if (
                    file.name.endsWith('.tsx') ||
                    file.name.endsWith('.ts') ||
                    file.name.endsWith('.jsx') ||
                    file.name.endsWith('.json')
                  ) {
                    handleImport(file);
                  } else {
                    setStatusMessage({ 
                      text: `❌ Arquivo ${file.name} não é suportado. Use .tsx, .ts, .jsx ou .json`, 
                      type: 'error' 
                    });
                  }
                }
              }}
              style={{
                borderColor: isDraggingFile ? '#0d6efd' : undefined,
                background: isDraggingFile ? '#e7f1ff' : undefined
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {isDraggingFile ? '📂' : '📁'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                {isDraggingFile ? 'Solte o arquivo aqui' : 'Clique aqui ou arraste um arquivo (.tsx | .ts | .jsx | .json)'}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                Arquivos suportados: .tsx, .ts, .jsx, .json
              </div>
            </ImportArea>
            
            <input
              id="file-input"
              type="file"
              accept=".tsx,.ts,.jsx,.json,.imp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
          </WorkArea>
        )}
      </MainContent>
      
      {/* ============================================================ */}
      {/* MODAL DE IMPORTAÇÃO DO DICTIONARY                          */}
      {/* ============================================================ */}
      <ModalOverlay $show={showImportModal} onClick={() => setShowImportModal(false)}>
        <ModalContainer onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h3>
              📋 Importar Formulário - {selectedTable?.table_label || selectedTable?.table_name}
            </h3>
            <Button onClick={() => setShowImportModal(false)}>✕</Button>
          </ModalHeader>
          
          <ModalBody>
            <div style={{ marginBottom: '12px' }}>
              <strong>Tabela:</strong> {selectedTable?.table_name}<br />
              <strong>Total de campos:</strong> {tableColumns.length}<br />
              <strong>Campos visíveis:</strong> {tableColumns.filter((c: any) => c.form_visible === 1 || c.form_visible === true).length}<br />
              <strong>Listas dinâmicas:</strong> {tableColumns.filter((c: any) => c.table && c.table !== '0').length}
            </div>
            
            <GridContainer className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
              <AgGridReact
                rowData={tableColumns}
                rowSelection="multiple" // ✅ FIX CRÍTICO: Seleção múltipla via checkbox
                suppressRowClickSelection={true} // ✅ Apenas checkbox seleciona (não clique na linha)
                columnDefs={[
                  {
                    headerName: '',
                    field: 'selected',
                    checkboxSelection: true,
                    headerCheckboxSelection: true,
                    width: 50,
                    pinned: 'left',
                    lockPosition: true, // ✅ Evita que coluna seja movida
                  },
                  {
                    headerName: 'Campo',
                    field: 'column_name',
                    flex: 1,
                    minWidth: 150
                  },
                  {
                    headerName: 'Label',
                    field: 'label',
                    flex: 1,
                    minWidth: 150
                  },
                  {
                    headerName: 'Tipo',
                    field: 'data_type',
                    width: 100
                  },
                  {
                    headerName: 'Lista',
                    field: 'table',
                    width: 120,
                    cellRenderer: (params: any) => {
                      if (params.value && params.value !== '0') {
                        return `📋 ${params.value}`;
                      }
                      return '';
                    },
                    tooltipValueGetter: (params: any) => {
                      if (params.value && params.value !== '0') {
                        return `Lista dinâmica populada da tabela: ${params.value}`;
                      }
                      return 'Campo texto normal';
                    }
                  },
                  {
                    headerName: 'Form',
                    field: 'form_visible',
                    width: 70,
                    cellRenderer: (params: any) => {
                      return params.value === 1 || params.value === true ? '✅' : '❌';
                    },
                    cellStyle: { textAlign: 'center' },
                    sortable: true,
                    filter: false,
                  },
                  {
                    headerName: 'Grid',
                    field: 'is_lista',
                    width: 70,
                    cellRenderer: (params: any) => params.value === 1 || params.value === true ? '🔍' : ''
                  },
                  {
                    headerName: 'Ordem',
                    field: 'tabulation',
                    width: 80
                  },
                  {
                    headerName: 'Aba',
                    field: 'aba',
                    width: 80
                  }
                ]}
                onGridReady={(params) => {
                  console.log('🎯 onGridReady executado');
                  console.log('📊 Total de rows:', params.api.getDisplayedRowCount());
                  
                  // Pré-selecionar campos com form_visible=1
                  const nodesToSelect: any[] = [];
                  params.api.forEachNode((node) => {
                    if (node.data) {
                      const formVisibleValue = node.data.form_visible;
                      const shouldSelect = formVisibleValue === 1 || formVisibleValue === true;
                      
                      console.log(`🔍 Row ${node.data.column_name}:`, {
                        form_visible: formVisibleValue,
                        type: typeof formVisibleValue,
                        shouldSelect: shouldSelect,
                        label: node.data.label,
                        tabulation: node.data.tabulation
                      });
                      
                      if (shouldSelect) {
                        nodesToSelect.push(node);
                        console.log(`  ✅ Adicionado à seleção: ${node.data.column_name}`);
                      }
                    }
                  });
                  
                  console.log('✅ Total de campos a selecionar:', nodesToSelect.length);
                  console.log('📋 Campos:', nodesToSelect.map(n => n.data.column_name));
                  
                  if (nodesToSelect.length > 0) {
                    params.api.setNodesSelected({ nodes: nodesToSelect, newValue: true });
                    console.log('✅ Chamou setNodesSelected com', nodesToSelect.length, 'nodes');
                    
                    // Verificar se realmente selecionou
                    setTimeout(() => {
                      const selectedRows = params.api.getSelectedRows();
                      console.log('🔍 Verificação pós-seleção:', selectedRows.length, 'campos selecionados');
                    }, 100);
                  } else {
                    console.warn('⚠️ NENHUM campo atende critério form_visible=1 ou true');
                  }
                }}
                onSelectionChanged={(event) => {
                  const selected = event.api.getSelectedRows();
                  console.log('📋 Seleção alterada:', selected.length, 'campos');
                  console.log('🔍 Campos selecionados:', selected.map((r: any) => r.column_name));
                  console.log('🔍 form_visible dos selecionados:', selected.map((r: any) => ({ campo: r.column_name, formVisible: r.form_visible })));
                  setSelectedColumns(selected.map((row: any) => row.column_name));
                }}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true
                }}
                domLayout="normal"
              />
            </GridContainer>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              <label style={{ 
                flex: '0 0 auto', 
                marginBottom: 0, 
                fontWeight: 500, 
                fontSize: '14px',
                color: '#212529'
              }}>
                Nome do novo formulário:
              </label>
              <input
                type="text"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="Ex: Form Clientes"
                style={{ 
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <Button
                $variant="primary"
                onClick={handleImportFromDictionary}
                disabled={!newFormName.trim() || selectedColumns.length === 0}
                title={selectedColumns.length === 0 ? 'Selecione ao menos 1 campo' : `Importar ${selectedColumns.length} campo(s)`}
              >
                ✅ Importar ({selectedColumns.length})
              </Button>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <small style={{ flex: 1, color: '#6c757d' }}>
              💡 {selectedColumns.length} campo(s) selecionado(s). Marque os campos que deseja importar.
            </small>
            <Button onClick={() => setShowImportModal(false)}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContainer>
      </ModalOverlay>
      
      {/* Menu de Contexto (Botão Direito do Mouse) */}
      {contextMenu.show && contextMenu.field && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          onClose={handleCloseContextMenu}
          componentData={{
            name: contextMenu.field.name,
            type: contextMenu.field.type,
            // 🆕 Usar metadados dinâmicos do banco (11 JAN 2026)
            properties: contextMenu.metadata?.properties?.length ? 
              contextMenu.metadata.properties : [
                // Fallback: propriedades básicas se não houver no banco
                { property: 'Nome', value: contextMenu.field.name },
                { property: 'Label', value: contextMenu.field.label || '' },
                { property: 'Tipo', value: contextMenu.field.type || 'text' },
                { property: 'Placeholder', value: contextMenu.field.placeholder || '' },
                { property: 'Obrigatório', value: contextMenu.field.required ? 'Sim' : 'Não' },
                { property: 'Largura', value: contextMenu.field.width || '300px' },
                { property: 'Altura', value: contextMenu.field.height || '38px' },
                { property: 'PosX', value: contextMenu.field.position?.x || 0 },
                { property: 'PosY', value: contextMenu.field.position?.y || 0 },
                { property: 'Tabular', value: 'Sim' },
                { property: 'Ordem', value: contextMenu.field.order || 0 }
              ],
            // 🆕 Usar eventos dinâmicos do banco (11 JAN 2026)
            events: contextMenu.metadata?.events?.length ?
              contextMenu.metadata.events : [
                // Fallback: eventos básicos se não houver no banco
                { event: 'Ao Clicar', action: '(Vazio)' },
                { event: 'Ao Entrar', action: '(Vazio)' },
                { event: 'Ao Modificar', action: '(Vazio)' },
                { event: 'Ao Pressionar Tecla', action: '(Vazio)' },
                { event: 'Ao Sair', action: '(Vazio)' }
              ]
          }}
        />
      )}
    </Container>
  );
};

export default FormBuilderMain;















