import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Lock, Upload, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;

const companyTypes = [
  { value: "real_estate_agency", label: "Real Estate Agency" },
  { value: "developer", label: "Developer" },
  { value: "brokerage", label: "Brokerage" },
  { value: "property_management", label: "Property Management" },
  { value: "consulting", label: "Consulting" },
];

const provinces = ["Istanbul", "Ankara", "Antalya", "Izmir", "Bursa", "Adiyaman", "Mersin"];

const CompanyProfilePage = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company_type: "" as string,
    service_areas: "",
    languages: [] as string[],
    registration_number: "",
    about: "",
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
          company_type: data.company_type || "",
          service_areas: data.service_areas?.join(", ") || "",
          languages: data.languages || [],
          registration_number: data.registration_number || "",
          about: data.about || "",
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
      }
      setLoading(false);
    };
    fetchCompany();
  }, []);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const languageOptions = ["English", "Arabic", "Turkish", "Russian", "German", "French", "Italian"];

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
          company_type: (form.company_type as any) || null,
          service_areas: form.service_areas ? form.service_areas.split(",").map((s) => s.trim()) : null,
          languages: form.languages.length > 0 ? form.languages : null,
          registration_number: form.registration_number || null,
          about: form.about || null,
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading profile...</div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile Settings</h1>

      <div className="max-w-4xl space-y-8">
        {/* Information */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Company Name</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Company Type</Label>
              <Select value={form.company_type} onValueChange={(v) => updateField("company_type", v)}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {companyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Service Areas</Label>
              <Input value={form.service_areas} onChange={(e) => updateField("service_areas", e.target.value)} className="bg-secondary/50" placeholder="Istanbul, Ankara..." />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Languages We Speak</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {languageOptions.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.languages.includes(lang)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Registration Number</Label>
              <Input value={form.registration_number} onChange={(e) => updateField("registration_number", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* About Us */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">About Us</h2>
          <Textarea value={form.about} onChange={(e) => updateField("about", e.target.value)} className="bg-secondary/50 min-h-[120px]" />
        </section>

        {/* Contact */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Email *</Label>
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

        {/* Change Password */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </h2>
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
              <Button type="submit" variant="outline" disabled={changingPw}>
                {changingPw ? "Changing..." : "Update Password"}
              </Button>
            </div>
          </form>
        </section>

        {/* Location */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Province *</Label>
              <Select value={form.province} onValueChange={(v) => updateField("province", v)}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select Province" /></SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">City/Town</Label>
              <Input value={form.town} onChange={(e) => updateField("town", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Neighbourhood</Label>
              <Input value={form.neighbourhood} onChange={(e) => updateField("neighbourhood", e.target.value)} className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Pin Location</Label>
              <Input value={form.pin_location} onChange={(e) => updateField("pin_location", e.target.value)} className="bg-secondary/50" placeholder="e.g. Istanbul, Turkey" />
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-5 rounded-lg border border-border overflow-hidden bg-muted/50 h-[300px] flex items-center justify-center">
            {form.pin_location ? (
              <iframe
                title="Company Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(form.pin_location)}&output=embed`}
              />
            ) : (
              <p className="text-muted-foreground text-sm">Enter a pin location to show the map</p>
            )}
          </div>
        </section>

        {/* Save */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </CompanyLayout>
  );
};

export default CompanyProfilePage;
