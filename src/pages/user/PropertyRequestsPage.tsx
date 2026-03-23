import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface RequestItem {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  enquiry_type: string;
  property_type: string | null;
  province: string | null;
  budget: string | null;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 10;

const PropertyRequestsPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
          .from("property_requests")
          .select("id, full_name, email, phone, enquiry_type, property_type, province, budget, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setItems((data || []) as RequestItem[]);
      } catch (err) {
        console.error("Failed to load property requests:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusColor = (s: string) => {
    if (s === 'pending') return 'bg-amber-100 text-amber-700';
    if (s === 'contacted') return 'bg-blue-100 text-blue-700';
    if (s === 'closed') return 'bg-muted text-muted-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('userPages.propertyRequests')}</h1>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('userPages.noPropertyRequests')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                     <th className="text-left py-3 px-4 text-muted-foreground font-medium">{t('userPages.sno')}</th>
                     <th className="text-left py-3 px-4 text-muted-foreground font-medium">{t('userPages.enquiryType')}</th>
                     <th className="text-left py-3 px-4 text-muted-foreground font-medium">{t('filters.propertyType')}</th>
                     <th className="text-left py-3 px-4 text-muted-foreground font-medium">{t('filters.province')}</th>
                     <th className="text-left py-3 px-4 text-muted-foreground font-medium">{t('userPages.budget')}</th>
                     <th className="text-left py-3 px-4 text-muted-foreground font-medium">{t('property.status')}</th>
                     <th className="text-left py-3 px-4 text-muted-foreground font-medium">{t('userPages.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="py-3 px-4 text-foreground capitalize">{item.enquiry_type?.replace(/_/g, ' ') || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground capitalize">{item.property_type || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.province || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.budget || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{format(new Date(item.created_at), "MMM dd, yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{t('userPages.page')} {page} {t('common.of')} {totalPages}</span>
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

export default PropertyRequestsPage;
