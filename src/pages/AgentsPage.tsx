import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, User, Users, Home, Building2, Globe, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LanguageSearchDropdown from '@/components/LanguageSearchDropdown';
import { supabase } from '@/integrations/supabase/client';

interface CompanyRow {
  id: string;
  name: string;
  company_type: string | null;
  logo_url: string | null;
  cover_url: string | null;
  languages: string[] | null;
  service_areas: string[] | null;
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
}

interface AgentRow {
  id: string;
  name: string;
  designation: string | null;
  avatar_url: string | null;
  company_id: string;
  languages: string[] | null;
  service_areas: string[] | null;
  companies: { name: string; logo_url: string | null } | null;
}

const AgentsPage = () => {
  const [activeTab, setActiveTab] = useState<'companies' | 'agents'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&h=300&fit=crop');
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [companyCounts, setCompanyCounts] = useState<Record<string, { agents: number; buy: number; rent: number }>>({});

  useEffect(() => {
    const fetchData = async () => {
      // CMS
      const { data: cms } = await supabase.from("cms_pages").select("content").eq("page_slug", "agents").limit(1);
      if (cms?.[0]) {
        const c = (cms[0] as any).content;
        if (c?.hero?.image_url) setHeroImage(c.hero.image_url);
      }

      // Companies
      const { data: compData } = await supabase
        .from("companies")
        .select("id, name, company_type, logo_url, cover_url, languages, service_areas, province, town, neighbourhood")
        .eq("is_verified", true);
      setCompanies((compData ?? []) as CompanyRow[]);

      // Agents with company join
      const { data: agentData } = await supabase
        .from("agents")
        .select("id, name, designation, avatar_url, company_id, languages, service_areas, companies(name, logo_url)")
        .eq("status", "active");
      setAgents((agentData ?? []) as unknown as AgentRow[]);

      // Counts per company
      if (compData && compData.length > 0) {
        const ids = compData.map(c => c.id);
        const counts: Record<string, { agents: number; buy: number; rent: number }> = {};
        ids.forEach(id => { counts[id] = { agents: 0, buy: 0, rent: 0 }; });

        // Agent counts
        const { data: agentCounts } = await supabase
          .from("agents").select("company_id").eq("status", "active").in("company_id", ids);
        (agentCounts ?? []).forEach((a: any) => { if (counts[a.company_id]) counts[a.company_id].agents++; });

        // Property counts
        const { data: propCounts } = await supabase
          .from("properties").select("company_id, property_purpose").eq("status", "active").in("company_id", ids);
        (propCounts ?? []).forEach((p: any) => {
          if (!counts[p.company_id]) return;
          if (p.property_purpose === 'rent') counts[p.company_id].rent++;
          else counts[p.company_id].buy++;
        });

        setCompanyCounts(counts);
      }
    };
    fetchData();
  }, []);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeLabel = (t: string | null) => {
    if (!t) return 'Real Estate Company';
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        <img src={heroImage} alt="Agents banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/30" />
      </div>

      {/* Toggle & Search */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'companies'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Companies
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'agents'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Agents
          </button>
        </div>

        <div className="bg-card rounded-xl shadow-md p-4 flex flex-col md:flex-row items-center gap-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 w-full md:w-48">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <select className="bg-transparent text-sm outline-none w-full text-foreground">
              <option>Location</option>
              <option>Istanbul</option>
              <option>Antalya</option>
              <option>Bodrum</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <Input placeholder="Enter Search Area, City, Address" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-border" />
          </div>
          <LanguageSearchDropdown
            selected={selectedLanguages}
            onChange={setSelectedLanguages}
            className="w-full md:w-48"
          />
          <Button className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-1" /> Search
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {activeTab === 'companies' ? 'Companies' : 'Agents'}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort By:</span>
            <select className="border border-border rounded-lg px-3 py-1.5 bg-background text-foreground text-sm">
              <option>Please Select</option>
              <option>Name A-Z</option>
              <option>Name Z-A</option>
            </select>
          </div>
        </div>

        {activeTab === 'companies' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCompanies.map((company) => {
              const counts = companyCounts[company.id] || { agents: 0, buy: 0, rent: 0 };
              const headOffice = [company.neighbourhood, company.town, company.province].filter(Boolean).join(', ');
              const speaksLangs = company.languages?.join(', ');
              return (
                <Link key={company.id} to={`/company/${company.id}`}
                  className="group flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  
                  {/* Left: Logo area */}
                  <div className="w-36 sm:w-44 shrink-0 bg-muted/30 border-r border-border flex items-center justify-center p-5">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl font-serif">
                        {company.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Right: Info */}
                  <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
                    <h3 className="text-lg font-bold text-foreground leading-snug font-serif group-hover:text-primary transition-colors duration-300 truncate">
                      {company.name}
                    </h3>
                    <p className="text-sm text-primary/80 font-medium mt-0.5">
                      {typeLabel(company.company_type)}
                    </p>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                      <Home className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="truncate">{headOffice || 'Head office location not set'}</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span>
                        <span className="font-semibold text-primary">{counts.rent}</span>
                        <span className="text-muted-foreground ml-1">For Rent</span>
                      </span>
                      <span className="text-border">·</span>
                      <span>
                        <span className="font-semibold text-primary">{counts.buy}</span>
                        <span className="text-muted-foreground ml-1">For Sale</span>
                      </span>
                    </div>

                    {/* Speaks */}
                    {speaksLangs && (
                      <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                        <span className="uppercase tracking-wider">Speaks: </span>
                        <span className="text-foreground font-medium">{speaksLangs}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
            {filteredCompanies.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No companies found.</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Link key={agent.id} to={`/agents/${agent.id}`}
                className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow text-center">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.name} className="w-20 h-20 rounded-lg mx-auto object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-20 h-20 rounded-lg mx-auto bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20">
                    {agent.name.charAt(0)}
                  </div>
                )}
                <h3 className="font-semibold text-foreground mt-3">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.designation}</p>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" /><span>{agent.companies?.name ?? ''}</span>
                </div>
                {agent.languages && agent.languages.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {agent.languages.slice(0, 3).map((lang) => (
                      <span key={lang} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{lang}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
            {filteredAgents.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No agents found.</div>
            )}
          </div>
        )}

        <BannerDisplay pageName="agents" bannerType="horizontal" className="mt-8" />
      </div>

      <Footer />
    </div>
  );
};

export default AgentsPage;
