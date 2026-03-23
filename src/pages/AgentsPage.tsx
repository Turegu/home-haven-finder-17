import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { turkishIncludes } from '@/lib/utils';
import { MapPin, Search, Home, Globe, Rocket, Building2 } from 'lucide-react';
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
  profile_classification?: string;
  boost_end_date?: string | null;
}

interface AgentRow {
  id: string;
  name: string;
  designation: string | null;
  avatar_url: string | null;
  company_id: string;
  languages: string[] | null;
  service_areas: string[] | null;
  profile_classification?: string;
  boost_end_date?: string | null;
  companies: { name: string; logo_url: string | null } | null;
}

const isBoosted = (cls?: string, endDate?: string | null) =>
  cls === "boosted" && endDate && new Date(endDate) > new Date();

const boostOrder = (cls?: string, endDate?: string | null) =>
  isBoosted(cls, endDate) ? 0 : 1;

const AgentsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'companies' | 'agents'>('agents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [provinces, setProvinces] = useState<{ name: string; ar: string }[]>([]);
  const [towns, setTowns] = useState<{ name: string; ar: string }[]>([]);
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&h=300&fit=crop');
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [companyCounts, setCompanyCounts] = useState<Record<string, { agents: number; buy: number; rent: number }>>({});
  const [agentCounts, setAgentCounts] = useState<Record<string, { buy: number; rent: number }>>({});

  useEffect(() => {
    supabase.rpc('get_distinct_provinces').then(({ data }) => {
      if (data) setProvinces(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedProvince) { setTowns([]); setSelectedTown(''); return; }
    supabase.rpc('get_distinct_districts', { p_province: selectedProvince }).then(({ data }) => {
      if (data) setTowns(data);
    });
    setSelectedTown('');
  }, [selectedProvince]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: cms } = await supabase.from("cms_pages").select("content").eq("page_slug", "agents").limit(1);
      if (cms?.[0]) {
        const c = (cms[0] as any).content;
        if (c?.hero?.image_url) setHeroImage(c.hero.image_url);
      }

      const { data: compData } = await supabase
        .from("companies")
        .select("id, name, company_type, logo_url, cover_url, languages, service_areas, province, town, neighbourhood, profile_classification, boost_end_date")
        .eq("is_verified", true);
      setCompanies((compData ?? []) as CompanyRow[]);

      const { data: agentData } = await supabase
        .from("agents")
        .select("id, name, designation, avatar_url, company_id, languages, service_areas, profile_classification, boost_end_date, companies(name, logo_url)")
        .eq("status", "active");
      setAgents((agentData ?? []) as unknown as AgentRow[]);

      if (agentData && agentData.length > 0) {
        const agentIds = agentData.map((a: any) => a.id);
        const aCounts: Record<string, { buy: number; rent: number }> = {};
        agentIds.forEach((id: string) => { aCounts[id] = { buy: 0, rent: 0 }; });
        const { data: agentProps } = await supabase
          .from("properties").select("agent_id, property_purpose").eq("status", "active").in("agent_id", agentIds);
        (agentProps ?? []).forEach((p: any) => {
          if (!aCounts[p.agent_id]) return;
          if (p.property_purpose === 'rent') aCounts[p.agent_id].rent++;
          else aCounts[p.agent_id].buy++;
        });
        setAgentCounts(aCounts);
      }

      if (compData && compData.length > 0) {
        const ids = compData.map(c => c.id);
        const counts: Record<string, { agents: number; buy: number; rent: number }> = {};
        ids.forEach(id => { counts[id] = { agents: 0, buy: 0, rent: 0 }; });
        const { data: agentCountsData } = await supabase
          .from("agents").select("company_id").eq("status", "active").in("company_id", ids);
        (agentCountsData ?? []).forEach((a: any) => { if (counts[a.company_id]) counts[a.company_id].agents++; });
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

  const filteredCompanies = companies.filter(c => {
    if (searchQuery && !turkishIncludes(c.name, searchQuery)) return false;
    if (selectedProvince && c.province !== selectedProvince) return false;
    if (selectedTown && c.town !== selectedTown) return false;
    return true;
  }).sort((a, b) => boostOrder(a.profile_classification, a.boost_end_date) - boostOrder(b.profile_classification, b.boost_end_date));

  const filteredAgents = agents.filter(a => {
    if (searchQuery && !turkishIncludes(a.name, searchQuery)) return false;
    if (selectedProvince && !a.service_areas?.some(area => turkishIncludes(area, selectedProvince))) return false;
    if (selectedTown && !a.service_areas?.some(area => turkishIncludes(area, selectedTown))) return false;
    return true;
  }).sort((a, b) => boostOrder(a.profile_classification, a.boost_end_date) - boostOrder(b.profile_classification, b.boost_end_date));

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
            {t('filters.companies')}
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'agents'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t('nav.agents')}
          </button>
        </div>

        <div className="bg-card rounded-xl shadow-md p-4 flex flex-col md:flex-row items-center gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 w-full md:w-48">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              className="bg-transparent text-sm outline-none w-full text-foreground"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              <option value="">{t('filters.province')}</option>
              {provinces.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 w-full md:w-48">
            <Home className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              className="bg-transparent text-sm outline-none w-full text-foreground"
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              disabled={!selectedProvince}
            >
              <option value="">{t('filters.cityTown')}</option>
              {towns.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <Input placeholder={t('filters.searchArea')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-border" />
          </div>
          <LanguageSearchDropdown
            selected={selectedLanguages}
            onChange={setSelectedLanguages}
            className="w-full md:w-48"
          />
          <Button className="w-full md:w-auto">
            <Search className="h-4 w-4 me-1" /> {t('hero.search')}
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {activeTab === 'companies' ? t('filters.companies') : t('nav.agents')}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('filters.sortBy')}:</span>
            <select className="border border-border rounded-lg px-3 py-1.5 bg-background text-foreground text-sm">
              <option>{t('filters.pleaseSelect')}</option>
              <option>{t('filters.nameAZ')}</option>
              <option>{t('filters.nameZA')}</option>
            </select>
          </div>
        </div>

        {activeTab === 'companies' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((company) => {
              const counts = companyCounts[company.id] || { agents: 0, buy: 0, rent: 0 };
              const headOffice = [company.neighbourhood, company.town, company.province].filter(Boolean).join(', ');
              const speaksLangs = company.languages?.join(', ');
              const boosted = isBoosted(company.profile_classification, company.boost_end_date);
              return (
                <Link key={company.id} to={`/company/${company.id}`}
                  className={`group flex bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 ${
                    boosted
                      ? 'border-primary/40 ring-1 ring-primary/20 shadow-md'
                      : 'border-border hover:border-primary/20'
                  }`}>

                  {/* Left: Logo area */}
                  <div className={`w-28 sm:w-36 shrink-0 border-r border-border flex items-center justify-center p-4 ${
                    boosted ? 'bg-primary/5' : 'bg-card'
                  }`}>
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                        {company.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Right: Info */}
                  <div className="flex-1 p-4 flex flex-col justify-center min-w-0 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors duration-300 truncate">
                        {company.name}
                      </h3>
                      {boosted && <Rocket className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-primary/80 font-medium mt-0.5">
                      {typeLabel(company.company_type)}
                    </p>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                      <Home className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="truncate">{headOffice || 'Head office location not set'}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span>
                        <span className="font-semibold text-primary">{counts.rent}</span>
                        <span className="text-muted-foreground ms-1">{t('filters.forRent')}</span>
                      </span>
                      <span className="text-border">·</span>
                      <span>
                        <span className="font-semibold text-primary">{counts.buy}</span>
                        <span className="text-muted-foreground ms-1">{t('filters.forSale')}</span>
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-sm">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{t('filters.speaks')}:</span>
                      <span className="text-foreground font-medium truncate">{speaksLangs || '—'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {filteredCompanies.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">{t('filters.noCompaniesFound')}</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent) => {
              const ac = agentCounts[agent.id] || { buy: 0, rent: 0 };
              const boosted = isBoosted(agent.profile_classification, agent.boost_end_date);
              return (
                <Link key={agent.id} to={`/agents/${agent.id}`}
                  className={`group flex bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 ${
                    boosted
                      ? 'border-primary/40 ring-1 ring-primary/20 shadow-md'
                      : 'border-border hover:border-primary/20'
                  }`}>

                  {/* Left: Avatar */}
                  <div className={`w-28 sm:w-32 shrink-0 border-r border-border overflow-hidden ${
                    boosted ? 'bg-primary/5' : 'bg-muted'
                  }`}>
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-3xl">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Right: Info */}
                  <div className="flex-1 p-4 flex flex-col min-w-0 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors duration-300 truncate">
                            {agent.name}
                          </h3>
                          {boosted && <Rocket className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{agent.designation}</p>
                      </div>
                      {agent.companies?.logo_url ? (
                        <img src={agent.companies.logo_url} alt={agent.companies.name ?? ''} className="w-12 h-12 rounded-lg object-contain border border-border bg-card p-0.5 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      <span>{t('filters.languages')}: </span>
                      <span className="text-foreground font-medium">{agent.languages?.join(', ') || '—'}</span>
                    </p>

                    <div className="flex items-center gap-4 mt-auto pt-3 border-t border-border/50 text-sm">
                      <span>
                        <span className="text-primary font-semibold">For Sale: {ac.buy}</span>
                      </span>
                      <span>
                        <span className="text-primary font-semibold">For Rent: {ac.rent}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
