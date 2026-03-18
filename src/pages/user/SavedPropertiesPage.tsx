import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface SavedProperty {
  id: string;
  property_id: string;
  property: {
    id: string; title: string; price: number | null; currency: string | null;
    property_type: string; area: number | null; area_unit: string | null;
    images: string[] | null; location: string | null; rooms: string | null;
  };
}

const SavedPropertiesPage = () => {
  const [items, setItems] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("saved_properties")
      .select("id, property_id, properties(id, title, price, currency, property_type, area, area_unit, images, location, rooms)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any;
    setItems((data || []).map((d: any) => ({ ...d, property: d.properties })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("saved_properties").delete().eq("id", id);
    if (error) { toast.error("Failed to remove"); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success("Removed from saved");
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Properties</h1>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">No saved properties yet.</p>
            <Link to="/buy"><Button variant="outline" className="mt-4">Browse Properties</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden flex">
                <img src={item.property?.images?.[0] || "/placeholder.svg"} alt="" className="w-32 h-full object-cover" />
                <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="font-bold text-primary text-lg">{item.property?.currency || "$"} {item.property?.price?.toLocaleString()}</p>
                    <Link to={`/property/${item.property_id}`} className="text-sm font-medium text-foreground hover:text-primary truncate block">{item.property?.title}</Link>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{item.property?.location || "—"}</p>
                    <p className="text-xs text-muted-foreground">{item.property?.property_type} • {item.property?.area} {item.property?.area_unit} • {item.property?.rooms || "—"}</p>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default SavedPropertiesPage;
