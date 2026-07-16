import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

export default function ManagePredefinedServicesModal({ isOpen, onClose, apiBase }) {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newService, setNewService] = useState({ name: '', defaultPrice: 0 });

  const fetchServices = async () => {
    try {
      const res = await fetch(`${apiBase}/events/predefined-services`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const handleSaveService = async (e) => {
    e.preventDefault();
    setError('');
    if (!newService.name.trim()) return;

    try {
      const res = await fetch(`${apiBase}/events/predefined-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newService)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewService({ name: '', defaultPrice: 0 });
        fetchServices();
      } else {
        setError(data.message || 'Error saving service');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    }
  };

  const handleUpdateService = async (id, field, value) => {
    try {
      const service = services.find(s => s._id === id);
      const updated = { ...service, [field]: value };
      setServices(services.map(s => s._id === id ? updated : s));
      
      await fetch(`${apiBase}/events/predefined-services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this predefined service?')) return;
    try {
      const res = await fetch(`${apiBase}/events/predefined-services/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        fetchServices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-[#222]">
          <h3 className="text-xl font-heading text-white tracking-widest uppercase">
            Manage Predefined Services
          </h3>
          <button onClick={onClose} className="text-[#A1A1A1] hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {isLoading ? (
            <div className="text-center text-[#A1A1A1] py-4">Loading...</div>
          ) : (
            <div className="space-y-4">
              {services.map(service => (
                <div key={service._id} className="flex gap-3 items-center">
                  <input 
                    type="text"
                    value={service.name}
                    onChange={(e) => handleUpdateService(service._id, 'name', e.target.value)}
                    className="flex-1 bg-[#050505] border border-[#333] hover:border-[#444] focus:border-[var(--color-gold)] transition-colors rounded-lg px-4 py-3 text-white text-sm focus:outline-none"
                    placeholder="Service Name"
                  />
                  <input 
                    type="number"
                    value={service.defaultPrice}
                    onChange={(e) => handleUpdateService(service._id, 'defaultPrice', e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 bg-[#050505] border border-[#333] hover:border-[#444] focus:border-[var(--color-gold)] transition-colors rounded-lg px-4 py-3 text-[#A1A1A1] text-sm focus:outline-none"
                    placeholder="Price"
                  />
                  <button 
                    onClick={() => handleDeleteService(service._id)}
                    className="text-red-500 hover:text-red-400 p-2 transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-[#222]">
            <form onSubmit={handleSaveService} className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="New Service Name"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  placeholder="Price"
                  required
                  min="0"
                  value={newService.defaultPrice}
                  onChange={(e) => setNewService({ ...newService, defaultPrice: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full bg-[#050505] border border-[#222] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-3 bg-[#111] border border-[#333] text-white font-bold uppercase tracking-widest rounded-lg hover:bg-[#222] transition-colors whitespace-nowrap"
              >
                + Add
              </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex justify-center pt-6 mt-6">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#22c55e] text-white font-bold uppercase tracking-widest rounded-lg hover:bg-[#16a34a] transition-colors"
            >
              Save Services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
