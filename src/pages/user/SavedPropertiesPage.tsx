import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, MapPin, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface SavedProperty {
  id: string;
  property_id: string;
  property: {
    id: string; title: string; price: number | null; currency: string | null;
    property_type: string; area: number | null; area_unit: string | null;
    images: string[] | null; location: string | null; rooms: string | null;
  };
}

const PAGE_SIZE = 10;

const SavedPropertiesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("saved_properties")
        .select("id, property_id, created_at, properties(title, price, currency, images, location, rooms, property_type, area, area_unit)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data ?? []).map((d: any) => ({ id: d.id, property_id: d.property_id, property: d.properties })));
    } catch (err) {
      console.error("Failed to load saved properties:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("saved_properties").delete().eq("id", id);
    if (error) { toast.error(t('userPages.failedToRemove')); return; }
    setItems(p => p.filter(i => i.id !== id));
    queryClient.invalidateQueries({ queryKey: ['saved-property-ids'] });
    queryClient.invalidateQueries({ queryKey: ['user-layout-counts'] });
    queryClient.invalidateQueries({ queryKey: ['header-counts'] });
    queryClient.invalidateQueries({ queryKey: ['header-saved-items'] });
    window.dispatchEvent(new Event('property-actions-changed'));
    toast.success(t('userPages.removedFromSaved'));
  };

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Properties</h1>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden flex">
                <Skeleton className="w-32 h-28" />
                <div className="p-4 flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Heart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No saved properties yet.</p>
            <Link to="/buy"><Button variant="outline" className="mt-4">Browse Properties</Button></Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedItems.map(item => (
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove saved property?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the property from your saved list.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemove(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
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

export default SavedPropertiesPage;
