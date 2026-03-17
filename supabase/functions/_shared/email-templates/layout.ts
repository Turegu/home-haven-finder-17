// Shared Turegu email layout wrapper
// Brand: primary teal hsl(174, 100%, 29%) = #009688, orange accent #F97316

const SITE_URL = "https://www.turegu.com";
const LOGO_TEXT = "turegu";
const PRIMARY_COLOR = "#009688";
const ACCENT_COLOR = "#F97316";
const TEXT_COLOR = "#262626";
const MUTED_COLOR = "#737373";
const BG_COLOR = "#f5f5f5";

export function emailLayout(bodyContent: string, footerExtra?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Turegu</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Inter',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding:24px 32px;border-bottom:3px solid ${PRIMARY_COLOR};">
        <a href="${SITE_URL}" style="text-decoration:none;display:inline-flex;align-items:center;">
          <span style="display:inline-block;width:28px;height:28px;background-color:${PRIMARY_COLOR};border-radius:50%;text-align:center;line-height:28px;color:#fff;font-weight:bold;font-size:14px;margin-right:8px;">T</span>
          <span style="font-size:22px;font-weight:700;color:${PRIMARY_COLOR};letter-spacing:-0.5px;">${LOGO_TEXT}</span>
        </a>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
        ${bodyContent}
      </td>
    </tr>
    <!-- Signature -->
    <tr>
      <td style="padding:0 32px 24px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
        <p style="margin:0;">Best regards,</p>
        <p style="margin:4px 0 0;font-weight:600;">Team Turegu</p>
        <a href="${SITE_URL}" style="color:${PRIMARY_COLOR};font-size:13px;">www.turegu.com</a>
      </td>
    </tr>
    ${footerExtra || ""}
    <!-- Footer -->
    <tr>
      <td style="padding:20px 32px;background-color:${BG_COLOR};text-align:center;border-top:1px solid #e5e5e5;">
        <p style="margin:0 0 8px;font-size:12px;color:${MUTED_COLOR};font-style:italic;">
          ***Please do not reply, as this message has been sent by an automated process***
        </p>
        <p style="margin:0;font-size:11px;color:${MUTED_COLOR};">
          &copy; ${new Date().getFullYear()} Turegu. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function primaryButton(text: string, url: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:8px;background-color:${ACCENT_COLOR};">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

export function sectionDivider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />`;
}

export function detailRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:6px 0;font-size:13px;color:${MUTED_COLOR};width:140px;vertical-align:top;">${label}</td>
  <td style="padding:6px 0;font-size:13px;color:${TEXT_COLOR};font-weight:500;">${value}</td>
</tr>`;
}

export function detailsTable(rows: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
  ${rows}
</table>`;
}

export { SITE_URL, PRIMARY_COLOR, ACCENT_COLOR, TEXT_COLOR, MUTED_COLOR };
