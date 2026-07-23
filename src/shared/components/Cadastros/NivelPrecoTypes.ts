export interface NivelPreco {
  nivel_niv: number;
  descr_niv: string;
  perc_niv: number;
}

export interface NivelPrecoCreate {
  nivel_niv: number;
  descr_niv: string;
  perc_niv?: number;
}

export interface NivelPrecoUpdate {
  descr_niv?: string;
  perc_niv?: number;
}

export interface NivelPrecoLookup {
  nivel_niv: number;
  descr_niv: string;
}

export interface NivelPrecoFilter {
  search?: string;
  page?: number;
  size?: number;
}

export interface NivelPrecoListResponse {
  success: boolean;
  data: NivelPreco[];
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface NivelPrecoResponse {
  success: boolean;
  data?: NivelPreco;
  error?: string;
  message?: string;
}













