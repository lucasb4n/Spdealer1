export interface Departamento {
  filial_dep: string;
  codigo_dep: number;
  descr_dep: string;
  ger_dep: string;
  sigla_dep: string;
  conta_dep: string;
  contacli_dep: string;
  contafor_dep: string;
  codbco_dep: string;
}

export interface DepartamentoCreate {
  filial_dep: string;
  codigo_dep: number;
  descr_dep: string;
  ger_dep?: string;
  sigla_dep?: string;
  conta_dep?: string;
  contacli_dep?: string;
  contafor_dep?: string;
  codbco_dep?: string;
}

export interface DepartamentoUpdate {
  descr_dep?: string;
  ger_dep?: string;
  sigla_dep?: string;
  conta_dep?: string;
  contacli_dep?: string;
  contafor_dep?: string;
  codbco_dep?: string;
}

export interface DepartamentoListResponse {
  success: boolean;
  data: Departamento[];
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface DepartamentoResponse {
  success: boolean;
  data?: Departamento;
  error?: string;
  message?: string;
}













