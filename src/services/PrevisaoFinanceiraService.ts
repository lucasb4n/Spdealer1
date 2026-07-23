import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export interface PrevisaoOperacao {
  filial_ocai: string;
  operacao_ocai: string;
  descr_ocai: string;
  data_previsao: string;
  periodo_tipo: 'DIA' | 'MES' | 'ANO';
  periodo_descr: string;
  valor_realizado: number;
  quantidade_realizado: number;
  valor_previsto: number;
  desvio_valor: number;
  percentual_desvio: number;
  atualizado_em: string;
}

export interface PrevisaoConsolidada {
  tipo_movimento: 'RECEITA' | 'DESPESA';
  receitas: PrevisaoOperacao[];
  despesas: PrevisaoOperacao[];
  total_realizado_receitas: number;
  total_realizado_despesas: number;
  total_previsto_receitas: number;
  total_previsto_despesas: number;
  saldo_realizado: number;
  saldo_previsto: number;
  desvio_saldo: number;
}

/**
 * Serviço para buscar dados de previsão financeira
 * Integra com endpoints /api/v1/previsao/*
 */
export class PrevisaoFinanceiraService {
  /**
   * Busca previsão por operação (detalhado)
   */
  static async buscarPrevisaoPorOperacoes(
    filial: string,
    dataInicio?: string,
    periodo: 'DIA' | 'MES' | 'ANO' = 'DIA'
  ): Promise<PrevisaoOperacao[]> {
    try {
      const params: any = { filial };
      if (dataInicio) params.dataInicio = dataInicio;
      if (periodo) params.periodo = periodo;

      const response = await axios.get(
        `${API_BASE_URL}/previsao/operacoes`,
        { params }
      );

      return response.data || [];
    } catch (error) {
      console.error('[PrevisaoFinanceiraService] Erro ao buscar previsão por operacoes:', error);
      return [];
    }
  }

  /**
   * Busca consolidado de previsão (resumo)
   */
  static async buscarPrevisaoConsolidada(
    filial: string,
    dataInicio?: string,
    periodo: 'DIA' | 'MES' | 'ANO' = 'DIA'
  ): Promise<PrevisaoConsolidada | null> {
    try {
      const params: any = { filial };
      if (dataInicio) params.dataInicio = dataInicio;
      if (periodo) params.periodo = periodo;

      const response = await axios.get(
        `${API_BASE_URL}/previsao/consolidado`,
        { params }
      );

      return response.data || null;
    } catch (error) {
      console.error('[PrevisaoFinanceiraService] Erro ao buscar previsão consolidada:', error);
      return null;
    }
  }

  /**
   * Recalcula previsão para um período específico
   */
  static async calcularPrevisao(
    filial: string,
    dataInicio: string,
    periodo: 'DIA' | 'MES' | 'ANO' = 'DIA'
  ): Promise<PrevisaoConsolidada | null> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/previsao/calcular`,
        { filial, dataInicio, periodo }
      );

      return response.data || null;
    } catch (error) {
      console.error('[PrevisaoFinanceiraService] Erro ao calcular previsão:', error);
      return null;
    }
  }

  /**
   * Busca previsão agregada por uma data específica
   * Útil para mostrar na linha de grupo do fluxo de caixa
   */
  static async buscarPrevisaoPorData(
    filial: string,
    data: string // formato YYYY-MM-DD
  ): Promise<{
    receitas_previstas: number;
    despesas_previstas: number;
    saldo_previsto: number;
  } | null> {
    try {
      // Buscar previsão por DIA para a data específica
      const operacoes = await this.buscarPrevisaoPorOperacoes(filial, data, 'DIA');
      
      if (!operacoes || operacoes.length === 0) {
        return null;
      }

      // Separar receitas e despesas baseado na operação
      // Assumindo que há uma forma de identificar se é receita ou despesa
      // Caso contrário, buscar do consolidado
      const consolidado = await this.buscarPrevisaoConsolidada(filial, data, 'DIA');
      
      if (consolidado) {
        return {
          receitas_previstas: consolidado.total_previsto_receitas,
          despesas_previstas: consolidado.total_previsto_despesas,
          saldo_previsto: consolidado.saldo_previsto
        };
      }

      return null;
    } catch (error) {
      console.error('[PrevisaoFinanceiraService] Erro ao buscar previsão por data:', error);
      return null;
    }
  }

  /**
   * Busca múltiplas datas de uma vez (otimizado para linha de grupo)
   */
  static async buscarPrevisaoPorDatas(
    filial: string,
    datas: string[] // array de YYYY-MM-DD
  ): Promise<Record<string, { receitas_previstas: number; despesas_previstas: number; saldo_previsto: number }>> {
    try {
      // Fazer chamadas em paralelo
      const promises = datas.map(data => this.buscarPrevisaoPorData(filial, data));
      const resultados = await Promise.all(promises);

      const mapa: Record<string, any> = {};
      datas.forEach((data, idx) => {
        if (resultados[idx]) {
          mapa[data] = resultados[idx];
        }
      });

      return mapa;
    } catch (error) {
      console.error('[PrevisaoFinanceiraService] Erro ao buscar previsão por múltiplas datas:', error);
      return {};
    }
  }

  /**
   * Formata valor monetário
   */
  static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  /**
   * Formata percentual
   */
  static formatarPercentual(percentual: number): string {
    return `${(percentual || 0).toFixed(2)}%`;
  }

  /**
   * Calcula desvio (previsto - realizado)
   */
  static calcularDesvio(realizado: number, previsto: number): number {
    if (previsto === 0) return 0;
    return ((previsto - realizado) / realizado) * 100;
  }
}













