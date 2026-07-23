import React, { useState, useEffect } from 'react';
import FlowStudioEditor from '../flow/FlowStudioEditor';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Tabs, Tab } from 'react-bootstrap';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  target: HTMLElement | null;
  onClose: () => void;
  componentData?: ComponentData;
}

interface ComponentData {
  name: string;
  type: string;
  properties: PropertyRow[];
  events: EventRow[];
}

interface PropertyRow {
  property: string;
  value: string | number | boolean;
}

interface EventRow {
  event: string;
  action: string;
  flow_action?: any;
  flow_params?: any;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  target,
  onClose,
  componentData
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'events'>('properties');
  
  // Propriedades do componente (extraídas das imagens)
  const defaultProperties: PropertyRow[] = [
    { property: 'Nome', value: componentData?.name || 'EDTNAME' },
    { property: 'Descrição', value: 'Nome' },
    { property: 'Container', value: '' },
    { property: 'Dica', value: '' },
    { property: 'Apenas Leitura', value: 'Não' },
    { property: 'Cor', value: 'Cor automática do componente' },
    { property: 'Fonte', value: 'MS Sans Serif, 11, 1000, ciBlack' },
    { property: 'Fonte da Descrição', value: '' },
    { property: 'Tabular', value: 'Sim' },
    { property: 'Tabulação', value: '8' },
    { property: 'PosiçãoX', value: '10' },
    { property: 'PosiçãoY', value: '82' },
    { property: 'Altura', value: '35' },
    { property: 'Tamanho', value: '533' },
    { property: 'Tipo', value: '' },
    { property: 'Visível', value: 'Sim' },
    { property: 'Habilitado', value: 'Sim' },
    { property: 'Nome', value: componentData?.name || 'EDTNAME' },
    { property: 'Código', value: '1032370' },
    { property: 'Senha', value: 'Não' },
    { property: 'Conteúdo', value: 'Livre' },
    { property: 'Tamanho Máximo', value: '0' },
    { property: 'Posição Descrição', value: 'Acima' },
    { property: 'Texto (Quando Nulo)', value: '' },
    { property: 'Auto Completar', value: 'Sim' },
    { property: 'Estilo [CSS]', value: '' },
    { property: 'Nome da Classe (CSS)', value: '' },
    { property: 'Valor Inicial', value: '' },
    { property: 'Modelo', value: 'Moderno' }
  ];

  // Eventos disponíveis (extraídos das imagens)
  const defaultEvents: EventRow[] = [
    { event: 'Ao Clicar', action: '(Vazio)' },
    { event: 'Ao Entrar', action: '(Vazio)' },
    { event: 'Ao Modificar', action: '(Vazio)' },
    { event: 'Ao Pressionar Tecla', action: '(Vazio)' },
    { event: 'Ao Sair', action: '(Vazio)' }
  ];

  const [properties, setProperties] = useState<PropertyRow[]>(
    componentData?.properties || defaultProperties
  );
  
  const [events, setEvents] = useState<EventRow[]>(
    componentData?.events || defaultEvents
  );

  // AG Grid column definitions (SEM CABEÇALHO - apenas 2 colunas)
  const propertyColumnDefs: ColDef<PropertyRow>[] = [
    { 
      field: 'property' as keyof PropertyRow, 
      width: 180,
      editable: false,
      cellStyle: { fontWeight: 'bold', fontSize: '12px' }
    },
    { 
      field: 'value' as keyof PropertyRow, 
      width: 250,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellStyle: { fontSize: '12px' }
    }
  ];

  const eventColumnDefs: ColDef<EventRow>[] = [
    { 
      field: 'event' as keyof EventRow, 
      width: 180,
      editable: false,
      cellStyle: { fontWeight: 'bold', fontSize: '12px' }
    },
    { 
      field: 'action' as keyof EventRow, 
      width: 200,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellStyle: { fontSize: '12px' }
    },
    // Coluna: abrir/associar Flow (ícone)
    {
      headerName: '',
      colId: 'flow_action',
      width: 36,
      suppressSizeToFit: true,
      cellRenderer: (params: any) => {
        const onClick = (e: any) => {
          e.stopPropagation();
          openFlowSelector(params.data);
        };
        return (
          <button title="Associar/Selecionar Flow" className="btn btn-sm btn-light" onClick={onClick}>
            🧩
          </button>
        );
      }
    },
    // Coluna: parâmetros do flow / mapeamento
    {
      headerName: '',
      colId: 'flow_params',
      width: 36,
      suppressSizeToFit: true,
      cellRenderer: (params: any) => {
        const onClick = (e: any) => {
          e.stopPropagation();
          openParamsMapper(params.data);
        };
        return (
          <button title="Mapear parâmetros do Flow" className="btn btn-sm btn-light" onClick={onClick}>
            ⚙️
          </button>
        );
      }
    }
  ];

  // Grid options (sem header)
  const gridOptions = {
    headerHeight: 0,  // Remove cabeçalho
    rowHeight: 28,
    suppressMovableColumns: true,
    suppressColumnMoveAnimation: true,
    enableCellChangeFlash: true,
    singleClickEdit: true
  };

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.querySelector('.context-menu');
      if (menu && !menu.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // --- Flow selector / params mapper state & handlers ---
  const [flowSelectorOpen, setFlowSelectorOpen] = useState(false);
  const [flowsList, setFlowsList] = useState<any[]>([]);
  const [currentEventRow, setCurrentEventRow] = useState<EventRow | null>(null);
  const [flowEditorOpen, setFlowEditorOpen] = useState(false);
  const [flowToEdit, setFlowToEdit] = useState<any | null>(null);

  const [paramsModalOpen, setParamsModalOpen] = useState(false);
  const [webFunctions, setWebFunctions] = useState<any[]>([]);
  const [paramMappings, setParamMappings] = useState<Record<string, string>>({});

  const openFlowSelector = async (eventRow: EventRow) => {
    setCurrentEventRow(eventRow);
    try {
      const res = await fetch('/api/flows');
      const j = await res.json();
      setFlowsList(j || []);
    } catch (err) {
      console.error('Erro ao buscar flows', err);
      setFlowsList([]);
    }
    setFlowSelectorOpen(true);
  };

  const openFlowEditorForNew = () => {
    setFlowToEdit(null);
    setFlowEditorOpen(true);
    setFlowSelectorOpen(false);
  };

  const openFlowEditorForEdit = async (flowId: string) => {
    try {
      const res = await fetch(`/api/flows/${flowId}`);
      if (!res.ok) throw new Error('Não foi possível carregar flow');
      const j = await res.json();
      setFlowToEdit(j || null);
      setFlowEditorOpen(true);
      setFlowSelectorOpen(false);
    } catch (err) {
      console.error('Erro ao carregar flow para edição', err);
      alert('Erro ao carregar flow: ' + String(err));
    }
  };

  const associateFlowToEvent = async (flowId: string) => {
    if (!currentEventRow || !componentData?.name) return;
    // Armazenar ação como JSON string indicando integração com flow
    const payload = JSON.stringify({ tipo_acao: 'integracao_flow', flow_id: flowId });
    const updated = { ...currentEventRow, action: payload } as EventRow;
    const updatedEvents = events.map(e => e.event === updated.event ? updated : e);
    setEvents(updatedEvents);
    // Persistir via endpoint existente
    await saveEventToDatabase(componentData.name, updated.event, payload);
    setFlowSelectorOpen(false);
  };

  const openParamsMapper = async (eventRow: EventRow) => {
    setCurrentEventRow(eventRow);
    try {
      const res = await fetch('/api/web-functions');
      const j = await res.json();
      setWebFunctions(j || []);
    } catch (err) {
      console.error('Erro ao buscar web-functions', err);
      setWebFunctions([]);
    }
    // tentar extrair mapeamento existente
    try {
      const existing = JSON.parse(eventRow.action || '{}');
      setParamMappings(existing.paramsMapping || {});
    } catch (e) {
      setParamMappings({});
    }
    setParamsModalOpen(true);
  };

  const saveParamMappings = async (selectedFunctionCode: string) => {
    if (!currentEventRow || !componentData?.name) return;
    const payloadObj = { tipo_acao: 'integracao_flow', flow_id: selectedFunctionCode, paramsMapping: paramMappings };
    const payload = JSON.stringify(payloadObj);
    const updated = { ...currentEventRow, action: payload } as EventRow;
    const updatedEvents = events.map(e => e.event === updated.event ? updated : e);
    setEvents(updatedEvents);
    await saveEventToDatabase(componentData.name, updated.event, payload);
    setParamsModalOpen(false);
  };

  // Salvar mudanças
  const handlePropertyChange = (params: any) => {
    console.log('Property changed:', params.data);
    
    // Atualizar estado local
    const updatedProperties = properties.map(p => 
      p.property === params.data.property ? params.data : p
    );
    setProperties(updatedProperties);
    
    // Persistir no banco de dados
    if (componentData?.name) {
      savePropertyToDatabase(
        componentData.name,
        params.data.property,
        params.data.value
      );
    }
  };

  const handleEventChange = (params: any) => {
    console.log('Event changed:', params.data);
    
    // Atualizar estado local
    const updatedEvents = events.map(e => 
      e.event === params.data.event ? params.data : e
    );
    setEvents(updatedEvents);
    
    // Persistir no banco de dados
    if (componentData?.name) {
      saveEventToDatabase(
        componentData.name,
        params.data.event,
        params.data.action
      );
    }
  };
  
  // Função para salvar propriedade no banco
  const savePropertyToDatabase = async (
    componentId: string,
    propertyName: string,
    propertyValue: string | number | boolean
  ) => {
    try {
      const response = await fetch(
        `/api/form-components/${componentId}/properties`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyName,
            propertyValue: String(propertyValue)
          })
        }
      );
      
      if (response.ok) {
        console.log(`✅ Propriedade "${propertyName}" salva no banco`);
      } else {
        console.error(`❌ Erro ao salvar propriedade "${propertyName}"`, await response.text());
      }
    } catch (error) {
      console.error('❌ Erro ao salvar propriedade:', error);
    }
  };
  
  // Função para salvar evento no banco
  const saveEventToDatabase = async (
    componentId: string,
    eventType: string,
    action: string
  ) => {
    try {
      const response = await fetch(
        `/api/form-components/${componentId}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType,
            action
          })
        }
      );
      
      if (response.ok) {
        console.log(`✅ Evento "${eventType}" salvo no banco`);
      } else {
        console.error(`❌ Erro ao salvar evento "${eventType}"`, await response.text());
      }
    } catch (error) {
      console.error('❌ Erro ao salvar evento:', error);
    }
  };
  
  // Função para salvar TODOS os dados ao clicar OK
  const handleSaveAll = async () => {
    if (!componentData?.name) {
      onClose();
      return;
    }
    
    console.log('💾 Salvando TODOS os dados do componente:', componentData.name);
    
    try {
      // Salvar propriedades em lote
      const propertiesMap: Record<string, string> = {};
      properties.forEach(p => {
        propertiesMap[p.property] = String(p.value);
      });
      
      const propsResponse = await fetch(
        `/api/form-components/${componentData.name}/properties/batch`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(propertiesMap)
        }
      );
      
      if (propsResponse.ok) {
        console.log('✅ Propriedades salvas em lote');
      }
      
      // Salvar eventos em lote
      const eventsMap: Record<string, string> = {};
      events.forEach(e => {
        if (e.action && e.action !== '(Vazio)') {
          eventsMap[e.event] = e.action;
        }
      });
      
      if (Object.keys(eventsMap).length > 0) {
        const eventsResponse = await fetch(
          `/api/form-components/${componentData.name}/events/batch`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventsMap)
          }
        );
        
        if (eventsResponse.ok) {
          console.log('✅ Eventos salvos em lote');
        }
      }
      
      // Fechar modal
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      alert('Erro ao salvar dados. Verifique o console.');
    }
  };

  return (
    <div 
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000
      }}
    >
      <div className="context-menu-header">
        <span className="context-menu-title">
          {componentData?.name || 'Nome[EDTNAME]'}
        </span>
        <button 
          className="context-menu-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k as 'properties' | 'events')}
        className="context-menu-tabs"
      >
        <Tab eventKey="properties" title="Propriedades">
          <div className="ag-theme-alpine context-menu-grid">
            <AgGridReact
              rowData={properties}
              columnDefs={propertyColumnDefs}
              gridOptions={gridOptions}
              onCellValueChanged={handlePropertyChange}
              domLayout="autoHeight"
            />
          </div>
        </Tab>

        <Tab eventKey="events" title="Eventos">
          <div className="ag-theme-alpine context-menu-grid">
            <AgGridReact
              rowData={events}
              columnDefs={eventColumnDefs}
              gridOptions={gridOptions}
              onCellValueChanged={handleEventChange}
              domLayout="autoHeight"
            />
          </div>
        </Tab>
      </Tabs>

      <div className="context-menu-footer">
        <button 
          className="btn btn-sm btn-primary"
          onClick={handleSaveAll}
        >
          💾 Salvar Tudo
        </button>
        <button 
          className="btn btn-sm btn-secondary ms-2"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
      {/* Flow Selector Modal */}
      {flowSelectorOpen && (
        <div className="modal-overlay" onClick={() => setFlowSelectorOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h5>Selecionar Flow</h5>
            <div style={{ maxHeight: 240, overflow: 'auto', marginBottom: 8 }}>
              {flowsList.length === 0 && <div>Nenhum flow encontrado.</div>}
              <div style={{ padding: 8, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-outline-success" onClick={openFlowEditorForNew}>Criar Novo Flow</button>
              </div>
              {flowsList.map(f => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 6, borderBottom: '1px solid #eee' }}>
                  <div>
                    <strong>{f.name || f.id}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>{f.description}</div>
                  </div>
                  <div>
                    <button className="btn btn-sm btn-primary me-1" onClick={() => associateFlowToEvent(f.id)}>
                      Associar
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => openFlowEditorForEdit(f.id)}>Editar</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setFlowSelectorOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Params Mapper Modal */}
      {paramsModalOpen && (
        <div className="modal-overlay" onClick={() => setParamsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: 720 }}>
            <h5>Mapear parâmetros do Flow / Função</h5>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>Funções disponíveis</div>
                <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #ddd', padding: 8 }}>
                  {webFunctions.map(wf => (
                    <div key={wf.id} style={{ padding: 6, borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <strong>{wf.name || wf.code}</strong>
                          <div style={{ fontSize: 12, color: '#666' }}>{wf.description}</div>
                        </div>
                        <div>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => saveParamMappings(wf.code)}>Selecionar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>Mapeamento de Parâmetros</div>
                <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid #ddd', padding: 8 }}>
                  {/* Mostrar parâmetros do web function selecionado — simplificado: usar primeiro encontrado */}
                  {webFunctions.length === 0 && <div>Nenhuma função disponível.</div>}
                  {webFunctions.length > 0 && (() => {
                    const wf = webFunctions[0];
                    const params = Array.isArray(wf.params) ? wf.params : [];
                    if (params.length === 0) return <div>Função selecionada não possui parâmetros.</div>;
                    return params.map((p: any) => (
                      <div key={p.name || p.param} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name || p.param}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <select value={paramMappings[p.name || p.param] || ''} onChange={(e) => setParamMappings(Object.assign({}, paramMappings, { [p.name || p.param]: e.target.value }))} style={{ flex: 1 }}>
                            <option value="">-- selecionar campo do componente --</option>
                            {properties.map(prop => (
                              <option key={prop.property} value={prop.property}>{prop.property}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <button className="btn btn-sm btn-primary" onClick={() => {
                    // usar o primeiro webFunction como selecionada por simplicidade
                    const wf = webFunctions[0];
                    if (!wf) return alert('Selecione uma função à esquerda');
                    saveParamMappings(wf.code || wf.id);
                  }}>Salvar Mapeamento</button>
                  <button className="btn btn-sm btn-secondary ms-2" onClick={() => setParamsModalOpen(false)}>Fechar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Flow Editor Modal */}
      {flowEditorOpen && (
        <div className="modal-overlay" onClick={() => setFlowEditorOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: '95%', maxWidth: 1200 }}>
            <FlowStudioEditor
              flow={flowToEdit}
              onClose={() => { setFlowEditorOpen(false); setFlowToEdit(null); if (currentEventRow) openFlowSelector(currentEventRow); }}
              onSaved={(saved) => { if (saved && currentEventRow) { associateFlowToEvent(saved.id || saved.flow_id || saved.code || saved.id); } }}
            />
          </div>
        </div>
      )}
    </div>
  );
};















