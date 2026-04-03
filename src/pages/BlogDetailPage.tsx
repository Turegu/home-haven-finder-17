import SEOHead from '@/components/SEOHead';
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface BlogRow {
  id: string;
  slug: string;
  image_url: string | null;
  author: string | null;
  created_at: string;
  status: string;
}

interface BlogTranslation {
  title: string;
  description: string;
  language_code: string;
}

const BlogDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['blog', slug, i18n.language],
    queryFn: async () => {
      if (!slug) return null;
      const { data: blogData } = await supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (!blogData) return null;

      const langCode = i18n.language === 'ar' ? 'ar' : 'en';
      const { data: allTrans } = await supabase
        .from("blog_translations")
        .select("title, description, language_code")
        .eq("blog_id", blogData.id)
        .in("language_code", [langCode, "en"]);

      const translations = (allTrans || []) as BlogTranslation[];
      const preferred = translations.find(t => t.language_code === langCode);
      const fallback = translations.find(t => t.language_code === 'en');
      const translation = preferred || fallback || null;

      return { blog: blogData as BlogRow, translation };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const blog = data?.blog ?? null;
  const translation = data?.translation ?? null;

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">{t("common.loading")}</div>
      <Footer />
    </div>
  );

  if (!blog) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">{t('detail.blogNotFound')}</div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={translation?.title || 'Blog'}
        description={translation?.description?.replace(/<[^>]*>/g, '').slice(0, 160) || undefined}
        image={blog.image_url || undefined}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: translation?.title,
          image: blog.image_url,
          datePublished: blog.created_at,
          author: blog.author ? { '@type': 'Person', name: blog.author } : undefined,
        }}
      />
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t('common.home')}</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-primary">{t('pages.blog.blogs')}</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{translation?.title || t('pages.blog.title')}</span>
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
