import { useState, useEffect, lazy } from 'react';
import { getOptimizedImageUrl } from '@/lib/imageUtils';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, BedDouble, Bath, Maximize, Building, Heart,
  ChevronLeft, ChevronRight, Camera, Images, Globe,
  Video, Phone, Mail, MessageCircle,
  PersonStanding, Clock, CalendarDays, X, Printer, Flag,
  Wallet, HardHat, KeyRound, Banknote, CalendarCheck,
  DollarSign, Ruler, Home, Car, Armchair, Layers, Compass, FileText, Activity, Hourglass
} from 'lucide-react';
import { useTrackPageView, trackInquiryClick } from '@/hooks/useListingAnalytics';
import { getIcon } from '@/components/AmenitiesViewAllDialog';
import { getDesignationLabel } from '@/data/designations';
import { toast } from 'sonner';
import { getCoordsFromLocation } from '@/lib/mapConstants';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import BannerDisplay from '@/components/BannerDisplay';
import BankLoanBanner from '@/components/BankLoanBanner';
import { mockPropertyDetail } from '@/data/mockDetails';
import type { Property } from '@/data/mockProperties';
import { supabase } from '@/integrations/supabase/client';
import ContactCompanyDialog from '@/components/ContactCompanyDialog';
import ReportPropertyDialog from '@/components/ReportPropertyDialog';
import FollowButton from '@/components/FollowButton';
import ShareDropdown from '@/components/ShareDropdown';
import VerifiedBadge from '@/components/VerifiedBadge';
import PropertyDetailSkeleton from '@/components/PropertyDetailSkeleton';
import { useAreaUnit } from '@/hooks/useAreaUnit';
import SEOHead from '@/components/SEOHead';

// Lazy-load heavy below-the-fold components
const NearbyPlacesMap = lazy(() => import('@/components/NearbyPlacesMap'));
const StreetView = lazy(() => import('@/components/StreetView'));
const MarketTrends = lazy(() => import('@/components/MarketTrends'));
const ROICalculator = lazy(() => import('@/components/ROICalculator'));
const PriceTrendsChart = lazy(() => import('@/components/PriceTrendsChart'));

const OverviewItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-muted-foreground text-[11px] leading-tight">{label}</p>
      <p className="font-semibold text-foreground text-sm">{value}</p>
    </div>
  </div>
);

const getPaymentStepIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('down') || t.includes('booking') || t.includes('deposit')) return Wallet;
  if (t.includes('handover') || t.includes('delivery') || t.includes('key')) return KeyRound;
  if (t.includes('construct') || t.includes('progress')) return HardHat;
  if (t.includes('completion') || t.includes('complete')) return CalendarCheck;
  if (t.includes('post') || t.includes('monthly')) return Banknote;
  return DollarSign;
};

const emptyPropertyState = {
  ...mockPropertyDetail,
  agentLogo: '',
  agentName: '',
  agentCompany: '',
  companyLogo: null as string | null,
  agentDesignation: null as string | null,
  agentLanguages: [] as string[],
  hasAgent: false,
  plans: [] as string[],
  videoLink: '',
  view360Link: '',
  province: '',
  town: '',
  neighbourhood: '',
  propertyPurpose: 'buy',
  rentDuration: null as string | null,
};

const parsePinLocation = (value: unknown): { lat: number; lng: number } | null => {
  if (typeof value !== 'string') return null;

  const matches = value.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 2) return null;

  const lat = Number.parseFloat(matches[0]);
  const lng = Number.parseFloat(matches[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return { lat, lng };
};

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { formatArea } = useAreaUnit();
  const isMobile = useIsMobile();
  useTrackPageView(id, 'property');
  const [property, setProperty] = useState(emptyPropertyState);
  const [loading, setLoading] = useState(true);
  const [realAgentId, setRealAgentId] = useState<string | null>(null);
  const [realCompanyId, setRealCompanyId] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [contactWhatsapp, setContactWhatsapp] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string>('');
  const [companyVerified, setCompanyVerified] = useState(false);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [propertyPaymentPlans, setPropertyPaymentPlans] = useState<{ id: string; plan_name: string; steps: { id: string; percentage: number; title: string; subtitle: string | null }[] }[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setPinLocation(null);

    const fetchProperty = async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, agents(id, name, name_ar, name_fr, designation, designation_ar, designation_fr, avatar_url, languages, phone, whatsapp, companies(id, name, logo_url, company_type, is_verified, phone, whatsapp)), companies(id, name, logo_url, company_type, is_verified, phone, whatsapp)")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const p = data as any;
        setProperty((prev) => ({
          ...prev,
          id: p.id,
          title: p.title || mockPropertyDetail.title,
          price: p.price || mockPropertyDetail.price,
          currency: p.currency || 'USD',
          location: p.location || mockPropertyDetail.location,
          city: p.province || mockPropertyDetail.city,
          province: p.province || '',
          town: p.town || '',
          neighbourhood: p.neighbourhood || '',
          propertyPurpose: p.property_purpose || 'buy',
          type: p.property_type || mockPropertyDetail.type,
          area: p.area || mockPropertyDetail.area,
          areaUnit: p.area_unit || 'm²',
          bedrooms: p.bedrooms ?? mockPropertyDetail.bedrooms,
          bathrooms: p.bathrooms ?? mockPropertyDetail.bathrooms,
          parkingSpaces: p.parking_spaces ?? 0,
          floorLevel: p.floor_level || '—',
          propertyAge: p.property_age || '—',
          titleDeed: p.title_deed || '—',
          propertyStatus: p.property_status || 'New',
          furniture: p.furniture || '—',
          orientation: p.property_orientation ? [p.property_orientation] : [],
          listingId: p.listing_id || '',
          listingDate: p.created_at?.slice(0, 10) || '',
          listingType: (p.property_purpose || 'buy') as 'buy' | 'rent',
          rentDuration: p.rent_duration || null,
          images: p.images && p.images.length > 0 ? p.images : mockPropertyDetail.images,
          description: p.description || mockPropertyDetail.description,
          interiorAmenities: p.interior_amenities || [],
          exteriorAmenities: p.exterior_amenities || [],
          plans: p.plans && p.plans.length > 0 ? p.plans : [
            'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1200&h=800&fit=crop',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop',
          ],
          videoLink: p.video_link || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          view360Link: p.view_360_link || 'https://my.matterport.com/show/?m=SxQL3iGyvPk',
          agentName: i18n.language === 'ar' && p.agents?.name_ar ? p.agents.name_ar : i18n.language === 'fr' && p.agents?.name_fr ? p.agents.name_fr : p.agents?.name || '',
          agentLogo: p.agents?.avatar_url || '',
          agentDesignation: getDesignationLabel(p.agents?.designation, i18n.language),
          agentLanguages: p.agents?.languages || [],
          agentCompany: p.companies?.name || p.agents?.companies?.name || '',
          companyLogo: p.companies?.logo_url || p.agents?.companies?.logo_url || null,
          hasAgent: !!p.agents,
        }));
        setRealAgentId(p.agents?.id || null);
        setRealCompanyId(p.companies?.id || p.agents?.companies?.id || null);
        setCompanyVerified(p.companies?.is_verified || p.agents?.companies?.is_verified || false);
        // Set contact info: agent takes priority over company
        if (p.agents) {
          setContactPhone(p.agents.phone || null);
          setContactWhatsapp(p.agents.whatsapp || null);
          setContactName(p.agents.name || '');
        } else {
          setContactPhone(p.companies?.phone || null);
          setContactWhatsapp(p.companies?.whatsapp || null);
          setContactName(p.companies?.name || '');
        }
        setPinLocation(parsePinLocation(p.pin_location) || (p.location ? getCoordsFromLocation(p.location) : null));

        // Fetch similar properties
        const { data: similar } = await supabase
          .from('properties')
          .select('*, agents(name, avatar_url), companies(name, logo_url)')
          .eq('status', 'active')
          .eq('property_type', p.property_type)
          .neq('id', p.id)
          .limit(3);
        if (similar) {
          setSimilarProperties(similar.map((s: any) => ({
            id: s.id,
            title: s.title,
            price: s.price ?? 0,
            currency: s.currency ?? 'USD',
            location: s.location || [s.neighbourhood, s.town, s.province].filter(Boolean).join(', ') || 'N/A',
            city: s.town ?? '',
            type: s.property_type,
            area: s.area ?? 0,
            areaUnit: s.area_unit ?? 'm²',
            bedrooms: s.bedrooms ?? 0,
            bathrooms: s.bathrooms ?? 0,
            images: (s.images?.length > 0) ? s.images : ['/placeholder.svg'],
            agentLogo: s.companies?.logo_url ?? '',
            agentName: s.agents?.name ?? '',
            agentAvatar: s.agents?.avatar_url ?? '',
            companyName: s.companies?.name ?? '',
            isFeatured: s.display_on_homepage,
            listingTier: 'standard' as const,
            listingType: (s.property_purpose === 'rent' ? 'rent' : 'buy') as 'buy' | 'rent',
            rentDuration: s.rent_duration ?? null,
            advertisingTags: s.advertising_tags ?? [],
          })));
        }

        // Fetch property payment plans
        const { data: plans } = await supabase
          .from("property_payment_plans")
          .select("*")
          .eq("property_id", id)
          .eq("is_active", true)
          .order("sort_order");
        if (plans && plans.length > 0) {
          const planIds = plans.map((pl: any) => pl.id);
          const { data: steps } = await supabase
            .from("property_payment_plan_steps")
            .select("*")
            .in("plan_id", planIds)
            .order("sort_order");
          setPropertyPaymentPlans(plans.map((pl: any) => ({
            id: pl.id,
            plan_name: pl.plan_name,
            steps: (steps || []).filter((s: any) => s.plan_id === pl.id).map((s: any) => ({
              id: s.id, percentage: s.percentage, title: s.title, subtitle: s.subtitle,
            })),
          })));
        }
      }
      setLoading(false);
    };
    fetchProperty();
  }, [id]);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [loanValues, setLoanValues] = useState({
    propertyValue: 0,
    loanPeriod: 20,
    interestRate: 5,
    downPayment: 20,
  });

  // Sync loan calculator with fetched property price
  useEffect(() => {
    if (property.price > 0) {
      setLoanValues(prev => ({ ...prev, propertyValue: property.price }));
    }
  }, [property.price]);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + property.images.length) % property.images.length);

  // Loan calculator
  const principal = loanValues.propertyValue * (1 - loanValues.downPayment / 100);
  const monthlyRate = loanValues.interestRate / 100 / 12;
  const months = loanValues.loanPeriod * 12;
  const monthlyPayment = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal / months;
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - principal;

  const mediaTabs = [
    { id: 'photos', label: t('property.photos'), icon: Camera },
    { id: 'plans', label: t('property.plans'), icon: Images },
    { id: '360', label: t('property.view360'), icon: Globe },
    { id: 'location', label: t('property.location'), icon: MapPin },
    { id: 'street', label: t('property.streetView'), icon: PersonStanding },
    { id: 'video', label: t('property.video'), icon: Video },
  ];

  const handleMediaTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PropertyDetailSkeleton />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={property.title}
        description={`${property.type} for ${property.propertyPurpose === 'rent' ? 'rent' : 'sale'} in ${property.location}. ${property.bedrooms} bed, ${property.bathrooms} bath, ${formatArea(property.area, property.areaUnit)}. Price: ${property.currency} ${property.price.toLocaleString()}.`}
        image={getOptimizedImageUrl(property.images?.[0], 'og')}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: property.title,
          description: property.description?.slice(0, 200),
          image: property.images,
          url: typeof window !== 'undefined' ? window.location.href : '',
          address: { '@type': 'PostalAddress', addressLocality: property.town, addressRegion: property.province },
          offers: { '@type': 'Offer', priceCurrency: property.currency, price: property.price, availability: 'https://schema.org/InStock' },
          numberOfRooms: property.bedrooms,
          floorSize: { '@type': 'QuantitativeValue', value: property.area, unitCode: property.areaUnit === 'ft²' ? 'FTK' : 'MTK' },
        }}
      />
      <Header />
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors"><Home className="h-3.5 w-3.5" /></Link>
          <span className="text-muted-foreground/50">&gt;</span>
          <Link to={`/${property.propertyPurpose === 'rent' ? 'rent' : 'buy'}`} className="hover:text-foreground transition-colors">
            {property.propertyPurpose === 'rent' ? t('property.forRent') : t('property.forSale')}
          </Link>
          {property.province && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <Link to={`/buy?purpose=${property.propertyPurpose || 'buy'}&province=${encodeURIComponent(property.province)}`} className="hover:text-foreground transition-colors">
                {property.province} {property.propertyPurpose === 'rent' ? t('property.forRent') : t('property.forSale')}
              </Link>
            </>
          )}
          {property.province && property.type && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <Link to={`/buy?purpose=${property.propertyPurpose || 'buy'}&province=${encodeURIComponent(property.province)}&type=${encodeURIComponent(property.type)}`} className="hover:text-foreground transition-colors">
                {property.province} {property.propertyPurpose === 'rent' ? t('property.forRent') : t('property.forSale')} {property.type}
              </Link>
            </>
          )}
          {property.town && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <Link to={`/buy?purpose=${property.propertyPurpose || 'buy'}&province=${encodeURIComponent(property.province)}&town=${encodeURIComponent(property.town)}`} className="hover:text-foreground transition-colors">
                {property.town} {property.propertyPurpose === 'rent' ? t('property.forRent') : t('property.forSale')}
              </Link>
            </>
          )}
          {property.neighbourhood && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <Link to={`/buy?purpose=${property.propertyPurpose || 'buy'}&province=${encodeURIComponent(property.province)}&town=${encodeURIComponent(property.town)}&neighbourhood=${encodeURIComponent(property.neighbourhood)}`} className="hover:text-foreground transition-colors">
                {property.neighbourhood} {property.propertyPurpose === 'rent' ? t('property.forRent') : t('property.forSale')}
              </Link>
            </>
          )}
          <span className="text-muted-foreground/50">&gt;</span>
          <span className="text-foreground font-medium">{property.title}</span>
        </div>
      </div>

      {/* Media Gallery — swaps between photos, map, etc. */}
      <div className="relative w-full h-[250px] sm:h-[300px] md:h-[450px] bg-muted overflow-hidden">
        {/* Photos — default view */}
        <div className={activeTab === 'photos' ? 'h-full' : 'hidden'}>
          <div className="flex h-full">
            {(() => {
              const visibleCount = isMobile ? 1 : 3;
              const visibleImages = property.images.slice(currentImage, currentImage + visibleCount).concat(
                currentImage + visibleCount > property.images.length
                  ? property.images.slice(0, (currentImage + visibleCount) - property.images.length)
                  : []
              );
              return visibleImages.map((img, i) => (
                <div key={`${currentImage}-${i}`} className="h-full flex-1 min-w-0 px-[1px] first:pl-0 last:pr-0 cursor-pointer" onClick={() => { setCurrentImage((currentImage + i) % property.images.length); setLightboxOpen(true); }}>
                  <img src={i === 0 && currentImage === 0 ? getOptimizedImageUrl(img, 'hero') : getOptimizedImageUrl(img, 'hero')} alt={`${property.title} ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : undefined} className="w-full h-full object-cover" />
                </div>
              ));
            })()}
          </div>
          <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-4 bg-foreground/60 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 z-10">
            <Camera className="h-3.5 w-3.5" />
            {currentImage + 1}/{property.images.length}
          </div>
        </div>

        {/* Plans */}
        <div className={activeTab === 'plans' ? 'h-full' : 'hidden'}>
          {property.plans.length > 0 ? (
            <div className="flex h-full">
              {property.plans.map((plan, i) => (
                <div key={i} className="h-full flex-1 min-w-0 px-[1px] first:pl-0 last:pr-0 cursor-pointer" onClick={() => { setLightboxOpen(true); }}>
                  <img src={plan} alt={`Floor Plan ${i + 1}`} className="w-full h-full object-contain bg-white" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center"><Images className="h-10 w-10 mx-auto mb-2 opacity-40" />{t('property.noFloorPlans')}</div>
            </div>
          )}
        </div>

        {/* 360 View */}
        <div className={activeTab === '360' ? 'h-full' : 'hidden'}>
          {property.view360Link ? (
            <iframe src={property.view360Link} className="w-full h-full border-0" allow="fullscreen; vr" allowFullScreen title="360° Virtual Tour" />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center"><Globe className="h-10 w-10 mx-auto mb-2 opacity-40" />{t('property.no360Tour')}</div>
            </div>
          )}
        </div>

        {/* Location — mounted once, stays alive */}
        {pinLocation && (
          <div className={activeTab === 'location' ? 'h-full' : 'hidden'}>
            <NearbyPlacesMap lat={pinLocation.lat} lng={pinLocation.lng} propertyTitle={property.title} embedded />
          </div>
        )}
        {!pinLocation && activeTab === 'location' && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            {t('property.locationUnavailable')}
          </div>
        )}

        {/* Street View — mounted once, stays alive */}
        {pinLocation && (
          <div className={activeTab === 'street' ? 'h-full' : 'hidden'}>
            <StreetView lat={pinLocation.lat} lng={pinLocation.lng} className="h-full w-full" />
          </div>
        )}
        {!pinLocation && activeTab === 'street' && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            {t('property.locationUnavailable')}
          </div>
        )}

        {/* Video */}
        <div className={activeTab === 'video' ? 'h-full' : 'hidden'}>
          {property.videoLink ? (
            <iframe
              src={property.videoLink.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Property Video"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center"><Video className="h-10 w-10 mx-auto mb-2 opacity-40" />{t('property.noVideo')}</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <ShareDropdown title={property.title} />
          <button onClick={() => navigate('/login')} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background active:scale-95 transition-transform" title="Save to favorites">
            <Heart className="h-4 w-4" />
          </button>
          <button onClick={() => window.print()} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background active:scale-95 transition-transform" title="Print">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={() => setReportDialogOpen(true)} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background active:scale-95 transition-transform" title="Report this listing">
            <Flag className="h-4 w-4" />
          </button>
        </div>

      </div>



      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={() => setLightboxOpen(false)}>
            <X className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <img
            src={getOptimizedImageUrl(property.images[currentImage], 'hero')}
            alt={property.title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full">
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {currentImage + 1} / {property.images.length}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Price Block */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                <h1 className="text-lg sm:text-xl font-bold text-foreground line-clamp-2">{property.title}</h1>
                <div className="flex items-center gap-0.5 bg-muted/80 rounded-lg p-1 border border-border shrink-0 overflow-x-auto">
                  {mediaTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleMediaTabClick(tab.id)}
                      className={`p-2 rounded-md transition-all active:scale-95 shrink-0 ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                      title={tab.label}
                    >
                      <tab.icon className="h-4.5 w-4.5" />
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-2xl font-bold text-primary mb-1">
                {property.currency && property.currency !== 'USD' ? property.currency + ' ' : '$ '}{property.price.toLocaleString()}
                {property.listingType === 'rent' && property.rentDuration && <span className="text-lg font-normal text-muted-foreground"> /{property.rentDuration === 'Daily' ? 'day' : property.rentDuration === 'Weekly' ? 'wk' : property.rentDuration === 'Yearly' ? 'yr' : 'mo'}</span>}
              </p>
              <p className="text-foreground/80 mb-2">{property.title}</p>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{property.location}</span>
              </div>

              {/* Specs bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-6">
                  <span className="flex items-center gap-1.5">
                    <Building className="h-4 w-4" />
                    {property.type}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Maximize className="h-4 w-4" />
                    {formatArea(property.area, property.areaUnit)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4" />
                    {property.bedrooms} {t('property.bedrooms')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms} {t('property.bathrooms')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{t('property.adId')}: <span className="font-medium text-foreground">{property.listingId}</span></span>
                  <span>{t('property.added')}: <span className="font-medium text-foreground">{property.listingDate || '—'}</span></span>
                </div>
              </div>
            </div>

            {/* Open House / Viewing Hours — compact strip */}
            {(property.openHouseStart || property.viewingHours) && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-warm/5 border border-warm/20 rounded-lg px-4 py-3 text-sm">
                {property.openHouseStart && (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CalendarDays className="h-4 w-4 text-warm" />
                    <span className="font-medium">{t('property.openHouse')}:</span> {property.openHouseStart}
                    {property.openHouseEnd && <span className="text-muted-foreground ml-1">— {t('property.endDate')}: {property.openHouseEnd}</span>}
                  </span>
                )}
                {property.viewingHours && (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Clock className="h-4 w-4 text-warm" />
                    <span className="font-medium">Viewing:</span> {property.viewingHours}
                  </span>
                )}
              </div>
            )}

            {/* Overview */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('property.overview')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                
                <OverviewItem icon={Building} label={t('property.type')} value={property.type} />
                <OverviewItem icon={DollarSign} label={t('property.price')} value={`$ ${property.price.toLocaleString()}`} />
                <OverviewItem icon={Ruler} label={t('property.area')} value={formatArea(property.area, property.areaUnit)} />
                <OverviewItem icon={Home} label={t('property.rooms')} value={String(property.bedrooms)} />
                <OverviewItem icon={Bath} label={t('property.bathrooms')} value={String(property.bathrooms)} />
                <OverviewItem icon={FileText} label={t('property.titleDeed')} value={property.titleDeed || '—'} />
                <OverviewItem icon={Car} label={t('property.parking')} value={String(property.parkingSpaces)} />
                <OverviewItem icon={Armchair} label={t('property.furniture')} value={property.furniture} />
                <OverviewItem icon={Layers} label={t('property.floorLevel')} value={property.floorLevel} />
                <OverviewItem icon={Hourglass} label={t('property.propertyAge')} value={property.propertyAge} />
                <OverviewItem icon={Activity} label={t('property.status')} value={property.propertyStatus} />
                <OverviewItem icon={Compass} label={t('property.orientation')} value={property.orientation.join(', ')} />
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('property.description')}</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {property.description}
              </div>
            </div>




            {/* Amenities */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('property.amenities')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">{t('property.interiorAmenities')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {property.interiorAmenities.map((a) => {
                      const Icon = getIcon(a, 'interior');
                      return (
                        <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {a}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">{t('property.exteriorAmenities')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {property.exteriorAmenities.map((a) => {
                      const Icon = getIcon(a, 'exterior');
                      return (
                        <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {a}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Plans */}
            {propertyPaymentPlans.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">{t('property.paymentPlan')}</h2>
                {propertyPaymentPlans.map((plan) => (
                  <div key={plan.id} className="mb-4 last:mb-0">
                    {propertyPaymentPlans.length > 1 && (
                      <h3 className="text-sm font-semibold text-foreground mb-2">{plan.plan_name}</h3>
                    )}
                    <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
                      {plan.steps.map((step, idx) => {
                        const StepIcon = getPaymentStepIcon(step.title);
                        return (
                          <div key={step.id} className="flex items-stretch flex-shrink-0">
                            <div className="min-w-[130px] rounded-xl bg-muted/50 border border-border p-4 text-center flex flex-col items-center">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <StepIcon className="h-4.5 w-4.5 text-primary" />
                              </div>
                              <p className="text-xl font-bold text-foreground">{step.percentage}%</p>
                              <p className="text-sm font-medium text-foreground mt-1">{step.title}</p>
                              {step.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>}
                            </div>
                            {idx < plan.steps.length - 1 && (
                              <div className="flex items-center px-1.5">
                                <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}


            {/* Market Trends - Average Housing Prices */}
            <MarketTrends
              province={property.province || null}
              town={property.town || null}
              neighbourhood={property.location?.split(',')[0]?.trim() || null}
              currency={property.currency}
              areaUnit={property.areaUnit}
              currentProperty={{ price: property.price, area: property.area, purpose: property.listingType === 'buy' ? 'buy' : 'rent' }}
            />

            {/* Price Trends Chart */}
            <PriceTrendsChart
              province={property.province || null}
              town={property.town || null}
              neighbourhood={property.location?.split(',')[0]?.trim() || null}
              currency={property.currency}
              areaUnit={property.areaUnit}
              currentProperty={{ price: property.price, area: property.area, purpose: property.listingType === 'buy' ? 'buy' : 'rent' }}
            />

            {/* ROI Calculator */}
            <ROICalculator
              propertyPrice={property.price}
              propertyArea={property.area}
              province={property.province || null}
              town={property.town || null}
              neighbourhood={property.location?.split(',')[0]?.trim() || null}
              currency={property.currency}
              areaUnit={property.areaUnit}
            />

            {/* Loan Calculator */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">{t('property.loanCalculator')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{t('property.propertyValue')}</label>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <span className="px-2 text-xs text-muted-foreground bg-muted">$</span>
                    <input
                      type="number"
                      value={loanValues.propertyValue}
                      onChange={(e) => setLoanValues({ ...loanValues, propertyValue: Number(e.target.value) })}
                      className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{t('property.loanPeriod')}</label>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <span className="px-2 text-xs text-muted-foreground bg-muted">Years</span>
                    <input
                      type="number"
                      value={loanValues.loanPeriod}
                      onChange={(e) => setLoanValues({ ...loanValues, loanPeriod: Number(e.target.value) })}
                      className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{t('property.interestRate')}</label>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <span className="px-2 text-xs text-muted-foreground bg-muted">%</span>
                    <input
                      type="number"
                      step="0.1"
                      value={loanValues.interestRate}
                      onChange={(e) => setLoanValues({ ...loanValues, interestRate: Number(e.target.value) })}
                      className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{t('property.downPayment')}</label>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <span className="px-2 text-xs text-muted-foreground bg-muted">%</span>
                    <input
                      type="number"
                      value={loanValues.downPayment}
                      onChange={(e) => setLoanValues({ ...loanValues, downPayment: Number(e.target.value) })}
                      className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('property.totalCost')}</p>
                  <p className="text-lg font-bold text-foreground">${totalPayment.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('property.monthlyPayment')}</p>
                  <p className="text-lg font-bold text-primary">${monthlyPayment.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{t('property.totalInterest')}</p>
                  <p className="text-lg font-bold text-foreground">${totalInterest.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Bank Loan CTA Banner */}
            <BankLoanBanner />
          </div>

          {/* Sidebar - Agent Card */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-[120px]">
              {property.hasAgent ? (
                <>
                  {/* Agent info — links to agent profile */}
                  <Link to={realAgentId ? `/agents/${realAgentId}` : '#'} className="block text-center mb-4 group">
                    {property.agentLogo ? (
                      <img
                        src={property.agentLogo}
                        alt={property.agentName}
                        className="h-32 w-32 rounded-lg object-cover border-2 border-border mx-auto mb-3 group-hover:border-primary transition-colors"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-lg bg-muted border-2 border-border mx-auto mb-3 flex items-center justify-center">
                        <Building className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors flex items-center justify-center gap-1">{property.agentName || 'Loading...'}{companyVerified && <VerifiedBadge size="sm" />}</h3>
                    {property.agentDesignation && (
                      <p className="text-sm text-muted-foreground">{property.agentDesignation}</p>
                    )}
                  </Link>

                  {realAgentId && (
                    <div className="flex justify-center mb-3">
                      <FollowButton type="agent" targetId={realAgentId} size="md" />
                    </div>
                  )}

                  {property.agentLanguages && property.agentLanguages.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      <span className="font-medium text-foreground">{t('property.speaks')}:</span>{' '}
                      {property.agentLanguages.join(', ')}
                    </p>
                  )}

                  {/* Company logo — links to company profile */}
                  {property.companyLogo && (
                    <Link to={realCompanyId ? `/company/${realCompanyId}` : '#'} className="flex flex-col items-center gap-2 py-4 border-t border-border group">
                      <img
                        src={property.companyLogo}
                        alt={property.agentCompany}
                        className="h-14 w-auto max-w-[120px] rounded-lg object-contain group-hover:opacity-80 transition-opacity"
                      />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors flex items-center justify-center gap-1">{property.agentCompany}{companyVerified && <VerifiedBadge size="sm" />}</h4>
                        <p className="text-xs text-muted-foreground">{t('property.realEstateBrokers')}</p>
                      </div>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {/* No agent — show company info as primary */}
                  <Link to={realCompanyId ? `/company/${realCompanyId}` : '#'} className="block text-center mb-4 group">
                    {property.companyLogo ? (
                      <img
                        src={property.companyLogo}
                        alt={property.agentCompany}
                        className="h-32 w-32 rounded-lg object-contain border-2 border-border mx-auto mb-3 p-2 group-hover:border-primary transition-colors"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-lg bg-muted border-2 border-border mx-auto mb-3 flex items-center justify-center">
                        <Building className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors flex items-center justify-center gap-1">{property.agentCompany || 'Company'}{companyVerified && <VerifiedBadge size="sm" />}</h3>
                    <p className="text-sm text-muted-foreground">{t('property.realEstateBrokers')}</p>
                  </Link>

                  {realCompanyId && (
                    <div className="flex justify-center mb-3">
                      <FollowButton type="company" targetId={realCompanyId} size="md" />
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-center gap-0 border-t border-border pt-3">
                <button onClick={() => {
                  trackInquiryClick(id!, 'property', 'call');
                  if (contactPhone) window.open(`tel:${contactPhone}`, '_self');
                  else toast.error('No phone number available');
                }} className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <Phone className="h-4 w-4" />
                  {t('property.call')}
                </button>
                <div className="w-px h-6 bg-border" />
                <button onClick={() => { trackInquiryClick(id!, 'property', 'email'); setEmailDialogOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <Mail className="h-4 w-4" />
                  {t('property.email')}
                </button>
                <div className="w-px h-6 bg-border" />
                <button onClick={() => {
                  trackInquiryClick(id!, 'property', 'whatsapp');
                  if (contactWhatsapp) {
                    const cleaned = contactWhatsapp.replace(/[^0-9+]/g, '');
                    window.open(`https://wa.me/${cleaned}?text=Hi, I am interested in your property: ${encodeURIComponent(property.title)}`, '_blank');
                  } else toast.error('No WhatsApp number available');
                }} className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <MessageCircle className="h-4 w-4" />
                  {t('property.whatsApp')}
                </button>
              </div>
            </div>

            {/* Vertical Banner */}
            <BannerDisplay pageName="buy-detail" bannerType="vertical" className="" />
          </div>
        </div>

        {/* Horizontal Banner */}
        <BannerDisplay pageName="buy-detail" bannerType="horizontal" className="mt-8" />

        {/* Similar Properties */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-6">{t('property.similarProperties')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProperties.map((p) => (
              <Link key={p.id} to={`/property/${p.id}`}>
                <PropertyCard property={p} />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <ContactCompanyDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        property={{
          id: property.id,
          title: property.title,
          location: property.location,
          type: property.type,
          area: property.area,
          areaUnit: property.areaUnit,
          bathrooms: property.bathrooms,
          bedrooms: property.bedrooms,
          price: property.price,
          currency: property.currency,
          images: property.images,
          listingId: property.listingId,
          floorLevel: property.floorLevel,
        }}
        companyId={realAgentId ? null : realCompanyId}
        agentId={realAgentId}
        companyName={realAgentId ? property.agentName : property.agentCompany}
        companyLogo={property.companyLogo}
        agentAvatar={realAgentId ? property.agentLogo : null}
      />

      <ReportPropertyDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        propertyId={property.id}
        propertyTitle={property.title}
      />
    </div>
  );
};

export default PropertyDetailPage;
