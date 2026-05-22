import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Save, Edit, X, RefreshCw, Trash2, Plus, Check } from 'lucide-react';
import { usePricingStore } from '../../store/pricingStore';
import { useToastStore } from '../../store/toastStore';

export default function PricingEditor() {
  const { prices, fetchPrices, updatePrice, deletePrice, loading } = usePricingStore();
  const { addToast } = useToastStore();
  
  const [activeTab, setActiveTab] = useState('Event Coverage');
  const [editingPrice, setEditingPrice] = useState(null);
  const [addingPrice, setAddingPrice] = useState(null); // For new items form modal

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleEdit = (item) => {
    setEditingPrice({ ...item });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updatePrice(editingPrice._id, {
        _id: editingPrice._id,
        serviceName: editingPrice.serviceName,
        category: editingPrice.category,
        basePrice: Number(editingPrice.basePrice),
        fullDayPrice: editingPrice.fullDayPrice ? Number(editingPrice.fullDayPrice) : undefined,
        isActive: editingPrice.isActive
      });
      addToast('Service price updated successfully!', 'success');
      setEditingPrice(null);
      fetchPrices();
    } catch (error) {
      addToast(error.message || 'Failed to update price', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await updatePrice(undefined, {
        serviceName: addingPrice.serviceName,
        category: activeTab,
        basePrice: Number(addingPrice.basePrice),
        fullDayPrice: addingPrice.fullDayPrice ? Number(addingPrice.fullDayPrice) : undefined,
        isActive: true
      });
      addToast('New catalog item added successfully!', 'success');
      setAddingPrice(null);
      fetchPrices();
    } catch (error) {
      addToast(error.message || 'Failed to add item', 'error');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.serviceName}"? This will remove it from the quote wizard.`)) return;
    try {
      await deletePrice(item._id);
      addToast('Item removed from database.', 'success');
      fetchPrices();
    } catch (error) {
      addToast('Failed to delete item', 'error');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const nextActive = item.isActive !== false ? false : true;
      await updatePrice(item._id, {
        _id: item._id,
        serviceName: item.serviceName,
        category: item.category,
        basePrice: item.basePrice,
        fullDayPrice: item.fullDayPrice,
        isActive: nextActive
      });
      addToast(`"${item.serviceName}" is now ${nextActive ? 'Active' : 'Inactive'}`, 'success');
      fetchPrices();
    } catch (error) {
      addToast('Failed to toggle active status', 'error');
    }
  };

  const categories = [
    'Event Coverage',
    'Pre-Wedding Style',
    'Post Production Editing',
    'Photo Album',
    'Add-On Services',
    'Offers & Combos'
  ];

  const filteredPrices = prices.filter(p => p.category === activeTab);

  return (
    <>
      <Helmet>
        <title>Pricing & Packages | Admin</title>
      </Helmet>

      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-heading text-3xl text-white mb-1">Pricing & Packages</h2>
            <p className="text-[#A1A1A1] text-sm">Manage client quote pricing, package catalogs, and promotion discounts dynamically.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setAddingPrice({ serviceName: '', basePrice: '', fullDayPrice: '' })}
              className="px-4 py-2 bg-[var(--color-gold)] text-black hover:bg-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm flex-1 sm:flex-none justify-center"
            >
              <Plus className="w-4 h-4 stroke-[3px]" /> Add Item
            </button>
            <button 
              onClick={fetchPrices}
              className="p-2.5 border border-[#222] hover:border-[#444] text-white transition-all rounded-sm flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold"
              title="Refresh Prices"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#222] gap-6 overflow-x-auto pb-px">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === cat ? 'text-[var(--color-gold)] border-[var(--color-gold)] font-extrabold' : 'text-[#777] border-transparent hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#A1A1A1] uppercase tracking-widest animate-pulse text-xs">Loading package data...</div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111] border border-[#222]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0a0a0a] border-b border-[#222] text-[#A1A1A1] text-xs uppercase tracking-widest font-bold">
                    <th className="p-4">Service / Package / Promotion</th>
                    <th className="p-4 text-right">{activeTab === 'Offers & Combos' ? 'Discount Value' : 'Half Day / Base Price'}</th>
                    {activeTab === 'Event Coverage' && <th className="p-4 text-right">Full Day Price</th>}
                    {activeTab === 'Offers & Combos' && <th className="p-4 text-right">Min Order value</th>}
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.map((item) => (
                    <tr key={item._id} className={`border-b border-[#222] hover:bg-[#1a1a1a]/50 transition-colors ${item.isActive === false ? 'opacity-40' : ''}`}>
                      <td className="p-4">
                        <span className="font-semibold text-white block">{item.serviceName}</span>
                        {activeTab === 'Offers & Combos' && (
                          <span className="text-[9px] uppercase tracking-widest text-[#777] mt-0.5 block">
                            {item.basePrice <= 100 ? `${item.basePrice}% Percentage Promotion` : `Flat ₹${item.basePrice.toLocaleString()} Fixed Promotion`}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono text-[var(--color-gold)]">
                        {activeTab === 'Offers & Combos' && item.basePrice <= 100 
                          ? `${item.basePrice}%` 
                          : `₹${item.basePrice?.toLocaleString()}/-`
                        }
                      </td>
                      {activeTab === 'Event Coverage' && (
                        <td className="p-4 text-right font-mono text-[var(--color-gold)]">
                          {item.fullDayPrice ? `₹${item.fullDayPrice.toLocaleString()}/-` : 'N/A'}
                        </td>
                      )}
                      {activeTab === 'Offers & Combos' && (
                        <td className="p-4 text-right font-mono text-[var(--color-gold)]">
                          {item.fullDayPrice ? `₹${item.fullDayPrice.toLocaleString()}/-` : '₹0/-'}
                        </td>
                      )}
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleToggleActive(item)}
                          className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all rounded-full ${
                            item.isActive !== false 
                              ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)]/30 hover:bg-[var(--color-gold)] hover:text-black' 
                              : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          {item.isActive !== false ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] hover:bg-[#333] rounded transition-colors"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item)}
                            className="p-2 text-[#A1A1A1] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPrices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#777] uppercase tracking-widest text-xs">No catalog items found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add New Item Modal Form */}
      <AnimatePresence>
        {addingPrice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#222] w-full max-w-md shadow-3xl rounded-sm"
            >
              <div className="flex justify-between items-center p-6 border-b border-[#222]">
                <div>
                  <h3 className="font-heading text-xl text-white">Add Catalog Item</h3>
                  <span className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest block mt-0.5">Category: {activeTab}</span>
                </div>
                <button onClick={() => setAddingPrice(null)} className="text-[#777] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">Item Name / Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder={activeTab === 'Offers & Combos' ? "E.g., PROMOCODE or Combo Offer Name" : "E.g., Candid Photography"}
                    value={addingPrice.serviceName}
                    onChange={(e) => setAddingPrice({...addingPrice, serviceName: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className={(activeTab === 'Event Coverage' || activeTab === 'Offers & Combos') ? 'col-span-1' : 'col-span-2'}>
                    <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">
                      {activeTab === 'Offers & Combos' ? 'Discount Value' : (activeTab === 'Event Coverage' ? 'Half Day Rate (₹)' : 'Base Price (₹)')}
                    </label>
                    <input 
                      type="number" 
                      required
                      placeholder={activeTab === 'Offers & Combos' ? "E.g., 15 for 15% or 10000" : "15000"}
                      value={addingPrice.basePrice} 
                      onChange={(e) => setAddingPrice({...addingPrice, basePrice: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors font-mono rounded-sm"
                    />
                  </div>
                  {activeTab === 'Event Coverage' && (
                    <div className="col-span-1">
                      <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">Full Day Rate (₹)</label>
                      <input 
                        type="number" 
                        placeholder="25000"
                        value={addingPrice.fullDayPrice} 
                        onChange={(e) => setAddingPrice({...addingPrice, fullDayPrice: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors font-mono rounded-sm"
                      />
                    </div>
                  )}
                  {activeTab === 'Offers & Combos' && (
                    <div className="col-span-1">
                      <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">Min Order Value (₹)</label>
                      <input 
                        type="number" 
                        placeholder="50000"
                        value={addingPrice.fullDayPrice} 
                        onChange={(e) => setAddingPrice({...addingPrice, fullDayPrice: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors font-mono rounded-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#222]">
                  <button type="button" onClick={() => setAddingPrice(null)} className="px-6 py-3 border border-[#333] text-white uppercase tracking-widest font-bold text-[10px] hover:bg-[#222] transition-colors rounded-sm">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-[10px] hover:bg-white transition-colors rounded-sm">
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal Form */}
      <AnimatePresence>
        {editingPrice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#222] w-full max-w-md shadow-3xl rounded-sm"
            >
              <div className="flex justify-between items-center p-6 border-b border-[#222]">
                <div>
                  <h3 className="font-heading text-xl text-white">Edit Catalog Item</h3>
                  <span className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest block mt-0.5">Category: {editingPrice.category}</span>
                </div>
                <button onClick={() => setEditingPrice(null)} className="text-[#777] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">Item Name / Code</label>
                  <input 
                    type="text" 
                    required
                    value={editingPrice.serviceName}
                    onChange={(e) => setEditingPrice({...editingPrice, serviceName: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className={(editingPrice.category === 'Event Coverage' || editingPrice.category === 'Offers & Combos') ? 'col-span-1' : 'col-span-2'}>
                    <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">
                      {editingPrice.category === 'Offers & Combos' ? 'Discount Value' : (editingPrice.category === 'Event Coverage' ? 'Half Day Rate (₹)' : 'Base Price (₹)')}
                    </label>
                    <input 
                      type="number" 
                      required
                      value={editingPrice.basePrice} 
                      onChange={(e) => setEditingPrice({...editingPrice, basePrice: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors font-mono rounded-sm"
                    />
                  </div>
                  {editingPrice.category === 'Event Coverage' && (
                    <div className="col-span-1">
                      <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">Full Day Rate (₹)</label>
                      <input 
                        type="number" 
                        value={editingPrice.fullDayPrice || ''} 
                        onChange={(e) => setEditingPrice({...editingPrice, fullDayPrice: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors font-mono rounded-sm"
                      />
                    </div>
                  )}
                  {editingPrice.category === 'Offers & Combos' && (
                    <div className="col-span-1">
                      <label className="block text-[10px] uppercase tracking-widest text-[#A1A1A1] mb-2">Min Order Value (₹)</label>
                      <input 
                        type="number" 
                        value={editingPrice.fullDayPrice || ''} 
                        onChange={(e) => setEditingPrice({...editingPrice, fullDayPrice: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-[#333] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors font-mono rounded-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] p-4">
                  <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold">Catalog Status:</span>
                  <button 
                    type="button"
                    onClick={() => setEditingPrice({...editingPrice, isActive: editingPrice.isActive !== false ? false : true})}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all rounded-full ${
                      editingPrice.isActive !== false 
                        ? 'bg-[var(--color-gold)]/10 text-[var(--color-gold)] border-[var(--color-gold)]/30' 
                        : 'bg-red-500/10 text-red-500 border-red-500/30'
                    }`}
                  >
                    {editingPrice.isActive !== false ? 'Active / Visible' : 'Inactive / Hidden'}
                  </button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#222]">
                  <button type="button" onClick={() => setEditingPrice(null)} className="px-6 py-3 border border-[#333] text-white uppercase tracking-widest font-bold text-[10px] hover:bg-[#222] transition-colors rounded-sm">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-3 bg-[var(--color-gold)] text-black uppercase tracking-widest font-bold text-[10px] hover:bg-white transition-colors rounded-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
