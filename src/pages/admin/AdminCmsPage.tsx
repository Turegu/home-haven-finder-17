import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CmsPage {
  id: string;
  page_slug: string;
  page_title: string;
  updated_at: string;
}

const AdminCmsPage = () => {
  const navigate = useNavigate();

  const { data: pages = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "cms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cms_pages")
        .select("id, page_slug, page_title, updated_at")
        .order("created_at");
      return (data || []) as CmsPage[];
    },
    staleTime: 30_000,
  });

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">CMS</h1>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Last Updated</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : pages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No pages found</TableCell>
              </TableRow>
            ) : (
              pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(page.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{page.page_title}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => navigate(`/admin/cms/${page.page_slug}`)}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminCmsPage;
