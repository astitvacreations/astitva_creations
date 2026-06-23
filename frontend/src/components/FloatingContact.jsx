import { Phone } from 'lucide-react';
import { useSettingStore } from '../store/settingStore';
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FloatingContact() {
  const { settings, fetchSettings } = useSettingStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Sync with ScrollToTopButton (appears after 300px)
      setScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLandingPage = location.pathname.includes('-landing-page') || location.pathname === '/reference';

  // Landing Page Specific Floating Action
  if (isLandingPage) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 transition-all duration-500 ${scrolled ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="bg-transparent border border-[#B19247] text-[#B19247] text-xs px-4 py-1.5 rounded-full uppercase tracking-[0.1em] font-light shadow-2xl whitespace-nowrap">
          Hurry, Limited Slots Available!
        </div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <Link 
            to="/quote"
            className="inline-block bg-[#B19247] text-black uppercase px-8 py-3 rounded-full shadow-[0_0_30px_rgba(177,146,71,0.2)] hover:bg-white transition-colors"
            style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "0.15em", fontSize: "1.05rem" }}
          >
            Book Now
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!settings?.whatsappNumber) return null;

  // Format numbers for links
  const waNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const phoneUrl = `tel:${settings.whatsappNumber}`;
  const waUrl = `https://wa.me/${waNumber}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      {/* Phone Icon - Hidden on Mobile */}
      <a 
        href={phoneUrl}
        className="hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-[#111] border border-[var(--color-gold)] shadow-lg hover:scale-110 transition-transform duration-300 group"
        aria-label="Call us"
      >
        <Phone className="w-6 h-6 text-[var(--color-gold)] group-hover:text-white transition-colors" />
      </a>

      {/* WhatsApp Icon - Visible on all devices */}
      <a 
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#111] border border-[var(--color-gold)] shadow-lg hover:scale-110 transition-transform duration-300 group"
        aria-label="Chat on WhatsApp"
      >
        <svg 
          viewBox="0 0 24 24" 
          className="w-7 h-7 fill-[var(--color-gold)] group-hover:fill-white transition-colors" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}
