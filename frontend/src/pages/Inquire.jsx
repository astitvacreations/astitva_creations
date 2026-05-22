import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Calendar, MapPin, Phone, Mail, User, BookOpen, MessageSquare, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLeadStore } from '../store/leadStore';
import { useToastStore } from '../store/toastStore';

export default function Inquire() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addLead, isLoading } = useLeadStore();
  const { addToast } = useToastStore();

  const sourceParam = searchParams.get('source') || 'general';

  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    eventDate: '',
    location: '',
    notes: '',
    source: sourceParam
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (sourceParam) {
      setForm((f) => ({ ...f, source: sourceParam }));
    }
  }, [sourceParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.email || !form.phone) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }

    try {
      await addLead(form);
      addToast('Inquiry submitted successfully!', 'success');
      setIsSubmitted(true);
    } catch (error) {
      addToast(error.message || 'Failed to submit inquiry. Please try again.', 'error');
    }
  };

  const getSourceLabel = (slug) => {
    switch (slug) {
      case 'wedding':
        return 'Wedding Photography & Film';
      case 'pre-wedding':
        return 'Conceptual Pre-Wedding Stories';
      case 'vrwedding':
        return 'Immersive 360° VR Wedding Experience';
      default:
        return 'General Creative Inquiry';
    }
  };

  const fieldClass = "w-full bg-[#0d0d0d] border border-[#222] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors text-sm rounded-sm";
  const labelClass = "flex items-center gap-2 text-[#A1A1A1] text-xs uppercase tracking-widest mb-2 font-semibold";

  return (
    <>
      <Helmet>
        <title>Connect With Us | Astitva Creations</title>
        <meta name="description" content="Begin your premium cinematic journey. Share details of your landmark celebrations with our creative directors." />
      </Helmet>

      <div className="min-h-screen pt-32 pb-24 bg-[#050505] relative overflow-hidden flex items-center justify-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--color-gold)]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 max-w-2xl relative z-10">
          <Link 
            to={form.source === 'wedding' ? '/wedding-landing-page' : form.source === 'pre-wedding' ? '/prewedding-landing-page' : form.source === 'vrwedding' ? '/vrwedding-landing-page' : '/'}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#777] hover:text-[var(--color-gold)] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Experience
          </Link>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="form-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="bg-[#0f0f0f]/80 backdrop-blur-md border border-[#1c1c1c] p-8 md:p-12 shadow-3xl rounded-sm"
              >
                <div className="text-center mb-10">
                  <span className="text-[var(--color-gold)] tracking-[0.4em] uppercase text-[10px] font-bold mb-3 block">Astitva Creations</span>
                  <h1 className="font-heading text-3xl md:text-4xl text-white mb-3">Begin Your Story</h1>
                  <p className="text-[#A1A1A1] text-sm font-light">Share your celebration milestones. Our directors will customize a tailored cinematic package for you.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Name */}
                  <div>
                    <label className={labelClass}><User className="w-4 h-4 text-[var(--color-gold)]" /> Name *</label>
                    <input 
                      type="text" 
                      required
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className={fieldClass}
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}><Mail className="w-4 h-4 text-[var(--color-gold)]" /> Email Address *</label>
                      <input 
                        type="email" 
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="aarav@example.com"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}><Phone className="w-4 h-4 text-[var(--color-gold)]" /> Phone Number *</label>
                      <input 
                        type="tel" 
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  {/* Event Date & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}><Calendar className="w-4 h-4 text-[var(--color-gold)]" /> Event Date (Optional)</label>
                      <input 
                        type="date" 
                        value={form.eventDate}
                        onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                        className={`${fieldClass} cursor-pointer`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}><MapPin className="w-4 h-4 text-[var(--color-gold)]" /> Location (Optional)</label>
                      <input 
                        type="text" 
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="e.g. Hyderabad, India"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  {/* Source / Selection */}
                  <div>
                    <label className={labelClass}><BookOpen className="w-4 h-4 text-[var(--color-gold)]" /> Interested In</label>
                    <select 
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className={`${fieldClass} cursor-pointer`}
                    >
                      <option value="general">General Creative Inquiry</option>
                      <option value="wedding">Wedding Photography & Film</option>
                      <option value="pre-wedding">Conceptual Pre-Wedding Stories</option>
                      <option value="vrwedding">Immersive 360° VR Wedding Experience</option>
                    </select>
                  </div>

                  {/* Notes / Message */}
                  <div>
                    <label className={labelClass}><MessageSquare className="w-4 h-4 text-[var(--color-gold)]" /> Tell us about your vision</label>
                    <textarea 
                      rows="4" 
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Give us details about your dates, preferences, number of guests, or custom requests..."
                      className={`${fieldClass} resize-y h-28`}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-extrabold text-xs hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting Details...' : 'Submit Inquiry'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0f0f0f] border border-green-500/20 p-8 md:p-12 shadow-3xl text-center rounded-sm"
              >
                <div className="flex justify-center mb-6">
                  <CheckCircle2 className="w-16 h-16 text-green-500 animate-pulse" />
                </div>
                <span className="text-[var(--color-gold)] tracking-[0.4em] uppercase text-[10px] font-bold mb-3 block">Thank You</span>
                <h2 className="font-heading text-3xl text-white mb-4">Inquiry Received</h2>
                <p className="text-[#A1A1A1] text-sm leading-relaxed mb-8 max-w-md mx-auto">
                  We have captured your details for the <strong className="text-white">{getSourceLabel(form.source)}</strong> request. 
                  Our lead coordinator will reach out to you within 24 hours at <strong className="text-white">{form.phone}</strong> or via email.
                </p>

                <div className="p-6 border border-[#1a1a1a] bg-[#070707] text-left text-xs text-[#A1A1A1] space-y-2 mb-8">
                  <div><strong className="text-white uppercase tracking-wider block mb-1">Details Submitted:</strong></div>
                  <div>Name: <span className="text-white">{form.customerName}</span></div>
                  <div>Email: <span className="text-white">{form.email}</span></div>
                  {form.eventDate && <div>Date: <span className="text-white">{new Date(form.eventDate).toLocaleDateString('en-IN')}</span></div>}
                  {form.location && <div>Location: <span className="text-white">{form.location}</span></div>}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link 
                    to="/" 
                    className="px-8 py-3 bg-[#111] border border-[#222] text-white hover:bg-[#222] transition-colors text-xs uppercase tracking-widest font-bold"
                  >
                    Home Page
                  </Link>
                  <Link 
                    to={form.source === 'wedding' ? '/wedding-landing-page' : form.source === 'pre-wedding' ? '/prewedding-landing-page' : form.source === 'vrwedding' ? '/vrwedding-landing-page' : '/'}
                    className="px-8 py-3 bg-[var(--color-gold)] text-black hover:bg-white transition-colors text-xs uppercase tracking-widest font-extrabold"
                  >
                    Back to Experience
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
