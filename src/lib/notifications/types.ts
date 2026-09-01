export type NotificationType =
  | 'REPORT_READY'
  | 'SCAN_REMINDER'
  | 'RISK_ALERT'
  | 'STREAK'
  | 'CHECKUP';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

export type NewNotification = Omit<AppNotification, 'id' | 'createdAt' | 'read'> & {
  // 같은 키가 이미 있으면 다시 쌓지 않음
  dedupeKey?: string;
};
