export default function ToothIcon({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M32 4C24 4 14 8 14 18C14 24 16 28 16 34C16 44 18 60 24 60C28 60 28 52 32 52C36 52 36 60 40 60C46 60 48 44 48 34C48 28 50 24 50 18C50 8 40 4 32 4Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 14C22 14 26 20 32 20C38 20 42 14 42 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
