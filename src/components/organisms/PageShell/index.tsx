import type { ReactNode } from 'react';

export default function PageShell({
  children,
  className = '',
  withNav = false,
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  /** 하단 NavBar가 fixed라 그만큼 자리를 비워둠 */
  withNav?: boolean;
  /** 페이지 전체 대신 안쪽 영역만 스크롤시킬 때 */
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
