import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [blog, setBlog] = useState<any>(null);
  const [translation, setTranslation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (data) {
        setBlog(data);
        // Get English translation
        const { data: trans } = await supabase
          .from("blog_translations")
          .select("title, description")
          .eq("blog_id", data.id)
          .eq("language_code", "en")
          .single();
        setTranslation(trans);
      }
      setLoading(false);
    };
    fetchBlog();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>
      <Footer />
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Blog not found.</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary">Blogs</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{translation?.title || "Blog"}</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">{translation?.title}</h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
          <span>{new Date(blog.created_at).toLocaleDateString()}</span>
          {blog.author && <><span>•</span><span>{blog.author}</span></>}
        </div>

        {blog.image_url && (
          <div className="rounded-lg overflow-hidden mb-8">
            <img src={blog.image_url} alt={translation?.title} className="w-full max-h-[400px] object-cover" />
          </div>
        )}

        <div
          className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(translation?.description || "") }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
