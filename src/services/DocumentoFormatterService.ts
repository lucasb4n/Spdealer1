/**
 * Serviço de Formatação de Documentos (CNPJ/CPF)
 * Aplica regras do sistema SPDealer
 * 
 * CPF: 000.000.000-00 (11 dígitos)
 * CNPJ: 00.000.000/0000-00 (14 dígitos)
 */
export class DocumentoFormatterService {
  
  /**
   * Formata CNPJ/CPF baseado no tipo de pessoa
   * @param cgccpf String com CNPJ ou CPF (14 ou 11 dígitos)
   * @param tipopessoa 'F' (Física) ou 'J' (Jurídica)
   * @returns Documento formatado
   * @example
   * formatarDocumento('12345678901', 'F') // 123.456.789-01
   * formatarDocumento('12345678000190', 'J') // 12.345.678/0000-90
   */
  static formatarDocumento(cgccpf: string | number | null | undefined, tipopessoa: string = 'F'): string {
    if (!cgccpf) return '';
    
    // Converter para string e remover caracteres não numéricos
    const cgccpfStr = String(cgccpf);
    const limpo = cgccpfStr.replace(/\D/g, '');
    
    if (!limpo) return '';
    
    // CPF: 11 dígitos → 000.000.000-00
    if (tipopessoa === 'F' && limpo.length === 11) {
      return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    // CNPJ: 14 dígitos → 00.000.000/0000-00
    if (tipopessoa === 'J' && limpo.length === 14) {
      return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    // Se não conseguir determinar, retorna original (sem formatação)
    return limpo;
  }
  
  /**
   * Formata CPF (11 dígitos)
   * @param cpf String com CPF
   * @returns CPF formatado: 000.000.000-00
   */
  static formatarCPF(cpf: string | number | null | undefined): string {
    if (!cpf) return '';
    
    const limpo = String(cpf).replace(/\D/g, '');
    
    if (limpo.length !== 11) return limpo;
    
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  /**
   * Formata CNPJ (14 dígitos)
   * @param cnpj String com CNPJ
   * @returns CNPJ formatado: 00.000.000/0000-00
   */
  static formatarCNPJ(cnpj: string | number | null | undefined): string {
    if (!cnpj) return '';
    
    const limpo = String(cnpj).replace(/\D/g, '');
    
    if (limpo.length !== 14) return limpo;
    
    return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  /**
   * Detecta automaticamente se é CPF ou CNPJ e formata
   * @param documento String com CNPJ ou CPF
   * @returns Documento formatado
   */
  static formatarAutomatico(documento: string | number | null | undefined): string {
    if (!documento) return '';
    
    const limpo = String(documento).replace(/\D/g, '');
    
    if (limpo.length === 11) {
      return this.formatarCPF(limpo);
    } else if (limpo.length === 14) {
      return this.formatarCNPJ(limpo);
    }
    
    return limpo;
  }
  
  /**
   * Remove formatação e retorna apenas dígitos
   * @param documento String formatado ou não
   * @returns Documento sem formatação
   */
  static removerFormatacao(documento: string): string {
    return documento.replace(/\D/g, '');
  }
}













