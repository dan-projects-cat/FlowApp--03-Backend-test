
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://ugtjuwkrsvoiaxygucab.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVndGp1d2tyc3ZvaWF4eWd1Y2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDM5MjgsImV4cCI6MjA4MTQ3OTkyOH0.pI7RYK8GPQrFy-9ju3CI0dfcgVkmel8dQL5udVndh5M';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DATA ---
const VENDORS = [
    { id: '1', name: 'Burger Queen Group' },
    { id: '2', name: 'Pizza Palace Inc.' },
];

const BOARD_TEMPLATES = [
    {
        id: '1', vendorId: '1', name: 'Standard Burger Workflow',
        config: {
            statuses: [
                { id: 'pending', label: 'Pending', color: '#fb923c' },
                { id: 'accepted', label: 'Accepted', color: '#3b82f6' },
                { id: 'in-progress', label: 'In Progress', color: '#a855f7' },
                { id: 'ready-for-pickup', label: 'Ready for Pickup', color: '#facc15' },
                { id: 'completed', label: 'Completed', color: '#22c55e' },
                { id: 'rejected', label: 'Rejected', color: '#ef4444' },
            ],
            columns: [
                { id: 'col-1', title: 'New Orders', statusIds: ['pending'], icon: 'ClipboardListIcon', titleColor: '#374151', columnColor: '#F3F4F6' },
                { id: 'col-2', title: 'In Progress', statusIds: ['accepted', 'in-progress'], icon: 'ChefHatIcon', titleColor: '#374151', columnColor: '#F3F4F6' },
                { id: 'col-3', title: 'Ready for Pickup', statusIds: ['ready-for-pickup'], icon: 'ShoppingBagIcon', titleColor: '#374151', columnColor: '#F3F4F6' },
            ],
            rejectionReasons: [
                { id: 'reason-1', message: 'Restaurant is too busy to accept new orders.' },
                { id: 'reason-2', message: 'One or more items are out of stock.' },
                { id: 'reason-3', message: 'Closing soon and cannot fulfill the order in time.' },
            ],
            statusTransitions: {
                'pending': ['accepted', 'rejected'],
                'accepted': ['in-progress'],
                'in-progress': ['ready-for-pickup'],
                'ready-for-pickup': ['completed'],
                'completed': [],
                'rejected': [],
            },
        }
    },
    {
        id: '2', vendorId: '2', name: 'Standard Pizza Workflow',
        config: {
           statuses: [
                { id: 'pending', label: 'Pending', color: '#fb923c' },
                { id: 'accepted', label: 'Accepted', color: '#3b82f6' },
                { id: 'in-progress', label: 'In Progress', color: '#a855f7' },
                { id: 'ready-for-pickup', label: 'Ready for Pickup', color: '#facc15' },
                { id: 'completed', label: 'Completed', color: '#22c55e' },
                { id: 'rejected', label: 'Rejected', color: '#ef4444' },
            ],
            columns: [
                { id: 'col-1', title: 'New Orders', statusIds: ['pending'], icon: 'ClipboardListIcon', titleColor: '#374151', columnColor: '#F3F4F6' },
                { id: 'col-2', title: 'In Progress', statusIds: ['accepted', 'in-progress'], icon: 'ChefHatIcon', titleColor: '#374151', columnColor: '#F3F4F6' },
                { id: 'col-3', title: 'Ready for Pickup', statusIds: ['ready-for-pickup'], icon: 'ShoppingBagIcon', titleColor: '#374151', columnColor: '#F3F4F6' },
            ],
            rejectionReasons: [
                { id: 'reason-1', message: 'Restaurant is too busy to accept new orders.' },
                { id: 'reason-2', message: 'One or more items are out of stock.' },
                { id: 'reason-3', message: 'Closing soon and cannot fulfill the order in time.' },
            ],
            statusTransitions: {
                'pending': ['accepted', 'rejected'],
                'accepted': ['in-progress'],
                'in-progress': ['ready-for-pickup'],
                'ready-for-pickup': ['completed'],
                'completed': [],
                'rejected': [],
            },
        }
    }
];

const MENU_ITEM_TEMPLATES = [
    { id: '101', vendorId: '1', name: 'Classic Cheeseburger', description: 'A timeless classic with a juicy beef patty, melted cheddar, pickles, onions, ketchup, and mustard on a toasted bun.', price: 8.99, imageUrl: 'https://picsum.photos/400/300?random=21', composition: ['Beef Patty (1/3 lb)', 'Cheddar Cheese Slice', 'Dill Pickles', 'White Onion', 'Toasted Sesame Bun'], intolerances: [{ id: 'lactose', name: 'Lactose', icon: 'LactoseIcon' }] },
    { id: '102', vendorId: '1', name: 'Bacon Deluxe', description: 'Our classic burger topped with crispy bacon and our special deluxe sauce.', price: 10.99, imageUrl: 'https://picsum.photos/400/300?random=22', composition: ['Beef Patty (1/3 lb)', 'Crispy Bacon (2 strips)', 'Cheddar Cheese Slice', 'Deluxe Sauce'], discount: { percentage: 10, showToConsumer: true } },
    { id: '103', vendorId: '1', name: 'Spicy Jalapeño Burger', description: 'For those who like it hot! Featuring pepper jack cheese and fresh jalapeños.', price: 9.99, imageUrl: 'https://picsum.photos/400/300?random=23', composition: ['Beef Patty (1/3 lb)', 'Pepper Jack Cheese', 'Fresh Jalapeños', 'Spicy Mayo'], allergens: [{ id: 's', name: 'Spicy' }] },
    { id: '104', vendorId: '1', name: 'Crispy Fries', description: 'Golden, crispy, and perfectly salted.', price: 3.50, imageUrl: 'https://picsum.photos/400/300?random=24', composition: ['Potatoes', 'Canola Oil', 'Salt'], allergens: [{ id: 'gf', name: 'Gluten-Free' }, { id: 'v', name: 'Vegetarian' }] },
    { id: '201', vendorId: '2', name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, San Marzano tomatoes, and basil.', price: 14.00, imageUrl: 'https://picsum.photos/400/300?random=31', composition: ['Fresh Mozzarella', 'San Marzano Tomato Sauce', 'Fresh Basil', 'Olive Oil'], allergens: [{ id: 'v', name: 'Vegetarian' }], intolerances: [{ id: 'lactose', name: 'Lactose', icon: 'LactoseIcon' }] },
    { id: '202', vendorId: '2', name: 'Pepperoni Passion', description: 'Loaded with spicy pepperoni and gooey mozzarella.', price: 16.50, imageUrl: 'https://picsum.photos/400/300?random=32', composition: ['Spicy Pepperoni', 'Mozzarella', 'Tomato Sauce'] },
    { id: '203', vendorId: '2', name: 'Veggie Supreme', description: 'A garden on a pizza! Bell peppers, onions, olives, and mushrooms.', price: 15.50, imageUrl: 'https://picsum.photos/400/300?random=33', composition: ['Bell Peppers', 'Red Onions', 'Black Olives', 'Mushrooms', 'Mozzarella'], allergens: [{ id: 'v', name: 'Vegetarian' }] },
    { id: '204', vendorId: '2', name: 'Garlic Knots', description: 'Warm, buttery, and garlicky. Perfect for dipping.', price: 5.00, imageUrl: 'https://picsum.photos/400/300?random=34', composition: ['Dough', 'Garlic Butter', 'Parsley'], allergens: [{ id: 'v', name: 'Vegetarian' }] },
];

const MENU_TEMPLATES = [
    { 
        id: '1', vendorId: '1', name: 'Main Menu (Burgers)', 
        sections: [
            { id: 'sec-1-1', title: 'Signature Burgers', itemIds: ['101', '102', '103'] },
            { id: 'sec-1-2', title: 'Sides', itemIds: ['104'] }
        ]
    },
    { 
        id: '2', vendorId: '2', name: 'Main Menu (Pizza)', 
        sections: [
            { id: 'sec-2-1', title: 'Pizzas', itemIds: ['201', '202', '203'] },
            { id: 'sec-2-2', title: 'Starters', itemIds: ['204'] }
        ]
    },
];

const RESTAURANTS = [
  {
    id: '1', vendorId: '1', name: 'Burger Queen',
    description: 'Home of the Flame-Grilled Masterpiece. We serve the juiciest burgers in town.',
    bannerUrl: 'https://picsum.photos/1200/400?random=1',
    contact: { phone: '555-1234', email: 'contact@burgerqueen.com', address: '123 Burger Lane, Foodville' },
    openingHours: {
        monday: { isOpen: true, open: '11:00', close: '22:00' },
        tuesday: { isOpen: true, open: '11:00', close: '22:00' },
        wednesday: { isOpen: true, open: '11:00', close: '22:00' },
        thursday: { isOpen: true, open: '11:00', close: '22:00' },
        friday: { isOpen: true, open: '11:00', close: '23:00' },
        saturday: { isOpen: true, open: '11:00', close: '23:00' },
        sunday: { isOpen: false, open: '11:00', close: '22:00' },
    },
    paymentMethods: ['Credit Card', 'Cash', 'Stripe'],
    branding: { primaryColor: '#D97706', logoUrl: 'https://picsum.photos/200/200?random=11' },
    media: [
      { id: '1', type: 'video', title: 'How We Make Our Famous Burgers', source: 'https://www.w3schools.com/html/mov_bbb.mp4', description: 'A quick look behind the scenes at Burger Queen.' },
      { id: '2', type: 'text', title: 'Employee of the Month!', source: 'Congrats to Sarah J. for her amazing work this month!', description: 'Celebrating our amazing team.' },
    ],
    boardTemplateId: '1',
    assignedMenuTemplateIds: ['1'],
  },
  {
    id: '2', vendorId: '2', name: 'Pizza Palace',
    description: 'Authentic Italian pizza with the freshest ingredients. A slice of heaven!',
    bannerUrl: 'https://picsum.photos/1200/400?random=2',
    contact: { phone: '555-5678', email: 'ciao@pizzapalace.com', address: '456 Pizza Plaza, Foodville' },
    openingHours: {
        monday: { isOpen: false, open: '12:00', close: '23:00' },
        tuesday: { isOpen: true, open: '12:00', close: '23:00' },
        wednesday: { isOpen: true, open: '12:00', close: '23:00' },
        thursday: { isOpen: true, open: '12:00', close: '23:00' },
        friday: { isOpen: true, open: '12:00', close: '00:00' },
        saturday: { isOpen: true, open: '12:00', close: '00:00' },
        sunday: { isOpen: true, open: '12:00', close: '23:00' },
    },
    paymentMethods: ['Credit Card', 'PayPal', 'Bizum', 'Cash'],
    branding: { primaryColor: '#DC2626', logoUrl: 'https://picsum.photos/200/200?random=12' },
    media: [
       { id: '3', type: 'audio', title: 'Message from the Chef', source: 'https://www.w3schools.com/html/horse.ogg', description: 'Listen to Chef Giovanni talk about his passion for pizza.' },
       { id: '4', type: 'link', title: 'Catering Services', source: '#', description: 'Planning a party? Click to learn more.' },
    ],
    boardTemplateId: '2',
    assignedMenuTemplateIds: ['2'],
  },
];

const USERS = [
  { id: '2', name: 'Burger Queen Admin', username: 'vendor1', password: 'password', role: 'Vendor', vendorId: '1' },
  { id: '3', name: 'Pizza Palace Admin', username: 'vendor2', password: 'password', role: 'Vendor', vendorId: '2' },
  { id: '4', name: 'Super Admin', username: 'superadmin', password: 'password', role: 'SuperAdmin' },
  { 
    id: '5', name: 'Burger Restaurant Manager', username: 'restadmin1', password: 'password', role: 'RestaurantAdmin', 
    vendorId: '1', restaurantId: '1',
    permissions: { canViewAnalytics: true, canManageMenu: true, canManageSettings: false, canManageOrders: true },
    permissionSchedule: {
      monday: { isActive: true, startTime: '00:00', endTime: '23:59' },
      tuesday: { isActive: true, startTime: '00:00', endTime: '23:59' },
      wednesday: { isActive: true, startTime: '00:00', endTime: '23:59' },
      thursday: { isActive: true, startTime: '00:00', endTime: '23:59' },
      friday: { isActive: true, startTime: '00:00', endTime: '23:59' },
      saturday: { isActive: true, startTime: '00:00', endTime: '23:59' },
      sunday: { isActive: true, startTime: '00:00', endTime: '23:59' },
    }
  },
];

const toEmail = (username) => `${username.toLowerCase().replace(/\s/g, '')}@flowapp.test`;

async function seedDatabase() {
    console.log("Starting Supabase seed...");

    // 1. CLEAR TABLES
    const tables = ['orders', 'users', 'restaurants', 'vendors', 'boardTemplates', 'menuTemplates', 'menuItemTemplates'];
    for (const t of tables) {
        const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error && error.code !== 'PGRST116') {
             console.error(`Error clearing ${t}: ${error.message}`);
             console.error("HINT: Disable Row Level Security (RLS) in Supabase Dashboard for these tables if using the Anon Key.");
        }
    }
    console.log("Public tables cleared.");

    // 2. VENDORS
    const idMap = {};
    for (const v of VENDORS) {
        const { data, error } = await supabase.from('vendors').insert({ name: v.name }).select().single();
        if (data) {
            idMap[`vendor_${v.id}`] = data.id;
            console.log(`Created Vendor: ${v.name}`);
        } else {
            console.error(`Failed Vendor ${v.name}: ${error?.message}`);
        }
    }

    // 3. TEMPLATES
    for (const t of BOARD_TEMPLATES) {
        const newVendorId = idMap[`vendor_${t.vendorId}`];
        if (!newVendorId) continue;
        const { data } = await supabase.from('boardTemplates').insert({ ...t, id: undefined, vendorId: newVendorId }).select().single();
        if (data) idMap[`board_${t.id}`] = data.id;
    }
    for (const t of MENU_ITEM_TEMPLATES) {
        const newVendorId = idMap[`vendor_${t.vendorId}`];
        if (!newVendorId) continue;
        const { data } = await supabase.from('menuItemTemplates').insert({ ...t, id: undefined, vendorId: newVendorId }).select().single();
        if (data) idMap[`item_${t.id}`] = data.id;
    }
    for (const t of MENU_TEMPLATES) {
        const newVendorId = idMap[`vendor_${t.vendorId}`];
        if (!newVendorId) continue;
        const newSections = t.sections.map(sec => ({
            ...sec,
            itemIds: sec.itemIds.map(oldId => idMap[`item_${oldId}`] || oldId)
        }));
        const { data } = await supabase.from('menuTemplates').insert({ ...t, id: undefined, vendorId: newVendorId, sections: newSections }).select().single();
        if (data) idMap[`menu_${t.id}`] = data.id;
    }

    // 4. RESTAURANTS
    for (const r of RESTAURANTS) {
        const newVendorId = idMap[`vendor_${r.vendorId}`];
        const newBoardId = r.boardTemplateId ? idMap[`board_${r.boardTemplateId}`] : null;
        const newMenuIds = r.assignedMenuTemplateIds?.map(old => idMap[`menu_${old}`]).filter(Boolean);

        const { data } = await supabase.from('restaurants').insert({
            ...r,
            id: undefined,
            vendorId: newVendorId,
            boardTemplateId: newBoardId,
            assignedMenuTemplateIds: newMenuIds
        }).select().single();
        
        if (data) {
            idMap[`restaurant_${r.id}`] = data.id;
            console.log(`Created Restaurant: ${r.name}`);
        }
    }

    // 5. USERS
    for (const u of USERS) {
        if (!u.username) continue;
        const email = toEmail(u.username);
        const password = u.password || 'password';

        // Try SignUp
        let { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        
        if (authError && authError.message.includes('registered')) {
             const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
             if (signInData.user) authData.user = signInData.user;
        }

        if (authData.user) {
            const userId = authData.user.id;
            const newVendorId = u.vendorId ? idMap[`vendor_${u.vendorId}`] : null;
            const newRestId = u.restaurantId ? idMap[`restaurant_${u.restaurantId}`] : null;
            
            const { error: profileError } = await supabase.from('users').upsert({
                id: userId,
                name: u.name,
                username: u.username,
                role: u.role,
                vendorId: newVendorId,
                restaurantId: newRestId,
                permissions: u.permissions,
                permissionSchedule: u.permissionSchedule
            });
            
            if (!profileError) console.log(`Seeded User: ${u.username}`);
            else console.error(`Failed Profile ${u.username}: ${profileError.message}`);
        } else {
            console.error(`Failed Auth ${u.username}`);
        }
    }
}

seedDatabase();
