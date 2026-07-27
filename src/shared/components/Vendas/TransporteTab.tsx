import React, { useState, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import Localizar from 'components/Localizar';
import { ClientesService } from 'services/ClientesService';
import './OrcamentoForm.css';

interface TransporteTabProps {
  control: any;
  setValue: any;
  watch: any;
  errors: any;
  disabled?: boolean;
}

export const TransporteTab: React.FC<TransporteTabProps> = ({
  control,
  setValue,
  watch,
  disabled = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [transportadorasData, setTransportadorasData] = useState<any[]>([]);

  const openSearchModal = useCallback(async () => {
    try {
      const data = await ClientesService.getTransportadoras();
      setTransportadorasData(data);
      setShowModal(true);
    } catch (err) {
      console.error('Erro ao carregar transportadoras:', err);
      setTransportadorasData([]);
    }
  }, []);

  const handleSelect = useCallback((data: any) => {
    if (!data) return;
    
    // Busca os dados completos do cliente/transportadora para garantir que tem o endereço
    ClientesService.getClienteById(Number(data.codigo_cli))
      .then(fullData => {
        setValue('RAZAOFRET', fullData.nome_cli || '');
        // Garantir que a máscara/formatação do CNPJ seja mantida se já veio do grid, senão pega do fullData
        const cnpj = data.cpf_cnpj_cli || fullData.cpf_cnpj_cli || fullData.cgccpf_cli || '';
        setValue('CGCTRANS', cnpj);
        
        // Monta o endereço completo com Logradouro, Número e Bairro
        const endereco = [fullData.logra_cli, fullData.numero_cli].filter(Boolean).join(', ');
        const enderCompleto = [endereco, fullData.bairro_cli].filter(Boolean).join(' - ');
        
        setValue('ENDER', enderCompleto.trim());
        setValue('MUNICF', fullData.cidade_cli || '');
        setValue('UFTRANS', fullData.uf_cli || '');
        setValue('INSCEST_ORP', fullData.inscest_cli || '');
        setShowModal(false);
      })
      .catch(err => {
        console.error('Erro ao buscar dados completos da transportadora:', err);
        // Fallback para os dados básicos que vieram do grid
        setValue('RAZAOFRET', data.nome_cli || '');
        setValue('CGCTRANS', data.cpf_cnpj_cli || '');
        setValue('ENDER', `${data.logra_cli || ''} ${data.bairro_cli || ''}`.trim());
        setValue('MUNICF', data.cidade_cli || '');
        setValue('UFTRANS', data.uf_cli || '');
        setValue('INSCEST_ORP', data.inscest_cli || '');
        setShowModal(false);
      });
  }, [setValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F4') {
      e.preventDefault();
      openSearchModal();
    }
  };

  return (
    <div className="orcamento-fade-in">
      <div className="orcamento-layout orcamento-layout--2col">

        {/* LADO ESQUERDO: Transportadora e CT-e */}
        <div className="orcamento-flex orcamento-flex-col" style={{ gap: '0.75rem' }}>

          {/* Dados da Transportadora */}
          <div className="orcamento-panel">
            <div className="orcamento-panel__header">
              <h3>Dados da Transportadora</h3>
            </div>
            <div className="orcamento-panel__body">
              <div className="orcamento-field-grid">
                <div className="orcamento-field orcamento-field--8">
                  <label className="orcamento-field__label">Razão Social</label>
                  <Controller
                    name="RAZAOFRET"
                    control={control}
                    render={({ field }) => (
                      <input 
                        {...field} 
                        onKeyDown={handleKeyDown} 
                        className="orcamento-field__input" 
                        placeholder="Pressione F4 para pesquisar..."
                      />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--4">
                  <label className="orcamento-field__label">CNPJ / CPF</label>
                  <Controller
                    name="CGCTRANS"
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="orcamento-field__input" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--12">
                  <label className="orcamento-field__label">Endereço Completo</label>
                  <Controller
                    name="ENDER"
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="orcamento-field__input" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--5">
                  <label className="orcamento-field__label">Município</label>
                  <Controller
                    name="MUNICF"
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="orcamento-field__input" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--2">
                  <label className="orcamento-field__label">UF</label>
                  <Controller
                    name="UFTRANS"
                    control={control}
                    render={({ field }) => (
                      <input {...field} maxLength={2} className="orcamento-field__input orcamento-uppercase orcamento-text-center" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--5">
                  <label className="orcamento-field__label">Inscrição Estadual</label>
                  <Controller
                    name="INSCEST_ORP"
                    control={control}
                    render={({ field }) => (
                      <input {...field} className="orcamento-field__input" />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CT-e */}
          <div className="orcamento-panel">
            <div className="orcamento-panel__header" style={{ background: '#1e293b' }}>
              <h3 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                Dados do Conhecimento de Frete (CT-e)
              </h3>
            </div>
            <div className="orcamento-panel__body">
              <div className="orcamento-field-grid">
                <div className="orcamento-field orcamento-field--4">
                  <label className="orcamento-field__label">Nº Conhecimento</label>
                  <input type="text" className="orcamento-field__input orcamento-field__input--readonly" placeholder="000.000.000" />
                </div>
                <div className="orcamento-field orcamento-field--4">
                  <label className="orcamento-field__label">Série / Subsérie</label>
                  <input type="text" className="orcamento-field__input orcamento-field__input--readonly orcamento-text-center" placeholder="1 / 0" />
                </div>
                <div className="orcamento-field orcamento-field--4">
                  <label className="orcamento-field__label">Data Conhecimento</label>
                  <input type="date" className="orcamento-field__input" />
                </div>
                <div className="orcamento-field orcamento-field--12">
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span style={{ fontSize: '0.625rem', color: '#1d4ed8', fontWeight: 500, lineHeight: 1.4 }}>
                      As informações de CT-e serão vinculadas automaticamente ao DANFE durante o processo de faturamento deste orçamento.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Volumes e Entrega */}
        <div className="orcamento-flex orcamento-flex-col" style={{ gap: '0.75rem' }}>

          {/* Resumo de Volumes */}
          <div className="orcamento-panel">
            <div className="orcamento-panel__header">
              <h3>Resumo de Volumes / Carga</h3>
            </div>
            <div className="orcamento-panel__body">
              <div className="orcamento-field-grid">
                <div className="orcamento-field orcamento-field--6">
                  <label className="orcamento-field__label">Qtde Volumes</label>
                  <Controller
                    name="QTDE"
                    control={control}
                    render={({ field }) => (
                      <input type="number" {...field} className="orcamento-field__input orcamento-text-center" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--6">
                  <label className="orcamento-field__label">Espécie</label>
                  <Controller
                    name="ESPECIE"
                    control={control}
                    render={({ field }) => (
                      <input type="text" {...field} className="orcamento-field__input orcamento-uppercase" placeholder="Ex: CAIXAS" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--6">
                  <label className="orcamento-field__label">Peso Bruto (KG)</label>
                  <Controller
                    name="PESOBR"
                    control={control}
                    render={({ field }) => (
                      <input type="number" step="0.001" {...field} className="orcamento-field__input orcamento-text-center" style={{ color: '#2563eb', fontWeight: 700 }} />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--6">
                  <label className="orcamento-field__label">Peso Líquido (KG)</label>
                  <Controller
                    name="PESLIQ"
                    control={control}
                    render={({ field }) => (
                      <input type="number" step="0.001" {...field} className="orcamento-field__input orcamento-text-center" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--12">
                  <label className="orcamento-field__label">Marca / Identificação</label>
                  <Controller
                    name="MARCA"
                    control={control}
                    render={({ field }) => (
                      <input type="text" {...field} className="orcamento-field__input orcamento-uppercase" />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Local de Entrega */}
          <div className="orcamento-panel" style={{ flex: 1 }}>
            <div className="orcamento-panel__header">
              <h3>Local de Entrega Alternativo</h3>
            </div>
            <div className="orcamento-panel__body">
              <p style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>
                Preencher apenas se for diferente do endereço do cadastro do cliente.
              </p>
              <Controller
                name="LOCAL_ENTREGA"
                control={control}
                render={({ field }) => (
                  <textarea {...field} rows={5} className="orcamento-textarea" placeholder="Rua, Número, Bairro, Cidade - UF..." />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 900, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Pesquisar Transportadora</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Localizar
                title=""
                data={transportadorasData}
                columns={[
                  { field: 'codigo_cli', headerName: 'Código', width: 90 },
                  { field: 'nome_cli', headerName: 'Razão Social', flex: 1 },
                  { field: 'cpf_cnpj_cli', headerName: 'CNPJ / CPF', width: 150 },
                  { field: 'uf_cli', headerName: 'UF', width: 60 }
                ]}
                paginationPageSize={50}
                editable={false}
                onRowSelected={(rows) => {
                  if (rows && rows.length > 0) handleSelect(rows[0]);
                }}
                onRowDoubleClicked={(row) => handleSelect(row)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransporteTab;













