import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ExpenseModal({ isOpen, onClose, category, referenceId, onSave, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    expenseName: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        expenseName: initialData.expenseName || '',
        amount: initialData.amount || '',
        description: initialData.description || '',
        expenseDate: initialData.expenseDate ? new Date(initialData.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        expenseName: '',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEdit = !!initialData?._id;
      const url = isEdit ? `${API_URL}/expenses/${initialData._id}` : `${API_URL}/expenses`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          category: initialData ? initialData.category : category,
          referenceId: initialData ? initialData.referenceId : referenceId,
          onModel: initialData ? initialData.onModel : (
                   category === 'STUDIO_SHOOT' ? 'Booking' : 
                   category === 'PROP_RENTAL' ? 'PropRental' : 
                   category === 'EVENT' ? 'Event' : null
          )
        })
      });
      const data = await res.json();
      if (data.success) {
        onSave();
        onClose();
      } else {
        alert(data.message || 'Failed to add expense');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-[#222]">
          <h3 className="text-xl font-bold text-white">{initialData ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Expense Name</label>
            <input 
              type="text" 
              required
              value={formData.expenseName}
              onChange={(e) => setFormData({...formData, expenseName: e.target.value})}
              className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="e.g. Travel, Equipment, Catering"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Amount (₹)</label>
            <input 
              type="number" 
              required
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Date</label>
            <input 
              type="date" 
              required
              value={formData.expenseDate}
              onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
              className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[#A1A1A1] mb-2 uppercase tracking-wider">Description (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-[#050505] border border-[#222] rounded-lg text-white focus:outline-none focus:border-[var(--color-gold)] resize-none h-24"
              placeholder="Add details..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : <><Save className="w-4 h-4" /> {initialData ? 'Update Expense' : 'Save Expense'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
