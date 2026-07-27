import React from 'react'
import './cliente-fields.css'
// CustomHeader removido para alinhar visual com padrão de fornecedores
import CustomerHeader from './components/juridica/CustomerHeader'
import Tabs from './Tabs'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const IncluirRegistro: React.FC = () => {
  const navigate = useNavigate()

  const [data, setData] = React.useState<any>({
    juridica: {
      activities: [{ code: '', description: '' }],
      isNonContributor: false,
      isContributor: false,
      isSimplesNacional: false,
      ignoreMargin: false,
      newSales: false,
      usedSales: false,
      workshop: false,
      parts: false,
      vip: false
    },
    endereco: {
      street: '', number: '', updatedAt: '', neighborhood: '', city: '', cep: '', latitude: '', longitude: '', phone: '', cellphone: '', whatsapp: '', residenceType: 'Própria', residenceTime: '', printLabels: false, regionId: '', regionDescription: '', email: ''
    },
    fisica: { name: '', document: '' },
    cobranca: {},
    credito: { limiteCredito: '', saldoDisponivel: '', ultimaCompra: '', ativo: false, condPag: '', naNfeAvista: false, desconto: '', vencimento: '', faturarLiquido: false, obsSpc: '', referenciasBancos: '', referenciasComerciais: '' }
  })

  const location = useLocation()
  const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search])
  const editId = searchParams.get('editId')

  React.useEffect(() => {
    const load = async () => {
      if (!editId) return
      try {
        const res = await axios.get(`/api/clientes/${editId}`)
        const r = res.data || {}

        setData((prev: any) => {
          const mappedJuridica: any = { ...(prev.juridica || {}) }
          const mappedEndereco: any = { ...(prev.endereco || {}) }
          const mappedFisica: any = { ...(prev.fisica || {}) }
          const mappedCobranca: any = { ...(prev.cobranca || {}) }
          const mappedCredito: any = { ...(prev.credito || {}) }

          // Copy raw response keys into juridica, create hyphen-variants
          // and normalize simple YYYYMMDD date strings to YYYY-MM-DD for date inputs
          const toIsoDate = (s: any) => {
            if (typeof s !== 'string') return s
            const m = s.match(/^\s*(\d{4})(\d{2})(\d{2})\s*$/)
            if (m) return `${m[1]}-${m[2]}-${m[3]}`
            return s
          }

          Object.keys(r).forEach((k) => {
            const raw = r[k]
            const normalized = toIsoDate(raw)
            mappedJuridica[k] = normalized
            const hy = k.replace(/_/g, '-')
            mappedJuridica[hy] = normalized
          })

          // Garantir que tipopessoa seja mapeado para habilitar seleção correta (c -> CPF, f -> CNPJ)
          const tpRaw = (r.tipopessoa_cli || r.tipopessoa || r.tipo || '')
          const tp = String(tpRaw).trim().toLowerCase()
          if (tp === 'c' || tp === 'cpf' || tp === 'pf') {
            mappedJuridica.tipopessoa_cli = 'c'
            mappedJuridica.tipo = 'CPF'
          } else if (tp === 'f' || tp === 'cnpj' || tp === 'pj') {
            mappedJuridica.tipopessoa_cli = 'f'
            mappedJuridica.tipo = 'CNPJ'
          } else {
            // mantem qualquer valor já presente ou fallback
            mappedJuridica.tipopessoa_cli = mappedJuridica.tipopessoa_cli || tpRaw || mappedJuridica.tipo || mappedJuridica.tipopessoa_cli
          }

          // Address heuristics
          mappedEndereco.street = mappedEndereco.street || r.logradouro || r.logra || r.logra_cli || r.logra || r.logra_cli || ''
          mappedEndereco.number = mappedEndereco.number || r.numero || r.nro || r.numero_cli || ''
          mappedEndereco.neighborhood = mappedEndereco.neighborhood || r.bairro || r.bairro_cli || ''
          mappedEndereco.city = mappedEndereco.city || r.cidade || r.cidade_cli || ''
          mappedEndereco.cep = mappedEndereco.cep || r.cep || r.cep_cli || ''
          mappedEndereco.phone = mappedEndereco.phone || r.telefone || r.telefone_cli || r.fone1_cli || r.fone1 || ''
          mappedEndereco.email = mappedEndereco.email || r.email || r.email_cli || ''

          // Fisica heuristics
          mappedFisica.name = mappedFisica.name || r.nome_fisica || r.nome_fis || r.nome_cli || r.nome || ''
          mappedFisica.document = mappedFisica.document || r.cpf || r.cgccpf_cli || r.cpf_cnpj_cli || ''
          mappedFisica.ident_cli = mappedFisica.ident_cli || r.ident_cli || r.ident || ''
          mappedFisica.civil_cli = mappedFisica.civil_cli || r.civil_cli || r.estado_civil || ''
          mappedFisica.prof_cli = mappedFisica.prof_cli || r.prof_cli || r.profissao || ''
          mappedFisica.pai_cli = mappedFisica.pai_cli || r.pai_cli || r.nome_pai || ''
          mappedFisica.mae_cli = mappedFisica.mae_cli || r.mae_cli || r.nome_mae || ''
          mappedFisica.orgemis_cli = mappedFisica.orgemis_cli || r.orgemis_cli || r.orgao_emissor || ''
          mappedFisica.natural_cli = mappedFisica.natural_cli || r.natural_cli || r.naturalidade || ''
          mappedFisica.sexo_cli = mappedFisica.sexo_cli || r.sexo_cli || r.sexo || ''
          mappedFisica.datanasc_cli = mappedFisica.datanasc_cli || r.datanasc_cli || r.datanasc || ''
          mappedFisica.conjuge_cli = mappedFisica.conjuge_cli || r.conjuge_cli || r.nome_conjuge || ''
          mappedFisica.dtnasconj_cli = mappedFisica.dtnasconj_cli || r.dtnasconj_cli || r.dtnasconj || ''
          mappedFisica.cpfconj_cli = mappedFisica.cpfconj_cli || r.cpfconj_cli || ''
          mappedFisica.ideconj_cli = mappedFisica.ideconj_cli || r.ideconj_cli || ''

          // Cobranca heuristics (mapear chaves comuns da API para a seção cobranca)
          mappedCobranca.logra1_cli = mappedCobranca.logra1_cli || r.logra1_cli || r.logra_cli || r.logradouro_cobranca || ''
          mappedCobranca.numero1_cli = mappedCobranca.numero1_cli || r.numero1_cli || r.numero_cli || r.numero || ''
          mappedCobranca.bairro1_cli = mappedCobranca.bairro1_cli || r.bairro1_cli || r.bairro_cli || r.bairro || ''
          mappedCobranca.cidade1_cli = mappedCobranca.cidade1_cli || r.cidade1_cli || r.cidade_cli || r.cidade || ''
          mappedCobranca.cep1_cli = mappedCobranca.cep1_cli || r.cep1_cli || r.cep_cli || r.cep || ''
          mappedCobranca.uf1_cli = mappedCobranca.uf1_cli || r.uf1_cli || r.uf_cli || r.uf || ''
          mappedCobranca.codbco_cli = mappedCobranca.codbco_cli || r.codbco_cli || r.codbco || ''
          mappedCobranca.tipcob_cli = mappedCobranca.tipcob_cli || r.tipcob_cli || r.tipo_cobranca || ''
          mappedCobranca.contatos_cli = mappedCobranca.contatos_cli || r.contatos_cli || r.billingContact || r.telefone_cobranca || ''
          mappedCobranca.datalt_cli = mappedCobranca.datalt_cli || r.datalt_cli || r.datalt || ''
          mappedCobranca.vcto_cli = mappedCobranca.vcto_cli || r.vcto_cli || r.vcto || ''
          mappedCobranca.comissao_cli = mappedCobranca.comissao_cli || r.comissao_cli || ''
          mappedCobranca.comissaoavi_cli = mappedCobranca.comissaoavi_cli || r.comissaoavi_cli || ''
          mappedCobranca.despesa_cli = mappedCobranca.despesa_cli || r.despesa_cli || ''
          mappedCobranca.numctada_cli = mappedCobranca.numctada_cli || r.numctada_cli || ''
          mappedCobranca.trib_cli = mappedCobranca.trib_cli || r.trib_cli || ''

          // Credito heuristics / mappings
          const toBool = (v: any) => {
            if (v === true || v === 1) return true
            if (typeof v === 'string') {
              const s = v.trim().toLowerCase()
              return s === '1' || s === 'true' || s === 's' || s === 't' || s === 'sim'
            }
            return false
          }

          mappedCredito.ativo = mappedCredito.ativo || toBool(r.ativoinativo_cli) || toBool(r.ativo) || false
          mappedCredito.desconto = mappedCredito.desconto || r.percdesc_cli || r.percdesc || ''
          mappedCredito.ultimaCompra = mappedCredito.ultimaCompra || toIsoDate(r.datcomp_cli) || toIsoDate(r.datcomp) || ''

          // Mapir campos financeiros retornados pelo backend
          mappedCredito.limiteCredito = mappedCredito.limiteCredito || r.limite_credito || r.limiteCredito || r.limcre_cli || r.limcre || ''
          mappedCredito.saldoDisponivel = mappedCredito.saldoDisponivel || r.limite_disponivel || r.limiteDisponivel || r.limite_disponivel || ''
          mappedCredito.condPag = mappedCredito.condPag || r.condpag_cli || r.condpag || r.condicao_pagamento || ''
          mappedCredito.naNfeAvista = mappedCredito.naNfeAvista || toBool(r.nanfeavista_cli) || toBool(r.naNfeAvista) || toBool(r.na_nfe_avista) || mappedCredito.naNfeAvista || false
          mappedCredito.vencimento = mappedCredito.vencimento || toIsoDate(r.vcto_cli) || toIsoDate(r.vcto) || toIsoDate(r.vencimento) || ''
          mappedCredito.faturarLiquido = mappedCredito.faturarLiquido || toBool(r.faturar_liquido_cli) || toBool(r.faturarLiquido) || false
          mappedCredito.obsSpc = mappedCredito.obsSpc || r.obs_spc_cli || r.obsSpc || r.observacoes_spc || ''
          mappedCredito.referenciasBancos = mappedCredito.referenciasBancos || r.referencias_bancos_cli || r.referencias_bancos || r.referenciasBancos || ''
          mappedCredito.referenciasComerciais = mappedCredito.referenciasComerciais || r.referencias_comerciais_cli || r.referencias_comerciais || r.referenciasComerciais || ''

          return {
            ...prev,
            juridica: mappedJuridica,
            endereco: mappedEndereco,
            fisica: mappedFisica,
            cobranca: mappedCobranca,
            credito: mappedCredito
          }
        })
      } catch (err) {
        console.error('Erro ao carregar cliente para edição', err)
        alert('Erro ao carregar cliente para edição')
      }
    }

    load()
  }, [editId])

  const handleChange = (path: string, value: any) => {
    const parts = path.split('.')
    const section = parts[0]
    const field = parts[1]
    setData((d: any) => ({ ...d, [section]: { ...(d[section] || {}), [field]: value } }))
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...data.juridica,
        ...data.fisica,
        // espalhar campos de endereço/cobrança/crédito para o nível superior
        ...(data.endereco || {}),
        ...(data.cobranca || {}),
        ...(data.credito || {})
      }
      // Se estamos em edição (editId presente), garantir que o payload contenha codigo_cli
      if (editId && (!payload.codigo_cli || String(payload.codigo_cli).trim() === '')) {
        payload.codigo_cli = editId
      }
      if (editId) {
        // Não enviar `compl_cli` no update — campo não existe no DB
        if (payload && Object.prototype.hasOwnProperty.call(payload, 'compl_cli')) {
          delete payload.compl_cli
        }
        // usar PUT para atualização quando estamos no modo edição
        await axios.put(`/api/clientes/${editId}`, payload)
        alert('Cliente atualizado com sucesso')
      } else {
        const res = await axios.post('/api/clientes', payload)
        // se criado, navegar para edição do novo registro
        if (res && res.data && res.data.codigo_cli) {
          navigate(`/cadastros/clientes/incluir-registro?editId=${res.data.codigo_cli}`)
          return
        }
        alert('Cliente salvo com sucesso')
      }
      navigate('/cadastros/clientes')
    } catch (err) {
      console.error(err)
      alert('Erro ao gravar cliente')
    }
  }

  const isEditMode = Boolean(editId)

  return (
    <div className="sp-card">

      <CustomerHeader data={data} onChange={handleChange} isEdit={isEditMode} />

      <div className="sp-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ flex: 1, minHeight: 0, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingBottom: 140, boxSizing: 'border-box' }}>
          <Tabs data={data} onChange={handleChange} />
        </div>

        <div style={{ marginTop: 0 }}>
          <button type="button" onClick={handleSave} className="sp-btn sp-btn--primary">Salvar</button>
        </div>
      </div>
    </div>
  )
}

export default IncluirRegistro
