// src/services/FornecedoresService.ts
import axios from 'axios';
import { Cliente } from './ClientesService';

import { API_BASE_URL } from './apiConfig';

// const API_BASE_URL_SERVICE = API_BASE_URL; // removido, não utilizado

export type Fornecedor = Cliente; // Mesma estrutura, apenas filtro diferente

export interface FornecedorFilter {
  search?: string;
  tipopessoa?: 'F' | 'J';
  tipofor?: string | number;
  status?: 'active' | 'inactive';
  cidade?: string;
  uf?: string;
}

export class FornecedoresService {
  
  // Buscar todos os fornecedores (cliforn_cli = 'F')
  static async getFornecedores(filter?: FornecedorFilter): Promise<Fornecedor[]> {
    try {
      const params = new URLSearchParams();
      params.append('cliforn_cli', 'F');

      if (filter?.search) {
        params.append('search', filter.search);
      }
      if (filter?.tipopessoa) {
        params.append('tipopessoa', filter.tipopessoa);
      }
      if (filter?.tipofor !== undefined && filter?.tipofor !== null && filter?.tipofor !== '') {
        params.append('tipofor', String(filter.tipofor));
      }
      if (filter?.cidade) {
        params.append('cidade', filter.cidade);
      }
      if (filter?.uf) {
        params.append('uf', filter.uf);
      }
      if (filter?.status) {
        // backend expects values like 'Ativo'/'Inativo' (case-insensitive) or single letter 'A'
        let statusParam: string = filter.status as string;
        if (statusParam === 'active') statusParam = 'Ativo';
        if (statusParam === 'inactive') statusParam = 'Inativo';
        params.append('status', String(statusParam));
      }

      const url = `${API_BASE_URL}/clientes?${params.toString()}`;
      console.log('GET Fornecedores URL:', url);
      const response = await axios.get(url);

      // Mapear campos do backend (codigo_cli, nome_cli, cgccpf_cli, etc.)
      const fornecedoresRaw = response.data || [];

      const fornecedoresMapped = fornecedoresRaw.map((f: any) => ({
        // manter originais por compatibilidade com outros métodos
        ...f,
        codigo_for: f.codigo_cli || f.codigo_for || f.codigo,
        codigo_cli: f.codigo_cli || f.codigo_for || f.codigo,
        cgccpf_for: f.cgccpf_cli || f.cpf_cnpj_cli || f.cgccpf_cli,
        nome_for: f.nome_for || f.nome_cli || f.nomefan_cli,
        uf_for: f.uf_for || f.uf_cli,
        inscest_for: f.inscest_for || f.inscest_cli,
        fone_for: f.fone_for || f.fone_cli || f.telefone_cli,
        celular_for: f.celular_for || f.celular_cli,
        tipopessoa_for: f.tipopessoa_for || f.tipopessoa_cli,
        // tipo de fornecedor (masfor) esperado pelo formulário
        tipofor_cli: f.tipofor_cli || f.tipofor || f.tipo_for || f.tipo_fornecedor || f.tipofor_for,
        // Campos financeiros e flags usados pelo formulário
        banco_cli: f.banco_cli || f.banco_for || f.banco,
        agenc_cli: f.agenc_cli || f.agenc_for || f.agencia || f.agenc,
        conta_cli: f.conta_cli || f.conta_for || f.conta,
        cidbco_cli: f.cidbco_cli || f.cidbco_for || f.cidbco,
        banco1_cli: f.banco1_cli || f.banco1_for,
        agenc1_cli: f.agenc1_cli || f.agenc1_for,
        conta1_cli: f.conta1_cli || f.conta1_for,
        cidbco1_cli: f.cidbco1_cli || f.cidbco1_for,
        ativoinativo_cli: f.ativoinativo_cli ?? f.ativoinativo_for ?? f.ativo,
        atualizado_cli: f.atualizado_cli ?? f.atualizado_for ?? f.atualizado
      }));

      // Calcular status para cada fornecedor: priorizar flag manual `ativoinativo_cli` quando disponível,
      // caso contrário, fallback para cálculo por movimentação financeira.
      const fornecedoresComStatus = await Promise.all(
        fornecedoresMapped.map(async (fornecedor: any) => {
          let status: 'active' | 'inactive' = 'inactive';
          if (fornecedor.ativoinativo_cli !== undefined && fornecedor.ativoinativo_cli !== null) {
            const val = String(fornecedor.ativoinativo_cli).trim();
            status = (val.toUpperCase() === 'A') ? 'active' : 'inactive';
          } else {
            status = await this.calculateFornecedorStatus(fornecedor.codigo_cli);
          }
          return { ...fornecedor, status };
        })
      );

      // Filtrar por status se especificado
      if (filter?.status) {
        return fornecedoresComStatus.filter(fornecedor => fornecedor.status === filter.status);
      }

      return fornecedoresComStatus;
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw new Error('Falha ao carregar fornecedores');
    }
  }

  // Buscar lista de tipos de fornecedores (masfor)
  static async getTiposFornecedores(): Promise<Array<{ tipo_for: any; descr_for: string }>> {
    try {
      const url = `${API_BASE_URL}/parametros-gerais/masfor/list`;
      console.log('GET Tipos Fornecedores URL:', url);
      const response = await axios.get(url);
      const data = response.data || [];
      // Esperamos um array de objetos com as chaves (ex.: tipo_for, descr_for)
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Erro ao buscar tipos de fornecedores (masfor):', error);
      return [];
    }
  }

  // Buscar fornecedor por ID
  static async getFornecedorById(id: number): Promise<Fornecedor> {
    try {
      const url = `${API_BASE_URL}/clientes/${id}?cliforn_cli=F`;
      console.log('GET FornecedorById URL:', url);
      const response = await axios.get(url);
      const fornecedor = response.data || {};

      const mapped = {
        ...fornecedor,
        codigo_for: fornecedor.codigo_cli || fornecedor.codigo_for || fornecedor.codigo,
        cgccpf_for: fornecedor.cgccpf_cli || fornecedor.cpf_cnpj_cli || fornecedor.cgccpf_for,
        nome_for: fornecedor.nome_for || fornecedor.nome_cli || fornecedor.nomefan_cli,
        uf_for: fornecedor.uf_for || fornecedor.uf_cli,
        inscest_for: fornecedor.inscest_for || fornecedor.inscest_cli,
        fone_for: fornecedor.fone_for || fornecedor.fone_cli || fornecedor.telefone_cli,
        celular_for: fornecedor.celular_for || fornecedor.celular_cli,
        tipopessoa_for: fornecedor.tipopessoa_for || fornecedor.tipopessoa_cli,
        // tipo de fornecedor (masfor) esperado pelo formulário
        tipofor_cli: fornecedor.tipofor_cli || fornecedor.tipofor || fornecedor.tipo_for || fornecedor.tipo_fornecedor || fornecedor.tipofor_for,
        // Campos financeiros e flags usados pelo formulário
        banco_cli: fornecedor.banco_cli || fornecedor.banco_for || fornecedor.banco,
        agenc_cli: fornecedor.agenc_cli || fornecedor.agenc_for || fornecedor.agencia || fornecedor.agenc,
        conta_cli: fornecedor.conta_cli || fornecedor.conta_for || fornecedor.conta,
        cidbco_cli: fornecedor.cidbco_cli || fornecedor.cidbco_for || fornecedor.cidbco,
        banco1_cli: fornecedor.banco1_cli || fornecedor.banco1_for,
        agenc1_cli: fornecedor.agenc1_cli || fornecedor.agenc1_for,
        conta1_cli: fornecedor.conta1_cli || fornecedor.conta1_for,
        cidbco1_cli: fornecedor.cidbco1_cli || fornecedor.cidbco1_for,
        ativoinativo_cli: fornecedor.ativoinativo_cli ?? fornecedor.ativoinativo_for ?? fornecedor.ativo,
        atualizado_cli: fornecedor.atualizado_cli ?? fornecedor.atualizado_for ?? fornecedor.atualizado
      };

      // Priorizar flag manual `ativoinativo_cli` se fornecida pelo backend
      if (mapped.ativoinativo_cli !== undefined && mapped.ativoinativo_cli !== null) {
        const val = String(mapped.ativoinativo_cli).trim();
        return { ...mapped, status: (val.toUpperCase() === 'A') ? 'active' : 'inactive' };
      }

      return {
        ...mapped,
        status: await this.calculateFornecedorStatus(mapped.codigo_cli)
      };
    } catch (error) {
      console.error('Erro ao buscar fornecedor:', error);
      throw new Error('Fornecedor não encontrado');
    }
  }

  // Criar novo fornecedor
  static async createFornecedor(fornecedor: Omit<Fornecedor, 'codigo_cli' | 'dataatual_cli' | 'status'>): Promise<Fornecedor> {
    try {
      const fornecedorData = {
        ...fornecedor,
        cliforn_cli: 'F',
        dataatual_cli: new Date().toISOString().split('T')[0]
      };

      const response = await axios.post(`${API_BASE_URL}/clientes`, fornecedorData);
      const f = response.data || {};
      return {
        ...f,
        codigo_for: f.codigo_cli,
        cgccpf_for: f.cgccpf_cli || f.cpf_cnpj_cli,
        nome_for: f.nome_for || f.nome_cli || f.nomefan_cli,
        uf_for: f.uf_for || f.uf_cli,
        inscest_for: f.inscest_for || f.inscest_cli,
        fone_for: f.fone_for || f.fone_cli || f.telefone_cli,
        celular_for: f.celular_for || f.celular_cli,
        tipopessoa_for: f.tipopessoa_for || f.tipopessoa_cli
      };
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      // Se for um erro do Axios, tentar propagar a mensagem retornada pelo backend
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr: any = error;
        if (anyErr && anyErr.response && anyErr.response.data) {
          const data = anyErr.response.data;
          const msg = data.erro || data.mensagem || data.error || JSON.stringify(data);
          throw new Error(msg || 'Falha ao criar fornecedor');
        }
      } catch (e) {
        // fallback
      }
      throw new Error('Falha ao criar fornecedor');
    }
  }

  // Atualizar fornecedor
  static async updateFornecedor(id: number, fornecedor: Partial<Fornecedor>): Promise<Fornecedor> {
    try {
      const fornecedorData = {
        ...fornecedor,
        dataatual_cli: new Date().toISOString().split('T')[0]
      };

      const response = await axios.put(`${API_BASE_URL}/clientes/${id}`, fornecedorData);
      const f = response.data || {};
      return {
        ...f,
        codigo_for: f.codigo_cli,
        cgccpf_for: f.cgccpf_cli || f.cpf_cnpj_cli,
        nome_for: f.nome_for || f.nome_cli || f.nomefan_cli,
        uf_for: f.uf_for || f.uf_cli,
        inscest_for: f.inscest_for || f.inscest_cli,
        fone_for: f.fone_for || f.fone_cli || f.telefone_cli,
        celular_for: f.celular_for || f.celular_cli,
        tipopessoa_for: f.tipopessoa_for || f.tipopessoa_cli
      };
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      throw new Error('Falha ao atualizar fornecedor');
    }
  }

  // Verificar se fornecedor pode ser excluído (não tem registros em pagar)
  static async canDeleteFornecedor(id: number): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/${id}/can-delete`);
      return response.data.canDelete;
    } catch (error) {
      console.error('Erro ao verificar se fornecedor pode ser excluído:', error);
      return false;
    }
  }

  // Excluir fornecedor
  static async deleteFornecedor(id: number): Promise<void> {
    try {
      const canDelete = await this.canDeleteFornecedor(id);
      if (!canDelete) {
        throw new Error('Fornecedor não pode ser excluído pois possui movimentações financeiras');
      }

      await axios.delete(`${API_BASE_URL}/clientes/${id}`);
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      throw error instanceof Error ? error : new Error('Falha ao excluir fornecedor');
    }
  }

  // Calcular status do fornecedor baseado em movimentações (tabela pagar)
  static async calculateFornecedorStatus(fornecedorId: number): Promise<'active' | 'inactive'> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/${fornecedorId}/last-movement`);
      
      if (!response.data.lastMovement) {
        return 'inactive';
      }

      const lastMovementDate = new Date(response.data.lastMovement);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24));

      return diffDays > 60 ? 'inactive' : 'active';
    } catch (error) {
      console.error('Erro ao calcular status do fornecedor:', error);
      return 'inactive';
    }
  }

  // Retorna total de fornecedores (cliforn_cli = 'F')
  static async getTotalFornecedores(tipofor?: string | number, status?: string): Promise<number> {
    try {
      const params = new URLSearchParams();
      params.append('cliforn_cli', 'F');
      if (tipofor !== undefined && tipofor !== null && String(tipofor).trim() !== '') {
        params.append('tipofor', String(tipofor));
      }
      if (status) {
        let statusParam = status;
        if (statusParam === 'active') statusParam = 'Ativo';
        if (statusParam === 'inactive') statusParam = 'Inativo';
        params.append('status', String(statusParam));
      }
      // Use relative /api path in development to go through the dev-server proxy,
      // which can avoid issues with direct localhost:8080 requests in some setups.
      const base = (process.env.NODE_ENV === 'development') ? '/api' : API_BASE_URL;
      const url = `${base}/clientes/count?${params.toString()}`;
      console.log('GET Total Fornecedores URL:', url);
      const response = await axios.get(url);
      const data = response.data || {};
      if (typeof data.total === 'number') return data.total;
      if (data.total && !isNaN(Number(data.total))) return Number(data.total);
      return 0;
    } catch (error) {
      console.error('Erro ao buscar total de fornecedores:', error);
      return 0;
    }
  }

  // Alterna o status ativo/inativo de um fornecedor
  static async toggleAtivo(id: number, activate: boolean, cliforn_cli: string = 'F'): Promise<boolean> {
    try {
      // Use direct backend URL for PATCH to avoid dev-server proxy issues with some setups
      const base = API_BASE_URL;
      const url = `${base}/clientes/${id}/toggle-ativo?activate=${activate}&cliforn_cli=${encodeURIComponent(cliforn_cli)}`;
      console.log('PATCH Toggle Ativo URL:', url);
      try {
        const response = await axios.patch(url);
        return response.status >= 200 && response.status < 300;
      } catch (err: any) {
        // If PATCH is not supported by the server/proxy, fall back to POST to the same endpoint
        if (err && err.response && err.response.status === 404) {
          console.warn('PATCH returned 404, retrying with POST:', url);
          const respPost = await axios.post(url);
          return respPost.status >= 200 && respPost.status < 300;
        }
        throw err;
      }
    } catch (error) {
      console.error('Erro ao alternar status do fornecedor:', error);
      return false;
    }
  }

  // Reutilizar métodos de validação e formatação do ClientesService
  static validarCPF = (cpf: string): boolean => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
      return false;
    }

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(10))) return false;

    return true;
  }

  static validarCNPJ = (cnpj: string): boolean => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14 || /^(\d)\1{13}$/.test(cnpjLimpo)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpjLimpo.charAt(i)) * weights1[i];
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    if (digito1 !== parseInt(cnpjLimpo.charAt(12))) return false;

    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpjLimpo.charAt(i)) * weights2[i];
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;
    if (digito2 !== parseInt(cnpjLimpo.charAt(13))) return false;

    return true;
  }

  static formatarCPF = (cpf: string): string => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  static formatarCNPJ = (cnpj: string): string => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  static formatarTelefone = (telefone: string): string => {
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo.length === 10) {
      return telLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (telLimpo.length === 11) {
      return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  static buscarCEP = async (cep: string): Promise<{
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
  } | null> => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) {
        throw new Error('CEP inválido');
      }

      const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      
      if (response.data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        logradouro: response.data.logradouro,
        bairro: response.data.bairro,
        localidade: response.data.localidade,
        uf: response.data.uf
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }
}













