import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FormField } from '../FormBuilderMain';

// ========================================
// INTERFACES
// ========================================

interface ComponentProperty {
  property_key: string;
  property_name: string;
  property_type: string; // 'text', 'number', 'select', 'checkbox', 'textarea'
  property_group: string;
  display_order: number;
  default_value: string | null;
  options_enum: string | null; // JSON array: ["option1", "option2"]
  validation_pattern: string | null;
  is_required: boolean;
  description: string | null;
}

interface ComponentEvent {
  event_key: string;
  event_name: string;
  event_group: string;
  display_order: number;
  parameters: string | null;
  description: string | null;
  example_code: string | null;
}

interface DynamicPropertiesModalProps {
  isOpen: boolean;
  componentType: string;
  fieldData: FormField;
  onSave: (updatedField: FormField) => void;
  onClose: () => void;
}

// ========================================
// STYLED COMPONENTS
// ========================================

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-in;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from { 
      transform: translateY(30px);
      opacity: 0;
    }
    to { 
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #dee2e6;
  background: #f8f9fa;
  padding: 0 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#667eea' : '#6c757d'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#667eea' : 'transparent'};
  transition: all 0.2s;
  position: relative;
  top: 1px;
  
  &:hover {
    color: #667eea;
    background: ${props => props.active ? 'white' : 'rgba(102, 126, 234, 0.05)'};
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
`;

const PropertyGroup = styled.div`
  margin-bottom: 30px;
`;

const GroupTitle = styled.h4`
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: #495057;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PropertyRow = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PropertyLabel = styled.label<{ required?: boolean }>`
  font-weight: 500;
  color: #212529;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::after {
    content: ${props => props.required ? '"*"' : '""'};
    color: #dc3545;
    font-weight: bold;
  }
`;

const PropertyDescription = styled.small`
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    background: #e9ecef;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  min-height: 80px;
  resize: vertical;
  font-family: 'Courier New', monospace;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const CheckboxWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const EventRow = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #667eea;
`;

const EventName = styled.h5`
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CodeEditor = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 0.9rem;
  background: #ffffff;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ExampleCode = styled.details`
  margin-top: 10px;
  
  summary {
    cursor: pointer;
    color: #667eea;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 5px 0;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  pre {
    background: #f1f3f5;
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0 0 0;
    overflow-x: auto;
    font-size: 0.85rem;
  }
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  ` : `
    background: white;
    color: #6c757d;
    border: 1px solid #ced4da;
    
    &:hover {
      background: #e9ecef;
      border-color: #adb5bd;
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

// ========================================
// COMPONENT
// ========================================

export const DynamicPropertiesModal: React.FC<DynamicPropertiesModalProps> = ({
  isOpen,
  componentType,
  fieldData,
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'events'>('properties');
  const [properties, setProperties] = useState<ComponentProperty[]>([]);
  const [events, setEvents] = useState<ComponentEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // Buscar propriedades e eventos do banco
  useEffect(() => {
    if (!isOpen || !componentType) return;

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        // Buscar propriedades
        const propsResponse = await fetch(
          `/api/form-components/formbuilder/components/${componentType}/properties`
        );
        
        if (!propsResponse.ok) {
          throw new Error(`Erro ao buscar propriedades: ${propsResponse.status}`);
        }
        
        const propsData: ComponentProperty[] = await propsResponse.json();
        setProperties(propsData);

        // Buscar eventos
        const eventsResponse = await fetch(
          `/api/form-components/formbuilder/components/${componentType}/events`
        );
        
        if (!eventsResponse.ok) {
          throw new Error(`Erro ao buscar eventos: ${eventsResponse.status}`);
        }
        
        const eventsData: ComponentEvent[] = await eventsResponse.json();
        setEvents(eventsData);

        // Inicializar valores do formulário com dados existentes ou valores padrão
        const initialValues: Record<string, any> = {};
        propsData.forEach(prop => {
          // Se campo já tem valor, usar; senão usar default_value
          initialValues[prop.property_key] = 
            (fieldData as any)[prop.property_key] ?? 
            (prop.default_value || '');
        });
        setFormValues(initialValues);

        console.log('✅ Metadados carregados:', {
          componentType,
          properties: propsData.length,
          events: eventsData.length
        });

      } catch (err) {
        console.error('❌ Erro ao carregar metadados:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [isOpen, componentType, fieldData]);

  // Renderizar campo baseado no tipo
  const renderPropertyField = (prop: ComponentProperty) => {
    const value = formValues[prop.property_key] ?? '';

    switch (prop.property_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setFormValues(prev => ({
              ...prev,
              [prop.property_key]: e.target.value
            }))}
            placeholder={prop.description || `Digite ${prop.property_name.toLowerCase()}`}
            required={prop.is_required}
            pattern={prop.validation_pattern || undefined}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setFormValues(prev => ({
              ...prev,
              [prop.property_key]: e.target.value
            }))}
            placeholder={prop.description || `Digite ${prop.property_name.toLowerCase()}`}
            required={prop.is_required}
          />
        );

      case 'select':
        const options = prop.options_enum ? JSON.parse(prop.options_enum) : [];
        return (
          <Select
            value={value}
            onChange={(e) => setFormValues(prev => ({
              ...prev,
              [prop.property_key]: e.target.value
            }))}
            required={prop.is_required}
          >
            <option value="">Selecione...</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        );

      case 'checkbox':
        return (
          <CheckboxWrapper>
            <input
              type="checkbox"
              checked={value === '1' || value === true || value === 'true'}
              onChange={(e) => setFormValues(prev => ({
                ...prev,
                [prop.property_key]: e.target.checked ? '1' : '0'
              }))}
            />
            <span>{prop.description || 'Ativar'}</span>
          </CheckboxWrapper>
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setFormValues(prev => ({
              ...prev,
              [prop.property_key]: e.target.value
            }))}
            placeholder={prop.description || `Digite ${prop.property_name.toLowerCase()}`}
            required={prop.is_required}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setFormValues(prev => ({
              ...prev,
              [prop.property_key]: e.target.value
            }))}
            placeholder={prop.description || ''}
          />
        );
    }
  };

  // Agrupar propriedades por property_group
  const groupedProperties = properties.reduce((acc, prop) => {
    const group = prop.property_group || 'Geral';
    if (!acc[group]) acc[group] = [];
    acc[group].push(prop);
    return acc;
  }, {} as Record<string, ComponentProperty[]>);

  // Agrupar eventos por event_group
  const groupedEvents = events.reduce((acc, event) => {
    const group = event.event_group || 'Eventos';
    if (!acc[group]) acc[group] = [];
    acc[group].push(event);
    return acc;
  }, {} as Record<string, ComponentEvent[]>);

  // Salvar alterações
  const handleSave = () => {
    const updatedField: FormField = {
      ...fieldData,
      ...formValues
    };
    
    console.log('💾 Salvando propriedades:', updatedField);
    onSave(updatedField);
  };

  // Fechar ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            ⚙️ Propriedades: {fieldData.label || fieldData.type}
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <TabContainer>
          <Tab 
            active={activeTab === 'properties'} 
            onClick={() => setActiveTab('properties')}
          >
            📋 Propriedades ({properties.length})
          </Tab>
          <Tab 
            active={activeTab === 'events'} 
            onClick={() => setActiveTab('events')}
          >
            ⚡ Eventos ({events.length})
          </Tab>
        </TabContainer>

        <ModalBody>
          {loading && (
            <LoadingMessage>⏳ Carregando metadados do componente...</LoadingMessage>
          )}

          {error && (
            <ErrorMessage>❌ {error}</ErrorMessage>
          )}

          {!loading && !error && activeTab === 'properties' && (
            <>
              {Object.keys(groupedProperties).length === 0 ? (
                <LoadingMessage>
                  ℹ️ Nenhuma propriedade configurada para este tipo de componente.
                </LoadingMessage>
              ) : (
                Object.entries(groupedProperties).map(([groupName, props]) => (
                  <PropertyGroup key={groupName}>
                    <GroupTitle>
                      {groupName === 'Identificação' && '🏷️'}
                      {groupName === 'Configuração' && '⚙️'}
                      {groupName === 'Aparência' && '🎨'}
                      {groupName === 'Posicionamento' && '📐'}
                      {groupName === 'Comportamento' && '🔧'}
                      {groupName === 'Dados' && '💾'}
                      {groupName === 'Avançado' && '🔬'}
                      {' '}{groupName}
                    </GroupTitle>
                    
                    {props.map(prop => (
                      <PropertyRow key={prop.property_key}>
                        <PropertyLabel required={prop.is_required}>
                          {prop.property_name}
                        </PropertyLabel>
                        {prop.description && (
                          <PropertyDescription>{prop.description}</PropertyDescription>
                        )}
                        {renderPropertyField(prop)}
                      </PropertyRow>
                    ))}
                  </PropertyGroup>
                ))
              )}
            </>
          )}

          {!loading && !error && activeTab === 'events' && (
            <>
              {Object.keys(groupedEvents).length === 0 ? (
                <LoadingMessage>
                  ℹ️ Nenhum evento configurado para este tipo de componente.
                </LoadingMessage>
              ) : (
                Object.entries(groupedEvents).map(([groupName, evts]) => (
                  <PropertyGroup key={groupName}>
                    <GroupTitle>⚡ {groupName}</GroupTitle>
                    
                    {evts.map(event => (
                      <EventRow key={event.event_key}>
                        <EventName>
                          {event.event_name}
                          {event.parameters && (
                            <small style={{ color: '#6c757d', fontWeight: 'normal' }}>
                              ({event.parameters})
                            </small>
                          )}
                        </EventName>
                        
                        {event.description && (
                          <PropertyDescription style={{ marginBottom: '10px' }}>
                            {event.description}
                          </PropertyDescription>
                        )}
                        
                        <CodeEditor
                          placeholder={`// Código JavaScript para ${event.event_name}\nfunction ${event.event_key}() {\n  // Seu código aqui\n}`}
                          value={formValues[event.event_key] || ''}
                          onChange={(e) => setFormValues(prev => ({
                            ...prev,
                            [event.event_key]: e.target.value
                          }))}
                        />
                        
                        {event.example_code && (
                          <ExampleCode>
                            <summary>💡 Ver exemplo de código</summary>
                            <pre>{event.example_code}</pre>
                          </ExampleCode>
                        )}
                      </EventRow>
                    ))}
                  </PropertyGroup>
                ))
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            ❌ Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            ✔️ Salvar Alterações
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};















