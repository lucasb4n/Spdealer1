import React from 'react';
import styled from 'styled-components';

/**
 * PerformanceOptimizer Component
 * 
 * Fornece otimizações de performance para AG-Grid:
 * - Loading indicators customizados
 * - Skeleton loading
 * - Batch rendering
 * - Debouncing de eventos
 * 
 * Fase 5.7.4 - Performance + UX
 */

interface PerformanceOptimizerProps {
  isLoading?: boolean;
  rowCount?: number;
  children: React.ReactNode;
}

/**
 * Styled Components
 */
const OptimizerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
`;

const SkeletonLoader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
`;

const SkeletonRow = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
`;

const SkeletonCell = styled.div`
  height: 20px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: loading 1.5s infinite;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

// Batch rendering helpers removed (not used) to avoid unused-vars warnings

/**
 * Hook: useDebounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook: useBatchRender (simulação de virtual scrolling)
 */
export function useBatchRender(items: any[], batchSize: number = 20) {
  const [renderedBatches, setRenderedBatches] = React.useState(1);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && renderedBatches * batchSize < items.length) {
          setRenderedBatches(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    return () => observer.disconnect();
  }, [items.length, renderedBatches, batchSize]);

  return items.slice(0, renderedBatches * batchSize);
}

/**
 * Component: PerformanceOptimizer
 */
const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  isLoading = false,
  rowCount = 0,
  children,
}) => {
  return (
    <OptimizerContainer>
      {isLoading && (
        <LoadingOverlay>
          <LoadingContent>
            <Spinner />
            <LoadingText>
              {rowCount > 0
                ? `Carregando ${rowCount} registros...`
                : 'Carregando dados...'}
            </LoadingText>
          </LoadingContent>
        </LoadingOverlay>
      )}
      {children}
    </OptimizerContainer>
  );
};

/**
 * Component: SkeletonLoadingGrid
 */
export const SkeletonLoadingGrid: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <SkeletonLoader>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <SkeletonCell key={j} />
          ))}
        </SkeletonRow>
      ))}
    </SkeletonLoader>
  );
};

/**
 * Component: BulkActionsBar
 */
const BulkActionsBar = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #f0f7ff;
  border-radius: 4px;
  align-items: center;
  margin-bottom: 12px;
  border: 1px solid #bfdbfe;
`;

const BulkActionLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
`;

const BulkActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  background-color: ${props =>
    props.$variant === 'danger' ? '#ef4444' : '#2563eb'};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export interface BulkActionsBarProps {
  selectedCount: number;
  onDelete?: () => void;
  onExport?: () => void;
  onArchive?: () => void;
}

/**
 * Component: BulkActionsBar
 */
export const BulkActionToolbar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDelete,
  onExport,
  onArchive,
}) => {
  if (selectedCount === 0) return null;

  return (
    <BulkActionsBar>
      <BulkActionLabel>
        ✓ {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
      </BulkActionLabel>
      {onExport && (
        <BulkActionButton onClick={onExport}>
          📥 Exportar
        </BulkActionButton>
      )}
      {onArchive && (
        <BulkActionButton onClick={onArchive}>
          📦 Arquivar
        </BulkActionButton>
      )}
      {onDelete && (
        <BulkActionButton $variant="danger" onClick={onDelete}>
          🗑️ Deletar
        </BulkActionButton>
      )}
    </BulkActionsBar>
  );
};

export default PerformanceOptimizer;













