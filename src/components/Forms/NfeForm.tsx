import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './NfeForm.css';

interface NotaFiscal {
  filial: number;
  emissao: number;
  serie: string;
  numero: number;
  tipo: string;
  documento: string;
  inscest?: string;
  cliente: string;
  condpag?: string;
  vendedor?: number;
  vlrdesc?: number;
  vlrtotal: number;
  vlriss?: number;
  os?: string;
  orcamp?: string;
  cancelada?: string;
  status?: string;
  chave?: string;
  protocolo?: string;
  tipopessoa?: string;
  isTotal?: boolean;
}

interface NotaItem {
  fab?: string;
  codigo: string;
  sequencia?: number;
  descricao: string;
  ncm?: string;
  quantidade: number;
  vlrunitario: number;
  vlrtotal: number;
  devolvido?: number;
  cancelada?: string;
}

interface Recebimento {
  parcela: string;
  documento: number;
  juros: number;
  multa: number;
  desconto: number;
  banco: string;
  dtvcto: string;
  dtpago: string;
  baixa: string;
  dias: number;
}

const NfeForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [selectedNota, setSelectedNota] = useState<NotaFiscal | null>(null);
  const [notaItens, setNotaItens] = useState<NotaItem[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [dataIni, setDataIni] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoNota, setTipoNota] = useState<string>('');
  const [statusNfe, setStatusNfe] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [processingId, setProcessingId] = useState<string>('');
  const [statusSefaz, setStatusSefaz] = useState<string>('');

  const gridRef = useRef<any>(null);
  const itensGridRef = useRef<any>(null);
  const recebimentosGridRef = useRef<any>(null);

  // Carrega lista de notas
  const carregarNotas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dataIni) params.append('dataini', dataIni.replace(/-/g, ''));
      if (dataFim) params.append('datafim', dataFim.replace(/-/g, ''));
      if (tipoNota) params.append('tipo', tipoNota);
      if (statusNfe) params.append('status', statusNfe);

      const response = await fetch(`/api/nfe/lista?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar notas fiscais' });
    } finally {
      setLoading(false);
    }
  }, [dataIni, dataFim, tipoNota, statusNfe]);

  useEffect(() => {
    // Carrega notas iniciais (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    setDataFim(formatDate(hoje));
    setDataIni(formatDate(trintaDiasAtras));
  }, []);

  // Carrega notas quando as datas mudam
  useEffect(() => {
    if (dataIni && dataFim) {
      carregarNotas();
    }
  }, [dataIni, dataFim, carregarNotas]);

  // Carrega itens e recebimentos quando seleciona uma nota
  useEffect(() => {
    const carregarDetalhes = async () => {
      if (!selectedNota) {
        setNotaItens([]);
        setRecebimentos([]);
        return;
      }

      // Converte parâmetros para o formato esperado pelo backend
      // emissao deve ser YYYYMMDD (número), filial deve ser número
      const emissaoStr = String(selectedNota.emissao);
      let emissaoNum = parseInt(emissaoStr.replace(/-/g, ''), 10);
      let filialNum = parseInt(String(selectedNota.filial), 10);

      // Converte tipo: S=1 (saída), E=2 (entrada) ou mantém como número se já for
      let tipoNum = selectedNota.tipo;
      if (typeof tipoNum === 'string') {
        if (tipoNum === 'S') tipoNum = '1';
        else if (tipoNum === 'E') tipoNum = '2';
      }

      console.log('Carregando detalhes para nota:', selectedNota);
      console.log('Parâmetros: filial=', filialNum, 'emissao=', emissaoNum, 'tipo=', tipoNum, 'serie=', selectedNota.serie, 'numero=', selectedNota.numero);

      // Carrega itens
      try {
        const urlItens = `/api/nfe/itens?filial=${filialNum}&emissao=${emissaoNum}&tipo=${tipoNum}&serie=${encodeURIComponent(selectedNota.serie)}&numero=${selectedNota.numero}`;
        console.log('URL Itens:', urlItens);
        const responseItens = await fetch(urlItens);
        if (responseItens.ok) {
          const dataItens = await responseItens.json();
          console.log('Itens retornados:', dataItens);
          setNotaItens(dataItens);
        } else {
          console.error('Erro ao carregar itens - status:', responseItens.status);
          setNotaItens([]);
        }
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        setNotaItens([]);
      }

      // Carrega recebimentos
      try {
        const responseReceb = await fetch(
          `/api/nfe/recebimentos?numero=${selectedNota.numero}`
        );
        if (responseReceb.ok) {
          const dataReceb = await responseReceb.json();
          setRecebimentos(dataReceb);
        } else {
          setRecebimentos([]);
        }
      } catch (error) {
        console.error('Erro ao carregar recebimentos:', error);
        setRecebimentos([]);
      }
    };

    carregarDetalhes();
  }, [selectedNota]);

  const handleSelectNota = (nota: NotaFiscal) => {
    if (nota.isTotal) return;
    console.log('Nota selecionada:', nota);
    setSelectedNota(nota);
  };

  // Gera XML assinado da NF-e
  const handleGerarXml = async (nota: NotaFiscal) => {
    try {
      const emissaoNum = parseInt(String(nota.emissao).replace(/-/g, ''), 10);
      const filialNum = parseInt(String(nota.filial), 10);
      const response = await fetch(
        `/api/nfe/xml-assinado?filial=${filialNum}&emissao=${emissaoNum}&tipo=${nota.tipo}&serie=${nota.serie}&numero=${nota.numero}`
      );
      if (response.ok) {
        const xml = await response.text();
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nota.serie === 'U' ? 'NFSe' : 'NFe'}_${nota.numero}_assinada.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json().catch(() => ({ erro: 'Erro ao baixar XML assinado' }));
        setMessage({ type: 'error', text: errorData.erro || 'Erro ao baixar XML assinado' });
      }
    } catch (error) {
      console.error('Erro ao gerar XML assinado:', error);
      setMessage({ type: 'error', text: 'Erro ao gerar XML assinado' });
    }
  };

  // Gera DANFE
  const handleGerarDanfe = async (nota: NotaFiscal) => {
    try {
      const response = await fetch(
        `/api/nfe/danfe?filial=${nota.filial}&emissao=${nota.emissao}&tipo=${nota.tipo}&serie=${nota.serie}&numero=${nota.numero}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DANFE_${nota.numero}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao gerar DANFE:', error);
      setMessage({ type: 'error', text: 'Erro ao gerar DANFE' });
    }
  };

  // Autoriza NF-e
  const handleAutorizarNfe = async (nota: NotaFiscal) => {
    setProcessingId(`autorizar-${nota.numero}`);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/nfe/xml?filial=${nota.filial}&emissao=${nota.emissao}&tipo=${nota.tipo}&serie=${nota.serie}&numero=${nota.numero}`
      );
      if (response.ok) {
        setMessage({ type: 'success', text: 'XML gerado com sucesso!' });
        carregarNotas();
      }
    } catch (error) {
      console.error('Erro ao enviar NF-e:', error);
      setMessage({ type: 'error', text: 'Erro ao enviar NF-e' });
    } finally {
      setLoading(false);
      setProcessingId('');
    }
  };

  // Envia NF-e para SEFAZ
  const handleEnviarSefaz = async (nota: NotaFiscal) => {
    setProcessingId(`enviar-${nota.numero}`);
    setLoading(true);
    try {
      const emissaoNum = parseInt(String(nota.emissao).replace(/-/g, ''), 10);
      const filialNum = parseInt(String(nota.filial), 10);
      let tipoNum = nota.tipo;
      if (typeof tipoNum === 'string') {
        if (tipoNum === 'S') tipoNum = '1';
        else if (tipoNum === 'E') tipoNum = '2';
      }

      const response = await fetch(
        `/api/nfe/enviar-homologacao?filial=${filialNum}&emissao=${emissaoNum}&tipo=${tipoNum}&serie=${nota.serie}&numero=${nota.numero}`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (data.sucesso) {
        const statusMsg = `NF-e enviada para SEFAZ com sucesso!\nAmbiente: ${data.ambiente}\nProtocolo: ${data.protocolo || 'HOMOLOGACAO'}`;
        setMessage({ type: 'success', text: statusMsg });
        // Atualiza o status SEFAZ
        setStatusSefaz(prev => prev + `\n[${new Date().toLocaleString()}] ENVIO: NF-e ${nota.serie}/${nota.numero} - ${statusMsg}`);
      } else {
        setMessage({ type: 'error', text: `Erro ao enviar: ${data.erro}` });
        setStatusSefaz(prev => prev + `\n[${new Date().toLocaleString()}] ERRO ENVIO: NF-e ${nota.serie}/${nota.numero} - ${data.erro}`);
      }
    } catch (error) {
      console.error('Erro ao enviar NF-e para SEFAZ:', error);
      setMessage({ type: 'error', text: 'Erro ao enviar NF-e para SEFAZ' });
    } finally {
      setLoading(false);
      setProcessingId('');
    }
  };

  // Envia NFSe para Prefeitura (WebISS) - usado quando série = U
  const handleEnviarNfse = async (nota: NotaFiscal) => {
    setProcessingId(`enviar-${nota.numero}`);
    setLoading(true);
    try {
      const emissaoNum = parseInt(String(nota.emissao).replace(/-/g, ''), 10);
      const filialNum = parseInt(String(nota.filial), 10);
      let tipoNum = nota.tipo;
      if (typeof tipoNum === 'string') {
        if (tipoNum === 'S') tipoNum = '1';
        else if (tipoNum === 'E') tipoNum = '2';
      }

      const response = await fetch(
        `/api/nfse/gerar?filial=${filialNum}&emissao=${emissaoNum}&tipo=${tipoNum}&serie=${encodeURIComponent(nota.serie)}&numero=${nota.numero}`,
        { method: 'POST' }
      );
      const data = await response.json();

      if (data.sucesso) {
        let statusMsg = `NFSe enviada para Prefeitura com sucesso!`;
        if (data.protocolo) statusMsg += `\nProtocolo: ${data.protocolo}`;
        if (data.numeroLote) statusMsg += `\nLote: ${data.numeroLote}`;
        if (data.dataRecebimento) statusMsg += `\nRecebido em: ${data.dataRecebimento}`;
        if (data.mensagem) statusMsg += `\n${data.mensagem}`;
        setMessage({ type: 'success', text: statusMsg });
        setStatusSefaz(prev => prev + `\n[${new Date().toLocaleString()}] NFSe: ${nota.serie}/${nota.numero} - Enviada com sucesso. Protocolo: ${data.protocolo || 'N/A'}`);
      } else {
        let errorMsg = `Erro NFSe: ${data.erro || 'Erro desconhecido'}`;
        if (data.mensagens && Array.isArray(data.mensagens)) {
          const detalhes = data.mensagens
            .map((m: any) => `  [${m.codigo}] ${m.mensagem}${m.correcao ? ' - ' + m.correcao : ''}`)
            .join('\n');
          errorMsg += `\n${detalhes}`;
        }
        setMessage({ type: 'error', text: errorMsg });
        setStatusSefaz(prev => prev + `\n[${new Date().toLocaleString()}] ERRO NFSe: ${nota.serie}/${nota.numero} - ${data.erro || ''}`);
      }
    } catch (error) {
      console.error('Erro ao enviar NFSe:', error);
      setMessage({ type: 'error', text: 'Erro ao enviar NFSe para Prefeitura' });
    } finally {
      setLoading(false);
      setProcessingId('');
    }
  };

  // Consulta status na SEFAZ
  const handleVerificarStatus = async (nota: NotaFiscal) => {
    setProcessingId(`status-${nota.numero}`);
    setLoading(true);
    try {
      // Usa a chave se disponível, ou gera uma chave temporária
      const chave = nota.chave || '';
      const response = await fetch(`/api/nfe/consultar?chave=${chave}&ambiente=2`);
      const data = await response.text();

      let statusText = 'Status desconhecido';
      if (data.includes('<cStat>100</cStat>') || data.includes('<cStat>150</cStat>')) {
        statusText = 'Autorizada';
      } else if (data.includes('<cStat>101</cStat>')) {
        statusText = 'Cancelada';
      } else if (data.includes('<cStat>110</cStat>') || data.includes('<cStat>301</cStat>') || data.includes('<cStat>302</cStat>')) {
        statusText = 'Denegada';
      }

      setMessage({ type: 'success', text: `Status SEFAZ: ${statusText}` });
      setStatusSefaz(prev => prev + `\n[${new Date().toLocaleString()}] CONSULTA: NF-e ${nota.serie}/${nota.numero} - Status: ${statusText}`);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setMessage({ type: 'error', text: 'Erro ao consultar status na SEFAZ' });
    } finally {
      setLoading(false);
      setProcessingId('');
    }
  };

  const formatarData = (data: number | string | Date): string => {
    if (!data) return '';
    if (data instanceof Date) {
      return data.toLocaleDateString('pt-BR');
    }
    const dataStr = String(data);

    // Se já estiver no formato YYYY-MM-DD (ISO do banco)
    if (dataStr.includes('-')) {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }

    // Formato YYYYMMDD -> DD/MM/AAAA
    if (dataStr.length >= 8) {
      const dd = dataStr.substring(0, 2);
      const mm = dataStr.substring(2, 4);
      const yyyy = dataStr.substring(4, 8);
      // Verificar se não é data inválida como 00/00/0000
      if (dd !== '00' && mm !== '00' && yyyy !== '0000') {
        return `${dd}/${mm}/${yyyy}`;
      }
    }
    return dataStr;
  };

  const formatarDataInput = (data: string | Date): string => {
    if (!data) return '';
    if (data instanceof Date) {
      return data.toISOString().split('T')[0];
    }
    // Se for string no formato YYYYMMDD
    const dataStr = String(data);
    if (dataStr.length >= 8) {
      return `${dataStr.substring(0, 4)}-${dataStr.substring(4, 6)}-${dataStr.substring(6, 8)}`;
    }
    return data;
  };

  const formatarValor = (valor: number | undefined): string => {
    if (valor === undefined || valor === null) return '0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const formatarCNPJ = (doc: string | undefined, tipopessoa?: string): string => {
    if (!doc) return '';
    const digits = doc.replace(/\D/g, '');

    // Determina o tipo baseado no parâmetro ou na quantidade de dígitos
    const tipo = tipopessoa === 'F' ? 'CPF' : (tipopessoa === 'J' ? 'CNPJ' : (digits.length === 11 ? 'CPF' : 'CNPJ'));

    if (tipo === 'CPF') {
      // Formata como CPF: 999.999.999-99
      if (digits.length === 11) {
        return `${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}`;
      }
    } else {
      // Formata como CNPJ: 99.999.999/9999-99
      if (digits.length === 14) {
        return `${digits.substring(0, 2)}.${digits.substring(2, 5)}.${digits.substring(5, 8)}/${digits.substring(8, 12)}-${digits.substring(12)}`;
      }
    }
    return doc;
  };

  const getStatusLabel = (status: string | undefined, cancelada: string | undefined): string => {
    if (cancelada === 'C' || cancelada === 'c') {
      return 'CANCELADA';
    }
    if (!status || status === '0') return 'Pendente';
    switch (status) {
      case '1': return 'Autorizada';
      case '2': return 'Cancelada';
      case '3': return 'Denegada';
      default: return 'Não enviada';
    }
  };

  const getStatusClass = (status: string | undefined, cancelada: string | undefined): string => {
    if (cancelada === 'C' || cancelada === 'c') {
      return 'status-cancelada';
    }
    if (!status || status === '0') return 'status-pendente';
    switch (status) {
      case '1': return 'status-autorizada';
      case '2': return 'status-cancelada';
      case '3': return 'status-denegada';
      default: return 'status-pendente';
    }
  };

  const getTipoLabel = (tipo: string | undefined): string => {
    return tipo === 'S' ? 'Saída' : 'Entrada';
  };

  // Column definitions para notas fiscais
  const notasColumnDefs = useMemo(() => [
    {
      headerName: 'Data',
      field: 'emissao',
      width: 100,
      valueFormatter: (params: any) => formatarData(params.value),
      sortable: true,
      filter: true
    },
    {
      headerName: 'Tipo',
      field: 'tipo',
      width: 80,
      valueFormatter: (params: any) => getTipoLabel(params.value),
      sortable: true,
      filter: true
    },
    { headerName: 'Série', field: 'serie', width: 70, sortable: true, filter: true },
    { headerName: 'Número', field: 'numero', width: 100, sortable: true, filter: true },
    {
      headerName: 'CNPJ/CPF',
      field: 'documento',
      width: 150,
      valueFormatter: (params: any) => formatarCNPJ(params.value, params.data?.tipopessoa),
      sortable: true,
      filter: true
    },
    {
      headerName: 'Cliente',
      field: 'cliente',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true
    },
    {
      headerName: 'Valor',
      field: 'vlrtotal',
      width: 120,
      valueFormatter: (params: any) => formatarValor(params.value),
      sortable: true,
      filter: true,
      type: 'numericColumn'
    },
    {
      headerName: 'Status',
      field: 'cancelada',
      width: 120,
      cellRenderer: (params: any) => {
        const status = params.data?.status;
        const cancelada = params.data?.cancelada;
        return (
          <span className={`status-badge ${getStatusClass(status, cancelada)}`}>
            {getStatusLabel(status, cancelada)}
          </span>
        );
      },
      sortable: true,
      filter: true
    },
    {
      headerName: 'Ações',
      field: 'acoes',
      width: 280,
      cellRenderer: (params: any) => {
        const nota = params.data;
        if (!nota || nota.isTotal) return null;
        const isProcessing = processingId !== '';
        const isAutorizada = nota.status === '1';
        const isCancelada = nota.cancelada === 'C';

        return (
          <div className="acoes-cell">
            <button
              className="btn-action btn-xml"
              onClick={() => handleGerarXml(nota)}
              disabled={isProcessing}
              title="Gerar XML"
            >
              XML
            </button>
            <button
              className="btn-action btn-danfe"
              onClick={() => handleGerarDanfe(nota)}
              disabled={isProcessing}
              title="Gerar DANFE"
            >
              DANFE
            </button>
            {nota.serie === 'U' ? (
              <button
                className="btn-action btn-nfse"
                onClick={() => handleEnviarNfse(nota)}
                disabled={isProcessing || isAutorizada || isCancelada}
                title="Enviar NFSe para Prefeitura"
              >
                NFSe
              </button>
            ) : (
              <button
                className="btn-action btn-enviar"
                onClick={() => handleEnviarSefaz(nota)}
                disabled={isProcessing || isAutorizada || isCancelada}
                title="Enviar para SEFAZ"
              >
                SEFAZ
              </button>
            )}
            <button
              className="btn-action btn-status"
              onClick={() => handleVerificarStatus(nota)}
              disabled={isProcessing}
              title="Consultar Status"
            >
              STATUS
            </button>
          </div>
        );
      },
      sortable: false,
      filter: false
    }
  ], [processingId, statusSefaz]);

  // Column definitions para itens
  const itensColumnDefs = useMemo(() => [
    { headerName: 'Fab', field: 'fab', width: 80 },
    { headerName: 'Código', field: 'codigo', width: 100, sortable: true },
    { headerName: 'Seq', field: 'sequencia', width: 60 },
    { headerName: 'Descrição', field: 'descricao', flex: 1, minWidth: 200 },
    { headerName: 'NCM', field: 'ncm', width: 100 },
    { headerName: 'Qtd', field: 'quantidade', width: 80, type: 'numericColumn' },
    { headerName: 'Vlr Unit', field: 'vlrunitario', width: 100, valueFormatter: (p: any) => formatarValor(p.value), type: 'numericColumn' },
    { headerName: 'Total', field: 'vlrtotal', width: 120, valueFormatter: (p: any) => formatarValor(p.value), type: 'numericColumn' }
  ], []);

  // Column definitions para recebimentos
  const recebimentosColumnDefs = useMemo(() => [
    { headerName: ' Parc', field: 'parcela', width: 70 },
    {
      headerName: ' Vlr Doc',
      field: 'documento',
      width: 120,
      valueFormatter: (p: any) => formatarValor(p.value),
      type: 'numericColumn'
    },
    {
      headerName: ' Juros',
      field: 'juros',
      width: 100,
      valueFormatter: (p: any) => formatarValor(p.value),
      type: 'numericColumn'
    },
    {
      headerName: ' Multa',
      field: 'multa',
      width: 100,
      valueFormatter: (p: any) => formatarValor(p.value),
      type: 'numericColumn'
    },
    {
      headerName: ' Desc',
      field: 'desconto',
      width: 100,
      valueFormatter: (p: any) => formatarValor(p.value),
      type: 'numericColumn'
    },
    { headerName: 'Banco', field: 'banco', width: 80 },
    {
      headerName: ' Dt Vcto',
      field: 'dtvcto',
      width: 100,
      valueFormatter: (p: any) => formatarDataInput(p.value),
      cellClass: (params: any) => {
        const dias = params.data?.dias || 0;
        return dias > 0 ? 'text-danger' : '';
      }
    },
    {
      headerName: ' Dt Pago',
      field: 'dtpago',
      width: 100,
      valueFormatter: (p: any) => formatarDataInput(p.value)
    },
    { headerName: 'Baixa', field: 'baixa', width: 100 },
    {
      headerName: 'Dias',
      field: 'dias',
      width: 80,
      cellStyle: (params: any) => {
        const dias = params.value || 0;
        if (dias > 0) {
          return { color: 'red', fontWeight: 'bold' };
        }
        return null;
      },
      type: 'numericColumn'
    }
  ], []);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      vlrdesc: notas.filter(n => !n.isTotal).reduce((sum, n) => sum + (n.vlrdesc || 0), 0),
      vlrtotal: notas.filter(n => !n.isTotal).reduce((sum, n) => sum + n.vlrtotal, 0),
      vlriss: notas.filter(n => !n.isTotal).reduce((sum, n) => sum + (n.vlriss || 0), 0)
    };
  }, [notas]);

  // Totals para recebimentos
  const recebimentosTotals = useMemo(() => {
    return {
      documento: recebimentos.reduce((sum, r) => sum + (r.documento || 0), 0),
      juros: recebimentos.reduce((sum, r) => sum + (r.juros || 0), 0),
      multa: recebimentos.reduce((sum, r) => sum + (r.multa || 0), 0),
      desconto: recebimentos.reduce((sum, r) => sum + (r.desconto || 0), 0)
    };
  }, [recebimentos]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true
  }), []);

  const onNotasRowClicked = (event: any) => {
    if (event.data && !event.data.isTotal) {
      handleSelectNota(event.data);
    }
  };

  // Pinned bottom row para notas
  const pinnedBottomRowData = useMemo(() => [{
    emissao: '',
    tipo: 'TOTAL GERAL',
    serie: '',
    numero: '',
    documento: '',
    cliente: '',
    vlrtotal: totals.vlrtotal,
    vlrdesc: totals.vlrdesc,
    vlriss: totals.vlriss
  }], [totals]);

  // Pinned bottom row para recebimentos
  const pinnedBottomRowRecebimentos = useMemo(() => [{
    parcela: 'TOTAL',
    documento: recebimentosTotals.documento,
    juros: recebimentosTotals.juros,
    multa: recebimentosTotals.multa,
    desconto: recebimentosTotals.desconto,
    banco: '',
    dtvcto: '',
    dtpago: '',
    baixa: '',
    dias: ''
  }], [recebimentosTotals]);

  return (
    <div className="nfe-container">
      <div className="nfe-header">
        <h2>NF-e - Nota Fiscal Eletrônica</h2>
        <button className="btn-voltar" onClick={() => navigate(-1)}>Voltar</button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="nfe-filtros">
        <div className="filtro-group">
          <label>Data Inicial:</label>
          <input
            type="date"
            value={dataIni}
            onChange={(e) => setDataIni(e.target.value)}
          />
        </div>
        <div className="filtro-group">
          <label>Data Final:</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className="filtro-group">
          <label>Tipo:</label>
          <select value={tipoNota} onChange={(e) => setTipoNota(e.target.value)}>
            <option value="">Todos</option>
            <option value="S">Saída</option>
            <option value="E">Entrada</option>
          </select>
        </div>
        <div className="filtro-group">
          <label>Status NF-e:</label>
          <select value={statusNfe} onChange={(e) => setStatusNfe(e.target.value)}>
            <option value="">Todos</option>
            <option value="0">Pendente</option>
            <option value="1">Autorizada</option>
            <option value="2">Cancelada</option>
          </select>
        </div>
        <button className="btn-buscar" onClick={carregarNotas}>Buscar</button>
      </div>

      <div className="nfe-content">
        <div className="nfe-lista">
          <h3>Notas Fiscais</h3>
          {loading ? (
            <div className="loading">Carregando...</div>
          ) : (
            <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
              <AgGridReact
                ref={gridRef}
                rowData={notas}
                columnDefs={notasColumnDefs as any}
                defaultColDef={defaultColDef as any}
                pinnedBottomRowData={pinnedBottomRowData as any}
                onRowClicked={onNotasRowClicked}
                rowSelection="single"
                getRowClass={(params: any) => {
                  if (params.data?.isTotal) return 'total-row';
                  return params.data === selectedNota ? 'selected-row' : '';
                }}
                animateRows={true}
              />
            </div>
          )}

          {/* Status SEFAZ - abaixo do AG Grid de Notas Fiscais */}
          <div className="nfe-status-sefaz">
            <h3>Status SEFAZ - Monitor de Envio/Retorno</h3>
            <textarea
              readOnly
              value={statusSefaz}
              placeholder="O status do processo de envio/retorno da NF-e será exibido aqui..."
              className="status-sefaz-textarea"
            />
          </div>
        </div>

        {selectedNota && (
          <div className="nfe-detalhes">
            <h3>Itens da NF-e {selectedNota.serie}/{selectedNota.numero}</h3>
            <div className="ag-theme-alpine" style={{ height: 200, width: '100%' }}>
              <AgGridReact
                ref={itensGridRef}
                rowData={notaItens}
                columnDefs={itensColumnDefs as any}
                defaultColDef={defaultColDef as any}
                animateRows={true}
              />
            </div>

            <h3 style={{ marginTop: '20px' }}>Recebimentos Financeiros</h3>
            <div className="ag-theme-alpine" style={{ height: 200, width: '100%' }}>
              <AgGridReact
                ref={recebimentosGridRef}
                rowData={recebimentos}
                columnDefs={recebimentosColumnDefs as any}
                defaultColDef={defaultColDef as any}
                pinnedBottomRowData={pinnedBottomRowRecebimentos as any}
                animateRows={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal para exibir XML */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>XML da NF-e</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {xmlContent}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NfeForm;













