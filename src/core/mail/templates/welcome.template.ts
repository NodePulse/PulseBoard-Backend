import { baseEmailTemplate } from './base.template';

export const getWelcomeTemplate = (name: string) => {
  const content = `
    <h2>Welcome to PulseBoard, ${name}! 🎉</h2>
    <p>We're thrilled to have you join us! PulseBoard empowers teams to monitor real-time project metrics, streamline workflows, and collaborate effortlessly.</p>
    
    <div class="info-card">
        <p>🚀 <strong>Quick Start Checklist:</strong></p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #52525b; font-size: 14px; line-height: 1.8;">
            <li>Create your first project workspace</li>
            <li>Invite team members to collaborate</li>
            <li>Set up real-time status boards & notifications</li>
        </ul>
    </div>

    <p>Ready to jump in? Access your dashboard now:</p>

    <div class="btn-wrapper">
        <a href="https://app.pulseboard.com/dashboard" class="btn-primary" target="_blank">Go to Dashboard</a>
    </div>
  `;

  return baseEmailTemplate(
    'Welcome to PulseBoard',
    content,
    `Welcome aboard, ${name}! Start exploring your new PulseBoard workspace today.`,
  );
};
