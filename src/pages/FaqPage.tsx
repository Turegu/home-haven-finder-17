import SEOHead from '@/components/SEOHead';
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FaqPage = () => {
  const { t, i18n } = useTranslation();

  const { data: faqs = [], isLoading: loading } = useQuery({
    queryKey: ['faqs', i18n.language],
    queryFn: async () => {
      const langCode = i18n.language === 'ar' ? 'ar' : 'en';
      const { data } = await supabase
        .from("faqs")
        .select("id, sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true });

      if (!data || data.length === 0) return [];

      const { data: trans } = await supabase
        .from("faq_translations")
        .select("faq_id, question, answer, language_code")
        .in("language_code", [langCode, "en"])
        .in("faq_id", data.map(f => f.id));

      const transMap: Record<string, { question: string; answer: string }> = {};
      if (trans) {
        trans.filter(t => t.language_code === 'en').forEach(t => {
          transMap[t.faq_id] = { question: t.question, answer: t.answer };
        });
        if (langCode !== 'en') {
          trans.filter(t => t.language_code === langCode).forEach(t => {
            transMap[t.faq_id] = { question: t.question, answer: t.answer };
          });
        }
      }

      return data.map((f): FaqItem => ({
        id: f.id,
        question: transMap[f.id]?.question || "Untitled",
        answer: transMap[f.id]?.answer || "",
      }));
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t('pages.faq.title')} description="Find answers to frequently asked questions about buying, selling, and renting properties on Turegu." url={window.location.href} />
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">{t('common.home')}</Link>
          <span>/</span>
          <span className="text-foreground">{t('pages.faq.title')}</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">{t('pages.faq.title')}</h1>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">{t('common.loading')}</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('pages.faq.noFaqsYet')}</div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faq.answer) }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FaqPage;
