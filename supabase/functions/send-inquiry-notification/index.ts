import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { listingInquiryTemplate } from "../_shared/email-templates/listing-inquiry.ts";
import { messageNotificationTemplate } from "../_shared/email-templates/message-notification.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      sender_name,
      sender_email,
      sender_phone,
      preferred_contact,
      message,
      agent_id,
      company_id,
      listing_title,
      listing_location,
      listing_id,
      listing_type, // 'property' | 'project' | 'event' | 'profile'
    } = await req.json();

    if (!sender_name || !sender_email || !company_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Determine recipient email: agent email if agent_id, else company email
    let recipientEmail: string | null = null;
    let recipientType: "agent" | "company" = "company";

    if (agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("email")
        .eq("id", agent_id)
        .maybeSingle();
      recipientEmail = agent?.email || null;
      recipientType = "agent";
    }

    if (!recipientEmail) {
      const { data: company } = await supabase
        .from("companies")
        .select("email")
        .eq("id", company_id)
        .maybeSingle();
      recipientEmail = company?.email || null;
      recipientType = "company";
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No recipient email found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = "https://turegu.com";
    const accountUrl = recipientType === "agent" ? `${siteUrl}/agent/inbox` : `${siteUrl}/company/inbox`;

    // Choose template based on whether this is a listing inquiry or a profile message
    let html: string;
    let subject: string;

    if (listing_type === "profile") {
      // Direct message from agent/company profile page
      html = messageNotificationTemplate({
        recipientType,
        senderName: sender_name,
        senderEmail: sender_email,
        senderPhone: sender_phone,
        preferredContact: preferred_contact,
        message,
        accountUrl,
      });
      subject = `New message from ${sender_name}`;
    } else {
      // Listing inquiry (property, project, or event)
      const listingUrl = listing_type === "project"
        ? `${siteUrl}/projects/${listing_id}`
        : listing_type === "event"
        ? `${siteUrl}/events/${listing_id}`
        : `${siteUrl}/properties/${listing_id}`;

      html = listingInquiryTemplate({
        recipientType,
        senderName: sender_name,
        senderEmail: sender_email,
        senderPhone: sender_phone,
        preferredContact: preferred_contact,
        message,
        listingTitle: listing_title || "A listing",
        listingLocation: listing_location || "",
        listingId: listing_id || "",
        listingUrl,
        accountUrl,
      });
      subject = `New inquiry from ${sender_name} — ${listing_title || "Your listing"}`;
    }

    // Send email via configured app email API
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const emailApiUrl = Deno.env.get("LOVABLE_EMAIL_API_URL") || "https://email.lovable.dev/v1/send";
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY missing; inquiry email skipped");
      return new Response(JSON.stringify({ success: false, email_sent: false, reason: "email_api_not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(emailApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        html,
        sender_domain: Deno.env.get("EMAIL_SENDER_DOMAIN") || "notify.turegu.com",
        from: Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@turegu.com",
        from_name: "Turegu",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to send to ${recipientEmail}:`, errText);
      return new Response(JSON.stringify({
        success: false,
        email_sent: false,
        sent_to: recipientEmail,
        reason: "email_send_failed",
        details: errText,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, email_sent: true, sent_to: recipientEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
