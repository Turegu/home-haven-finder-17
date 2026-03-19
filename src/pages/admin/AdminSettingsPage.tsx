import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Phone, MessageCircle, Mail, Lock, Info, MapPin } from "lucide-react";
import PatternLock from "@/components/admin/PatternLock";

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [salesPhone, setSalesPhone] = useState("");
  const [salesWhatsapp, setSalesWhatsapp] = useState("");
  const [salesEmail, setSalesEmail] = useState("");
  const [salesAddress, setSalesAddress] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Pattern
  const [currentPattern, setCurrentPattern] = useState("");
  const [newPattern, setNewPattern] = useState<number[] | null>(null);
  const [patternStep, setPatternStep] = useState<'view' | 'draw' | 'confirm'>('view');
  const [_confirmPattern, setConfirmPattern] = useState<number[] | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("admin_settings").select("setting_key, setting_value");
      if (data) {
        const map: Record<string, string> = {};
        (data as any[]).forEach((d: any) => { map[d.setting_key] = d.setting_value; });
        setSalesPhone(map.sales_phone || "");
        setSalesWhatsapp(map.sales_whatsapp || "");
        setSalesEmail(map.sales_email || "");
        setSalesAddress(map.sales_address || "");
        setCurrentPattern(map.admin_pattern_code || "");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminEmail(user.email || "");
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("admin_settings")
      .update({ setting_value: value })
      .eq("setting_key", key);
    return error;
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const errors = await Promise.all([
      saveSetting("sales_phone", salesPhone),
      saveSetting("sales_whatsapp", salesWhatsapp),
      saveSetting("sales_email", salesEmail),
    ]);
    const hasError = errors.some(e => e);
    if (hasError) {
      toast({ title: "Error saving settings", variant: "destructive" });
    } else {
      toast({ title: "Settings saved successfully" });
    }
    setSaving(false);
  };

  const handleNewPatternDraw = (pattern: number[]) => {
    if (patternStep === 'draw') {
      setNewPattern(pattern);
      setPatternStep('confirm');
    } else if (patternStep === 'confirm') {
      if (pattern.join(",") === newPattern?.join(",")) {
        const patternStr = pattern.join(",");
        saveSetting("admin_pattern_code", patternStr).then(err => {
          if (err) {
            toast({ title: "Error saving pattern", variant: "destructive" });
          } else {
            setCurrentPattern(patternStr);
            toast({ title: "Pattern updated successfully" });
          }
          setPatternStep('view');
          setNewPattern(null);
          setConfirmPattern(null);
        });
      } else {
        toast({ title: "Patterns don't match. Try again.", variant: "destructive" });
        setPatternStep('draw');
        setNewPattern(null);
        setConfirmPattern(null);
      }
    }
  };

  if (loading) {
    return <AdminLayout><div className="text-center py-12 text-muted-foreground">Loading settings...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">SETTINGS</h1>

        {/* Sales Team Contact */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Sales Team Contact</h2>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone Number</Label>
            <Input value={salesPhone} onChange={e => setSalesPhone(e.target.value)} placeholder="+90 555 123 4567" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp Number</Label>
            <Input value={salesWhatsapp} onChange={e => setSalesWhatsapp(e.target.value)} placeholder="+90 555 123 4567" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Contact Email</Label>
            <Input type="email" value={salesEmail} onChange={e => setSalesEmail(e.target.value)} placeholder="sales@turegu.com" />
          </div>

          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Login Email */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Login Email</h2>
          <div className="space-y-2">
            <Label>Current Admin Email</Label>
            <Input value={adminEmail} disabled className="bg-muted" />
          </div>
          <div className="flex items-start gap-2 p-3 rounded-md bg-accent border border-border text-muted-foreground text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Changing the admin email requires a secure verification process (OTP). This feature is planned for a future update.</span>
          </div>
        </div>

        {/* Pattern Lock */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5" /> Pattern Lock
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentPattern ? "A pattern is currently set." : "No pattern set yet."}
          </p>

          {patternStep === 'view' && (
            <Button variant="outline" onClick={() => { setPatternStep('draw'); setNewPattern(null); }}>
              {currentPattern ? "Change Pattern" : "Set Pattern"}
            </Button>
          )}

          {patternStep === 'draw' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground text-center">Draw a new pattern (min 3 dots)</p>
              <PatternLock onPatternComplete={handleNewPatternDraw} />
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setPatternStep('view')}>Cancel</Button>
            </div>
          )}

          {patternStep === 'confirm' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground text-center">Confirm your new pattern</p>
              <PatternLock onPatternComplete={handleNewPatternDraw} />
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setPatternStep('draw'); setNewPattern(null); }}>Redraw</Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
