import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Language {
  id: string;
  name: string;
  code: string;
}

interface TranslationData {
  question: string;
  answer: string;
}

const AdminFaqEditPage = () => {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [activeLang, setActiveLang] = useState("en");
  const [translations, setTranslations] = useState<Record<string, TranslationData>>({});
  const [saving, setSaving] = useState(false);

  useQuery({
    queryKey: ['admin', 'faq-edit', id],
    queryFn: async () => {
      const { data: langs } = await supabase
        .from("languages")
        .select("id, name, code")
        .eq("status", "active")
        .order("sort_order");

      if (langs && langs.length > 0) {
        setLanguages(langs);
        setActiveLang(langs[0].code);
        const initTrans: Record<string, TranslationData> = {};
        langs.forEach(l => { initTrans[l.code] = { question: "", answer: "" }; });
        setTranslations(initTrans);

        if (!isNew && id) {
          const { data: trans } = await supabase
            .from("faq_translations")
            .select("language_code, question, answer")
            .eq("faq_id", id);

          if (trans) {
            const map: Record<string, TranslationData> = {};
            langs.forEach(l => { map[l.code] = { question: "", answer: "" }; });
            trans.forEach(t => {
              map[t.language_code] = { question: t.question, answer: t.answer };
            });
            setTranslations(map);
          }
        }
      }
      return null;
    },
    staleTime: 60_000,
  });

  const updateTranslation = (langCode: string, field: keyof TranslationData, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [langCode]: { ...prev[langCode], [field]: value },
    }));
  };

  const handleSave = async () => {
    const hasContent = Object.values(translations).some(t => t.question);
    if (!hasContent) {
      toast({ title: "Please enter a question for at least one language", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let faqId = id;

      if (isNew) {
        // Get max sort order
        const { data: existing } = await supabase.from("faqs").select("sort_order").order("sort_order", { ascending: false }).limit(1);
        const maxOrder = existing && existing.length > 0 ? existing[0].sort_order : 0;

        const { data, error } = await supabase
          .from("faqs")
          .insert({ sort_order: maxOrder + 1 })
          .select("id")
          .single();
        if (error) throw error;
        faqId = data.id;
      } else {
        // Delete existing translations to re-insert
        await supabase.from("faq_translations").delete().eq("faq_id", faqId!);
      }

      const rows = Object.entries(translations)
        .filter(([_, t]) => t.question || t.answer)
        .map(([code, t]) => ({
          faq_id: faqId!,
          language_code: code,
          question: t.question,
          answer: t.answer,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("faq_translations").insert(rows);
        if (error) throw error;
      }

      toast({ title: isNew ? "FAQ created!" : "FAQ updated!" });
      navigate("/admin/faqs");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const currentTrans = translations[activeLang] || { question: "", answer: "" };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate("/admin/faqs")}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to FAQs
          </button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create FAQ" : "Save Changes"}
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-primary">{isNew ? "New FAQ" : "Edit FAQ"}</h1>

        {/* Language Tabs */}
        {languages.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                  activeLang === lang.code
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {lang.name}
              </button>
            ))}
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-primary font-medium">Question*</Label>
            <Input
              value={currentTrans.question}
              onChange={e => updateTranslation(activeLang, "question", e.target.value)}
              placeholder="Enter the FAQ question..."
              className="bg-muted/30"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-primary font-medium">Answer*</Label>
            <Textarea
              value={currentTrans.answer}
              onChange={e => updateTranslation(activeLang, "answer", e.target.value)}
              placeholder="Enter the answer... (HTML supported)"
              className="bg-muted/20 min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">Supports HTML for rich formatting.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFaqEditPage;
