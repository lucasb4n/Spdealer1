export interface TipoOs {
  codigo_os: string;
  descr_os: string;
  interna_os: 'S' | 'N';
  valor_os: 'C' | 'V' | 'R' | 'G' | 'M';
  total_os: string;
  emisernf_os: 'S' | 'N';
  acres_os: number;
  depto_os: number;
  ccusto_os: number;
  emipecnf_os: 'S' | 'N';
  valormo_os: number;
  comissao_os: number;
}

export interface TipoOsCreate {
  codigo_os: string;
  descr_os: string;
  interna_os?: 'S' | 'N';
  valor_os?: 'C' | 'V' | 'R' | 'G' | 'M';
  total_os?: string;
  emisernf_os?: 'S' | 'N';
  acres_os?: number;
  depto_os?: number;
  ccusto_os?: number;
  emipecnf_os?: 'S' | 'N';
  valormo_os?: number;
  comissao_os?: number;
}

export interface TipoOsUpdate {
  descr_os?: string;
  interna_os?: 'S' | 'N';
  valor_os?: 'C' | 'V' | 'R' | 'G' | 'M';
  total_os?: string;
  emisernf_os?: 'S' | 'N';
  acres_os?: number;
  depto_os?: number;
  ccusto_os?: number;
  emipecnf_os?: 'S' | 'N';
  valormo_os?: number;
  comissao_os?: number;
}

export interface TipoOsLookup {
  codigo_os: string;
  descr_os: string;
}

export interface TipoOsFilter {
  search?: string;
  page?: number;
  size?: number;
}

export interface TipoOsListResponse {
  success: boolean;
  data: TipoOs[];
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface TipoOsResponse {
  success: boolean;
  data?: TipoOs;
  error?: string;
  message?: string;
}













