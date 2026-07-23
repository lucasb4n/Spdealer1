// Utilitário para normalizar payloads de Caixa/Caixacab entre nomes antigos e novos
export function normalizeCaixaPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;

  const p = { ...payload };

  // Normalizar códigos de banco
  p.codbanco_cai = p.codbanco_cai || p.codbanco || p.banco_cai || p.banco || p.banco_codigo || p.cliente_cai || p.cliente || p.codigo_cliente || p.codigo_cli || p.codbanco;

  // Normalizar tipo de caixa
  p.tipocai_cai = p.tipocai_cai || p.tipo_caixa || p.tipo_cai || p.tipocai || p.tipo;

  // Normalizar cliente/fornecedor (manter `cliente_cai` como fallback legadO)
  p.cliente_cai = p.cliente_cai || p.codbanco_cai || p.codigo_cliente || p.codigo_cli || p.cliente || p.cliforn_cai || p.cliforn || p.cliente_codigo;

  // Normalizar campos de nome
  p.nome_cliente = p.nome_cliente || p.nomefan_cli || p.nomefan_for || p.nome_cai || p.nome_cli || p.nomfan_cli;

  // Normalizar documentos vinculados / selecionados
  p.documentos_vinculados = p.documentos_vinculados || p.documentos_selecionados || p.linked_documents || p.linkedDocs || p.documentos || p.linked_documents_list;

  // Normalizar data movimento
  p.dtmovi_cai = p.dtmovi_cai || p.data_movimento || p.data || p.dtmovi || p.dtmov || p.dtvenci;

  // Normalizar sequência
  p.seq_cai = p.seq_cai || p.sequencia || p.seq || p.id;

  // Normalizar valores e D/C
  p.valor_cai = p.valor_cai || p.valor || p.valor_total;
  p.dc_cai = p.dc_cai || p.debito_credito || p.dc || p.tipo_dc;

  return p;
}

export function mapDocumentoRawToSelected(d: any, tipoDocumentoFallback?: string) {
  if (!d) return null;
  return {
    id: d.id || d.receber_id || d.pagar_id || d.codigo_rec || d.codigo_pag || null,
    tipo: d.tipo || tipoDocumentoFallback || (d.receber_id ? 'R' : d.pagar_id ? 'P' : 'R'),
    codigo_cliente: d.codigo_cliente || d.codbanco || d.codigo_rec || d.codigo_pag || '',
    nome_cliente: d.nome_cliente || d.nomefan_cli || d.nomefan_for || d.nome_cai || '',
    documento: d.documento || d.numdup_rec || d.numdup_pag || '',
    parcela: d.parcela || d.parc_rec || d.parc_pag || '',
    valor_original: typeof d.valor_original === 'string' ? parseFloat(d.valor_original) : d.valor_original || 0,
    valor_aberto: typeof d.valor_aberto === 'string' ? parseFloat(d.valor_aberto) : d.valor_aberto || 0,
    valor_selecionado: typeof d.valor_selecionado === 'string' ? parseFloat(d.valor_selecionado) : d.valor_selecionado || 0,
    acrescimo: typeof d.acrescimo === 'string' ? parseFloat(d.acrescimo) : d.acrescimo || 0,
    desconto: typeof d.desconto === 'string' ? parseFloat(d.desconto) : d.desconto || 0,
    data_vencimento: d.data_vencimento || d.dtvenci_rec || d.dtvenci_pag || ''
  };
}













