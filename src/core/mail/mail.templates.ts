export const baseEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f4f5;
            margin: 0;
            padding: 0;
            color: #18181b;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
        }
        .header {
            background-color: #0ea5e9;
            padding: 32px 40px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 0;
            color: #64748b;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #0ea5e9;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 16px;
            margin-bottom: 16px;
        }
        .otp-box {
            background-color: #f1f5f9;
            border: 1px dashed #cbd5e1;
            padding: 16px;
            text-align: center;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 0.2em;
            color: #0f172a;
            border-radius: 8px;
            margin: 24px 0;
        }
        h2 {
            color: #0f172a;
            margin-top: 0;
            font-size: 20px;
        }
        p {
            color: #334155;
            line-height: 1.6;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PulseBoard</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PulseBoard. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export const getVerificationTemplate = (magicLink?: string, otp?: string) => {
    let content = `<h2>Verify your email address</h2>
<p>Thanks for starting the new PulseBoard account creation process. We want to make sure it's really you.</p>`;

    if (magicLink) {
        content += `
        <p>Please click the button below to verify your email address:</p>
        <center>
            <a href="${magicLink}" class="btn">Verify Email Address</a>
        </center>
        `;
    }

    if (otp) {
        content += `
        <p>Or use this verification code:</p>
        <div class="otp-box">${otp}</div>
        <p>This code will expire in 10 minutes.</p>
        `;
    }
    
    return baseEmailTemplate('Verify your PulseBoard Account', content);
};

export const getWelcomeTemplate = (name: string) => {
    const content = `
    <h2>Welcome to PulseBoard, ${name}!</h2>
    <p>We're thrilled to have you on board. PulseBoard is designed to help you manage your projects, track progress, and collaborate seamlessly.</p>
    <p>To get started, why not create your first board or invite your team?</p>
    <center>
        <a href="https://app.pulseboard.com/dashboard" class="btn">Go to Dashboard</a>
    </center>
    `;
    return baseEmailTemplate('Welcome to PulseBoard', content);
};

export const getPasswordResetTemplate = (otp: string) => {
    const content = `
    <h2>Reset Your Password</h2>
    <p>We received a request to reset the password for your PulseBoard account.</p>
    <p>Use the following One-Time Password (OTP) to reset your password:</p>
    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0; border-radius: 8px;">
        ${otp}
    </div>
    <p>This code will expire in 5 minutes.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `;
    return baseEmailTemplate('Reset your PulseBoard Password', content);
};

export const getTeamInviteTemplate = (inviterName: string, teamName: string, inviteLink: string) => {
    const content = `
    <h2>You've been invited!</h2>
    <p><strong>${inviterName}</strong> has invited you to join the <strong>${teamName}</strong> team on PulseBoard.</p>
    <p>Collaborate on projects, share updates, and keep your team's pulse perfectly synced.</p>
    <center>
        <a href="${inviteLink}" class="btn">Accept Invitation</a>
    </center>
    `;
    return baseEmailTemplate(`Join ${teamName} on PulseBoard`, content);
};
