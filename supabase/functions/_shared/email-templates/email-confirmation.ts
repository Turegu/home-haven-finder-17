// Template 1: Email Confirmation (verify email address)
import { emailLayout, primaryButton } from "./layout.ts";

export function emailConfirmationTemplate(data: {
  userName: string;
  confirmationUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#262626;">
      Hi ${data.userName}!
    </h1>
    <p style="margin:0 0 8px;">
      You are almost ready to start exploring Turegu.
    </p>
    <p style="margin:0 0 4px;">
      Simply click the orange button below to verify your email address.
    </p>
    ${primaryButton("Verify Email", data.confirmationUrl)}
    <p style="margin:0;font-size:13px;color:#737373;">
      If you didn't create an account with Turegu, you can safely ignore this email.
    </p>
  `;
  return emailLayout(body);
}
