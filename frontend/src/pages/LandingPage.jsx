import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { signup, login, getAdminReports } from '../services/api';
import jsPDF from 'jspdf';
import {
  Pill, ShieldCheck, BookOpen, Phone, MapPin, Hash,
  LogIn, UserPlus, AlertCircle, CheckCircle, X,
  Stethoscope, Building2, FileText, CreditCard, BarChart3,
  AlertTriangle, ArrowRight, Download, Filter, Lock, Eye, EyeOff, Calendar, Users
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
  const [warningPopup, setWarningPopup] = useState(null);
  const [disambiguatePopup, setDisambiguatePopup] = useState(null); // { count, message, type: 'shop'|'doctor', name }
  const [disambiguateForm, setDisambiguateForm] = useState({ method: 'phone', value: '' });
  const [showReports, setShowReports] = useState(false);
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

      // Check if multiple matches found
      if (res.data.multipleFound) {
        setDisambiguatePopup({
          count: res.data.count,
          message: res.data.message,
          type: loginMethod === 'shop' ? 'shop' : 'doctor',
          name: loginMethod === 'shop' ? form.shopName : form.doctorName,
        });
        setDisambiguateForm({ method: 'phone', value: '' });
        setLoading(false);
        return;
      }

      loginUser(res.data.user, res.data.token);
      setSuccess('Login successful!');
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      const data = err.response?.data;
      if (data?.notFound) {
        setWarningPopup({ message: data.error, type: 'notFound' });
      } else if (data?.wrongCredentials) {
        setWarningPopup({ message: data.error, type: 'wrong' });
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

  const handleDisambiguateLogin = async () => {
    if (!disambiguateForm.value.trim()) return;
    setLoading(true);
    try {
      let payload = {};
      if (disambiguatePopup.type === 'shop') {
        payload.shopName = disambiguatePopup.name;
      } else {
        payload.doctorName = disambiguatePopup.name;
      }
      if (disambiguateForm.method === 'phone') {
        payload.disambiguatorPhone = disambiguateForm.value.trim();
      } else {
        payload.disambiguatorDL = disambiguateForm.value.trim();
      }

      const res = await login(payload);
      loginUser(res.data.user, res.data.token);
      setSuccess('Login successful!');
      setDisambiguatePopup(null);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      const data = err.response?.data;
      setWarningPopup({
        message: data?.error || 'Login failed. Please check your credentials.',
        type: 'wrong',
      });
      setDisambiguatePopup(null);
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
        <div key={p.id} className="particle" style={{ width: p.size + 'px', height: p.size + 'px', left: p.left + '%', top: p.top + '%', animationDelay: p.delay + 's', animationDuration: p.duration + 's' }} />
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
                className="mx-auto mb-6 w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-[5px] border-white/30 shadow-[0_0_40px_rgba(99,102,241,0.4),0_0_80px_rgba(139,92,246,0.2)] ring-2 ring-brand-400/30 ring-offset-2 ring-offset-transparent"
              >
                <img
                  src="/user.jpeg"
                  alt="Sudip Pal - Wholesale Owner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
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

              {/* Owner Reports Button */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="mt-6">
                <button
                  id="reports-btn"
                  onClick={() => setShowReports(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white text-sm font-medium transition-all duration-300"
                >
                  <Download className="w-4 h-4" /> Owner Reports (PDF)
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
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${warningPopup.type === 'notFound' ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-red-100 dark:bg-red-500/20'
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

      {/* ===== DISAMBIGUATE POPUP (Same-name shops/doctors) ===== */}
      <AnimatePresence>
        {disambiguatePopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="w-full max-w-sm bg-white dark:bg-surface-800 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 text-center bg-blue-50 dark:bg-blue-500/10">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-500/20">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-800 dark:text-white mb-2">
                  Multiple Accounts Found
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{disambiguatePopup.message}</p>
              </div>
              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="flex rounded-xl bg-surface-100 dark:bg-surface-700 p-1 gap-1">
                  <button type="button"
                    onClick={() => setDisambiguateForm({ method: 'phone', value: '' })}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${disambiguateForm.method === 'phone' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                    Mobile Number
                  </button>
                  <button type="button"
                    onClick={() => setDisambiguateForm({ method: 'dl', value: '' })}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${disambiguateForm.method === 'dl' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                    DL Number
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    {disambiguateForm.method === 'phone' ? 'Enter your Mobile Number' : 'Enter your DL Number'}
                  </label>
                  <div className="relative">
                    {disambiguateForm.method === 'phone'
                      ? <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      : <Hash className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    }
                    <input
                      type={disambiguateForm.method === 'phone' ? 'tel' : 'text'}
                      value={disambiguateForm.value}
                      onChange={(e) => setDisambiguateForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={disambiguateForm.method === 'phone' ? 'Your registered phone number' : 'Your DL number'}
                      className="w-full bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-xl px-4 py-3 pl-11 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setDisambiguatePopup(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-surface-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-sm">
                    Cancel
                  </button>
                  <button onClick={handleDisambiguateLogin} disabled={loading || !disambiguateForm.value.trim()}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm">
                    {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <><LogIn className="w-4 h-4" /> Login</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REPORTS MODAL ===== */}
      <AnimatePresence>
        {showReports && <ReportsModal onClose={() => setShowReports(false)} />}
      </AnimatePresence>
    </div>
  );
}


// ========== REPORTS MODAL ==========
function ReportsModal({ onClose }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'date'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reports, setReports] = useState(null);

  const handleAuth = async () => {
    if (!password) { setError('Please enter the password.'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = { password };
      if (filterMode === 'date') {
        if (dateFrom) payload.dateFrom = dateFrom;
        if (dateTo) payload.dateTo = dateTo;
      }
      const res = await getAdminReports(payload);
      setReports(res.data.reports);
      setAuthenticated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithFilter = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = { password };
      if (filterMode === 'date') {
        if (dateFrom) payload.dateFrom = dateFrom;
        if (dateTo) payload.dateTo = dateTo;
      }
      const res = await getAdminReports(payload);
      setReports(res.data.reports);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reports || reports.length === 0) return;
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('en-IN');

    // Title page
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('PAL ENTERPRISE', 105, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text('Complete Payment Ledger Report', 105, 42, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${dateStr}`, 105, 52, { align: 'center' });
    if (filterMode === 'date' && (dateFrom || dateTo)) {
      doc.text(`Date Filter: ${dateFrom || 'Start'} to ${dateTo || 'End'}`, 105, 60, { align: 'center' });
    }
    doc.text(`Total Shops/Doctors: ${reports.length}`, 105, filterMode === 'date' ? 68 : 60, { align: 'center' });

    // Summary table
    let y = 80;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary of All Accounts', 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Shop Name', 14, y);
    doc.text('DL Number', 60, y);
    doc.text('Doctor', 100, y);
    doc.text('Total Bills', 130, y);
    doc.text('Total Paid', 155, y);
    doc.text('Balance', 180, y);
    doc.setFont(undefined, 'normal');
    y += 2;
    doc.line(14, y, 196, y);
    y += 6;

    let grandTotalBill = 0;
    let grandTotalPaid = 0;

    reports.forEach(r => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text((r.shopName || '-').substring(0, 20), 14, y);
      doc.text((r.dlNumber || '-').substring(0, 18), 60, y);
      doc.text((r.doctorName || '-').substring(0, 14), 100, y);
      doc.text(`Rs.${r.totalBillAmount}`, 130, y);
      doc.text(`Rs.${r.totalPayment}`, 155, y);
      doc.text(`Rs.${r.remainingBalance}`, 180, y);
      grandTotalBill += r.totalBillAmount;
      grandTotalPaid += r.totalPayment;
      y += 6;
    });

    y += 2;
    doc.line(14, y, 196, y);
    y += 6;
    doc.setFont(undefined, 'bold');
    doc.text('GRAND TOTAL', 14, y);
    doc.text(`Rs.${grandTotalBill}`, 130, y);
    doc.text(`Rs.${grandTotalPaid}`, 155, y);
    doc.text(`Rs.${grandTotalBill - grandTotalPaid}`, 180, y);

    // Detailed per-shop pages
    reports.forEach(r => {
      if (r.billwise && r.billwise.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`${r.shopName}`, 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`DL: ${r.dlNumber} | Phone: ${r.phone || '-'} | Doctor: ${r.doctorName || '-'}`, 14, y);
        y += 5;
        doc.text(`Address: ${r.address || '-'}`, 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Total: Rs.${r.totalBillAmount}  |  Paid: Rs.${r.totalPayment}  |  Balance: Rs.${r.remainingBalance}`, 14, y);
        y += 10;

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Bill No', 14, y);
        doc.text('Date', 55, y);
        doc.text('Amount', 90, y);
        doc.text('Paid', 120, y);
        doc.text('Due', 148, y);
        doc.text('Status', 172, y);
        doc.setFont(undefined, 'normal');
        y += 2;
        doc.line(14, y, 196, y);
        y += 6;

        r.billwise.forEach(b => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text((b.billNo || '-').substring(0, 18), 14, y);
          doc.text(b.date || '-', 55, y);
          doc.text(`Rs.${b.amount}`, 90, y);
          doc.text(`Rs.${b.totalPaid}`, 120, y);
          doc.text(`Rs.${b.due}`, 148, y);
          doc.text(b.due <= 0 ? 'PAID' : 'DUE', 172, y);
          y += 6;
        });
      }
    });

    const filterSuffix = filterMode === 'date' && dateFrom ? `_${dateFrom}_${dateTo || 'now'}` : '_All';
    doc.save(`PAL_Enterprise_Full_Report${filterSuffix}_${Date.now()}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
        transition={{ type: 'spring', damping: 22 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-surface-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-surface-800 flex items-center justify-between p-5 border-b border-surface-200 dark:border-white/10 rounded-t-3xl z-10">
          <h3 className="font-display text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" /> Owner Reports
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {!authenticated ? (
            <>
              <div className="text-center mb-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-3">
                  <Lock className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enter admin password to access reports</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Admin Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter admin password"
                    className="w-full bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Filter option */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">Report Filter</label>
                <div className="flex rounded-xl bg-surface-100 dark:bg-surface-700 p-1 gap-1">
                  <button type="button" onClick={() => setFilterMode('all')}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${filterMode === 'all' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                    All Data
                  </button>
                  <button type="button" onClick={() => setFilterMode('date')}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 ${filterMode === 'date' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                    <Calendar className="w-3 h-3" /> By Date
                  </button>
                </div>
                <AnimatePresence>
                  {filterMode === 'date' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex gap-3 pt-1">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </motion.div>
              )}
              <button onClick={handleAuth} disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold hover:from-brand-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 text-sm">
                {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <><Download className="w-4 h-4" /> Generate Reports</>}
              </button>
            </>
          ) : (
            <>
              {/* Authenticated - show report summary and download */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Reports loaded successfully!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{reports?.length || 0} shop(s)/account(s) found</p>
                </div>
              </div>

              {/* Filter controls for re-filtering */}
              <div className="space-y-3 p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                <div className="flex rounded-xl bg-white dark:bg-surface-700 p-1 gap-1">
                  <button type="button" onClick={() => setFilterMode('all')}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${filterMode === 'all' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                    All Data
                  </button>
                  <button type="button" onClick={() => setFilterMode('date')}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${filterMode === 'date' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                    <Calendar className="w-3 h-3" /> Filter by Date
                  </button>
                </div>
                <AnimatePresence>
                  {filterMode === 'date' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex gap-3 pt-1">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-white dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-white dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={fetchWithFilter} disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-brand-100 dark:bg-brand-600 text-brand-700 dark:text-white text-xs font-semibold hover:bg-brand-200 dark:hover:bg-brand-500 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  {loading ? <span className="animate-spin w-3 h-3 border-2 border-brand-300/30 border-t-brand-600 dark:border-white/30 dark:border-t-white rounded-full" /> : <><Filter className="w-3 h-3" /> Apply Filter</>}
                </button>
              </div>

              {/* Quick stats */}
              {reports && reports.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{reports.length}</p>
                    <p className="text-xs text-blue-500">Accounts</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{reports.reduce((s, r) => s + r.totalPayment, 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-emerald-500">Total Paid</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{reports.reduce((s, r) => s + r.remainingBalance, 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-amber-500">Total Due</p>
                  </div>
                </div>
              )}

              {/* Shop list preview */}
              {reports && reports.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reports.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{r.shopName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.dlNumber}{r.doctorName ? ` • Dr. ${r.doctorName}` : ''}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className={`text-sm font-bold ${r.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{r.remainingBalance.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400">{r.remainingBalance > 0 ? 'Due' : 'Clear'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={generatePDF}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 text-white font-semibold hover:from-brand-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2">
                <Download className="w-5 h-5" /> Download Full PDF Report
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
