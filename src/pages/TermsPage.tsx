import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const TermsPage = () => {
  const { t } = useTranslation();

  const { data: html = "" } = useQuery({
    queryKey: ['cms-page', 'terms'],
    queryFn: async () => {
      const { data } = await supabase.from("cms_pages").select("content").eq("page_slug", "terms").limit(1);
      if (data?.[0]) {
        const content = data[0].content as Record<string, Json>;
        const inner = content?.content as Record<string, Json> | undefined;
        return (inner?.html as string) || "";
      }
      return "";
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t('pages.terms.termsAndConditions')} description="Review Turegu's terms and conditions for using our real estate platform." url={window.location.href} />
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t('common.home')}</Link>
          <span>/</span>
          <span className="text-foreground">{t('pages.terms.termsAndConditions')}</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-8">{t('pages.terms.termsAndConditions')}</h1>
        <div
          className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;