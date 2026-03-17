import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, ChevronDown, DollarSign, Ruler, Bell, Heart, Layers,
  Menu, X, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Language {
  id: string;
  name: string;
  code: string;
}

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
}

const AREA_UNITS = [
  { label: 'Meter Sq. (m²)', value: 'm²' },
  { label: 'Feet Sq. (ft²)', value: 'ft²' },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [compareCount] = useState(0);

  // Data from DB
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Selected values
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [selectedArea, setSelectedArea] = useState(AREA_UNITS[0]);

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<'lang' | 'currency' | 'area' | null>(null);

  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [langRes, currRes] = await Promise.all([
        supabase.from('languages').select('id, name, code').eq('status', 'active').order('sort_order'),
        supabase.from('currencies').select('id, name, code, symbol').eq('status', 'active').order('sort_order'),
      ]);
      if (langRes.data) {
        setLanguages(langRes.data);
        const saved = localStorage.getItem('selectedLangCode');
        const match = langRes.data.find(l => l.code === saved) || langRes.data.find(l => l.code === 'en') || langRes.data[0];
        if (match) setSelectedLang(match);
      }
      if (currRes.data) {
        setCurrencies(currRes.data as Currency[]);
        const saved = localStorage.getItem('selectedCurrencyCode');
        const match = (currRes.data as Currency[]).find(c => c.code === saved) || (currRes.data as Currency[]).find(c => c.code === 'USD') || (currRes.data as Currency[])[0];
        if (match) setSelectedCurrency(match);
      }
    };
    fetchData();

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
        openDropdown === 'area' && areaRef.current && !areaRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown]);

  const selectLang = (lang: Language) => {
    setSelectedLang(lang);
    localStorage.setItem('selectedLangCode', lang.code);
    setOpenDropdown(null);
  };

  const selectCurrency = (currency: Currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem('selectedCurrencyCode', currency.code);
    setOpenDropdown(null);
  };

  const selectArea = (unit: typeof AREA_UNITS[0]) => {
    setSelectedArea(unit);
    localStorage.setItem('selectedAreaUnit', unit.value);
    setOpenDropdown(null);
  };

  const navLinks = [
    { label: 'Buy', to: '/buy' },
    { label: 'Rent', to: '/rent' },
    { label: 'Projects', to: '/projects' },
    { label: 'Events', to: '/events' },
    { label: 'Property Request', to: '/property-request' },
    { label: 'Agents', to: '/agents' },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-background shadow-sm">
      {/* Top Utility Bar */}
      <div className="border-b border-border bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between h-10 px-4 text-xs">
          <div className="flex items-center gap-1">
            {/* Language Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                className="flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded"
                onClick={() => setOpenDropdown(openDropdown === 'lang' ? null : 'lang')}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{selectedLang?.code?.toUpperCase() || 'EN'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {openDropdown === 'lang' && languages.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[180px] py-1 z-[60] max-h-[300px] overflow-y-auto">
                  {languages.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => selectLang(lang)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2",
                        selectedLang?.id === lang.id ? "bg-primary text-primary-foreground font-medium" : "text-foreground"
                      )}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Dropdown */}
            <div className="relative" ref={currRef}>
              <button
                className="flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded"
                onClick={() => setOpenDropdown(openDropdown === 'currency' ? null : 'currency')}
              >
                <span>{selectedCurrency?.symbol || '$'}</span>
                <span>({selectedCurrency?.code || 'USD'})</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {openDropdown === 'currency' && currencies.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[260px] py-1 z-[60] max-h-[350px] overflow-y-auto">
                  {currencies.map(curr => (
                    <button
                      key={curr.id}
                      onClick={() => selectCurrency(curr)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors",
                        selectedCurrency?.id === curr.id ? "bg-primary text-primary-foreground font-medium" : "text-foreground"
                      )}
                    >
                      {curr.name} ({curr.symbol})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Area Unit Dropdown */}
            <div className="relative" ref={areaRef}>
              <button
                className="flex items-center gap-1 hover:opacity-80 transition-opacity px-2 py-1 rounded"
                onClick={() => setOpenDropdown(openDropdown === 'area' ? null : 'area')}
              >
                <Ruler className="h-3.5 w-3.5" />
                <span>({selectedArea.value})</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {openDropdown === 'area' && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[170px] py-1 z-[60]">
                  {AREA_UNITS.map(unit => (
                    <button
                      key={unit.value}
                      onClick={() => selectArea(unit)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors",
                        selectedArea.value === unit.value ? "bg-primary text-primary-foreground font-medium" : "text-foreground"
                      )}
                    >
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
              <Link
                key={link.label}
                to={link.to}
                className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Notifications">
              <Bell className="h-5 w-5 text-foreground/70" />
            </button>
            <button className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Favorites">
              <Heart className="h-5 w-5 text-foreground/70" />
            </button>
            <button className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Compare">
              <Layers className="h-5 w-5 text-foreground/70" />
              {compareCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {compareCount}
                </span>
              )}
            </button>

            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5 ml-2">
              <User className="h-4 w-4" />
              Login / Register
            </Button>

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
              <Link
                key={link.label}
                to={link.to}
                className="px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button variant="outline" size="sm" className="mt-2 w-full justify-center gap-1.5">
              <User className="h-4 w-4" />
              Login / Register
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
