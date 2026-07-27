export interface Orcamento {
  NUMERO_ORP: number;
  FECHADO_ORP?: number;
  DTEMI_ORP: string;
  CODCLI_ORP: number | null;
  CGCCPF_CLI: string;
  CLiforn_CLI: string;
  TIPOCLI_ORP: string;
  NOME_CLI: string;
  LOGRA_ORP: string;
  BAIRRO_ORP: string;
  CIDADE_ORP: string;
  UF_ORP: string;
  CEP_ORP: string;
  FONE_ORP: string;
  CONDPAG_ORP: string;
  NIVEL_ORP?: string;
  TIPOCONTATO_ORP: string;
  CONTATO_ORP?: string;
  MODELO_ORP?: string;
  NUMERO_ORIG_ORP: number | null;
  TIPO_ORP: 'O' | 'P' | 'C';
  TIPO: string;
  VENDEDOR_ORP: number | null;
  CODDEPART_ORP: number | null;
  OBS_ORP: string;
  PERCPEC_ORP: number | null;
  DESCPEC_ORP: number | null;
  PERSERV_ORP: number | null;
  DESCSER_NOT: number | null;
  TOTPEC_ORP: number | null;
  TOTSER_ORP: number | null;
  TOTFRETE_ORP: number | null;
  TOTIPI_ORP: number | null;
  TOTST_ORP: number | null;
  ICMSUB_NOT: number | null;
  VLRENTRA_NOT: number | null;
  VLROUTDIV_NOT: number | null;
  TOTGER_ORP: number | null;
  FRETE_NOT: number | null;
  CODIGO_COB: number | null;
  TPCOB_PAGA: string;
  CODBCO_PAGA: number | null;
  NOMEB: string;
  VALORIPI_ORP: number | null;
  TOT1: number | null;
  TOT2: number | null;
  TOT3: number | null;
  TOT4: number | null;
  TOTFAL: number | null;
  W_ORDVLR: string;
  PERC_DESCPEC_ITEM_ORP: number | null;
  PERC_DESCSER_ITEM_ORP: number | null;
  
  // Campos de Transporte Integrados
  RAZAOFRET?: string;
  ENDER?: string;
  CGCTRANS?: string;
  PLACA?: string;
  UFTRANS?: string;
  MUNICF?: string;
  UF?: string;
  INSCEST_ORP?: string;
  QTDE?: number;
  ESPECIE?: string;
  MARCA?: string;
  NUMERO?: string;
  PESOBR?: number;
  PESLIQ?: number;
  FRETE?: number;
  PORCONTA?: 1 | 2;
  DTRET?: string;
  LOCAL_ENTREGA?: string;

  itens?: ItemOrcamento[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemOrcamento {
  id?: number;
  NUMERO_ORPP: number;
  REQUIS_ORPP: number;
  CODIGO_ORPP: string;
  DESCR_ORPP: string;
  QTREC_ORPP: number;
  QTALOC_ORPP: number;
  ESTOQUE_ORPP: number | null;
  PRECOPUB_ORPP: number;  // Era PRECO_ORPP
  VALORIPI_ORPP: number | null;
  VLRST_ORPP: number | null; // Note: SQL uses ICMSST_ORPP
  VLRDESC_ORPP: number | null;
  PRECOTOT_ORPP: number | null;
  FAB_ORPP: string;
  LOCACKAR_ORPP: string;
  NUMERO_ORIG_ORPP: number | null;
  NUMERO_NOVO_ORPP: number | null;
  NUMERO_CLI_ORPP: string;
  SEQ_CLI_ORPP: string;
  ITEM_CLI_ORPP: string;
  ORDEMCOMP_ORPP: string;
  TIPO_ITEM: 'P' | 'S';
  QTSOL_ORPP?: number;
  QTFALTA_ORPP?: number;
  QTPERD_ORPP?: number;
  CODIGO_MPER?: string;
  MOTIVO_ORPP?: string;
  FECHADO_ORPP?: number;
  VALORAVI_ORPP?: number;
  PERC_NIVEL_ORPP?: number;
  VLR_NIVEL_ORPP?: number;
}

export interface Parcela {
  NUMERO_ORP: number;
  PARCELA: number;
  DATA_VCTO: string;
  VALOR: number;
  BANCO?: string;
  DBANCO?: string;
  COBRANCA?: string;
  DCOBRANCA?: string;
  EP?: string; // 'P' = parcela, 'E' = entrada
}

export interface Transportadora {
  RAZAOFRET: string;
  ENDER: string;
  CGCTRANS: string;
  PLACA: string;
  UFTRANS: string;
  MUNICF: string;
  UF: string;
  INSCEST: string;
  QTDE: number;
  ESPECIE: string;
  MARCA: string;
  NUMERO: string;
  PESOBR: number;
  PESLIQ: number;
  FRETE: number;
  PORCONTA: 1 | 2;
  DTRET: string;
}

export interface OrcamentoListResponse {
  success: boolean;
  data: Orcamento[];
  pagination: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
  };
}

export interface OrcamentoResponse {
  success: boolean;
  data?: Orcamento;
  error?: string;
}

export interface ClienteLookup {
  CODCLI: number;
  NOMECLI: string;
  CGCCPF: string;
  NOMEFAN: string;
  CIDADE: string;
  BAIRRO: string;
  ENDERECO: string;
  UF: string;
  FONE: string;
  CELULAR: string;
  EMAIL: string;
  STATUS_CREDITO: string;
  LIMITE_CREDITO: number;
}

export interface ProdutoLookup {
  CODIGO: string;
  DESCRICAO: string;
  CODFAB: string;
  FABRICANTE: string;
  PRECO_VENDA: number;
  PRECO_CUSTO: number;
  ESTOQUE: number;
  LOCALIZACAO: string;
  UNIDADE: string;
  NCM: string;
  IPI: number;
  CST_ICMS: string;
  CST_PIS: string;
  CST_COFINS: string;
}

export const TIPO_ORP_OPTIONS = [
  { value: 'O', label: 'Orçamento' },
  { value: 'P', label: 'Pedido' },
  { value: 'C', label: 'Confirmado' },
];

export const TIPO_STATUS_OPTIONS = [
  { value: 'Orçamento', label: 'Orçamento' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Faturado', label: 'Faturado' },
  { value: 'Cancelado', label: 'Cancelado' },
];

export const TIPO_CONTATO_OPTIONS = [
  { value: 'Telefone', label: 'Telefone' },
  { value: 'Visita', label: 'Visita' },
  { value: 'Local', label: 'Local' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Whatsapp', label: 'Whatsapp' },
];

export const TIPO_ITEM_OPTIONS = [
  { value: 'P', label: 'Peça' },
  { value: 'S', label: 'Serviço' },
];

export const FRETE_POR_CONTA_OPTIONS = [
  { value: 1, label: 'Emitente' },
  { value: 2, label: 'Destinatário' },
];













