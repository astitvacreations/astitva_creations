import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    
    // Add a small artificial delay so the spinning animation is visible
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Ping the current origin to verify actual internet access
      const response = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-cache' });
      if (response.ok || response.status === 200) {
        setIsOnline(true);
      }
    } catch (error) {
      // Fetch failed, still offline
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#050505]/95 backdrop-blur-sm flex items-center justify-center p-4 text-center"
        >
          <div className="max-w-md bg-[#111] border border-[#333] p-10">
            <WifiOff className="w-16 h-16 text-[var(--color-gold)] mx-auto mb-6" />
            
            <h2 className="font-heading text-3xl text-white mb-4">Connection Lost</h2>
            <p className="text-[#A1A1A1] text-sm leading-relaxed mb-8">
              It seems you have lost your internet connection. Please check your network and try again to continue your cinematic experience.
            </p>
            
            <button 
              onClick={checkConnection}
              disabled={isChecking}
              className="w-full py-4 bg-transparent border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black uppercase tracking-widest font-bold text-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} /> 
              {isChecking ? 'Checking...' : 'Try Reconnecting'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
