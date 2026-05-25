import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Lock, Mail, KeyRound, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Login() {
  // 1 = Login (Email+Pass), 2 = Login OTP, 3 = Forgot Password, 4 = Reset OTP + New Pass
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const getOtpString = () => otp.join('');

  // ---------- STEP 1: Login (Email & Password) ----------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setOtp(['', '', '', '', '', '']);
        setStep(2); // Go to OTP verification
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- STEP 2: Verify Login OTP ----------
  const handleLoginOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${apiBase}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: getOtpString() })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setAuth(data.data); // Update global auth store
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- STEP 3: Forgot Password ----------
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setOtp(['', '', '', '', '', '']);
        setStep(4); // Go to Reset Password OTP
      } else {
        setError(data.message || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- STEP 4: Reset Password ----------
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: getOtpString(), newPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStep(1); // Go back to login
        setPassword('');
        setError('');
        // Optional: show a success toast here
      } else {
        setError(data.message || 'Invalid OTP or failed to reset');
      }
    } catch (err) {
      setError('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- OTP Input Handler ----------
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto focus next
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
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
              {step === 3 || step === 4 ? <KeyRound className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
          </div>
          
          <h1 className="font-heading text-3xl text-center text-white mb-2">Secure Gateway</h1>
          <p className="text-center text-[#A1A1A1] text-sm mb-10">
            {step === 1 && "Enter your credentials to access the Astitva command center."}
            {step === 2 && "A 6-digit OTP has been sent to your email."}
            {step === 3 && "Enter your email to reset your password."}
            {step === 4 && "Check your email for the reset OTP."}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 border border-red-500/50 bg-red-500/10 text-red-500 text-xs text-center uppercase tracking-widest font-bold rounded"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 1: Login */}
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLoginSubmit} 
              className="space-y-6"
            >
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    placeholder="admin@astitvacreations.com"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs uppercase tracking-widest text-[#A1A1A1]">Password</label>
                  <button type="button" onClick={() => setStep(3)} className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest hover:underline">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </motion.form>
          )}

          {/* STEP 2: Login OTP */}
          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLoginOtpSubmit} 
              className="space-y-8"
            >
              <div className="text-center">
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-4">Enter Login OTP</label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      autoComplete="off"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-14 bg-[#1a1a1a] border border-[#333] text-center text-xl text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  ))}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enter'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 text-xs text-[#A1A1A1] uppercase tracking-widest hover:text-white transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </button>
            </motion.form>
          )}

          {/* STEP 3: Forgot Password (Email) */}
          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleForgotSubmit} 
              className="space-y-6"
            >
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    placeholder="admin@astitvacreations.com"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset OTP'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 text-xs text-[#A1A1A1] uppercase tracking-widest hover:text-white transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </button>
            </motion.form>
          )}

          {/* STEP 4: Reset Password (OTP + New Pass) */}
          {step === 4 && (
            <motion.form 
              key="step4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleResetSubmit} 
              className="space-y-6"
            >
              <div className="text-center">
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-4">Enter Reset OTP</label>
                <div className="flex justify-between gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      autoComplete="off"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-14 bg-[#1a1a1a] border border-[#333] text-center text-xl text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                    placeholder="New password"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 text-xs text-[#A1A1A1] uppercase tracking-widest hover:text-white transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </button>
            </motion.form>
          )}

        </motion.div>
      </div>
    </>
  );
}

// Inline fallback for ArrowLeft icon if missing from lucide imports
function ArrowLeft(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
  );
}
