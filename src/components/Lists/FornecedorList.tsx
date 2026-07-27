import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Localizar from 'components/Localizar';
import { FornecedoresService } from 'services/FornecedoresService';
import { formatarDocumento, formatarTelefone } from 'utils/formatters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faLock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import './FornecedorList.css';

const FornecedorList: React.FC = () => {
  const navigate = useNavigate();
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [tipos, setTipos] = useState<Array<any>>([]);
  const [tipoMap, setTipoMap] = useState<Record<string, string>>({});
  const [selectedTipo, setSelectedTipo] = useState<string | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | ''>('');

  // Carregar fornecedores
  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
        try {
        // Carregar tipos primeiro (dropdown)
        const tiposRes = await FornecedoresService.getTiposFornecedores();
        setTipos(tiposRes || []);
        const map: Record<string, string> = {};
        tiposRes.forEach((t: any) => {
          // Aceitar chaves possíveis: tipo_for ou id
          const key = t.tipo_for !== undefined ? String(t.tipo_for) : String(t.id || t.tipoFor);
          map[key] = t.descr_for || t.descricao || t.label || '';
        });
        setTipoMap(map);

        const res = await FornecedoresService.getFornecedores({ tipofor: selectedTipo || undefined, status: selectedStatus || undefined });
        setDados(res);
        // Fallback: usar o tamanho da lista retornada enquanto o endpoint /total estiver com problema
        setTotal(res ? res.length : 0);
        try {
          const t = await FornecedoresService.getTotalFornecedores(undefined, selectedStatus || undefined);
          if (typeof t === 'number' && !isNaN(t)) setTotal(t);
        } catch (err) {
          console.debug('Não foi possível buscar total de fornecedores, usando fallback (lista).', err);
        }
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);


  // Recarregar lista quando o filtro de tipo mudar
  useEffect(() => {
    const fetchPorTipo = async () => {
      setLoading(true);
      try {
        console.log('Buscando fornecedores com tipofor=', selectedTipo || undefined, 'status=', selectedStatus || undefined);
        const res = await FornecedoresService.getFornecedores({ tipofor: selectedTipo || undefined, status: selectedStatus || undefined });
        console.log('Fornecedores recebidos:', (res || []).length);
        setDados(res);
        // Buscar total real via endpoint /count com filtro tipofor
        try {
          console.log('Buscando total com tipofor=', selectedTipo || undefined, 'status=', selectedStatus || undefined);
          const t = await FornecedoresService.getTotalFornecedores(selectedTipo || undefined, selectedStatus || undefined);
          console.log('Total recebido:', t);
          setTotal(t);
        } catch (err) {
          console.log('Falha ao obter total filtrado, usando fallback lista. Erro:', err);
          setTotal(res ? res.length : 0);
        }
      } catch (err) {
        console.error('Erro ao filtrar por tipo de fornecedor:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPorTipo();
  }, [selectedTipo, selectedStatus]);

  // Handlers (declared antes das colunas para usar em cellRenderer)
  const handleEditar = useCallback((registro: any) => {
    navigate(`/cadastros/fornecedores/${registro.codigo_for}/edit`);
  }, [navigate]);

  const handleToggleAtivo = useCallback(async (registro: any) => {
    if (!registro || !registro.codigo_for) return;
    const id = registro.codigo_for;
    const current = registro.status === 'active';
    const confirmMsg = current ? 'Deseja realmente inativar este fornecedor?' : 'Deseja realmente ativar este fornecedor?';
    if (!window.confirm(confirmMsg)) return;
    try {
      const ok = await FornecedoresService.toggleAtivo(Number(id), !current, 'F');
      if (ok) {
        // Recarregar lista e total
        setLoading(true);
        const res = await FornecedoresService.getFornecedores({ tipofor: selectedTipo || undefined, status: selectedStatus || undefined });
        setDados(res);
        try {
          const t = await FornecedoresService.getTotalFornecedores(selectedTipo || undefined, selectedStatus || undefined);
          setTotal(t);
        } catch (err) {
          setTotal(res ? res.length : 0);
        }
      } else {
        alert('Falha ao alternar status do fornecedor');
      }
    } catch (err) {
      console.error('Erro ao alternar status:', err);
      alert('Erro ao alternar status. Veja console para detalhes.');
    } finally {
      setLoading(false);
    }
  }, [selectedTipo, selectedStatus]);

  // Cell renderer component for ag-Grid (React framework component)
  const ActionCell: React.FC<any> = (props) => {
    const registro = props.data;
    // Debug: log render to verify ag-Grid is using this React cell renderer
    // eslint-disable-next-line no-console
    console.debug('ActionCell render for:', registro?.codigo_for);
    const isActive = registro?.status === 'active';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => handleEditar(registro)}
          title="Editar"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faPencil} style={{ fontSize: 18 }} />
          <span style={{ marginLeft: 6, fontSize: 12 }}>Editar</span>
        </button>
        <button
          onClick={() => handleToggleAtivo(registro)}
          title={isActive ? 'Inativar' : 'Ativar'}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >
          {isActive ? <FontAwesomeIcon icon={faLock} style={{ fontSize: 18, color: '#c62828' }} /> : <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: 18, color: '#16a34a' }} />}
          <span style={{ marginLeft: 6, fontSize: 12 }}>{isActive ? 'Inativar' : 'Ativar'}</span>
        </button>
      </div>
    );
  };

  // Colunas AG-Grid
  const columns = [
    { headerName: 'Código', field: 'codigo_for', width: 100, pinned: 'left' },
    {
      headerName: 'Documento',
      field: 'cgccpf_for',
      width: 150,
      valueFormatter: (params: any) => formatarDocumento(params.value, params.data?.tipopessoa_for)
    },
    { headerName: 'Nome/Razão Social', field: 'nome_for', flex: 1, minWidth: 250 },
    { headerName: 'UF', field: 'uf_for', width: 60 },
    {
      headerName: 'Tipo',
      field: 'tipofor_cli',
      width: 180,
      valueGetter: (params: any) => tipoMap[String(params.data?.tipofor_cli)] || params.data?.tipofor_cli || ''
    },
    { headerName: 'Inscrição Estadual', field: 'inscest_for', width: 140 },
    {
      headerName: 'Telefone',
      field: 'fone_for',
      width: 120,
      valueFormatter: (params: any) => formatarTelefone(params.value)
    },
    {
      headerName: 'Celular',
      field: 'celular_for',
      width: 120,
      valueFormatter: (params: any) => formatarTelefone(params.value)
    },
    { headerName: 'Ações', field: 'acoes', width: 160, pinned: 'right', cellRenderer: 'actionCell' }
  ];



  // Incluir novo fornecedor
  const handleIncluir = () => {
    navigate('/cadastros/fornecedores/novo');
  };

  return (
    <div className="fornecedor-list-container">
      <div className="fornecedor-list-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2>Fornecedores</h2>
          {/* filtro de tipo agora renderizado na mesma linha do campo de busca via prop 'searchControls' */}
          <div className="fornecedor-stats">
            <div className="stat-card">
              <div className="label">Total de Fornecedores</div>
              <div className="value">{total !== null ? total.toLocaleString('pt-BR') : '—'}</div>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={handleIncluir}>
          + Incluir Registro
        </button>
      </div>
      
      <div className="fornecedor-list-content">
        {loading ? (
          <div className="loading">Carregando fornecedores...</div>
        ) : (
          <Localizar
            columns={columns}
            data={dados}
            editable={false}
            components={{ actionCell: ActionCell }}
            // Passa o dropdown de tipos para renderizar na mesma linha do campo de busca
            searchControls={(
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ marginRight: 6 }}>Tipo:</label>
                <select value={selectedTipo} onChange={(e) => {
                  const v = e.target.value;
                  console.log('Filtro Tipo selecionado (UI):', v);
                  setSelectedTipo(v);
                }}>
                  <option value="">Todos</option>
                  {tipos.map((t: any) => {
                    const key = t.tipo_for !== undefined ? String(t.tipo_for) : String(t.id || t.tipoFor);
                    const label = t.descr_for || t.descricao || t.label || key;
                    return (
                      <option key={key} value={key}>{label}</option>
                    );
                  })}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                  <label style={{ marginRight: 6 }}>Status:</label>
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as 'active' | 'inactive' | '')}>
                    <option value="">Todos</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
            )}
            onRowSelected={(rows) => {
              if (rows && rows.length === 1) handleEditar(rows[0]);
            }}
            onCellClicked={(params) => {
              try {
                const evt = params.event;
                if (!evt || !evt.target) return;
                const action = evt.target.getAttribute && evt.target.getAttribute('data-action');
                const id = evt.target.getAttribute && evt.target.getAttribute('data-id');
                if (!action || !id) return;
                const registro = dados.find(d => String(d.codigo_for) === String(id));
                if (action === 'edit') handleEditar(registro);
                if (action === 'toggle') handleToggleAtivo(registro);
              } catch (e) {
                console.error('Erro no onCellClicked handler:', e);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FornecedorList;













