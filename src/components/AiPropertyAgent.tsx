import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, MapPin, Bed, Bath, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import aiAgentIcon from "@/assets/ai-agent-icon.png";
import { useQuery } from "@tanstack/react-query";

interface AiPick {
  score: number;
  listing_type?: string;
  property: {
    id: string;
    title: string;
    price: number | null;
    currency: string | null;
    location: string | null;
    province: string | null;
    town: string | null;
    neighbourhood: string | null;
    property_type: string;
    property_purpose: string;
    area: number | null;
    area_unit: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    rooms: string | null;
    images: string[] | null;
    listing_id: string;
    property_classification: string | null;
    agents: { name: string; avatar_url: string | null } | null;
    companies: { name: string; logo_url: string | null } | null;
  };
}

const SUGGESTIONS = [
  "Large villa with sea view and pool",
  "Affordable apartment in city center",
  "Family home with garden near schools",
  "Modern penthouse with panoramic views",
];

const AiPropertyAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [picks, setPicks] = useState<AiPick[]>([]);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Check global AI search toggle
  const { data: aiEnabled = true } = useQuery({
    queryKey: ['ai-search-enabled'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_search_enabled')
        .maybeSingle();
      return data?.setting_value !== 'false';
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [analysis, picks]);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setAnalysis("");
    setPicks([]);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-property-search", {
        body: { message: q.trim() },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
      } else {
        setAnalysis(data.analysis || "");
        setPicks(data.picks || []);
      }
    } catch (e: any) {
      console.error("AI search error:", e);
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const tierBadge = (cls: string | null) => {
    if (cls === "premium") return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400/90 text-yellow-900">PREMIUM</span>;
    if (cls === "featured") return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/90 text-primary-foreground">FEATURED</span>;
    return null;
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "Price on request";
    return `${currency || "$"} ${price.toLocaleString()}`;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 shadow-xl transition-all duration-300 hover:scale-105 ${
          isOpen
            ? "bg-foreground text-background h-12 w-12 justify-center rounded-full"
            : "bg-primary text-primary-foreground pl-1.5 pr-4 py-1.5 rounded-full"
        }`}
        aria-label="AI Property Agent"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <img src={aiAgentIcon} alt="AI Agent" className="h-10 w-10 rounded-full object-cover border-2 border-primary-foreground/30" />
            <span className="text-sm font-semibold hidden sm:inline">Ask AI Agent</span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 z-50 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300"
          >
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
            <img src={aiAgentIcon} alt="AI Agent" className="h-11 w-11 rounded-full object-cover border-2 border-primary-foreground/30 bg-primary-foreground/10" />
            <div>
              <h3 className="font-semibold text-sm">AI Property Agent</h3>
              <p className="text-xs opacity-80">Describe your dream property</p>
            </div>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 280 }}>
            {/* Initial state */}
            {!analysis && !isLoading && !error && picks.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tell me what you're looking for — I'll find the best matches for you! ✨
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Try something like:</p>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); handleSearch(s); }}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-foreground"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Searching properties for you...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Results */}
            {!isLoading && picks.length > 0 && (
              <div className="space-y-4">
                {/* Property Cards */}
                <div className="space-y-3">
                  {picks.map((pick, i) => {
                    const p = pick.property;
                    const img = p.images?.[0];
                    const medal = i === 0 ? "🏆" : i === 1 ? "🥈" : "🥉";
                    const isProject = pick.listing_type === 'project';
                    const detailUrl = isProject ? `/projects/${p.id}` : `/property/${p.id}`;
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigate(detailUrl)}
                        className="w-full text-left rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow group flex"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-36 min-w-[9rem] shrink-0">
                          {img ? (
                            <img src={img} alt={p.title} className="w-full h-full object-cover min-h-[120px]" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs min-h-[120px]">No Image</div>
                          )}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className="text-lg">{medal}</span>
                            {tierBadge(p.property_classification)}
                          </div>
                          {isProject && (
                            <div className="absolute bottom-2 left-2 bg-accent/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">PROJECT</div>
                          )}
                        </div>
                        {/* Details */}
                        <div className="p-3 flex-1 flex flex-col justify-between min-w-0">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">{p.title}</h4>
                              <span className="shrink-0 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                                {pick.score}%
                              </span>
                            </div>
                            <p className="text-sm font-bold text-primary">{formatPrice(p.price, p.currency)}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="line-clamp-1">{[p.neighbourhood, p.town, p.province].filter(Boolean).join(", ") || p.location || "—"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1.5 border-t border-border/50 mt-1.5">
                            {p.rooms && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.rooms}</span>}
                            {p.bathrooms && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms}</span>}
                            {p.area && <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{p.area} {p.area_unit || "m²"}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* AI Analysis */}
                {analysis && (
                  <div className="rounded-xl bg-muted/50 border border-border p-3">
                    <div className="prose prose-sm max-w-none text-foreground [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_p]:text-xs [&_p]:leading-relaxed [&_li]:text-xs [&_ul]:my-1">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your dream property..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring max-h-20"
              />
              <Button
                size="icon"
                onClick={() => handleSearch()}
                disabled={!query.trim() || isLoading}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default AiPropertyAgent;
