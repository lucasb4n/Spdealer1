// src/services/ParametrosService.ts
import { API_BASE_URL } from './apiConfig';

export interface ParametroGeral {
  chave: string;
  valor: string;
  descricao?: string;
  grupo?: string;
  updatedAt?: string;
}

const API_URL = `${API_BASE_URL}/parametros`;

export class ParametrosService {
  static async listar(grupo?: string): Promise<ParametroGeral[]> {
    const url = grupo ? `${API_URL}?grupo=${grupo}` : API_URL;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao buscar parâmetros');
    return await response.json();
  }

  static async getMap(): Promise<Record<string, string>> {
    const response = await fetch(`${API_URL}/map`, { credentials: 'include' });
    if (!response.ok) throw new Error('Erro ao buscar mapa de parâmetros');
    return await response.json();
  }

  static async salvarLote(parametros: ParametroGeral[]): Promise<void> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parametros),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erro ao salvar parâmetros');
  }

  static async atualizar(chave: string, valor: string): Promise<void> {
    const response = await fetch(`${API_URL}/${chave}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erro ao atualizar parâmetro');
  }
}













