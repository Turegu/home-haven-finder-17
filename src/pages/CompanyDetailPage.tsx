import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone, Mail, MessageCircle, UserPlus, ChevronRight, Printer, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { mockCompanies, mockAgents } from '@/data/mockAgents';
import { mockProperties } from '@/data/mockProperties';
import PropertyCard from '@/components/PropertyCard';

const CompanyDetailPage = () => {
  const { id } = useParams();
  const company = mockCompanies.find(c => c.id === id) || mockCompanies[0];
  const companyAgents = mockAgents.filter(a => a.companyId === company.id);
  const [activeTab, setActiveTab] = useState('properties');

  const tabs = [
    { key: 'properties', label: 'Our Properties' },
    { key: 'projects', label: 'Projects' },
    { key: 'events', label: 'Events' },
    { key: 'agents', label: 'Our Agents' },
  ];

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
              <div className="h-32 overflow-hidden">
                <img src={company.coverImage} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-5 text-center relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <img src={company.logo} alt={company.name} className="w-20 h-20 rounded-lg border-2 border-background object-cover shadow" />
                </div>
                <div className="mt-8">
                  <h2 className="font-bold text-foreground text-lg">{company.name}</h2>
                  <p className="text-sm text-muted-foreground">{company.type}</p>
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
                    <td className="py-3 text-foreground"><span className="text-primary font-semibold">{company.agents}</span> Agents</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-muted-foreground">We Speak:</td>
                    <td className="py-3 text-foreground">{company.languages.join(', ')}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 text-muted-foreground">Properties:</td>
                    <td className="py-3 text-foreground">
                      <span className="text-primary">({company.propertiesForBuy})</span> For Buy
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({company.propertiesForRent})</span> For Rent
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({company.projects})</span> Projects
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-primary">({company.events})</span> Events
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Service Areas:</td>
                    <td className="py-3 text-foreground">{company.serviceAreas.join(' - ')}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">About {company.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{company.about}</p>
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
            {activeTab === 'properties' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 1 - {Math.min(mockProperties.length, 3)} of {mockProperties.length} Properties
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <select className="border border-border rounded-lg px-2 py-1 bg-background text-foreground text-xs">
                      <option>Select Type</option>
                      <option>For Buy</option>
                      <option>For Rent</option>
                    </select>
                    <select className="border border-border rounded-lg px-2 py-1 bg-background text-foreground text-xs">
                      <option>Please Select</option>
                      <option>Price Low to High</option>
                      <option>Price High to Low</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockProperties.slice(0, 4).map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companyAgents.map((agent) => (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <img src={agent.photo} alt={agent.name} className="w-14 h-14 rounded-full object-cover" />
                    <div>
                      <h4 className="font-semibold text-foreground">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.designation}</p>
                      <p className="text-xs text-muted-foreground mt-1">{agent.languages.slice(0, 3).join(', ')}</p>
                    </div>
                  </Link>
                ))}
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
