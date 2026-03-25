import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminListingTable, { ListingItem } from "@/components/admin/AdminListingTable";
import { FolderKanban } from "lucide-react";
import { useTranslation } from "react-i18next";

const AdminProjectsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCompanyFilter = searchParams.get("company") || undefined;
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
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
    { key: "project_status", label: "PROJECT STATUS" },
    { key: "project_type", label: "TYPE" },
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
    return (item as any)[key] ?? "—";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t("admin.projectsManagement")}</h1>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">{t("admin.loadingProjects")}</p>
        ) : (
          <AdminListingTable
            tableName="projects"
            queryKey="admin-projects"
            items={items}
            columns={columns}
            renderCell={renderCell}
            onView={(item) => navigate(`/projects/${item.id}`)}
            initialCompanyFilter={initialCompanyFilter}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProjectsPage;
