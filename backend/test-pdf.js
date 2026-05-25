import { generateQuotationPDF } from './src/utils/pdfGenerator.js';
import fs from 'fs';

const dummyQuote = {
  customerName: "Aarav Sharma",
  email: "aarav@example.com",
  phone: "1234567890",
  eventDate: "2026-10-15T00:00:00Z",
  location: "Hyderabad, India",
  selectedEvents: ["engagement", "pre wedding", "reception"],
  eventConfigs: {
    engagement: {
      duration: "Half Day",
      services: { "Candid Photography": { qty: 1, price: 25000 }, "Cinematography": { qty: 1, price: 35000 } }
    },
    "pre wedding": {
      duration: "Full Day",
      services: { "Conceptual Shoot": { qty: 1, price: 50000 } }
    }
  },
  preWedding: { style: "Cinematic", cost: 15000 },
  estimatedPrice: 125000,
  notes: "Test notes"
};

generateQuotationPDF(dummyQuote).then(pdfBuffer => {
  fs.writeFileSync('test_output.pdf', pdfBuffer);
  console.log('PDF generated successfully!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
