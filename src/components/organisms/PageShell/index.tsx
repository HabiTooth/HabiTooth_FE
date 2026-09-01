import type { ReactNode } from 'react';

export default function PageShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-[430px] min-h-svh mx-auto bg-background relative ${className}`}>
      <div className="aurora-blob-1" />
      <div className="aurora-blob-2" />
      <div className="aurora-blob-3" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
