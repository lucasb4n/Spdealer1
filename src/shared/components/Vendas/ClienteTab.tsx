import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { TIPO_CONTATO_OPTIONS } from './OrcamentoTypes';
import Localizar from 'components/Localizar';
import { ClientesService } from 'services/ClientesService';
import { API_BASE_URL } from 'services/apiConfig';
import './OrcamentoForm.css';

interface ClienteTabProps {
  control: any;
  setValue: any;
  watch: any;
  errors: any;
  onSelectOrcamento?: (num: number) => void,
  onClientChange?: () => void,
  activeTab?: string,
  readOnly?: boolean
}

const formatCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatCNPJ = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 14) v = v.substring(0, 14);
  return v
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

interface SearchResult {
  CODCLI: number;
  NOMECLI: string;
  CGCCPF: string;
  NOMEFAN: string;
  ENDERECO: string;
  CIDADE: string;
  BAIRRO: string;
  UF: string;
  FONE: string;
  RG_IE?: string;
  CEP?: string;
}

interface ClienteRow {
  codigo_cli: number;
  nome_cli: string;
  cpf_cnpj_cli: string;
  nomefan_cli?: string;
  logra_cli?: string;
  bairro_cli?: string;
  cidade_cli?: string;
  uf_cli?: string;
  cep_cli?: string;
  inscest_cli?: string;
  fone_cli?: string;
  celular_cli?: string;
}

const mockHistorico = [
  { numero: '001245', tipo: 'Orçamento', data: '10/04/2026', vendedor: 'PAULO', valor: 1250.50 },
  { numero: '001230', tipo: 'Pedido', data: '05/04/2026', vendedor: 'PAULO', valor: 850.00 },
  { numero: '001210', tipo: 'Orçamento', data: '28/03/2026', vendedor: 'RICARDO', valor: 3400.00 },
];

export const ClienteTab: React.FC<ClienteTabProps> = ({
  control,
  setValue,
  watch,
  errors,
  onSelectOrcamento,
  onClientChange,
  activeTab,
  readOnly = false
}) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);

  // Estados para pesquisa de orçamento
  const [orcSearchTerm, setOrcSearchTerm] = useState('');
  const [orcStartDate, setOrcStartDate] = useState('');
  const [orcEndDate, setOrcEndDate] = useState('');
  const [showConfirmados, setShowConfirmados] = useState(false);
  const [orcSearchResults, setOrcSearchResults] = useState<any[]>([]);
  const [isSearchingOrc, setIsSearchingOrc] = useState(false);
  const [clienteListData, setClienteListData] = useState<ClienteRow[]>([]);
  const [historicoData, setHistoricoData] = useState<any[]>([]);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);
  const [lastFetchedCgccpf, setLastFetchedCgccpf] = useState<string | null>(null);
  const [financeiro, setFinanceiro] = useState({ limite: 0, disponivel: 0 });
  const [showOnlyConfirmed, setShowOnlyConfirmed] = useState(false);
  const [frotaOptions, setFrotaOptions] = useState<{ value: string; label: string }[]>([]);
  const [condicoesPagamento, setCondicoesPagamento] = useState<{ codigo: string; descricao: string }[]>([]);

  // Carrega condições de pagamento
  useEffect(() => {
    fetch(`${API_BASE_URL}/condicoes-pagamento`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCondicoesPagamento(data.map(cp => ({
            // Pega apenas os 2 últimos dígitos (ex: 099 -> 99, 001 -> 01) para bater com a orcamp
            codigo: String(cp.codigo || '').slice(-2),
            descricao: cp.descricao
          })));
        }
      })
      .catch(err => console.error('Erro ao carregar condições de pagamento:', err));
  }, []);

  const fetchFrota = useCallback(async (cgccpf: string) => {
    if (!cgccpf) {
      setFrotaOptions([]);
      return;
    }
    try {
      const cleanCgccpf = cgccpf.replace(/\D/g, '');
      const url = `${API_BASE_URL}/clientes/frota?cgccpf=${encodeURIComponent(cleanCgccpf)}`;
      console.log(`[ClienteTab] Chamando API Frota: ${url}`);
      const response = await fetch(url);
      console.log(`[ClienteTab] Resposta API Frota status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[ClienteTab] Dados frota recebidos (JSON):`, data);
        const options = data.map((f: any) => ({
          value: f.fro_modelo,
          label: `${f.fro_modelo} - ${f.fro_chassi}`
        }));
        console.log(`[ClienteTab] Opções de frota geradas:`, options.length);
        setFrotaOptions(options);
      }
    } catch (error) {
      console.error('[ClienteTab] Erro ao buscar frota:', error);
    }
  }, []);

  const fetchFinanceiro = useCallback(async (codigoCli: number) => {
    if (!codigoCli) return;
    try {
      console.log(`[ClienteTab] Buscando financeiro para CODCLI=${codigoCli}...`);
      const url = `${API_BASE_URL}/clientes/${codigoCli}/limite-disponivel`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log(`[ClienteTab] Dados financeiros recebidos:`, data);
        setFinanceiro({
          limite: data.limite_credito || 0,
          disponivel: data.limite_disponivel || 0
        });
      }
    } catch (error) {
      console.error('[ClienteTab] Erro ao buscar dados financeiros:', error);
    }
  }, []);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const historyColDefs: ColDef[] = [
    { field: 'numero', headerName: 'Nº Atend.', width: 100, sortable: true },
    { field: 'tipo', headerName: 'Tipo', width: 120, sortable: true },
    { field: 'data', headerName: 'Data', width: 110, sortable: true },
    { field: 'vendedor', headerName: 'Vendedor', flex: 1, minWidth: 150, sortable: true },
    {
      field: 'valor',
      headerName: 'Valor Total',
      width: 140,
      sortable: true,
      valueFormatter: (params) => params.value ? params.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      cellStyle: { textAlign: 'right', fontWeight: 'bold', color: '#1e293b' },
    },
  ];

  const clienteColumns = [
    { field: 'codigo_cli', headerName: 'Código', width: 100 },
    { field: 'nome_cli', headerName: 'Nome / Razão Social', flex: 1, minWidth: 250 },
    { field: 'cpf_cnpj_cli', headerName: 'CPF/CNPJ', width: 180 },
    { field: 'cidade_cli', headerName: 'Cidade', width: 160 },
    { field: 'uf_cli', headerName: 'UF', width: 70 },
  ];

  const handleSearchOrcamento = useCallback(async () => {
    setIsSearchingOrc(true);
    try {
      const params = new URLSearchParams({
        search: orcSearchTerm,
        startDate: orcStartDate,
        endDate: orcEndDate,
        tipo: showConfirmados ? 'C' : '', // 'C' para confirmados, vazio para trazer outros (o backend deve tratar o padrão)
        size: '100'
      });
      // Se não for confirmado, o backend por padrão traz o que não é 'C'? 
      // Vamos ajustar o backend para ser explícito se necessário.
      const response = await fetch(`${API_BASE_URL}/v1/orcamentos?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.data.map((o: any) => ({
          numero: o.NUMERO_ORP,
          cliente: o.NOME_ORP || o.NOME_CLI,
          disp: o.DISPONIVEL || 0,
          tipo: o.TIPO_ORP === 'O' ? 'Orçamento' : o.TIPO_ORP === 'P' ? 'Pedido' : 'Confirmado',
          valor: o.VLR_TOTAL_ORP
        }));
        setOrcSearchResults(mapped);
      }
    } catch (error) {
      console.error('Erro ao pesquisar orçamentos:', error);
    } finally {
      setIsSearchingOrc(false);
    }
  }, [orcSearchTerm, orcStartDate, orcEndDate, showConfirmados]);

  const orcColDefs: ColDef[] = [
    { field: 'numero', headerName: 'Número', width: 100, sortable: true },
    { field: 'cliente', headerName: 'Nome', width: 250, sortable: true, flex: 1 },
    { field: 'disp', headerName: 'Disp.', width: 120, valueFormatter: (p: any) => p.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), cellStyle: { fontWeight: 'bold' } },
    { field: 'tipo', headerName: 'Tipo', width: 120, sortable: true },
    { field: 'valor', headerName: 'Valor', width: 120, valueFormatter: (p: any) => p.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), cellStyle: { fontWeight: 'bold' } },
  ];

  const fetchHistorico = useCallback(async (cgccpf: string) => {
    if (!cgccpf) {
      setHistoricoData([]);
      return;
    }

    const cleanCgccpf = cgccpf.replace(/\D/g, '');
    console.log(`[ClienteTab] fetchHistorico INICIADO: cgccpf="${cgccpf}" clean="${cleanCgccpf}"`);
    setIsLoadingHistorico(true);

    try {
      const url = `${API_BASE_URL}/v1/orcamentos/historico?cgccpf=${encodeURIComponent(cleanCgccpf)}`;
      console.log(`[ClienteTab] Chamando URL: ${url}`);

      const response = await fetch(url);
      console.log(`[ClienteTab] Resposta recebida. Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`[ClienteTab] Falha na resposta da API: ${response.status}`);
        setHistoricoData([]);
        return;
      }

      const result = await response.json();
      console.log(`[ClienteTab] JSON recebido:`, result);

      if (result.success) {
        console.log(`[ClienteTab] Sucesso! Populando grid com ${result.data?.length || 0} registros`);
        setHistoricoData(result.data || []);
        
        // ⭐ Popula a condição de pagamento baseada no último orçamento (orcamp)
        if (result.data && result.data.length > 0 && result.data[0].condpag !== undefined) {
          const formattedCond = String(result.data[0].condpag || '').padStart(2, '0');
          console.log(`[ClienteTab] Populando Condição Pag. do último orçamento: ${formattedCond}`);
          setValue('CONDPAG_ORP', formattedCond);
        }
      } else {
        console.warn(`[ClienteTab] API retornou erro no JSON:`, result.error);
        setHistoricoData([]);
      }
    } catch (error) {
      console.error('[ClienteTab] Erro catastrófico ao buscar histórico:', error);
      setHistoricoData([]);
    } finally {
      setIsLoadingHistorico(false);
      setLastFetchedCgccpf(cgccpf);
    }
  }, []);

  // Monitorar mudança de cliente para buscar financeiro
  useEffect(() => {
    const codCli = watch('CODCLI_ORP');
    if (codCli && codCli > 0) {
      fetchFinanceiro(Number(codCli));
    } else {
      setFinanceiro({ limite: 0, disponivel: 0 });
    }
  }, [watch('CODCLI_ORP'), fetchFinanceiro]);

  // Monitorar CPF/CNPJ para buscar histórico e frota
  useEffect(() => {
    const cgccpf = watch('CGCCPF_CLI');
    if (cgccpf && cgccpf !== lastFetchedCgccpf && !isLoadingHistorico) {
      fetchHistorico(cgccpf);
      fetchFrota(cgccpf);
    }
  }, [watch('CGCCPF_CLI'), lastFetchedCgccpf, isLoadingHistorico, fetchHistorico, fetchFrota]);

  const filteredHistoricoData = useMemo(() => {
    if (showOnlyConfirmed) return historicoData;
    return historicoData.filter(h => h.tipo !== 'Confirmado');
  }, [historicoData, showOnlyConfirmed]);

  const historicoTotal = useMemo(() => {
    return filteredHistoricoData.reduce((sum, h) => sum + (h.valor || 0), 0);
  }, [filteredHistoricoData]);

  const handleSearch = useCallback((term: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (term.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`${API_BASE_URL}/clientes/lookup?term=${encodeURIComponent(term)}`);
        const data = await response.json();
        setSearchResults(data.slice(0, 8));
        setShowDropdown(data.length > 0);
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  }, []);

  const handleSelectCliente = (cliente: SearchResult) => {
    const rawCgccpf = String(cliente.CGCCPF || '').replace(/\D/g, "");
    
    // Identifica o tipo baseado no tamanho do documento
    const tipo = rawCgccpf.length <= 11 ? 'F' : 'J';
    setValue('TIPOCLI_ORP', tipo);

    setValue('CODCLI_ORP', cliente.CODCLI || '');
    setValue('NUMERO_ORP', ''); // Limpa o código do orçamento ao trocar o cliente
    setValue('CGCCPF_CLI', rawCgccpf);
    setValue('NOME_CLI', cliente.NOMECLI || '');
    setValue('LOGRA_ORP', cliente.ENDERECO || '');
    setValue('BAIRRO_ORP', cliente.BAIRRO || '');
    setValue('CIDADE_ORP', cliente.CIDADE || '');
    setValue('UF_ORP', cliente.UF || '');
    setValue('FONE_ORP', cliente.FONE || '');
    setValue('RG_IE_ORP', cliente.RG_IE || '');
    setValue('CEP_ORP', cliente.CEP || '');
    setShowDropdown(false);
    
    // Notifica que o cliente mudou para limpar itens/orçamento
    if (onClientChange) onClientChange();
  };

  const openClienteModal = useCallback(() => {
    console.log('[ClienteTab] Abrindo modal de clientes (F4)...');
    ClientesService.getClientes()
      .then(data => {
        console.log('[ClienteTab] Clientes recebidos:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('[ClienteTab] Chaves disponíveis: ' + Object.keys(data[0]).join(', '));
          console.log('[ClienteTab] Conteúdo do primeiro registro:', JSON.stringify(data[0]));
        }
        if (Array.isArray(data)) {
          setClienteListData(data);
        } else {
          setClienteListData([]);
        }
      })
      .catch(err => {
        console.error('[ClienteTab] Erro ao carregar clientes via service:', err);
        // Fallback para fetch direto caso o service falhe por algum motivo de tipo
        fetch(`${API_BASE_URL}/clientes`)
          .then(r => r.json())
          .then(data => {
            const list = Array.isArray(data) ? data : (data.data || []);
            console.log('[ClienteTab] Fallback - Clientes recebidos:', list.length);
            if (list.length > 0) {
              console.log('[ClienteTab] Fallback - Exemplo:', list[0]);
              console.log('[ClienteTab] Fallback - Chaves:', Object.keys(list[0]));
            }
            setClienteListData(list);
          })
          .catch(() => setClienteListData([]));
      });
    setShowClienteModal(true);
  }, []);

  const handleClienteSelect = useCallback((r: any) => {
    if (!r) return;
    console.log('[ClienteTab] Processando seleção de cliente:', r);

    ClientesService.getClienteById(Number(r.codigo_cli))
      .then(fullData => {
        console.log('[ClienteTab] Dados detalhados recebidos:', fullData);
        const cgccpf = String(fullData.cpf_cnpj_cli || fullData.cgccpf_cli || '').replace(/\D/g, "");
        
        // Identifica o tipo baseado no tamanho do documento
        const tipo = cgccpf.length <= 11 ? 'F' : 'J';
        setValue('TIPOCLI_ORP', tipo);

        setValue('CODCLI_ORP', fullData.codigo_cli || '');
        setValue('NUMERO_ORP', ''); // Limpa o código do orçamento ao trocar o cliente
        setValue('CGCCPF_CLI', cgccpf);
        setValue('NOME_CLI', fullData.nome_cli || '');
        setValue('LOGRA_ORP', fullData.logra_cli || '');
        setValue('BAIRRO_ORP', fullData.bairro_cli || '');
        setValue('CIDADE_ORP', fullData.cidade_cli || '');
        setValue('UF_ORP', fullData.uf_cli || '');
        setValue('CEP_ORP', fullData.cep_cli || '');
        setValue('RG_IE_ORP', fullData.inscest_cli || '');
        setValue('FONE_ORP', fullData.fone_cli || fullData.celular_cli || '');
        setValue('CONTATO_ORP', fullData.contato_cli || '');
        setValue('TIPOCONTATO_ORP', 'Telefone');
        setShowClienteModal(false);

        // Notifica que o cliente mudou para limpar itens/orçamento
        if (onClientChange) onClientChange();
      })
      .catch(err => {
        console.error('[ClienteTab] Erro ao buscar dados detalhados:', err);
        setValue('CODCLI_ORP', r.codigo_cli || '');
        setValue('CGCCPF_CLI', r.cpf_cnpj_cli || '');
        setValue('NOME_CLI', r.nome_cli || '');
        setShowClienteModal(false);
      });
  }, [setValue, fetchHistorico]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        openClienteModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openClienteModal]);

  // Monitorar mudança de CPF/CNPJ (ex: via setValue manual no OrcamentoPage)
  useEffect(() => {
    const cgccpf = watch('CGCCPF_CLI');
    if (cgccpf && cgccpf !== lastFetchedCgccpf && !isLoadingHistorico) {
      console.log(`[ClienteTab] Triggering history fetch for ${cgccpf} due to watch change`);
      fetchHistorico(cgccpf);
      fetchFrota(cgccpf);
    }
  }, [watch('CGCCPF_CLI'), lastFetchedCgccpf, isLoadingHistorico, fetchHistorico, fetchFrota]);

  return (
    <div className="orcamento-fade-in">
      {showClienteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 900, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Pesquisar Cliente</h3>
              <button onClick={() => setShowClienteModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Localizar
                title=""
                columns={clienteColumns}
                data={clienteListData}
                paginationPageSize={50}
                editable={false}
                onRowSelected={(rows) => {
                  if (rows && rows.length > 0) handleClienteSelect(rows[0]);
                }}
                onRowDoubleClicked={(row) => {
                  handleClienteSelect(row);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dados do Cliente */}
      <div className="orcamento-panel">
        <div className="orcamento-panel__header">
          <h2>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Dados do Cliente
          </h2>
          <button
            onClick={openClienteModal}
            disabled={readOnly}
            style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', background: readOnly ? '#f1f5f9' : '#fef3c7', color: readOnly ? '#94a3b8' : '#b45309', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', border: 'none', cursor: readOnly ? 'default' : 'pointer' }}>
            F4: Pesquisa
          </button>
        </div>

        <div className="orcamento-panel__body">
          <div className="orcamento-field-grid">
            {/* Linha 1 */}
            <div className="orcamento-field orcamento-field--2">
              <label className="orcamento-field__label">Código</label>
              <Controller
                name="NUMERO_ORP"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    readOnly={readOnly || (field.value && field.value !== '0' && field.value !== 0)}
                    className={`orcamento-field__input orcamento-field__input--highlight ${(readOnly || (field.value && field.value !== '0' && field.value !== 0)) ? 'orcamento-field__input--readonly' : ''}`}
                    onKeyDown={(e) => {
                      if (readOnly) return;
                      if (e.key === 'F4') {
                        e.preventDefault();
                        setShowOrcamentoModal(true);
                      }
                    }}
                  />
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--2">
              <label className="orcamento-field__label">Cód. Cliente</label>
              <Controller
                name="CODCLI_ORP"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    readOnly={readOnly || !!field.value}
                    className={`orcamento-field__input orcamento-field__input--highlight ${(readOnly || !!field.value) ? 'orcamento-field__input--readonly' : ''}`}
                  />
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--1">
              <label className="orcamento-field__label">Tipo Cliente</label>
              <Controller
                name="TIPOCLI_ORP"
                control={control}
                render={({ field }) => (
                  <select 
                    {...field} 
                    value={field.value || 'F'} 
                    disabled={readOnly} 
                    className={`orcamento-field__select ${readOnly ? 'orcamento-field__input--readonly' : ''}`}
                  >
                    <option value="F">Física</option>
                    <option value="J">Jurídica</option>
                  </select>
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--2 orcamento-relative">
              <label className="orcamento-field__label">CPF/CNPJ</label>
              <Controller
                name="CGCCPF_CLI"
                control={control}
                render={({ field }) => {
                  const tipoCli = watch('TIPOCLI_ORP');
                  const displayValue = tipoCli === 'J' ? formatCNPJ(field.value || '') : formatCPF(field.value || '');
                  
                  return (
                    <input
                      {...field}
                      value={displayValue}
                      readOnly={readOnly || (field.value && field.value !== '')}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        field.onChange(rawValue);
                        handleSearch(rawValue);
                      }}
                      className={`orcamento-field__input orcamento-field__input--highlight ${(readOnly || (field.value && field.value !== '')) ? 'orcamento-field__input--readonly' : ''}`}
                    />
                  );
                }}
              />
              {isSearching && (
                <div style={{ position: 'absolute', right: '0.5rem', top: '1.5rem' }}>
                  <div className="w-3 h-3 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                </div>
              )}
              {showDropdown && searchResults.length > 0 && !readOnly && (
                <div className="orcamento-dropdown">
                  {searchResults.map((cli) => (
                    <button
                      key={cli.CODCLI}
                      type="button"
                      onClick={() => handleSelectCliente(cli)}
                      className="orcamento-dropdown__item"
                    >
                      <span className="orcamento-dropdown__item-title">{cli.NOMECLI}</span>
                      <span className="orcamento-dropdown__item-subtitle">{cli.CGCCPF} • {cli.CIDADE}/{cli.UF}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="orcamento-field orcamento-field--3">
              <label className="orcamento-field__label">Insc. Est./RG</label>
              <Controller
                name="RG_IE_ORP"
                control={control}
                render={({ field }) => (
                  <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} />
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--2">
              <label className="orcamento-field__label">Telefone/Celular</label>
              <Controller
                name="FONE_ORP"
                control={control}
                render={({ field }) => (
                  <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} placeholder="(00) 00000-0000" />
                )}
              />
            </div>

            {/* Linha 2 */}
            <div className="orcamento-field orcamento-field--12">
              <label className="orcamento-field__label">Nome / Razão Social</label>
              <Controller
                name="NOME_CLI"
                control={control}
                render={({ field }) => (
                  <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} />
                )}
              />
            </div>

            {/* Linha 3 */}
            <div className="orcamento-field orcamento-field--5">
              <label className="orcamento-field__label">Endereço</label>
              <Controller
                name="LOGRA_ORP"
                control={control}
                render={({ field }) => (
                  <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} />
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--3">
              <label className="orcamento-field__label">Bairro</label>
              <Controller
                name="BAIRRO_ORP"
                control={control}
                render={({ field }) => (
                  <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} />
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--2">
              <label className="orcamento-field__label">CEP</label>
              <Controller
                name="CEP_ORP"
                control={control}
                render={({ field }) => (
                  <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} />
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--2">
              <label className="orcamento-field__label">Cidade / UF</label>
              <div className="orcamento-field-group">
                <Controller
                  name="CIDADE_ORP"
                  control={control}
                  render={({ field }) => (
                    <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} />
                  )}
                />
                <Controller
                  name="UF_ORP"
                  control={control}
                  render={({ field }) => (
                    <input {...field} readOnly={readOnly} maxLength={2} className={`orcamento-field__input orcamento-field__input--fixed ${readOnly ? 'orcamento-field__input--readonly' : ''}`} style={{ textTransform: 'uppercase', textAlign: 'center' }} />
                  )}
                />
              </div>
            </div>

            {/* Linha 4 */}
            <div className="orcamento-field orcamento-field--3">
              <label className="orcamento-field__label">Contato</label>
              <Controller
                name="CONTATO_ORP"
                control={control}
                render={({ field }) => (
                  <input {...field} readOnly={readOnly} className={`orcamento-field__input ${readOnly ? 'orcamento-field__input--readonly' : ''}`} placeholder="Nome do contato" />
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--2">
              <label className="orcamento-field__label">Tipo Contato</label>
              <Controller
                name="TIPOCONTATO_ORP"
                control={control}
                render={({ field }) => (
                  <select 
                    {...field} 
                    value={field.value || ''} 
                    disabled={readOnly} 
                    className={`orcamento-field__select ${readOnly ? 'orcamento-field__input--readonly' : ''}`}
                  >
                    <option value="">Selecione...</option>
                    {TIPO_CONTATO_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--4">
              <label className="orcamento-field__label" style={{ background: '#fef3c7', color: '#b45309', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', display: 'inline-block' }}>
                Modelo / Chassi (Veículo)
              </label>
              <Controller
                name="MODELO_ORP"
                control={control}
                render={({ field }) => (
                  <select 
                    {...field} 
                    value={field.value || ''} 
                    disabled={readOnly} 
                    className={`orcamento-field__input orcamento-field__input--highlight ${readOnly ? 'orcamento-field__input--readonly' : ''}`}
                  >
                    <option value="">Selecione um veículo...</option>
                    {frotaOptions.map((opt, idx) => (
                      <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                    ))}
                    {!frotaOptions.length && field.value && (
                      <option key="custom-val" value={field.value}>{field.value}</option>
                    )}
                  </select>
                )}
              />
            </div>

            <div className="orcamento-field orcamento-field--3">
              <label className="orcamento-field__label">Condição Pag.</label>
              <Controller
                name="CONDPAG_ORP"
                control={control}
                render={({ field }) => (
                  <select {...field} disabled={readOnly} className={`orcamento-field__select ${readOnly ? 'orcamento-field__input--readonly' : ''}`}>
                    <option value="">Selecione...</option>
                    {condicoesPagamento.map(cp => (
                      <option key={cp.codigo} value={cp.codigo}>{cp.descricao}</option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="orcamento-panel" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
        <div className="orcamento-panel__header">
          <h2>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Histórico / Últimos Atendimentos
          </h2>
          <div className="orcamento-flex orcamento-gap-3 orcamento-items-center">
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Limite: <strong style={{ color: '#16a34a' }}>{financeiro.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </span>
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Disp.: <strong style={{ color: '#2563eb' }}>{financeiro.disponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid #e2e8f0' }}>
              <label className="orcamento-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', color: showOnlyConfirmed ? '#2563eb' : '#64748b' }}>
                  Exibir Confirmados
                </span>
                <div style={{ position: 'relative', width: '1.75rem', height: '1rem', background: showOnlyConfirmed ? '#2563eb' : '#cbd5e1', borderRadius: '1rem', transition: 'all 0.2s' }}>
                  <input
                    type="checkbox"
                    checked={showOnlyConfirmed}
                    onChange={(e) => setShowOnlyConfirmed(e.target.checked)}
                    style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', zIndex: 1 }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: showOnlyConfirmed ? '0.875rem' : '0.125rem',
                    top: '0.125rem',
                    width: '0.75rem',
                    height: '0.75rem',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'all 0.2s shadow'
                  }} />
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="orcamento-grid ag-theme-alpine" style={{ flex: 1, minHeight: '140px', position: 'relative' }}>
          {isLoadingHistorico && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="orcamento-spinner" />
            </div>
          )}
          <AgGridReact
            theme="legacy"
            rowData={filteredHistoricoData}
            columnDefs={historyColDefs}
            defaultColDef={{ resizable: true, sortable: true }}
            domLayout="autoHeight"
            overlayNoRowsTemplate="<span class='ag-overlay-loading-center'>Nenhum atendimento encontrado</span>"
            onRowDoubleClicked={(e) => {
              if (onSelectOrcamento && e.data?.numero) {
                onSelectOrcamento(e.data.numero);
              }
            }}
            pagination={true}
            paginationPageSize={14}
            paginationPageSizeSelector={[14, 30, 50, 100]}
            pinnedBottomRowData={[
              { numero: '', tipo: '', data: '', vendedor: 'TOTAL', valor: historicoTotal }
            ]}
          />
        </div>
      </div>
      {/* Modal Pesquisa de Orçamentos (F4) */}
      {showOrcamentoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '95vw', maxWidth: 950, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Pesquisar Orçamentos / Pedidos</h3>
              <button onClick={() => setShowOrcamentoModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ padding: '1.25rem', flex: 1, overflowY: 'auto' }}>
              {/* Filtros */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="orcamento-field">
                  <label className="orcamento-field__label">Cliente / Nome</label>
                  <input
                    type="text"
                    className="orcamento-field__input"
                    value={orcSearchTerm}
                    onChange={(e) => setOrcSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrcamento()}
                    placeholder="Busca por nome..."
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', marginBottom: '1.25rem', alignItems: 'end' }}>
                <div className="orcamento-field">
                  <label className="orcamento-field__label">Data Inicial</label>
                  <input type="date" className="orcamento-field__input" value={orcStartDate} onChange={(e) => setOrcStartDate(e.target.value)} />
                </div>
                <div className="orcamento-field">
                  <label className="orcamento-field__label">Data Final</label>
                  <input type="date" className="orcamento-field__input" value={orcEndDate} onChange={(e) => setOrcEndDate(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                  <label className="orcamento-toggle" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={showConfirmados}
                      onChange={(e) => setShowConfirmados(e.target.checked)}
                    />
                    <span className="orcamento-toggle__slider"></span>
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Confirmados</span>
                </div>
                <button
                  className="orcamento-btn orcamento-btn--primary"
                  onClick={handleSearchOrcamento}
                  disabled={isSearchingOrc}
                  style={{ height: '2.5rem', padding: '0 1.5rem' }}
                >
                  {isSearchingOrc ? '...' : 'Pesquisar (Enter)'}
                </button>
              </div>

              {/* Grid */}
              <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
                <AgGridReact
                  theme="legacy"
                  rowData={orcSearchResults}
                  columnDefs={orcColDefs}
                  pagination={true}
                  paginationPageSize={10}
                  paginationPageSizeSelector={[10, 20, 50, 100]}
                  onRowDoubleClicked={(e) => {
                    if (onSelectOrcamento) onSelectOrcamento(e.data.numero);
                    setShowOrcamentoModal(false);
                  }}
                  onCellKeyDown={(e) => {
                    const event = e.event as any;
                    if (event?.key === 'Enter') {
                      if (onSelectOrcamento) onSelectOrcamento(e.data.numero);
                      setShowOrcamentoModal(false);
                    }
                  }}
                  overlayNoRowsTemplate="Nenhum registro encontrado"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteTab;













