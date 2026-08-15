import React, { useState, useEffect } from 'react';
import ModalCadastroAuxiliar from './ModalCadastroAuxiliar';

interface ModelRow {
  codigo_mod: string;
  modelo_mod: string;
  fabricante_mod: string;
  grupo_mod: string;
  dtalter_mod: string;
}

interface ManutencaoModelosFormProps {
  visible: boolean;
  onClose: (refresh?: boolean) => void;
  editingModel?: ModelRow | null;
}

export default function ManutencaoModelosForm({ visible, onClose, editingModel }: ManutencaoModelosFormProps) {
  const [codigoMod, setCodigoMod] = useState('');
  const [modeloMod, setModeloMod] = useState('');
  const [fabricanteMod, setFabricanteMod] = useState('');
  const [grupoMod, setGrupoMod] = useState('');
  const [dtAlter, setDtAlter] = useState('');
  const [loading, setLoading] = useState(false);

  // Aux data states
  const [modcompOptions, setModcompOptions] = useState<Array<{ codigo: string; descricao: string }>>([]);
  const [fabricOptions, setFabricOptions] = useState<Array<{ codigo: string; descricao: string }>>([]);
  const [grupoOptions, setGrupoOptions] = useState<string[]>([]);

  // Modal Aux States
  const [modalAuxType, setModalAuxType] = useState<'fabricante' | 'modelo' | 'grupo' | null>(null);

  // Load lists
  const loadAuxData = async () => {
    try {
      const [rModcomp, rFabric, rGrupos] = await Promise.all([
        fetch('/api/servico/manutencao/modelos/modcomp').then(r => r.json()),
        fetch('/api/tabelas-auxiliares/fabric').then(r => r.json()),
        fetch('/api/servico/manutencao/modelos/grupos').then(r => r.json())
      ]);

      if (Array.isArray(rModcomp)) setModcompOptions(rModcomp);
      if (Array.isArray(rFabric)) setFabricOptions(rFabric);
      if (Array.isArray(rGrupos)) setGrupoOptions(rGrupos);
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares do formulário', err);
    }
  };

  useEffect(() => {
    if (visible) {
      loadAuxData();
      if (editingModel) {
        setCodigoMod(editingModel.codigo_mod ? editingModel.codigo_mod.trim() : '');
        setModeloMod(editingModel.modelo_mod ? editingModel.modelo_mod.trim() : '');
        setFabricanteMod(editingModel.fabricante_mod ? editingModel.fabricante_mod.trim() : '');
        setGrupoMod(editingModel.grupo_mod ? editingModel.grupo_mod.trim() : '');
        
        // Formata dtalter_mod (YYYYMMDD) para DD/MM/YYYY
        const dt = editingModel.dtalter_mod || '';
        if (dt.length === 8) {
          setDtAlter(`${dt.substring(6, 8)}/${dt.substring(4, 6)}/${dt.substring(0, 4)}`);
        } else {
          setDtAlter(dt);
        }
      } else {
        setCodigoMod('');
        setModeloMod('');
        setFabricanteMod('');
        setGrupoMod('');
        // Data de hoje
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        setDtAlter(`${dd}/${mm}/${yyyy}`);
      }
    }
  }, [visible, editingModel]);

  if (!visible) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoMod.trim()) {
      alert('Nome/Código do modelo é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        codigo_mod: codigoMod,
        modelo_mod: modeloMod,
        fabricante_mod: fabricanteMod,
        grupo_mod: grupoMod
      };

      const url = editingModel 
        ? `/api/servico/manutencao/modelos/${encodeURIComponent(editingModel.codigo_mod)}`
        : '/api/servico/manutencao/modelos';
        
      const response = await fetch(url, {
        method: editingModel ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao salvar o modelo de máquina.');
      }

      alert('Modelo de máquina salvo com sucesso!');
      onClose(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar a operação.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAux = (created?: { codigo: string; descricao: string }) => {
    const type = modalAuxType;
    setModalAuxType(null);
    if (!created) return;

    if (type === 'fabricante') {
      setFabricOptions(prev => [...prev, created]);
      setFabricanteMod(created.codigo);
    } else if (type === 'modelo') {
      setModcompOptions(prev => [...prev, created]);
      setModeloMod(created.codigo);
    } else if (type === 'grupo') {
      setGrupoOptions(prev => {
        if (!prev.includes(created.descricao)) {
          return [...prev, created.descricao];
        }
        return prev;
      });
      setGrupoMod(created.descricao);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: 650 }}>
        <div className="modal-content" style={{ borderRadius: 8, overflow: 'hidden', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {/* Header */}
          <div className="modal-header" style={{ background: '#1e293b', color: '#fff', padding: '16px 20px', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <small style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px', color: '#94a3b8' }}>
                SERVIÇO · MANUTENÇÃO · MODELOS DE MÁQUINA
              </small>
              <h5 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, marginTop: 2 }}>
                {editingModel ? 'Editar modelo de máquina' : 'Novo modelo de máquina'}
              </h5>
            </div>
            <button 
              type="button" 
              className="close" 
              onClick={() => onClose()}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSave}>
            {/* Body */}
            <div className="modal-body" style={{ padding: '24px' }}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    NOME (MODELOS.CODIGO_MOD)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex.: EC-210"
                    value={codigoMod}
                    onChange={(e) => setCodigoMod(e.target.value)}
                    disabled={!!editingModel}
                    style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', height: 'auto' }}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    DATA DE ALTERAÇÃO (MODELOS.DTALTER_MOD)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={dtAlter}
                    disabled
                    style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', backgroundColor: '#f1f5f9', height: 'auto' }}
                  />
                </div>
              </div>

              <div className="row mb-3">
                {/* MODELO */}
                <div className="col-md-6">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
                      MODELO
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalAuxType('modelo')}
                      style={{ background: '#fef3c7', color: '#d97706', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      + Novo
                    </button>
                  </div>
                  <select
                    className="form-control"
                    value={modeloMod}
                    onChange={(e) => setModeloMod(e.target.value)}
                    style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', height: 'auto' }}
                  >
                    <option value="">Selecione o modelo</option>
                    {modeloMod && !modcompOptions.some(opt => opt.codigo === modeloMod) && (
                      <option value={modeloMod}>{modeloMod}</option>
                    )}
                    {modcompOptions.map(opt => {
                      const label = opt.descricao && opt.descricao.trim() ? opt.descricao : opt.codigo;
                      if (!label || !label.trim()) return null;
                      return (
                        <option key={opt.codigo} value={opt.codigo}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                {/* FABRICANTE */}
                <div className="col-md-6">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
                      FABRICANTE
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalAuxType('fabricante')}
                      style={{ background: '#fef3c7', color: '#d97706', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      + Novo
                    </button>
                  </div>
                  <select
                    className="form-control"
                    value={fabricanteMod}
                    onChange={(e) => setFabricanteMod(e.target.value)}
                    style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', height: 'auto' }}
                  >
                    <option value="">Selecione o fabricante</option>
                    {fabricanteMod && !fabricOptions.some(opt => opt.codigo === fabricanteMod) && (
                      <option value={fabricanteMod}>{fabricanteMod}</option>
                    )}
                    {fabricOptions.map(opt => {
                      const label = opt.descricao && opt.descricao.trim() ? opt.descricao : opt.codigo;
                      if (!label || !label.trim()) return null;
                      return (
                        <option key={opt.codigo} value={opt.codigo}>{label}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="row">
                {/* GRUPO */}
                <div className="col-md-6">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
                      GRUPO
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalAuxType('grupo')}
                      style={{ background: '#fef3c7', color: '#d97706', border: 'none', padding: '2px 8px', borderRadius: 4, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      + Novo
                    </button>
                  </div>
                  <select
                    className="form-control"
                    value={grupoMod}
                    onChange={(e) => setGrupoMod(e.target.value)}
                    style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', height: 'auto' }}
                  >
                    <option value="">Selecione o grupo</option>
                    {grupoMod && !grupoOptions.includes(grupoMod) && (
                      <option value={grupoMod}>{grupoMod}</option>
                    )}
                    {grupoOptions.map(g => {
                      if (!g || !g.trim()) return null;
                      return (
                        <option key={g} value={g}>{g}</option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button 
                type="button" 
                className="btn btn-link" 
                onClick={() => onClose()}
                style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none' }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn" 
                style={{ background: '#b2c4d4', color: '#475569', border: 'none', padding: '10px 28px', borderRadius: 4, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar modelo'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Render sub modals */}
      <ModalCadastroAuxiliar
        visible={modalAuxType !== null}
        type={modalAuxType || 'grupo'}
        onClose={handleCloseAux}
      />
    </div>
  );
}
