
import { User, UserRole, Vendor, Restaurant, Allergen, Order, MediaType, PaymentMethod, BoardTemplate, MenuItemTemplate, MenuTemplate, Intolerance } from './types';

// NOTE: The default consumer user has been removed. Consumers will now be handled as "guests".
export const USERS: User[] = [
  { id: '2', name: 'Burger Queen Admin', username: 'vendor1', password: 'password', role: UserRole.Vendor, vendorId: '1' },
  { id: '3', name: 'Pizza Palace Admin', username: 'vendor2', password: 'password', role: UserRole.Vendor, vendorId: '2' },
  { id: '4', name: 'Super Admin', username: 'superadmin', password: 'password', role: UserRole.SuperAdmin },
  { 
    id: '5', 
    name: 'Burger Restaurant Manager', 
    username: 'restadmin1', 
    password: 'password', 
    role: UserRole.RestaurantAdmin, 
    vendorId: '1', 
    restaurantId: '1',
    permissions: {
        canViewAnalytics: true,
        canManageMenu: true,
        canManageSettings: false,
        canManageOrders: true,
    },
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

export const VENDORS: Vendor[] = [
    { id: '1', name: 'Burger Queen Group' },
    { id: '2', name: 'Pizza Palace Inc.' },
];

export const ALLERGENS: Allergen[] = [
    { id: 'gf', name: 'Gluten-Free' },
    { id: 'v', name: 'Vegetarian' },
    { id: 's', name: 'Spicy' },
];

export const INTOLERANCES: Intolerance[] = [
    { id: 'lactose', name: 'Lactose', icon: 'LactoseIcon' },
    { id: 'nuts', name: 'Nuts', icon: 'NutsIcon' },
];

export const MENU_ITEM_TEMPLATES: MenuItemTemplate[] = [
    { id: '101', vendorId: '1', name: 'Classic Cheeseburger', description: 'A timeless classic with a juicy beef patty, melted cheddar, pickles, onions, ketchup, and mustard on a toasted bun.', price: 8.99, imageUrl: 'https://picsum.photos/400/300?random=21', composition: ['Beef Patty (1/3 lb)', 'Cheddar Cheese Slice', 'Dill Pickles', 'White Onion', 'Toasted Sesame Bun'], intolerances: [INTOLERANCES[0]] },
    { id: '102', vendorId: '1', name: 'Bacon Deluxe', description: 'Our classic burger topped with crispy bacon and our special deluxe sauce.', price: 10.99, imageUrl: 'https://picsum.photos/400/300?random=22', composition: ['Beef Patty (1/3 lb)', 'Crispy Bacon (2 strips)', 'Cheddar Cheese Slice', 'Deluxe Sauce'], discount: { percentage: 10, showToConsumer: true } },
    { id: '103', vendorId: '1', name: 'Spicy Jalapeño Burger', description: 'For those who like it hot! Featuring pepper jack cheese and fresh jalapeños.', price: 9.99, imageUrl: 'https://picsum.photos/400/300?random=23', composition: ['Beef Patty (1/3 lb)', 'Pepper Jack Cheese', 'Fresh Jalapeños', 'Spicy Mayo'], allergens: [ALLERGENS[2]] },
    { id: '104', vendorId: '1', name: 'Crispy Fries', description: 'Golden, crispy, and perfectly salted.', price: 3.50, imageUrl: 'https://picsum.photos/400/300?random=24', composition: ['Potatoes', 'Canola Oil', 'Salt'], allergens: [ALLERGENS[0], ALLERGENS[1]] },
    { id: '201', vendorId: '2', name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, San Marzano tomatoes, and basil.', price: 14.00, imageUrl: 'https://picsum.photos/400/300?random=31', composition: ['Fresh Mozzarella', 'San Marzano Tomato Sauce', 'Fresh Basil', 'Olive Oil'], allergens: [ALLERGENS[1]], intolerances: [INTOLERANCES[0]] },
    { id: '202', vendorId: '2', name: 'Pepperoni Passion', description: 'Loaded with spicy pepperoni and gooey mozzarella.', price: 16.50, imageUrl: 'https://picsum.photos/400/300?random=32', composition: ['Spicy Pepperoni', 'Mozzarella', 'Tomato Sauce'] },
    { id: '203', vendorId: '2', name: 'Veggie Supreme', description: 'A garden on a pizza! Bell peppers, onions, olives, and mushrooms.', price: 15.50, imageUrl: 'https://picsum.photos/400/300?random=33', composition: ['Bell Peppers', 'Red Onions', 'Black Olives', 'Mushrooms', 'Mozzarella'], allergens: [ALLERGENS[1]] },
    { id: '204', vendorId: '2', name: 'Garlic Knots', description: 'Warm, buttery, and garlicky. Perfect for dipping.', price: 5.00, imageUrl: 'https://picsum.photos/400/300?random=34', composition: ['Dough', 'Garlic Butter', 'Parsley'], allergens: [ALLERGENS[1]] },
];

export const MENU_TEMPLATES: MenuTemplate[] = [
    { 
        id: '1', 
        vendorId: '1', 
        name: 'Main Menu (Burgers)', 
        sections: [
            { id: 'sec-1-1', title: 'Signature Burgers', itemIds: ['101', '102', '103'] },
            { id: 'sec-1-2', title: 'Sides', itemIds: ['104'] }
        ]
    },
    { 
        id: '2', 
        vendorId: '2', 
        name: 'Main Menu (Pizza)', 
        sections: [
            { id: 'sec-2-1', title: 'Pizzas', itemIds: ['201', '202', '203'] },
            { id: 'sec-2-2', title: 'Starters', itemIds: ['204'] }
        ]
    },
];

export const BOARD_TEMPLATES: BoardTemplate[] = [
    {
        id: '1',
        vendorId: '1',
        name: 'Standard Burger Workflow',
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
        id: '2',
        vendorId: '2',
        name: 'Standard Pizza Workflow',
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

export const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    vendorId: '1',
    name: 'Burger Queen',
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
    paymentMethods: [PaymentMethod.CreditCard, PaymentMethod.Cash, PaymentMethod.Stripe],
    branding: { primaryColor: '#D97706', logoUrl: 'https://picsum.photos/200/200?random=11' },
    media: [
      { id: '1', type: MediaType.Video, title: 'How We Make Our Famous Burgers', source: 'https://www.w3schools.com/html/mov_bbb.mp4', description: 'A quick look behind the scenes at Burger Queen.' },
      { id: '2', type: MediaType.Video, title: 'Summer Special Commercial', source: 'https://media.w3.org/2010/05/sintel/trailer_400p.mp4', description: 'Check out our new summer lineup!' },
      { id: '3', type: MediaType.Text, title: 'Employee of the Month!', source: 'Congrats to Sarah J. for her amazing work this month!', description: 'Celebrating our amazing team.' },
    ],
    boardTemplateId: '1',
    assignedMenuTemplateIds: ['1'],
  },
  {
    id: '2',
    vendorId: '2',
    name: 'Pizza Palace',
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
    paymentMethods: [PaymentMethod.CreditCard, PaymentMethod.PayPal, PaymentMethod.Bizum, PaymentMethod.Cash],
    branding: { primaryColor: '#DC2626', logoUrl: 'https://picsum.photos/200/200?random=12' },
    media: [
       { id: '4', type: MediaType.Video, title: 'Hand-Tossing Dough', source: 'https://www.w3schools.com/html/mov_bbb.mp4', description: 'See how our masters do it.' },
       { id: '5', type: MediaType.Audio, title: 'Message from the Chef', source: 'https://www.w3schools.com/html/horse.ogg', description: 'Listen to Chef Giovanni talk about his passion for pizza.' },
       { id: '6', type: MediaType.Link, title: 'Catering Services', source: '#', description: 'Planning a party? Click to learn more.' },
    ],
    boardTemplateId: '2',
    assignedMenuTemplateIds: ['2'],
  },
];

const menuItemsWithRestaurant = MENU_ITEM_TEMPLATES.map(m => ({ ...m, restaurantId: RESTAURANTS.find(r => r.vendorId === m.vendorId)!.id }));

const calculateOrderTotals = (items: any[]) => {
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxes = subtotal * 0.08;
    const deliveryFee = 5.00;
    const total = subtotal + taxes + deliveryFee;
    return { subtotal, taxes, deliveryFee, total };
}

export const ORDERS: Order[] = [
    { id: 'ORD-123', restaurantId: '1', items: [{...menuItemsWithRestaurant[0], quantity: 1, removedIngredients: ['White Onion']}, {...menuItemsWithRestaurant[3], quantity: 1}], ...calculateOrderTotals([{...menuItemsWithRestaurant[0], quantity: 1}, {...menuItemsWithRestaurant[3], quantity: 1}]), status: 'pending', orderTime: new Date(Date.now() - 5 * 60000), lastUpdateTime: new Date(Date.now() - 5 * 60000) },
    { id: 'ORD-124', restaurantId: '1', items: [{...menuItemsWithRestaurant[1], quantity: 2}], ...calculateOrderTotals([{...menuItemsWithRestaurant[1], quantity: 2}]), status: 'in-progress', orderTime: new Date(Date.now() - 10 * 60000), lastUpdateTime: new Date(Date.now() - 2 * 60000), processedByUserId: '5' },
    { id: 'ORD-125', restaurantId: '2', items: [{...menuItemsWithRestaurant[5], quantity: 1}], ...calculateOrderTotals([{...menuItemsWithRestaurant[5], quantity: 1}]), status: 'ready-for-pickup', orderTime: new Date(Date.now() - 15 * 60000), lastUpdateTime: new Date(Date.now() - 1 * 60000) },
    { id: 'ORD-126', restaurantId: '1', items: [{...menuItemsWithRestaurant[2], quantity: 1}], ...calculateOrderTotals([{...menuItemsWithRestaurant[2], quantity: 1}]), status: 'accepted', orderTime: new Date(Date.now() - 8 * 60000), lastUpdateTime: new Date(Date.now() - 4 * 60000), processedByUserId: '5' },
    { id: 'ORD-127', restaurantId: '1', items: [{...menuItemsWithRestaurant[0], quantity: 1}], ...calculateOrderTotals([{...menuItemsWithRestaurant[0], quantity: 1}]), status: 'completed', orderTime: new Date(Date.now() - 30 * 60000), lastUpdateTime: new Date(Date.now() - 10 * 60000), completionTime: 20, processedByUserId: '5' },
    { id: 'ORD-128', restaurantId: '2', items: [{...menuItemsWithRestaurant[4], quantity: 2}], ...calculateOrderTotals([{...menuItemsWithRestaurant[4], quantity: 2}]), status: 'completed', orderTime: new Date(Date.now() - 45 * 60000), lastUpdateTime: new Date(Date.now() - 25 * 60000), completionTime: 20 },
    { id: 'ORD-129', restaurantId: '1', items: [{...menuItemsWithRestaurant[3], quantity: 3}], ...calculateOrderTotals([{...menuItemsWithRestaurant[3], quantity: 3}]), status: 'completed', orderTime: new Date(Date.now() - 60 * 60000), lastUpdateTime: new Date(Date.now() - 48 * 60000), completionTime: 12, processedByUserId: '5' },
    { id: 'ORD-130', restaurantId: '1', items: [{...menuItemsWithRestaurant[1], quantity: 1}], ...calculateOrderTotals([{...menuItemsWithRestaurant[1], quantity: 1}]), status: 'rejected', orderTime: new Date(Date.now() - 5 * 60000), lastUpdateTime: new Date(Date.now() - 3 * 60000), rejectionReason: 'Restaurant is too busy to accept new orders.', processedByUserId: '5' },
];
