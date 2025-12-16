
import { supabase } from '../supabaseClient';
import { User, Vendor, Restaurant, Order, UserRole, RestaurantPermissions, BoardTemplate, MenuItemTemplate, MenuTemplate, CartItem, OrderItem } from '../types';

// --- Helper Functions ---

// Fake email generator for username-based login
const toEmail = (username: string) => `${username.toLowerCase().replace(/\s/g, '')}@flowapp.test`;

// Generic Fetch Wrapper
const fetchTable = async <T>(tableName: string): Promise<T[]> => {
    try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            // Return empty array on error to prevent app crash
            return [];
        }
        
        if (!data) return [];

        // Supabase returns JSON columns as objects automatically, which matches our types mostly.
        // Date strings from Postgres (timestamptz) need to be converted to JS Date objects if the app expects Date objects.
        return data.map((item: any) => {
            if (item.orderTime) item.orderTime = new Date(item.orderTime);
            if (item.lastUpdateTime) item.lastUpdateTime = new Date(item.lastUpdateTime);
            return item;
        }) as T[];
    } catch (e) {
        console.error(`Unexpected error fetching ${tableName}:`, e);
        return [];
    }
};

// --- Auth Functions ---

export const signInUser = async (username: string, password?: string): Promise<{ user: User | null, error?: string }> => {
    if (!password) return { user: null, error: "Password is required" };
    const email = toEmail(username);
    
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error("Login failed:", authError.message);
            return { user: null, error: authError.message };
        }

        if (!authData.user) {
             return { user: null, error: "Authentication failed." };
        }

        // Fetch User Profile from public 'users' table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
        // RECOVERY LOGIC:
        if (userError || !userData) {
             console.warn("User authenticated but profile fetch failed. Attempting auto-creation/recovery...", userError);

             const defaultRole = username === 'superadmin' ? UserRole.SuperAdmin : UserRole.Consumer;
             
             // Try to create the missing profile
             const { data: newProfile, error: createError } = await supabase.from('users').upsert({
                 id: authData.user.id,
                 username: username,
                 name: username.charAt(0).toUpperCase() + username.slice(1), // Capitalize
                 role: defaultRole,
             }).select().single();

             if (createError) {
                 console.error("Critical: Failed to auto-create missing user profile.", createError);
                 return { user: null, error: "Profile creation failed. Check database permissions." };
             }
             
             console.log("Successfully auto-created user profile.");
             return { user: newProfile as User };
        }

        return { user: userData as User };

    } catch (error: any) {
        console.error("Login exception:", error.message);
        return { user: null, error: error.message };
    }
};

export const signOutUser = async (): Promise<void> => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
    }
};

// --- Fetch Functions ---
export const fetchUsers = () => fetchTable<User>('users');
export const fetchVendors = () => fetchTable<Vendor>('vendors');
export const fetchRestaurants = () => fetchTable<Restaurant>('restaurants');
export const fetchOrders = () => fetchTable<Order>('orders');
export const fetchBoardTemplates = () => fetchTable<BoardTemplate>('boardTemplates');
export const fetchMenuItemTemplates = () => fetchTable<MenuItemTemplate>('menuItemTemplates');
export const fetchMenuTemplates = () => fetchTable<MenuTemplate>('menuTemplates');


// --- Mutation Functions ---

export const createVendor = async (vendorName: string, adminUsername: string, adminPassword: string) => {
    // 1. Create Vendor
    const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .insert({ name: vendorName })
        .select()
        .single();
        
    if (vendorError) { console.error(vendorError); return null; }
    
    // 2. Create Auth User
    const email = toEmail(adminUsername);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: adminPassword,
    });
    
    if (authError || !authData.user) { console.error("Auth creation failed", authError); return null; }

    // 3. Create Public Profile
    const newAdminUser = {
        id: authData.user.id,
        name: `${vendorName} Admin`,
        username: adminUsername,
        role: UserRole.Vendor,
        vendorId: vendorData.id
    };
    
    const { error: profileError } = await supabase.from('users').insert(newAdminUser);
    
    if (profileError) { console.error("Profile creation failed", profileError); return null; }

    return { newVendor: vendorData as Vendor, newVendorAdmin: newAdminUser as User };
};

export const updateVendor = async (updated: Vendor) => {
    const { data, error } = await supabase.from('vendors').update({ name: updated.name }).eq('id', updated.id).select().single();
    return data as Vendor;
};

export const deleteVendor = async (vendorId: string): Promise<boolean> => {
    // Cascade delete manually if not set in DB
    await supabase.from('restaurants').delete().eq('vendorId', vendorId);
    await supabase.from('users').delete().eq('vendorId', vendorId);
    await supabase.from('boardTemplates').delete().eq('vendorId', vendorId);
    await supabase.from('menuTemplates').delete().eq('vendorId', vendorId);
    await supabase.from('menuItemTemplates').delete().eq('vendorId', vendorId);
    
    const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
    return !error;
};

export const createRestaurant = async (data: Omit<Restaurant, 'id'>) => {
    const { data: res, error } = await supabase.from('restaurants').insert(data).select().single();
    if (error) console.error(error);
    return res as Restaurant;
};

export const updateRestaurant = async (updated: Restaurant) => {
    const { id, ...data } = updated;
    const { data: res, error } = await supabase.from('restaurants').update(data).eq('id', id).select().single();
    return res as Restaurant;
};

export const deleteRestaurant = async (restaurantId: string) => {
    const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId);
    return !error;
};

export const updateUser = async (updated: User) => {
    const { id, ...data } = updated;
    // Don't send password to public table
    const { password, ...safeData } = data as any; 
    const { data: res, error } = await supabase.from('users').update(safeData).eq('id', id).select().single();
    return res as User;
};

export const deleteUser = async (userId: string) => {
    // Note: This deletes the public profile. To delete the Auth user, you need Admin API keys.
    const { error } = await supabase.from('users').delete().eq('id', userId);
    return !error;
};

export const createRestaurantAdmin = async (name: string, username: string, password: string, restaurantId: string, vendorId?: string) => {
    const email = toEmail(username);
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    
    if (authError || !authData.user) return null;

    const defaultPermissions: RestaurantPermissions = { canViewAnalytics: true, canManageMenu: true, canManageSettings: true, canManageOrders: true };
    const newUser = {
        id: authData.user.id,
        name, username, role: UserRole.RestaurantAdmin,
        vendorId, restaurantId, permissions: defaultPermissions
    };
    
    const { data, error } = await supabase.from('users').insert(newUser).select().single();
    return data as User;
};

export const createOrder = async (orderData: { restaurantId: string, items: CartItem[], subtotal: number, taxes: number, deliveryFee: number, total: number }) => {
    const items = orderData.items.map(({ cartItemId, ...rest }) => rest);
    const now = new Date();
    
    const newOrder = {
        ...orderData,
        items,
        status: 'pending',
        orderTime: now.toISOString(),
        lastUpdateTime: now.toISOString()
    };
    
    const { data, error } = await supabase.from('orders').insert(newOrder).select().single();
    if(data) {
        data.orderTime = new Date(data.orderTime);
        data.lastUpdateTime = new Date(data.lastUpdateTime);
    }
    return data as Order;
};

export const updateOrderStatus = async (orderId: string, status: string, reason?: string, userId?: string) => {
    const updates: any = { status, lastUpdateTime: new Date().toISOString() };
    if (reason) updates.rejectionReason = reason;
    if (userId) updates.processedByUserId = userId;
    
    const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select().single();
    if(data) {
        data.orderTime = new Date(data.orderTime);
        data.lastUpdateTime = new Date(data.lastUpdateTime);
    }
    return data as Order;
};

// --- Templates ---
const createTmpl = async (col: string, data: any) => {
    const { data: res } = await supabase.from(col).insert(data).select().single();
    return res;
}
const updateTmpl = async (col: string, data: any) => {
    const { id, ...rest } = data;
    const { data: res } = await supabase.from(col).update(rest).eq('id', id).select().single();
    return res;
}
const deleteTmpl = async (col: string, id: string) => {
    const { error } = await supabase.from(col).delete().eq('id', id);
    return !error;
}

export const createBoardTemplate = (d: any) => createTmpl('boardTemplates', d);
export const updateBoardTemplate = (d: any) => updateTmpl('boardTemplates', d);
export const deleteBoardTemplate = (id: string) => deleteTmpl('boardTemplates', id);

export const createMenuTemplate = (d: any) => createTmpl('menuTemplates', d);
export const updateMenuTemplate = (d: any) => updateTmpl('menuTemplates', d);
export const deleteMenuTemplate = (id: string) => deleteTmpl('menuTemplates', id);

export const createMenuItemTemplate = (d: any) => createTmpl('menuItemTemplates', d);
export const updateMenuItemTemplate = (d: any) => updateTmpl('menuItemTemplates', d);
export const deleteMenuItemTemplate = (id: string) => deleteTmpl('menuItemTemplates', id);
