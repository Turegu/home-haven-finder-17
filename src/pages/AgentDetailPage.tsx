import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MessageCircle, ChevronRight, Printer, Share2, MapPin, Globe, Building2, Calendar, Home } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';
import { formatCompanyTypes } from '@/data/companyTypes';
import ExpandablePillList from '@/components/ExpandablePillList';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { supabase } from '@/integrations/supabase/client';
import ProfileListingFilters, { type ProfileFilters } from '@/components/ProfileListingFilters';
import ProfileProjectFilters, { type ProjectFilters } from '@/components/ProfileProjectFilters';
import PropertyCard from '@/components/PropertyCard';
import FeaturedProjectCard from '@/components/FeaturedProjectCard';
import FollowButton from '@/components/FollowButton';

interface AgentData {
  id: string;
  name: string;
  designation: string | null;
  avatar_url: string | null;
  description: string | null;
  languages: string[] | null;
  service_areas: string[] | null;
  phone: string | null;
  email: string;
  whatsapp: string | null;
  company_id: string;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
    company_types: string[] | null;
    cover_url: string | null;
    is_verified: boolean;
  } | null;
}

const AgentDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');
  const [counts, setCounts] = useState({ buy: 0, rent: 0, projects: 0, events: 0 });

  useEffect(() => {
    if (!id) return;
    const fetchAgent = async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name, designation, avatar_url, description, languages, service_areas, phone, email, whatsapp, company_id, companies(id, name, logo_url, company_types, cover_url, is_verified)")
        .eq("id", id)
        .maybeSingle();
      const agentData = data as unknown as AgentData | null;
      setAgent(agentData);

      if (agentData) {
        const { count: buyCount } = await supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agentData.id).eq("status", "active").eq("property_purpose", "buy");
        const { count: rentCount } = await supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agentData.id).eq("status", "active").eq("property_purpose", "rent");
        const { count: projCount } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("agent_id", agentData.id).eq("status", "active");
        const { count: evtCount } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("agent_id", agentData.id).eq("status", "active");
        setCounts({ buy: buyCount ?? 0, rent: rentCount ?? 0, projects: projCount ?? 0, events: evtCount ?? 0 });
      }
      setLoading(false);
    };
    fetchAgent();
  }, [id]);

  const tabs = [
    { key: 'properties', label: t('detail.properties'), icon: Home },
    { key: 'projects', label: t('detail.projects'), icon: Building2 },
    { key: 'events', label: t('detail.events'), icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20 text-muted-foreground">{t('common.loading')}</div>
        <Footer />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20 text-muted-foreground">{t('detail.agentNotFound')}</div>
        <Footer />
      </div>
    );
  }

  const companyCover = agent.companies?.cover_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">{t('common.home')}</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/agents" className="hover:text-primary transition-colors">{t('nav.agents')}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{agent.name}</span>
        </div>
      </div>

      {/* ── Banner: company cover inherited — compact height ── */}
      <div className="container mx-auto px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden bg-muted h-[120px] sm:h-[140px] lg:h-[160px]">
          {companyCover ? (
            <img src={companyCover} alt="" className="w-full h-full object-cover" />
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
            {/* Left: agent info */}
            <div className="flex-1 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="shrink-0 w-20 h-20 sm:w-32 sm:h-32 rounded-xl bg-background border border-border shadow-sm overflow-hidden">
                  {agent.avatar_url ? (
                    <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div>
                    <div className="flex items-center gap-12">
                      <div className="flex items-center gap-1.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{agent.name}</h1>
                      </div>
                      <FollowButton type="agent" targetId={agent.id} />
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.designation}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                     {[
                      { icon: Home, label: t('detail.sale'), value: counts.buy },
                      { icon: Home, label: t('detail.rent'), value: counts.rent },
                      { icon: Building2, label: t('detail.projects'), value: counts.projects },
                      { icon: Calendar, label: t('detail.events'), value: counts.events },
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
                    {agent.phone && (
                      <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                        <Phone className="h-3 w-3" /> {t('property.call')}
                      </a>
                    )}
                    <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                      <Mail className="h-3 w-3" /> {t('property.email')}
                    </a>
                    <a href={`https://wa.me/${agent.whatsapp || agent.phone || ''}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-[hsl(142,70%,40%)]/10 hover:bg-[hsl(142,70%,40%)]/20 text-[hsl(142,70%,40%)] px-3 py-1.5 rounded-full transition-colors">
                      <MessageCircle className="h-3 w-3" /> {t('property.whatsApp')}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Company badge */}
            {agent.companies && (
              <Link
                to={`/company/${agent.companies.id}`}
                className="lg:w-[280px] xl:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-border p-5 flex items-center gap-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="w-28 h-28 rounded-xl bg-background border border-border shadow-sm overflow-hidden shrink-0">
                  {agent.companies.logo_url ? (
                    <img src={agent.companies.logo_url} alt={agent.companies.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
                      {agent.companies.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                   <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t('detail.company')}</p>
                   <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate flex items-center gap-1.5">
                     {agent.companies.name}
                     {agent.companies.is_verified && <VerifiedBadge />}
                   </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatCompanyTypes(agent.companies.company_types)}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── About section — full-width prominent ── */}
      <div className="container mx-auto px-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">{t('detail.about')} {agent.name}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {agent.description || `${agent.name} is an experienced real estate professional dedicated to helping clients find their ideal properties. With deep market knowledge and a client-first approach, ${agent.name} provides personalized guidance for buying, selling, and renting across all service areas.`}
          </p>
        </div>
      </div>

      {/* ── Body content ── */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-5">
            {/* Languages */}
            {agent.languages && agent.languages.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                   <Globe className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />{t('detail.iSpeak')}
                </h3>
                <ExpandablePillList items={agent.languages} maxVisible={6} />
              </div>
            )}

            {/* Service areas */}
            {agent.service_areas && agent.service_areas.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                   <MapPin className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />{t('detail.serviceAreas')}
                </h3>
                <ExpandablePillList items={agent.service_areas} maxVisible={6} />
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
            {activeTab === 'properties' && <AgentPropertiesTab agentId={agent.id} />}
            {activeTab === 'projects' && <AgentProjectsTab agentId={agent.id} />}
            {activeTab === 'events' && <div className="text-center py-12 text-muted-foreground text-sm">{t('detail.noEventsForAgent')}</div>}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const AgentPropertiesTab = ({ agentId }: { agentId: string }) => {
  const [filters, setFilters] = useState<ProfileFilters>({ purpose: 'all', propertyType: 'all', rooms: 'all', minPrice: '', maxPrice: '' });
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('*, agents(name, avatar_url), companies(name, logo_url)')
      .eq('agent_id', agentId)
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
  }, [agentId, filters]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  return (
    <>
      <ProfileListingFilters onFiltersChange={setFilters} />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No properties match the selected filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {properties.map((p) => (
            <Link key={p.id} to={`/property/${p.id}`}>
              <PropertyCard
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
                  listingTier: 'standard',
                  listingType: p.property_purpose === 'rent' ? 'rent' : 'buy',
                  advertisingTags: p.advertising_tags ?? [],
                }}
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

const AgentProjectsTab = ({ agentId }: { agentId: string }) => {
  const [filters, setFilters] = useState<ProjectFilters>({ status: 'all', minPrice: '', maxPrice: '' });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('projects')
      .select('id, title, location, min_price, currency, images, developer, min_units, completion_date, project_status, companies(logo_url)')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .limit(50);

    if (filters.status !== 'all') query = query.eq('project_status', filters.status);
    if (filters.minPrice) query = query.gte('min_price', Number(filters.minPrice));
    if (filters.maxPrice) query = query.lte('min_price', Number(filters.maxPrice));

    const { data } = await query.order('created_at', { ascending: false });
    setProjects((data || []).map((p: any) => ({
      id: p.id, title: p.title, location: p.location || 'N/A',
      priceFrom: p.min_price ?? 0, currency: p.currency ?? 'USD',
      image: p.images?.[0] || '/placeholder.svg', developer: p.developer || '',
      developerLogo: p.companies?.logo_url || '', units: p.min_units ?? 0,
      completionDate: p.completion_date || 'TBA',
    })));
    setLoading(false);
  }, [agentId, filters]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <>
      <ProfileProjectFilters onFiltersChange={setFilters} />
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No projects match the selected filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project) => (
            <FeaturedProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
};

export default AgentDetailPage;
