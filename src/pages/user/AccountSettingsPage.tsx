import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useLanguages, useCurrencies } from "@/hooks/useAppData";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const AREA_UNITS = [
  { label: "Meter Sq. (m²)", value: "m²" },
  { label: "Feet Sq. (ft²)", value: "ft²" },
];

const AccountSettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: languages = [] } = useLanguages();
  const { data: currencies = [] } = useCurrencies();

  const [profile, setProfile] = useState({
    first_name: "", last_name: "", display_name: "", phone: "", show_phone: false,
    preferred_language: "en", preferred_currency: "USD", preferred_area_unit: "m²",
    avatar_url: "",
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Change password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      setEmail(user.email || "");
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).limit(1).maybeSingle();
      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          display_name: data.display_name || "",
          phone: data.phone || "",
          show_phone: data.show_phone ?? false,
          preferred_language: data.preferred_language || "en",
          preferred_currency: data.preferred_currency || "USD",
          preferred_area_unit: data.preferred_area_unit || "m²",
          avatar_url: data.avatar_url || "",
        });
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("profiles").update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        phone: profile.phone || null,
        show_phone: profile.show_phone,
        preferred_language: profile.preferred_language,
        preferred_currency: profile.preferred_currency,
        preferred_area_unit: profile.preferred_area_unit,
      } as any).eq("user_id", user.id);
      if (error) throw error;
      toast.success(t('accountSettings.profileUpdated'));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error(t('auth.passwordMinLength')); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success(t('accountSettings.passwordChanged'));
      setOldPw(""); setNewPw("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  const upd = (key: string, val: any) => setProfile(p => ({ ...p, [key]: val }));

  return (
    <UserLayout>
      <div className="max-w-3xl space-y-8">
        <h1 className="text-2xl font-bold text-foreground">{t('accountSettings.title')}</h1>

        {/* Personal Information */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t('accountSettings.personalInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('accountSettings.firstName')} *</Label>
              <Input value={profile.first_name} onChange={e => upd("first_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('accountSettings.lastName')} *</Label>
              <Input value={profile.last_name} onChange={e => upd("last_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('accountSettings.displayName')} *</Label>
              <Input value={profile.display_name} onChange={e => upd("display_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('accountSettings.email')}</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>{t('accountSettings.phone')}</Label>
              <Input value={profile.phone} onChange={e => upd("phone", e.target.value)} placeholder="e.g. +90 555 123 4567" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={profile.show_phone} onCheckedChange={v => upd("show_phone", v)} />
              <Label className="text-sm">{t('accountSettings.showPhone')}</Label>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t('accountSettings.preferences')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('accountSettings.language')}</Label>
              <select value={profile.preferred_language} onChange={e => upd("preferred_language", e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {languages.map(l => <option key={l.id} value={l.code}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t('accountSettings.currency')}</Label>
              <select value={profile.preferred_currency} onChange={e => upd("preferred_currency", e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {currencies.map(c => <option key={c.id} value={c.code}>{c.name} ({c.symbol})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t('accountSettings.areaUnit')}</Label>
              <select value={profile.preferred_area_unit} onChange={e => upd("preferred_area_unit", e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {AREA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
          {loading ? t('accountSettings.saving') : t('accountSettings.updateProfile')}
        </Button>

        {/* Change Password */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t('accountSettings.changePassword')}</h2>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>{t('accountSettings.newPassword')}</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder={t('accountSettings.enterNewPassword')} required />
                <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={pwLoading}>
              {pwLoading ? t('accountSettings.changingPassword') : t('accountSettings.changePassword')}
            </Button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-card rounded-xl border border-destructive/30 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">{t('accountSettings.dangerZone')}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('accountSettings.deleteWarning')}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">{t('accountSettings.deleteAccount')}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('accountSettings.areYouSure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('accountSettings.deleteConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    try {
                      await supabase.auth.signOut();
                      toast.success(t('accountSettings.deletionRequested'));
                      navigate("/");
                    } catch {
                      toast.error(t('common.error'));
                    }
                  }}
                >
                  {t('accountSettings.deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </UserLayout>
  );
};

export default AccountSettingsPage;
