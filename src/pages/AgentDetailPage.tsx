import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, MessageCircle, UserPlus, ChevronRight, Printer, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AgentData {
  id: string;
  name: string;
  designation: string | null;
  avatar_url: string | null;
  description: string | null;
  languages: string[] | null;
  service_areas: string[] | null;
  company_id: string;
  companies: { id: string; name: string; logo_url: string | null; company_type: string | null } | null;
}

const AgentDetailPage = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('properties');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name, designation, avatar_url, description, languages, service_areas, company_id, companies(id, name, logo_url, company_type)")
        .eq("id", id)
        .maybeSingle();
      setAgent(data as unknown as AgentData | null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const tabs = [
    { key: 'properties', label: 'Properties' },
    { key: 'projects', label: 'Projects' },
    { key: 'events', label: 'Events' },
  ];

  if (loading) {
    return <div className="min-h-screen bg-background"><Header /><div className="text-center py-20 text-muted-foreground">Loading...</div><Footer /></div>;
  }

  if (!agent) {
    return <div className="min-h-screen bg-background"><Header /><div className="text-center py-20 text-muted-foreground">Agent not found.</div><Footer /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/agents" className="hover:text-primary">Agents</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-primary">{agent.name}</span>
        </div>
      </div>

      {/* Title + actions */}
      <div className="container mx-auto px-4 flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{agent.name}</h1>
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
            <div className="bg-card rounded-xl border border-border overflow-hidden p-6 text-center">
              {agent.avatar_url ? (
                <img src={agent.avatar_url} alt={agent.name} className="w-28 h-28 rounded-lg mx-auto object-cover border-4 border-primary/10" />
              ) : (
                <div className="w-28 h-28 rounded-lg mx-auto bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl border-4 border-primary/10">
                  {agent.name.charAt(0)}
                </div>
              )}
              <h2 className="font-bold text-foreground text-lg mt-4">{agent.name}</h2>
              <p className="text-sm text-muted-foreground">{agent.designation}</p>

              <Button variant="outline" className="w-full mt-4 gap-2">
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>

              <div className="flex items-center justify-center gap-0 mt-4 border-t border-border pt-4">
                <button className="flex-1 flex items-center justify-center gap-1 text-primary hover:bg-secondary py-2 rounded-lg text-sm">
                  <Phone className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1 text-primary hover:bg-secondary py-2 rounded-lg text-sm">
                  <Mail className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1 text-primary hover:bg-secondary py-2 rounded-lg text-sm">
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {/* Company + Info table */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              {/* Company reference */}
              {agent.companies && (
                <Link to={`/company/${agent.companies.id}`} className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                  {agent.companies.logo_url ? (
                    <img src={agent.companies.logo_url} alt={agent.companies.name} className="h-12 w-auto max-w-[80px] rounded-lg object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {agent.companies.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">{agent.companies.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {agent.companies.company_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Real Estate Company'}
                    </p>
                  </div>
                </Link>
              )}

              <table className="w-full text-sm">
                <tbody>
                  {agent.languages && agent.languages.length > 0 && (
                    <tr className="border-b border-border">
                      <td className="py-3 text-muted-foreground w-40">I Speak:</td>
                      <td className="py-3 text-foreground">{agent.languages.join(', ')}</td>
                    </tr>
                  )}
                  {agent.service_areas && agent.service_areas.length > 0 && (
                    <tr className="border-b border-border">
                      <td className="py-3 text-muted-foreground">Service Areas:</td>
                      <td className="py-3 text-foreground">{agent.service_areas.join(' - ')}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 text-muted-foreground">Designation:</td>
                    <td className="py-3 text-foreground">{agent.designation}</td>
                  </tr>
                </tbody>
              </table>

              {agent.description && (
                <>
                  <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">About {agent.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-center py-12 text-muted-foreground text-sm">
              No {activeTab} found.
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AgentDetailPage;
