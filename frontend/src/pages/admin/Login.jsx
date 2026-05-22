import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Lock } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const AUTHORIZED_EMAILS = ['admin@astitvacreations.com', 'owner@astitvacreations.com'];

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      setError('Unauthorized email address. Access denied.');
      return;
    }
    
    // Simulate API Call
    setTimeout(() => setStep(2), 1000);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    // Simulate API Call & Persist Login
    localStorage.setItem('admin_auth', 'true');
    setTimeout(() => navigate('/admin/dashboard'), 1000);
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto focus next
    if (value !== '' && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | Astitva Creations</title>
      </Helmet>

      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
        {/* Cinematic Backdrop Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-gold)]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222] p-10 max-w-md w-full shadow-2xl relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)] flex items-center justify-center text-[var(--color-gold)]">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          
          <h1 className="font-heading text-3xl text-center text-white mb-2">Secure Gateway</h1>
          <p className="text-center text-[#A1A1A1] text-sm mb-10">Enter your credentials to access the Astitva command center.</p>

          {error && (
            <div className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 text-xs text-center uppercase tracking-widest font-bold rounded">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Admin Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  placeholder="admin@astitvacreations.com"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors">
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-8">
              <div className="text-center">
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-4">Enter 6-digit OTP sent to {email}</label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-14 bg-[#1a1a1a] border border-[#333] text-center text-xl text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors">
                Verify & Login
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-[#A1A1A1] uppercase tracking-widest hover:text-white transition-colors">
                Back to Email
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </>
  );
}
