import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Hammer, Instagram, Facebook, Mail, Clock } from 'lucide-react';
import { useSettingStore } from '../store/settingStore';

export default function Maintenance() {
  const { settings } = useSettingStore();
  
  const returnDate = settings.maintenanceUntil 
    ? new Date(settings.maintenanceUntil).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <>
      <Helmet>
        <title>Maintenance | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-6">
        {/* Background Subtle Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-gold)]/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-gold)]/5 blur-[120px] rounded-full"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-2xl"
        >
          {/* Logo Placeholder / Icon */}
          <div className="mb-12 inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#111] border border-[#222]">
            <Hammer className="w-10 h-10 text-[var(--color-gold)] animate-pulse" />
          </div>

          <h1 className="font-heading text-5xl md:text-7xl text-white mb-6 uppercase tracking-tighter">
            Perfecting the <span className="text-[var(--color-gold)]">Frame</span>
          </h1>
          
          <p className="text-[#A1A1A1] text-lg md:text-xl mb-12 font-light leading-relaxed">
            {returnDate 
              ? `Our digital gallery is currently undergoing a curated update. We will be back by ${returnDate}.`
              : "Our digital gallery is currently undergoing a curated update to bring you an even more cinematic experience. We'll be back shortly."
            }
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="bg-[#111] border border-[#222] px-6 py-3 rounded-full flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-ping"></div>
              <span className="text-xs uppercase tracking-widest text-white font-bold">
                {returnDate ? `Coming back: ${returnDate}` : 'Work in Progress'}
              </span>
            </div>
          </div>

          {/* Social / Contact */}
          <div className="border-t border-[#222] pt-12 flex flex-col items-center">
            <p className="text-[#555] text-xs uppercase tracking-[0.3em] mb-8">Follow our journey</p>
            <div className="flex gap-8">
              <a href="#" className="text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="mailto:official@astitvacreations.com" className="text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>
        </motion.div>

        <p className="absolute bottom-12 text-[#333] text-[10px] uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} Astitva Creations Studio
        </p>
      </div>
    </>
  );
}
