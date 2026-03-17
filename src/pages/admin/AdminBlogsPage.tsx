import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Search, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Blog {
  id: string;
  slug: string;
  image_url: string | null;
  author: string | null;
  status: string;
  created_at: string;
  title?: string;
}

const AdminBlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchBlogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // Fetch English titles for display
      const { data: translations } = await supabase
        .from("blog_translations")
        .select("blog_id, title, language_code")
        .eq("language_code", "en")
        .in("blog_id", data.map(b => b.id));

      const titleMap: Record<string, string> = {};
      if (translations) {
        (translations as any[]).forEach((t: any) => { titleMap[t.blog_id] = t.title; });
      }

      setBlogs(data.map(b => ({ ...b, title: titleMap[b.id] || "(No English title)" })));
    } else {
      setBlogs([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBlogs(); }, []);

  const toggleStatus = async (blog: Blog) => {
    const newStatus = blog.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("blogs").update({ status: newStatus }).eq("id", blog.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Blog ${newStatus}` }); fetchBlogs(); }
  };

  const deleteBlog = async (blog: Blog) => {
    if (!confirm("Delete this blog permanently?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", blog.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Blog deleted" }); fetchBlogs(); }
  };

  const filtered = blogs.filter(b =>
    (b.title || "").toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-foreground">BLOGS</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 w-[220px]"
              />
            </div>
            <Button onClick={() => navigate("/admin/blog/new")} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Create New Blog
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="h-10 w-10" />
                      <p className="font-medium">No Blogs Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map(blog => (
                <TableRow key={blog.id}>
                  <TableCell>
                    {blog.image_url ? (
                      <img src={blog.image_url} alt="" className="w-16 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{blog.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{blog.slug}</TableCell>
                  <TableCell>{blog.author || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${blog.status === "published" ? "text-green-600" : "text-muted-foreground"}`}>
                      {blog.status === "published" ? "Published" : "Draft"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4 text-primary" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/blog/${blog.id}`)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(blog)}>
                          {blog.status === "published" ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {blog.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteBlog(blog)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlogsPage;
