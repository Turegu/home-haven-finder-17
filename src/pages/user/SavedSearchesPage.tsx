import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Search, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface SavedSearch {
  id: string;
  title: string;
  search_type: string;
  search_params: Record<string, any>;
  created_at: string;
}

const PAGE_SIZE = 10;

const SavedSearchesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data || []) as SavedSearch[]);
    } catch (err) {
      console.error("Failed to load saved searches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setItems(p => p.filter(i => i.id !== id));
    queryClient.invalidateQueries({ queryKey: ['user-layout-counts'] });
    toast.success("Search deleted");
  };

  const handleRunSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    const sp = search.search_params;
    if (sp.propertyPurpose) params.set('propertyPurpose', sp.propertyPurpose);
    if (sp.province) params.set('province', sp.province);
    if (sp.district) params.set('district', sp.district);
    if (sp.neighborhood) params.set('neighborhood', sp.neighborhood);
    if (sp.q) params.set('q', sp.q);
    if (sp.propertyTypes) params.set('propertyTypes', sp.propertyTypes);
    if (sp.minPrice) params.set('minPrice', sp.minPrice);
    if (sp.maxPrice) params.set('maxPrice', sp.maxPrice);
    if (sp.rooms) params.set('rooms', sp.rooms);
    const base = sp.propertyPurpose === 'rent' ? '/rent' : '/buy';
    navigate(`${base}?${params.toString()}`);
  };

  const getParamsSummary = (params: Record<string, any>) => {
    const parts: string[] = [];
    if (params.province) parts.push(`Province: ${params.province}`);
    if (params.district) parts.push(`District: ${params.district}`);
    if (params.propertyTypes) parts.push(`Type: ${params.propertyTypes}`);
    if (params.minPrice || params.maxPrice) parts.push(`Price: ${params.minPrice || "—"}–${params.maxPrice || "—"}`);
    if (params.rooms) parts.push(`Rooms: ${params.rooms}`);
    if (params.q) parts.push(`Keyword: ${params.q}`);
    return parts.length > 0 ? parts.join(" • ") : "No filters";
  };

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Searches</h1>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No saved searches yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedItems.map(item => (
                <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{getParamsSummary(item.search_params)}</p>
                    <p className="text-xs text-muted-foreground">Saved: {format(new Date(item.created_at), "MMM dd, yyyy")}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRunSearch(item)} className="gap-1 shrink-0">
                    <Play className="h-3 w-3" /> Run
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{item.title}".</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default SavedSearchesPage;
