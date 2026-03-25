import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ArabicTranslateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sourceText: string;
  fieldType?: "name" | "description";
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

const ArabicTranslateField = ({
  label,
  value,
  onChange,
  sourceText,
  fieldType = "description",
  multiline = false,
  maxLength,
  placeholder,
  className = "",
}: ArabicTranslateFieldProps) => {
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error("Please fill in the English field first");
      return;
    }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-to-arabic", {
        body: { text: sourceText, fieldType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.translated) {
        onChange(data.translated);
        toast.success("Translation completed! Review and edit if needed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Translation failed");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-foreground font-medium flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={translating || !sourceText.trim()}
          className="h-7 text-xs gap-1.5 shrink-0"
        >
          {translating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Languages className="h-3 w-3" />
          )}
          {translating ? "Translating..." : "Auto Translate"}
        </Button>
      </div>
      {multiline ? (
        <Textarea
          dir="rtl"
          value={value}
          onChange={(e) => {
            if (maxLength && e.target.value.length > maxLength) return;
            onChange(e.target.value);
          }}
          className="bg-secondary/50 min-h-[100px] text-right font-arabic"
          placeholder={placeholder || "النص بالعربية..."}
          maxLength={maxLength}
        />
      ) : (
        <Input
          dir="rtl"
          value={value}
          onChange={(e) => {
            if (maxLength && e.target.value.length > maxLength) return;
            onChange(e.target.value);
          }}
          className="bg-secondary/50 text-right font-arabic"
          placeholder={placeholder || "الاسم بالعربية..."}
          maxLength={maxLength}
        />
      )}
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">{(value || "").length}/{maxLength}</p>
      )}
    </div>
  );
};

export default ArabicTranslateField;
