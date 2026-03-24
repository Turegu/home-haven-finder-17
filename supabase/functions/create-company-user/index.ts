import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, companyData } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate company email
    const { data: existing } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "A company with this email already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user via invite
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { is_company: true },
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/company/login`,
      });

    if (inviteError) {
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate package_end_date from duration
    let packageEndDate: string | null = null;
    if (companyData.membership && companyData.membership !== "basic" && companyData.duration) {
      const now = new Date();
      switch (companyData.duration) {
        case "1 Month":
          now.setMonth(now.getMonth() + 1);
          break;
        case "3 Months":
          now.setMonth(now.getMonth() + 3);
          break;
        case "6 Months":
          now.setMonth(now.getMonth() + 6);
          break;
        case "1 Year":
          now.setFullYear(now.getFullYear() + 1);
          break;
      }
      packageEndDate = now.toISOString();
    }

    // Insert company with owner_user_id
    const { data: company, error: insertError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyData.name,
        email: email,
        phone: companyData.phone || null,
        whatsapp: companyData.whatsapp || null,
        company_types: companyData.company_types || null,
        service_areas: companyData.service_areas || null,
        languages: companyData.languages || null,
        registration_number: companyData.registration_number || null,
        about: companyData.about || null,
        membership: companyData.membership || "basic",
        package_end_date: packageEndDate,
        province: companyData.province || null,
        town: companyData.town || null,
        neighbourhood: companyData.neighbourhood || null,
        pin_location: companyData.pin_location || null,
        created_by: companyData.created_by || null,
        owner_user_id: inviteData.user.id,
        is_verified: true,
      })
      .select("id")
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, companyId: company.id, userId: inviteData.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
