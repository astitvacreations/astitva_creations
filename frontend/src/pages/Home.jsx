import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Film } from 'lucide-react';

import { useTestimonialStore } from '../store/testimonialStore';
import { useServiceStore } from '../store/serviceStore';
import { useSettingStore } from '../store/settingStore';
import { getOptimizedUrl } from '../utils/cloudinary';
import HeroSlideshow from '../components/HeroSlideshow';
import QuotePopup from '../components/QuotePopup';

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

function AnimatedCounter({ target, suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTimestamp = null;
          const endValue = parseInt(target, 10);
          
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Cubic ease-out curve
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const currentCount = Math.floor(easeOutProgress * endValue);
            
            setCount(currentCount);
            
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(endValue);
            }
          };
          
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    const el = elementRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, [target, duration]);

  return (
    <span ref={elementRef} className="font-heading">
      {count.toLocaleString('en-US')}{suffix}
    </span>
  );
}

export default function Home() {
  const { testimonials, fetchTestimonials } = useTestimonialStore();
  const { services, fetchServices } = useServiceStore();
  const { settings } = useSettingStore();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);

  // Ref for "Who We Are" section — used to trigger the quote popup
  const whoWeAreRef = useRef(null);

  const activeSlides = settings?.heroSlides && settings.heroSlides.length > 0
    ? settings.heroSlides
    : FALLBACK_SLIDES;

  useEffect(() => {
    fetchTestimonials();
    fetchServices();
  }, []);

  useEffect(() => {
    if (!testimonials || testimonials.length === 0) return;
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials]);

  const nextTestimonial = () => {
    if (!testimonials || testimonials.length === 0) return;
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };
  const prevTestimonial = () => {
    if (!testimonials || testimonials.length === 0) return;
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <>
      <Helmet>
        <title>Astitva Creations | Luxury Cinematic Photography</title>
        <meta name="description" content="Premium cinematic photography and videography for weddings and events." />
      </Helmet>

      {/* Quote Popup — triggered after passing "Who We Are" */}
      <QuotePopup triggerRef={whoWeAreRef} />

      {/* ─── Hero Section ─── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <HeroSlideshow slides={settings?.heroSlides || []} onSlideChange={setActiveSlide} />

        <AnimatePresence mode="wait">
          {activeSlide === 0 ? (
            <motion.div
              key="slide0-title-brand"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8 }}
              className="relative z-10 text-center px-4 max-w-5xl mx-auto"
            >
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-[var(--color-gold)] tracking-[0.5em] uppercase text-xs md:text-sm font-semibold mb-6"
              >
                {settings?.heroMainCaption || "Capturing Timeless Elegance"}
              </motion.h2>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="font-heading text-4xl md:text-6xl lg:text-7xl mb-8 leading-tight drop-shadow-2xl text-white"
                style={{ whiteSpace: 'pre-line' }}
              >
                {settings?.heroMainDescription || "Your Story,\nTold Cinematically."}
              </motion.h1>
            </motion.div>
          ) : (
            (activeSlides[activeSlide]?.caption || activeSlides[activeSlide]?.description) && (
              <motion.div
                key={`slide-overlay-${activeSlide}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 text-center z-20 pointer-events-none select-none"
              >
                {activeSlides[activeSlide]?.caption && (
                  <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl text-[var(--color-gold)] leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] max-w-3xl mx-auto mb-4">
                    {activeSlides[activeSlide].caption}
                  </h2>
                )}
                {activeSlides[activeSlide]?.description && (
                  <span 
                    className="text-white tracking-[0.35em] uppercase text-xs md:text-sm font-semibold block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {activeSlides[activeSlide].description}
                  </span>
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </section>

      {/* ─── Our Services ─── */}
      <section className="py-20 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-12"
          >
            Our Services
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col items-center cursor-pointer"
              >
                <Link to={`/services/${service.slug}`} className="w-full">
                  <div className="w-full aspect-[4/5] overflow-hidden mb-6 bg-[#111]">
                    <img
                      src={getOptimizedUrl(service.coverImage, 800)}
                      alt={service.title}
                      style={{ objectPosition: service.coverImagePosition || '50% 50%' }}
                      /* Grayscale by default, full color on hover */
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-[var(--color-gold)] text-center uppercase tracking-[0.2em] font-semibold text-base md:text-lg">
                    {service.title}
                  </h3>
                </Link>
              </motion.div>
            ))}
            {services.length === 0 && (
              <div className="col-span-full text-center text-[#A1A1A1]">Loading services...</div>
            )}
          </div>
        </div>
      </section>

      {/* ─── What We Do ─── */}
      <section className="py-20 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-14"
          >
            What we do?
          </motion.h2>

          {/* Top Row — 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#111] p-10 flex flex-col items-center text-center border border-[#1a1a1a] hover:border-[#333] transition-colors"
            >
              <h3 className="font-heading text-xl text-[var(--color-gold)] mb-6">Documentary Weddings</h3>
              <p className="text-[#A1A1A1] text-sm leading-relaxed mb-0 flex-grow">
                "Every wedding has a unique story, and we capture it as it unfolds. From heartfelt emotions to joyful celebrations, we preserve every moment beautifully. Your love, your journey, told in the most authentic way!"
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#111] p-10 flex flex-col items-center text-center border border-[#1a1a1a] hover:border-[#333] transition-colors"
            >
              <h3 className="font-heading text-xl text-[var(--color-gold)] mb-6">Conceptual Pre Wedding</h3>
              <p className="text-[#A1A1A1] text-sm leading-relaxed mb-0 flex-grow">
                "A pre-wedding shoot that goes beyond just beautiful frames — it's your story, creatively crafted. From dreamy themes to cinematic storytelling, we bring your love to life. Let's turn your journey into a timeless visual masterpiece!"
              </p>
            </motion.div>
          </div>

          {/* Bottom Row — 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Candid & Traditional Photography', desc: 'Every picture tells a story, and every frame captures an emotion. At Astitva Creations, we specialize in cinematic storytelling through our photography and videography, making your memories last forever.' },
              { title: 'Cinematic Videography', desc: 'At Astitva Creations, we bring the magic of cinema to your special moments with our cinematic videography. Whether it\'s a wedding, pre-wedding, event, or brand film, we craft visually stunning videos that feel like a movie.' },
              { title: 'Impactful Ad Film', desc: 'We specialize in high-quality ad film production that brings your brand\'s story to life! Whether it\'s a commercial, corporate video, brand film, or digital ad, we craft visually stunning and engaging content that connects with your audience.' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-[#111] p-8 flex flex-col items-center text-center border border-[#1a1a1a] hover:border-[#333] transition-colors"
              >
                <h3 className="font-heading text-lg text-[var(--color-gold)] mb-4">{card.title}</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed mb-0 flex-grow">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who We Are & Testimonials ─── */}
      <section ref={whoWeAreRef} className="py-20 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 text-center">

          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-8"
          >
            Who We Are
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#A1A1A1] text-sm md:text-base leading-relaxed mb-20 max-w-5xl mx-auto"
          >
            We come from a filmmaking background, so we don't just take pictures — we capture moments and turn them into a beautiful wedding story. Every couple is different. That's why we don't follow templates or fixed styles. Our goal is simple: to create wedding films and photographs that feel natural, emotional and timeless — something you will love even years later.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-32">
            {[
              { val: 1000, suffix: '+', label: 'WEDDINGS' },
              { val: 1000000, suffix: '+', label: 'TAKEN PHOTOS' },
              { val: 10000, suffix: '+', label: 'TAKEN FILMS' },
              { val: 1000, suffix: '+', label: 'HAPPY CLIENTS' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <h4 
                  className="text-[var(--color-gold)] text-4xl md:text-5xl mb-2"
                >
                  <AnimatedCounter target={stat.val} suffix={stat.suffix} />
                </h4>
                <p className="text-[#777] uppercase tracking-widest text-xs">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-12"
          >
            Testimonials
          </motion.h2>

          <div className="relative max-w-4xl mx-auto flex items-center justify-center min-h-[160px]">
            <button onClick={prevTestimonial} className="absolute left-0 text-[var(--color-gold)] hover:text-white transition-colors p-2 z-10">
              <ChevronLeft className="w-8 h-8" />
            </button>

            <div className="px-12 w-full">
              {testimonials && testimonials.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    className="w-full flex flex-col items-center"
                  >
                    <p className="text-[#A1A1A1] text-lg md:text-xl italic font-serif leading-relaxed mb-6">
                      {testimonials[currentTestimonial].text}
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-1 text-[var(--color-gold)] mb-1">
                        {[...Array(parseInt(testimonials[currentTestimonial]?.rating) || 5)].map((_, idx) => (
                          <span key={idx} className="text-lg leading-none">★</span>
                        ))}
                      </div>
                      <span className="text-[var(--color-gold)] font-bold uppercase tracking-widest text-sm">
                        {testimonials[currentTestimonial]?.author}
                      </span>
                      {testimonials[currentTestimonial]?.googleReviewUrl && (
                        <a
                          href={testimonials[currentTestimonial].googleReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] text-[var(--color-gold)]/60 hover:text-[var(--color-gold)] uppercase tracking-wider transition-colors duration-300"
                        >
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.78 0 3.42.67 4.67 1.865l2.405-2.405C17.585 1.83 15.08 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.66-.06-1.3-.17-1.945H12.24z"/>
                          </svg>
                          Verified Google Review ↗
                        </a>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : null}
            </div>

            <button onClick={nextTestimonial} className="absolute right-0 text-[var(--color-gold)] hover:text-white transition-colors p-2 z-10">
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {settings?.googleReviewUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-12 flex justify-center"
            >
              <a
                href={settings.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--color-gold)]/40 text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black transition-all duration-300 uppercase tracking-widest text-xs font-semibold hover:border-[var(--color-gold)] rounded-sm"
              >
                ★ Write a Google Review ★
              </a>
            </motion.div>
          )}
        </div>
      </section>

      <section className="py-20 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-start">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <h3 className="text-[var(--color-gold)] uppercase tracking-[0.2em] text-sm font-semibold mb-4">ABOUT FOUNDER</h3>
              <h2 className="font-heading text-3xl md:text-4xl text-[#E0E0E0] mb-8 tracking-wider">Tiru B</h2>

              <p className="text-[var(--color-gold)] uppercase tracking-wider text-sm leading-relaxed mb-8 font-semibold">
                PASSIONATE FILMMAKER AND STORYTELLER, DEDICATED TO CAPTURING RAW EMOTIONS THROUGH CINEMA AND PHOTOGRAPHY
              </p>

              <p className="text-[#A1A1A1] uppercase tracking-wider text-xs leading-[2] font-light text-justify">
                WITH YEARS OF EXPERIENCE IN EDITING, CINEMATOGRAPHY, AND DIRECTION, I BRING A DISTINCT VISUAL LANGUAGE TO EVERY FRAME I CREATE. MY JOURNEY IS DRIVEN BY THE DESIRE TO TELL STORIES THAT RESONATE — REAL, EMOTIONAL, AND TIMELESS. ASTITVA CREATIONS IS MY WAY OF PRESERVING LIFE'S MOST CHERISHED MOMENTS WITH AUTHENTICITY, ARTISTRY, AND HEART. FROM INTIMATE WEDDINGS TO CINEMATIC VISUALS, EVERY PROJECT IS A PIECE OF MY SOUL ON SCREEN. LET'S CREATE STORIES THAT INSPIRE, MEMORIES THAT LIVE FOREVER, AND MOMENTS THAT FEEL ALIVE FOREVER.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-1/2 flex flex-col items-center"
            >
              <div className="w-full max-w-[340px] sm:max-w-md lg:max-w-none lg:w-[340px] bg-[#111] overflow-hidden aspect-[4/5] mb-8 grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl">
                <img
                  src={settings?.ownerImage || "https://images.unsplash.com/photo-1533256054817-5e6080b06b9b?auto=format&fit=crop&q=80"}
                  alt="Tiru B - Founder"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-6">
                <a href="https://www.facebook.com/tirus324" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="https://www.instagram.com/tiru_324/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </a>
                <a href="https://x.com/tiru324" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:text-white transition-colors" title="X (Twitter)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>
                </a>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── Parallax CTA Section ─── */}
      <section 
        className="relative py-32 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: `url(${settings?.ctaImage || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80"})` }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#E0E0E0] text-xl md:text-2xl font-light tracking-widest mb-6 uppercase"
          >
            Are you ready to start new project with us?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#A1A1A1] text-[10px] md:text-xs leading-relaxed max-w-3xl mx-auto mb-10 tracking-widest uppercase font-light"
          >
            Let's create timeless memories together! Whether it's wedding, pre-wedding shoot or any special occasion, we're here to bring your vision to life
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link 
              to="/contact" 
              className="inline-block px-8 py-3.5 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors duration-300"
            >
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
