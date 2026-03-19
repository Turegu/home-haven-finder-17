import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2, FolderKanban, Calendar, CreditCard, Users2,
  Star, ArrowRight
} from "lucide-react";
import { format } from "date-fns";

interface AgentData {
  id: string;
  name: string;
  avatar_url: string | null;
  company_id: string;
  credit_balance: number;
}

interface CompanyData {
  name: string;
  logo_url: string | null;
  membership: string;
  package_end_date: string | null;
}

const AgentDashboardPage = () => {
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [counts, setCounts] = useState({ properties: 0, projects: 0, events: 0, followers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: agentData } = await supabase
        .from("agents")
        .select("id, name, avatar_url, company_id, credit_balance")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!agentData) return;
      setAgent(agentData);

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
    fetchData();
  }, []);

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

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Membership */}
        <div className={`rounded-xl border p-5 ${mem.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Plan</h3>
            <Star className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className={`text-xl font-bold ${mem.color} capitalize`}>{company?.membership}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {company?.package_end_date
              ? `Valid till ${format(new Date(company.package_end_date), "do MMM yyyy")}`
              : "No expiry set"}
          </p>
        </div>

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
        <Link to="/agent/properties" className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{counts.properties}</p>
            <p className="text-sm text-muted-foreground">Properties</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>

        <Link to="/agent/projects" className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{counts.projects}</p>
            <p className="text-sm text-muted-foreground">Projects</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>

        <Link to="/agent/events" className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{counts.events}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboardPage;
