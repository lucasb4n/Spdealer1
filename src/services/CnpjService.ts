import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Interface para dados da API da Receita Federal
export interface CnpjData {
  status: string;
  ultima_atualizacao: string;
  cnpj: string;
  tipo: string;
  porte: string;
  nome: string;
  fantasia: string;
  abertura: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  atividades_secundarias: Array<{
    code: string;
    text: string;
  }>;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento: string;
  cep: string;
  bairro: string;
  municipio: string;
  uf: string;
  email: string;
  telefone: string;
  efr: string;
  situacao: string;
  data_situacao: string;
  motivo_situacao: string;
  situacao_especial: string;
  data_situacao_especial: string;
  capital_social: string;
  qsa: Array<{
    nome: string;
    qual: string;
    pais_origem: string;
    nome_rep_legal: string;
    qual_rep_legal: string;
  }>;
}

// Interface para dados formatados para o sistema
export interface CnpjFormattedData {
  nome_cli: string;
  nomefan_cli: string;
  inscest_cli: string;
  inscmun_cli: string;
  logra_cli: string;
  numero_cli: string;
  compl_cli: string;
  cep_cli: string;
  bairro_cli: string;
  cidade_cli: string;
  uf_cli: string;
  email_cli: string;
  fone_cli: string;
  situacao: string;
  atividade_principal: string;
  capital_social: string;
  data_abertura: string;
}

export class CnpjService {
  private static readonly API_BASE_URL = 'https://receitaws.com.br/v1/cnpj';
  private static readonly API_BACKUP_URL = 'https://publica.cnpj.ws/cnpj';
  private static readonly CACHE_KEY_PREFIX = 'cnpj_cache_';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Limpa e valida formato de CNPJ
   */
  static cleanCnpj(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  /**
   * Busca dados de CNPJ na API da Receita Federal (com fallback)
   */
  static async consultarCnpj(cnpj: string): Promise<CnpjFormattedData | null> {
    try {
      const cnpjLimpo = this.cleanCnpj(cnpj);
      
      if (cnpjLimpo.length !== 14) {
        throw new Error('CNPJ deve ter 14 dígitos');
      }

      // Verificar cache primeiro
      const cachedData = this.getCachedData(cnpjLimpo);
      if (cachedData) {
        return cachedData;
      }

      // Tentar API principal primeiro
      try {
        const data = await this.fetchFromMainApi(cnpjLimpo);
        if (data) {
          const formattedData = this.formatCnpjData(data);
          this.setCachedData(cnpjLimpo, formattedData);
          return formattedData;
        }
      } catch (mainApiError) {
        console.warn('API principal falhou, tentando API alternativa:', mainApiError);
      }

      // Tentar API alternativa
      try {
        const data = await this.fetchFromBackupApi(cnpjLimpo);
        if (data) {
          const formattedData = this.formatBackupApiData(data);
          this.setCachedData(cnpjLimpo, formattedData);
          return formattedData;
        }
      } catch (backupApiError) {
        console.warn('API alternativa também falhou:', backupApiError);
      }

      throw new Error('Todas as APIs de consulta CNPJ estão indisponíveis no momento');

    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Erro ao consultar CNPJ. Verifique sua conexão.');
    }
  }

  /**
   * Busca dados na API principal (ReceitaWS)
   */
  private static async fetchFromMainApi(cnpj: string): Promise<CnpjData | null> {
    const response = await fetch(`${this.API_BASE_URL}/${cnpj}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SPDealer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`API principal retornou erro: ${response.status}`);
    }

    const data: CnpjData = await response.json();

    // Verificar se a resposta indica erro
    if (data.status === 'ERROR' || !data.nome) {
      throw new Error('CNPJ não encontrado ou inválido');
    }

    return data;
  }

  /**
   * Busca dados na API alternativa (cnpj.ws)
   */
  private static async fetchFromBackupApi(cnpj: string): Promise<any | null> {
    const response = await fetch(`${this.API_BACKUP_URL}/${cnpj}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SPDealer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`API alternativa retornou erro: ${response.status}`);
    }

    const data = await response.json();

    if (!data.razao_social) {
      throw new Error('CNPJ não encontrado na API alternativa');
    }

    return data;
  }

  /**
   * Formata dados da API alternativa para o padrão do sistema
   */
  private static formatBackupApiData(data: any): CnpjFormattedData {
    return {
      nome_cli: data.razao_social || '',
      nomefan_cli: data.nome_fantasia || data.razao_social || '',
      inscest_cli: '',
      inscmun_cli: '',
      logra_cli: this.formatEndereco(data.logradouro || '', data.numero || ''),
      numero_cli: data.numero || '',
      compl_cli: data.complemento || '',
      cep_cli: this.formatCep(data.cep || ''),
      bairro_cli: data.bairro || '',
      cidade_cli: data.municipio || '',
      uf_cli: data.uf || '',
      email_cli: data.email || '',
      fone_cli: this.formatTelefone(data.ddd1 && data.telefone1 ? data.ddd1 + data.telefone1 : ''),
      situacao: this.formatSituacao(data.situacao_cadastral || ''),
      atividade_principal: data.cnae_fiscal_descricao || '',
      capital_social: this.formatCapitalSocial(data.capital_social || ''),
      data_abertura: this.formatData(data.data_inicio_atividade || '')
    };
  }

  /**
   * Formata dados da API para o padrão do sistema
   */
  private static formatCnpjData(data: CnpjData): CnpjFormattedData {
    return {
      nome_cli: data.nome || '',
      nomefan_cli: data.fantasia || data.nome || '',
      inscest_cli: '', // Não fornecido pela API
      inscmun_cli: '', // Não fornecido pela API
      logra_cli: this.formatEndereco(data.logradouro, data.numero),
      numero_cli: data.numero || '',
      compl_cli: data.complemento || '',
      cep_cli: this.formatCep(data.cep),
      bairro_cli: data.bairro || '',
      cidade_cli: data.municipio || '',
      uf_cli: data.uf || '',
      email_cli: data.email || '',
      fone_cli: this.formatTelefone(data.telefone),
      situacao: this.formatSituacao(data.situacao),
      atividade_principal: data.atividade_principal?.[0]?.text || '',
      capital_social: this.formatCapitalSocial(data.capital_social),
      data_abertura: this.formatData(data.abertura)
    };
  }

  /**
   * Formata endereço completo
   */
  private static formatEndereco(logradouro: string, numero: string): string {
    if (!logradouro) return '';
    return numero ? `${logradouro}, ${numero}` : logradouro;
  }

  /**
   * Formata CEP
   */
  private static formatCep(cep: string): string {
    if (!cep) return '';
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Formata telefone
   */
  private static formatTelefone(telefone: string): string {
    if (!telefone) return '';
    const telLimpo = telefone.replace(/\D/g, '');
    
    if (telLimpo.length === 10) {
      return telLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (telLimpo.length === 11) {
      return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
  }

  /**
   * Formata situação da empresa
   */
  private static formatSituacao(situacao: string): string {
    const situacoes: { [key: string]: string } = {
      'ATIVA': 'Ativa',
      'SUSPENSA': 'Suspensa',
      'INAPTA': 'Inapta',
      'BAIXADA': 'Baixada',
      'NULA': 'Nula'
    };
    
    return situacoes[situacao?.toUpperCase()] || situacao || '';
  }

  /**
   * Formata capital social
   */
  private static formatCapitalSocial(capital: string): string {
    if (!capital) return '';
    
    const valor = parseFloat(capital.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(valor)) return capital;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Formata data
   */
  private static formatData(data: string): string {
    if (!data) return '';
    
    // Se a data estiver no formato DD/MM/YYYY
    if (data.includes('/')) {
      const [dia, mes, ano] = data.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    
    return data;
  }

  /**
   * Obtém dados do cache
   */
  private static getCachedData(cnpj: string): CnpjFormattedData | null {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${cnpj}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      
      // Verificar se o cache ainda é válido
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Salva dados no cache
   */
  private static setCachedData(cnpj: string, data: CnpjFormattedData): void {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${cnpj}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      // Ignorar erro de cache
      console.warn('Erro ao salvar cache CNPJ:', error);
    }
  }

  /**
   * Limpa cache antigo
   */
  static clearOldCache(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      cacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  /**
   * Verifica se CNPJ existe na base local
   */
  static async verificarCnpjExistente(cnpj: string, tipo: 'C' | 'F'): Promise<boolean> {
    try {
      const cnpjLimpo = this.cleanCnpj(cnpj);
      
      const response = await axios.get(`${API_BASE_URL}/clientes/verificar-cnpj`, {
        params: {
          cgccpf_cli: cnpjLimpo,
          cliforn_cli: tipo
        }
      });
      
      return response.data.exists;
    } catch (error) {
      console.error('Erro ao verificar CNPJ:', error);
      return false;
    }
  }
}

// Limpar cache antigo na inicialização
if (typeof window !== 'undefined') {
  CnpjService.clearOldCache();
}













