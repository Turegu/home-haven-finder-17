import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2, FolderKanban, Calendar, CreditCard, Phone,
  TrendingUp, Star, ArrowRight, Briefcase, Zap, Crown, AlertTriangle
} from "lucide-react";
import { format, differenceInDays, startOfMonth, startOfYear } from "date-fns";
import { useMembershipLimits } from "@/hooks/useMembershipLimits";
import { useSalesContact } from "@/hooks/useSalesContact";

const membershipIcons: Record<string, React.ElementType> = {
  basic: Briefcase,
  lite: Zap,
  plus: Star,
  pro: Crown,
};

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

interface CreditUsage {
  premium_properties: number;
  featured_properties: number;
  premium_projects: number;
  featured_projects: number;
}

const CompanyDashboardPage = () => {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [counts, setCounts] = useState<ListingCounts>({ properties: 0, projects: 0, events: 0 });
  const [creditUsage, setCreditUsage] = useState<CreditUsage>({ premium_properties: 0, featured_properties: 0, premium_projects: 0, featured_projects: 0 });
  const [creditTopups, setCreditTopups] = useState(0);
  const [loading, setLoading] = useState(true);
  const { usage, limits } = useMembershipLimits(company?.id || null);
  const { openSalesWhatsApp } = useSalesContact();

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

      const now = new Date();

      const [propRes, projRes, eventRes, premPropRes, featPropRes, premProjRes, featProjRes, txRes] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("company_id", companyData.id),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyData.id),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("company_id", companyData.id),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("company_id", companyData.id).eq("property_classification", "premium"),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("company_id", companyData.id).eq("property_classification", "featured"),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyData.id).eq("property_classification", "premium"),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyData.id).eq("property_classification", "featured"),
        supabase.from("credit_transactions").select("id, amount, transaction_type, description, listing_type, created_at").eq("company_id", companyData.id).order("created_at", { ascending: false }).limit(200),
      ]);

      setCounts({
        properties: propRes.count || 0,
        projects: projRes.count || 0,
        events: eventRes.count || 0,
      });
      setCreditUsage({
        premium_properties: premPropRes.count || 0,
        featured_properties: featPropRes.count || 0,
        premium_projects: premProjRes.count || 0,
        featured_projects: featProjRes.count || 0,
      });

      const transactions = (txRes.data || []) as CreditTransaction[];
      setRecentTransactions(transactions.slice(0, 10));

      let totalTopups = 0;
      let totalSpent = 0;
      let thisMonthSpent = 0;
      let thisYearSpent = 0;

      for (const tx of transactions) {
        if (tx.amount > 0) {
          totalTopups += tx.amount;
        } else {
          const spent = Math.abs(tx.amount);
          totalSpent += spent;
          if (tx.created_at >= monthStart) thisMonthSpent += spent;
          if (tx.created_at >= yearStart) thisYearSpent += spent;
        }
      }

      setCreditSummary({ totalTopups, totalSpent, thisMonthSpent, thisYearSpent });
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
  const daysLeft = company?.package_end_date
    ? differenceInDays(new Date(company.package_end_date), new Date())
    : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
  const totalPremium = creditUsage.premium_properties + creditUsage.premium_projects;
  const totalFeatured = creditUsage.featured_properties + creditUsage.featured_projects;
  const totalListings = counts.properties + counts.projects;
  const premiumPercent = totalListings > 0 ? Math.round((totalPremium / totalListings) * 100) : 0;
  const featuredPercent = totalListings > 0 ? Math.round((totalFeatured / totalListings) * 100) : 0;
  const creditBarPercent = creditSummary.totalTopups > 0 ? Math.round(((company?.credit_balance || 0) / creditSummary.totalTopups) * 100) : 0;

  return (
    <CompanyLayout>
      {/* Renewal Warning Banner */}
      {(isExpired || isExpiringSoon) && (
        <div className={`mb-6 rounded-xl border p-4 flex items-start gap-3 ${isExpired ? "bg-destructive/10 border-destructive/30" : "bg-amber-50 border-amber-200"}`}>
          <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${isExpired ? "text-destructive" : "text-amber-600"}`} />
          <div>
            <p className={`font-semibold text-sm ${isExpired ? "text-destructive" : "text-amber-800"}`}>
              {isExpired ? "Your package has expired!" : "Your package is expiring soon!"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isExpired
                ? "Your listings have been deactivated. All listings will be permanently deleted 3 months after expiry. Please renew your package to restore access."
                : `Your package expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew now to avoid listing deactivation. Listings are permanently deleted 3 months after expiry.`}
            </p>
            <Button variant="default" size="sm" className="mt-2" onClick={() => openSalesWhatsApp("Hi, I'd like to renew my membership package.")}>
              <Phone className="h-3 w-3 mr-1" /> Contact Sales to Renew
            </Button>
          </div>
        </div>
      )}

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
        {(() => {
          const MembershipIcon = membershipIcons[company?.membership || "basic"] || Briefcase;
          return (
            <div className={`rounded-xl border p-5 ${mem.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membership</h3>
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

        {/* Credit Balance with bar */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit Balance</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground">{company?.credit_balance || 0}</p>
          {creditSummary.totalTopups > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Remaining</span>
                <span>{company?.credit_balance || 0} / {creditSummary.totalTopups} total</span>
              </div>
              <Progress value={creditBarPercent} className="h-1.5" />
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" onClick={() => openSalesWhatsApp("Hi, I'd like to top up my credits.")}>
              <Phone className="h-3 w-3 mr-1" /> Contact Sales
            </Button>
            <span className="text-muted-foreground/30">·</span>
            <Link to="/company/credits" className="text-xs text-primary hover:underline font-medium">
              Details
            </Link>
          </div>
        </div>

        {/* Premium Listings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Premium Listings</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{totalPremium} <span className="text-sm font-normal text-muted-foreground">({premiumPercent}%)</span></p>
          <Progress value={premiumPercent} className="h-1.5 mb-2" />
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span>{creditUsage.premium_properties} properties</span>
            <span>{creditUsage.premium_projects} projects</span>
          </div>
        </div>

        {/* Featured Listings */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Featured Listings</h3>
            <Star className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{totalFeatured} <span className="text-sm font-normal text-muted-foreground">({featuredPercent}%)</span></p>
          <Progress value={featuredPercent} className="h-1.5 mb-2" />
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span>{creditUsage.featured_properties} properties</span>
            <span>{creditUsage.featured_projects} projects</span>
          </div>
        </div>
      </div>




      {/* Membership Usage Bars */}
      {limits && (
        <div className="bg-card rounded-xl border border-border p-5 mb-8">
          <h2 className="text-sm font-semibold text-foreground mb-4">Membership Usage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(["properties", "projects", "events", "agents"] as const).map((type) => {
              const maxKey = `max_${type}` as keyof typeof limits;
              const max = limits[maxKey];
              const used = usage[type];
              const pct = Math.min(100, max > 0 ? (used / max) * 100 : 0);
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground capitalize">{type}</span>
                    <span className="text-xs text-muted-foreground">{used} / {max}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Listings Summary */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Your Listings</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: "/company/properties", icon: Building2, count: counts.properties, label: "Properties", color: "text-amber-500", bg: "bg-amber-500/10" },
          { to: "/company/projects", icon: FolderKanban, count: counts.projects, label: "Projects", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { to: "/company/events", icon: Calendar, count: counts.events, label: "Events", color: "text-purple-500", bg: "bg-purple-500/10" },
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
    </CompanyLayout>
  );
};

export default CompanyDashboardPage;