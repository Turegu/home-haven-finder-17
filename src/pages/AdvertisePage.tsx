import SEOHead from '@/components/SEOHead';
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle, Users, Home, FolderKanban, CalendarDays,
  Search, Image, MessageSquare, Building2,
  Briefcase, Zap, Star, Crown
} from "lucide-react";

const packageIcons: Record<string, React.ElementType> = {
  basic: Briefcase,
  lite: Zap,
  plus: Star,
  pro: Crown,
};

const AdvertisePage = () => {
  const { t } = useTranslation();
  const formRef = useRef<HTMLDivElement>(null);
  const [highlightForm, setHighlightForm] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    const win = window as Window & { onTurnstileSuccess?: (token: string) => void };
    win.onTurnstileSuccess = (token: string) => setTurnstileToken(token);
    return () => {
      document.head.removeChild(script);
      delete win.onTurnstileSuccess;
    };
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightForm(true);
    setTimeout(() => setHighlightForm(false), 2000);
  };
  const [form, setForm] = useState({
    company_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: packages, isLoading: packagesLoading, isError: packagesError } = useQuery({
    queryKey: ["membership-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_packages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error(t('pages.advertise.acceptTermsError'));
      return;
    }
    if (!turnstileToken) {
      toast.error(t('pages.advertise.completeVerification'));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("advertising_requests").insert({
      company_name: form.company_name,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      message: form.message || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t('pages.advertise.failedToSubmit'));
    } else {
      toast.success(t('pages.advertise.requestSubmitted'));
      setForm({ company_name: "", first_name: "", last_name: "", email: "", phone: "", message: "" });
      setAgreed(false);
      setTurnstileToken(null);
      const win = window as Window & { turnstile?: { reset: () => void } };
      if (win.turnstile) win.turnstile.reset();
    }
  };

  const features = [
    { icon: Home, label: t('pages.advertise.photos'), desc: t('pages.advertise.photosDesc') },
    { icon: FolderKanban, label: t('pages.advertise.floorPlansLabel'), desc: t('pages.advertise.floorPlansDesc') },
    { icon: CalendarDays, label: t('pages.advertise.videos'), desc: t('pages.advertise.videosDesc') },
    { icon: Image, label: t('pages.advertise.panoramicViews'), desc: t('pages.advertise.panoramicViewsDesc') },
    { icon: Search, label: t('pages.advertise.mapsNearbys'), desc: t('pages.advertise.mapsNearbysDesc') },
    { icon: Users, label: t('pages.advertise.agentNetwork'), desc: t('pages.advertise.agentNetworkDesc') },
    { icon: MessageSquare, label: t('pages.advertise.inquiries'), desc: t('pages.advertise.inquiriesDesc') },
    { icon: Building2, label: t('pages.advertise.companyProfile'), desc: t('pages.advertise.companyProfileDesc') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead title={t('pages.advertise.title')} description={t('pages.advertise.subtitle')} url={window.location.href} />
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/90 to-primary py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 bg-cover bg-center" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Value Props */}
            <div className="text-primary-foreground">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {t('pages.advertise.easilyRegister')}
              </h1>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 mt-0.5 shrink-0" />
                  <span>{t('pages.advertise.createCompanyProfile')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 mt-0.5 shrink-0" />
                  <span>{t('pages.advertise.chooseMembership')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 mt-0.5 shrink-0" />
                  <span>{t('pages.advertise.controlMarketing')}</span>
                </li>
              </ul>
            </div>

            {/* Right - Form */}
            <Card ref={formRef} className={`shadow-2xl border-0 transition-all duration-700 ${highlightForm ? "ring-4 ring-accent ring-offset-2" : ""}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-center">{t('pages.advertise.letsRegister')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="company_name">{t('pages.advertise.companyName')}</Label>
                    <Input
                      id="company_name"
                      placeholder={t('pages.advertise.enterCompanyName')}
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      required
                      maxLength={200}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">{t('pages.advertise.firstName')}</Label>
                      <Input
                        id="first_name"
                        placeholder={t('pages.advertise.enterFirstName')}
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        required
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">{t('pages.advertise.lastName')}</Label>
                      <Input
                        id="last_name"
                        placeholder={t('pages.advertise.enterLastName')}
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        required
                        maxLength={100}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">{t('pages.advertise.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('pages.advertise.enterEmail')}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('pages.advertise.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t('pages.advertise.enterPhone')}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">{t('pages.advertise.messageOptional')}</Label>
                    <Textarea
                      id="message"
                      placeholder={t('pages.advertise.advertisingNeeds')}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      maxLength={1000}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(v === true)}
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      {t('pages.advertise.acceptTerms')}
                    </Label>
                  </div>
                  <div
                    className="cf-turnstile"
                    data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                    data-callback="onTurnstileSuccess"
                    data-theme="auto"
                  />
                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                    {submitting ? t('pages.advertise.submitting') : t('common.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Powerful Tools Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('pages.advertise.powerfulTools')}</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {t('pages.advertise.showcaseListings')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.label}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keep In Touch Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('pages.advertise.keepInTouch')}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, title: t('pages.advertise.buildNetwork'), desc: t('pages.advertise.buildNetworkDesc') },
              { icon: MessageSquare, title: t('pages.advertise.receiveInquiries'), desc: t('pages.advertise.receiveInquiriesDesc') },
              { icon: Search, title: t('pages.advertise.claimSpot'), desc: t('pages.advertise.claimSpotDesc') },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t('pages.advertise.chooseYourPlan')}</h2>
          <p className="text-muted-foreground text-center mb-12">
            {t('pages.advertise.flexiblePackages')}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packagesLoading ? (
              <div className="col-span-full flex items-center justify-center min-h-[200px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : packagesError ? (
              <div className="col-span-full p-4 text-center text-destructive">Failed to load packages. Please refresh.</div>
            ) : packages?.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  pkg.package_type === "pro"
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                }`}
              >
                {pkg.package_type === "pro" && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {t('pages.advertise.popular')}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  {(() => {
                    const IconComp = packageIcons[pkg.package_type] || Briefcase;
                    return (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <IconComp className="h-8 w-8 text-primary" />
                      </div>
                    );
                  })()}
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">${pkg.monthly_price}</span>
                    <span className="text-muted-foreground text-sm">/{t('pages.advertise.month')}</span>
                  </div>
                  <p className="text-xs text-primary font-semibold mt-1">{t('pages.advertise.billedQuarterly')}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <FeatureLine value={`${pkg.max_agents}`} label={t('pages.advertise.agentsAllowed')} />
                  <FeatureLine value={`${pkg.max_events}`} label={t('pages.advertise.eventsAllowed')} />
                  <FeatureLine value={`${pkg.max_projects}`} label={t('pages.advertise.projectsAllowed')} />
                  <FeatureLine value={`${pkg.max_properties}`} label={t('pages.advertise.propertiesAllowed')} />
                  <FeatureLine
                    value={pkg.has_property_requests ? t('common.yes') : t('common.no')}
                    label={t('pages.advertise.propertyRequests')}
                    positive={pkg.has_property_requests}
                  />

                  <div className="border-t border-border pt-3 mt-4 space-y-1 text-xs text-muted-foreground">
                    <p>{t('pages.advertise.sixMonths')}: ${pkg.semiannual_price?.toLocaleString()}</p>
                    <p className="font-semibold text-primary">{t('pages.advertise.oneYear')}: ${pkg.annual_price?.toLocaleString()} ({t('pages.advertise.bestValue')})</p>
                  </div>

                  <Button className="w-full mt-4" variant={pkg.package_type === "pro" ? "default" : "outline"} onClick={scrollToForm}>
                    {t('pages.advertise.getYour')} {pkg.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
};

const FeatureLine = ({ value, label, positive = true }: { value: string; label: string; positive?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-semibold ${positive ? "text-foreground" : "text-muted-foreground"}`}>{value}</span>
  </div>
);

export default AdvertisePage;
