import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const client = createClient(supabaseUrl, supabaseKey);

    const siteUrl = "https://turegu.com";

    const [{ data: properties }, { data: projects }, { data: agents }] = await Promise.all([
      client.from("properties").select("id, updated_at").eq("status", "active").limit(1000),
      client.from("projects").select("id, updated_at").eq("status", "active").limit(1000),
      client.from("agents").select("id, updated_at").eq("status", "active").limit(1000),
    ]);

    const urls: string[] = [];

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/buy", priority: "0.9", changefreq: "daily" },
      { loc: "/rent", priority: "0.9", changefreq: "daily" },
      { loc: "/projects", priority: "0.8", changefreq: "daily" },
      { loc: "/agents", priority: "0.7", changefreq: "weekly" },
      { loc: "/events", priority: "0.7", changefreq: "weekly" },
      { loc: "/blog", priority: "0.6", changefreq: "weekly" },
      { loc: "/faq", priority: "0.4", changefreq: "monthly" },
      { loc: "/contact-us", priority: "0.4", changefreq: "monthly" },
    ];

    for (const page of staticPages) {
      urls.push(`  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }

    // Properties
    for (const p of properties || []) {
      urls.push(`  <url>
    <loc>${siteUrl}/property/${p.id}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    // Projects
    for (const p of projects || []) {
      urls.push(`  <url>
    <loc>${siteUrl}/projects/${p.id}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }

    // Agents
    for (const a of agents || []) {
      urls.push(`  <url>
    <loc>${siteUrl}/agents/${a.id}</loc>
    <lastmod>${new Date(a.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    return new Response(`Error generating sitemap: ${err}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});
