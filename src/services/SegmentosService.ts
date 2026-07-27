import { API_BASE_URL } from './apiConfig';

const API_URL = API_BASE_URL.replace(/\/$/, '');

export interface Segmento {
  codigo_pub: string;
  descr_pub: string;
}

export class SegmentosService {
  static async listarSegmentos(): Promise<Segmento[]> {
    try {
      const response = await fetch(`${API_URL}/segmentos`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar segmentos: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao listar segmentos:', error);
      throw error;
    }
  }

  static async buscarSegmentoPorCodigo(codigo: string): Promise<Segmento> {
    try {
      const response = await fetch(`${API_URL}/segmentos/${codigo}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar segmento: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar segmento:', error);
      throw error;
    }
  }
}













