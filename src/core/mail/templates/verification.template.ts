import { baseEmailTemplate } from './base.template';

export const getVerificationTemplate = (magicLink?: string, otp?: string) => {
  let content = `
    <h2>Verify your email address</h2>
    <p>Welcome to PulseBoard! Please confirm your email address to complete your account setup and get access to your workspace.</p>
  `;

  if (magicLink) {
    content += `
      <p>Click the button below to instantly verify your email address:</p>
      <div class="btn-wrapper">
          <a href="${magicLink}" class="btn-primary" target="_blank">Verify Email Address</a>
      </div>
      <p style="font-size: 13px; color: #71717a;">Button not working? Copy and paste this link into your browser:</p>
      <a href="${magicLink}" class="link-fallback">${magicLink}</a>
    `;
  }

  if (otp) {
    content += `
      ${magicLink ? '<div style="margin: 28px 0; border-top: 1px solid #e4e4e7;"></div>' : ''}
      <p>Alternatively, enter the following one-time verification code when prompted:</p>
      <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <div class="badge-notice">⏱️ Valid for 10 minutes</div>
      </div>
    `;
  }

  content += `
    <div class="info-card">
        <p>🔒 <strong>Security Hint:</strong> Never share your verification code or magic link with anyone. PulseBoard employees will never ask for your code.</p>
    </div>
  `;

  return baseEmailTemplate(
    'Verify your PulseBoard Account',
    content,
    'Please confirm your email address to complete your account setup.',
  );
};
