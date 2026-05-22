import { generateQuotationPDF } from './src/utils/pdfGenerator.js';
import fs from 'fs';

const mockQuote = {
  _id: '6649df1234567890abcdef12',
  customerName: 'heyyy',
  email: 'sai@gmail.com',
  phone: '9876543210',
  eventDate: new Date('2026-05-29'),
  location: 'india',
  createdAt: new Date('2026-05-19'),
  deliveryTimeline: '8-12 Weeks',
  selectedEvents: ['ENGAGEMENT', 'WEDDING'],
  eventConfigs: {
    'ENGAGEMENT': {
      duration: 'Half Day',
      services: {
        'Traditional Photography': { qty: 1, price: 8000 },
        'Traditional Videography': { qty: 1, price: 13000 },
        'Drone': { qty: 1, price: 8000 }
      }
    },
    'WEDDING': {
      duration: 'Full Day',
      services: {
        'Traditional Photography': { qty: 1, price: 16000 },
        'Candid Photography': { qty: 1, price: 24000 },
        'Traditional Videography': { qty: 1, price: 22000 },
        'Cinematic Video': { qty: 1, price: 26000 },
        'Drone': { qty: 1, price: 12000 },
        'FPV Drone': { qty: 1, price: 12000 },
        '360° VR Coverage': { qty: 1, price: 15000 }
      }
    }
  },
  preWedding: {
    style: 'Conceptual Pre-Wedding',
    cost: 120000
  },
  postProduction: {
    editing: 'Documentary Style Wedding Film',
    cost: 20000
  },
  album: {
    albumType: 'Premium Album (80 Sheets) (+21 Additional Sheets)',
    cost: 50500
  },
  addOns: {
    'eventInstantReels': { selected: true, name: 'Event Instant Reels (5 Reels)', cost: 5000 },
    'cinematicReels': { selected: true, name: 'Cinematic Reels (5 Reels)', cost: 10000 },
    'ledStageScreen': { selected: true, name: 'LED Stage Screen', cost: 20000 },
    'youtubeLiveHalfDay': { selected: true, name: 'YouTube Live Broadcast (Half Day)', cost: 8000 }
  },
  estimatedPrice: 389500,
  status: 'PENDING'
};

console.log('Generating PDF...');
generateQuotationPDF(mockQuote)
  .then((buffer) => {
    fs.writeFileSync('test_proposal.pdf', buffer);
    console.log('PDF generated successfully as test_proposal.pdf. Size:', buffer.length);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error generating PDF:', err);
    process.exit(1);
  });

