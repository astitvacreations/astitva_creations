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
    }, 500);
    return () => clearTimeout(timer);
  }, [visible, isFallback]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] select-none"
        >
          {/* Decorative top line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute top-0 left-0 h-[2px] w-full origin-left"
            style={{ background: 'linear-gradient(90deg, transparent, #B19247, transparent)' }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-col items-center"
          >
            <img
              src="/logo.png"
              alt="Astitva Creations"
              className="h-44 w-auto object-contain drop-shadow-[0_0_30px_rgba(177,146,71,0.5)]"
            />
          </motion.div>

          {/* Studio tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-6 text-[var(--color-gold)] tracking-[0.5em] uppercase text-xs font-semibold"
          >
            Capturing Timeless Elegance
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-[var(--color-gold)]"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.8, ease: 'easeInOut' }}
          />

        </motion.div>
      )}
    </AnimatePresence>
  );
}
