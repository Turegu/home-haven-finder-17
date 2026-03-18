import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, MessageCircle, UserPlus, ChevronRight, Printer, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { mockAgents } from '@/data/mockAgents';
import { mockProperties } from '@/data/mockProperties';
import PropertyCard from '@/components/PropertyCard';

const AgentDetailPage = () => {
  const { id } = useParams();
  const agent = mockAgents.find(a => a.id === id) || mockAgents[0];
  const [activeTab, setActiveTab] = useState('properties');

  const tabs = [
    { key: 'properties', label: 'Properties' },
    { key: 'projects', label: 'Projects' },
    { key: 'events', label: 'Events' },
  ];

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

      {/* Cover Image */}
      <div className="container mx-auto px-4 mb-4">
        <div className="h-48 md:h-56 rounded-xl overflow-hidden bg-muted">
          {agent.coverImage ? (
            <img src={agent.coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
          )}
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
              <img
                src={agent.photo}
                alt={agent.name}
                className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-primary/10"
              />
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
              <Link to={`/company/${agent.companyId}`} className="flex items-center gap-3 mb-5 pb-5 border-b border-border">
                <img src={agent.companyLogo} alt={agent.companyName} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <h3 className="font-semibold text-foreground">{agent.companyName}</h3>
                  <p className="text-sm text-muted-foreground">Real Estate Company</p>
                </div>
              </Link>

              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-3 text-muted-foreground w-40">I Speak:</td>
                    <td className="py-3 text-foreground">{agent.languages.join(', ')}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-muted-foreground">Properties:</td>
                    <td className="py-3 text-foreground">
                      <span className="text-primary">({agent.propertiesForBuy})</span> For Buy
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({agent.propertiesForRent})</span> For Rent
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({agent.projects})</span> Projects
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({agent.events})</span> Events
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-muted-foreground">Service Areas:</td>
                    <td className="py-3 text-foreground">{agent.serviceAreas.join(' - ')}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Designation:</td>
                    <td className="py-3 text-foreground">{agent.designation}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">About {agent.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{agent.about}</p>
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

            {/* Tab content */}
            {activeTab === 'properties' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {agent.propertiesForBuy > 0 ? '1' : '0'} - {agent.propertiesForBuy} of {agent.propertiesForBuy} Properties
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <select className="border border-border rounded-lg px-2 py-1 bg-background text-foreground text-xs">
                      <option>Select Type</option>
                      <option>For Buy</option>
                      <option>For Rent</option>
                    </select>
                    <select className="border border-border rounded-lg px-2 py-1 bg-background text-foreground text-xs">
                      <option>SortBy</option>
                      <option>Price Low to High</option>
                      <option>Price High to Low</option>
                    </select>
                  </div>
                </div>
                {agent.propertiesForBuy > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockProperties.slice(0, agent.propertiesForBuy).map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No Results Found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No projects found.
              </div>
            )}

            {activeTab === 'events' && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No events found.
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AgentDetailPage;
