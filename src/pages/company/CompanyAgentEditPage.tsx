import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Save, Upload, X, Mail, ImageIcon, UserCircle, Phone, FileText,
  Globe, ChevronDown, Search, Briefcase
} from "lucide-react";

import { allLanguages } from "@/data/languages";
const languageOptions = allLanguages;

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border/60">
      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
    </div>
  );
}

function MultiSelectLanguages({
  selected, onToggle
}: { selected: string[]; onToggle: (lang: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = search ? languageOptions.filter(l => l.toLowerCase().includes(search.toLowerCase())) : languageOptions;

  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Languages Spoken
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-secondary/50 font-normal text-sm">
            <span className="truncate">{selected.length ? `${selected.length} selected` : "Select languages..."}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
          </div>
          <ScrollArea className="max-h-[200px]">
            <div className="p-2 space-y-1">
              {filtered.map((lang) => (
                <label key={lang} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm">
                  <Checkbox checked={selected.includes(lang)} onCheckedChange={() => onToggle(lang)} />
                  <span>{lang}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selected.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs gap-1 pr-1">
              {s}
              <button type="button" onClick={() => onToggle(s)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const CompanyAgentEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [agentHasUser, setAgentHasUser] = useState(false);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    email: "",
    phone: "",
    whatsapp: "",
    description: "",
    service_areas: "",
    languages: [] as string[],
    registration_number: "",
  });

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle();
      if (company) setCompanyId(company.id);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const fetchAgent = async () => {
      const { data, error } = await supabase.from("agents").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Agent not found"); return; }
      const d = data as any;
      setForm({
        name: d.name || "",
        designation: d.designation || "",
        email: d.email || "",
        phone: d.phone || "",
        whatsapp: d.whatsapp || "",
        description: d.description || "",
        service_areas: (d.service_areas || []).join(", "),
        languages: d.languages || [],
        registration_number: d.registration_number || "",
      });
      setAvatarUrl(d.avatar_url || "");
      setAgentHasUser(!!d.user_id);
    };
    fetchAgent();
  }, [isEdit, id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !companyId) return;
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("agent-avatars").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("agent-avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) { toast.error("Company not found"); return; }
    if (!form.name.trim()) { toast.error("Agent name is required"); return; }
    if (!form.email.trim()) { toast.error("Email is required"); return; }
    if (!form.designation.trim()) { toast.error("Designation is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone is required"); return; }
    if (!form.whatsapp.trim()) { toast.error("WhatsApp number is required"); return; }
    if (!form.service_areas.trim()) { toast.error("Service areas are required"); return; }
    if (form.languages.length === 0) { toast.error("At least one language is required"); return; }
    if (!form.registration_number.trim()) { toast.error("Registration number is required"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); return; }

    setLoading(true);

    const payload: any = {
      name: form.name.trim(),
      designation: form.designation || null,
      email: form.email.trim(),
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      description: form.description || null,
      service_areas: form.service_areas ? form.service_areas.split(",").map((s) => s.trim()).filter(Boolean) : [],
      languages: form.languages,
      registration_number: form.registration_number || null,
      avatar_url: avatarUrl || null,
      company_id: companyId,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("agents").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Agent updated!");
        navigate("/company/agents");
      } else {
        const { data: agentData, error: agentErr } = await supabase
          .from("agents")
          .insert(payload)
          .select("id")
          .single();
        if (agentErr) throw agentErr;

        const { data: fnData, error: fnErr } = await supabase.functions.invoke("create-agent-user", {
          body: {
            email: form.email.trim(),
            agentId: agentData.id,
          },
        });

        if (fnErr || (fnData && fnData.error)) {
          await supabase.from("agents").delete().eq("id", agentData.id);
          throw new Error(fnData?.error || fnErr?.message || "Failed to send agent invitation");
        }

        toast.success("Agent created! An invitation email has been sent to set up their account.");
        navigate("/company/agents");
      }
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{isEdit ? "Edit Agent" : "New Agent"}</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6 pb-10">
        {/* ─── Profile Photo ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<ImageIcon className="h-4 w-4" />} title="Profile Photo" />
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setAvatarUrl("")}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            <div>
              <label className="px-4 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground inline-flex items-center">
                <Upload className="h-4 w-4 mr-2" />Upload Photo
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
              <p className="text-xs text-muted-foreground mt-1">Rectangular photo recommended</p>
            </div>
          </div>
        </section>

        {/* ─── Information ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<UserCircle className="h-4 w-4" />} title="Description & Information" />
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Agent Name *</Label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="bg-secondary/50" required placeholder="Enter Agent Name" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Agent Designation *</Label>
                <Input value={form.designation} onChange={(e) => updateField("designation", e.target.value)} className="bg-secondary/50" placeholder="Enter Agent Designation" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Service Areas *</Label>
                <Input value={form.service_areas} onChange={(e) => updateField("service_areas", e.target.value)} className="bg-secondary/50" placeholder="Area 1, Area 2, ..." required />
              </div>
              <MultiSelectLanguages selected={form.languages} onToggle={toggleLanguage} />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Registration Number *</Label>
              <Input value={form.registration_number} onChange={(e) => updateField("registration_number", e.target.value)} className="bg-secondary/50" placeholder="Registration Number" required />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Description *</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[100px]" placeholder="Write Agent Description" required />
            </div>
          </div>
        </section>

        {/* ─── Contact ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Phone className="h-4 w-4" />} title="Contact Information" />
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email *
                </Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="bg-secondary/50" required placeholder="agent@email.com" disabled={isEdit && agentHasUser} />
                {isEdit && agentHasUser && <p className="text-xs text-muted-foreground">Email cannot be changed after account creation</p>}
                {!isEdit && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> An invitation email will be sent to this address
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Phone *</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-secondary/50" placeholder="+90 555 123 4567" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">WhatsApp Number</Label>
                <Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} className="bg-secondary/50" placeholder="+90 555 123 4567" />
              </div>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="px-8">
            {!isEdit && <Mail className="h-4 w-4 mr-2" />}
            {loading ? "Saving..." : isEdit ? "Update" : "Create & Send Invite"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/company/agents")}>Cancel</Button>
        </div>
      </form>
    </CompanyLayout>
  );
};

export default CompanyAgentEditPage;
