import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Phone, MessageCircle, Mail, Lock, Info, MapPin, Globe, BarChart3, Bot, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PatternLock from "@/components/admin/PatternLock";
import type { AnalyticsPhase } from "@/hooks/useAnalyticsPhase";
import { useTranslation } from "react-i18next";

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [salesPhone, setSalesPhone] = useState("");
  const [salesWhatsapp, setSalesWhatsapp] = useState("");
  const [salesEmail, setSalesEmail] = useState("");
  const [salesAddress, setSalesAddress] = useState("");
  const [mapProvider, setMapProvider] = useState("google");
  const [analyticsPhase, setAnalyticsPhase] = useState<AnalyticsPhase>("phase1");
  const [aiSearchEnabled, setAiSearchEnabled] = useState(true);
  const [responseRateVisible, setResponseRateVisible] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [patternActive, setPatternActive] = useState(true);


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
        setMapProvider(map.map_provider || "google");
        setAnalyticsPhase((map.analytics_display_phase as AnalyticsPhase) || "phase1");
        setAiSearchEnabled(map.ai_search_enabled !== 'false');
        setResponseRateVisible(map.response_rate_visible !== 'false');
        setCurrentPattern(map.admin_pattern_code || "");
        setPatternActive(map.admin_pattern_active !== 'false');
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
      saveSetting("sales_address", salesAddress),
      saveSetting("map_provider", mapProvider),
      saveSetting("analytics_display_phase", analyticsPhase),
      saveSetting("ai_search_enabled", aiSearchEnabled ? 'true' : 'false'),
      saveSetting("response_rate_visible", responseRateVisible ? 'true' : 'false'),
    ]);
    const hasError = errors.some(e => e);
    if (hasError) {
      toast({ title: t("admin.errorSavingSettings"), variant: "destructive" });
    } else {
      toast({ title: t("admin.settingsSaved") });
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
            toast({ title: t("admin.errorSavingPattern"), variant: "destructive" });
          } else {
            setCurrentPattern(patternStr);
            toast({ title: t("admin.patternUpdated") });
          }
          setPatternStep('view');
          setNewPattern(null);
          setConfirmPattern(null);
        });
      } else {
        toast({ title: t("admin.patternsDontMatch"), variant: "destructive" });
        setPatternStep('draw');
        setNewPattern(null);
        setConfirmPattern(null);
      }
    }
  };

  if (loading) {
    return <AdminLayout><div className="text-center py-12 text-muted-foreground">{t("admin.loadingSettings")}</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.settings")}</h1>

        {/* Sales Team Contact */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">{t("admin.salesTeamContact")}</h2>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Phone className="h-4 w-4" /> {t("admin.phoneNumber")}</Label>
            <Input value={salesPhone} onChange={e => setSalesPhone(e.target.value)} placeholder="+90 555 123 4567" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> {t("admin.whatsappNumber")}</Label>
            <Input value={salesWhatsapp} onChange={e => setSalesWhatsapp(e.target.value)} placeholder="+90 555 123 4567" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> {t("admin.contactEmail")}</Label>
            <Input type="email" value={salesEmail} onChange={e => setSalesEmail(e.target.value)} placeholder="sales@turegu.com" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {t("admin.officeAddress")}</Label>
            <Input value={salesAddress} onChange={e => setSalesAddress(e.target.value)} placeholder="123 Main St, City, Country" />
          </div>

          <Button onClick={handleSaveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? t("admin.saving") : t("admin.saveSettings")}
          </Button>
        </div>


        {/* Response Rate Visibility */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Eye className="h-5 w-5" /> {t("admin.responseRateVisibility", "Response Rate Visibility")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.responseRateVisibilityDesc", "Show or hide the response rate badge on public agent and company profile pages.")}
          </p>
          <div className="space-y-2">
            <Label>{t("admin.responseRateStatus", "Response Rate Display")}</Label>
            <Select value={responseRateVisible ? 'true' : 'false'} onValueChange={(v) => setResponseRateVisible(v === 'true')}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("admin.visible", "Visible")}</SelectItem>
                <SelectItem value="false">{t("admin.hidden", "Hidden")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted border border-border text-foreground text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t("admin.responseRateHiddenInfo", "When hidden, the response rate and average response time badges will not appear on any public profile page. Data continues to be tracked internally.")}</span>
          </div>
        </div>


        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5" /> {t("admin.aiPropertySearch")}
          </h2>
          <p className="text-sm text-muted-foreground">
            Enable or disable the AI Property Agent button across all pages.
          </p>
          <div className="space-y-2">
            <Label>{t("admin.aiSearchStatus")}</Label>
            <Select value={aiSearchEnabled ? 'true' : 'false'} onValueChange={(v) => setAiSearchEnabled(v === 'true')}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("admin.enabled")}</SelectItem>
                <SelectItem value="false">{t("admin.disabled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted border border-border text-foreground text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t("admin.aiSearchDisabledInfo")}</span>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5" /> {t("admin.mapProvider")}
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose which map service to display on listing pages.
          </p>
          <div className="space-y-2">
            <Label>{t("admin.activeMapProvider")}</Label>
            <Select value={mapProvider} onValueChange={setMapProvider}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">{t("admin.googleMaps")}</SelectItem>
                <SelectItem value="leaflet">{t("admin.leafletOSM")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted border border-border text-foreground text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t("admin.googleMapsInfo")}</span>
          </div>
        </div>
        {/* Login Email */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">{t("admin.loginEmail")}</h2>
          <div className="space-y-2">
            <Label>{t("admin.currentAdminEmail")}</Label>
            <Input value={adminEmail} disabled className="bg-muted" />
          </div>
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted border border-border text-foreground text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t("admin.changeEmailInfo")}</span>
          </div>
        </div>

        {/* Analytics Display Phase */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> {t("admin.analyticsDisplayMode")}
          </h2>
          <p className="text-sm text-muted-foreground">
            Controls what companies and agents see in their Performance Insights tab.
          </p>
          <div className="space-y-2">
            <Label>{t("admin.activePhase")}</Label>
            <Select value={analyticsPhase} onValueChange={(v) => setAnalyticsPhase(v as AnalyticsPhase)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off — Hide Performance Insights entirely</SelectItem>
                <SelectItem value="phase1">Phase 1: Soft Labels (Recommended for new platforms)</SelectItem>
                <SelectItem value="phase2">Phase 2: Relative + Masked Numbers</SelectItem>
                <SelectItem value="phase3">Phase 3: Full Analytics + Funnel Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2 p-3 rounded-md bg-muted border border-border">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="space-y-1 text-foreground">
                <p><strong>Phase 1:</strong> Shows qualitative tiers only (e.g. "Growing Interest", "Building Momentum"). Low numbers hidden behind "Analyzing Market Data..."</p>
                <p><strong>Phase 2:</strong> Shows tiers + masked stats. Numbers below thresholds display as "Initial Exposure Phase" instead of raw counts.</p>
                <p><strong>Phase 3:</strong> Full raw numbers, breakdown by channel (WhatsApp/Call/Email), and conversion funnel chart.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Lock */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5" /> {t("admin.patternLock")}
          </h2>

          {/* Pattern Login Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {patternActive ? t("admin.patternLoginActive") : t("admin.patternLoginInactive")}
              </p>
              {!currentPattern && (
                <p className="text-xs text-muted-foreground mt-0.5">{t("admin.setPatternFirst")}</p>
              )}
            </div>
            <Switch
              checked={patternActive}
              disabled={!currentPattern}
              onCheckedChange={async (val) => {
                setPatternActive(val);
                // Upsert the setting
                const { data: existing } = await supabase
                  .from("admin_settings")
                  .select("id")
                  .eq("setting_key", "admin_pattern_active")
                  .maybeSingle();
                if (existing) {
                  await supabase.from("admin_settings").update({ setting_value: String(val) }).eq("setting_key", "admin_pattern_active");
                } else {
                  await supabase.from("admin_settings").insert({ setting_key: "admin_pattern_active", setting_value: String(val) });
                }
                toast({ title: val ? t("admin.patternActivated") : t("admin.patternDeactivated") });
              }}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            {currentPattern ? t("admin.patternCurrentlySet") : t("admin.noPatternSet")}
          </p>

          {patternStep === 'view' && (
            <Button variant="outline" onClick={() => { setPatternStep('draw'); setNewPattern(null); }}>
              {currentPattern ? t("admin.changePattern") : t("admin.setPattern")}
            </Button>
          )}

          {patternStep === 'draw' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground text-center">{t("admin.drawNewPattern")}</p>
              <PatternLock onPatternComplete={handleNewPatternDraw} />
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setPatternStep('view')}>{t("admin.cancel")}</Button>
            </div>
          )}

          {patternStep === 'confirm' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground text-center">{t("admin.confirmNewPattern")}</p>
              <PatternLock onPatternComplete={handleNewPatternDraw} />
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setPatternStep('draw'); setNewPattern(null); }}>{t("admin.redraw")}</Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
