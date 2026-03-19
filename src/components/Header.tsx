import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Globe, ChevronDown, Ruler, Bell, Heart, Layers,
  Menu, X, User, LogOut, Settings, Users2, Search,
  MessageSquare, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguages, useCurrencies } from '@/hooks/useAppData';
import { supabase } from '@/integrations/supabase/client';

const AREA_UNITS = [
  { label: 'Meter Sq. (m²)', value: 'm²' },
  { label: 'Feet Sq. (ft²)', value: 'ft²' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: languages = [] } = useLanguages();
  const { data: currencies = [] } = useCurrencies();

  const [selectedLang, setSelectedLang] = useState<{ id: string; name: string; code: string } | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<{ id: string; name: string; code: string; symbol: string } | null>(null);
  const [selectedArea, setSelectedArea] = useState(AREA_UNITS[0]);
  const [openDropdown, setOpenDropdown] = useState<'lang' | 'currency' | 'area' | 'user' | 'notifications' | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; displayName: string } | null>(null);

  // Counts
  const [counts, setCounts] = useState({ savedProperties: 0, savedSearches: 0, compare: 0, followedAgents: 0 });
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string | null; notification_type: string; is_read: boolean; created_at: string; source_company_id: string | null; property_id: string | null }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Check auth
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, first_name")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        setCurrentUser({
          id: user.id,
          email: user.email || "",
          displayName: profile?.display_name || profile?.first_name || user.email?.split("@")[0] || "User",
        });
      } else {
        setCurrentUser(null);
        setCounts({ savedProperties: 0, savedSearches: 0, compare: 0, followedAgents: 0 });
      }
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch counts when user changes or after property actions
  const fetchCounts = async (uid: string) => {
    const [sp, ss, cmp, fa] = await Promise.all([
      supabase.from("saved_properties").select("*", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("saved_searches").select("*", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("property_comparisons").select("*", { count: "exact", head: true }).eq("user_id", uid),
      supabase.from("agent_followers").select("*", { count: "exact", head: true }).eq("user_id", uid),
    ]);
    setCounts({
      savedProperties: sp.count ?? 0,
      savedSearches: ss.count ?? 0,
      compare: cmp.count ?? 0,
      followedAgents: fa.count ?? 0,
    });
  };

  const fetchNotifications = async (uid: string) => {
    const { data, count } = await supabase
      .from("user_notifications")
      .select("id, title, message, notification_type, is_read, created_at, source_company_id, property_id", { count: "exact" })
      .eq("user_id", uid)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications(data || []);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchCounts(currentUser.id);
    fetchNotifications(currentUser.id);
  }, [currentUser?.id]);

  // Listen for property action changes to refresh counts
  useEffect(() => {
    if (!currentUser?.id) return;
    const uid = currentUser.id;
    const handler = () => fetchCounts(uid);
    window.addEventListener('property-actions-changed', handler);
    return () => window.removeEventListener('property-actions-changed', handler);
  }, [currentUser?.id]);

  // Set defaults once data loads
  useEffect(() => {
    if (languages.length > 0 && !selectedLang) {
      const saved = localStorage.getItem('selectedLangCode');
      const match = languages.find(l => l.code === saved) || languages.find(l => l.code === 'en') || languages[0];
      if (match) setSelectedLang(match);
    }
  }, [languages, selectedLang]);

  useEffect(() => {
    if (currencies.length > 0 && !selectedCurrency) {
      const saved = localStorage.getItem('selectedCurrencyCode');
      const match = currencies.find(c => c.code === saved) || currencies.find(c => c.code === 'USD') || currencies[0];
      if (match) setSelectedCurrency(match);
    }
  }, [currencies, selectedCurrency]);

  useEffect(() => {
    const savedArea = localStorage.getItem('selectedAreaUnit');
    if (savedArea) {
      const match = AREA_UNITS.find(a => a.value === savedArea);
      if (match) setSelectedArea(match);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        openDropdown === 'lang' && langRef.current && !langRef.current.contains(e.target as Node) ||
        openDropdown === 'currency' && currRef.current && !currRef.current.contains(e.target as Node) ||
        openDropdown === 'area' && areaRef.current && !areaRef.current.contains(e.target as Node) ||
        openDropdown === 'user' && userRef.current && !userRef.current.contains(e.target as Node) ||
        openDropdown === 'notifications' && notifRef.current && !notifRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);
  const markNotificationRead = async (notifId: string) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!currentUser?.id) return;
    await supabase.from("user_notifications").update({ is_read: true }).eq("user_id", currentUser.id).eq("is_read", false);
    setNotifications([]);
    setUnreadCount(0);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getNotifIcon = (type: string) => {
    if (type === 'announcement') return <MessageSquare className="h-4 w-4 text-primary" />;
    if (type === 'new_listing') return <Heart className="h-4 w-4 text-primary" />;
    if (type === 'follow') return <Users2 className="h-4 w-4 text-primary" />;
    return <Bell className="h-4 w-4 text-primary" />;
  };

  const selectLang = (lang: typeof languages[0]) => { setSelectedLang(lang); localStorage.setItem('selectedLangCode', lang.code); setOpenDropdown(null); };
  const selectCurrency = (currency: typeof currencies[0]) => { setSelectedCurrency(currency); localStorage.setItem('selectedCurrencyCode', currency.code); setOpenDropdown(null); };
  const selectArea = (unit: typeof AREA_UNITS[0]) => { setSelectedArea(unit); localStorage.setItem('selectedAreaUnit', unit.value); setOpenDropdown(null); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setOpenDropdown(null);
    navigate("/");
  };

  const navLinks = [
    { label: 'Buy', to: '/buy' },
    { label: 'Rent', to: '/rent' },
    { label: 'Projects', to: '/projects' },
    { label: 'Events', to: '/events' },
    { label: 'Property Request', to: '/property-request' },
    { label: 'Agents', to: '/agents' },
  ];

  const countMap: Record<string, number> = {
    '/account/followed-agents': counts.followedAgents,
    '/account/saved-properties': counts.savedProperties,
    '/account/saved-searches': counts.savedSearches,
    '/account/compare': counts.compare,
  };

  const userMenuLinks = [
    { label: 'Account Settings', to: '/account', icon: Settings },
    { label: 'Followed Agents', to: '/account/followed-agents', icon: Users2 },
    { label: 'Saved Properties', to: '/account/saved-properties', icon: Heart },
    { label: 'Saved Searches', to: '/account/saved-searches', icon: Search },
    { label: 'Compare List', to: '/account/compare', icon: Layers },
    { label: 'Notifications', to: '/account/notifications', icon: Bell },
    { label: 'Contacted Properties', to: '/account/contacted', icon: MessageSquare },
    { label: 'Property Requests', to: '/account/requests', icon: FileText },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-background shadow-sm">
      {/* Top Utility Bar */}
      <div className="border-b border-border bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between h-10 px-4 text-xs">
          <div className="flex items-center gap-1">
            {/* Language Dropdown */}
            <div className="relative" ref={langRef}>
              <button className="flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded" onClick={() => setOpenDropdown(openDropdown === 'lang' ? null : 'lang')}>
                <Globe className="h-3.5 w-3.5" />
                <span>{selectedLang?.code?.toUpperCase() || 'EN'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {openDropdown === 'lang' && languages.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[180px] py-1 z-[60]">
                  {languages.map(lang => (
                    <button key={lang.id} onClick={() => selectLang(lang)} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2", selectedLang?.id === lang.id ? "bg-primary text-primary-foreground font-medium" : "text-foreground")}>
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Dropdown */}
            <div className="relative" ref={currRef}>
              <button className="flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded" onClick={() => setOpenDropdown(openDropdown === 'currency' ? null : 'currency')}>
                <span>{selectedCurrency?.symbol || '$'}</span>
                <span>({selectedCurrency?.code || 'USD'})</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {openDropdown === 'currency' && currencies.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[260px] py-1 z-[60]">
                  {currencies.map(curr => (
                    <button key={curr.id} onClick={() => selectCurrency(curr)} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors", selectedCurrency?.id === curr.id ? "bg-primary text-primary-foreground font-medium" : "text-foreground")}>
                      {curr.name} ({curr.symbol})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Area Unit Dropdown */}
            <div className="relative" ref={areaRef}>
              <button className="flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded" onClick={() => setOpenDropdown(openDropdown === 'area' ? null : 'area')}>
                <Ruler className="h-3.5 w-3.5" />
                <span>({selectedArea.value})</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {openDropdown === 'area' && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[170px] py-1 z-[60]">
                  {AREA_UNITS.map(unit => (
                    <button key={unit.value} onClick={() => selectArea(unit)} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors", selectedArea.value === unit.value ? "bg-primary text-primary-foreground font-medium" : "text-foreground")}>
                      {unit.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/contact-us" className="hover:opacity-80 transition-opacity">Contact Us</Link>
            <span className="opacity-50">|</span>
            <Link to="/blog" className="hover:opacity-80 transition-opacity">Blogs</Link>
            <span className="opacity-50">|</span>
            <Link to="/advertise" className="hover:opacity-80 transition-opacity">Advertise With Us</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-background">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary tracking-tight">turegu</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className={cn("px-3 py-2 text-sm font-medium rounded-md transition-colors", location.pathname === link.to ? "text-primary bg-primary/10 font-semibold" : "text-foreground/80 hover:text-primary hover:bg-secondary")}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate(currentUser ? '/account/notifications' : '/login')} className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Notifications">
              <Bell className="h-5 w-5 text-foreground/70" />
            </button>
            <button onClick={() => navigate(currentUser ? '/account/saved-properties' : '/login')} className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Favorites">
              <Heart className="h-5 w-5 text-foreground/70" />
              {counts.savedProperties > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {counts.savedProperties}
                </span>
              )}
            </button>
            <button onClick={() => navigate(currentUser ? '/account/compare' : '/login')} className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Compare">
              <Layers className="h-5 w-5 text-foreground/70" />
              {counts.compare > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {counts.compare}
                </span>
              )}
            </button>

            {/* User Menu / Login */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  className="hidden md:flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-md border border-border hover:bg-secondary transition-colors"
                  onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                >
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{currentUser.displayName}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {openDropdown === 'user' && (
                  <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[220px] py-1 z-[60]">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">{currentUser.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                    {userMenuLinks.map(link => {
                      const count = countMap[link.to];
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                        >
                          <link.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{link.label}</span>
                          {count != null && count > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                              {count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                    <div className="border-t border-border mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5 ml-2">
                  <User className="h-4 w-4" />
                  Login / Register
                </Button>
              </Link>
            )}

            <button
              className="lg:hidden p-2 rounded-md hover:bg-secondary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to} className="px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {currentUser ? (
              <>
                <div className="border-t border-border my-2" />
                <Link to="/account" className="px-3 py-2.5 text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                  My Account
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="px-3 py-2.5 text-sm font-medium text-destructive text-left">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="mt-2 w-full justify-center gap-1.5">
                  <User className="h-4 w-4" />
                  Login / Register
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
