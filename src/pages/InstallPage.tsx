import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Wifi, Zap, CheckCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Instant loading with offline caching" },
    { icon: Wifi, title: "Works Offline", desc: "Browse saved properties without internet" },
    { icon: Smartphone, title: "Native Feel", desc: "Full-screen experience like a native app" },
    { icon: Download, title: "No App Store", desc: "Install directly from your browser" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Install Turegu App"
        description="Install Turegu on your phone for lightning-fast property search, offline access, and a native app experience."
        url={window.location.href}
      />
      <Header />

      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <div className="mb-8">
              <img src="/pwa-icon-512.png" alt="Turegu" className="w-24 h-24 mx-auto rounded-2xl shadow-lg" />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Get the Turegu App
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Install Turegu on your device for the fastest property search experience. 
              No app store needed — works on any device.
            </p>

            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 text-primary text-lg font-medium">
                <CheckCircle className="h-6 w-6" />
                Turegu is already installed on your device!
              </div>
            ) : deferredPrompt ? (
              <Button size="lg" onClick={handleInstall} className="text-lg px-8 py-6">
                <Download className="mr-2 h-5 w-5" />
                Install Turegu
              </Button>
            ) : isIOS ? (
              <div className="bg-muted/50 border border-border rounded-xl p-6 max-w-md mx-auto text-left">
                <p className="font-semibold text-foreground mb-3">To install on iPhone/iPad:</p>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Tap the <strong>Share</strong> button in Safari</li>
                  <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>3. Tap <strong>"Add"</strong> to confirm</li>
                </ol>
              </div>
            ) : (
              <div className="bg-muted/50 border border-border rounded-xl p-6 max-w-md mx-auto text-left">
                <p className="font-semibold text-foreground mb-3">To install:</p>
                <ol className="space-y-2 text-muted-foreground">
                  <li>1. Open this page in <strong>Chrome</strong> or <strong>Edge</strong></li>
                  <li>2. Tap the menu (⋮) → <strong>"Install app"</strong></li>
                </ol>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-12">
              Why install the app?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.title} className="bg-card border border-border rounded-xl p-6 text-center">
                  <f.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default InstallPage;
