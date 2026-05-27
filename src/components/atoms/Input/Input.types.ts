export interface InputProps {
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rightIcon?: React.ReactNode;
}
