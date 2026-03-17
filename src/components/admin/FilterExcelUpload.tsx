import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ParsedOption {
  title: string;
  translations: Record<string, string>;
}

interface ParsedCategory {
  category_key: string;
  title: string;
  applies_to: string[];
  translations: Record<string, string>;
  options: ParsedOption[];
}

const LANG_CODES = ["tr", "ar", "fr", "ru", "de", "fa"];

interface FilterExcelUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
  /** If provided, import options into this specific category only (single-sheet mode) */
  targetCategory?: { id: string; title: string; category_key: string } | null;
}

export default function FilterExcelUpload({ open, onOpenChange, onImportComplete, targetCategory }: FilterExcelUploadProps) {
  const [parsed, setParsed] = useState<ParsedCategory[]>([]);
  const [parsedOptions, setParsedOptions] = useState<ParsedOption[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isSingleCategory = !!targetCategory;

  function reset() {
    setParsed([]);
    setParsedOptions([]);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function parseSheetOptions(ws: XLSX.WorkSheet): ParsedOption[] {
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (rows.length < 2) return [];

    const headers = rows[0].map((h) => String(h).trim().toLowerCase());
    const titleIdx = headers.findIndex((h) => h === "english" || h === "title" || h === "option" || h === "name");
    const trIdx = headers.findIndex((h) => h.startsWith("tr") || h === "turkish");
    const arIdx = headers.findIndex((h) => h.startsWith("ar") || h === "arabic");
    const frIdx = headers.findIndex((h) => h.startsWith("fr") || h === "french");
    const ruIdx = headers.findIndex((h) => h.startsWith("ru") || h === "russian");
    const deIdx = headers.findIndex((h) => h.startsWith("de") || h === "german");
    const faIdx = headers.findIndex((h) => h.startsWith("fa") || h === "farsi" || h === "persian");
    const mainCol = titleIdx >= 0 ? titleIdx : 0;

    const options: ParsedOption[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const title = String(row[mainCol] || "").trim();
      if (!title) continue;
      const translations: Record<string, string> = {};
      if (trIdx >= 0 && row[trIdx]) translations.tr = String(row[trIdx]).trim();
      if (arIdx >= 0 && row[arIdx]) translations.ar = String(row[arIdx]).trim();
      if (frIdx >= 0 && row[frIdx]) translations.fr = String(row[frIdx]).trim();
      if (ruIdx >= 0 && row[ruIdx]) translations.ru = String(row[ruIdx]).trim();
      if (deIdx >= 0 && row[deIdx]) translations.de = String(row[deIdx]).trim();
      if (faIdx >= 0 && row[faIdx]) translations.fa = String(row[faIdx]).trim();
      options.push({ title, translations });
    }
    return options;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });

        if (isSingleCategory) {
          // Single category mode: take options from first sheet
          const ws = wb.Sheets[wb.SheetNames[0]];
          const opts = parseSheetOptions(ws);
          if (opts.length === 0) {
            setError("No options found. First column should be English title, with optional translation columns.");
            return;
          }
          setParsedOptions(opts);
        } else {
          // Multi-category mode: each sheet = one category
          const categories: ParsedCategory[] = [];
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const opts = parseSheetOptions(ws);
            if (opts.length === 0) continue;

            const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
            const headers = rows[0].map((h) => String(h).trim().toLowerCase());
            const appliesToIdx = headers.findIndex((h) => h.includes("applies") || h.includes("type") || h.includes("context"));
            let appliesTo = ["property", "search"];
            if (appliesToIdx >= 0 && rows.length > 1) {
              const val = String(rows[1][appliesToIdx]).trim().toLowerCase();
              if (val) appliesTo = val.split(",").map((s) => s.trim()).filter(Boolean);
            }

            categories.push({
              category_key: sheetName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
              title: sheetName.trim(),
              applies_to: appliesTo,
              translations: {},
              options: opts,
            });
          }
          if (categories.length === 0) {
            setError("No valid data found. Each sheet = one category with option rows.");
            return;
          }
          setParsed(categories);
        }
      } catch {
        setError("Failed to parse the Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function upsertOptions(categoryId: string, options: ParsedOption[]) {
    for (let oi = 0; oi < options.length; oi++) {
      const opt = options[oi];
      const { data: existing } = await supabase
        .from("filter_options")
        .select("id")
        .eq("category_id", categoryId)
        .eq("title", opt.title)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from("filter_options")
          .update({ translations: opt.translations as unknown as Record<string, never> })
          .eq("id", existing[0].id);
      } else {
        await supabase.from("filter_options").insert({
          category_id: categoryId,
          title: opt.title,
          translations: opt.translations as unknown as Record<string, never>,
          sort_order: oi + 1,
          status: "active",
        });
      }
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      if (isSingleCategory && targetCategory) {
        await upsertOptions(targetCategory.id, parsedOptions);
        toast.success(`Imported ${parsedOptions.length} options into "${targetCategory.title}"`);
      } else {
        for (let ci = 0; ci < parsed.length; ci++) {
          const cat = parsed[ci];
          const { data: existingCats } = await supabase
            .from("filter_categories")
            .select("id")
            .eq("category_key", cat.category_key)
            .limit(1);

          let categoryId: string;
          if (existingCats && existingCats.length > 0) {
            categoryId = existingCats[0].id;
            await supabase
              .from("filter_categories")
              .update({ title: cat.title, translations: cat.translations as unknown as Record<string, never>, applies_to: cat.applies_to })
              .eq("id", categoryId);
          } else {
            const { data: newCat, error: catErr } = await supabase
              .from("filter_categories")
              .insert({ category_key: cat.category_key, title: cat.title, translations: cat.translations as unknown as Record<string, never>, applies_to: cat.applies_to, sort_order: ci + 1, status: "active" })
              .select("id")
              .single();
            if (catErr || !newCat) throw new Error(`Failed to create category: ${cat.title}`);
            categoryId = newCat.id;
          }
          await upsertOptions(categoryId, cat.options);
        }
        toast.success(`Imported ${parsed.length} categories successfully`);
      }
      onImportComplete();
      onOpenChange(false);
      reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const totalOptions = isSingleCategory ? parsedOptions.length : parsed.reduce((s, c) => s + c.options.length, 0);
  const hasData = isSingleCategory ? parsedOptions.length > 0 : parsed.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {isSingleCategory ? `Import Options: ${targetCategory?.title}` : "Import Filters from Excel"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">Excel Format Guide:</p>
            {isSingleCategory ? (
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>First row = headers: <code className="bg-background px-1 rounded text-xs">English, Turkish, Arabic, French, Russian, German, Farsi</code></li>
                <li>Each row = one filter option with translations</li>
                <li>Existing options (matched by English name) will be <strong>updated</strong></li>
              </ul>
            ) : (
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Each <strong>sheet</strong> = one filter category (sheet name = category name)</li>
                <li>First row = headers: <code className="bg-background px-1 rounded text-xs">English, Turkish, Arabic, French, Russian, German, Farsi</code></li>
                <li>Each subsequent row = one filter option with translations</li>
              </ul>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Choose Excel File
            </Button>
            {hasData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {isSingleCategory
                  ? `${parsedOptions.length} options found`
                  : `${parsed.length} categories, ${totalOptions} options found`}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {/* Preview for single category */}
          {isSingleCategory && parsedOptions.length > 0 && (
            <div className="max-h-[35vh] overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>Translations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedOptions.map((opt, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{opt.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {LANG_CODES.filter((l) => opt.translations[l]).map((l) => (
                            <Badge key={l} variant="secondary" className="text-[10px] font-normal">
                              {l.toUpperCase()}: {opt.translations[l].length > 15 ? opt.translations[l].slice(0, 15) + "…" : opt.translations[l]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Preview for multi-category */}
          {!isSingleCategory && parsed.length > 0 && (
            <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Translations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((cat) => (
                    <TableRow key={cat.category_key}>
                      <TableCell className="font-medium align-top">
                        <div>{cat.title}</div>
                        <div className="flex gap-1 mt-1">
                          {cat.applies_to.map((t) => (
                            <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap gap-1">
                          {cat.options.slice(0, 8).map((o) => (
                            <Badge key={o.title} variant="secondary" className="text-xs font-normal">{o.title}</Badge>
                          ))}
                          {cat.options.length > 8 && (
                            <Badge variant="outline" className="text-xs">+{cat.options.length - 8} more</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        {LANG_CODES.filter((l) => cat.options.some((o) => o.translations[l])).map((l) => l.toUpperCase()).join(", ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
          <Button onClick={handleImport} disabled={importing || !hasData}>
            {importing ? "Importing..." : isSingleCategory ? `Import ${parsedOptions.length} Options` : `Import ${parsed.length} Categories`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
