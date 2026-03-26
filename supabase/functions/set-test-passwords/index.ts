import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_EMAILS = [
  "turegu.basic1@mailsac.com", "turegu.basic2@mailsac.com", "turegu.basic3@mailsac.com", "turegu.basic4@mailsac.com",
  "turegu.lite1@mailsac.com", "turegu.lite2@mailsac.com", "turegu.lite3@mailsac.com", "turegu.lite4@mailsac.com",
  "turegu.plus1@mailsac.com", "turegu.plus2@mailsac.com", "turegu.plus3@mailsac.com", "turegu.plus4@mailsac.com",
  "turegu.pro1@mailsac.com", "turegu.pro2@mailsac.com", "turegu.pro3@mailsac.com", "turegu.pro4@mailsac.com",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all users (paginate to get all)
    const allUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      allUsers.push(...data.users);
      if (data.users.length < 1000) break;
      page++;
    }

    const results: { email: string; status: string; error?: string }[] = [];

    for (const email of TEST_EMAILS) {
      const user = allUsers.find((u) => u.email === email);
      if (!user) {
        results.push({ email, status: "not_found" });
        continue;
      }
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: "Turegu@Test1",
        email_confirm: true,
      });
      if (error) {
        results.push({ email, status: "failed", error: error.message });
      } else {
        results.push({ email, status: "success" });
      }
    }

    const success = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const notFound = results.filter((r) => r.status === "not_found").length;

    return new Response(JSON.stringify({ success, failed, notFound, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
