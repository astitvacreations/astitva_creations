import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen bg-[#050505] flex items-center justify-center pt-24 px-4 text-center">
        <div className="max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-8xl md:text-[150px] text-[var(--color-gold)] mb-4 leading-none"
          >
            404
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">Frame Not Found</h2>
            <p className="text-[#A1A1A1] text-lg mb-10 leading-relaxed font-light">
              The beautiful moment you're looking for seems to have slipped from our focus. It might have been moved or no longer exists.
            </p>
            
            <Link 
              to="/" 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors group"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Return to Gallery
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
