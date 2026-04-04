import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, Pencil, Plus, Trash2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  renderTemplateHtml,
  TEMPLATE_FIELD_DEFS,
  PLACEHOLDER_DOCS,
  type TemplateBodyFields,
} from "@/lib/emailTemplateRenderer";

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  body_fields: TemplateBodyFields;
  is_active: boolean;
}

const AdminEmailPreviewPage = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [activeKey, setActiveKey] = useState("confirmation");
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [editSubject, setEditSubject] = useState("");
  const [editFields, setEditFields] = useState<TemplateBodyFields>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isLoading: loading } = useQuery({
    queryKey: ['admin', 'email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at");
      if (error) {
        toast.error("Failed to load email templates");
        console.error(error);
        return [];
      }
      const result = (data || []) as unknown as EmailTemplate[];
      setTemplates(result);
      return result;
    },
    staleTime: 5 * 60_000,
  });

  const current = useMemo(
    () => templates.find((tmpl) => tmpl.template_key === activeKey),
    [templates, activeKey]
  );

  useEffect(() => {
    if (current) {
      setEditSubject(current.subject);
      setEditFields({ ...(current.body_fields as TemplateBodyFields) });
    }
  }, [current]);

  const previewHtml = useMemo(() => {
    const fields = mode === "edit" ? editFields : (current?.body_fields as TemplateBodyFields) || {};
    return renderTemplateHtml(activeKey, fields);
  }, [activeKey, mode, editFields, current]);

  const previewSubject = mode === "edit" ? editSubject : current?.subject || "";

  function updateField(key: string, value: string | string[]) {
    setEditFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: editSubject,
        body_fields: editFields as unknown as Record<string, never>,
      })
      .eq("id", current.id);
    if (error) {
      toast.error("Failed to save template");
    } else {
      toast.success("Template saved successfully");
      setMode("preview");
      fetchTemplates();
    }
    setSaving(false);
  }

  const fieldDefs = TEMPLATE_FIELD_DEFS[activeKey] || [];
  const placeholders = PLACEHOLDER_DOCS[activeKey] || [];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading templates...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Email Templates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Edit and preview automated email templates
            </p>
          </div>
          <div className="flex gap-2">
            {mode === "preview" ? (
              <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setMode("preview")}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeKey} onValueChange={(v) => { setActiveKey(v); setMode("preview"); }}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {templates.map((t) => (
              <TabsTrigger key={t.template_key} value={t.template_key} className="text-xs">
                {t.template_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {templates.map((t) => (
            <TabsContent key={t.template_key} value={t.template_key}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor panel - shown in edit mode */}
                {mode === "edit" && (
                  <div className="space-y-4">
                    {/* Placeholder docs */}
                    {placeholders.length > 0 && (
                      <div className="bg-muted/50 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">Available Placeholders</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {placeholders.map((p) => (
                            <Badge key={p} variant="secondary" className="text-xs font-mono">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Subject Line</Label>
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Dynamic fields */}
                    {fieldDefs.map((def) => (
                      <div key={def.key} className="space-y-1.5">
                        <Label className="text-xs font-medium">{def.label}</Label>
                        {def.type === "text" && (
                          <Input
                            value={(editFields as Record<string, string>)[def.key] || ""}
                            onChange={(e) => updateField(def.key, e.target.value)}
                            placeholder={def.placeholder}
                            className="text-sm"
                          />
                        )}
                        {def.type === "textarea" && (
                          <Textarea
                            value={(editFields as Record<string, string>)[def.key] || ""}
                            onChange={(e) => updateField(def.key, e.target.value)}
                            placeholder={def.placeholder}
                            className="text-sm min-h-[80px]"
                          />
                        )}
                        {def.type === "list" && (
                          <div className="space-y-2">
                            {((editFields as Record<string, string[]>)[def.key] || []).map((item, idx) => (
                              <div key={idx} className="flex gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const list = [...((editFields as Record<string, string[]>)[def.key] || [])];
                                    list[idx] = e.target.value;
                                    updateField(def.key, list);
                                  }}
                                  className="text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="shrink-0"
                                  onClick={() => {
                                    const list = [...((editFields as Record<string, string[]>)[def.key] || [])];
                                    list.splice(idx, 1);
                                    updateField(def.key, list);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const list = [...((editFields as Record<string, string[]>)[def.key] || []), ""];
                                updateField(def.key, list);
                              }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview panel */}
                <div className={mode === "preview" ? "lg:col-span-2" : ""}>
                  <div className="space-y-3">
                    <div className="bg-card rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">
                        Subject: <span className="font-medium text-foreground">{previewSubject}</span>
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg border border-border p-6 flex justify-center">
                      <div className="w-full max-w-[620px]">
                        <iframe
                          srcDoc={previewHtml}
                          title={t.template_name}
                          className="w-full border-0 rounded-lg bg-white"
                          style={{ minHeight: 700 }}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailPreviewPage;
