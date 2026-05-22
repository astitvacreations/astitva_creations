import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Search, Eye, Filter, Trash2, Download, X, Calendar, MapPin, Phone, Mail, User, Clock, ShieldAlert, Award, Percent, Edit2, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';
import { useToastStore } from '../../store/toastStore';
import { usePricingStore } from '../../store/pricingStore';
import { useSettingStore } from '../../store/settingStore';

export default function QuotesManager() {
  const { prices, fetchPrices } = usePricingStore();
  const { settings, fetchSettings, updateSettings } = useSettingStore();
  const { 
    bookings, 
    isLoading, 
    fetchBookings, 
    updateBookingStatus, 
    deleteBooking, 
    applyDiscount, 
    updateBooking, 
    addBooking 
  } = useBookingStore();
  const { addToast } = useToastStore();

  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null); // For details modal view
  const [discountQuote, setDiscountQuote] = useState(null); // Quote being discounted
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percentage'
  const [discountValue, setDiscountValue] = useState(''); // Discount input value
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  // Editor Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [editorStep, setEditorStep] = useState(1);
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingSubEvent, setIsAddingSubEvent] = useState(false);
  const [newSubEventName, setNewSubEventName] = useState('');
  const [isAddingStandardService, setIsAddingStandardService] = useState(false);
  const [newStandardServiceName, setNewStandardServiceName] = useState('');
  const [editorData, setEditorData] = useState({
    customerName: '',
    email: '',
    phone: '',
    eventDate: '',
    location: '',
    deliveryTimeline: '8-12 Weeks',
    notes: '',
    status: 'PENDING',
    category: 'WEDDING',
    selectedEvents: [],
    eventConfigs: {},
    preWedding: { style: '', cost: 0 },
    postProduction: { editing: '', cost: 0 },
    album: { albumType: '', sheets: 0, cost: 0 },
    addOns: {
      instantReels: { selected: false, qty: 5, cost: 5000 },
      cinematicReels: { selected: false, qty: 5, cost: 10000 },
      ledScreen: { selected: false, qty: 1, cost: 20000 },
      ytLiveFull: { selected: false, qty: 1, cost: 15000 },
      ytLiveHalf: { selected: false, qty: 1, cost: 8000 }
    },
    discountType: 'amount',
    discountValue: 0,
    discount: 0,
    estimatedPrice: 0
  });

  const SERVICE_CATEGORIES = settings?.serviceCategories || {
    'WEDDING': [
      'WEDDING', 'ENGAGEMENT', 'HALDI', 'MEHENDI', 'SANGEET', 
      'PELLIKODUKU', 'PELLIKUTURU', 'GODUMRAI', 'RECEPTION', 
      'VRATHAM', 'COCKTAIL PARTY'
    ],
    'HALF SAREE': [
      'HALF SAREE CEREMONY', 'HALDI', 'MEHENDI', 'RECEPTION'
    ],
    'BABY SHOOT': [
      'PRE BABY SHOOT', 'POST BABY SHOOT', 'BABY SHOWER', 'FIRST BIRTHDAY'
    ]
  };

  const STANDARD_SERVICES = settings?.standardServices || [
    'Traditional Photography',
    'Candid Photography',
    'Traditional Videography',
    'Cinematic Video',
    'Drone',
    'FPV Drone',
    '360° VR Coverage'
  ];

  useEffect(() => {
    fetchBookings();
    fetchPrices();
    fetchSettings();
  }, []);

  const getStandardPrice = (serviceName, duration) => {
    const item = prices.find(p => p.serviceName === serviceName && p.category === 'Event Coverage');
    if (!item) {
      const fallbacks = {
        'Cinematic Video': { base: 14000, full: 26000 },
        'Traditional Videography': { base: 13000, full: 22000 },
        'Candid Photography': { base: 12500, full: 24000 },
        'Traditional Photography': { base: 8000, full: 16000 },
        'Drone': { base: 8000, full: 12000 },
        'FPV Drone': { base: 8000, full: 12000 },
        '360° VR Coverage': { base: 6000, full: 15000 }
      };
      const rate = fallbacks[serviceName];
      if (!rate) return 0;
      return duration === 'Full Day' ? rate.full : rate.base;
    }
    return duration === 'Full Day' ? (item.fullDayPrice || item.basePrice) : item.basePrice;
  };

  const calculateEditorTotal = (data) => {
    let total = 0;

    // 1. Selected Events & Services
    data.selectedEvents.forEach(evt => {
      const config = data.eventConfigs[evt] || {};
      const services = config.services || {};
      Object.keys(services).forEach(s => {
        const svc = services[s] || {};
        if (svc.qty > 0) {
          total += (svc.qty * (svc.price || 0));
        }
      });
    });

    // 2. Pre wedding Style
    if (data.preWedding && data.preWedding.style) {
      total += (data.preWedding.cost || 0);
    }

    // 3. Post Production Style
    if (data.postProduction && data.postProduction.editing) {
      total += (data.postProduction.cost || 0);
    }

    // 4. Album Style
    if (data.album && data.album.albumType) {
      total += (data.album.cost || 0);
    }

    // 5. Add-ons
    Object.keys(data.addOns || {}).forEach(k => {
      const addon = data.addOns[k] || {};
      if (addon.selected) {
        total += (addon.cost || 0);
      }
    });

    return total;
  };

  const initializeEventConfig = (eventName, duration = 'Half Day', existingConfig = null) => {
    const services = {};
    STANDARD_SERVICES.forEach(s => {
      let qty = 0;
      let price = getStandardPrice(s, duration);
      
      if (existingConfig && existingConfig.services && existingConfig.services[s]) {
        const existingSvc = existingConfig.services[s];
        if (typeof existingSvc === 'object') {
          qty = existingSvc.qty || 0;
          price = existingSvc.price !== undefined ? existingSvc.price : getStandardPrice(s, duration);
        } else if (typeof existingSvc === 'number') {
          qty = existingSvc;
        }
      }
      services[s] = { qty, price };
    });

    if (existingConfig && existingConfig.services) {
      Object.keys(existingConfig.services).forEach(s => {
        if (!services[s]) {
          const existingSvc = existingConfig.services[s];
          let qty = 0;
          let price = getStandardPrice(s, duration);
          if (typeof existingSvc === 'object') {
            qty = existingSvc.qty || 0;
            price = existingSvc.price !== undefined ? existingSvc.price : getStandardPrice(s, duration);
          } else if (typeof existingSvc === 'number') {
            qty = existingSvc;
          }
          services[s] = { qty, price };
        }
      });
    }

    return {
      duration,
      option: existingConfig?.option || '',
      services
    };
  };

  const handleOpenEditor = (quote = null) => {
    setEditingQuote(quote);
    setEditorStep(1);
    setIsEditorOpen(true);

    if (!quote) {
      const defaultCategory = Object.keys(SERVICE_CATEGORIES)[0] || 'WEDDING';
      setEditorData({
        customerName: '',
        email: '',
        phone: '',
        eventDate: '',
        location: '',
        deliveryTimeline: '8-12 Weeks',
        notes: '',
        status: 'PENDING',
        category: defaultCategory,
        selectedEvents: [],
        eventConfigs: {},
        preWedding: { style: '', cost: 0 },
        postProduction: { editing: '', cost: 0 },
        album: { albumType: '', sheets: 0, cost: 0 },
        addOns: {
          instantReels: { selected: false, qty: 5, cost: 5000 },
          cinematicReels: { selected: false, qty: 5, cost: 10000 },
          ledScreen: { selected: false, qty: 1, cost: 20000 },
          ytLiveFull: { selected: false, qty: 1, cost: 15000 },
          ytLiveHalf: { selected: false, qty: 1, cost: 8000 }
        },
        discountType: 'amount',
        discountValue: 0,
        discount: 0,
        estimatedPrice: 0
      });
    } else {
      let category = Object.keys(SERVICE_CATEGORIES)[0] || 'WEDDING';
      const selectedEventsList = quote.selectedEvents || quote.subServices || [];
      const firstEvt = selectedEventsList.length > 0 ? selectedEventsList[0].toUpperCase() : '';
      const foundCategory = Object.keys(SERVICE_CATEGORIES).find(cat => 
        (SERVICE_CATEGORIES[cat] || []).some(subEvt => subEvt.toUpperCase() === firstEvt)
      );
      if (foundCategory) {
        category = foundCategory;
      }

      const reconstructedConfigs = {};
      selectedEventsList.forEach(evt => {
        const existingConf = quote.eventConfigs?.[evt];
        reconstructedConfigs[evt] = initializeEventConfig(evt, existingConf?.duration || 'Half Day', existingConf);
      });

      let formattedDate = '';
      if (quote.eventDate) {
        const dateObj = new Date(quote.eventDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        }
      }

      const standardAddOns = {
        instantReels: { selected: false, qty: 5, cost: 5000 },
        cinematicReels: { selected: false, qty: 5, cost: 10000 },
        ledScreen: { selected: false, qty: 1, cost: 20000 },
        ytLiveFull: { selected: false, qty: 1, cost: 15000 },
        ytLiveHalf: { selected: false, qty: 1, cost: 8000 }
      };

      if (quote.addOns) {
        Object.keys(quote.addOns).forEach(k => {
          const raw = quote.addOns[k];
          if (raw && (raw.selected || raw.qty > 0)) {
            let key = k;
            if (raw.name?.includes('Instant Reels') || k === 'instantReels') key = 'instantReels';
            else if (raw.name?.includes('Cinematic Reels') || k === 'cinematicReels') key = 'cinematicReels';
            else if (raw.name?.includes('LED Screen') || k === 'ledScreen') key = 'ledScreen';
            else if (raw.name?.includes('YouTube Live (Full') || k === 'ytLiveFull') key = 'ytLiveFull';
            else if (raw.name?.includes('YouTube Live (Half') || k === 'ytLiveHalf') key = 'ytLiveHalf';

            if (standardAddOns[key]) {
              standardAddOns[key] = {
                selected: true,
                qty: raw.qty || 1,
                cost: raw.cost || 0
              };
            }
          }
        });
      }

      setEditorData({
        customerName: quote.customerName || '',
        email: quote.email || '',
        phone: quote.phone || '',
        eventDate: formattedDate,
        location: quote.location || '',
        deliveryTimeline: quote.deliveryTimeline || '8-12 Weeks',
        notes: quote.notes || '',
        status: quote.status || 'PENDING',
        category,
        selectedEvents: selectedEventsList,
        eventConfigs: reconstructedConfigs,
        preWedding: {
          style: quote.preWedding?.style || '',
          cost: quote.preWedding?.cost || 0
        },
        postProduction: {
          editing: quote.postProduction?.editing || '',
          cost: quote.postProduction?.cost || 0
        },
        album: {
          albumType: quote.album?.albumType || '',
          sheets: quote.album?.sheets || 0,
          cost: quote.album?.cost || 0
        },
        addOns: standardAddOns,
        discountType: quote.discountType || 'amount',
        discountValue: quote.discountValue || 0,
        discount: quote.discount || 0,
        estimatedPrice: quote.estimatedPrice || 0
      });
    }
  };

  const handleSaveCategory = async () => {
    const trimmed = newCategoryName.trim().toUpperCase();
    if (!trimmed) {
      addToast('Please enter a valid category name', 'error');
      return;
    }
    if (SERVICE_CATEGORIES[trimmed]) {
      addToast('Category already exists', 'error');
      return;
    }

    const updatedCategories = {
      ...SERVICE_CATEGORIES,
      [trimmed]: []
    };

    try {
      await updateSettings({
        ...settings,
        serviceCategories: updatedCategories
      });
      addToast(`Category "${trimmed}" added successfully`, 'success');
      setIsAddingCategory(false);
      setNewCategoryName('');
      handleCategoryChange(trimmed);
    } catch (err) {
      addToast('Failed to add category', 'error');
    }
  };

  const handleRemoveCategory = async (catToRemove) => {
    if (!window.confirm(`Are you sure you want to delete the category "${catToRemove}" and all its sub-events? This cannot be undone.`)) {
      return;
    }

    const updatedCategories = { ...SERVICE_CATEGORIES };
    delete updatedCategories[catToRemove];

    try {
      await updateSettings({
        ...settings,
        serviceCategories: updatedCategories
      });
      addToast(`Category "${catToRemove}" removed successfully`, 'success');

      // If the current category was the removed one, switch to another
      const nextCat = Object.keys(updatedCategories)[0] || '';
      setEditorData(prev => {
        const filteredSelected = prev.selectedEvents.filter(evt => 
          !(SERVICE_CATEGORIES[catToRemove] || []).includes(evt)
        );
        const filteredConfigs = { ...prev.eventConfigs };
        (SERVICE_CATEGORIES[catToRemove] || []).forEach(evt => {
          delete filteredConfigs[evt];
        });

        const updated = {
          ...prev,
          category: prev.category === catToRemove ? nextCat : prev.category,
          selectedEvents: filteredSelected,
          eventConfigs: filteredConfigs
        };
        updated.estimatedPrice = calculateEditorTotal(updated);
        return updated;
      });
    } catch (err) {
      addToast('Failed to remove category', 'error');
    }
  };

  const handleSaveSubEvent = async () => {
    const trimmed = newSubEventName.trim().toUpperCase();
    if (!trimmed) {
      addToast('Please enter a valid sub-event name', 'error');
      return;
    }
    const currentList = SERVICE_CATEGORIES[editorData.category] || [];
    if (currentList.includes(trimmed)) {
      addToast('Sub-event already exists under this category', 'error');
      return;
    }

    const updatedCategories = {
      ...SERVICE_CATEGORIES,
      [editorData.category]: [...currentList, trimmed]
    };

    try {
      await updateSettings({
        ...settings,
        serviceCategories: updatedCategories
      });
      addToast(`Sub-event "${trimmed}" added successfully`, 'success');
      setIsAddingSubEvent(false);
      setNewSubEventName('');
    } catch (err) {
      addToast('Failed to add sub-event', 'error');
    }
  };

  const handleRemoveSubEvent = async (evtToRemove) => {
    if (!window.confirm(`Are you sure you want to delete the sub-event "${evtToRemove}"?`)) {
      return;
    }

    const currentList = SERVICE_CATEGORIES[editorData.category] || [];
    const updatedCategories = {
      ...SERVICE_CATEGORIES,
      [editorData.category]: currentList.filter(e => e !== evtToRemove)
    };

    try {
      await updateSettings({
        ...settings,
        serviceCategories: updatedCategories
      });
      addToast(`Sub-event "${evtToRemove}" removed successfully`, 'success');

      setEditorData(prev => {
        const selected = prev.selectedEvents.filter(e => e !== evtToRemove);
        const configs = { ...prev.eventConfigs };
        delete configs[evtToRemove];

        const updated = {
          ...prev,
          selectedEvents: selected,
          eventConfigs: configs
        };
        updated.estimatedPrice = calculateEditorTotal(updated);
        return updated;
      });
    } catch (err) {
      addToast('Failed to remove sub-event', 'error');
    }
  };

  const handleSaveStandardService = async () => {
    const trimmed = newStandardServiceName.trim();
    if (!trimmed) {
      addToast('Please enter a valid service name', 'error');
      return;
    }
    if (STANDARD_SERVICES.includes(trimmed)) {
      addToast('Service already exists in list', 'error');
      return;
    }

    const updatedServices = [...STANDARD_SERVICES, trimmed];

    try {
      await updateSettings({
        ...settings,
        standardServices: updatedServices
      });
      addToast(`Service "${trimmed}" added successfully`, 'success');
      setIsAddingStandardService(false);
      setNewStandardServiceName('');

      setEditorData(prev => {
        const configs = { ...prev.eventConfigs };
        Object.keys(configs).forEach(evt => {
          if (configs[evt]?.services) {
            configs[evt].services[trimmed] = { qty: 0, price: getStandardPrice(trimmed, configs[evt].duration) };
          }
        });
        return {
          ...prev,
          eventConfigs: configs
        };
      });
    } catch (err) {
      addToast('Failed to add service', 'error');
    }
  };

  const handleRemoveStandardService = async (svcToRemove) => {
    if (!window.confirm(`Are you sure you want to delete "${svcToRemove}" from all sub-events?`)) {
      return;
    }

    const updatedServices = STANDARD_SERVICES.filter(s => s !== svcToRemove);

    try {
      await updateSettings({
        ...settings,
        standardServices: updatedServices
      });
      addToast(`Service "${svcToRemove}" removed successfully`, 'success');

      setEditorData(prev => {
        const configs = { ...prev.eventConfigs };
        Object.keys(configs).forEach(evt => {
          if (configs[evt]?.services) {
            delete configs[evt].services[svcToRemove];
          }
        });
        const updated = {
          ...prev,
          eventConfigs: configs
        };
        updated.estimatedPrice = calculateEditorTotal(updated);
        return updated;
      });
    } catch (err) {
      addToast('Failed to remove service', 'error');
    }
  };

  const handleCategoryChange = (newCat) => {
    setEditorData(prev => ({
      ...prev,
      category: newCat
    }));
  };

  const handleEditorEventToggle = (evtName) => {
    setEditorData(prev => {
      const selected = prev.selectedEvents.includes(evtName)
        ? prev.selectedEvents.filter(e => e !== evtName)
        : [...prev.selectedEvents, evtName];

      const configs = { ...prev.eventConfigs };
      if (prev.selectedEvents.includes(evtName)) {
        delete configs[evtName];
      } else {
        const defaultDuration = evtName === 'WEDDING' ? 'Full Day' : 'Half Day';
        configs[evtName] = initializeEventConfig(evtName, defaultDuration);
      }

      const updated = {
        ...prev,
        selectedEvents: selected,
        eventConfigs: configs
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorDurationChange = (evtName, newDuration) => {
    setEditorData(prev => {
      const config = prev.eventConfigs[evtName] || {};
      const services = {};
      STANDARD_SERVICES.forEach(s => {
        const existingSvc = config.services?.[s] || {};
        const oldStandardPrice = getStandardPrice(s, config.duration);
        let price = existingSvc.price;
        if (price === undefined || price === oldStandardPrice) {
          price = getStandardPrice(s, newDuration);
        }

        services[s] = {
          qty: existingSvc.qty || 0,
          price
        };
      });

      const updated = {
        ...prev,
        eventConfigs: {
          ...prev.eventConfigs,
          [evtName]: {
            ...config,
            duration: newDuration,
            services
          }
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorOptionChange = (evtName, optVal) => {
    setEditorData(prev => ({
      ...prev,
      eventConfigs: {
        ...prev.eventConfigs,
        [evtName]: {
          ...prev.eventConfigs[evtName],
          option: optVal
        }
      }
    }));
  };

  const handleEditorServiceToggle = (evtName, svcName, isChecked) => {
    setEditorData(prev => {
      const config = prev.eventConfigs[evtName] || {};
      const services = { ...config.services };
      const currentSvc = services[svcName] || {};

      services[svcName] = {
        qty: isChecked ? 1 : 0,
        price: currentSvc.price !== undefined ? currentSvc.price : getStandardPrice(svcName, config.duration)
      };

      const updated = {
        ...prev,
        eventConfigs: {
          ...prev.eventConfigs,
          [evtName]: {
            ...config,
            services
          }
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorServiceQtyChange = (evtName, svcName, qtyVal) => {
    setEditorData(prev => {
      const config = prev.eventConfigs[evtName] || {};
      const services = { ...config.services };
      const currentSvc = services[svcName] || {};

      services[svcName] = {
        ...currentSvc,
        qty: Math.max(0, parseInt(qtyVal) || 0)
      };

      const updated = {
        ...prev,
        eventConfigs: {
          ...prev.eventConfigs,
          [evtName]: {
            ...config,
            services
          }
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorServicePriceChange = (evtName, svcName, priceVal) => {
    setEditorData(prev => {
      const config = prev.eventConfigs[evtName] || {};
      const services = { ...config.services };
      const currentSvc = services[svcName] || {};

      services[svcName] = {
        ...currentSvc,
        price: Math.max(0, parseFloat(priceVal) || 0)
      };

      const updated = {
        ...prev,
        eventConfigs: {
          ...prev.eventConfigs,
          [evtName]: {
            ...config,
            services
          }
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorPreWeddingChange = (style) => {
    setEditorData(prev => {
      const standardCost = style === 'Conceptual Pre-Wedding' ? 120000 :
                           style === 'Freestyle Pre-Wedding' ? 70000 :
                           style === 'Basic Pre-Wedding' ? 30000 : 0;
      const dbPrice = prices.find(p => p.serviceName === style && p.category === 'Pre-Wedding Style')?.basePrice;
      const cost = dbPrice !== undefined ? dbPrice : standardCost;

      const updated = {
        ...prev,
        preWedding: { style, cost }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorPreWeddingCostChange = (costVal) => {
    setEditorData(prev => {
      const updated = {
        ...prev,
        preWedding: {
          ...prev.preWedding,
          cost: Math.max(0, parseFloat(costVal) || 0)
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorPostProdChange = (editing) => {
    setEditorData(prev => {
      const standardCost = editing === 'Documentary Style Wedding Film' ? 20000 : 0;
      const dbPrice = prices.find(p => p.serviceName === editing && p.category === 'Post Production Editing')?.basePrice;
      const cost = dbPrice !== undefined ? dbPrice : standardCost;

      const updated = {
        ...prev,
        postProduction: { editing, cost }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorPostProdCostChange = (costVal) => {
    setEditorData(prev => {
      const updated = {
        ...prev,
        postProduction: {
          ...prev.postProduction,
          cost: Math.max(0, parseFloat(costVal) || 0)
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorAlbumChange = (albumType) => {
    setEditorData(prev => {
      const standardCost = albumType === 'Basic Album (30 Sheets)' ? 15000 :
                           albumType === 'Standard Album (50 Sheets)' ? 25000 :
                           albumType === 'Premium Album (80 Sheets)' ? 40000 : 0;
      const dbPrice = prices.find(p => p.serviceName === albumType && p.category === 'Photo Album')?.basePrice;
      const cost = dbPrice !== undefined ? dbPrice : standardCost;

      const updated = {
        ...prev,
        album: {
          ...prev.album,
          albumType,
          cost
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorAlbumSheetsChange = (sheetsVal) => {
    setEditorData(prev => {
      const sheets = Math.max(0, parseInt(sheetsVal) || 0);
      const sheetPriceItem = prices.find(p => p.serviceName === 'Additional Sheets (Per Sheet)' && p.category === 'Photo Album');
      const sheetPrice = sheetPriceItem ? sheetPriceItem.basePrice : 500;
      
      const albumType = prev.album.albumType;
      const dbPrice = prices.find(p => p.serviceName === albumType && p.category === 'Photo Album')?.basePrice;
      const standardCost = albumType === 'Basic Album (30 Sheets)' ? 15000 :
                           albumType === 'Standard Album (50 Sheets)' ? 25000 :
                           albumType === 'Premium Album (80 Sheets)' ? 40000 : 0;
      const baseCost = dbPrice !== undefined ? dbPrice : standardCost;
      const cost = baseCost + (sheets * sheetPrice);

      const updated = {
        ...prev,
        album: {
          ...prev.album,
          sheets,
          cost
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorAlbumCostChange = (costVal) => {
    setEditorData(prev => {
      const updated = {
        ...prev,
        album: {
          ...prev.album,
          cost: Math.max(0, parseFloat(costVal) || 0)
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorAddonToggle = (key, isSelected) => {
    setEditorData(prev => {
      const addon = prev.addOns[key] || {};
      let rate = 0;
      if (key === 'instantReels') {
        const item = prices.find(p => p.serviceName === 'Event Instant Reels' && p.category === 'Add-On Services');
        rate = (item ? item.basePrice : 1000) * addon.qty;
      } else if (key === 'cinematicReels') {
        const item = prices.find(p => p.serviceName === 'Cinematic Reels' && p.category === 'Add-On Services');
        rate = (item ? item.basePrice : 2000) * addon.qty;
      } else if (key === 'ledScreen') {
        const item = prices.find(p => p.serviceName === 'LED Screen (8x12 1 or 6x8 2)' && p.category === 'Add-On Services');
        rate = item ? item.basePrice : 20000;
      } else if (key === 'ytLiveFull') {
        const item = prices.find(p => p.serviceName === 'YouTube Live (Full Day)' && p.category === 'Add-On Services');
        rate = item ? item.basePrice : 15000;
      } else if (key === 'ytLiveHalf') {
        const item = prices.find(p => p.serviceName === 'YouTube Live (Half Day)' && p.category === 'Add-On Services');
        rate = item ? item.basePrice : 8000;
      }

      const updated = {
        ...prev,
        addOns: {
          ...prev.addOns,
          [key]: {
            ...addon,
            selected: isSelected,
            cost: isSelected ? rate : 0
          }
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorAddonCostChange = (key, costVal) => {
    setEditorData(prev => {
      const updated = {
        ...prev,
        addOns: {
          ...prev.addOns,
          [key]: {
            ...prev.addOns[key],
            cost: Math.max(0, parseFloat(costVal) || 0)
          }
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleEditorAddonQtyChange = (key, qtyVal) => {
    setEditorData(prev => {
      const qty = Math.max(0, parseInt(qtyVal) || 0);
      const addon = prev.addOns[key] || {};
      
      let rate = 0;
      if (key === 'instantReels') {
        const item = prices.find(p => p.serviceName === 'Event Instant Reels' && p.category === 'Add-On Services');
        rate = (item ? item.basePrice : 1000) * qty;
      } else if (key === 'cinematicReels') {
        const item = prices.find(p => p.serviceName === 'Cinematic Reels' && p.category === 'Add-On Services');
        rate = (item ? item.basePrice : 2000) * qty;
      }

      const updated = {
        ...prev,
        addOns: {
          ...prev.addOns,
          [key]: {
            ...addon,
            qty,
            cost: addon.selected ? rate : 0
          }
        }
      };
      updated.estimatedPrice = calculateEditorTotal(updated);
      return updated;
    });
  };

  const handleSaveQuote = async (e) => {
    if (e) e.preventDefault();

    if (!editorData.customerName || !editorData.email || !editorData.phone || !editorData.eventDate || !editorData.location) {
      addToast('Please fill out all required client details', 'error');
      setEditorStep(1);
      return;
    }

    if (editorData.selectedEvents.length === 0) {
      addToast('Please select at least one sub-event to cover', 'error');
      setEditorStep(2);
      return;
    }

    const payloadEventConfigs = {};
    editorData.selectedEvents.forEach(evt => {
      const config = editorData.eventConfigs[evt];
      if (config) {
        const activeServices = {};
        Object.keys(config.services).forEach(s => {
          const svc = config.services[s] || {};
          if (svc.qty > 0) {
            activeServices[s] = {
              qty: svc.qty,
              price: svc.price
            };
          }
        });
        payloadEventConfigs[evt] = {
          duration: config.duration,
          option: config.option || undefined,
          services: activeServices
        };
      }
    });

    const activeAddons = {};
    Object.keys(editorData.addOns).forEach(k => {
      const addon = editorData.addOns[k];
      if (addon.selected) {
        let name = 'LED Screen';
        if (k === 'instantReels') name = 'Event Instant Reels';
        else if (k === 'cinematicReels') name = 'Cinematic Reels';
        else if (k === 'ytLiveFull') name = 'YouTube Live (Full Day)';
        else if (k === 'ytLiveHalf') name = 'YouTube Live (Half Day)';

        activeAddons[k] = {
          selected: true,
          name,
          qty: addon.qty || 1,
          cost: addon.cost
        };
      }
    });

    const payload = {
      customerName: editorData.customerName,
      email: editorData.email,
      phone: editorData.phone,
      eventDate: editorData.eventDate,
      location: editorData.location,
      notes: editorData.notes,
      selectedEvents: editorData.selectedEvents,
      eventConfigs: payloadEventConfigs,
      preWedding: {
        style: editorData.preWedding.style || null,
        cost: editorData.preWedding.cost || 0
      },
      postProduction: {
        editing: editorData.postProduction.editing || null,
        cost: editorData.postProduction.cost || 0
      },
      album: {
        albumType: editorData.album.albumType || null,
        sheets: editorData.album.sheets || 0,
        cost: editorData.album.cost || 0
      },
      addOns: activeAddons,
      estimatedPrice: editorData.estimatedPrice,
      deliveryTimeline: editorData.deliveryTimeline,
      status: editorData.status,
      discountType: editorData.discountType,
      discountValue: parseFloat(editorData.discountValue) || 0
    };

    setIsSavingQuote(true);
    try {
      if (editingQuote) {
        await updateBooking(editingQuote._id, payload);
        addToast('Quotation updated successfully! Revised PDF emailed.', 'success');
      } else {
        await addBooking(payload);
        addToast('New Custom Quotation filed successfully! PDF Proposal emailed.', 'success');
      }
      setIsEditorOpen(false);
      setEditingQuote(null);
    } catch (err) {
      addToast(err.message || 'Failed to save quotation', 'error');
    } finally {
      setIsSavingQuote(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateBookingStatus(id, newStatus);
      addToast(`Status updated to ${newStatus}`, 'success');
      if (selectedQuote && selectedQuote._id === id) {
        setSelectedQuote(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inquiry? This action is irreversible.')) return;
    try {
      await deleteBooking(id);
      addToast('Inquiry deleted successfully', 'success');
      if (selectedQuote && selectedQuote._id === id) {
        setSelectedQuote(null);
      }
    } catch (error) {
      addToast('Failed to delete inquiry', 'error');
    }
  };

  const handleApplyDiscount = async (e) => {
    e.preventDefault();
    if (!discountQuote) return;
    const value = parseFloat(discountValue);
    if (isNaN(value) || value < 0) {
      addToast('Please enter a valid discount value', 'error');
      return;
    }

    if (discountType === 'percentage' && value > 100) {
      addToast('Discount percentage cannot exceed 100%', 'error');
      return;
    }

    const calculatedVal = discountType === 'percentage' ? (discountQuote.estimatedPrice * value) / 100 : value;
    if (calculatedVal > discountQuote.estimatedPrice) {
      addToast('Discount cannot exceed the estimated price', 'error');
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const updated = await applyDiscount(discountQuote._id, discountType, value);
      addToast(`Discount applied! Revised proposal emailed.`, 'success');
      
      // Update selectedQuote details review modal if open
      if (selectedQuote && selectedQuote._id === discountQuote._id) {
        setSelectedQuote(updated);
      }
      
      setDiscountQuote(null);
      setDiscountValue('');
    } catch (error) {
      addToast(error.message || 'Failed to apply discount', 'error');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const exportToCSV = () => {
    if (bookings.length === 0) {
      addToast('No quotations available to export', 'error');
      return;
    }
    const headers = ['Lead ID', 'Client Name', 'Email', 'Phone', 'Event Date', 'Location', 'Estimated Price', 'Selected Events', 'Status', 'Submitted At'];
    const csvRows = [headers.join(',')];

    bookings.forEach(b => {
      const row = [
        `"${b._id}"`,
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        `"${b.email || ''}"`,
        `"${b.phone || ''}"`,
        `"${b.eventDate ? new Date(b.eventDate).toLocaleDateString() : ''}"`,
        `"${(b.location || '').replace(/"/g, '""')}"`,
        b.estimatedPrice || 0,
        `"${(b.selectedEvents || b.subServices || []).join(', ')}"`,
        `"${b.status}"`,
        `"${b.createdAt ? new Date(b.createdAt).toLocaleString() : ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Astitva_Creations_Quotations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Quotations spreadsheet downloaded!', 'success');
  };

  return (
    <>
      <Helmet>
        <title>Manage Quotes | Admin Dashboard</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-heading text-3xl text-white mb-1">Quote Inquiries</h2>
            <p className="text-[#A1A1A1] text-sm">Review and manage incoming leads from your Quote Wizard.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleOpenEditor(null)}
              className="px-4 py-2 bg-transparent border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm font-sans"
            >
              <Plus className="w-4 h-4" /> Create Quote
            </button>
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 bg-[var(--color-gold)] text-black hover:bg-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm"
            >
              <Download className="w-4 h-4 stroke-[3px]" /> Export CSV
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-[#222]"
        >
          <div className="p-4 border-b border-[#222] flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
              <input 
                type="text" 
                placeholder="Search by client name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#222] text-[#A1A1A1] text-xs uppercase tracking-widest font-bold">
                  <th className="p-4">Lead ID</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Event Date</th>
                  <th className="p-4">Selected Events</th>
                  <th className="p-4">Estimate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter(b => (b.customerName || '').toLowerCase().includes(search.toLowerCase()) || b._id.toLowerCase().includes(search.toLowerCase())).map(booking => {
                  const eventsList = booking.selectedEvents || booking.subServices || [];
                  return (
                    <tr key={booking._id} className="border-b border-[#222] hover:bg-[#1a1a1a]/50 transition-colors">
                      <td className="p-4 text-[#777] font-mono text-xs">{booking._id.slice(-6).toUpperCase()}</td>
                      <td className="p-4 font-semibold text-white">
                        {booking.customerName}
                        <span className="block text-[10px] text-[#555] font-normal">{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}</span>
                      </td>
                      <td className="p-4 text-[#A1A1A1] text-xs font-mono">{booking.eventDate ? new Date(booking.eventDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td className="p-4 text-[#A1A1A1] max-w-[200px] truncate text-xs" title={eventsList.join(', ')}>{eventsList.join(', ') || 'N/A'}</td>
                      <td className="p-4 text-[var(--color-gold)] font-bold font-mono">
                        {booking.discount > 0 ? (
                          <div className="flex flex-col">
                            <span className="line-through text-xs text-[#555]">₹{booking.estimatedPrice?.toLocaleString()}/-</span>
                            <span>
                              ₹{(booking.estimatedPrice - booking.discount)?.toLocaleString()}/-
                              {booking.discountType === 'percentage' && (
                                <span className="text-[10px] text-[#22c55e] font-bold block">(-{booking.discountValue}%)</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          `₹${booking.estimatedPrice?.toLocaleString()}/-`
                        )}
                      </td>
                      <td className="p-4">
                        <select 
                          value={booking.status} 
                          onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                          className={`bg-transparent border-none text-[10px] uppercase tracking-widest font-bold focus:ring-0 cursor-pointer ${
                            booking.status === 'PENDING' ? 'text-yellow-500' :
                            booking.status === 'CONTACTED' ? 'text-blue-500' :
                            booking.status === 'CONFIRMED' ? 'text-green-500' :
                            'text-red-500'
                          }`}
                        >
                          <option value="PENDING" className="bg-[#111] text-white">Pending</option>
                          <option value="CONTACTED" className="bg-[#111] text-white">Contacted</option>
                          <option value="CONFIRMED" className="bg-[#111] text-white">Confirmed</option>
                          <option value="CANCELLED" className="bg-[#111] text-white">Cancelled</option>
                          <option value="LOST" className="bg-[#111] text-white">Lost</option>
                        </select>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEditor(booking)}
                          className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] hover:bg-[#333] rounded transition-colors" 
                          title="Edit & Customize Quote"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setDiscountQuote(booking);
                            setDiscountType(booking.discountType || 'amount');
                            setDiscountValue(booking.discountValue ? booking.discountValue.toString() : '');
                          }}
                          className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] hover:bg-[#333] rounded transition-colors" 
                          title="Apply Administrative Discount"
                        >
                          <Percent className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${booking._id}/pdf`, '_blank')}
                          className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] hover:bg-[#333] rounded transition-colors" 
                          title="Download Proposal PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setSelectedQuote(booking)}
                          className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] hover:bg-[#333] rounded transition-colors" 
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(booking._id)} className="p-2 text-[#A1A1A1] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Delete Inquiry">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })}
                {bookings.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-[#A1A1A1]">No quote requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Beautiful Glassmorphic Details Modal */}
        <AnimatePresence>
          {selectedQuote && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-[#222] w-full max-w-2xl shadow-3xl rounded-sm max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-[#222] p-6">
                  <div>
                    <h3 className="font-heading text-xl text-white">Quotation Proposal Review</h3>
                    <span className="text-[10px] text-[#555] uppercase tracking-widest block mt-0.5">Lead ID: #{selectedQuote._id.toUpperCase()}</span>
                  </div>
                  <button onClick={() => setSelectedQuote(null)} className="text-[#777] hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  
                  {/* Contact Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-[#222] bg-[#0c0c0c] space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-[var(--color-gold)] font-bold block mb-1">Client Coordinates</span>
                      <div className="flex items-center gap-2 text-xs text-white">
                        <User className="w-4 h-4 text-[#555]" /> {selectedQuote.customerName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <Mail className="w-4 h-4 text-[#555]" /> 
                        <a href={`mailto:${selectedQuote.email}`} className="hover:text-[var(--color-gold)] transition-colors">{selectedQuote.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <Phone className="w-4 h-4 text-[#555]" /> 
                        <a href={`tel:${selectedQuote.phone}`} className="hover:text-[var(--color-gold)] transition-colors">{selectedQuote.phone}</a>
                      </div>
                    </div>

                    <div className="p-4 border border-[#222] bg-[#0c0c0c] space-y-2">
                      <span className="text-[9px] uppercase tracking-widest text-[var(--color-gold)] font-bold block mb-1">Logistics & Milestones</span>
                      <div className="flex items-center gap-2 text-xs text-white">
                        <Calendar className="w-4 h-4 text-[#555]" /> Date: {selectedQuote.eventDate ? new Date(selectedQuote.eventDate).toLocaleDateString('en-IN') : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <MapPin className="w-4 h-4 text-[#555]" /> Location: {selectedQuote.location || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                        <Clock className="w-4 h-4 text-[#555]" /> Delivery Timeline: {selectedQuote.deliveryTimeline || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Configured Coverages List */}
                  {selectedQuote.selectedEvents && selectedQuote.selectedEvents.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold block border-b border-[#222] pb-1">Selected Coverages & sub-services</span>
                      <div className="space-y-3">
                        {selectedQuote.selectedEvents.map(evt => {
                          const config = selectedQuote.eventConfigs?.[evt] || {};
                          return (
                            <div key={evt} className="p-3 border border-[#1a1a1a] bg-[#090909] rounded-sm flex justify-between items-start gap-4">
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{evt}</h4>
                                <p className="text-[10px] text-[#A1A1A1] mt-1 font-semibold uppercase tracking-widest">
                                  {config.services 
                                    ? (Array.isArray(config.services)
                                      ? config.services.join(', ')
                                      : Object.keys(config.services).map(k => `${k} (${config.services[k]?.qty}x)`).join(', '))
                                    : 'No Services Selected'}
                                </p>

                              </div>
                              <span className="px-2 py-0.5 border border-[#333] text-[9px] uppercase tracking-widest text-[#777] rounded-sm font-bold font-mono">{config.duration || 'Half Day'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Legacy Services Selected</span>
                      <p className="text-xs text-[#A1A1A1]">{selectedQuote.subServices?.join(', ') || 'N/A'}</p>
                    </div>
                  )}

                  {/* Deliverables details */}
                  {(selectedQuote.preWedding?.style || selectedQuote.postProduction?.editing || selectedQuote.album?.albumType) && (
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold block border-b border-[#222] pb-1">Deliverables & Luxury Styles</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#A1A1A1]">
                        {selectedQuote.preWedding?.style && (
                          <div className="p-3 border border-[#222] bg-[#0c0c0c]">
                            <span className="text-[8px] uppercase tracking-widest text-[#555] block mb-1">Pre-Wedding Style</span>
                            <span className="font-bold text-white">{selectedQuote.preWedding.style}</span>
                          </div>
                        )}
                        {selectedQuote.postProduction?.editing && (
                          <div className="p-3 border border-[#222] bg-[#0c0c0c]">
                            <span className="text-[8px] uppercase tracking-widest text-[#555] block mb-1">Video Post-Production</span>
                            <span className="font-bold text-white">{selectedQuote.postProduction.editing}</span>
                          </div>
                        )}
                        {selectedQuote.album?.albumType && (
                          <div className="p-3 border border-[#222] bg-[#0c0c0c]">
                            <span className="text-[8px] uppercase tracking-widest text-[#555] block mb-1">Premium Photo Album</span>
                            <span className="font-bold text-white">{selectedQuote.album.albumType} ({selectedQuote.album.sheets} Sheets)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add-ons list */}
                  {selectedQuote.addOns && Object.keys(selectedQuote.addOns).length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold block border-b border-[#222] pb-1">Add-On Event Extras</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#A1A1A1]">
                        {Object.keys(selectedQuote.addOns).map(key => {
                          const addon = selectedQuote.addOns[key];
                          if (!addon.selected) return null;
                          return (
                            <div key={key} className="p-3 border border-[#222] bg-[#0c0c0c] flex justify-between items-center">
                              <div>
                                <span className="font-bold text-white block">{addon.name}</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#777]">Qty: {addon.qty || 1}</span>
                              </div>
                              <span className="font-mono text-[var(--color-gold)] font-bold">₹{addon.cost?.toLocaleString()}/-</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Notes */}
                  {selectedQuote.notes && (
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold block border-b border-[#222] pb-1">Client Special Requests</span>
                      <p className="text-xs text-[#A1A1A1] bg-[#090909] p-4 border border-[#1a1a1a] rounded-sm leading-relaxed whitespace-pre-wrap">{selectedQuote.notes}</p>
                    </div>
                  )}

                  {/* Final Estimates */}
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-[#000] border border-[#222] p-6 gap-4">
                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                      {selectedQuote.discount > 0 ? (
                        <>
                          <div className="flex items-center gap-2 text-xs text-[#555]">
                            <span className="uppercase tracking-widest">Base Price:</span>
                            <span className="line-through font-mono">₹{selectedQuote.estimatedPrice?.toLocaleString()}/-</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#22c55e]">
                            <span className="uppercase tracking-widest">Discount:</span>
                            <span className="font-bold font-mono">
                              -₹{selectedQuote.discount?.toLocaleString()}/-
                              {selectedQuote.discountType === 'percentage' && ` (${selectedQuote.discountValue}%)`}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className="text-[9px] text-[#555] uppercase tracking-widest block">REVISED ESTIMATED TOTAL</span>
                            <span className="text-2xl font-bold text-[var(--color-gold)] font-mono">₹{(selectedQuote.estimatedPrice - selectedQuote.discount)?.toLocaleString()}/-</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] text-[#555] uppercase tracking-widest block">GRAND ESTIMATE</span>
                          <span className="text-2xl font-bold text-[var(--color-gold)] font-mono">₹{selectedQuote.estimatedPrice?.toLocaleString()}/-</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#777] font-bold">Lead Status:</span>
                      <select 
                        value={selectedQuote.status} 
                        onChange={(e) => handleStatusChange(selectedQuote._id, e.target.value)}
                        className={`bg-[#0c0c0c] border border-[#222] text-[10px] uppercase tracking-widest font-bold py-2 px-3 focus:ring-0 cursor-pointer ${
                          selectedQuote.status === 'PENDING' ? 'text-yellow-500' :
                          selectedQuote.status === 'CONTACTED' ? 'text-blue-500' :
                          selectedQuote.status === 'CONFIRMED' ? 'text-green-500' :
                          'text-red-500'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="border-t border-[#222] p-6 flex justify-end gap-3 bg-[#0a0a0a] flex-wrap sm:flex-nowrap">
                   <button 
                     onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${selectedQuote._id}/pdf`, '_blank')}
                    className="px-4 py-2 bg-[var(--color-gold)] text-black hover:bg-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm mr-auto w-full sm:w-auto justify-center"
                  >
                    <Download className="w-4 h-4 stroke-[3px]" /> Download PDF Proposal
                  </button>
                  <button 
                    onClick={() => {
                      setDiscountQuote(selectedQuote);
                      setDiscountType(selectedQuote.discountType || 'amount');
                      setDiscountValue(selectedQuote.discountValue ? selectedQuote.discountValue.toString() : '');
                    }}
                    className="px-4 py-2 border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-black transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm w-full sm:w-auto justify-center"
                  >
                    <Percent className="w-4 h-4 stroke-[3px]" /> Give Discount
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedQuote._id)}
                    className="px-4 py-2 border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs uppercase tracking-widest font-bold rounded-sm w-full sm:w-auto justify-center"
                  >
                    Delete Inquiry
                  </button>
                  <button 
                    onClick={() => setSelectedQuote(null)}
                    className="px-4 py-2 border border-[#333] text-white hover:bg-[#222] text-xs uppercase tracking-widest font-bold rounded-sm w-full sm:w-auto justify-center"
                  >
                    Close Review
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sleek Glassmorphic Discount Modal */}
        <AnimatePresence>
          {discountQuote && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-[#222] w-full max-w-md shadow-3xl rounded-sm overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#222] p-5 bg-[#0a0a0a]">
                  <div>
                    <h3 className="font-heading text-lg text-white">Apply Custom Discount</h3>
                    <span className="text-[9px] text-[#555] uppercase tracking-widest block mt-0.5">Client: {discountQuote.customerName}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setDiscountQuote(null);
                      setDiscountValue('');
                    }} 
                    className="text-[#777] hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleApplyDiscount} className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Discount Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('amount');
                          setDiscountValue('');
                        }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border transition-colors rounded-sm ${
                          discountType === 'amount'
                            ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]'
                            : 'bg-transparent text-white border-[#333] hover:border-[var(--color-gold)]/50'
                        }`}
                      >
                        Flat Amount (₹)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountType('percentage');
                          setDiscountValue('');
                        }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border transition-colors rounded-sm ${
                          discountType === 'percentage'
                            ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]'
                            : 'bg-transparent text-white border-[#333] hover:border-[var(--color-gold)]/50'
                        }`}
                      >
                        Percentage (%)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">
                      {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[var(--color-gold)] font-bold">
                        {discountType === 'percentage' ? '%' : '₹'}
                      </span>
                      <input 
                        type="number" 
                        required
                        min="0"
                        max={discountType === 'percentage' ? 100 : discountQuote.estimatedPrice}
                        step={discountType === 'percentage' ? '0.1' : '1'}
                        placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 10000'}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#333] pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] font-mono rounded-sm"
                      />
                    </div>
                    <p className="text-[9px] text-[#555]">
                      {discountType === 'percentage' 
                        ? 'Apply a percentage discount based on the estimate. Once applied, a revised proposal PDF will be generated and emailed automatically to both the client and the admin.'
                        : 'Apply a custom flat discount. Once applied, a revised proposal PDF will be generated and emailed automatically to both the client and the admin.'}
                    </p>
                  </div>

                  {/* Real-time Math Summary */}
                  {(() => {
                    const parsedVal = parseFloat(discountValue) || 0;
                    const calculatedDiscount = discountType === 'percentage' 
                      ? Math.round((discountQuote.estimatedPrice * parsedVal) / 100)
                      : parsedVal;
                    const newTotal = Math.max(0, discountQuote.estimatedPrice - calculatedDiscount);
                    return (
                      <div className="p-4 border border-[#222] bg-[#0c0c0c] space-y-3">
                        <span className="text-[8px] uppercase tracking-widest text-[var(--color-gold)] font-bold block mb-1">Pricing Breakdown Preview</span>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A1A1A1]">Original Base Estimate:</span>
                          <span className="font-mono text-white font-semibold">₹{discountQuote.estimatedPrice?.toLocaleString()}/-</span>
                        </div>
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A1A1A1]">
                            Applied Discount {discountType === 'percentage' && parsedVal > 0 ? `(${parsedVal}%)` : ''}:
                          </span>
                          <span className="font-mono text-[#22c55e] font-bold">-₹{calculatedDiscount.toLocaleString()}/-</span>
                        </div>

                        <div className="border-t border-[#1c1c1c] pt-2 flex justify-between items-end">
                          <span className="text-[10px] text-white font-bold uppercase tracking-wider">New Final Estimate:</span>
                          <span className="font-mono text-[var(--color-gold)] text-lg font-extrabold">₹{newTotal.toLocaleString()}/-</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setDiscountQuote(null);
                        setDiscountValue('');
                      }}
                      className="px-4 py-2.5 border border-[#333] text-white hover:bg-[#222] text-xs uppercase tracking-widest font-bold rounded-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isApplyingDiscount}
                      className="px-5 py-2.5 bg-[var(--color-gold)] text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs uppercase tracking-widest font-extrabold rounded-sm"
                    >
                      {isApplyingDiscount ? 'Applying...' : 'Apply & Send Revised Emails'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dynamic Multi-Step Quote Editor Modal */}
        <AnimatePresence>
          {isEditorOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-[#222] w-full max-w-4xl shadow-3xl rounded-sm max-h-[95vh] overflow-y-auto"
              >
                {/* Steps Breadcrumbs Progress Header */}
                <div className="bg-[#0a0a0a] border-b border-[#222] p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-heading text-lg text-white font-serif">
                        {editingQuote ? 'Edit Quotation Proposal' : 'Create Custom Quotation'}
                      </h3>
                      <span className="text-[10px] text-[#555] uppercase tracking-widest block mt-0.5">
                        {editingQuote ? `Overriding Lead ID: #${editingQuote._id.toUpperCase()}` : 'Administrative Quotation Wizard'}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsEditorOpen(false);
                        setEditingQuote(null);
                      }} 
                      className="text-[#777] hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex items-center gap-2">
                    {[
                      { step: 1, label: 'Coordinates' },
                      { step: 2, label: 'Events & Overrides' },
                      { step: 3, label: 'Albums & Extras' },
                      { step: 4, label: 'Financial Summary' }
                    ].map((s, idx, arr) => (
                      <div key={s.step} className="flex items-center flex-1 last:flex-initial">
                        <button
                          type="button"
                          onClick={() => setEditorStep(s.step)}
                          className={`flex items-center gap-2 text-left focus:outline-none transition-colors ${
                            editorStep === s.step
                              ? 'text-[var(--color-gold)] font-bold'
                              : editorStep > s.step
                              ? 'text-[#22c55e]'
                              : 'text-[#555]'
                          }`}
                        >
                          <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border rounded-full font-mono ${
                            editorStep === s.step
                              ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-black'
                              : editorStep > s.step
                              ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                              : 'border-[#333]'
                          }`}>
                            {editorStep > s.step ? '✓' : s.step}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest hidden sm:inline">{s.label}</span>
                        </button>
                        {idx < arr.length - 1 && (
                          <div className={`h-px flex-1 mx-4 hidden sm:block ${
                            editorStep > s.step ? 'bg-[#22c55e]/50' : 'bg-[#222]'
                          }`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* Step 1: Client Coordinates */}
                  {editorStep === 1 && (
                    <div className="space-y-6">
                      <h4 className="text-sm font-heading text-[var(--color-gold)] uppercase tracking-wider border-b border-[#222] pb-2 font-serif">Step 1: Client Coordinates</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Client Name *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Priyanshu Sharma"
                            value={editorData.customerName}
                            onChange={(e) => setEditorData(prev => ({ ...prev, customerName: e.target.value }))}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Email Address *</label>
                          <input 
                            type="email" 
                            required
                            placeholder="e.g. client@example.com"
                            value={editorData.email}
                            onChange={(e) => setEditorData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Phone Number *</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="e.g. +91 98765 43210"
                            value={editorData.phone}
                            onChange={(e) => setEditorData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Event Date *</label>
                          <input 
                            type="date" 
                            required
                            value={editorData.eventDate}
                            onChange={(e) => setEditorData(prev => ({ ...prev, eventDate: e.target.value }))}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Event Location *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Taj Deccan, Hyderabad"
                            value={editorData.location}
                            onChange={(e) => setEditorData(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Delivery Timeline</label>
                          <select 
                            value={editorData.deliveryTimeline}
                            onChange={(e) => setEditorData(prev => ({ ...prev, deliveryTimeline: e.target.value }))}
                            className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                          >
                            <option value="8-12 Weeks">8-12 Weeks (Standard)</option>
                            <option value="6-8 Weeks">6-8 Weeks (Premium)</option>
                            <option value="4-6 Weeks">4-6 Weeks (Express)</option>
                            <option value="2-4 Weeks">2-4 Weeks (Priority)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Special Notes / Admin Remarks</label>
                        <textarea 
                          rows="4"
                          placeholder="Add any internal remarks, custom arrangements, or client requests..."
                          value={editorData.notes}
                          onChange={(e) => setEditorData(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Categories, Events & Service Overrides */}
                  {editorStep === 2 && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-[#222] pb-2">
                        <h4 className="text-sm font-heading text-[var(--color-gold)] uppercase tracking-wider font-serif">Step 2: Events & Service Customizations</h4>
                        <span className="text-[10px] text-[#777] uppercase tracking-widest font-bold">Base Price: <strong className="text-[var(--color-gold)] font-mono">₹{editorData.estimatedPrice.toLocaleString()}/-</strong></span>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Primary Service Category</label>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.keys(SERVICE_CATEGORIES).map(cat => (
                            <div key={cat} className="relative group">
                              <button
                                type="button"
                                onClick={() => handleCategoryChange(cat)}
                                className={`w-full py-3 text-xs font-bold uppercase tracking-widest border transition-all rounded-sm flex flex-col items-center justify-center gap-1 pr-6 pl-6 ${
                                  editorData.category === cat
                                    ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-md shadow-[var(--color-gold)]/10'
                                    : 'bg-[#0e0e0e] text-[#a1a1a1] border-[#222] hover:border-[#444] hover:text-white'
                                }`}
                              >
                                <span className="text-[11px] tracking-widest truncate w-full text-center">{cat}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCategory(cat);
                                }}
                                className="absolute top-1 right-1 p-1 text-[#777] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title={`Delete category ${cat}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}

                          {isAddingCategory ? (
                            <div className="col-span-3 flex gap-2 items-center bg-[#0c0c0c] p-2 border border-[#222] rounded-sm">
                              <input
                                type="text"
                                placeholder="New category name (e.g. MATERNITY)"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value.toUpperCase())}
                                className="flex-1 bg-[#111] border border-[#333] px-3 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm uppercase"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleSaveCategory}
                                className="px-3 py-1 bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-white transition-colors"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCategory(false);
                                  setNewCategoryName('');
                                }}
                                className="px-3 py-1 border border-[#333] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#222] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="col-span-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setIsAddingCategory(true)}
                                className="px-3 py-1.5 border border-[#333] hover:border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[#111] text-[10px] uppercase tracking-widest font-extrabold rounded-sm transition-all flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Category
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sub-Events Selection */}
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Select Sub-Events / Celebrations ({editorData.category})</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {(SERVICE_CATEGORIES[editorData.category] || []).map(evt => {
                            const isChecked = editorData.selectedEvents.includes(evt);
                            return (
                              <div key={evt} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => handleEditorEventToggle(evt)}
                                  className={`w-full p-2 text-left text-[10px] font-bold uppercase tracking-wider border rounded-sm transition-all flex items-center gap-2 pr-8 ${
                                    isChecked
                                      ? 'bg-[#1a150c] text-[var(--color-gold)] border-[var(--color-gold)]/60'
                                      : 'bg-[#0a0a0a] text-[#777] border-[#222] hover:border-[#333] hover:text-white'
                                  }`}
                                >
                                  <span className={`w-3.5 h-3.5 border flex items-center justify-center text-[8px] font-bold rounded-sm shrink-0 ${
                                    isChecked ? 'border-[var(--color-gold)] bg-[var(--color-gold)] text-black' : 'border-[#444]'
                                  }`}>
                                    {isChecked && '✓'}
                                  </span>
                                  <span className="truncate">{evt}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSubEvent(evt);
                                  }}
                                  className="absolute top-1/2 -translate-y-1/2 right-1.5 p-1 text-[#777] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title={`Delete sub-event ${evt}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}

                          {isAddingSubEvent ? (
                            <div className="col-span-2 sm:col-span-3 md:col-span-4 flex gap-2 items-center bg-[#0c0c0c] p-2 border border-[#222] rounded-sm mt-2">
                              <input
                                type="text"
                                placeholder={`New sub-event name for ${editorData.category}`}
                                value={newSubEventName}
                                onChange={(e) => setNewSubEventName(e.target.value.toUpperCase())}
                                className="flex-1 bg-[#111] border border-[#333] px-3 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm uppercase"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleSaveSubEvent}
                                className="px-3 py-1 bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-white transition-colors"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingSubEvent(false);
                                  setNewSubEventName('');
                                }}
                                className="px-3 py-1 border border-[#333] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#222] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="col-span-2 sm:col-span-3 md:col-span-4 flex justify-end mt-2">
                              <button
                                type="button"
                                onClick={() => setIsAddingSubEvent(true)}
                                className="px-3 py-1 border border-[#333] hover:border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[#111] text-[10px] uppercase tracking-widest font-extrabold rounded-sm transition-all flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Sub-Event
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Event Pricing Config Cards */}
                      {editorData.selectedEvents.length > 0 && (
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block border-b border-[#222] pb-1">Configure Services per Sub-Event</label>
                          <div className="space-y-4">
                            {editorData.selectedEvents.map(evt => {
                              const config = editorData.eventConfigs[evt] || {};
                              const services = config.services || {};
                              
                              return (
                                <div key={evt} className="p-4 border border-[#222] bg-[#0a0a0a] rounded-sm space-y-4">
                                  {/* Sub-event Name and Duration Selector */}
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1c1c1c] pb-3">
                                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"></span>
                                      {evt}
                                    </h5>
                                    
                                    <div className="flex items-center gap-3">
                                      <span className="text-[9px] uppercase tracking-widest text-[#555] font-bold">Duration:</span>
                                      <div className="flex gap-1 bg-[#111] p-0.5 border border-[#222] rounded-sm">
                                        {['Half Day', 'Full Day'].map(dur => (
                                          <button
                                            key={dur}
                                            type="button"
                                            onClick={() => handleEditorDurationChange(evt, dur)}
                                            className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold transition-all rounded-sm ${
                                              config.duration === dur
                                                ? 'bg-[var(--color-gold)] text-black'
                                                : 'text-[#777] hover:text-white'
                                            }`}
                                          >
                                            {dur}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Option Input */}
                                  <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-[#555] font-bold block">Event Option / Remarks (e.g. "Haldi Subject: Bride")</label>
                                    <input 
                                      type="text"
                                      placeholder="Specify sub-event details if any..."
                                      value={config.option || ''}
                                      onChange={(e) => handleEditorOptionChange(evt, e.target.value)}
                                      className="w-full bg-[#141414] border border-[#222] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--color-gold)]/60 rounded-sm"
                                    />
                                  </div>

                                  {/* Services Grid list */}
                                  <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-widest text-[#555] font-bold block mb-1">Select Photography & Videography Coverage</label>
                                    
                                    <div className="overflow-x-auto border border-[#1a1a1a]">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="bg-[#0f0f0f] border-b border-[#1c1c1c] text-[#555] text-[9px] uppercase tracking-widest font-bold">
                                            <th className="p-2 w-12 text-center">Enable</th>
                                            <th className="p-2">Service Name</th>
                                            <th className="p-2 w-20 text-center">Qty</th>
                                            <th className="p-2 w-32 text-right">Unit Price (₹)</th>
                                            <th className="p-2 w-32 text-right">Subtotal</th>
                                            <th className="p-2 w-12 text-center">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Array.from(new Set([...STANDARD_SERVICES, ...Object.keys(services)])).map(svc => {
                                            const svcConfig = services[svc] || { qty: 0, price: getStandardPrice(svc, config.duration) };
                                            const isSelected = svcConfig.qty > 0;
                                            
                                            return (
                                              <tr key={svc} className={`border-b border-[#1c1c1c] transition-colors ${isSelected ? 'bg-[#141414]/30' : 'opacity-60'}`}>
                                                <td className="p-2 text-center">
                                                  <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => handleEditorServiceToggle(evt, svc, e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded-sm bg-[#1a1a1a] border-[#333] text-[var(--color-gold)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                  />
                                                </td>
                                                <td className="p-2 font-semibold text-white">{svc}</td>
                                                <td className="p-2">
                                                  <input 
                                                    type="number"
                                                    disabled={!isSelected}
                                                    min="1"
                                                    value={svcConfig.qty || ''}
                                                    onChange={(e) => handleEditorServiceQtyChange(evt, svc, e.target.value)}
                                                    className="w-full bg-[#111] border border-[#222] text-center py-1 text-xs text-white focus:outline-none focus:border-[var(--color-gold)]/60 disabled:opacity-30 rounded-sm font-mono"
                                                    placeholder="0"
                                                  />
                                                </td>
                                                <td className="p-2">
                                                  <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#555] font-mono">₹</span>
                                                    <input 
                                                      type="number"
                                                      disabled={!isSelected}
                                                      min="0"
                                                      value={svcConfig.price || ''}
                                                      onChange={(e) => handleEditorServicePriceChange(evt, svc, e.target.value)}
                                                      className="w-full bg-[#111] border border-[#222] text-right py-1 pl-5 pr-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)]/60 disabled:opacity-30 rounded-sm font-mono"
                                                      placeholder={getStandardPrice(svc, config.duration).toString()}
                                                    />
                                                  </div>
                                                </td>
                                                <td className="p-2 text-right font-mono font-bold text-white pr-4">
                                                  {isSelected ? `₹${(svcConfig.qty * svcConfig.price).toLocaleString()}/-` : '₹0/-'}
                                                </td>
                                                <td className="p-2 text-center">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveStandardService(svc)}
                                                    className="p-1 text-[#777] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title={`Delete coverage service "${svc}"`}
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>

                                    {isAddingStandardService ? (
                                      <div className="flex gap-2 items-center bg-[#0c0c0c] p-2 border border-[#222] rounded-sm mt-2">
                                        <input
                                          type="text"
                                          placeholder="New coverage service (e.g. Cranes)"
                                          value={newStandardServiceName}
                                          onChange={(e) => setNewStandardServiceName(e.target.value)}
                                          className="flex-1 bg-[#111] border border-[#333] px-3 py-1 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={handleSaveStandardService}
                                          className="px-3 py-1 bg-[var(--color-gold)] text-black text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-white transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsAddingStandardService(false);
                                            setNewStandardServiceName('');
                                          }}
                                          className="px-3 py-1 border border-[#333] text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-[#222] transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex justify-end mt-2">
                                        <button
                                          type="button"
                                          onClick={() => setIsAddingStandardService(true)}
                                          className="px-3 py-1 border border-[#333] hover:border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[#111] text-[10px] uppercase tracking-widest font-extrabold rounded-sm transition-all flex items-center gap-1.5"
                                        >
                                          <Plus className="w-3 h-3" /> Add Service Option
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Albums & Deliverables Selection */}
                  {editorStep === 3 && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-[#222] pb-2">
                        <h4 className="text-sm font-heading text-[var(--color-gold)] uppercase tracking-wider font-serif">Step 3: Albums & Deliverables Selection</h4>
                        <span className="text-[10px] text-[#777] uppercase tracking-widest font-bold">Base Price: <strong className="text-[var(--color-gold)] font-mono">₹{editorData.estimatedPrice.toLocaleString()}/-</strong></span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pre-wedding style dropdown */}
                        <div className="p-4 border border-[#222] bg-[#0a0a0a] rounded-sm space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-bold block border-b border-[#1c1c1c] pb-2 font-serif">Pre-Wedding Style</label>
                          
                          <div className="space-y-3">
                            <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Style Package</label>
                            <select
                              value={editorData.preWedding.style || ''}
                              onChange={(e) => handleEditorPreWeddingChange(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                            >
                              <option value="">None (No Pre-Wedding)</option>
                              <option value="Conceptual Pre-Wedding">Conceptual Pre-Wedding</option>
                              <option value="Freestyle Pre-Wedding">Freestyle Pre-Wedding</option>
                              <option value="Basic Pre-Wedding">Basic Pre-Wedding</option>
                            </select>
                          </div>

                          {editorData.preWedding.style && (
                            <div className="space-y-2">
                              <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Custom Package Cost (₹)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#555] font-mono">₹</span>
                                <input 
                                  type="number"
                                  min="0"
                                  value={editorData.preWedding.cost}
                                  onChange={(e) => handleEditorPreWeddingCostChange(e.target.value)}
                                  className="w-full bg-[#111] border border-[#222] py-2 pl-6 pr-3 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Post-Production Editing dropdown */}
                        <div className="p-4 border border-[#222] bg-[#0a0a0a] rounded-sm space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-bold block border-b border-[#1c1c1c] pb-2 font-serif">Post-Production Film Style</label>
                          
                          <div className="space-y-3">
                            <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Video Editing Style</label>
                            <select
                              value={editorData.postProduction.editing || ''}
                              onChange={(e) => handleEditorPostProdChange(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                            >
                              <option value="">None (Standard Reel/Film)</option>
                              <option value="Documentary Style Wedding Film">Documentary Style Wedding Film</option>
                            </select>
                          </div>

                          {editorData.postProduction.editing && (
                            <div className="space-y-2">
                              <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Custom Film Cost (₹)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#555] font-mono">₹</span>
                                <input 
                                  type="number"
                                  min="0"
                                  value={editorData.postProduction.cost}
                                  onChange={(e) => handleEditorPostProdCostChange(e.target.value)}
                                  className="w-full bg-[#111] border border-[#222] py-2 pl-6 pr-3 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Photo Album configurations */}
                        <div className="p-4 border border-[#222] bg-[#0a0a0a] rounded-sm space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-bold block border-b border-[#1c1c1c] pb-2 font-serif">Premium Photo Album</label>
                          
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Album Quality / Style</label>
                            <select
                              value={editorData.album.albumType || ''}
                              onChange={(e) => handleEditorAlbumChange(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm"
                            >
                              <option value="">None (No Album Deliverable)</option>
                              <option value="Basic Album (30 Sheets)">Basic Album (30 Sheets)</option>
                              <option value="Standard Album (50 Sheets)">Standard Album (50 Sheets)</option>
                              <option value="Premium Album (80 Sheets)">Premium Album (80 Sheets)</option>
                            </select>
                          </div>

                          {editorData.album.albumType && (
                            <>
                              <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Additional Sheets Count</label>
                                <input 
                                  type="number"
                                  min="0"
                                  value={editorData.album.sheets}
                                  onChange={(e) => handleEditorAlbumSheetsChange(e.target.value)}
                                  className="w-full bg-[#111] border border-[#222] py-2 px-3 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm font-mono"
                                  placeholder="e.g. 10 sheets"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Total Album Deliverable Cost (₹)</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#555] font-mono">₹</span>
                                  <input 
                                    type="number"
                                    min="0"
                                    value={editorData.album.cost}
                                    onChange={(e) => handleEditorAlbumCostChange(e.target.value)}
                                    className="w-full bg-[#111] border border-[#222] py-2 pl-6 pr-3 text-xs text-white focus:outline-none focus:border-[var(--color-gold)] rounded-sm font-mono"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Add-ons Configurations */}
                      <div className="space-y-3 border-t border-[#1c1c1c] pt-4">
                        <label className="text-[10px] uppercase tracking-widest text-[#777] font-bold block">Luxury Event Extras & Add-Ons</label>
                        
                        <div className="overflow-x-auto border border-[#1a1a1a]">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-[#0f0f0f] border-b border-[#1c1c1c] text-[#555] text-[9px] uppercase tracking-widest font-bold">
                                <th className="p-2 w-12 text-center">Enable</th>
                                <th className="p-2">Add-On Deliverable</th>
                                <th className="p-2 w-24 text-center">Quantity</th>
                                <th className="p-2 w-36 text-right">Package Cost (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const names = {
                                  instantReels: 'Event Instant Reels (Delivered same day)',
                                  cinematicReels: 'Cinematic Reels (Post-produced high quality)',
                                  ledScreen: 'Premium LED Screen (8x12 1 Screen or 6x8 2 Screens)',
                                  ytLiveFull: 'YouTube Live Streaming (Full Day coverage)',
                                  ytLiveHalf: 'YouTube Live Streaming (Half Day coverage)'
                                };
                                return Object.keys(editorData.addOns).map(key => {
                                  const addon = editorData.addOns[key] || {};
                                  const isSelected = addon.selected;
                                  const showQty = key === 'instantReels' || key === 'cinematicReels';
                                  
                                  return (
                                    <tr key={key} className={`border-b border-[#1c1c1c] transition-colors ${isSelected ? 'bg-[#141414]/30' : 'opacity-60'}`}>
                                      <td className="p-2 text-center">
                                        <input 
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => handleEditorAddonToggle(key, e.target.checked)}
                                          className="w-3.5 h-3.5 rounded-sm bg-[#1a1a1a] border-[#333] text-[var(--color-gold)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                        />
                                      </td>
                                      <td className="p-2 font-semibold text-white">{names[key]}</td>
                                      <td className="p-2 text-center">
                                        {showQty ? (
                                          <input 
                                            type="number"
                                            disabled={!isSelected}
                                            min="1"
                                            value={addon.qty}
                                            onChange={(e) => handleEditorAddonQtyChange(key, e.target.value)}
                                            className="w-full bg-[#111] border border-[#222] text-center py-1 text-xs text-white focus:outline-none focus:border-[var(--color-gold)]/60 disabled:opacity-30 rounded-sm font-mono"
                                          />
                                        ) : (
                                          <span className="text-[#555] font-mono">-</span>
                                        )}
                                      </td>
                                      <td className="p-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#555] font-mono">₹</span>
                                          <input 
                                            type="number"
                                            disabled={!isSelected}
                                            min="0"
                                            value={addon.cost}
                                            onChange={(e) => handleEditorAddonCostChange(key, e.target.value)}
                                            className="w-full bg-[#111] border border-[#222] text-right py-1 pl-5 pr-2 text-xs text-white focus:outline-none focus:border-[var(--color-gold)]/60 disabled:opacity-30 rounded-sm font-mono"
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Discount & Financial Proposal Summary */}
                  {editorStep === 4 && (
                    <div className="space-y-6">
                      <div className="border-b border-[#222] pb-2">
                        <h4 className="text-sm font-heading text-[var(--color-gold)] uppercase tracking-wider font-serif">Step 4: Discount & Financial Proposal Summary</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Side: Discount Editor */}
                        <div className="p-4 border border-[#222] bg-[#0a0a0a] rounded-sm space-y-4">
                          <label className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-bold block border-b border-[#1c1c1c] pb-2">Administrative Discount</label>
                          
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Discount Type</label>
                            <div className="flex gap-2">
                              {['amount', 'percentage'].map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setEditorData(prev => ({ ...prev, discountType: type, discountValue: 0 }))}
                                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border transition-colors rounded-sm ${
                                    editorData.discountType === type
                                      ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]'
                                      : 'bg-transparent text-white border-[#222] hover:border-[#444]'
                                  }`}
                                >
                                  {type === 'amount' ? 'Flat Amount (₹)' : 'Percentage (%)'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">
                              {editorData.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--color-gold)] font-bold">
                                {editorData.discountType === 'percentage' ? '%' : '₹'}
                              </span>
                              <input 
                                type="number" 
                                min="0"
                                max={editorData.discountType === 'percentage' ? 100 : editorData.estimatedPrice}
                                placeholder={editorData.discountType === 'percentage' ? 'e.g. 10' : 'e.g. 20000'}
                                value={editorData.discountValue || ''}
                                onChange={(e) => setEditorData(prev => ({ ...prev, discountValue: e.target.value }))}
                                className="w-full bg-[#111] border border-[#222] pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] font-mono rounded-sm"
                              />
                            </div>
                            <p className="text-[9px] text-[#555]">
                              Add discounts directly inside the wizard. Both the client and the admin will receive the updated estimate in the generated proposal PDF.
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Math Breakdown & Net Pricing */}
                        {(() => {
                          const parsedVal = parseFloat(editorData.discountValue) || 0;
                          const calculatedDiscount = editorData.discountType === 'percentage'
                            ? Math.round((editorData.estimatedPrice * parsedVal) / 100)
                            : parsedVal;
                          const netEstimate = Math.max(0, editorData.estimatedPrice - calculatedDiscount);
                          
                          return (
                            <div className="p-5 border border-[#222] bg-[#000] rounded-sm space-y-4 flex flex-col justify-between">
                              <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-bold block border-b border-[#1c1c1c] pb-2 font-serif">Financial Breakdown Summary</label>
                                
                                <div className="flex justify-between text-xs">
                                  <span className="text-[#777]">Base Package Subtotal:</span>
                                  <span className="font-mono text-white">₹{editorData.estimatedPrice.toLocaleString()}/-</span>
                                </div>

                                <div className="flex justify-between text-xs">
                                  <span className="text-[#777]">Applied Discount:</span>
                                  <span className="font-mono text-[#22c55e] font-semibold">
                                    -₹{calculatedDiscount.toLocaleString()}/-
                                    {editorData.discountType === 'percentage' && parsedVal > 0 && ` (${parsedVal}%)`}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-[#1c1c1c] pt-4 mt-4 space-y-1">
                                <span className="text-[9px] text-[#555] uppercase tracking-widest block font-bold">New Final Estimate</span>
                                <span className="text-3xl font-bold text-[var(--color-gold)] font-mono block">₹{netEstimate.toLocaleString()}/-</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Selected Event Details Quick Summary */}
                      <div className="p-4 border border-[#222] bg-[#090909] rounded-sm space-y-2 text-xs">
                        <label className="text-[9px] uppercase tracking-widest text-[#777] font-bold block">Quotation Summary Review</label>
                        <p className="text-[#a1a1a1] leading-relaxed font-sans">
                          This action will {editingQuote ? 'update and overwrite the existing quotation lead' : 'create and file a new administrative quotation lead'} for <strong className="text-white">{editorData.customerName}</strong>. 
                          Upon saving, our high-luxury PDF proposal engine will run in the background, compile the customized events and overrides, compile standard terms, and dispatch revised copies automatically via email.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="border-t border-[#222] p-5 flex justify-between items-center bg-[#0a0a0a]">
                  <div>
                    {editorStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setEditorStep(prev => prev - 1)}
                        className="px-4 py-2 border border-[#333] text-white hover:bg-[#222] transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-bold rounded-sm"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditorOpen(false);
                        setEditingQuote(null);
                      }}
                      className="px-4 py-2 border border-[#333] text-white hover:bg-[#222] transition-colors text-xs uppercase tracking-widest font-bold rounded-sm"
                    >
                      Cancel
                    </button>

                    {editorStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (editorStep === 1) {
                            if (!editorData.customerName || !editorData.email || !editorData.phone || !editorData.eventDate || !editorData.location) {
                              addToast('Please fill out all required client details', 'error');
                              return;
                            }
                          } else if (editorStep === 2) {
                            if (editorData.selectedEvents.length === 0) {
                              addToast('Please select at least one sub-event to cover', 'error');
                              return;
                            }
                          }
                          setEditorStep(prev => prev + 1);
                        }}
                        className="px-4 py-2 bg-[var(--color-gold)] text-black hover:bg-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm"
                      >
                        Next <ChevronRight className="w-4 h-4 stroke-[3px]" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveQuote}
                        disabled={isSavingQuote}
                        className="px-5 py-2 bg-[var(--color-gold)] text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-xs uppercase tracking-widest font-extrabold rounded-sm"
                      >
                        {isSavingQuote ? (
                          'Saving Proposal...'
                        ) : (
                          <>
                            <Award className="w-4 h-4" /> {editingQuote ? 'Update & Email PDF' : 'Save & Email PDF'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
