import { useState, useEffect } from "react";
import LanguageContentTabs from "@/components/LanguageContentTabs";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";
import type { Database } from "@/integrations/supabase/types";
import { companyTypes } from "@/data/companyTypes";

type MembershipType = Database["public"]["Enums"]["membership_type"];

const languageOptions = ["English", "Arabic", "Turkish", "Russian", "German", "French", "Italian"];
const packageOptions: { value: MembershipType; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "lite", label: "Lite" },
  { value: "plus", label: "Plus" },
  { value: "pro", label: "Pro" },
];

const AdminCompanyEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    company_types: [] as string[],
    service_areas: "",
    languages: [] as string[],
    registration_number: "",
    about: "",
    about_ar: "",
    email: "",
    phone: "",
    whatsapp: "",
    membership: "basic" as MembershipType,
    province: "",
    town: "",
    neighbourhood: "",
    pin_location: "",
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Company not found");
        navigate("/admin/companies");
        return;
      }
      setForm({
        name: data.name || "",
        name_ar: (data as any).name_ar || "",
        company_types: (data.company_types as string[]) || [],
        service_areas: (data.service_areas as string[] || []).join(", "),
        languages: (data.languages as string[]) || [],
        registration_number: data.registration_number || "",
        about: data.about || "",
        about_ar: (data as any).about_ar || "",
        email: data.email || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        membership: data.membership as MembershipType,
        province: data.province || "",
        town: data.town || "",
        neighbourhood: data.neighbourhood || "",
        pin_location: data.pin_location || "",
      });
      setLoading(false);
    })();
  }, [id]);

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Company name and email are required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update({
        name: form.name.trim(),
        name_ar: form.name_ar || null,
        email: form.email.trim(),
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        company_types: form.company_types.length > 0 ? form.company_types : null,
        service_areas: form.service_areas ? form.service_areas.split(",").map(s => s.trim()) : null,
        languages: form.languages.length > 0 ? form.languages : null,
        registration_number: form.registration_number || null,
        about: form.about || null,
        about_ar: form.about_ar || null,
        membership: form.membership,
        province: form.province || null,
        town: form.town || null,
        neighbourhood: form.neighbourhood || null,
        pin_location: form.pin_location || null,
      }).eq("id", id!);

      if (error) throw error;
      toast.success("Company updated successfully!");
      navigate("/admin/companies");
    } catch (err: any) {
      toast.error(err.message || "Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading company...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/companies")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Edit Company</h1>
          <p className="text-sm text-muted-foreground">Update company details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {/* Information */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Information</h2>
          <div className="space-y-5">
            <LanguageContentTabs
              fields={[
                {
                  key: "name",
                  label: "Company Name",
                  value_en: form.name,
                  value_ar: form.name_ar,
                  onChange_en: (v) => updateField("name", v),
                  onChange_ar: (v) => updateField("name_ar", v),
                  maxLength: 100,
                  required: true,
                  fieldType: "name",
                },
                {
                  key: "about",
                  label: "About Us",
                  value_en: form.about,
                  value_ar: form.about_ar,
                  onChange_en: (v) => updateField("about", v),
                  onChange_ar: (v) => updateField("about_ar", v),
                  multiline: true,
                  maxLength: 1000,
                  fieldType: "description",
                },
              ]}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Company Type</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {companyTypes.map(ct => (
                    <button key={ct.value} type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        company_types: prev.company_types.includes(ct.value)
                          ? prev.company_types.filter(v => v !== ct.value)
                          : [...prev.company_types, ct.value],
                      }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.company_types.includes(ct.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                      }`}
                    >{ct.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Service Areas</Label>
                <Input value={form.service_areas} onChange={(e) => updateField("service_areas", e.target.value)} className="bg-secondary/30" placeholder="e.g. Istanbul, Ankara" />
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Languages</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {languageOptions.map(lang => (
                    <button key={lang} type="button" onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.languages.includes(lang)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
                      }`}
                    >{lang}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-primary font-semibold">Registration Number</Label>
                <Input value={form.registration_number} onChange={(e) => updateField("registration_number", e.target.value)} className="bg-secondary/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-primary font-semibold">Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="bg-secondary/30" required />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-semibold">Phone</Label>
            <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-secondary/30" />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-semibold">WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} className="bg-secondary/30" />
          </div>
        </div>

        {/* Package */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Membership</Label>
              <Select value={form.membership} onValueChange={(v) => updateField("membership", v)}>
                <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {packageOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Location</h2>
          <LocationFormFields
            province={form.province} town={form.town} neighbourhood={form.neighbourhood} pinLocation={form.pin_location}
            onProvinceChange={(v) => updateField("province", v)} onTownChange={(v) => updateField("town", v)}
            onNeighbourhoodChange={(v) => updateField("neighbourhood", v)} onPinLocationChange={(v) => updateField("pin_location", v)}
            showMap={false}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/companies")}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminCompanyEditPage;
