/**
 * maskUtils.ts
 * 
 * Utilitários para aplicar máscaras em campos de entrada
 * Suporta: CEP, CNPJ, CPF, Telefone, Email
 */

/**
 * Máscara CEP: 12345-678
 */
export const maskCEP = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  return cleaned.replace(/^(\d{5})(\d{3})$/, '$1-$2');
};

/**
 * Máscara CNPJ: 12.345.678/0001-95
 */
export const maskCNPJ = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

/**
 * Máscara CPF: 123.456.789-09
 */
export const maskCPF = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
    .substring(0, 14);
};

/**
 * Máscara Telefone: (11) 98765-4321 ou (11) 3456-7890
 */
export const maskPhone = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  
  // Se tem 11 dígitos (celular com 9º dígito)
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  
  // Se tem 10 dígitos (telefone fixo)
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  // Parcial (enquanto digita)
  return cleaned
    .replace(/^(\d{2})/, '($1')
    .replace(/^(\(\d{2})(\d{5})/, '$1) $2')
    .replace(/^(\(\d{2}\) \d{5})(\d{4})/, '$1-$2')
    .substring(0, 15);
};

/**
 * Máscara Data: DD/MM/YYYY
 */
export const maskDate = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  return cleaned
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
    .substring(0, 10);
};

/**
 * Máscara Moeda: 1.234,56
 */
export const maskMoney = (value: string): string => {
  if (!value) return '';
  let cleaned = value.replace(/\D/g, '');
  
  // Adicionar zeros à esquerda se necessário
  while (cleaned.length < 3) {
    cleaned = '0' + cleaned;
  }
  
  const inteiro = cleaned.substring(0, cleaned.length - 2);
  const decimal = cleaned.substring(cleaned.length - 2);
  
  // Formatar inteiro com pontos a cada 3 dígitos
  const interoFormatado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return interoFormatado + ',' + decimal;
};

/**
 * Detectar e aplicar máscara baseado no nome do campo
 */
export const applyMask = (fieldName: string, value: string): string => {
  const fieldLower = fieldName.toLowerCase();
  
  // CNPJ: pode ser CGC, CNPJ, CNPJ_GER, CGC_GER
  if (fieldLower.includes('cgc') || fieldLower.includes('cnpj')) {
    return maskCNPJ(value);
  } else if (fieldLower.includes('cep')) {
    return maskCEP(value);
  } else if (fieldLower.includes('cpf')) {
    return maskCPF(value);
  } else if (fieldLower.includes('telefone') || fieldLower.includes('fone') || fieldLower.includes('phone')) {
    return maskPhone(value);
  } else if (fieldLower.includes('fax')) {
    return maskPhone(value); // FAX usa mesma máscara de telefone
  } else if (fieldLower.includes('data') || fieldLower.includes('date')) {
    return maskDate(value);
  } else if (fieldLower.includes('valor') || fieldLower.includes('money') || fieldLower.includes('price')) {
    return maskMoney(value);
  }
  
  return value;
};

/**
 * Remover máscara de um valor
 */
export const unmaskValue = (value: string): string => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Validar CEP
 */
export const isValidCEP = (value: string): boolean => {
  const cleaned = unmaskValue(value);
  return cleaned.length === 8;
};

/**
 * Validar CNPJ
 */
export const isValidCNPJ = (value: string): boolean => {
  const cleaned = unmaskValue(value);
  if (cleaned.length !== 14) return false;
  
  // Validação simples (algoritmo completo seria mais complexo)
  return cleaned !== '00000000000000';
};

/**
 * Validar CPF
 */
export const isValidCPF = (value: string): boolean => {
  const cleaned = unmaskValue(value);
  if (cleaned.length !== 11) return false;
  
  // Validação simples
  return cleaned !== '00000000000';
};

/**
 * Validar Telefone
 */
export const isValidPhone = (value: string): boolean => {
  const cleaned = unmaskValue(value);
  return cleaned.length === 10 || cleaned.length === 11;
};













