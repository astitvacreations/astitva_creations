import { useRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

const ServiceCard = ({ service, index }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  // Auto slide continuously
  useEffect(() => {
    let interval;
    if (service.images.length > 1) {
      // Offset start slightly for each card so they don't slide in exact unison
      const startDelay = setTimeout(() => {
        interval = setInterval(() => {
          setIsTransitioning(true);
          setCurrentIdx((prev) => prev + 1);
        }, 3000);
      }, index * 500);
      
      return () => {
        clearTimeout(startDelay);
        clearInterval(interval);
      };
    }
  }, [service.images.length, index]);

  // Handle circular wrap around
  useEffect(() => {
    if (currentIdx === service.images.length) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIdx(0);
      }, 500); // Wait for sliding animation to finish
      return () => clearTimeout(timeout);
    }
  }, [currentIdx, service.images.length]);

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart || service.images.length <= 1) return;
    const touchEnd = e.changedTouches[0].clientX;
    
    if (touchStart - touchEnd > 50) { // Swipe left (next)
      if (currentIdx >= service.images.length) return;
      setIsTransitioning(true);
      setCurrentIdx((p) => p + 1);
    }
    if (touchStart - touchEnd < -50) { // Swipe right (prev)
      if (currentIdx === 0) {
        setIsTransitioning(false);
        setCurrentIdx(service.images.length);
        setTimeout(() => {
          setIsTransitioning(true);
          setCurrentIdx(service.images.length - 1);
        }, 50);
      } else {
        setIsTransitioning(true);
        setCurrentIdx((p) => p - 1);
      }
    }
  };

  const nextImg = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    if (currentIdx >= service.images.length) return;
    setIsTransitioning(true);
    setCurrentIdx((p) => p + 1); 
  };
  
  const prevImg = (e) => { 
    e.preventDefault(); 
    e.stopPropagation(); 
    if (currentIdx === 0) {
      setIsTransitioning(false);
      setCurrentIdx(service.images.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setCurrentIdx(service.images.length - 1);
      }, 50);
    } else {
      setIsTransitioning(true);
      setCurrentIdx((p) => p - 1); 
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="bg-[#111] rounded-2xl overflow-hidden border border-[#222] hover:border-[var(--color-gold)]/40 transition-colors flex flex-col group relative"
    >
      <div className="relative h-72 md:h-[22rem] overflow-hidden bg-black">
        {/* Carousel Images */}
        <div 
          className={`flex h-full ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`} 
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {/* Clone the first image at the end to create seamless infinite scroll */}
          {[...service.images, service.images[0]].map((img, idx) => (
            <img 
              key={idx} 
              src={img} 
              alt={`${service.title} - ${idx + 1}`} 
              className="w-full h-full object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
            />
          ))}
        </div>
        
        {/* Arrows */}
        {service.images.length > 1 && (
          <>
            <button 
              onClick={prevImg} 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-[var(--color-gold)] hover:text-black border border-white/20 hover:border-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={nextImg} 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-[var(--color-gold)] hover:text-black border border-white/20 hover:border-transparent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
        
        {/* Gradient Overlay to blend with text section */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-90 pointer-events-none" />
      </div>

      <div className="p-6 lg:p-8 flex-grow flex flex-col relative z-20 -mt-16">
        <span className="text-[#A1A1A1] uppercase tracking-[0.2em] text-[10px] md:text-xs font-semibold mb-2">{service.label}</span>
        <h3 className="font-heading text-xl md:text-2xl text-white mb-3 uppercase leading-snug">{service.title}</h3>
        <p className="text-[#888] text-sm md:text-base leading-relaxed font-light">{service.desc}</p>
      </div>
    </motion.div>
  );
};

export default function ReferenceLandingPage() {
  const photosRef = useRef(null);
  const videosRef = useRef(null);

  // Auto-scroll logic for galleries
  useEffect(() => {
    let animationId;
    let isHoveredOrActive = false;

    const setPause = () => { isHoveredOrActive = true; };
    const setResume = () => { isHoveredOrActive = false; };

    const refs = [photosRef, videosRef];
    
    refs.forEach(ref => {
      if (ref.current) {
        ref.current.addEventListener('mouseenter', setPause);
        ref.current.addEventListener('mouseleave', setResume);
        ref.current.addEventListener('touchstart', setPause, {passive: true});
        ref.current.addEventListener('touchend', setResume, {passive: true});
      }
    });

    let frameCount = 0;
    const scroll = () => {
      frameCount++;
      if (!isHoveredOrActive) {
        refs.forEach(ref => {
          if (ref.current) {
            const isMobile = window.innerWidth < 768;
            if (isMobile && frameCount % 2 === 0) return; // Skip every other frame on mobile
            ref.current.scrollLeft += 1;
            if (ref.current.scrollLeft >= ref.current.scrollWidth - ref.current.clientWidth - 1) {
              ref.current.scrollLeft = 0;
            }
          }
        });
      }
      animationId = requestAnimationFrame(scroll);
    };
    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.removeEventListener('mouseenter', setPause);
          ref.current.removeEventListener('mouseleave', setResume);
          ref.current.removeEventListener('touchstart', setPause);
          ref.current.removeEventListener('touchend', setResume);
        }
      });
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Timeless Wedding Photography | Astitva Creations</title>
        <meta name="description" content="Professional wedding photography & cinematography with stunning visuals, creative storytelling, and unforgettable memories." />
      </Helmet>

      {/* ─── Hero Section ─── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80"
            alt="Wedding Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0B0B0B]" />
        </div>

        <div className="relative z-10 px-4 max-w-4xl mx-auto text-center mt-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--color-gold)] tracking-[0.5em] uppercase text-xs lg:text-sm xl:text-base font-semibold mb-6"
          >
            Astitva Creations
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="font-heading text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight text-white"
          >
            Timeless Wedding Photography
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/90 text-xl md:text-2xl font-serif italic mb-8 drop-shadow-md"
          >
            "Your Love Story, Captured Forever."
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-[#A1A1A1] text-sm md:text-base leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Professional wedding photography & cinematography with stunning visuals, creative storytelling, and unforgettable memories.
          </motion.p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col items-center justify-center"
            >
              <p className="text-white/80 uppercase tracking-widest text-xs font-semibold mb-2">Wedding Packages Start From Just</p>
              <p className="font-heading text-4xl text-[var(--color-gold)] leading-none">₹24,999/-</p>
            </motion.div>

            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
              <Link
                to="/quote"
                className="inline-flex items-center gap-2 px-10 py-5 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              >
                Book Now <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Intro Video ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.h3 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-4"
          >
            Every Moment. Every Emotion. Beautifully Preserved.
          </motion.h3>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative aspect-video rounded-lg overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.15)] border border-[#333] mt-12 bg-[#111] group cursor-pointer"
          >
            <img 
              src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80" 
              alt="Intro Video Thumbnail" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-black/60 flex items-center justify-center border-2 border-white/50 group-hover:border-[var(--color-gold)] group-hover:scale-110 transition-all duration-300">
                <Play className="w-8 h-8 text-white group-hover:text-[var(--color-gold)] transition-colors fill-current ml-1" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Our Approach ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] mb-4 uppercase tracking-widest"
            >
              Our Approach
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1A1] text-sm md:text-base font-light"
            >
              Capturing the purest moments with utmost care and creativity.
            </motion.p>
          </div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#050505] border border-[#1a1a1a] rounded-xl p-8 max-w-sm w-full shadow-lg"
            >
              <span className="text-[var(--color-gold)] font-heading text-2xl block mb-2">01</span>
              <h3 className="text-white font-heading text-xl uppercase mb-3">Main Heading</h3>
              <p className="text-[#A1A1A1] text-xs leading-relaxed font-light">
                .asfjdlkabglk a;dosiahngjasdka
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── What We Do Best ─── */}
      <section className="py-24 bg-[#050505]">
        <div className="max-w-[85rem] mx-auto px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            What We Do Best
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: 'Pre-Wedding Shoots', 
                desc: 'Romantic outdoor and creative concept shoots that celebrate your journey together.',
                images: [
                  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80'
                ],
                label: 'ROMANTIC'
              },
              { 
                title: 'Wedding Day Photography', 
                desc: 'Capturing every ritual, emotion, smile, and candid moment from start to finish.',
                images: [
                  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80'
                ],
                label: 'CANDID'
              },
              { 
                title: 'Cinematic Wedding Films', 
                desc: 'Beautifully edited wedding movies that tell your love story like a film.',
                images: [
                  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80'
                ],
                label: 'CINEMATIC'
              },
              { 
                title: 'Reception & Engagement', 
                desc: 'Elegant photography and videography for all your wedding celebrations.',
                images: [
                  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80'
                ],
                label: 'ELEGANT'
              }
            ].map((service, i) => (
              <ServiceCard key={i} service={service} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Best Clicks ─── */}
      <section className="py-24 bg-[#0B0B0B] overflow-hidden">
        <div className="w-full px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Our Best Clicks
          </motion.h2>

          <div className="relative group/gallery">
            <div ref={photosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
              {[
                'https://images.unsplash.com/photo-1519741497674-611481863552',
                'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
                'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
                'https://images.unsplash.com/photo-1532712938310-34cb3982ef74',
                'https://images.unsplash.com/photo-1511285560929-80b456fea0bc'
              ].map((img, i) => (
                <div key={i} className="relative shrink-0 w-auto h-[45vh] md:h-[50vh] lg:h-[60vh] max-h-[600px] overflow-hidden bg-[#111] rounded-xl md:rounded-none">
                  <img src={`${img}?auto=format&fit=crop&q=80&w=800`} alt={`Best Click ${i + 1}`} className="w-auto h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Couples Love Our Studio ─── */}
      <section className="py-24 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Why Couples Love Our Studio
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Creative Storytelling', desc: 'Every wedding is unique, and we craft visuals that reflect your personal love story.' },
              { title: 'Experienced Team', desc: 'Dedicated photographers, cinematographers, and editors ensuring flawless coverage.' },
              { title: 'Premium Editing', desc: 'High-end color grading, cinematic highlights, reels, and wedding films.' },
              { title: 'Luxury Albums', desc: 'Premium-quality albums, designer photo books, and elegant wall frames.' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] p-8 border-l-2 border-[var(--color-gold)] hover:bg-[#1a1a1a] transition-colors"
              >
                <h3 className="font-heading text-xl text-white mb-3">{feature.title}</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comfort & Stress-Free Experience ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Comfort & Stress-Free Experience
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Complete Event Coordination', desc: 'Our team works seamlessly with your schedule and wedding planners.' },
              { title: 'Timely Delivery', desc: 'Fast turnaround for edited photos, videos, reels, and albums.' },
              { title: 'Friendly & Supportive', desc: 'We make couples feel comfortable and natural in front of the camera.' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--color-gold)]/10 flex items-center justify-center mx-auto mb-6">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-gold)]" />
                </div>
                <h3 className="font-heading text-xl text-white mb-4">{feature.title}</h3>
                <p className="text-[#A1A1A1] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Wedding Films ─── */}
      <section className="py-24 bg-[#050505] overflow-hidden">
        <div className="w-full px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-16"
          >
            Our Wedding Films
          </motion.h2>

          <div className="relative group/gallery">
            <div ref={videosRef} className="flex items-center overflow-x-auto gap-4 md:gap-6 hide-scrollbar pb-8 px-4 lg:px-12">
              {[
                'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
                'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
                'https://images.unsplash.com/photo-1606216794074-735e91aa2c92'
              ].map((img, i) => (
                <div 
                  key={i} 
                  className="relative shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] aspect-video bg-[#111] border border-[#222] rounded-xl md:rounded-none overflow-hidden"
                >
                  <img src={`${img}?auto=format&fit=crop&q=80&w=800`} alt={`Video ${i}`} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center border border-white/50">
                      <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Packages ─── */}
      <section className="py-24 bg-[#0B0B0B]">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl text-[var(--color-gold)] text-center mb-4"
          >
            Our Packages
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center text-[#A1A1A1] text-sm md:text-base font-light mb-16 max-w-2xl mx-auto"
          >
            Transparent pricing with premium deliverables tailored to capture your special day perfectly.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Essential',
                price: '₹24,999',
                features: ['Traditional Photography', 'Candid Photography', 'Traditional Videography', '50 Page Premium Album', 'Soft Copies on Pen Drive'],
                recommended: false
              },
              {
                title: 'Premium',
                price: '₹44,999',
                features: ['Everything in Essential', 'Cinematic Wedding Film', 'Pre-Wedding Shoot (1 Day)', 'Drone Coverage', 'Highlight Teaser Reel', '70 Page Luxury Album'],
                recommended: true
              },
              {
                title: 'Luxury',
                price: '₹74,999',
                features: ['Everything in Premium', 'Pre-Wedding Shoot (2 Days)', '2nd Cinematographer', 'Same Day Edit Video', '100 Page Ultra-Luxury Album', 'Parent Albums (x2)'],
                recommended: false
              }
            ].map((pkg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-[#050505] rounded-2xl p-8 border ${pkg.recommended ? 'border-[var(--color-gold)] relative shadow-[0_0_30px_rgba(212,175,55,0.15)]' : 'border-[#222] hover:border-[#444]'} transition-colors flex flex-col`}
              >
                {pkg.recommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <h3 className="font-heading text-4xl text-white mb-2">{pkg.title}</h3>
                <div className="text-[var(--color-gold)] font-heading text-2xl mb-6">{pkg.price}</div>
                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-[#A1A1A1] text-sm font-light">
                        <svg className="w-5 h-5 text-[var(--color-gold)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/quote"
                  className={`w-full py-4 rounded-full text-center uppercase tracking-widest text-sm font-semibold transition-all duration-300 ${pkg.recommended ? 'bg-[var(--color-gold)] text-black hover:bg-white shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'bg-transparent border border-[#333] text-white hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]'}`}
                >
                  Choose Package
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-40 text-center bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center bg-no-repeat bg-fixed">
        <div className="absolute inset-0 bg-black/80" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-4xl mx-auto px-4"
        >
          <h2 className="font-heading text-3xl md:text-5xl text-[var(--color-gold)] mb-8 leading-tight">
            Affordable Premium Wedding Photography<br/>
            <span className="text-white text-2xl md:text-4xl mt-4 block">Starts From Just ₹24,999/-</span>
          </h2>
          <p className="text-[#A1A1A1] text-base md:text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
            Get professional photography, cinematic videography, creative editing, premium albums, and a dedicated team to capture your special day without exceeding your budget.
          </p>
          <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}>
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 px-12 py-5 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              Book Your Wedding Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
