import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from 'services/apiConfig';
/* eslint-disable react-hooks/exhaustive-deps */
import { Droppable, Draggable, DragDropContext } from '@hello-pangea/dnd';
import SearchBar from './SearchBar';
import TimelineKanban from './TimelineKanban';
import './TaskManagerKanban.css';

interface Ticket {
  id: number;
  ticket_number: string;
  task_id: string;
  title: string;
  description?: string;
  priority_key: string;
  status_label: string;
  assigned_to_user_id?: number;
  due_date?: string;
  is_blocked?: boolean;
  blocked_reason?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at?: string;
  completed_at?: string;
  tags?: string;
  category_key?: string;
}

interface KanbanColumn {
  id: number;
  name: string;
  label: string;
  tickets: Ticket[];
}

const TaskManagerKanban: React.FC = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 2, name: 'emAberto', label: '📝 Em Aberto', tickets: [] },
    { id: 3, name: 'processando', label: '🔄 Processando', tickets: [] },
    { id: 4, name: 'aguardando', label: '⏳ Aguardando Aprovação', tickets: [] },
    { id: 5, name: 'concluido', label: '✅ Concluído', tickets: [] },
    { id: 6, name: 'negado', label: '❌ Negado', tickets: [] },
  ]);

  const [filteredColumns, setFilteredColumns] = useState<KanbanColumn[]>(columns);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTerm, _setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [draggingTicketId, setDraggingTicketId] = useState<number | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  
  // Estado para modal flutuante
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalTab, setModalTab] = useState<'view' | 'edit' | 'comments' | 'timeline'>('view');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    priority_key: 'normal',
    estimated_hours: 0,
    due_date: '',
    is_blocked: false,
    blocked_reason: ''
  });
  
  // Estado para modal de criação de ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    priority_key: 'normal',
    estimated_hours: 0,
    due_date: ''
  });

  // Estado para confirmar exclusão
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Estado para timeline de relacionamentos
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineTicketId, setTimelineTicketId] = useState<number | null>(null);

  // Carregar tickets ao inicializar (protegido contra double-invoke do StrictMode em DEV)
  const _initialLoadGuard = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (_initialLoadGuard.current) return;
    _initialLoadGuard.current = true;
    loadTickets();
    // Refresh automático desativado: o botão "Atualizar" acionará manualmente a função.
    // Se quiser reativar o refresh automático, descomente abaixo e ajuste o intervalo.
    // const interval = setInterval(loadTickets, 30000);
    // return () => clearInterval(interval);
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [searchTerm, priorityFilter, columns]);

  const loadTickets = async () => {
    if (draggingTicketId) {
      console.log('[TaskManagerKanban] Skip loadTickets while dragging:', draggingTicketId);
      return;
    }
    try {
      setLoading(true);
      console.log('[TaskManagerKanban] Iniciando fetch de tickets...');
      const response = await fetch(`${API_BASE_URL}/v1/tickets/kanban/summary`);
      const data = await response.json();

      console.log('[TaskManagerKanban] Response recebido:', data);
      console.log('[TaskManagerKanban] Estrutura data.stages:', Object.keys(data.stages || {}));

      if (data.success && data.stages) {
        // Reorganizar tickets por stage - CORRIGIR: usar data.stages, não data.kanban
        const newColumns = columns.map(col => {
          const stageKey = `stage_${col.id}`;
          const stageData = data.stages[stageKey];
          const tickets = stageData?.tickets || [];
          console.log(`[TaskManagerKanban] Stage ${col.id} (${stageKey}): ${tickets.length} tickets`);
          return {
            ...col,
            tickets: tickets
          };
        });
        console.log('[TaskManagerKanban] Colunas atualizadas com tickets');
        setColumns(newColumns);
        // Sincronizar filteredColumns após carregar novos tickets
        setFilteredColumns(newColumns);
        
        // DEBUG: Mostrar todos os IDs dos tickets
        const allTicketIds = newColumns.flatMap(col => col.tickets.map((t: Ticket) => t.id));
        console.log('[TaskManagerKanban] ✅ TODOS OS TICKET IDs:', allTicketIds);
        console.log('[TaskManagerKanban] Total de tickets:', allTicketIds.length);
      } else {
        console.warn('[TaskManagerKanban] Resposta inválida ou sem success=true');
      }
    } catch (error) {
      console.error('[TaskManagerKanban] Erro ao carregar tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (draggingTicketId) {
      // Evitar recalcular filtros enquanto usuário está arrastando (evita desmontagens)
      return;
    }
    let filtered = columns.map(col => ({
      ...col,
      tickets: col.tickets.filter(ticket => {
        const matchesSearch = 
          (ticket.ticket_number?.toString() || '').includes(searchTerm) ||
          ticket.task_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesPriority = 
          priorityFilter === 'all' || ticket.priority_key === priorityFilter;

        return matchesSearch && matchesPriority;
      })
    }));
    setFilteredColumns(filtered);
  };

  const handleDragStart = (start: any) => {
    try {
      const match = start?.draggableId?.match(/ticket-(\d+)/);
      if (match) setDraggingTicketId(parseInt(match[1]));
    } catch (e) {
      // ignore
    }
    console.log('[DRAG-START]', start);
  };

  const handleDragUpdate = (update: any) => {
    console.log('[DRAG-UPDATE]', update);
  };

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId, reason } = result;

    console.log('[DRAG-END] ====== DRAG INICIADO ======');
    console.log('[DRAG-END] draggableId:', draggableId);
    console.log('[DRAG-END] reason:', reason);
    console.log('[DRAG-END] source:', source);
    console.log('[DRAG-END] destination:', destination);
    console.log('[DRAG-END] Todos os tickets BRUTOS (não filtrados):', columns.flatMap(c => c.tickets.map(t => ({ id: t.id, stage: c.id }))));

    // Validar se há destino
    if (!destination) {
      console.log('[DRAG-END] ℹ️ Sem destino - operação cancelada');
      return;
    }

    // Validar se posição mudou
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      console.log('[DRAG-END] ℹ️ Mesma posição - nenhuma ação necessária');
      return;
    }

    // Extrair IDs a partir do draggableId
    const match = draggableId.match(/ticket-(\d+)/);
    if (!match) {
      console.error('[DRAG-END] ❌ Não conseguiu extrair ticket ID de:', draggableId);
      return;
    }
    
    const ticketId = parseInt(match[1]);
    const newStageId = parseInt(destination.droppableId);
    const sourceStageId = parseInt(source.droppableId);

    console.log(`[DRAG-END] 🎯 Extraído ticketId=${ticketId}, source=${sourceStageId}, dest=${newStageId}`);

    // VALIDAR: O ticket existe nos dados BRUTOS (columns, não filteredColumns)?
    const sourceColumn = columns.find(c => c.id === sourceStageId);
    console.log(`[DRAG-END] Coluna fonte encontrada:`, sourceColumn ? `${sourceColumn.tickets.length} tickets` : 'NÃO ENCONTRADA');
    
    if (!sourceColumn) {
      console.error(`[DRAG-END] ❌ ERRO: Coluna ${sourceStageId} não encontrada`);
      setDragError(`Erro: Coluna ${sourceStageId} não encontrada`);
      setTimeout(() => setDragError(null), 5000);
      return;
    }

    const ticketData = sourceColumn.tickets.find((t: Ticket) => t.id === ticketId);
    console.log(`[DRAG-END] Ticket encontrado:`, ticketData ? `${ticketData.task_id}` : 'NÃO ENCONTRADO');
    
    if (!ticketData) {
      console.error(`[DRAG-END] ❌ ERRO: Ticket ${ticketId} não encontrado na coluna ${sourceStageId}`);
      console.log(`[DRAG-END] Tickets disponíveis em stage ${sourceStageId}:`, sourceColumn.tickets.map(t => t.id));
      setDragError(`Ticket ${ticketId} não encontrado. Recarregando...`);
      setTimeout(() => {
        loadTickets();
        setDragError(null);
      }, 2000);
      return;
    }

    // Guardar estado anterior para rollback
    const previousColumns = columns;
    
    // Atualizar UI imediatamente (otimista)
    setDraggingTicketId(ticketId);
    setDragError(null);

    // Encontrar e mover o ticket localmente
    const updatedColumns = columns.map(col => {
      if (col.id === parseInt(source.droppableId)) {
        // Remover do antigo
        return {
          ...col,
          tickets: col.tickets.filter((t: Ticket) => t.id !== ticketId)
        };
      }
      if (col.id === parseInt(destination.droppableId)) {
        // Adicionar ao novo (mantém a ordem)
        const ticket = previousColumns
          .find(c => c.id === parseInt(source.droppableId))
          ?.tickets.find((t: Ticket) => t.id === ticketId);
        
        if (ticket) {
          const newTickets = [...col.tickets];
          newTickets.splice(destination.index, 0, ticket);
          return {
            ...col,
            tickets: newTickets
          };
        }
      }
      return col;
    });

    setColumns(updatedColumns);
    setFilteredColumns(updatedColumns);

    try {
      console.log(`[DRAG-END] Fazendo requisição PUT /api/v1/tickets/${ticketId}/stage`);
      const response = await fetch(
        `${API_BASE_URL}/v1/tickets/${ticketId}/stage`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage_id: newStageId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Erro desconhecido'}`);
      }

      const data = await response.json();
      console.log('[DRAG-END] ✅ Sucesso! Resposta:', data);

      // Recarregar tickets para garantir sincronização
      await loadTickets();
      
    } catch (error: any) {
      console.error('[DRAG-END] ❌ Erro ao atualizar fase:', error);
      
      // Rollback da UI
      setColumns(previousColumns);
      setFilteredColumns(previousColumns);
      
      const errorMsg = error.message || 'Erro ao mover ticket';
      setDragError(errorMsg);
      
      // Limpar mensagem de erro após 5 segundos
      setTimeout(() => setDragError(null), 5000);
    } finally {
      setDraggingTicketId(null);
    }
  };

  // Handlers para os botões do modal
  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalTab('view');
    // Carregar comentários
    loadComments(ticket.id);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditForm({
      title: ticket.title || '',
      priority_key: ticket.priority_key || 'normal',
      estimated_hours: ticket.estimated_hours || 0,
      due_date: ticket.due_date || '',
      is_blocked: ticket.is_blocked || false,
      blocked_reason: ticket.blocked_reason || ''
    });
    setModalTab('edit');
  };

  const handleCommentsTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalTab('comments');
    loadComments(ticket.id);
  };

  /**
   * Callback do SearchBar: quando usuário clica em um resultado
   * Abre o ticket em modal e exibe sua timeline de relacionamentos
   */
  const handleSearchResultSelect = (result: any) => {
    console.log('[TaskManagerKanban] Resultado de busca selecionado:', result);
    
    // Encontrar o ticket nos dados carregados
    const foundTicket = columns
      .flatMap(col => col.tickets)
      .find(t => t.id === result.id);
    
    if (foundTicket) {
      setSelectedTicket(foundTicket);
      setModalTab('view');
      setTimelineTicketId(result.id);
      setShowTimeline(true);
    } else {
      console.warn('Ticket não encontrado nos dados carregados:', result.id);
    }
  };

  const loadComments = async (ticketId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/tickets/${ticketId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/tickets/${selectedTicket.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newComment })
        }
      );

      if (response.ok) {
        setNewComment('');
        loadComments(selectedTicket.id);
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const handleSaveTicket = async (updatedData: any) => {
    if (!selectedTicket) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/v1/tickets/${selectedTicket.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        }
      );

      if (response.ok) {
        loadTickets();
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Erro ao salvar ticket:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!createForm.title.trim()) {
      alert('O título é obrigatório');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/v1/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      if (response.ok) {
        setShowCreateModal(false);
        setCreateForm({ title: '', description: '', priority_key: 'normal', estimated_hours: 0, due_date: '' });
        await loadTickets();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Erro ao criar ticket: ${err.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      alert('Erro ao criar ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDeleteConfirm(null);
        setSelectedTicket(null);
        await loadTickets();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Erro ao excluir ticket: ${err.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      alert('Erro ao excluir ticket');
    }
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalTab('view');
    setNewComment('');
    setEditForm({ title: '', priority_key: 'normal', estimated_hours: 0, due_date: '', is_blocked: false, blocked_reason: '' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'normal': return '#0066cc';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴 ALTA';
      case 'normal': return '🟡 NORMAL';
      case 'low': return '🟢 BAIXA';
      default: return priority;
    }
  };

  return (
    <div className="task-manager-kanban">
      {/* MENSAGEM DE ERRO DRAG-DROP */}
      {dragError && (
        <div className="drag-error-banner">
          <span>❌ {dragError}</span>
          <button onClick={() => setDragError(null)} className="drag-error-close">✕</button>
        </div>
      )}

      {/* HEADER */}
      <div className="kanban-header">
        <h1>📊 Gerenciador de Tickets</h1>
        <div className="kanban-controls">
          {/* SearchBar Global com debounce e dropdown */}
          <SearchBar 
            onResultSelect={handleSearchResultSelect}
            placeholder="Buscar ticket, task, título, módulo..."
            debounceDelay={300}
          />

          {/* Filtro de Prioridade */}
          <div className="priority-filter">
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas Prioridades</option>
              <option value="high">🔴 Alta</option>
              <option value="normal">🟡 Normal</option>
              <option value="low">🟢 Baixa</option>
            </select>
          </div>

          {/* Botões de Ação */}
          <button onClick={loadTickets} className="btn-refresh">
            🔄 Atualizar
          </button>
          <button className="btn-add-ticket" onClick={() => setShowCreateModal(true)}>
            ➕ Novo Ticket
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && <div className="loading-spinner">Carregando tickets...</div>}

      {/* KANBAN BOARD - Renderizar TODOS os tickets (não filtrados) para evitar problemas com drag-drop */}
      {!loading && (
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} onDragUpdate={handleDragUpdate}>
          <div className="kanban-board">
            {columns.map(column => {
              // Também calcular contagem filtrada para exibição
              const filteredColumn = filteredColumns.find(fc => fc.id === column.id);
              const displayCount = filteredColumn?.tickets.length || 0;
              
              return (
              <Droppable key={column.id} droppableId={column.id.toString()}>
                {(provided, snapshot) => (
                  <div
                    className={`kanban-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {/* HEADER DA COLUNA */}
                    <div className="column-header">
                      <h2>{column.label}</h2>
                      <span className="ticket-count">{displayCount}</span>
                    </div>

                    {/* TICKETS - Renderizar apenas os tickets visíveis para índices consistentes com DnD */}
                    <div className="tickets-container">
                      {(() => {
                        const visibleTickets = filteredColumn?.tickets || [];
                        const ticketIds = visibleTickets.map((t: Ticket) => t.id);
                        console.log(`[Render] Coluna ${column.id} (${column.name}): ${column.tickets.length} tickets TOTAIS, ${visibleTickets.length} visíveis`, ticketIds);
                        return visibleTickets.map((ticket, index) => {
                          return (
                            <Draggable
                              key={`ticket-${ticket.id}`}
                              draggableId={`ticket-${ticket.id}`}
                              index={index}
                            >
                            {(provided, snapshot) => (
                              <div
                                className={`ticket-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                data-draggable-id={`ticket-${ticket.id}`}
                                data-col-id={column.id}
                                data-idx={index}
                                style={{
                                  borderLeft: `4px solid ${getPriorityColor(ticket.priority_key)}`,
                                  ...(provided.draggableProps.style || {}),
                                }}
                                >
                              {/* BADGE DO TICKET */}
                              <div className="ticket-badge">
                                <span className="ticket-number">#{ticket.ticket_number}</span>
                                <span className="ticket-priority" title={getPriorityLabel(ticket.priority_key)}>
                                  {getPriorityLabel(ticket.priority_key)}
                                </span>
                              </div>

                              {/* CÓDIGO DA TASK */}
                              <div className="ticket-code">
                                <strong>{ticket.task_id}</strong>
                              </div>

                              {/* TÍTULO */}
                              <h3 className="ticket-title">{ticket.title}</h3>

                              {/* TAGS */}
                              {ticket.estimated_hours && (
                                <div className="ticket-hours">
                                  ⏱️ {ticket.estimated_hours}h estimadas
                                </div>
                              )}

                              {/* BLOQUEADOR */}
                              {ticket.is_blocked && (
                                <div className="ticket-blocked">
                                  🚫 Bloqueado: {ticket.blocked_reason || 'Sem motivo'}
                                </div>
                              )}

                              {/* DATA DE VENCIMENTO */}
                              {ticket.due_date && (
                                <div className="ticket-due-date">
                                  📅 {new Date(ticket.due_date).toLocaleDateString('pt-BR')}
                                </div>
                              )}

                              {/* AÇÕES */}
                              <div className="ticket-actions">
                                <button 
                                  className="btn-view" 
                                  title="Visualizar"
                                  onClick={() => handleViewTicket(ticket)}
                                >
                                  👁️
                                </button>
                                <button 
                                  className="btn-edit" 
                                  title="Editar"
                                  onClick={() => handleEditTicket(ticket)}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="btn-comment" 
                                  title="Comentários"
                                  onClick={() => handleCommentsTicket(ticket)}
                                >
                                  💬
                                </button>
                                <button 
                                  className="btn-timeline" 
                                  title="Ver Relacionamentos e Timeline"
                                  onClick={() => {
                                    setTimelineTicketId(ticket.id);
                                    setShowTimeline(true);
                                  }}
                                >
                                  🔗
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                          );
                        });
                      })()}
                      {provided.placeholder}
                    </div>

                    {/* COLUNA VAZIA */}
                    {column.tickets.length === 0 && (
                      <div className="empty-column">
                        Nenhum ticket aqui
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* MODAL DE CRIAÇÃO DE TICKET */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Novo Ticket</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="tab-content">
                <div className="form-group">
                  <label>Título <span style={{color:'red'}}>*</span></label>
                  <input type="text" className="form-input" placeholder="Título do ticket"
                    value={createForm.title}
                    onChange={e => setCreateForm(f => ({...f, title: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea className="form-input" rows={3} placeholder="Descrição (opcional)"
                    value={createForm.description}
                    onChange={e => setCreateForm(f => ({...f, description: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Prioridade</label>
                  <select className="form-input"
                    value={createForm.priority_key}
                    onChange={e => setCreateForm(f => ({...f, priority_key: e.target.value}))}>
                    <option value="high">🔴 Alta</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="low">🟢 Baixa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Horas Estimadas</label>
                  <input type="number" className="form-input" placeholder="Horas"
                    value={createForm.estimated_hours}
                    onChange={e => setCreateForm(f => ({...f, estimated_hours: Number(e.target.value)}))} />
                </div>
                <div className="form-group">
                  <label>Data de Vencimento</label>
                  <input type="date" className="form-input"
                    value={createForm.due_date}
                    onChange={e => setCreateForm(f => ({...f, due_date: e.target.value}))} />
                </div>
                <div style={{display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'16px'}}>
                  <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                  <button className="btn-save" onClick={handleCreateTicket}>💾 Criar Ticket</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content modal-confirm" onClick={(e) => e.stopPropagation()}
            style={{maxWidth:'400px'}}>
            <div className="modal-header">
              <h2>🗑️ Confirmar Exclusão</h2>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir o ticket <strong>#{deleteConfirm}</strong>?</p>
              <p style={{color:'#ef4444', fontSize:'13px'}}>Esta ação não pode ser desfeita.</p>
              <div style={{display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'16px'}}>
                <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button className="btn-delete" onClick={() => handleDeleteTicket(deleteConfirm)}
                  style={{background:'#ef4444', color:'#fff', border:'none', padding:'8px 18px', borderRadius:'6px', fontWeight:600, cursor:'pointer'}}>
                  🗑️ Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE DE RELACIONAMENTOS (FLUTUANTE) */}
      {showTimeline && timelineTicketId && (
        <div className="timeline-panel">
          <div className="timeline-header">
            <h3>Relacionamentos de #{timelineTicketId}</h3>
            <button 
              className="timeline-close"
              onClick={() => {
                setShowTimeline(false);
                setTimelineTicketId(null);
              }}
            >
              ✕
            </button>
          </div>
          <TimelineKanban 
            ticketId={timelineTicketId}
            onTicketClick={(ticket) => {
              console.log('Clicou em ticket da timeline:', ticket);
              handleSearchResultSelect(ticket);
            }}
            activeTicketId={selectedTicket?.id}
          />
        </div>
      )}

      {/* MODAL FLUTUANTE */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* HEADER DO MODAL */}
            <div className="modal-header">
              <h2>Ticket #{selectedTicket.ticket_number}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {/* ABAS */}
            <div className="modal-tabs">
              <button 
                className={`tab-button ${modalTab === 'view' ? 'active' : ''}`}
                onClick={() => setModalTab('view')}
              >
                👁️ Visualizar
              </button>
              <button 
                className={`tab-button ${modalTab === 'edit' ? 'active' : ''}`}
                onClick={() => setModalTab('edit')}
              >
                ✏️ Editar
              </button>
              <button 
                className={`tab-button ${modalTab === 'comments' ? 'active' : ''}`}
                onClick={() => setModalTab('comments')}
              >
                💬 Comentários ({comments.length})
              </button>
              <button 
                className={`tab-button ${modalTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setModalTab('timeline')}
              >
                🔗 Relacionamentos
              </button>
            </div>

            {/* CONTEÚDO DAS ABAS */}
            <div className="modal-body">
              {/* ABA VISUALIZAR */}
              {modalTab === 'view' && (
                <div className="tab-content">
                  <div className="info-group">
                    <label>ID da Tarefa:</label>
                    <p>{selectedTicket.task_id}</p>
                  </div>
                  <div className="info-group">
                    <label>Título:</label>
                    <p>{selectedTicket.title}</p>
                  </div>
                  {selectedTicket.description && (
                    <div className="info-group">
                      <label>Descrição:</label>
                      <p style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordWrap: 'break-word',
                        backgroundColor: '#f9f9f9',
                        padding: '12px',
                        borderRadius: '4px',
                        maxHeight: '300px',
                        overflow: 'auto'
                      }}>
                        {selectedTicket.description}
                      </p>
                    </div>
                  )}
                  <div className="info-group">
                    <label>Status:</label>
                    <p>{selectedTicket.status_label}</p>
                  </div>
                  <div className="info-group">
                    <label>Prioridade:</label>
                    <p>{getPriorityLabel(selectedTicket.priority_key)}</p>
                  </div>
                  {selectedTicket.estimated_hours && (
                    <div className="info-group">
                      <label>Horas Estimadas:</label>
                      <p>{selectedTicket.estimated_hours}h</p>
                    </div>
                  )}
                  {selectedTicket.actual_hours && (
                    <div className="info-group">
                      <label>Horas Reais:</label>
                      <p>{selectedTicket.actual_hours}h</p>
                    </div>
                  )}
                  {selectedTicket.due_date && (
                    <div className="info-group">
                      <label>Data de Vencimento:</label>
                      <p>{new Date(selectedTicket.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {selectedTicket.tags && (
                    <div className="info-group">
                      <label>Tags:</label>
                      <p>{selectedTicket.tags}</p>
                    </div>
                  )}
                  {selectedTicket.is_blocked && (
                    <div className="info-group blocked">
                      <label>🚫 Bloqueado:</label>
                      <p>{selectedTicket.blocked_reason || 'Sem motivo'}</p>
                    </div>
                  )}
                  <div style={{display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'24px', paddingTop:'16px', borderTop:'1px solid #e5e7eb'}}>
                    <button className="btn-delete" onClick={() => {
                      setDeleteConfirm(selectedTicket.id);
                    }}
                      style={{background:'#ef4444', color:'#fff', border:'none', padding:'8px 18px', borderRadius:'6px', fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'8px'}}>
                      🗑️ Excluir
                    </button>
                  </div>
                </div>
              )}

              {/* ABA EDITAR */}
              {modalTab === 'edit' && (
                <div className="tab-content">
                  <div className="form-group">
                    <label>Título:</label>
                    <input 
                      type="text" 
                      value={editForm.title}
                      onChange={e => setEditForm(f => ({...f, title: e.target.value}))}
                      placeholder="Título do ticket"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Prioridade:</label>
                    <select className="form-input" value={editForm.priority_key}
                      onChange={e => setEditForm(f => ({...f, priority_key: e.target.value}))}>
                      <option value="high">🔴 Alta</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="low">🟢 Baixa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Horas Estimadas:</label>
                    <input 
                      type="number" 
                      value={editForm.estimated_hours}
                      onChange={e => setEditForm(f => ({...f, estimated_hours: Number(e.target.value)}))}
                      placeholder="Horas"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Data de Vencimento:</label>
                    <input 
                      type="date" 
                      value={editForm.due_date}
                      onChange={e => setEditForm(f => ({...f, due_date: e.target.value}))}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input type="checkbox" checked={editForm.is_blocked}
                        onChange={e => setEditForm(f => ({...f, is_blocked: e.target.checked}))} />
                      {' '}Bloqueado
                    </label>
                  </div>
                  <div className="form-group">
                    <label>Motivo do Bloqueio:</label>
                    <textarea 
                      value={editForm.blocked_reason}
                      onChange={e => setEditForm(f => ({...f, blocked_reason: e.target.value}))}
                      placeholder="Motivo (se aplicável)"
                      className="form-input"
                      rows={3}
                    />
                  </div>
                  <button 
                    className="btn-save"
                    onClick={() => {
                      handleSaveTicket({
                        title: editForm.title,
                        priority_key: editForm.priority_key,
                        estimated_hours: editForm.estimated_hours,
                        due_date: editForm.due_date,
                        is_blocked: editForm.is_blocked,
                        blocked_reason: editForm.blocked_reason
                      });
                    }}
                  >
                    💾 Salvar Alterações
                  </button>
                </div>
              )}

              {/* ABA COMENTÁRIOS */}
              {modalTab === 'comments' && (
                <div className="tab-content">
                  <div className="comments-list">
                    {comments.length === 0 ? (
                      <p className="no-comments">Nenhum comentário ainda</p>
                    ) : (
                      comments.map((comment: any, idx: number) => (
                        <div key={idx} className="comment-item">
                          <div className="comment-header">
                            <strong>{comment.user_name || 'Usuário'}</strong>
                            <span className="comment-date">
                              {new Date(comment.created_at).toLocaleDateString('pt-BR')} 
                              {' '}
                              {new Date(comment.created_at).toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                          <p className="comment-text">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="comment-form">
                    <textarea 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Adicionar um comentário..."
                      className="comment-input"
                      rows={3}
                    />
                    <button 
                      className="btn-add-comment"
                      onClick={handleAddComment}
                    >
                      ➕ Adicionar Comentário
                    </button>
                  </div>
                </div>
              )}

              {/* ABA RELACIONAMENTOS */}
              {modalTab === 'timeline' && selectedTicket && (
                <div className="tab-content timeline-tab">
                  <TimelineKanban 
                    ticketId={selectedTicket.id}
                    onTicketClick={(ticket) => {
                      console.log('Clicou em ticket da timeline:', ticket);
                      handleSearchResultSelect(ticket);
                    }}
                    activeTicketId={selectedTicket.id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagerKanban;













