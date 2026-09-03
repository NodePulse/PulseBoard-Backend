// notification-type.enum.ts
export enum NotificationType {
  TRANSACTION_ALERT = 'transaction_alert',
  SECURITY_ALERT = 'security_alert',
  ACCOUNT_UPDATE = 'account_update',
  PROMOTIONAL = 'promotional',
  WORKSPACE_INVITE = 'workspace_invite',
  PROJECT_UPDATE = 'project_update',
  TASK_ASSIGNED = 'task_assigned',
  MENTION = 'mention',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}
