import { ArrowRight, MapPin, Building, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSearch from '@/components/HeroSearch';
import PropertyCard from '@/components/PropertyCard';
import Footer from '@/components/Footer';
import { mockProjects } from '@/data/mockProperties';
import { useCmsPage, useFeaturedLocations, usePartners } from '@/hooks/useAppData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CmsContent {
  hero?: { title?: string; subtitle?: string; image_url?: string; link_url?: string; link_text?: string; enable_link?: boolean };
  second_banner?: { image_url?: string; link_url?: string };
  featured_properties?: { title?: string; tagline?: string };
  featured_projects?: { title?: string; tagline?: string };
  featured_locations?: { title?: string; tagline?: string };
  partners?: { title?: string; tagline?: string };
}

const Index = () => {
  const { data: cms = {} } = useCmsPage<CmsContent>("home");
  const { data: locations = [] } = useFeaturedLocations();
  const { data: partners = [] } = usePartners();

  const { data: featuredProperties = [] } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('*, agents(name, avatar_url), companies(name, logo_url)')
        .eq('status', 'active')
        .eq('display_on_homepage', true)
        .limit(6);
      return (data || []).map((p: any) => ({
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
        images: (p.images?.length > 0) ? p.images : ['/placeholder.svg'],
        agentLogo: p.companies?.logo_url ?? '',
        agentName: p.agents?.name ?? '',
        agentAvatar: p.agents?.avatar_url ?? '',
        companyName: p.companies?.name ?? '',
        isFeatured: true,
        listingTier: 'standard' as const,
        listingType: (p.property_purpose === 'rent' ? 'rent' : 'buy') as 'buy' | 'rent',
        advertisingTags: p.advertising_tags ?? [],
      }));
    },
  });

  const hero = cms.hero || {};
  const secondBanner = cms.second_banner || {};
  const fp = cms.featured_properties || {};
  const fpr = cms.featured_projects || {};
  const fl = cms.featured_locations || {};
  const pt = cms.partners || {};

  return (
    <div className="min-h-screen bg-background">
      <title>Turegu – Your Property, Our Priority</title>
      <Header />

      {/* Hero Banner */}
      <section className="relative w-full">
        {hero.link_url ? (
          <a href={hero.link_url} target="_blank" rel="noopener noreferrer" className="block relative">
            <HeroBannerContent hero={hero} isMain />
          </a>
        ) : (
          <HeroBannerContent hero={hero} isMain />
        )}
      </section>

      <HeroSearch />

      {/* Second Banner */}
      {secondBanner.image_url && (
        <section className="container mx-auto px-4 py-6">
          {secondBanner.link_url ? (
            <a href={secondBanner.link_url} target="_blank" rel="noopener noreferrer" className="block">
              <img src={secondBanner.image_url} alt="Advertisement" loading="lazy" className="w-full h-auto max-h-[180px] object-cover rounded-xl" />
            </a>
          ) : (
            <img src={secondBanner.image_url} alt="Advertisement" loading="lazy" className="w-full h-auto max-h-[180px] object-cover rounded-xl" />
          )}
        </section>
      )}

      {/* Featured Properties */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{fp.title || "Featured Properties"}</h2>
            <p className="text-sm text-muted-foreground mt-1">{fp.tagline || "Handpicked properties for you"}</p>
          </div>
          <Link to="/buy" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProperties.map((property) => (
            <Link key={property.id} to={`/property/${property.id}`}>
              <PropertyCard property={property} />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{fpr.title || "Featured Projects"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{fpr.tagline || "New developments & off-plan projects"}</p>
            </div>
            <Link to="/projects" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <div key={project.id} className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={project.image} alt={project.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/80 to-transparent p-4">
                    <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded">
                      {project.completionDate}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{project.title}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{project.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Starting from</p>
                      <p className="text-sm font-bold text-foreground">${project.priceFrom.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building className="h-3.5 w-3.5" />
                      <span>{project.units} units</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Locations */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{fl.title || "Featured Locations"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{fl.tagline || "Find Your Neighborhood"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {locations.map((loc) => (
              <a
                key={loc.id}
                href={loc.link_url || "#"}
                target={loc.link_url ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {loc.image_url ? (
                  <img src={loc.image_url} alt={loc.name} loading="lazy" className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-3 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">{loc.name}</h3>
                  {loc.link_url && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="bg-muted/50 py-12 overflow-hidden">
        <div className="container mx-auto px-4 mb-6 text-center">
          <h2 className="text-xl font-bold text-foreground">{pt.title || "Our Partners"}</h2>
          {pt.tagline && <p className="text-sm text-muted-foreground mt-1">{pt.tagline}</p>}
        </div>
        <div className="relative">
          <div className="flex marquee whitespace-nowrap">
            {[...partners, ...partners].map((partner, i) => (
              <div key={`${partner.id}-${i}`} className="flex-shrink-0 mx-8">
                {partner.link_url ? (
                  <a href={partner.link_url} target="_blank" rel="noopener noreferrer">
                    {partner.logo_url ? (
                      <img src={partner.logo_url} alt={partner.name} loading="lazy" className="h-14 w-auto object-contain rounded-lg border border-border bg-card px-4 py-2 hover:shadow-md transition-shadow" />
                    ) : (
                      <div className="bg-card border border-border rounded-lg px-8 py-4 text-muted-foreground font-semibold text-lg hover:text-primary transition-colors cursor-pointer">
                        {partner.name}
                      </div>
                    )}
                  </a>
                ) : partner.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} loading="lazy" className="h-14 w-auto object-contain rounded-lg border border-border bg-card px-4 py-2" />
                ) : (
                  <div className="bg-card border border-border rounded-lg px-8 py-4 text-muted-foreground font-semibold text-lg">
                    {partner.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Hero banner content component
const HeroBannerContent = ({ hero, isMain }: { hero: CmsContent["hero"]; isMain?: boolean }) => {
  const defaultBg = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=800&fit=crop";
  return (
    <div className={`relative w-full ${isMain ? "min-h-[420px] md:min-h-[520px]" : "min-h-[200px]"} flex flex-col justify-end overflow-hidden`}>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${hero?.image_url || defaultBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
      <div className="relative z-10 text-center px-4 pb-10 pt-20">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          {hero?.title || "Your Property, Our Priority"}
        </h1>
        <p className="text-white/80 text-sm md:text-base mb-4 font-light">
          {hero?.subtitle || "Find your dream property across the Middle East & Turkey"}
        </p>
        {hero?.enable_link && hero?.link_text && (
          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-sm font-medium border border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
            {hero.link_text}
          </span>
        )}
      </div>
    </div>
  );
};

export default Index;
