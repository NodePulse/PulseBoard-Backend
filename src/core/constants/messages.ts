export const RESPONSE_MESSAGES = {
  SUCCESS: 'Request successful',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  CONFLICT_EMAIL: 'Email is already registered',
  USER_NOT_FOUND: 'User not found',
  FREE_PLAN_RESTRICTION: 'Users on the Free plan are not allowed to create tenants. Please upgrade your plan.',
  TENANT_SLUG_CONFLICT: 'Tenant slug is already taken',
  HEADER_REQUIRED: 'x-user-id header is required for identification',
  USER_REGISTERED: 'User registered successfully',
  TENANT_CREATED: 'Tenant created successfully',
  EMAIL_NOT_VERIFIED: 'Your email is not verified.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  VERIFICATION_EXPIRED: 'Verification token or OTP has expired.',
  VERIFICATION_INVALID: 'Invalid verification token or OTP.',
  VERIFICATION_SUCCESS: 'Email verified successfully.',
  RESEND_SUCCESS: 'Verification message sent successfully.',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  REFRESH_SUCCESS: 'Tokens refreshed successfully.',
  SESSION_REVOKED: 'Active session revoked successfully.',
  UNAUTHORIZED_TOKEN: 'Invalid or expired authorization token.',
};

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  MUST_BE_STRING: (field: string) => `${field} must be a string`,
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters long`,
  MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  EMAIL: (field: string) => `${field} must be a valid email address`,
  SLUG_FORMAT: (field: string) => `${field} must contain only lowercase letters, numbers, and hyphens`,
  METHOD_INVALID: (field: string) => `${field} must be either magic or otp`,
};

export const VERIFICATION_METHODS = {
  MAGIC: 'magic',
  OTP: 'otp',
};
