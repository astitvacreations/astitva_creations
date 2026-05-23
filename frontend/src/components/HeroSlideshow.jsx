import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';

// Fallback slides shown when admin hasn't uploaded any
const FALLBACK_SLIDES = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
    description: 'Capturing the essence of your love story',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80',
    description: 'Every moment, beautifully preserved',
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80',
    description: 'Cinematic stories for the ages',
  },
];

export default function HeroSlideshow({ slides = [], onSlideChange }) {
  const activeSlides = slides.length > 0 ? slides : FALLBACK_SLIDES;
  const [current, setCurrent] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef(null);
  const intervalRef = useRef(null);

  // Viewport observer for mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parallax scroll effect removed to fix jumping issue on mobile and ensure smooth native scrolling.
  useEffect(() => {
    // Left empty or use framer motion useScroll if needed, but native scroll is smoothest
  }, []);

  // Sync current index to parent on change
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(current);
    }
  }, [current, onSlideChange]);

  // Auto-advance every 5 seconds
  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
  }, [activeSlides.length]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, [startTimer]);

  const goTo = (index) => {
    setCurrent(index);
    startTimer();
  };

  const prev = () => goTo((current - 1 + activeSlides.length) % activeSlides.length);
  const next = () => goTo((current + 1) % activeSlides.length);

  return (
    <div ref={sectionRef} className="absolute inset-0 z-0 overflow-hidden">
      {/* Slides */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ willChange: 'transform' }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe < -100) next();
            else if (swipe > 100) prev();
          }}
        >
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              // Removed translation to fix jumping issue
            }}
          >
            <picture>
              {activeSlides[current].mobileImageUrl && (
                <source 
                  media="(max-width: 768px)" 
                  srcSet={optimizeImage(activeSlides[current].mobileImageUrl)} 
                />
              )}
              <img
                src={optimizeImage(activeSlides[current].imageUrl)}
                alt={`Hero slide ${current + 1}`}
                style={{
                  objectPosition: isMobile 
                    ? (activeSlides[current].mobilePosition || '50% 50%') 
                    : (activeSlides[current].position || '50% 50%'),
                }}
                className="w-full h-full object-cover"
                loading={current === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </picture>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay - darkened slightly per user request */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#0B0B0B]" />

      {/* Navigation arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/60 hover:text-[var(--color-gold)] transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/60 hover:text-[var(--color-gold)] transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-6 h-1.5 bg-[var(--color-gold)]'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
