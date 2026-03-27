import SEOHead from '@/components/SEOHead';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const PrivacyPage = () => {
  const { t } = useTranslation();
  const [html, setHtml] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("cms_pages").select("content").eq("page_slug", "privacy").limit(1);
      if (data?.[0]) setHtml(((data[0] as any).content?.content?.html) || "");
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <title>{t('pages.privacy.title')} – Turegu</title>
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t('common.home')}</Link>
          <span>/</span>
          <span className="text-foreground">{t('pages.privacy.title')}</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-8">{t('pages.privacy.title')}</h1>
        <div
          className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;