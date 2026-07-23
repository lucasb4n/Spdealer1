// Interfaces para o Sistema de Caixa e Bancos

export interface Banco {
  codigo_bco: string;
  nome_bco: string;
  // Nome fantasia vindo do banco (pode existir como `nomefan_bco` em resultados SQL)
  nomefan_bco?: string;
  empresa_ger: string;
  agencia_bco?: string;
  conta_bco?: string;
  status_bco?: 'A' | 'I'; // Ativo/Inativo
}

export interface OperacaoCaixa {
  operacao_ocai: string;
  descr_ocai: string;
  filial_ocai: string;
  tipo_ocai?: 'D' | 'C'; // Débito/Crédito padrão
}

export interface Departamento {
  codigo_scd: string;
  descr_scd: string;
  md_scd: string; // 'D' para departamentos válidos
}

export interface MovimentoCaixa {
  filial_cai: string; // Fixo '001'
  tipocai_cai: string; // Tipo de registro (ex: '001' = Caixa/Bancos)
  dtmov_cai: string;  // Data DDMMAAAA - só para compatibilidade legado
  dtmovi_cai: string; // Data YYYY-MM-DD - campo DATE principal do SPDealer
  seq_cai: number;    // Sequência do dia
  codbanco_cai: string; // Código do banco/caixa (CHAR(5))
  nome_bco: string;   // Nome do banco/caixa (nomefan_bco)
  dpto_cai: string;   // Departamento
  oper_cai: string;   // Operação
  histor_cai: string; // Histórico
  dc_cai: 'D' | 'C';  // Débito/Crédito
  valor_cai: number;  // Valor do movimento
  histcont_cai?: string; // Histórico contábil
  usuario_cai: string;   // Usuário que fez o lançamento
}

export interface DocumentoReceber {
  receber_id: number;
  codigo_rec: number; // Código do cliente
  // Número do documento (preferir `numdup_rec` que é o nome correto no banco)
  numdup_rec?: string;
  docto_rec?: string;  // legacy - manter como fallback
  parc_rec: string;   // Parcela
  vlrtot_rec: number; // Valor total
  vlrsal_rec: number; // Valor em aberto
  vlrpag_rec: number; // Valor já pago
  vlracre_rec: number; // Acréscimo
  vlrmulta_rec?: number; // Multa
  vlrdesc_rec: number;  // Desconto
  dtvenc_rec: string;   // Data vencimento
  dtpag_rec?: string;   // Data pagamento DDMMAAAA - só para compatibilidade legado
  dtpagi_rec?: string;  // Data pagamento YYYY-MM-DD - campo DATE principal
  cxbco_rec?: string;   // Código caixa/banco
  opercai_rec?: string; // Operação caixa
  seqcai_rec?: number;  // Sequência caixa
}

export interface DocumentoPagar {
  pagar_id: number;
  codigo_pag: number; // Código do fornecedor
  // Número do documento (preferir `numdup_pag` que é o nome correto no banco)
  numdup_pag?: string;
  docto_pag?: string;  // legacy - manter como fallback
  parc_pag: string;   // Parcela
  vlrtot_pag: number; // Valor total
  vlrsal_pag: number; // Valor em aberto
  vlrpag_pag: number; // Valor já pago
  vlracre_pag: number; // Acréscimo
  vlrmulta_pag?: number; // Multa
  vlrdesc_pag: number;  // Desconto
  dtvenc_pag: string;   // Data vencimento
  dtpag_pag?: string;   // Data pagamento DDMMAAAA - só para compatibilidade legado
  dtpagi_pag?: string;  // Data pagamento YYYY-MM-DD - campo DATE principal
  cxbco_pag?: string;   // Código caixa/banco
  opercai_pag?: string; // Operação caixa
  seqcai_pag?: number;  // Sequência caixa
}

// Interface para seleção temporária de documentos
export interface DocumentoSelecionado {
  id: number; // receber_id ou pagar_id
  tipo: 'R' | 'P'; // Receber ou Pagar
  codigo_cliente: number;
  nome_cliente: string;
  documento: string;
  parcela: string;
  valor_original: number;
  valor_aberto: number;
  valor_selecionado: number; // Valor que será pago
  juros: number; // Acréscimos/Juros
  multa: number; // Multa
  desconto: number; // Desconto
  pago: number; // Valor já pago
  acrescimo?: number; // Alias antigo, deprecado
  data_vencimento: string;
}

// Interface para o formulário principal
export interface FormularioCaixa {
  banco_codigo: string;
  banco_nome: string;
  data_movimento: string;
  sequencia?: number;
  operacao_codigo: string;
  operacao_descricao: string;
  debito_credito: 'D' | 'C';
  tipo_documento: '' | 'R' | 'P'; // Receber ou Pagar ('' = nenhum)
  codigo_cliente?: number;
  nome_cliente?: string;
  departamento_codigo: string;
  departamento_descricao: string;
  valor_total: number;
  historico: string;
  documentos_selecionados: DocumentoSelecionado[];
}

// Interface para validação
export interface ValidacaoMovimento {
  valor_informado: number;
  valor_documentos: number;
  diferenca: number;
  valido: boolean;
  mensagem?: string;
}













