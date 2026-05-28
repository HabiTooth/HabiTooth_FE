'use client';

import styled from 'styled-components';
import { Check } from 'lucide-react';
import type { CheckboxProps } from './Checkbox.types';

const Wrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
`;

const Box = styled.span<{ $checked: boolean }>`
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 6px;
  border: 2px solid
    ${({ theme, $checked }) => ($checked ? theme.colors.primary : theme.colors.hairline)};
  background: ${({ theme, $checked }) => ($checked ? theme.colors.primary : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
`;


const LabelText = styled.span<{ $bold?: boolean }>`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ $bold }) => ($bold ? 600 : 400)};
  line-height: 1.4;
`;

export default function Checkbox({ label, checked, onChange, bold }: CheckboxProps) {
  return (
    <Wrapper onClick={() => onChange(!checked)}>
      <Box $checked={checked}>{checked && <Check size={13} color="white" strokeWidth={2.5} />}</Box>
      <LabelText $bold={bold}>{label}</LabelText>
    </Wrapper>
  );
}
