'use client';

import { useEffect, useRef } from 'react';

const POLL_MS = 1200;

interface Pending {
  seq: number;
}

/**
 * 기기 셔터 버튼 감시. seq가 오르면 기기가 들고 있는 컷을 가져온다.
 * 안 가져가면 기기가 촬영 상태에 머물러서 스트림이 멈춘 채로 있는다.
 */
export function useHardwareShutter({
  host,
  enabled,
  onCapture,
}: {
  host: string | null;
  enabled: boolean;
  onCapture: (blob: Blob) => void;
}) {
  const lastSeq = useRef<number | null>(null);
  const onCaptureRef = useRef(onCapture);

  useEffect(() => {
    onCaptureRef.current = onCapture;
  });

  useEffect(() => {
    if (!host || !enabled) return;

    let alive = true;
    let busy = false;

    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const res = await fetch(`/api/camera/pending?ip=${host}`);
        if (!res.ok) return;

        const { seq } = (await res.json()) as Pending;
        if (typeof seq !== 'number') return;

        // 붙자마자 들어있던 예전 컷을 촬영으로 오해하지 않게 첫 값은 기준점으로만 씀
        if (lastSeq.current === null) {
          lastSeq.current = seq;
          return;
        }
        if (seq <= lastSeq.current) return;
        lastSeq.current = seq;

        // 0번이 백색광, 1번이 UV. 지금은 백색광만 분석에 씀
        const image = await fetch(`/api/camera/pending?ip=${host}&i=0`);
        if (!image.ok || !alive) return;

        onCaptureRef.current(await image.blob());
      } catch {
        // 다음 폴에서 다시
      } finally {
        busy = false;
      }
    };

    const id = setInterval(tick, POLL_MS);
    tick();

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [host, enabled]);
}
