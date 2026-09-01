import type { ReactNode } from 'react';

export default function PageShell({
  children,
  className = '',
  withNav = false,
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  withNav?: boolean;
  fill?: boolean;
}) {
  const inner = fill
    ? 'h-svh flex flex-col pb-16'
    : withNav
      ? 'pb-28'
      : 'pb-10';

  return (
    <div
      className={`max-w-[430px] mx-auto bg-background relative ${fill ? 'h-svh overflow-hidden' : 'min-h-svh'} ${className}`}
    >
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className={`relative z-10 ${inner}`}>{children}</div>
    </div>
  );
}
