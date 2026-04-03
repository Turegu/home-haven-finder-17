import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Trash2, MoreVertical, Eye, Pencil, ArrowUpCircle, Coins, Users, Home, FolderKanban, CalendarDays, BadgeCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { format, differenceInDays, differenceInSeconds } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import UpgradeMembershipDialog from "@/components/admin/UpgradeMembershipDialog";
import AddCreditsDialog from "@/components/admin/AddCreditsDialog";
import { useTestMode } from "@/hooks/useTestMode";

type Company = Tables<"companies">;

type SortOption = "newest" | "oldest" | "most_properties" | "most_agents" | "most_projects" | "expiry_soonest";

const MEMBERSHIP_TIERS = ["basic", "lite", "plus", "pro"] as const;

const MEMBERSHIP_COLORS: Record<string, string> = {
  pro: "bg-emerald-100 text-emerald-800 border-emerald-300",
  plus: "bg-orange-100 text-orange-800 border-orange-300",
  lite: "bg-purple-100 text-purple-800 border-purple-300",
  basic: "bg-muted text-muted-foreground border-border",
};

const AdminCompaniesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isTestMode } = useTestMode();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");
  const [selected, setSelected] = useState<string[]>([]);
  const [membershipFilter, setMembershipFilter] = useState<string[]>([]);

  // Dialog state
  const [upgradeCompany, setUpgradeCompany] = useState<Company | null>(null);
  const [creditsCompany, setCreditsCompany] = useState<Company | null>(null);

  const { data: queryData, isLoading: loading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      await supabase.rpc("downgrade_expired_memberships");

      const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (error) {
        toast.error(t("admin.failedToFetchCompanies"));
        return { companies: [] as Company[], propertyCounts: {} as Record<string, number>, agentCounts: {} as Record<string, number>, projectCounts: {} as Record<string, number> };
      }

      const companies = data || [];
      const companyIds = companies.map(c => c.id);
      let pCounts: Record<string, number> = {};
      let aCounts: Record<string, number> = {};
      let prCounts: Record<string, number> = {};

      if (companyIds.length > 0) {
        const [{ data: props }, { data: agents }, { data: projects }] = await Promise.all([
          supabase.from("properties").select("company_id").in("company_id", companyIds),
          supabase.from("agents").select("company_id").in("company_id", companyIds),
          supabase.from("projects").select("company_id").in("company_id", companyIds),
        ]);
        (props || []).forEach(p => { pCounts[p.company_id!] = (pCounts[p.company_id!] || 0) + 1; });
        (agents || []).forEach(a => { aCounts[a.company_id] = (aCounts[a.company_id] || 0) + 1; });
        (projects || []).forEach(p => { prCounts[p.company_id!] = (prCounts[p.company_id!] || 0) + 1; });
      }

      return { companies, propertyCounts: pCounts, agentCounts: aCounts, projectCounts: prCounts };
    },
    staleTime: 30_000,
  });

  const companies = queryData?.companies || [];
  const propertyCounts = queryData?.propertyCounts || {};
  const agentCounts = queryData?.agentCounts || {};
  const projectCounts = queryData?.projectCounts || {};

  const refetchCompanies = () => queryClient.invalidateQueries({ queryKey: ["admin-companies"] });

  const toggleMembership = (tier: string) => {
    setMembershipFilter(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  const filteredAndSorted = useMemo(() => {
    let result = companies.filter(c =>
      turkishIncludes(c.name, search) || turkishIncludes(c.email, search)
    );

    // Membership filter
    if (membershipFilter.length > 0) {
      result = result.filter(c => membershipFilter.includes(c.membership));
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "most_properties":
          return (propertyCounts[b.id] || 0) - (propertyCounts[a.id] || 0);
        case "most_agents":
          return (agentCounts[b.id] || 0) - (agentCounts[a.id] || 0);
        case "most_projects":
          return (projectCounts[b.id] || 0) - (projectCounts[a.id] || 0);
        case "expiry_soonest": {
          const aEnd = a.package_end_date ? new Date(a.package_end_date).getTime() : Infinity;
          const bEnd = b.package_end_date ? new Date(b.package_end_date).getTime() : Infinity;
          return aEnd - bEnd;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [companies, search, sortOrder, membershipFilter, propertyCounts, agentCounts, projectCounts]);

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredAndSorted.length) {
      setSelected([]);
    } else {
      setSelected(filteredAndSorted.map(c => c.id));
    }
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    const { error } = await supabase.from("companies").delete().in("id", selected);
    if (error) {
      toast.error(t("admin.failedToDeleteCompanies"));
    } else {
      toast.success(`${selected.length} company(ies) deleted`);
      setSelected([]);
      refetchCompanies();
    }
  };

  const handleToggleVerified = async (company: Company) => {
    const newValue = !company.is_verified;
    const { error } = await supabase.from("companies").update({ is_verified: newValue }).eq("id", company.id);
    if (error) {
      toast.error(t("admin.failedToUpdateVerification"));
    } else {
      toast.success(`${company.name} ${newValue ? "verified" : "unverified"}`);
      refetchCompanies();
    }
  };

  const membershipColor = (m: string) => MEMBERSHIP_COLORS[m] || MEMBERSHIP_COLORS.basic;

  const isExpiringSoon = (company: Company): boolean => {
    if (!company.package_end_date || company.membership === "basic") return false;
    const now = new Date();
    const end = new Date(company.package_end_date);
    if (end <= now) return false;
    if (isTestMode) {
      return differenceInSeconds(end, now) <= 15;
    }
    return differenceInDays(end, now) <= 7;
  };

  // Summary counts per tier
  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    companies.forEach(c => { counts[c.membership] = (counts[c.membership] || 0) + 1; });
    return counts;
  }, [companies]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.companiesManagement")}</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.searchByCompany")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">{t("admin.sortBy")}</span>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOption)}>
              <SelectTrigger className="w-[200px] bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("admin.newestFirst")}</SelectItem>
                <SelectItem value="oldest">{t("admin.oldestFirst")}</SelectItem>
                <SelectItem value="most_properties">{t("admin.mostProperties")}</SelectItem>
                <SelectItem value="most_agents">{t("admin.mostAgents")}</SelectItem>
                <SelectItem value="most_projects">{t("admin.mostProjects")}</SelectItem>
                <SelectItem value="expiry_soonest">{t("admin.expirySoonest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {selected.length > 0 && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete ({selected.length})
              </Button>
            )}
            <Button onClick={() => navigate("/admin/companies/new")}>
              <Plus className="h-4 w-4 mr-2" /> {t("admin.createNewCompany")}
            </Button>
          </div>
        </div>

        {/* Membership Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("admin.membership")}</span>
          {MEMBERSHIP_TIERS.map(tier => {
            const isActive = membershipFilter.includes(tier);
            const count = tierCounts[tier] || 0;
            return (
              <button
                key={tier}
                onClick={() => toggleMembership(tier)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                  isActive
                    ? MEMBERSHIP_COLORS[tier] + " ring-2 ring-primary/30"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {tier}
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${isActive ? "bg-background/50" : "bg-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          {membershipFilter.length > 0 && (
            <button
              onClick={() => setMembershipFilter([])}
              className="text-xs text-primary hover:underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground uppercase text-sm tracking-wider">{t("admin.companies")}</h2>
          <span className="text-xs text-muted-foreground">{filteredAndSorted.length} of {companies.length} companies</span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.length === filteredAndSorted.length && filteredAndSorted.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold w-12">#</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("admin.creationDate")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("admin.membershipCol")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("admin.companyName")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("admin.packageEnd")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">{t("admin.properties")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">{t("admin.agents")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">{t("admin.projects")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">{t("admin.email")}</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">{t("admin.options")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredAndSorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    No companies found. Click "Create New Company" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSorted.map((company, idx) => {
                  const expiring = isExpiringSoon(company);
                  return (
                  <TableRow key={company.id} className={`hover:bg-muted/30 ${expiring ? "bg-destructive/10" : ""}`}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(company.id)}
                        onCheckedChange={() => toggleSelect(company.id)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">{idx + 1}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(company.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge className={membershipColor(company.membership)} variant="secondary">
                        {company.membership}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        {company.name}
                        {company.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {company.package_end_date ? (
                        <div className="flex items-center gap-1.5">
                          <span className={expiring ? "text-destructive font-semibold" : "text-muted-foreground"}>
                            {format(new Date(company.package_end_date), "dd/MM/yyyy")}
                          </span>
                          {expiring && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              {t("admin.expiringSoon")}
                            </Badge>
                          )}
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-foreground">{propertyCounts[company.id] || 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-foreground">{agentCounts[company.id] || 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-foreground">{projectCounts[company.id] || 0}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.email}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> {t("admin.viewProfile")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" /> {t("admin.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setUpgradeCompany(company)}>
                            <ArrowUpCircle className="h-4 w-4 mr-2" /> {t("admin.changeMembership")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleVerified(company)}>
                            {company.is_verified
                              ? <><ShieldOff className="h-4 w-4 mr-2" /> Remove Verified</>
                              : <><BadgeCheck className="h-4 w-4 mr-2" /> Mark as Verified</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCreditsCompany(company)}>
                            <Coins className="h-4 w-4 mr-2" /> Add Points
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}/agents`)}>
                            <Users className="h-4 w-4 mr-2" /> View Agents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/properties?company=${encodeURIComponent(company.name)}`)}>
                            <Home className="h-4 w-4 mr-2" /> View Properties
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/projects?company=${encodeURIComponent(company.name)}`)}>
                            <FolderKanban className="h-4 w-4 mr-2" /> View Projects
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/events?company=${encodeURIComponent(company.name)}`)}>
                            <CalendarDays className="h-4 w-4 mr-2" /> View Events
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upgrade Membership Dialog */}
      {upgradeCompany && (
        <UpgradeMembershipDialog
          open={!!upgradeCompany}
          onOpenChange={(open) => !open && setUpgradeCompany(null)}
          companyId={upgradeCompany.id}
          companyName={upgradeCompany.name}
          currentMembership={upgradeCompany.membership}
          packageEndDate={upgradeCompany.package_end_date}
          onUpgraded={refetchCompanies}
        />
      )}

      {/* Add Credits Dialog */}
      {creditsCompany && (
        <AddCreditsDialog
          open={!!creditsCompany}
          onOpenChange={(open) => !open && setCreditsCompany(null)}
          companyId={creditsCompany.id}
          companyName={creditsCompany.name}
          currentBalance={creditsCompany.credit_balance}
          onUpdated={refetchCompanies}
        />
      )}

    </AdminLayout>
  );
};

export default AdminCompaniesPage;
