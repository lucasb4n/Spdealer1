import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFileExcel, faPrint, faFilter, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface TipoOption {
  id_tmo: string;
  descr_tmo: string;
}

interface ServicoRow {
  nro_os?: number | string;
  tipo?: string;
  data_ini?: string;
  data_fim?: string;
  documento?: string;
  nome?: string;
  modelo?: string;
  valor_ser?: number;
  valor_pec?: number;
  total?: number;
  valor_ser_filtrado?: number;
  total_filtrado?: number;
  descser_ser?: string;
}

interface DetailItem {
  servico?: string;
  data_ini?: string;
  data_fim?: string;
  tempo?: number;
  valor?: number;
}

export const ServicoPorTipo: React.FC = () => {
  const [tiposOptions, setTiposOptions] = useState<TipoOption[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [dataIni, setDataIni] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [rows, setRows] = useState<ServicoRow[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<Record<string, DetailItem[]>>({});

  useEffect(() => {
    const loadTipos = async () => {
      try {
        const resp = await fetch('/api/relatorios/servico/por-tipo/tipos');
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            setTiposOptions(data);
          }
        }
      } catch (e) {
        console.debug('Erro ao carregar tipos de TMO:', e);
      }
    };
    loadTipos();
  }, []);

  const loadDetails = async (nroOs: string | number) => {
    if (detailData[String(nroOs)]) {
      setDetailData(prev => {
        const next = { ...prev };
        delete next[String(nroOs)];
        return next;
      });
      return;
    }
    try {
      const resp = await fetch(`/api/relatorios/servico/por-tipo/${encodeURIComponent(String(nroOs))}/detalhe`);
      if (resp.ok) {
        const data = await resp.json();
        let items: DetailItem[] = Array.isArray(data) ? data : [];

        if (selectedTipos.length > 0 && Array.isArray(tiposOptions)) {
          const descrFilters: string[] = [];
          for (const tipoId of selectedTipos) {
            const tipo = tiposOptions.find(t => String(t.id_tmo) === String(tipoId));
            if (tipo?.descr_tmo) {
              descrFilters.push(tipo.descr_tmo.toLowerCase().trim());
            }
          }
          if (descrFilters.length > 0) {
            items = items.filter(item => {
              const servico = String(item.servico || '').toLowerCase().trim();
              return descrFilters.some(f => servico.includes(f));
            });
          }
        }

        setDetailData(prev => ({ ...prev, [String(nroOs)]: items }));
      } else {
        setDetailData(prev => ({ ...prev, [String(nroOs)]: [] }));
      }
    } catch {
      setDetailData(prev => ({ ...prev, [String(nroOs)]: [] }));
    }
  };

  const handleBuscar = async () => {
    setLoading(true);
    setSearched(true);
    setDetailData({});
    try {
      const params = new URLSearchParams();
      if (dataIni) params.append('dataini', dataIni);
      if (dataFim) params.append('datafim', dataFim);
      if (selectedTipos.length > 0) {
        params.append('tipos', selectedTipos.join(','));
      }

      const resp = await fetch(`/api/relatorios/servico/por-tipo?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        let resultRows: ServicoRow[] = Array.isArray(data) ? data : [];

        if (selectedTipos.length > 0 && Array.isArray(tiposOptions)) {
          const descrFilters: string[] = [];
          for (const tipoId of selectedTipos) {
            const tipo = tiposOptions.find(t => String(t.id_tmo) === String(tipoId));
            if (tipo?.descr_tmo) {
              descrFilters.push(tipo.descr_tmo.toLowerCase().trim());
            }
          }

          if (descrFilters.length > 0) {
            const detailPromises = resultRows.map(async (row) => {
              try {
                const detResp = await fetch(`/api/relatorios/servico/por-tipo/${encodeURIComponent(String(row.nro_os))}/detalhe`);
                if (detResp.ok) {
                  const detData = await detResp.json();
                  let items: DetailItem[] = Array.isArray(detData) ? detData : [];
                  items = items.filter(item => {
                    const servico = String(item.servico || '').toLowerCase().trim();
                    return descrFilters.some(f => servico.includes(f));
                  });
                  return items.map(item => ({
                    ...item,
                    modelo: row.modelo || 'N/A',
                    nro_os: row.nro_os,
                    cliente: row.nome || row.documento || 'N/A',
                  }));
                }
              } catch { /* ignore */ }
              return [];
            });
            const allDetails = await Promise.all(detailPromises);
            const flatDetails = allDetails.flat();
            if (flatDetails.length > 0) {
              setDetailData(prev => {
                const next = { ...prev };
                for (const row of resultRows) {
                  const key = String(row.nro_os);
                  next[key] = flatDetails.filter((d: any) => String(d.nro_os) === key);
                }
                return next;
              });
            }
          }
        }

        setRows(resultRows);
      } else {
        setRows([]);
      }
    } catch (e) {
      console.error('Erro ao consultar serviços por tipo:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTipoToggle = (id: string) => {
    setSelectedTipos(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const totalOS = rows.length;
  const totalServicos = rows.reduce((acc, r) => acc + Number(r.valor_ser || r.valor_ser_filtrado || 0), 0);
  const totalPecas = rows.reduce((acc, r) => acc + Number(r.valor_pec || 0), 0);
  const totalGeral = rows.reduce((acc, r) => acc + Number(r.total || r.total_filtrado || 0), 0);

  const formatCurrency = (val?: number) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const handleExportCSV = () => {
    if (!rows.length) return alert('Sem dados para exportar.');
    const headers = ['Nº OS', 'Data Emissão', 'Tipo', 'Cliente', 'Modelo', 'Valor Serviços', 'Valor Peças', 'Total'];
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => [
        r.nro_os || '',
        formatDate(r.data_ini),
        r.tipo || '',
        `"${(r.nome || r.documento || '').replace(/"/g, '""')}"`,
        `"${(r.modelo || '').replace(/"/g, '""')}"`,
        (r.valor_ser || 0).toString().replace('.', ','),
        (r.valor_pec || 0).toString().replace('.', ','),
        (r.total || 0).toString().replace('.', ',')
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Servico_Por_Tipo_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Serviços por Tipo</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>
            Relatório e consulta analítica de Ordens de Serviço filtradas por tipo de TMO
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleExportCSV}
            disabled={!rows.length}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              backgroundColor: rows.length ? '#16a34a' : '#94a3b8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: rows.length ? 'pointer' : 'not-allowed',
              fontWeight: 600
            }}
          >
            <FontAwesomeIcon icon={faFileExcel} /> Exportar CSV
          </button>
          <button
            onClick={() => window.print()}
            disabled={!rows.length}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              backgroundColor: '#475569',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: rows.length ? 'pointer' : 'not-allowed',
              fontWeight: 600
            }}
          >
            <FontAwesomeIcon icon={faPrint} /> Imprimir
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: 20,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
          <FontAwesomeIcon icon={faFilter} style={{ color: '#0284c7' }} />
          <h4 style={{ margin: 0, color: '#334155', fontSize: 16 }}>Filtros de Pesquisa</h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Data Inicial</label>
            <input
              type="date"
              value={dataIni}
              onChange={e => setDataIni(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Data Final</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Tipos de Serviço (TMO) {selectedTipos.length > 0 && `(${selectedTipos.length} selecionados)`}
            </label>
            <div style={{
              maxHeight: 120,
              overflowY: 'auto',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: 8,
              backgroundColor: '#ffffff',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 6
            }}>
              {tiposOptions.length > 0 ? (
                tiposOptions.map(t => (
                  <label key={t.id_tmo} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedTipos.includes(t.id_tmo)}
                      onChange={() => handleTipoToggle(t.id_tmo)}
                    />
                    <span>{t.descr_tmo || t.id_tmo}</span>
                  </label>
                ))
              ) : (
                <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Carregando tipos de TMO ou nenhum cadastrado...</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleBuscar}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'wait' : 'pointer'
            }}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
            Filtrar Serviços
          </button>
        </div>
      </div>

      {searched && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total de O.S.</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{totalOS}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Serviços</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0284c7', marginTop: 4 }}>{formatCurrency(totalServicos)}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Peças</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706', marginTop: 4 }}>{formatCurrency(totalPecas)}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Geral</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a', marginTop: 4 }}>{formatCurrency(totalGeral)}</div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>O.S.</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Data</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Tipo</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Cliente / Documento</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>Modelo</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Valor Serviços</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Valor Peças</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', textAlign: 'center' }}>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  <FontAwesomeIcon icon={faSpinner} spin size="lg" style={{ marginRight: 8 }} />
                  Consultando dados no servidor...
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((r, idx) => {
                const nroKey = String(r.nro_os);
                const details = detailData[nroKey];
                return (
                  <React.Fragment key={idx}>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0284c7' }}>{r.nro_os}</td>
                      <td style={{ padding: '12px 16px' }}>{formatDate(r.data_ini)}</td>
                      <td style={{ padding: '12px 16px' }}>{r.tipo || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>{r.nome || r.documento || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>{r.modelo || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(r.valor_ser || r.valor_ser_filtrado)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(r.valor_pec)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{formatCurrency(r.total || r.total_filtrado)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => loadDetails(r.nro_os!)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: details ? '#dc2626' : '#0284c7',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          {details ? 'Fechar' : 'Detalhe'}
                        </button>
                      </td>
                    </tr>
                    {details && details.length > 0 && (
                      <tr>
                        <td colSpan={9} style={{ background: '#f7f7f7', padding: 0 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#eef2f7' }}>
                                <th style={{ padding: '8px 16px', fontWeight: 600, color: '#475569', fontSize: 13, textAlign: 'left' }}>Serviço</th>
                                <th style={{ padding: '8px 16px', fontWeight: 600, color: '#475569', fontSize: 13, textAlign: 'left' }}>Data Ini</th>
                                <th style={{ padding: '8px 16px', fontWeight: 600, color: '#475569', fontSize: 13, textAlign: 'left' }}>Data Fim</th>
                                <th style={{ padding: '8px 16px', fontWeight: 600, color: '#475569', fontSize: 13, textAlign: 'right' }}>Tempo</th>
                                <th style={{ padding: '8px 16px', fontWeight: 600, color: '#475569', fontSize: 13, textAlign: 'right' }}>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {details.map((d, dIdx) => (
                                <tr key={dIdx} style={{ borderTop: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: '6px 16px', fontSize: 13 }}>{d.servico || '-'}</td>
                                  <td style={{ padding: '6px 16px', fontSize: 13 }}>{formatDate(d.data_ini)}</td>
                                  <td style={{ padding: '6px 16px', fontSize: 13 }}>{formatDate(d.data_fim)}</td>
                                  <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'right' }}>{Number(d.tempo || 0).toFixed(2)}</td>
                                  <td style={{ padding: '6px 16px', fontSize: 13, textAlign: 'right' }}>{formatCurrency(d.valor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  {searched
                    ? 'Nenhum registro encontrado para os filtros selecionados. Certifique-se de que existem registros na tabela de Ordens de Serviço / TMO no banco de dados.'
                    : 'Utilize o painel de filtros acima e clique em "Filtrar Serviços" para realizar a busca.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default ServicoPorTipo;
