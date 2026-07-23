/**
 * Interface para Tipos de Fornecedores (masfor)
 * Data: 17 de janeiro de 2026
 */

export interface Masfor {
  tipo_for: string;     // Código (PK)
  descr_for: string;    // Descrição
}

export interface MasforCreateDTO {
  tipo_for: string;
  descr_for: string;
}

export interface MasforUpdateDTO {
  descr_for: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: 'success' | 'error';
  error?: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
}













