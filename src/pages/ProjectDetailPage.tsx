import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin, Building, Maximize, ChevronLeft, ChevronRight, Camera, Images,
  Globe, Video, Phone, Mail, MessageCircle, UserPlus, CheckCircle2, Share2, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { mockProjectDetail } from '@/data/mockDetails';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const project = mockProjectDetail;
  const [currentImage, setCurrentImage] = useState(0);
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
    { id: 'street', label: 'Street View', icon: MapPin },
    { id: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Image Gallery */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-muted overflow-hidden">
        <img src={project.images[currentImage]} alt={project.title} className="w-full h-full object-cover" />
        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full shadow-md">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full shadow-md">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="absolute top-4 left-4 flex gap-2">
          <button className="bg-background/90 p-2 rounded-full shadow-sm"><Share2 className="h-4 w-4" /></button>
          <button className="bg-background/90 p-2 rounded-full shadow-sm"><Heart className="h-4 w-4" /></button>
        </div>
        <div className="absolute bottom-4 left-4 bg-foreground/60 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1">
          <Camera className="h-3.5 w-3.5" />
          {currentImage + 1}/{project.images.length}
        </div>
      </div>

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
            {/* Title Block */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl font-bold text-foreground">{project.title}</h1>
                <div className="hidden md:flex items-center gap-1">
                  {mediaTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-2 rounded-full transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'}`}
                      title={tab.label}
                    >
                      <tab.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-2xl font-bold text-primary mb-2">
                From $ {project.priceFrom.toLocaleString()}
              </p>
              <p className="text-foreground/80 mb-2">{project.subtitle}</p>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{project.location}</span>
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
          </div>

          {/* Sidebar - Agent Card */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-[120px]">
              <div className="text-center mb-4">
                <img src={project.agentLogo} alt={project.agentName} className="h-20 w-20 rounded-full object-cover border-2 border-border mx-auto mb-3" />
                <h3 className="font-bold text-foreground text-lg">{project.agentName}</h3>
                <p className="text-sm text-muted-foreground">{project.agentCompany}</p>
              </div>
              <Button variant="outline" className="w-full mb-3 gap-2">
                <UserPlus className="h-4 w-4" /> Follow
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1 text-xs">
                  <Phone className="h-3.5 w-3.5" /> Call
                </Button>
                <Button variant="outline" className="flex-1 gap-1 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Button>
                <Button className="flex-1 gap-1 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" /> Whatsapp
                </Button>
              </div>
            </div>

            <div className="bg-primary/10 rounded-xl border border-primary/20 p-6 text-center">
              <h4 className="font-bold text-foreground mb-1">Buy your dream house</h4>
              <p className="text-sm text-muted-foreground mb-3">housing and real estate</p>
              <Button variant="outline" size="sm">Click Personal Loan Rates</Button>
            </div>
          </div>
        </div>
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
