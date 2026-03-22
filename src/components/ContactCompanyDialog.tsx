import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building, Maximize, Bath, BedDouble, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectUnitOption {
  id: string;
  unit_name: string;
  unit_type: string;
  price: number | null;
  currency: string | null;
  rooms: string | null;
  area: number | null;
  area_unit: string | null;
}

interface ContactCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    id: string;
    title: string;
    location: string;
    type: string;
    area: number;
    areaUnit: string;
    bathrooms: number;
    bedrooms: number;
    price: number;
    currency: string;
    images: string[];
    listingId?: string;
    floorLevel?: string;
    rooms?: string;
  };
  companyId: string | null;
  agentId: string | null;
  companyName?: string;
  listingType?: 'property' | 'project' | 'event';
  projectUnits?: ProjectUnitOption[];
}

const ContactCompanyDialog = ({ open, onOpenChange, property, companyId, agentId, companyName, listingType = 'property', projectUnits }: ContactCompanyDialogProps) => {
  const defaultMessages: Record<string, string> = {
    property: 'Hi!, I am interested in your property please contact me.',
    project: 'Hi!, I am interested in your project please contact me.',
    event: 'Hi!, I am interested in your event please contact me.',
  };
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(defaultMessages[listingType]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState('email');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  useEffect(() => {
    if (open) {
      setSent(false);
      setSelectedUnitId('');
      setMessage(defaultMessages[listingType]);
      const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone')
            .eq('user_id', user.id)
            .maybeSingle();
          if (profile) {
            setFullName([profile.first_name, profile.last_name].filter(Boolean).join(' '));
            setPhone(profile.phone || '');
          }
        }
      };
      loadUser();
    }
  }, [open, listingType]);

  // Update message when unit selection changes
  useEffect(() => {
    if (listingType === 'project' && selectedUnitId && projectUnits) {
      const unit = projectUnits.find(u => u.id === selectedUnitId);
      if (unit) {
        setMessage(`Hi!, I am interested in unit "${unit.unit_name}" (${unit.unit_type}${unit.price ? `, ${unit.currency || '$'}${unit.price.toLocaleString()}` : ''}) in your project, please contact me.`);
      }
    } else if (listingType === 'project' && !selectedUnitId) {
      setMessage(defaultMessages['project']);
    }
  }, [selectedUnitId, projectUnits, listingType]);

  const handleSend = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error('Please fill in your name and email.');
      return;
    }
    if (!acceptTerms) {
      toast.error('Please accept the Terms & Conditions.');
      return;
    }
    setSending(true);
    const selectedUnit = projectUnits?.find(u => u.id === selectedUnitId);
    const unitSuffix = selectedUnit ? `\n[Interested in unit: ${selectedUnit.unit_name} (${selectedUnit.unit_type})]` : '';
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const inquiryData: any = {
          user_id: user.id,
          company_id: companyId,
          agent_id: agentId,
          inquiry_type: 'email',
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: `${message}${unitSuffix}\n\n[Preferred contact: ${preferredContact}]`,
        };
        if (listingType === 'property') inquiryData.property_id = property.id;
        else if (listingType === 'project') inquiryData.project_id = property.id;
        await supabase.from('user_inquiries').insert(inquiryData);
      }

      if (companyId) {
        const inboxData: any = {
          company_id: companyId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: `${message}${unitSuffix}\n\n[Preferred contact: ${preferredContact}]`,
          inbox_type: `${listingType}_inquiry`,
        };
        if (listingType === 'property') inboxData.property_id = property.id;
        else if (listingType === 'project') inboxData.project_id = property.id;
        await supabase.from('company_inbox').insert(inboxData);
      }

      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'USD') return `$ ${price.toLocaleString()}`;
    if (currency === 'EUR') return `€ ${price.toLocaleString()}`;
    if (currency === 'TRY') return `₺ ${price.toLocaleString()}`;
    return `${currency} ${price.toLocaleString()}`;
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-16 w-16 rounded-full border-2 border-primary flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Thank you</h3>
            <p className="text-sm text-muted-foreground">Your message is on its way</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email {companyName || 'company'}</DialogTitle>
        </DialogHeader>

        {/* Property summary */}
        <div className="flex gap-3 p-3 bg-muted/50 rounded-lg border border-border">
          <img
            src={property.images[0] || '/placeholder.svg'}
            alt={property.title}
            className="w-28 h-20 rounded-md object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm line-clamp-1">{property.title}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
              <span className="line-clamp-2">{property.location}</span>
            </div>
            {listingType === 'property' && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {property.type}</span>
                {property.floorLevel && <span className="flex items-center gap-1">≡ {property.floorLevel}</span>}
                <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {property.area} {property.areaUnit}</span>
                <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {property.bathrooms}</span>
                <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> {property.rooms || property.bedrooms}</span>
              </div>
            )}
            {listingType === 'project' && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {property.type}</span>
              </div>
            )}
            {listingType === 'event' && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {property.type}</span>
              </div>
            )}
            <p className="font-bold text-foreground text-sm mt-1.5">{formatPrice(property.price, property.currency)}</p>
          </div>
        </div>

        {/* Message */}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="resize-none"
          placeholder="Write your message..."
        />

        {/* Name & Email */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name *"
          />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email *"
            type="email"
          />
        </div>

        {/* Phone & Preferred contact */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter Phone Number *"
          />
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Preferred Method of Contact *</p>
            <RadioGroup value={preferredContact} onValueChange={setPreferredContact} className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="email" id="pref-email" />
                <Label htmlFor="pref-email" className="text-xs">Email</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="phone" id="pref-phone" />
                <Label htmlFor="pref-phone" className="text-xs">Phone</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="whatsapp" id="pref-whatsapp" />
                <Label htmlFor="pref-whatsapp" className="text-xs">WhatsApp</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="accept-terms"
            checked={acceptTerms}
            onCheckedChange={(v) => setAcceptTerms(v === true)}
          />
          <Label htmlFor="accept-terms" className="text-sm text-muted-foreground">
            I accept the Terms & Conditions.
          </Label>
        </div>

        {/* Send */}
        <Button
          className="w-full"
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ContactCompanyDialog;
