import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Camera,
  Folder,
  ArrowRight,
  Shield,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToastStore } from '../store/toastStore';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MyGallery() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');
  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientShoots, setClientShoots] = useState(null);
  const [error, setError] = useState('');

  // Auto-search if email is provided in URL
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      handleLookup(urlEmail);
    }
  }, []);

  const handleLookup = async (emailToSearch, pinCode) => {
    const targetEmail = (emailToSearch || emailInput).trim();
    if (!targetEmail) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/client-gallery/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetEmail,
          pin: (pinCode !== undefined ? pinCode : pinInput).trim()
        }),
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setClientShoots(data.galleries || []);
        if (data.galleries?.length === 0) {
          setError('No active galleries found for this email.');
        }
      } else {
        setError(data.message || 'No galleries found for this email address.');
        setClientShoots(null);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLookup();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[var(--color-gold)] selection:text-black font-body flex flex-col justify-between">
      <Helmet>
        <title>Client Gallery Portal | Astitva Creations</title>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-16 w-full space-y-10 flex-1">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--color-gold)] font-semibold">
            Astitva Creations
          </span>
          <h1 className="text-3xl md:text-5xl font-heading text-white uppercase tracking-wider">
            Client Gallery Portal
          </h1>
          <p className="text-sm text-[#888] max-w-lg mx-auto">
            Enter the email address registered with your shoot to view and select your event photos.
          </p>
        </div>

        {/* Email Lookup Card */}
        <div className="bg-[#121417] border border-[#20232b] rounded-2xl p-6 md:p-8 max-w-xl mx-auto space-y-5">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Registered Client Email
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="client@example.com"
                className="w-full bg-[#181a20] border border-[#2a2d35] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#4a5568] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Access Passcode (Optional)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="4-digit PIN (if required)"
                className="w-full bg-[#181a20] border border-[#2a2d35] rounded-lg px-4 py-3 text-sm text-white placeholder-[#555] focus:border-[#4a5568] focus:outline-none font-mono transition-colors"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white hover:bg-gray-200 text-black font-semibold text-xs tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Searching Shoots...
                </>
              ) : (
                <>
                  View My Galleries &rarr;
                </>
              )}
            </button>
          </form>
        </div>

        {/* Shoot Results List */}
        {clientShoots && clientShoots.length > 0 && (
          <div className="space-y-4 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center">
              Your Available Shoots ({clientShoots.length})
            </h2>

            <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto">
              {clientShoots.map((shoot) => (
                <div
                  key={shoot.galleryId}
                  onClick={() => navigate(`/gallery/${shoot.galleryId}`)}
                  className="bg-[#121417] border border-[#20232b] hover:border-[#383e4d] rounded-xl p-5 flex items-center justify-between gap-4 cursor-pointer group transition-all"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white group-hover:text-[var(--color-gold)] transition-colors uppercase tracking-wide">
                      {shoot.clientName} &mdash; {shoot.eventName}
                    </div>
                    {shoot.eventDate && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(shoot.eventDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {shoot.status === 'Submitted' ? (
                      <span className="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-[#152820] text-[#10b981] border border-[#1e4535]">
                        Submitted
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-[#2a2215] text-[#eab308] border border-[#443818]">
                        Selecting
                      </span>
                    )}

                    <div className="w-8 h-8 rounded-full bg-[#1c1f26] group-hover:bg-white text-gray-400 group-hover:text-black flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-6 text-xs text-[#555] border-t border-[#1a1a1a]">
        &copy; {new Date().getFullYear()} Astitva Creations &bull; Professional Photography & Cinematography
      </div>
    </div>
  );
}
