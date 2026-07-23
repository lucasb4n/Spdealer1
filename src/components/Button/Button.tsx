import styled from 'styled-components';

const BaseButton = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled(BaseButton)`
  background-color: #3f51b5;
  color: #ffffff;
  border: none;

  &:hover:not(:disabled) {
    background-color: #303f9f;
  }
`;

export const SecondaryButton = styled(BaseButton)`
  background-color: #f0f0f0;
  color: #333333;
  border: 1px solid #e0e0e0;

  &:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
`;

export const DangerButton = styled(BaseButton)`
  background-color: #F44336;
  color: #ffffff;
  border: none;

  &:hover:not(:disabled) {
    background-color: #d32f2f;
  }
`;













