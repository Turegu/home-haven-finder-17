import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Send, Handshake, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

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

const PropertyRequestPage = () => {
  const [cms, setCms] = useState<CmsData>({});
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', contactMethod: '',
    enquiryType: '', propertyType: '', city: '', areaStreet: '',
    budget: '', areaSqm: '', rooms: '', bathrooms: '',
    furnishing: '', floorLevel: '', propertyStatus: '', parkingSpace: '',
    viewOrientation: '', interiorAmenities: '', exteriorAmenities: '',
    additionalRequests: '',
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("cms_pages").select("content").eq("page_slug", "property-request").limit(1);
      if (data?.[0]) setCms(((data[0] as any).content?.data) || {});
    };
    fetch();
  }, []);

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const SelectField = ({ label, field, options }: { label: string; field: string; options: string[] }) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}*</label>
      <div className="relative">
        <select
          value={(formData as Record<string, string>)[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );

  const defaultSteps = [
    { icon: FileText, title: 'Fill the form', desc: 'Fill the form with dream home requirements' },
    { icon: Send, title: 'Submit the form', desc: 'Fill the form with dream home requirements' },
    { icon: Handshake, title: 'Get your deal', desc: 'Fill the form with dream home requirements' },
  ];

  const stepsData = cms.steps || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero - CMS controlled */}
      <div
        className="relative h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `url(${cms.bg_image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=600&fit=crop'})`,
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative text-center text-white z-10 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{cms.title || "You Dream it, We Find it"}</h1>
          <p className="text-lg opacity-90 mb-1">{cms.description1 || "You didn't find your dream home you looking for?"}</p>
          <p className="text-lg opacity-90">{cms.description2 || "Let our network of top agents in the country find it for you"}</p>
        </div>
      </div>

      {/* How it Works - CMS controlled */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">{cms.main_title || "How it Works"}</h2>
          <p className="text-muted-foreground">{cms.subtitle || "Handpicked properties by our team"}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {defaultSteps.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-8 text-center">
              {stepsData[i]?.image_url ? (
                <img src={stepsData[i].image_url} alt="" className="w-16 h-16 mx-auto mb-4 object-contain" />
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
          <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Full Name*</label><Input value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Full Name" /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Email*</label><Input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Phone Number*</label><Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" /></div>
            <SelectField label="Preferred Method of Contact" field="contactMethod" options={['Phone', 'Email', 'WhatsApp']} />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">Property Requirement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <SelectField label="Enquiry Type" field="enquiryType" options={['Buy', 'Rent']} />
            <SelectField label="Property Type" field="propertyType" options={['Apartment', 'Villa', 'Office', 'Land', 'Shop']} />
            <SelectField label="City" field="city" options={['Istanbul', 'Antalya', 'Ankara', 'Izmir', 'Bursa']} />
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Area, Street*</label><Input value={formData.areaStreet} onChange={(e) => handleChange('areaStreet', e.target.value)} placeholder="Area, Street" /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Budget*</label><Input value={formData.budget} onChange={(e) => handleChange('budget', e.target.value)} placeholder="Budget" /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Area (M²)*</label><Input value={formData.areaSqm} onChange={(e) => handleChange('areaSqm', e.target.value)} placeholder="Area in m²" /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Rooms*</label><Input value={formData.rooms} onChange={(e) => handleChange('rooms', e.target.value)} placeholder="Rooms" /></div>
            <div><label className="block text-sm font-medium text-foreground mb-1.5">Bathrooms*</label><Input value={formData.bathrooms} onChange={(e) => handleChange('bathrooms', e.target.value)} placeholder="Bathrooms" /></div>
            <SelectField label="Furnishing" field="furnishing" options={['Furnished', 'Semi-Furnished', 'Unfurnished']} />
            <SelectField label="Floor Level" field="floorLevel" options={['Ground', 'Low', 'Mid', 'High', 'Penthouse']} />
            <SelectField label="Property Status" field="propertyStatus" options={['Ready', 'Under Construction', 'Off-Plan']} />
            <SelectField label="Parking Space" field="parkingSpace" options={['0', '1', '2', '3+']} />
            <SelectField label="View & Orientation" field="viewOrientation" options={['Sea View', 'City View', 'Garden View', 'Mountain View']} />
            <SelectField label="Interior Amenities" field="interiorAmenities" options={['Central AC', 'Built-in Wardrobes', 'Fitted Kitchen', 'Walk-in Closet']} />
            <SelectField label="Exterior Amenities" field="exteriorAmenities" options={['Swimming Pool', 'Gym', 'Security', 'Children Play Area', 'Parking']} />
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-6 pb-3 border-b border-border">Additional Requests</h3>
          <Textarea value={formData.additionalRequests} onChange={(e) => handleChange('additionalRequests', e.target.value)} placeholder="Any additional requirements..." className="mb-6" rows={4} />
          <p className="text-sm text-muted-foreground mb-4">
            By Submitting a request, you agree to our{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
          <Button className="w-full md:w-auto px-8">Submit Request</Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PropertyRequestPage;
