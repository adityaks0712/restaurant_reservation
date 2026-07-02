// Seeds the database with an admin account and a fixed set of tables.
// Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Table = require('../models/Table');

const ADMIN_EMAIL = 'admin@restaurant.com';
const ADMIN_PASSWORD = 'admin123'; // change immediately after first login in a real deployment

const TABLES = [
  { tableNumber: 1, capacity: 2 },
  { tableNumber: 2, capacity: 2 },
  { tableNumber: 3, capacity: 4 },
  { tableNumber: 4, capacity: 4 },
  { tableNumber: 5, capacity: 6 },
  { tableNumber: 6, capacity: 8 },
];

const seed = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    await User.create({
      name: 'Restaurant Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Admin created -> email: ${ADMIN_EMAIL} / password: ${ADMIN_PASSWORD}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  for (const t of TABLES) {
    const existing = await Table.findOne({ tableNumber: t.tableNumber });
    if (!existing) {
      await Table.create(t);
      console.log(`Created table ${t.tableNumber} (capacity ${t.capacity})`);
    }
  }

  console.log('Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
