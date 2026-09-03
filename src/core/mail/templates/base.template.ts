export const baseEmailTemplate = (
  title: string,
  content: string,
  previewText?: string,
) => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="x-apple-disable-message-reformatting">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f4f6;
            margin: 0;
            padding: 0;
            width: 100% !important;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            color: #18181b;
        }

        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        td {
            padding: 0;
        }

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }

        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f4f4f6;
            padding: 40px 16px;
        }

        .main-card {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            border: 1px solid #e4e4e7;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }

        .header-bar {
            background: linear-gradient(135deg, #09090b 0%, #18181b 100%);
            padding: 28px 40px;
            text-align: center;
        }

        .brand-logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
        }

        .logo-dot {
            width: 12px;
            height: 12px;
            background-color: #6366f1;
            border-radius: 50%;
            display: inline-block;
            margin-right: 10px;
            box-shadow: 0 0 12px #6366f1;
        }

        .brand-name {
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .content-body {
            padding: 40px;
        }

        h1, h2 {
            color: #09090b;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
            line-height: 1.3;
        }

        h2 {
            font-size: 22px;
            letter-spacing: -0.02em;
        }

        p {
            color: #52525b;
            font-size: 15px;
            line-height: 1.6;
            margin-top: 0;
            margin-bottom: 20px;
        }

        .btn-wrapper {
            margin: 28px 0;
            text-align: center;
        }

        .btn-primary {
            display: inline-block;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
            transition: all 0.2s ease;
        }

        .otp-container {
            background-color: #f8fafc;
            border: 1.5px dashed #cbd5e1;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 28px 0;
        }

        .otp-code {
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 10px;
            color: #0f172a;
            margin: 0;
            padding-left: 10px;
        }

        .badge-notice {
            display: inline-block;
            background-color: #f1f5f9;
            color: #475569;
            font-size: 13px;
            font-weight: 500;
            padding: 6px 14px;
            border-radius: 20px;
            margin-top: 12px;
        }

        .info-card {
            background-color: #fafafa;
            border-left: 4px solid #6366f1;
            border-radius: 6px;
            padding: 16px 20px;
            margin: 24px 0;
        }

        .info-card p {
            margin: 0;
            font-size: 14px;
            color: #52525b;
        }

        .link-fallback {
            word-break: break-all;
            font-size: 13px;
            color: #6366f1;
            background-color: #f4f4f5;
            padding: 10px 14px;
            border-radius: 6px;
            display: block;
            margin-top: 8px;
            text-decoration: none;
        }

        .footer {
            background-color: #fafafa;
            border-top: 1px solid #f4f4f5;
            padding: 28px 40px;
            text-align: center;
        }

        .footer p {
            color: #71717a;
            font-size: 13px;
            line-height: 1.5;
            margin: 0 0 8px 0;
        }

        .footer a {
            color: #6366f1;
            text-decoration: none;
        }

        @media only screen and (max-width: 600px) {
            .wrapper {
                padding: 16px 8px !important;
            }
            .content-body {
                padding: 28px 20px !important;
            }
            .header-bar {
                padding: 20px !important;
            }
            .footer {
                padding: 20px !important;
            }
            .otp-code {
                font-size: 28px !important;
                letter-spacing: 6px !important;
            }
        }

        @media (prefers-color-scheme: dark) {
            body, .wrapper {
                background-color: #09090b !important;
            }
            .main-card {
                background-color: #18181b !important;
                border-color: #27272a !important;
            }
            h1, h2 {
                color: #f4f4f5 !important;
            }
            p {
                color: #a1a1aa !important;
            }
            .otp-container {
                background-color: #27272a !important;
                border-color: #3f3f46 !important;
            }
            .otp-code {
                color: #ffffff !important;
            }
            .info-card {
                background-color: #27272a !important;
            }
            .info-card p {
                color: #a1a1aa !important;
            }
            .footer {
                background-color: #18181b !important;
                border-top-color: #27272a !important;
            }
            .footer p {
                color: #71717a !important;
            }
            .link-fallback {
                background-color: #27272a !important;
                color: #818cf8 !important;
            }
        }
    </style>
</head>
<body>
    <div style="display:none; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all;">
        ${previewText || title}
    </div>
    <div class="wrapper">
        <div class="main-card">
            <div class="header-bar">
                <div class="brand-logo">
                    <span class="logo-dot"></span>
                    <span class="brand-name">PulseBoard</span>
                </div>
            </div>
            <div class="content-body">
                ${content}
            </div>
            <div class="footer">
                <p>This automated message was sent by <strong>PulseBoard</strong>.</p>
                <p>Need help? Contact our support team at <a href="mailto:support@pulseboard.com">support@pulseboard.com</a></p>
                <p style="margin-top: 12px; font-size: 12px; color: #a1a1aa;">
                    &copy; ${new Date().getFullYear()} PulseBoard Technologies Inc. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;
