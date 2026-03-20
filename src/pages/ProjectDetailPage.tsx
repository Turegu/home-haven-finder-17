import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Building, Maximize, ChevronLeft, ChevronRight, Camera, Images,
  Globe, Video, Phone, Mail, MessageCircle, UserPlus, CheckCircle2, Share2, Heart,
  PersonStanding, X, Hash, DollarSign, Ruler, Layers, CalendarCheck, HardHat, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import BankLoanBanner from '@/components/BankLoanBanner';
import ProjectUnits from '@/components/ProjectUnits';
import ContactCompanyDialog from '@/components/ContactCompanyDialog';
import NearbyPlacesMap from '@/components/NearbyPlacesMap';
import StreetView from '@/components/StreetView';
import defaultProjectLogo from '@/assets/default-project-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { getCoordsFromLocation } from '@/lib/mapConstants';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [realAgentId, setRealAgentId] = useState<string | null>(null);
  const [realCompanyId, setRealCompanyId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*, agents(id, name, designation, avatar_url, languages, companies(id, name, logo_url)), companies(id, name, logo_url)')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        const p = data as any;
        setProject({
          id: p.id,
          title: p.title || '',
          tagline: p.tagline || '',
          priceFrom: p.min_price || 0,
          currency: p.currency || 'USD',
          location: p.location || [p.neighbourhood, p.town, p.province].filter(Boolean).join(', ') || '',
          city: p.province || '',
          projectType: p.project_type || '',
          units: p.max_units || 0,
          developer: p.developer || '',
          areaRange: p.min_area && p.max_area ? `${p.min_area} - ${p.max_area} ${p.area_unit || 'm²'}` : '—',
          status: p.project_status || '',
          completionDate: p.completion_date || '—',
          listingId: p.listing_id || '',
          listingDate: p.created_at?.slice(0, 10) || '',
          logoUrl: p.logo_url || null,
          images: p.images && p.images.length > 0 ? p.images : ['/placeholder.svg'],
          description: p.description || '',
          interiorAmenities: p.interior_amenities || [],
          exteriorAmenities: p.exterior_amenities || [],
          plans: p.plans || [],
          videoLink: p.video_link || '',
          view360Link: p.view_360_link || '',
          pinLocation: p.pin_location || null,
          agentName: p.agents?.name || '',
          agentLogo: p.agents?.avatar_url || '',
          agentDesignation: p.agents?.designation || null,
          agentLanguages: p.agents?.languages || [],
          agentCompany: p.companies?.name || p.agents?.companies?.name || '',
          companyLogo: p.companies?.logo_url || p.agents?.companies?.logo_url || null,
          hasAgent: !!p.agents,
        });
        setRealAgentId(p.agents?.id || null);
        setRealCompanyId(p.companies?.id || p.agents?.companies?.id || null);
      }
      setLoading(false);
    };
    fetchProject();
  }, [id]);

  const pinLocation = useMemo(() => {
    if (!project?.pinLocation) return null;
    try {
      const parts = project.pinLocation.split(',').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return { lat: parts[0], lng: parts[1] };
    } catch {}
    return null;
  }, [project?.pinLocation]);

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading project...</div>
        <Footer />
      </div>
    );
  }

  const images = project.images;
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const projectLogo = project.logoUrl || defaultProjectLogo;

  const mediaTabs = [
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'plans', label: 'Plans', icon: Images },
    { id: '360', label: '360 View', icon: Globe },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'street', label: 'Street View', icon: PersonStanding },
    { id: 'video', label: 'Video', icon: Video },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === '—') return dateStr;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Media Gallery */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-muted overflow-hidden">
        {/* Photos */}
        <div className={activeTab === 'photos' ? 'h-full' : 'hidden'}>
          <div className="flex h-full">
            {images.slice(currentImage, currentImage + 3).concat(
              currentImage + 3 > images.length ? images.slice(0, (currentImage + 3) - images.length) : []
            ).map((img: string, i: number) => (
              <div key={`${currentImage}-${i}`} className="h-full flex-1 min-w-0 px-[1px] first:pl-0 last:pr-0 cursor-pointer" onClick={() => { setCurrentImage((currentImage + i) % images.length); setLightboxOpen(true); }}>
                <img src={img} alt={`${project.title} ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-4 left-4 bg-foreground/60 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 z-10">
            <Camera className="h-3.5 w-3.5" />{currentImage + 1}/{images.length}
          </div>
        </div>

        {/* Plans */}
        <div className={activeTab === 'plans' ? 'h-full' : 'hidden'}>
          {project.plans.length > 0 ? (
            <div className="flex h-full">
              {project.plans.map((plan: string, i: number) => (
                <div key={i} className="h-full flex-1 min-w-0 px-[1px] first:pl-0 last:pr-0 cursor-pointer" onClick={() => setLightboxOpen(true)}>
                  <img src={plan} alt={`Floor Plan ${i + 1}`} className="w-full h-full object-contain bg-white" />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center"><Images className="h-10 w-10 mx-auto mb-2 opacity-40" />No floor plans available.</div>
            </div>
          )}
        </div>

        {/* 360 View */}
        <div className={activeTab === '360' ? 'h-full' : 'hidden'}>
          {project.view360Link ? (
            <iframe src={project.view360Link} className="w-full h-full border-0" allow="fullscreen; vr" allowFullScreen title="360° Virtual Tour" />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center"><Globe className="h-10 w-10 mx-auto mb-2 opacity-40" />No 360° tour available.</div>
            </div>
          )}
        </div>

        {/* Location — mounted once */}
        {pinLocation && (
          <div className={activeTab === 'location' ? 'h-full' : 'hidden'}>
            <NearbyPlacesMap lat={pinLocation.lat} lng={pinLocation.lng} propertyTitle={project.title} embedded />
          </div>
        )}
        {!pinLocation && activeTab === 'location' && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Location coordinates are unavailable.</div>
        )}

        {/* Street View — mounted once */}
        {pinLocation && (
          <div className={activeTab === 'street' ? 'h-full' : 'hidden'}>
            <StreetView lat={pinLocation.lat} lng={pinLocation.lng} className="h-full w-full" />
          </div>
        )}
        {!pinLocation && activeTab === 'street' && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Location coordinates are unavailable.</div>
        )}

        {/* Video */}
        <div className={activeTab === 'video' ? 'h-full' : 'hidden'}>
          {project.videoLink ? (
            <iframe src={project.videoLink.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Project Video" />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center"><Video className="h-10 w-10 mx-auto mb-2 opacity-40" />No video available.</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <button onClick={() => { if (navigator.share) { navigator.share({ title: project.title, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background active:scale-95 transition-transform" title="Share"><Share2 className="h-4 w-4" /></button>
          <button onClick={() => navigate('/login')} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background active:scale-95 transition-transform" title="Save"><Heart className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={() => setLightboxOpen(false)}><X className="h-6 w-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full"><ChevronLeft className="h-6 w-6 text-white" /></button>
          <img src={images[currentImage]} alt={project.title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full"><ChevronRight className="h-6 w-6 text-white" /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">{currentImage + 1} / {images.length}</div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground">Home</Link><span>/</span>
          <Link to="/projects" className="hover:text-foreground">Projects</Link><span>/</span>
          <span className="text-foreground">{project.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Title Block */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <img src={projectLogo} alt={`${project.title} logo`} className="h-20 w-20 md:h-24 md:w-24 rounded-lg object-contain border border-border bg-muted p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div>
                      <h1 className="text-xl font-bold text-foreground">{project.title}</h1>
                      {project.tagline && <p className="text-sm text-muted-foreground italic mt-0.5">{project.tagline}</p>}
                    </div>
                    <div className="hidden md:flex items-center gap-0.5 bg-muted/80 rounded-lg p-1 border border-border flex-shrink-0">
                      {mediaTabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-2 rounded-md transition-all active:scale-95 ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`} title={tab.label}>
                          <tab.icon className="h-4.5 w-4.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-primary mb-1">From $ {project.priceFrom.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 text-primary" /><span>{project.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-6">
                  <span className="flex items-center gap-1.5"><Building className="h-4 w-4" />{project.projectType}</span>
                  <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" />{project.units} Units</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>Ad ID: <span className="font-medium text-foreground">{project.listingId}</span></span>
                  <span>Added: <span className="font-medium text-foreground">{formatDate(project.listingDate)}</span></span>
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <OverviewItem icon={Hash} label="Listing ID" value={project.listingId} />
                <OverviewItem icon={Building} label="Type" value={project.projectType} />
                <OverviewItem icon={DollarSign} label="Starting Price" value={`$ ${project.priceFrom.toLocaleString()}`} />
                <OverviewItem icon={HardHat} label="Developer" value={project.developer} />
                <OverviewItem icon={Ruler} label="Area Range" value={project.areaRange} />
                <OverviewItem icon={Layers} label="No of Units" value={String(project.units)} />
                <OverviewItem icon={Activity} label="Status" value={project.status} />
                <OverviewItem icon={CalendarCheck} label="Completion" value={project.completionDate} />
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Description</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{project.description}</div>
            </div>

            {/* Amenities */}
            {(project.interiorAmenities.length > 0 || project.exteriorAmenities.length > 0) && (
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Amenities</h2>
                <div className="space-y-4">
                  {project.interiorAmenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-2">Interior Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {project.interiorAmenities.map((a: string) => (
                          <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.exteriorAmenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-2">Exterior Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {project.exteriorAmenities.map((a: string) => (
                          <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Available Units */}
            <ProjectUnits projectId={id || ""} />

            {/* Bank Loan CTA Banner */}
            <BankLoanBanner />
          </div>

          {/* Sidebar - Agent Card */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-[120px]">
              {project.hasAgent ? (
                <>
                  <Link to={realAgentId ? `/agents/${realAgentId}` : '#'} className="block text-center mb-4 group">
                    {project.agentLogo ? (
                      <img src={project.agentLogo} alt={project.agentName} className="h-32 w-32 rounded-lg object-cover border-2 border-border mx-auto mb-3 group-hover:border-primary transition-colors" />
                    ) : (
                      <div className="h-32 w-32 rounded-lg bg-muted border-2 border-border mx-auto mb-3 flex items-center justify-center">
                        <Building className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{project.agentName || '—'}</h3>
                    {project.agentDesignation && <p className="text-sm text-muted-foreground">{project.agentDesignation}</p>}
                  </Link>

                  <Button variant="outline" className="w-full mb-3 gap-2"><UserPlus className="h-4 w-4" />Follow</Button>

                  {project.agentLanguages && project.agentLanguages.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      <span className="font-medium text-foreground">Speaks:</span> {project.agentLanguages.join(', ')}
                    </p>
                  )}

                  {project.companyLogo && (
                    <Link to={realCompanyId ? `/company/${realCompanyId}` : '#'} className="flex flex-col items-center gap-2 py-4 border-t border-border group">
                      <img src={project.companyLogo} alt={project.agentCompany} className="h-14 w-auto max-w-[120px] rounded-lg object-contain group-hover:opacity-80 transition-opacity" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{project.agentCompany}</h4>
                        <p className="text-xs text-muted-foreground">Real Estate Brokers</p>
                      </div>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to={realCompanyId ? `/company/${realCompanyId}` : '#'} className="block text-center mb-4 group">
                    {project.companyLogo ? (
                      <img src={project.companyLogo} alt={project.agentCompany} className="h-32 w-32 rounded-lg object-contain border-2 border-border mx-auto mb-3 p-2 group-hover:border-primary transition-colors" />
                    ) : (
                      <div className="h-32 w-32 rounded-lg bg-muted border-2 border-border mx-auto mb-3 flex items-center justify-center">
                        <Building className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{project.agentCompany || 'Company'}</h3>
                    <p className="text-sm text-muted-foreground">Real Estate Brokers</p>
                  </Link>

                  <Button variant="outline" className="w-full mb-3 gap-2"><UserPlus className="h-4 w-4" />Follow</Button>
                </>
              )}

              <div className="flex items-center justify-center gap-0 border-t border-border pt-3">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm"><Phone className="h-4 w-4" />Call</button>
                <div className="w-px h-6 bg-border" />
                <button onClick={() => setEmailDialogOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm"><Mail className="h-4 w-4" />Email</button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm"><MessageCircle className="h-4 w-4" />WhatsApp</button>
              </div>
            </div>

            <BannerDisplay pageName="project-detail" bannerType="vertical" />
          </div>
        </div>

        <BannerDisplay pageName="project-detail" bannerType="horizontal" className="mt-8" />
      </div>

      <ContactCompanyDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        property={{
          id: project.id,
          title: project.title,
          location: project.location,
          type: project.projectType,
          area: 0,
          areaUnit: 'm²',
          bathrooms: 0,
          bedrooms: 0,
          price: project.priceFrom,
          currency: project.currency,
          images: project.images,
          listingId: project.listingId,
        }}
        companyId={realCompanyId}
        agentId={realAgentId}
        companyName={project.agentCompany}
        listingType="project"
      />

      <Footer />
    </div>
  );
};

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

export default ProjectDetailPage;
