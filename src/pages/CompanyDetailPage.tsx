import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MessageCircle, ChevronRight, Printer, Share2, MapPin, Globe, Users, Building2, Calendar, Home } from 'lucide-react';
import ContactProfileDialog from '@/components/ContactProfileDialog';
import VerifiedBadge from '@/components/VerifiedBadge';
import { formatCompanyTypes } from '@/data/companyTypes';
import ExpandablePillList from '@/components/ExpandablePillList';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { supabase } from '@/integrations/supabase/client';
import CompanyOfficeMap from '@/components/company/CompanyOfficeMap';
import ProfileListingFilters, { type ProfileFilters } from '@/components/ProfileListingFilters';
import ProfileProjectFilters, { type ProjectFilters } from '@/components/ProfileProjectFilters';
import PropertyListCard from '@/components/PropertyListCard';
import ProjectListCard from '@/components/ProjectListCard';
import EventListCard from '@/components/EventListCard';
import FollowButton from '@/components/FollowButton';
import type { EventResult } from '@/hooks/useEventSearch';

interface CompanyData {
  id: string;
  name: string;
  company_types: string[] | null;
  logo_url: string | null;
  cover_url: string | null;
  languages: string[] | null;
  service_areas: string[] | null;
  about: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  pin_location: string | null;
  is_verified: boolean;
}

interface AgentData {
  id: string;
  name: string;
  designation: string | null;
  avatar_url: string | null;
  languages: string[] | null;
}

const CompanyDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [companyAgents, setCompanyAgents] = useState<AgentData[]>([]);
  const [activeTab, setActiveTab] = useState('properties');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ agents: 0, buy: 0, rent: 0, projects: 0, events: 0 });
  const [profileEmailOpen, setProfileEmailOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCompany = async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, company_types, logo_url, cover_url, languages, service_areas, about, email, phone, whatsapp, pin_location, is_verified")
        .eq("id", id)
        .maybeSingle();
      setCompany(data as CompanyData | null);

      if (data) {
        const { data: agts } = await supabase
          .from("agents").select("id, name, designation, avatar_url, languages")
          .eq("company_id", data.id).eq("status", "active");
        setCompanyAgents((agts ?? []) as AgentData[]);

        const { count: buyCount } = await supabase.from("properties").select("id", { count: "exact", head: true }).eq("company_id", data.id).eq("status", "active").eq("property_purpose", "buy");
        const { count: rentCount } = await supabase.from("properties").select("id", { count: "exact", head: true }).eq("company_id", data.id).eq("status", "active").eq("property_purpose", "rent");
        const { count: projCount } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", data.id).eq("status", "active");
        const { count: evtCount } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("company_id", data.id).eq("status", "active");

        setCounts({
          agents: (agts ?? []).length,
          buy: buyCount ?? 0,
          rent: rentCount ?? 0,
          projects: projCount ?? 0,
          events: evtCount ?? 0,
        });
      }
      setLoading(false);
    };
    fetchCompany();
  }, [id]);

  const typeLabel = (types: string[] | null) => {
    return formatCompanyTypes(types);
  };

  const handleMapClick = () => {
    if (!company?.pin_location) return;
    const [lat, lng] = company.pin_location.split(",").map(s => s.trim());
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  // Combine company + agent languages (deduplicated)
  const allLanguages = (() => {
    const set = new Set<string>();
    company?.languages?.forEach(l => set.add(l));
    companyAgents.forEach(a => a.languages?.forEach(l => set.add(l)));
    return Array.from(set).sort();
  })();

  const tabs = [
    { key: 'properties', label: t('companyDetail.properties'), icon: Home },
    { key: 'projects', label: t('companyDetail.projects'), icon: Building2 },
    { key: 'events', label: t('companyDetail.events'), icon: Calendar },
    { key: 'agents', label: t('companyDetail.ourTeam'), icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20 text-muted-foreground">{t('companyDetail.loading')}</div>
        <Footer />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20 text-muted-foreground">{t('companyDetail.notFound')}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">{t('common.home')}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/agents" className="hover:text-primary transition-colors">{t('companyDetail.companies')}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{company.name}</span>
        </div>
      </div>

      {/* ── Banner: compact height, cover-fit ── */}
      <div className="container mx-auto px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden bg-muted h-[120px] sm:h-[140px] lg:h-[160px]">
          {company.cover_url ? (
            <img src={company.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted to-accent/10" />
          )}
          {/* Utility buttons */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <button className="p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors">
              <Printer className="h-4 w-4 text-white" />
            </button>
            <button className="p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating identity card ── */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left: company info */}
            <div className="flex-1 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="shrink-0 w-20 h-20 sm:w-32 sm:h-32 rounded-xl bg-background border border-border shadow-sm overflow-hidden">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                      {company.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-12">
                      <div className="flex items-center gap-1.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{company.name}</h1>
                        {company.is_verified && <VerifiedBadge />}
                      </div>
                      <FollowButton type="company" targetId={company.id} />
                    </div>
                    <p className="text-sm text-muted-foreground">{typeLabel(company.company_types)}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {[
                      { icon: Users, label: t('companyDetail.team'), value: counts.agents },
                      { icon: Home, label: t('companyDetail.sale'), value: counts.buy },
                      { icon: Home, label: t('companyDetail.rent'), value: counts.rent },
                      { icon: Building2, label: t('companyDetail.projects'), value: counts.projects },
                      { icon: Calendar, label: t('companyDetail.events'), value: counts.events },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 text-sm">
                        <s.icon className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-foreground">{s.value}</span>
                        <span className="text-muted-foreground text-xs">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Contact pills */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {company.phone && (
                      <a href={`tel:${company.phone}`} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                        <Phone className="h-3 w-3" /> {t('companyDetail.call')}
                      </a>
                    )}
                    <button onClick={() => setProfileEmailOpen(true)} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                      <Mail className="h-3 w-3" /> {t('companyDetail.email')}
                    </button>
                    <a href={`https://wa.me/${company.whatsapp || company.phone || ''}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-[hsl(142,70%,40%)]/10 hover:bg-[hsl(142,70%,40%)]/20 text-[hsl(142,70%,40%)] px-3 py-1.5 rounded-full transition-colors">
                      <MessageCircle className="h-3 w-3" /> {t('companyDetail.whatsApp')}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Map inside the card */}
            <div
              className="lg:w-[280px] xl:w-[320px] h-[180px] lg:h-auto shrink-0 cursor-pointer relative group border-t lg:border-t-0 lg:border-l border-border"
              onClick={handleMapClick}
              title="Click to open in Google Maps"
            >
              <CompanyOfficeMap pinLocation={company.pin_location} companyName={company.name} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-foreground shadow flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-primary" /> {t('companyDetail.openInMaps')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── About Us — full-width prominent section ── */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">{t('companyDetail.about', { name: company.name })}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-words overflow-hidden">
            {company.about || t('companyDetail.defaultAbout', { name: company.name })}
          </p>
        </div>
      </div>

      {/* ── Body content ── */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-5">
            {/* Languages we speak */}
            {allLanguages.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  <Globe className="h-3.5 w-3.5 inline-block me-1.5 -mt-0.5" />
                  {t('companyDetail.languagesWeSpeak')}
                </h3>
                <ExpandablePillList items={allLanguages} maxVisible={6} />
              </div>
            )}

            {/* Service areas */}
            {company.service_areas && company.service_areas.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  <MapPin className="h-3.5 w-3.5 inline-block me-1.5 -mt-0.5" />
                  {t('companyDetail.serviceAreas')}
                </h3>
                <ExpandablePillList items={company.service_areas} maxVisible={6} />
              </div>
            )}

            {/* Office Location Map */}
            {company.pin_location && (
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-5 pt-5 pb-3">
                  <Building2 className="h-3.5 w-3.5 inline-block me-1.5 -mt-0.5" />
                  {t('companyDetail.officeLocation')}
                </h3>
                <div
                  className="h-[200px] cursor-pointer relative group"
                  onClick={handleMapClick}
                  title="Click to open in Google Maps"
                >
                  <CompanyOfficeMap pinLocation={company.pin_location} companyName={company.name} />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-3">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-foreground shadow flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-primary" /> {t('companyDetail.openInGoogleMaps')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="border-b border-border mb-6">
              <div className="flex items-center gap-0 -mb-px overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.key
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyAgents.map((agent) => (
                  <Link key={agent.id} to={`/agents/${agent.id}`} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md hover:border-primary/20 transition-all group">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold ring-2 ring-border">{agent.name.charAt(0)}</div>
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.designation}</p>
                      {agent.languages && <p className="text-xs text-muted-foreground mt-1">{agent.languages.slice(0, 3).join(', ')}</p>}
                    </div>
                  </Link>
                ))}
                {companyAgents.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground text-sm">{t('companyDetail.noAgentsFound')}</div>}
              </div>
            )}
            {activeTab === 'properties' && <CompanyPropertiesTab companyId={company.id} />}
            {activeTab === 'projects' && <CompanyProjectsTab companyId={company.id} />}
            {activeTab === 'events' && <CompanyEventsTab companyId={company.id} />}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const CompanyPropertiesTab = ({ companyId }: { companyId: string }) => {
  const [filters, setFilters] = useState<ProfileFilters>({ purpose: 'all', propertyType: 'all', rooms: 'all', minPrice: '', maxPrice: '' });
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('*, agents(name, avatar_url, phone, whatsapp), companies(name, logo_url, phone, whatsapp)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .limit(50);

    if (filters.purpose !== 'all') query = query.eq('property_purpose', filters.purpose);
    if (filters.propertyType !== 'all') query = query.eq('property_type', filters.propertyType);
    if (filters.rooms !== 'all') query = query.eq('rooms', filters.rooms);
    if (filters.minPrice) query = query.gte('price', Number(filters.minPrice));
    if (filters.maxPrice) query = query.lte('price', Number(filters.maxPrice));

    const { data } = await query.order('created_at', { ascending: false });
    setProperties(data || []);
    setLoading(false);
  }, [companyId, filters]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  return (
    <>
      <ProfileListingFilters onFiltersChange={setFilters} />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No properties match the selected filters.</div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <PropertyListCard
              key={p.id}
              property={{
                id: p.id,
                title: p.title,
                price: p.price ?? 0,
                currency: p.currency ?? 'USD',
                location: p.location || [p.neighbourhood, p.town, p.province].filter(Boolean).join(', ') || 'N/A',
                city: p.town ?? '',
                type: p.property_type,
                area: p.area ?? 0,
                areaUnit: p.area_unit ?? 'm²',
                bedrooms: p.bedrooms ?? 0,
                bathrooms: p.bathrooms ?? 0,
                images: p.images?.length > 0 ? p.images : ['/placeholder.svg'],
                agentLogo: p.companies?.logo_url ?? '',
                agentName: p.agents?.name ?? '',
                agentAvatar: p.agents?.avatar_url ?? '',
                companyName: p.companies?.name ?? '',
                isFeatured: false,
                listingTier: (p.property_classification as 'premium' | 'featured' | 'standard') || 'standard',
                listingType: p.property_purpose === 'rent' ? 'rent' : 'buy',
                advertisingTags: p.advertising_tags ?? [],
                contactPhone: p.agents?.phone ?? p.companies?.phone ?? null,
                contactWhatsapp: p.agents?.whatsapp ?? p.companies?.whatsapp ?? null,
                companyId: p.company_id,
                agentId: p.agent_id,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

const CompanyProjectsTab = ({ companyId }: { companyId: string }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ProjectFilters>({ status: 'all', minPrice: '', maxPrice: '' });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('projects')
      .select('*, companies(name, logo_url, phone, whatsapp), agents(name, avatar_url, phone, whatsapp)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .limit(50);

    if (filters.status !== 'all') query = query.eq('project_status', filters.status);
    if (filters.minPrice) query = query.gte('min_price', Number(filters.minPrice));
    if (filters.maxPrice) query = query.lte('min_price', Number(filters.maxPrice));

    const { data } = await query.order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }, [companyId, filters]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <>
      <ProfileProjectFilters onFiltersChange={setFilters} />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No projects match the selected filters.</div>
      ) : (
        <div className="space-y-6">
          {projects.map((p) => (
            <ProjectListCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  );
};

const CompanyEventsTab = ({ companyId }: { companyId: string }) => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('events')
        .select('*, companies:company_id(name, logo_url), agents:agent_id(name, avatar_url)')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('event_date', { ascending: true })
        .limit(50);
      setEvents((data ?? []) as unknown as EventResult[]);
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  return (
    <>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">{t('companyDetail.noEventsFound')}</div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventListCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
};

export default CompanyDetailPage;
