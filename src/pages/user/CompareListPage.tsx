import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import {
  Trash2, MapPin, Sparkles, Loader2, TrendingUp, DollarSign,
  Home, BarChart3, Trophy, ThumbsUp, ThumbsDown, Star
} from "lucide-react";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from "recharts";

interface CompareProperty {
  id: string; title: string; price: number | null; currency: string | null;
  property_type: string; area: number | null; area_unit: string | null;
  images: string[] | null; location: string | null; rooms: string | null;
  bedrooms: number | null; bathrooms: number | null; parking_spaces: number | null;
}

interface CompareItem {
  id: string;
  property_id: string;
  property: CompareProperty;
}

interface PropertyScore {
  name: string;
  value: number;
  rental: number;
  growth: number;
  overall: number;
}

const CHART_COLORS = [
  "hsl(174, 100%, 29%)",  // teal
  "hsl(43, 54%, 55%)",    // gold
  "hsl(220, 70%, 55%)",   // blue
];

const CompareListPage = () => {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [scores, setScores] = useState<PropertyScore[]>([]);
  const [winner, setWinner] = useState("");

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("property_comparisons")
      .select("id, property_id, properties(id, title, price, currency, property_type, area, area_unit, images, location, rooms, bedrooms, bathrooms, parking_spaces)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any;
    setItems((data || []).map((d: any) => ({ ...d, property: d.properties })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("property_comparisons").delete().eq("id", id);
    if (error) { toast.error("Failed to remove"); return; }
    setItems(p => p.filter(i => i.id !== id));
    window.dispatchEvent(new Event('property-actions-changed'));
    toast.success("Removed from compare list");
  };

  const handleDeleteAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("property_comparisons").delete().eq("user_id", user.id);
    setItems([]);
    setAiResult("");
    setScores([]);
    setWinner("");
    window.dispatchEvent(new Event('property-actions-changed'));
    toast.success("Compare list cleared");
  };

  // Parse structured data from AI response
  const parseAiResponse = (text: string) => {
    // Parse SCORES lines
    const scoreLines = text.match(/SCORES\|([^|]+)\|(\d+)\|(\d+)\|(\d+)\|(\d+)/g) || [];
    const parsedScores: PropertyScore[] = scoreLines.map(line => {
      const parts = line.split("|");
      return {
        name: parts[1]?.trim().substring(0, 20) || "Property",
        value: parseInt(parts[2]) || 0,
        rental: parseInt(parts[3]) || 0,
        growth: parseInt(parts[4]) || 0,
        overall: parseInt(parts[5]) || 0,
      };
    });
    if (parsedScores.length > 0) setScores(parsedScores);

    // Parse WINNER
    const winnerMatch = text.match(/WINNER\|(.+)/);
    if (winnerMatch) setWinner(winnerMatch[1].trim());
  };

  const handleAiEvaluate = async () => {
    if (items.length < 2) {
      toast.error("Add at least 2 properties to compare.");
      return;
    }

    setAiLoading(true);
    setAiResult("");
    setScores([]);
    setWinner("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-properties-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ properties: items.map(i => i.property) }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI unavailable" }));
        toast.error(err.error || "AI analysis failed.");
        setAiLoading(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              setAiResult(result);
              parseAiResponse(result);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("AI analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Build price comparison data
  const priceData = items.map((item, i) => ({
    name: (item.property?.title || "Property").substring(0, 15),
    price: item.property?.price || 0,
    pricePerSqm: item.property?.price && item.property?.area
      ? Math.round(item.property.price / item.property.area)
      : 0,
    fill: CHART_COLORS[i],
  }));

  // Build radar data from scores
  const radarData = scores.length > 0 ? [
    { metric: "Value", ...Object.fromEntries(scores.map(s => [s.name, s.value])) },
    { metric: "Rental", ...Object.fromEntries(scores.map(s => [s.name, s.rental])) },
    { metric: "Growth", ...Object.fromEntries(scores.map(s => [s.name, s.growth])) },
    { metric: "Overall", ...Object.fromEntries(scores.map(s => [s.name, s.overall])) },
  ] : [];

  // No need to pre-filter - renderMarkdownLine handles SCORES/WINNER lines

  const renderMarkdownLine = (line: string, i: number) => {
    // Skip structural data lines
    if (line.startsWith("SCORES|") || line.startsWith("WINNER|")) return null;
    
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-sm font-bold mt-5 mb-2 text-foreground flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg"><Home className="h-4 w-4 text-primary" />{line.slice(4)}</h3>;
    }
    if (line.startsWith('## ')) {
      const text = line.slice(3);
      let icon = <TrendingUp className="h-5 w-5 text-primary" />;
      if (text.toLowerCase().includes('price')) icon = <DollarSign className="h-5 w-5 text-primary" />;
      if (text.toLowerCase().includes('rental')) icon = <Home className="h-5 w-5 text-primary" />;
      if (text.toLowerCase().includes('pros') || text.toLowerCase().includes('cons')) icon = <ThumbsUp className="h-5 w-5 text-primary" />;
      if (text.toLowerCase().includes('verdict') || text.toLowerCase().includes('recommendation') || text.toLowerCase().includes('winner')) icon = <Trophy className="h-5 w-5 text-primary" />;
      if (text.toLowerCase().includes('score')) icon = <Star className="h-5 w-5 text-primary" />;
      return <h2 key={i} className="text-base font-bold mt-6 mb-2 text-foreground flex items-center gap-2 border-b border-border pb-2">{icon}{text}</h2>;
    }
    if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">{line.slice(2)}</h2>;
    
    // Pro items (✅ or **Pro**)
    if (line.includes('✅')) {
      return <p key={i} className="ml-4 text-sm text-foreground/90 flex items-start gap-2 my-1"><ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>{line.replace(/^[-*]\s*/, '').replace('✅ ', '').replace('✅', '').replace(/\*\*/g, '')}</span></p>;
    }
    // Con items (❌ or **Con**)
    if (line.includes('❌')) {
      return <p key={i} className="ml-4 text-sm text-foreground/90 flex items-start gap-2 my-1"><ThumbsDown className="h-4 w-4 text-red-400 mt-0.5 shrink-0" /><span>{line.replace(/^[-*]\s*/, '').replace('❌ ', '').replace('❌', '').replace(/\*\*/g, '')}</span></p>;
    }
    
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.slice(2);
      return <p key={i} className="ml-4 text-sm text-foreground/90 flex items-start gap-2 my-1"><span className="text-primary mt-0.5 shrink-0">•</span><span>{renderInlineBold(content)}</span></p>;
    }
    if (line.trim() === '') return <div key={i} className="h-2" />;
    // Regular paragraph with inline bold
    return <p key={i} className="text-sm text-foreground/90 my-0.5">{renderInlineBold(line)}</p>;
  };

  const renderInlineBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Compare List</h1>
          <div className="flex items-center gap-2">
            {items.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiEvaluate}
                disabled={aiLoading}
                className="gap-1.5 border-primary/30 hover:bg-primary/5"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                AI Investment Analysis
              </Button>
            )}
            {items.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteAll}>Delete All</Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">Maximum 3 properties allowed for comparison.</p>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">No properties to compare.</p>
            <Link to="/buy"><Button variant="outline" className="mt-4">Browse Properties</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Property</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Price</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Area</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Rooms</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Baths</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Parking</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={item.property?.images?.[0] || "/placeholder.svg"} alt="" className="h-12 w-16 rounded object-cover" />
                        <div className="min-w-0">
                          <Link to={`/property/${item.property_id}`} className="font-medium text-foreground hover:text-primary text-xs truncate block">{item.property?.title}</Link>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{item.property?.location || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-primary">{item.property?.currency || "$"} {item.property?.price?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.property?.property_type}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.property?.area} {item.property?.area_unit}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.property?.rooms || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.property?.bathrooms ?? "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.property?.parking_spaces ?? "—"}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Price Comparison Charts - always visible if items exist */}
        {items.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-primary" />
                Price Comparison
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priceData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                    {priceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                Price per m²
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priceData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}/m²`} />
                  <Bar dataKey="pricePerSqm" radius={[6, 6, 0, 0]}>
                    {priceData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Analysis Result */}
        {(aiResult || aiLoading) && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 p-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Investment Analysis
              </h2>

              {aiLoading && !aiResult && (
                <div className="flex items-center gap-3 text-muted-foreground text-sm py-8 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Analyzing properties...</span>
                </div>
              )}

              {/* Score Cards & Radar Chart */}
              {scores.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {/* Score Cards */}
                  <div className="space-y-3">
                    {scores.map((s, i) => (
                      <div
                        key={s.name}
                        className={`rounded-lg border p-4 ${winner && s.name.toLowerCase().includes(winner.toLowerCase().substring(0, 10)) ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                            <span className="font-semibold text-sm text-foreground">{s.name}</span>
                          </div>
                          {winner && s.name.toLowerCase().includes(winner.toLowerCase().substring(0, 10)) && (
                            <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              <Trophy className="h-3 w-3" /> Best Pick
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "Value", val: s.value, icon: DollarSign },
                            { label: "Rental", val: s.rental, icon: Home },
                            { label: "Growth", val: s.growth, icon: TrendingUp },
                            { label: "Overall", val: s.overall, icon: Star },
                          ].map(m => (
                            <div key={m.label} className="text-center">
                              <m.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                              <div className="text-lg font-bold text-foreground">{m.val}</div>
                              <div className="text-[10px] text-muted-foreground">{m.label}</div>
                              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${m.val * 10}%`, backgroundColor: CHART_COLORS[i] }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Radar Chart */}
                  <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                        {scores.map((s, i) => (
                          <Radar
                            key={s.name}
                            name={s.name}
                            dataKey={s.name}
                            stroke={CHART_COLORS[i]}
                            fill={CHART_COLORS[i]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Rendered AI text */}
              {aiResult && (
                <div className="bg-card rounded-lg border border-border p-5">
                  {aiResult.split('\n').map(renderMarkdownLine)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default CompareListPage;
