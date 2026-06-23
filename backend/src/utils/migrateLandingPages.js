import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root
dotenv.config({ path: join(__dirname, '../../.env') });

import { LandingPage } from '../models/LandingPage.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://astitvacreations1008_db_user:2hcSu37xZIEUc799@cluster0.jtdgb4n.mongodb.net/test?appName=Cluster0';

const defaultLandingPageData = {
  visibility: {
    hero: true,
    introVideo: true,
    approach: true,
    whatWeDoBest: true,
    bestClicks: true,
    whyLoveUs: true,
    comfort: true,
    weddingFilms: true,
    packages: true,
    finalCta: true,
  },
  alignments: {
    hero: 'center',
    introVideo: 'center',
    approach: 'center',
    whatWeDoBest: 'center',
    bestClicks: 'center',
    whyLoveUs: 'center',
    comfort: 'center',
    weddingFilms: 'center',
    packages: 'center',
    finalCta: 'center',
  },
  hero: {
    eyebrow: 'Astitva Creations',
    title: 'Timeless Wedding Photography',
    subtitle: '"Your Love Story, Captured Forever."',
    description: 'Professional wedding photography & cinematography with stunning visuals, creative storytelling, and unforgettable memories.',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
    priceStart: '₹24,999/-',
    ctaLabel: 'Book Now',
    ctaLink: '/quote'
  },
  introVideo: {
    title: 'Every Moment. Every Emotion. Beautifully Preserved.',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80'
  },
  approach: {
    title: 'Our Approach',
    subtitle: 'Capturing the purest moments with utmost care and creativity.',
    items: [{
      number: '01',
      title: 'Main Heading',
      description: '.asfjdlkabglk a;dosiahngjasdka'
    }]
  },
  whatWeDoBest: {
    title: 'What We Do Best',
    items: [
      { 
        title: 'Pre-Wedding Shoots', 
        description: 'Romantic outdoor and creative concept shoots that celebrate your journey together.',
        images: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80'
        ],
        label: 'ROMANTIC'
      },
      { 
        title: 'Wedding Day Photography', 
        description: 'Capturing every ritual, emotion, smile, and candid moment from start to finish.',
        images: [
          'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80'
        ],
        label: 'CANDID'
      },
      { 
        title: 'Cinematic Wedding Films', 
        description: 'Beautifully edited wedding movies that tell your love story like a film.',
        images: [
          'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80'
        ],
        label: 'CINEMATIC'
      },
      { 
        title: 'Reception & Engagement', 
        description: 'Elegant photography and videography for all your wedding celebrations.',
        images: [
          'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80'
        ],
        label: 'ELEGANT'
      }
    ]
  },
  bestClicks: {
    title: 'Our Best Clicks',
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552',
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
      'https://images.unsplash.com/photo-1532712938310-34cb3982ef74',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc'
    ]
  },
  whyLoveUs: {
    title: 'Why Couples Love Our Studio',
    items: [
      { title: 'Creative Storytelling', description: 'Every wedding is unique, and we craft visuals that reflect your personal love story.' },
      { title: 'Experienced Team', description: 'Dedicated photographers, cinematographers, and editors ensuring flawless coverage.' },
      { title: 'Premium Editing', description: 'High-end color grading, cinematic highlights, reels, and wedding films.' },
      { title: 'Luxury Albums', description: 'Premium-quality albums, designer photo books, and elegant wall frames.' }
    ]
  },
  comfort: {
    title: 'Comfort & Stress-Free Experience',
    items: [
      { title: 'Complete Event Coordination', description: 'Our team works seamlessly with your schedule and wedding planners.' },
      { title: 'Timely Delivery', description: 'Fast turnaround for edited photos, videos, reels, and albums.' },
      { title: 'Friendly & Supportive', description: 'We make couples feel comfortable and natural in front of the camera.' }
    ]
  },
  weddingFilms: {
    title: 'Our Wedding Films',
    items: [
      { thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', videoUrl: '' },
      { thumbnailUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6', videoUrl: '' },
      { thumbnailUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92', videoUrl: '' }
    ]
  },
  packages: {
    title: 'Our Packages',
    subtitle: 'Transparent pricing with premium deliverables tailored to capture your special day perfectly.',
    items: [
      {
        title: 'Essential',
        price: '₹24,999',
        features: ['Traditional Photography', 'Candid Photography', 'Traditional Videography', '50 Page Premium Album', 'Soft Copies on Pen Drive'],
        isRecommended: false
      },
      {
        title: 'Premium',
        price: '₹44,999',
        features: ['Everything in Essential', 'Cinematic Wedding Film', 'Pre-Wedding Shoot (1 Day)', 'Drone Coverage', 'Highlight Teaser Reel', '70 Page Luxury Album'],
        isRecommended: true
      },
      {
        title: 'Luxury',
        price: '₹74,999',
        features: ['Everything in Premium', 'Pre-Wedding Shoot (2 Days)', '2nd Cinematographer', 'Same Day Edit Video', '100 Page Ultra-Luxury Album', 'Parent Albums (x2)'],
        isRecommended: false
      }
    ]
  },
  finalCta: {
    title: 'Affordable Premium Wedding Photography',
    subtitle: 'Starts From Just ₹24,999/-',
    description: 'Get professional photography, cinematic videography, creative editing, premium albums, and a dedicated team to capture your special day without exceeding your budget.',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
    ctaLabel: 'Book Your Wedding Now',
    ctaLink: '/quote'
  }
};

async function migrate() {
  console.log('Connecting to DB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const slugsToMigrate = ['wedding', 'pre-wedding', 'vr-wedding', 'reference'];

  for (const slug of slugsToMigrate) {
    let title = 'Wedding Photography';
    if (slug === 'pre-wedding') title = 'Pre-Wedding Photography';
    if (slug === 'vr-wedding') title = 'VR Wedding Experiences';
    if (slug === 'reference') title = 'Reference Landing Page';

    const pageData = {
      ...defaultLandingPageData,
      slug,
      title
    };

    const existingPage = await LandingPage.findOne({ slug });
    
    if (existingPage) {
      console.log(`Updating existing landing page: ${slug}`);
      await LandingPage.findOneAndUpdate({ slug }, pageData);
    } else {
      console.log(`Creating new landing page: ${slug}`);
      await LandingPage.create(pageData);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
