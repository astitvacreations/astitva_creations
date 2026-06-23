import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'ac_loaded';

export default function LoadingScreen({ isFallback = false }) {
  const [visible, setVisible] = useState(() => isFallback ? true : !sessionStorage.getItem(SESSION_KEY));

  useEffect(() => {
    if (isFallback) return;
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 1500); // Wait for the fill animation to complete
    return () => clearTimeout(timer);
  }, [visible, isFallback]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] select-none"
        >
          {/* Logo Container */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Background Logo (Transparent/Faint) */}
            <img
              src="/logo.png"
              alt="Astitva Creations"
              className="h-44 md:h-56 w-auto object-contain opacity-20 grayscale"
            />
            
            {/* Foreground Logo (Fills from left to right) */}
            <motion.img
              src="/logo.png"
              alt="Astitva Creations"
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0 0 0)' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute top-0 left-0 h-44 md:h-56 w-auto object-contain drop-shadow-[0_0_30px_rgba(177,146,71,0.5)]"
            />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
