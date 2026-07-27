// Serviços para consumo de APIs públicas (CEP, Pessoa Jurídica/Física, NCM/NBM, etc)

export class PublicApiService {
  // Consulta CEP via ViaCEP
  static async consultarCep(cep: string): Promise<any> {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error('Erro ao consultar CEP');
    return response.json();
  }

  // Consulta CNPJ via ReceitaWS
  static async consultarCnpj(cnpj: string): Promise<any> {
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
    if (!response.ok) throw new Error('Erro ao consultar CNPJ');
    return response.json();
  }

  // Consulta CPF (exemplo, depende de API contratada)
  static async consultarCpf(cpf: string): Promise<any> {
    // Exemplo fictício
    const response = await fetch(`https://api.cpf.com/v1/cpf/${cpf}`);
    if (!response.ok) throw new Error('Erro ao consultar CPF');
    return response.json();
  }

  // Consulta NCM/NBM (exemplo, depende de API contratada)
  static async consultarNcm(ncm: string): Promise<any> {
    // Exemplo fictício
    const response = await fetch(`https://api.ncm.com/v1/ncm/${ncm}`);
    if (!response.ok) throw new Error('Erro ao consultar NCM');
    return response.json();
  }
}













