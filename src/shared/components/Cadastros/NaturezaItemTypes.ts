export interface NaturezaItem {
  natureza_nat: string;
  descricao_nat: string;
  ccusto_nat: number;
}

export interface NaturezaItemCreate {
  natureza_nat: string;
  descricao_nat: string;
  ccusto_nat?: number;
}

export interface NaturezaItemUpdate {
  descricao_nat?: string;
  ccusto_nat?: number;
}

export interface NaturezaItemLookup {
  natureza_nat: string;
  descricao_nat: string;
}

export interface NaturezaItemFilter {
  search?: string;
  page?: number;
  size?: number;
}

export interface NaturezaItemListResponse {
  success: boolean;
  data: NaturezaItem[];
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface NaturezaItemResponse {
  success: boolean;
  data?: NaturezaItem;
  error?: string;
  message?: string;
}













