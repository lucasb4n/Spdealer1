export interface CustomerData {
  tradingName?: string
  stateRegistration?: string
  municipalRegistration?: string
  isNonContributor?: boolean
  isContributor?: boolean
  isSimplesNacional?: boolean
  name?: string
  document?: string
  [key: string]: any
}

export interface AddressData {
  street?: string
  cep?: string
  city?: string
  uf?: string
  [key: string]: any
}

export interface CustomerCreditData {
  limiteCredito?: number | string
  saldoDisponivel?: number | string
  [key: string]: any
}

export interface IncluirRegistroData {
  juridica?: CustomerData
  endereco?: AddressData
  fisica?: CustomerData
  cobranca?: AddressData
  credito?: CustomerCreditData
}
// Removed fences
