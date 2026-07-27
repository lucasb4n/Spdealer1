import React from 'react'

type Props = {
  data: any
  onChange: (path: string, value: any) => void
  isEdit?: boolean
}

const onlyDigits = (s: string) => (s || '').replace(/\D/g, '')

const formatCPF = (v: string) => {
  const d = onlyDigits(v).slice(0,11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

const formatCNPJ = (v: string) => {
  const d = onlyDigits(v).slice(0,14)
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

const CustomerHeader: React.FC<Props> = ({ data, onChange, isEdit }) => {
  const juridica = data?.juridica || {}
  const _tp = String(juridica['tipopessoa_cli'] || juridica['tipopessoa'] || juridica['tipo'] || '').trim().toLowerCase()
  const tipo = _tp === 'c' ? 'CPF' : _tp === 'f' ? 'CNPJ' : ((juridica['tipo'] as string) || 'CNPJ')

  const handleTipo = (value: 'CNPJ' | 'CPF') => {
    onChange('juridica.tipo', value)
    onChange('juridica.tipopessoa_cli', value === 'CPF' ? 'c' : 'f')
    onChange('juridica.cgccpf_cli', '')
  }

  const handleDocumento = (raw: string) => {
    const formatted = tipo === 'CNPJ' ? formatCNPJ(raw) : formatCPF(raw)
    onChange('juridica.cgccpf_cli', formatted)
  }

  const labelClass = "block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1";
  const inputClass = "w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded h-7 px-2 text-xs py-0 text-slate-800 placeholder:text-slate-400 transition-all outline-none";

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto p-4">
        
        <div className="flex gap-4 items-end flex-wrap md:flex-nowrap">
          {/* 1. CÓDIGO */}
          <div style={{ width: '110px', flexShrink: 0 }}>
            <label className={labelClass}>Código</label>
            <input
              className={`${inputClass} ${isEdit ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
              value={juridica['codigo_cli'] || ''}
              readOnly={isEdit}
              onChange={(e) => { if (!isEdit) onChange('juridica.codigo_cli', e.target.value) }}
            />
          </div>
 
          {/* 2. RAZÃO SOCIAL */}
          <div className="flex-1 min-w-[250px]">
            <label className={labelClass}>Nome / Razão Social</label>
            <input
              className={`${inputClass} bg-white uppercase font-semibold`}
              value={juridica['nome_cli'] || juridica['tradingName'] || ''}
              onChange={(e) => onChange('juridica.nome_cli', e.target.value)}
              placeholder="Razão Social"
            />
          </div>
 
          {/* 3. TIPO */}
          <div style={{ width: '110px', flexShrink: 0 }}>
            <label className={labelClass}>Tipo</label>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => handleTipo('CNPJ')}
                className={`flex-1 h-7 px-1 text-[9px] font-bold rounded border transition-all sp-btn-tipo ${tipo === 'CNPJ' ? 'sp-btn-tipo--active' : ''}`}
              >
                CNPJ
              </button>
              <button 
                type="button"
                onClick={() => handleTipo('CPF')}
                className={`flex-1 h-7 px-1 text-[9px] font-bold rounded border transition-all sp-btn-tipo ${tipo === 'CPF' ? 'sp-btn-tipo--active' : ''}`}
              >
                CPF
              </button>
            </div>
          </div>

          {/* 4. DOCUMENTO */}
          <div style={{ width: '210px', flexShrink: 0 }}>
            <label className={labelClass}>Documento</label>
            <input
              className={`${inputClass} bg-white`}
              value={juridica['cgccpf_cli'] || ''}
              onChange={(e) => handleDocumento(e.target.value)}
              placeholder={tipo === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
            />
          </div>

          {/* 5. DATA CADASTRO */}
          <div style={{ width: '150px', flexShrink: 0 }}>
            <label className={labelClass}>Data Cadastro</label>
            <input
              type="date"
              className={`${inputClass} bg-white`}
              value={juridica['datcad_cli'] || juridica['cas'] || ''}
              onChange={(e) => onChange('juridica.datcad_cli', e.target.value)}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default CustomerHeader;
