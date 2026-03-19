import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { properties } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!properties || !Array.isArray(properties) || properties.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 properties are required for comparison." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertySummaries = properties.map((p: any, i: number) => {
      return `Property ${i + 1}: "${p.title}"
  - Price: ${p.currency || 'USD'} ${p.price?.toLocaleString() || 'N/A'}
  - Type: ${p.property_type || 'N/A'}
  - Area: ${p.area || 'N/A'} ${p.area_unit || 'm²'}
  - Rooms: ${p.rooms || 'N/A'}
  - Bedrooms: ${p.bedrooms ?? 'N/A'}
  - Bathrooms: ${p.bathrooms ?? 'N/A'}
  - Parking: ${p.parking_spaces ?? 'N/A'}
  - Location: ${p.location || 'N/A'}`;
    }).join("\n\n");

    const systemPrompt = `You are a real estate investment analyst. You will be given details about 2-3 properties.

Your job is to provide a comprehensive investment analysis. Structure your response EXACTLY as follows:

## Investment Scores
Give each property a score out of 10 for these categories. Use this EXACT format for each property:
SCORES|Property Name|value_score|rental_score|growth_score|overall_score

Example: SCORES|Luxury Villa|7|8|6|7

## Price Analysis
Compare price per m² and value proposition of each property.

## Rental Yield Potential
Estimate rental yield potential based on location, type, and market.

## Pros & Cons
List 2-3 pros and cons for each property using bullet points.

## Investment Recommendation
Give a clear recommendation with a winner indicated like: WINNER|Property Name

Be concise, data-driven and objective.`;

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
          { role: "user", content: `Please analyze and compare these properties as investment opportunities:\n\n${propertySummaries}` },
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("compare-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
