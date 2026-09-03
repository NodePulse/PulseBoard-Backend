import { baseEmailTemplate } from './base.template';

export const getPasswordResetTemplate = (otp: string) => {
  const content = `
    <h2>Reset Your Password 🔐</h2>
    <p>We received a request to reset the password for your PulseBoard account.</p>
    <p>Use the One-Time Password (OTP) below to authorize your password reset:</p>
    
    <div class="otp-container">
        <div class="otp-code">${otp}</div>
        <div class="badge-notice">⏱️ Valid for 5 minutes</div>
    </div>

    <div class="info-card">
        <p>🛡️ <strong>Security Alert:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
  `;

  return baseEmailTemplate(
    'Reset your PulseBoard Password',
    content,
    'Use this code to safely reset your PulseBoard account password.',
  );
};
