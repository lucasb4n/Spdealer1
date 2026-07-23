// src/services/DashboardQueryService.ts
import axios from 'axios';
import { DashboardQuery } from 'dashboard'; // Importa a interface atualizada

import { API_BASE_URL, API_PUBLIC_URL } from './apiConfig';

const API_URL = (API_BASE_URL + '/v2').replace(/\/v2\/v2$/, '/v2');
const API_PUBLIC = API_PUBLIC_URL;

function normalizeApiUrl(url: string) {
  // ensure it doesn't end with a trailing slash
  let u = url.replace(/\/+$/, '');
  // if it's a relative url like '/api' or '/api/v1', prefix with localhost backend for dev
  if (u.startsWith('/api')) {
    u = `${API_BASE_URL.replace(/\/$/, '')}${u}`;
  }
  // if it references /api but not /api/v2, prefer v2 for builder endpoints
  if (u.includes('/api') && !u.includes('/api/v2')) {
    // avoid duplicating /v2
    u = u.replace(/\/api(?!\/v2)(.*)$/,'/api/v2$1');
  }
  return u;
}

export class DashboardQueryService {
  static async getAvailableQueries(): Promise<DashboardQuery[]> {
    const candidate = normalizeApiUrl(API_URL);
    // tentativa principal: v2 builder (com credenciais - ambiente builder pode exigir sesssion)
    try {
      const resp = await axios.get(`${candidate}/dashboard-builder/queries`, { withCredentials: true });
      return resp.data;
    } catch (err: any) {
      console.error('[DashboardQueryService] erro ao buscar queries v2 (com credenciais)', err?.message || err);
      // tentar sem credenciais (algumas configurações CORS podem permitir acesso público sem cookies)
      try {
        const respNoCred = await axios.get(`${candidate}/dashboard-builder/queries`, { withCredentials: false });
        return respNoCred.data;
      } catch (err2: any) {
        console.error('[DashboardQueryService] erro ao buscar queries v2 (sem credenciais)', err2?.message || err2);
        // fallback para API pública v1
        try {
          const resp2 = await axios.get(`${normalizeApiUrl(API_PUBLIC)}/dashboard-queries`);
          return resp2.data;
        } catch (inner: any) {
          console.error('[DashboardQueryService] erro ao buscar queries v1 publico', inner?.message || inner);
          // Não lançar: retornar lista vazia evita travar o editor (o UI já mostra "Carregando" ou vazio)
          return [];
        }
      }
    }
  }
}













