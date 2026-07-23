/**
 * DayPilotCalendarWrapper.tsx
 * 
 * Wrapper para integração do DayPilot Lite Calendar no FormBuilder v2.0
 * 
 * Funcionalidades:
 * - Múltiplas views (Day, Week, Month, Resources)
 * - Drag & drop para criar/mover/redimensionar eventos
 * - Modal dialog integrado para edição de eventos
 * - Context menu customizável
 * - 4 CSS themes incluídos
 * - TypeScript support completo
 * 
 * Licença: Apache 2.0 (Open-Source)
 * Documentação: https://doc.daypilot.org/calendar/
 * 
 * Criado: 11 JAN 2026
 * Versão: 1.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { DayPilot } from '@daypilot/daypilot-lite-react';
import styled from 'styled-components';

// ========================================
// INTERFACES
// ========================================

export interface CalendarEvent {
  id: string | number;
  text: string;
  start: string | Date; // ISO format: "2026-01-15T09:00:00"
  end: string | Date;
  resource?: string; // Para Scheduler view
  barColor?: string; // Cor do evento
  backColor?: string; // Cor de fundo
  toolTip?: string; // Tooltip customizado
  tags?: Record<string, any>; // Dados extras
}

export interface DayPilotCalendarWrapperProps {
  // Tipo de calendário
  componentType?: 'calendar' | 'month' | 'scheduler' | 'navigator';
  
  // Configurações visuais
  viewType?: 'Day' | 'Week' | 'Month' | 'Resources'; // Para Calendar
  theme?: 'calendar_white' | 'calendar_green' | 'calendar_traditional' | 'calendar_transparent' | 'calendar_spdealer';
  startDate?: string | Date; // Data inicial
  height?: string | number; // Altura do componente
  
  // Dados
  events?: CalendarEvent[]; // Lista de eventos
  columns?: Array<{ name: string; id: string }>; // Para Scheduler (recursos)
  
  // Configurações de comportamento
  eventDeleteHandling?: 'Disabled' | 'Update' | 'CallBack';
  timeRangeSelectedHandling?: 'Enabled' | 'Disabled';
  eventMoveHandling?: 'Update' | 'Disabled' | 'CallBack';
  eventResizeHandling?: 'Update' | 'Disabled' | 'CallBack';
  eventClickHandling?: 'Enabled' | 'Disabled';
  
  // Time settings
  businessBeginsHour?: number; // Ex: 8 (8:00 AM)
  businessEndsHour?: number; // Ex: 18 (6:00 PM)
  cellDuration?: number; // Duração de cada célula em minutos (default: 30)
  
  // Callbacks
  onEventClick?: (event: CalendarEvent) => void;
  onEventMove?: (event: CalendarEvent, newStart: string, newEnd: string) => void;
  onEventResize?: (event: CalendarEvent, newStart: string, newEnd: string) => void;
  onEventDelete?: (eventId: string | number) => void;
  onEventCreate?: (start: string, end: string, resource?: string) => void;
  onMonthChange?: (month: number, year: number) => void;
  onDayChange?: (day: Date) => void;
  
  // Context Menu customizado
  contextMenu?: Array<{
    text: string;
    onClick: (event: CalendarEvent) => void;
    icon?: string;
  }>;
  
  // Localização
  locale?: string; // Ex: 'pt-br', 'en-us'
  timeFormat?: 'Clock12Hours' | 'Clock24Hours';
}

// ========================================
// STYLED COMPONENTS
// ========================================

const CalendarContainer = styled.div<{ $height?: string | number }>`
  width: 100%;
  height: ${props => typeof props.$height === 'number' ? `${props.$height}px` : props.$height || '600px'};
  position: relative;
  
  /* Theme SPDealer (Gradiente Roxo/Azul) */
  &.calendar_spdealer {
    .calendar_default_main {
      border-color: #667eea;
    }
    
    .calendar_default_cell_inner {
      border-color: #e0e7ff;
    }
    
    .calendar_default_event_inner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-left: 4px solid #5568d3;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 13px;
      font-weight: 500;
    }
    
    .calendar_default_event_inner:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transform: translateY(-1px);
      transition: all 0.2s ease;
    }
    
    .calendar_default_colheader_inner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
    }
    
    .calendar_default_corner_inner {
      background: #5568d3;
      color: white;
    }
    
    .calendar_default_divider_horizontal {
      background-color: #e0e7ff;
    }
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .spinner {
    border: 4px solid #f3f4f6;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  padding: 16px;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  margin: 16px;
  
  strong {
    display: block;
    margin-bottom: 8px;
  }
`;

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export const DayPilotCalendarWrapper: React.FC<DayPilotCalendarWrapperProps> = ({
  componentType = 'calendar',
  viewType = 'Week',
  theme = 'calendar_white',
  startDate = new Date(),
  height = '600px',
  events = [],
  columns = [],
  eventDeleteHandling = 'Update',
  timeRangeSelectedHandling = 'Enabled',
  eventMoveHandling = 'Update',
  eventResizeHandling = 'Update',
  eventClickHandling = 'Enabled',
  businessBeginsHour = 8,
  businessEndsHour = 18,
  cellDuration = 30,
  onEventClick,
  onEventMove,
  onEventResize,
  onEventDelete,
  onEventCreate,
  onMonthChange,
  onDayChange,
  contextMenu,
  locale = 'pt-br',
  timeFormat = 'Clock24Hours'
}) => {
  const calendarRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const elementId = `daypilot-${componentType}-${Math.random().toString(36).substr(2, 9)}`;

  // ========================================
  // INICIALIZAÇÃO DO CALENDÁRIO
  // ========================================

  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Configuração base comum
      const baseConfig: any = {
        startDate: startDate,
        theme: theme,
        locale: locale,
        timeFormat: timeFormat,
        eventDeleteHandling: eventDeleteHandling,
        
        // Callbacks de eventos
        onEventClick: (args: any) => {
          if (eventClickHandling === 'Enabled' && onEventClick) {
            const event: CalendarEvent = {
              id: args.e.id(),
              text: args.e.text(),
              start: args.e.start().value,
              end: args.e.end().value,
              resource: args.e.resource(),
              tags: args.e.data
            };
            onEventClick(event);
          }
        },
        
        onEventMove: (args: any) => {
          if (eventMoveHandling === 'Update' && onEventMove) {
            const event: CalendarEvent = {
              id: args.e.id(),
              text: args.e.text(),
              start: args.e.start().value,
              end: args.e.end().value,
              resource: args.e.resource(),
              tags: args.e.data
            };
            onEventMove(event, args.newStart.value, args.newEnd.value);
          }
        },
        
        onEventResize: (args: any) => {
          if (eventResizeHandling === 'Update' && onEventResize) {
            const event: CalendarEvent = {
              id: args.e.id(),
              text: args.e.text(),
              start: args.e.start().value,
              end: args.e.end().value,
              resource: args.e.resource(),
              tags: args.e.data
            };
            onEventResize(event, args.newStart.value, args.newEnd.value);
          }
        },
        
        onEventDelete: (args: any) => {
          if (onEventDelete) {
            onEventDelete(args.e.id());
          }
        },
        
        onTimeRangeSelected: (args: any) => {
          if (timeRangeSelectedHandling === 'Enabled' && onEventCreate) {
            // Abrir modal para criar evento
            const modal = DayPilot.Modal.form([
              { name: 'Título', id: 'text', type: 'text' },
              { name: 'Início', id: 'start', type: 'datetime' },
              { name: 'Fim', id: 'end', type: 'datetime' }
            ], {
              text: '',
              start: args.start,
              end: args.end
            }).then((modal: any) => {
              if (!modal.canceled) {
                onEventCreate(modal.result.start.value, modal.result.end.value, args.resource);
              }
              calendarRef.current.clearSelection();
            });
          }
        }
      };

      // Context menu customizado
      if (contextMenu && contextMenu.length > 0) {
        baseConfig.contextMenu = new DayPilot.Menu({
          items: contextMenu.map(item => ({
            text: item.text,
            onClick: (args: any) => {
              const event: CalendarEvent = {
                id: args.source.id(),
                text: args.source.text(),
                start: args.source.start().value,
                end: args.source.end().value,
                resource: args.source.resource(),
                tags: args.source.data
              };
              item.onClick(event);
            }
          }))
        });
      }

      // Configuração específica por tipo de componente
      if (componentType === 'calendar') {
        const config = {
          ...baseConfig,
          viewType: viewType,
          businessBeginsHour: businessBeginsHour,
          businessEndsHour: businessEndsHour,
          cellDuration: cellDuration,
          eventMoveHandling: eventMoveHandling,
          eventResizeHandling: eventResizeHandling,
          timeRangeSelectedHandling: timeRangeSelectedHandling,
          onBeforeEventRender: (args: any) => {
            // Customizar aparência de eventos individuais
            if (args.data.barColor) {
              args.data.barColor = args.data.barColor;
            }
            if (args.data.backColor) {
              args.data.backColor = args.data.backColor;
            }
            if (args.data.toolTip) {
              args.data.toolTip = args.data.toolTip;
            }
          }
        };

        calendarRef.current = new DayPilot.Calendar(elementId, config);
        
      } else if (componentType === 'month') {
        const config = {
          ...baseConfig,
          eventMoveHandling: eventMoveHandling,
          eventResizeHandling: 'Disabled', // Month não suporta resize
          timeRangeSelectedHandling: timeRangeSelectedHandling,
          onBeforeCellRender: (args: any) => {
            // Highlight de datas especiais
            if (args.cell.start.getDayOfWeek() === 0 || args.cell.start.getDayOfWeek() === 6) {
              args.cell.backColor = '#f3f4f6'; // Cinza claro para fins de semana
            }
          }
        };

        calendarRef.current = new DayPilot.Month(elementId, config);
        
      } else if (componentType === 'scheduler') {
        const config = {
          ...baseConfig,
          viewType: 'Resources',
          columns: columns,
          days: 7, // Mostrar 7 dias por padrão
          eventMoveHandling: eventMoveHandling,
          eventResizeHandling: eventResizeHandling,
          timeRangeSelectedHandling: timeRangeSelectedHandling,
          cellDuration: cellDuration,
          businessBeginsHour: businessBeginsHour,
          businessEndsHour: businessEndsHour
        };

        calendarRef.current = new DayPilot.Scheduler(elementId, config);
        
      } else if (componentType === 'navigator') {
        const config = {
          ...baseConfig,
          showMonths: 3,
          selectMode: viewType === 'Week' ? 'Week' : viewType === 'Month' ? 'Month' : 'Day',
          onTimeRangeSelected: (args: any) => {
            if (onDayChange) {
              onDayChange(args.day.value);
            }
          }
        };

        calendarRef.current = new DayPilot.Navigator(elementId, config);
      }

      // Inicializar calendário
      calendarRef.current.init();
      
      // Atualizar com eventos
      calendarRef.current.update({ events });
      
      setIsLoading(false);

    } catch (err: any) {
      console.error('Erro ao inicializar DayPilot Calendar:', err);
      setError(err.message || 'Erro desconhecido ao inicializar calendário');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (calendarRef.current) {
        calendarRef.current.dispose();
      }
    };
  }, [componentType, viewType, theme, startDate, events, columns]);

  // ========================================
  // EFEITO: Atualizar eventos quando mudam
  // ========================================

  useEffect(() => {
    if (calendarRef.current && !isLoading) {
      calendarRef.current.update({ events });
    }
  }, [events, isLoading]);

  // ========================================
  // RENDER
  // ========================================

  if (error) {
    return (
      <ErrorMessage>
        <strong>❌ Erro ao carregar calendário:</strong>
        {error}
      </ErrorMessage>
    );
  }

  return (
    <CalendarContainer $height={height} className={theme}>
      {isLoading && (
        <LoadingOverlay>
          <div className="spinner" />
        </LoadingOverlay>
      )}
      <div id={elementId} style={{ height: '100%' }} />
    </CalendarContainer>
  );
};

// ========================================
// EXPORT DEFAULT
// ========================================

export default DayPilotCalendarWrapper;















