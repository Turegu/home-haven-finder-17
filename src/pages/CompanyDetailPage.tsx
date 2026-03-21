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

  const totalListings = counts.buy + counts.rent + counts.projects + counts.events;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Editorial Hero Section */}
      <div className="relative">
        {/* Cover image — cinematic wide crop */}
        <div className="relative h-[220px] sm:h-[280px] lg:h-[340px] overflow-hidden bg-muted">
          {company.cover_url ? (
            <img
              src={company.cover_url}
              alt={`${company.name} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-primary/5" />
          )}
          {/* Dark scrim for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Breadcrumb overlay — top */}
          <div className="absolute top-0 left-0 right-0">
            <div className="container mx-auto px-4 pt-4">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <ChevronRight className="h-3 w-3" />
                <Link to="/agents" className="hover:text-white transition-colors">Companies</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white">{company.name}</span>
              </div>
            </div>
          </div>

          {/* Company identity — bottom-left of hero */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="container mx-auto px-4 pb-6 flex items-end gap-5">
              {/* Logo */}
              <div className="shrink-0 w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-xl border-2 border-white/20 bg-card shadow-xl overflow-hidden backdrop-blur-sm">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                    {company.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Name + type */}
              <div className="pb-0.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight drop-shadow-md font-serif">
                  {company.name}
                </h1>
                <p className="text-sm text-white/70 mt-0.5 tracking-wide uppercase font-light">
                  {typeLabel(company.company_type)}
                </p>
              </div>
              {/* Actions — far right */}
              <div className="ml-auto flex items-center gap-1.5 pb-1">
                <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
                  <Printer className="h-4 w-4 text-white/80" />
                </button>
                <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
                  <Share2 className="h-4 w-4 text-white/80" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats ribbon — editorial data strip */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex items-center divide-x divide-border overflow-x-auto">
              <div className="flex items-center gap-2 px-5 py-3 text-sm">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Team</span>
                <span className="font-semibold text-foreground">{counts.agents}</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 text-sm">
                <Home className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">For Sale</span>
                <span className="font-semibold text-foreground">{counts.buy}</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 text-sm">
                <Home className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">For Rent</span>
                <span className="font-semibold text-foreground">{counts.rent}</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 text-sm">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Projects</span>
                <span className="font-semibold text-foreground">{counts.projects}</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 text-sm">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Events</span>
                <span className="font-semibold text-foreground">{counts.events}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content — editorial two-column */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left sidebar — contact & map card */}
          <aside className="w-full lg:w-[300px] shrink-0 space-y-5">
            {/* Contact card */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Contact</h3>
                <div className="space-y-3">
                  {company.phone && (
                    <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {company.phone}
                    </a>
                  )}
                  <a href={`mailto:${company.email}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="truncate">{company.email}</span>
                  </a>
                  {company.whatsapp && (
                    <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <MessageCircle className="h-3.5 w-3.5 text-primary" />
                      </div>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div className="px-5 pb-5">
                <Button variant="outline" className="w-full gap-2 mt-1">
                  <UserPlus className="h-4 w-4" />
                  Follow Company
                </Button>
              </div>
            </div>

            {/* Office location card */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Office Location</h3>
              </div>
              <div
                className="h-[180px] cursor-pointer relative group"
                onClick={handleMapClick}
                title="Click to open in Google Maps"
              >
                <CompanyOfficeMap pinLocation={company.pin_location} companyName={company.name} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-foreground shadow-lg flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-primary" /> Open in Maps
                  </div>
                </div>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Details</h3>
                <div className="space-y-3">
                  {company.languages && company.languages.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Languages</p>
                        <p className="text-foreground">{company.languages.join(', ')}</p>
                      </div>
                    </div>
                  )}
                  {company.service_areas && company.service_areas.length > 0 && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Service Areas</p>
                        <p className="text-foreground">{company.service_areas.join(' · ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {/* About — editorial prose block */}
            {company.about && (
              <div className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">About</h2>
                <div className="bg-card rounded-xl border border-border p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{company.about}</p>
                </div>
              </div>
            )}

            {/* Tabs — editorial underline style */}
            <div className="border-b border-border mb-6">
              <div className="flex items-center gap-0 overflow-x-auto -mb-px">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
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
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md hover:border-primary/20 transition-all group"
                  >
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold ring-2 ring-border">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.designation}</p>
                      {agent.languages && (
                        <p className="text-xs text-muted-foreground mt-1">{agent.languages.slice(0, 3).join(', ')}</p>
                      )}
                    </div>
                  </Link>
                ))}
                {companyAgents.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No agents found.</div>
                )}
              </div>
            )}

            {activeTab === 'properties' && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No properties found for this company.
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No projects found for this company.
              </div>
            )}

            {activeTab === 'events' && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No events found for this company.
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CompanyDetailPage;
