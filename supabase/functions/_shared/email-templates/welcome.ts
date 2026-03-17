// Template 2: Welcome email (account activated)
import { emailLayout, primaryButton, SITE_URL } from "./layout.ts";

export function welcomeTemplate(data: {
  userName: string;
  email: string;
  accountUrl: string;
}): string {
  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#262626;">
      Welcome ${data.userName}!
    </h1>
    <p style="margin:0 0 12px;">
      Thank you for registering a new account with us. Your account is successfully activated and you'll be able to:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#262626;font-size:14px;line-height:2;">
      <li>Save Properties &amp; searches</li>
      <li>Compare between your favourite Properties</li>
      <li>Follow your favourite agents &amp; stay updated with new offers</li>
      <li>Sync your activity across all of your devices</li>
    </ul>

    <div style="background-color:#f5f5f5;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#262626;">Your login details:</p>
      <p style="margin:0;font-size:13px;color:#737373;">Email: <strong style="color:#262626;">${data.email}</strong></p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;">
      To manage your account &amp; set your Preferences, visit your
      <a href="${data.accountUrl}" style="color:#009688;font-weight:500;">account</a>.
    </p>

    ${primaryButton("Start Exploring", SITE_URL)}
  `;
  return emailLayout(body);
}
