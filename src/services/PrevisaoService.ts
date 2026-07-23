/**
 * PrevisaoService.ts
 * 
 * Serviço para integração com endpoints de previsão realizado vs previsto
 * Endpoints:
 * - GET /api/v1/previsao/operacoes
 * - GET /api/v1/previsao/consolidado
 * - POST /api/v1/previsao/calcular
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export interface PrevisaoPorOperacao {
  filial_ocai: string;
  operacao_ocai: string;
  descr_ocai: string;
  tipo_movimento: 'RECEITA' | 'DESPESA';
  valor_realizado: number;
  quantidade_realizado: number;
  valor_previsto: number;
  desvio_valor: number;
  percentual_desvio: number;
  data_previsao: string;
  periodo_tipo: 'DIA' | 'MES' | 'ANO';
}

export interface ConsolidadoMovimento {
  valor_realizado: number;
  valor_previsto: number;
  quantidade: number;
  desvio_valor: number;
  percentual_desvio: number;
}

export interface PrevisaoConsolidada {
  receitas: ConsolidadoMovimento;
  despesas: ConsolidadoMovimento;
  saldo_realizado: number;
  saldo_previsto: number;
  desvio_saldo: number;
  data_referencia: string;
  periodo_tipo: string;
}

export interface CalcularPrevisaoRequest {
  filial: string;
  data_inicio: string;
  periodo: 'DIA' | 'MES' | 'ANO';
}

export interface CalcularPrevisaoResponse {
  sucesso: boolean;
  mensagem: string;
  registros_receitas: number;
  registros_despesas: number;
  timestamp: string;
}

class PrevisaoService {
  private baseUrl = API_URL;

  /**
   * Buscar previsões por operação de caixa
   * 
   * @param filial - Filial do usuário (ex: '001')
   * @param dataInicio - Data inicial (ex: '2025-12-20'), padrão = hoje
   * @param periodo - DIA, MES ou ANO
   * @returns Lista de previsões por operação
   */
  async getPrevisaoPorOperacoes(
    filial: string,
    dataInicio?: string,
    periodo: 'DIA' | 'MES' | 'ANO' = 'DIA'
  ): Promise<PrevisaoPorOperacao[]> {
    try {
      const params = new URLSearchParams({
        filial,
        ...(dataInicio && { data_inicio: dataInicio }),
        periodo,
      });

      const response = await fetch(`${this.baseUrl}/previsao/operacoes?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar previsões por operação: ${response.statusText}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('[PrevisaoService] Erro em getPrevisaoPorOperacoes:', error);
      throw error;
    }
  }

  /**
   * Buscar previsão consolidada (receitas vs despesas)
   * 
   * @param filial - Filial do usuário
   * @param dataInicio - Data inicial, padrão = hoje
   * @param periodo - Granularidade
   * @returns Consolidado com totais e desvios
   */
  async getPrevisaoConsolidada(
    filial: string,
    dataInicio?: string,
    periodo: 'DIA' | 'MES' | 'ANO' = 'DIA'
  ): Promise<PrevisaoConsolidada> {
    try {
      const params = new URLSearchParams({
        filial,
        ...(dataInicio && { data_inicio: dataInicio }),
        periodo,
      });

      const response = await fetch(`${this.baseUrl}/previsao/consolidado?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar previsão consolidada: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[PrevisaoService] Erro em getPrevisaoConsolidada:', error);
      throw error;
    }
  }

  /**
   * Forçar cálculo de previsões para um período
   * 
   * @param filial - Filial
   * @param dataInicio - Data inicial (ex: '2025-12-01')
   * @param periodo - DIA, MES ou ANO
   * @returns Resultado do cálculo (quantidade de registros atualizados)
   */
  async calcularPrevisao(
    filial: string,
    dataInicio: string,
    periodo: 'DIA' | 'MES' | 'ANO' = 'DIA'
  ): Promise<CalcularPrevisaoResponse> {
    try {
      const payload: CalcularPrevisaoRequest = {
        filial,
        data_inicio: dataInicio,
        periodo,
      };

      const response = await fetch(`${this.baseUrl}/previsao/calcular`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro ao calcular previsão: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[PrevisaoService] Erro em calcularPrevisao:', error);
      throw error;
    }
  }

  /**
   * Formatar moeda para exibição
   */
  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  /**
   * Formatar percentual com cor de sucesso/aviso
   */
  formatarPercentual(valor: number): { texto: string; cor: string } {
    const texto = `${valor >= 0 ? '+' : ''}${valor.toFixed(2)}%`;
    const cor = valor >= 0 ? 'text-success' : 'text-danger'; // Verde se positivo, vermelho se negativo
    return { texto, cor };
  }
}

export default new PrevisaoService();













