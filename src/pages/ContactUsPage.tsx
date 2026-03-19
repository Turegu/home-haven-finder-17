import { useState, useEffect } from "react";
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
  <svg viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Sky gradient */}
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(174, 60%, 90%)" />
        <stop offset="100%" stopColor="hsl(174, 30%, 97%)" />
      </linearGradient>
      <linearGradient id="buildingGrad1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(174, 100%, 29%)" />
        <stop offset="100%" stopColor="hsl(174, 80%, 22%)" />
      </linearGradient>
      <linearGradient id="buildingGrad2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(174, 60%, 40%)" />
        <stop offset="100%" stopColor="hsl(174, 50%, 30%)" />
      </linearGradient>
      <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(174, 30%, 85%)" />
        <stop offset="100%" stopColor="hsl(174, 20%, 92%)" />
      </linearGradient>
    </defs>
    <rect width="800" height="400" fill="url(#skyGrad)" />

    {/* Clouds */}
    <ellipse cx="150" cy="80" rx="60" ry="20" fill="white" opacity="0.6" />
    <ellipse cx="170" cy="75" rx="40" ry="15" fill="white" opacity="0.5" />
    <ellipse cx="600" cy="60" rx="50" ry="18" fill="white" opacity="0.5" />
    <ellipse cx="620" cy="55" rx="35" ry="12" fill="white" opacity="0.4" />

    {/* Sun */}
    <circle cx="680" cy="70" r="35" fill="hsl(36, 70%, 55%)" opacity="0.3" />
    <circle cx="680" cy="70" r="25" fill="hsl(36, 70%, 65%)" opacity="0.5" />

    {/* Ground */}
    <rect x="0" y="310" width="800" height="90" fill="url(#groundGrad)" />

    {/* Far buildings */}
    <rect x="50" y="200" width="45" height="110" rx="2" fill="hsl(174, 40%, 70%)" opacity="0.5" />
    <rect x="100" y="230" width="35" height="80" rx="2" fill="hsl(174, 40%, 65%)" opacity="0.5" />
    <rect x="620" y="210" width="40" height="100" rx="2" fill="hsl(174, 40%, 70%)" opacity="0.5" />
    <rect x="670" y="240" width="50" height="70" rx="2" fill="hsl(174, 40%, 65%)" opacity="0.5" />

    {/* Main building left */}
    <rect x="180" y="140" width="80" height="170" rx="3" fill="url(#buildingGrad1)" />
    {[0,1,2,3,4,5].map(r => [0,1,2].map(c => (
      <rect key={`wl-${r}-${c}`} x={192 + c * 22} y={155 + r * 25} width="14" height="10" rx="1" fill="hsl(174, 80%, 85%)" opacity="0.7" />
    )))}

    {/* Main building center (tall) */}
    <rect x="310" y="100" width="100" height="210" rx="3" fill="url(#buildingGrad2)" />
    <rect x="340" y="90" width="40" height="15" rx="2" fill="hsl(174, 50%, 35%)" />
    {[0,1,2,3,4,5,6].map(r => [0,1,2,3].map(c => (
      <rect key={`wc-${r}-${c}`} x={320 + c * 22} y={115 + r * 25} width="14" height="10" rx="1" fill="hsl(174, 60%, 80%)" opacity="0.7" />
    )))}

    {/* Main building right */}
    <rect x="460" y="170" width="70" height="140" rx="3" fill="url(#buildingGrad1)" />
    {[0,1,2,3,4].map(r => [0,1,2].map(c => (
      <rect key={`wr-${r}-${c}`} x={470 + c * 20} y={185 + r * 25} width="12" height="10" rx="1" fill="hsl(174, 80%, 85%)" opacity="0.7" />
    )))}

    {/* Trees */}
    {[140, 280, 540, 700].map((tx, i) => (
      <g key={`tree-${i}`}>
        <rect x={tx + 6} y="280" width="6" height="30" fill="hsl(30, 30%, 50%)" />
        <ellipse cx={tx + 9} cy="270" rx="18" ry="22" fill="hsl(150, 40%, 45%)" opacity="0.8" />
        <ellipse cx={tx + 9} cy="265" rx="14" ry="16" fill="hsl(150, 45%, 55%)" opacity="0.7" />
      </g>
    ))}

    {/* Road */}
    <rect x="0" y="310" width="800" height="12" fill="hsl(0, 0%, 75%)" opacity="0.5" />
    {[0,1,2,3,4,5,6,7,8,9].map(i => (
      <rect key={`dash-${i}`} x={20 + i * 80} y="314" width="40" height="4" rx="2" fill="white" opacity="0.6" />
    ))}

    {/* Envelope icon floating */}
    <g transform="translate(380, 50)" opacity="0.8">
      <rect x="-20" y="-12" width="40" height="24" rx="3" fill="hsl(36, 70%, 55%)" />
      <path d="M-18 -10 L0 4 L18 -10" stroke="white" strokeWidth="2" fill="none" />
    </g>

    {/* Chat bubbles */}
    <g transform="translate(560, 130)" opacity="0.6">
      <rect x="0" y="0" width="50" height="30" rx="12" fill="hsl(174, 100%, 29%)" />
      <circle cx="15" cy="15" r="3" fill="white" opacity="0.8" />
      <circle cx="25" cy="15" r="3" fill="white" opacity="0.8" />
      <circle cx="35" cy="15" r="3" fill="white" opacity="0.8" />
    </g>
    <g transform="translate(200, 100)" opacity="0.5">
      <rect x="0" y="0" width="40" height="25" rx="10" fill="hsl(36, 70%, 55%)" />
      <circle cx="12" cy="12" r="2.5" fill="white" opacity="0.8" />
      <circle cx="20" cy="12" r="2.5" fill="white" opacity="0.8" />
      <circle cx="28" cy="12" r="2.5" fill="white" opacity="0.8" />
    </g>

    {/* People silhouettes */}
    <g transform="translate(350, 290)" opacity="0.6">
      <circle cx="0" cy="-10" r="5" fill="hsl(174, 60%, 30%)" />
      <rect x="-4" y="-5" width="8" height="18" rx="3" fill="hsl(174, 60%, 30%)" />
    </g>
    <g transform="translate(370, 292)" opacity="0.5">
      <circle cx="0" cy="-10" r="4.5" fill="hsl(36, 50%, 45%)" />
      <rect x="-3.5" y="-5" width="7" height="16" rx="3" fill="hsl(36, 50%, 45%)" />
    </g>
  </svg>
);

const ContactUsPage = () => {
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
      toast({ title: "Please fill in all required fields", variant: "destructive" });
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
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Message sent!", description: "We'll get back to you soon." });
      setForm({ name: "", email: "", phone: "", subject: "General Inquiries", message: "" });
    }
  };

  const infoCards = [
    {
      icon: Phone,
      title: "Phone Number",
      value: settings.sales_phone || "Not set",
      link: settings.sales_phone ? `tel:${settings.sales_phone}` : undefined,
    },
    {
      icon: Mail,
      title: "Email",
      value: settings.sales_email || "Not set",
      link: settings.sales_email ? `mailto:${settings.sales_email}` : undefined,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: settings.sales_whatsapp || "Not set",
      link: settings.sales_whatsapp
        ? `https://wa.me/${settings.sales_whatsapp.replace(/[^0-9+]/g, "")}`
        : undefined,
    },
  ];

  const subjectOptions = [
    "General Inquiries",
    "Property Inquiry",
    "Partnership",
    "Advertising",
    "Technical Support",
    "Other",
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
                Get in Touch
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Let's Build Something
                <br />
                <span className="text-primary">Great Together</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto lg:mx-0">
                Have a question or want to work with us? We'd love to hear from you.
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
