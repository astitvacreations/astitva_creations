import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Quote } from 'lucide-react';
import { useTestimonialStore } from '../store/testimonialStore';
import { useSettingStore } from '../store/settingStore';

export default function Testimonials() {
  const { testimonials } = useTestimonialStore();
  const { settings } = useSettingStore();

  return (
    <>
      <Helmet>
        <title>Client Stories | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B]">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-4xl md:text-6xl text-[var(--color-gold)] mb-6"
            >
              Client Stories
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1A1] text-lg leading-relaxed font-light"
            >
              Don't just take our word for it. Hear from the beautiful couples who trusted us to immortalize their most cherished moments.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {testimonials.map((review, i) => (
              <motion.div 
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111] border border-[#222] p-10 relative group hover:border-[var(--color-gold)] transition-colors duration-500"
              >
                <Quote className="w-12 h-12 text-[var(--color-gold)]/20 absolute top-8 right-8 group-hover:text-[var(--color-gold)]/40 transition-colors duration-500" />
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex gap-1 text-[var(--color-gold)]">
                    {[...Array(parseInt(review.rating) || 5)].map((_, idx) => (
                      <span key={idx}>★</span>
                    ))}
                  </div>
                  {review.googleReviewUrl && (
                    <a
                      href={review.googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[9px] text-[var(--color-gold)] uppercase tracking-widest border border-[var(--color-gold)]/20 px-2.5 py-1 bg-black/40 hover:bg-[var(--color-gold)]/15 hover:border-[var(--color-gold)]/40 transition-all duration-300"
                    >
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.78 0 3.42.67 4.67 1.865l2.405-2.405C17.585 1.83 15.08 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.66-.06-1.3-.17-1.945H12.24z"/>
                      </svg>
                      Verified Review ↗
                    </a>
                  )}
                </div>
                
                <p className="text-[#A1A1A1] leading-relaxed mb-8 relative z-10 italic">
                  "{review.text}"
                </p>
                
                <div className="border-t border-[#333] pt-6 flex justify-between items-end relative z-10">
                  <div>
                    <h4 className="font-heading text-xl text-white mb-1">{review.author}</h4>
                    <p className="text-xs text-[var(--color-gold)] uppercase tracking-widest">{review.event}</p>
                  </div>
                  <span className="text-xs text-[#555] uppercase tracking-widest">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {settings?.googleReviewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[var(--color-gold)]/40 p-10 text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden group rounded-sm"
            >
              {/* Decorative background logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-gold)]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--color-gold)]/10 transition-colors duration-500"></div>
              
              <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
                {/* Google Icon and Star rating */}
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 fill-current text-[var(--color-gold)]" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.78 0 3.42.67 4.67 1.865l2.405-2.405C17.585 1.83 15.08 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.66-.06-1.3-.17-1.945H12.24z"/>
                  </svg>
                  <span className="font-heading text-2xl font-bold tracking-wide text-white">Google Reviews</span>
                </div>
                
                <div className="flex gap-1 text-[var(--color-gold)] text-xl font-bold">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                
                <p className="text-[#A1A1A1] text-sm leading-relaxed max-w-md">
                  Have we captured a moment that lives forever in your heart? We'd be deeply honored if you shared your experience with a review on Google.
                </p>
                
                <a
                  href={settings.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors duration-300 shadow-md"
                >
                  Write a Google Review
                </a>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}

