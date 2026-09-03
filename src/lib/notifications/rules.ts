import type { LesionType, RiskLevel } from '@/lib/api/common';
import { RISK_LABEL } from '@/lib/score';
import type { NewNotification } from './types';

const DAY_MS = 86_400_000;
const REMIND_AFTER_DAYS = 3;
const CHECKUP_INTERVAL_DAYS = 182;

export const LESION_LABEL: Record<LesionType, string> = {
  PLAQUE: '치태',
  CALCULUS: '치석',
};

const today = () => new Date().toISOString().slice(0, 10);

const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);

export function scanReminder(lastScannedAt: string | null | undefined): NewNotification | null {
  if (!lastScannedAt) return null;
  const days = daysSince(lastScannedAt);
  if (days < REMIND_AFTER_DAYS) return null;

  return {
    type: 'SCAN_REMINDER',
    title: `${days}일째 스캔 기록이 없어요`,
    body: '오늘 한 번 찍어두면 변화를 이어서 볼 수 있어요.',
    link: '/scan',
    dedupeKey: `SCAN_REMINDER:${today()}`,
  };
}

export function riskAlert(
  categories: Array<{ lesionType: LesionType; riskLevel: RiskLevel }> | undefined,
  sessionId: number | null | undefined,
): NewNotification | null {
  const worrying = categories?.filter(
    (c) => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL',
  );
  if (!worrying || worrying.length === 0) return null;

  const names = worrying.map((c) => LESION_LABEL[c.lesionType]).join('·');
  const level = worrying.some((c) => c.riskLevel === 'CRITICAL') ? 'CRITICAL' : 'HIGH';

  return {
    type: 'RISK_ALERT',
    title: `${names} 위험도가 '${RISK_LABEL[level]}'예요`,
    body: '리포트에서 어느 부위인지 확인해 보세요.',
    link: sessionId ? `/report/${sessionId}` : '/dashboard',
    dedupeKey: `RISK_ALERT:${sessionId ?? today()}`,
  };
}

export function reportReady(sessionId: number, score: number | null): NewNotification {
  return {
    type: 'REPORT_READY',
    title: '분석 리포트가 준비됐어요',
    body: score === null ? '결과를 확인해 보세요.' : `이번 스캔 점수는 ${score}점이에요.`,
    link: `/report/${sessionId}`,
    dedupeKey: `REPORT_READY:${sessionId}`,
  };
}

export function streakReached(days: number): NewNotification | null {
  if (![3, 7, 14, 30, 100].includes(days)) return null;

  return {
    type: 'STREAK',
    title: `${days}일 연속 스캔했어요`,
    body: '꾸준히 기록하면 변화가 더 잘 보여요.',
    link: '/streak',
    dedupeKey: `STREAK:${days}`,
  };
}

export function checkupDue(lastVisitAt: string | null | undefined): NewNotification | null {
  if (!lastVisitAt) return null;
  const days = daysSince(lastVisitAt);
  if (days < CHECKUP_INTERVAL_DAYS) return null;

  return {
    type: 'CHECKUP',
    title: '정기 검진 받을 때가 됐어요',
    body: `마지막 치과 방문이 ${Math.floor(days / 30)}개월 전이에요.`,
    link: '/clinics',
    dedupeKey: `CHECKUP:${today().slice(0, 7)}`,
  };
}
