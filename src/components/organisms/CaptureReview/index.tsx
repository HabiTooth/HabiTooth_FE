'use client';

import { RotateCcw, ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { CAPTURE_ISSUE_TEXT, type CaptureQuality } from '@/lib/imageQuality';

export default function CaptureReview({
  previewUrl,
  quality,
  zoneLabel,
  isUploading,
  uploadError,
  confirmLabel,
  onRetake,
  onConfirm,
}: {
  previewUrl: string;
  quality: CaptureQuality;
  zoneLabel: string;
  isUploading: boolean;
  uploadError: string | null;
  confirmLabel: string;
  onRetake: () => void;
  onConfirm: () => void;
}) {
  const problem = quality.issues[0];

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black">
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {/* 검은 여백 대신 같은 사진을 흐리게 깔아 채운다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-70"
        />
        {/* 촬영본은 잘라 보여주면 확인이 안 되므로 contain */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={`${zoneLabel} 촬영본`}
          className="absolute inset-0 w-full h-full object-contain"
        />

        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-semibold">
            {zoneLabel}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white rounded-t-[20px] px-4 pt-3.5 pb-4 flex flex-col gap-3">
        {problem ? (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-warning/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={15} className="text-warning" />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[13px] font-bold text-content">{CAPTURE_ISSUE_TEXT[problem].label}</p>
              <p className="m-0 mt-0.5 text-[12px] text-muted leading-snug">
                {CAPTURE_ISSUE_TEXT[problem].hint}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={15} className="text-success" />
            </div>
            <div className="min-w-0">
              <p className="m-0 text-[13px] font-bold text-content">잘 찍혔어요</p>
              <p className="m-0 mt-0.5 text-[12px] text-muted leading-snug">
                다음으로 넘어가면 이 사진이 저장돼요.
              </p>
            </div>
          </div>
        )}

        {uploadError && (
          <p className="m-0 text-[12px] text-danger font-medium leading-snug">{uploadError}</p>
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRetake}
            disabled={isUploading}
            className="flex-1 h-12 rounded-[14px] border-[1.5px] border-hairline bg-white
              flex items-center justify-center gap-1.5 text-[14px] font-semibold text-content disabled:opacity-40"
          >
            <RotateCcw size={16} />
            다시 찍기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isUploading}
            className={`flex-1 h-12 rounded-[14px] text-white text-[14px] font-semibold
              flex items-center justify-center gap-1.5 disabled:opacity-60
              ${problem ? 'bg-muted' : 'bg-primary-gradient shadow-button'}`}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                저장 중
              </>
            ) : (
              <>
                {confirmLabel}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
