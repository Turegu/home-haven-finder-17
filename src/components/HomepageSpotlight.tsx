import { Link } from "react-router-dom";
import { ArrowRight, Building2, User, Crown, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SpotlightCompany {
  id: string;
  name: string;
  logo_url: string | null;
  company_type: string | null;
  profile_classification: string;
}

interface SpotlightAgent {
  id: string;
  name: string;
  avatar_url: string | null;
  designation: string | null;
  profile_classification: string;
  companies: { name: string; logo_url: string | null } | null;
}

const TierIcon = ({ tier }: { tier: string }) => {
  if (tier === "premium") return <Crown className="h-3.5 w-3.5 text-amber-500" />;
  if (tier === "featured") return <Star className="h-3.5 w-3.5 text-primary" />;
  return null;
};

const HomepageSpotlight = () => {
  const { data: companies = [] } = useQuery({
    queryKey: ["spotlight-companies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, logo_url, company_type, profile_classification")
        .eq("is_verified", true)
        .in("profile_classification", ["premium", "featured"])
        .order("profile_classification", { ascending: true })
        .limit(6);
      return (data || []) as SpotlightCompany[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["spotlight-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name, avatar_url, designation, profile_classification, companies(name, logo_url)")
        .eq("status", "active")
        .in("profile_classification", ["premium", "featured"])
        .order("profile_classification", { ascending: true })
        .limit(6);
      return (data || []) as unknown as SpotlightAgent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (companies.length === 0 && agents.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Top Companies & Agents</h2>
          <p className="text-sm text-muted-foreground mt-1">Trusted professionals in real estate</p>
        </div>
        <Link to="/agents" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {companies.map((c) => (
          <Link
            key={`c-${c.id}`}
            to={`/company/${c.id}`}
            className="group relative bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center hover:border-primary/40 hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute top-2 right-2">
              <TierIcon tier={c.profile_classification} />
            </div>
            <div className="h-16 w-16 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden mb-3">
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

        {agents.map((a) => (
          <Link
            key={`a-${a.id}`}
            to={`/agent/${a.id}`}
            className="group relative bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center hover:border-primary/40 hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute top-2 right-2">
              <TierIcon tier={a.profile_classification} />
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

export default HomepageSpotlight;
