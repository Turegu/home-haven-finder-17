import { useEffect, useState } from "react";
import LanguageContentTabs from "@/components/LanguageContentTabs";
import { supabase } from "@/integrations/supabase/client";
import { turkishIncludes } from "@/lib/utils";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Save, Lock, Upload, X, ImageIcon, Building2, Phone, Mail,
  MapPin, FileText, Globe, ChevronDown, Search, Grid3X3, Rocket
} from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";
import PatternLock from "@/components/admin/PatternLock";
import BoostProfileDialog from "@/components/BoostProfileDialog";
import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;

import { companyTypes } from "@/data/companyTypes";

import { allLanguages } from "@/data/languages";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const tLang = (lang: string) => t(`languageNames.${lang}`, lang);
  const filtered = search
    ? languageOptions.filter((l) => turkishIncludes(l, search) || turkishIncludes(tLang(l), search))
    : languageOptions;

  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" /> {t("detail.languagesWeSpeak")}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between bg-secondary/50 font-normal text-sm">
            <span className="truncate">{selected.length ? `${selected.length} ${t("filters.selected")}` : t("filters.languages")}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder={t("common.searchLanguages")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
          </div>
          <div
            className="max-h-[320px] overflow-y-scroll p-2 pe-1 space-y-1"
            style={{ scrollbarGutter: 'stable' }}
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight <= el.clientHeight) return;
              e.preventDefault();
              e.stopPropagation();
              el.scrollTop += e.deltaY;
            }}
          >
            {filtered.map((lang) => (
              <label key={lang} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm">
                <Checkbox checked={selected.includes(lang)} onCheckedChange={() => onToggle(lang)} />
                <span>{tLang(lang)}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-3 text-center">{t("common.noLanguagesFound")}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {selected.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs gap-1 pr-1">
              {tLang(s)}
              <button type="button" onClick={() => onToggle(s)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

const CompanyProfilePage = () => {
  const { t, i18n } = useTranslation();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    name_fr: "",
    company_types: [] as string[],
    service_areas: [] as string[],
    languages: [] as string[],
    registration_number: "",
    about: "",
    about_ar: "",
    about_fr: "",
    email: "",
    phone: "",
    whatsapp: "",
    province: "",
    town: "",
    neighbourhood: "",
    pin_location: "",
    logo_url: "",
    cover_url: "",
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Pattern lock
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [patternStep, setPatternStep] = useState<"current" | "new" | "confirm">("current");
  const [newPattern, setNewPattern] = useState<number[]>([]);
  const [patternError, setPatternError] = useState(false);
  const [currentPatternCode, setCurrentPatternCode] = useState<string>("");
  const [patternActive, setPatternActive] = useState(false);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setCompany(data);
        setForm({
          name: data.name || "",
          name_ar: (data as any).name_ar || "",
          name_fr: (data as any).name_fr || "",
          company_types: (data as any).company_types || [],
          service_areas: data.service_areas || [],
          languages: data.languages || [],
          registration_number: data.registration_number || "",
          about: data.about || "",
          about_ar: (data as any).about_ar || "",
          about_fr: (data as any).about_fr || "",
          email: data.email || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          province: data.province || "",
          town: data.town || "",
          neighbourhood: data.neighbourhood || "",
          pin_location: data.pin_location || "",
          logo_url: data.logo_url || "",
          cover_url: data.cover_url || "",
        });

        // Fetch current pattern
        const { data: patternData } = await supabase
          .from("company_pattern_codes")
          .select("pattern_code, is_active")
          .eq("company_id", data.id)
          .maybeSingle();
        if (patternData) {
          setCurrentPatternCode(patternData.pattern_code);
          setPatternActive(patternData.is_active ?? true);
        }
      }
      setLoading(false);
    };
    fetchCompany();
  }, []);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: form.name.trim(),
          name_ar: form.name_ar || null,
          name_fr: form.name_fr || null,
          company_types: form.company_types.length > 0 ? form.company_types : null,
          service_areas: form.service_areas.length > 0 ? form.service_areas : null,
          languages: form.languages.length > 0 ? form.languages : null,
          registration_number: form.registration_number || null,
          about: form.about || null,
          about_ar: form.about_ar || null,
          about_fr: form.about_fr || null,
          email: form.email.trim(),
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          province: form.province || null,
          town: form.town || null,
          neighbourhood: form.neighbourhood || null,
          pin_location: form.pin_location || null,
          logo_url: form.logo_url || null,
          cover_url: form.cover_url || null,
        })
        .eq("id", company.id);
      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const [passwordError, setPasswordError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  const handlePatternComplete = async (pattern: number[]) => {
    if (patternStep === "current") {
      const patternStr = pattern.join(",");
      if (patternStr === currentPatternCode) {
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
        // Save new pattern
        try {
          const { error } = await supabase
            .from("company_pattern_codes")
            .upsert({ company_id: company!.id, pattern_code: newPattern.join(","), is_active: true }, { onConflict: "company_id" });
          if (error) throw error;
          setCurrentPatternCode(newPattern.join(","));
          setPatternActive(true);
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
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">{t("companyDashboard.loadingProfile")}</div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("companyDashboard.profileSettings")}</h1>

      <form onSubmit={(e) => e.preventDefault()} className="max-w-4xl space-y-6 pb-10">
        {/* ─── Branding ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<ImageIcon className="h-4 w-4" />} title="Branding" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-foreground font-medium">{t("companyDashboard.companyLogo")}</Label>
              <p className="text-xs text-muted-foreground -mt-1 mb-2">Recommended: 200 × 200 px (square)</p>
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <div className="relative">
                    <img src={form.logo_url} alt="Logo" className="h-20 w-auto max-w-[120px] rounded-lg object-contain border border-border" />
                    <button onClick={() => updateField("logo_url", "")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Upload className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div>
                  <input type="file" accept="image/*" id="logo-upload" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !company) return;
                      setUploadingLogo(true);
                      const ext = file.name.split(".").pop();
                      const path = `${company.id}/logo.${ext}`;
                      const { error } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
                      if (error) { toast.error("Upload failed"); setUploadingLogo(false); return; }
                      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
                      updateField("logo_url", urlData.publicUrl + "?t=" + Date.now());
                      setUploadingLogo(false);
                      toast.success("Logo uploaded!");
                    }}
                  />
                  <Button variant="outline" size="sm" disabled={uploadingLogo} onClick={() => document.getElementById("logo-upload")?.click()}>
                    <Upload className="h-3 w-3 mr-1" /> {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-foreground font-medium">Cover Image</Label>
              <p className="text-xs text-muted-foreground -mt-1 mb-2">Recommended: 1200 × 180 px (wide banner). Also displayed on your agents' profile pages.</p>
              {form.cover_url ? (
                <div className="relative">
                  <img src={form.cover_url} alt="Cover" className="w-full aspect-[4/1] rounded-lg object-cover border border-border" />
                  <button onClick={() => updateField("cover_url", "")} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="w-full aspect-[4/1] rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  <Upload className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
              <input type="file" accept="image/*" id="cover-upload" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !company) return;
                  setUploadingCover(true);
                  const ext = file.name.split(".").pop();
                  const path = `${company.id}/cover.${ext}`;
                  const { error } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
                  if (error) { toast.error("Upload failed"); setUploadingCover(false); return; }
                  const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
                  updateField("cover_url", urlData.publicUrl + "?t=" + Date.now());
                  setUploadingCover(false);
                  toast.success("Cover uploaded!");
                }}
              />
              <Button variant="outline" size="sm" disabled={uploadingCover} onClick={() => document.getElementById("cover-upload")?.click()}>
                <Upload className="h-3 w-3 mr-1" /> {uploadingCover ? "Uploading..." : "Upload Cover"}
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Information ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Building2 className="h-4 w-4" />} title="Information" />
          <div className="space-y-5">
            <LanguageContentTabs
              fields={[
                {
                  key: "name",
                  label: "Company Name",
                  value_en: form.name,
                  value_ar: form.name_ar,
                  value_fr: form.name_fr,
                  onChange_en: (v) => updateField("name", v),
                  onChange_ar: (v) => updateField("name_ar", v),
                  onChange_fr: (v) => updateField("name_fr", v),
                  maxLength: 100,
                  fieldType: "name",
                },
                {
                  key: "about",
                  label: "About Us",
                  value_en: form.about,
                  value_ar: form.about_ar,
                  value_fr: form.about_fr,
                  onChange_en: (v) => { if (v.length <= 1000) updateField("about", v); },
                  onChange_ar: (v) => updateField("about_ar", v),
                  onChange_fr: (v) => updateField("about_fr", v),
                  multiline: true,
                  maxLength: 1000,
                  fieldType: "description",
                },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Company Type</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {companyTypes.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          company_types: prev.company_types.includes(ct.value)
                            ? prev.company_types.filter(v => v !== ct.value)
                            : [...prev.company_types, ct.value],
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.company_types.includes(ct.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      {i18n.language === "ar" ? ct.label_ar : i18n.language === "fr" ? ct.label_fr : ct.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Service Areas</Label>
                <Input value={form.service_areas} onChange={(e) => updateField("service_areas", e.target.value)} className="bg-secondary/50" placeholder="Istanbul, Ankara..." />
              </div>
              <MultiSelectLanguages selected={form.languages} onToggle={toggleLanguage} />
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Registration Number</Label>
                <Input value={form.registration_number} onChange={(e) => updateField("registration_number", e.target.value)} className="bg-secondary/50" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Contact ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Phone className="h-4 w-4" />} title="Contact" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email *
              </Label>
              <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Phone</Label>
              <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">WhatsApp Number</Label>
              <Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* ─── Location ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Location" />
          <LocationFormFields
            province={form.province}
            town={form.town}
            neighbourhood={form.neighbourhood}
            pinLocation={form.pin_location}
            onProvinceChange={(v) => updateField("province", v)}
            onTownChange={(v) => updateField("town", v)}
            onNeighbourhoodChange={(v) => updateField("neighbourhood", v)}
            onPinLocationChange={(v) => updateField("pin_location", v)}
          />
        </section>

        {/* ─── Security ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Lock className="h-4 w-4" />} title="Security" />

          {/* Change Password */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }} className={`bg-secondary/50 ${passwordError ? "border-destructive" : ""}`} minLength={6} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} className={`bg-secondary/50 ${passwordError ? "border-destructive" : ""}`} minLength={6} required />
                </div>
              </div>
              {passwordError && <p className="text-sm text-destructive font-medium">{passwordError}</p>}
              <div>
                <Button type="submit" variant="outline" disabled={changingPw}>
                  {changingPw ? "Changing..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>

          {/* Pattern Lock */}
          <div className="pt-4 border-t border-border/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">Pattern Lock</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentPatternCode ? "A pattern lock has been set." : "No pattern lock set. You can log in with credentials only."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium text-foreground">Pattern Login</p>
                <p className="text-xs text-muted-foreground">
                  {!currentPatternCode
                    ? "Set a pattern first to enable this"
                    : patternActive
                    ? "Active — pattern required at login"
                    : "Inactive — login with credentials only"}
                </p>
              </div>
              <Switch
                checked={patternActive}
                disabled={!currentPatternCode}
                onCheckedChange={async (checked) => {
                  if (company) {
                    try {
                      const { error } = await supabase
                        .from("company_pattern_codes")
                        .update({ is_active: checked })
                        .eq("company_id", company.id);
                      if (error) throw error;
                      setPatternActive(checked);
                      toast.success(checked ? "Pattern login activated" : "Pattern login deactivated");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to update pattern status");
                    }
                  }
                }}
              />
            </div>
            <Button type="button" variant="outline" onClick={openPatternDialog}>
              <Grid3X3 className="h-4 w-4 mr-2" /> {currentPatternCode ? "Change Pattern Lock" : "Set Pattern Lock"}
            </Button>
          </div>
        </section>

        {/* ─── Boost Profile ─── */}
        <section className="bg-card rounded-xl border border-border p-6">
          <SectionHeader icon={<Rocket className="h-4 w-4" />} title="Boost Company Profile" />
          <p className="text-sm text-muted-foreground mb-4">
            Boost your company profile to appear at the top of search results and on the homepage spotlight.
          </p>
          {company && (company as any).profile_classification === "boosted" && (company as any).boost_end_date && new Date((company as any).boost_end_date) > new Date() ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-primary font-medium flex items-center gap-1.5">
                <Rocket className="h-4 w-4" /> Boosted until {new Date((company as any).boost_end_date).toLocaleDateString()}
              </div>
              <Button variant="outline" size="sm" onClick={() => setBoostDialogOpen(true)}>Extend Boost</Button>
            </div>
          ) : (
            <Button onClick={() => setBoostDialogOpen(true)}>
              <Rocket className="h-4 w-4 mr-2" /> Boost Profile
            </Button>
          )}
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
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
            <div className="flex gap-2">
              {patternStep !== "current" && patternStep !== "new" && (
                <Button variant="ghost" size="sm" onClick={() => setPatternStep("new")}>Start Over</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boost Dialog */}
      {company && (
        <BoostProfileDialog
          open={boostDialogOpen}
          onOpenChange={setBoostDialogOpen}
          profileId={company.id}
          profileName={company.name}
          profileType="company"
          balanceSource="company"
          balanceSourceId={company.id}
          currentClassification={(company as any).profile_classification || "standard"}
          boostEndDate={(company as any).boost_end_date || null}
          onBoosted={() => window.location.reload()}
        />
      )}
    </CompanyLayout>
  );
};

export default CompanyProfilePage;
