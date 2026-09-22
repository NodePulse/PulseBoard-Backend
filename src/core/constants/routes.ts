export const API_ROUTES = {
  AUTH: {
    ROOT: 'auth',
    REGISTER: 'register',
    LOGIN: 'login',
    LOGOUT: 'logout',
    REFRESH: 'refresh',
    SESSIONS: 'sessions',
    VERIFY: 'verify',
    SEND_VERIFICATION: 'send-verification',
    ME: 'me',
    CSRF_TOKEN: 'csrf-token',
    RESET_PASSWORD: 'reset-password',
  },
  TENANTS: {
    ROOT: 'tenants',
    CREATE_ORGANIZATION: 'create-organization',
    GET_ORGANIZATION: 'current-organization',
  },
  USERS: {
    ROOT: 'users',
    CHANGE_PASSWORD: 'change-password',
    ADD_MFA: 'add-mfa',
  },
  HEALTH: {
    ROOT: 'health',
  },
  NOTIFICATIONS: {
    ROOT: 'notifications',
    MARK_READ: ':id/read',
    PREFERENCES: 'preferences',
  },
  PAYMENTS: {
    ROOT: 'payments',
    CREATE_PAYMENT_ORDER: 'create-payment-order',
    COMPLETE_PAYMENT_ORDER: 'complete-payment-order',
  },
  SUBSCRIPTIONS: {
    ROOT: 'subscriptions',
    ACTIVE: 'active',
  },
};
