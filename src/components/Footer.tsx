import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Smartphone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* App Download Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">Get the Turegu App</h3>
              <p className="text-white/60 text-sm max-w-md">
                Search properties, save favorites, and get notified about new listings — all from your phone.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg px-5 py-3 cursor-pointer transition-colors">
                <Smartphone className="h-6 w-6" />
                <div>
                  <p className="text-[10px] text-white/60 leading-none">Download on the</p>
                  <p className="text-sm font-semibold">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg px-5 py-3 cursor-pointer transition-colors">
                <Smartphone className="h-6 w-6" />
                <div>
                  <p className="text-[10px] text-white/60 leading-none">Get it on</p>
                  <p className="text-sm font-semibold">Google Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/advertise" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/advertise" className="hover:text-white transition-colors">Advertise With Us</Link></li>
              <li><Link to="/advertise" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/buy" className="hover:text-white transition-colors">Buy</Link></li>
              <li><Link to="/rent" className="hover:text-white transition-colors">Rent</Link></li>
              <li><Link to="/projects" className="hover:text-white transition-colors">Projects</Link></li>
              <li><Link to="/agents" className="hover:text-white transition-colors">Agents</Link></li>
              <li><Link to="/events" className="hover:text-white transition-colors">Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/mortgage-bank-loan" className="hover:text-white transition-colors">Mortgage Banks</Link></li>
              <li><Link to="/property-request" className="hover:text-white transition-colors">Property Request</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link to="/terms" className="hover:text-background transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/admin/login" className="hover:text-primary transition-colors">Admin Panel</Link></li>
              <li><Link to="/company/login" className="hover:text-primary transition-colors">Company Dashboard</Link></li>
              <li><Link to="/agent/login" className="hover:text-primary transition-colors">Agent Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">turegu</span>
            <span className="text-xs text-background/40">© 2026 All rights reserved</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-background/20 transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
