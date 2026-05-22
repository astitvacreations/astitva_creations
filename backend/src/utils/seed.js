import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import { Gallery } from '../models/Gallery.js';
import { Booking } from '../models/Booking.js';
import { Pricing } from '../models/Pricing.js';
import { Blog } from '../models/Blog.js';
import { Testimonial } from '../models/Testimonial.js';
import { Analytics } from '../models/Analytics.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding');

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Service.deleteMany(),
      Gallery.deleteMany(),
      Booking.deleteMany(),
      Pricing.deleteMany(),
      Blog.deleteMany(),
      Testimonial.deleteMany(),
      Analytics.deleteMany()
    ]);

    console.log('Existing Data Cleared');

    // 1. Admin
    await User.create({
      email: 'admin@astitvacreations.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true
    });

    // 2. Services
    const services = await Service.insertMany([
      { title: 'Wedding Photography', slug: 'wedding-photography', description: 'Cinematic wedding coverage.', coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552', order: 1 },
      { title: 'Pre-Wedding Shoot', slug: 'pre-wedding-shoot', description: 'Beautiful pre-wedding memories.', coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', order: 2 },
      { title: 'Haldi Ceremony', slug: 'haldi-ceremony', description: 'Vibrant Haldi moments.', coverImage: 'https://images.unsplash.com/photo-1605658602715-4ba14b18c7ea', order: 3 },
      { title: 'Reception', slug: 'reception', description: 'Elegant reception coverage.', coverImage: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74', order: 4 },
      { title: 'Maternity Shoots', slug: 'maternity-shoots', description: 'Cherishing motherhood.', coverImage: 'https://images.unsplash.com/photo-1517457210190-64293f07a7e3', order: 5 }
    ]);

    // 3. Galleries
    await Gallery.insertMany([
      {
        title: 'Rahul & Anjali Wedding',
        slug: 'rahul-anjali-wedding',
        serviceId: services[0]._id,
        date: new Date(),
        location: 'Taj Falaknuma Palace, Hyderabad',
        coverImage: 'https://images.unsplash.com/photo-1583939000340-c9135f60cd8b',
        images: ['https://images.unsplash.com/photo-1583939000340-c9135f60cd8b', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486']
      },
      {
        title: 'Vikram & Sneha Pre-Wedding',
        slug: 'vikram-sneha-pre-wedding',
        serviceId: services[1]._id,
        date: new Date(),
        location: 'Goa Beaches',
        coverImage: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
        images: ['https://images.unsplash.com/photo-1606216794074-735e91aa2c92', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc']
      }
    ]);

    // 4. Pricing
    await Pricing.insertMany([
      { serviceName: 'Wedding Photography', category: 'Main Service', basePrice: 50000, fullDayPrice: 80000 },
      { serviceName: 'Cinematic Video', category: 'Sub Service', basePrice: 30000, fullDayPrice: 50000 },
      { serviceName: 'Drone Coverage', category: 'Sub Service', basePrice: 15000, fullDayPrice: 25000 },
      { serviceName: 'Pre-Wedding Shoot', category: 'Main Service', basePrice: 40000 }
    ]);

    // 5. Blogs
    await Blog.insertMany([
      {
        title: 'Top 5 Wedding Photography Trends in 2026',
        slug: 'top-5-wedding-photography-trends-2026',
        content: '<p>Cinematic shots and drone coverage are taking over...</p>',
        coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        tags: ['Trends', 'Wedding']
      }
    ]);

    // 6. Testimonials
    await Testimonial.insertMany([
      { clientName: 'Rahul Sharma', event: 'Wedding', rating: 5, content: 'Astitva Creations made our wedding look like a Bollywood movie!' }
    ]);

    // 7. Booking Quotes
    await Booking.create({
      customerName: 'Priya Patel',
      email: 'priya@example.com',
      phone: '9876543210',
      eventDate: new Date('2026-12-15'),
      location: 'Udaipur',
      services: [services[0]._id],
      subServices: ['Cinematic Video', 'Drone Coverage'],
      duration: 'Full Day',
      estimatedPrice: 155000,
      status: 'PENDING',
      notes: 'Please contact me via WhatsApp.'
    });

    console.log('Data Imported Successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
