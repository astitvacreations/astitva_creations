import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuotePopup({ triggerRef }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hasEnteredRef = useRef(false);
  const observerRef = useRef(null);

  useEffect(() => {
    if (dismissed) return;

    const target = triggerRef?.current;
    if (!target) return;

    let delayTimer = null;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Trigger the popup with a subtle 800ms delay for premium UX
          delayTimer = setTimeout(() => {
            setVisible(true);
          }, 800);
          
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.05 } // Trigger when 5% of the section is visible
    );

    observerRef.current.observe(target);
    return () => {
      observerRef.current?.disconnect();
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [triggerRef, dismissed]);

  const dismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-[200] w-80 bg-[#111]/85 backdrop-blur-md border border-[var(--color-gold)]/40 shadow-2xl shadow-black/60 overflow-hidden rounded-sm"
          role="dialog"
          aria-label="Build your quote"
        >
          {/* Gold top accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />

          <div className="p-6">
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
              <span className="text-[var(--color-gold)] uppercase tracking-[0.2em] text-xs font-semibold">
                Build Your Perfect Quote
              </span>
            </div>

            {/* <h3 className="font-heading text-xl text-white mb-2 leading-tight">
              Build Your Perfect Quote
            </h3> */}
            <p className="text-[#A1A1A1] text-xs leading-relaxed mb-5">
              Get a customized photography & videography package tailored to your story. It takes less than 2 minutes.
            </p>

            <Link
              to="/quote"
              onClick={dismiss}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-xs hover:bg-white transition-colors"
            >
              Start Now <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
