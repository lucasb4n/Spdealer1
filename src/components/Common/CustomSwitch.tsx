import React from 'react';
import styled from 'styled-components';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'small' | 'medium';
}

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SwitchLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
`;

const ToggleWrapper = styled.div<{ active: boolean; disabled: boolean; size: 'small' | 'medium' }>`
  width: ${props => props.size === 'small' ? '32px' : '44px'};
  height: ${props => props.size === 'small' ? '18px' : '24px'};
  background-color: ${props => (props.active ? '#3b82f6' : '#d1d5db')};
  border-radius: 999px;
  padding: ${props => props.size === 'small' ? '2px' : '3px'};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  position: relative;
  opacity: ${props => (props.disabled ? 0.6 : 1)};

  &:hover {
    background-color: ${props => (props.active ? '#2563eb' : '#9ca3af')};
  }
`;

const Knob = styled.div<{ active: boolean; size: 'small' | 'medium' }>`
  width: ${props => props.size === 'small' ? '14px' : '18px'};
  height: ${props => props.size === 'small' ? '14px' : '18px'};
  background-color: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${props => (props.active ? (props.size === 'small' ? 'translateX(14px)' : 'translateX(20px)') : 'translateX(0)')};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const CustomSwitch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  disabled = false, 
  label,
  size = 'medium' 
}) => {
  return (
    <SwitchContainer onClick={() => !disabled && onChange(!checked)}>
      <ToggleWrapper active={checked} disabled={disabled} size={size}>
        <Knob active={checked} size={size} />
      </ToggleWrapper>
      {label && <SwitchLabel>{label}</SwitchLabel>}
    </SwitchContainer>
  );
};













