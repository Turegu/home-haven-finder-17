import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import DowngradedListingsBanner from "@/components/company/DowngradedListingsBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, MoreVertical, Pencil, Coins, Trash2, ArrowUpCircle, Rocket } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";
import BoostProfileDialog from "@/components/BoostProfileDialog";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  credit_balance: number;
  created_at: string;
  profile_classification: string;
  boost_end_date: string | null;
  downgraded_at: string | null;
}

const CompanyAgentsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyCredits, setCompanyCredits] = useState(0);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Credit sharing dialog
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; agent: Agent | null }>({ open: false, agent: null });
  const [creditAmount, setCreditAmount] = useState("");
  const [sharingCredits, setSharingCredits] = useState(false);
  const { canCreate, membership, usage, limits, remainingSlots, refresh: refreshLimits } = useMembershipLimits(companyId);
  const [boostAgent, setBoostAgent] = useState<Agent | null>(null);
  const atLimit = !canCreate("agents");
  const maxAgents = limits?.max_agents || 1;
  const usagePercent = Math.min(100, (usage.agents / maxAgents) * 100);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies").select("id, credit_balance").eq("owner_user_id", user.id).limit(1).maybeSingle();
      if (company) {
        setCompanyId(company.id);
        setCompanyCredits(company.credit_balance);
      }
    };
    init();
  }, []);

  const fetchAgents = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("agents")
      .select("id, name, email, phone, status, credit_balance, created_at, profile_classification, boost_end_date")
      .eq("company_id", companyId)
      .order("created_at", { ascending: sortOrder === "oldest" });
    if (error) toast.error("Failed to fetch agents");
    else setAgents((data as Agent[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (companyId) fetchAgents(); }, [companyId, sortOrder]);

  const filtered = agents.filter(
    (a) => turkishIncludes(a.name, search) || turkishIncludes(a.email, search)
  );

  const handleDelete = async (agentId: string) => {
    if (!confirm(t("companyDashboard.confirmDelete"))) return;
    const { error } = await supabase.from("agents").update({ status: 'inactive', downgraded_at: new Date().toISOString() }).eq("id", agentId);
    if (error) toast.error("Deactivation failed");
    else { toast.success("Agent deactivated"); fetchAgents(); }
  };

  const handleShareCredits = async () => {
    if (!creditDialog.agent || !creditAmount) return;
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (amount > companyCredits) { toast.error("Insufficient company credits"); return; }

    setSharingCredits(true);
    try {
      const { error: compErr } = await supabase
        .from("companies")
        .update({ credit_balance: companyCredits - amount })
        .eq("id", companyId!);
      if (compErr) throw compErr;

      const { error: agentErr } = await supabase
        .from("agents")
        .update({ credit_balance: creditDialog.agent.credit_balance + amount })
        .eq("id", creditDialog.agent.id);
      if (agentErr) throw agentErr;

      setCompanyCredits((prev) => prev - amount);
      toast.success(`${amount} credits shared with ${creditDialog.agent.name}`);
      setCreditDialog({ open: false, agent: null });
      setCreditAmount("");
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to share credits");
    } finally {
      setSharingCredits(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active": return "bg-emerald-100 text-emerald-800";
      case "pending": return "bg-amber-100 text-amber-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "deactivated": return "bg-orange-100 text-orange-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <CompanyLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("companyDashboard.agentsManagement")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("companyDashboard.companyCredits")}: <span className="font-semibold text-primary">{companyCredits}</span></p>
        </div>
      </div>

      {/* Membership Usage */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border border-border bg-card">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t("companyDashboard.agentsUsed", { used: usage.agents, max: maxAgents, membership: membership.charAt(0).toUpperCase() + membership.slice(1) })}
            </span>
            <span className="text-xs text-muted-foreground">{remainingSlots("agents")} {t("companyDashboard.remaining").toLowerCase()}</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </div>
      </div>

      <DowngradedListingsBanner companyId={companyId} tableName="agents" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("companyDashboard.searchByNameOrEmail")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">{t("companyDashboard.sortByDate")}</span>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
            <SelectTrigger className="w-[170px] bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("companyDashboard.newestToOldest")}</SelectItem>
              <SelectItem value="oldest">{t("companyDashboard.oldestToNewest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    disabled={atLimit}
                    onClick={() => navigate("/company/agents/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" /> {t("companyDashboard.createNewAgent")}
                  </Button>
                </span>
              </TooltipTrigger>
              {atLimit && (
                <TooltipContent>
                  <p>{t("companyDashboard.limitReached", { type: t("companyDashboard.agents") })}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground uppercase text-sm tracking-wider">{t("companyDashboard.agents")}</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.creationDate")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.agents")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.email")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.phoneNo")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.credits")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("companyDashboard.status")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">{t("companyDashboard.options")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">{t("companyDashboard.noData")}</TableCell></TableRow>
              ) : (
                filtered.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(agent.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{agent.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{agent.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{agent.phone || "—"}</TableCell>
                    <TableCell className="text-sm font-semibold text-primary">{agent.credit_balance}</TableCell>
                    <TableCell>
                      <Badge className={statusColor(agent.status)} variant="secondary">
                        {agent.status === "active" ? t("companyDashboard.active") : agent.status === "inactive" && agent.downgraded_at ? t("companyDashboard.frozen") : agent.status === "inactive" ? t("companyDashboard.inactive") : agent.status === "pending" ? t("common.pending") : agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/company/agents/${agent.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" /> {t("companyDashboard.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setCreditDialog({ open: true, agent }); setCreditAmount(""); }}>
                            <Coins className="h-4 w-4 mr-2" /> {t("companyDashboard.shareCredits")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBoostAgent(agent)}>
                            <Rocket className="h-4 w-4 mr-2" /> {t("companyDashboard.boostProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(agent.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> {t("companyDashboard.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Credit Sharing Dialog */}
      <Dialog open={creditDialog.open} onOpenChange={(open) => setCreditDialog({ open, agent: open ? creditDialog.agent : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("companyDashboard.shareCredits")} - {creditDialog.agent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t("companyDashboard.yourCompanyBalance")}: <span className="font-semibold text-primary">{companyCredits}</span> {t("companyDashboard.credits")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("companyDashboard.agentCurrentBalance")}: <span className="font-semibold">{creditDialog.agent?.credit_balance || 0}</span> {t("companyDashboard.credits")}
            </p>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">{t("companyDashboard.amountToShare")}</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder={t("companyDashboard.enterAmount")}
                min="1"
                max={companyCredits}
                className="bg-secondary/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialog({ open: false, agent: null })}>{t("companyDashboard.cancel")}</Button>
            <Button onClick={handleShareCredits} disabled={sharingCredits}>
              <Coins className="h-4 w-4 mr-2" /> {sharingCredits ? t("companyDashboard.sharingCredits") : t("companyDashboard.shareCredits")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boost Agent Dialog */}
      {boostAgent && companyId && (
        <BoostProfileDialog
          open={!!boostAgent}
          onOpenChange={(open) => !open && setBoostAgent(null)}
          profileId={boostAgent.id}
          profileName={boostAgent.name}
          profileType="agent"
          balanceSource="company"
          balanceSourceId={companyId}
          currentClassification={boostAgent.profile_classification || "standard"}
          boostEndDate={boostAgent.boost_end_date}
          onBoosted={fetchAgents}
        />
      )}
    </CompanyLayout>
  );
};

export default CompanyAgentsPage;
