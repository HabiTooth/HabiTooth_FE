'use client';

import { useState } from 'react';
import styled from 'styled-components';
import type { InputProps } from './Input.types';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const InputContainer = styled.div<{ $error: boolean; $focused: boolean }>`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid
    ${({ theme, $error, $focused }) =>
      $error ? theme.colors.danger : $focused ? theme.colors.primary : theme.colors.hairline};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 0 16px;
  height: 52px;
  transition: border-color 0.2s;
`;

const StyledInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 15px;
  font-family: ${({ theme }) => theme.font.family};
  color: ${({ theme }) => theme.colors.textPrimary};
  height: 100%;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const RightSlot = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
`;

export default function Input({ label, type, placeholder, value, onChange, error, rightIcon }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <Wrapper>
      <Label>{label}</Label>
      <InputContainer $error={!!error} $focused={focused}>
        <StyledInput
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon && <RightSlot>{rightIcon}</RightSlot>}
      </InputContainer>
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  );
}
