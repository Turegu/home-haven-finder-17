import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, MessageCircle, UserPlus, ChevronRight, Printer, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import PropertyCard from '@/components/PropertyCard';

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
        .select("id, name, company_type, logo_url, cover_url, languages, service_areas, about, email, phone, whatsapp")
        .eq("id", id)
        .maybeSingle();
      setCompany(data as CompanyData | null);

      if (data) {
        // Agents
        const { data: agts } = await supabase
          .from("agents").select("id, name, designation, avatar_url, languages")
          .eq("company_id", data.id).eq("status", "active");
        setCompanyAgents((agts ?? []) as AgentData[]);

        // Counts
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

  const tabs = [
    { key: 'properties', label: 'Our Properties' },
    { key: 'projects', label: 'Projects' },
    { key: 'events', label: 'Events' },
    { key: 'agents', label: 'Our Agents' },
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/agents" className="hover:text-primary">Companies</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-primary">{company.name}</span>
        </div>
      </div>

      {/* Title + actions */}
      <div className="container mx-auto px-4 flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{company.name}</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-secondary"><Printer className="h-4 w-4 text-muted-foreground" /></button>
          <button className="p-2 rounded-full hover:bg-secondary"><Share2 className="h-4 w-4 text-muted-foreground" /></button>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="h-32 overflow-hidden bg-muted">
                {company.cover_url ? (
                  <img src={company.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
                )}
              </div>
              <div className="p-5 text-center relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-20 h-20 rounded-lg border-2 border-background object-cover shadow" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border-2 border-background bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shadow">
                      {company.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <h2 className="font-bold text-foreground text-lg">{company.name}</h2>
                  <p className="text-sm text-muted-foreground">{typeLabel(company.company_type)}</p>
                </div>
                <Button variant="outline" className="w-full mt-4 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Follow
                </Button>
                <div className="flex items-center justify-center gap-0 mt-4 border-t border-border pt-4">
                  <button className="flex-1 flex items-center justify-center gap-1 text-primary hover:bg-secondary py-2 rounded-lg text-sm">
                    <Phone className="h-4 w-4" /> Call
                  </button>
                  <div className="w-px h-6 bg-border" />
                  <button className="flex-1 flex items-center justify-center gap-1 text-primary hover:bg-secondary py-2 rounded-lg text-sm">
                    <Mail className="h-4 w-4" /> Email
                  </button>
                  <div className="w-px h-6 bg-border" />
                  <button className="flex-1 flex items-center justify-center gap-1 text-primary hover:bg-secondary py-2 rounded-lg text-sm">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {/* Info table */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 text-muted-foreground w-40">Employees:</td>
                    <td className="py-3 text-foreground"><span className="text-primary font-semibold">{counts.agents}</span> Agents</td>
                  </tr>
                  {company.languages && company.languages.length > 0 && (
                    <tr className="border-b border-border">
                      <td className="py-3 text-muted-foreground">We Speak:</td>
                      <td className="py-3 text-foreground">{company.languages.join(', ')}</td>
                    </tr>
                  )}
                  <tr className="border-b border-border">
                    <td className="py-3 text-muted-foreground">Properties:</td>
                    <td className="py-3 text-foreground">
                      <span className="text-primary">({counts.buy})</span> For Buy
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({counts.rent})</span> For Rent
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({counts.projects})</span> Projects
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({counts.events})</span> Events
                    </td>
                  </tr>
                  {company.service_areas && company.service_areas.length > 0 && (
                    <tr>
                      <td className="py-3 text-muted-foreground">Service Areas:</td>
                      <td className="py-3 text-foreground">{company.service_areas.join(' - ')}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {company.about && (
                <>
                  <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">About {company.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{company.about}</p>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {agent.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-foreground">{agent.name}</h4>
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
