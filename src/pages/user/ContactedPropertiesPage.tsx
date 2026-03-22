import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface Inquiry {
  id: string;
  property_id: string | null;
  inquiry_type: string;
  message: string | null;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  created_at: string;
  property: { title: string; location: string | null } | null;
}

const PAGE_SIZE = 10;

const ContactedPropertiesPage = () => {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data } = await supabase
        .from("user_inquiries")
        .select("id, property_id, inquiry_type, message, email, phone, full_name, created_at, properties(title, location)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any;
      setItems((data || []).map((d: any) => ({ ...d, property: d.properties })));
      setLoading(false);
    };
    load();
  }, []);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Contacted Properties</h1>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No contacted properties yet.</p>
            <Link to="/buy"><Button variant="outline" className="mt-4">Browse Properties</Button></Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">SNo</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Property Name</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Phone</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Message</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="py-3 px-4">
                        {item.property_id ? (
                          <Link to={`/property/${item.property_id}`} className="text-primary hover:underline">{item.property?.title || "—"}</Link>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{item.email || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.phone || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">{item.message || "—"}</td>
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

export default ContactedPropertiesPage;
