import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Save } from 'lucide-react';
import ImageUpload from '../../../../components/admin/ImageUpload';

export default function ManageInventoryModal({ isOpen, onClose, apiBase }) {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newItem, setNewItem] = useState({ name: '', defaultPrice: 0, image: '' });

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${apiBase}/prop-rentals/inventory`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setInventory(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${apiBase}/prop-rentals/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewItem({ name: '', defaultPrice: 0, image: '' });
        fetchInventory();
      } else {
        setError(data.message || 'Error saving item');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`${apiBase}/prop-rentals/inventory/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-[#222]">
          <h3 className="text-xl font-heading text-white tracking-widest uppercase">
            Manage Rental Inventory
          </h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">
          {/* Add New Item Form */}
          <div>
            <h4 className="text-sm font-bold text-[#22c55e] uppercase tracking-wider mb-4">Add New Item</h4>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Item Name</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Default Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newItem.defaultPrice}
                    onChange={(e) => setNewItem({ ...newItem, defaultPrice: Number(e.target.value) })}
                    className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#A1A1A1] uppercase tracking-wider mb-2">Image (Optional)</label>
                {newItem.image ? (
                  <div className="relative w-full h-32 bg-[#222] rounded-xl overflow-hidden group">
                    <img src={newItem.image} alt="Preview" className="w-full h-full object-contain" />
                    <button 
                      type="button"
                      onClick={() => setNewItem({ ...newItem, image: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <ImageUpload 
                    multiple={false} 
                    onUpload={(data) => setNewItem({ ...newItem, image: data.url })}
                    label="Upload Rental Image"
                  />
                )}
              </div>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#114023] text-[#22c55e] border border-[#22c55e]/20 font-bold uppercase tracking-widest rounded-lg hover:bg-[#22c55e] hover:text-black transition-colors"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-[#222]"></div>

          {/* Current Inventory List */}
          <div>
            <h4 className="text-sm font-bold text-[#A1A1A1] uppercase tracking-wider mb-4">Current Inventory</h4>
            
            {isLoading ? (
              <div className="text-center text-[#A1A1A1] py-4">Loading...</div>
            ) : inventory.length === 0 ? (
              <div className="text-center text-[#A1A1A1] py-8 bg-[#050505] rounded-xl border border-[#222]">
                No items in inventory
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-[#A1A1A1] uppercase tracking-wider px-4 mb-2">
                  <span>Item Name</span>
                  <span>Default Price</span>
                </div>
                {inventory.map(item => (
                  <div key={item._id} className="flex justify-between items-center bg-[#050505] border border-[#222] p-4 rounded-xl group hover:border-[#333]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#222] rounded overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-[#A1A1A1]">IMG</span>
                        )}
                      </div>
                      <span className="font-bold text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[#22c55e] font-bold">₹{item.defaultPrice.toLocaleString('en-IN')}</span>
                      <button 
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-[#A1A1A1] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
