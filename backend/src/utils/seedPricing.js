import mongoose from 'mongoose';
import 'dotenv/config';
import { Pricing } from '../models/Pricing.js';

const defaultPricings = [
  // --- EVENT COVERAGE ---
  {
    serviceName: "Cinematic Video",
    category: "Event Coverage",
    basePrice: 14000,
    fullDayPrice: 26000,
    isActive: true
  },
  {
    serviceName: "Traditional Videography",
    category: "Event Coverage",
    basePrice: 13000,
    fullDayPrice: 22000,
    isActive: true
  },
  {
    serviceName: "Candid Photography",
    category: "Event Coverage",
    basePrice: 12500,
    fullDayPrice: 24000,
    isActive: true
  },
  {
    serviceName: "Traditional Photography",
    category: "Event Coverage",
    basePrice: 8000,
    fullDayPrice: 16000,
    isActive: true
  },
  {
    serviceName: "Drone",
    category: "Event Coverage",
    basePrice: 8000,
    fullDayPrice: 12000,
    isActive: true
  },
  {
    serviceName: "FPV Drone",
    category: "Event Coverage",
    basePrice: 8000,
    fullDayPrice: 12000,
    isActive: true
  },
  {
    serviceName: "360° VR Coverage",
    category: "Event Coverage",
    basePrice: 6000,
    fullDayPrice: 15000,
    isActive: true
  },

  // --- PRE WEDDING STYLES ---
  {
    serviceName: "Conceptual Pre-Wedding",
    category: "Pre-Wedding Style",
    basePrice: 120000,
    isActive: true
  },
  {
    serviceName: "Freestyle Pre-Wedding",
    category: "Pre-Wedding Style",
    basePrice: 70000,
    isActive: true
  },
  {
    serviceName: "Basic Pre-Wedding",
    category: "Pre-Wedding Style",
    basePrice: 30000,
    isActive: true
  },

  // --- POST PRODUCTION EDITING ---
  {
    serviceName: "Standard Wedding Film",
    category: "Post Production Editing",
    basePrice: 0,
    isActive: true
  },
  {
    serviceName: "Documentary Style Wedding Film",
    category: "Post Production Editing",
    basePrice: 20000,
    isActive: true
  },

  // --- PHOTO EDITING / ALBUMS ---
  {
    serviceName: "Photo Editing (150-300 edited photos)",
    category: "Photo Editing",
    basePrice: 0,
    isActive: true
  },
  {
    serviceName: "Basic Album (30 Sheets)",
    category: "Photo Album",
    basePrice: 15000,
    isActive: true
  },
  {
    serviceName: "Standard Album (50 Sheets)",
    category: "Photo Album",
    basePrice: 25000,
    isActive: true
  },
  {
    serviceName: "Premium Album (80 Sheets)",
    category: "Photo Album",
    basePrice: 40000,
    isActive: true
  },
  {
    serviceName: "Additional Sheets (Per Sheet)",
    category: "Photo Album",
    basePrice: 500,
    isActive: true
  },

  // --- ADD-ON SERVICES ---
  {
    serviceName: "Event Instant Reels",
    category: "Add-On Services",
    basePrice: 1000,
    isActive: true
  },
  {
    serviceName: "Cinematic Reels",
    category: "Add-On Services",
    basePrice: 2000,
    isActive: true
  },
  {
    serviceName: "LED Screen (8x12 1 or 6x8 2)",
    category: "Add-On Services",
    basePrice: 20000,
    isActive: true
  },
  {
    serviceName: "YouTube Live (Full Day)",
    category: "Add-On Services",
    basePrice: 15000,
    isActive: true
  },
  {
    serviceName: "YouTube Live (Half Day)",
    category: "Add-On Services",
    basePrice: 8000,
    isActive: true
  }
];

const seedPricing = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI not defined in environment.");
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    // Clear existing pricing items
    await Pricing.deleteMany({});
    console.log("Cleared existing pricing...");

    // Insert defaults
    await Pricing.insertMany(defaultPricings);
    console.log("Seeded pricing successfully!");

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedPricing();
