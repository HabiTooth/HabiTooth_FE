'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Monitor, Smartphone, Trash2 } from 'lucide-react';
import PageShell from '@/components/organisms/PageShell';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api/user';
import type { DeviceStatusResponse } from '@/lib/api/device';
import {
  clearWebcamPreference,
  readWebcamPreference,
  writeWebcamPreference,
} from '@/lib/cameraSource';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        on ? 'bg-primary' : 'bg-hairline'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function DeviceSettingsPage() {
  const router = useRouter();
  const { deviceIp, clearDevice } = useAuthStore();
  const [device, setDevice] = useState<DeviceStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [useWebcam, setUseWebcam] = useState(false);

  useEffect(() => {
    setUseWebcam(readWebcamPreference(Boolean(deviceIp)));

    userApi
      .getDeviceStatus()
      .then((res) => setDevice(res.data.result?.[0] ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceIp]);

  const toggleWebcam = () => {
    const next = !useWebcam;
    setUseWebcam(next);
    writeWebcamPreference(next);
  };

  const disconnect = () => {
    clearDevice();
    clearWebcamPreference();
    router.push('/pairing');
  };

  return (
    <PageShell>
      <div className="flex items-center px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-hairline">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-content">
          디바이스 설정
        </span>
        <div className="w-9" />
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
              <Smartphone size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[14px] font-semibold text-content">
                {loading ? '불러오는 중...' : (device?.modelName ?? '연결된 스캐너 없음')}
              </p>
              <p className="m-0 text-[11px] text-muted">
                {deviceIp ? `주소 ${deviceIp}` : '페어링하면 여기에 표시돼요'}
              </p>
            </div>
            {loading && <Loader2 size={16} className="animate-spin text-primary" />}
          </div>

          {device !== null && (
            <div className="flex flex-col gap-0.5 pt-3 border-t border-dashed border-hairline">
              <p className="m-0 text-[11px] text-muted">일련번호 {device.serialNumber}</p>
              <p className="m-0 text-[11px] text-muted">펌웨어 {device.firmwareVersion}</p>
              <p className="m-0 text-[11px] text-muted">
                {device.connected ? '연결됨' : '연결 끊김'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
              <Monitor size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[13px] font-semibold text-content">웹캠으로 촬영</p>
              <p className="m-0 text-[11px] text-muted">
                스캐너 대신 이 기기 카메라로 찍어요
              </p>
            </div>
            <Toggle on={useWebcam} onToggle={toggleWebcam} />
          </div>

          {useWebcam && deviceIp && (
            <p className="m-0 mt-3 pt-3 border-t border-dashed border-hairline text-[11px] text-muted leading-relaxed">
              스캐너가 연결돼 있는데도 웹캠을 쓰고 있어요. 스캐너로 찍으려면 이 설정을 꺼 주세요.
            </p>
          )}
        </div>

        {deviceIp && (
          <button
            type="button"
            onClick={disconnect}
            className="w-full py-4 rounded-[14px] bg-white/90 backdrop-blur-sm shadow-card border border-hairline flex items-center justify-center gap-2 text-[13px] font-semibold text-danger"
          >
            <Trash2 size={15} />
            연결 해제하고 다시 등록
          </button>
        )}

        <p className="m-0 px-1 text-[10px] text-muted leading-relaxed">
          연결을 해제하면 이 기기에 저장된 스캐너 정보와 촬영 설정이 지워지고 등록 화면으로
          넘어가요. 계정과 스캔 기록은 그대로예요.
        </p>
      </div>
    </PageShell>
  );
}
