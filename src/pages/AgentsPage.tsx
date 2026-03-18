import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockCompanies, mockAgents } from '@/data/mockAgents';
import { supabase } from '@/integrations/supabase/client';

const AgentsPage = () => {
  const [activeTab, setActiveTab] = useState<'companies' | 'agents'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&h=300&fit=crop');

  useEffect(() => {
    const fetchCms = async () => {
      const { data } = await supabase.from("cms_pages").select("content").eq("page_slug", "agents").limit(1);
      if (data?.[0]) {
        const c = (data[0] as any).content;
        if (c?.hero?.image_url) setHeroImage(c.hero.image_url);
      }
    };
    fetchCms();
  }, []);

  const filteredCompanies = mockCompanies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAgents = mockAgents.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner - CMS controlled */}
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
          <div className="border border-border rounded-lg px-3 py-2 w-full md:w-40">
            <select className="bg-transparent text-sm outline-none w-full text-foreground">
              <option>Languages</option>
              <option>English</option>
              <option>Turkish</option>
              <option>Arabic</option>
            </select>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <Link key={company.id} to={`/company/${company.id}`}
                className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-28 overflow-hidden">
                  <img src={company.coverImage} alt={company.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 relative">
                  <div className="absolute -top-8 left-5">
                    <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-lg border-2 border-background object-cover shadow-sm" />
                  </div>
                  <div className="mt-6">
                    <h3 className="font-semibold text-foreground">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.type}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span><span className="text-primary font-semibold">{company.agents}</span> Agents</span>
                    <span><span className="text-primary font-semibold">{company.propertiesForBuy}</span> For Buy</span>
                    <span><span className="text-primary font-semibold">{company.propertiesForRent}</span> For Rent</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {company.serviceAreas.slice(0, 3).map((area) => (
                      <span key={area} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{area}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Link key={agent.id} to={`/agents/${agent.id}`}
                className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow text-center">
                <img src={agent.photo} alt={agent.name} className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-primary/20" />
                <h3 className="font-semibold text-foreground mt-3">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.designation}</p>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" /><span>{agent.companyName}</span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span><span className="text-primary font-semibold">{agent.propertiesForBuy}</span> Buy</span>
                  <span><span className="text-primary font-semibold">{agent.propertiesForRent}</span> Rent</span>
                  <span><span className="text-primary font-semibold">{agent.projects}</span> Projects</span>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {agent.languages.slice(0, 3).map((lang) => (
                    <span key={lang} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{lang}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Horizontal Banner */}
        <BannerDisplay pageName="agents" bannerType="horizontal" className="mt-8" />
      </div>

      <Footer />
    </div>
  );
};

export default AgentsPage;
