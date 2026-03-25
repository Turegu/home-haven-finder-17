import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Languages, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TranslatableField {
  key: string;
  label: string;
  value_en: string;
  value_ar: string;
  value_fr?: string;
  onChange_en: (value: string) => void;
  onChange_ar: (value: string) => void;
  onChange_fr?: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  placeholder_en?: string;
  placeholder_ar?: string;
  placeholder_fr?: string;
  required?: boolean;
  error?: string;
  fieldType?: "name" | "description";
  renderAbove_en?: React.ReactNode;
  textareaId?: string;
}

interface LanguageContentTabsProps {
  fields: TranslatableField[];
  className?: string;
}

const LANGS = [
  { code: "en", label: "English", dir: "ltr" as const, langName: "English" },
  { code: "ar", label: "العربية", dir: "rtl" as const, langName: "Arabic" },
  { code: "fr", label: "Français", dir: "ltr" as const, langName: "French" },
];

const LanguageContentTabs = ({ fields, className }: LanguageContentTabsProps) => {
  const [activeTab, setActiveTab] = useState("en");
  const [translating, setTranslating] = useState(false);

  const activeLang = LANGS.find((l) => l.code === activeTab) || LANGS[0];
  const otherLangs = LANGS.filter((l) => l.code !== activeTab);

  const getFieldValue = (field: TranslatableField, langCode: string) => {
    if (langCode === "ar") return field.value_ar;
    if (langCode === "fr") return field.value_fr || "";
    return field.value_en;
  };

  const getFieldOnChange = (field: TranslatableField, langCode: string) => {
    if (langCode === "ar") return field.onChange_ar;
    if (langCode === "fr") return field.onChange_fr || (() => {});
    return field.onChange_en;
  };

  const handleTranslateAll = async () => {
    // Get source text from the active tab
    const fieldsWithContent = fields.filter((f) => getFieldValue(f, activeTab).trim().length > 0);

    if (fieldsWithContent.length === 0) {
      toast.error("Please fill in the fields first");
      return;
    }

    setTranslating(true);
    let totalTranslated = 0;

    try {
      for (const targetLang of otherLangs) {
        for (const field of fieldsWithContent) {
          const sourceText = getFieldValue(field, activeTab);
          const { data, error } = await supabase.functions.invoke("translate-to-arabic", {
            body: {
              text: sourceText,
              fieldType: field.fieldType || "description",
              targetLanguage: targetLang.langName,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          if (data?.translated) {
            getFieldOnChange(field, targetLang.code)(data.translated);
            totalTranslated++;
          }
        }
      }
      const langNames = otherLangs.map((l) => l.label).join(", ");
      toast.success(`Translated ${totalTranslated} field${totalTranslated > 1 ? "s" : ""} to ${langNames}! Review and edit if needed.`);
    } catch (err: any) {
      toast.error(err.message || "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  const hasContent = fields.some((f) => getFieldValue(f, activeTab).trim().length > 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/50">
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveTab(lang.code)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === lang.code
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Auto-translate button — always visible */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslateAll}
          disabled={translating || !hasContent}
          className="gap-1.5 text-xs h-8 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
        >
          {translating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {translating ? "Translating..." : "Auto Translate to All Languages"}
        </Button>
      </div>

      {/* Translation note */}
      <p className="text-xs text-muted-foreground italic -mt-2">
        Auto-translate for speed, or enter your own text in any language for maximum precision.
      </p>

      {/* Fields */}
      <div className="space-y-5">
        {fields.map((field) => {
          const isAr = activeTab === "ar";
          const value = getFieldValue(field, activeTab);
          const onChange = getFieldOnChange(field, activeTab);
          const placeholder = isAr
            ? field.placeholder_ar || (field.multiline ? "النص بالعربية..." : "الاسم بالعربية...")
            : activeTab === "fr"
            ? field.placeholder_fr || (field.multiline ? "Texte en français..." : "Nom en français...")
            : field.placeholder_en || "";

          return (
            <div key={field.key} className="space-y-2" data-field={field.key}>
              <Label className={cn(
                "text-foreground font-medium flex items-center gap-1.5",
                isAr && "flex-row-reverse"
              )}>
                {isAr && <Languages className="h-3.5 w-3.5 text-muted-foreground" />}
                {field.label}{field.required && !isAr ? " *" : ""}
              </Label>

              {!isAr && field.renderAbove_en}

              {field.multiline ? (
                <Textarea
                  id={!isAr ? field.textareaId : undefined}
                  dir={activeLang.dir}
                  value={value}
                  onChange={(e) => {
                    if (field.maxLength && e.target.value.length > field.maxLength) return;
                    onChange(e.target.value);
                  }}
                  className={cn(
                    "bg-secondary/50 min-h-[120px]",
                    isAr && "text-right font-arabic",
                    field.error && !isAr && "border-destructive"
                  )}
                  placeholder={placeholder}
                  maxLength={field.maxLength}
                />
              ) : (
                <Input
                  dir={activeLang.dir}
                  value={value}
                  onChange={(e) => {
                    if (field.maxLength && e.target.value.length > field.maxLength) return;
                    onChange(e.target.value);
                  }}
                  className={cn(
                    "bg-secondary/50",
                    isAr && "text-right font-arabic",
                    field.error && !isAr && "border-destructive"
                  )}
                  placeholder={placeholder}
                  maxLength={field.maxLength}
                />
              )}

              {field.maxLength && (
                <p className="text-xs text-muted-foreground text-right">
                  {(value || "").length}/{field.maxLength}{!isAr && field.key === "title" ? " characters" : ""}
                </p>
              )}

              {field.error && !isAr && (
                <p className="text-xs text-destructive">{field.error}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageContentTabs;
