import { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Send, CheckCircle2 } from 'lucide-react';
import { useServiceStore } from '../../store/serviceStore';

export default function RequestFeedback() {
  const { services } = useServiceStore();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/feedback/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, clientEmail, eventType })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Reset form after a few seconds
        setTimeout(() => {
          setSuccess(false);
          setClientName('');
          setClientEmail('');
          setEventType('');
        }, 3000);
      } else {
        throw new Error(data.message || 'Failed to send feedback request');
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Request Feedback | Admin Dashboard</title>
      </Helmet>

      <div className="max-w-2xl">
        <div className="mb-8">
          <h2 className="font-heading text-3xl text-white mb-2">Request Client Feedback</h2>
          <p className="text-[#A1A1A1]">Generate a secure token link and send an email to a client requesting a testimonial for their event.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] p-8"
        >
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="font-heading text-2xl text-white mb-2">Request Sent!</h3>
              <p className="text-[#A1A1A1]">An email has been dispatched to {clientEmail} with their unique secure feedback link.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Client Full Name</label>
                <input 
                  type="text" 
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Rahul & Anjali"
                  className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Client Email Address</label>
                <input 
                  type="email" 
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Event Photographed</label>
                <select 
                  required
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors appearance-none"
                >
                  <option value="" disabled>Select Event Type</option>
                  {services.map(s => (
                    <option key={s._id} value={s.title}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[#222]">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating Token & Sending...' : (
                    <>Send Request Email <Send className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
}
