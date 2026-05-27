'use client';

import styled from 'styled-components';
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

const CheckMark = () => (
  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
    <path
      d="M1 4.5L4.5 8L11 1"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LabelText = styled.span<{ $bold?: boolean }>`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ $bold }) => ($bold ? 600 : 400)};
  line-height: 1.4;
`;

export default function Checkbox({ label, checked, onChange, bold }: CheckboxProps) {
  return (
    <Wrapper onClick={() => onChange(!checked)}>
      <Box $checked={checked}>{checked && <CheckMark />}</Box>
      <LabelText $bold={bold}>{label}</LabelText>
    </Wrapper>
  );
}
