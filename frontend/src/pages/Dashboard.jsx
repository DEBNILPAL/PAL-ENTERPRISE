import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  getTransactions, getSummary, addEntry, addPayment, confirmPayment, editEntry, deleteProfile
} from '../services/api';
import {
  LogOut, Plus, CreditCard, IndianRupee, TrendingDown, TrendingUp,
  Receipt, FileText, Search, Filter, Download,
  AlertCircle, CheckCircle, X, QrCode, PenTool, RotateCcw,
  ChevronDown, ChevronRight, Pill, Package, Clock, User,
  MapPin, Hash, Phone, Keyboard, BookOpen, Stethoscope, Edit3, Trash2, Lock, Eye, EyeOff
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import VirtualKeyboard from '../components/VirtualKeyboard';

// ========== MAIN DASHBOARD ==========
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [billwise, setBillwise] = useState([]);
  const [summary, setSummary] = useState({ totalBillAmount: 0, totalPayment: 0, remainingBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Modals
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editBillData, setEditBillData] = useState(null); // null = closed, object = open with bill data

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState('billwise');
  const [expandedBills, setExpandedBills] = useState({});

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    if (!user?.dlNumber) return;
    setFetchError('');
    try {
      const [txnRes, sumRes] = await Promise.all([
        getTransactions(user.dlNumber),
        getSummary(user.dlNumber),
      ]);
      setTransactions(txnRes.data.transactions || []);
      setBillwise(txnRes.data.billwise || []);
      setSummary(sumRes.data.summary || { totalBillAmount: 0, totalPayment: 0, remainingBalance: 0 });
    } catch (err) {
      console.error('Fetch error:', err);
      setFetchError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.dlNumber]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const toggleBillExpand = (billNo) => setExpandedBills((prev) => ({ ...prev, [billNo]: !prev[billNo] }));

  // Open edit modal with bill data. We need to find the transaction ID from the raw transactions.
  const handleEditBill = (bill) => {
    // Find the actual transaction entry to get the ID
    const txn = transactions.find(t => t.type === 'bill' && t.billNo === bill.billNo);
    if (txn) {
      setEditBillData({
        id: txn.id,
        date: txn.date,
        billNo: txn.billNo,
        amount: txn.amount,
        returnGoods: txn.returnGoods || '',
        expGoods: txn.expGoods || '',
      });
    }
  };

  const filteredBillwise = useMemo(() => {
    return billwise.filter((b) => {
      const matchSearch = searchTerm === '' || b.billNo.toLowerCase().includes(searchTerm.toLowerCase()) || (b.date && b.date.includes(searchTerm));
      let matchDate = true;
      if (dateFrom) matchDate = matchDate && b.date >= dateFrom;
      if (dateTo) matchDate = matchDate && b.date <= dateTo;
      return matchSearch && matchDate;
    });
  }, [billwise, searchTerm, dateFrom, dateTo]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = searchTerm === '' ||
        (t.billNo && t.billNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.targetBillNo && t.targetBillNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.date && t.date.includes(searchTerm));
      let matchDate = true;
      if (dateFrom) matchDate = matchDate && t.date >= dateFrom;
      if (dateTo) matchDate = matchDate && t.date <= dateTo;
      return matchSearch && matchDate;
    });
  }, [transactions, searchTerm, dateFrom, dateTo]);

  const unpaidBills = useMemo(() => billwise.filter((b) => b.due > 0), [billwise]);

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('PAL ENTERPRISE - Ledger Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Shop: ${user.shopName}`, 14, 32);
    doc.text(`DL Number: ${user.dlNumber}`, 14, 39);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 46);
    if (user.doctorName) doc.text(`Doctor: ${user.doctorName}`, 100, 46);
    doc.setFontSize(12);
    doc.text(`Total Bills: Rs.${summary.totalBillAmount}`, 14, 58);
    doc.text(`Total Paid: Rs.${summary.totalPayment}`, 100, 58);
    doc.text(`Balance Due: Rs.${summary.remainingBalance}`, 14, 66);
    doc.setFontSize(10);
    let y = 82;
    doc.setFont(undefined, 'bold');
    doc.text('Bill No', 14, y); doc.text('Date', 50, y); doc.text('Amount', 85, y); doc.text('Paid', 115, y); doc.text('Due', 145, y); doc.text('Status', 172, y);
    doc.setFont(undefined, 'normal');
    y += 2; doc.line(14, y, 196, y); y += 7;
    billwise.forEach((b) => {
      doc.text(b.billNo || '-', 14, y); doc.text(b.date || '-', 50, y); doc.text(`${b.amount}`, 85, y); doc.text(`${b.totalPaid}`, 115, y); doc.text(`${b.due}`, 145, y); doc.text(b.due <= 0 ? 'PAID' : 'DUE', 172, y);
      y += 7; if (y > 280) { doc.addPage(); y = 20; }
    });
    doc.save(`PAL_Ledger_${user.dlNumber}_${Date.now()}.pdf`);
    showToast('PDF exported successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-12 h-12 border-4 border-brand-200 dark:border-white/20 border-t-brand-600 dark:border-t-brand-400 rounded-full mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Loading your ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 flex items-center justify-center shadow-lg">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-gray-800 dark:text-white leading-tight">PAL ENTERPRISE</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-none">
                {user.shopName}{user.doctorName ? ` • Dr. ${user.doctorName}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowProfile(true)} id="profile-btn"
              className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors">
              <User className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} id="logout-btn"
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 font-medium transition-colors px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-32">
        {fetchError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {fetchError}
            <button onClick={fetchData} className="ml-auto text-xs font-medium underline">Retry</button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><TrendingUp className="w-4 h-4 text-blue-500" /> Total Bill Amount</div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white font-display">₹{summary.totalBillAmount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{billwise.length} bill(s)</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><TrendingDown className="w-4 h-4 text-emerald-500" /> Total Payment Done</div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-display">₹{summary.totalPayment.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{transactions.filter(t => t.type === 'payment').length} payment(s)</p>
          </div>
          <div className={`stat-card border-2 ${summary.remainingBalance > 0 ? 'border-amber-400/50 dark:border-amber-400/30' : 'border-emerald-400/50 dark:border-emerald-400/30'}`}>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><IndianRupee className="w-4 h-4 text-amber-500" /> Remaining Balance</div>
            <p className={`text-2xl sm:text-3xl font-bold font-display ${summary.remainingBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{summary.remainingBalance.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{summary.remainingBalance > 0 ? `${unpaidBills.length} unpaid bill(s)` : 'All clear!'}</p>
          </div>
        </motion.div>

        {/* ACTION BUTTONS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3">
          <button id="add-bill-btn" onClick={() => setShowAddBill(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Bill</button>
          <button id="add-payment-btn" onClick={() => setShowAddPayment(true)} className="btn-success flex items-center gap-2 text-sm" disabled={unpaidBills.length === 0}><CreditCard className="w-4 h-4" /> Add Payment</button>
          <button id="pay-online-btn" onClick={() => setShowQR(true)} className="flex items-center gap-2 text-sm py-3 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg active:scale-95"><QrCode className="w-4 h-4" /> Pay Online</button>
          <button onClick={exportPDF} className="flex items-center gap-2 text-sm py-3 px-5 rounded-xl bg-gray-100 dark:bg-surface-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-surface-600 transition-all active:scale-95"><Download className="w-4 h-4" /> Export PDF</button>
        </motion.div>

        {/* SEARCH & FILTER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search by bill number or date..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field-light pl-11" />
            </div>
            <div className="flex gap-2">
              <div className="flex rounded-xl bg-surface-100 dark:bg-surface-700 p-1">
                <button onClick={() => setViewMode('billwise')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === 'billwise' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>Bill-wise</button>
                <button onClick={() => setViewMode('all')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${viewMode === 'all' ? 'bg-brand-600 text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>All</button>
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 py-2 px-3 rounded-xl border border-surface-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-xs">
                <Filter className="w-4 h-4" /><ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <div className="flex-1"><label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field-light" /></div>
                  <div className="flex-1"><label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field-light" /></div>
                  <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); }} className="self-end py-3 px-4 text-sm text-brand-600 dark:text-brand-400 font-medium hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-colors">Clear</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* BILL-WISE VIEW */}
        {viewMode === 'billwise' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-800 dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-brand-500" /> Bill-wise Ledger</h3>
              <span className="text-xs bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full font-medium">{filteredBillwise.length} bills</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-50 dark:bg-surface-800/50">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Bill No</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Total Amount</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Paid</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Due</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Status</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Edit</th>
                </tr></thead>
                <tbody>
                  {filteredBillwise.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400 dark:text-gray-500">
                      <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No bills yet</p><p className="text-xs mt-1">Click "Add Bill" to create your first entry</p>
                    </td></tr>
                  ) : filteredBillwise.map((bill, i) => (
                    <BillRow key={bill.billNo} bill={bill} index={i} expanded={!!expandedBills[bill.billNo]} onToggle={() => toggleBillExpand(bill.billNo)} onEdit={() => handleEditBill(bill)} />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          /* ALL TRANSACTIONS VIEW */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-white/10 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-800 dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-brand-500" /> All Transactions</h3>
              <span className="text-xs bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full font-medium">{filteredTransactions.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-50 dark:bg-surface-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Bill No</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Bill Amount</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Payment</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Running Bal.</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Type</th>
                </tr></thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No transactions found</p></td></tr>
                  ) : (() => {
                    let runBal = 0;
                    return filteredTransactions.map((t, i) => {
                      runBal += (parseFloat(t.amount) || 0) - (parseFloat(t.payment) || 0);
                      return (
                        <motion.tr key={t.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                          className="border-t border-surface-100 dark:border-white/5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{t.date || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            {t.type === 'payment' ? <span className="text-emerald-600 dark:text-emerald-400 text-xs">Payment → {t.targetBillNo || 'General'}</span> : <span className="text-gray-800 dark:text-white">{t.billNo}</span>}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">{t.amount > 0 ? <span className="text-red-600 dark:text-red-400 font-semibold">₹{parseFloat(t.amount).toLocaleString('en-IN')}</span> : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">{t.payment > 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{parseFloat(t.payment).toLocaleString('en-IN')}</span> : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                          <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${runBal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>₹{runBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${t.type === 'payment' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
                              {t.type === 'payment' ? <CreditCard className="w-3 h-3" /> : <FileText className="w-3 h-3" />} {t.type === 'payment' ? 'Payment' : 'Bill'}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      {/* MODALS */}
      <AnimatePresence>
        {showAddBill && <AddBillModal onClose={() => setShowAddBill(false)} onSuccess={() => { fetchData(); showToast('Bill added successfully!'); setShowAddBill(false); }} onError={(msg) => showToast(msg, 'error')} />}
        {showAddPayment && <AddPaymentModal onClose={() => setShowAddPayment(false)} onSuccess={(msg) => { fetchData(); showToast(msg || 'Payment recorded!'); setShowAddPayment(false); }} onError={(msg) => showToast(msg, 'error')} unpaidBills={unpaidBills} remainingBalance={summary.remainingBalance} />}
        {editBillData && <EditBillModal billData={editBillData} onClose={() => setEditBillData(null)} onSuccess={() => { fetchData(); showToast('Bill updated successfully!'); setEditBillData(null); }} onError={(msg) => showToast(msg, 'error')} />}
        {showQR && <QRModal onClose={() => setShowQR(false)} />}
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} user={user} summary={summary} billCount={billwise.length} paymentCount={transactions.filter(t => t.type === 'payment').length} onLogout={handleLogout} />}
      </AnimatePresence>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium whitespace-nowrap ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========== BILL ROW ==========
function BillRow({ bill, index, expanded, onToggle, onEdit }) {
  const isPaid = bill.due <= 0;
  return (
    <>
      <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }} onClick={onToggle}
        className="border-t border-surface-100 dark:border-white/5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors cursor-pointer">
        <td className="px-3 py-3"><motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}><ChevronRight className="w-4 h-4 text-gray-400" /></motion.div></td>
        <td className="px-4 py-3 font-semibold text-brand-700 dark:text-brand-300 whitespace-nowrap">{bill.billNo}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{bill.date}</td>
        <td className="px-4 py-3 text-right whitespace-nowrap"><span className="font-bold text-gray-800 dark:text-white">₹{bill.amount.toLocaleString('en-IN')}</span></td>
        <td className="px-4 py-3 text-right whitespace-nowrap"><span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{bill.totalPaid.toLocaleString('en-IN')}</span></td>
        <td className="px-4 py-3 text-right whitespace-nowrap"><span className={`font-bold ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>₹{bill.due.toLocaleString('en-IN')}</span></td>
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
            {isPaid ? <><CheckCircle className="w-3 h-3" /> Paid</> : <><Clock className="w-3 h-3" /> Due</>}
          </span>
        </td>
        <td className="px-2 py-3 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
            title="Edit Bill"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </td>
      </motion.tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <td colSpan={8} className="bg-surface-50/50 dark:bg-surface-800/30 px-6 py-3">
              {bill.payments && bill.payments.length > 0 ? (
                <><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Payment History for {bill.billNo}:</p>
                <div className="space-y-1.5">{bill.payments.map((p, j) => (
                  <div key={p.id || j} className="flex items-center justify-between text-xs bg-white dark:bg-surface-700 rounded-lg px-3 py-2 shadow-sm">
                    <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2"><CreditCard className="w-3 h-3 text-emerald-500" />{p.date}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{p.payment.toLocaleString('en-IN')}</span>
                  </div>
                ))}</div></>
              ) : <p className="text-xs text-gray-400 italic">No payments recorded for this bill yet.</p>}
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ========== EDIT BILL MODAL ==========
function EditBillModal({ billData, onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    date: billData.date || '',
    billNo: billData.billNo || '',
    amount: billData.amount || '',
    returnGoods: billData.returnGoods || '',
    expGoods: billData.expGoods || '',
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); setLocalError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.date || !form.billNo || !form.amount) { setLocalError('Date, Bill Number, and Amount are required.'); return; }
    if (parseFloat(form.amount) <= 0) { setLocalError('Amount must be greater than zero.'); return; }
    setLoading(true);
    try {
      await editEntry(billData.id, {
        date: form.date,
        billNo: form.billNo.trim(),
        amount: parseFloat(form.amount),
        returnGoods: form.returnGoods,
        expGoods: form.expGoods,
      });
      onSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to update bill.';
      setLocalError(errMsg);
    } finally { setLoading(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Edit Bill">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Edit3 className="w-4 h-4" /> Editing bill: <strong>{billData.billNo}</strong>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Date *</label><input name="date" type="date" value={form.date} onChange={handleChange} required className="input-field-light" /></div>
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Bill Number *</label><input name="billNo" type="text" placeholder="e.g. INV-001" value={form.billNo} onChange={handleChange} required className="input-field-light" /></div>
        </div>
        <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Amount (₹) *</label><input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={handleChange} required className="input-field-light text-lg font-semibold" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Return Goods</label><input name="returnGoods" type="text" placeholder="Optional" value={form.returnGoods} onChange={handleChange} className="input-field-light" /></div>
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Expired Goods</label><input name="expGoods" type="text" placeholder="Optional" value={form.expGoods} onChange={handleChange} className="input-field-light" /></div>
        </div>

        {localError && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-xl"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {localError}</motion.div>}
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><Edit3 className="w-5 h-5" /> Update Bill</>}
        </button>
      </form>
    </ModalWrapper>
  );
}

// ========== ADD BILL MODAL (with Virtual Keyboard) ==========
function AddBillModal({ onClose, onSuccess, onError }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), billNo: '', amount: '', returnGoods: '', expGoods: '', signatureText: '' });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const sigRef = useRef(null);

  const handleChange = (e) => { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); setLocalError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.date || !form.billNo || !form.amount) { setLocalError('Date, Bill Number, and Amount are required.'); return; }
    if (parseFloat(form.amount) <= 0) { setLocalError('Amount must be greater than zero.'); return; }
    setLoading(true);
    try {
      const sig = sigRef.current && !sigRef.current.isEmpty() ? sigRef.current.getTrimmedCanvas().toDataURL('image/png') : form.signatureText || '';
      await addEntry({ date: form.date, billNo: form.billNo.trim(), amount: parseFloat(form.amount), returnGoods: form.returnGoods, expGoods: form.expGoods, signature: sig });
      onSuccess();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to add bill.';
      setLocalError(errMsg);
    } finally { setLoading(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Add New Bill">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Date *</label><input name="date" type="date" value={form.date} onChange={handleChange} required className="input-field-light" /></div>
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Bill Number *</label><input name="billNo" type="text" placeholder="e.g. INV-001" value={form.billNo} onChange={handleChange} required className="input-field-light" /></div>
        </div>
        <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Amount (₹) *</label><input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={handleChange} required className="input-field-light text-lg font-semibold" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Return Goods</label><input name="returnGoods" type="text" placeholder="Optional" value={form.returnGoods} onChange={handleChange} className="input-field-light" /></div>
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Expired Goods</label><input name="expGoods" type="text" placeholder="Optional" value={form.expGoods} onChange={handleChange} className="input-field-light" /></div>
        </div>

        {/* Digital Signature: Canvas + Virtual Keyboard */}
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><PenTool className="w-3 h-3" /> Digital Signature</label>
          <div className="border border-surface-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-surface-800">
            <SignatureCanvas ref={sigRef} penColor="#4338ca" canvasProps={{ className: 'w-full h-28' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <div className="flex-1 relative">
              <input name="signatureText" type="text" placeholder="Or type counter name" value={form.signatureText} onChange={handleChange}
                className="w-full text-sm bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button type="button" onClick={() => setShowKeyboard(!showKeyboard)} className={`p-2 rounded-lg transition-all ${showKeyboard ? 'bg-brand-600 text-white' : 'bg-surface-100 dark:bg-surface-600 text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-500/10'}`}>
              <Keyboard className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => sigRef.current?.clear()} className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline px-2">
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
          <VirtualKeyboard visible={showKeyboard} value={form.signatureText} onChange={(val) => setForm((prev) => ({ ...prev, signatureText: val }))} onClose={() => setShowKeyboard(false)} />
        </div>

        {localError && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-xl"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {localError}</motion.div>}
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><Plus className="w-5 h-5" /> Add Bill Entry</>}
        </button>
      </form>
    </ModalWrapper>
  );
}

// ========== ADD PAYMENT MODAL (with Virtual Keyboard) ==========
function AddPaymentModal({ onClose, onSuccess, onError, unpaidBills, remainingBalance }) {
  const [form, setForm] = useState({ paymentDate: new Date().toISOString().slice(0, 10), targetBillNo: '', payment: '', signatureText: '' });
  const [loading, setLoading] = useState(false);
  const [overpayWarning, setOverpayWarning] = useState(null);
  const [localError, setLocalError] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const sigRef = useRef(null);

  const selectedBill = useMemo(() => form.targetBillNo ? unpaidBills.find((b) => b.billNo === form.targetBillNo) || null : null, [form.targetBillNo, unpaidBills]);

  const handleChange = (e) => { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); setLocalError(''); setOverpayWarning(null); };

  const getSignature = () => sigRef.current && !sigRef.current.isEmpty() ? sigRef.current.getTrimmedCanvas().toDataURL('image/png') : form.signatureText || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.targetBillNo) { setLocalError('Please select a bill to pay against.'); return; }
    if (!form.payment || parseFloat(form.payment) <= 0) { setLocalError('Payment amount must be greater than zero.'); return; }
    setLoading(true);
    try {
      const res = await addPayment({ payment: parseFloat(form.payment), paymentDate: form.paymentDate, targetBillNo: form.targetBillNo, signature: getSignature() });
      if (res.data.warning) { setOverpayWarning(res.data.warning); setLoading(false); return; }
      onSuccess(res.data.message);
    } catch (err) { setLocalError(err.response?.data?.error || 'Failed to record payment.'); } finally { setLoading(false); }
  };

  const handleConfirmOverpay = async () => {
    setLoading(true);
    try {
      await confirmPayment({ payment: parseFloat(form.payment), paymentDate: form.paymentDate, targetBillNo: form.targetBillNo, signature: getSignature() });
      onSuccess('Payment recorded (overpayment confirmed).');
    } catch (err) { setLocalError(err.response?.data?.error || 'Failed to confirm payment.'); } finally { setLoading(false); }
  };

  return (
    <ModalWrapper onClose={onClose} title="Record Payment">
      {overpayWarning ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-medium text-amber-800 dark:text-amber-300">{overpayWarning}</p><p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Do you want to proceed anyway?</p></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setOverpayWarning(null)} className="flex-1 py-3 px-4 rounded-xl border border-surface-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">Cancel</button>
            <button onClick={handleConfirmOverpay} disabled={loading} className="btn-success flex-1 flex items-center justify-center gap-2">
              {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : 'Confirm Payment'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl text-sm text-brand-700 dark:text-brand-300">Overall Balance: <strong>₹{remainingBalance.toLocaleString('en-IN')}</strong></div>
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Select Bill to Pay Against *</label>
            <select name="targetBillNo" value={form.targetBillNo} onChange={handleChange} required className="input-field-light cursor-pointer">
              <option value="">-- Select a Bill --</option>
              {unpaidBills.map((b) => <option key={b.billNo} value={b.billNo}>{b.billNo} — Total: ₹{b.amount.toLocaleString('en-IN')} — Due: ₹{b.due.toLocaleString('en-IN')}</option>)}
            </select>
          </div>
          {selectedBill && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-300">Bill: <strong>{selectedBill.billNo}</strong></span><span className="text-gray-600 dark:text-gray-300">Total: <strong>₹{selectedBill.amount.toLocaleString('en-IN')}</strong></span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-emerald-600 dark:text-emerald-400">Paid: ₹{selectedBill.totalPaid.toLocaleString('en-IN')}</span><span className="text-amber-600 dark:text-amber-400 font-bold">Due: ₹{selectedBill.due.toLocaleString('en-IN')}</span></div>
            </motion.div>
          )}
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Payment Amount (₹) *</label><input name="payment" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.payment} onChange={handleChange} required className="input-field-light text-lg font-semibold" /></div>
          <div><label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Payment Date *</label><input name="paymentDate" type="date" value={form.paymentDate} onChange={handleChange} required className="input-field-light" /></div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><PenTool className="w-3 h-3" /> Digital Signature</label>
            <div className="border border-surface-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-surface-800"><SignatureCanvas ref={sigRef} penColor="#059669" canvasProps={{ className: 'w-full h-28' }} /></div>
            <div className="flex items-center justify-between mt-1.5 gap-2">
              <input name="signatureText" type="text" placeholder="Or type counter name" value={form.signatureText} onChange={handleChange} className="flex-1 text-sm bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button type="button" onClick={() => setShowKeyboard(!showKeyboard)} className={`p-2 rounded-lg transition-all ${showKeyboard ? 'bg-brand-600 text-white' : 'bg-surface-100 dark:bg-surface-600 text-gray-600 dark:text-gray-300'}`}><Keyboard className="w-4 h-4" /></button>
              <button type="button" onClick={() => sigRef.current?.clear()} className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline px-2"><RotateCcw className="w-3 h-3" /> Clear</button>
            </div>
            <VirtualKeyboard visible={showKeyboard} value={form.signatureText} onChange={(val) => setForm((prev) => ({ ...prev, signatureText: val }))} onClose={() => setShowKeyboard(false)} />
          </div>
          {localError && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-xl"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {localError}</motion.div>}
          <button type="submit" disabled={loading} className="btn-success w-full flex items-center justify-center gap-2">
            {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <><CreditCard className="w-5 h-5" /> Record Payment</>}
          </button>
        </form>
      )}
    </ModalWrapper>
  );
}

// ========== PROFILE MODAL (with Delete Option) ==========
function ProfileModal({ onClose, user, summary, billCount, paymentCount, onLogout }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleteError('');
    if (!deletePassword) { setDeleteError('Please enter the password.'); return; }
    setDeleteLoading(true);
    try {
      await deleteProfile(user.dlNumber, { password: deletePassword });
      // Logout and redirect
      onLogout();
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete profile.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const profileFields = [
    { icon: <Pill className="w-4 h-4 text-brand-500" />, label: 'Shop Name', value: user.shopName },
    { icon: <MapPin className="w-4 h-4 text-blue-500" />, label: 'Address', value: user.address || 'Not provided' },
    { icon: <Hash className="w-4 h-4 text-purple-500" />, label: 'DL Number', value: user.dlNumber },
    { icon: <BookOpen className="w-4 h-4 text-teal-500" />, label: 'Ledger Folio', value: user.ledgerFolio || 'Not provided' },
    { icon: <Phone className="w-4 h-4 text-emerald-500" />, label: 'Phone', value: user.phone },
    { icon: <Stethoscope className="w-4 h-4 text-pink-500" />, label: "Doctor's Name", value: user.doctorName || 'Not provided' },
  ];

  return (
    <ModalWrapper onClose={onClose} title="Profile">
      <div className="space-y-5">
        {/* Avatar */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
            {user.shopName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h3 className="font-display font-bold text-lg text-gray-800 dark:text-white">{user.shopName}</h3>
          {user.doctorName && <p className="text-sm text-gray-500 dark:text-gray-400">Dr. {user.doctorName}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-display">{billCount}</p>
            <p className="text-xs text-blue-500 dark:text-blue-400/70">Bills</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-display">{paymentCount}</p>
            <p className="text-xs text-emerald-500 dark:text-emerald-400/70">Payments</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 font-display">₹{summary.remainingBalance.toLocaleString('en-IN')}</p>
            <p className="text-xs text-amber-500 dark:text-amber-400/70">Balance</p>
          </div>
        </div>

        {/* Info fields */}
        <div className="space-y-2">
          {profileFields.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-600 flex items-center justify-center shadow-sm">{f.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{f.label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Delete Profile Section */}
        <div className="pt-4 border-t border-surface-200 dark:border-white/10">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" /> Delete Profile
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Warning: This action is irreversible!</p>
                <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">All bills, payments, and profile data will be permanently deleted.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Enter Admin Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                    placeholder="Enter password to confirm"
                    className="input-field-light pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {deleteError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {deleteError}
                </motion.div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                  className="flex-1 py-3 px-4 rounded-xl border border-surface-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-sm">Cancel</button>
                <button onClick={handleDelete} disabled={deleteLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors text-sm flex items-center justify-center gap-2">
                  {deleteLoading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <><Trash2 className="w-4 h-4" /> Confirm Delete</>}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

// ========== QR MODAL ==========
function QRModal({ onClose }) {
  const upiString = 'upi://pay?pa=sudip9933081700@okaxis&pn=Sudip%20Pal';
  return (
    <ModalWrapper onClose={onClose} title="Pay Online">
      <div className="text-center space-y-5">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">S</div>
          <div className="text-left"><p className="font-display font-bold text-gray-800 dark:text-white text-lg">Sudip Pal</p><p className="text-xs text-gray-500 dark:text-gray-400">PAL ENTERPRISE</p></div>
        </div>
        <div className="mx-auto bg-white rounded-2xl p-6 shadow-inner inline-block"><QRCodeSVG value={upiString} size={220} bgColor="#ffffff" fgColor="#1e1b4b" level="H" includeMargin={false} /></div>
        <div className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl"><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">UPI ID</p><p className="font-mono text-sm font-semibold text-gray-800 dark:text-white select-all">sudip9933081700@okaxis</p></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Scan with any UPI app to pay</p>
        <div className="flex justify-center gap-4 text-xs text-gray-400 dark:text-gray-500"><span>Google Pay</span><span>•</span><span>PhonePe</span><span>•</span><span>Paytm</span><span>•</span><span>BHIM</span></div>
      </div>
    </ModalWrapper>
  );
}

// ========== MODAL WRAPPER ==========
function ModalWrapper({ children, onClose, title }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 25 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-surface-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-surface-800 flex items-center justify-between p-5 border-b border-surface-200 dark:border-white/10 rounded-t-3xl z-10">
          <h3 className="font-display text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}
