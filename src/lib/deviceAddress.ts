// 기기 주소는 페어링 때 localStorage에 저장하는데, DHCP로 IP가 바뀌면 그대로 죽는다.
// env에 주소(보통 mDNS 이름)를 박아두면 그쪽을 먼저 쓴다.
export const CONFIGURED_HOST = (process.env.NEXT_PUBLIC_ESP32_HOST ?? '').trim();

/** 스트림은 81, 제어·촬영은 80 */
export const withStreamPort = (host: string) => (host.includes(':') ? host : `${host}:81`);

export const controlHost = (address: string) => address.split(':')[0];

export function deviceAddress(storedIp: string | null | undefined): string | null {
  if (CONFIGURED_HOST) return withStreamPort(CONFIGURED_HOST);
  return storedIp ? withStreamPort(storedIp) : null;
}

export const streamUrl = (address: string) => `http://${address}/stream`;
