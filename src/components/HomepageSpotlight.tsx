import { Link } from "react-router-dom";
import { ArrowRight, Building2, User, Rocket } from "lucide-react";
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
  { id: "sample-c2", name: "Gulf Estates", logo_url: null, company_type: "property_developer", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c3", name: "Bosphorus Properties", logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop", company_type: "real_estate_agency", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c4", name: "Anatolia Homes", logo_url: null, company_type: "property_developer", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c5", name: "Prestige Living", logo_url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=120&fit=crop", company_type: "real_estate_agency", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
  { id: "sample-c6", name: "Golden Gate Realty", logo_url: null, company_type: "real_estate_agency", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString() },
];

const sampleAgents: SpotlightAgent[] = [
  { id: "sample-a1", name: "Ayşe Kaya", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop", designation: "Senior Agent", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Prime Realty", logo_url: null } },
  { id: "sample-a2", name: "Omar Hassan", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop", designation: "Property Consultant", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Gulf Estates", logo_url: null } },
  { id: "sample-a3", name: "Fatma Demir", avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop", designation: "Sales Manager", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Bosphorus Properties", logo_url: null } },
  { id: "sample-a4", name: "Ali Yılmaz", avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop", designation: "Luxury Specialist", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Anatolia Homes", logo_url: null } },
  { id: "sample-a5", name: "Sara Al-Rashid", avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop", designation: "Investment Advisor", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Prestige Living", logo_url: null } },
  { id: "sample-a6", name: "Mehmet Kara", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop", designation: "Senior Consultant", profile_classification: "boosted", boost_end_date: new Date(Date.now() + 90 * 86400000).toISOString(), companies: { name: "Golden Gate Realty", logo_url: null } },
];

export const useSpotlightData = () => {
  const { data: companies = [] } = useQuery({
    queryKey: ["spotlight-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, logo_url, company_type, profile_classification, boost_end_date")
        .eq("is_verified", true)
        .eq("profile_classification", "boosted")
        .limit(6);
      return ((data || []) as SpotlightCompany[]).filter(
        c => c.boost_end_date && new Date(c.boost_end_date) > new Date()
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["spotlight-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name, avatar_url, designation, profile_classification, boost_end_date, companies(name, logo_url)")
        .eq("status", "active")
        .eq("profile_classification", "boosted")
        .limit(6);
      return ((data || []) as unknown as SpotlightAgent[]).filter(
        a => a.boost_end_date && new Date(a.boost_end_date) > new Date()
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    companies: companies.length > 0 ? companies : sampleCompanies,
    agents: agents.length > 0 ? agents : sampleAgents,
  };
};

export const TopAgentsSpotlight = () => {
  const { agents } = useSpotlightData();

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {agents.map((a) => (
          <Link
            key={`a-${a.id}`}
            to={a.id.startsWith("sample") ? "/agents" : `/agent/${a.id}`}
            className="group relative bg-card border border-primary/30 ring-1 ring-primary/10 rounded-xl p-4 flex flex-col items-center text-center hover:border-primary/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute top-2 right-2">
              <Rocket className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="h-16 w-16 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden mb-3">
              {a.avatar_url ? (
                <img src={a.avatar_url} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{a.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{a.designation || a.companies?.name || "Agent"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export const TopCompaniesSpotlight = () => {
  const { companies } = useSpotlightData();

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {companies.map((c) => (
          <Link
            key={`c-${c.id}`}
            to={c.id.startsWith("sample") ? "/agents" : `/company/${c.id}`}
            className="group relative bg-card border border-primary/30 ring-1 ring-primary/10 rounded-xl p-4 flex flex-col items-center text-center hover:border-primary/50 hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute top-2 right-2">
              <Rocket className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="h-16 w-16 rounded-xl bg-primary/5 border border-border flex items-center justify-center overflow-hidden mb-3">
              {c.logo_url ? (
                <img src={c.logo_url} alt={c.name} className="h-full w-full object-contain p-1" />
              ) : (
                <Building2 className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{c.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {c.company_type?.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()) || "Real Estate"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};

// Keep default export for backward compatibility
const HomepageSpotlight = () => (
  <>
    <TopAgentsSpotlight />
    <TopCompaniesSpotlight />
  </>
);

export default HomepageSpotlight;
