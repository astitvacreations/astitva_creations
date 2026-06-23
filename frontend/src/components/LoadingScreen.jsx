import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SESSION_KEY = 'ac_loaded';

export default function LoadingScreen({ isFallback = false }) {
  const [visible, setVisible] = useState(() => isFallback ? true : !sessionStorage.getItem(SESSION_KEY));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isFallback) return;
    if (!visible) return;
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 120);

    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 1800); 
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [visible, isFallback]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] select-none overflow-hidden"
        >
          {/* Main Content Container */}
          <div className="relative flex flex-col items-center justify-center gap-12">
            
            {/* Logo Wrapper */}
            <div className="relative flex items-center justify-center h-40 md:h-52">
              <img
                src="/logo.png"
                alt="Astitva Creations"
                className="relative z-10 h-full w-auto object-contain"
              />
            </div>

            {/* Progress Bar Container */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col items-center gap-4 w-56"
            >
              <div className="h-[2px] w-full bg-[#1A1A1A] rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#B19247]/70 to-[#B19247] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                />
              </div>
              
              <div className="flex justify-between w-full text-[10px] sm:text-xs text-[#A1A1A1] uppercase tracking-[0.25em] font-medium">
                <span className="opacity-70">Loading</span>
                <span className="text-[#B19247]">
                  {Math.min(progress, 100)}%
                </span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
