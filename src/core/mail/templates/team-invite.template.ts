import { baseEmailTemplate } from './base.template';

export const getTeamInviteTemplate = (
  inviterName: string,
  teamName: string,
  inviteLink: string,
) => {
  const content = `
    <h2>You've been invited to join ${teamName}! 🤝</h2>
    <p><strong>${inviterName}</strong> has invited you to join the <strong>${teamName}</strong> workspace on PulseBoard.</p>
    
    <div class="info-card">
        <p>Collaborate on projects, share real-time updates, and keep your team's pulse perfectly synced.</p>
    </div>

    <div class="btn-wrapper">
        <a href="${inviteLink}" class="btn-primary" target="_blank">Accept Team Invitation</a>
    </div>

    <p style="font-size: 13px; color: #71717a;">Or copy and paste this link into your browser:</p>
    <a href="${inviteLink}" class="link-fallback">${inviteLink}</a>
  `;

  return baseEmailTemplate(
    `Join ${teamName} on PulseBoard`,
    content,
    `${inviterName} invited you to join ${teamName} on PulseBoard.`,
  );
};
