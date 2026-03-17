// Template 4: Notification – new listing from a followed agent/company
import { emailLayout, primaryButton, SITE_URL } from "./layout.ts";

interface ListingInfo {
  title: string;
  type: string; // "Property" | "Project" | "Event"
  imageUrl?: string;
  price?: string;
  location?: string;
  listingId: string;
  completionDate?: string;
  listingUrl: string;
}

export function newListingNotificationTemplate(data: {
  userName: string;
  publisherName: string;
  listing: ListingInfo;
  accountUrl: string;
}): string {
  const listing = data.listing;

  const listingCard = `
    <div style="border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;margin:20px 0;">
      ${listing.imageUrl ? `<img src="${listing.imageUrl}" alt="${listing.title}" style="width:100%;height:200px;object-fit:cover;" />` : ""}
      <div style="padding:16px;">
        <h3 style="margin:0 0 6px;font-size:16px;font-weight:600;color:#262626;">${listing.title}</h3>
        ${listing.price ? `<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#009688;">${listing.price}</p>` : ""}
        ${listing.location ? `<p style="margin:0 0 4px;font-size:13px;color:#737373;">📍 ${listing.location}</p>` : ""}
        <div style="display:flex;gap:12px;margin-top:8px;">
          <span style="font-size:12px;color:#737373;">🏠 ${listing.type}</span>
          ${listing.listingId ? `<span style="font-size:12px;color:#737373;">ID: ${listing.listingId}</span>` : ""}
          ${listing.completionDate ? `<span style="font-size:12px;color:#737373;">📅 ${listing.completionDate}</span>` : ""}
        </div>
      </div>
    </div>
  `;

  const body = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#262626;">
      Hi ${data.userName}!
    </h1>
    <p style="margin:0 0 12px;">
      <strong>${data.publisherName}</strong> has added a new <strong>${listing.type}</strong>:
    </p>
    ${listingCard}
    ${primaryButton(`View ${listing.type}`, listing.listingUrl)}
    <p style="margin:0;font-size:13px;color:#737373;">
      To manage your account &amp; set your preferences, visit your
      <a href="${data.accountUrl}" style="color:#009688;">account</a>.
    </p>
  `;
  return emailLayout(body);
}
