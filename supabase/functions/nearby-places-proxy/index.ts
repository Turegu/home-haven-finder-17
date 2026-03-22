import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// ── In-memory cache ──────────────────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 500;

function getCacheKey(query: string): string {
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
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

// ── Query helpers ────────────────────────────────────────────────
const replaceQueryTimeout = (query: string, seconds: number) =>
  query.replace(/\[timeout:\d+\]/, `[timeout:${seconds}]`);

const capRadius = (query: string, maxRadius: number) => {
  return query.replace(/around:(\d+)/g, (_match, r) => {
    const val = parseInt(r, 10);
    return `around:${Math.min(val, maxRadius)}`;
  });
};

// Reduce item limit to speed up queries
const capLimit = (query: string, maxItems: number) => {
  return query.replace(/\[out:json\]/, `[out:json][maxsize:1048576]`);
};

// Try endpoints sequentially with short timeouts
async function fetchFromOverpass(query: string, perRequestTimeoutMs: number): Promise<{ data: unknown } | { error: string }> {
  const prepared = capLimit(replaceQueryTimeout(capRadius(query.trim(), 3000), 25), 10);
  const errors: string[] = [];

  for (const url of OVERPASS_URLS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), perRequestTimeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(prepared)}`,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        errors.push(`${url} ${res.status}`);
        continue;
      }

      const text = await res.text();
      const data = JSON.parse(text);
      return { data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${url}: ${msg.slice(0, 60)}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  return { error: errors.join(" | ") };
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

    // ── Fetch from Overpass — 8s per request, sequential ──────
    const result = await fetchFromOverpass(query, 12000);

    if ("error" in result) {
      // Return empty elements instead of 504 so the UI doesn't break
      const emptyResponse = { elements: [] };
      return new Response(JSON.stringify(emptyResponse), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "EMPTY" },
      });
    }

    setCache(cacheKey, result.data);

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
