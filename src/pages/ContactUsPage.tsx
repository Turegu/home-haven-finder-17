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
  MapPin, Phone, Mail, MessageCircle, Send, User, AtSign,
  PhoneCall, MessageSquareText
} from "lucide-react";

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

    // Store in company_inbox as a general inquiry to admin
    const { error } = await supabase.from("company_inbox").insert({
      company_id: "00000000-0000-0000-0000-000000000000", // placeholder for admin
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
      icon: MapPin,
      title: "Address",
      value: settings.sales_address || "Not set",
      link: settings.sales_address
        ? `http://maps.google.com/?q=${encodeURIComponent(settings.sales_address)}`
        : undefined,
    },
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

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto lg:mx-0 lg:ml-auto lg:mr-[10%]">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Convinced yet? Let's make
              <br />
              something great together.
            </h1>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infoCards.map((card) => (
              <a
                key={card.title}
                href={card.link}
                target={card.title === "Address" ? "_blank" : undefined}
                rel={card.title === "Address" ? "noopener noreferrer" : undefined}
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
              {/* Name */}
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

              {/* Email */}
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

              {/* Phone */}
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

              {/* Subject */}
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
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
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
