import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { signup, login } from '../services/api';
import {
  Pill, ShieldCheck, BookOpen, Phone, MapPin, Hash,
  LogIn, UserPlus, AlertCircle, CheckCircle, X,
  Stethoscope, Building2, FileText, CreditCard, BarChart3,
  AlertTriangle, ArrowRight
} from 'lucide-react';

const particles = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  size: Math.random() * 3 + 1,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 4,
  duration: Math.random() * 3 + 3,
}));

export default function LandingPage() {
  const [mode, setMode] = useState(null);
  const [loginMethod, setLoginMethod] = useState('dl');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningPopup, setWarningPopup] = useState(null); // { message, type: 'wrong' | 'notFound' }
  const { loginUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signup(form);
      loginUser(res.data.user, res.data.token);
      setSuccess('Registration successful!');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let payload;
      if (loginMethod === 'dl') payload = { dlNumber: form.dlNumber, phone: form.phone };
      else if (loginMethod === 'shop') payload = { shopName: form.shopName };
      else payload = { doctorName: form.doctorName };

      const res = await login(payload);
      loginUser(res.data.user, res.data.token);
      setSuccess('Login successful!');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      const data = err.response?.data;
      if (data?.notFound) {
        // Account not found → show popup and offer signup
        setWarningPopup({
          message: data.error,
          type: 'notFound',
        });
      } else if (data?.wrongCredentials) {
        // Wrong password → show warning popup
        setWarningPopup({
          message: data.error,
          type: 'wrong',
        });
      } else {
        setWarningPopup({
          message: data?.error || 'Login failed. Please check your credentials.',
          type: 'wrong',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const resetMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setForm({});
  };

  const handleWarningAction = () => {
    if (warningPopup?.type === 'notFound') {
      setWarningPopup(null);
      resetMode('signup');
    } else {
      setWarningPopup(null);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen video-bg relative flex flex-col">
      {/* Background layers */}
      <div className="aurora-layer">
        <div className="streak" /><div className="streak" /><div className="streak" /><div className="streak" />
      </div>
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      {particles.map((p) => (
        <div key={p.id} className="particle" style={{ width: p.size+'px', height: p.size+'px', left: p.left+'%', top: p.top+'%', animationDelay: p.delay+'s', animationDuration: p.duration+'s' }} />
      ))}
      <div className="noise-overlay" />
      <div className="vignette" />

      {/* ===== HERO ===== */}
      <section className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div key="hero" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl">
              {/* Owner Photo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 120, delay: 0.2 }}
                className="mx-auto mb-6 w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-glow"
              >
                <img
                  src="/user.jpeg"
                  alt="Sudip Pal - Wholesale Owner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image not found
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full bg-white/10 flex items-center justify-center"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,1)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>';
                  }}
                />
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="font-display text-5xl md:text-7xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
                PAL ENTERPRISE
              </motion.h1>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-1">
                <span className="inline-block bg-gradient-to-r from-brand-300 via-purple-300 to-blue-300 bg-clip-text text-transparent text-xl md:text-2xl font-semibold">
                  Wholesale Medicine Distributor
                </span>
              </motion.div>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="text-white/50 text-sm mb-1 font-medium">Prop. Sudip Pal</motion.p>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="text-white/40 text-sm md:text-base mb-10 flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" /> Digital Ledger Management System
              </motion.p>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  { icon: <ShieldCheck className="w-4 h-4" />, text: 'Secure & Encrypted' },
                  { icon: <BookOpen className="w-4 h-4" />, text: 'Digital Ledger' },
                  { icon: <Phone className="w-4 h-4" />, text: 'Mobile First' },
                ].map((f, i) => (
                  <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.1 }}
                    className="glass px-4 py-2 rounded-full text-sm text-brand-100 flex items-center gap-2">
                    {f.icon} {f.text}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex flex-col sm:flex-row gap-4 justify-center">
                <button id="login-btn" onClick={() => resetMode('login')} className="btn-primary text-lg flex items-center justify-center gap-2 px-10 py-4">
                  <LogIn className="w-5 h-5" /> Login
                </button>
                <button id="signup-btn" onClick={() => resetMode('signup')} className="btn-secondary text-lg flex items-center justify-center gap-2 px-10 py-4">
                  <UserPlus className="w-5 h-5" /> Sign Up
                </button>
              </motion.div>
            </motion.div>
          ) : mode === 'login' ? (
            /* ========== LOGIN ========== */
            <motion.div key="login" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, type: 'spring', damping: 20 }} className="w-full max-w-md">
              <div className="glass rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold text-white">Welcome Back</h2>
                  <button onClick={() => resetMode(null)} className="text-white/50 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex rounded-xl bg-white/5 p-1 mb-6 gap-1">
                  {[{ key: 'dl', label: 'DL + Phone' }, { key: 'shop', label: 'Shop Name' }, { key: 'doctor', label: "Doctor" }].map((m) => (
                    <button key={m.key} type="button" onClick={() => { setLoginMethod(m.key); setForm({}); setError(''); }}
                      className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${loginMethod === m.key ? 'bg-brand-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {loginMethod === 'dl' && (
                    <>
                      <div>
                        <label className="text-white/70 text-sm mb-1 block">DL Number</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-3.5 w-5 h-5 text-white/30" />
                          <input name="dlNumber" type="text" placeholder="Enter your DL Number" value={form.dlNumber || ''} onChange={handleChange} required className="input-field pl-11" />
                        </div>
                      </div>
                      <div>
                        <label className="text-white/70 text-sm mb-1 block">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 w-5 h-5 text-white/30" />
                          <input name="phone" type="tel" placeholder="Enter Phone Number" value={form.phone || ''} onChange={handleChange} required className="input-field pl-11" />
                        </div>
                      </div>
                    </>
                  )}
                  {loginMethod === 'shop' && (
                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Shop Name</label>
                      <div className="relative">
                        <Pill className="absolute left-3 top-3.5 w-5 h-5 text-white/30" />
                        <input name="shopName" type="text" placeholder="Enter your Shop Name" value={form.shopName || ''} onChange={handleChange} required className="input-field pl-11" />
                      </div>
                    </div>
                  )}
                  {loginMethod === 'doctor' && (
                    <div>
                      <label className="text-white/70 text-sm mb-1 block">Doctor's Name</label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-3.5 w-5 h-5 text-white/30" />
                        <input name="doctorName" type="text" placeholder="Enter Doctor's Name" value={form.doctorName || ''} onChange={handleChange} required className="input-field pl-11" />
                      </div>
                    </div>
                  )}

                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-xl">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><LogIn className="w-5 h-5" /> Login</>}
                  </button>
                </form>

                <p className="text-center text-white/40 text-sm mt-5">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => resetMode('signup')} className="text-brand-300 hover:text-brand-200 font-medium">Sign Up</button>
                </p>
              </div>
            </motion.div>
          ) : (
            /* ========== SIGNUP ========== */
            <motion.div key="signup" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, type: 'spring', damping: 20 }} className="w-full max-w-md">
              <div className="glass rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold text-white">Register Shop</h2>
                  <button onClick={() => resetMode(null)} className="text-white/50 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="text-white/70 text-sm mb-1 block">Shop Name *</label>
                    <input name="shopName" type="text" placeholder="Enter shop name" value={form.shopName || ''} onChange={handleChange} required className="input-field" />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1 block">Address</label>
                    <input name="address" type="text" placeholder="Shop address" value={form.address || ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1 block">DL Number * <span className="text-white/40">(Unique ID)</span></label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3.5 w-5 h-5 text-white/30" />
                      <input name="dlNumber" type="text" placeholder="Drug License Number" value={form.dlNumber || ''} onChange={handleChange} required className="input-field pl-11" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1 block">Ledger Folio Number</label>
                    <input name="ledgerFolio" type="text" placeholder="Folio number" value={form.ledgerFolio || ''} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1 block">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-5 h-5 text-white/30" />
                      <input name="phone" type="tel" placeholder="Mobile number" value={form.phone || ''} onChange={handleChange} required className="input-field pl-11" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm mb-1 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-brand-400" /> Doctor's Name <span className="text-white/30">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-3.5 w-5 h-5 text-white/30" />
                      <input name="doctorName" type="text" placeholder="Doctor's name" value={form.doctorName || ''} onChange={handleChange} className="input-field pl-11" />
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded-xl">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><UserPlus className="w-5 h-5" /> Register</>}
                  </button>
                </form>

                <p className="text-center text-white/40 text-sm mt-5">
                  Already registered?{' '}
                  <button type="button" onClick={() => resetMode('login')} className="text-brand-300 hover:text-brand-200 font-medium">Login</button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="relative z-10 px-4 pb-20">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.7 }} className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center"><Building2 className="w-6 h-6 text-brand-300" /></div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white">About PAL ENTERPRISE</h2>
            </div>
            <div className="space-y-4 text-white/70 text-sm md:text-base leading-relaxed">
              <p>PAL ENTERPRISE is a trusted wholesale medicine distributor dedicated to providing quality pharmaceutical products to medical shops, hospitals, and healthcare providers. With years of experience in the industry, we ensure timely delivery and competitive pricing for all our partners.</p>
              <p>Our Digital Ledger System is a modern solution designed to replace traditional paper-based record keeping. It enables seamless tracking of transactions, payments, and balances for each shop, ensuring transparency and accuracy in every business dealing.</p>
              <p>We believe in building lasting relationships with our clients through trust, reliability, and innovation. This platform empowers shop owners to manage their accounts digitally, access transaction history anytime, and stay updated with real-time balance information.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[
                { icon: <FileText className="w-5 h-5 text-blue-400" />, title: 'Bill Management', desc: 'Track every bill with detailed records and digital signatures.' },
                { icon: <CreditCard className="w-5 h-5 text-emerald-400" />, title: 'Payment Tracking', desc: 'Record payments against specific bills with real-time balance updates.' },
                { icon: <BarChart3 className="w-5 h-5 text-purple-400" />, title: 'Smart Insights', desc: 'View bill-wise breakdowns, export PDFs, and filter by date.' },
              ].map((feat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="mb-3">{feat.icon}</div>
                  <h3 className="text-white font-semibold text-sm mb-1">{feat.title}</h3>
                  <p className="text-white/50 text-xs">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <div className="relative z-10 text-center pb-6">
        <p className="text-white/20 text-xs">© 2026 PAL ENTERPRISE. All rights reserved.</p>
      </div>

      {/* ===== WARNING POPUP ===== */}
      <AnimatePresence>
        {warningPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-sm bg-white dark:bg-surface-800 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`p-6 text-center ${warningPopup.type === 'notFound' ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  warningPopup.type === 'notFound' ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-red-100 dark:bg-red-500/20'
                }`}>
                  {warningPopup.type === 'notFound'
                    ? <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    : <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  }
                </div>
                <h3 className="font-display font-bold text-lg text-gray-800 dark:text-white mb-2">
                  {warningPopup.type === 'notFound' ? 'Account Not Found' : 'Login Failed'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{warningPopup.message}</p>
              </div>
              {/* Actions */}
              <div className="p-5 space-y-3">
                {warningPopup.type === 'notFound' ? (
                  <>
                    <button onClick={handleWarningAction}
                      className="w-full btn-primary flex items-center justify-center gap-2">
                      <UserPlus className="w-5 h-5" /> Sign Up Now <ArrowRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => setWarningPopup(null)}
                      className="w-full py-3 px-4 rounded-xl border border-surface-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-sm">
                      Try Again
                    </button>
                  </>
                ) : (
                  <button onClick={() => setWarningPopup(null)}
                    className="w-full btn-primary flex items-center justify-center gap-2">
                    Try Again
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
