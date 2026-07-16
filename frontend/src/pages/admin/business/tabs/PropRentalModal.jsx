import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PropRentalModal({ isOpen, onClose, onSave, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    rentalDate: new Date().toISOString().split('T')[0],
    returnDate: '',
    itemsRented: [],
    finalTotal: 0,
    paidAmount: 0,
    status: 'ACTIVE'
  });
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        customerName: initialData.customerName || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        rentalDate: initialData.rentalDate ? new Date(initialData.rentalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        returnDate: initialData.returnDate ? new Date(initialData.returnDate).toISOString().split('T')[0] : '',
        itemsRented: initialData.itemsRented || [],
        finalTotal: initialData.finalTotal || 0,
        paidAmount: initialData.paidAmount || 0,
        status: initialData.status || 'ACTIVE'
      });
    } else {
      setFormData({
        customerName: '',
        phone: '',
        email: '',
        rentalDate: new Date().toISOString().split('T')[0],
        returnDate: '',
        itemsRented: [],
        finalTotal: 0,
        paidAmount: 0,
        status: 'ACTIVE'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (newItem.trim()) {
      setFormData({
        ...formData,
        itemsRented: [...formData.itemsRented, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.itemsRented];
    newItems.splice(index, 1);
    setFormData({ ...formData, itemsRented: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!initialData?._id;
      const url = isEdit ? `${API_URL}/prop-rentals/${initialData._id}` : `${API_URL}/prop-rentals`;
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
        alert(data.message || 'Failed to save rental');
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
          <h3 className="text-xl font-bold text-white">{initialData ? 'Edit Prop Rental' : 'Create New Prop Rental'}</h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Customer Name</label>
              <input 
                type="text" required
                value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
                placeholder="e.g. John Doe"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Rental Date</label>
              <input 
                type="date" required
                value={formData.rentalDate} onChange={(e) => setFormData({...formData, rentalDate: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Return Date</label>
              <input 
                type="date" required
                value={formData.returnDate} onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>

          <div className="border border-[#222] rounded-lg p-4 bg-[#0a0a0a]">
            <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Items Rented</label>
            <div className="flex gap-2 mb-3">
              <input 
                type="text"
                value={newItem} onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
                className="flex-1 px-4 py-2 bg-[#111] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[var(--color-gold)]"
                placeholder="Type item name and click add"
              />
              <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-[#222] text-white rounded-lg hover:bg-[#333] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.itemsRented.map((item, idx) => (
                <span key={idx} className="flex items-center gap-2 px-3 py-1 bg-[#222] border border-[#333] text-sm text-white rounded-md">
                  {item}
                  <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {formData.itemsRented.length === 0 && (
                <p className="text-xs text-[#A1A1A1] w-full mt-2">No items added yet.</p>
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
                <option value="ACTIVE">ACTIVE</option>
                <option value="RETURNED">RETURNED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> {initialData ? 'Update Prop Rental' : 'Create Prop Rental'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
