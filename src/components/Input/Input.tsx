import React from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333333;
  font-size: 0.95rem;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f8f8f8;
  color: #333333;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3f51b5;
    box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.2);
  }

  &::placeholder {
    color: #888888;
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #f8f8f8;
  color: #333333;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3f51b5;
    box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.2);
  }

  &::placeholder {
    color: #888888;
  }
`;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, ...props }) => (
  <InputWrapper>
    {label && <Label>{label}</Label>}
    <StyledInput {...props} />
  </InputWrapper>
);

export const Textarea: React.FC<TextareaProps> = ({ label, ...props }) => (
  <InputWrapper>
    {label && <Label>{label}</Label>}
    <StyledTextarea {...props} />
  </InputWrapper>
);













