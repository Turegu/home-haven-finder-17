import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe, ChevronDown, DollarSign, Ruler, Bell, Heart, Layers,
  Menu, X, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [currency, setCurrency] = useState('USD');
  const [areaUnit, setAreaUnit] = useState('m²');
  const [compareCount] = useState(0);

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
      <div className="border-b border-border bg-muted/50">
        <div className="container mx-auto flex items-center justify-between h-10 px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Globe className="h-3.5 w-3.5" />
              <span>{language}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{currency}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Ruler className="h-3.5 w-3.5" />
              <span>{areaUnit}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/contact-us" className="hover:text-foreground transition-colors">Contact Us</Link>
            <span className="text-border">|</span>
            <Link to="#" className="hover:text-foreground transition-colors">Blogs</Link>
            <span className="text-border">|</span>
            <Link to="#" className="hover:text-foreground transition-colors">Advertise</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-background">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary tracking-tight">turegu</span>
          </Link>

          {/* Desktop Nav */}
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

          {/* Right side icons */}
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

            {/* Mobile menu toggle */}
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
