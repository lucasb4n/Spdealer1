export interface Boleto {
  id: number;
  tipoAut: string;
  numapo1Aut: string;
  numapo2Aut: string;
  controleAut: string;
  dataautAut: string;
  vencimentoAut: string;
  pagoAut: string;
  valorcanAut: number;
  dataenvAut: string;
  bancoAut: string;
  codapiAut: string;
  codbolAut: string;
  msgAut: string;
  enviaAut: string;
  celularAut: string;
  alteradoAut: string;
  apiDataCompilacao: string;
  apiVersao: string;
  arquivoPdf: string;
  campoLivre: string;
  codigoBarras: string;
  linhaDigitavel: string;
  nossoNumero: string;
  nossoNumeroCompleto: string;
  nossoNumeroDv: string;
  servidorResposta: string;
  pixQrcode: string;
  pixTxid: string;
  requisicao: string;
  requisicaoUrl: string;
  httpsStatusCode: string;
  txid: string;
  cooperativa: string;
  posto: string;
  nossonumero: string;
  intimacert: string;
  intimaint: string;
  situacaoDescricao: string;
  sucesso: string;
  cancelado: string;
}

export type Autoriza = Boleto;

export interface Stats {
  total: number;
  enviados: number;
  sucesso1: number;
  sucessoOK: number;
}
