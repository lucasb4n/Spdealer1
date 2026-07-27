export interface Cliente {
  id: number;
  nome: string;
  cpfCnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  // Campos bancários e atividades
  banco_cli?: string;
  agenc_cli?: string;
  conta_cli?: string;
  cidbco_cli?: string;
  banco1_cli?: string;
  agenc1_cli?: string;
  conta1_cli?: string;
  cidbco1_cli?: string;
  codativ1_cli?: string;
  codativ2_cli?: string;
  codativ3_cli?: string;
  codativ4_cli?: string;
}













