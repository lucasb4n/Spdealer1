import React from 'react';
import styled from 'styled-components';

const SwitchContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  margin-bottom: 15px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const SwitchSlider = styled.span<{ checked: boolean }>`
  width: 40px;
  height: 22px;
  background-color: ${({ checked }) =>
    checked ? '#4CAF50' : '#ccc'};
  border-radius: 22px;
  position: relative;
  transition: background-color 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    height: 18px;
    width: 18px;
    left: ${({ checked }) => (checked ? '20px' : '2px')};
    bottom: 2px;
    background-color: white;
    border-radius: 50%;
    transition: left 0.2s ease;
  }
`;

const SwitchLabel = styled.span`
  color: #333333;
  font-weight: 500;
  font-size: 0.95rem;
`;

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Switch: React.FC<SwitchProps> = ({ label, checked, onChange, ...props }) => (
  <SwitchContainer>
    <SwitchInput type="checkbox" checked={checked} onChange={onChange} {...props} />
    <SwitchSlider checked={checked} />
    <SwitchLabel>{label}</SwitchLabel>
  </SwitchContainer>
);













