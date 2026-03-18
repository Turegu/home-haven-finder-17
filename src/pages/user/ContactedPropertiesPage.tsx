import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
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

const ContactedPropertiesPage = () => {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Contacted Properties</h1>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">No contacted properties yet.</p>
          </div>
        ) : (
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
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">{idx + 1}</td>
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
        )}
      </div>
    </UserLayout>
  );
};

export default ContactedPropertiesPage;
