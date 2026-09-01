export interface LocalNotificationSettings {
  push: boolean;
  report: boolean;
}

const KEY = 'habitooth.notificationSettings';
const DEFAULTS: LocalNotificationSettings = { push: true, report: true };

export function readSettings(): LocalNotificationSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as LocalNotificationSettings) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function writeSettings(next: LocalNotificationSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
  }
}
