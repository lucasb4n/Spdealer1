import React from 'react';
import styled from 'styled-components';

const SelectWrapper = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333333;
  font-size: 0.95rem;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f8f8f8;
  color: #333333;
  font-size: 1rem;
  appearance: none;
  cursor: pointer;
  padding-right: 35px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3f51b5;
    box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.2);
  }
`;

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, ...props }) => (
  <SelectWrapper>
    {label && <Label>{label}</Label>}
    <StyledSelect {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </StyledSelect>
  </SelectWrapper>
);













