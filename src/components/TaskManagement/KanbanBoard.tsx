// src/components/TaskManagement/KanbanBoard.tsx
import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { TaskManagement, TaskStage, PriorityKey, PRIORITY_COLORS, PRIORITY_LABELS } from 'TaskManagement';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import SearchBar from './SearchBar';
import TaskUploadModal from './TaskUploadModal';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const KanbanContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
`;

const ControlPanel = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const BoardContainer = styled.div`
  display: flex;
  gap: 20px;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 10px 0;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const StageColumn = styled.div<{ $bgColor: string }>`
  flex: 0 0 350px;
  background: ${props => props.$bgColor || '#f9f9f9'};
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const StageName = styled.h3`
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  
  span {
    background: #e0e0e0;
    color: #666;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: normal;
  }
`;

const TasksContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  font-style: italic;
  border: 2px dashed #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  background: #0d6efd;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  
  &:hover {
    background: #0b5ed7;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const FilterTag = styled.span<{ $selected: boolean }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? '#0d6efd' : '#e9ecef'};
  color: ${props => props.$selected ? 'white' : '#495057'};
  border: 1px solid ${props => props.$selected ? '#0d6efd' : '#dee2e6'};
  
  &:hover {
    background: ${props => props.$selected ? '#0b5ed7' : '#dee2e6'};
  }
`;

const StatsPanel = styled.div`
  display: flex;
  gap: 15px;
  background: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  
  div {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  strong {
    color: #0d6efd;
  }
`;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface KanbanBoardProps {
  user_id?: number;
  module_key?: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ user_id, module_key }) => {
  const [stages, setStages] = useState<TaskStage[]>([]);
  const [tasks, setTasks] = useState<Map<number, TaskManagement[]>>(new Map());
  const [selectedTask, setSelectedTask] = useState<TaskManagement | undefined>();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityKey | null>(null);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [stats, setStats] = useState({ total: 0, blocked: 0, critical: 0 });

  // ========================================
  // CARREGAR DADOS INICIAIS
  // ========================================

  useEffect(() => {
    loadStages();
    loadTasks();
  }, [user_id, module_key, searchText, priorityFilter, blockedOnly]);

  // Recarregar quando um cartão emite atualização (ex: mudança de responsável)
  React.useEffect(() => {
    const handler = (e: any) => {
      loadTasks();
    };
    document.addEventListener('task:updated', handler as EventListener);
    return () => document.removeEventListener('task:updated', handler as EventListener);
  }, []);

  const loadStages = async () => {
    try {
      const response = await fetch('/api/v1/tasks/stages');
      if (!response.ok) {
        console.warn(`Erro ao carregar estágios: ${response.status}`);
        setStages([]);
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      // Garantir que data é um array
      setStages(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar estágios:', error);
      setStages([]);
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      let url = '/api/v1/tasks';
      if (module_key) url += `?module_key=${module_key}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Agrupar tarefas por estágio
      const tasksByStage = new Map<number, TaskManagement[]>();
      stages.forEach(stage => tasksByStage.set(stage.id, []));
      
      data.forEach((task: TaskManagement) => {
        // Filtrar por prioridade
        if (priorityFilter && task.priority_key !== priorityFilter) return;
        
        // Filtrar por bloqueio
        if (blockedOnly && !task.is_blocked) return;
        
        // Filtrar por busca
        if (searchText && !task.title.toLowerCase().includes(searchText.toLowerCase())) return;
        
        const stageId = task.current_stage_id;
        if (!tasksByStage.has(stageId)) {
          tasksByStage.set(stageId, []);
        }
        tasksByStage.get(stageId)!.push(task);
      });
      
      setTasks(tasksByStage);
      
      // Calcular estatísticas
      setStats({
        total: data.length,
        blocked: data.filter((t: TaskManagement) => t.is_blocked).length,
        critical: data.filter((t: TaskManagement) => t.priority_key === 'critical').length,
      });
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // DRAG AND DROP
  // ========================================

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: TaskManagement) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', task.id.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, toStageId: number) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_stage_id: toStageId }),
      });
      
      if (response.ok) {
        loadTasks();
      }
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
    }
  };

  // ========================================
  // HANDLERS
  // ========================================

  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setShowTaskModal(true);
  };

  const handleSelectTask = (task: TaskManagement) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSaved = () => {
    setShowTaskModal(false);
    loadTasks();
  };

  const handleTaskDeleted = () => {
    setShowTaskModal(false);
    loadTasks();
  };

  // ========================================
  // RENDER
  // ========================================

  if (isLoading) {
    return <KanbanContainer>Carregando...</KanbanContainer>;
  }

  // Defensive check: stages deve ser um array
  const stagesArray = Array.isArray(stages) ? stages : [];
  
  if (stagesArray.length === 0) {
    return (
      <KanbanContainer>
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px' }}>
          ⚠️ Nenhum estágio disponível. Verifique a API: /api/v1/tasks/stages
        </div>
      </KanbanContainer>
    );
  }

  return (
    <KanbanContainer>
      {/* Painel de controle */}
      <ControlPanel>
        <SearchBar 
          value={searchText} 
          onChange={setSearchText} 
          placeholder="Buscar tarefas..."
        />
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <FilterTag 
            $selected={blockedOnly} 
            onClick={() => setBlockedOnly(!blockedOnly)}
          >
            🔒 Bloqueadas ({stats.blocked})
          </FilterTag>
          
          {(['low', 'normal', 'high', 'critical'] as PriorityKey[]).map(priority => (
            <FilterTag 
              key={priority}
              $selected={priorityFilter === priority}
              onClick={() => setPriorityFilter(priorityFilter === priority ? null : priority)}
              style={{ borderColor: PRIORITY_COLORS[priority] }}
            >
              {PRIORITY_LABELS[priority]}
            </FilterTag>
          ))}
        </div>
        
        <Button onClick={handleCreateTask}>+ Nova Tarefa</Button>
      </ControlPanel>

      {/* Painel de estatísticas */}
      <StatsPanel>
        <div>📊 Total: <strong>{stats.total}</strong></div>
        <div>🔒 Bloqueadas: <strong>{stats.blocked}</strong></div>
        <div>⚠️ Críticas: <strong>{stats.critical}</strong></div>
      </StatsPanel>

      {/* Board */}
      <BoardContainer>
        {stagesArray.map(stage => (
          <StageColumn
            key={stage.id}
            $bgColor={stage.color_bg}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <StageName>
              {stage.stage_name}
              <span>{tasks.get(stage.id)?.length || 0}</span>
            </StageName>
            
            <TasksContainer>
              {(tasks.get(stage.id) || []).length > 0 ? (
                (tasks.get(stage.id) || []).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, task)}
                    onClick={() => handleSelectTask(task)}
                  />
                ))
              ) : (
                <EmptyState>Nenhuma tarefa</EmptyState>
              )}
            </TasksContainer>
          </StageColumn>
        ))}
      </BoardContainer>

      {/* Modais */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          is_open={showTaskModal}
          on_close={() => setShowTaskModal(false)}
          on_save={handleTaskSaved}
          on_delete={handleTaskDeleted}
        />
      )}

      {showUploadModal && selectedTask && (
        <TaskUploadModal
          task_id={selectedTask.id}
          is_open={showUploadModal}
          on_close={() => setShowUploadModal(false)}
          on_upload_complete={() => {
            setShowUploadModal(false);
            loadTasks();
          }}
        />
      )}
    </KanbanContainer>
  );
};

export default KanbanBoard;













