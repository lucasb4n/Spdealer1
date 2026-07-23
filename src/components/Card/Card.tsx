import React from 'react';
import './Card.css';

interface CardProps {
  title: string;
  value: number | string;
}

function Card({ title, value }: CardProps) {
  return (
    <div className="card-resumido">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
}

export default Card;













