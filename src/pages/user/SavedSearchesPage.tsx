import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SavedSearch {
  id: string;
  title: string;
  search_type: string;
  search_params: Record<string, any>;
  created_at: string;
}

const SavedSearchesPage = () => {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data || []) as SavedSearch[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success("Search deleted");
  };

  const getParamsSummary = (params: Record<string, any>) => {
    const parts: string[] = [];
    if (params.location) parts.push(`Location: ${params.location}`);
    if (params.property_type) parts.push(`Type: ${params.property_type}`);
    if (params.min_price || params.max_price) parts.push(`Price: ${params.min_price || "—"}–${params.max_price || "—"}`);
    if (params.bedrooms) parts.push(`Rooms: ${params.bedrooms}`);
    return parts.length > 0 ? parts.join(", ") : "No filters";
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Searches</h1>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">No saved searches yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{getParamsSummary(item.search_params)}</p>
                  <p className="text-xs text-muted-foreground">Saved: {format(new Date(item.created_at), "MMM dd, yyyy")}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default SavedSearchesPage;
