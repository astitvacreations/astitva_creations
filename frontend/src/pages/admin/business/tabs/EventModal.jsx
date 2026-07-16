import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function EventModal({ isOpen, onClose, onSave, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventName: '',
    customerName: '',
    phone: '',
    email: '',
    eventDate: new Date().toISOString().split('T')[0],
    location: '',
    finalTotal: 0,
    paidAmount: 0,
    status: 'PENDING',
    services: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        eventName: initialData.eventName || '',
        customerName: initialData.customerName || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        eventDate: initialData.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        location: initialData.location || '',
        finalTotal: initialData.finalTotal || 0,
        paidAmount: initialData.paidAmount || 0,
        status: initialData.status || 'PENDING',
        services: initialData.services || []
      });
    } else {
      setFormData({
        eventName: '',
        customerName: '',
        phone: '',
        email: '',
        eventDate: new Date().toISOString().split('T')[0],
        location: '',
        finalTotal: 0,
        paidAmount: 0,
        status: 'PENDING',
        services: []
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { serviceName: '', price: 0 }]
    });
  };

  const handleRemoveService = (index) => {
    const newServices = [...formData.services];
    newServices.splice(index, 1);
    setFormData({ ...formData, services: newServices });
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!initialData?._id;
      const url = isEdit ? `${API_URL}/events/${initialData._id}` : `${API_URL}/events`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        onSave();
        onClose();
      } else {
        alert(data.message || 'Failed to save event');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-2xl my-8">
        <div className="flex justify-between items-center p-6 border-b border-[#222] sticky top-0 bg-[#111] z-10">
          <h3 className="text-xl font-bold text-white">{initialData ? 'Edit Event' : 'Create New Event'}</h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Event Name</label>
              <input 
                type="text" required
                value={formData.eventName} onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
                placeholder="e.g. Smith Wedding"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Event Date</label>
              <input 
                type="date" required
                value={formData.eventDate} onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Customer Name</label>
              <input 
                type="text" required
                value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Phone</label>
              <input 
                type="text" required
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Location</label>
            <input 
              type="text" 
              value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>

          <div className="border border-[#222] rounded-lg p-4 bg-[#0a0a0a]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white font-semibold uppercase tracking-wider text-sm">Services</h4>
              <button type="button" onClick={handleAddService} className="text-xs flex items-center gap-1 text-[var(--color-gold)] hover:text-white transition-colors">
                <Plus className="w-3 h-3" /> Add Service
              </button>
            </div>
            <div className="space-y-3">
              {formData.services.map((svc, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input 
                    type="text" placeholder="Service Name" required
                    value={svc.serviceName} onChange={(e) => handleServiceChange(idx, 'serviceName', e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#111] border border-[#333] rounded text-white text-sm"
                  />
                  <input 
                    type="number" placeholder="Price" required min="0"
                    value={svc.price} onChange={(e) => handleServiceChange(idx, 'price', Number(e.target.value))}
                    className="w-24 px-3 py-2 bg-[#111] border border-[#333] rounded text-white text-sm"
                  />
                  <button type="button" onClick={() => handleRemoveService(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.services.length === 0 && (
                <p className="text-xs text-[#A1A1A1]">No services added yet.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Final Total (₹)</label>
              <input 
                type="number" required min="0"
                value={formData.finalTotal} onChange={(e) => setFormData({...formData, finalTotal: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Paid Amount (₹)</label>
              <input 
                type="number" required min="0"
                value={formData.paidAmount} onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Status</label>
              <select 
                value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              >
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> {initialData ? 'Update Event' : 'Create Event'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
