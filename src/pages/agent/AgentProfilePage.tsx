import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { turkishIncludes } from "@/lib/utils";
import AgentLayout from "@/components/agent/AgentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Save, Lock, Upload, X, ImageIcon, UserCircle, Phone, Mail,
  FileText, Globe, ChevronDown, Search, Grid3X3, Briefcase, Rocket
} from "lucide-react";
import PatternLock from "@/components/admin/PatternLock";
import BoostProfileDialog from "@/components/BoostProfileDialog";

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
  const filtered = search ? languageOptions.filter(l => turkishIncludes(l, search)) : languageOptions;

  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Languages
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
          <ScrollArea>
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

const AgentProfilePage = () => {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({
    name: "",
    designation: "",
    email: "",
    phone: "",
    whatsapp: "",
    description: "",
    registration_number: "",
    service_areas: "",
    languages: [] as string[],
    avatar_url: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Pattern lock
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [patternStep, setPatternStep] = useState<"current" | "new" | "confirm">("current");
  const [newPattern, setNewPattern] = useState<number[]>([]);
  const [patternError, setPatternError] = useState(false);
  const [currentPatternCode, setCurrentPatternCode] = useState<string>("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (data) {
        setAgent(data);
        setCompanyId(data.company_id);
        setForm({
          name: data.name || "",
          designation: data.designation || "",
          email: data.email || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          description: data.description || "",
          registration_number: data.registration_number || "",
          service_areas: data.service_areas?.join(", ") || "",
          languages: data.languages || [],
          avatar_url: data.avatar_url || "",
        });

        // Fetch agent's own pattern
        const { data: patternData } = await supabase
          .from("agent_pattern_codes")
          .select("pattern_code")
          .eq("agent_id", data.id)
          .maybeSingle();
        if (patternData) setCurrentPatternCode(patternData.pattern_code);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang],
    }));
  };

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("agents")
        .update({
          name: form.name.trim(),
          designation: form.designation || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          description: form.description || null,
          registration_number: form.registration_number || null,
          service_areas: form.service_areas ? form.service_areas.split(",").map((s) => s.trim()) : [],
          languages: form.languages.length > 0 ? form.languages : [],
          avatar_url: form.avatar_url || null,
        })
        .eq("id", agent.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Min 6 characters"); return; }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPw(false);
    }
  };

  const handlePatternComplete = async (pattern: number[]) => {
    if (patternStep === "current") {
      if (pattern.join(",") === currentPatternCode) {
        setPatternStep("new");
        setPatternError(false);
      } else {
        setPatternError(true);
        toast.error("Incorrect current pattern");
        setTimeout(() => setPatternError(false), 500);
      }
    } else if (patternStep === "new") {
      setNewPattern(pattern);
      setPatternStep("confirm");
    } else if (patternStep === "confirm") {
      if (pattern.join(",") === newPattern.join(",")) {
        try {
          const { error } = await supabase
            .from("agent_pattern_codes")
            .upsert({ agent_id: agent!.id, pattern_code: newPattern.join(",") }, { onConflict: "agent_id" });
          if (error) throw error;
          setCurrentPatternCode(newPattern.join(","));
          toast.success("Pattern lock updated!");
          setPatternDialogOpen(false);
        } catch (err: any) {
          toast.error(err.message || "Failed to update pattern");
        }
      } else {
        setPatternError(true);
        toast.error("Patterns don't match. Try again.");
        setPatternStep("new");
        setTimeout(() => setPatternError(false), 500);
      }
    }
  };

  const openPatternDialog = () => {
    setPatternStep(currentPatternCode ? "current" : "new");
    setNewPattern([]);
    setPatternError(false);
    setPatternDialogOpen(true);
  };

  if (loading) {
    return <AgentLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div></AgentLayout>;
  }

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile Settings</h1>
      <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl space-y-6 pb-10">

        {/* ─── Photo ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<ImageIcon className="h-4 w-4" />} title="Photo" />
          <div className="flex items-center gap-4">
            {form.avatar_url ? (
              <div className="relative">
                <img src={form.avatar_url} alt="Avatar" className="w-20 h-20 rounded-lg object-cover border border-border" />
                <button onClick={() => updateField("avatar_url", "")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                <Upload className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            <div>
              <input type="file" accept="image/*" id="avatar-upload" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !agent) return;
                  setUploadingAvatar(true);
                  const ext = file.name.split(".").pop();
                  const path = `${agent.id}/avatar.${ext}`;
                  const { error } = await supabase.storage.from("agent-avatars").upload(path, file, { upsert: true });
                  if (error) { toast.error("Upload failed"); setUploadingAvatar(false); return; }
                  const { data: urlData } = supabase.storage.from("agent-avatars").getPublicUrl(path);
                  updateField("avatar_url", urlData.publicUrl + "?t=" + Date.now());
                  setUploadingAvatar(false);
                  toast.success("Photo uploaded!");
                }}
              />
              <Button variant="outline" size="sm" disabled={uploadingAvatar} onClick={() => document.getElementById("avatar-upload")?.click()}>
                <Upload className="h-3 w-3 mr-1" /> {uploadingAvatar ? "Uploading..." : "Upload Photo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Rectangular photo recommended</p>
            </div>
          </div>
        </section>

        {/* ─── Information ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<UserCircle className="h-4 w-4" />} title="Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Full Name</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Designation</Label>
              <Input value={form.designation} onChange={(e) => updateField("designation", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
              </Label>
              <Input value={form.email} disabled className="bg-muted/50 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Registration Number</Label>
              <Input value={form.registration_number} onChange={(e) => updateField("registration_number", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* ─── Contact ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Phone className="h-4 w-4" />} title="Contact" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Phone</Label>
              <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* ─── About ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<FileText className="h-4 w-4" />} title="About" />
          <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[100px]" />
        </section>

        {/* ─── Skills ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Briefcase className="h-4 w-4" />} title="Skills & Languages" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Service Areas</Label>
              <Input value={form.service_areas} onChange={(e) => updateField("service_areas", e.target.value)} className="bg-secondary/50" placeholder="Istanbul, Ankara..." />
            </div>
            <MultiSelectLanguages selected={form.languages} onToggle={toggleLanguage} />
          </div>
        </section>

        {/* ─── Security ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Lock className="h-4 w-4" />} title="Security" />

          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Change Password</h3>
            <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-secondary/50" minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Confirm Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-secondary/50" minLength={6} required />
              </div>
              <div>
                <Button type="submit" variant="outline" disabled={changingPw}>{changingPw ? "Changing..." : "Update Password"}</Button>
              </div>
            </form>
          </div>

          <div className="pt-4 border-t border-border/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Pattern Lock</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentPatternCode ? "Pattern lock is active. You'll need to draw it when logging in." : "No pattern lock set. You can log in with credentials only."}
                </p>
              </div>
            </div>
            {currentPatternCode && (
              <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Pattern Login</p>
                  <p className="text-xs text-muted-foreground">{currentPatternCode ? "Active — pattern required at login" : "Inactive — credentials only"}</p>
                </div>
                <Switch
                  checked={!!currentPatternCode}
                  onCheckedChange={async (checked) => {
                    if (!checked && agent) {
                      try {
                        const { error } = await supabase
                          .from("agent_pattern_codes")
                          .delete()
                          .eq("agent_id", agent.id);
                        if (error) throw error;
                        setCurrentPatternCode("");
                        toast.success("Pattern lock disabled");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to disable pattern");
                      }
                    }
                  }}
                />
              </div>
            )}
            <Button type="button" variant="outline" onClick={openPatternDialog}>
              <Grid3X3 className="h-4 w-4 mr-2" /> {currentPatternCode ? "Change Pattern Lock" : "Set Pattern Lock"}
            </Button>
          </div>
        </section>

        {/* ─── Boost Profile ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Rocket className="h-4 w-4" />} title="Boost My Profile" />
          <p className="text-sm text-muted-foreground mb-4">
            Boost your profile to appear at the top of agent search results and on the homepage spotlight.
          </p>
          {agent && agent.profile_classification === "boosted" && agent.boost_end_date && new Date(agent.boost_end_date) > new Date() ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-primary font-medium flex items-center gap-1.5">
                <Rocket className="h-4 w-4" /> Boosted until {new Date(agent.boost_end_date).toLocaleDateString()}
              </div>
              <Button variant="outline" size="sm" onClick={() => setBoostDialogOpen(true)}>Extend Boost</Button>
            </div>
          ) : (
            <Button onClick={() => setBoostDialogOpen(true)}>
              <Rocket className="h-4 w-4 mr-2" /> Boost Profile
            </Button>
          )}
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Pattern Lock Dialog */}
      <Dialog open={patternDialogOpen} onOpenChange={setPatternDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" /> Change Pattern Lock
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              {patternStep === "current" && "Draw your current pattern to verify"}
              {patternStep === "new" && "Draw your new pattern (minimum 3 dots)"}
              {patternStep === "confirm" && "Draw the new pattern again to confirm"}
            </p>
            <PatternLock onPatternComplete={handlePatternComplete} error={patternError} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Boost Dialog */}
      {agent && (
        <BoostProfileDialog
          open={boostDialogOpen}
          onOpenChange={setBoostDialogOpen}
          profileId={agent.id}
          profileName={agent.name}
          profileType="agent"
          balanceSource="agent"
          balanceSourceId={agent.id}
          currentClassification={agent.profile_classification || "standard"}
          boostEndDate={agent.boost_end_date || null}
          onBoosted={() => window.location.reload()}
        />
      )}
    </AgentLayout>
  );
};

export default AgentProfilePage;
