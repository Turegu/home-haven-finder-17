/* Property Request Page */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Send, Handshake, ChevronDown, Check, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import AmenitiesPickerDialog from '@/components/company/AmenitiesPickerDialog';

interface CmsData {
  main_title?: string;
  bg_image_url?: string;
  main_image_url?: string;
  logo_image_url?: string;
  title?: string;
  description1?: string;
  description2?: string;
  subtitle?: string;
  steps?: { image_url?: string; title?: string; description?: string }[];
}

const ENQUIRY_TYPES = [
  { value: 'residential_buy', label: 'Residential to Buy' },
  { value: 'residential_rent', label: 'Residential to Rent' },
  { value: 'commercial_buy', label: 'Commercial to Buy' },
  { value: 'commercial_rent', label: 'Commercial to Rent' },
];

const CONTACT_METHODS = ['Phone', 'Email', 'WhatsApp'];

const PropertyRequestPage = () => {
  const [cms, setCms] = useState<CmsData>({});
  const { options: filterOpts, isLoading: filtersLoading } = useFilterOptions("property");

  // Location cascading
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighbourhoods, setNeighbourhoods] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', contactMethod: '',
    enquiryType: '', propertyType: '', province: '', district: '', neighbourhood: '',
    areaStreet: '', budget: '', areaSqm: '',
    rooms: [] as string[], bathrooms: [] as string[],
    furnishing: [] as string[], floorLevel: [] as string[], propertyStatus: [] as string[], parkingSpace: [] as string[],
    viewOrientation: [] as string[], interiorAmenities: [] as string[], exteriorAmenities: [] as string[],
    additionalRequests: '',
  });

  // Fetch CMS + provinces on mount
  useEffect(() => {
    const loadCms = async () => {
      const { data } = await supabase.from("cms_pages").select("content").eq("page_slug", "property-request").limit(1);
      if (data?.[0]) setCms(((data[0] as { content: { data?: Record<string, unknown> } }).content?.data) || {});
    };
    const loadProvinces = async () => {
      const { data } = await supabase.rpc("get_distinct_provinces");
      if (data) setProvinces(data.map((d: { name: string }) => d.name));
    };
    loadCms();
    loadProvinces();
  }, []);

  // Cascade: province → districts
  useEffect(() => {
    if (!formData.province) { setDistricts([]); return; }
    const load = async () => {
      const { data } = await supabase.rpc("get_distinct_districts", { p_province: formData.province });
      if (data) setDistricts(data.map((d: { name: string }) => d.name));
    };
    load();
    setFormData(prev => ({ ...prev, district: '', neighbourhood: '' }));
    setNeighbourhoods([]);
  }, [formData.province]);

  // Cascade: district → neighbourhoods
  useEffect(() => {
    if (!formData.province || !formData.district) { setNeighbourhoods([]); return; }
    const load = async () => {
      const { data } = await supabase.rpc("get_neighborhoods", { p_province: formData.province, p_district: formData.district });
      if (data) setNeighbourhoods(data.map((d: { name: string }) => d.name));
    };
    load();
    setFormData(prev => ({ ...prev, neighbourhood: '' }));
  }, [formData.district]);

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleMulti = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  // Determine which property types to show based on enquiry type
  const propertyTypeOptions = (() => {
    const enquiry = formData.enquiryType;
    if (enquiry === 'residential_buy' || enquiry === 'residential_rent') {
      return filterOpts['residential_property_types'] || [];
    }
    if (enquiry === 'commercial_buy' || enquiry === 'commercial_rent') {
      return filterOpts['commercial_property_types'] || [];
    }
    return [...(filterOpts['residential_property_types'] || []), ...(filterOpts['commercial_property_types'] || [])];
  })();

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.enquiryType || !formData.propertyType || !formData.province || !formData.areaSqm || !formData.budget) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getSession().then(r => ({ data: { user: r.data.session?.user ?? null } }));

      const { error } = await supabase.from("property_requests").insert({
        user_id: user?.id || null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        contact_method: formData.contactMethod || 'Phone',
        enquiry_type: formData.enquiryType,
        property_type: formData.propertyType || null,
        province: formData.province || null,
        district: formData.district || null,
        neighbourhood: formData.neighbourhood || null,
        area_street: formData.areaStreet || null,
        budget: formData.budget || null,
        area_sqm: formData.areaSqm || null,
        rooms: formData.rooms.join(', ') || null,
        bathrooms: formData.bathrooms.join(', ') || null,
        furnishing: formData.furnishing.join(', ') || null,
        floor_level: formData.floorLevel.join(', ') || null,
        property_status: formData.propertyStatus.join(', ') || null,
        parking_space: formData.parkingSpace.join(', ') || null,
        view_orientation: formData.viewOrientation.join(', ') || null,
        interior_amenities: formData.interiorAmenities,
        exterior_amenities: formData.exteriorAmenities,
        additional_requests: formData.additionalRequests || null,
      });

      if (error) throw error;

      toast({ title: "Request submitted!", description: "Your property request has been sent to qualified agencies." });
      // Reset form
      setFormData({
        fullName: '', email: '', phone: '', contactMethod: '',
        enquiryType: '', propertyType: '', province: '', district: '', neighbourhood: '',
        areaStreet: '', budget: '', areaSqm: '',
        rooms: [], bathrooms: [],
        furnishing: [], floorLevel: [], propertyStatus: [], parkingSpace: [],
        viewOrientation: [], interiorAmenities: [], exteriorAmenities: [],
        additionalRequests: '',
      });
    } catch {
      toast({ title: "Error", description: "Failed to submit request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const SelectField = ({ label, field, options, required = false, showAny = true }: { label: string; field: string; options: string[]; required?: boolean; showAny?: boolean }) => {
    const currentValue = (formData as any)[field] ?? '';
    const hasAnyInOptions = options.some(o => o.toLowerCase() === 'any');
    const shouldShowAny = showAny && !hasAnyInOptions;
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">{label}{required && '*'}</label>
        <div className="relative">
          <select
            value={currentValue}
            onChange={(e) => handleChange(field, e.target.value)}
            className={`w-full h-10 rounded-md border border-input bg-background px-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring ${currentValue ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            <option value="" disabled hidden>Select</option>
            {shouldShowAny && <option value="" className="text-foreground">Any</option>}
            {options.map((o) => <option key={o} value={o} className="text-foreground">{o}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    );
  };

  const MultiSelectField = ({ label, field, options }: { label: string; field: string; options: string[] }) => {
    const selected = (formData as any)[field] as string[];
    const [open, setOpen] = useState(false);
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring ${selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              <span className="truncate">
                {selected.length > 0 ? `${selected.length} selected` : 'Select'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
            <div className="max-h-[200px] overflow-y-auto grid grid-cols-2 gap-1">
              {options.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMulti(field, opt)}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded transition-colors text-left ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </div>
                    <span className="line-clamp-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const EnquirySelect = () => {
    const currentValue = formData.enquiryType;
    return (
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Enquiry Type*</label>
        <div className="relative">
          <select
            value={currentValue}
            onChange={(e) => {
              handleChange('enquiryType', e.target.value);
              handleChange('propertyType', '');
            }}
            className={`w-full h-10 rounded-md border border-input bg-background px-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring ${currentValue ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            <option value="" disabled hidden>Select</option>
            {ENQUIRY_TYPES.map((t) => <option key={t.value} value={t.value} className="text-foreground">{t.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
    );
  };


  const defaultSteps = [
    { icon: FileText, title: 'Fill the form', desc: 'Fill the form with dream home requirements' },
    { icon: Send, title: 'Submit the form', desc: 'Your request is sent to qualified agencies' },
    { icon: Handshake, title: 'Get your deal', desc: 'Top agents contact you with matching properties' },
  ];

  const stepsData = cms.steps || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <div
        className="relative h-[280px] md:h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `url(${cms.bg_image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=600&fit=crop'})`,
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-center text-white z-10 px-4">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">{cms.title || "You Dream it, We Find it"}</h1>
          <p className="text-sm sm:text-lg opacity-90 mb-1">{cms.description1 || "You didn't find your dream home you looking for?"}</p>
          <p className="text-sm sm:text-lg opacity-90">{cms.description2 || "Let our network of top agents in the country find it for you"}</p>
        </div>
      </div>

      {/* How it Works */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">{cms.main_title || "How it Works"}</h2>
          <p className="text-muted-foreground">{cms.subtitle || "Handpicked properties by our team"}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {defaultSteps.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-8 text-center">
              {stepsData[i]?.image_url ? (
                <img src={stepsData[i].image_url} alt="" className="w-16 h-16 mx-auto mb-4 object-contain" loading="lazy" />
              ) : (
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
              )}
              <h3 className="font-semibold text-foreground mb-2">{stepsData[i]?.title || title}</h3>
              <p className="text-sm text-muted-foreground">{stepsData[i]?.description || desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl p-6 md:p-10">
          {/* Contact Details */}
          <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Full Name*</label><Input value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Full Name" maxLength={100} /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Email*</label><Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" maxLength={254} /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Phone Number*</label><Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" maxLength={20} /></div>
            <SelectField label="Preferred Method of Contact" field="contactMethod" options={CONTACT_METHODS} />
          </div>

          {/* Property Requirement */}
          <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">Property Requirement</h3>
          {filtersLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading filters...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <EnquirySelect />
              <SelectField label="Property Type" field="propertyType" options={propertyTypeOptions} required showAny={false} />
              <SelectField label="Province / City" field="province" options={provinces} required showAny={false} />
              <SelectField label="District" field="district" options={districts} showAny={false} />
              <SelectField label="Neighbourhood" field="neighbourhood" options={neighbourhoods} showAny={false} />
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Area, Street</label><Input value={formData.areaStreet} onChange={(e) => handleChange('areaStreet', e.target.value)} placeholder="Area, Street" maxLength={300} /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Budget*</label><Input value={formData.budget} onChange={(e) => handleChange('budget', e.target.value)} placeholder="e.g. $100,000 - $200,000" maxLength={100} /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1.5">Area (M²)*</label><Input value={formData.areaSqm} onChange={(e) => handleChange('areaSqm', e.target.value)} placeholder="Area in m²" maxLength={20} /></div>
              <MultiSelectField label="Rooms" field="rooms" options={filterOpts['rooms'] || []} />
              <MultiSelectField label="Bathrooms" field="bathrooms" options={filterOpts['bathrooms'] || []} />
              <MultiSelectField label="Furnishing" field="furnishing" options={filterOpts['furniture'] || []} />
              <MultiSelectField label="Floor Level" field="floorLevel" options={filterOpts['floor_level'] || []} />
              <MultiSelectField label="Property Status" field="propertyStatus" options={filterOpts['property_status'] || []} />
              <MultiSelectField label="Parking Space" field="parkingSpace" options={filterOpts['parking'] || []} />
              <MultiSelectField label="View & Orientation" field="viewOrientation" options={[...(filterOpts['views'] || []), ...(filterOpts['orientation'] || [])]} />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Amenities</label>
                <AmenitiesPickerDialog
                  interiorOptions={filterOpts['interior_amenities'] || []}
                  exteriorOptions={filterOpts['exterior_amenities'] || []}
                  selectedInterior={formData.interiorAmenities}
                  selectedExterior={formData.exteriorAmenities}
                  onToggleInterior={(v) => toggleMulti('interiorAmenities', v)}
                  onToggleExterior={(v) => toggleMulti('exteriorAmenities', v)}
                />
              </div>
            </div>
          )}

          {/* Additional */}
          <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">Additional Requests</h3>
          <Textarea value={formData.additionalRequests} onChange={(e) => handleChange('additionalRequests', e.target.value)} placeholder="Any additional requirements..." className="mb-6" rows={4} maxLength={2000} />
          <p className="text-sm text-muted-foreground mb-4">
            By Submitting a request, you agree to our{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
          <Button className="w-full md:w-auto px-8" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : 'Submit Request'}
          </Button>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="container mx-auto px-4 pb-8">
        <BannerDisplay pageName="property-request" bannerType="horizontal" className="" />
      </div>

      <Footer />
    </div>
  );
};

export default PropertyRequestPage;
