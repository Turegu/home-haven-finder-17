import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminListingTable, { ListingItem } from "@/components/admin/AdminListingTable";
import { Home } from "lucide-react";

const AdminPropertiesPage = () => {
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, companies(name, membership)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        company_name: p.companies?.name || "—",
        company_membership: p.companies?.membership || "basic",
      })) as ListingItem[];
    },
  });

  const columns = [
    { key: "listing_id", label: "ID" },
    { key: "created_at", label: "CREATION DATE" },
    { key: "property_status", label: "PROPERTY STATUS" },
    { key: "property_purpose", label: "PURPOSE" },
    { key: "property_type", label: "TYPE" },
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
    if (key === "property_status") {
      const colors: Record<string, string> = {
        new: "bg-blue-100 text-blue-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
      };
      const val = item.property_status || "new";
      return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[val] || ""}`}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </span>
      );
    }
    if (key === "property_purpose") {
      return (item.property_purpose || "buy").charAt(0).toUpperCase() + (item.property_purpose || "buy").slice(1);
    }
    if (key === "property_type") {
      return (item.property_type || "—").charAt(0).toUpperCase() + (item.property_type || "").slice(1);
    }
    return (item as any)[key] ?? "—";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Home className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Properties Management</h1>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading properties...</p>
        ) : (
          <AdminListingTable
            tableName="properties"
            queryKey="admin-properties"
            items={items}
            columns={columns}
            renderCell={renderCell}
            onView={(item) => navigate(`/property/${item.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPropertiesPage;
