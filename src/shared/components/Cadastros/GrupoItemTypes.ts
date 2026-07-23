export interface GrupoItem {
  grupo_gru: number;
  descr_gru: string;
  perc_gru: number;
  percom_gru: number;
  dolar_gru: string;
  consumo_gru: string;
  fob_gru: string;
  ipi_gru: string;
  usacusto_gru: string;
  semfab_gru: string;
}

export interface GrupoItemCreate {
  grupo_gru: number;
  descr_gru: string;
  perc_gru?: number;
  percom_gru?: number;
  dolar_gru?: string;
  consumo_gru?: string;
  fob_gru?: string;
  ipi_gru?: string;
  usacusto_gru?: string;
  semfab_gru?: string;
}

export interface GrupoItemUpdate {
  descr_gru?: string;
  perc_gru?: number;
  percom_gru?: number;
  dolar_gru?: string;
  consumo_gru?: string;
  fob_gru?: string;
  ipi_gru?: string;
  usacusto_gru?: string;
  semfab_gru?: string;
}

export interface GrupoItemLookup {
  grupo_gru: number;
  descr_gru: string;
}

export interface GrupoItemFilter {
  search?: string;
  page?: number;
  size?: number;
}

export interface GrupoItemListResponse {
  success: boolean;
  data: GrupoItem[];
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface GrupoItemResponse {
  success: boolean;
  data?: GrupoItem;
  error?: string;
  message?: string;
}













