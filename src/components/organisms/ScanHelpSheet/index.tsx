import { X, CheckCircle2, XCircle, AlertTriangle, Sun } from 'lucide-react';

const ITEMS = [
  { icon: <CheckCircle2 size={16} className="text-success" />, label: '잘 찍히고 있어요', desc: '적절한 거리와 조명, 안정적인 상태입니다.' },
  { icon: <XCircle size={16} className="text-danger" />, label: '너무 멀어요 / 가까워요', desc: '카메라와 치아 사이 거리를 조절해 주세요.' },
  { icon: <AlertTriangle size={16} className="text-danger" />, label: '흔들림이 감지됐어요', desc: '카메라를 안정적으로 유지해 주세요.' },
  { icon: <Sun size={16} className="text-warning" />, label: '조명이 부족해요', desc: '조명을 밝게 하거나 그림자를 제거해 주세요.' },
  { icon: <CheckCircle2 size={16} className="text-primary" />, label: '스캔 범위가 충분해요', desc: '거의 다 스캔되었어요! 마무리해 주세요.' },
];

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
          {ITEMS.map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-hairline flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="m-0 text-[13px] font-semibold text-content">{label}</p>
                <p className="m-0 text-[12px] text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
