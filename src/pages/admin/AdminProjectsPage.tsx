import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminListingTable, { ListingItem } from "@/components/admin/AdminListingTable";
import { FolderKanban } from "lucide-react";

const AdminProjectsPage = () => {
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, companies(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        company_name: p.companies?.name || "—",
      })) as ListingItem[];
    },
  });

  const columns = [
    { key: "listing_id", label: "ID" },
    { key: "created_at", label: "CREATION DATE" },
    { key: "project_status", label: "PROJECT STATUS" },
    { key: "project_type", label: "TYPE" },
    { key: "title", label: "TITLE" },
    { key: "company_name", label: "COMPANY NAME" },
    { key: "location", label: "LOCATION" },
  ];

  const renderCell = (item: ListingItem, key: string) => {
    if (key === "created_at") {
      return new Date(item.created_at).toLocaleString();
    }
    if (key === "project_status") {
      const colors: Record<string, string> = {
        new: "bg-blue-100 text-blue-800",
        approved: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
      };
      const val = item.project_status || "new";
      return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[val] || ""}`}>
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </span>
      );
    }
    if (key === "project_type") {
      return (item.project_type || "—").charAt(0).toUpperCase() + (item.project_type || "").slice(1);
    }
    if (key === "location") {
      const loc = item.location || "—";
      return <span className="max-w-[200px] truncate block">{loc}</span>;
    }
    return (item as any)[key] ?? "—";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Projects Management</h1>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading projects...</p>
        ) : (
          <AdminListingTable
            tableName="projects"
            queryKey="admin-projects"
            items={items}
            columns={columns}
            renderCell={renderCell}
            onView={(item) => navigate(`/projects/${item.id}`)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProjectsPage;
