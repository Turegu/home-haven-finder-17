import { useState, useEffect, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { turkishIncludes } from '@/lib/utils';
import { formatCompanyTypes } from '@/data/companyTypes';
import { MapPin, Search, Home, Globe, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LanguageSearchDropdown from '@/components/LanguageSearchDropdown';
import { supabase } from '@/integrations/supabase/client';

const ROWS_PER_PAGE = 12; // 4 rows x 3 cols
const COLS = 3;
const BANNER_EVERY_ROWS = 4; // insert banner every 4 rows

function PaginatedCardGrid<T extends { id: string }>({
  items,
  renderCard,
  emptyMessage,
  bannerPageName,
}: {
  items: T[];
  renderCard: (item: T) => ReactNode;
  emptyMessage: string;
  bannerPageName: string;
}) {
  const [page, setPage] = useState(1);

  // Reset page when items change
  useEffect(() => { setPage(1); }, [items.length]);

  const totalPages = Math.ceil(items.length / ROWS_PER_PAGE);
  const pageItems = items.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  if (items.length === 0) {
    return <div className="col-span-full text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>;
  }

  // Split into rows of COLS, insert banner after every BANNER_EVERY_ROWS rows
  const rows: T[][] = [];
  for (let i = 0; i < pageItems.length; i += COLS) {
    rows.push(pageItems.slice(i, i + COLS));
  }

  let bannerPosition = 0;
  // If 4 or fewer rows, show banner after 2nd row; otherwise every 4 rows
  const bannerInterval = rows.length <= 4 ? 2 : BANNER_EVERY_ROWS;

  return (
    <>
      <div className="space-y-5">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {row.map((item) => renderCard(item))}
            </div>
            {(rowIdx + 1) % bannerInterval === 0 && rowIdx < rows.length - 1 && (
              <div className="my-5">
                <BannerDisplay pageName={bannerPageName} bannerType="horizontal" position={++bannerPosition} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page === 1}
            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={page === totalPages}
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}

interface CompanyRow {
  id: string;
  name: string;
  company_types: string[] | null;
  logo_url: string | null;
  cover_url: string | null;
  languages: string[] | null;
  service_areas: string[] | null;
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
  profile_classification?: string;
  boost_end_date?: string | null;
  is_verified?: boolean;
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
  companies: { name: string; logo_url: string | null; is_verified?: boolean } | null;
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
      // Fire all primary queries in parallel
      const [cmsRes, compRes, agentRes] = await Promise.all([
        supabase.from("cms_pages").select("content").eq("page_slug", "agents").limit(1),
        supabase.from("companies").select("id, name, company_types, logo_url, cover_url, languages, service_areas, province, town, neighbourhood, profile_classification, boost_end_date, is_verified"),
        supabase.from("agents").select("id, name, designation, avatar_url, company_id, languages, service_areas, profile_classification, boost_end_date, companies(name, logo_url, is_verified)").eq("status", "active"),
      ]);

      if (cmsRes.data?.[0]) {
        const c = (cmsRes.data[0] as any).content;
        if (c?.hero?.image_url) setHeroImage(c.hero.image_url);
      }

      const compData = compRes.data ?? [];
      const agentData = agentRes.data ?? [];
      setCompanies(compData as CompanyRow[]);
      setAgents(agentData as unknown as AgentRow[]);

      // Fire count queries in parallel
      const agentIds = agentData.map((a: any) => a.id);
      const compIds = compData.map(c => c.id);

      const [agentPropsRes, compAgentsRes, compPropsRes] = await Promise.all([
        agentIds.length > 0
          ? supabase.from("properties").select("agent_id, property_purpose").eq("status", "active").in("agent_id", agentIds)
          : Promise.resolve({ data: [] }),
        compIds.length > 0
          ? supabase.from("agents").select("company_id").eq("status", "active").in("company_id", compIds)
          : Promise.resolve({ data: [] }),
        compIds.length > 0
          ? supabase.from("properties").select("company_id, property_purpose").eq("status", "active").in("company_id", compIds)
          : Promise.resolve({ data: [] }),
      ]);
      if (agentIds.length > 0) {
        const aCounts: Record<string, { buy: number; rent: number }> = {};
        agentIds.forEach((id: string) => { aCounts[id] = { buy: 0, rent: 0 }; });
        ((agentPropsRes as any)?.data ?? []).forEach((p: any) => {
          if (!aCounts[p.agent_id]) return;
          if (p.property_purpose === 'rent') aCounts[p.agent_id].rent++;
          else aCounts[p.agent_id].buy++;
        });
        setAgentCounts(aCounts);
      }

      if (compIds.length > 0) {
        const counts: Record<string, { agents: number; buy: number; rent: number }> = {};
        compIds.forEach(id => { counts[id] = { agents: 0, buy: 0, rent: 0 }; });
        ((compAgentsRes as any)?.data ?? []).forEach((a: any) => { if (counts[a.company_id]) counts[a.company_id].agents++; });
        ((compPropsRes as any)?.data ?? []).forEach((p: any) => {
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

  const typeLabel = (types: string[] | null) => {
    return formatCompanyTypes(types);
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
          <PaginatedCardGrid
            items={filteredCompanies}
            renderCard={(company) => {
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
                  <div className={`w-28 sm:w-36 shrink-0 border-r border-border flex items-center justify-center p-4 bg-white dark:bg-card`}>
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform duration-500" />
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
                      {company.is_verified && <VerifiedBadge size="sm" />}
                      {boosted && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                          {t('filters.topCompany')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-primary/80 font-medium mt-0.5">
                      {typeLabel(company.company_types)}
                    </p>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                      <Home className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="truncate">{headOffice || t('filters.headOfficeNotSet')}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span>
                        <span className="font-semibold text-primary">{counts.agents}</span>
                        <span className="text-muted-foreground ms-1">{t('nav.agents')}</span>
                      </span>
                      <span className="text-border">·</span>
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
            }}
            emptyMessage={t('filters.noCompaniesFound')}
            bannerPageName="agents"
          />
        ) : (
          <PaginatedCardGrid
            items={filteredAgents}
            renderCard={(agent) => {
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
                  <div className={`w-28 sm:w-36 shrink-0 border-r border-border flex items-center justify-center p-3 ${
                    boosted ? 'bg-primary/5' : 'bg-muted'
                  }`}>
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="max-w-full max-h-24 object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
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
                          {agent.companies?.is_verified && <VerifiedBadge size="sm" />}
                          {boosted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                              {t('filters.topAgent')}
                            </span>
                          )}
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
                        <span className="text-primary font-semibold">{t('filters.forSale')}: {ac.buy}</span>
                      </span>
                      <span>
                        <span className="text-primary font-semibold">{t('filters.forRent')}: {ac.rent}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }}
            emptyMessage={t('filters.noAgentsFound')}
            bannerPageName="agents"
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AgentsPage;
