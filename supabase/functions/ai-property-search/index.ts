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

    // Fetch all active properties with agent/company info
    const { data: properties, error: dbError } = await supabase
      .from("properties")
      .select("id, title, price, currency, location, province, town, neighbourhood, property_type, property_purpose, area, area_unit, bedrooms, bathrooms, rooms, images, listing_id, floor_level, furniture, property_age, parking_spaces, rent_duration, interior_amenities, exterior_amenities, property_classification, created_at, description, pin_location, agents(name, avatar_url), companies(name, logo_url)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(500);

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Failed to fetch properties");
    }

    // Sort by tier priority: premium > featured > standard
    const tierOrder = (cls: string | null) => {
      if (cls === "premium") return 0;
      if (cls === "featured") return 1;
      return 2;
    };
    const sorted = (properties ?? []).sort((a: any, b: any) => tierOrder(a.property_classification) - tierOrder(b.property_classification));

    // Build a compact summary for the AI
    const propertySummaries = sorted.map((p: any, i: number) => {
      return `[${i}] "${p.title}" | ${p.property_classification || 'standard'} | ${p.property_purpose} | ${p.property_type} | ${p.currency || 'USD'} ${p.price?.toLocaleString() || 'N/A'} | ${p.area || '?'} ${p.area_unit || 'm²'} | Rooms: ${p.rooms || '?'} | Beds: ${p.bedrooms ?? '?'} | Baths: ${p.bathrooms ?? '?'} | Location: ${[p.neighbourhood, p.town, p.province].filter(Boolean).join(', ')} | Parking: ${p.parking_spaces ?? '?'} | Furniture: ${p.furniture || '?'} | Floor: ${p.floor_level || '?'} | Age: ${p.property_age || '?'} | Interior: ${(p.interior_amenities || []).join(', ') || 'N/A'} | Exterior: ${(p.exterior_amenities || []).join(', ') || 'N/A'} | Desc: ${(p.description || '').substring(0, 150)}`;
    }).join("\n");

    const systemPrompt = `You are an expert real estate AI assistant. A user will describe their dream property. Your job is to find the TOP 3 best matching properties from the available listings.

CRITICAL RULES:
- ONLY match properties that have ACTUAL EVIDENCE in their data (title, description, location, amenities) supporting the user's request.
- NEVER assume a property has features that are not explicitly mentioned in its data. If a property has no description, no amenities, and no relevant keywords, it is NOT a match — even if the property type matches.
- A property with null/empty description and no amenities should get a very low score (below 20) unless its title or location explicitly contains the requested feature.
- If the user asks for "sea view", "beach", "lake", etc., the property MUST have those words in its title, description, location, or amenities to be considered a match.
- Always prioritize "premium" listings first, then "featured", then "standard" — but ONLY among properties that actually match.
- Return UP TO 3 picks. If fewer than 3 properties genuinely match, return fewer. It's better to return 1 great match than 3 poor ones.
- Be honest: if no properties match well, say so clearly.

SCORING GUIDE:
- 90-100: Property explicitly has the exact features requested (e.g., "sea view" in title/description when user asks for sea view)
- 70-89: Property strongly implies the features (e.g., coastal location when user asks for sea view)
- 50-69: Property partially matches (right type/area but missing key requested features)
- Below 50: Weak match — only include if nothing better exists
- DO NOT score above 50 if the property has no data supporting the user's specific request

Your response MUST contain these structured lines for each pick:
PICK|index_number|match_score (1-100)

Then write a friendly explanation for each pick using markdown:

## 🏆 Top Pick: Property Title
Why this matches — cite specific data from the listing.

## 🥈 Second Pick: Property Title  
Why this matches — cite specific data from the listing.

## 🥉 Third Pick: Property Title
Why this matches — cite specific data from the listing.

If a pick is a partial match, be upfront about what's missing.
End with a brief summary line.

Here are the available properties (sorted by tier priority):
${propertySummaries}`;

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
    const picks: { index: number; score: number; property: any }[] = [];
    let match;
    while ((match = pickRegex.exec(fullText)) !== null) {
      const idx = parseInt(match[1]);
      const score = parseInt(match[2]);
      if (idx >= 0 && idx < sorted.length) {
        picks.push({ index: idx, score, property: sorted[idx] });
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
