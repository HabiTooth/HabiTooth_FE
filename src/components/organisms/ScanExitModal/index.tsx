export default function ScanExitModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[320px] overflow-hidden">
        <div className="px-5 pt-5 pb-4 text-center">
          <h3 className="m-0 text-[17px] font-bold text-content">스캔을 중단할까요?</h3>
          <p className="m-0 mt-1.5 text-[13px] text-muted leading-relaxed">
            지금까지 촬영한 데이터가 모두 삭제됩니다.
          </p>
        </div>
        <div className="flex border-t border-hairline">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 text-[15px] font-semibold text-primary border-r border-hairline bg-transparent"
          >
            계속 촬영
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3.5 text-[15px] font-semibold text-danger bg-transparent"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}
