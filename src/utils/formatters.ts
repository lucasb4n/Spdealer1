// src/utils/formatters.ts

/**
 * Formata documento CNPJ/CPF com validacao de 14 digitos
 * 
 * REGRA CRITICA: SEMPRE 14 digitos, nunca descartar zeros a esquerda
 * 
 * Exemplos:
 * - CPF 14 digitos:  00053213564905 → 000.532.135.649-05 ✅
 * - CPF 14 digitos:  00003041427800 → 000.030.414.278-00 ✅
 * - CNPJ 14 digitos: 77574119000100 → 77.574.119/0001-00 ✅
 * - CNPJ 14 digitos: 03512300000101 → 03.512.300/0001-01 ✅
 * 
 * @param valor - Valor bruto (pode ter formatacao ou sem)
 * @param tipo - 'F' para CPF, 'J' para CNPJ (auto-detecta se 14 digitos com padroes)
 * @returns Valor formatado XX.XXX.XXX/XXXX-XX ou XXX.XXX.XXX-XX
 */
export function formatarDocumento(valor: string | number | null | undefined, tipo?: 'F' | 'J'): string {
  if (!valor) return '';

  // Converter para string se for número
  const valorStr = typeof valor === 'number' ? valor.toString() : valor;

  // Remover caracteres nao numericos (manter apenas digitos)
  const limpo = valorStr.replace(/\D/g, '');

  // Se 11 dígitos -> CPF
  if (limpo.length === 11) {
    // CPF padrão: 000.000.000-00
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Se 14 dígitos -> CNPJ
  if (limpo.length === 14) {
    return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  // Se 13 dígitos: possível falta de zero à esquerda -> pad à esquerda para 14 e formatar como CNPJ
  if (limpo.length === 13) {
    const padded = limpo.padStart(14, '0');
    return padded.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  // Se tipo informado como 'F' mas temos 14 dígitos (caso legados), tentar formatar como CPF-extendido
  if (tipo === 'F' && limpo.length === 14) {
    // Tenta extrair os 11 dígitos relevantes (últimos 11) e formatar como CPF
    const maybeCpf = limpo.slice(-11);
    return maybeCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Não reconheceu comprimento esperado - apenas retornar o valor limpo (evitar logs repetitivos no grid)
  return valorStr;
}

export function formatarTelefone(valor: string | number | null | undefined): string {
  if (!valor) return '';
  
  // Converter para string se for número
  const valorStr = typeof valor === 'number' ? valor.toString() : valor;
  
  const limpo = valorStr.replace(/\D/g, '');
  if (limpo.length === 10) {
    return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (limpo.length === 11) {
    return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return valorStr;
}













