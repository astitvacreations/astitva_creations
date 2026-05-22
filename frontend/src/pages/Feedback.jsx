import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Star, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTestimonialStore } from '../store/testimonialStore';

export default function Feedback() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const eventFromUrl = searchParams.get('event');
  
  const [email, setEmail] = useState('');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/feedback/validate/${token}?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok) {
        setAuthor(data.data.clientName);
        setVerified(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a star rating.');
    
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          author, 
          text, 
          rating, 
          event: eventFromUrl 
        })
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="bg-[#111] border border-[#222] p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl text-white mb-2">Missing Token</h2>
          <p className="text-[#A1A1A1]">A secure link is required to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Client Feedback | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen bg-[#050505] pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          
          <div className="text-center mb-12">
            <h1 className="font-heading text-4xl text-[var(--color-gold)] mb-4">Client Feedback</h1>
            <p className="text-[#A1A1A1]">Luxury is in the details, and so is your experience.</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-[#222] p-8 md:p-12 shadow-2xl"
          >
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="font-heading text-3xl text-white mb-4">Thank You!</h2>
                <p className="text-[#A1A1A1] text-lg">Your feedback has been successfully added to our Testimonials wall.</p>
              </div>
            ) : !verified ? (
              <div className="space-y-8">
                <div className="text-center">
                  <ShieldCheck className="w-16 h-16 text-[var(--color-gold)] mx-auto mb-6" />
                  <h2 className="font-heading text-2xl text-white mb-2">Secure Verification</h2>
                  <p className="text-[#A1A1A1] text-sm">Please enter the email address where you received the request to unlock the form.</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-4">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. client@example.com"
                      className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-4 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-4 border border-red-500/20">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Unlock Feedback Form'}
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-4">Welcome, {author}</label>
                  <div className="text-center border-b border-[#222] pb-8 mb-8">
                    <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-6">Rate our Service</label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star 
                            className={`w-10 h-10 ${
                              star <= (hoverRating || rating) 
                                ? 'text-[var(--color-gold)] fill-[var(--color-gold)]' 
                                : 'text-[#333]'
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-4">Write your Review</label>
                      <textarea 
                        required
                        rows="6" 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Tell us what you loved about the photos, the video, the team..."
                        className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-4 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Testimonial'}
                    </button>
                  </div>
                </motion.div>
              </form>
            )}
          </motion.div>

        </div>
      </div>
    </>
  );
}
