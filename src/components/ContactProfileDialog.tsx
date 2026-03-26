import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from "react-i18next";
import { INBOX_TYPES } from '@/constants/inbox';

interface ContactProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientLogo?: string | null;
  companyId: string | null;
  agentId: string | null;
  recipientType: 'company' | 'agent';
}

const ContactProfileDialog = ({ open, onOpenChange, recipientName, recipientLogo, companyId, agentId, recipientType }: ContactProfileDialogProps) => {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState('email');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Deterministic success close flow
  useEffect(() => {
    if (!open || !sent) return;
    const timer = window.setTimeout(() => {
      onOpenChange(false);
      setSent(false);
      setSending(false);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [open, sent, onOpenChange]);

  useEffect(() => {
    if (open) {
      setSent(false);
      setTopic('');
      setMessage('');
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
  }, [open]);

  const handleSend = async () => {
    if (!topic.trim()) { toast.error('Please enter a topic.'); return; }
    if (!message.trim()) { toast.error('Please enter a message.'); return; }
    if (!fullName.trim() || !email.trim()) { toast.error('Please fill in your name and email.'); return; }
    if (!acceptTerms) { toast.error('Please accept the Terms & Conditions.'); return; }

    setSending(true);
    try {
      // Save to user_inquiries (non-critical — don't block on failure)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_inquiries').insert({
            user_id: user.id,
            company_id: companyId,
            agent_id: agentId,
            inquiry_type: 'email',
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            message: `[${topic.trim()}]\n\n${message.trim()}\n\n[Preferred contact: ${preferredContact}]`,
          } as any);
        }
      } catch (e) {
        console.warn('user_inquiries insert skipped:', e);
      }

      // Route to company inbox
      let inboxCompanyId = companyId;
      if (!inboxCompanyId && agentId) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('company_id')
          .eq('id', agentId)
          .maybeSingle();
        inboxCompanyId = agentData?.company_id || null;
      }

      if (!inboxCompanyId) {
        throw new Error('No company recipient found');
      }

      const { error: inboxError } = await (supabase as any).rpc('submit_company_inbox_message', {
        p_company_id: inboxCompanyId,
        p_full_name: fullName.trim(),
        p_email: email.trim(),
        p_agent_id: agentId || null,
        p_phone: phone.trim() || null,
        p_message: `[${topic.trim()}]\n\n${message.trim()}\n\n[Preferred contact: ${preferredContact}]`,
        p_inbox_type: 'message',
      });

      if (inboxError) throw inboxError;

      toast.success('Message sent successfully');
      setSent(true);

      // Send email notification (fire-and-forget)
      void supabase.functions.invoke('send-inquiry-notification', {
        body: {
          sender_name: fullName.trim(),
          sender_email: email.trim(),
          sender_phone: phone.trim() || undefined,
          preferred_contact: preferredContact,
          message: `[${topic.trim()}]\n\n${message.trim()}`,
          agent_id: agentId || undefined,
          company_id: inboxCompanyId,
          listing_type: 'profile',
        },
      }).catch(console.error);
    } catch (err) {
      console.error('ContactProfileDialog send error:', err);
      toast.error('Something went wrong. Please try again.');
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="h-16 w-16 rounded-full border-2 border-primary flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t("contact.thankYou")}</h3>
            <p className="text-sm text-muted-foreground">{t("contact.messageOnItsWay")}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {recipientLogo && (
              <img
                src={recipientLogo}
                alt={recipientName}
                className="h-10 w-10 rounded-lg object-contain border border-border flex-shrink-0"
              />
            )}
            <DialogTitle>Email {recipientName}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Topic */}
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("contact.topicRequired")}
            maxLength={200}
          />

          {/* Message */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="resize-none"
            placeholder={t("contact.writeMessage")}
            maxLength={2000}
          />

          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("contact.fullNameRequired")}
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
                  <RadioGroupItem value="email" id="profile-pref-email" />
                  <Label htmlFor="profile-pref-email" className="text-xs">Email</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="phone" id="profile-pref-phone" />
                  <Label htmlFor="profile-pref-phone" className="text-xs">Phone</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem value="whatsapp" id="profile-pref-whatsapp" />
                  <Label htmlFor="profile-pref-whatsapp" className="text-xs">WhatsApp</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="profile-accept-terms"
              checked={acceptTerms}
              onCheckedChange={(v) => setAcceptTerms(v === true)}
            />
            <Label htmlFor="profile-accept-terms" className="text-sm text-muted-foreground">
              I accept the Terms & Conditions.
            </Label>
          </div>

          {/* Send */}
          <Button className="w-full" onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactProfileDialog;
