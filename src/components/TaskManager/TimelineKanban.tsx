import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCheckCircle,
  faClock,
  faExclamationCircle,
  faBan,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import './TimelineKanban.css';
import { API_BASE_URL } from 'services/apiConfig';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const TimelineContainer = styled.div`
  width: 100%;
  padding: 20px 0;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #e9ecef;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #adb5bd;
    border-radius: 3px;

    &:hover {
      background: #868e96;
    }
  }
`;

const TimelineWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 20px;
  min-width: min-content;
`;

const TimelineArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 16px;
  flex-shrink: 0;
  width: 30px;
  opacity: 0.6;

  &:first-child {
    display: none;
  }
`;

const TimelineCard = styled.button<{ $isActive?: boolean; $status?: number }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background-color: ${(p) => (p.$isActive ? '#ffffff' : '#ffffff')};
  border: 2px solid ${(p) => (p.$isActive ? '#0d6efd' : '#dee2e6')};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  width: 160px;
  min-height: 110px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background-color: ${(p) => {
      switch (p.$status) {
        case 2:
          return '#fd7e14'; // Em Aberto
        case 3:
          return '#0dcaf0'; // Processando
        case 4:
          return '#ffc107'; // Aguardando
        case 5:
          return '#198754'; // Concluído
        case 6:
          return '#dc3545'; // Negado
        default:
          return '#6c757d';
      }
    }};
  }

  &:hover {
    border-color: #0d6efd;
    box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  ${(p) =>
    p.$isActive &&
    `
    background-color: #e7f1ff;
    box-shadow: 0 4px 12px rgba(13, 110, 253, 0.25);
    border-color: #0d6efd;
  `}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
`;

const CardTaskId = styled.span`
  font-weight: 600;
  font-size: 12px;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardStatusIcon = styled(FontAwesomeIcon)`
  font-size: 14px;
  flex-shrink: 0;
`;

const CardTitle = styled.span`
  font-size: 11px;
  color: #495057;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: left;
  word-break: break-word;
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;

const MetaBadge = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  background-color: ${(p) => p.$color || '#e9ecef'};
  color: ${(p) => (p.$color === '#e9ecef' ? '#495057' : '#ffffff')};
  text-transform: uppercase;
`;

const PriorityBadge = styled(MetaBadge)<{ $priority?: string }>`
  background-color: ${(p) => {
    switch (p.$priority?.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return '#dc3545';
      case 'MEDIUM':
        return '#ffc107';
      case 'LOW':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }};
  color: #ffffff;
`;

const TimelineTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  margin: 0 0 12px 0;
  padding: 0 20px;
`;

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-size: 13px;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #dc3545;
  font-size: 13px;
`;

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineTicket {
  id: number;
  task_id: string;
  title: string;
  current_stage_id: number;
  priority_key?: string;
  module_key?: string;
  created_at?: string;
  relation_type?: 'parent' | 'child' | 'blocker' | 'blocked_by' | 'related';
}

interface TimelineKanbanProps {
  ticketId: number;
  onTicketClick: (ticket: TimelineTicket) => void;
  activeTicketId?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusIcon = (stageId?: number) => {
  switch (stageId) {
    case 2:
      return faClock; // Em Aberto
    case 3:
      return faExclamationCircle; // Processando
    case 4:
      return faClock; // Aguardando
    case 5:
      return faCheckCircle; // Concluído
    case 6:
      return faBan; // Negado
    default:
      return faLink;
  }
};

const getStatusColor = (stageId?: number) => {
  switch (stageId) {
    case 2:
      return '#fd7e14';
    case 3:
      return '#0dcaf0';
    case 4:
      return '#ffc107';
    case 5:
      return '#198754';
    case 6:
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const getRelationLabel = (type?: string) => {
  switch (type) {
    case 'parent':
      return 'PAI';
    case 'child':
      return 'FILHO';
    case 'blocker':
      return 'BLOQUEIA';
    case 'blocked_by':
      return 'BLOQUEADO';
    case 'related':
      return 'RELACIONADO';
    default:
      return 'LIGADO';
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export const TimelineKanban: React.FC<TimelineKanbanProps> = ({
  ticketId,
  onTicketClick,
  activeTicketId,
}) => {
  const [relatedTickets, setRelatedTickets] = useState<TimelineTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // API CALL - FETCH RELATED TICKETS
  // =========================================================================

  // Tornar fetch reusável para retry e logs melhores
  const fetchRelatedTickets = async () => {
    if (!ticketId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Construir URL absoluta de forma defensiva:
      // - Se API_BASE_URL for uma URL relativa (p.ex. '/api'), em dev preferimos apontar para o backend em localhost:8080
      // - Se for uma URL absoluta (http://...), usamos ela diretamente
      let base = API_BASE_URL || '';
      if (typeof window !== 'undefined') {
        // Se for relativa (começa com '/'), preferir o backend dev direto para evitar proxy mal-configurado
        if (base.startsWith('/')) {
          const devBackend = 'http://localhost:8080';
          base = `${devBackend}${base}`;
        }
      }

      const url = `${base.replace(/\/$/, '')}/v1/tickets/${ticketId}/related`;
      console.log('[TimelineKanban] Fetching related tickets from:', url, '(computed from API_BASE_URL=', API_BASE_URL, ')');

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('[TimelineKanban] Response status:', response.status);

      if (!response.ok) {
        const text = await response.text().catch(() => 'no-body');
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (e) { /* ignore */ }
        console.error('[TimelineKanban] Bad response:', response.status, parsed || text);
        const serverMsg = parsed && parsed.error ? parsed.error : (parsed && parsed.message ? parsed.message : text);
        setError(`Erro ao carregar timeline: ${response.status} ${serverMsg}`);
        return;
      }

      const data = await response.json().catch(() => null);
      console.log('[TimelineKanban] Related tickets raw response:', data);

      if (data && data.success && Array.isArray(data.related)) {
        setRelatedTickets(data.related);
      } else if (Array.isArray(data)) {
        setRelatedTickets(data as any);
      } else if (data && Array.isArray(data.related)) {
        // capa extra (caso o backend retorne objeto com key 'related' sem 'success')
        setRelatedTickets(data.related);
      } else {
        setRelatedTickets([]);
      }
    } catch (err: any) {
      console.error('[TimelineKanban] Erro ao carregar tickets relacionados:', err?.message || err);
      setError('Erro ao carregar timeline. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatedTickets();
  }, [ticketId]);

  // Preparar elementos da timeline (não condicional) — useMemo deve ser chamado sempre na mesma ordem
  const timelineElements = useMemo(() => {
    try {
      return relatedTickets.map((ticket, idx) => {
        const key = `timeline-${ticket.id}-${idx}`;
        return (
          <React.Fragment key={key}>
            {idx > 0 && (
              <TimelineArrow>
                <FontAwesomeIcon icon={faArrowRight} />
              </TimelineArrow>
            )}

            <TimelineCard
              $isActive={activeTicketId === ticket.id}
              $status={ticket.current_stage_id}
              onClick={() => onTicketClick(ticket)}
              title={`${ticket.task_id || ticket.id}: ${ticket.title || ''}`}
            >
              <CardHeader>
                <CardTaskId>{ticket.task_id || `#${ticket.id}`}</CardTaskId>
                <CardStatusIcon
                  icon={getStatusIcon(ticket.current_stage_id)}
                  style={{ color: getStatusColor(ticket.current_stage_id) }}
                />
              </CardHeader>

              <CardTitle>{ticket.title || 'Sem título'}</CardTitle>

              <CardMeta>
                {ticket.priority_key && (
                  <PriorityBadge $priority={ticket.priority_key}>
                    {String(ticket.priority_key).charAt(0).toUpperCase()}
                  </PriorityBadge>
                )}

                {ticket.relation_type && (
                  <MetaBadge $color="#e9ecef">
                    {getRelationLabel(ticket.relation_type)}
                  </MetaBadge>
                )}

                {ticket.module_key && (
                  <MetaBadge $color="#cfe2ff">
                    {ticket.module_key}
                  </MetaBadge>
                )}
              </CardMeta>
            </TimelineCard>
          </React.Fragment>
        );
      });
    } catch (err) {
      console.error('[TimelineKanban] Erro ao renderizar elementos da timeline:', err);
      // setError pode ser chamado condicionalmente, então apenas logamos aqui
      return null;
    }
  }, [relatedTickets, activeTicketId, onTicketClick]);

  // =========================================================================
  // RENDER
  // =========================================================================

  if (isLoading) {
    return (
      <div>
        <TimelineTitle>
          <FontAwesomeIcon icon={faLink} style={{ marginRight: '6px' }} />
          Timeline - Tickets Relacionados
        </TimelineTitle>
        <TimelineContainer>
          <LoadingMessage>Carregando timeline...</LoadingMessage>
        </TimelineContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TimelineTitle>
          <FontAwesomeIcon icon={faLink} style={{ marginRight: '6px' }} />
          Timeline - Tickets Relacionados
        </TimelineTitle>
        <TimelineContainer>
          <ErrorMessage>
            {error}
            <div style={{ marginTop: 8 }}>
              <button onClick={() => fetchRelatedTickets()} style={{ padding: '6px 10px' }}>Tentar novamente</button>
            </div>
          </ErrorMessage>
        </TimelineContainer>
      </div>
    );
  }

  if (relatedTickets.length === 0) {
    return (
      <div>
        <TimelineTitle>
          <FontAwesomeIcon icon={faLink} style={{ marginRight: '6px' }} />
          Timeline - Sem Tickets Relacionados
        </TimelineTitle>
        <TimelineContainer>
          <LoadingMessage>Nenhum ticket relacionado encontrado</LoadingMessage>
        </TimelineContainer>
      </div>
    );
  }
  

  return (
    <div>
      <TimelineTitle>
        <FontAwesomeIcon icon={faLink} style={{ marginRight: '6px' }} />
        Timeline - {relatedTickets.length} Ticket(s) Relacionado(s)
      </TimelineTitle>
      <TimelineContainer>
        <TimelineWrapper>
          {timelineElements}
        </TimelineWrapper>
      </TimelineContainer>
    </div>
  );
};

export default TimelineKanban;













