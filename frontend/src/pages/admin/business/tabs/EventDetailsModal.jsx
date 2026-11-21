import { useState, useEffect } from 'react';
import { 
  X, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Download, 
  Send, 
  Award, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Plus,
  Loader2,
  CreditCard
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EventDetailsModal({ 
  isOpen, 
  onClose, 
  event, 
  expenses = [], 
  progressTrackingOptions = [], 
  fetchEvents, 
  onEdit, 
  onDelete, 
  onOpenQuotations 
}) {
  const [localPaid, setLocalPaid] = useState('');
  const [shootStatus, setShootStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [progress, setProgress] = useState([]);
  const [localExpenses, setLocalExpenses] = useState([]);
  const [inlineExpenseName, setInlineExpenseName] = useState('');
  const [inlineExpenseAmount, setInlineExpenseAmount] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseName, setEditExpenseName] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [toast, setToast] = useState(null);

  // Payment Tracking & Installment Ledger States
  const [localPayments, setLocalPayments] = useState([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayType, setNewPayType] = useState('UPI');
  const [newReceiverUpi, setNewReceiverUpi] = useState('astitvacreations@okhdfcbank');
  const [newReceiverLabel, setNewReceiverLabel] = useState('Primary Current Account (HDFC)');
  const [newUtrNumber, setNewUtrNumber] = useState('');
  const [newReceivedBy, setNewReceivedBy] = useState('Admin');
  const [newPaymentNote, setNewPaymentNote] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [resendingPaymentId, setResendingPaymentId] = useState(null);

  useEffect(() => {
    if (event) {
      setLocalPaid(event.paidAmount || '');
      setLocalPayments(event.payments || []);
      setShootStatus(event.shootStatus || '');
      setNotes(event.notes || '');
      setStatus(event.status || 'PENDING');
      setProgress(event.progressTracking || []);
      // Synchronize with parent expenses while preserving any in-flight optimistic additions
      setLocalExpenses(prev => {
        const serverExpenses = (expenses || []).filter(e => e.referenceId === event._id);
        const pendingTemp = prev.filter(e => String(e._id).startsWith('temp-'));
        return [...serverExpenses, ...pendingTemp];
      });
      setToast(null);
    }
  }, [event, isOpen, expenses]);

  // Fetch Studio Authorized Payment Accounts
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/settings/payment-accounts`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data?.success && Array.isArray(data?.data?.authorizedUpiAccounts) && data.data.authorizedUpiAccounts.length > 0) {
            setPaymentAccounts(data.data.authorizedUpiAccounts);
            const def = data.data.authorizedUpiAccounts.find(a => a.isDefault) || data.data.authorizedUpiAccounts[0];
            if (def) {
              setNewReceiverUpi(def.upiId);
              setNewReceiverLabel(def.label);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const total = event.finalTotal || 0;
  const pending = Math.max(0, total - (Number(localPaid) || 0));

  const expenseList = localExpenses;
  const expenseTotal = expenseList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdatePayment = async () => {
    setSavingPayment(true);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paidAmount: Number(localPaid) || 0 })
      });
      if (res.ok) {
        showToast('success', 'Payment updated successfully!');
        if (fetchEvents) fetchEvents(true);
      } else {
        showToast('error', 'Failed to update payment.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error updating payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleAddPayment = async (e) => {
    if (e) e.preventDefault();
    if (submittingPayment) return;

    const amt = Number(newPayAmount);
    if (!amt || amt <= 0) {
      showToast('error', 'Please enter a valid payment amount greater than zero.');
      return;
    }

    if (newPayType === 'UPI') {
      if (!newReceiverUpi.trim()) {
        showToast('error', 'Please select or enter the studio destination UPI address.');
        return;
      }
      if (!newUtrNumber.trim() || !/^[a-zA-Z0-9]{12}$/.test(newUtrNumber.trim())) {
        showToast('error', 'UPI UTR / Bank Reference number must be exactly 12 alphanumeric characters.');
        return;
      }
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amt,
          paymentType: newPayType,
          receiverUpiId: newPayType === 'UPI' ? newReceiverUpi.trim() : '',
          receiverAccountLabel: newPayType === 'UPI' ? newReceiverLabel.trim() : '',
          utrNumber: (newPayType === 'UPI' || newPayType === 'Bank Transfer') ? newUtrNumber.trim() : '',
          receivedBy: newReceivedBy.trim() || 'Admin',
          note: newPaymentNote.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Payment of ₹${amt.toLocaleString('en-IN')} recorded! Receipt #${data.data.payment.receiptNumber} generated.`);
        setLocalPayments(prev => [...prev, data.data.payment]);
        setLocalPaid(data.data.event.paidAmount);
        setNewPayAmount('');
        setNewUtrNumber('');
        setNewPaymentNote('');
        setShowAddPayment(false);
        if (fetchEvents) fetchEvents(true);
      } else {
        showToast('error', data.message || 'Failed to record payment installment.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error recording payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId, receiptNumber) => {
    if (!window.confirm(`Void / Delete payment installment #${receiptNumber}? This will reverse the balance.`)) return;

    try {
      const res = await fetch(`${API_URL}/events/${event._id}/payments/${paymentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Payment #${receiptNumber} removed and balance reversed.`);
        setLocalPayments(prev => prev.filter(p => p.paymentId !== paymentId && String(p._id) !== paymentId));
        setLocalPaid(data.data.paidAmount);
        if (fetchEvents) fetchEvents(true);
      } else {
        showToast('error', data.message || 'Failed to delete payment.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error deleting payment.');
    }
  };

  const handleResendWhatsAppReceipt = async (paymentId) => {
    setResendingPaymentId(paymentId);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/payments/${paymentId}/resend-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Payment receipt dispatched via WhatsApp!');
      } else {
        showToast('error', data.message || 'Failed to dispatch WhatsApp receipt.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error resending receipt.');
    } finally {
      setResendingPaymentId(null);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shootStatus, notes, status, progressTracking: progress })
      });
      if (res.ok) {
        showToast('success', 'Event details saved successfully!');
        if (fetchEvents) fetchEvents(true);
      } else {
        showToast('error', 'Failed to save event details.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error saving details.');
    } finally {
      setSavingDetails(false);
    }
  };

  const toggleProgress = (opt) => {
    setProgress(prev => {
      const newArr = prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt];
      return newArr;
    });
  };

  const handleInlineAddExpense = async () => {
    if (addingExpense) return; // Prevent double/triple clicks
    if (!inlineExpenseName.trim() || !inlineExpenseAmount || Number(inlineExpenseAmount) <= 0) return;

    setAddingExpense(true);
    const nameToAdd = inlineExpenseName.trim();
    const amountToAdd = Number(inlineExpenseAmount);

    // Instantly clear inputs to prevent re-submission
    setInlineExpenseName('');
    setInlineExpenseAmount('');

    // 0ms instant optimistic addition
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const optimisticExp = {
      _id: tempId,
      expenseName: nameToAdd,
      amount: amountToAdd,
      referenceId: event._id,
      expenseDate: new Date().toISOString().split('T')[0]
    };
    setLocalExpenses(prev => [...prev, optimisticExp]);

    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseName: nameToAdd,
          amount: amountToAdd,
          description: '',
          expenseDate: new Date().toISOString().split('T')[0],
          category: 'EVENT',
          referenceId: event._id,
          onModel: 'Event'
        })
      });
      const data = await res.json();
      if (res.ok && data.data) {
        // Replace tempId with actual created document
        setLocalExpenses(prev => prev.map(e => e._id === tempId ? data.data : e));
        showToast('success', 'Expense added successfully.');
        if (fetchEvents) fetchEvents(true);
      } else {
        // Rollback optimistic add
        setLocalExpenses(prev => prev.filter(e => e._id !== tempId));
        showToast('error', data.message || 'Failed to add expense.');
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
      setLocalExpenses(prev => prev.filter(e => e._id !== tempId));
      showToast('error', 'Network error adding expense.');
    } finally {
      setAddingExpense(false);
    }
  };

  const handleInlineDeleteExpense = async (expenseId) => {
    const toDelete = localExpenses.find(e => e._id === expenseId);
    if (!toDelete) return;

    // 0ms instant optimistic removal
    setLocalExpenses(prev => prev.filter(e => e._id !== expenseId));

    // If it was a pending temp item not yet on server, no delete request needed
    if (String(expenseId).startsWith('temp-')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/expenses/${expenseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        showToast('success', 'Expense removed.');
        if (fetchEvents) fetchEvents(true);
      } else {
        // Rollback on failure
        setLocalExpenses(prev => [...prev, toDelete]);
        showToast('error', 'Failed to remove expense.');
      }
    } catch (err) {
      console.error(err);
      setLocalExpenses(prev => [...prev, toDelete]);
      showToast('error', 'Network error removing expense.');
    }
  };

  const handleInlineEditExpense = async (expenseId) => {
    if (!editExpenseName.trim() || !editExpenseAmount) return;
    const updatedName = editExpenseName.trim();
    const updatedAmount = Number(editExpenseAmount);
    const original = localExpenses.find(e => e._id === expenseId);

    // Instant optimistic update
    setLocalExpenses(prev => prev.map(e => e._id === expenseId ? { ...e, expenseName: updatedName, amount: updatedAmount } : e));
    setEditingExpenseId(null);

    if (String(expenseId).startsWith('temp-')) return;

    try {
      const res = await fetch(`${API_URL}/expenses/${expenseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseName: updatedName,
          amount: updatedAmount
        })
      });
      if (res.ok) {
        showToast('success', 'Expense updated.');
        if (fetchEvents) fetchEvents(true);
      } else {
        if (original) {
          setLocalExpenses(prev => prev.map(e => e._id === expenseId ? original : e));
        }
        showToast('error', 'Failed to update expense.');
      }
    } catch (err) {
      console.error(err);
      if (original) {
        setLocalExpenses(prev => prev.map(e => e._id === expenseId ? original : e));
      }
      showToast('error', 'Network error updating expense.');
    }
  };

  const handleSendWhatsAppPDF = async () => {
    const isAgreement = Boolean(event.agreementVersionNumber);
    const label = isAgreement ? 'Agreement' : `Quotation ${event.activeQuotationNumber || '1'}`;
    if (!window.confirm(`Send official ${label} PDF to client (${event.phone}) via WhatsApp?`)) return;

    setSendingWhatsApp(true);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/send-whatsapp-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `WhatsApp ${label} dispatched successfully!`);
        if (fetchEvents) fetchEvents();
      } else {
        showToast('error', data.message || 'Failed to dispatch WhatsApp PDF.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error sending WhatsApp document.');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const statusColorClass = 
    status === 'CONFIRMED' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' :
    status === 'COMPLETED' ? 'text-blue-400 bg-blue-950/60 border-blue-500/30' :
    status === 'CANCELLED' ? 'text-rose-400 bg-rose-950/60 border-rose-500/30' :
    'text-amber-400 bg-amber-950/60 border-amber-500/30';

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b0b0d] border border-[#262626] rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Full-Screen Popup Header */}
        <div className="p-5 border-b border-[#222] bg-[#111113] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-[#d4af37]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 rounded-xl">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-heading font-bold text-white uppercase tracking-wider">
                  {event.customerName}
                </h3>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${statusColorClass}`}>
                  {status}
                </span>
                {event.agreementVersionNumber ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-green-950/70 text-green-400 border border-green-500/30 flex items-center gap-1 font-mono">
                    <Award className="w-3.5 h-3.5" />
                    ★ Final Agreement (Q{event.agreementVersionNumber})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-[#1a1a1a] text-[var(--color-gold)] border border-[var(--color-gold)]/30 font-mono">
                    Quotation {event.activeQuotationNumber || '1'} (Active)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#888] mt-1 flex flex-wrap items-center gap-3">
                <span className="text-white font-medium">Event: {event.eventName || 'Event'}</span>
                <span>•</span>
                <span>Shoot Date: <strong className="text-[#22c55e]">{event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN') : 'TBD'}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-white font-mono">{event.phone || 'N/A'}</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-white">{event.email || 'N/A'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(event);
              }}
              className="px-3.5 py-1.5 bg-[#1a1a1a] hover:bg-[#252528] text-white border border-[#333] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-orange-400" />
              Edit Event
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors ml-2"
              title="Close Popup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Toast / Notification */}
        {toast && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
            toast.type === 'success' 
              ? 'bg-green-950/70 text-green-300 border-b border-green-800/40' 
              : 'bg-red-950/70 text-red-300 border-b border-red-800/40'
          }`}>
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="text-xs hover:text-white">✕</button>
          </div>
        )}

        {/* Modal Scrollable Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#0c0c0e]">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: Quotations, Agreement, Payment & Expenses          */}
          {/* ============================================================== */}
          <div className="space-y-6">

            {/* Quotations & Agreement Banner */}
            <div className="bg-[#121214] rounded-xl border border-[#222] p-5 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-md">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                      {event.agreementVersionNumber ? (
                        <span className="text-green-400">★ Final Agreement Active</span>
                      ) : (
                        <span className="text-[var(--color-gold)]">Quotation {event.activeQuotationNumber || '1'} (Active)</span>
                      )}
                    </h5>
                    <p className="text-[10px] text-[#777]">
                      {event.agreementVersionNumber 
                        ? `Finalized contract bound to Quotation ${event.agreementVersionNumber}` 
                        : (event.versions?.find(v => v.versionNumber === event.activeVersionNumber)?.note || 'Active event quote snapshot')}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] bg-[#1e1e24] text-[#A1A1A1] px-2.5 py-1 rounded-md font-mono border border-[#333]">
                  {event.versions?.length || 1} {event.versions?.length === 1 ? 'Quotation' : 'Quotations'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#222] space-y-2">
                {/* Direct Action: Add Additional Requirements to create/update Agreement revision */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenQuotations) onOpenQuotations(event, 'new-revision');
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {event.agreementVersionNumber 
                    ? '+ Add Additional Requirements (Update Final Agreement v2.0)' 
                    : '+ Add Additional Requirements (New Quote Revision)'}
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenQuotations) onOpenQuotations(event, 'history');
                    }}
                    className="py-2.5 px-3 bg-[var(--color-gold)]/15 hover:bg-[var(--color-gold)]/25 text-[var(--color-gold)] border border-[var(--color-gold)]/40 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Manage Quotes
                  </button>

                  <button
                    onClick={() => {
                      const url = event.agreementVersionNumber 
                        ? `${API_URL}/events/${event._id}/agreement.pdf`
                        : `${API_URL}/events/${event._id}/download-pdf`;
                      window.open(url, '_blank');
                    }}
                    className="py-2.5 px-3 bg-[#1e1e24] hover:bg-[#282830] text-white border border-[#333] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    Download PDF
                  </button>

                  <button
                    onClick={handleSendWhatsAppPDF}
                    disabled={sendingWhatsApp}
                    className="py-2.5 px-3 bg-[#064e3b] hover:bg-[#065f46] text-[#34d399] border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingWhatsApp ? 'Sending...' : 'WhatsApp PDF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Tracking & Installment Ledger */}
            <div className="bg-[#121214] rounded-xl border border-[#222] p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-heading font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Payment Tracking & Installment Ledger
                </h5>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-mono ${
                  pending === 0 && total > 0 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' :
                  Number(localPaid) > 0 ? 'text-amber-400 bg-amber-950/60 border-amber-500/30' :
                  'text-rose-400 bg-rose-950/60 border-rose-500/30'
                }`}>
                  {pending === 0 && total > 0 ? 'Fully Paid' : Number(localPaid) > 0 ? 'Partially Paid' : 'Unpaid'}
                </span>
              </div>

              {/* 3 Summary metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                  <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-1">Total Fee</p>
                  <p className="text-base font-bold text-white font-mono">₹{total.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                  <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-1">Paid So Far</p>
                  <p className="text-base font-bold text-green-400 font-mono">₹{(Number(localPaid) || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                  <p className="text-[10px] text-[#888] uppercase tracking-wider font-bold mb-1">Pending Balance</p>
                  <p className="text-base font-bold text-amber-400 font-mono">₹{pending.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Toggle Form to Record Payment Installment */}
              <button
                onClick={() => setShowAddPayment(prev => !prev)}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-950/80 to-emerald-900/80 hover:from-emerald-900 hover:to-emerald-800 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                {showAddPayment ? 'Close Payment Form' : '+ Record Payment Installment (UPI / Cash / Bank)'}
              </button>

              {/* Form to Record New Installment */}
              {showAddPayment && (
                <form onSubmit={handleAddPayment} className="bg-[#0a0a0d] border border-emerald-500/30 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#222] pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Record Payment Installment
                    </span>
                    <span className="text-[10px] text-[#888] font-mono">Sequential Receipt & WhatsApp Confirmed</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 40000"
                        value={newPayAmount}
                        onChange={e => setNewPayAmount(e.target.value)}
                        className="w-full bg-[#141416] border border-[#333] rounded px-3 py-2 text-sm font-bold text-green-400 font-mono outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">Payment Mode *</label>
                      <select
                        value={newPayType}
                        onChange={e => setNewPayType(e.target.value)}
                        className="w-full bg-[#141416] border border-[#333] rounded px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                      >
                        <option value="UPI">UPI Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {/* Multi-UPI Destination Fields */}
                  {newPayType === 'UPI' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                          Destination Studio UPI VPA *
                        </label>
                        {paymentAccounts.length > 0 ? (
                          <select
                            value={newReceiverUpi}
                            onChange={e => {
                              setNewReceiverUpi(e.target.value);
                              const matched = paymentAccounts.find(a => a.upiId === e.target.value);
                              if (matched) setNewReceiverLabel(matched.label);
                            }}
                            className="w-full bg-[#141416] border border-[#333] rounded px-3 py-2 text-xs font-bold text-amber-300 font-mono outline-none focus:border-emerald-500"
                          >
                            {paymentAccounts.map(acc => (
                              <option key={acc._id || acc.upiId} value={acc.upiId}>
                                {acc.label} ({acc.upiId})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="e.g. astitvacreations@okhdfcbank"
                            value={newReceiverUpi}
                            onChange={e => setNewReceiverUpi(e.target.value)}
                            className="w-full bg-[#141416] border border-[#333] rounded px-3 py-2 text-xs font-mono text-amber-300 outline-none focus:border-emerald-500"
                            required
                          />
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                          Bank UTR / Ref No (12 Digits) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 432109876543"
                          maxLength={12}
                          value={newUtrNumber}
                          onChange={e => setNewUtrNumber(e.target.value.toUpperCase())}
                          className="w-full bg-[#141416] border border-[#333] rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {newPayType === 'Bank Transfer' && (
                    <div>
                      <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">
                        Bank UTR / Transaction Reference *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UTR / NEFT Reference No"
                        value={newUtrNumber}
                        onChange={e => setNewUtrNumber(e.target.value)}
                        className="w-full bg-[#141416] border border-[#333] rounded px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">Verified / Collected By</label>
                      <input
                        type="text"
                        value={newReceivedBy}
                        onChange={e => setNewReceivedBy(e.target.value)}
                        className="w-full bg-[#141416] border border-[#333] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#aaa] uppercase tracking-wider block font-bold mb-1">Payment Note / Stage</label>
                      <input
                        type="text"
                        placeholder="e.g. Advance Token / Post-shoot"
                        value={newPaymentNote}
                        onChange={e => setNewPaymentNote(e.target.value)}
                        className="w-full bg-[#141416] border border-[#333] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow"
                  >
                    {submittingPayment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Recording & Dispatching WhatsApp...</span>
                      </>
                    ) : (
                      'Confirm & Record Payment (Issue Receipt)'
                    )}
                  </button>
                </form>
              )}

              {/* Installment History Ledger */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-[#888] uppercase tracking-wider font-bold">
                    Payment Installment History ({localPayments.length})
                  </span>
                  {localPayments.length > 0 && (
                    <span className="text-[10px] text-green-400 font-mono font-bold">
                      Reconciled Total: ₹{(Number(localPaid) || 0).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div className="bg-[#09090b] border border-[#222] rounded-xl p-3 max-h-56 overflow-y-auto space-y-2">
                  {localPayments.length === 0 ? (
                    <div className="text-center py-4 text-xs text-[#666]">
                      <p>No itemized installments recorded yet.</p>
                      <p className="text-[10px] text-[#555] mt-1">Click the button above to record advance or installment with UPI/UTR destination tracking.</p>
                    </div>
                  ) : (
                    localPayments.map(p => (
                      <div key={p.paymentId || p._id} className="p-3 rounded-lg bg-[#141416] border border-[#222] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-amber-400">#{p.receiptNumber || 'RCP'}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                              {p.paymentType}
                            </span>
                            <span className="text-[10px] text-[#777]">
                              {p.date ? new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          </div>

                          <div className="text-[11px] text-white/90">
                            {p.paymentType === 'UPI' ? (
                              <p className="font-mono text-[#aaa]">
                                To: <span className="text-amber-300">{p.receiverUpiId}</span>
                                {p.utrNumber ? <> • UTR: <span className="text-green-300">{p.utrNumber}</span></> : null}
                              </p>
                            ) : p.utrNumber ? (
                              <p className="font-mono text-[#aaa]">Ref: <span className="text-white">{p.utrNumber}</span></p>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-[#666]">
                            <span>Collected: <strong className="text-white/80">{p.receivedBy || 'Staff'}</strong></span>
                            {p.note ? <span className="italic truncate max-w-xs text-[#888]">"{p.note}"</span> : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#222]">
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            +₹{Number(p.amount || 0).toLocaleString('en-IN')}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Download PDF Receipt */}
                            <button
                              type="button"
                              onClick={() => window.open(`${API_URL}/payments/${p.paymentId}/receipt.pdf`, '_blank')}
                              title="Download Official Receipt PDF"
                              className="p-1.5 bg-[#1e1e24] hover:bg-[#2a2a34] text-white border border-[#333] rounded transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-orange-400" />
                            </button>

                            {/* Resend WhatsApp Receipt */}
                            <button
                              type="button"
                              onClick={() => handleResendWhatsAppReceipt(p.paymentId)}
                              disabled={resendingPaymentId === p.paymentId}
                              title="Resend WhatsApp Receipt to Client"
                              className="p-1.5 bg-[#064e3b] hover:bg-[#065f46] text-[#34d399] border border-emerald-500/30 rounded transition-colors disabled:opacity-50"
                            >
                              {resendingPaymentId === p.paymentId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Void / Delete Payment */}
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p.paymentId, p.receiptNumber)}
                              title="Void / Delete Payment"
                              className="p-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-500/30 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Backward-Compatible Direct Paid Amount Adjustment */}
              <div className="pt-2 border-t border-[#222] flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#777]">Direct Amount Override (Optional):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={localPaid}
                    onChange={e => setLocalPaid(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-28 bg-[#151515] border border-[#333] rounded px-2 py-1 text-xs font-bold text-green-400 font-mono outline-none focus:border-[#22c55e]"
                  />
                  <button
                    type="button"
                    onClick={handleUpdatePayment}
                    disabled={savingPayment}
                    className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {savingPayment ? 'Saving...' : 'Sync'}
                  </button>
                </div>
              </div>
            </div>

            {/* Shoot Expenses */}
            <div className="bg-[#121214] rounded-xl border border-[#222] p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h5 className="text-xs font-heading font-bold text-white uppercase tracking-widest">Shoot Expenses</h5>
                <span className="text-xs text-[#d4af37] font-bold font-mono">Total: ₹{expenseTotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Expense List */}
              <div className="bg-[#09090b] border border-[#222] rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                {expenseList.length === 0 ? (
                  <p className="text-xs text-[#666] text-center py-4">No expenses recorded for this event.</p>
                ) : (
                  expenseList.map(exp => (
                    <div key={exp._id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[#141416] border border-[#222]">
                      {editingExpenseId === exp._id ? (
                        <div className="flex flex-1 gap-2 mr-2">
                          <input 
                            type="text" 
                            value={editExpenseName} 
                            onChange={e => setEditExpenseName(e.target.value)} 
                            className="flex-[2] bg-[#1a1a1d] border border-[#333] rounded px-2 py-1 text-white text-xs outline-none"
                          />
                          <input 
                            type="number" 
                            value={editExpenseAmount} 
                            onChange={e => setEditExpenseAmount(e.target.value)} 
                            className="flex-1 bg-[#1a1a1d] border border-[#333] rounded px-2 py-1 text-white text-xs outline-none"
                          />
                          <button onClick={() => handleInlineEditExpense(exp._id)} className="text-[#22c55e] font-bold px-1.5">Save</button>
                          <button onClick={() => setEditingExpenseId(null)} className="text-[#666] font-bold px-1.5">✕</button>
                        </div>
                      ) : (
                        <>
                          <span className="text-white truncate font-medium">{exp.expenseName}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-emerald-400 font-bold font-mono">₹{exp.amount}</span>
                            <button onClick={() => {
                              setEditingExpenseId(exp._id);
                              setEditExpenseName(exp.expenseName);
                              setEditExpenseAmount(exp.amount);
                            }} className="text-blue-400 hover:text-blue-300">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleInlineDeleteExpense(exp._id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Expense Row */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Expense item (e.g. Travel, Assistant)" 
                  value={inlineExpenseName}
                  disabled={addingExpense}
                  onChange={(e) => setInlineExpenseName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInlineAddExpense(); }}
                  className="flex-[2] bg-[#09090b] border border-[#222] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#444] disabled:opacity-50" 
                />
                <input 
                  type="number" 
                  placeholder="₹ Amount" 
                  value={inlineExpenseAmount}
                  disabled={addingExpense}
                  onChange={(e) => setInlineExpenseAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInlineAddExpense(); }}
                  className="flex-1 bg-[#09090b] border border-[#222] rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#444] disabled:opacity-50" 
                />
                <button 
                  onClick={handleInlineAddExpense} 
                  disabled={addingExpense || !inlineExpenseName.trim() || !inlineExpenseAmount}
                  className="shrink-0 bg-[#064e3b] hover:bg-[#065f46] text-[#34d399] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {addingExpense ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    '+ Add'
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Production, Progress, Notes, Status              */}
          {/* ============================================================== */}
          <div className="space-y-6">

            {/* Shoot Status (Manual) */}
            <div className="bg-[#121214] rounded-xl border border-[#222] p-5 shadow-lg">
              <label className="text-xs font-heading font-bold text-white uppercase tracking-wider block mb-2">
                Shoot Status (Manual)
              </label>
              <input
                type="text"
                placeholder="e.g. Editing Complete, Album In Print, Footage Backed Up"
                value={shootStatus}
                onChange={e => setShootStatus(e.target.value)}
                className="w-full bg-[#09090b] border border-[#222] rounded-lg px-4 py-2.5 text-white text-xs outline-none focus:border-[var(--color-gold)]"
              />
            </div>

            {/* Follow-up Notes */}
            <div className="bg-[#121214] rounded-xl border border-[#222] p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-orange-400">📝</span>
                <label className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                  Follow-Up Notes
                </label>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter client instructions, editing notes, or follow-up details..."
                className="w-full bg-[#09090b] border border-[#222] rounded-lg p-3 text-white text-xs outline-none focus:border-[var(--color-gold)]"
              />
            </div>

            {/* Progress Tracking Checkboxes */}
            <div className="bg-[#121214] rounded-xl border border-[#222] p-5 shadow-lg">
              <p className="text-xs font-heading font-bold text-white uppercase tracking-wider mb-3">
                Production & Delivery Progress
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {progressTrackingOptions.map((opt, idx) => {
                  const checked = progress.includes(opt);
                  return (
                    <label 
                      key={idx} 
                      className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                        checked ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-[#09090b] border-[#222] text-[#888] hover:text-white'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={checked} 
                        onChange={() => toggleProgress(opt)} 
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#444] bg-transparent'
                      }`}>
                        {checked && <div className="w-2 h-2 bg-black rounded-sm" />}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider truncate">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Event Status Dropdown & Save Details Button */}
            <div className="bg-[#121214] rounded-xl border border-[#222] p-5 shadow-lg space-y-3">
              <label className="text-xs font-heading font-bold text-white uppercase tracking-wider block">
                Overall Event Booking Status
              </label>
              <div className="flex gap-3">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className={`flex-1 bg-[#09090b] border border-[#333] rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider outline-none ${
                    status === 'CONFIRMED' ? 'text-[#22c55e]' : status === 'PENDING' ? 'text-orange-400' : status === 'CANCELLED' ? 'text-red-500' : 'text-blue-500'
                  }`}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <button
                  onClick={handleSaveDetails}
                  disabled={savingDetails}
                  className="px-6 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Bottom Toolbar */}
        <div className="p-4 border-t border-[#222] bg-[#111113] flex items-center justify-between">
          <button
            onClick={() => {
              if (onDelete) onDelete(event._id);
              onClose();
            }}
            className="px-4 py-2 bg-[#450a0a] hover:bg-[#7f1d1d] text-red-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Booking
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
