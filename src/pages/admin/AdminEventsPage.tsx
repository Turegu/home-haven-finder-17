import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminListingTable, { ListingItem } from "@/components/admin/AdminListingTable";
import { CalendarDays } from "lucide-react";

const AdminEventsPage = () => {
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, companies(name, membership)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        company_name: e.companies?.name || "—",
        company_membership: e.companies?.membership || "basic",
      })) as ListingItem[];
    },
  });

  const columns = [
    { key: "listing_id", label: "ID" },
    { key: "created_at", label: "CREATION DATE" },
    { key: "event_type", label: "EVENT TYPE" },
    { key: "title", label: "TITLE" },
    { key: "company_name", label: "COMPANY" },
    { key: "province", label: "PROVINCE" },
    { key: "town", label: "CITY" },
    { key: "updated_at", label: "LAST UPDATED" },
  ];

  const renderCell = (item: ListingItem, key: string) => {
    if (key === "created_at" || key === "updated_at") {
      const val = (item as any)[key];
      return val ? new Date(val).toLocaleDateString() : "—";
    }
    if (key === "event_type") {
      const val = (item.event_type || "—").replace(/_/g, " ");
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
    return (item as any)[key] ?? "—";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Events Management</h1>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading events...</p>
        ) : (
          <AdminListingTable
            tableName="events"
            queryKey="admin-events"
            items={items}
            columns={columns}
            renderCell={renderCell}
            onView={(item) => navigate(`/events/${item.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEventsPage;
