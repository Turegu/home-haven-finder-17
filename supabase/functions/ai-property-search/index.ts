import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch membership packages that have AI search enabled
    const { data: aiPackages } = await supabase
      .from("membership_packages")
      .select("package_type")
      .eq("has_ai_search", true);
    
    const eligibleMemberships = (aiPackages || []).map((p: any) => p.package_type);

    // Fetch companies with eligible memberships
    let companyIds: string[] = [];
    if (eligibleMemberships.length > 0) {
      const { data: eligibleCompanies } = await supabase
        .from("companies")
        .select("id")
        .in("membership", eligibleMemberships)
        .eq("is_verified", true);
      companyIds = (eligibleCompanies || []).map((c: any) => c.id);
    }

    if (companyIds.length === 0) {
      return new Response(JSON.stringify({
        analysis: "No properties or projects are currently included in AI search. Listings from eligible membership plans will appear here.",
        picks: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch properties belonging to eligible companies
    const { data: properties, error: dbError } = await supabase
      .from("properties")
      .select("id, title, price, currency, location, province, town, neighbourhood, property_type, property_purpose, area, area_unit, bedrooms, bathrooms, rooms, images, listing_id, floor_level, furniture, property_age, parking_spaces, rent_duration, interior_amenities, exterior_amenities, property_classification, created_at, description, pin_location, agents(name, avatar_url), companies(name, logo_url)")
      .eq("status", "active")
      .in("company_id", companyIds)
      .order("created_at", { ascending: false })
      .limit(300);

    // Fetch projects belonging to eligible companies
    const { data: projects, error: projError } = await supabase
      .from("projects")
      .select("id, title, min_price, max_price, currency, location, province, town, neighbourhood, project_type, project_status, min_area, max_area, area_unit, images, listing_id, interior_amenities, exterior_amenities, property_classification, created_at, description, pin_location, developer, tagline, agents(name, avatar_url), companies(name, logo_url)")
      .eq("status", "active")
      .in("company_id", companyIds)
      .order("created_at", { ascending: false })
      .limit(200);

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to fetch properties");
    }
    if (projError) {
      console.error("Project DB error:", projError);
    }

    // Sort by tier priority: premium > featured > standard
    const tierOrder = (cls: string | null) => {
      if (cls === "premium") return 0;
      if (cls === "featured") return 1;
      return 2;
    };

    // Combine properties and projects into a unified list
    const allListings: any[] = [];
    
    for (const p of (properties ?? [])) {
      allListings.push({ ...p, _type: 'property' });
    }
    for (const p of (projects ?? [])) {
      allListings.push({ ...p, _type: 'project' });
    }

    allListings.sort((a: any, b: any) => tierOrder(a.property_classification) - tierOrder(b.property_classification));

    // Build a compact summary for the AI
    const listingSummaries = allListings.map((p: any, i: number) => {
      const desc = (p.description || '').substring(0, 500);
      const pin = p.pin_location || '';
      if (p._type === 'project') {
        return `[${i}] PROJECT: "${p.title}" | ${p.property_classification || 'standard'} | Type: ${p.project_type} | Status: ${p.project_status} | ${p.currency || 'USD'} ${p.min_price?.toLocaleString() || 'N/A'}-${p.max_price?.toLocaleString() || 'N/A'} | Area: ${p.min_area || '?'}-${p.max_area || '?'} ${p.area_unit || 'm²'} | Developer: ${p.developer || '?'} | Location: ${[p.neighbourhood, p.town, p.province].filter(Boolean).join(', ')} | Pin: ${pin} | Interior: ${(p.interior_amenities || []).join(', ') || 'N/A'} | Exterior: ${(p.exterior_amenities || []).join(', ') || 'N/A'} | Desc: ${desc}`;
      }
      return `[${i}] PROPERTY: "${p.title}" | ${p.property_classification || 'standard'} | ${p.property_purpose} | ${p.property_type} | ${p.currency || 'USD'} ${p.price?.toLocaleString() || 'N/A'} | ${p.area || '?'} ${p.area_unit || 'm²'} | Rooms: ${p.rooms || '?'} | Beds: ${p.bedrooms ?? '?'} | Baths: ${p.bathrooms ?? '?'} | Location: ${[p.neighbourhood, p.town, p.province].filter(Boolean).join(', ')} | Pin: ${pin} | Parking: ${p.parking_spaces ?? '?'} | Furniture: ${p.furniture || '?'} | Floor: ${p.floor_level || '?'} | Age: ${p.property_age || '?'} | Interior: ${(p.interior_amenities || []).join(', ') || 'N/A'} | Exterior: ${(p.exterior_amenities || []).join(', ') || 'N/A'} | Desc: ${desc}`;
    }).join("\n");

    const systemPrompt = `You are an expert real estate AI assistant. A user will describe what they're looking for. Your job is to find the TOP 3 best matching listings from the available PROPERTIES and PROJECTS.

LISTING TYPES:
- PROPERTY: Individual properties for sale or rent (apartments, villas, offices, etc.)
- PROJECT: Real estate development projects with multiple units (may have price ranges and area ranges)

CRITICAL RULES:
- READ THE FULL DESCRIPTION AND ALL AMENITIES of every listing carefully before scoring.
- ONLY match listings that have ACTUAL EVIDENCE in their data supporting the user's request.
- NEVER assume a listing has features that are not explicitly mentioned in its data.
- A listing with null/empty description and no amenities should get a very low score (below 20).
- Always prioritize "premium" listings first, then "featured", then "standard" — but ONLY among listings that actually match.
- Return UP TO 3 picks. If fewer than 3 genuinely match, return fewer.
- Be honest: if no listings match well, say so clearly.
- You can mix properties and projects in your picks — choose whichever best matches.

PROXIMITY & GEOGRAPHIC REASONING:
- Listings have "Pin" coordinates (lat,lng). Use these to reason about proximity to geographic features.
- If an exact match isn't found, BE HELPFUL: suggest the closest alternatives.
- Use your geographic knowledge of the region (Turkey, etc.) to infer proximity.

SCORING GUIDE:
- 90-100: Listing explicitly has the exact features requested
- 70-89: Listing strongly implies the features
- 50-69: Partially matches
- Below 50: Weak match
- DO NOT score above 50 if the listing has no data supporting the user's specific request

Your response MUST contain these structured lines for each pick:
PICK|index_number|match_score (1-100)

Then write a friendly explanation for each pick using markdown:

## 🏆 Top Pick: Listing Title
Why this matches — cite specific data from the listing.

## 🥈 Second Pick: Listing Title  
Why this matches — cite specific data from the listing.

## 🥉 Third Pick: Listing Title
Why this matches — cite specific data from the listing.

If a pick is a partial match, be upfront about what's missing.
End with a brief summary line.

Here are the available listings (sorted by tier priority):
${listingSummaries}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // We need to collect the full AI response to extract PICK lines, then return structured data
    // But we also want streaming UX — so we'll stream the AI response AND prepend property data
    
    // Collect full response to parse picks
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        } catch {}
      }
    }

    // Extract PICK lines
    const pickRegex = /PICK\|(\d+)\|(\d+)/g;
    const picks: { index: number; score: number; listing: any }[] = [];
    let match;
    while ((match = pickRegex.exec(fullText)) !== null) {
      const idx = parseInt(match[1]);
      const score = parseInt(match[2]);
      if (idx >= 0 && idx < allListings.length) {
        picks.push({ index: idx, score, listing: allListings[idx] });
      }
    }

    // Clean PICK lines from the text
    const cleanedText = fullText.replace(/PICK\|\d+\|\d+\n?/g, "").trim();

    return new Response(JSON.stringify({
      analysis: cleanedText,
      picks: picks.map(p => ({
        score: p.score,
        property: {
          id: p.property.id,
          title: p.property.title,
          price: p.property.price,
          currency: p.property.currency,
          location: p.property.location,
          province: p.property.province,
          town: p.property.town,
          neighbourhood: p.property.neighbourhood,
          property_type: p.property.property_type,
          property_purpose: p.property.property_purpose,
          area: p.property.area,
          area_unit: p.property.area_unit,
          bedrooms: p.property.bedrooms,
          bathrooms: p.property.bathrooms,
          rooms: p.property.rooms,
          images: p.property.images,
          listing_id: p.property.listing_id,
          property_classification: p.property.property_classification,
          agents: p.property.agents,
          companies: p.property.companies,
        },
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-property-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
