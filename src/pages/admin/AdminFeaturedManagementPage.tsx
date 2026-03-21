import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowUpCircle, Save, Coins } from "lucide-react";

interface CreditSetting {
  key: string;
  label: string;
  value: string;
}

const AdminFeaturedManagementPage = () => {
  const [settings, setSettings] = useState<CreditSetting[]>([
    { key: "premium_1_month_credits", label: "Premium - 1 Month", value: "20" },
    { key: "premium_3_months_credits", label: "Premium - 3 Months", value: "50" },
    { key: "featured_1_month_credits", label: "Featured - 1 Month", value: "10" },
    { key: "featured_3_months_credits", label: "Featured - 3 Months", value: "25" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", settings.map(s => s.key));

      if (data) {
        setSettings(prev =>
          prev.map(s => {
            const found = data.find(d => d.setting_key === s.key);
            return found ? { ...s, value: found.setting_value } : s;
          })
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateValue = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        const { error } = await supabase
          .from("admin_settings")
          .upsert({ setting_key: s.key, setting_value: s.value }, { onConflict: "setting_key" });
        if (error) throw error;
      }
      toast.success("Credit costs updated successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ArrowUpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Featured Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure the credit costs for upgrading listings to Premium or Featured status. These costs apply to all listing types (Properties, Projects, Events).
        </p>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  Premium Listing Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.filter(s => s.key.startsWith("premium")).map(s => (
                  <div key={s.key}>
                    <label className="text-sm font-medium text-foreground mb-1 block">{s.label}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={s.value}
                        onChange={e => updateValue(s.key, e.target.value)}
                        className="bg-secondary/50"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Credits</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coins className="h-5 w-5 text-teal-500" />
                  Featured Listing Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.filter(s => s.key.startsWith("featured")).map(s => (
                  <div key={s.key}>
                    <label className="text-sm font-medium text-foreground mb-1 block">{s.label}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={s.value}
                        onChange={e => updateValue(s.key, e.target.value)}
                        className="bg-secondary/50"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">Credits</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturedManagementPage;
