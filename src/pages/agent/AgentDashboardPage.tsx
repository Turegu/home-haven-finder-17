import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgentIdentity } from "@/hooks/useAgentIdentity";
import AgentLayout from "@/components/agent/AgentLayout";
import { Button } from "@/components/ui/button";
import {
  Building2, FolderKanban, Calendar, CreditCard, Users2,
  Star, ArrowRight, Briefcase, Zap, Crown, Rocket
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import BoostProfileDialog from "@/components/BoostProfileDialog";

const membershipIcons: Record<string, React.ElementType> = {
  basic: Briefcase,
  lite: Zap,
  plus: Star,
  pro: Crown,
};

const AgentDashboardPage = () => {
  const { t } = useTranslation();
  const [boostOpen, setBoostOpen] = useState(false);
  const { data: agent, isLoading: agentLoading } = useAgentIdentity();

  const { data: company } = useQuery({
    queryKey: ["agent-company", agent?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("name, logo_url, membership, package_end_date")
        .eq("id", agent!.company_id)
        .single();
      return data;
    },
    enabled: !!agent?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: counts = { properties: 0, projects: 0, events: 0, followers: 0 }, isLoading: countsLoading } = useQuery({
    queryKey: ["agent-dashboard-counts", agent?.id, agent?.company_id],
    queryFn: async () => {
      const [propRes, projRes, eventRes, followerRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agent!.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("agent_id", agent!.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("agent_id", agent!.id),
        supabase.from("company_followers").select("id", { count: "exact", head: true }).eq("company_id", agent!.company_id),
      ]);
      return {
        properties: propRes.count || 0,
        projects: projRes.count || 0,
        events: eventRes.count || 0,
        followers: followerRes.count || 0,
      };
    },
    enabled: !!agent?.id,
    staleTime: 30_000,
  });

  const loading = agentLoading || countsLoading;

  const membershipConfig: Record<string, { color: string; bg: string }> = {
    pro: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    plus: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    lite: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
    basic: { color: "text-muted-foreground", bg: "bg-muted border-border" },
  };

  if (loading || !agent) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">{t("agentDashboard.loadingDashboard")}</div>
      </AgentLayout>
    );
  }

  const mem = membershipConfig[company?.membership || "basic"] || membershipConfig.basic;
  const isBoosted = agent.profile_classification === "boosted" && agent.boost_end_date && new Date(agent.boost_end_date) > new Date();
  const boostDaysLeft = agent.boost_end_date ? differenceInDays(new Date(agent.boost_end_date), new Date()) : null;

  return (
    <AgentLayout>
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt={agent.name} className="h-12 w-12 rounded-xl object-cover border border-border shadow-sm" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {agent.name?.charAt(0) || "A"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("agentDashboard.welcomeBack", { name: agent.name })}</h1>
            {company && (
              <div className="flex items-center gap-2 mt-0.5">
                {company.logo_url && (
                  <img src={company.logo_url} alt={company.name} className="h-4 w-auto max-w-[40px] rounded object-contain" />
                )}
                <p className="text-sm text-muted-foreground">{company.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Boost Profile Card */}
      <div className={`mb-8 rounded-xl border p-5 flex items-center justify-between ${isBoosted ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
        <div className="flex items-center gap-4">
          <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${isBoosted ? 'bg-primary/10' : 'bg-muted'}`}>
            <Rocket className={`h-5 w-5 ${isBoosted ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
             <h3 className="text-sm font-semibold text-foreground">
              {isBoosted ? t("companyDashboard.profileBoosted") : t("companyDashboard.profileNotBoosted")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBoosted
                ? t("companyDashboard.boostedUntil", { date: format(new Date(agent.boost_end_date!), "do MMM yyyy"), days: boostDaysLeft })
                : t("companyDashboard.boostDescription")}
            </p>
          </div>
        </div>
        <Button size="sm" variant={isBoosted ? "outline" : "default"} onClick={() => setBoostOpen(true)}>
          <Rocket className="h-4 w-4 mr-1" /> {isBoosted ? t("companyDashboard.extendBoost") : t("companyDashboard.boostProfile")}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {(() => {
          const MembershipIcon = membershipIcons[company?.membership || "basic"] || Briefcase;
          const daysLeft = company?.package_end_date
            ? differenceInDays(new Date(company.package_end_date), new Date())
            : null;
          return (
            <div className={`rounded-xl border p-5 ${mem.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("agentDashboard.companyPlan")}</h3>
                <MembershipIcon className="h-5 w-5 text-primary" />
              </div>
              <p className={`text-xl font-bold ${mem.color} capitalize`}>{company?.membership}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {company?.package_end_date
                  ? `${t("agentDashboard.expires")} ${format(new Date(company.package_end_date), "do MMM yyyy")}${daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft} ${t("agentDashboard.daysLeft")})` : daysLeft !== null ? ` (${t("agentDashboard.expired")})` : ""}`
                  : t("agentDashboard.noExpirySet")}
              </p>
            </div>
          );
        })()}

        {/* Credit Balance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("agentDashboard.yourCredits")}</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{agent.credit_balance || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">{t("agentDashboard.availableBalance")}</p>
        </div>

        {/* Followers */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("agentDashboard.companyFollowers")}</h3>
            <Users2 className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.followers}</p>
          <p className="text-xs text-muted-foreground mt-2">{t("agentDashboard.totalFollowers")}</p>
        </div>

        {/* Assigned Total */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("agentDashboard.assignedToYou")}</h3>
            <Building2 className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.properties + counts.projects + counts.events}</p>
          <p className="text-xs text-muted-foreground mt-2">{t("agentDashboard.totalListings")}</p>
        </div>
      </div>

      {/* Listings Summary */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">{t("agentDashboard.yourAssignedListings")}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: "/agent/properties", icon: Building2, count: counts.properties, label: t("agentDashboard.properties"), color: "text-amber-500", bg: "bg-amber-500/10" },
          { to: "/agent/projects", icon: FolderKanban, count: counts.projects, label: t("agentDashboard.projects"), color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { to: "/agent/events", icon: Calendar, count: counts.events, label: t("agentDashboard.events"), color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((card) => (
          <Link key={card.to} to={card.to} className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
            <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center transition-colors`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{card.count}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      {/* Boost Dialog */}
      {agent && (
        <BoostProfileDialog
          open={boostOpen}
          onOpenChange={setBoostOpen}
          profileId={agent.id}
          profileName={agent.name}
          profileType="agent"
          balanceSource="agent"
          balanceSourceId={agent.id}
          currentClassification={agent.profile_classification}
          boostEndDate={agent.boost_end_date}
          onBoosted={() => { setBoostOpen(false); }}
        />
      )}
    </AgentLayout>
  );
};

export default AgentDashboardPage;
