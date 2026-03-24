import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { emailLayout } from "../_shared/email-templates/layout.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { announcement_id } = await req.json();
    if (!announcement_id) {
      return new Response(JSON.stringify({ error: "announcement_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get the announcement
    const { data: announcement, error: annErr } = await supabase
      .from("company_announcements")
      .select("id, title, message, announcement_type, company_id")
      .eq("id", announcement_id)
      .single();

    if (annErr || !announcement) {
      return new Response(JSON.stringify({ error: "Announcement not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company name
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", announcement.company_id)
      .single();

    // Get all follower user_ids
    const { data: followers } = await supabase
      .from("company_followers")
      .select("user_id")
      .eq("company_id", announcement.company_id);

    if (!followers || followers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = followers.map((f) => f.user_id);

    // Get emails from auth.users via the RPC function
    const { data: emailData } = await supabase.rpc("get_user_emails_for_company", {
      p_user_ids: userIds,
    });

    if (!emailData || emailData.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyName = company?.name || "A company you follow";
    const typeLabel =
      announcement.announcement_type === "event_invitation"
        ? "Event Invitation"
        : announcement.announcement_type === "promotion"
        ? "Promotion"
        : announcement.announcement_type === "update"
        ? "Company Update"
        : "Announcement";

    // Send emails using Lovable email API
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "Email API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const entry of emailData) {
      const htmlBody = `
        <div style="margin-bottom:8px;">
          <span style="display:inline-block;background-color:#009688;color:#fff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">${typeLabel}</span>
        </div>
        <h2 style="margin:16px 0 8px;font-size:20px;font-weight:700;color:#262626;">${announcement.title}</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#737373;">From: <strong>${companyName}</strong></p>
        <div style="padding:16px;background-color:#f9fafb;border-radius:8px;border:1px solid #e5e5e5;margin-bottom:24px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#262626;white-space:pre-wrap;">${announcement.message}</p>
        </div>
        <p style="font-size:14px;color:#737373;">You received this because you follow <strong>${companyName}</strong> on Turegu.</p>
      `;

      const fullHtml = emailLayout(htmlBody);

      try {
        const res = await fetch("https://email.lovable.dev/v1/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            to: entry.email,
            subject: `${typeLabel}: ${announcement.title}`,
            html: fullHtml,
            sender_domain: "notify.turegu.com",
            from: "noreply@turegu.com",
            from_name: "Turegu",
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          failed++;
          console.error(`Failed to send to ${entry.email}:`, await res.text());
        }
      } catch (e) {
        failed++;
        console.error(`Error sending to ${entry.email}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ sent, failed, total: emailData.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
