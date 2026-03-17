// Client-side email template HTML renderer for preview
// Mirrors the edge function layout but uses DB-stored editable fields

const SITE_URL = "https://www.turegu.com";
const PRIMARY = "#009688";
const ACCENT = "#F97316";
const TEXT = "#262626";
const MUTED = "#737373";
const BG = "#f5f5f5";

function layout(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Inter',Arial,sans-serif;">
<table cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px;margin:0 auto;background:#fff;">
<tr><td style="padding:24px 32px;border-bottom:3px solid ${PRIMARY};">
<span style="display:inline-block;width:28px;height:28px;background:${PRIMARY};border-radius:50%;text-align:center;line-height:28px;color:#fff;font-weight:bold;font-size:14px;margin-right:8px;">T</span>
<span style="font-size:22px;font-weight:700;color:${PRIMARY};">turegu</span>
</td></tr>
<tr><td style="padding:32px;color:${TEXT};font-size:15px;line-height:1.6;">${body}</td></tr>
<tr><td style="padding:0 32px 24px;color:${TEXT};font-size:15px;line-height:1.6;">
<p style="margin:0;">Best regards,</p><p style="margin:4px 0 0;font-weight:600;">Team Turegu</p>
<a href="${SITE_URL}" style="color:${PRIMARY};font-size:13px;">www.turegu.com</a>
</td></tr>
<tr><td style="padding:20px 32px;background:${BG};text-align:center;border-top:1px solid #e5e5e5;">
<p style="margin:0 0 8px;font-size:12px;color:${MUTED};font-style:italic;">***Please do not reply, as this message has been sent by an automated process***</p>
<p style="margin:0;font-size:11px;color:${MUTED};">&copy; 2026 Turegu. All rights reserved.</p>
</td></tr></table></body></html>`;
}

function btn(text: string) {
  return `<table cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr>
<td style="border-radius:8px;background:${ACCENT};"><a href="#" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#fff;text-decoration:none;border-radius:8px;">${text}</a></td>
</tr></table>`;
}

const hr = `<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />`;

function row(label: string, val: string) {
  return `<tr><td style="padding:6px 0;font-size:13px;color:${MUTED};width:140px;vertical-align:top;">${label}</td><td style="padding:6px 0;font-size:13px;color:${TEXT};font-weight:500;">${val}</td></tr>`;
}

function nl2p(text: string) {
  return text.split("\n").filter(Boolean).map(line => `<p style="margin:0 0 8px;">${line}</p>`).join("");
}

// Replace {{placeholders}} with sample values for preview
const SAMPLE_VALUES: Record<string, string> = {
  name: "John Doe",
  publisher_name: "Skyline Real Estate",
  listing_type: "Property",
  sender_name: "Luna Balona",
  reference_id: "4456829",
};

function replacePlaceholders(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VALUES[key] || `{{${key}}}`);
}

export interface TemplateBodyFields {
  greeting?: string;
  body?: string;
  button_text?: string;
  footer_note?: string;
  help_text?: string;
  features?: string[];
  title?: string;
  intro?: string;
  reply_note?: string;
}

export function renderTemplateHtml(templateKey: string, fields: TemplateBodyFields): string {
  const f = { ...fields };
  // Replace all placeholders with sample values
  Object.keys(f).forEach(key => {
    const val = (f as Record<string, unknown>)[key];
    if (typeof val === "string") {
      (f as Record<string, string>)[key] = replacePlaceholders(val);
    }
  });

  switch (templateKey) {
    case "confirmation":
      return layout(`
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">${f.greeting || ""}</h1>
        ${nl2p(f.body || "")}
        ${btn(f.button_text || "Verify Email")}
        <p style="font-size:13px;color:${MUTED};">${f.footer_note || ""}</p>
      `);

    case "welcome":
      return layout(`
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">${f.greeting || ""}</h1>
        <p style="margin:0 0 12px;">${replacePlaceholders(fields.body || "")}</p>
        <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:2;">
          ${(f.features || []).map(feat => `<li>${feat}</li>`).join("")}
        </ul>
        <div style="background:${BG};border-radius:8px;padding:16px 20px;margin:0 0 20px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;">Your login details:</p>
          <p style="margin:0;font-size:13px;color:${MUTED};">Email: <strong style="color:${TEXT};">john@example.com</strong></p>
        </div>
        ${btn(f.button_text || "Start Exploring")}
      `);

    case "reset":
      return layout(`
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">${f.greeting || ""}</h1>
        ${nl2p(f.body || "")}
        ${btn(f.button_text || "Reset Password")}
        <p style="font-size:13px;color:${MUTED};">${f.help_text || ""}</p>
      `);

    case "notification":
      return layout(`
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">${f.greeting || ""}</h1>
        <p style="margin:0 0 12px;">${f.body || ""}</p>
        <div style="border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;margin:20px 0;">
          <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=560&h=200&fit=crop" alt="" style="width:100%;height:200px;object-fit:cover;" />
          <div style="padding:16px;">
            <h3 style="margin:0 0 6px;font-size:16px;font-weight:600;">Modern Sea View Villa</h3>
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${PRIMARY};">$2,500,000</p>
            <p style="margin:0;font-size:13px;color:${MUTED};">📍 Dubai Marina, Dubai</p>
            <span style="font-size:12px;color:${MUTED};">🏠 Property &nbsp; ID: 44568291</span>
          </div>
        </div>
        ${btn(f.button_text || "View Property")}
      `);

    case "message":
      return layout(`
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;">${f.title || "A Message"}</h2>
        <p style="margin:0 0 16px;"><strong style="color:${PRIMARY};">${replacePlaceholders("{{sender_name}}")}</strong> ${f.intro ? f.intro.replace(replacePlaceholders("{{sender_name}}"), "").trim() : "sent you a message."}</p>
        <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">${f.reply_note || ""}</p>
        ${hr}
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Sender Details</h3>
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
          ${row("Name:", `<span style="color:${PRIMARY};">Luna Balona</span>`)}
          ${row("Email:", `<a href="#" style="color:${PRIMARY};">luna@example.com</a>`)}
          ${row("Phone:", `<a href="#" style="color:${PRIMARY};">+966546468878</a>`)}
          ${row("Preferred contact:", "Email / Phone call / WhatsApp")}
        </table>
        ${hr}
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</h3>
        <div style="background:#f9fafb;border-left:3px solid ${PRIMARY};padding:12px 16px;border-radius:0 6px 6px 0;margin:0 0 20px;">
          <p style="margin:0;font-size:14px;">Hello, I am interested in your listings. Please contact me at your earliest convenience. Thank you.</p>
        </div>
      `);

    case "inquiry":
      return layout(`
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;">${f.title || "Listing Inquiry"}</h2>
        <p style="margin:0 0 16px;">${f.intro || ""}</p>
        <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">${f.reply_note || ""}</p>
        ${hr}
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Sender Details</h3>
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
          ${row("Name:", `<span style="color:${PRIMARY};">Luna Balona</span>`)}
          ${row("Email:", `<a href="#" style="color:${PRIMARY};">luna@example.com</a>`)}
          ${row("Phone:", `<a href="#" style="color:${PRIMARY};">+966546468878</a>`)}
          ${row("Preferred contact:", "Email / Phone call / WhatsApp")}
        </table>
        ${hr}
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</h3>
        <div style="background:#f9fafb;border-left:3px solid ${PRIMARY};padding:12px 16px;border-radius:0 6px 6px 0;margin:0 0 20px;">
          <p style="margin:0;font-size:14px;">Hello, I would like to inquire about your Listing with reference ID 4456829. Kindly contact me. Thank you.</p>
        </div>
        ${hr}
        <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Property Details</h3>
        <table cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
          ${row("Property:", `<a href="#" style="color:${PRIMARY};">Furnished 1 Bed w Marina View</a>`)}
          ${row("Location:", "Dubai » UAE")}
          ${row("Listing ID:", "4456829")}
          ${row("URL:", `<a href="#" style="color:${PRIMARY};font-size:12px;">https://www.turegu.com/property/4456829</a>`)}
        </table>
      `);

    default:
      return layout(`<p>Unknown template</p>`);
  }
}

// Field definitions for the editor UI
export const TEMPLATE_FIELD_DEFS: Record<string, { key: string; label: string; type: "text" | "textarea" | "list"; placeholder?: string }[]> = {
  confirmation: [
    { key: "greeting", label: "Greeting", type: "text", placeholder: "Hi {{name}}!" },
    { key: "body", label: "Body Text", type: "textarea", placeholder: "You are almost ready..." },
    { key: "button_text", label: "Button Text", type: "text", placeholder: "Verify Email" },
    { key: "footer_note", label: "Footer Note", type: "textarea", placeholder: "If you didn't create an account..." },
  ],
  welcome: [
    { key: "greeting", label: "Greeting", type: "text", placeholder: "Welcome {{name}}!" },
    { key: "body", label: "Body Text", type: "textarea", placeholder: "Thank you for registering..." },
    { key: "features", label: "Feature List", type: "list" },
    { key: "button_text", label: "Button Text", type: "text", placeholder: "Start Exploring" },
  ],
  reset: [
    { key: "greeting", label: "Greeting", type: "text", placeholder: "Hi {{name}}," },
    { key: "body", label: "Body Text", type: "textarea", placeholder: "We have received a request..." },
    { key: "button_text", label: "Button Text", type: "text", placeholder: "Reset Password" },
    { key: "help_text", label: "Help Text", type: "textarea", placeholder: "If you have any questions..." },
  ],
  notification: [
    { key: "greeting", label: "Greeting", type: "text", placeholder: "Hi {{name}}!" },
    { key: "body", label: "Body Text", type: "textarea", placeholder: "{{publisher_name}} has added a new {{listing_type}}:" },
    { key: "button_text", label: "Button Text", type: "text", placeholder: "View {{listing_type}}" },
  ],
  message: [
    { key: "title", label: "Title", type: "text", placeholder: "A Message" },
    { key: "intro", label: "Intro Text", type: "textarea", placeholder: "{{sender_name}} sent you a message." },
    { key: "reply_note", label: "Reply Note", type: "text", placeholder: "You can reply to the sender directly." },
  ],
  inquiry: [
    { key: "title", label: "Title", type: "text", placeholder: "Listing Inquiry" },
    { key: "intro", label: "Intro Text", type: "textarea", placeholder: "{{sender_name}} sent you an email inquiry..." },
    { key: "reply_note", label: "Reply Note", type: "text", placeholder: "You can reply to the sender directly." },
  ],
};

export const PLACEHOLDER_DOCS: Record<string, string[]> = {
  confirmation: ["{{name}} — Recipient's name"],
  welcome: ["{{name}} — Recipient's name"],
  reset: ["{{name}} — Recipient's name"],
  notification: ["{{name}} — Recipient's name", "{{publisher_name}} — Agent/Company name", "{{listing_type}} — Property, Project, or Event"],
  message: ["{{sender_name}} — Name of the person who sent the message", "{{reference_id}} — Message reference number"],
  inquiry: ["{{sender_name}} — Name of the inquirer", "{{reference_id}} — Listing reference number"],
};
