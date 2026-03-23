import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BannerDisplay from "@/components/BannerDisplay";
import { supabase } from "@/integrations/supabase/client";

interface BlogItem {
  id: string;
  slug: string;
  image_url: string | null;
  author: string | null;
  created_at: string;
  title: string;
  description: string;
}

const BlogsPage = () => {
  const { t, i18n } = useTranslation();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      const { data } = await supabase
        .from("blogs")
        .select("id, slug, image_url, author, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Get English translations (fallback)
        const { data: trans } = await supabase
          .from("blog_translations")
          .select("blog_id, title, description")
          .eq("language_code", "en")
          .in("blog_id", data.map(b => b.id));

        const transMap: Record<string, { title: string; description: string }> = {};
        if (trans) (trans as any[]).forEach((t: any) => { transMap[t.blog_id] = { title: t.title, description: t.description }; });

        setBlogs(data.map(b => ({
          ...b,
          title: transMap[b.id]?.title || "Untitled",
          description: transMap[b.id]?.description || "",
        })));
      }
      setLoading(false);
    };
    fetchBlogs();
  }, []);

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">Blogs</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Blogs</h1>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No blogs published yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map(blog => (
              <Link
                key={blog.id}
                to={`/blog/${blog.slug}`}
                className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {blog.image_url ? (
                    <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(blog.created_at).toLocaleDateString()} {blog.author && `• ${blog.author}`}
                  </p>
                  <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {stripHtml(blog.description).slice(0, 150)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <BannerDisplay pageName="blog" position={1} bannerType="horizontal" className="mt-8" />
      </div>
      <Footer />
    </div>
  );
};

export default BlogsPage;
