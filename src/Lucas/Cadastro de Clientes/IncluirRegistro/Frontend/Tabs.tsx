import React, { useState } from 'react'
import LegalEntityForm from './components/juridica/LegalEntityForm'
import AddressForm from './components/juridica/AddressForm'
import PhysicalForm from './components/PhysicalForm'
import BillingForm from './components/BillingForm'
import CreditTab from './components/CreditTab'
// Billing tab could be added similarly

type Props = {
  data: any;
  onChange: (path: string, value: any) => void;
}

const Tabs: React.FC<Props> = ({ data, onChange }) => {
  const [tab, setTab] = useState<number>(0)

  return (
    <div className="sp-tabs">
      <div className="sp-tabs__nav" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'nowrap' }}>
        <button style={{ display: 'inline-flex' }} className={`sp-tabs__btn ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>Jurídica</button>
        <button style={{ display: 'inline-flex' }} className={`sp-tabs__btn ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>Endereço</button>
        <button style={{ display: 'inline-flex' }} className={`sp-tabs__btn ${tab === 2 ? 'active' : ''}`} onClick={() => setTab(2)}>Física</button>
        <button style={{ display: 'inline-flex' }} className={`sp-tabs__btn ${tab === 3 ? 'active' : ''}`} onClick={() => setTab(3)}>Cobrança</button>
        <button style={{ display: 'inline-flex' }} className={`sp-tabs__btn ${tab === 4 ? 'active' : ''}`} onClick={() => setTab(4)}>Crédito</button>
      </div>

      <div className="sp-tabs__panel">
        {tab === 0 && <LegalEntityForm data={data.juridica} onChange={(f,v)=>onChange(`juridica.${String(f)}`, v)} />}
        {tab === 1 && <AddressForm data={data.endereco} onChange={(f,v)=>onChange(`endereco.${String(f)}`, v)} />}
        {tab === 2 && <PhysicalForm data={data.fisica} onChange={(f,v)=>onChange(`fisica.${String(f)}`, v)} />}
        {tab === 3 && <BillingForm data={data.cobranca} onChange={(f,v)=>onChange(`cobranca.${String(f)}`, v)} />}
        {tab === 4 && <CreditTab data={data.credito} onChange={(e)=>{
          const t = e.target as HTMLInputElement | HTMLTextAreaElement;
          const name = (t.name || '').toString();
          const value = (t as HTMLInputElement).type === 'checkbox' ? (t as HTMLInputElement).checked : t.value;
          onChange(`credito.${name}`, value);
        }} />}
      </div>
    </div>
  )
}

export default Tabs
