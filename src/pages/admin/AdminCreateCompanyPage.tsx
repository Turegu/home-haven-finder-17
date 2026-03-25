import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ImageIcon, RotateCcw, Save } from "lucide-react";
import LocationFormFields from "@/components/LocationFormFields";
import type { Database } from "@/integrations/supabase/types";
import { useCompanyTypes } from "@/hooks/useTranslatableCruds";

type MembershipType = Database["public"]["Enums"]["membership_type"];

const languageOptions = ["English", "Arabic", "Turkish", "Russian", "German", "French", "Italian"];
const packageOptions: { value: MembershipType; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "lite", label: "Lite" },
  { value: "plus", label: "Plus" },
  { value: "pro", label: "Pro" },
];
const durationOptions = ["1 Month", "3 Months", "6 Months", "1 Year"];


const AdminCreateCompanyPage = () => {
  const navigate = useNavigate();
  const { data: dbCompanyTypes = [] } = useCompanyTypes();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company_types: [] as string[],
    service_areas: "",
    languages: [] as string[],
    registration_number: "",
    about: "",
    email: "",
    phone: "",
    whatsapp: "",
    membership: "basic" as MembershipType,
    duration: "",
    province: "",
    town: "",
    neighbourhood: "",
    pin_location: "",
  });

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm({
      name: "", company_types: [], service_areas: "", languages: [],
      registration_number: "", about: "", email: "", phone: "", whatsapp: "",
      membership: "basic", duration: "", province: "", town: "",
      neighbourhood: "", pin_location: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Company name and email are required");
      return;
    }

    if (form.membership !== "basic" && !form.duration) {
      toast.error("Please select a package duration");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke("create-company-user", {
        body: {
          email: form.email.trim(),
          companyData: {
            name: form.name.trim(),
            phone: form.phone || null,
            whatsapp: form.whatsapp || null,
            company_types: form.company_types.length > 0 ? form.company_types : null,
            service_areas: form.service_areas ? form.service_areas.split(",").map(s => s.trim()) : null,
            languages: form.languages.length > 0 ? form.languages : null,
            registration_number: form.registration_number || null,
            about: form.about || null,
            membership: form.membership,
            duration: form.duration || null,
            province: form.province || null,
            town: form.town || null,
            neighbourhood: form.neighbourhood || null,
            pin_location: form.pin_location || null,
            created_by: user?.id || null,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Company created successfully! An invitation email has been sent.");
      navigate("/admin/companies");
    } catch (err: any) {
      toast.error(err.message || "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-primary mb-2">New Company</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Fill in the details below to create a new company. A verification email will be sent to the company's email.
      </p>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        {/* Company Logo */}
        <div>
          <Label className="text-primary font-semibold">Company Logo</Label>
          <div className="mt-2 border-2 border-dashed border-border rounded-xl h-40 flex items-center justify-center bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="text-center">
              <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Click to upload logo</p>
            </div>
          </div>
        </div>

        {/* Information */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Company Name</Label>
              <Input
                placeholder="Company Name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="bg-secondary/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Company Type</Label>
              <Select value={form.company_types[0] || ""} onValueChange={(v) => setForm(prev => ({ ...prev, company_types: [v] }))}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select Company Type" /></SelectTrigger>
                <SelectContent>
                  {companyTypes.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Service Areas</Label>
              <Input
                placeholder="e.g. Istanbul, Ankara, Antalya"
                value={form.service_areas}
                onChange={(e) => updateField("service_areas", e.target.value)}
                className="bg-secondary/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Languages We Speak</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {languageOptions.map(lang => (
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
              <Label className="text-primary font-semibold">Registration Number</Label>
              <Input
                placeholder="Registration Number"
                value={form.registration_number}
                onChange={(e) => updateField("registration_number", e.target.value)}
                className="bg-secondary/30"
              />
            </div>
          </div>
        </div>

        {/* About Us */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">About Us</h2>
          <Textarea
            placeholder="Write about the company..."
            value={form.about}
            onChange={(e) => { if (e.target.value.length <= 1000) updateField("about", e.target.value); }}
            className="bg-secondary/30 min-h-[120px]"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{form.about.length}/1000</p>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-primary font-semibold">Email *</Label>
            <Input
              type="email"
              placeholder="company@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="bg-secondary/30"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-semibold">Phone</Label>
            <Input
              placeholder="+90 xxx xxx xx xx"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="bg-secondary/30"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-semibold">WhatsApp Number</Label>
            <Input
              placeholder="+90 xxx xxx xx xx"
              value={form.whatsapp}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              className="bg-secondary/30"
            />
          </div>
        </div>

        {/* Package Information */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Package Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Package *</Label>
              <Select value={form.membership} onValueChange={(v) => updateField("membership", v)}>
                <SelectTrigger className="bg-secondary/30">
                  <SelectValue placeholder="Select Package" />
                </SelectTrigger>
                <SelectContent>
                  {packageOptions.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Duration *</Label>
              <Select value={form.duration} onValueChange={(v) => updateField("duration", v)}>
                <SelectTrigger className="bg-secondary/30">
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Location</h2>
          <LocationFormFields
            province={form.province}
            town={form.town}
            neighbourhood={form.neighbourhood}
            pinLocation={form.pin_location}
            onProvinceChange={(v) => updateField("province", v)}
            onTownChange={(v) => updateField("town", v)}
            onNeighbourhoodChange={(v) => updateField("neighbourhood", v)}
            onPinLocationChange={(v) => updateField("pin_location", v)}
            showMap={false}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Form
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AdminCreateCompanyPage;
