import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Lock, Upload, X } from "lucide-react";

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
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));
  const languageOptions = ["English", "Arabic", "Turkish", "Russian", "German", "French", "Italian"];

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

  if (loading) {
    return <AgentLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div></AgentLayout>;
  }

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Profile Settings</h1>
      <div className="max-w-4xl space-y-8">
        {/* Avatar */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Photo</h2>
          <div className="flex items-center gap-4">
            {form.avatar_url ? (
              <div className="relative">
                <img src={form.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-border" />
                <button onClick={() => updateField("avatar_url", "")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
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
            </div>
          </div>
        </section>

        {/* Info */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Information</h2>
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
              <Label className="text-foreground font-medium">Email</Label>
              <Input value={form.email} disabled className="bg-muted/50 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Registration Number</Label>
              <Input value={form.registration_number} onChange={(e) => updateField("registration_number", e.target.value)} className="bg-secondary/50" />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Contact</h2>
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

        {/* About */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">About</h2>
          <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} className="bg-secondary/50 min-h-[100px]" />
        </section>

        {/* Languages & Service Areas */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5">Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Service Areas</Label>
              <Input value={form.service_areas} onChange={(e) => updateField("service_areas", e.target.value)} className="bg-secondary/50" placeholder="Istanbul, Ankara..." />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Languages</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {languageOptions.map((lang) => (
                  <button key={lang} type="button"
                    onClick={() => setForm((prev) => ({ ...prev, languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang] }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.languages.includes(lang) ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"}`}
                  >{lang}</button>
                ))}
              </div>
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
              <Button type="submit" variant="outline" disabled={changingPw}>{changingPw ? "Changing..." : "Update Password"}</Button>
            </div>
          </form>
        </section>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentProfilePage;
