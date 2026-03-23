import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
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

interface AgentData {
  id: string;
  name: string;
  avatar_url: string | null;
  company_id: string;
  credit_balance: number;
  profile_classification: string;
  boost_end_date: string | null;
}

interface CompanyData {
  name: string;
  logo_url: string | null;
  membership: string;
  package_end_date: string | null;
}

const AgentDashboardPage = () => {
  const { t } = useTranslation();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [counts, setCounts] = useState({ properties: 0, projects: 0, events: 0, followers: 0 });
  const [loading, setLoading] = useState(true);
  const [boostOpen, setBoostOpen] = useState(false);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agentData } = await supabase
      .from("agents")
      .select("id, name, avatar_url, company_id, credit_balance, profile_classification, boost_end_date")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!agentData) return;
    setAgent(agentData as AgentData);

    const { data: companyData } = await supabase
      .from("companies")
      .select("name, logo_url, membership, package_end_date")
      .eq("id", agentData.company_id)
      .single();
    if (companyData) setCompany(companyData);

    const [propRes, projRes, eventRes, followerRes] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agentData.id),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("agent_id", agentData.id),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("agent_id", agentData.id),
      supabase.from("company_followers").select("id", { count: "exact", head: true }).eq("company_id", agentData.company_id),
    ]);

    setCounts({
      properties: propRes.count || 0,
      projects: projRes.count || 0,
      events: eventRes.count || 0,
      followers: followerRes.count || 0,
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const membershipConfig: Record<string, { color: string; bg: string }> = {
    pro: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    plus: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    lite: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
    basic: { color: "text-muted-foreground", bg: "bg-muted border-border" },
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>
      </AgentLayout>
    );
  }

  const mem = membershipConfig[company?.membership || "basic"] || membershipConfig.basic;
  const isBoosted = agent?.profile_classification === "boosted" && agent?.boost_end_date && new Date(agent.boost_end_date) > new Date();
  const boostDaysLeft = agent?.boost_end_date ? differenceInDays(new Date(agent.boost_end_date), new Date()) : null;

  return (
    <AgentLayout>
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          {agent?.avatar_url ? (
            <img src={agent.avatar_url} alt={agent.name} className="h-12 w-12 rounded-xl object-cover border border-border shadow-sm" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {agent?.name?.charAt(0) || "A"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {agent?.name}</h1>
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
              {isBoosted ? "Profile Boosted" : "Profile Not Boosted"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBoosted
                ? `Boosted until ${format(new Date(agent!.boost_end_date!), "do MMM yyyy")} (${boostDaysLeft} days left)`
                : "Boost your profile to appear at the top of search results"}
            </p>
          </div>
        </div>
        <Button size="sm" variant={isBoosted ? "outline" : "default"} onClick={() => setBoostOpen(true)}>
          <Rocket className="h-4 w-4 mr-1" /> {isBoosted ? "Extend Boost" : "Boost Profile"}
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
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Plan</h3>
                <MembershipIcon className="h-5 w-5 text-primary" />
              </div>
              <p className={`text-xl font-bold ${mem.color} capitalize`}>{company?.membership}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {company?.package_end_date
                  ? `Expires ${format(new Date(company.package_end_date), "do MMM yyyy")}${daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft} days left)` : daysLeft !== null ? " (Expired)" : ""}`
                  : "No expiry set"}
              </p>
            </div>
          );
        })()}

        {/* Credit Balance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Credits</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{agent?.credit_balance || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">Available balance</p>
        </div>

        {/* Followers */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Followers</h3>
            <Users2 className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.followers}</p>
          <p className="text-xs text-muted-foreground mt-2">Total followers</p>
        </div>

        {/* Assigned Total */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned to You</h3>
            <Building2 className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{counts.properties + counts.projects + counts.events}</p>
          <p className="text-xs text-muted-foreground mt-2">Total listings</p>
        </div>
      </div>

      {/* Listings Summary */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Your Assigned Listings</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: "/agent/properties", icon: Building2, count: counts.properties, label: "Properties", color: "text-amber-500", bg: "bg-amber-500/10" },
          { to: "/agent/projects", icon: FolderKanban, count: counts.projects, label: "Projects", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { to: "/agent/events", icon: Calendar, count: counts.events, label: "Events", color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((card) => (
          <Link key={card.to} to={card.to} className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
            <div className={`w-11 h-11 rounded-lg ${card.bg} flex items-center justify-center transition-colors`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{counts[card.label.toLowerCase() as keyof typeof counts]}</p>
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
          onBoosted={() => { setBoostOpen(false); fetchData(); }}
        />
      )}
    </AgentLayout>
  );
};

export default AgentDashboardPage;
