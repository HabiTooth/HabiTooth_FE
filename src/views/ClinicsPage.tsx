'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Crosshair, ExternalLink, LocateFixed, Loader2, MapPin, Phone } from 'lucide-react';
import NavBar from '@/components/organisms/NavBar';
import PageShell from '@/components/organisms/PageShell';
import { useCurrentPosition, useKakaoMaps } from '@/hooks/useKakaoMaps';

const RADIUS_M = 3000;
const RESULT_SIZE = 15;

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;
  url: string;
  lat: number;
  lng: number;
}

const formatDistance = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);

function markMe(map: kakao.maps.Map, position: kakao.maps.LatLng) {
  const dot = document.createElement('div');
  dot.className = 'map-me';
  dot.setAttribute('aria-label', '현재 위치');

  return new kakao.maps.CustomOverlay({
    position,
    content: dot,
    map,
    yAnchor: 0.5,
    zIndex: 10,
  });
}

export default function ClinicsPage() {
  const router = useRouter();
  const mapsStatus = useKakaoMaps();
  const { coords, exact, pending, refresh } = useCurrentPosition();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<kakao.maps.Map | null>(null);
  const markers = useRef<kakao.maps.Marker[]>([]);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const meMarker = useRef<kakao.maps.CustomOverlay | null>(null);

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const focus = useCallback((clinic: Pick<Clinic, 'id' | 'lat' | 'lng'>, scroll: boolean) => {
    setSelected(clinic.id);
    mapInstance.current?.setCenter(new kakao.maps.LatLng(clinic.lat, clinic.lng));
    mapInstance.current?.setLevel(3);
    if (scroll) {
      cardRefs.current.get(clinic.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    if (mapsStatus !== 'ready' || pending || !mapRef.current || mapInstance.current) return;

    const center = new kakao.maps.LatLng(coords.lat, coords.lng);
    mapInstance.current = new kakao.maps.Map(mapRef.current, { center, level: 5 });

    meMarker.current = markMe(mapInstance.current, center);

    setSearching(true);
    new kakao.maps.services.Places().keywordSearch(
      '치과',
      (data, status) => {
        setSearching(false);

        if (status === kakao.maps.services.Status.ZERO_RESULT) {
          setSearchError('주변에 검색된 치과가 없어요. 지도를 움직여 다시 찾아보세요.');
          return;
        }
        if (status !== kakao.maps.services.Status.OK) {
          setSearchError('검색에 실패했어요. 잠시 후 다시 시도해 주세요.');
          return;
        }

        const found = data
          .filter((place) => place.category_name.includes('치과'))
          .map((place) => ({
          id: place.id,
          name: place.place_name,
          address: place.road_address_name || place.address_name,
          phone: place.phone,
          distance: Number(place.distance) || 0,
          url: place.place_url,
          lat: Number(place.y),
          lng: Number(place.x),
        }));

        if (found.length === 0) {
          setSearchError('주변에 검색된 치과가 없어요. 지도를 움직여 다시 찾아보세요.');
          return;
        }

        setClinics(found);

        const bounds = new kakao.maps.LatLngBounds();
        bounds.extend(center);

        markers.current.forEach((m) => m.setMap(null));
        markers.current = found.map((clinic) => {
          const position = new kakao.maps.LatLng(clinic.lat, clinic.lng);
          bounds.extend(position);
          const marker = new kakao.maps.Marker({
            position,
            map: mapInstance.current!,
            title: clinic.name,
          });
          kakao.maps.event.addListener(marker, 'click', () => focus(clinic, true));
          return marker;
        });

        if (!bounds.isEmpty()) mapInstance.current!.setBounds(bounds);
      },
      { location: center, radius: RADIUS_M, sort: 'distance', size: RESULT_SIZE },
    );
  }, [mapsStatus, pending, coords, focus]);

  const [locating, setLocating] = useState(false);

  const goToMe = async () => {
    if (locating) return;
    setLocating(true);
    const next = await refresh();
    setLocating(false);

    const position = new kakao.maps.LatLng(next.lat, next.lng);
    meMarker.current?.setMap(null);
    if (mapInstance.current) {
      meMarker.current = markMe(mapInstance.current, position);
      mapInstance.current.setCenter(position);
      mapInstance.current.setLevel(4);
    }
    setSelected(null);
  };

  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  const notice =
    mapsStatus === 'no-key'
      ? {
          title: '지도 키가 아직 없어요',
          lines: ['.env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 넣고 개발 서버를 다시 켜 주세요.'],
        }
      : mapsStatus === 'failed'
        ? {
            title: '카카오가 이 주소를 거절했어요',
            lines: [
              `현재 주소: ${origin}`,
              '카카오 개발자센터 > 내 애플리케이션 > 플랫폼 > Web 에 이 주소를 그대로 등록해 주세요.',
              '앱 키는 REST 키 말고 JavaScript 키여야 해요.',
            ],
          }
        : mapsStatus === 'timeout'
          ? {
              title: '지도 응답이 없어요',
              lines: ['네트워크를 확인하고 새로고침해 주세요.'],
            }
          : null;

  return (
    <PageShell fill>
      <div className="flex-shrink-0 flex items-center px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-hairline">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-hairline transition-colors"
        >
          <ChevronLeft size={20} className="text-content" />
        </button>
        <span className="flex-1 text-center text-[15px] font-semibold text-content">
          근처 치과
        </span>
        <div className="w-9" />
      </div>

      {notice !== null ? (
        <div className="px-5 pt-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-[20px] shadow-card p-6">
            <MapPin size={24} className="text-muted mx-auto mb-2 block" />
            <p className="m-0 mb-2 text-[13px] font-semibold text-content text-center">
              {notice.title}
            </p>
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
              {notice.lines.map((line) => (
                <li
                  key={line}
                  className="text-[11.5px] text-muted leading-relaxed break-all bg-hairline/40 rounded-lg px-3 py-2"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-shrink-0 px-5 pt-4 pb-2">
            {!exact && !pending && (
              <div className="flex items-start gap-2 px-1 mb-2">
                <Crosshair size={13} className="text-muted flex-shrink-0 mt-0.5" />
                <p className="m-0 text-[11px] text-muted leading-relaxed">
                  위치 권한이 없어 서울시청 기준으로 찾았어요. 지도를 움직여 주변을 확인해 보세요.
                </p>
              </div>
            )}

            <div className="relative rounded-[20px] overflow-hidden shadow-card bg-white">
              <div ref={mapRef} className="w-full h-[260px]" />
              <button
                type="button"
                onClick={goToMe}
                aria-label="현 위치로"
                className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-card border border-hairline flex items-center justify-center transition-transform active:scale-95"
              >
                {locating ? (
                  <Loader2 size={17} className="animate-spin text-primary" />
                ) : (
                  <LocateFixed size={17} className="text-primary" />
                )}
              </button>
            </div>
          </div>

          <div className="thin-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-2 pb-4">
            {(searching || pending) && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-[12px] text-muted">
                  {pending ? '위치를 확인하고 있어요' : '주변 치과를 찾고 있어요'}
                </span>
              </div>
            )}

            {searchError && <p className="m-0 px-1 py-2 text-[12px] text-muted">{searchError}</p>}

            <div className="flex flex-col gap-2">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(clinic.id, el);
                    else cardRefs.current.delete(clinic.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => focus(clinic, false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') focus(clinic, false);
                  }}
                  className={`bg-white rounded-[18px] p-4 cursor-pointer transition-all ${
                    selected === clinic.id
                      ? 'ring-2 ring-primary shadow-button scale-[1.01]'
                      : 'shadow-card active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`m-0 text-[14px] font-bold truncate ${
                        selected === clinic.id ? 'text-primary' : 'text-content'
                      }`}
                    >
                      {clinic.name}
                    </p>
                    {clinic.distance > 0 && (
                      <span className="text-[11px] text-primary font-semibold flex-shrink-0 tabular-nums">
                        {formatDistance(clinic.distance)}
                      </span>
                    )}
                  </div>
                  <p className="m-0 mt-1 text-[11.5px] text-muted leading-relaxed">
                    {clinic.address}
                  </p>

                  <div className="flex items-center gap-2 mt-2.5">
                    {clinic.phone && (
                      <a
                        href={`tel:${clinic.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary-light text-[11px] font-semibold text-primary no-underline"
                      >
                        <Phone size={11} />
                        {clinic.phone}
                      </a>
                    )}
                    <a
                      href={clinic.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-hairline text-[11px] font-medium text-muted no-underline"
                    >
                      <ExternalLink size={11} />
                      상세
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {clinics.length > 0 && (
              <p className="m-0 mt-3 px-1 text-[10px] text-muted leading-relaxed">
                카카오맵 장소 검색 결과예요. 진료 과목과 진료 시간은 각 병원에 확인해 주세요.
              </p>
            )}
          </div>
        </>
      )}

      <NavBar activeTab="home" />
    </PageShell>
  );
}
