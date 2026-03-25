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
  onChange_en: (value: string) => void;
  onChange_ar: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  placeholder_en?: string;
  placeholder_ar?: string;
  required?: boolean;
  error?: string;
  /** Pass "name" for short fields (brand names), "description" for long text */
  fieldType?: "name" | "description";
  /** Extra content to render below the EN field (e.g. RichTextToolbar) */
  renderAbove_en?: React.ReactNode;
  /** Custom textarea id for EN field */
  textareaId?: string;
}

interface LanguageContentTabsProps {
  fields: TranslatableField[];
  className?: string;
}

const LANGS = [
  { code: "en", label: "English", dir: "ltr" as const },
  { code: "ar", label: "العربية", dir: "rtl" as const },
];

const LanguageContentTabs = ({ fields, className }: LanguageContentTabsProps) => {
  const [activeTab, setActiveTab] = useState("en");
  const [translating, setTranslating] = useState(false);

  const activeLang = LANGS.find((l) => l.code === activeTab) || LANGS[0];

  const handleTranslateAll = async () => {
    const fieldsToTranslate = fields.filter((f) => {
      const source = f.value_en.trim();
      return source.length > 0;
    });

    if (fieldsToTranslate.length === 0) {
      toast.error("Please fill in the English fields first");
      return;
    }

    setTranslating(true);
    let successCount = 0;

    try {
      for (const field of fieldsToTranslate) {
        const { data, error } = await supabase.functions.invoke("translate-to-arabic", {
          body: { text: field.value_en, fieldType: field.fieldType || "description" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (data?.translated) {
          field.onChange_ar(data.translated);
          successCount++;
        }
      }
      toast.success(`Translated ${successCount} field${successCount > 1 ? "s" : ""}! Review and edit if needed.`);
    } catch (err: any) {
      toast.error(err.message || "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

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

        {/* Auto-translate button for Arabic tab */}
        {activeTab === "ar" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTranslateAll}
            disabled={translating || fields.every((f) => !f.value_en.trim())}
            className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/5"
          >
            {translating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {translating ? "Translating..." : "Auto Translate All"}
          </Button>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {fields.map((field) => {
          const isAr = activeTab === "ar";
          const value = isAr ? field.value_ar : field.value_en;
          const onChange = isAr ? field.onChange_ar : field.onChange_en;
          const placeholder = isAr
            ? field.placeholder_ar || (field.multiline ? "النص بالعربية..." : "الاسم بالعربية...")
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
                <p className={cn(
                  "text-xs text-muted-foreground",
                  isAr ? "text-right" : "text-right"
                )}>
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
