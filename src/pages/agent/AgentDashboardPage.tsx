import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, FolderKanban, Calendar, CreditCard, Users2 } from "lucide-react";
import { format } from "date-fns";

interface AgentData {
  id: string;
  name: string;
  company_id: string;
  credit_balance: number;
}

interface CompanyData {
  name: string;
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
        .select("id, name, company_id, credit_balance")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!agentData) return;
      setAgent(agentData);

      // Fetch company info
      const { data: companyData } = await supabase
        .from("companies")
        .select("name, membership, package_end_date")
        .eq("id", agentData.company_id)
        .single();
      if (companyData) setCompany(companyData);

      // Fetch counts - agent's assigned listings + company followers
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

  const membershipColor = (m: string) => {
    switch (m) {
      case "pro": return "bg-emerald-100 text-emerald-800";
      case "plus": return "bg-orange-100 text-orange-800";
      case "lite": return "bg-purple-100 text-purple-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-2">Agent Dashboard</h1>
      {company && (
        <p className="text-sm text-muted-foreground mb-6">Company: <span className="font-medium text-foreground">{company.name}</span></p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* Company Membership */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Company Membership</h3>
          <Badge className={`${membershipColor(company?.membership || "basic")} text-lg px-3 py-1`} variant="secondary">
            {company?.membership?.toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground mt-3">
            {company?.package_end_date
              ? `Valid Till ${format(new Date(company.package_end_date), "do MMM yyyy")}`
              : "No expiry set"}
          </p>
        </div>

        {/* Agent Credit Balance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Credit Balance</h3>
          <div className="flex items-baseline gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{agent?.credit_balance || 0}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
        </div>

        {/* Followers */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Company Followers</h3>
          <div className="flex items-baseline gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{counts.followers}</span>
            <span className="text-sm text-muted-foreground">followers</span>
          </div>
        </div>

        {/* Assigned Listings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Assigned to You</h3>
          <div className="text-2xl font-bold text-foreground mb-2">
            {counts.properties + counts.projects + counts.events}
          </div>
          <p className="text-xs text-muted-foreground">Total listings assigned</p>
        </div>
      </div>

      {/* Listings Summary */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Your Assigned Listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.properties}</p>
            <p className="text-sm text-muted-foreground">Properties</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderKanban className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.projects}</p>
            <p className="text-sm text-muted-foreground">Projects</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.events}</p>
            <p className="text-sm text-muted-foreground">Events</p>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentDashboardPage;
