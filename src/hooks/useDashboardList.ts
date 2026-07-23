import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from 'services/apiConfig';

export interface Dashboard {
  id: number;
  name: string;
  title?: string;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

const API_URL = API_BASE_URL;

export const useDashboardList = (userId?: number | string) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[useDashboardList] Iniciando fetch', userId ? `com userId: ${userId}` : 'sem userId (usa session)');
        const url = `${API_URL}/v2/dashboards`;
        console.log('[useDashboardList] URL:', url);
        
        // Se userId fornecido, passa como param; senão backend usa session/context
        const response = await axios.get(url, {
          params: userId ? { userId } : {},
          withCredentials: true,
          timeout: 10000
        });
        
        console.log('[useDashboardList] Response recebido:', response.data);
        
        if (Array.isArray(response.data)) {
          // Ordena dashboards com default primeiro
          const sorted = response.data.sort((a, b) => {
            if (a.isDefault === b.isDefault) return 0;
            return a.isDefault ? -1 : 1;
          });
          console.log('[useDashboardList] Dashboards carregados:', sorted.length, sorted);
          setDashboards(sorted);
        } else if (response.data && typeof response.data === 'object') {
          // Se retorna um objeto com propriedade data/dashboards
          const data = response.data.data || response.data.dashboards || [];
          if (Array.isArray(data)) {
            const sorted = data.sort((a, b) => {
              if (a.isDefault === b.isDefault) return 0;
              return a.isDefault ? -1 : 1;
            });
            console.log('[useDashboardList] Dashboards carregados de propriedade:', sorted.length);
            setDashboards(sorted);
          } else {
            console.warn('[useDashboardList] Response não é array nem contém array');
            setDashboards([]);
          }
        } else {
          console.warn('[useDashboardList] Response não é array:', response.data);
          setDashboards([]);
        }
      } catch (err) {
        console.error('[useDashboardList] Erro ao buscar dashboards:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dashboards');
        setDashboards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, [userId]);

  return { dashboards, loading, error };
};













