
import React from 'react';
import './Chart.css';

interface ChartProps {
  title: string;
  chartType: string;
  dataSource: string;
}

const Chart: React.FC<ChartProps> = ({ title, chartType, dataSource }) => {
  return (
    <div className="chart">
      <h5>{title}</h5>
      {/* Aqui você pode renderizar o gráfico real conforme chartType/dataSource */}
      <p>Gráfico de tipo: {chartType} (placeholder)</p>
      <small>Fonte: {dataSource}</small>
    </div>
  );
}

export default Chart;













