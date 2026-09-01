export type CaptureIssue = 'dark' | 'bright' | 'blurry';

export interface CaptureQuality {
  ok: boolean;
  issues: CaptureIssue[];
  brightness: number;
  sharpness: number;
}

// 실시간 배너와 공유
export const DARK_THRESHOLD = 60;
export const BRIGHT_THRESHOLD = 228;
const SHARPNESS_THRESHOLD = 55;

const SAMPLE_W = 160;
const SAMPLE_H = 120;

export const CAPTURE_ISSUE_TEXT: Record<CaptureIssue, { label: string; hint: string }> = {
  dark: { label: '너무 어두워요', hint: '조명을 켜거나 카메라를 조금 떨어뜨려 주세요.' },
  bright: { label: '빛이 너무 반사됐어요', hint: '각도를 살짝 틀어 반사를 피해 주세요.' },
  blurry: { label: '흔들리거나 초점이 안 맞았어요', hint: '카메라를 고정하고 다시 찍어 주세요.' },
};

// 판정 불가 시 통과 처리
const UNJUDGED: CaptureQuality = { ok: true, issues: [], brightness: 128, sharpness: 999 };

export async function evaluateCaptureBlob(blob: Blob): Promise<CaptureQuality> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return UNJUDGED;
  }
  try {
    return evaluateCapture(bitmap);
  } finally {
    bitmap.close();
  }
}

// 가중 평균
export function meanLuma(data: Uint8ClampedArray): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (data.length / 4);
}

export function analyzePixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): CaptureQuality {
  const gray = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[p] = g;
    sum += g;
  }
  const brightness = sum / gray.length;

  let lapSum = 0;
  let lapSqSum = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - width] - gray[i + width];
      lapSum += lap;
      lapSqSum += lap * lap;
      count++;
    }
  }
  const mean = lapSum / count;
  const sharpness = lapSqSum / count - mean * mean;

  const issues: CaptureIssue[] = [];
  if (brightness < DARK_THRESHOLD) issues.push('dark');
  else if (brightness > BRIGHT_THRESHOLD) issues.push('bright');
  if (sharpness < SHARPNESS_THRESHOLD) issues.push('blurry');

  return { ok: issues.length === 0, issues, brightness, sharpness };
}

export function evaluateCapture(source: CanvasImageSource): CaptureQuality {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_W;
  canvas.height = SAMPLE_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return UNJUDGED;

  try {
    ctx.drawImage(source, 0, 0, SAMPLE_W, SAMPLE_H);
    return analyzePixels(ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data, SAMPLE_W, SAMPLE_H);
  } catch {
    return UNJUDGED;
  }
}
