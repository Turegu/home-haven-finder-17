import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

const CompareListPage = () => {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

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
    toast.success("Removed from compare list");
  };

  const handleDeleteAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("property_comparisons").delete().eq("user_id", user.id);
    setItems([]);
    setAiResult("");
    toast.success("Compare list cleared");
  };

  const handleAiEvaluate = async () => {
    if (items.length < 2) {
      toast.error("Add at least 2 properties to compare.");
      return;
    }

    setAiLoading(true);
    setAiResult("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/compare-properties-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            properties: items.map(i => i.property),
          }),
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
                className="gap-1.5"
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

        {/* AI Analysis Result */}
        {(aiResult || aiLoading) && (
          <div className="bg-card rounded-xl border border-border p-6 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Investment Analysis
            </h2>
            {aiLoading && !aiResult && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing properties...
              </div>
            )}
            {aiResult && (
              <div className="prose prose-sm max-w-none text-foreground">
                {aiResult.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(4)}</h3>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-1">{line.slice(3)}</h2>;
                  if (line.startsWith('# ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-1">{line.slice(2)}</h2>;
                  if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="ml-4 text-sm text-foreground/90">• {line.slice(2)}</p>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-sm mt-2">{line.replace(/\*\*/g, '')}</p>;
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="text-sm text-foreground/90">{line}</p>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default CompareListPage;
