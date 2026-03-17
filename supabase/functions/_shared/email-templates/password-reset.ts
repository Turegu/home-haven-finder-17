// Template 3: Password Reset
import { emailLayout, primaryButton } from "./layout.ts";

export function passwordResetTemplate(data: {
  userName: string;
  resetUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#262626;">
      Hi ${data.userName || "there"},
    </h1>
    <p style="margin:0 0 8px;">
      We have received a request to reset your Turegu account password.
    </p>
    <p style="margin:0 0 4px;">
      If you did not make this request, you can safely ignore this email and your account details will remain unchanged.
    </p>
    ${primaryButton("Reset Password", data.resetUrl)}
    <p style="margin:0 0 8px;font-size:13px;color:#737373;">
      If you have any questions, please feel free to
      <a href="https://www.turegu.com/faq" style="color:#009688;">contact</a> us any time.
    </p>
    <p style="margin:0;font-size:12px;color:#a3a3a3;">
      If you're having trouble with the button above, copy and paste this URL into your browser:<br />
      <a href="${data.resetUrl}" style="color:#009688;word-break:break-all;font-size:11px;">${data.resetUrl}</a>
    </p>
  `;
  return emailLayout(body);
}
