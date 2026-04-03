import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowUpCircle, Save, Coins, Rocket, Search, Building2, User, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import BoostProfileDialog from "@/components/BoostProfileDialog";
import { turkishIncludes } from "@/lib/utils";

interface CreditSetting {
  key: string;
  label: string;
  value: string;
}

interface CompanyRow {
  id: string;
  name: string;
  logo_url: string | null;
  profile_classification: string;
  boost_end_date: string | null;
  credit_balance: number;
}

interface AgentRow {
  id: string;
  name: string;
  avatar_url: string | null;
  profile_classification: string;
  boost_end_date: string | null;
  credit_balance: number;
  company_id: string;
  companies: { name: string } | null;
}

const isBoosted = (cls: string, endDate: string | null) =>
  cls === "boosted" && endDate && new Date(endDate) > new Date();

const AdminFeaturedManagementPage = () => {
  const [settings, setSettings] = useState<CreditSetting[]>([
    { key: "premium_1_month_credits", label: "Premium - 1 Month", value: "20" },
    { key: "premium_3_months_credits", label: "Premium - 3 Months", value: "50" },
    { key: "featured_1_month_credits", label: "Featured - 1 Month", value: "10" },
    { key: "featured_3_months_credits", label: "Featured - 3 Months", value: "25" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Boost pricing
  const [boostCompany3, setBoostCompany3] = useState("20");
  const [boostCompany6, setBoostCompany6] = useState("35");
  const [boostCompany12, setBoostCompany12] = useState("60");
  const [boostAgent3, setBoostAgent3] = useState("15");
  const [boostAgent6, setBoostAgent6] = useState("25");
  const [boostAgent12, setBoostAgent12] = useState("45");
  const [savingBoost, setSavingBoost] = useState(false);

  // Boost section
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [searchCompany, setSearchCompany] = useState("");
  const [searchAgent, setSearchAgent] = useState("");
  const [boostTarget, setBoostTarget] = useState<{ type: "company" | "agent"; data: any } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [settingsRes, compRes, agentRes] = await Promise.all([
      supabase.from("admin_settings").select("setting_key, setting_value"),
      supabase.from("companies").select("id, name, logo_url, profile_classification, boost_end_date, credit_balance").eq("is_verified", true).order("name"),
      supabase.from("agents").select("id, name, avatar_url, profile_classification, boost_end_date, credit_balance, company_id, companies(name)").eq("status", "active").order("name"),
    ]);

    if (settingsRes.data) {
      const map: Record<string, string> = {};
      (settingsRes.data as any[]).forEach((d: any) => { map[d.setting_key] = d.setting_value; });

      setSettings(prev =>
        prev.map(s => {
          const found = (settingsRes.data as any[]).find((d: any) => d.setting_key === s.key);
          return found ? { ...s, value: found.setting_value } : s;
        })
      );

      setBoostCompany3(map.boost_company_3_months_credits || "20");
      setBoostCompany6(map.boost_company_6_months_credits || "35");
      setBoostCompany12(map.boost_company_12_months_credits || "60");
      setBoostAgent3(map.boost_agent_3_months_credits || "15");
      setBoostAgent6(map.boost_agent_6_months_credits || "25");
      setBoostAgent12(map.boost_agent_12_months_credits || "45");
    }
    setCompanies((compRes.data || []) as CompanyRow[]);
    setAgents((agentRes.data || []) as unknown as AgentRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

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

  const handleSaveBoostPricing = async () => {
    setSavingBoost(true);
    try {
      const boostSettings = [
        { setting_key: "boost_company_3_months_credits", setting_value: boostCompany3 },
        { setting_key: "boost_company_6_months_credits", setting_value: boostCompany6 },
        { setting_key: "boost_company_12_months_credits", setting_value: boostCompany12 },
        { setting_key: "boost_agent_3_months_credits", setting_value: boostAgent3 },
        { setting_key: "boost_agent_6_months_credits", setting_value: boostAgent6 },
        { setting_key: "boost_agent_12_months_credits", setting_value: boostAgent12 },
      ];
      for (const s of boostSettings) {
        const { error } = await supabase
          .from("admin_settings")
          .upsert(s, { onConflict: "setting_key" });
        if (error) throw error;
      }
      toast.success("Boost pricing updated successfully");
    } catch {
      toast.error("Failed to save boost pricing");
    } finally {
      setSavingBoost(false);
    }
  };

  const filteredCompanies = companies.filter(c => !searchCompany || turkishIncludes(c.name, searchCompany));
  const filteredAgents = agents.filter(a => !searchAgent || turkishIncludes(a.name, searchAgent));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ArrowUpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Featured Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure listing upgrade costs, profile boost pricing, and boost company/agent profiles.
        </p>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Profile Boost Pricing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5" /> Profile Boost Pricing
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set the credit cost for companies and agents to boost their profiles.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Company Boost Cost (Credits)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">3 Months</Label>
                      <Input type="number" value={boostCompany3} onChange={e => setBoostCompany3(e.target.value)} min="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">6 Months</Label>
                      <Input type="number" value={boostCompany6} onChange={e => setBoostCompany6(e.target.value)} min="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">12 Months</Label>
                      <Input type="number" value={boostCompany12} onChange={e => setBoostCompany12(e.target.value)} min="0" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Agent Boost Cost (Credits)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">3 Months</Label>
                      <Input type="number" value={boostAgent3} onChange={e => setBoostAgent3(e.target.value)} min="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">6 Months</Label>
                      <Input type="number" value={boostAgent6} onChange={e => setBoostAgent6(e.target.value)} min="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">12 Months</Label>
                      <Input type="number" value={boostAgent12} onChange={e => setBoostAgent12(e.target.value)} min="0" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-md bg-muted border border-border text-foreground text-sm">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>These costs are deducted from the company's or agent's credit balance when they boost their profile. Changes take effect immediately for new boosts.</span>
                </div>

                <Button onClick={handleSaveBoostPricing} disabled={savingBoost} className="gap-2">
                  <Save className="h-4 w-4" /> {savingBoost ? "Saving..." : "Save Boost Pricing"}
                </Button>
              </CardContent>
            </Card>

            {/* Listing upgrade costs */}
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
                        <Input type="number" min="0" value={s.value} onChange={e => updateValue(s.key, e.target.value)} className="bg-secondary/50" />
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
                        <Input type="number" min="0" value={s.value} onChange={e => updateValue(s.key, e.target.value)} className="bg-secondary/50" />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Credits</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Listing Costs"}
            </Button>

            {/* Boost Companies */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Boost Company Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search companies..." value={searchCompany} onChange={e => setSearchCompany(e.target.value)} className="pl-9" />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredCompanies.map(c => {
                    const boosted = isBoosted(c.profile_classification, c.boost_end_date);
                    return (
                      <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${boosted ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={c.name} className="h-8 w-8 rounded object-contain" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs font-bold">{c.name.charAt(0)}</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.credit_balance} credits</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {boosted && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Rocket className="h-3 w-3" />
                              Until {format(new Date(c.boost_end_date!), "dd/MM/yyyy")}
                            </Badge>
                          )}
                          <Button size="sm" variant={boosted ? "outline" : "default"} onClick={() => setBoostTarget({ type: "company", data: c })}>
                            <Rocket className="h-3.5 w-3.5 mr-1" /> {boosted ? "Extend" : "Boost"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Boost Agents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Boost Agent Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search agents..." value={searchAgent} onChange={e => setSearchAgent(e.target.value)} className="pl-9" />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredAgents.map(a => {
                    const boosted = isBoosted(a.profile_classification, a.boost_end_date);
                    return (
                      <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg border ${boosted ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt={a.name} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{a.name.charAt(0)}</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.companies?.name} · {a.credit_balance} credits</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {boosted && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Rocket className="h-3 w-3" />
                              Until {format(new Date(a.boost_end_date!), "dd/MM/yyyy")}
                            </Badge>
                          )}
                          <Button size="sm" variant={boosted ? "outline" : "default"} onClick={() => setBoostTarget({ type: "agent", data: a })}>
                            <Rocket className="h-3.5 w-3.5 mr-1" /> {boosted ? "Extend" : "Boost"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {boostTarget && (
        <BoostProfileDialog
          open={!!boostTarget}
          onOpenChange={(open) => !open && setBoostTarget(null)}
          profileId={boostTarget.data.id}
          profileName={boostTarget.data.name}
          profileType={boostTarget.type}
          balanceSource={boostTarget.type}
          balanceSourceId={boostTarget.data.id}
          currentClassification={boostTarget.data.profile_classification || "standard"}
          boostEndDate={boostTarget.data.boost_end_date || null}
          onBoosted={fetchAll}
          isAdminBoost
        />
      )}
    </AdminLayout>
  );
};

export default AdminFeaturedManagementPage;
