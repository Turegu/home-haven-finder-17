import { ArrowRight, MapPin, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import FeaturedProjectCard from '@/components/FeaturedProjectCard';
import FeaturedPropertyCard from '@/components/FeaturedPropertyCard';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import HeroSearch from '@/components/HeroSearch';
import { TopAgentsSpotlight, TopCompaniesSpotlight } from '@/components/HomepageSpotlight';

import Footer from '@/components/Footer';
import AiPropertyAgent from '@/components/AiPropertyAgent';
import { mockProjects } from '@/data/mockProperties';
import { useCmsPage, useFeaturedLocations } from '@/hooks/useAppData';
import { useSavedPropertyIds, useComparedPropertyIds } from '@/hooks/usePropertyActions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useDirection } from '@/hooks/useDirection';

interface SlideContent {
  title?: string;
  title_ar?: string;
  title_fr?: string;
  subtitle?: string;
  subtitle_ar?: string;
  subtitle_fr?: string;
  link_url?: string;
  link_text?: string;
  link_text_ar?: string;
  link_text_fr?: string;
}

interface CmsContent {
  hero?: {
    title?: string; subtitle?: string; image_url?: string; hero_images?: string[];
    link_url?: string; link_text?: string; enable_link?: boolean;
    slides?: SlideContent[];
  };
  second_banner?: { image_url?: string; link_url?: string };
  featured_properties?: { title?: string; tagline?: string };
  featured_projects?: { title?: string; tagline?: string };
  featured_locations?: { title?: string; tagline?: string };
}

// Homepage component
const Index = () => {
  const { t } = useTranslation();
  const { data: cms = {} } = useCmsPage<CmsContent>("home");
  const { data: locations = [] } = useFeaturedLocations();
  const { data: savedIds } = useSavedPropertyIds();
  const { data: comparedIds } = useComparedPropertyIds();

  const { data: allFeaturedProperties = [] } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('*, agents(name, avatar_url, phone, whatsapp), companies(name, logo_url, phone, whatsapp)')
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
        contactPhone: p.agents?.phone ?? p.companies?.phone ?? null,
        contactWhatsapp: p.agents?.whatsapp ?? p.companies?.whatsapp ?? null,
        companyId: p.company_id ?? null,
        agentId: p.agent_id ?? null,
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

  const { data: allFeaturedProjects = [] } = useQuery({
    queryKey: ['featured-projects-home'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, title, location, min_price, currency, images, developer, min_units, completion_date, advertising_tags, companies(logo_url)')
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
        advertisingTags: p.advertising_tags ?? [],
      }));
    },
  });

  const displayedProjects = useMemo(() => {
    if (allFeaturedProjects.length <= 3) return allFeaturedProjects;
    const shuffled = [...allFeaturedProjects].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [allFeaturedProjects]);

  const featuredProjects = displayedProjects.length > 0 ? displayedProjects : mockProjects;

  const hero = cms?.hero || {};
  const secondBanner = cms?.second_banner || {};
  const fp = cms?.featured_properties || {};
  const fpr = cms?.featured_projects || {};
  const fl = cms?.featured_locations || {};

  // Check if CMS data is loaded (hero has images)
  const heroReady = !!(hero?.hero_images?.length || hero?.image_url);

  return (
    <div className="min-h-screen bg-background">
      <title>Turegu – Your Property, Our Priority</title>
      <Header />

      {/* Hero Banner — only render once CMS data is loaded */}
      <section className="container mx-auto px-4 pt-4">
        {heroReady ? (
          <HeroBannerContent hero={hero} isMain />
        ) : (
          <div className="w-full aspect-[4/3] sm:aspect-[21/9] rounded-2xl bg-muted animate-pulse" />
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
              <h2 className="text-2xl font-bold text-foreground">{fpr.title || t('home.featuredProjects')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{fpr.tagline || t('home.featuredProjectsTagline')}</p>
            </div>
            <Link to="/projects" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t('home.viewAll')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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
            <h2 className="text-2xl font-bold text-foreground">{fp.title || t('home.featuredProperties')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{fp.tagline || t('home.featuredPropertiesTagline')}</p>
          </div>
          <Link to="/buy" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t('home.viewAll')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
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

      {/* Top Agents — before Featured Locations */}
      <TopAgentsSpotlight />

      {/* Featured Locations */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-14">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{fl.title || t('home.featuredLocations')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{fl.tagline || t('home.featuredLocationsTagline')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {locations.slice(0, 3).map((loc) => {
              const isExternal = loc.link_url?.startsWith('http');
              const innerContent = (
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
              );

              return isExternal ? (
                <a key={loc.id} href={loc.link_url || '#'} target="_blank" rel="noopener noreferrer" className="group relative rounded-2xl overflow-hidden">
                  {innerContent}
                </a>
              ) : (
                <Link key={loc.id} to={loc.link_url || '#'} className="group relative rounded-2xl overflow-hidden">
                  {innerContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Companies — after Featured Locations */}
      <TopCompaniesSpotlight />

      <AiPropertyAgent />
      <Footer />
    </div>
  );
};

// Hero banner slideshow component with per-slide content, 9s rotation, localStorage sequential start, pause on hover, RTL
const HERO_STORAGE_KEY = 'turegu_hero_last_slide';

const HeroBannerContent = ({ hero, isMain }: { hero: CmsContent["hero"]; isMain?: boolean }) => {
  const { t, i18n } = useTranslation();
  const dir = useDirection();
  const defaultBg = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=800&fit=crop";
  const rawImages = hero?.hero_images?.length ? hero.hero_images : (hero?.image_url ? [hero.image_url] : [defaultBg]);
  // Append ?width=1200 for Supabase storage images to serve optimized versions
  const images = rawImages.map((url) =>
    url.includes('/storage/v1/object/public/') && !url.includes('?')
      ? `${url}?width=1200&quality=80`
      : url
  );
  const slides: SlideContent[] = hero?.slides || [];

  // Sequential start: read last shown slide from localStorage, start with next
  const getInitialIndex = useCallback(() => {
    if (images.length <= 1) return 0;
    try {
      const last = parseInt(localStorage.getItem(HERO_STORAGE_KEY) || '0', 10);
      return (last + 1) % images.length;
    } catch { return 0; }
  }, [images.length]);

  const [currentIndex, setCurrentIndex] = useState(getInitialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save current index to localStorage when it changes
  useEffect(() => {
    try { localStorage.setItem(HERO_STORAGE_KEY, String(currentIndex)); } catch {}
  }, [currentIndex]);

  // Auto-rotate with 9s interval, pause on hover
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 9000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [images.length, isPaused]);

  const goTo = (idx: number) => setCurrentIndex(idx);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);

  // Get localized field for current slide
  const lang = i18n.language;
  const currentSlide = slides[currentIndex] || {};

  const getLocalizedField = (field: 'title' | 'subtitle' | 'link_text') => {
    if (lang === 'ar') return currentSlide[`${field}_ar`] || currentSlide[field] || '';
    if (lang === 'fr') return currentSlide[`${field}_fr`] || currentSlide[field] || '';
    return currentSlide[field] || '';
  };

  const slideTitle = getLocalizedField('title') || hero?.title || t('hero.defaultTitle');
  const slideSubtitle = getLocalizedField('subtitle') || hero?.subtitle || t('hero.defaultSubtitle');
  const slideLinkUrl = currentSlide.link_url || '';
  const slideLinkText = getLocalizedField('link_text') || '';

  const slideContent = (
    <div
      className={`relative w-full ${isMain ? "aspect-[4/3] sm:aspect-[21/9]" : "min-h-[200px]"} flex flex-col justify-end overflow-hidden rounded-2xl`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {images.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt={`${slideTitle} ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          loading={idx === currentIndex ? "eager" : "lazy"}
          {...(idx === currentIndex ? { fetchPriority: "high" as any } : {})}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="relative z-10 text-center px-4 pb-14 pt-16" dir={dir}>
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          {slideTitle}
        </h1>
        <p className="text-white/80 text-sm md:text-base mb-4 font-light">
          {slideSubtitle}
        </p>
        {slideLinkText && (
          <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-sm font-medium border border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
            {slideLinkText}
          </span>
        )}
      </div>

      {/* Navigation arrows — RTL aware */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dir === 'rtl' ? goNext() : goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dir === 'rtl' ? goPrev() : goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Slide indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(idx); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Wrap in link if slide has link_url
  if (slideLinkUrl) {
    return (
      <a href={slideLinkUrl} target="_blank" rel="noopener noreferrer" className="block">
        {slideContent}
      </a>
    );
  }

  return slideContent;
};

export default Index;
