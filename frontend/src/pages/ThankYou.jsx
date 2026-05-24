import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function ThankYou() {
  const location = useLocation();
  const navigate = useNavigate();

  // If someone randomly accesses /thank-you, we could optionally redirect them
  // But let's just let them see it or check if they came from a form.

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Thank You | Astitva Creations</title>
      </Helmet>

      <section className="min-h-[80vh] flex items-center justify-center bg-[#0B0B0B] py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8, delay: 0.2 }}
            className="w-24 h-24 bg-[var(--color-gold)]/10 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle className="w-12 h-12 text-[var(--color-gold)]" />
          </motion.div>
          
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[var(--color-gold)] mb-6 tracking-wide">
            Thank You!
          </h1>
          
          <p className="text-[#A1A1A1] text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10 uppercase tracking-widest font-light">
            We have successfully received your inquiry. Our team will review your details and get back to you shortly to discuss your vision.
          </p>

          <Link 
            to="/" 
            className="inline-block px-10 py-4 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors duration-300 shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.3)]"
          >
            Return to Homepage
          </Link>
        </motion.div>
      </section>
    </>
  );
}
