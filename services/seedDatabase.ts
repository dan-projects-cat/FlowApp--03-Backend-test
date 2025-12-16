
import { collection, writeBatch, doc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { USERS, VENDORS, RESTAURANTS, ORDERS, BOARD_TEMPLATES, MENU_TEMPLATES, MENU_ITEM_TEMPLATES } from '../data';

const COLLECTIONS = [
    'users',
    'vendors',
    'restaurants',
    'orders',
    'boardTemplates',
    'menuTemplates',
    'menuItemTemplates'
];

/**
 * A one-time script to seed the Firestore database with mock data.
 * WARNING: This is a destructive operation. It will delete all existing data
 * in the specified collections before seeding.
 */
export const seedDatabase = async (): Promise<string> => {
    console.log('Starting database seed...');
    const batch = writeBatch(db);

    // 1. Clear all existing data in collections
    console.log('Clearing existing data...');
    for (const collectionName of COLLECTIONS) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        console.log(`Marked ${querySnapshot.size} documents for deletion from ${collectionName}.`);
    }
    // Commit the deletions first to avoid any potential conflicts
    await batch.commit();
    console.log('Existing data cleared.');

    // 2. Start a new batch for seeding
    const seedBatch = writeBatch(db);

    // Seed Vendors
    VENDORS.forEach(vendor => {
        const docRef = doc(db, 'vendors', vendor.id);
        seedBatch.set(docRef, vendor);
    });
    console.log(`Seeding ${VENDORS.length} vendors...`);

    // Seed Users
    USERS.forEach(user => {
        const docRef = doc(db, 'users', user.id);
        seedBatch.set(docRef, user);
    });
    console.log(`Seeding ${USERS.length} users...`);

    // Seed Restaurants
    RESTAURANTS.forEach(restaurant => {
        const docRef = doc(db, 'restaurants', restaurant.id);
        seedBatch.set(docRef, restaurant);
    });
    console.log(`Seeding ${RESTAURANTS.length} restaurants...`);
    
    // Seed Board Templates
    BOARD_TEMPLATES.forEach(template => {
        const docRef = doc(db, 'boardTemplates', template.id);
        seedBatch.set(docRef, template);
    });
    console.log(`Seeding ${BOARD_TEMPLATES.length} board templates...`);

    // Seed Menu Item Templates
    MENU_ITEM_TEMPLATES.forEach(item => {
        const docRef = doc(db, 'menuItemTemplates', item.id);
        seedBatch.set(docRef, item);
    });
    console.log(`Seeding ${MENU_ITEM_TEMPLATES.length} menu item templates...`);

    // Seed Menu Templates
    MENU_TEMPLATES.forEach(template => {
        const docRef = doc(db, 'menuTemplates', template.id);
        seedBatch.set(docRef, template);
    });
    console.log(`Seeding ${MENU_TEMPLATES.length} menu templates...`);

    // Seed Orders (and convert Date objects to Firestore Timestamps)
    ORDERS.forEach(order => {
        const docRef = doc(db, 'orders', order.id);
        const orderDataForFirestore = {
            ...order,
            orderTime: Timestamp.fromDate(new Date(order.orderTime)),
            lastUpdateTime: Timestamp.fromDate(new Date(order.lastUpdateTime)),
        };
        seedBatch.set(docRef, orderDataForFirestore);
    });
    console.log(`Seeding ${ORDERS.length} orders...`);

    // 3. Commit the seed batch
    await seedBatch.commit();
    console.log('Database seeded successfully!');
    return `Database seeded successfully with ${VENDORS.length} vendors, ${USERS.length} users, ${RESTAURANTS.length} restaurants, and ${ORDERS.length} orders.`;
};
