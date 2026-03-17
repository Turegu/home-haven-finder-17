import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SITE_URL = "https://www.turegu.com";
const PRIMARY = "#009688";
const ACCENT = "#F97316";
const TEXT = "#262626";
const MUTED = "#737373";
const BG = "#f5f5f5";

// Inline template renderers (mirrors edge function templates)
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

const TEMPLATES: Record<string, { label: string; subject: string; html: string }> = {
  confirmation: {
    label: "Email Confirmation",
    subject: "Verify your email — Turegu",
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">Hi John!</h1>
      <p style="margin:0 0 8px;">You are almost ready to start exploring Turegu.</p>
      <p style="margin:0;">Simply click the orange button below to verify your email address.</p>
      ${btn("Verify Email")}
      <p style="font-size:13px;color:${MUTED};">If you didn't create an account with Turegu, you can safely ignore this email.</p>
    `),
  },
  welcome: {
    label: "Welcome",
    subject: "Welcome to Turegu!",
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">Welcome John!</h1>
      <p style="margin:0 0 12px;">Thank you for registering a new account with us. Your account is successfully activated and you'll be able to:</p>
      <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:2;">
        <li>Save Properties &amp; searches</li>
        <li>Compare between your favourite Properties</li>
        <li>Follow your favourite agents &amp; stay updated with new offers</li>
        <li>Sync your activity across all of your devices</li>
      </ul>
      <div style="background:${BG};border-radius:8px;padding:16px 20px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;">Your login details:</p>
        <p style="margin:0;font-size:13px;color:${MUTED};">Email: <strong style="color:${TEXT};">john@example.com</strong></p>
      </div>
      ${btn("Start Exploring")}
    `),
  },
  reset: {
    label: "Password Reset",
    subject: "Reset your password — Turegu",
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">Hi John,</h1>
      <p style="margin:0 0 8px;">We have received a request to reset your Turegu account password.</p>
      <p style="margin:0 0 4px;">If you did not make this request, you can safely ignore this email and your account details will remain unchanged.</p>
      ${btn("Reset Password")}
      <p style="font-size:13px;color:${MUTED};">If you have any questions, please feel free to <a href="#" style="color:${PRIMARY};">contact</a> us any time.</p>
    `),
  },
  notification: {
    label: "New Listing Notification",
    subject: "New listing from Skyline Real Estate — Turegu",
    html: layout(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">Hi John!</h1>
      <p style="margin:0 0 12px;"><strong>Skyline Real Estate</strong> has added a new <strong>Property</strong>:</p>
      <div style="border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;margin:20px 0;">
        <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=560&h=200&fit=crop" alt="" style="width:100%;height:200px;object-fit:cover;" />
        <div style="padding:16px;">
          <h3 style="margin:0 0 6px;font-size:16px;font-weight:600;">Modern Sea View Villa</h3>
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:${PRIMARY};">$2,500,000</p>
          <p style="margin:0;font-size:13px;color:${MUTED};">📍 Dubai Marina, Dubai</p>
          <span style="font-size:12px;color:${MUTED};">🏠 Property &nbsp; ID: 44568291</span>
        </div>
      </div>
      ${btn("View Property")}
    `),
  },
  message: {
    label: "Message Notification",
    subject: "Message — Reference 1212121 — Turegu",
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;">A Message</h2>
      <p style="margin:0 0 16px;"><strong style="color:${PRIMARY};">Luna Balona</strong> sent you a message.</p>
      <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">You can reply to the sender directly.</p>
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
    `),
  },
  inquiry: {
    label: "Listing Inquiry",
    subject: "Inquiry — Reference 4456829 — Turegu",
    html: layout(`
      <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;">Listing Inquiry</h2>
      <p style="margin:0 0 16px;"><strong style="color:${PRIMARY};">Luna Balona</strong> sent you an email inquiry for your property listing with Reference <strong>4456829</strong>.</p>
      <p style="margin:0 0 20px;font-size:14px;color:${MUTED};">You can reply to the sender directly.</p>
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
    `),
  },
};

const AdminEmailPreviewPage = () => {
  const [activeTemplate, setActiveTemplate] = useState("confirmation");
  const template = TEMPLATES[activeTemplate];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Templates Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">Preview all automated email formats</p>
        </div>

        <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <TabsTrigger key={key} value={key} className="text-xs">{t.label}</TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(TEMPLATES).map(([key, t]) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-3">
                <div className="bg-card rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Subject: <span className="font-medium text-foreground">{t.subject}</span></p>
                </div>
                <div className="bg-muted/50 rounded-lg border border-border p-6 flex justify-center">
                  <div className="w-full max-w-[620px]">
                    <iframe
                      srcDoc={t.html}
                      title={t.label}
                      className="w-full border-0 rounded-lg bg-white"
                      style={{ minHeight: 700 }}
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailPreviewPage;
