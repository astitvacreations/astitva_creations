import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallPopup() {
  const { canInstall, installApp, showIOSGuide, closeIOSGuide, installStatusMessage } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('astitva_pwa_popup_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('astitva_pwa_popup_dismissed', 'true');
  };

  const handleInstallClick = () => {
    installApp();
  };

  if (!canInstall || dismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom PWA Install Card Popup */}
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[999] max-w-md w-auto"
          >
            <div className="bg-[#0a0a0a]/95 backdrop-blur-md border border-[#2a2a2a] p-4 sm:p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative">
              {/* Close Button X */}
              <button
                onClick={handleDismiss}
                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white transition-colors"
                aria-label="Close install prompt"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Main Info Section */}
              <div className="flex items-center gap-3.5 mb-3 pr-6">
                <div className="w-12 h-12 rounded-xl bg-black border border-[#333] p-1 flex items-center justify-center shrink-0 shadow">
                  <img
                    src="/icon-192x192.png"
                    alt="Astitva Creations"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm tracking-wider uppercase leading-snug">
                    INSTALL ASTITVA CREATIONS
                  </h4>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                    Quick access & smooth app experience
                  </p>
                </div>
              </div>

              {/* Status Notice if Chrome blocked native prompt (e.g. already installed on port) */}
              {installStatusMessage && (
                <div className="mb-3 p-2.5 bg-[#1a180e] border border-[#d4af37]/40 rounded-lg text-xs text-[var(--color-gold)] flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{installStatusMessage}</span>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end gap-3 pt-1 border-t border-[#1a1a1a]">
                <button
                  onClick={handleDismiss}
                  className="text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white px-3 py-2 transition-colors cursor-pointer"
                >
                  NOT NOW
                </button>
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-black hover:bg-[var(--color-gold)] font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  INSTALL APP
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Installation Instruction Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-[#333] p-6 max-w-sm w-full text-center relative shadow-2xl rounded-2xl"
            >
              <button
                onClick={closeIOSGuide}
                className="absolute top-3.5 right-3.5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <img src="/logo.png" alt="Astitva Creations" className="h-12 mx-auto mb-4 object-contain" />
              <h3 className="text-lg font-heading text-[var(--color-gold)] mb-2 uppercase tracking-wider">Install App on iOS</h3>
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                To install this app on your iPhone or iPad:
              </p>
              <div className="bg-[#141414] p-4 rounded-xl border border-[#222] text-left text-xs text-gray-300 space-y-2">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-gold)] text-black font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  Tap the <span className="font-semibold text-white">Share</span> button in Safari.
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-gold)] text-black font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  Scroll down and select <span className="font-semibold text-white">Add to Home Screen</span>.
                </p>
              </div>
              <button
                onClick={closeIOSGuide}
                className="mt-5 w-full py-2.5 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-lg"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
