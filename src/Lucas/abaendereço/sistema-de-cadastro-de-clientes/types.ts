export interface AddressData {
  street: string;
  number: string;
  updatedAt: string;
  neighborhood: string;
  city: string;
  cep: string;
  latitude: string;
  longitude: string;
  phone: string;
  cellphone: string;
  whatsapp: string;
  residenceType: string;
  residenceTime: string;
  printLabels: boolean;
  regionId: string;
  regionDescription: string;
  email: string;
}

export interface CustomerData {
  code: string;
  name: string;
  document: string;
  address: AddressData;
}

export enum TabType {
  ENDERECO = 'ENDERECO',
  JURIDICA = 'JURÍDICA',
  FISICA = 'FÍSICA',
  COBRANCA = 'COBRANÇA',
  CREDITO = 'CRÉDITO',
  BLOQ_LIB = 'BLOQ/LIB'
}













