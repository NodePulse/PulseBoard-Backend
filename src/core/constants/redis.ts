export const REDIS_KEYS = {
  OTP: (email: string) => `otp:${email}`,
  PASSWORD_RESET_OTP: (email: string) => `password_reset_otp:${email}`,
  CSRF: (userId: string) => `csrf:${userId}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USER_SESSIONS: (userId: string) => `user_sessions:${userId}`,
};
