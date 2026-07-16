import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function NewPropRentalModal({ isOpen, onClose, apiBase, onSuccess, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    customerName: '',
    phone: '',
    email: '',
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    itemsRented: []
  });
  
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Fetch inventory to populate dropdowns
      const fetchInventory = async () => {
        try {
          const res = await fetch(`${apiBase}/prop-rentals/inventory`, { credentials: 'include' });
          const data = await res.json();
          if (res.ok && data.success) {
            setInventory(data.data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchInventory();
      
      // Reset form
      if (initialData) {
        setFormData({
          ...initialData,
          itemsRented: initialData.itemsRented || []
        });
      } else {
        setFormData({
          customerName: '',
          phone: '',
          email: '',
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          itemsRented: []
        });
      }
      setError('');
    }
  }, [isOpen, apiBase, initialData]);

  // Recalculate totalAmount only if items are selected
  useEffect(() => {
    let hasItems = formData.itemsRented.length > 0;
    if (hasItems) {
      const total = formData.itemsRented.reduce((sum, item) => sum + Number(item.price || 0), 0);
      setFormData(prev => ({ ...prev, totalAmount: total }));
    }
  }, [formData.itemsRented]);

  // Recalculate pendingAmount whenever total or paid amount changes
  useEffect(() => {
    const pending = Math.max(0, Number(formData.totalAmount || 0) - Number(formData.paidAmount || 0));
    setFormData(prev => ({ ...prev, pendingAmount: pending }));
  }, [formData.totalAmount, formData.paidAmount]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      itemsRented: [...prev.itemsRented, { item: '', name: '', price: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.itemsRented];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, itemsRented: newItems }));
  };

  const handleItemChange = (index, invItemId) => {
    const invItem = inventory.find(i => i._id === invItemId);
    if (!invItem) return;

    const newItems = [...formData.itemsRented];
    newItems[index] = { item: invItem._id, name: invItem.name, price: invItem.defaultPrice };
    setFormData(prev => ({ ...prev, itemsRented: newItems }));
  };

  const handleItemPriceChange = (index, newPrice) => {
    const newItems = [...formData.itemsRented];
    newItems[index].price = Number(newPrice);
    setFormData(prev => ({ ...prev, itemsRented: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure we have required data
    if (!formData.customerName || !formData.phone) {
      setError('Customer name and phone are required.');
      return;
    }
    
    // Add default dates since old schema requires them
    const payload = {
      ...formData,
      finalTotal: formData.totalAmount, // Old schema compatibility
      rentalDate: new Date(),
      returnDate: new Date(Date.now() + 86400000) // Default +1 day
    };

    try {
      const url = initialData ? `${apiBase}/prop-rentals/${initialData._id}` : `${apiBase}/prop-rentals`;
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || 'Error saving rental');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-[#222]">
          <h3 className="text-xl font-heading text-white tracking-widest uppercase">
            {initialData ? 'Edit Prop Rental' : 'New Prop Rental'}
          </h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="new-rental-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Total Amount</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Paid Amount</label>
                <input
                  type="number"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-[#22c55e] focus:outline-none focus:border-[var(--color-gold)] transition-colors font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Pending Amount</label>
                <input
                  type="number"
                  readOnly
                  value={formData.pendingAmount}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-[var(--color-gold)] cursor-not-allowed opacity-70 font-bold"
                />
              </div>
            </div>

            <div className="border-t border-[#222] pt-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider">Rented Items</h4>
                <button type="button" onClick={handleAddItem} className="text-[#22c55e] text-xs font-bold uppercase tracking-wider hover:text-white transition-colors">
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {formData.itemsRented.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#222] rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const invItem = inventory.find(i => i._id === item.item);
                        return invItem?.image ? (
                          <img src={invItem.image} alt={invItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] text-[#A1A1A1]">IMG</span>
                        );
                      })()}
                    </div>
                    <select
                      value={item.item || ''}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      className="flex-1 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors text-sm"
                    >
                      <option value="" disabled>Select Item...</option>
                      {inventory.map(inv => (
                        <option key={inv._id} value={inv._id}>{inv.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemPriceChange(index, e.target.value)}
                      className="w-24 bg-[#050505] border border-[#222] rounded-lg px-3 py-2 text-[#22c55e] focus:outline-none focus:border-[var(--color-gold)] transition-colors text-sm font-bold"
                    />
                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:text-red-400 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {formData.itemsRented.length === 0 && (
                  <div className="text-center text-[#A1A1A1] text-xs py-4 border border-dashed border-[#333] rounded-lg">
                    No items added yet. Click + Add Item.
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </form>
        </div>

        <div className="p-6 border-t border-[#222] flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-[#A1A1A1] font-bold uppercase tracking-widest hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-rental-form"
            className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Save Prop Rental
          </button>
        </div>
      </div>
    </div>
  );
}
