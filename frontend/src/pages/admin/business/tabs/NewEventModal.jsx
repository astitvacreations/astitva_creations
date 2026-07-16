import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

export default function NewEventModal({ isOpen, onClose, apiBase, onSuccess, initialData }) {
  const [formData, setFormData] = useState({
    eventName: '',
    status: 'PENDING',
    customerName: '',
    phone: '',
    eventDate: '',
    email: '',
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    discountPercentage: 0,
    discountAmount: 0,
    subEvents: [],
    deliverables: [],
    complimentaries: []
  });

  const [predefinedServices, setPredefinedServices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchServices = async () => {
        try {
          const res = await fetch(`${apiBase}/events/predefined-services`, { credentials: 'include' });
          const data = await res.json();
          if (res.ok && data.success) {
            setPredefinedServices(data.data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchServices();

      if (initialData) {
        setFormData({
          ...initialData,
          eventDate: initialData.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : '',
          subEvents: initialData.subEvents || [],
          deliverables: initialData.deliverables || [],
          complimentaries: initialData.complimentaries || []
        });
      } else {
        setFormData({
          eventName: '',
          status: 'PENDING',
          customerName: '',
          phone: '',
          eventDate: '',
          email: '',
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          discountPercentage: '',
          discountAmount: '',
          subEvents: [],
          deliverables: [],
          complimentaries: []
        });
      }
      setError('');
    }
  }, [isOpen, apiBase, initialData]);

  useEffect(() => {
    let hasServices = false;
    let grossTotal = 0;
    formData.subEvents.forEach(se => {
      if (se.services && se.services.length > 0) hasServices = true;
      se.services.forEach(s => {
        grossTotal += Number(s.price || 0);
      });
    });

    if (hasServices) {
      let finalDiscount = 0;
      if (formData.discountPercentage > 0) {
        finalDiscount = grossTotal * (Number(formData.discountPercentage) / 100);
      } else if (formData.discountAmount > 0) {
        finalDiscount = Number(formData.discountAmount);
      }
      const finalTotal = Math.max(0, grossTotal - finalDiscount);
      setFormData(prev => ({ ...prev, totalAmount: finalTotal }));
    }
  }, [formData.subEvents, formData.discountPercentage, formData.discountAmount]);

  useEffect(() => {
    const pending = Math.max(0, Number(formData.totalAmount || 0) - Number(formData.paidAmount || 0));
    setFormData(prev => ({ ...prev, pendingAmount: pending }));
  }, [formData.totalAmount, formData.paidAmount]);

  // Sub Events Handlers
  const handleAddSubEvent = () => {
    setFormData(prev => ({
      ...prev,
      subEvents: [...prev.subEvents, { name: '', services: [] }]
    }));
  };

  const handleRemoveSubEvent = (index) => {
    const newSubEvents = [...formData.subEvents];
    newSubEvents.splice(index, 1);
    setFormData(prev => ({ ...prev, subEvents: newSubEvents }));
  };

  const handleAddServiceToSubEvent = (subEventIndex) => {
    const newSubEvents = [...formData.subEvents];
    newSubEvents[subEventIndex].services.push({ service: '', name: '', price: 0 });
    setFormData(prev => ({ ...prev, subEvents: newSubEvents }));
  };

  const handleRemoveService = (subEventIndex, serviceIndex) => {
    const newSubEvents = [...formData.subEvents];
    newSubEvents[subEventIndex].services.splice(serviceIndex, 1);
    setFormData(prev => ({ ...prev, subEvents: newSubEvents }));
  };

  const handleServiceChange = (subEventIndex, serviceIndex, predefinedId) => {
    const pService = predefinedServices.find(s => s._id === predefinedId);
    if (!pService) return;

    const newSubEvents = [...formData.subEvents];
    newSubEvents[subEventIndex].services[serviceIndex] = {
      service: pService._id,
      name: pService.name,
      price: pService.defaultPrice
    };
    setFormData(prev => ({ ...prev, subEvents: newSubEvents }));
  };

  const handleServicePriceChange = (subEventIndex, serviceIndex, newPrice) => {
    const newSubEvents = [...formData.subEvents];
    newSubEvents[subEventIndex].services[serviceIndex].price = Number(newPrice);
    setFormData(prev => ({ ...prev, subEvents: newSubEvents }));
  };

  // Deliverables & Complimentaries
  const handleAddStringItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };
  const handleRemoveStringItem = (field, index) => {
    const arr = [...formData[field]];
    arr.splice(index, 1);
    setFormData(prev => ({ ...prev, [field]: arr }));
  };
  const handleStringItemChange = (field, index, value) => {
    const arr = [...formData[field]];
    arr[index] = value;
    setFormData(prev => ({ ...prev, [field]: arr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.eventName || !formData.eventDate || !formData.phone) {
      setError('Event Name, Date, and Phone are required.');
      return;
    }

    const payload = {
      ...formData,
      finalTotal: formData.totalAmount
    };

    try {
      const url = initialData ? `${apiBase}/events/${initialData._id}` : `${apiBase}/events`;
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Error saving event');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-[#222]">
          <h3 className="text-xl font-heading text-white tracking-widest uppercase">
            {initialData ? 'Edit Event' : 'New Event'}
          </h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="new-event-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Event Name</label>
                <input type="text" required value={formData.eventName} onChange={(e) => setFormData({ ...formData, eventName: e.target.value })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors">
                  <option value="PENDING">pending</option>
                  <option value="CONFIRMED">confirmed</option>
                  <option value="COMPLETED">completed</option>
                  <option value="CANCELLED">cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Client Name</label>
                <input type="text" required value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Phone</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Event Date</label>
                <div className="relative">
                  <input type="date" required value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Total Amount</label>
                <input type="number" min="0" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Paid Amount</label>
                <input type="number" min="0" value={formData.paidAmount} onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-[#22c55e] focus:outline-none focus:border-[var(--color-gold)] transition-colors font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Pending Amount</label>
                <input type="number" readOnly value={formData.pendingAmount} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-[var(--color-gold)] cursor-not-allowed opacity-70 font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Discount (%)</label>
                <input type="number" min="0" max="100" placeholder="e.g. 10" value={formData.discountPercentage} onChange={(e) => {
                  setFormData({ ...formData, discountPercentage: e.target.value, discountAmount: '' })
                }} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Discount (₹)</label>
                <input type="number" min="0" value={formData.discountAmount} onChange={(e) => {
                  setFormData({ ...formData, discountAmount: e.target.value, discountPercentage: '' })
                }} className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
            </div>

            <div className="border-t border-[#222] pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider">Sub Events & Services</h4>
                <button type="button" onClick={handleAddSubEvent} className="px-3 py-1.5 text-[#A1A1A1] border border-[#333] rounded-md text-xs hover:text-white hover:border-[#666] transition-colors">
                  + Add Sub Event
                </button>
              </div>

              {formData.subEvents.length === 0 ? (
                <p className="text-xs text-[#A1A1A1] italic">No sub events added. Click + Add Sub Event.</p>
              ) : (
                <div className="space-y-4">
                  {formData.subEvents.map((sub, sIndex) => (
                    <div key={sIndex} className="bg-[#111] border border-[#333] p-4 rounded-xl relative group">
                      <div className="flex gap-4 mb-4">
                        <input type="text" placeholder="Sub Event Name (e.g. haldhi)" value={sub.name} onChange={(e) => {
                          const newSubs = [...formData.subEvents];
                          newSubs[sIndex].name = e.target.value;
                          setFormData({ ...formData, subEvents: newSubs });
                        }} className="flex-1 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-gold)] text-sm" />
                        <button type="button" onClick={() => handleAddServiceToSubEvent(sIndex)} className="text-[#22c55e] border border-[#22c55e]/30 px-3 rounded-lg text-xs hover:bg-[#22c55e]/10 transition-colors">
                          + Service
                        </button>
                        <button type="button" onClick={() => handleRemoveSubEvent(sIndex)} className="text-red-500 hover:text-red-400 p-2">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="pl-4 space-y-2 border-l-2 border-[#222]">
                        {sub.services.map((serv, servIndex) => (
                          <div key={servIndex} className="flex gap-4 items-center">
                            <select value={serv.service || ''} onChange={(e) => handleServiceChange(sIndex, servIndex, e.target.value)} className="flex-1 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-gold)] text-sm">
                              <option value="" disabled>Select Service...</option>
                              {predefinedServices.map(ps => (
                                <option key={ps._id} value={ps._id}>{ps.name}</option>
                              ))}
                            </select>
                            <input type="number" min="0" value={serv.price} onChange={(e) => handleServicePriceChange(sIndex, servIndex, e.target.value)} className="w-24 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-gold)] text-sm" />
                            <button type="button" onClick={() => handleRemoveService(sIndex, servIndex)} className="text-red-500 hover:text-red-400 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#222] pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider">Deliverables</h4>
                <button type="button" onClick={() => handleAddStringItem('deliverables')} className="px-3 py-1.5 text-[#A1A1A1] border border-[#333] rounded-md text-xs hover:text-white hover:border-[#666] transition-colors">
                  + Add Deliverable
                </button>
              </div>
              <div className="space-y-2">
                {formData.deliverables.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <input type="text" value={item} onChange={(e) => handleStringItemChange('deliverables', i, e.target.value)} className="flex-1 bg-[#050505] border border-[#222] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--color-gold)]" />
                    <button type="button" onClick={() => handleRemoveStringItem('deliverables', i)} className="text-red-500 hover:text-red-400 p-2"><X className="w-5 h-5"/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#222] pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider">Complimentries</h4>
                <button type="button" onClick={() => handleAddStringItem('complimentaries')} className="px-3 py-1.5 text-[#A1A1A1] border border-[#333] rounded-md text-xs hover:text-white hover:border-[#666] transition-colors">
                  + Add Complimentry
                </button>
              </div>
              <div className="space-y-2">
                {formData.complimentaries.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <input type="text" value={item} onChange={(e) => handleStringItemChange('complimentaries', i, e.target.value)} className="flex-1 bg-[#050505] border border-[#222] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[var(--color-gold)]" />
                    <button type="button" onClick={() => handleRemoveStringItem('complimentaries', i)} className="text-red-500 hover:text-red-400 p-2"><X className="w-5 h-5"/></button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>

        <div className="p-6 border-t border-[#222] flex justify-end gap-4 bg-[#0a0a0a] rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-6 py-3 text-[#A1A1A1] font-bold uppercase tracking-widest hover:text-white transition-colors text-sm">
            Cancel
          </button>
          <button type="submit" form="new-event-form" className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors text-sm">
            Save Event
          </button>
        </div>
      </div>
    </div>
  );
}
