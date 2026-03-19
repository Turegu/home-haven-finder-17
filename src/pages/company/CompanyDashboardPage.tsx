import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2, FolderKanban, Calendar, CreditCard, Phone,
  TrendingUp, Star, ArrowRight
} from "lucide-react";
import { format } from "date-fns";

interface CompanyData {
  id: string;
  name: string;
  logo_url: string | null;
  membership: string;
  package_end_date: string | null;
  credit_balance: number;
}

interface ListingCounts {
  properties: number;
  projects: number;
  events: number;
}

const CompanyDashboardPage = () => {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [counts, setCounts] = useState<ListingCounts>({ properties: 0, projects: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from("companies")
        .select("id, name, logo_url, membership, package_end_date, credit_balance")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!companyData) return;
      setCompany(companyData);

      const [propRes, projRes, eventRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("company_id", companyData.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyData.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("company_id", companyData.id),
      ]);

      setCounts({
        properties: propRes.count || 0,
        projects: projRes.count || 0,
        events: eventRes.count || 0,
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
      <CompanyLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>
      </CompanyLayout>
    );
  }

  const mem = membershipConfig[company?.membership || "basic"] || membershipConfig.basic;

  return (
    <CompanyLayout>
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-12 w-auto max-w-[100px] rounded-xl object-contain border border-border shadow-sm" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {company?.name?.charAt(0) || "C"}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {company?.name}</h1>
            <p className="text-sm text-muted-foreground">Here's an overview of your account</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Membership */}
        <div className={`rounded-xl border p-5 ${mem.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membership</h3>
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
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit Balance</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{company?.credit_balance || 0}</p>
          <Button variant="link" size="sm" className="mt-1 p-0 h-auto text-xs text-primary">
            <Phone className="h-3 w-3 mr-1" /> Contact Sales
          </Button>
        </div>

        {/* Premium Listings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Premium Listings</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">0%</p>
          <Progress value={0} className="h-1.5" />
        </div>

        {/* Featured Listings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Featured Listings</h3>
            <Star className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-2">0%</p>
          <Progress value={0} className="h-1.5" />
        </div>
      </div>

      {/* Listings Summary */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Your Listings</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/company/properties" className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{counts.properties}</p>
            <p className="text-sm text-muted-foreground">Properties</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>

        <Link to="/company/projects" className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{counts.projects}</p>
            <p className="text-sm text-muted-foreground">Projects</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>

        <Link to="/company/events" className="group bg-card rounded-xl border border-border p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all">
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
    </CompanyLayout>
  );
};

export default CompanyDashboardPage;
