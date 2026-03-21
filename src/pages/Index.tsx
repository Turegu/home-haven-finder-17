import { ArrowRight, MapPin, ExternalLink } from 'lucide-react';
import FeaturedProjectCard from '@/components/FeaturedProjectCard';
import FeaturedPropertyCard from '@/components/FeaturedPropertyCard';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import HeroSearch from '@/components/HeroSearch';

import Footer from '@/components/Footer';
import { mockProjects } from '@/data/mockProperties';
import { useCmsPage, useFeaturedLocations, usePartners } from '@/hooks/useAppData';
import { useSavedPropertyIds, useComparedPropertyIds } from '@/hooks/usePropertyActions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface CmsContent {
  hero?: { title?: string; subtitle?: string; image_url?: string; link_url?: string; link_text?: string; enable_link?: boolean };
  second_banner?: { image_url?: string; link_url?: string };
  featured_properties?: { title?: string; tagline?: string };
  featured_projects?: { title?: string; tagline?: string };
  featured_locations?: { title?: string; tagline?: string };
  partners?: { title?: string; tagline?: string };
}

// Homepage component
const Index = () => {
  const { data: cms = {} } = useCmsPage<CmsContent>("home");
  const { data: locations = [] } = useFeaturedLocations();
  const { data: partners = [] } = usePartners();
  const { data: savedIds } = useSavedPropertyIds();
  const { data: comparedIds } = useComparedPropertyIds();

  const { data: allFeaturedProperties = [] } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('*, agents(name, avatar_url), companies(name, logo_url)')
        .eq('status', 'active')
        .eq('display_on_homepage', true)
        .limit(12);
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

  const sampleProperties = [
    {
      id: 'sample-1', title: 'Luxury Penthouse with Bosphorus View', price: 1850000, currency: 'USD',
      location: 'Beşiktaş, Istanbul', city: 'Istanbul', type: 'Penthouse', area: 320, areaUnit: 'm²',
      bedrooms: 4, bathrooms: 3, images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=800&fit=crop'],
      agentLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=40&fit=crop', agentName: 'Ayşe Kaya', agentAvatar: '', companyName: 'Prime Realty',
      isFeatured: true, listingTier: 'premium' as const, listingType: 'buy' as const, advertisingTags: ['Hot Deal'],
    },
    {
      id: 'sample-2', title: 'Modern Sea-View Apartment in JBR', price: 2200, currency: 'USD',
      location: 'Jumeirah Beach Residence, Dubai', city: 'Dubai', type: 'Apartment', area: 145, areaUnit: 'm²',
      bedrooms: 2, bathrooms: 2, images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=800&fit=crop'],
      agentLogo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=40&fit=crop', agentName: 'Omar Hassan', agentAvatar: '', companyName: 'Gulf Estates',
      isFeatured: true, listingTier: 'featured' as const, listingType: 'rent' as const, advertisingTags: [],
    },
    {
      id: 'sample-3', title: 'Garden Villa in Al Reem Island', price: 980000, currency: 'USD',
      location: 'Al Reem Island, Abu Dhabi', city: 'Abu Dhabi', type: 'Villa', area: 450, areaUnit: 'm²',
      bedrooms: 5, bathrooms: 4, images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=800&fit=crop'],
      agentLogo: '', agentName: '', agentAvatar: '', companyName: '',
      isFeatured: true, listingTier: 'standard' as const, listingType: 'buy' as const, advertisingTags: ['New Launch'],
    },
  ];

  const displayedProperties = useMemo(() => {
    if (allFeaturedProperties.length <= 3) return allFeaturedProperties;
    const shuffled = [...allFeaturedProperties].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [allFeaturedProperties]);

  const featuredProperties = displayedProperties.length > 0 ? displayedProperties : sampleProperties;

  // Fetch up to 12 featured projects, randomly show 3
  const { data: allFeaturedProjects = [] } = useQuery({
    queryKey: ['featured-projects-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, title, location, min_price, currency, images, developer, min_units, completion_date, companies(logo_url)')
        .eq('status', 'active')
        .eq('display_on_homepage', true)
        .limit(12);
      return (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        location: p.location || 'N/A',
        priceFrom: p.min_price ?? 0,
        currency: p.currency ?? 'USD',
        image: p.images?.[0] || '/placeholder.svg',
        developer: p.developer || '',
        developerLogo: p.companies?.logo_url || '',
        units: p.min_units ?? 0,
        completionDate: p.completion_date || 'TBA',
      }));
    },
  });

  const displayedProjects = useMemo(() => {
    if (allFeaturedProjects.length <= 3) return allFeaturedProjects;
    const shuffled = [...allFeaturedProjects].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [allFeaturedProjects]);

  // Fallback to mock if no DB projects
  const featuredProjects = displayedProjects.length > 0 ? displayedProjects : mockProjects;

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
      <section className="container mx-auto px-4 pt-4">
        {hero.link_url ? (
          <a href={hero.link_url} target="_blank" rel="noopener noreferrer" className="block">
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
            {featuredProjects.map((project) => (
              <FeaturedProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

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
              <FeaturedPropertyCard property={property} isSaved={savedIds?.has(property.id)} isCompared={comparedIds?.has(property.id)} />
            </Link>
          ))}
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
            {locations.slice(0, 3).map((loc) => {
              const isExternal = loc.link_url?.startsWith('http');
              const LinkTag = isExternal ? 'a' : Link;
              const linkProps = isExternal
                ? { href: loc.link_url || '#', target: '_blank', rel: 'noopener noreferrer' }
                : { to: loc.link_url || '#' };
              return (
                <LinkTag
                  key={loc.id}
                  {...(linkProps as any)}
                  className="group relative rounded-2xl overflow-hidden"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {loc.image_url ? (
                      <img src={loc.image_url} alt={loc.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.04]" />
                    ) : (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
                      <div>
                        {loc.tagline && <p className="text-[11px] text-white/60 uppercase tracking-widest font-light mb-1">{loc.tagline}</p>}
                        <h3 className="font-display text-lg font-bold text-white tracking-tight">{loc.subtitle || loc.name}</h3>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <ExternalLink className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                </LinkTag>
              );
            })}
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
    <div className={`relative w-full ${isMain ? "aspect-[21/9] md:aspect-[21/9]" : "min-h-[200px]"} flex flex-col justify-end overflow-hidden rounded-2xl`}>
      <img
        src={hero?.image_url || defaultBg}
        alt={hero?.title || "Banner"}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
      <div className="relative z-10 text-center px-4 pb-8 pt-16">
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
