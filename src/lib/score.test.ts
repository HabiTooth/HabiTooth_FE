import { describe, expect, it } from 'vitest';
import type { RiskLevel } from '@/lib/api/common';
import {
  RISK_LABEL,
  formatDate,
  formatDateTime,
  formatShortDate,
  formatTime,
  scoreGrade,
  scoreStatus,
  toSummaryRisk,
} from './score';

const ALL_RISK: RiskLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

describe('점수 등급', () => {
  it('구간 경계가 맞다', () => {
    expect(scoreGrade(90)).toBe('A');
    expect(scoreGrade(89)).toBe('B');
    expect(scoreGrade(80)).toBe('B');
    expect(scoreGrade(79)).toBe('C');
    expect(scoreGrade(70)).toBe('C');
    expect(scoreGrade(69)).toBe('D');
    expect(scoreGrade(60)).toBe('D');
    expect(scoreGrade(59)).toBe('F');
  });

  it('0점과 100점도 등급이 나온다', () => {
    expect(scoreGrade(0)).toBe('F');
    expect(scoreGrade(100)).toBe('A');
  });

  it('점수가 높을수록 등급이 나빠지지 않는다', () => {
    const order = ['F', 'D', 'C', 'B', 'A'];
    for (let n = 1; n <= 100; n++) {
      expect(order.indexOf(scoreGrade(n))).toBeGreaterThanOrEqual(order.indexOf(scoreGrade(n - 1)));
    }
  });
});

describe('점수 문구', () => {
  it('구간마다 다른 문구를 준다', () => {
    const texts = [scoreStatus(95), scoreStatus(85), scoreStatus(75), scoreStatus(50)];
    expect(new Set(texts).size).toBe(4);
  });

  it('빈 문자열을 주지 않는다', () => {
    for (let n = 0; n <= 100; n += 5) {
      expect(scoreStatus(n)).not.toBe('');
    }
  });
});

describe('위험도 변환', () => {
  it('BE 5단계를 전부 처리한다', () => {
    for (const level of ALL_RISK) {
      expect(toSummaryRisk(level)).toBeDefined();
      expect(RISK_LABEL[level]).toBeTruthy();
    }
  });

  it('위험할수록 높은 등급으로 간다', () => {
    expect(toSummaryRisk('VERY_LOW')).toBe('low');
    expect(toSummaryRisk('LOW')).toBe('low');
    expect(toSummaryRisk('MEDIUM')).toBe('normal');
    expect(toSummaryRisk('HIGH')).toBe('high');
    expect(toSummaryRisk('CRITICAL')).toBe('very-high');
  });
});

describe('날짜 포맷', () => {
  it('날짜와 시각을 함께 표시한다', () => {
    expect(formatDateTime('2026-08-31T21:23:05')).toBe('2026.08.31 21:23');
  });

  it('시각이 없어도 날짜만 낸다', () => {
    expect(formatDateTime('2026-08-31')).toBe('2026.08.31');
  });

  it('날짜만 뽑는다', () => {
    expect(formatDate('2026-08-31T21:23:05')).toBe('2026.08.31');
    expect(formatDate('2026-08-31')).toBe('2026.08.31');
  });

  it('짧은 날짜는 월/일로 준다', () => {
    expect(formatShortDate('2026-08-31')).toBe('8/31');
    expect(formatShortDate('2026-12-05')).toBe('12/05');
  });

  it('시각은 분까지만 자른다', () => {
    expect(formatTime('21:23:05')).toBe('21:23');
    expect(formatTime('09:05:00')).toBe('09:05');
  });

  // BE가 기록 없을 때 null을 주므로 여기서 터지면 화면이 죽는다
  it('null과 undefined를 받아도 터지지 않는다', () => {
    for (const fn of [formatDateTime, formatDate, formatShortDate, formatTime]) {
      expect(fn(null)).toBe('');
      expect(fn(undefined)).toBe('');
      expect(fn('')).toBe('');
    }
  });
});
