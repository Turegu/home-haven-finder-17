import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Building, Maximize, ChevronLeft, ChevronRight, Camera, Images,
  Globe, Video, Phone, Mail, MessageCircle, UserPlus, CheckCircle2, Share2, Heart,
  PersonStanding, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import BankLoanBanner from '@/components/BankLoanBanner';
import ProjectUnits from '@/components/ProjectUnits';
import { mockProjectDetail } from '@/data/mockDetails';
import defaultProjectLogo from '@/assets/default-project-logo.png';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjectDetail;
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [loanValues, setLoanValues] = useState({
    propertyValue: project.priceFrom,
    loanPeriod: 20,
    interestRate: 5,
    downPayment: 20,
  });

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % project.images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + project.images.length) % project.images.length);

  const principal = loanValues.propertyValue * (1 - loanValues.downPayment / 100);
  const monthlyRate = loanValues.interestRate / 100 / 12;
  const months = loanValues.loanPeriod * 12;
  const monthlyPayment = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal / months;
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - principal;

  const mediaTabs = [
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'plans', label: 'Plans', icon: Images },
    { id: '360', label: '360 View', icon: Globe },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'street', label: 'Street View', icon: PersonStanding },
    { id: 'video', label: 'Video', icon: Video },
  ];

  const projectLogo = project.logoUrl || defaultProjectLogo;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Image Gallery — 3 side-by-side on desktop */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-muted overflow-hidden">
        <div className="flex h-full">
          {project.images.slice(currentImage, currentImage + 3).concat(
            currentImage + 3 > project.images.length
              ? project.images.slice(0, (currentImage + 3) - project.images.length)
              : []
          ).map((img, i) => (
            <div key={`${currentImage}-${i}`} className="h-full flex-1 min-w-0 px-[1px] first:pl-0 last:pr-0 cursor-pointer" onClick={() => { setCurrentImage((currentImage + i) % project.images.length); setLightboxOpen(true); }}>
              <img src={img} alt={`${project.title} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <button onClick={() => { if (navigator.share) { navigator.share({ title: project.title, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background" title="Share">
            <Share2 className="h-4 w-4" />
          </button>
          <button onClick={() => navigate('/login')} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background" title="Save to favorites">
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 bg-foreground/60 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 z-10">
          <Camera className="h-3.5 w-3.5" />
          {currentImage + 1}/{project.images.length}
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
          <img src={project.images[currentImage]} alt={project.title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full">
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {currentImage + 1} / {project.images.length}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/projects" className="hover:text-foreground">Projects</Link>
          <span>/</span>
          <span className="text-foreground">{project.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Block — logo on left, info on right */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex gap-5">
                {/* Project Logo */}
                <div className="flex-shrink-0">
                  <img
                    src={projectLogo}
                    alt={`${project.title} logo`}
                    className="h-20 w-20 md:h-24 md:w-24 rounded-lg object-contain border border-border bg-muted p-1"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <h1 className="text-xl font-bold text-foreground">{project.title}</h1>
                    {/* Media tabs */}
                    <div className="hidden md:flex items-center gap-1 bg-muted/80 rounded-lg p-1 border border-border flex-shrink-0">
                      {mediaTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`p-2.5 rounded-md transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                          title={tab.label}
                        >
                          <tab.icon className="h-5 w-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-primary mb-1">
                    From $ {project.priceFrom.toLocaleString()}
                  </p>
                  <p className="text-foreground/80 text-sm mb-1.5">{project.subtitle}</p>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{project.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building className="h-4 w-4" />
                  {project.projectType}
                </span>
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" />
                  {project.units} Units
                </span>
              </div>
            </div>

            {/* Overview */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <OverviewItem label="Listing ID/Number" value={project.listingId} />
                <OverviewItem label="Type" value={project.projectType} />
                <OverviewItem label="Starting Price" value={`$ ${project.priceFrom.toLocaleString()}`} />
                <OverviewItem label="Developer" value={project.developer} />
                <OverviewItem label="Area Ranges" value={project.areaRange} />
                <OverviewItem label="No of Units" value={String(project.units)} />
                <OverviewItem label="Project Status" value={project.status} />
                <OverviewItem label="Completion" value={project.completionDate} />
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Description</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {project.description}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Amenities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Interior Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {project.interiorAmenities.map((a) => (
                      <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Exterior Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {project.exteriorAmenities.map((a) => (
                      <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Available Units */}
            <ProjectUnits projectId={id || ""} />

            {/* Loan Calculator */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Loan Calculator</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <LoanInput label="Property Value" prefix="$" value={loanValues.propertyValue} onChange={(v) => setLoanValues({ ...loanValues, propertyValue: v })} />
                <LoanInput label="Loan Period" prefix="Years" value={loanValues.loanPeriod} onChange={(v) => setLoanValues({ ...loanValues, loanPeriod: v })} />
                <LoanInput label="Interest Rate" prefix="%" value={loanValues.interestRate} onChange={(v) => setLoanValues({ ...loanValues, interestRate: v })} step={0.1} />
                <LoanInput label="Down Payment" prefix="%" value={loanValues.downPayment} onChange={(v) => setLoanValues({ ...loanValues, downPayment: v })} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                  <p className="text-lg font-bold text-foreground">${totalPayment.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Payment</p>
                  <p className="text-lg font-bold text-primary">${monthlyPayment.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                  <p className="text-lg font-bold text-foreground">${totalInterest.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Bank Loan CTA Banner */}
            <BankLoanBanner />
          </div>

          {/* Sidebar - Agent Card (matching property detail) */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-[120px]">
              {/* Agent info — links to agent profile */}
              <Link to={`/agent/${id}`} className="block text-center mb-4 group">
                <img
                  src={project.agentLogo}
                  alt={project.agentName}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-border mx-auto mb-3 group-hover:border-primary transition-colors"
                />
                <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{project.agentName}</h3>
                {project.agentDesignation && (
                  <p className="text-sm text-muted-foreground">{project.agentDesignation}</p>
                )}
              </Link>

              <Button variant="outline" className="w-full mb-3 gap-2">
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>

              {project.agentLanguages && project.agentLanguages.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mb-4">
                  <span className="font-medium text-foreground">Speaks:</span>{' '}
                  {project.agentLanguages.join(', ')}
                </p>
              )}

              {/* Company logo — links to company profile */}
              {project.companyLogo && (
                <Link to={`/company/${id}`} className="flex items-center gap-4 py-4 border-t border-border group">
                  <img
                    src={project.companyLogo}
                    alt={project.agentCompany}
                    className="h-14 w-24 rounded-lg object-cover border border-border group-hover:border-primary transition-colors"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{project.agentCompany}</h4>
                    <p className="text-xs text-muted-foreground">Real Estate Brokers</p>
                  </div>
                </Link>
              )}

              <div className="flex items-center justify-center gap-0 border-t border-border pt-3">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <Phone className="h-4 w-4" />
                  Call
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Vertical Banner */}
            <BannerDisplay pageName="project-detail" bannerType="vertical" />
          </div>
        </div>

        {/* Horizontal Banner */}
        <BannerDisplay pageName="project-detail" bannerType="horizontal" className="mt-8" />
      </div>

      <Footer />
    </div>
  );
};

const OverviewItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-medium text-foreground">{value}</p>
  </div>
);

const LoanInput = ({ label, prefix, value, onChange, step }: {
  label: string; prefix: string; value: number; onChange: (v: number) => void; step?: number;
}) => (
  <div>
    <label className="text-xs text-muted-foreground block mb-1">{label}</label>
    <div className="flex items-center border border-border rounded-md overflow-hidden">
      <span className="px-2 text-xs text-muted-foreground bg-muted">{prefix}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
      />
    </div>
  </div>
);

export default ProjectDetailPage;
