import { useState, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Check, ArrowRight, ArrowLeft, Camera, Film, Sun, Sparkles, Heart, Star, Compass, Music, Flame, Award, HelpCircle, Phone, MessageSquare, ClipboardList, Clock, MapPin, Calendar, User, Mail, DollarSign, FileText } from 'lucide-react';
import { usePricingStore } from '../store/pricingStore';
import { useBookingStore } from '../store/bookingStore';
import { useToastStore } from '../store/toastStore';
import { useSettingStore } from '../store/settingStore';

// Map of events to beautiful luxury SVGs (fallback until PNGs are provided)
const eventIconMap = {
  'ENGAGEMENT': Heart,
  'PRE-WEDDING': Sparkles,
  'HALDI': Flame,
  'MEHENDI': Sparkles,
  'SANGEET': Music,
  'PELLIKODUKU EVENT': Star,
  'PELLIKUTURU EVENT': Sun,
  'GODUMRAI': Compass,
  'BRIDE-TO-BE': Award,
  'GROOM-TO-BE': Compass,
  'COCKTAIL PARTY': Star,
  'RECEPTION': Award,
  'WEDDING': Heart,
  'VRATHAM': ClipboardList,
  'ADDITIONAL EVENT': Star
};

// Map of sub-services to luxury icons
const subServiceIconMap = {
  'Candid + Cinematic': Film,
  'Cinematic Video': Film,
  'Traditional Videography': Film,
  'Candid Photography': Camera,
  'Traditional Photography': Camera,
  'Drone': Compass,
  'FPV Drone': Compass,
  '360° VR Coverage': Sparkles
};

const pngFilenameMap = {
  'ENGAGEMENT': 'engagement',
  'PRE-WEDDING': 'pre-wedding',
  'HALDI': 'haldi',
  'MEHENDI': 'mehendi',
  'SANGEET': 'dancing',
  'PELLIKODUKU EVENT': 'pellikoduku',
  'PELLIKUTURU EVENT': 'pellikuturu',
  'GODUMRAI': 'avatar',
  'BRIDE-TO-BE': 'bride-to-be',
  'GROOM-TO-BE': 'groom-to-be',
  'COCKTAIL PARTY': 'cocktail-party',
  'RECEPTION': 'reception',
  'WEDDING': 'wedding',
  'VRATHAM': 'avatar',
  'ADDITIONAL EVENT': 'additional-event',

  // Sub-services
  'Candid + Cinematic': 'cinematic-video',
  'Cinematic Video': 'cinematic-video',
  'Traditional Videography': 'traditional-videography',
  'Candid Photography': 'candid-photography',
  'Traditional Photography': 'traditional-photography',
  'Drone': 'drone',
  'FPV Drone': 'fpv-drone',
  '360° VR Coverage': '360-vr-coverage'
};

const EVENT_SERVICES_MAP = {
  'ENGAGEMENT': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', 'Drone', 'FPV Drone', '360° VR Coverage'
  ],
  'PRE-WEDDING': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', 'Drone', 'FPV Drone', '360° VR Coverage'
  ],
  'GODUMRAI': [
    'Traditional Photography', 'Traditional Videography', 'Candid Photography', 'Cinematic Video'
  ],
  'HALDI': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', 'Drone', 'FPV Drone', '360° VR Coverage'
  ],
  'MEHENDI': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', '360° VR Coverage'
  ],
  'SANGEET': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', 'Drone', 'FPV Drone', '360° VR Coverage'
  ],
  'PELLIKODUKU EVENT': [
    'Traditional Photography', 'Traditional Videography', 'Candid Photography', 'Cinematic Video'
  ],
  'PELLIKUTURU EVENT': [
    'Traditional Photography', 'Traditional Videography', 'Candid Photography', 'Cinematic Video'
  ],
  'BRIDE-TO-BE': [
    'Candid Photography', 'Cinematic Video'
  ],
  'GROOM-TO-BE': [
    'Candid Photography', 'Cinematic Video'
  ],
  'COCKTAIL PARTY': [
    'Candid Photography', 'Cinematic Video'
  ],
  'WEDDING': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', 'Drone', 'FPV Drone', '360° VR Coverage'
  ],
  'VRATHAM': [
    'Traditional Photography', 'Traditional Videography'
  ],
  'RECEPTION': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', 'Drone', 'FPV Drone', '360° VR Coverage'
  ],
  'ADDITIONAL EVENT': [
    'Traditional Photography', 'Traditional Videography', 
    'Candid Photography', 'Cinematic Video', 'Drone', 'FPV Drone', '360° VR Coverage'
  ]
};

const SERVICE_DESCRIPTIONS = {
  'Candid + Cinematic': 'A premium hybrid coverage capturing natural, unscripted emotions via Candid Photography alongside a movie-like Cinematic Video experience.',
  'Cinematic Video': 'A movie-like filming style that captures emotions, moments, and celebrations with creative visuals, smooth camera movements, and cinematic storytelling.',
  'Traditional Videography': 'Complete event coverage that captures all rituals, ceremonies, and important moments in a clear and natural style.',
  'Candid Photography': 'Natural and emotion-filled photography that captures real moments, genuine expressions, and beautiful memories without forced poses.',
  'Traditional Photography': 'Classic event photography focused on capturing important moments, rituals, family portraits, and guest memories in a clear and timeless style.',
  'Drone': 'Aerial cinematic shots that capture the venue, crowd, decorations, and event atmosphere from unique and visually stunning perspectives.',
  'FPV Drone': 'Dynamic and immersive drone shots captured with high-speed cinematic movements, creating a unique flying perspective and energetic visual experience.',
  '360° VR Coverage': 'An immersive video experience that captures every angle of the event, allowing you to relive moments in a fully interactive and realistic view through a VR headset.'
};



const DynamicIcon = ({ name, isSelected, fallback: FallbackIcon, size = 'md' }) => {
  const [useFallback, setUseFallback] = useState(false);
  const mappedName = pngFilenameMap[name] || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const pngUrl = `/icons/${mappedName}.png`;
  let iconSize = size === 'sm' ? 'w-9 h-9' : 'w-16 h-16';
  
  // Custom override for Additional Event PNG to appear larger
  if (name === 'ADDITIONAL EVENT' && size !== 'sm') {
    iconSize = 'w-24 h-24 -mt-2 -mb-2';
  }

  if (useFallback) {
    return (
      <FallbackIcon 
        className={`${iconSize} transition-all duration-500 transform group-hover:scale-110 ${
          isSelected ? 'text-[var(--color-gold)] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'text-white'
        }`}
      />
    );
  }

  return (
    <div 
      style={{
        maskImage: `url(${pngUrl})`,
        WebkitMaskImage: `url(${pngUrl})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
      className={`${iconSize} transition-all duration-500 transform group-hover:scale-110 ${
        isSelected ? 'bg-[var(--color-gold)] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'bg-white'
      }`}
    >
      <img 
        src={pngUrl} 
        alt="" 
        className="hidden" 
        onError={() => setUseFallback(true)} 
      />
    </div>
  );
};

const PRE_WEDDING_PACKAGES = [
  {
    name: 'Basic Pre-Wedding',
    subtitle: 'Natural • Candid • Theme-based',
    price: 30000,
    description: 'A simple one-day shoot designed around a unique theme. We capture a mix of natural moments and light freestyle interactions, creating a clean and elegant visual experience. It combines minimal direction with real expressions, resulting in a beautiful blend of style and authenticity.',
    bullets: ['1 day shoot', 'Photoshoot', '1-2 min Video']
  },
  {
    name: 'Freestyle Pre-Wedding',
    subtitle: 'Natural • Candid • Theme-based',
    price: 70000,
    description: 'A fun and natural pre-wedding experience where the couple and our team travel together like a casual trip. We capture spontaneous moments, joyful interactions and real emotions, with outfits chosen based on the location. No scripts, no pressure — just genuine chemistry, natural sounds and a beautiful blend of travel, love and memories.',
    bullets: ['2–3 days shoot', '2–4 min video', 'Save the Date video', 'Photoshoot included']
  },
  {
    name: 'Conceptual Pre-Wedding',
    subtitle: 'Cinematic story-based experience',
    price: 120000,
    description: 'We understand your story, emotions, memories and build a personalized concept with complete pre-planning of locations, costumes and scenes. The result is a cinematic love story that feels real, timeless and deeply personal — even years later.',
    bullets: ['4–5 days shoot', '5–7 min song video', 'Save the Date (promo style)', 'Photoshoot included']
  }
];

const POST_PRODUCTION_PACKAGES = [
  {
    name: 'Standard Wedding Film',
    subtitle: 'Standard Style (Included)',
    price: 0,
    description: 'Includes all standard editing layouts at NO additional cost:\n\n• Standard Wedding Film: Full-length wedding archive with simple, clean edits.\n• Wedding Highlights Film: Creative cinematic montage capturing core emotional landmarks.\n• Promo Cut: Energetic, short, social-media-ready teaser.\n• Traditional Video: Complete chronologically archived coverage.'
  },
  {
    name: 'Documentary Style Wedding Film',
    subtitle: 'Netflix-Style Wedding Documentary',
    price: 20000,
    description: 'A 15 to 20-minute cinematic wedding documentary crafted in a Netflix-style storytelling format. This film is designed to capture not just the wedding, but the real emotions, memories, relationships, and atmosphere surrounding your special day.\n\nThe film includes emotional interview sessions with parents, friends, cousins, bride, and groom, beautifully woven together with candid moments, natural ambience sounds, heartfelt conversations, laughter, silence, and pure emotions.\n\nEdited in a cinematic non-linear storytelling style, the film creates an immersive emotional experience rather than a regular wedding video. Every scene is carefully designed to feel timeless and deeply personal.\n\nYears may pass, cameras and technology may change, but real emotions never become old. This documentary film is created to preserve those unforgettable memories and feelings for generations to relive forever.'
  }
];

const ALBUM_PACKAGES = [
  {
    name: 'Basic Album (30 Sheets)',
    price: 15000,
    description: 'A beautifully designed wedding album featuring the best selected moments from your special day. Crafted with elegant layouts, quality printing, and clean presentation to reserve your memories in a simple and timeless style.',
    gifts: ['Wall Photo Calendar']
  },
  {
    name: 'Standard Album (50 Sheets)',
    price: 25000,
    description: 'A beautifully designed wedding album with detailed coverage of rituals, candid emotions, family moments, and celebrations. Designed with creative layouts, enhanced page designs, and high-quality finishing for a rich and memorable experience.',
    gifts: ['Wall Photo Calendar', 'Photo Frame']
  },
  {
    name: 'Premium Album (80 Sheets)',
    price: 40000,
    description: 'Luxury wedding album designed with rich premium layouts, complete event storytelling, candid emotions, rituals, and grand presentation quality. The album will be delivered as two separate album books (Part 1 & Part 2) presented inside a premium luxury designer box.',
    gifts: ['Table Photo Calendar', 'Pocket Album', 'Premium Acrylic Photo Frame']
  }
];

export default function QuoteWizard() {
  const { prices, fetchPrices, loading } = usePricingStore();
  const { addBooking } = useBookingStore();
  const { addToast } = useToastStore();
  const { settings, fetchSettings } = useSettingStore();

  const wizardRef = useRef(null);

  const [step, setStep] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState([]); // List of event names selected
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [eventConfigs, setEventConfigs] = useState({}); // { [eventName]: { duration: 'Half Day', services: {} } }
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [activeMobileCards, setActiveMobileCards] = useState({});
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  // Automatically scroll to the top of the page when navigating between steps or events
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, activeEventIndex]);

  
  // Custom packages selections
  const [selectedPreWedding, setSelectedPreWedding] = useState(null);
  const [preWeddingOption, setPreWeddingOption] = useState('both at same place');
  const [selectedPostProd, setSelectedPostProd] = useState(null);

  const [albumQuantities, setAlbumQuantities] = useState({});
  const [albumSheets, setAlbumSheets] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [selectedAddOns, setSelectedAddOns] = useState({
    instantReels: false,
    instantReelsQty: 5,
    cinematicReels: false,
    cinematicReelsQty: 5,
    ledScreen: false,
    ytLiveFull: false,
    ytLiveFullQty: 1,
    ytLiveHalf: false,
    ytLiveHalfQty: 1
  });

  const [hoveredSubService, setHoveredSubService] = useState(null); // For hover price displays

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    eventDate: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchPrices();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const eventsList = [
    'ENGAGEMENT', 'PRE-WEDDING', 'GODUMRAI', 'HALDI', 'MEHENDI', 'SANGEET', 'PELLIKODUKU EVENT',
    'PELLIKUTURU EVENT', 'BRIDE-TO-BE', 'GROOM-TO-BE', 'COCKTAIL PARTY', 'WEDDING',
    'VRATHAM', 'RECEPTION', 'ADDITIONAL EVENT'
  ];

  const handleEventToggle = (eventName) => {
    setSelectedEvents((prev) => {
      if (prev.includes(eventName)) {
        const next = prev.filter(e => e !== eventName);
        const newConfigs = { ...eventConfigs };
        delete newConfigs[eventName];
        setEventConfigs(newConfigs);
        return next;
      } else {
        const defaultOption = eventName === 'HALDI' ? 'Pellikoduku' : eventName === 'GODUMRAI' ? 'Bride' : undefined;
        const allowedServices = EVENT_SERVICES_MAP[eventName] || [];
        const initialServicesObj = {};
        allowedServices.forEach(s => {
          initialServicesObj[s] = 0; // starts at 0 quantity
        });

        setEventConfigs(prevConfigs => ({
          ...prevConfigs,
          [eventName]: { 
            duration: eventName === 'WEDDING' ? 'Full Day' : 'Half Day', 
            option: defaultOption,
            services: initialServicesObj 
          }
        }));
        return [...prev, eventName];
      }
    });
  };

  const handleEventDurationChange = (eventName, duration) => {
    setEventConfigs(prev => ({
      ...prev,
      [eventName]: { ...prev[eventName], duration }
    }));
  };

  const handleSubServiceQtyChange = (eventName, subServiceName, amount) => {
    setEventConfigs(prev => {
      const config = prev[eventName] || {};
      const services = config.services || {};
      const currentQty = services[subServiceName] || 0;
      const nextQty = Math.max(0, currentQty + amount);
      
      return {
        ...prev,
        [eventName]: {
          ...config,
          services: {
            ...services,
            [subServiceName]: nextQty
          }
        }
      };
    });
  };

  const handleEventOptionChange = (eventName, clickedOpt) => {
    setEventConfigs(prev => {
      const currentConfig = prev[eventName] || {};
      let currentOption = currentConfig.option || '';
      
      if (eventName === 'HALDI') {
        if (clickedOpt === 'Both at same place') {
          currentOption = currentOption === 'Both at same place' ? '' : 'Both at same place';
        } else {
          let activeOpts = [];
          if (currentOption && currentOption !== 'Both at same place') {
            activeOpts = currentOption.split(', ');
          }
          if (activeOpts.includes(clickedOpt)) {
            activeOpts = activeOpts.filter(o => o !== clickedOpt);
          } else {
            activeOpts.push(clickedOpt);
          }
          currentOption = activeOpts.join(', ');
        }
      } else if (eventName === 'GODUMRAI') {
        if (clickedOpt === 'Both') {
          currentOption = currentOption === 'Both' ? '' : 'Both';
        } else {
          let activeOpts = [];
          if (currentOption && currentOption !== 'Both') {
            activeOpts = currentOption.split(', ');
          }
          if (activeOpts.includes(clickedOpt)) {
            activeOpts = activeOpts.filter(o => o !== clickedOpt);
          } else {
            activeOpts.push(clickedOpt);
          }
          currentOption = activeOpts.join(', ');
        }
      } else {
        currentOption = clickedOpt;
      }

      return {
        ...prev,
        [eventName]: {
          ...currentConfig,
          option: currentOption || undefined
        }
      };
    });
  };


  const getSubServicePrice = (subServiceName, duration) => {
    const item = prices.find(p => p.serviceName === subServiceName && p.category === 'Event Coverage');
    if (!item) {
      const fallbacks = {
        'Candid + Cinematic': { base: 26500, full: 50000 },
        'Cinematic Video': { base: 14000, full: 26000 },
        'Traditional Videography': { base: 13000, full: 22000 },
        'Candid Photography': { base: 12500, full: 24000 },
        'Traditional Photography': { base: 8000, full: 16000 },
        'Drone': { base: 8000, full: 12000 },
        'FPV Drone': { base: 8000, full: 12000 },
        '360° VR Coverage': { base: 6000, full: 15000 }
      };
      const rate = fallbacks[subServiceName];
      if (!rate) return 0;
      return duration === 'Full Day' ? rate.full : rate.base;
    }
    return duration === 'Full Day' ? (item.fullDayPrice || item.basePrice) : item.basePrice;
  };

  const calculateTotal = () => {
    let total = 0;

    // 1. Event Coverages
    selectedEvents.forEach(evt => {
      const config = eventConfigs[evt];
      if (config && config.services) {
        Object.keys(config.services).forEach(subSvc => {
          const qty = config.services[subSvc] || 0;
          if (qty > 0) {
            total += qty * getSubServicePrice(subSvc, config.duration);
          }
        });
      }
    });


    // 2. Pre-Wedding Style
    if (selectedPreWedding) {
      const item = prices.find(p => p.serviceName === selectedPreWedding && p.category === 'Pre-Wedding Style');
      if (item) {
        total += item.basePrice;
      } else {
        total += selectedPreWedding === 'Conceptual Pre-Wedding' ? 120000 :
                 selectedPreWedding === 'Freestyle Pre-Wedding' ? 70000 :
                 selectedPreWedding === 'Basic Pre-Wedding' ? 30000 : 0;
      }
    }

    // 3. Post Production
    if (selectedPostProd) {
      const item = prices.find(p => p.serviceName === selectedPostProd && p.category === 'Post Production Editing');
      if (item) {
        total += item.basePrice;
      } else {
        total += selectedPostProd === 'Documentary Style Wedding Film' ? 20000 : 0;
      }
    }

    // 4. Albums & Extra Sheets
    Object.entries(albumQuantities).forEach(([albumName, qty]) => {
      const item = prices.find(p => p.serviceName === albumName && p.category === 'Photo Album');
      if (item) {
        total += item.basePrice * qty;
      } else {
        total += albumName === 'Basic Album (30 Sheets)' ? 15000 * qty :
                 albumName === 'Standard Album (50 Sheets)' ? 25000 * qty :
                 albumName === 'Premium Album (80 Sheets)' ? 40000 * qty : 0;
      }
    });
    if (albumSheets > 0) {
      const sheetPriceItem = prices.find(p => p.serviceName === 'Additional Sheets (Per Sheet)' && p.category === 'Photo Album');
      const sheetPrice = sheetPriceItem ? sheetPriceItem.basePrice : 500;
      total += albumSheets * sheetPrice;
    }

    // 5. Add-On Services
    if (selectedAddOns.instantReels) {
      const item = prices.find(p => p.serviceName === 'Event Instant Reels' && p.category === 'Add-On Services');
      const rate = item ? item.basePrice : 1000;
      total += selectedAddOns.instantReelsQty * rate;
    }
    if (selectedAddOns.cinematicReels) {
      const item = prices.find(p => p.serviceName === 'Cinematic Reels' && p.category === 'Add-On Services');
      const rate = item ? item.basePrice : 2000;
      total += selectedAddOns.cinematicReelsQty * rate;
    }
    if (selectedAddOns.ledScreen) {
      const item = prices.find(p => p.serviceName === 'LED Screen (8x12 1 or 6x8 2)' && p.category === 'Add-On Services');
      total += item ? item.basePrice : 20000;
    }
    if (selectedAddOns.ytLiveFull) {
      const item = prices.find(p => p.serviceName === 'YouTube Live (Full Day)' && p.category === 'Add-On Services');
      total += item ? item.basePrice : 15000;
    }
    if (selectedAddOns.ytLiveHalf) {
      const item = prices.find(p => p.serviceName === 'YouTube Live (Half Day)' && p.category === 'Add-On Services');
      total += item ? item.basePrice : 8000;
    }

    return total;
  };


  const calculateDeliveryTimeline = () => {
    let weeks = 6;
    if (selectedEvents.length > 3) weeks += 2;
    if (selectedPostProd?.includes('Documentary')) weeks += 2;
    if (Object.keys(albumQuantities).length > 0) weeks += 1;
    return `${weeks} - ${weeks + 3} Weeks`;
  };

  const getQuotationTerms = () => {
    return [
      "Quotation is valid for 30 days from date of submission.",
      "A 50% retainer fee is required to confirm and secure shoot dates.",
      "Balance 40% on shoot date, and final 10% upon digital deliverables approval.",
      "Travel, standard local logistics, outstation permits, and lodging are borne by the client.",
      "Astitva Creations holds copyright ownership for all generated photographic & cinematic assets."
    ];
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const triggerWhatsAppRedirect = (estimatedPrice, detailsSummary) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const pdfLinkText = createdBookingId ? `\n*Proposal PDF Download:* ${apiBaseUrl}/bookings/${createdBookingId}/pdf\n` : '';
    const whatsappMessage = encodeURIComponent(
      `Hi Astitva Creations!\nI just calculated a custom quote on your website:\n\n` +
      `*Name:* ${formData.customerName}\n` +
      `*Location:* ${formData.location}\n` +
      `*Date:* ${formData.eventDate}\n\n` +
      detailsSummary +
      pdfLinkText
    );
    
    // Dynamically retrieve, clean, and format the WhatsApp phone number from settings
    const rawNumber = settings?.whatsappNumber || '919505878486';
    let cleanedNumber = rawNumber.replace(/[^0-9]/g, '');
    if (cleanedNumber.length === 10) {
      cleanedNumber = '91' + cleanedNumber;
    }
    
    window.open(`https://wa.me/${cleanedNumber}?text=${whatsappMessage}`, '_blank');
  };

  const handlePrintPDF = async () => {
    setIsDownloading(true);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (createdBookingId) {
      const link = document.createElement('a');
      link.href = `${apiBaseUrl}/bookings/${createdBookingId}/pdf`;
      link.download = `Astitva_Creations_Proposal.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Premium PDF proposal compiled and downloaded!', 'success');
    } else {
      addToast('Generating your premium PDF proposal preview...', 'info');

      // Compile booking payload dynamically
      const activeAddons = {};
      if (selectedAddOns.instantReels) {
        activeAddons.instantReels = {
          selected: true,
          name: 'Event Instant Reels',
          qty: selectedAddOns.instantReelsQty,
          cost: selectedAddOns.instantReelsQty * 1000
        };
      }
      if (selectedAddOns.cinematicReels) {
        activeAddons.cinematicReels = {
          selected: true,
          name: 'Cinematic Reels',
          qty: selectedAddOns.cinematicReelsQty,
          cost: selectedAddOns.cinematicReelsQty * 2000
        };
      }
      if (selectedAddOns.ledScreen) {
        activeAddons.ledScreen = {
          selected: true,
          name: 'LED Screen',
          qty: 1,
          cost: 20000
        };
      }
      if (selectedAddOns.ytLiveFull) {
        activeAddons.ytLiveFull = {
          selected: true,
          name: 'YouTube Live (Full Day)',
          qty: 1,
          cost: 15000
        };
      }
      if (selectedAddOns.ytLiveHalf) {
        activeAddons.ytLiveHalf = {
          selected: true,
          name: 'YouTube Live (Half Day)',
          qty: 1,
          cost: 8000
        };
      }

      const preWeddingCost = selectedPreWedding ? (
        prices.find(p => p.serviceName === selectedPreWedding && p.category === 'Pre-Wedding Style')?.basePrice ||
        (selectedPreWedding === 'Conceptual Pre-Wedding' ? 120000 :
         selectedPreWedding === 'Freestyle Pre-Wedding' ? 70000 :
         selectedPreWedding === 'Basic Pre-Wedding' ? 30000 : 0)
      ) : 0;
      const postProdCost = selectedPostProd ? (
        prices.find(p => p.serviceName === selectedPostProd && p.category === 'Post Production Editing')?.basePrice ||
        (selectedPostProd === 'Documentary Style Wedding Film' ? 20000 : 0)
      ) : 0;
      const albumBaseCost = Object.entries(albumQuantities).reduce((sum, [name, qty]) => {
        const p = prices.find(p => p.serviceName === name && p.category === 'Photo Album')?.basePrice ||
          (name === 'Basic Album (30 Sheets)' ? 15000 :
           name === 'Standard Album (50 Sheets)' ? 25000 :
           name === 'Premium Album (80 Sheets)' ? 40000 : 0);
        return sum + (p * qty);
      }, 0);
      const albumSheetsCost = albumSheets * (
        prices.find(p => p.serviceName === 'Additional Sheets (Per Sheet)' && p.category === 'Photo Album')?.basePrice || 500
      );

      const payloadEventConfigs = {};
      selectedEvents.forEach(evt => {
        const config = eventConfigs[evt];
        if (config) {
          const activeServices = {};
          Object.keys(config.services).forEach(subSvc => {
            const qty = config.services[subSvc];
            if (qty > 0) {
              activeServices[subSvc] = {
                qty,
                price: getSubServicePrice(subSvc, config.duration)
              };
            }
          });
          payloadEventConfigs[evt] = {
            duration: config.duration,
            option: config.option,
            services: activeServices
          };
        }
      });

      const estimatedPrice = calculateTotal();

      const bookingPayload = {
        customerName: formData.customerName || 'Premium Client',
        email: formData.email || 'client@astitvacreations.com',
        phone: formData.phone || 'N/A',
        eventDate: formData.eventDate || new Date(),
        location: formData.location || 'India',
        notes: formData.notes || '',
        selectedEvents,
        eventConfigs: payloadEventConfigs,
        preWedding: {
          style: selectedPreWedding,
          option: null,
          cost: preWeddingCost
        },
        postProduction: {
          editing: selectedPostProd,
          cost: postProdCost
        },
        album: {
          albumType: Object.entries(albumQuantities).map(([n, q]) => `${q}x ${n}`).join(', '),
          sheets: albumSheets,
          cost: albumBaseCost + albumSheetsCost
        },
        addOns: activeAddons,
        estimatedPrice,
        deliveryTimeline: calculateDeliveryTimeline(),
        terms: getQuotationTerms()
      };

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://astitva-creations.onrender.com/api');
        const response = await fetch(`${apiBaseUrl}/bookings/pdf-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload)
        });

        if (!response.ok) {
          throw new Error('Failed to generate PDF preview from server');
        }

        const blob = await response.blob();
        const fileURL = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `Astitva_Creations_Proposal_Preview.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileURL);
        
        addToast('Premium PDF proposal compiled and downloaded!', 'success');
      } catch (err) {
        console.error('PDF Preview Generation Error:', err);
        addToast('Could not compile PDF preview. Submitting and downloading fallback.', 'error');
        
        const el = document.getElementById('printable-proposal');
        if (el) el.style.display = 'block';
        const clientName = formData.customerName ? formData.customerName.replace(/\s+/g, '_') : 'Client';
        const oldTitle = document.title;
        document.title = `Astitva_Creations_Proposal_${clientName}`;
        setTimeout(() => {
          window.print();
          document.title = oldTitle;
          if (el) el.style.display = 'none';
        }, 150);
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Compile text summary for WhatsApp / fallback
    let detailsSummary = `*SELECTED SERVICES & CONFIGURATIONS*\n\n`;
    const sortedSelectedEvents = [...selectedEvents].sort((a, b) => {
      return eventsList.indexOf(a) - eventsList.indexOf(b);
    });

    sortedSelectedEvents.forEach(evt => {
      const config = eventConfigs[evt];
      if (config) {
        const subOptionText = config.option ? ` - ${config.option}` : '';
        detailsSummary += `• *${evt}* (${config.duration}${subOptionText})\n`;
        Object.keys(config.services).forEach(s => {
          const qty = config.services[s];
          if (qty > 0) {
            const unitPrice = getSubServicePrice(s, config.duration);
            detailsSummary += `  - ${s} [${qty}x] (₹${(qty * unitPrice).toLocaleString()}/-)\n`;
          }
        });
      }
    });

    if (selectedPreWedding) detailsSummary += `\n*Pre-Wedding Style:* ${selectedPreWedding}\n`;
    if (selectedPostProd) detailsSummary += `*Film Editing Style:* ${selectedPostProd}\n`;
    if (Object.keys(albumQuantities).length > 0) detailsSummary += `*Luxury Albums:* ${Object.entries(albumQuantities).map(([n, q]) => `${q}x ${n}`).join(', ')} (+${albumSheets} Sheets)\n`;

    let addOnsText = '';
    if (selectedAddOns.instantReels) addOnsText += `  - Instant Reels: ${selectedAddOns.instantReelsQty} Reels\n`;
    if (selectedAddOns.cinematicReels) addOnsText += `  - Cinematic Reels: ${selectedAddOns.cinematicReelsQty} Reels\n`;
    if (selectedAddOns.ledScreen) addOnsText += `  - LED Screen: Yes\n`;
    if (selectedAddOns.ytLiveFull) addOnsText += `  - YouTube Live (Full Day): Yes\n`;
    if (selectedAddOns.ytLiveHalf) addOnsText += `  - YouTube Live (Half Day): Yes\n`;

    if (addOnsText) detailsSummary += `\n*Add-On Options:*\n${addOnsText}`;

    const estimatedPrice = calculateTotal();
    detailsSummary += `\n*ESTIMATED TOTAL:* ₹${estimatedPrice.toLocaleString()}/-`;

    // Map addOns payload cleanly for backend Mongoose Schema
    const activeAddons = {};
    if (selectedAddOns.instantReels) {
      activeAddons.instantReels = {
        selected: true,
        name: 'Event Instant Reels',
        qty: selectedAddOns.instantReelsQty,
        cost: selectedAddOns.instantReelsQty * 1000
      };
    }
    if (selectedAddOns.cinematicReels) {
      activeAddons.cinematicReels = {
        selected: true,
        name: 'Cinematic Reels',
        qty: selectedAddOns.cinematicReelsQty,
        cost: selectedAddOns.cinematicReelsQty * 2000
      };
    }
    if (selectedAddOns.ledScreen) {
      activeAddons.ledScreen = {
        selected: true,
        name: 'LED Screen',
        qty: 1,
        cost: 20000
      };
    }
    if (selectedAddOns.ytLiveFull) {
      activeAddons.ytLiveFull = {
        selected: true,
        name: 'YouTube Live (Full Day)',
        qty: 1,
        cost: 15000
      };
    }
    if (selectedAddOns.ytLiveHalf) {
      activeAddons.ytLiveHalf = {
        selected: true,
        name: 'YouTube Live (Half Day)',
        qty: 1,
        cost: 8000
      };
    }

    const preWeddingCost = selectedPreWedding ? (
      prices.find(p => p.serviceName === selectedPreWedding && p.category === 'Pre-Wedding Style')?.basePrice ||
      (selectedPreWedding === 'Conceptual Pre-Wedding' ? 120000 :
       selectedPreWedding === 'Freestyle Pre-Wedding' ? 70000 :
       selectedPreWedding === 'Basic Pre-Wedding' ? 30000 : 0)
    ) : 0;
    const postProdCost = selectedPostProd ? (
      prices.find(p => p.serviceName === selectedPostProd && p.category === 'Post Production Editing')?.basePrice ||
      (selectedPostProd === 'Documentary Style Wedding Film' ? 20000 : 0)
    ) : 0;
    const albumBaseCost = Object.entries(albumQuantities).reduce((sum, [name, qty]) => {
      const p = prices.find(p => p.serviceName === name && p.category === 'Photo Album')?.basePrice ||
        (name === 'Basic Album (30 Sheets)' ? 15000 :
         name === 'Standard Album (50 Sheets)' ? 25000 :
         name === 'Premium Album (80 Sheets)' ? 40000 : 0);
      return sum + (p * qty);
    }, 0);
    const albumSheetsCost = albumSheets * (
      prices.find(p => p.serviceName === 'Additional Sheets (Per Sheet)' && p.category === 'Photo Album')?.basePrice || 500
    );

    const payloadEventConfigs = {};
    selectedEvents.forEach(evt => {
      const config = eventConfigs[evt];
      if (config) {
        const activeServices = {};
        Object.keys(config.services).forEach(subSvc => {
          const qty = config.services[subSvc];
          if (qty > 0) {
            activeServices[subSvc] = {
              qty,
              price: getSubServicePrice(subSvc, config.duration)
            };
          }
        });
        payloadEventConfigs[evt] = {
          duration: config.duration,
          option: config.option,
          services: activeServices
        };
      }
    });

    const bookingPayload = {
      customerName: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      eventDate: formData.eventDate || null,
      location: formData.location,
      notes: formData.notes,
      selectedEvents,
      eventConfigs: payloadEventConfigs,
      preWedding: {
        style: selectedPreWedding,
        option: null,
        cost: preWeddingCost
      },

      postProduction: {
        editing: selectedPostProd,
        cost: postProdCost
      },
      album: {
        albumType: Object.entries(albumQuantities).map(([n, q]) => `${q}x ${n}`).join(', '),
        sheets: albumSheets,
        cost: albumBaseCost + albumSheetsCost
      },
      addOns: activeAddons,
      estimatedPrice,
      deliveryTimeline: calculateDeliveryTimeline(),
      terms: getQuotationTerms()
    };

    try {
      const created = await addBooking(bookingPayload);
      if (created && created._id) {
        setCreatedBookingId(created._id);
      }
      addToast('Quotation successfully filed & recorded!', 'success');
      
      // Submit success - open success step
      setStep(9);
    } catch (error) {
      addToast(error.message || 'Submission failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-[var(--color-gold)] rounded-full animate-spin mx-auto"></div>
          <p className="text-[#777] uppercase tracking-widest text-xs animate-pulse">Initializing Luxury Canvas...</p>
        </div>
      </div>
    );
  }

  const stepsList = [
    'Events', 
    'Coverage', 
    'Pre-Wedding', 
    'Post-Prod', 
    'Albums', 
    'Add-ons', 
    'Client Info', 
    'Summary'
  ];

  return (
    <>
      <Helmet>
        <title>Cinematic Quote Builder | Astitva Creations</title>
      </Helmet>

      <div ref={wizardRef} className="min-h-screen pt-32 pb-24 bg-[#0B0B0B] text-white">
        <div className="max-w-4xl mx-auto px-4">
          
          <div className="mb-12 text-center">
            <span className="text-[var(--color-gold)] text-xs uppercase tracking-[0.4em] font-bold mb-3 block">Custom Pricing Canvas</span>
            <h1 className="font-heading text-4xl md:text-6xl text-[var(--color-gold)] mb-6">Build Your Quote</h1>
            <p className="text-gray-300 max-w-xl mx-auto text-sm leading-relaxed">
              Design a tailor-made coverage suite for your landmark celebrations. Every component is dynamically compiled to match your creative needs.
            </p>
          </div>

          {/* Upgraded 8-Step Luxury Stepper */}
          <div className="mb-12 max-w-3xl mx-auto">
            <div className="flex justify-between items-center relative before:absolute before:top-1/2 before:left-0 before:w-full before:h-[1px] before:bg-[#1f1f1f] before:-z-10">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                const evs = selectedEvents.filter(e => e !== 'PRE-WEDDING');
                const isStep2Disabled = i === 2 && evs.length === 0;
                const isStep3Disabled = i === 3 && !selectedEvents.includes('PRE-WEDDING');
                return (
                <div 
                  key={i} 
                  onClick={() => {
                    if (isStep2Disabled || isStep3Disabled) return;
                    if (i < step) setStep(i);
                  }}
                  className={`w-9 h-9 rounded-full flex flex-col items-center justify-center font-heading text-sm border transition-all duration-500 cursor-pointer ${
                    step >= i 
                      ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-bold' 
                      : (isStep2Disabled || isStep3Disabled) 
                        ? 'bg-transparent text-[#333] border-[#222] cursor-not-allowed'
                        : 'bg-[#0f0f0f] text-[#777] border-[#222] hover:border-[#444]'
                  }`}
                >
                  {i}
                </div>
              )})}
            </div>
            <div className="hidden sm:flex justify-between mt-3 px-1">
              {stepsList.map((st, idx) => {
                const isCurrent = step === idx + 1;
                const isCompleted = step > idx + 1;
                return (
                  <span 
                    key={st} 
                    className={`text-[8px] sm:text-[9px] uppercase tracking-widest transition-colors duration-300 font-sans ${
                      isCurrent 
                        ? 'text-[var(--color-gold)] font-black' 
                        : isCompleted 
                          ? 'text-white font-bold' 
                          : 'text-gray-500 font-semibold'
                    }`}
                  >
                    {st}
                  </span>
                );
              })}
            </div>
            
            {/* Mobile Active Step Text Banner */}
            <div className="text-center mt-4 sm:hidden">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-gold)] font-extrabold bg-[var(--color-gold)]/10 px-4 py-1.5 border border-[var(--color-gold)]/20 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                Step {step} of 8: {stepsList[step - 1]}
              </span>
            </div>

          </div>

          <div className="bg-[#111] border border-[#1a1a1a] p-8 md:p-12 shadow-3xl rounded-sm relative">
            {/* Estimated Quote Removed as requested */}
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Event Selection */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="border-b border-[#222] pb-4">
                    <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">1. Select Your Events</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Choose all celebrations you wish to cover</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {eventsList.map((evt) => {
                      const isSelected = selectedEvents.includes(evt);
                      
                      return (
                        <motion.div 
                          key={evt}
                          whileHover={{ y: -3 }}
                          onClick={() => handleEventToggle(evt)}
                          className={`group p-6 border cursor-pointer transition-all duration-500 flex flex-col items-center justify-center text-center rounded-sm gap-4 ${
                            isSelected 
                              ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5' 
                              : 'border-[#1a1a1a] bg-[#0c0c0c] hover:border-[#333]'
                          }`}
                        >
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <DynamicIcon 
                              name={evt}
                              isSelected={isSelected}
                              fallback={eventIconMap[evt] || HelpCircle}
                            />
                          </div>
                          <span className={`text-xs md:text-sm font-heading tracking-[0.2em] transition-colors duration-500 ${
                            isSelected ? 'text-[var(--color-gold)]' : 'text-gray-300 group-hover:text-white'
                          }`}>{evt}</span>
                        </motion.div>
                      );
                    })}
                  </div>

                </motion.div>
              )}
              {/* STEP 2: Configure Coverage */}


              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-10">
                  {(() => {
                    const sortedSelectedEvents = [...selectedEvents].filter(e => e !== 'PRE-WEDDING').sort((a, b) => eventsList.indexOf(a) - eventsList.indexOf(b));
                    const validIndex = Math.min(activeEventIndex, sortedSelectedEvents.length - 1);
                    const evt = sortedSelectedEvents[validIndex];
                    if (!evt) return null;
                    const config = eventConfigs[evt] || { duration: 'Half Day', services: {} };
                    const allowedServices = EVENT_SERVICES_MAP[evt] || [];

                    return (
                      <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#222] pb-4 gap-4">
                          <div>
                            <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">2. Configure Coverage</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                              Event {validIndex + 1} of {sortedSelectedEvents.length}: {evt}
                            </p>
                          </div>
                          
                          {/* Small elegant pagination dots */}
                          <div className="flex gap-1.5 bg-black/40 border border-[#222]/40 px-3 py-2 rounded-sm">
                            {sortedSelectedEvents.map((e, idx) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => {
                                  if (idx > validIndex) {
                                    // Validate current event has services > 0
                                    const currentEvt = sortedSelectedEvents[validIndex];
                                    const currentConfig = eventConfigs[currentEvt];
                                    const totalQty = currentConfig && currentConfig.services
                                      ? Object.values(currentConfig.services).reduce((sum, q) => sum + q, 0)
                                      : 0;
                                    if (totalQty === 0) {
                                      addToast(`Please configure at least one coverage service for ${currentEvt} before proceeding`, 'error');
                                      return;
                                    }
                                  }
                                  setActiveEventIndex(idx);
                                }}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                  idx === validIndex
                                    ? 'bg-[var(--color-gold)] scale-110 shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                                    : 'bg-[#222] hover:bg-gray-500'
                                }`}
                                title={`Configure ${e}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div key={evt} className="border border-[#1a1a1a] bg-[#0c0c0c] p-6 rounded-sm space-y-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1a1a1a] pb-4 gap-4">
                            <span className="font-heading text-xl tracking-wider text-[var(--color-gold)]">{evt}</span>
                            
                            {evt !== 'PRE-WEDDING' && (
                              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-gold)] font-mono font-bold">
                                {evt === 'WEDDING' ? 'Full Day (More than 12 Hrs)' : 'Half Day (up to 6 hrs)'}
                              </span>
                            )}
                          </div>

                          {/* Nested Options Flow for GODUMRAI */}
                          {evt === 'GODUMRAI' && (
                            <div className="bg-[#111]/40 border border-[#222]/40 p-4 rounded-sm">
                              <span className="text-[9px] uppercase tracking-widest text-[#777] font-bold block mb-2.5">Select Coverage Subject</span>
                              <div className="flex flex-wrap gap-3">
                                {['Bride', 'Groom'].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleEventOptionChange(evt, opt)}
                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                      config.option === opt || config.option?.split(', ').includes(opt)
                                        ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                                        : 'text-gray-300 border-[#222] bg-[#080808] hover:border-gray-500'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Nested Options Flow for HALDI */}
                          {evt === 'HALDI' && (
                            <div className="bg-[#111]/40 border border-[#222]/40 p-4 rounded-sm">
                              <span className="text-[9px] uppercase tracking-widest text-[#777] font-bold block mb-2.5">Select Haldi Option</span>
                              <div className="flex flex-wrap gap-3">
                                {['Pellikoduku', 'Pellikuthuru', 'Both at same place'].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleEventOptionChange(evt, opt)}
                                    className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                      config.option === opt || config.option?.split(', ').includes(opt)
                                        ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)] shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                                        : 'text-gray-300 border-[#222] bg-[#080808] hover:border-gray-500'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sub-services Quantities Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {allowedServices.map((subSvcName) => {
                              const qty = config.services?.[subSvcName] || 0;
                              const unitPrice = getSubServicePrice(subSvcName, config.duration);
                              const isMobileActive = !!activeMobileCards[`${evt}-${subSvcName}`];
                              
                              return (
                                <div 

                                  key={subSvcName}
                                  onClick={() => {
                                    setActiveMobileCards(prev => ({
                                      ...prev,
                                      [`${evt}-${subSvcName}`]: !prev[`${evt}-${subSvcName}`]
                                    }));
                                  }}
                                  className={`group p-6 border rounded-sm transition-all duration-500 relative flex flex-col items-center justify-center text-center aspect-[4/3] overflow-hidden cursor-pointer ${
                                    qty > 0 ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5 shadow-[0_0_15px_rgba(212,175,55,0.08)]' : 'border-[#1a1a1a] bg-[#0c0c0c] hover:border-[#333]'
                                  }`}
                                >
                                  {/* --- DEFAULT STATE CONTENT (Hidden on hover or mobile active) --- */}
                                  <div className={`flex flex-col items-center justify-center gap-4 transition-all duration-500 w-full md:group-hover:opacity-0 md:group-hover:scale-95 md:group-hover:pointer-events-none ${
                                    isMobileActive ? 'max-md:opacity-0 max-md:scale-95 max-md:pointer-events-none' : ''
                                  }`}>
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                      <DynamicIcon 
                                        name={subSvcName}
                                        isSelected={qty > 0}
                                        fallback={subServiceIconMap[subSvcName] || Camera}
                                        size="md"
                                      />
                                    </div>
                                    <span className={`text-[13px] font-heading tracking-[0.2em] uppercase transition-colors duration-500 leading-relaxed ${
                                      qty > 0 ? 'text-[var(--color-gold)] font-extrabold' : 'text-gray-300 group-hover:text-[var(--color-gold)]'
                                    }`}>{subSvcName}</span>
                                    {qty > 0 && (
                                      <span className="absolute bottom-3 right-3 font-mono text-[9px] text-[var(--color-gold)] font-bold bg-black px-1.5 py-0.5 border border-[var(--color-gold)]/35 rounded-sm">
                                        Qty: {qty}
                                      </span>
                                    )}
                                  </div>

                                  {/* --- HOVER STATE CONTENT (Visible on hover or mobile active) --- */}
                                  <div 
                                    className={`absolute inset-0 p-4 flex flex-col justify-between transition-all duration-500 bg-[#080808] z-10 opacity-0 translate-y-3 pointer-events-none md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-hover:pointer-events-auto ${
                                      isMobileActive ? 'max-md:opacity-100 max-md:translate-y-0 max-md:pointer-events-auto' : ''
                                    }`}
                                  >

                                    {/* Top Row: Price (Left) and Qty Modifier (Right) */}
                                    <div className="flex items-center justify-between w-full pb-2 border-b border-[#1a1a1a]">
                                      <span className="font-mono text-[9px] text-[var(--color-gold)] font-bold bg-black px-2 py-1 border border-[var(--color-gold)]/35 rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.15)]">
                                        ₹{unitPrice.toLocaleString()}/-
                                      </span>
                                      
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubServiceQtyChange(evt, subSvcName, -1);
                                          }}
                                          className="w-6 h-6 border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] flex items-center justify-center text-xs font-bold bg-[#0f0f0f] transition-colors rounded-sm shadow-sm"
                                        >
                                          -
                                        </button>
                                        <span className="font-mono text-xs w-4 text-center font-bold text-white">{qty}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubServiceQtyChange(evt, subSvcName, 1);
                                          }}
                                          className="w-6 h-6 border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] flex items-center justify-center text-xs font-bold bg-[#0f0f0f] transition-colors rounded-sm shadow-sm"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>

                                    {/* Center Content: Description */}
                                    <div className="flex-1 flex flex-col items-center justify-center px-1 text-center pt-2">
                                      <span className="text-[12px] uppercase tracking-widest text-[var(--color-gold)] font-heading block mb-1.5">{subSvcName}</span>
                                      <p className="text-[10px] text-gray-400 leading-normal font-sans font-medium px-2 max-h-[75px] overflow-y-auto">
                                        {SERVICE_DESCRIPTIONS[subSvcName] || ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                          </div>

                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}


              {/* STEP 3: Pre-Wedding Style */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="border-b border-[#222] pb-4">
                    <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">3. Pre-Wedding Style</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Select a pre-wedding conceptual package (Optional)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PRE_WEDDING_PACKAGES.map((pkg) => {
                      const isSelected = selectedPreWedding === pkg.name;
                      const dbPrice = prices.find(p => p.serviceName === pkg.name && p.category === 'Pre-Wedding Style')?.basePrice;
                      const displayPrice = dbPrice !== undefined ? dbPrice : pkg.price;
                      
                      return (
                        <div
                          key={pkg.name}
                          onClick={() => setSelectedPreWedding(isSelected ? null : pkg.name)}
                          className={`p-8 min-h-[380px] border cursor-pointer transition-all duration-500 rounded-sm space-y-6 flex flex-col justify-between ${
                            isSelected 
                              ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                              : 'border-[#1a1a1a] bg-[#0c0c0c] hover:border-[#333]'
                          }`}
                        >
                          <div>
                            <span className="text-[var(--color-gold)] text-[10px] md:text-xs uppercase tracking-widest font-mono font-bold">{pkg.subtitle}</span>
                            <h3 className="font-heading text-xl md:text-2xl text-white mt-1.5 mb-3">{pkg.name}</h3>
                            <p className="text-xs md:text-sm text-gray-400 font-sans leading-relaxed mb-4">
                              {pkg.description}
                            </p>
                            {pkg.bullets && (
                              <ul className="space-y-1.5 pt-2 border-t border-[#222]">
                                {pkg.bullets.map((b, bi) => (
                                  <li key={bi} className="text-[10px] text-gray-300 flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          
                          <div className="pt-4 border-t border-[#222] flex justify-between items-center mt-6">
                            <span className="font-mono text-sm text-[var(--color-gold)] font-bold">₹{displayPrice.toLocaleString()}/-</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[var(--color-gold)] bg-[var(--color-gold)]' : 'border-[#444]'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3px]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Film Post-Production */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="border-b border-[#222] pb-4">
                    <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">4. Video Post-Production</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Choose your editing formats and custom movie lengths</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {POST_PRODUCTION_PACKAGES.map((pkg) => {
                      const isSelected = selectedPostProd === pkg.name;
                      const dbPrice = prices.find(p => p.serviceName === pkg.name && p.category === 'Post Production Editing')?.basePrice;
                      const displayPrice = dbPrice !== undefined ? dbPrice : pkg.price;
                      
                      return (
                        <div
                          key={pkg.name}
                          onClick={() => setSelectedPostProd(isSelected ? null : pkg.name)}
                          className={`p-6 border cursor-pointer transition-all duration-300 rounded-sm flex flex-col justify-between space-y-4 ${
                            isSelected 
                              ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                              : 'border-[#1a1a1a] bg-[#0c0c0c] hover:border-[#333]'
                          }`}
                        >
                          <div>
                            <span className="text-[var(--color-gold)] text-[9px] uppercase tracking-widest font-mono font-bold">{pkg.subtitle}</span>
                            <h4 className="font-heading text-xl md:text-2xl uppercase tracking-wider text-white mt-1.5 mb-3">{pkg.name}</h4>
                            <p className="text-[11px] text-gray-400 font-sans leading-relaxed whitespace-pre-line">
                              {pkg.description}
                            </p>
                          </div>
                          
                          <div className="pt-4 border-t border-[#222] flex justify-between items-center mt-6">
                            <span className="font-mono text-sm text-[var(--color-gold)] font-bold">
                              {displayPrice > 0 ? `₹${displayPrice.toLocaleString()}/-` : 'No Additional Cost'}
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[var(--color-gold)] bg-[var(--color-gold)]' : 'border-[#444]'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3px]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 5: Luxury Albums */}
              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="border-b border-[#222] pb-4">
                    <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">5. Luxury Album Deliverables</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Configure dynamic sheets and physical albums</p>
                  </div>

                  {/* Complimentary Professional Photo Editing Box */}
                  <div className="bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 p-5 rounded-sm flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-bold">Complimentary Professional Photo Editing</span>
                    <p className="text-xs text-gray-300 leading-relaxed font-sans">
                      <strong>150-300 Edited Photos:</strong> Price includes Candid photography. All photos are professionally color graded and retouched to enhance natural skin tones, lighting balance, and overall visual appeal, while maintaining a clean and realistic look.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ALBUM_PACKAGES.map((pkg) => {
                      const qty = albumQuantities[pkg.name] || 0;
                      const isSelected = qty > 0;
                      const dbPrice = prices.find(p => p.serviceName === pkg.name && p.category === 'Photo Album')?.basePrice;
                      const displayPrice = dbPrice !== undefined ? dbPrice : pkg.price;
                      
                      return (
                        <div
                          key={pkg.name}
                          className={`p-8 min-h-[400px] border cursor-pointer transition-all duration-300 rounded-sm flex flex-col justify-between space-y-6 relative group ${
                            isSelected 
                              ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                              : 'border-[#1a1a1a] bg-[#0c0c0c] hover:border-[#333]'
                          }`}
                          onClick={() => {
                            if (qty === 0) setAlbumQuantities(prev => ({...prev, [pkg.name]: 1}));
                          }}
                        >
                          <div>
                            <h4 className="font-heading text-xl md:text-2xl uppercase tracking-wider text-white mb-3">{pkg.name}</h4>
                            <p className="text-xs md:text-sm text-gray-400 font-sans leading-relaxed mb-4">
                              {pkg.description}
                            </p>
                            {pkg.gifts && (
                              <div className="pt-3 border-t border-[#222]">
                                <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block mb-1.5">Complimentary Gifts:</span>
                                <ul className="space-y-1">
                                  {pkg.gifts.map((g, gi) => (
                                    <li key={gi} className="text-[9px] text-[var(--color-gold)] flex items-center gap-1.5 uppercase tracking-widest font-extrabold">
                                      <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                                      {g}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-[#222] flex justify-between items-center mt-6">
                            <span className="font-mono text-base text-[var(--color-gold)] font-bold">₹{displayPrice.toLocaleString()}/-</span>
                            
                            <div className={`flex items-center gap-3 transition-opacity duration-300 ${qty > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAlbumQuantities(prev => {
                                    const n = {...prev};
                                    if (qty <= 1) delete n[pkg.name];
                                    else n[pkg.name] = qty - 1;
                                    return n;
                                  });
                                }}
                                className="w-8 h-8 border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] flex items-center justify-center text-sm font-bold bg-[#0f0f0f] transition-colors rounded-sm shadow-sm"
                              >
                                -
                              </button>
                              <span className="font-mono text-sm w-4 text-center font-bold text-white">{qty}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAlbumQuantities(prev => ({...prev, [pkg.name]: qty + 1}));
                                }}
                                className="w-8 h-8 border border-[#333] hover:border-[var(--color-gold)] text-white hover:text-[var(--color-gold)] flex items-center justify-center text-sm font-bold bg-[#0f0f0f] transition-colors rounded-sm shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#1f1f1f] p-6 flex flex-col justify-center space-y-4 rounded-sm">
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-bold block">Album Printing Configurations</span>
                    <p className="text-[10px] text-gray-300 uppercase tracking-wider leading-relaxed">
                      Signature albums include standard premium printing sheets. Adjust sheets below to accommodate more landmark celebrations (₹500/- Per Sheet).
                    </p>
                    
                    {Object.keys(albumQuantities).length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 uppercase tracking-widest">Additional Album Sheets</span>
                          <span className="font-mono text-[var(--color-gold)] font-bold">+{albumSheets} Sheets (₹{(albumSheets * 500).toLocaleString()}/-)</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="50" 
                          value={albumSheets} 
                          onChange={(e) => setAlbumSheets(Number(e.target.value))}
                          className="w-full accent-[var(--color-gold)] h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 6: Add-On Services */}
              {step === 6 && (
                <motion.div key="step6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="border-b border-[#222] pb-4">
                    <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">6. Add-On Services</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Enhance your coverage with premium event additions</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <span className="text-xs uppercase tracking-widest text-[var(--color-gold)] font-bold block">Social Media Reels</span>
                      
                      {/* Event Instant Reels */}
                      <div className={`p-5 border rounded-sm space-y-4 transition-all duration-300 ${selectedAddOns.instantReels ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5' : 'border-[#222] hover:border-[#333]'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-heading text-xl uppercase tracking-wider text-white">Event Instant Reels</h4>
                            <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest mt-1">₹1,000 Each (Min 5 Reels)</p>
                            <p className="text-[10px] text-gray-400 font-sans normal-case tracking-normal mt-2 leading-relaxed">
                              we use high-end iPhone cameras to shoot and edit quickly on the same day. This allows us to deliver fast, smooth and social media-ready content while maintaining clean visuals and stable footage.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedAddOns(prev => ({ ...prev, instantReels: !prev.instantReels }))}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                              selectedAddOns.instantReels 
                                ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' 
                                : 'text-white border-[#333] hover:border-white'
                            }`}
                          >
                            {selectedAddOns.instantReels ? 'Selected' : 'Add'}
                          </button>
                        </div>
                        {selectedAddOns.instantReels && (
                          <div className="pt-2 flex justify-between items-center border-t border-[#1f1f1f]">
                            <span className="text-[9px] uppercase tracking-widest text-gray-400">Quantity</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedAddOns(prev => ({ ...prev, instantReelsQty: Math.max(5, prev.instantReelsQty - 1) }))}
                                className="w-6 h-6 border border-[#333] flex items-center justify-center text-xs hover:border-[var(--color-gold)]"
                              >
                                -
                              </button>
                              <span className="font-mono text-sm text-[var(--color-gold)] font-bold">{selectedAddOns.instantReelsQty}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedAddOns(prev => ({ ...prev, instantReelsQty: Math.min(50, prev.instantReelsQty + 1) }))}
                                className="w-6 h-6 border border-[#333] flex items-center justify-center text-xs hover:border-[var(--color-gold)]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
 
                      {/* Cinematic Reels */}
                      <div className={`p-5 border rounded-sm space-y-4 transition-all duration-300 ${selectedAddOns.cinematicReels ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5' : 'border-[#222] hover:border-[#333]'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-heading text-xl uppercase tracking-wider text-white">Cinematic Reels</h4>
                            <p className="text-[10px] text-[#A1A1A1] uppercase tracking-widest mt-1">₹2,000 Each (Min 5 Reels)</p>
                            <p className="text-[10px] text-gray-400 font-sans normal-case tracking-normal mt-2 leading-relaxed">
                              Cinematic Reels are shot using professional cameras and delivered with high-quality editing and cinematic color grading by the next 2 days.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedAddOns(prev => ({ ...prev, cinematicReels: !prev.cinematicReels }))}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                              selectedAddOns.cinematicReels 
                                ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' 
                                : 'text-white border-[#333] hover:border-white'
                            }`}
                          >
                            {selectedAddOns.cinematicReels ? 'Selected' : 'Add'}
                          </button>
                        </div>
                        {selectedAddOns.cinematicReels && (
                          <div className="pt-2 flex justify-between items-center border-t border-[#1f1f1f]">
                            <span className="text-[9px] uppercase tracking-widest text-gray-400">Quantity</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setSelectedAddOns(prev => ({ ...prev, cinematicReelsQty: Math.max(5, prev.cinematicReelsQty - 1) }))}
                                className="w-6 h-6 border border-[#333] flex items-center justify-center text-xs hover:border-[var(--color-gold)]"
                              >
                                -
                              </button>
                              <span className="font-mono text-sm text-[var(--color-gold)] font-bold">{selectedAddOns.cinematicReelsQty}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedAddOns(prev => ({ ...prev, cinematicReelsQty: Math.min(50, prev.cinematicReelsQty + 1) }))}
                                className="w-6 h-6 border border-[#333] flex items-center justify-center text-xs hover:border-[var(--color-gold)]"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
 
                    <div className="space-y-4">
                      <span className="text-xs uppercase tracking-widest text-[var(--color-gold)] font-bold block">Stage Displays & Streams</span>
                      
                      {/* LED Screen */}
                      <div
                        onClick={() => setSelectedAddOns(prev => ({ ...prev, ledScreen: !prev.ledScreen }))}
                        className={`p-4 border cursor-pointer transition-all duration-300 rounded-sm flex justify-between items-center ${
                          selectedAddOns.ledScreen ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5' : 'border-[#222] hover:border-[#333]'
                        }`}
                      >
                        <div className="flex-1 pr-4">
                          <h4 className="font-heading text-xl uppercase tracking-wider text-white">8x12 or 6x8 LED Screen</h4>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">₹20,000/-</p>
                          <p className="text-[10px] text-gray-400 font-sans normal-case tracking-normal mt-2 leading-relaxed">
                            High-Quality LED Screens (P3) — Delivering sharp visuals, vibrant colors and clear visibility, ideal for wedding stages and live event display.
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedAddOns.ledScreen ? 'border-[var(--color-gold)] bg-[var(--color-gold)] font-bold' : 'border-[#444]'
                        }`}>
                          {selectedAddOns.ledScreen && <Check className="w-2.5 h-2.5 text-black stroke-[3px]" />}
                        </div>
                      </div>
 
                      {/* YouTube Live Full Day */}
                      {/* YouTube Live Full Day */}
                      <div className={`p-5 border rounded-sm space-y-4 transition-all duration-300 ${selectedAddOns.ytLiveFull ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5' : 'border-[#222] hover:border-[#333]'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <h4 className="font-heading text-xl uppercase tracking-wider text-white">YouTube Live (Full Day)</h4>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">₹15,000/-</p>
                            <p className="text-[10px] text-gray-400 font-sans normal-case tracking-normal mt-2 leading-relaxed">
                              Full Day Wedding Live – Complete ceremony coverage
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedAddOns(prev => ({ ...prev, ytLiveFull: !prev.ytLiveFull }))}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                              selectedAddOns.ytLiveFull 
                                ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' 
                                : 'text-white border-[#333] hover:border-white'
                            }`}
                          >
                            {selectedAddOns.ytLiveFull ? 'Selected' : 'Add'}
                          </button>
                        </div>
                      </div>

                      {/* YouTube Live Half Day */}
                      <div className={`p-5 border rounded-sm space-y-4 transition-all duration-300 ${selectedAddOns.ytLiveHalf ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/5' : 'border-[#222] hover:border-[#333]'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <h4 className="font-heading text-xl uppercase tracking-wider text-white">YouTube Live (Half Day)</h4>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-1">₹8,000/-</p>
                            <p className="text-[10px] text-gray-400 font-sans normal-case tracking-normal mt-2 leading-relaxed">
                              Half Day Events Live – Haldi / Sangeeth / Engagement / Reception
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedAddOns(prev => ({ ...prev, ytLiveHalf: !prev.ytLiveHalf }))}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                              selectedAddOns.ytLiveHalf 
                                ? 'bg-[var(--color-gold)] text-black border-[var(--color-gold)]' 
                                : 'text-white border-[#333] hover:border-white'
                            }`}
                          >
                            {selectedAddOns.ytLiveHalf ? 'Selected' : 'Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

              )}

              {/* STEP 7: Client Details Form */}
              {step === 7 && (
                <motion.div key="step7" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="border-b border-[#222] pb-4">
                    <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">7. Client Details</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Please provide coordinates to lock shoot schedule calculations</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-300 flex items-center gap-2"><User className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Full Name</label>
                      <input required type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} placeholder="Enter your full name" className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-300 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Email Address</label>
                      <input 
                        required 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        onInvalid={(e) => e.target.setCustomValidity("Enter a valid email")}
                        onInput={(e) => e.target.setCustomValidity("")}
                        placeholder="Enter your email" 
                        className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-300 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Mobile Number</label>
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Enter mobile number" className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-300 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Event Start Date (Optional)</label>
                      <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm [color-scheme:dark]" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-300 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Shoot Location (Optional)</label>
                      <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="City, Venue, or State" className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors rounded-sm" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-gray-300 flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5 text-[var(--color-gold)]" /> Additional Notes</label>
                      <textarea rows="3" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="E.g., Special arrival timings, dynamic venue logistics..." className="w-full bg-[#0a0a0a] border border-[#222] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none rounded-sm" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 8: Final Review & Summary Page */}
              {step === 8 && (
                <motion.div key="step8" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                  <div className="border-b border-[#222] pb-4">
                    <h2 className="font-heading text-2xl text-[var(--color-gold)] mb-2">8. Summary & Proposal</h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Review itemized quotations & complete submission</p>
                  </div>

                  <div className="space-y-6">
                    
                    {/* Itemized Table */}
                    <div className="border border-[#222] bg-[#090909] p-6 rounded-sm">
                      <h3 className="font-heading text-xl uppercase tracking-widest text-[var(--color-gold)] border-b border-[#1f1f1f] pb-2 mb-4">Itemized Receipt</h3>
                      
                      <div className="space-y-4 text-sm">
                        {/* Event Coverages */}
                        {[...selectedEvents]
                          .sort((a, b) => eventsList.indexOf(a) - eventsList.indexOf(b))
                          .map(evt => {
                            const config = eventConfigs[evt];
                            if (!config || !config.services) return null;
                            const hasServices = Object.keys(config.services).some(s => config.services[s] > 0);
                            if (!hasServices) return null;

                            return (
                              <div key={evt} className="border-b border-[#1a1a1a] pb-2">
                                <div className="flex justify-between font-bold text-white uppercase text-xs tracking-wider">
                                  <span>{evt} ({config.duration === 'Full Day' ? 'Full Day (More than 12 Hrs)' : config.duration}{config.option ? ` - ${config.option}` : ''})</span>
                                </div>
                                <div className="pl-4 mt-1 space-y-1 text-[11px] text-gray-300">
                                  {Object.keys(config.services).map(s => {
                                    const qty = config.services[s];
                                    if (qty <= 0) return null;
                                    const unitPrice = getSubServicePrice(s, config.duration);
                                    return (
                                      <div key={s} className="flex justify-between">
                                        <span>{s} ({qty}x)</span>
                                        <span className="font-mono text-white">₹{(qty * unitPrice).toLocaleString()}/-</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}


                        {/* Custom Packages */}
                        {(selectedPreWedding || selectedPostProd || Object.keys(albumQuantities).length > 0) && (
                          <div className="border-b border-[#1a1a1a] pb-2 space-y-1 text-xs">
                            {selectedPreWedding && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Pre-Wedding Style: {selectedPreWedding}</span>
                                <span className="font-mono text-white">₹{(prices.find(p => p.serviceName === selectedPreWedding && p.category === 'Pre-Wedding Style')?.basePrice || 0).toLocaleString()}/-</span>
                              </div>
                            )}
                            {selectedPostProd && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Film Post-Production: {selectedPostProd}</span>
                                <span className="font-mono text-white">₹{(prices.find(p => p.serviceName === selectedPostProd && p.category === 'Post Production Editing')?.basePrice || 0).toLocaleString()}/-</span>
                              </div>
                            )}
                            {Object.keys(albumQuantities).length > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300">Luxury Albums: {Object.entries(albumQuantities).map(([n, q]) => `${q}x ${n}`).join(', ')} (+{albumSheets} Sheets)</span>
                                <span className="font-mono text-white">
                                  ₹{(Object.entries(albumQuantities).reduce((sum, [name, qty]) => sum + (qty * (prices.find(p => p.serviceName === name && p.category === 'Photo Album')?.basePrice || (name === 'Basic Album (30 Sheets)' ? 15000 : name === 'Standard Album (50 Sheets)' ? 25000 : 40000))), 0) + (albumSheets * 500)).toLocaleString()}/-
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Add-ons */}
                        {(selectedAddOns.instantReels || selectedAddOns.cinematicReels || selectedAddOns.ledScreen || selectedAddOns.ytLiveFull || selectedAddOns.ytLiveHalf) && (
                          <div className="border-b border-[#1a1a1a] pb-2 space-y-1 text-xs">
                            {selectedAddOns.instantReels && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Event Instant Reels ({selectedAddOns.instantReelsQty} Reels)</span>
                                <span className="font-mono text-white">₹{(selectedAddOns.instantReelsQty * 1000).toLocaleString()}/-</span>
                              </div>
                            )}
                            {selectedAddOns.cinematicReels && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Cinematic Reels ({selectedAddOns.cinematicReelsQty} Reels)</span>
                                <span className="font-mono text-white">₹{(selectedAddOns.cinematicReelsQty * 2000).toLocaleString()}/-</span>
                              </div>
                            )}
                            {selectedAddOns.ledScreen && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">LED Display Stage Screen</span>
                                <span className="font-mono text-white">₹20,000/-</span>
                              </div>
                            )}
                            {selectedAddOns.ytLiveFull && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">YouTube Live (Full Day)</span>
                                <span className="font-mono text-white">₹15,000/-</span>
                              </div>
                            )}
                            {selectedAddOns.ytLiveHalf && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">YouTube Live (Half Day)</span>
                                <span className="font-mono text-white">₹8,000/-</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date & Location Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-[#222] bg-[#0c0c0c] flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[var(--color-gold)]" />
                        <div>
                          <span className="text-[8px] uppercase tracking-widest text-[#555] block">Event Date</span>
                          <span className={`text-xs font-sans ${formData.eventDate ? 'text-white' : 'text-gray-500'}`}>{formData.eventDate ? new Date(formData.eventDate).toLocaleDateString('en-IN') : 'Not Set'}</span>
                        </div>
                      </div>
                      <div className="p-4 border border-[#222] bg-[#0c0c0c] flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[var(--color-gold)]" />
                        <div>
                          <span className="text-[8px] uppercase tracking-widest text-[#555] block">Location</span>
                          <span className={`text-xs font-sans truncate max-w-[250px] block ${formData.location ? 'text-white' : 'text-gray-500'}`}>{formData.location || 'Not Set'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms & Conditions Section */}
                    <div className="border border-[#222] bg-[#090909] p-6 rounded-sm text-[10px] text-gray-400 leading-relaxed">
                      <span className="font-heading text-xl uppercase tracking-widest text-[var(--color-gold)] block mb-3">Retainer Agreement Terms</span>
                      <ul className="list-disc pl-4 space-y-1">
                        {getQuotationTerms().map(t => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Estimated Pricing Total */}
                    <div className="bg-[#000] border border-[#1f1f1f] p-6 text-center">
                      <span className="font-heading text-xl text-[var(--color-gold)] uppercase tracking-widest block mb-1">Estimated Grand Total</span>
                      <span className="text-3xl font-bold text-[var(--color-gold)] font-mono">₹{calculateTotal().toLocaleString()}/-</span>
                      <span className="text-[8px] text-[#555] block mt-2">*Terms and conditions Apply</span>
                    </div>

                    {/* Terms Acceptance Checkbox */}
                    <div className="flex items-start gap-3 p-4 border border-[#222] bg-[#0c0c0c] rounded-sm mt-4">
                      <input 
                        type="checkbox" 
                        id="accept-terms-checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-gray-800 bg-[#141414] text-[var(--color-gold)] focus:ring-[var(--color-gold)] cursor-pointer"
                      />
                      <label htmlFor="accept-terms-checkbox" className="text-[10px] text-[#A1A1A1] uppercase tracking-wider select-none cursor-pointer leading-relaxed">
                        I accept the Retainer Agreement Terms & Conditions above and confirm these quotation parameters.
                      </label>
                    </div>

                    {/* Submission Actions */}
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => {
                          // Build detailed checkout breakdown string
                          let detailsSummary = `*SELECTED SERVICES & CONFIGURATIONS*\n\n`;
                          selectedEvents.forEach(evt => {
                            const config = eventConfigs[evt];
                            if (config) {
                              detailsSummary += `• *${evt}* (${config.duration})\n`;
                              if (config.services) {
                                if (Array.isArray(config.services)) {
                                  config.services.forEach(s => {
                                    detailsSummary += `  - ${s} (₹${getSubServicePrice(s, config.duration).toLocaleString()}/-)\n`;
                                  });
                                } else if (typeof config.services === 'object') {
                                  Object.keys(config.services).forEach(s => {
                                    const qty = config.services[s];
                                    if (qty > 0) {
                                      detailsSummary += `  - ${s} (₹${getSubServicePrice(s, config.duration).toLocaleString()}/-)\n`;
                                    }
                                  });
                                }
                              }
                            }
                          });
                          if (selectedPreWedding) detailsSummary += `\n*Pre-Wedding Style:* ${selectedPreWedding}\n`;
                          if (selectedPostProd) detailsSummary += `*Film Editing Style:* ${selectedPostProd}\n`;
                          if (Object.keys(albumQuantities).length > 0) detailsSummary += `*Luxury Albums:* ${Object.entries(albumQuantities).map(([n, q]) => `${q}x ${n}`).join(', ')} (+${albumSheets} Sheets)\n`;
                          
                          let addOnsText = '';
                          if (selectedAddOns.instantReels) addOnsText += `  - Instant Reels: ${selectedAddOns.instantReelsQty} Reels\n`;
                          if (selectedAddOns.cinematicReels) addOnsText += `  - Cinematic Reels: ${selectedAddOns.cinematicReelsQty} Reels\n`;
                          if (selectedAddOns.ledScreen) addOnsText += `  - LED Screen: Yes\n`;
                          if (selectedAddOns.ytLiveFull) addOnsText += `  - YouTube Live (Full Day): Yes\n`;
                          if (selectedAddOns.ytLiveHalf) addOnsText += `  - YouTube Live (Half Day): Yes\n`;
                          if (addOnsText) detailsSummary += `\n*Add-On Options:*\n${addOnsText}`;

                          const estimatedPrice = calculateTotal();
                          detailsSummary += `\n*ESTIMATED TOTAL:* ₹${estimatedPrice.toLocaleString()}/-`;
                          
                          triggerWhatsAppRedirect(estimatedPrice, detailsSummary);
                        }}
                        className="flex-1 py-4 border border-[#222] hover:border-[var(--color-gold)] text-white uppercase tracking-widest text-[10px] font-bold flex items-center justify-center gap-2 transition-all rounded-sm bg-black"
                      >
                        <MessageSquare className="w-4 h-4 text-green-500" /> Share via WhatsApp
                      </button>

                      <button 
                        type="button"
                        onClick={handlePrintPDF}
                        disabled={isDownloading}
                        className="flex-1 py-4 border border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] text-[var(--color-gold)] uppercase tracking-widest text-[10px] font-bold flex items-center justify-center gap-2 transition-all rounded-sm bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/10 disabled:opacity-50 disabled:cursor-wait"
                      >
                        <FileText className="w-4 h-4 animate-bounce" /> {isDownloading ? 'Generating PDF...' : 'Save / Download PDF'}
                      </button>

                      <button 
                        type="submit"
                        disabled={!acceptedTerms || isSubmitting}
                        className="flex-1 py-4 bg-[var(--color-gold)] hover:bg-white text-black uppercase tracking-widest text-[10px] font-extrabold transition-all rounded-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-gold)] disabled:hover:text-black"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </form>

                  </div>
                </motion.div>
              )}

              {/* STEP 9: Success screen */}
              {step === 9 && (
                <motion.div key="step9" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-6">
                  <div className="w-20 h-20 bg-[var(--color-gold)] text-black rounded-full flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                    <Check className="w-10 h-10 stroke-[3px]" />
                  </div>
                  <h2 className="font-heading text-4xl text-white">Quotation Filed Successfully!</h2>
                  <p className="text-[#A1A1A1] max-w-md mx-auto text-xs leading-relaxed uppercase tracking-widest">
                    Your luxury photographic portfolio parameters have been submitted. An itemized invoice proposal is flying to your email inbox!
                  </p>
                  
                  <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                    <button 
                      onClick={handlePrintPDF}
                      className="flex-1 px-6 py-3.5 border border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold)]/5 uppercase tracking-widest text-xs font-bold hover:bg-[var(--color-gold)] hover:text-black transition-all rounded-sm flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Save / Download PDF
                    </button>
                    <button 
                      onClick={() => {
                        setStep(1);
                        setSelectedEvents([]);
                        setSelectedPreWedding(null);
                        setSelectedPostProd(null);
                        setAlbumQuantities({});
                        setAlbumSheets(0);
                        setSelectedAddOns({
                          instantReels: false,
                          instantReelsQty: 5,
                          cinematicReels: false,
                          cinematicReelsQty: 5,
                          ledScreen: false,
                          ytLiveFull: false,
                          ytLiveFullQty: 1,
                          ytLiveHalf: false,
                          ytLiveHalfQty: 1
                        });
                        setFormData({
                          customerName: '',
                          email: '',
                          phone: '',
                          eventDate: '',
                          location: '',
                          notes: ''
                        });
                      }}
                      className="flex-1 px-6 py-3.5 border border-[#222] text-[#888] uppercase tracking-widest text-xs font-bold hover:border-white hover:text-white transition-all rounded-sm"
                    >
                      Build New Quote
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Stepper Footer Buttons */}
            {step < 8 && (
              <div className="flex flex-wrap md:flex-nowrap justify-between items-center mt-12 pt-8 border-t border-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => {
                    const evs = selectedEvents.filter(e => e !== 'PRE-WEDDING');
                    if (step === 2 && activeEventIndex > 0) {
                      setActiveEventIndex(i => i - 1);
                    } else {
                      if (step === 2) {
                        setActiveEventIndex(0);
                      }
                      setStep(s => {
                        if (s === 4 && !selectedEvents.includes('PRE-WEDDING')) return 2;
                        if (s === 3 && evs.length === 0) return 1;
                        return s - 1;
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`flex items-center gap-2 uppercase tracking-widest text-sm md:text-xs font-bold transition-colors ${
                    step === 1 ? 'opacity-0 pointer-events-none' : 'text-[#777] hover:text-white'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="text-center font-mono order-first w-full md:w-auto md:order-none mb-6 md:mb-0">
                  <span className="text-xs text-[#555] uppercase tracking-widest block mb-2">Estimated Total</span>
                  <span className="text-3xl font-bold text-white">₹{calculateTotal().toLocaleString()}/-</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const sortedSelectedEvents = [...selectedEvents].filter(e => e !== 'PRE-WEDDING').sort((a, b) => eventsList.indexOf(a) - eventsList.indexOf(b));
                    
                    if (step === 2) {
                      const currentEvt = sortedSelectedEvents[activeEventIndex];
                      const currentConfig = eventConfigs[currentEvt];
                      const totalQty = currentConfig && currentConfig.services
                        ? Object.values(currentConfig.services).reduce((sum, q) => sum + q, 0)
                        : 0;
                      
                      if (totalQty === 0) {
                        addToast(`Please configure at least one coverage service for ${currentEvt} to proceed`, 'error');
                        return;
                      }
                    }

                    if (step === 7) {
                      // Email check: must contain '@'
                      if (!formData.email.includes('@')) {
                        addToast('Enter a valid email', 'error');
                        return;
                      }
                      
                      // Phone check: must be exactly 10 digits
                      const cleanPhone = formData.phone.replace(/\D/g, ''); // strip non-digits
                      if (cleanPhone.length !== 10) {
                        addToast('Mobile number must be exactly 10 digits', 'error');
                        return;
                      }
                    }

                    if (step === 2 && activeEventIndex < sortedSelectedEvents.length - 1) {
                      setActiveEventIndex(i => i + 1);
                    } else {
                      if (step === 1) {
                        setActiveEventIndex(0);
                      }
                      setStep(s => {
                        if (s === 1) {
                          const evs = selectedEvents.filter(e => e !== 'PRE-WEDDING');
                          if (evs.length === 0) return 3;
                        }
                        if (s === 2 && !selectedEvents.includes('PRE-WEDDING')) return 4;
                        return s + 1;
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  disabled={
                    (step === 1 && selectedEvents.length === 0) ||
                    (step === 7 && (!formData.customerName || !formData.email || !formData.phone))
                  }
                  className="flex items-center gap-2 uppercase tracking-widest text-sm md:text-xs font-bold text-[var(--color-gold)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--color-gold)] transition-colors"
                >
                  Next Step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* PRINTABLE PROPOSAL — 4-page premium dark PDF      */}
      {/* ══════════════════════════════════════════════════ */}
      <div id="printable-proposal" style={{ display: 'none', fontFamily: "'Georgia', serif", background: '#0B0B0B', color: '#B19247' }}>

        {/* ── PAGE 1: COVER ── */}
        <div className="pdf-page" style={{
          background: '#0B0B0B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '297mm',
          width: '210mm',
          position: 'relative',
          padding: '20mm',
          boxSizing: 'border-box'
        }}>
          {/* Gold border */}
          <div style={{ position: 'absolute', inset: '12mm', border: '0.5pt solid #B19247', pointerEvents: 'none' }} />

          {/* Centered logo block */}
          <div style={{ textAlign: 'center' }}>
            <img src="/logo.png" alt="Astitva Creations" style={{ height: '140px', width: 'auto', objectFit: 'contain', marginBottom: '30px', filter: 'brightness(1.1)' }} />
            <div style={{ color: '#B19247', fontSize: '28pt', fontWeight: '900', letterSpacing: '6px', textTransform: 'uppercase', marginBottom: '10px', fontFamily: "'Georgia', serif" }}>
              ASTITVA
            </div>
            <div style={{ color: '#B19247', fontSize: '14pt', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: "'Georgia', serif" }}>
              CREATIONS
            </div>
            <div style={{ margin: '40px auto 0', width: '60px', height: '1px', background: '#B19247' }} />
          </div>

          {/* Tagline at the bottom */}
          <div style={{ position: 'absolute', bottom: '30mm', left: '20mm', right: '20mm', textAlign: 'center', color: '#B19247', fontSize: '10pt', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
            Premium Photography &amp; Cinematic Films Quotation
          </div>
        </div>

        {/* ── PAGE 2: ESTIMATION SUMMARY ── */}
        <div className="pdf-page" style={{
          background: '#0B0B0B',
          minHeight: '297mm',
          width: '210mm',
          padding: '14mm 14mm 14mm 14mm',
          boxSizing: 'border-box',
          position: 'relative',
        }}>
          {/* Gold border */}
          <div style={{ position: 'absolute', inset: '8mm', border: '0.5pt solid #B19247', pointerEvents: 'none' }} />

          {/* Page 2 Header: Logo left + Title right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '0.5pt solid #B19247' }}>
            {/* Left: Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
              <img src="/logo.png" alt="Astitva Creations" style={{ height: '48px', width: 'auto', objectFit: 'contain', filter: 'brightness(1.1)' }} />
              <span style={{ color: '#B19247', fontSize: '6pt', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '700' }}>ASTITVA</span>
              <span style={{ color: '#B19247', fontSize: '4.5pt', letterSpacing: '1.5px', textTransform: 'uppercase' }}>CREATIONS</span>
            </div>
            {/* Right: Title + Contact */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#B19247', fontSize: '11pt', fontFamily: "'Georgia', serif", fontStyle: 'italic', marginBottom: '2px' }}>Premium</div>
              <div style={{ color: '#B19247', fontSize: '20pt', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: "'Georgia', serif" }}>
                {(selectedEvents && selectedEvents[0] || 'wedding').toUpperCase()}
              </div>
              <div style={{ color: '#B19247', fontSize: '8pt', fontFamily: 'sans-serif' }}>Photography &amp; Cinematic Films Quotation</div>
              <div style={{ color: '#B19247', fontSize: '7.5pt', marginTop: '4px' }}>Date: {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</div>
            </div>
          </div>

          {/* Proposal date & ref */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ color: '#B19247', fontSize: '7.5pt', fontWeight: '700', letterSpacing: '1px' }}>CUSTOM QUOTATION PROPOSAL</span>
            <span style={{ color: '#B19247', fontSize: '7.5pt' }}>Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

          {/* Client + Event cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {/* Client */}
            <div style={{ background: '#141414', border: '1px solid #B19247', padding: '10px 12px' }}>
              <div style={{ color: '#B19247', fontSize: '7.5pt', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Client Details</div>
              <div style={{ color: '#FFFFFF', fontSize: '9pt', fontWeight: '700', marginBottom: '3px' }}>{formData.customerName || 'N/A'}</div>
              <div style={{ color: '#A1A1A1', fontSize: '7.5pt', marginBottom: '2px' }}>Email: <span style={{ color: '#FFFFFF' }}>{formData.email || 'N/A'}</span></div>
              <div style={{ color: '#A1A1A1', fontSize: '7.5pt', marginBottom: '2px' }}>Phone: <span style={{ color: '#FFFFFF' }}>{formData.phone || 'N/A'}</span></div>
            </div>
            {/* Event */}
            <div style={{ background: '#141414', border: '1px solid #B19247', padding: '10px 12px' }}>
              <div style={{ color: '#B19247', fontSize: '7.5pt', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Shoot Logistics</div>
              <div style={{ color: '#A1A1A1', fontSize: '7.5pt', marginBottom: '2px' }}>Date: <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{formData.eventDate ? new Date(formData.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span></div>
              <div style={{ color: '#A1A1A1', fontSize: '7.5pt', marginBottom: '2px' }}>Location: <span style={{ color: '#FFFFFF', fontWeight: '700' }}>{formData.location || 'N/A'}</span></div>
            </div>
          </div>

          {/* Section heading */}
          <div style={{ color: '#B19247', fontSize: '9pt', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Itemised Service Breakdown</div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt', border: '0.5pt solid #B19247' }}>
            <thead>
              <tr style={{ background: '#141414' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', color: '#B19247', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '0.5pt solid #B19247' }}>Event / Service Description</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', color: '#B19247', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '0.5pt solid #B19247', whiteSpace: 'nowrap' }}>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {[...selectedEvents]
                .sort((a, b) => eventsList.indexOf(a) - eventsList.indexOf(b))
                .map(evt => {
                  const config = eventConfigs[evt];
                  if (!config || !config.services) return null;
                  const hasServices = Object.keys(config.services).some(s => config.services[s] > 0);
                  if (!hasServices) return null;
                  return (
                    <Fragment key={evt}>
                      <tr style={{ background: '#141414' }}>
                        <td colSpan={2} style={{ padding: '5px 8px', color: '#B19247', fontWeight: '700', fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '0.5pt solid #B19247' }}>
                          {evt} ({config.duration}{config.option ? ` — ${config.option}` : ''})
                        </td>
                      </tr>
                      {Object.keys(config.services).map(s => {
                        const qty = config.services[s];
                        if (qty <= 0) return null;
                        const unitPrice = getSubServicePrice(s, config.duration);
                        return (
                          <tr key={s} style={{ borderBottom: '0.5pt solid #222' }}>
                            <td style={{ padding: '4px 8px 4px 16px', color: '#FFFFFF' }}>• {s} (Qty: {qty})</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹{(qty * unitPrice).toLocaleString()}/-</td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}

              {selectedPreWedding && (
                <tr style={{ borderBottom: '0.5pt solid #222' }}>
                  <td style={{ padding: '4px 8px', color: '#B19247', fontWeight: '700' }}>Pre-Wedding Shoot Style: {selectedPreWedding}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹{(prices.find(p => p.serviceName === selectedPreWedding && p.category === 'Pre-Wedding Style')?.basePrice || 0).toLocaleString()}/-</td>
                </tr>
              )}

              {selectedPostProd && (
                <tr style={{ borderBottom: '0.5pt solid #222' }}>
                  <td style={{ padding: '4px 8px', color: '#B19247', fontWeight: '700' }}>Film Post-Production Editing: {selectedPostProd}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹{(prices.find(p => p.serviceName === selectedPostProd && p.category === 'Post Production Editing')?.basePrice || 0).toLocaleString()}/-</td>
                </tr>
              )}

              {Object.keys(albumQuantities).length > 0 && (
                <tr>
                  <td style={{ padding: '4px 8px', color: '#B19247', fontWeight: '700' }}>Luxury Print Albums: {Object.entries(albumQuantities).map(([n, q]) => `${q}x ${n}`).join(', ')} (+{albumSheets} Additional Sheets)</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹{(Object.entries(albumQuantities).reduce((sum, [name, qty]) => sum + (qty * (prices.find(p => p.serviceName === name && p.category === 'Photo Album')?.basePrice || (name === 'Basic Album (30 Sheets)' ? 15000 : name === 'Standard Album (50 Sheets)' ? 25000 : 40000))), 0) + (albumSheets * 500)).toLocaleString()}/-</td>
                </tr>
              )}

              {selectedAddOns.instantReels && (
                <tr style={{ borderBottom: '0.5pt solid #222' }}>
                  <td style={{ padding: '4px 8px', color: '#FFFFFF' }}>Event Instant Reels ({selectedAddOns.instantReelsQty} Reels)</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹{(selectedAddOns.instantReelsQty * 1000).toLocaleString()}/-</td>
                </tr>
              )}
              {selectedAddOns.cinematicReels && (
                <tr style={{ borderBottom: '0.5pt solid #222' }}>
                  <td style={{ padding: '4px 8px', color: '#FFFFFF' }}>Cinematic Reels ({selectedAddOns.cinematicReelsQty} Reels)</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹{(selectedAddOns.cinematicReelsQty * 2000).toLocaleString()}/-</td>
                </tr>
              )}
              {selectedAddOns.ledScreen && (
                <tr style={{ borderBottom: '0.5pt solid #222' }}>
                  <td style={{ padding: '4px 8px', color: '#FFFFFF' }}>LED Stage Screen</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹20,000/-</td>
                </tr>
              )}
              {selectedAddOns.ytLiveFull && (
                <tr style={{ borderBottom: '0.5pt solid #222' }}>
                  <td style={{ padding: '4px 8px', color: '#FFFFFF' }}>YouTube Live Broadcast (Full Day)</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹15,000/-</td>
                </tr>
              )}
              {selectedAddOns.ytLiveHalf && (
                <tr style={{ borderBottom: '0.5pt solid #222' }}>
                  <td style={{ padding: '4px 8px', color: '#FFFFFF' }}>YouTube Live Broadcast (Half Day)</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#FFFFFF', fontFamily: 'monospace' }}>₹8,000/-</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Gold divider */}
          <div style={{ height: '0.5pt', background: '#B19247', margin: '12px 0' }} />

          {/* Grand Total box */}
          <div style={{ background: '#141414', border: '1px solid #B19247', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#FFFFFF', fontSize: '8.5pt', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Estimated Total Proposal Cost:</span>
            <span style={{ color: '#B19247', fontSize: '16pt', fontWeight: '900', fontFamily: 'monospace' }}>₹{calculateTotal().toLocaleString()}/-</span>
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: '10mm', left: '14mm', right: '14mm', display: 'flex', justifyContent: 'space-between', borderTop: '0.5pt solid #222', paddingTop: '6px' }}>
            <span style={{ color: '#B19247', fontSize: '6pt', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Crafted In Premium Cinema</span>
            <span style={{ color: '#B19247', fontSize: '6pt' }}>Page 2</span>
          </div>
        </div>

        {/* ── PAGE 3: SHOOTING APPROACH & KINDLY NOTE ── */}
        <div className="pdf-page" style={{
          background: '#0B0B0B',
          minHeight: '297mm',
          width: '210mm',
          padding: '14mm 14mm 14mm 14mm',
          boxSizing: 'border-box',
          position: 'relative',
        }}>
          {/* Gold border */}
          <div style={{ position: 'absolute', inset: '8mm', border: '0.5pt solid #B19247', pointerEvents: 'none' }} />

          {/* Shooting approach title */}
          <div style={{ textAlign: 'center', marginTop: '10mm', marginBottom: '14px' }}>
            <div style={{ color: '#B19247', fontSize: '18pt', fontWeight: 'bold', fontFamily: "'Georgia', serif", marginBottom: '12px' }}>
              Our Shooting Approach
            </div>
            <div style={{ color: '#B19247', fontSize: '11pt', lineHeight: '1.6', fontFamily: "'Georgia', serif", maxWidth: '170mm', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span>We follow a storytellingstyleapproach thatfocusesonrealemotions, natural moments and ritual depth.</span>
              <span>Our photography captures genuine expressions and family reactions with clean and timeless framing.</span>
              <span>Our wedding films are crafted in documentary and cinematic formats, preserving real audio, emotional continuity and elegant visual storytelling.</span>
              <span>All deliverables are provided in high-resolution and 4K quality with professional color grading and sound design.</span>
            </div>
          </div>

          {/* Kindly note title */}
          <div style={{ textAlign: 'center', marginTop: '10mm', marginBottom: '14px' }}>
            <div style={{ color: '#B19247', fontSize: '18pt', fontWeight: 'bold', fontFamily: "'Georgia', serif", marginBottom: '12px' }}>
              Kindly Note
            </div>
            <div style={{ color: '#B19247', fontSize: '11pt', lineHeight: '1.6', fontFamily: "'Georgia', serif", maxWidth: '175mm', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span>We truly look forward to being part of your special celebration.</span>
              <span>To ensure everything goes smoothly, we kindly request your support on the following:</span>
              <span>- For complete RAW and edited footage handover, we kindly request you to provide two new external hard disks.</span>
              <span>This is purely for safety purposes. Since electronic devices can sometimes fail unexpectedly, we prefer maintaining a backup copy to ensure your wedding memories remain completely secure.</span>
              <span>Your wedding emotions and once-in-a-lifetime moments are priceless, and we believe taking this extra precaution is the best way to protect them for years to come.</span>
              <span>All data will be carefully transferred and handed over safely to you.</span>
              <span>- To confirm the booking and block our team's dates, a 20% advance of the total budget is required. This helps us dedicate our complete availability exclusively for your event.</span>
              <span>- After the pre-wedding shoot, 20% of the remaining payment will be cleared.</span>
              <span>- Another 40% will be paid after the completion of all events.</span>
              <span>- The final 20% will be paid after album and video delivery.</span>
              <span>-- Travel and food arrangements for our team during the Pre-Wedding shoot will be taken care of by the client.</span>
              <span>- For wedding and other events, accommodation arrangements will be taken care of by the client.</span>
              <span>Our goal is to deliver your memories with care, clarity and commitment.</span>
              <span>We appreciate your understanding and cooperation in making this journey smooth and memorable for both of us.</span>
              <span>With gratitude,</span>
            </div>
          </div>

          {/* Signature block */}
          <div style={{ position: 'absolute', bottom: '20mm', right: '18mm', textAlign: 'right', color: '#B19247' }}>
            <div style={{ fontSize: '11pt', fontStyle: 'italic', fontFamily: "'Georgia', serif" }}>Team</div>
            <div style={{ fontSize: '22pt', fontWeight: 'bold', fontFamily: "'Georgia', serif", marginTop: '2px' }}>Astitva</div>
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: '10mm', left: '14mm', right: '14mm', display: 'flex', justifyContent: 'space-between', borderTop: '0.5pt solid #222', paddingTop: '6px' }}>
            <span style={{ color: '#B19247', fontSize: '6pt', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Crafted In Premium Cinema</span>
            <span style={{ color: '#B19247', fontSize: '6pt' }}>Page 3</span>
          </div>
        </div>

        {/* ── PAGE 4: BACK COVER ── */}
        <div className="pdf-page" style={{
          background: '#0B0B0B',
          minHeight: '297mm',
          width: '210mm',
          padding: '14mm 14mm 14mm 14mm',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Gold border */}
          <div style={{ position: 'absolute', inset: '8mm', border: '0.5pt solid #B19247', pointerEvents: 'none' }} />

          {/* Centered logo block */}
          <div style={{ textAlign: 'center', marginTop: '-20mm' }}>
            <img src="/logo.png" alt="Astitva Creations" style={{ height: '140px', width: 'auto', objectFit: 'contain', marginBottom: '20px', filter: 'brightness(1.1)' }} />
            <div style={{ color: '#B19247', fontSize: '24pt', fontWeight: '900', letterSpacing: '6px', textTransform: 'uppercase', marginBottom: '10px', fontFamily: "'Georgia', serif" }}>
              ASTITVA
            </div>
            <div style={{ color: '#B19247', fontSize: '12pt', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: "'Georgia', serif", marginBottom: '30px' }}>
              CREATIONS
            </div>
          </div>

          {/* Location states */}
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '130mm', color: '#B19247', fontSize: '10pt', fontWeight: 'bold', fontFamily: "'Georgia', serif", borderTop: '0.5pt solid #222', borderBottom: '0.5pt solid #222', padding: '10px 0', marginBottom: '25px' }}>
            <span style={{ flex: 1, textAlign: 'center' }}>ANDHRA PRADESH</span>
            <span style={{ borderLeft: '0.5pt solid #222' }}></span>
            <span style={{ flex: 1, textAlign: 'center' }}>TELANGANA</span>
          </div>

          {/* Contact Details */}
          <div style={{ textAlign: 'center', color: '#B19247', fontFamily: "'Georgia', serif" }}>
            <div style={{ fontSize: '12pt', fontStyle: 'italic', marginBottom: '10px' }}>Contact details</div>
            <div style={{ fontSize: '9pt', lineHeight: '1.8' }}>
              <div>Phone : +919182028835</div>
              <div>Email: official@astitvacreations.com</div>
              <div style={{ marginTop: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>www.astitvacreations.com</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: '10mm', left: '14mm', right: '14mm', display: 'flex', justifyContent: 'space-between', borderTop: '0.5pt solid #222', paddingTop: '6px' }}>
            <span style={{ color: '#B19247', fontSize: '6pt', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase' }}>Crafted In Premium Cinema</span>
            <span style={{ color: '#B19247', fontSize: '6pt' }}>Page 4</span>
          </div>
        </div>

      </div>
    </>
  );
}
