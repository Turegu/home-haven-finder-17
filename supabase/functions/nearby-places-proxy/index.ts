import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// ── In-memory cache ──────────────────────────────────────────────
// Key: rounded query string, Value: { data, timestamp }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 500;

function getCacheKey(query: string): string {
  // Round coordinates in the query to ~500m grid so nearby properties share cache
  return query.replace(/(-?\d+\.\d{2})\d*/g, "$1");
}

function getFromCache(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown) {
  // Evict oldest entries if cache is full
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

// ── Query helpers ────────────────────────────────────────────────
type QueryVariant = {
  name: string;
  query: string;
  requestTimeoutMs: number;
};

const replaceQueryTimeout = (query: string, seconds: number) =>
  query.replace(/\[timeout:\d+\]/, `[timeout:${seconds}]`);

const replaceAroundRadius = (query: string, radius: number) =>
  query.replace(/around:\d+/g, `around:${radius}`);

const replaceOutLimit = (query: string, limit: number) =>
  query.replace(/out body\s+\d+;/, `out body ${limit};`);

const capRadius = (query: string, maxRadius: number) => {
  return query.replace(/around:(\d+)/g, (_match, r) => {
    const val = parseInt(r, 10);
    return `around:${Math.min(val, maxRadius)}`;
  });
};

function buildQueryVariants(originalQuery: string): QueryVariant[] {
  const trimmed = capRadius(originalQuery.trim(), 3000);

  const fallbackQuery = replaceOutLimit(
    replaceAroundRadius(replaceQueryTimeout(trimmed, 10), 2000),
    15,
  );

  return [
    {
      name: "primary",
      query: replaceQueryTimeout(trimmed, 18),
      requestTimeoutMs: 22000,
    },
    {
      name: "fallback_compact",
      query: fallbackQuery,
      requestTimeoutMs: 14000,
    },
  ];
}

async function requestOverpass(url: string, query: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (query.length > 12000) {
      return new Response(JSON.stringify({ error: "Query too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Check cache first ──────────────────────────────────────
    const cacheKey = getCacheKey(query);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    // ── Fetch from Overpass ────────────────────────────────────
    const queryVariants = buildQueryVariants(query);
    let lastError = "Overpass request failed";
    let lastStatus = 502;

    for (const variant of queryVariants) {
      for (const overpassUrl of OVERPASS_URLS) {
        try {
          const response = await requestOverpass(overpassUrl, variant.query, variant.requestTimeoutMs);
          const responseText = await response.text();

          if (!response.ok) {
            lastStatus = response.status;
            lastError = `${variant.name} ${overpassUrl}: ${responseText.slice(0, 300)}`;
            continue;
          }

          let data;
          try {
            data = JSON.parse(responseText);
          } catch {
            lastStatus = 502;
            lastError = `${variant.name} ${overpassUrl}: Invalid Overpass response`;
            continue;
          }

          // ── Store in cache ─────────────────────────────────
          setCache(cacheKey, data);

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
          });
        } catch (error) {
          lastStatus = 504;
          const message = error instanceof Error ? error.message : "Unknown proxy error";
          lastError = `${variant.name} ${overpassUrl}: ${message}`;
        }
      }
    }

    return new Response(
      JSON.stringify({ error: "Overpass request failed", details: lastError }),
      {
        status: lastStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
