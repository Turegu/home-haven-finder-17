import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, BedDouble, Bath, Maximize, Building, Share2, Heart,
  ChevronLeft, ChevronRight, Camera, Images, Globe,
  Video, Phone, Mail, MessageCircle, UserPlus, CheckCircle2,
  PersonStanding, Clock, CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import BannerDisplay from '@/components/BannerDisplay';
import BankLoanBanner from '@/components/BankLoanBanner';
import MarketTrends from '@/components/MarketTrends';
import ROICalculator from '@/components/ROICalculator';
import PriceTrendsChart from '@/components/PriceTrendsChart';
import { mockPropertyDetail } from '@/data/mockDetails';
import { mockProperties } from '@/data/mockProperties';

const PropertyDetailPage = () => {
  const { id: _id } = useParams();
  const navigate = useNavigate();
  const property = mockPropertyDetail;
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState('photos');
  const [loanValues, setLoanValues] = useState({
    propertyValue: property.price,
    loanPeriod: 20,
    interestRate: 5,
    downPayment: 20,
  });

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
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'plans', label: 'Plans', icon: Images },
    { id: '360', label: '360 View', icon: Globe },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'street', label: 'Street View', icon: PersonStanding },
    { id: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Image Gallery — side by side */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-muted overflow-hidden">
        <div className="flex h-full transition-transform duration-300" style={{ transform: `translateX(-${currentImage * (100 / Math.min(property.images.length, 3))}%)` }}>
          {property.images.map((img, i) => (
            <div key={i} className="h-full flex-shrink-0 w-full md:w-1/3 px-[1px]">
              <img src={img} alt={`${property.title} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
          <ChevronRight className="h-5 w-5" />
        </button>
        {/* Top actions */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <button onClick={() => { if (navigator.share) { navigator.share({ title: property.title, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background" title="Share">
            <Share2 className="h-4 w-4" />
          </button>
          <button onClick={() => navigate('/login')} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background" title="Save to favorites">
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 bg-foreground/60 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 z-10">
          <Camera className="h-3.5 w-3.5" />
          {currentImage + 1}/{property.images.length}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/buy" className="hover:text-foreground">Buy</Link>
          <span>/</span>
          <span className="text-foreground">{property.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Price Block */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <img src={property.agentLogo} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{property.title.slice(0, 40)}</h1>
                  </div>
                </div>
                {/* Media tabs */}
                <div className="hidden md:flex items-center gap-1 bg-muted/80 rounded-lg p-1 border border-border">
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

              <p className="text-2xl font-bold text-primary mb-2">
                From $ {property.price.toLocaleString()}
              </p>
              <p className="text-foreground/80 mb-2">{property.title}</p>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 text-warm" />
                <span>{property.location}</span>
              </div>

              {/* Specs bar */}
              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Building className="h-4 w-4" />
                  {property.type}
                </span>
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" />
                  {property.area} {property.areaUnit}
                </span>
                <span className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4" />
                  {property.bedrooms} Bedrooms
                </span>
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms} Bathrooms
                </span>
              </div>
            </div>

            {/* Open House / Viewing Hours — compact strip */}
            {(property.openHouseStart || property.viewingHours) && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-warm/5 border border-warm/20 rounded-lg px-4 py-3 text-sm">
                {property.openHouseStart && (
                  <span className="flex items-center gap-1.5 text-foreground">
                    <CalendarDays className="h-4 w-4 text-warm" />
                    <span className="font-medium">Open House:</span> {property.openHouseStart}
                    {property.openHouseEnd && <span className="text-muted-foreground ml-1">— Ends: {property.openHouseEnd}</span>}
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
              <h2 className="text-lg font-bold text-foreground mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <OverviewItem label="Listing ID/Number" value={property.listingId} />
                <OverviewItem label="Type" value={property.type} />
                <OverviewItem label="Price" value={`$ ${property.price.toLocaleString()}`} />
                <OverviewItem label="Area" value={`${property.area} ${property.areaUnit}`} />
                <OverviewItem label="Rooms" value={String(property.bedrooms)} />
                <OverviewItem label="Bathrooms" value={String(property.bathrooms)} />
                <OverviewItem label="Parking Spaces" value={String(property.parkingSpaces)} />
                <OverviewItem label="Floor Level" value={property.floorLevel} />
                <OverviewItem label="Furniture" value={property.furniture} />
                <OverviewItem label="Property Age" value={property.propertyAge} />
                <OverviewItem label="Property Status" value={property.propertyStatus} />
                <OverviewItem label="Orientation & Views" value={property.orientation.join(', ')} />
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Description</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {property.description}
              </div>
            </div>




            {/* Amenities */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Amenities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Interior Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {property.interiorAmenities.map((a) => (
                      <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-2">Exterior Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {property.exteriorAmenities.map((a) => (
                      <span key={a} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Trends - Average Housing Prices */}
            <MarketTrends
              province={property.city || null}
              town={property.city || null}
              neighbourhood={property.location?.split(',')[0]?.trim() || null}
              currency={property.currency}
              areaUnit={property.areaUnit}
              currentProperty={{ price: property.price, area: property.area, purpose: property.listingType === 'buy' ? 'buy' : 'rent' }}
            />

            {/* Price Trends Chart */}
            <PriceTrendsChart
              province={property.city || null}
              town={property.city || null}
              neighbourhood={property.location?.split(',')[0]?.trim() || null}
              currency={property.currency}
              areaUnit={property.areaUnit}
              currentProperty={{ price: property.price, area: property.area, purpose: property.listingType === 'buy' ? 'buy' : 'rent' }}
            />

            {/* ROI Calculator */}
            <ROICalculator
              propertyPrice={property.price}
              propertyArea={property.area}
              province={property.city || null}
              town={property.city || null}
              neighbourhood={property.location?.split(',')[0]?.trim() || null}
              currency={property.currency}
              areaUnit={property.areaUnit}
            />

            {/* Loan Calculator */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Loan Calculator</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Property Value</label>
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
                  <label className="text-xs text-muted-foreground block mb-1">Loan Period</label>
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
                  <label className="text-xs text-muted-foreground block mb-1">Interest Rate</label>
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
                  <label className="text-xs text-muted-foreground block mb-1">Down Payment</label>
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

          {/* Sidebar - Agent Card */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-[120px]">
              {/* Agent info — links to agent profile */}
              <Link to={`/agent/${property.id}`} className="block text-center mb-4 group">
                <img
                  src={property.agentLogo}
                  alt={property.agentName}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-border mx-auto mb-3 group-hover:border-primary transition-colors"
                />
                <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{property.agentName}</h3>
                {property.agentDesignation && (
                  <p className="text-sm text-muted-foreground">{property.agentDesignation}</p>
                )}
              </Link>

              <Button variant="outline" className="w-full mb-3 gap-2">
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>

              {property.agentLanguages && property.agentLanguages.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mb-4">
                  <span className="font-medium text-foreground">Speaks:</span>{' '}
                  {property.agentLanguages.join(', ')}
                </p>
              )}

              {/* Company logo — links to company profile */}
              {property.companyLogo && (
                <Link to={`/company/${property.id}`} className="flex items-center gap-4 py-4 border-t border-border group">
                  <img
                    src={property.companyLogo}
                    alt={property.agentCompany}
                    className="h-14 w-24 rounded-lg object-cover border border-border group-hover:border-primary transition-colors"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{property.agentCompany}</h4>
                    <p className="text-xs text-muted-foreground">Real Estate Brokers</p>
                  </div>
                </Link>
              )}

              <div className="flex items-center justify-center gap-0 border-t border-border pt-3">
                <button className="flex-1 flex items-center justify-center text-primary hover:bg-secondary py-2.5 rounded-lg">
                  <Phone className="h-5 w-5" />
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center text-primary hover:bg-secondary py-2.5 rounded-lg">
                  <Mail className="h-5 w-5" />
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center text-primary hover:bg-secondary py-2.5 rounded-lg">
                  <MessageCircle className="h-5 w-5" />
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
          <h2 className="text-xl font-bold text-foreground mb-6">Similar Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProperties.slice(0, 3).map((p) => (
              <Link key={p.id} to={`/property/${p.id}`}>
                <PropertyCard property={p} />
              </Link>
            ))}
          </div>
        </section>
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

export default PropertyDetailPage;
