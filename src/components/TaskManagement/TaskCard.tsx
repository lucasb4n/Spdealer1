// src/components/TaskManagement/TaskCard.tsx
import React from 'react';
import styled from 'styled-components';
import { TaskManagement, PRIORITY_COLORS, TASK_CATEGORIES, PriorityKey, TaskCategoryKey } from 'TaskManagement';

const Card = styled.div<{ $priority: PriorityKey; $isBlocked: boolean }>`
  position: relative;
  background: white;
  border: 2px solid ${props => PRIORITY_COLORS[props.$priority] || '#ccc'};
  border-radius: 6px;
  padding: 12px 12px 12px 18px;
  cursor: move;
  transition: all 0.2s;
  opacity: ${props => props.$isBlocked ? 0.7 : 1};
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
  
  &:active {
    opacity: 0.8;
  }

  /* left priority bar */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    background: ${props => PRIORITY_COLORS[props.$priority] || '#ccc'};
  }
`;

const CardHeader = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
`;

const TaskId = styled.span`
  font-size: 11px;
  font-weight: 600;
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const AssigneeSelect = styled.select`
  margin-left: 8px;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 6px;
  border: 1px solid #dde2e6;
  background: white;
  color: #333;
`;

const Priority = styled.span<{ $priority: PriorityKey }>`
  font-size: 11px;
  font-weight: 600;
  background: ${props => PRIORITY_COLORS[props.$priority] || '#ccc'};
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const Title = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.3;
  word-break: break-word;
`;

const ImagePreview = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
`;

const Badge = styled.span<{ $type: string }>`
  background: ${props => {
    switch (props.$type) {
      case 'blocked': return '#dc3545';
      case 'high_priority': return '#fd7e14';
      case 'due_soon': return '#ffc107';
      default: return '#6c757d';
    }
  }};
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
`;

const Badges = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

interface TaskCardProps {
  task: TaskManagement;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, draggable = true, onDragStart, onClick }) => {
  const [users, setUsers] = React.useState<Array<{ id: number; name: string }>>([]);
  const [assignee, setAssignee] = React.useState<number | undefined>(task.assigned_to_user_id);

  React.useEffect(() => {
    // carregar lista de usuários (fallbacks tentados)
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/users');
        if (!mounted) return;
        if (resp.ok) {
          const data = await resp.json();
          // data pode ser array de users
          setUsers(Array.isArray(data) ? data.map((u: any) => ({ id: u.id, name: u.name || u.login || u.nome })) : []);
          return;
        }
      } catch (e) {
        // ignore
      }

      // fallback admin endpoint
      try {
        const resp2 = await fetch('/api/admin/users');
        if (!mounted) return;
        if (resp2.ok) {
          const data = await resp2.json();
          setUsers(Array.isArray(data) ? data.map((u: any) => ({ id: u.id, name: u.name || u.login || u.nome })) : []);
        }
      } catch (e) {
        console.debug('[TaskCard] falha ao buscar usuários', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAssigneeChange = async (newId?: number) => {
    const prev = task.assigned_to_user_id;
    setAssignee(newId);

    try {
      // atualizar tarefa via API (PUT)
      await fetch(`/api/v1/tickets/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to_user_id: newId })
      });
    } catch (e) {
      console.error('[TaskCard] erro ao atualizar assignee:', e);
    }

    // gerar comentário automático
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    const userName = users.find(u => u.id === newId)?.name || 'Usuário';
    let text = '';
    if (!prev && newId) {
      text = `${formatted} - ${userName} definido`;
    } else if (prev && newId && prev !== newId) {
      const prevName = users.find(u => u.id === prev)?.name || 'Usuário';
      text = `${formatted} - ${prevName} transferiu a tarefa para ${userName}`;
    } else {
      text = `${formatted} - ${userName} definido`;
    }

    // tentar postar comentário em alguns endpoints possíveis
    const commentBodies = [
      `/api/v1/tasks/${task.id}/comments`,
      `/api/v1/tickets/${task.id}/comments`,
      `/api/v1/tasks/${task.id}/history`,
    ];

    for (const url of commentBodies) {
      try {
        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
        if (resp.ok) break;
      } catch (e) {
        // continue
      }
    }

    // notificar o board para recarregar
    try {
      document.dispatchEvent(new CustomEvent('task:updated', { detail: { id: task.id } }));
    } catch (e) {
      // noop
    }
  };

  return (
    <Card
      $priority={task.priority_key}
      $isBlocked={task.is_blocked}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <CardHeader>
        <TaskId>{task.task_id}</TaskId>
        <Priority $priority={task.priority_key}>{task.priority_key}</Priority>
        <AssigneeSelect value={assignee ?? ''} onChange={(e) => handleAssigneeChange(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">— Sem responsável —</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </AssigneeSelect>
      </CardHeader>

      <Title>{task.title}</Title>

      {task.primary_image_path && (
        <ImagePreview src={task.primary_image_path} alt={task.title} />
      )}

      <Badges>
        {task.is_blocked && <Badge $type="blocked">🔒 Bloqueada</Badge>}
        {task.priority_key === 'critical' && <Badge $type="high_priority">⚠️ Crítica</Badge>}
        {task.category_key && (
          <Badge $type="default">{TASK_CATEGORIES[task.category_key]}</Badge>
        )}
      </Badges>

      <Footer>
        <span>
          {task.attachment_count ? `📎 ${task.attachment_count}` : ''}
        </span>
      </Footer>
    </Card>
  );
};

export default TaskCard;













