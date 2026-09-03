import { X } from 'lucide-react';
import { SCAN_STATUS, SCAN_STATUS_ORDER } from '@/constants/scanStatus';

export default function ScanHelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-2xl w-full max-w-[430px] pb-8">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-hairline rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 border-b border-hairline">
          <span className="text-[16px] font-bold text-content">상태 안내</span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-hairline"
          >
            <X size={16} className="text-content" />
          </button>
        </div>
        <div className="px-5 pt-4 flex flex-col gap-4">
          {SCAN_STATUS_ORDER.map((status) => {
            const { Icon, textColor, label, sub } = SCAN_STATUS[status];
            return (
              <div key={status} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-hairline flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className={textColor} />
                </div>
                <div>
                  <p className="m-0 text-[13px] font-semibold text-content">{label}</p>
                  <p className="m-0 text-[12px] text-muted mt-0.5">{sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
