import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify JWT presence and decode sub claim (gateway validates signature)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    let userId: string | undefined;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      userId = payload.sub;
      if (!userId || (payload.exp && payload.exp * 1000 < Date.now())) {
        throw new Error("Invalid or expired token");
      }
    } catch (e) {
      console.error("JWT decode error:", e);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { properties } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!properties || !Array.isArray(properties) || properties.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 properties are required for comparison." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propertySummaries = properties.map((p: Record<string, unknown>, i: number) => {
      return `Property ${i + 1}: "${p.title}"
  - Price: ${p.currency || 'USD'} ${typeof p.price === 'number' ? p.price.toLocaleString() : 'N/A'}
  - Type: ${p.property_type || 'N/A'}
  - Area: ${p.area || 'N/A'} ${p.area_unit || 'm²'}
  - Rooms: ${p.rooms || 'N/A'}
  - Bedrooms: ${p.bedrooms ?? 'N/A'}
  - Bathrooms: ${p.bathrooms ?? 'N/A'}
  - Parking: ${p.parking_spaces ?? 'N/A'}
  - Location: ${p.location || 'N/A'}`;
    }).join("\n\n");

    const systemPrompt = `You are a real estate investment analyst. Analyze 2-3 properties and provide a structured investment report.

IMPORTANT: Your response MUST contain these exact structured lines mixed into your analysis:

1. For each property, output a line like this (scores 1-10):
SCORES|Short Property Name|value_score|rental_score|growth_score|overall_score

2. At the very end, output:
WINNER|Short Property Name

Now write the full analysis using these EXACT markdown sections:

## Price Analysis
Compare price per m², value for money. Use bullet points.

## Long-term Rental Potential
Estimate monthly/annual rental yield, tenant demand, occupancy rates. Consider the property type and location for rental appeal.

## Airbnb & Short-term Rental Potential
Analyze each property's suitability for Airbnb/short-term rentals. Consider:
- Tourist appeal of the location
- Property type suitability (apartments vs villas for Airbnb)
- Expected nightly rates and seasonal demand
- Regulatory considerations if applicable
Use bullet points.

## ROI & Break-even Analysis
Compare the investment return timeline. Which property pays for itself faster? Consider both long-term rental and Airbnb scenarios.

## Pros & Cons

For EACH property, write its name as a ### heading, then list pros with ✅ and cons with ❌:

### Property Name
- ✅ Pro point here
- ✅ Another pro
- ❌ Con point here
- ❌ Another con

## Final Verdict
Clearly state which property wins and why. Include a recommendation for which rental strategy (long-term vs Airbnb) suits each property best. Be decisive. Summarize in 2-3 sentences.

Be concise and data-driven.`;

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
          { role: "user", content: `Analyze these properties as investments:\n\n${propertySummaries}` },
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
