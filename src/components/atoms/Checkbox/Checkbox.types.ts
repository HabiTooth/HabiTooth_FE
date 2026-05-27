export interface CheckboxProps {
  label: string | React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  bold?: boolean;
}
