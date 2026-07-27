import axios from 'axios';
import { parseDateLocal } from 'utils/dateUtils';
import { API_BASE_URL } from './apiConfig';

export interface FiltroRelatorio {
  tipo: 'receber' | 'pagar' | 'fluxo' | 'consulta_caixa' | 'renegociacao';
  tipoDataFiltro: string;
  dataFiltroInicial: string;
  dataFiltroFinal: string;
  pessoaTipo: string;
  tipoCobranca: string;
  tipoDocumento: string;
  tiposDocumento?: string[]; // Múltiplos tipos de documento selecionados
  departamento: string;
  centroCusto: string;
  faixaAtraso: string;
  soEmAberto: boolean;
  soPagos: boolean;
  folhaPagamento?: boolean; // Flag para relatório de folha de pagamento
  tipoCampoData?: string; // Para Contas a Pagar: dtmovi_pag, dtvenci_pag, dtpagi_pag, dtfluxo_pag
  dataini?: string; // Data inicial em formato YYYY-MM-DD
  datafim?: string; // Data final em formato YYYY-MM-DD
}

export interface DadosRelatorio {
  codigo_rec?: number;
  codigo_pag?: number;
  nome_cli: string;
  cliforn_cli: string;
  numdup_rec?: string;
  numdup_pag?: string;
  docto_rec?: string;
  docto_pag?: string;
  dtvenci_rec?: string;
  dtvenci_pag?: string;
  dtpagi_rec?: string;
  dtpagi_pag?: string;
  vlrmovi_rec?: number;
  vlrmovi_pag?: number;
  vlrsal_rec?: number;
  vlrsal_pag?: number;
  descr_cob?: string;
  descr_doc?: string;
  descr_dep?: string;
  descr_scd?: string;
}

export class RelatoriosService {
  
  static async buscarRelatorioFinanceiro(filtros: FiltroRelatorio): Promise<DadosRelatorio[]> {
    try {
      console.log('📤 Enviando filtros para backend:', filtros);
      const response = await axios.post(`${API_BASE_URL}/relatorios-jasper/financeiro`, filtros);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar relatório financeiro:', error);
      const data = error.response?.data;
      const serverMsg = data?.[0]?.erro || data?.erro || data?.message || data?.error;
      throw new Error(serverMsg || 'Falha ao carregar dados do relatório do servidor');
    }
  }

  static async buscarConsultaCaixa(filtros: { dataInicial?: string; dataFinal?: string; tipoData?: string; centroCusto?: string; operacao?: string; mascai?: string; banco?: string }): Promise<any[]> {
    try {
      const params: any = {};
      if (filtros.dataInicial) params.dataInicial = filtros.dataInicial;
      if (filtros.dataFinal) params.dataFinal = filtros.dataFinal;
      if (filtros.tipoData) params.tipoData = filtros.tipoData;
      if (filtros.centroCusto) params.centroCusto = filtros.centroCusto;
      if (filtros.operacao) params.operacao = filtros.operacao;
      if (filtros.mascai) params.mascai = filtros.mascai;
      if (filtros.banco) params.banco = filtros.banco;

      const response = await axios.get(`${API_BASE_URL}/relatorios/consulta-caixa`, { params });
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar consulta caixa:', error);
      throw new Error('Falha ao buscar consulta de caixa e bancos');
    }
  }

  static async executarDashboardQuery(id: number, parameters?: any): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/v1/dashboard-queries/${id}/execute`, { parameters: parameters || {} });
      return response.data;
    } catch (error) {
      console.error('Erro ao executar dashboard query:', error);
      throw new Error('Falha ao executar dashboard query');
    }
  }

  static async exportarRelatorioFinanceiro(filtros: FiltroRelatorio): Promise<void> {
    try {
      let templateName = '';
      switch (filtros.tipo) {
        case 'receber': templateName = 'ContasReceberReport'; break;
        case 'pagar': templateName = 'ContasPagarReport'; break;
        case 'fluxo': templateName = 'FluxoCaixaReport'; break;
        case 'consulta_caixa': templateName = 'ConsultaCaixaReport'; break;
        default: throw new Error('Tipo de relatório inválido');
      }

      const parametros = { ...filtros, templateName, format: 'PDF' };
      const response = await axios.post(`${API_BASE_URL}/relatorios-jasper/financeiro/export`, parametros, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf' }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dataAtual = new Date().toISOString().split('T')[0];
      link.download = `${this.getTipoRelatorioLabel(filtros.tipo)}_${dataAtual}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error);
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        const errorMessage = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(error.response.data);
        });
        throw new Error(errorMessage || 'Falha ao exportar relatório');
      }
      throw new Error(error.response?.data || 'Falha ao exportar relatório');
    }
  }

  static async exportarRelatorioPagarPDF(filtros: FiltroRelatorio & { tipoCampoData?: string, tipoCobrancaLabel?: string, tiposDocumentoLabels?: string[] }): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/relatorios-jasper/pagar/export`, filtros, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf', 'Content-Type': 'application/json' }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ContasPagar_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erro ao exportar relatório de Contas a Pagar:', error);
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          throw new Error(text || 'Falha ao exportar relatório de Contas a Pagar');
        } catch (e) {
          // ignore
        }
      }
      throw new Error('Falha ao exportar relatório de Contas a Pagar');
    }
  }

  static async exportarRelatorioReceberPDF(filtros: FiltroRelatorio & { tipoCampoData?: string, tipoCobrancaLabel?: string, tiposDocumentoLabels?: string[] }): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/relatorios-jasper/receber/export`, filtros, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf', 'Content-Type': 'application/json' }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ContasReceber_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erro ao exportar relatório de Contas a Receber:', error);
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          throw new Error(text || 'Falha ao exportar relatório de Contas a Receber');
        } catch (e) {
          // ignore
        }
      }
      throw new Error('Falha ao exportar relatório de Contas a Receber');
    }
  }

  static async exportarRelatorioFolhaPagamentoPDF(filtros: FiltroRelatorio & { tipoCampoData?: string }): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/relatorios-jasper/folha-pagamento/export`, {
        ...filtros,
        dataini: filtros.dataini,
        datafim: filtros.datafim,
        tipoCampoData: filtros.tipoCampoData || 'dtvenci_pag'
      }, {
        responseType: 'blob',
        headers: { 'Accept': 'application/pdf', 'Content-Type': 'application/json' }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dataAtual = new Date().toISOString().split('T')[0];
      link.download = `FolhaPagamento_${dataAtual}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatório de Folha de Pagamento:', error);
      throw new Error('Falha ao exportar relatório de Folha de Pagamento');
    }
  }

  static async buscarFluxoCaixa(filtros: FiltroRelatorio): Promise<any[]> {
    try {
      const filtrosBackend: any = { 
        dataFiltroInicial: filtros.dataFiltroInicial, 
        dataFiltroFinal: filtros.dataFiltroFinal,
        dataini: filtros.dataFiltroInicial, // Fallback for some backend routines
        datafim: filtros.dataFiltroFinal    // Fallback for some backend routines
      };
      if (typeof filtros.soEmAberto === 'boolean') filtrosBackend.soEmAberto = filtros.soEmAberto;
      if (typeof filtros.soPagos === 'boolean') filtrosBackend.soPagos = filtros.soPagos;

      console.log('[RelatoriosService] POST /relatorios/fluxo-caixa-com-subtotais body:', filtrosBackend);

      const response = await fetch(`${API_BASE_URL}/relatorios/fluxo-caixa-com-subtotais`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(filtrosBackend)
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const resData = await response.json();
      console.log('[RelatoriosService] Resposta do backend:', resData);
      return resData;
    } catch (error) {
      console.warn('[RelatoriosService] Erro no endpoint de Fluxo, tentando fallback local...', error);
      try {
        const fallbackFiltros = { 
          ...filtros, 
          dataini: filtros.dataFiltroInicial, 
          datafim: filtros.dataFiltroFinal 
        };
        const dadosReceber = await this.buscarRelatorioFinanceiro({ ...fallbackFiltros, tipo: 'receber' });
        const dadosPagar = await this.buscarRelatorioFinanceiro({ ...fallbackFiltros, tipo: 'pagar' });
        const fluxoCombinado = [
          ...dadosReceber.map(item => ({ ...item, tipo: 'ENTRADA', data: item.dtvenci_rec, valor: item.vlrsal_rec, saldo: item.vlrsal_rec, isTipoLinha: 'normal' })),
          ...dadosPagar.map(item => ({ ...item, tipo: 'SAÍDA', data: item.dtvenci_pag, valor: item.vlrsal_pag, saldo: item.vlrsal_pag, isTipoLinha: 'normal' }))
        ];
        return fluxoCombinado.sort((a, b) => {
          const dA = parseDateLocal(a.data) || (a.data ? new Date(a.data) : new Date(0));
          const dB = parseDateLocal(b.data) || (b.data ? new Date(b.data) : new Date(0));
          return dA.getTime() - dB.getTime();
        });
      } catch (error2) {
        throw new Error('Falha ao carregar dados do fluxo de caixa');
      }
    }
  }

  static async buscarOpcoesFiltro(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/relatorios/opcoes-filtro`);
      const data = response.data || {};
      
      const normalize = (list: any[]) => (list || []).map((item: any) => {
        const codigo = item.codigo || item.CODIGO || item.codigo_cob || item.CODIGO_COB || item.codigo_cobp || item.CODIGO_COBP || item.codigo_dep || item.CODIGO_DEP || item.codigo_doc || item.CODIGO_DOC || item.codigo_docp || item.CODIGO_DOCP || item.codigo_scd || item.CODIGO_SCD || (item.id !== undefined ? item.id : '');
        const descricao = item.descricao || item.DESCRICAO || item.descr_cob || item.DESCR_COB || item.descr_cobp || item.DESCR_COBP || item.descr_dep || item.DESCR_DEP || item.descr_doc || item.DESCR_DOC || item.descr_docp || item.DESCR_DOCP || item.descr_scd || item.DESCR_SCD || item.nomefan_bco || item.nome || '';
        return {
          codigo: String(codigo).trim(),
          descricao: String(descricao).trim()
        };
      }).filter((x: any) => x.codigo);

      return {
        departamentos: normalize(data.departamentos),
        centrosCusto: normalize(data.centrosCusto),
        tiposCobranca: normalize(data.tiposCobranca),
        tiposCobrancaPagar: normalize(data.tiposCobrancaPagar),
        tiposDocumento: normalize(data.tiposDocumento),
        tiposDocumentoPagar: normalize(data.tiposDocumentoPagar),
        operacoesCaixa: normalize(data.operacoesCaixa)
      };
    } catch (error) {
      console.error('Erro ao buscar opções de filtro:', error);
      return { departamentos: [], centrosCusto: [], tiposCobranca: [], tiposDocumento: [] };
    }
  }

  static async buscarTiposCobranca(tipo?: 'receber' | 'pagar'): Promise<any[]> {
    try {
      const opcoes = await this.buscarOpcoesFiltro();
      return tipo === 'pagar' ? (opcoes.tiposCobrancaPagar || []) : (opcoes.tiposCobranca || []);
    } catch (error) {
      return [];
    }
  }

  static async buscarDepartamentos(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/relatorios/departamentos`);
      return response.data;
    } catch (error) {
      return [];
    }
  }

  static async buscarFluxoCaixaAgrupado(filtros: any): Promise<any[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/relatorios/fluxo-caixa-agrupado`, filtros);
      return response.data;
    } catch (error) {
      throw new Error('Falha ao carregar fluxo de caixa agrupado');
    }
  }

  static async buscarFluxoCaixaComPeriodo(filtros: any): Promise<any[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/relatorios/fluxo-caixa-periodo`, filtros);
      return response.data;
    } catch (error) {
      throw new Error('Falha ao carregar fluxo de caixa do período');
    }
  }

  static async buscarDetalhesFluxoDia(data: string, soEmAberto: boolean = true): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/relatorios/fluxo-caixa-detalhes/${encodeURIComponent(data)}`, { params: { soEmAberto } });
      return response.data;
    } catch (error) {
      throw new Error('Falha ao carregar detalhes do fluxo de caixa');
    }
  }

  static async atualizarDepartamento(tipo: string, codigo: string, novoDepartamento: string): Promise<any> {
    try {
      const response = await axios.put(`${API_BASE_URL}/relatorios/${tipo}/${codigo}/departamento?novoDepartamento=${novoDepartamento}`);
      return { sucesso: response.data.sucesso !== false, mensagem: response.data.mensagem || 'Departamento atualizado' };
    } catch (error) {
      return { sucesso: false, mensagem: 'Erro ao atualizar departamento' };
    }
  }

  static async atualizarTipoCobranca(tipo: string, codigo: string, novoTipoCobranca: string): Promise<any> {
    try {
      const response = await axios.put(`${API_BASE_URL}/relatorios/${tipo}/${codigo}/tipo-cobranca?novoTipoCobranca=${encodeURIComponent(novoTipoCobranca)}`);
      return { sucesso: response.data.sucesso !== false, mensagem: response.data.mensagem || 'Tipo cobranca atualizado' };
    } catch (error) {
      return { sucesso: false, mensagem: 'Erro ao atualizar tipo cobranca' };
    }
  }

  static async atualizarDtFluxo(tipo: 'receber' | 'pagar', id: number, novaData: string): Promise<any> {
    try {
      const response = await axios.put(`${API_BASE_URL}/relatorios-jasper/fluxo/atualizar`, { tipo, id, novaData });
      return { sucesso: response.data.sucesso !== false, mensagem: response.data.mensagem || 'Data fluxo atualizada' };
    } catch (error) {
      return { sucesso: false, mensagem: 'Erro ao atualizar data fluxo' };
    }
  }

  static async salvarRenegociacao(dados: {
    tipo: string;
    codigo: number;
    motivo: string;
    usuario?: string;
    tipodocOriginal: string;
    codigoCliente: number;
    filial?: string;
    dpto?: string | number | null;
    tpcob?: string;
    cgccpf?: string;
    desconto?: number;
    parcelas: { valor: number; data: string }[];
  }): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/renegociacao/salvar`, dados);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao salvar renegociação:', error);
      const data = error.response?.data;
      throw new Error(data?.mensagem || 'Falha ao salvar renegociação');
    }
  }

  static async salvarRenegociacaoLote(dados: {
    tipo: string;
    codigos: number[];
    motivo: string;
    usuario?: string;
    tipodocOriginal: string;
    codigoCliente: number;
    filial?: string;
    dpto?: string | number | null;
    tpcob?: string;
    cgccpf?: string;
    numdup?: string;
    desconto?: number;
    parcelas: { valor: number; data: string }[];
  }): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/renegociacao/salvar-lote`, dados);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao salvar renegociação em lote:', error);
      const data = error.response?.data;
      throw new Error(data?.mensagem || 'Falha ao salvar renegociação em lote');
    }
  }

  static async verificarNumdup(codigoCliente: number, numdup: string, tipo?: string): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/renegociacao/verificar-numdup`, {
        params: { codigoCliente, numdup, tipo: tipo || 'receber' }
      });
      return response.data;
    } catch { return { existe: false }; }
  }

  static async buscarPrevisaoReceitas(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/relatorios/previsao-receitas`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  static async buscarPrevisaoDespesas(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/relatorios/previsao-despesas`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  static calcularTotais(dados: DadosRelatorio[]): any {
    return dados.reduce((totais, item) => {
      const vMov = item.vlrmovi_rec || item.vlrmovi_pag || 0;
      const vSal = item.vlrsal_rec || item.vlrsal_pag || 0;
      return {
        totalMovimento: totais.totalMovimento + vMov,
        totalSaldo: totais.totalSaldo + vSal,
        totalPago: totais.totalPago + (vMov - vSal),
        totalAberto: totais.totalAberto + (vSal > 0 ? vSal : 0)
      };
    }, { totalMovimento: 0, totalSaldo: 0, totalPago: 0, totalAberto: 0 });
  }

  static formatarDadosParaExportacao(dados: DadosRelatorio[], tipo: string): any[] {
    return dados.map(item => ({
      codigo: item.codigo_rec || item.codigo_pag,
      cliente_fornecedor: item.nome_cli,
      tipo_pessoa: item.cliforn_cli === 'C' ? 'Cliente' : 'Fornecedor',
      vencimento: this.formatarData(item.dtvenci_rec || item.dtvenci_pag),
      valor_movimento: this.formatarMoeda(item.vlrmovi_rec || item.vlrmovi_pag),
      valor_saldo: this.formatarMoeda(item.vlrsal_rec || item.vlrsal_pag),
      status: (item.vlrsal_rec || item.vlrsal_pag || 0) > 0 ? 'Em Aberto' : 'Pago',
      tipo_cobranca: item.descr_cob,
      tipo_documento: item.descr_doc,
      departamento: item.descr_dep,
      centro_custo: item.descr_scd
    }));
  }

  private static getTipoRelatorioLabel(tipo: string): string {
    const labels:Record<string, string> = { 'receber': 'ContasReceber', 'pagar': 'ContasPagar', 'fluxo': 'FluxoCaixa' };
    return labels[tipo] || 'Relatorio';
  }

  private static formatarData(data?: string): string {
    if (!data) return '';
    const d = parseDateLocal(data);
    return d ? d.toLocaleDateString('pt-BR') : String(data);
  }

  private static formatarMoeda(valor?: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }
}













