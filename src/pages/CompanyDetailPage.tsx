import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, MessageCircle, UserPlus, ChevronRight, Printer, Share2, MapPin, Globe, Users, Building2, Calendar, Home } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import CompanyOfficeMap from '@/components/company/CompanyOfficeMap';

interface CompanyData {
  id: string;
  name: string;
  company_type: string | null;
  logo_url: string | null;
  cover_url: string | null;
  languages: string[] | null;
  service_areas: string[] | null;
  about: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  pin_location: string | null;
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
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [companyAgents, setCompanyAgents] = useState<AgentData[]>([]);
  const [activeTab, setActiveTab] = useState('properties');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ agents: 0, buy: 0, rent: 0, projects: 0, events: 0 });

  useEffect(() => {
    if (!id) return;
    const fetchCompany = async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, company_type, logo_url, cover_url, languages, service_areas, about, email, phone, whatsapp, pin_location")
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

  const typeLabel = (t: string | null) => {
    if (!t) return 'Real Estate Company';
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
    { key: 'properties', label: 'Properties', icon: Home },
    { key: 'projects', label: 'Projects', icon: Building2 },
    { key: 'events', label: 'Events', icon: Calendar },
    { key: 'agents', label: 'Our Team', icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20 text-muted-foreground">Loading...</div>
        <Footer />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="text-center py-20 text-muted-foreground">Company not found.</div>
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
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/agents" className="hover:text-primary transition-colors">Companies</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{company.name}</span>
        </div>
      </div>

      {/* ── Hero: Contained cover with map overlay ── */}
      <div className="container mx-auto px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden h-[240px] sm:h-[280px] lg:h-[320px] bg-muted">
          {/* Cover image */}
          {company.cover_url ? (
            <img src={company.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted to-accent/10" />
          )}
          {/* Scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

          {/* Map overlay — right side */}
          <div
            className="absolute top-3 right-3 bottom-3 w-[200px] sm:w-[240px] lg:w-[280px] rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-pointer group"
            onClick={handleMapClick}
            title="Click to open in Google Maps"
          >
            <CompanyOfficeMap pinLocation={company.pin_location} companyName={company.name} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-foreground shadow flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-primary" /> Open in Maps
              </span>
            </div>
          </div>

          {/* Utility buttons — top left */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-colors">
              <Printer className="h-4 w-4 text-white/80" />
            </button>
            <button className="p-2 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-colors">
              <Share2 className="h-4 w-4 text-white/80" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Identity Card (glassmorphism, overlapping hero) ── */}
      <div className="container mx-auto px-4 -mt-16 relative z-10 mb-6">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-5 sm:p-6 mx-4 sm:mx-8">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Logo */}
            <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-card border border-border shadow-md overflow-hidden">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{company.name}</h1>
                  <p className="text-sm text-muted-foreground">{typeLabel(company.company_type)}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2 shrink-0 self-start">
                  <UserPlus className="h-3.5 w-3.5" />
                  Follow
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 sm:gap-5 mt-3 flex-wrap">
                {[
                  { icon: Users, label: 'Team', value: counts.agents },
                  { icon: Home, label: 'Sale', value: counts.buy },
                  { icon: Home, label: 'Rent', value: counts.rent },
                  { icon: Building2, label: 'Projects', value: counts.projects },
                  { icon: Calendar, label: 'Events', value: counts.events },
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
                    <Phone className="h-3 w-3" /> Call
                  </a>
                )}
                <a href={`mailto:${company.email}`} className="inline-flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                  <Mail className="h-3 w-3" /> Email
                </a>
                {company.whatsapp && (
                  <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors">
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body content ── */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-5">
            {/* About */}
            {company.about && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">About Us</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{company.about}</p>
              </div>
            )}

            {/* Languages we speak */}
            {allLanguages.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  <Globe className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
                  Languages We Speak
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {allLanguages.map((lang) => (
                    <span key={lang} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service areas */}
            {company.service_areas && company.service_areas.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  <MapPin className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
                  Service Areas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {company.service_areas.map((area) => (
                    <span key={area} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                      {area}
                    </span>
                  ))}
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
                {companyAgents.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No agents found.</div>}
              </div>
            )}
            {activeTab === 'properties' && <div className="text-center py-12 text-muted-foreground text-sm">No properties found for this company.</div>}
            {activeTab === 'projects' && <div className="text-center py-12 text-muted-foreground text-sm">No projects found for this company.</div>}
            {activeTab === 'events' && <div className="text-center py-12 text-muted-foreground text-sm">No events found for this company.</div>}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CompanyDetailPage;
