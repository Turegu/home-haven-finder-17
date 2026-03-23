import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, User, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SpotlightCompany {
  id: string;
  name: string;
  logo_url: string | null;
  company_type: string | null;
  profile_classification: string;
  boost_end_date: string | null;
}

interface SpotlightAgent {
  id: string;
  name: string;
  avatar_url: string | null;
  designation: string | null;
  profile_classification: string;
  boost_end_date: string | null;
  companies: { name: string; logo_url: string | null } | null;
}

const sampleCompanies: SpotlightCompany[] = [
  { id: "sample-c1", name: "Prime Realty Group", logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=120&fit=crop", company_type: "real_estate_agency", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c2", name: "Gulf Estates International", logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop", company_type: "developer", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c3", name: "Bosphorus Properties", logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=120&fit=crop", company_type: "real_estate_agency", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c4", name: "Anatolia Homes", logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop", company_type: "developer", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c5", name: "Prestige Living Co.", logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=120&fit=crop", company_type: "real_estate_agency", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c6", name: "Golden Gate Realty", logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop", company_type: "real_estate_agency", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
];

const sampleAgents: SpotlightAgent[] = [
  { id: "sample-a1", name: "Ayşe Kaya", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop", designation: "Senior Agent", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Prime Realty", logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&h=80&fit=crop" } },
  { id: "sample-a2", name: "Omar Hassan", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop", designation: "Property Consultant", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Gulf Estates", logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop" } },
  { id: "sample-a3", name: "Fatma Demir", avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop", designation: "Sales Manager", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Bosphorus Properties", logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&h=80&fit=crop" } },
  { id: "sample-a4", name: "Ali Yılmaz", avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop", designation: "Luxury Specialist", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Anatolia Homes", logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop" } },
  { id: "sample-a5", name: "Sara Al-Rashid", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop", designation: "Investment Advisor", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Prestige Living", logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&h=80&fit=crop" } },
  { id: "sample-a6", name: "Mehmet Kara", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop", designation: "Senior Consultant", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Golden Gate Realty", logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=80&h=80&fit=crop" } },
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const TopAgentsSpotlight = () => {
  const { data: dbAgents } = useQuery({
    queryKey: ["spotlight-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name, avatar_url, designation, profile_classification, boost_end_date, companies(name, logo_url)")
        .eq("status", "active")
        .eq("profile_classification", "boosted")
        .limit(50);
      return ((data || []) as unknown as SpotlightAgent[]).filter(
        a => a.boost_end_date && new Date(a.boost_end_date) > new Date()
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const agents = useMemo(() => {
    const pool = dbAgents && dbAgents.length > 0 ? dbAgents : sampleAgents;
    return pickRandom(pool, 6);
  }, [dbAgents]);

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Top Agents</h2>
          <p className="text-sm text-muted-foreground mt-1">Trusted real estate professionals</p>
        </div>
        <Link to="/agents" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
        {agents.map((a) => (
          <Link
            key={`a-${a.id}`}
            to={a.id.startsWith("sample") ? "/agents" : `/agent/${a.id}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-500">
              {/* Image area */}
              <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                {a.avatar_url ? (
                  <img
                    src={a.avatar_url}
                    alt={a.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                    <User className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
                {/* Gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />

                {/* Boosted badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Top
                </div>

                {/* Company logo - bottom right */}
                {a.companies?.logo_url && (
                  <div className="absolute bottom-2.5 right-2.5">
                    <img src={a.companies.logo_url} alt={a.companies.name || ""} className="h-6 w-auto max-w-[52px] object-contain rounded bg-white shadow-sm px-1 py-0.5" />
                  </div>
                )}

                {/* Name overlay at bottom */}
                <div className="absolute bottom-0 inset-x-0 p-3">
                  <h3 className="text-sm font-bold text-white line-clamp-1">{a.name}</h3>
                  <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">{a.companies?.name || "Agent"}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-3 py-2.5 text-center border-t border-border">
                <p className="text-[11px] font-medium text-primary truncate">{a.designation || "Real Estate Agent"}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export const TopCompaniesSpotlight = () => {
  const { data: dbCompanies } = useQuery({
    queryKey: ["spotlight-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, logo_url, company_type, profile_classification, boost_end_date")
        .eq("is_verified", true)
        .eq("profile_classification", "boosted")
        .limit(50);
      return ((data || []) as SpotlightCompany[]).filter(
        c => c.boost_end_date && new Date(c.boost_end_date) > new Date()
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const companies = useMemo(() => {
    const pool = dbCompanies && dbCompanies.length > 0 ? dbCompanies : sampleCompanies;
    return pickRandom(pool, 6);
  }, [dbCompanies]);

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Top Companies</h2>
          <p className="text-sm text-muted-foreground mt-1">Leading real estate companies</p>
        </div>
        <Link to="/agents" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
        {companies.map((c) => (
          <Link
            key={`c-${c.id}`}
            to={c.id.startsWith("sample") ? "/agents" : `/company/${c.id}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-500">
              {/* Logo area */}
              <div className="relative aspect-[4/3] bg-white dark:bg-card flex items-center justify-center p-4 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
                  backgroundSize: "20px 20px"
                }} />

                {c.logo_url ? (
                  <img
                    src={c.logo_url}
                    alt={c.name}
                    className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="relative flex flex-col items-center gap-2">
                    <Building2 className="h-10 w-10 text-primary/30" />
                    <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider">{c.name.slice(0, 2)}</span>
                  </div>
                )}

                {/* Boosted badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Top
                </div>
              </div>

              {/* Info footer */}
              <div className="px-3 py-3 border-t border-border text-center">
                <h3 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{c.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                  {c.company_type?.replace(/_/g, " ") || "Real Estate"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

const HomepageSpotlight = () => (
  <>
    <TopAgentsSpotlight />
    <TopCompaniesSpotlight />
  </>
);

export default HomepageSpotlight;
