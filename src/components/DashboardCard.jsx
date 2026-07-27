import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet, faCreditCard, faCashRegister, faChartLine, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, Tooltip, Legend, XAxis, YAxis, CartesianGrid } from 'recharts';
import axios from 'axios';

const icons = {
  'fa-wallet': faWallet,
  'fa-credit-card': faCreditCard,
  'fa-cash-register': faCashRegister,
  'fa-chart-line': faChartLine,
  'fa-exclamation-triangle': faExclamationTriangle,
};

const Card = styled.div`
  flex: ${({ width }) => width};
  background: ${({ theme }) => theme.cardBg || `rgba(37,99,235,0.08)`};
  border-radius: ${({ theme }) => theme.cardRadius || '18px'};
  box-shadow: ${({ theme }) => theme.cardShadow || '0 4px 18px rgba(34,51,106,0.13)'};
  padding: 20px 24px 18px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 220px;
  min-height: 140px;
  position: relative;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 8px 32px rgba(34,51,106,0.18);
  }
`;

const IconCircle = styled.div`
  background: ${({ theme }) => theme.primaryColor || '#2563eb'};
  color: #fff;
  border-radius: 16px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(34,51,106,0.10);
`;

const Title = styled.h3`
  // Removed unused imports
  margin-bottom: 6px;
  letter-spacing: 0.01em;
`;

const Value = styled.div`
  font-size: 2.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.primaryColor || '#2563eb'};
  margin-bottom: 4px;
`;

const Trend = styled.span`
  font-size: 1rem;
  margin-left: 8px;
  font-weight: 500;
  color: ${({ up, theme }) => up ? (theme.successColor || '#22c55e') : (theme.errorColor || '#ef4444')};
`;

const CardActions = styled.div`
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: ${({ theme }) => theme.primaryColor || '#2563eb'};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(34,51,106,0.10);
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.primaryColor ? `${theme.primaryColor}CC` : '#1d4ed8'};
  }
`;

export default function DashboardCard({ widget, width, theme }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!widget || !widget.sqlQuery) return;
    axios.post('/api/dashboard/widget-data', { sql: widget.sqlQuery })
      .then(res => {
        setData(res.data);
        setLoading(false);
      });
  }, [widget]);

  return (
    <Card width={width} theme={theme}>
      <CardActions>
        <ActionButton theme={theme}>+ Adicionar novo</ActionButton>
      </CardActions>
      <IconCircle theme={theme}>
        <FontAwesomeIcon icon={icons[widget.icon] || faExclamationTriangle} size="2x" />
      </IconCircle>
      <Title theme={theme}>{widget.title}</Title>
      {widget.type === 'kpi' && (
        <Value theme={theme}>
          {loading ? 'Carregando...' : data?.value ? `R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sem dados'}
          {typeof data?.trend === 'number' && (
            <Trend up={data.trend > 0} theme={theme}>{data.trend > 0 ? `▲ +${data.trend}%` : data.trend < 0 ? `▼ ${data.trend}%` : ''}</Trend>
          )}
        </Value>
      )}
      {widget.type === 'chart' && (
        <div style={{ width: '100%', minHeight: 120 }}>
          <LineChart width={320} height={120} data={data?.series || []}>
            <XAxis dataKey={widget.xKey || 'dtmovi_cai'} />
            <YAxis />
            <CartesianGrid stroke="#eee" />
            <Line type="monotone" dataKey={widget.yKey || 'valor'} stroke={theme.primaryColor || '#23395d'} strokeWidth={3} />
            {widget.showTooltip && <Tooltip />}
            {widget.showLegend && <Legend />}
          </LineChart>
        </div>
      )}
      {widget.type === 'list' && (
        <div style={{ width: '100%' }}>
          {loading ? 'Carregando...' : (Array.isArray(data?.items) && data.items.length > 0 ? (
            <ul style={{ paddingLeft: 16 }}>
              {data.items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: 4, color: theme.primaryColor }}>{item[widget.listKey || 'nome']}</li>
              ))}
            </ul>
          ) : <span>Sem dados para a lista</span>)}
        </div>
      )}
    </Card>
  );
}
