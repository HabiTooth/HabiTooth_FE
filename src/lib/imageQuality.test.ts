import { describe, expect, it } from 'vitest';
import { CAPTURE_ISSUE_TEXT, analyzePixels, type CaptureIssue } from './imageQuality';

const W = 40;
const H = 30;

/** 전체를 한 밝기로 채운다 (경계가 없으니 선명도 0) */
function flat(value: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  return data;
}

/** 체커보드로 경계를 잔뜩 만든다 (선명한 사진 대용) */
function checker(dark: number, light: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = (x + y) % 2 === 0 ? light : dark;
      const i = (y * W + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return data;
}

describe('촬영 품질 판정', () => {
  it('선명하고 밝기가 적당하면 통과한다', () => {
    const q = analyzePixels(checker(90, 190), W, H);
    expect(q.ok).toBe(true);
    expect(q.issues).toEqual([]);
  });

  it('경계가 없는 밋밋한 화면은 흔들림으로 본다', () => {
    const q = analyzePixels(flat(128), W, H);
    expect(q.issues).toContain('blurry');
    expect(q.ok).toBe(false);
  });

  it('어두우면 dark를 낸다', () => {
    const q = analyzePixels(checker(0, 20), W, H);
    expect(q.issues).toContain('dark');
  });

  it('밝으면 bright를 낸다', () => {
    const q = analyzePixels(checker(240, 255), W, H);
    expect(q.issues).toContain('bright');
  });

  it('dark와 bright가 동시에 나오지 않는다', () => {
    for (const value of [0, 40, 128, 230, 255]) {
      const q = analyzePixels(flat(value), W, H);
      const both = q.issues.includes('dark') && q.issues.includes('bright');
      expect(both).toBe(false);
    }
  });

  it('밝기는 실제 픽셀값을 따라간다', () => {
    expect(analyzePixels(flat(0), W, H).brightness).toBeCloseTo(0, 5);
    expect(analyzePixels(flat(255), W, H).brightness).toBeCloseTo(255, 0);
    expect(analyzePixels(flat(128), W, H).brightness).toBeCloseTo(128, 0);
  });

  it('대비가 클수록 선명도가 높다', () => {
    const weak = analyzePixels(checker(120, 135), W, H).sharpness;
    const strong = analyzePixels(checker(40, 220), W, H).sharpness;
    expect(strong).toBeGreaterThan(weak);
  });

  it('ok는 issues가 비었을 때만 true다', () => {
    for (const data of [flat(0), flat(128), flat(255), checker(90, 190)]) {
      const q = analyzePixels(data, W, H);
      expect(q.ok).toBe(q.issues.length === 0);
    }
  });

  it('모든 문제 유형에 안내 문구가 있다', () => {
    const issues: CaptureIssue[] = ['dark', 'bright', 'blurry'];
    for (const issue of issues) {
      expect(CAPTURE_ISSUE_TEXT[issue].label).toBeTruthy();
      expect(CAPTURE_ISSUE_TEXT[issue].hint).toBeTruthy();
    }
  });
});
