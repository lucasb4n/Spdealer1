// src/services/ClientesService.ts
import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

export interface Cliente {
  codigo_cli: number;
  tipopessoa_cli: 'F' | 'J'; // F = Física, J = Jurídica
  cgccpf_cli: string;
  cpf_cnpj_cli: string;
  nome_cli: string;
  inscest_cli?: string; // Inscrição Estadual (CNPJ) ou RG (CPF)
  inscmun_cli?: string; // Inscrição Municipal (só CNPJ)
  nomefan_cli?: string; // Nome Fantasia (CNPJ) ou Como quer ser chamado (CPF)
  contato_cli?: string; // Pessoa de contato
  ident_cli?: string; // RG (pessoa física)
  orgemis_cli?: string; // Órgão Emissor RG
  sexo_cli?: 'M' | 'F'; // Sexo (só pessoa física)
  cep_cli?: string;
  logra_cli?: string; // Endereço
  numero_cli?: string; // Número
  bairro_cli?: string;
  cidade_cli?: string;
  uf_cli?: string;
  pref_cli?: string; // Prefixo telefone
  fone_cli?: string;
  pref1_cli?: string; // Prefixo telefone 2
  fone1_cli?: string; // Telefone 2
  datanasc_cli?: string; // Data nascimento (CPF) ou registro (CNPJ)
  natual_cli?: string; // Naturalidade
  dataatual_cli?: string; // Data atualização
  datcomp_cli?: string; // Data última compra
  datbloq_cli?: string; // Data bloqueio
  datlib_cli?: string; // Data liberação
  motbloq_cli?: string; // Motivo bloqueio
  motlib_cli?: string; // Motivo liberação
  prof_cli?: string; // Profissão (CPF) ou Segmento (CNPJ)
  prefcel_cli?: string; // Prefixo celular
  celular_cli?: string;
  email_cli?: string;
  cliforn_cli: 'C' | 'F'; // C = Cliente, F = Fornecedor
  status?: 'active' | 'inactive'; // Calculado baseado em movimentações

  // Novos campos adicionados
  limcre_cli?: number; // Limite de crédito
  codativ1_cli?: string; // Atividade 1
  codativ2_cli?: string; // Atividade 2
  codativ3_cli?: string; // Atividade 3
  codativ4_cli?: string; // Atividade 4
  latitude_cli?: number; // Latitude para geolocalização
  longitude_cli?: number; // Longitude para geolocalização
  // Campos bancários
  banco_cli?: string;
  agenc_cli?: string;
  conta_cli?: string;
  cidbco_cli?: string;
  banco1_cli?: string;
  agenc1_cli?: string;
  conta1_cli?: string;
  cidbco1_cli?: string;
}

export interface ClienteFilter {
  search?: string;
  tipopessoa?: 'F' | 'J';
  status?: 'active' | 'inactive';
  cidade?: string;
  uf?: string;
}

export class ClientesService {

  // Buscar transportadoras (cliforn_cli = 'F' e tipofor_cli = 1)
  static async getTransportadoras(search?: string): Promise<Cliente[]> {
    try {
      const params = new URLSearchParams();
      params.append('cliforn_cli', 'F');
      params.append('tipofor', '1'); // 001

      if (search) {
        params.append('search', search);
      }

      const response = await axios.get(`${API_BASE_URL}/clientes?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transportadoras:', error);
      throw new Error('Falha ao carregar transportadoras');
    }
  }

  // Buscar todos os clientes (cliforn_cli = 'C')
  static async getClientes(filter?: ClienteFilter): Promise<Cliente[]> {
    try {
      const params = new URLSearchParams();
      params.append('cliforn_cli', 'C');

      if (filter?.search) {
        params.append('search', filter.search);
      }
      if (filter?.tipopessoa) {
        params.append('tipopessoa', filter.tipopessoa);
      }
      if (filter?.cidade) {
        params.append('cidade', filter.cidade);
      }
      if (filter?.uf) {
        params.append('uf', filter.uf);
      }

      const response = await axios.get(`${API_BASE_URL}/clientes?${params.toString()}`);

      // Calcular status para cada cliente
      const clientesComStatus = await Promise.all(
        response.data.map(async (cliente: Cliente) => ({
          ...cliente,
          status: await this.calculateClienteStatus(cliente.codigo_cli)
        }))
      );

      // Filtrar por status se especificado
      if (filter?.status) {
        return clientesComStatus.filter(cliente => cliente.status === filter.status);
      }

      return clientesComStatus;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error('Falha ao carregar clientes');
    }
  }

  // Buscar cliente por ID
  static async getClienteById(id: number): Promise<Cliente> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/${id}`);
      const cliente = response.data;

      return {
        ...cliente,
        status: await this.calculateClienteStatus(cliente.codigo_cli)
      };
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      throw new Error('Cliente não encontrado');
    }
  }

  // Criar novo cliente
  static async createCliente(cliente: Omit<Cliente, 'codigo_cli' | 'dataatual_cli' | 'status'>): Promise<Cliente> {
    try {
      const clienteData = {
        ...cliente,
        cliforn_cli: 'C',
        dataatual_cli: new Date().toISOString().split('T')[0]
      };

      const response = await axios.post(`${API_BASE_URL}/clientes`, clienteData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Falha ao criar cliente');
    }
  }

  // Atualizar cliente
  static async updateCliente(id: number, cliente: Partial<Cliente>): Promise<Cliente> {
    try {
      const clienteData = {
        ...cliente,
        dataatual_cli: new Date().toISOString().split('T')[0]
      };

      const response = await axios.put(`${API_BASE_URL}/clientes/${id}`, clienteData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error('Falha ao atualizar cliente');
    }
  }

  // Verificar se cliente pode ser excluído (não tem registros em receber)
  static async canDeleteCliente(id: number): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/${id}/can-delete`);
      return response.data.canDelete;
    } catch (error) {
      console.error('Erro ao verificar se cliente pode ser excluído:', error);
      return false;
    }
  }

  // Excluir cliente
  static async deleteCliente(id: number): Promise<void> {
    try {
      const canDelete = await this.canDeleteCliente(id);
      if (!canDelete) {
        throw new Error('Cliente não pode ser excluído pois possui movimentações financeiras');
      }

      await axios.delete(`${API_BASE_URL}/clientes/${id}`);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      throw error instanceof Error ? error : new Error('Falha ao excluir cliente');
    }
  }

  // Calcular status do cliente baseado em movimentações
  static async calculateClienteStatus(clienteId: number): Promise<'active' | 'inactive'> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clientes/${clienteId}/last-movement`);

      if (!response.data.lastMovement) {
        return 'inactive';
      }

      const lastMovementDate = new Date(response.data.lastMovement);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24));

      return diffDays > 60 ? 'inactive' : 'active';
    } catch (error) {
      console.error('Erro ao calcular status do cliente:', error);
      return 'inactive';
    }
  }

  // Buscar CEP via API
  static async buscarCEP(cep: string): Promise<{
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
  } | null> {
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

  // Validar CPF
  static validarCPF(cpf: string): boolean {
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

  // Validar CNPJ
  static validarCNPJ(cnpj: string): boolean {
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

  // Formatar CPF
  static formatarCPF(cpf: string): string {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Formatar CNPJ
  static formatarCNPJ(cnpj: string): string {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  // Formatar telefone
  static formatarTelefone(telefone: string): string {
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo.length === 10) {
      return telLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (telLimpo.length === 11) {
      return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }
}













