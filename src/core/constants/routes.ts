export const API_ROUTES = {
  AUTH: {
    ROOT: 'auth',
    REGISTER: 'register',
    LOGIN: 'login',
    LOGOUT: 'logout',
    REFRESH: 'refresh',
    SESSIONS: 'sessions',
    VERIFY_MAGIC: 'verify/magic',
    VERIFY_OTP: 'verify/otp',
    RESEND_VERIFICATION: 'resend-verification',
    ME: 'me',
    CSRF_TOKEN: 'csrf-token',
  },
  TENANTS: {
    ROOT: 'tenants',
    CREATE_ORGANIZATION: 'create-organization',
    GET_ORGANIZATION: 'current-organization',
  },
  USERS: {
    ROOT: 'users',
  },
};
