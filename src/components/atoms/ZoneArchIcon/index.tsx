import type { ViewType } from '@/lib/api/scan';

export default function ZoneArchIcon({ viewType, className = '' }: { viewType: ViewType; className?: string }) {
  const isUpper = viewType.startsWith('UPPER_');
  const isLower = viewType.startsWith('LOWER_');
  const isLeft = viewType.endsWith('_LEFT');
  const isCenter = viewType.endsWith('_CENTER');

  if (isUpper) {
    return (
      <svg width="26" height="14" viewBox="0 0 26 14" fill="none" className={className}>
        <path d="M2 13 C2 5 6 2 13 2 C20 2 24 5 24 13" stroke="#D0D8E5" strokeWidth="2" strokeLinecap="round" />
        {isLeft   && <path d="M2 13 C2 5 6 2 9 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
        {isCenter && <path d="M9 2 C11 2 13 2 17 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
        {!isLeft && !isCenter && <path d="M17 2 C20 2 24 5 24 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
      </svg>
    );
  }
  if (isLower) {
    return (
      <svg width="26" height="14" viewBox="0 0 26 14" fill="none" className={className}>
        <path d="M2 1 C2 9 6 12 13 12 C20 12 24 9 24 1" stroke="#D0D8E5" strokeWidth="2" strokeLinecap="round" />
        {isLeft   && <path d="M2 1 C2 9 6 12 9 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
        {isCenter && <path d="M9 12 C11 12 13 12 17 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
        {!isLeft && !isCenter && <path d="M17 12 C20 12 24 9 24 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
      </svg>
    );
  }
  return (
    <svg width="26" height="10" viewBox="0 0 26 10" fill="none" className={className}>
      <rect x="1" y="3" width="24" height="4" rx="2" stroke="#D0D8E5" strokeWidth="1.5" />
      {isLeft   && <rect x="1" y="3" width="8" height="4" rx="2" stroke="currentColor" strokeWidth="2" />}
      {isCenter && <rect x="9" y="3" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" />}
      {!isLeft && !isCenter && <rect x="17" y="3" width="8" height="4" rx="2" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );
}
