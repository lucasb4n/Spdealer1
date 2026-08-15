import React, { useState } from 'react';

interface ModalCadastroAuxiliarProps {
  visible: boolean;
  type: 'fabricante' | 'modelo' | 'grupo';
  onClose: (createdValue?: { codigo: string; descricao: string }) => void;
}

export default function ModalCadastroAuxiliar({ visible, type, onClose }: ModalCadastroAuxiliarProps) {
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const getTitle = () => {
    switch (type) {
      case 'fabricante':
        return 'Novo fabricante';
      case 'modelo':
        return 'Novo modelo de componente';
      case 'grupo':
        return 'Novo grupo';
      default:
        return 'Cadastro';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type !== 'grupo' && !codigo.trim()) {
      alert('O código é obrigatório.');
      return;
    }
    if (!descricao.trim()) {
      alert('A descrição/nome é obrigatória.');
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      let endpoint = '';
      let body: any = {};

      if (type === 'fabricante') {
        endpoint = '/api/servico/manutencao/modelos/fabric';
        body = { codigo: codigo.trim(), descricao: descricao.trim() };
      } else if (type === 'modelo') {
        endpoint = '/api/servico/manutencao/modelos/modcomp';
        body = { codigo: codigo.trim(), descricao: descricao.trim() };
      } else if (type === 'grupo') {
        // Para grupo, retorna diretamente a descrição já que grupo_mod é texto livre na tabela modelos
        setLoading(false);
        onClose({ codigo: descricao.trim(), descricao: descricao.trim() });
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao salvar o registro.');
      }

      const result = await response.json();
      setLoading(false);
      onClose({ codigo: result.codigo, descricao: result.descricao });
      
      // Limpa os campos
      setCodigo('');
      setDescricao('');
    } catch (err: any) {
      setLoading(false);
      alert(err.message || 'Erro ao realizar o cadastro.');
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 450 }}>
        <div className="modal-content" style={{ borderRadius: 8, overflow: 'hidden', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {/* Header */}
          <div className="modal-header" style={{ background: '#1e293b', color: '#fff', padding: '16px 20px', borderBottom: 'none' }}>
            <h5 className="modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{getTitle()}</h5>
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
            <div className="modal-body" style={{ padding: '20px' }}>
              {type !== 'grupo' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    CÓDIGO {type === 'fabricante' ? '(FABRIC.FAB_CODIGO)' : '(MODCOMP.CODIGO_MDC)'}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={type === 'fabricante' ? 'Ex.: FAB-06' : 'Ex.: MDC-101'}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    maxLength={type === 'fabricante' ? 4 : 10}
                    style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', height: 'auto' }}
                    required
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  NOME / DESCRIÇÃO {type === 'fabricante' ? '(FABRIC.FAB_DESCRICAO)' : type === 'modelo' ? '(MODCOMP.DESC_MDC)' : '(TEXTO LIVRE)'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={type === 'fabricante' ? 'Ex.: Komatsu' : type === 'modelo' ? 'Ex.: MDC-1020' : 'Ex.: Escavadeiras'}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={type === 'fabricante' ? 50 : type === 'modelo' ? 100 : 200}
                  style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '6px', height: 'auto' }}
                  required
                />
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ padding: '16px 20px', borderTop: 'none', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
                style={{ background: '#b2c4d4', color: '#475569', border: 'none', padding: '8px 24px', borderRadius: 4, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
