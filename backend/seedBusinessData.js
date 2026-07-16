import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Adjust path depending on where this is run
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'src', '.env') });
// fallback if not in src
dotenv.config();

import { Booking } from './src/models/Booking.js';
import { Event } from './src/models/Event.js';
import { PropRental } from './src/models/PropRental.js';
import { Expense } from './src/models/Expense.js';
import { Partner } from './src/models/Partner.js';

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/astitva';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear specific new collections (optional, but good for fresh seed)
    await Event.deleteMany({});
    await PropRental.deleteMany({});
    await Expense.deleteMany({});
    await Partner.deleteMany({});
    console.log('Cleared new collections.');

    // 1. Seed Partners
    await Partner.create([
      { name: 'Tiru', percentage: 40 },
      { name: 'Suraj', percentage: 30 },
      { name: 'Lokesh', percentage: 30 }
    ]);
    console.log('Seeded Partners.');

    // 2. Seed a Booking (Studio Shoot) if there are none, just so it's not empty
    let booking = await Booking.findOne();
    if (!booking) {
      booking = await Booking.create({
        customerName: 'Alice Cooper',
        phone: '9876543210',
        email: 'alice@example.com',
        eventType: 'Maternity Shoot',
        eventDate: new Date(),
        timeSlot: 'Morning',
        duration: 'Full Day',
        location: 'Astitva Studio',
        estimatedPrice: 15000,
        finalTotal: 15000,
        paidAmount: 5000,
        status: 'CONFIRMED'
      });
      console.log('Seeded a Studio Shoot.');
    }

    // 3. Seed an Event
    const event = await Event.create({
      eventName: 'Smith Wedding',
      customerName: 'John Smith',
      phone: '9988776655',
      eventDate: new Date(),
      location: 'Taj Hotel',
      finalTotal: 120000,
      paidAmount: 60000,
      status: 'CONFIRMED',
      services: [
        { serviceName: 'Photography', price: 60000 },
        { serviceName: 'Videography', price: 60000 }
      ]
    });
    console.log('Seeded an Event.');

    // 4. Seed a Prop Rental
    const rental = await PropRental.create({
      customerName: 'Ravi Teja',
      phone: '8877665544',
      rentalDate: new Date(),
      returnDate: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 days from now
      itemsRented: ['Camera Lens 50mm', 'Smoke Machine'],
      finalTotal: 5000,
      paidAmount: 5000,
      status: 'ACTIVE'
    });
    console.log('Seeded a Prop Rental.');

    // 5. Seed Expenses for the above items
    await Expense.create([
      {
        expenseName: 'Travel to venue',
        amount: 2000,
        category: 'EVENT',
        referenceId: event._id,
        onModel: 'Event',
        expenseDate: new Date()
      },
      {
        expenseName: 'Maintenance',
        amount: 500,
        category: 'PROP_RENTAL',
        referenceId: rental._id,
        onModel: 'PropRental',
        expenseDate: new Date()
      },
      {
        expenseName: 'Studio Lights setup',
        amount: 1000,
        category: 'STUDIO_SHOOT',
        referenceId: booking._id,
        onModel: 'Booking',
        expenseDate: new Date()
      }
    ]);
    console.log('Seeded Expenses.');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
