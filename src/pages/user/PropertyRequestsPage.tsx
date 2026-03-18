import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { format } from "date-fns";

interface InboxItem {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  inquiry_type: string;
  created_at: string;
}

const PropertyRequestsPage = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Fetch user inquiries of type 'property_request'
      const { data } = await supabase
        .from("user_inquiries")
        .select("*")
        .eq("user_id", user.id)
        .eq("inquiry_type", "property_request")
        .order("created_at", { ascending: false });
      setItems((data || []) as InboxItem[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Property Requests</h1>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">No property requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">SNo</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Full Name</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Phone</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Budget</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{idx + 1}</td>
                    <td className="py-3 px-4 text-foreground">{item.full_name || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.email || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.phone || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.message || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{format(new Date(item.created_at), "MMM dd, yyyy")}</td>
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

export default PropertyRequestsPage;
