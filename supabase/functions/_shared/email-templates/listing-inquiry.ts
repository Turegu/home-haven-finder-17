// Template 6: Listing Inquiry (from listing contact form)
import { emailLayout, sectionDivider, detailRow, detailsTable } from "./layout.ts";

export function listingInquiryTemplate(data: {
  recipientType: "agent" | "company";
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  preferredContact?: string;
  message: string;
  listingTitle: string;
  listingLocation: string;
  listingId: string;
  listingUrl: string;
  accountUrl: string;
}): string {
  const senderDetails = detailsTable(
    detailRow("Name:", data.senderName) +
    detailRow("Email:", `<a href="mailto:${data.senderEmail}" style="color:#009688;">${data.senderEmail}</a>`) +
    (data.senderPhone ? detailRow("Phone:", `<a href="tel:${data.senderPhone}" style="color:#009688;">${data.senderPhone}</a>`) : "") +
    (data.preferredContact ? detailRow("Preferred contact:", data.preferredContact) : "")
  );

  const propertyDetails = detailsTable(
    detailRow("Property:", `<a href="${data.listingUrl}" style="color:#009688;">${data.listingTitle}</a>`) +
    detailRow("Location:", data.listingLocation) +
    detailRow("Listing ID:", data.listingId) +
    detailRow("URL:", `<a href="${data.listingUrl}" style="color:#009688;word-break:break-all;font-size:12px;">${data.listingUrl}</a>`)
  );

  const body = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <span style="font-size:22px;font-weight:700;color:#262626;">Listing Inquiry</span>
    </div>

    <p style="margin:0 0 16px;font-size:15px;">
      <strong style="color:#009688;">${data.senderName}</strong> sent you an email inquiry for your property listing with Reference <strong>${data.listingId}</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#737373;">
      You can reply to the sender directly.
    </p>

    ${sectionDivider()}

    <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#262626;text-transform:uppercase;letter-spacing:0.5px;">
      Sender Details
    </h3>
    ${senderDetails}

    ${sectionDivider()}

    <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#262626;text-transform:uppercase;letter-spacing:0.5px;">
      Message
    </h3>
    <div style="background-color:#f9fafb;border-left:3px solid #009688;padding:12px 16px;border-radius:0 6px 6px 0;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;color:#262626;white-space:pre-wrap;">${data.message}</p>
    </div>

    ${sectionDivider()}

    <h3 style="margin:0 0 8px;font-size:14px;font-weight:600;color:#262626;text-transform:uppercase;letter-spacing:0.5px;">
      Property Details
    </h3>
    ${propertyDetails}

    <p style="margin:20px 0 0;font-size:13px;color:#737373;">
      To manage your account, visit your
      <a href="${data.accountUrl}" style="color:#009688;">account</a>.
    </p>
  `;
  return emailLayout(body);
}
