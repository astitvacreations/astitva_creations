import { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Plus, 
  Check, 
  RotateCcw, 
  Award, 
  Download, 
  Send, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EventQuotationsModal({ isOpen, onClose, event, onRefresh }) {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'new-revision' | 'audit'
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [predefinedServices, setPredefinedServices] = useState([]);

  // New Revision Form State
  const [revisionNote, setRevisionNote] = useState('');
  const [subEvents, setSubEvents] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [complimentaries, setComplimentaries] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [album, setAlbum] = useState({
    enabled: false,
    numberOfAlbums: 1,
    sheets: 30,
    pricePerSheet: 500
  });
  const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percentage'
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    if (isOpen && event?._id) {
      loadEventDetails();
      loadPredefinedServices();
    }
  }, [isOpen, event?._id]);

  const loadEventDetails = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setEventData(data.data);
        populateRevisionDefaults(data.data);
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to load event details.' });
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      setFeedback({ type: 'error', text: 'Network error loading event quotations.' });
    } finally {
      setLoading(false);
    }
  };

  const loadPredefinedServices = async () => {
    try {
      const res = await fetch(`${API_URL}/events/predefined-services`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setPredefinedServices(data.data || []);
      }
    } catch (err) {
      console.warn('Could not load predefined services:', err);
    }
  };

  const populateRevisionDefaults = (ev) => {
    if (!ev) return;
    const activeVerNum = ev.activeVersionNumber || 1;
    const activeVer = ev.versions?.find(v => v.versionNumber === activeVerNum) || ev.versions?.[0];

    if (activeVer) {
      // Populate from active version snapshot
      setSubEvents(
        (activeVer.subEventList || []).map(se => ({
          name: se.name,
          services: (se.services || []).map(s => ({
            name: s.name,
            price: Number(s.price || 0),
            quantity: Number(s.quantity) || 1
          }))
        }))
      );
      setDeliverables((activeVer.deliverables || []).map(d => ({ name: d.name, price: Number(d.price || 0) })));
      setComplimentaries((activeVer.complimentries || []).map(c => ({ name: c.name, price: 0 })));
      setAddOns((activeVer.addOns || []).map(a => ({ name: a.name, price: Number(a.price || 0) })));
      setAlbum({
        enabled: Boolean(activeVer.album?.enabled),
        numberOfAlbums: Number(activeVer.album?.numberOfAlbums) || 1,
        sheets: Number(activeVer.album?.sheets) || 30,
        pricePerSheet: Number(activeVer.album?.pricePerSheet) || 500
      });
      if (activeVer.discountPercentage > 0) {
        setDiscountType('percentage');
        setDiscountValue(activeVer.discountPercentage);
      } else {
        setDiscountType('amount');
        setDiscountValue(activeVer.discount || 0);
      }
    } else {
      // Fallback from top-level event fields
      setSubEvents(
        (ev.subEvents || []).map(se => ({
          name: se.name,
          services: (se.services || []).map(s => ({
            name: s.name,
            price: Number(s.price || 0),
            quantity: 1
          }))
        }))
      );
      setDeliverables((ev.deliverables || []).map(d => ({ name: typeof d === 'string' ? d : d.name, price: 0 })));
      setComplimentaries((ev.complimentaries || []).map(c => ({ name: typeof c === 'string' ? c : c.name, price: 0 })));
      setAddOns([]);
      setAlbum({ enabled: false, numberOfAlbums: 1, sheets: 30, pricePerSheet: 500 });
      setDiscountType('amount');
      setDiscountValue(ev.discountAmount || 0);
    }

    const nextNumber = (ev.versions?.length || 1) + 1;
    setRevisionNote(`Revision based on client request for Quotation ${nextNumber}`);
  };

  // Live financial calculation for new revision builder
  const calculateDraftFinancials = () => {
    const servicesSum = subEvents.reduce((acc, se) => {
      return acc + (se.services || []).reduce((sAcc, s) => sAcc + (Number(s.price || 0) * (Number(s.quantity) || 1)), 0);
    }, 0);

    const deliverablesSum = deliverables.reduce((acc, d) => acc + Number(d.price || 0), 0);
    const addOnsSum = addOns.reduce((acc, a) => acc + Number(a.price || 0), 0);
    const albumCost = album.enabled ? (Number(album.sheets || 0) * Number(album.pricePerSheet || 500) * Math.max(1, Number(album.numberOfAlbums || 1))) : 0;

    const grossTotal = servicesSum + deliverablesSum + addOnsSum + albumCost;

    let discount = 0;
    let discountPercentage = 0;
    if (discountType === 'percentage') {
      discountPercentage = Number(discountValue || 0);
      discount = Math.round(grossTotal * (discountPercentage / 100));
    } else {
      discount = Number(discountValue || 0);
      discountPercentage = grossTotal > 0 ? Math.round((discount / grossTotal) * 100 * 10) / 10 : 0;
    }

    const netTotal = Math.max(0, grossTotal - discount);
    const currentPaid = Number(eventData?.paidAmount || 0);
    const pending = Math.max(0, netTotal - currentPaid);

    return { servicesSum, deliverablesSum, addOnsSum, albumCost, grossTotal, discount, discountPercentage, netTotal, pending };
  };

  // Actions
  const handleRestore = async (vNum) => {
    if (!window.confirm(`Switch active quotation to Quotation ${vNum}? This will update current active services and balances.`)) return;
    setActionLoading(`restore-${vNum}`);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/versions/${vNum}/restore`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: `Quotation ${vNum} is now the active quotation!` });
        await loadEventDetails();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to restore quotation.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error restoring quotation.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAgreement = async (vNum, isCurrentlyAgreement) => {
    const actionText = isCurrentlyAgreement ? 'Remove Agreement status' : `Set Quotation ${vNum} as the Final Agreement`;
    if (!window.confirm(`${actionText}? Note: Exactly one quotation can be the active Agreement.`)) return;

    setActionLoading(`agreement-${vNum}`);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/versions/${vNum}/set-agreement`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ unset: isCurrentlyAgreement })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ 
          type: 'success', 
          text: isCurrentlyAgreement ? `Removed Agreement status.` : `Quotation ${vNum} finalized as Agreement!` 
        });
        await loadEventDetails();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to update agreement status.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error updating agreement status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadVersionPDF = async (ver) => {
    setActionLoading(`pdf-${ver.versionNumber}`);
    try {
      const url = ver.isAgreement 
        ? `${API_URL}/events/${event._id}/agreement.pdf`
        : `${API_URL}/events/${event._id}/quotation-${ver.quotationNumber || ver.versionNumber}.pdf`;

      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendWhatsApp = async (vNum) => {
    const ver = eventData?.versions?.find(v => v.versionNumber === vNum);
    const label = ver?.isAgreement ? 'Final Agreement' : `Quotation ${ver?.quotationNumber || vNum}`;
    const targetPhone = eventData?.phone || '';

    if (!targetPhone) {
      alert('Event has no phone number recorded.');
      return;
    }

    if (!window.confirm(`Send official ${label} PDF to ${targetPhone} via WhatsApp?`)) return;

    setActionLoading(`whatsapp-${vNum}`);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/events/${event._id}/send-whatsapp-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ versionNumber: vNum })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: `WhatsApp ${label} dispatched successfully to ${targetPhone}!` });
        await loadEventDetails();
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to dispatch WhatsApp PDF.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Failed to send WhatsApp message.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateNewRevision = async (e) => {
    e.preventDefault();
    if (!revisionNote.trim()) {
      alert('Please provide a note or reason for this quotation revision.');
      return;
    }

    setActionLoading('creating-revision');
    setFeedback(null);
    try {
      const financials = calculateDraftFinancials();
      const payload = {
        note: revisionNote.trim(),
        subEventList: subEvents,
        deliverables,
        complimentries: complimentaries,
        addOns,
        album,
        discount: financials.discount,
        discountPercentage: financials.discountPercentage
      };

      const res = await fetch(`${API_URL}/events/${event._id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: 'success', text: `Successfully created ${data.data?.versionName || 'new quotation revision'}!` });
        await loadEventDetails();
        setActiveTab('history');
        if (onRefresh) onRefresh();
      } else {
        setFeedback({ type: 'error', text: data.message || 'Failed to create quotation revision.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: 'Error creating quotation revision.' });
    } finally {
      setActionLoading(null);
    }
  };

  // Sub-events editor handlers
  const addSubEvent = () => {
    setSubEvents([...subEvents, { name: 'Main Function', services: [] }]);
  };

  const removeSubEvent = (idx) => {
    const list = [...subEvents];
    list.splice(idx, 1);
    setSubEvents(list);
  };

  const updateSubEventName = (idx, name) => {
    const list = [...subEvents];
    list[idx].name = name;
    setSubEvents(list);
  };

  const addService = (seIdx) => {
    const list = [...subEvents];
    list[seIdx].services.push({ name: 'Traditional Photography', price: 20000, quantity: 1 });
    setSubEvents(list);
  };

  const removeService = (seIdx, sIdx) => {
    const list = [...subEvents];
    list[seIdx].services.splice(sIdx, 1);
    setSubEvents(list);
  };

  const updateService = (seIdx, sIdx, field, value) => {
    const list = [...subEvents];
    list[seIdx].services[sIdx][field] = field === 'price' || field === 'quantity' ? Number(value) : value;
    setSubEvents(list);
  };

  // Deliverables & Add-ons editor
  const addDeliverable = () => setDeliverables([...deliverables, { name: '', price: 0 }]);
  const removeDeliverable = (idx) => {
    const list = [...deliverables];
    list.splice(idx, 1);
    setDeliverables(list);
  };
  const updateDeliverable = (idx, field, val) => {
    const list = [...deliverables];
    list[idx][field] = field === 'price' ? Number(val) : val;
    setDeliverables(list);
  };

  const addAddOn = () => setAddOns([...addOns, { name: '', price: 10000 }]);
  const removeAddOn = (idx) => {
    const list = [...addOns];
    list.splice(idx, 1);
    setAddOns(list);
  };
  const updateAddOn = (idx, field, val) => {
    const list = [...addOns];
    list[idx][field] = field === 'price' ? Number(val) : val;
    setAddOns(list);
  };

  if (!isOpen) return null;

  const draftFinancials = calculateDraftFinancials();
  const versionsList = eventData?.versions || [];
  const nextVerNumber = versionsList.length + 1;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0c0c0e] border border-[#262626] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header */}
        <div className="p-5 border-b border-[#222] bg-[#111] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-[#d4af37]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-heading font-bold text-white uppercase tracking-wider">
                  {eventData?.customerName || event?.customerName} — {eventData?.eventName || event?.eventName}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#888] mt-0.5">
                  <span>📅 {eventData?.eventDate ? new Date(eventData.eventDate).toLocaleDateString('en-IN') : 'Date TBD'}</span>
                  <span>•</span>
                  <span>📞 {eventData?.phone || 'No Phone'}</span>
                  <span>•</span>
                  <span>✉️ {eventData?.email || 'No Email'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {eventData?.agreementVersionNumber ? (
              <span className="px-3 py-1 bg-green-950/80 border border-green-500/40 text-green-400 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Agreement: Quotation {eventData.agreementVersionNumber}
              </span>
            ) : (
              <span className="px-3 py-1 bg-[#1a1a1a] border border-[#333] text-[#d4af37] text-xs font-bold uppercase rounded-lg flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Active: Quotation {eventData?.activeQuotationNumber || '1'}
              </span>
            )}

            <button 
              onClick={onClose} 
              className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#222] bg-[#0e0e10]">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-[var(--color-gold)] text-[var(--color-gold)]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Quotation Revisions ({versionsList.length})
          </button>

          <button
            onClick={() => setActiveTab('new-revision')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'new-revision'
                ? 'border-[var(--color-gold)] text-[var(--color-gold)]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-green-400" />
            + Create Quotation {nextVerNumber}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-[var(--color-gold)] text-[var(--color-gold)]'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Audit History ({eventData?.followUps?.length || 0})
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-6 py-3 text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-green-950/60 text-green-300 border-b border-green-800/40' 
              : 'bg-red-950/60 text-red-300 border-b border-red-800/40'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-[#d4af37] font-semibold text-sm">
              Loading quotation snapshots...
            </div>
          ) : activeTab === 'history' ? (
            /* ============================================================ */
            /* TAB 1: QUOTATION REVISIONS TIMELINE                          */
            /* ============================================================ */
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                    Progressive Quotations Timeline
                  </h4>
                  <p className="text-xs text-[#888]">
                    Immutable revision snapshots from Quotation 1 up to Final Agreement. Restore any quotation or finalize as Agreement.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('new-revision')}
                  className="px-4 py-2 bg-[var(--color-gold)] hover:bg-[#c29d2b] text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  New Revision (Quotation {nextVerNumber})
                </button>
              </div>

              {versionsList.length === 0 ? (
                <div className="py-12 text-center text-[#777] bg-[#121214] rounded-xl border border-[#222]">
                  No quotation snapshots found.
                </div>
              ) : (
                versionsList.slice().reverse().map((ver) => {
                  const isActive = ver.versionNumber === eventData?.activeVersionNumber;
                  const isAgreement = Boolean(ver.isAgreement);
                  const isExpanded = expandedVersion === ver.versionNumber;
                  const netAmount = Math.max(0, (ver.totalAmount || 0) - (ver.discount || 0));

                  return (
                    <div 
                      key={ver.versionNumber}
                      className={`rounded-xl border transition-all p-5 ${
                        isAgreement 
                          ? 'bg-[#0f1f14] border-green-500/50 shadow-lg shadow-green-950/30' 
                          : isActive 
                            ? 'bg-[#18160f] border-[var(--color-gold)]/50 shadow-lg shadow-amber-950/20' 
                            : 'bg-[#121214] border-[#222] hover:border-[#333]'
                      }`}
                    >
                      {/* Top Bar of Snapshot Card */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#222]/80">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider font-mono ${
                            isAgreement
                              ? 'bg-green-500 text-black'
                              : isActive
                                ? 'bg-[var(--color-gold)] text-black'
                                : 'bg-[#222] text-white'
                          }`}>
                            Quotation {ver.quotationNumber || ver.versionNumber}
                          </span>

                          <span className="text-sm font-semibold text-white">
                            {ver.versionName || `Quotation ${ver.quotationNumber}`}
                          </span>

                          {isAgreement && (
                            <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              ★ Final Agreement
                            </span>
                          )}

                          {isActive && (
                            <span className="px-2 py-0.5 bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/40 text-[var(--color-gold)] text-[10px] font-bold uppercase tracking-wider rounded">
                              Active Quote
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#888]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Created {ver.createdAt ? new Date(ver.createdAt).toLocaleString('en-IN') : 'N/A'}</span>
                        </div>
                      </div>

                      {/* Revision Note */}
                      {ver.note && (
                        <div className="mt-3 text-xs text-[#ccc] bg-[#09090b] border border-[#222] rounded-lg p-2.5 flex items-start gap-2">
                          <span className="text-orange-400 font-bold shrink-0">Reason/Note:</span>
                          <span>{ver.note}</span>
                        </div>
                      )}

                      {/* Financial Metrics Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-4">
                        <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                          <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">Gross Total</span>
                          <span className="text-base font-bold text-white">₹{ver.totalAmount?.toLocaleString('en-IN') || 0}</span>
                        </div>

                        <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                          <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">Discount</span>
                          <span className="text-base font-bold text-orange-400">
                            ₹{ver.discount?.toLocaleString('en-IN') || 0} {ver.discountPercentage > 0 ? `(${ver.discountPercentage}%)` : ''}
                          </span>
                        </div>

                        <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                          <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">Net Amount</span>
                          <span className="text-base font-bold text-[var(--color-gold)]">₹{netAmount.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                          <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">Paid So Far</span>
                          <span className="text-base font-bold text-green-400">₹{ver.paidAmount?.toLocaleString('en-IN') || 0}</span>
                        </div>

                        <div className="bg-[#09090b] p-3 rounded-lg border border-[#222]">
                          <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">Pending Balance</span>
                          <span className="text-base font-bold text-red-400">₹{ver.pendingAmount?.toLocaleString('en-IN') || 0}</span>
                        </div>
                      </div>

                      {/* Expandable Breakdown */}
                      <button
                        onClick={() => setExpandedVersion(isExpanded ? null : ver.versionNumber)}
                        className="text-xs text-[#888] hover:text-white flex items-center gap-1.5 font-bold mb-3 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? 'Hide Itemized Breakdown' : `View Services (${(ver.subEventList || []).reduce((acc, se) => acc + (se.services?.length || 0), 0)} items)`}
                      </button>

                      {isExpanded && (
                        <div className="bg-[#09090b] p-4 rounded-xl border border-[#222] mb-4 space-y-4 text-xs">
                          {/* Sub Events */}
                          <div>
                            <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-2">Sub Events & Services</span>
                            <div className="space-y-2">
                              {(ver.subEventList || []).map((se, seIdx) => (
                                <div key={seIdx} className="bg-[#121214] p-3 rounded-lg border border-[#222]">
                                  <div className="font-bold text-white uppercase tracking-wider mb-1.5">{se.name}</div>
                                  <div className="space-y-1">
                                    {(se.services || []).map((s, sIdx) => (
                                      <div key={sIdx} className="flex justify-between items-center text-[#aaa]">
                                        <span>• {s.name} {s.quantity > 1 ? `(${s.quantity}x)` : ''}</span>
                                        <span className="font-mono text-white">₹{((Number(s.price) || 0) * (Number(s.quantity) || 1)).toLocaleString('en-IN')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Album Details */}
                          {ver.album?.enabled && (
                            <div className="bg-[#121214] p-3 rounded-lg border border-[#222]">
                              <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Album Details</span>
                              <div className="flex justify-between items-center text-[#aaa]">
                                <span>{ver.album.numberOfAlbums || 1} Album(s) — {ver.album.sheets || 0} Sheets @ ₹{ver.album.pricePerSheet || 500}/sheet</span>
                                <span className="font-mono text-white">
                                  ₹{((ver.album.sheets || 0) * (ver.album.pricePerSheet || 500) * (ver.album.numberOfAlbums || 1)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Deliverables & Add-ons */}
                          {ver.deliverables?.length > 0 && (
                            <div className="bg-[#121214] p-3 rounded-lg border border-[#222]">
                              <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Deliverables</span>
                              <div className="flex flex-wrap gap-2">
                                {ver.deliverables.map((d, dIdx) => (
                                  <span key={dIdx} className="px-2 py-0.5 bg-[#1e1e24] text-[#ccc] rounded text-[11px]">
                                    {typeof d === 'string' ? d : d.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222]">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Restore Active Button */}
                          {!isActive && (
                            <button
                              onClick={() => handleRestore(ver.versionNumber)}
                              disabled={actionLoading === `restore-${ver.versionNumber}`}
                              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Restore as Active
                            </button>
                          )}

                          {/* Agreement Promotion / Revocation Button */}
                          <button
                            onClick={() => handleToggleAgreement(ver.versionNumber, isAgreement)}
                            disabled={actionLoading === `agreement-${ver.versionNumber}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                              isAgreement
                                ? 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30'
                                : 'bg-green-950/80 hover:bg-green-900 text-green-300 border border-green-500/30'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" />
                            {isAgreement ? 'Revoke Agreement' : 'Set as Agreement'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* PDF Download Button */}
                          <button
                            onClick={() => handleDownloadVersionPDF(ver)}
                            disabled={actionLoading === `pdf-${ver.versionNumber}`}
                            className="px-3 py-1.5 bg-[#222] hover:bg-[#2a2a2a] text-white border border-[#333] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5 text-orange-400" />
                            Download PDF
                          </button>

                          {/* WhatsApp Share Button */}
                          <button
                            onClick={() => handleSendWhatsApp(ver.versionNumber)}
                            disabled={actionLoading === `whatsapp-${ver.versionNumber}`}
                            className="px-3 py-1.5 bg-[#064e3b] hover:bg-[#065f46] text-[#34d399] border border-emerald-500/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            WhatsApp PDF
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'new-revision' ? (
            /* ============================================================ */
            /* TAB 2: CREATE NEW REVISION (QUOTATION N+1)                   */
            /* ============================================================ */
            <form onSubmit={handleCreateNewRevision} className="space-y-6">
              <div className="bg-[#121214] p-4 rounded-xl border border-[#222] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                    New Quotation Revision — Quotation {nextVerNumber}
                  </h4>
                  <p className="text-xs text-[#888] mt-1">
                    Pre-filled with active quotation items. Submitting creates an immutable revision snapshot and updates active pointers.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#888] tracking-wider block">Estimated Net Total</span>
                  <span className="text-xl font-bold text-[var(--color-gold)]">₹{draftFinancials.netTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Revision Reason / Note */}
              <div className="bg-[#121214] p-4 rounded-xl border border-[#222]">
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Revision Reason / Admin Note <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Added drone pilot, upgraded album to 40 sheets, applied festive discount"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2.5 text-white text-xs outline-none focus:border-[var(--color-gold)]"
                />
              </div>

              {/* Sub-Events & Services Editor */}
              <div className="bg-[#121214] p-5 rounded-xl border border-[#222] space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Sub-Events & Services</h5>
                  <button
                    type="button"
                    onClick={addSubEvent}
                    className="px-3 py-1.5 bg-[#222] hover:bg-[#333] text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-green-400" />
                    Add Sub-Event
                  </button>
                </div>

                {subEvents.map((se, seIdx) => (
                  <div key={seIdx} className="bg-[#09090b] p-4 rounded-xl border border-[#222] space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        placeholder="Sub-event name (e.g. Haldi, Wedding, Reception)"
                        value={se.name}
                        onChange={(e) => updateSubEventName(seIdx, e.target.value)}
                        className="flex-1 bg-[#151515] border border-[#333] rounded px-3 py-1.5 text-white text-xs font-bold uppercase outline-none focus:border-[var(--color-gold)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubEvent(seIdx)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1"
                      >
                        Remove Event
                      </button>
                    </div>

                    {/* Services within Sub-Event */}
                    <div className="space-y-2 pl-2 border-l-2 border-[#222]">
                      {se.services.map((s, sIdx) => (
                        <div key={sIdx} className="flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder="Service name (e.g. Candid Photography)"
                            value={s.name}
                            onChange={(e) => updateService(seIdx, sIdx, 'name', e.target.value)}
                            className="flex-[3] min-w-[150px] bg-[#151515] border border-[#222] rounded px-3 py-1.5 text-white text-xs outline-none focus:border-[#444]"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#888]">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={s.quantity}
                              onChange={(e) => updateService(seIdx, sIdx, 'quantity', e.target.value)}
                              className="w-16 bg-[#151515] border border-[#222] rounded px-2 py-1.5 text-white text-xs text-center outline-none focus:border-[#444]"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#888]">Price:</span>
                            <input
                              type="number"
                              value={s.price}
                              onChange={(e) => updateService(seIdx, sIdx, 'price', e.target.value)}
                              className="w-24 bg-[#151515] border border-[#222] rounded px-2 py-1.5 text-white text-xs text-right outline-none focus:border-[#444]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeService(seIdx, sIdx)}
                            className="text-red-500 hover:text-red-400 p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addService(seIdx)}
                        className="text-[11px] text-[var(--color-gold)] hover:underline flex items-center gap-1 font-bold pt-1"
                      >
                        + Add Service
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo Album Configuration */}
              <div className="bg-[#121214] p-5 rounded-xl border border-[#222] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">Photo Album Configuration</h5>
                    <p className="text-[11px] text-[#888]">Add luxury photobooks or flush mount albums to this quote</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={album.enabled}
                      onChange={(e) => setAlbum({ ...album, enabled: e.target.checked })}
                      className="rounded accent-[var(--color-gold)] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Enable Album</span>
                  </label>
                </div>

                {album.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#222]">
                    <div>
                      <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">Number of Albums</span>
                      <input
                        type="number"
                        min="1"
                        value={album.numberOfAlbums}
                        onChange={(e) => setAlbum({ ...album, numberOfAlbums: Number(e.target.value) })}
                        className="w-full bg-[#09090b] border border-[#222] rounded px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">Sheets per Album</span>
                      <input
                        type="number"
                        min="1"
                        value={album.sheets}
                        onChange={(e) => setAlbum({ ...album, sheets: Number(e.target.value) })}
                        className="w-full bg-[#09090b] border border-[#222] rounded px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">Price per Sheet (₹)</span>
                      <input
                        type="number"
                        value={album.pricePerSheet}
                        onChange={(e) => setAlbum({ ...album, pricePerSheet: Number(e.target.value) })}
                        className="w-full bg-[#09090b] border border-[#222] rounded px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Add-Ons & Extras */}
              <div className="bg-[#121214] p-5 rounded-xl border border-[#222] space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Add-Ons & Extras</h5>
                  <button
                    type="button"
                    onClick={addAddOn}
                    className="text-xs text-[var(--color-gold)] hover:underline font-bold"
                  >
                    + Add Custom Add-On
                  </button>
                </div>

                {addOns.map((a, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Add-on item (e.g. Same Day Video Highlight Reel)"
                      value={a.name}
                      onChange={(e) => updateAddOn(aIdx, 'name', e.target.value)}
                      className="flex-1 bg-[#09090b] border border-[#222] rounded px-3 py-1.5 text-white text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={a.price}
                      onChange={(e) => updateAddOn(aIdx, 'price', e.target.value)}
                      className="w-28 bg-[#09090b] border border-[#222] rounded px-3 py-1.5 text-white text-xs text-right outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeAddOn(aIdx)}
                      className="text-red-500 hover:text-red-400 text-xs p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Discount Section */}
              <div className="bg-[#121214] p-5 rounded-xl border border-[#222] space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">Discount & Adjustments</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">Discount Type</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDiscountType('amount')}
                        className={`flex-1 py-2 text-xs font-bold rounded uppercase transition-colors ${
                          discountType === 'amount' ? 'bg-white text-black' : 'bg-[#222] text-[#aaa]'
                        }`}
                      >
                        Fixed Amount (₹)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percentage')}
                        className={`flex-1 py-2 text-xs font-bold rounded uppercase transition-colors ${
                          discountType === 'percentage' ? 'bg-white text-black' : 'bg-[#222] text-[#aaa]'
                        }`}
                      >
                        Percentage (%)
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#888] uppercase block mb-1">
                      {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                    </span>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full bg-[#09090b] border border-[#222] rounded px-3 py-2 text-white text-xs outline-none focus:border-[var(--color-gold)]"
                    />
                  </div>
                </div>
              </div>

              {/* Summary of New Revision */}
              <div className="bg-[#09090b] p-5 rounded-xl border border-[#d4af37]/30 space-y-2">
                <div className="flex justify-between text-xs text-[#888]">
                  <span>Services Subtotal:</span>
                  <span className="text-white font-mono">₹{draftFinancials.servicesSum.toLocaleString('en-IN')}</span>
                </div>
                {draftFinancials.albumCost > 0 && (
                  <div className="flex justify-between text-xs text-[#888]">
                    <span>Album Subtotal:</span>
                    <span className="text-white font-mono">₹{draftFinancials.albumCost.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {draftFinancials.addOnsSum > 0 && (
                  <div className="flex justify-between text-xs text-[#888]">
                    <span>Add-ons Subtotal:</span>
                    <span className="text-white font-mono">₹{draftFinancials.addOnsSum.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-[#888]">
                  <span>Gross Total:</span>
                  <span className="text-white font-mono">₹{draftFinancials.grossTotal.toLocaleString('en-IN')}</span>
                </div>
                {draftFinancials.discount > 0 && (
                  <div className="flex justify-between text-xs text-orange-400">
                    <span>Discount applied:</span>
                    <span className="font-mono">- ₹{draftFinancials.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#222]">
                  <span>New Net Total:</span>
                  <span className="text-[var(--color-gold)] font-mono text-base">₹{draftFinancials.netTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-[#aaa]">
                  <span>Pending Balance (after ₹{eventData?.paidAmount || 0} paid):</span>
                  <span className="text-red-400 font-mono">₹{draftFinancials.pending.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-5 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'creating-revision'}
                  className="px-6 py-2.5 bg-[var(--color-gold)] hover:bg-[#c29d2b] text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg"
                >
                  {actionLoading === 'creating-revision' ? 'Creating Snapshot...' : `Save & Create Quotation ${nextVerNumber}`}
                </button>
              </div>
            </form>
          ) : (
            /* ============================================================ */
            /* TAB 3: AUDIT HISTORY                                         */
            /* ============================================================ */
            <div className="space-y-3">
              <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider mb-2">
                Quotation Change Logs & Audit History
              </h4>

              {(!eventData?.followUps || eventData.followUps.length === 0) ? (
                <div className="py-12 text-center text-[#777] bg-[#121214] rounded-xl border border-[#222]">
                  No audit trail recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {eventData.followUps.slice().reverse().map((f, fIdx) => (
                    <div key={fIdx} className="bg-[#121214] p-3.5 rounded-lg border border-[#222] flex items-start gap-3">
                      <span className="text-xs text-[var(--color-gold)] mt-0.5">📝</span>
                      <div className="flex-1 text-xs">
                        <p className="text-white font-medium">{f.note}</p>
                        <span className="text-[10px] text-[#777] mt-0.5 block">
                          {f.date ? new Date(f.date).toLocaleString('en-IN') : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
