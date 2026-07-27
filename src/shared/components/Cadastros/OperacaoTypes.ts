export interface Operacao {
  codigo_ope: number;
  mp35_ope: 'S' | 'N';
  piscofins_ope: 'S' | 'N';
  ativo_ope: 'S' | 'N';
  atvlrcompravei_ope: 'S' | 'N';
  ipidevnaosoma_ope: 'S' | 'N';
  ipidev_ope: 'S' | 'N';
  acrtransf_ope: number;
  config_flag: number;
  config_value: number;
  sinal_ope: '+' | '-';
  naotrib_ope: number;
  debite_ope: number;
  credite_ope: number;
  codope_ope: number;
  codope1_ope: number;
  codopef_ope: number;
  codope1f_ope: number;
  codopefs_ope: number;
  cfosubf_ope: number;
  descr_ope: string;
  aliq_ope: number;
  aliqiss_ope: number;
  icms_ope: number;
  icmsrst_ope: number;
  stfin_ope: number;
  icmsub_ope: number;
  codtrib_ope: number;
  issret_ope: 'S' | 'N';
  icmco_ope: 'S' | 'N';
  arrvicmsiss_ope: 'S' | 'N';
  vlrliq_ope: number;
  situacao_ope: number;
  descr_sit: string;
  pgcomi_ope: 'S' | 'N';
  regar_ope: 'S' | 'N';
  valor_ope: 'P' | 'G' | 'C' | 'R' | 'M';
  usocons_ope: number;
  irf_ope: number;
  acr_ope: number;
  adv_ope: 'S' | 'N';
  rediss_ope: number;
  classif_ope: string;
  observacao_ope: string;
  tribfisc_ope: string;
  crcx_ope: number;
  cfosub_ope: number;
  extenso_ope: 'S' | 'N';
  indicms_ope: number;
  irinss_ope: 'R' | 'S' | ' ';
  acritem_ope: number;
  desclivre_ope: 'S' | 'N';
  codnatnfser_ope: number;
  codatigips_ope: number;
  deduzmp35_ope: number;
  naoimpcodtrib_ope: number;
  outbas_ope: 'S' | 'N';
  geradem_ope: number;
  cstmpis_ope: number;
  cstmcofins_ope: number;
  cstppis_ope: number;
  cstpcofins_ope: number;
  cstipi_ope: number;
  comtit_ope: 'S' | 'N';
}

export interface OperacaoCreate {
  codigo_ope: number;
  descr_ope: string;
  ativo_ope?: 'S' | 'N';
  cfosub_ope?: number;
  piscofins_ope?: 'S' | 'N';
  icms_ope?: number;
  sinal_ope?: '+' | '-';
  valor_ope?: 'P' | 'G' | 'C' | 'R' | 'M';
}

export interface OperacaoUpdate {
  descr_ope?: string;
  ativo_ope?: 'S' | 'N';
  cfosub_ope?: number;
  piscofins_ope?: 'S' | 'N';
  icms_ope?: number;
  sinal_ope?: '+' | '-';
  valor_ope?: 'P' | 'G' | 'C' | 'R' | 'M';
}

export interface OperacaoLookup {
  codigo_ope: number;
  descr_ope: string;
  cfosub_ope: number;
  icms_ope: number;
}

export interface OperacaoFilter {
  search?: string;
  ativo?: 'S' | 'N';
  page?: number;
  size?: number;
}

export interface OperacaoListResponse {
  success: boolean;
  data: Operacao[];
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface OperacaoResponse {
  success: boolean;
  data?: Operacao;
  error?: string;
  message?: string;
}













