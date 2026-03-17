import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const TermsPage = () => {
  const [html, setHtml] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("cms_pages").select("content").eq("page_slug", "terms").limit(1);
      if (data?.[0]) setHtml(((data[0] as any).content?.content?.html) || "");
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">Terms And Conditions</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-8">Terms And Conditions</h1>
        <div
          className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
