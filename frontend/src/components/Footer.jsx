import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettingStore } from '../store/settingStore';
import { useEffect } from 'react';

export default function Footer() {
  const { settings, fetchSettings } = useSettingStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <footer className="bg-[#050505] pt-10 pb-10 border-t border-[#1a1a1a]">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center sm:text-left">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center justify-center sm:justify-start group mb-6">
              <img src="/logo.png" alt={`${settings.studioName} Logo`} className="h-28 sm:h-20 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
            </Link>
            <p className="text-[#A1A1A1] text-sm leading-relaxed">
              Capturing your most precious moments with a cinematic and luxury touch. Memories that last forever.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-xl mb-6 text-[var(--color-gold)]">Quick Links</h4>
            <ul className="space-y-4 text-sm text-[#A1A1A1]">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/projects" className="hover:text-white transition-colors">Projects</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/testimonials" className="hover:text-white transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading text-xl mb-6 text-[var(--color-gold)]">Our Services</h4>
            <ul className="space-y-4 text-sm text-[#A1A1A1]">
              <li><Link to="/services/wedding" className="hover:text-white transition-colors">Wedding Photography</Link></li>
              <li><Link to="/services/pre-wedding" className="hover:text-white transition-colors">Pre-Wedding Shoots</Link></li>
              <li><Link to="/services/half-sarees" className="hover:text-white transition-colors">Half-Sarees shoots</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-xl mb-6 text-[var(--color-gold)]">Contact Us</h4>
            <ul className="space-y-4 text-sm text-[#A1A1A1]">
              <li className="flex items-center justify-center sm:justify-start gap-3">
                <Phone className="w-4 h-4 text-[var(--color-gold)]" />
                <span className="font-mono text-base">{settings.whatsappNumber?.replace(/^\+91(\d)/, '+91 $1')}</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start gap-3">
                <Mail className="w-4 h-4 text-[var(--color-gold)]" />
                <span>{settings.contactEmail}</span>
              </li>
            </ul>
            <div className="flex gap-4 mt-8 justify-center sm:justify-start">
              <a href="https://www.facebook.com/astitvacreationsofficial" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-[#A1A1A1] hover:bg-[var(--color-gold)] hover:text-black transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="https://www.instagram.com/astitvacreationsofficial/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-[#A1A1A1] hover:bg-[var(--color-gold)] hover:text-black transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </a>
              <a href="https://www.youtube.com/@astitvacreationsofficial" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-[#A1A1A1] hover:bg-[var(--color-gold)] hover:text-black transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1a1a1a] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#A1A1A1]">
          <p>&copy; {new Date().getFullYear()} {settings.studioName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
