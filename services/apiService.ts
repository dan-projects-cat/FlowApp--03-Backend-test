import { USERS, VENDORS, RESTAURANTS, ORDERS, BOARD_TEMPLATES, MENU_TEMPLATES, MENU_ITEM_TEMPLATES } from '../data';
import { User, Vendor, Restaurant, Order, UserRole, RestaurantPermissions, BoardTemplate, MenuItemTemplate, MenuTemplate, CartItem, OrderItem } from '../types';

// Custom deep copy to handle Date objects correctly, which JSON.stringify/parse does not.
const deepCopy = <T>(data: T): T => {
    if (data === null || typeof data !== 'object') {
        return data;
    }

    if (data instanceof Date) {
        return new Date(data.getTime()) as any;
    }

    if (Array.isArray(data)) {
        return data.map(item => deepCopy(item)) as any;
    }

    const copied: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            copied[key] = deepCopy(data[key]);
        }
    }
    return copied as T;
};


// Deep copy initial data to simulate a mutable backend store
let users: User[] = deepCopy(USERS);
let vendors: Vendor[] = deepCopy(VENDORS);
let restaurants: Restaurant[] = deepCopy(RESTAURANTS);
let orders: Order[] = deepCopy(ORDERS);
let boardTemplates: BoardTemplate[] = deepCopy(BOARD_TEMPLATES);
let menuItemTemplates: MenuItemTemplate[] = deepCopy(MENU_ITEM_TEMPLATES);
let menuTemplates: MenuTemplate[] = deepCopy(MENU_TEMPLATES);


// Helper to simulate async operations
const simulateDelay = <T>(data: T): Promise<T> => new Promise(resolve => setTimeout(() => resolve(deepCopy(data)), 200));

// --- Auth Functions ---
export const signInUser = async (username: string, password?: string): Promise<User | null> => {
    if (!password) return simulateDelay(null);
    // DANGER: INSECURE PASSWORD CHECK FOR DEMO PURPOSES.
    const user = users.find(u => u.username === username && u.password === password);
    return simulateDelay(user ? user : null);
};

export const signOutUser = async (): Promise<void> => {
    return Promise.resolve();
};

// --- Data Fetching Functions ---
export const fetchUsers = (): Promise<User[]> => simulateDelay(users);
export const fetchVendors = (): Promise<Vendor[]> => simulateDelay(vendors);
export const fetchRestaurants = (): Promise<Restaurant[]> => simulateDelay(restaurants);
export const fetchOrders = (): Promise<Order[]> => simulateDelay(orders);
export const fetchBoardTemplates = (): Promise<BoardTemplate[]> => simulateDelay(boardTemplates);
export const fetchMenuItemTemplates = (): Promise<MenuItemTemplate[]> => simulateDelay(menuItemTemplates);
export const fetchMenuTemplates = (): Promise<MenuTemplate[]> => simulateDelay(menuTemplates);

// --- Data Mutation Functions ---

export const createVendor = async (vendorName: string, adminUsername: string, adminPassword: string): Promise<{ newVendor: Vendor, newVendorAdmin: User } | null> => {
    const newVendor: Vendor = { id: `v${Date.now()}`, name: vendorName };
    vendors.push(newVendor);
    
    const newVendorAdmin: User = {
        id: `u${Date.now()}`, name: `${vendorName} Admin`, username: adminUsername,
        password: adminPassword, role: UserRole.Vendor, vendorId: newVendor.id,
    };
    users.push(newVendorAdmin);

    return simulateDelay({ newVendor, newVendorAdmin });
};

export const updateVendor = async (updated: Vendor): Promise<Vendor | null> => {
    vendors = vendors.map(v => v.id === updated.id ? updated : v);
    return simulateDelay(updated);
};

export const deleteVendor = async (vendorId: string): Promise<boolean> => {
    vendors = vendors.filter(v => v.id !== vendorId);
    restaurants = restaurants.filter(r => r.vendorId !== vendorId);
    users = users.filter(u => u.vendorId !== vendorId);
    boardTemplates = boardTemplates.filter(t => t.vendorId !== vendorId);
    menuTemplates = menuTemplates.filter(t => t.vendorId !== vendorId);
    menuItemTemplates = menuItemTemplates.filter(t => t.vendorId !== vendorId);
    return simulateDelay(true);
};

export const createRestaurant = async (newRestaurantData: Omit<Restaurant, 'id'>): Promise<Restaurant | null> => {
    const newRestaurant: Restaurant = { ...newRestaurantData, id: `r${Date.now()}` };
    restaurants.push(newRestaurant);
    return simulateDelay(newRestaurant);
};

export const updateRestaurant = async (updated: Restaurant): Promise<Restaurant | null> => {
    restaurants = restaurants.map(r => r.id === updated.id ? updated : r);
    return simulateDelay(updated);
};

export const deleteRestaurant = async (restaurantId: string): Promise<boolean> => {
    restaurants = restaurants.filter(r => r.id !== restaurantId);
    users = users.map(u => {
        if (u.linkedRestaurantIds?.includes(restaurantId)) {
            return { ...u, linkedRestaurantIds: u.linkedRestaurantIds.filter(id => id !== restaurantId) };
        }
        return u;
    });
    return simulateDelay(true);
};

export const updateUser = async (updated: User): Promise<User | null> => {
    users = users.map(u => u.id === updated.id ? updated : u);
    return simulateDelay(updated);
};

export const deleteUser = async (userId: string): Promise<boolean> => {
    users = users.filter(u => u.id !== userId);
    return simulateDelay(true);
};

export const createRestaurantAdmin = async (name: string, username: string, password: string, restaurantId: string, vendorId?: string): Promise<User | null> => {
    const defaultPermissions: RestaurantPermissions = { canViewAnalytics: true, canManageMenu: true, canManageSettings: true, canManageOrders: true };
    const newAdmin: User = {
        id: `u${Date.now()}`, name, username, password, role: UserRole.RestaurantAdmin, 
        vendorId: vendorId, restaurantId: restaurantId, permissions: defaultPermissions
    };
    users.push(newAdmin);
    return simulateDelay(newAdmin);
};

export const createOrder = async (orderData: { restaurantId: string, items: CartItem[], subtotal: number, taxes: number, deliveryFee: number, total: number }): Promise<Order | null> => {
    const now = new Date();
    
    // Strip the transient cartItemId from each item before saving
    const orderItems: OrderItem[] = orderData.items.map(({ cartItemId, ...rest }) => rest);

    const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        restaurantId: orderData.restaurantId,
        items: orderItems,
        subtotal: orderData.subtotal,
        taxes: orderData.taxes,
        deliveryFee: orderData.deliveryFee,
        total: orderData.total,
        status: 'pending',
        orderTime: now,
        lastUpdateTime: now,
    };
    orders.unshift(newOrder);
    return simulateDelay(newOrder);
};

export const updateOrderStatus = async (orderId: string, status: string, reason?: string, userId?: string): Promise<Order | null> => {
    let updatedOrder: Order | null = null;
    orders = orders.map(o => {
        if (o.id === orderId) {
            const updateData: any = { status, lastUpdateTime: new Date() };
            if (reason) updateData.rejectionReason = reason;
            if (userId) updateData.processedByUserId = userId;
            if (status === 'completed') {
                const completionMinutes = (new Date().getTime() - o.orderTime.getTime()) / 60000;
                updateData.completionTime = Math.round(completionMinutes);
            }
            updatedOrder = { ...o, ...updateData };
            return updatedOrder;
        }
        return o;
    });
    return simulateDelay(updatedOrder);
};

// Generic Template Handlers
const createTemplate = async <T>(collection: T[], data: Omit<T, 'id'>, prefix: string): Promise<T | null> => {
    const newTemplate = { ...data, id: `${prefix}-${Date.now()}` } as unknown as T;
    collection.push(newTemplate);
    return simulateDelay(newTemplate);
};

const updateTemplate = async <T extends {id: any}>(collection: T[], template: T): Promise<T | null> => {
    const index = collection.findIndex(t => t.id === template.id);
    if (index > -1) {
        collection[index] = template;
    }
    return simulateDelay(template);
};

const deleteTemplate = async (templateId: string): Promise<boolean> => {
    return simulateDelay(true); // Simulate success, logic is handled in specific funcs
};

// Board Templates
export const createBoardTemplate = (data: Omit<BoardTemplate, 'id'>) => createTemplate(boardTemplates, data, 'bt');
export const updateBoardTemplate = (template: BoardTemplate) => updateTemplate(boardTemplates, template);
export const deleteBoardTemplate = async (templateId: string) => {
    const success = await deleteTemplate(templateId);
    if (success) {
        boardTemplates = boardTemplates.filter(t => t.id !== templateId);
        restaurants = restaurants.map(r => r.boardTemplateId === templateId ? { ...r, boardTemplateId: undefined } : r);
    }
    return success;
};

// Menu Item Templates
export const createMenuItemTemplate = (data: Omit<MenuItemTemplate, 'id'>) => createTemplate(menuItemTemplates, data, 'mit');
export const updateMenuItemTemplate = (item: MenuItemTemplate) => updateTemplate(menuItemTemplates, item);
export const deleteMenuItemTemplate = async (itemId: string): Promise<boolean> => {
    const success = await deleteTemplate(itemId);
    if(success) {
        menuItemTemplates = menuItemTemplates.filter(i => i.id !== itemId);
        menuTemplates = menuTemplates.map(menu => ({
            ...menu,
            sections: menu.sections.map(section => ({
                ...section,
                itemIds: section.itemIds.filter(id => id !== itemId)
            }))
        }));
    }
    return success;
};

// Menu Templates
export const createMenuTemplate = (data: Omit<MenuTemplate, 'id'>) => createTemplate(menuTemplates, data, 'mt');
export const updateMenuTemplate = (template: MenuTemplate) => updateTemplate(menuTemplates, template);
export const deleteMenuTemplate = async (templateId: string) => {
    const success = await deleteTemplate(templateId);
    if (success) {
        menuTemplates = menuTemplates.filter(t => t.id !== templateId);
        restaurants = restaurants.map(r => ({
            ...r,
            assignedMenuTemplateIds: r.assignedMenuTemplateIds?.filter(id => id !== templateId)
        }));
    }
    return success;
};