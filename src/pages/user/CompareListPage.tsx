import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CompareItem {
  id: string;
  property_id: string;
  property: {
    id: string; title: string; price: number | null; currency: string | null;
    property_type: string; area: number | null; area_unit: string | null;
    images: string[] | null; location: string | null; rooms: string | null;
    bedrooms: number | null; bathrooms: number | null; parking_spaces: number | null;
  };
}

const CompareListPage = () => {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    toast.success("Compare list cleared");
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Compare List</h1>
          {items.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>Delete All</Button>
          )}
        </div>

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
      </div>
    </UserLayout>
  );
};

export default CompareListPage;
