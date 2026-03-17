import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building2, FolderKanban, Calendar, Users, CreditCard, Phone } from "lucide-react";
import { format } from "date-fns";

interface CompanyData {
  id: string;
  name: string;
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
        .select("id, name, membership, package_end_date, credit_balance")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!companyData) return;
      setCompany(companyData);

      // Fetch counts in parallel
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
      <CompanyLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* Membership Card */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Membership</h3>
          <Badge className={`${membershipColor(company?.membership || "basic")} text-lg px-3 py-1`} variant="secondary">
            {company?.membership?.toUpperCase()}
          </Badge>
          <p className="text-sm text-muted-foreground mt-3">
            {company?.package_end_date
              ? `Valid Till ${format(new Date(company.package_end_date), "do MMM yyyy")}`
              : "No expiry set"}
          </p>
        </div>

        {/* Credit Balance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Available Credit Balance</h3>
          <div className="flex items-baseline gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{company?.credit_balance || 0}</span>
            <span className="text-sm text-muted-foreground">credits</span>
          </div>
          <Button variant="outline" size="sm" className="mt-3 text-xs">
            <Phone className="h-3 w-3 mr-1" /> Contact Sales
          </Button>
        </div>

        {/* Premium Listings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Premium Listings</h3>
          <div className="text-2xl font-bold text-foreground mb-2">0%</div>
          <Progress value={0} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">Use credits to promote listings</p>
        </div>

        {/* Featured Listings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Featured Listings</h3>
          <div className="text-2xl font-bold text-foreground mb-2">0%</div>
          <Progress value={0} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">Featured on search results</p>
        </div>
      </div>

      {/* Listings Summary */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Your Listings</h2>
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
    </CompanyLayout>
  );
};

export default CompanyDashboardPage;
