import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Camera, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { useServiceStore } from '../store/serviceStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { services } = useServiceStore();
  const location = useLocation();
  const isLandingPage = ['/wedding-landing-page', '/prewedding-landing-page', '/vrwedding-landing-page'].includes(location.pathname);

  useEffect(() => {
    setIsOpen(false);
    setServicesOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Testimonials', path: '/testimonials' },
    { name: 'Contact', path: '/contact' },
    { name: 'About Us', path: '/about' },
  ];

  return (
    <header className={cn(
      'fixed w-full top-0 z-50 transition-all duration-300',
      scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg' : 'bg-transparent'
    )}>
      <div className="container mx-auto px-2 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <img
            src="/logo.png"
            alt="Astitva Creations Logo"
            className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] py-[5px]"
          />
        </Link>

        {/* Desktop Nav */}
        {!isLandingPage && (
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              to={navLinks[0].path}
              className="text-xs xl:text-sm tracking-wider uppercase font-medium text-[var(--color-gold)] hover:text-white transition-colors duration-300"
            >
              {navLinks[0].name}
            </Link>

            {/* Services Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setServicesOpen((o) => !o)}
                className="flex items-center gap-1 text-xs xl:text-sm tracking-wider uppercase font-medium text-[var(--color-gold)] hover:text-white transition-colors duration-300"
              >
                Services
                <ChevronDown className={cn('w-3 h-3 transition-transform duration-300', servicesOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-[#0a0a0a] border border-[#222] shadow-2xl origin-top"
                    style={{ zIndex: 100 }}
                  >
                    {/* Gold top line */}
                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />

                    {services.length === 0 && (
                      <div className="px-4 py-3 text-[#555] text-xs uppercase tracking-widest">No services yet</div>
                    )}
                    {services.map((service, i) => (
                      <Link
                        key={service._id}
                        to={`/services/${service.slug}`}
                        onClick={() => setServicesOpen(false)}
                        className={cn(
                          'block px-5 py-3 text-xs uppercase tracking-widest text-[#A1A1A1] hover:text-[var(--color-gold)] hover:bg-[#111] transition-colors',
                          i < services.length - 1 && 'border-b border-[#1a1a1a]'
                        )}
                      >
                        {service.title}
                      </Link>
                    ))}

                    {/* View all */}
                    <Link
                      to="/services"
                      onClick={() => setServicesOpen(false)}
                      className="block px-5 py-3 text-xs uppercase tracking-widest text-[var(--color-gold)] hover:bg-[#111] transition-colors border-t border-[#222] font-semibold"
                    >
                      View All Services →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-xs xl:text-sm tracking-wider uppercase font-medium text-[var(--color-gold)] hover:text-white transition-colors duration-300"
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/quote"
              className="px-4 xl:px-6 py-2 border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black transition-all duration-300 uppercase tracking-widest text-xs xl:text-sm font-semibold ml-2 xl:ml-4"
            >
              Get a Quote
            </Link>
          </nav>
        )}

        {/* Mobile Menu Toggle */}
        {!isLandingPage && (
          <button className="lg:hidden text-[var(--color-gold)] focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-12 h-8" />}
          </button>
        )}
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && !isLandingPage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-[#0B0B0B] border-t border-gray-800 shadow-2xl py-6 flex flex-col items-center gap-4"
          >
            <Link
              to={navLinks[0].path}
              onClick={() => setIsOpen(false)}
              className="text-lg tracking-widest uppercase text-[var(--color-gold)] hover:text-white transition-colors"
            >
              {navLinks[0].name}
            </Link>

            {/* Mobile Services Accordion */}
            <div className="w-full px-8">
              <button
                onClick={() => setMobileServicesOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-1.5 text-lg tracking-widest uppercase text-[var(--color-gold)] hover:text-white transition-colors pb-2"
              >
                Services
                <ChevronDown className={cn('w-4 h-4 transition-transform', mobileServicesOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {mobileServicesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {services.map((service) => (
                      <Link
                        key={service._id}
                        to={`/services/${service.slug}`}
                        onClick={() => { setIsOpen(false); setMobileServicesOpen(false); }}
                        className="block py-2 pl-4 text-sm tracking-widest uppercase text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors border-b border-[#1a1a1a]"
                      >
                        {service.title}
                      </Link>
                    ))}
                    <Link
                      to="/services"
                      onClick={() => { setIsOpen(false); setMobileServicesOpen(false); }}
                      className="block py-2 pl-4 text-sm tracking-widest uppercase text-[var(--color-gold)] transition-colors"
                    >
                      View All →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-lg tracking-widest uppercase text-[var(--color-gold)] hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/quote"
              onClick={() => setIsOpen(false)}
              className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest mt-2"
            >
              Get a Quote
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
