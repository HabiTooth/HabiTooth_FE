import { beforeEach, describe, expect, it } from 'vitest';
import { useNotificationStore } from './notificationStore';
import type { NewNotification } from '@/lib/notifications/types';

const reminder = (dedupeKey = 'SCAN_REMINDER:2026-09-01'): NewNotification => ({
  type: 'SCAN_REMINDER',
  title: '스캔한 지 3일 됐어요',
  body: '오늘 한 번 찍어보세요.',
  link: '/scan',
  dedupeKey,
});

const store = () => useNotificationStore.getState();

beforeEach(() => {
  localStorage.clear();
  useNotificationStore.setState({ items: [], hydrated: false });
});

describe('알림 쌓기', () => {
  it('밀어 넣으면 목록에 들어간다', () => {
    store().push(reminder());
    expect(store().items).toHaveLength(1);
    expect(store().items[0].read).toBe(false);
  });

  it('같은 키는 두 번 안 쌓인다', () => {
    store().push(reminder());
    store().push(reminder());
    expect(store().items).toHaveLength(1);
  });

  it('키가 다르면 따로 쌓인다', () => {
    store().push(reminder('SCAN_REMINDER:2026-09-01'));
    store().push(reminder('SCAN_REMINDER:2026-09-02'));
    expect(store().items).toHaveLength(2);
  });

  it('최신이 위로 온다', () => {
    store().push({ ...reminder('a'), title: '먼저' });
    store().push({ ...reminder('b'), title: '나중' });
    expect(store().items[0].title).toBe('나중');
  });
});

describe('지운 알림이 되살아나지 않는다', () => {
  it('삭제한 뒤 같은 알림을 다시 밀어도 안 생긴다', () => {
    store().push(reminder());
    store().remove(store().items[0].id);
    expect(store().items).toHaveLength(0);

    store().push(reminder());
    expect(store().items).toHaveLength(0);
  });

  it('전체 삭제 뒤에도 안 생긴다', () => {
    store().push(reminder('a'));
    store().push(reminder('b'));
    store().clearAll();

    store().push(reminder('a'));
    store().push(reminder('b'));
    expect(store().items).toHaveLength(0);
  });

  it('reset하면 다시 받을 수 있다', () => {
    store().push(reminder());
    store().reset();
    store().push(reminder());
    expect(store().items).toHaveLength(1);
  });

  it('발생 이력은 새로고침해도 남는다', () => {
    store().push(reminder());
    store().remove(store().items[0].id);

    useNotificationStore.setState({ items: [], hydrated: false });
    store().hydrate();
    store().push(reminder());

    expect(store().items).toHaveLength(0);
  });
});

describe('하이드레이트 전에 손대도 안전하다', () => {
  const refresh = () => useNotificationStore.setState({ items: [], hydrated: false });

  it('하나 지워도 나머지는 남는다', () => {
    store().push(reminder('a'));
    store().push(reminder('b'));
    store().push(reminder('c'));
    refresh();

    store().remove('b');
    expect(store().items.map((n) => n.id)).toEqual(['c', 'a']);
  });

  it('읽음 처리가 목록을 지우지 않는다', () => {
    store().push(reminder('a'));
    store().push(reminder('b'));
    refresh();

    store().markRead('a');
    expect(store().items).toHaveLength(2);
    expect(store().items.find((n) => n.id === 'a')?.read).toBe(true);
    expect(store().items.find((n) => n.id === 'b')?.read).toBe(false);
  });

  it('모두 읽음도 목록을 지우지 않는다', () => {
    store().push(reminder('a'));
    store().push(reminder('b'));
    refresh();

    store().markAllRead();
    expect(store().items).toHaveLength(2);
  });
});

describe('읽음 처리', () => {
  it('하나만 읽음으로 바꾼다', () => {
    store().push(reminder('a'));
    store().push(reminder('b'));
    store().markRead(store().items[0].id);

    expect(store().items.filter((n) => n.read)).toHaveLength(1);
  });

  it('모두 읽음은 전부 바꾼다', () => {
    store().push(reminder('a'));
    store().push(reminder('b'));
    store().markAllRead();

    expect(store().items.every((n) => n.read)).toBe(true);
  });

  it('읽음 상태는 저장소에 남는다', () => {
    store().push(reminder());
    store().markAllRead();

    useNotificationStore.setState({ items: [], hydrated: false });
    store().hydrate();
    expect(store().items[0].read).toBe(true);
  });
});

describe('설정에 따른 차단', () => {
  it('푸시를 끄면 아무것도 안 쌓인다', () => {
    localStorage.setItem(
      'habitooth.notificationSettings',
      JSON.stringify({ push: false, report: true }),
    );
    store().push(reminder());
    expect(store().items).toHaveLength(0);
  });

  it('리포트 알림만 끄면 다른 알림은 들어온다', () => {
    localStorage.setItem(
      'habitooth.notificationSettings',
      JSON.stringify({ push: true, report: false }),
    );
    store().push({ ...reminder(), type: 'REPORT_READY', dedupeKey: 'REPORT_READY:1' });
    expect(store().items).toHaveLength(0);

    store().push(reminder());
    expect(store().items).toHaveLength(1);
  });
});
