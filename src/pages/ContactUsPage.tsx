import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, Mail, MessageCircle, Send, User, AtSign,
  PhoneCall, MessageSquareText
} from "lucide-react";

const HeroIllustration = () => (
  <svg viewBox="0 0 800 420" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="800" y2="420">
        <stop offset="0%" stopColor="hsl(174, 50%, 95%)" />
        <stop offset="100%" stopColor="hsl(174, 30%, 90%)" />
      </linearGradient>
      <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(174, 100%, 29%)" />
        <stop offset="100%" stopColor="hsl(174, 80%, 22%)" />
      </linearGradient>
      <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(174, 60%, 85%)" />
        <stop offset="100%" stopColor="hsl(174, 40%, 92%)" />
      </linearGradient>
    </defs>
    <rect width="800" height="420" fill="url(#bgGrad)" />

    {/* Decorative circles background */}
    <circle cx="120" cy="80" r="40" fill="hsl(174, 100%, 29%)" opacity="0.06" />
    <circle cx="700" cy="100" r="55" fill="hsl(36, 70%, 55%)" opacity="0.08" />
    <circle cx="650" cy="350" r="35" fill="hsl(174, 100%, 29%)" opacity="0.05" />

    {/* ---- PERSON (center) ---- */}
    {/* Chair */}
    <rect x="355" y="310" width="90" height="12" rx="6" fill="hsl(174, 60%, 35%)" />
    <rect x="370" y="322" width="8" height="40" rx="3" fill="hsl(174, 50%, 40%)" />
    <rect x="422" y="322" width="8" height="40" rx="3" fill="hsl(174, 50%, 40%)" />
    <rect x="358" y="360" width="84" height="6" rx="3" fill="hsl(174, 50%, 40%)" />
    <ellipse cx="400" cy="290" rx="42" ry="30" fill="hsl(174, 60%, 35%)" />

    {/* Body */}
    <rect x="375" y="230" width="50" height="70" rx="20" fill="hsl(36, 70%, 55%)" />
    {/* Arms */}
    <rect x="350" y="245" width="25" height="12" rx="6" fill="hsl(36, 60%, 50%)" />
    <rect x="425" y="245" width="25" height="12" rx="6" fill="hsl(36, 60%, 50%)" />
    {/* Hands on desk */}
    <circle cx="345" cy="252" r="7" fill="hsl(28, 50%, 70%)" />
    <circle cx="455" cy="252" r="7" fill="hsl(28, 50%, 70%)" />

    {/* Head */}
    <circle cx="400" cy="200" r="28" fill="hsl(28, 50%, 70%)" />
    {/* Hair */}
    <ellipse cx="400" cy="182" rx="30" ry="16" fill="hsl(30, 30%, 30%)" />
    {/* Eyes */}
    <circle cx="391" cy="200" r="2.5" fill="hsl(0, 0%, 20%)" />
    <circle cx="409" cy="200" r="2.5" fill="hsl(0, 0%, 20%)" />
    {/* Smile */}
    <path d="M393 210 Q400 216 407 210" stroke="hsl(0,0%,20%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

    {/* Headset */}
    <path d="M370 195 Q370 168 400 168 Q430 168 430 195" stroke="hsl(174, 100%, 29%)" strokeWidth="4" fill="none" strokeLinecap="round" />
    <rect x="364" y="192" width="10" height="16" rx="5" fill="hsl(174, 100%, 29%)" />
    <rect x="426" y="192" width="10" height="16" rx="5" fill="hsl(174, 100%, 29%)" />
    {/* Mic arm */}
    <path d="M366 208 Q360 220 370 226" stroke="hsl(174, 80%, 35%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <circle cx="372" cy="227" r="4" fill="hsl(174, 100%, 29%)" />

    {/* ---- DESK ---- */}
    <rect x="260" y="260" width="280" height="14" rx="4" fill="url(#deskGrad)" />
    {/* Desk legs */}
    <rect x="275" y="274" width="8" height="50" rx="2" fill="hsl(174, 80%, 25%)" />
    <rect x="517" y="274" width="8" height="50" rx="2" fill="hsl(174, 80%, 25%)" />

    {/* ---- MONITOR ---- */}
    <rect x="310" y="150" width="130" height="90" rx="6" fill="hsl(0, 0%, 25%)" />
    <rect x="315" y="155" width="120" height="80" rx="3" fill="url(#screenGrad)" />
    {/* Screen content lines */}
    <rect x="330" y="175" width="50" height="4" rx="2" fill="hsl(174, 100%, 29%)" opacity="0.5" />
    <rect x="330" y="185" width="70" height="3" rx="1.5" fill="hsl(174, 60%, 50%)" opacity="0.3" />
    <rect x="330" y="193" width="60" height="3" rx="1.5" fill="hsl(174, 60%, 50%)" opacity="0.3" />
    <rect x="330" y="201" width="40" height="3" rx="1.5" fill="hsl(174, 60%, 50%)" opacity="0.3" />
    {/* Screen chat avatar */}
    <circle cx="410" cy="185" r="10" fill="hsl(174, 100%, 29%)" opacity="0.3" />
    <circle cx="410" cy="182" r="4" fill="white" opacity="0.5" />
    <rect x="404" y="188" width="12" height="6" rx="3" fill="white" opacity="0.5" />
    {/* Monitor stand */}
    <rect x="365" y="240" width="20" height="20" rx="2" fill="hsl(0, 0%, 30%)" />
    <rect x="350" y="256" width="50" height="5" rx="2" fill="hsl(0, 0%, 35%)" />

    {/* ---- KEYBOARD ---- */}
    <rect x="340" y="265" width="70" height="8" rx="3" fill="hsl(0, 0%, 40%)" />
    {[0,1,2,3,4,5].map(i => (
      <rect key={`key-${i}`} x={345 + i * 10} y="267" width="6" height="4" rx="1" fill="hsl(0, 0%, 55%)" />
    ))}

    {/* ---- COFFEE MUG ---- */}
    <rect x="470" y="242" width="18" height="18" rx="3" fill="hsl(36, 70%, 55%)" />
    <path d="M488 248 Q496 248 496 254 Q496 260 488 260" stroke="hsl(36, 60%, 45%)" strokeWidth="2" fill="none" />
    {/* Steam */}
    <path d="M475 238 Q477 230 479 238" stroke="hsl(0,0%,60%)" strokeWidth="1" fill="none" opacity="0.5" />
    <path d="M481 236 Q483 228 485 236" stroke="hsl(0,0%,60%)" strokeWidth="1" fill="none" opacity="0.4" />

    {/* ---- PHONE on desk ---- */}
    <rect x="280" y="248" width="22" height="14" rx="3" fill="hsl(174, 80%, 25%)" />
    <rect x="283" y="250" width="16" height="8" rx="1" fill="hsl(174, 60%, 70%)" opacity="0.5" />

    {/* ---- CHAT BUBBLES floating ---- */}
    {/* Right bubble */}
    <g>
      <rect x="560" y="130" width="120" height="50" rx="18" fill="hsl(174, 100%, 29%)" opacity="0.9" />
      <text x="585" y="152" fontSize="10" fill="white" fontFamily="sans-serif" opacity="0.9">How can I</text>
      <text x="585" y="166" fontSize="10" fill="white" fontFamily="sans-serif" opacity="0.9">help you?</text>
      <polygon points="575,180 585,175 580,190" fill="hsl(174, 100%, 29%)" opacity="0.9" />
    </g>

    {/* Left bubble */}
    <g>
      <rect x="100" y="160" width="110" height="45" rx="16" fill="hsl(36, 70%, 55%)" opacity="0.85" />
      <text x="122" y="180" fontSize="10" fill="white" fontFamily="sans-serif" opacity="0.9">I need info</text>
      <text x="122" y="193" fontSize="10" fill="white" fontFamily="sans-serif" opacity="0.9">about a listing</text>
      <polygon points="200,205 190,200 205,215" fill="hsl(36, 70%, 55%)" opacity="0.85" />
    </g>

    {/* Top small bubble */}
    <g>
      <rect x="500" y="60" width="80" height="35" rx="14" fill="hsl(174, 80%, 40%)" opacity="0.6" />
      <circle cx="525" cy="77" r="3" fill="white" opacity="0.7" />
      <circle cx="535" cy="77" r="3" fill="white" opacity="0.7" />
      <circle cx="545" cy="77" r="3" fill="white" opacity="0.7" />
    </g>

    {/* ---- SMALL PEOPLE silhouettes (callers) ---- */}
    {/* Left person */}
    <g transform="translate(140, 260)" opacity="0.6">
      <circle cx="0" cy="-15" r="12" fill="hsl(174, 50%, 45%)" />
      <rect x="-10" y="-3" width="20" height="35" rx="8" fill="hsl(174, 50%, 45%)" />
      {/* Phone to ear */}
      <rect x="10" y="-18" width="6" height="14" rx="3" fill="hsl(0, 0%, 30%)" />
    </g>

    {/* Right person */}
    <g transform="translate(660, 240)" opacity="0.6">
      <circle cx="0" cy="-15" r="12" fill="hsl(36, 55%, 50%)" />
      <rect x="-10" y="-3" width="20" height="35" rx="8" fill="hsl(36, 55%, 50%)" />
      {/* Phone to ear */}
      <rect x="-16" y="-18" width="6" height="14" rx="3" fill="hsl(0, 0%, 30%)" />
    </g>

    {/* ---- SIGNAL WAVES from headset ---- */}
    <path d="M440 180 Q455 175 450 160" stroke="hsl(174, 100%, 29%)" strokeWidth="1.5" fill="none" opacity="0.3" />
    <path d="M445 178 Q462 170 458 152" stroke="hsl(174, 100%, 29%)" strokeWidth="1.5" fill="none" opacity="0.2" />
    <path d="M360 180 Q345 175 350 160" stroke="hsl(174, 100%, 29%)" strokeWidth="1.5" fill="none" opacity="0.3" />

    {/* ---- FLOOR ---- */}
    <rect x="0" y="370" width="800" height="50" fill="hsl(174, 20%, 88%)" />
    <rect x="200" y="370" width="400" height="3" rx="1.5" fill="hsl(174, 30%, 80%)" opacity="0.5" />

    {/* ---- PLANT ---- */}
    <rect x="570" y="300" width="12" height="30" rx="4" fill="hsl(30, 30%, 50%)" />
    <ellipse cx="576" cy="290" rx="18" ry="20" fill="hsl(150, 45%, 40%)" opacity="0.8" />
    <ellipse cx="576" cy="284" rx="14" ry="14" fill="hsl(150, 50%, 50%)" opacity="0.7" />
    <rect x="564" y="330" width="24" height="10" rx="4" fill="hsl(30, 25%, 55%)" />
  </svg>
);

const ContactUsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiries",
    message: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value");
      if (data) {
        const map: Record<string, string> = {};
        (data as any[]).forEach((d: any) => {
          map[d.setting_key] = d.setting_value;
        });
        setSettings(map);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: t('pages.contact.fillRequired'), variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("company_inbox").insert({
      company_id: "00000000-0000-0000-0000-000000000000",
      full_name: form.name,
      email: form.email,
      phone: form.phone || null,
      message: `[${form.subject}] ${form.message}`,
      inbox_type: "message",
    });
    setSending(false);
    if (error) {
      toast({ title: t('pages.contact.failedToSend'), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t('pages.contact.messageSent'), description: t('pages.contact.wellGetBack') });
      setForm({ name: "", email: "", phone: "", subject: t('pages.contact.generalInquiries'), message: "" });
    }
  };

  const infoCards = [
    {
      icon: Phone,
      title: t('pages.contact.phoneNumber'),
      value: settings.sales_phone,
      link: settings.sales_phone ? `tel:${settings.sales_phone}` : undefined,
    },
    {
      icon: Mail,
      title: t('pages.contact.email'),
      value: settings.sales_email,
      link: settings.sales_email ? `mailto:${settings.sales_email}` : undefined,
    },
    {
      icon: MessageCircle,
      title: t('pages.contact.whatsapp'),
      value: settings.sales_whatsapp,
      link: settings.sales_whatsapp
        ? `https://wa.me/${settings.sales_whatsapp.replace(/[^0-9+]/g, "")}`
        : undefined,
    },
  ].filter((card) => card.value && card.value.trim() !== "");

  const subjectOptions = [
    { key: "generalInquiries", label: t('pages.contact.generalInquiries') },
    { key: "propertyInquiry", label: t('pages.contact.propertyInquiry') },
    { key: "partnership", label: t('pages.contact.partnership') },
    { key: "advertising", label: t('pages.contact.advertising') },
    { key: "technicalSupport", label: t('pages.contact.technicalSupport') },
    { key: "other", label: t('pages.contact.other') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Illustration */}
      <section className="relative overflow-hidden pt-20 lg:pt-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12 lg:py-16">
            <div className="space-y-5 text-center lg:text-left">
              <span className="inline-block text-sm font-semibold tracking-widest uppercase text-primary">
                {t('pages.contact.getInTouch')}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {t('pages.contact.letsBuild')}
                <br />
                <span className="text-primary">{t('pages.contact.greatTogether')}</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto lg:mx-0">
                {t('pages.contact.haveQuestion')}
              </p>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-border/50">
                <HeroIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {infoCards.map((card) => (
              <a
                key={card.title}
                href={card.link}
                className={`group bg-card border border-border rounded-xl p-6 transition-all hover:shadow-lg hover:border-primary/30 ${
                  card.link ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-primary mb-1">{card.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{card.value}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground mt-2">
              If you have any questions or comments, we'd love to hear from you
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-6 md:p-10 space-y-6 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1.5 text-sm font-medium">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5 text-sm font-medium">
                  <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium">
                  <PhoneCall className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  placeholder="+1234567890"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="flex items-center gap-1.5 text-sm font-medium">
                  <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
                  Subject
                </Label>
                <select
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {subjectOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-1.5 text-sm font-medium">
                <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Tell us how we can help..."
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={sending} className="w-full md:w-auto gap-2">
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUsPage;
