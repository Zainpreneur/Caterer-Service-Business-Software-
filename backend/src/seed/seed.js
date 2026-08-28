require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  Customer,
  MenuCategory,
  MenuItem,
  Event,
  EventMenuItem,
  Staff,
  EventStaff,
  InventoryItem,
  Invoice,
  Payment,
} = require('../models');

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Database reset. Seeding demo data...');

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@caterer.com',
    password: adminPassword,
    role: 'admin',
  });

  const managerPassword = await bcrypt.hash('Manager123!', 10);
  await User.create({
    name: 'Operations Manager',
    email: 'manager@caterer.com',
    password: managerPassword,
    role: 'manager',
  });

  const customers = await Customer.bulkCreate([
    { name: 'Sarah Johnson', email: 'sarah.j@example.com', phone: '555-0101', company: 'Johnson Weddings', address: '12 Maple St' },
    { name: 'TechCorp Inc.', email: 'events@techcorp.com', phone: '555-0102', company: 'TechCorp Inc.', address: '400 Innovation Way' },
    { name: 'Maria Gonzalez', email: 'maria.g@example.com', phone: '555-0103', company: '', address: '88 Sunset Blvd' },
    { name: 'Riverside Country Club', email: 'events@riversidecc.com', phone: '555-0104', company: 'Riverside Country Club', address: '1 Riverside Dr' },
  ]);

  const categories = await MenuCategory.bulkCreate([
    { name: 'Appetizers', description: 'Starters and small bites' },
    { name: 'Main Course', description: 'Hearty main dishes' },
    { name: 'Desserts', description: 'Sweet finishing touches' },
    { name: 'Beverages', description: 'Drinks, mocktails and cocktails' },
  ]);
  const [appetizers, mains, desserts, beverages] = categories;

  const menuItems = await MenuItem.bulkCreate([
    { categoryId: appetizers.id, name: 'Bruschetta Trio', description: 'Classic tomato basil, mushroom, and olive tapenade bruschetta', pricePerHead: 6.5, isVegetarian: true },
    { categoryId: appetizers.id, name: 'Shrimp Cocktail', description: 'Chilled shrimp with tangy cocktail sauce', pricePerHead: 9.0 },
    { categoryId: mains.id, name: 'Herb Roasted Chicken', description: 'Free-range chicken with rosemary and lemon', pricePerHead: 22.0 },
    { categoryId: mains.id, name: 'Grilled Salmon', description: 'Atlantic salmon with dill butter sauce', pricePerHead: 26.0 },
    { categoryId: mains.id, name: 'Vegetable Wellington', description: 'Roasted vegetables in puff pastry', pricePerHead: 19.0, isVegetarian: true, isVegan: false },
    { categoryId: desserts.id, name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with molten center', pricePerHead: 7.5, isVegetarian: true },
    { categoryId: desserts.id, name: 'Fruit Tart Platter', description: 'Seasonal fruit tarts', pricePerHead: 6.0, isVegetarian: true, isVegan: true },
    { categoryId: beverages.id, name: 'Signature Mocktail Bar', description: 'Non-alcoholic mixed drink station', pricePerHead: 5.0, isVegetarian: true, isVegan: true },
  ]);

  const staffMembers = await Staff.bulkCreate([
    { name: 'James Carter', email: 'james.c@caterer.com', phone: '555-0201', role: 'Head Chef', hourlyRate: 35 },
    { name: 'Linda Park', email: 'linda.p@caterer.com', phone: '555-0202', role: 'Event Coordinator', hourlyRate: 28 },
    { name: 'Omar Ibrahim', email: 'omar.i@caterer.com', phone: '555-0203', role: 'Server', hourlyRate: 18 },
    { name: 'Ana Silva', email: 'ana.s@caterer.com', phone: '555-0204', role: 'Server', hourlyRate: 18 },
    { name: 'David Kim', email: 'david.k@caterer.com', phone: '555-0205', role: 'Bartender', hourlyRate: 22 },
  ]);

  await InventoryItem.bulkCreate([
    { name: 'Chicken Breast', unit: 'kg', quantityInStock: 40, reorderLevel: 15, costPerUnit: 6.5, supplier: 'Fresh Farms Co.' },
    { name: 'Atlantic Salmon Fillet', unit: 'kg', quantityInStock: 8, reorderLevel: 10, costPerUnit: 18.0, supplier: 'Ocean Best Seafood' },
    { name: 'Puff Pastry Sheets', unit: 'pack', quantityInStock: 25, reorderLevel: 10, costPerUnit: 4.2, supplier: 'Bakers Supply' },
    { name: 'Fresh Basil', unit: 'kg', quantityInStock: 3, reorderLevel: 5, costPerUnit: 12.0, supplier: 'Fresh Farms Co.' },
    { name: 'Chocolate (Dark 70%)', unit: 'kg', quantityInStock: 20, reorderLevel: 8, costPerUnit: 9.5, supplier: 'Bakers Supply' },
    { name: 'Mixed Seasonal Fruit', unit: 'kg', quantityInStock: 12, reorderLevel: 6, costPerUnit: 5.0, supplier: 'Fresh Farms Co.' },
  ]);

  // Event 1: confirmed wedding, upcoming
  const event1 = await Event.create({
    customerId: customers[0].id,
    title: "Sarah & Mike's Wedding Reception",
    eventType: 'Wedding',
    eventDate: daysFromNow(14),
    startTime: '17:00',
    endTime: '23:00',
    venue: 'Grand Ballroom, Lakeview Hotel',
    guestCount: 120,
    status: 'confirmed',
    notes: 'Bride requests vegetarian option clearly labeled at buffet.',
    discount: 200,
    taxPercent: 8,
    createdBy: admin.id,
  });
  await EventMenuItem.bulkCreate([
    { eventId: event1.id, menuItemId: menuItems[0].id, quantity: 1, priceAtBooking: menuItems[0].pricePerHead },
    { eventId: event1.id, menuItemId: menuItems[2].id, quantity: 1, priceAtBooking: menuItems[2].pricePerHead },
    { eventId: event1.id, menuItemId: menuItems[4].id, quantity: 1, priceAtBooking: menuItems[4].pricePerHead },
    { eventId: event1.id, menuItemId: menuItems[5].id, quantity: 1, priceAtBooking: menuItems[5].pricePerHead },
  ]);
  await EventStaff.bulkCreate([
    { eventId: event1.id, staffId: staffMembers[0].id, assignedRole: 'Head Chef', hoursAssigned: 8 },
    { eventId: event1.id, staffId: staffMembers[1].id, assignedRole: 'Coordinator', hoursAssigned: 8 },
    { eventId: event1.id, staffId: staffMembers[2].id, assignedRole: 'Server', hoursAssigned: 6 },
    { eventId: event1.id, staffId: staffMembers[3].id, assignedRole: 'Server', hoursAssigned: 6 },
  ]);

  // Event 2: corporate lunch, in progress planning (inquiry)
  const event2 = await Event.create({
    customerId: customers[1].id,
    title: 'TechCorp Quarterly All-Hands Lunch',
    eventType: 'Corporate',
    eventDate: daysFromNow(5),
    startTime: '12:00',
    endTime: '14:00',
    venue: 'TechCorp HQ, 4th Floor',
    guestCount: 80,
    status: 'confirmed',
    notes: 'Requires vegan-labeled dishes for 15 guests.',
    discount: 0,
    taxPercent: 8,
    createdBy: admin.id,
  });
  await EventMenuItem.bulkCreate([
    { eventId: event2.id, menuItemId: menuItems[1].id, quantity: 1, priceAtBooking: menuItems[1].pricePerHead },
    { eventId: event2.id, menuItemId: menuItems[3].id, quantity: 1, priceAtBooking: menuItems[3].pricePerHead },
    { eventId: event2.id, menuItemId: menuItems[6].id, quantity: 1, priceAtBooking: menuItems[6].pricePerHead },
  ]);
  await EventStaff.bulkCreate([
    { eventId: event2.id, staffId: staffMembers[0].id, assignedRole: 'Head Chef', hoursAssigned: 4 },
    { eventId: event2.id, staffId: staffMembers[4].id, assignedRole: 'Bartender', hoursAssigned: 3 },
  ]);

  // Event 3: past completed event with invoice fully paid
  const event3 = await Event.create({
    customerId: customers[2].id,
    title: "Maria's 40th Birthday Party",
    eventType: 'Birthday',
    eventDate: daysFromNow(-20),
    startTime: '18:00',
    endTime: '22:00',
    venue: 'Private Residence',
    guestCount: 45,
    status: 'completed',
    notes: '',
    discount: 50,
    taxPercent: 8,
    createdBy: admin.id,
  });
  await EventMenuItem.bulkCreate([
    { eventId: event3.id, menuItemId: menuItems[0].id, quantity: 1, priceAtBooking: menuItems[0].pricePerHead },
    { eventId: event3.id, menuItemId: menuItems[2].id, quantity: 1, priceAtBooking: menuItems[2].pricePerHead },
    { eventId: event3.id, menuItemId: menuItems[6].id, quantity: 1, priceAtBooking: menuItems[6].pricePerHead },
  ]);

  // Event 4: inquiry stage, not yet confirmed
  await Event.create({
    customerId: customers[3].id,
    title: 'Riverside Golf Tournament Gala',
    eventType: 'Gala',
    eventDate: daysFromNow(35),
    startTime: '19:00',
    endTime: '23:30',
    venue: 'Riverside Country Club Ballroom',
    guestCount: 200,
    status: 'inquiry',
    notes: 'Awaiting final guest count confirmation.',
    discount: 0,
    taxPercent: 8,
    createdBy: admin.id,
  });

  // Invoices
  const subtotal3 = (menuItems[0].pricePerHead * 1 + menuItems[2].pricePerHead + menuItems[6].pricePerHead) * event3.guestCount;
  const afterDiscount3 = subtotal3 - 50;
  const tax3 = afterDiscount3 * 0.08;
  const total3 = afterDiscount3 + tax3;

  const invoice3 = await Invoice.create({
    eventId: event3.id,
    invoiceNumber: 'INV-2026-0001',
    issueDate: daysFromNow(-19),
    dueDate: daysFromNow(-5),
    subtotal: subtotal3,
    discount: 50,
    tax: tax3,
    totalAmount: total3,
    amountPaid: total3,
    status: 'paid',
    notes: 'Thank you for your business!',
  });
  await Payment.create({
    invoiceId: invoice3.id,
    amount: total3,
    method: 'bank_transfer',
    paymentDate: daysFromNow(-18),
    reference: 'TXN-88213',
  });

  const subtotal1 =
    (menuItems[0].pricePerHead + menuItems[2].pricePerHead + menuItems[4].pricePerHead + menuItems[5].pricePerHead) *
    event1.guestCount;
  const afterDiscount1 = subtotal1 - 200;
  const tax1 = afterDiscount1 * 0.08;
  const total1 = afterDiscount1 + tax1;

  const invoice1 = await Invoice.create({
    eventId: event1.id,
    invoiceNumber: 'INV-2026-0002',
    issueDate: daysFromNow(-3),
    dueDate: daysFromNow(10),
    subtotal: subtotal1,
    discount: 200,
    tax: tax1,
    totalAmount: total1,
    amountPaid: total1 * 0.3,
    status: 'partially_paid',
    notes: '30% deposit received.',
  });
  await Payment.create({
    invoiceId: invoice1.id,
    amount: total1 * 0.3,
    method: 'card',
    paymentDate: daysFromNow(-3),
    reference: 'TXN-90410',
    notes: 'Deposit payment',
  });

  console.log('Seed complete.');
  console.log('Login with: admin@caterer.com / Admin123! (admin)');
  console.log('        or: manager@caterer.com / Manager123! (manager)');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
