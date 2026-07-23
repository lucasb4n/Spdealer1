import React from 'react'
import './CustomHeader.css'

type Props = {
  title?: string
  subtitle?: string
}

const CustomHeader: React.FC<Props> = ({ title, subtitle }) => {
  const userDisplay = typeof window !== 'undefined' ? localStorage.getItem('display_name') || '' : ''

  return (
    <div className="sp-card sp-card--header">
      <div className="sp-card__header">
        <div className="sp-card__header-left">
          <div className="sp-logo-wrap">
            <img
              src="/SPdealer_dev/logo192.png"
              alt="logo"
              className="sp-logo"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </div>

          <div className="sp-titles">
            <h1 className="sp-card__title">{title || 'SPDealer'}</h1>
            {subtitle && <div className="sp-card__subtitle">{subtitle}</div>}
          </div>
        </div>

        <div className="sp-card__header-right">
          <div className="sp-user">
            <div className="sp-user__name">{userDisplay || 'Usuário'}</div>
            <div className="sp-user__status">Conectado</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomHeader













