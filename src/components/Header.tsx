import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Globe, ChevronDown, Ruler, Bell, Heart, Layers,
  Menu, X, User, LogOut, Settings, Users2, Search,
  MessageSquare, FileText, MapPin, LayoutDashboard
} from 'lucide-react';
import DarkModeToggle from '@/components/DarkModeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguages, useCurrencies } from '@/hooks/useAppData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCurrentUser,
  useHeaderCounts,
  useHeaderNotifications,
  useHeaderSavedItems,
  useHeaderCompareItems,
  useInvalidateHeaderData,
} from '@/hooks/useHeaderData';

const AREA_UNITS = [
  { labelKey: 'areaUnit.meterSq', value: 'm²' },
  { labelKey: 'areaUnit.feetSq', value: 'ft²' },
];

const Header = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: languages = [] } = useLanguages();
  const { data: currencies = [] } = useCurrencies();

  const [selectedLang, setSelectedLang] = useState<{ id: string; name: string; code: string } | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<{ id: string; name: string; code: string; symbol: string } | null>(null);
  const [selectedArea, setSelectedArea] = useState(AREA_UNITS[0]);
  const [openDropdown, setOpenDropdown] = useState<'lang' | 'currency' | 'area' | 'user' | 'notifications' | 'saved' | 'compare' | null>(null);

  // Auth + data via cached React Query hooks (no re-fetch on every page navigation)
  const currentUser = useCurrentUser();
  const { data: counts = { savedProperties: 0, savedSearches: 0, compare: 0, followedAgents: 0 } } = useHeaderCounts(currentUser?.id);
  const { data: notifData } = useHeaderNotifications(currentUser?.id);
  const notifications = notifData?.items || [];
  const unreadCount = notifData?.unreadCount || 0;
  const { data: savedItems = [] } = useHeaderSavedItems(currentUser?.id);
  const { data: compareItems = [] } = useHeaderCompareItems(currentUser?.id);
  const invalidateHeaderData = useInvalidateHeaderData();

  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  // Listen for property action changes to refresh cached data
  useEffect(() => {
    if (!currentUser?.id) return;
    const handler = () => invalidateHeaderData();
    window.addEventListener('property-actions-changed', handler);
    return () => window.removeEventListener('property-actions-changed', handler);
  }, [currentUser?.id, invalidateHeaderData]);

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
        openDropdown === 'notifications' && notifRef.current && !notifRef.current.contains(e.target as Node) ||
        openDropdown === 'saved' && savedRef.current && !savedRef.current.contains(e.target as Node) ||
        openDropdown === 'compare' && compareRef.current && !compareRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);

  const markNotificationRead = async (notifId: string) => {
    await supabase.from("user_notifications").update({ is_read: true }).eq("id", notifId);
    queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
  };

  const markAllRead = async () => {
    if (!currentUser?.id) return;
    await supabase.from("user_notifications").update({ is_read: true }).eq("user_id", currentUser.id).eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
  };

  const removeSavedProperty = async (id: string) => {
    await supabase.from("saved_properties").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ['saved-property-ids'] });
    invalidateHeaderData();
    window.dispatchEvent(new Event('property-actions-changed'));
  };

  const removeCompareItem = async (id: string) => {
    await supabase.from("property_comparisons").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ['compared-property-ids'] });
    invalidateHeaderData();
    window.dispatchEvent(new Event('property-actions-changed'));
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

  const selectLang = async (lang: typeof languages[0]) => {
    setSelectedLang(lang);
    localStorage.setItem('selectedLangCode', lang.code);
    // Sync i18n language — fall back to English for unsupported UI languages
    const supportedLangs = ['en', 'ar', 'fr'];
    const targetLang = supportedLangs.includes(lang.code) ? lang.code : 'en';
    document.documentElement.dir = lang.code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang.code;
    setOpenDropdown(null);
    if (i18n.language !== targetLang) {
      await i18n.changeLanguage(targetLang);
    }
  };
  const selectCurrency = (currency: typeof currencies[0]) => { setSelectedCurrency(currency); localStorage.setItem('selectedCurrencyCode', currency.code); setOpenDropdown(null); };
  const selectArea = (unit: typeof AREA_UNITS[0]) => { setSelectedArea(unit); localStorage.setItem('selectedAreaUnit', unit.value); window.dispatchEvent(new Event('area-unit-changed')); setOpenDropdown(null); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpenDropdown(null);
    navigate("/");
  };

  const navLinks = [
    { label: t('nav.buy'), to: '/buy' },
    { label: t('nav.rent'), to: '/rent' },
    { label: t('nav.projects'), to: '/projects' },
    { label: t('nav.events'), to: '/events' },
    { label: t('nav.propertyRequest'), to: '/property-request' },
    { label: t('nav.agents'), to: '/agents' },
  ];

  const countMap: Record<string, number> = {
    '/account/followed-agents': counts.followedAgents,
    '/account/saved-properties': counts.savedProperties,
    '/account/saved-searches': counts.savedSearches,
    '/account/compare': counts.compare,
  };

  const userMenuLinks = [
    { label: t('userMenu.dashboard'), to: '/account', icon: LayoutDashboard },
    { label: t('userMenu.accountSettings'), to: '/account/settings', icon: Settings },
    { label: t('userMenu.followedAgents'), to: '/account/followed-agents', icon: Users2 },
    { label: t('userMenu.savedProperties'), to: '/account/saved-properties', icon: Heart },
    { label: t('userMenu.savedSearches'), to: '/account/saved-searches', icon: Search },
    { label: t('userMenu.compareList'), to: '/account/compare', icon: Layers },
    { label: t('userMenu.notifications'), to: '/account/notifications', icon: Bell },
    { label: t('userMenu.contactedProperties'), to: '/account/contacted', icon: MessageSquare },
    { label: t('userMenu.propertyRequests'), to: '/account/requests', icon: FileText },
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
                <div className="absolute top-full start-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[180px] py-1 z-[60]">
                  {languages.filter(l => ['en', 'ar', 'fr'].includes(l.code)).map(lang => (
                    <button key={lang.id} onClick={() => selectLang(lang)} className={cn("w-full text-start px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2", selectedLang?.id === lang.id ? "bg-primary text-primary-foreground font-medium" : "text-foreground")}>
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
                <div className="absolute top-full start-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[260px] py-1 z-[60]">
                  {currencies.map(curr => (
                    <button key={curr.id} onClick={() => selectCurrency(curr)} className={cn("w-full text-start px-4 py-2 text-sm hover:bg-accent transition-colors", selectedCurrency?.id === curr.id ? "bg-primary text-primary-foreground font-medium" : "text-foreground")}>
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
                <div className="absolute top-full start-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[170px] py-1 z-[60]">
                  {AREA_UNITS.map(unit => (
                    <button key={unit.value} onClick={() => selectArea(unit)} className={cn("w-full text-start px-4 py-2 text-sm hover:bg-accent transition-colors", selectedArea.value === unit.value ? "bg-primary text-primary-foreground font-medium" : "text-foreground")}>
                      {t(unit.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <DarkModeToggle compact />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/contact-us" className="hover:opacity-80 transition-opacity">{t('nav.contactUs')}</Link>
            <span className="opacity-50">|</span>
            <Link to="/blog" className="hover:opacity-80 transition-opacity">{t('nav.blogs')}</Link>
            <span className="opacity-50">|</span>
            <Link to="/advertise" className="hover:opacity-80 transition-opacity">{t('nav.advertiseWithUs')}</Link>
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
              <Link key={link.to} to={link.to} className={cn("px-3 py-2 text-sm font-medium rounded-md transition-colors", location.pathname === link.to ? "text-primary bg-primary/10 font-semibold" : "text-foreground/80 hover:text-primary hover:bg-secondary")}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  if (!currentUser) { navigate('/login'); return; }
                  setOpenDropdown(openDropdown === 'notifications' ? null : 'notifications');
                }}
                className="relative p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label={t('header.notifications')}
              >
                <Bell className="h-5 w-5 text-foreground/70" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {openDropdown === 'notifications' && (
                <div className="absolute top-full end-0 mt-1 bg-background border border-border rounded-lg shadow-xl w-[min(340px,calc(100vw-2rem))] z-[60] animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">{t('header.notifications')}</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                        {t('header.markAllRead')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t('header.noNewNotifications')}</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className="px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer group"
                          onClick={() => {
                            markNotificationRead(n.id);
                            setOpenDropdown(null);
                            if (n.property_id) navigate(`/property/${n.property_id}`);
                            else navigate('/account/notifications');
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {getNotifIcon(n.notification_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                              {n.message && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border">
                    <Link
                      to="/account/notifications"
                      onClick={() => setOpenDropdown(null)}
                      className="block text-center text-xs text-primary font-medium py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      {t('header.viewAllNotifications')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {/* Saved Properties Dropdown */}
            <div className="relative" ref={savedRef}>
              <button
                onClick={() => {
                  if (!currentUser) { navigate('/login'); return; }
                  setOpenDropdown(openDropdown === 'saved' ? null : 'saved');
                }}
                className="relative p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label={t('header.savedProperties')}
              >
                <Heart className="h-5 w-5 text-foreground/70" />
                {counts.savedProperties > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5">
                    {counts.savedProperties > 9 ? '9+' : counts.savedProperties}
                  </span>
                )}
              </button>
              {openDropdown === 'saved' && (
                <div className="absolute top-full end-0 mt-1 bg-background border border-border rounded-lg shadow-xl w-[min(340px,calc(100vw-2rem))] z-[60] animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">{t('header.savedProperties')}</h3>
                    <span className="text-xs text-muted-foreground">{counts.savedProperties} {t('header.saved')}</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {savedItems.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t('header.noSavedProperties')}</p>
                      </div>
                    ) : (
                      savedItems.map(item => (
                        <div
                          key={item.id}
                          className="px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer group"
                        >
                          <div className="flex gap-3">
                            <img
                              src={item.images?.[0] || "/placeholder.svg"}
                              alt=""
                              className="h-12 w-16 rounded object-cover shrink-0"
                              onClick={() => { setOpenDropdown(null); navigate(`/property/${item.property_id}`); }}
                            />
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => { setOpenDropdown(null); navigate(`/property/${item.property_id}`); }}
                            >
                              <p className="text-sm font-medium text-foreground leading-tight truncate">{item.title}</p>
                              {item.location && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />{item.location}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-primary mt-0.5">{item.currency || '$'} {item.price?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeSavedProperty(item.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded shrink-0 self-center"
                              title={t('header.remove')}
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border">
                    <Link
                      to="/account/saved-properties"
                      onClick={() => setOpenDropdown(null)}
                      className="block text-center text-xs text-primary font-medium py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      {t('header.viewAllSavedProperties')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Compare List Dropdown */}
            <div className="relative" ref={compareRef}>
              <button
                onClick={() => {
                  if (!currentUser) { navigate('/login'); return; }
                  setOpenDropdown(openDropdown === 'compare' ? null : 'compare');
                }}
                className="relative p-2 rounded-full hover:bg-secondary transition-colors"
                aria-label={t('header.compareList')}
              >
                <Layers className="h-5 w-5 text-foreground/70" />
                {counts.compare > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5">
                    {counts.compare > 9 ? '9+' : counts.compare}
                  </span>
                )}
              </button>
              {openDropdown === 'compare' && (
                <div className="absolute top-full end-0 mt-1 bg-background border border-border rounded-lg shadow-xl w-[min(340px,calc(100vw-2rem))] z-[60] animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">{t('header.compareList')}</h3>
                    <span className="text-xs text-muted-foreground">{counts.compare}/3</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {compareItems.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Layers className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t('header.noPropertiesToCompare')}</p>
                      </div>
                    ) : (
                      compareItems.map(item => (
                        <div
                          key={item.id}
                          className="px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer group"
                        >
                          <div className="flex gap-3">
                            <img
                              src={item.images?.[0] || "/placeholder.svg"}
                              alt=""
                              className="h-12 w-16 rounded object-cover shrink-0"
                              onClick={() => { setOpenDropdown(null); navigate(`/property/${item.property_id}`); }}
                            />
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => { setOpenDropdown(null); navigate(`/property/${item.property_id}`); }}
                            >
                              <p className="text-sm font-medium text-foreground leading-tight truncate">{item.title}</p>
                              {item.location && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />{item.location}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-primary mt-0.5">{item.currency || '$'} {item.price?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCompareItem(item.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded shrink-0 self-center"
                              title={t('header.remove')}
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-border">
                    <Link
                      to="/account/compare"
                      onClick={() => setOpenDropdown(null)}
                      className="block text-center text-xs text-primary font-medium py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      {t('header.compareAndAnalyse')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu / Login */}
            {currentUser ? (
              <div className="relative" ref={userRef}>
                <button
                  className="hidden md:flex items-center gap-1.5 ms-2 px-3 py-1.5 rounded-md border border-border hover:bg-secondary transition-colors"
                  onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                >
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{t('nav.myAccount')}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {openDropdown === 'user' && (
                  <div className="absolute top-full end-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[220px] py-1 z-[60]">
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
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5 ms-2">
                  <User className="h-4 w-4" />
                  {t('nav.loginRegister')}
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
              <Link key={link.to} to={link.to} className="px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {currentUser ? (
              <>
                <div className="border-t border-border my-2" />
                <Link to="/account" className="px-3 py-2.5 text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.myAccount')}
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="px-3 py-2.5 text-sm font-medium text-destructive text-start">
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="mt-2 w-full justify-center gap-1.5">
                  <User className="h-4 w-4" />
                  {t('nav.loginRegister')}
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
