import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHardwareShutter } from './useHardwareShutter';

describe('hardware shutter transfer', () => {
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  async function mount(fetcher: ReturnType<typeof vi.fn>, onError = vi.fn()) {
    vi.stubGlobal('fetch', fetcher);
    const onCapture = vi.fn();
    function Probe() {
      useHardwareShutter({ host: 'scanner.test', enabled: true, onCapture, onError });
      return null;
    }
    await act(async () => root.render(createElement(Probe)));
    return onCapture;
  }
  const json = (seq: number) => Response.json({ seq });
  const image = () => new Response('jpeg', { headers: { 'Content-Type': 'image/jpeg' } });
  async function poll(ms = 3000) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
  }

  it('does not show a connection warning for idle status polling failures', async () => {
    const onError = vi.fn();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json(0))
      .mockRejectedValueOnce(new Error('status timeout'))
      .mockResolvedValue(json(0));
    const onCapture = await mount(fetcher, onError);
    await poll();
    await poll(6000);
    await poll();
    expect(onCapture).not.toHaveBeenCalled();
    expect(onError.mock.calls.every(([message]) => message === null)).toBe(true);
  });

  it('shows a transfer notice only after repeated photo download failures', async () => {
    const onError = vi.fn();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json(0))
      .mockResolvedValueOnce(json(1))
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(json(1))
      .mockResolvedValueOnce(new Response(null, { status: 502 }));
    await mount(fetcher, onError);
    await poll();
    expect(onError.mock.calls.every(([message]) => message === null)).toBe(true);
    await poll(6000);
    expect(onError).toHaveBeenLastCalledWith('촬영한 사진을 다시 받고 있어요. 잠시만 기다려 주세요.');
  });

  it('retries a failed white frame instead of losing that shutter sequence', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json(10))
      .mockResolvedValueOnce(json(11))
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(json(11))
      .mockResolvedValueOnce(image())
      .mockResolvedValueOnce(image())
      .mockResolvedValue(json(11));
    const onCapture = await mount(fetcher);
    await poll();
    expect(onCapture).not.toHaveBeenCalled();
    await poll(6000);
    expect(onCapture).toHaveBeenCalledTimes(1);
    await poll();
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it('retains white while retrying UV so a consumed white frame is not requested twice', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json(0))
      .mockResolvedValueOnce(json(1))
      .mockResolvedValueOnce(image())
      .mockRejectedValueOnce(new Error('UV timeout'))
      .mockResolvedValueOnce(json(1))
      .mockResolvedValueOnce(image());
    const onCapture = await mount(fetcher);
    await poll();
    expect(onCapture).not.toHaveBeenCalled();
    await poll(6000);
    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls.filter(([url]) => /[?&]i=0(&|$)/.test(String(url)))).toHaveLength(1);
    expect(fetcher.mock.calls.filter(([url]) => /[?&]i=1(&|$)/.test(String(url)))).toHaveLength(2);
  });

  it('accepts new shutter sequences after the scanner counter resets on reboot', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json(50))
      .mockResolvedValueOnce(json(0))
      .mockResolvedValueOnce(json(1))
      .mockResolvedValueOnce(image())
      .mockResolvedValueOnce(image());
    const onCapture = await mount(fetcher);
    await poll();
    await poll();
    expect(onCapture).toHaveBeenCalledTimes(1);
  });
});

describe('shutter baseline', () => {
  let root: Root;
  let container: HTMLDivElement;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  const json = (seq: number) => Response.json({ seq });
  const image = () => new Response('jpeg', { headers: { 'Content-Type': 'image/jpeg' } });
  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  async function render(fetcher: ReturnType<typeof vi.fn>, enabled = true) {
    vi.stubGlobal('fetch', fetcher);
    const onCapture = vi.fn();
    const states: boolean[] = [];
    function Probe({ on }: { on: boolean }) {
      const { ready } = useHardwareShutter({ host: 'scanner.test', enabled: on, onCapture });
      states.push(ready);
      return null;
    }
    await act(async () => root.render(createElement(Probe, { on: enabled })));
    const rerender = (on: boolean) => act(async () => root.render(createElement(Probe, { on })));
    return { onCapture, states, rerender };
  }

  it('기준 요청이 성공할 때까지 연결 중으로 두고 재시도', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('blocked'))
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValue(json(28));
    const { states, onCapture } = await render(fetcher);
    expect(states.at(-1)).toBe(false);
    // 프록시 경유 여부는 모듈 상태라 재시도 두 번까지 허용
    await advance(2000);
    expect(states.at(-1)).toBe(true);
    await advance(3000);
    expect(onCapture).not.toHaveBeenCalled();
  });

  it('폴링이 실패해도 기준을 다시 잡지 않음', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json(27))
      .mockRejectedValueOnce(new TypeError('timeout'))
      .mockRejectedValueOnce(new TypeError('timeout'))
      .mockResolvedValueOnce(json(28))
      .mockResolvedValueOnce(image())
      .mockResolvedValueOnce(image())
      .mockResolvedValue(json(28));
    const { onCapture } = await render(fetcher);
    await advance(20_000);
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it('촬영 확인 화면을 닫고 다시 켜도 기준 유지', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(json(27))
      .mockResolvedValueOnce(json(27))
      .mockResolvedValueOnce(json(28))
      .mockResolvedValueOnce(image())
      .mockResolvedValueOnce(image())
      .mockResolvedValue(json(28));
    const { onCapture, rerender } = await render(fetcher);
    await advance(0);
    await rerender(false);
    await advance(5000);
    await rerender(true);
    await advance(0);
    expect(onCapture).toHaveBeenCalledTimes(1);
  });
});
