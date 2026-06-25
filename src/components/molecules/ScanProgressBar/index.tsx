export default function ScanProgressBar({
  progress,
  zoneName,
  isUv = false,
}: {
  progress: number;
  zoneName: string;
  isUv?: boolean;
}) {
  const pct = Math.round(progress);
  return (
    <div className="px-4 pt-3 pb-5 bg-white flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-content">{zoneName} 스캔 중</span>
        <span className={`text-[13px] font-bold tabular-nums ${isUv ? 'text-[#A78BFA]' : 'text-primary'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2.5 bg-hairline rounded-full relative">
        <div
          className={`h-full rounded-full transition-[width] duration-300 overflow-hidden relative ${isUv ? 'bg-[#A78BFA]' : 'bg-primary-gradient'}`}
          style={{ width: `${progress}%` }}
        >
          <div className="progress-shimmer absolute inset-0" />
        </div>
        {progress > 2 && progress < 99 && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white transition-[left] duration-300
              ${isUv ? 'bg-[#A78BFA] shadow-[0_0_7px_rgba(167,139,250,0.9)]' : 'bg-primary shadow-[0_0_7px_rgba(74,134,217,0.9)]'}`}
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        )}
      </div>
    </div>
  );
}
