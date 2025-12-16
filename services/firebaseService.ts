
import { 
    collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, 
    query, where, writeBatch, documentId, Timestamp 
} from 'firebase/firestore';
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut 
} from 'firebase/auth';

import { db, auth } from '../firebaseConfig'; // Use the initialized services
import { User, Vendor, Restaurant, Order, UserRole, RestaurantPermissions, PermissionSchedule, BoardTemplate, MenuItemTemplate, MenuTemplate, CartItem, OrderItem } from '../types';

// Initialize Firebase - REMOVED, now handled in firebaseConfig.ts

// Helper to convert Firestore Timestamps to JS Dates in nested objects
const convertTimestamps = (data: any) => {
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            convertTimestamps(data[key]);
        }
    }
    return data;
};


// --- Auth Functions ---

export const signInUser = async (username: string, password?: string): Promise<User | null> => {
    if (!password) return null;
    try {
        // Firebase Auth uses email, but we use username. We'll query our user collection.
        const q = query(collection(db, 'users'), where('username', '==', username));
        const userQuerySnapshot = await getDocs(q);

        if (userQuerySnapshot.empty) {
            console.log('No user found with that username.');
            return null;
        }

        // Assuming username is unique, get the user's email to sign in
        const userData = userQuerySnapshot.docs[0].data() as User;
        
        // DANGER: INSECURE PASSWORD CHECK FOR DEMO PURPOSES.
        // This logic directly compares a plaintext password stored in the database.
        // In a production environment, this is a critical security vulnerability.
        // NEVER store plaintext passwords.
        // A secure implementation should:
        // 1. Use Firebase Authentication (signInWithEmailAndPassword).
        // 2. Store hashed and salted passwords on the backend if not using a service like Firebase Auth.
        // 3. The client should never see or handle the stored password/hash.
        if (userData.password !== password) {
             console.log('Password does not match.');
             return null;
        }
        
        // You would typically sign in with Firebase Auth here if you stored emails.
        // const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        
        const docId = userQuerySnapshot.docs[0].id;
        return { ...convertTimestamps(userData), id: docId } as User;

    } catch (error) {
        console.error("Error signing in:", error);
        return null;
    }
};

export const signOutUser = async (): Promise<void> => {
    // In a real app with Firebase Auth: await signOut(auth);
    return Promise.resolve();
};

// --- Data Fetching Functions ---
const fetchDataFromCollection = async <T>(collectionName: string): Promise<T[]> => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ ...convertTimestamps(doc.data()), id: doc.id } as unknown as T));
};

export const fetchUsers = (): Promise<User[]> => fetchDataFromCollection<User>('users');
export const fetchVendors = (): Promise<Vendor[]> => fetchDataFromCollection<Vendor>('vendors');
export const fetchRestaurants = (): Promise<Restaurant[]> => fetchDataFromCollection<Restaurant>('restaurants');
export const fetchOrders = (): Promise<Order[]> => fetchDataFromCollection<Order>('orders');
export const fetchBoardTemplates = (): Promise<BoardTemplate[]> => fetchDataFromCollection<BoardTemplate>('boardTemplates');
export const fetchMenuItemTemplates = (): Promise<MenuItemTemplate[]> => fetchDataFromCollection<MenuItemTemplate>('menuItemTemplates');
export const fetchMenuTemplates = (): Promise<MenuTemplate[]> => fetchDataFromCollection<MenuTemplate>('menuTemplates');


// --- Data Mutation Functions ---

export const createVendor = async (vendorName: string, adminUsername: string, adminPassword: string) => {
    const newVendorRef = await addDoc(collection(db, 'vendors'), { name: vendorName });
    
    const newVendorAdmin: Omit<User, 'id'> = {
        name: `${vendorName} Admin`,
        username: adminUsername,
        password: adminPassword, // In production, hash this or use Firebase Auth!
        role: UserRole.Vendor,
        vendorId: newVendorRef.id,
    };
    const newUserRef = await addDoc(collection(db, 'users'), newVendorAdmin);

    return { 
        newVendor: { id: newVendorRef.id, name: vendorName },
        newVendorAdmin: { ...newVendorAdmin, id: newUserRef.id }
    };
};

export const updateVendor = async (updated: Vendor): Promise<Vendor> => {
    const vendorRef = doc(db, 'vendors', String(updated.id));
    await updateDoc(vendorRef, { name: updated.name });
    return updated;
};

export const deleteVendor = async (vendorId: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Delete the vendor
    batch.delete(doc(db, 'vendors', vendorId));

    // 2. Find and delete associated restaurants
    const restQuery = query(collection(db, 'restaurants'), where('vendorId', '==', vendorId));
    const restSnapshot = await getDocs(restQuery);
    restSnapshot.docs.forEach(d => batch.delete(d.ref));

    // 3. Find and delete associated users
    const userQuery = query(collection(db, 'users'), where('vendorId', '==', vendorId));
    const userSnapshot = await getDocs(userQuery);
    userSnapshot.docs.forEach(d => batch.delete(d.ref));
    
    // 4. Find and delete associated templates (boards, menus, items)
    const boardQuery = query(collection(db, 'boardTemplates'), where('vendorId', '==', vendorId));
    const boardSnapshot = await getDocs(boardQuery);
    boardSnapshot.docs.forEach(d => batch.delete(d.ref));
    
    const menuQuery = query(collection(db, 'menuTemplates'), where('vendorId', '==', vendorId));
    const menuSnapshot = await getDocs(menuQuery);
    menuSnapshot.docs.forEach(d => batch.delete(d.ref));

    const itemQuery = query(collection(db, 'menuItemTemplates'), where('vendorId', '==', vendorId));
    const itemSnapshot = await getDocs(itemQuery);
    itemSnapshot.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();
};

export const createRestaurant = async (newRestaurantData: Omit<Restaurant, 'id'>): Promise<Restaurant> => {
    const docRef = await addDoc(collection(db, 'restaurants'), newRestaurantData);
    return { ...newRestaurantData, id: docRef.id };
};

export const updateRestaurant = async (updated: Restaurant): Promise<Restaurant> => {
    const { id, ...dataToUpdate } = updated;
    const restRef = doc(db, 'restaurants', String(id));
    await updateDoc(restRef, dataToUpdate);
    return updated;
};

export const deleteRestaurant = async (restaurantId: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Delete the restaurant document
    batch.delete(doc(db, 'restaurants', restaurantId));

    // 2. Find and unlink users who have this restaurant linked for data integrity
    const usersQuery = query(collection(db, 'users'), where('linkedRestaurantIds', 'array-contains', restaurantId));
    const usersSnapshot = await getDocs(usersQuery);

    usersSnapshot.forEach(userDoc => {
        const userData = userDoc.data() as User;
        const newLinkedIds = userData.linkedRestaurantIds?.filter(id => id !== restaurantId);
        batch.update(userDoc.ref, { linkedRestaurantIds: newLinkedIds });
    });

    await batch.commit();
    // Note: Does not delete associated orders for historical data purposes.
};

export const updateUser = async (updated: User): Promise<User> => {
    const { id, ...dataToUpdate } = updated;
    const userRef = doc(db, 'users', String(id));
    await updateDoc(userRef, dataToUpdate);
    return updated;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId));
};

export const createRestaurantAdmin = async (name: string, username: string, password: string, restaurantId: string, vendorId?: string): Promise<User> => {
    const defaultPermissions: RestaurantPermissions = { canViewAnalytics: true, canManageMenu: true, canManageSettings: true, canManageOrders: true };
    const newAdminData: Omit<User, 'id'> = {
        name, username, password, role: UserRole.RestaurantAdmin, 
        vendorId: vendorId, 
        restaurantId: restaurantId, 
        permissions: defaultPermissions
    };
    const docRef = await addDoc(collection(db, 'users'), newAdminData);
    return { ...newAdminData, id: docRef.id };
};

export const createOrder = async (orderData: { restaurantId: string, items: CartItem[], subtotal: number, taxes: number, deliveryFee: number, total: number }): Promise<Order> => {
    const now = Timestamp.fromDate(new Date());
    
    // Strip the transient cartItemId from each item before saving
    const orderItems: OrderItem[] = orderData.items.map(({ cartItemId, ...rest }) => rest);

    const newOrderData = {
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
    const docRef = await addDoc(collection(db, 'orders'), newOrderData);
    
    // Fetch the full document to return it with the server timestamp
    const newDoc = await getDoc(docRef);

    return { ...convertTimestamps(newDoc.data()), id: docRef.id } as Order;
};

export const updateOrderStatus = async (orderId: string, status: string, reason?: string, userId?: string): Promise<Order | null> => {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
        status,
        lastUpdateTime: Timestamp.fromDate(new Date()),
    };
    if (reason) {
        updateData.rejectionReason = reason;
    }
    if (userId) {
        updateData.processedByUserId = userId;
    }
    if (status === 'completed') {
        const orderSnap = await getDoc(orderRef);
        const orderData = orderSnap.data() as Order;
        const completionMinutes = (new Date().getTime() - new Date(orderData.orderTime).getTime()) / 60000;
        updateData.completionTime = Math.round(completionMinutes);
    }
    await updateDoc(orderRef, updateData);
    const updatedDoc = await getDoc(orderRef);
    return { ...convertTimestamps(updatedDoc.data()), id: updatedDoc.id } as Order;
};

// Generic Template Handlers
const createTemplate = async <T>(collectionName: string, data: Omit<T, 'id'>): Promise<T> => {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { ...data, id: docRef.id } as T;
};

const updateTemplate = async <T extends {id: any}>(collectionName: string, template: T): Promise<T> => {
    const { id, ...dataToUpdate } = template;
    const docRef = doc(db, collectionName, String(id));
    await updateDoc(docRef, dataToUpdate);
    return template;
};

const deleteTemplate = async (collectionName: string, templateId: string): Promise<void> => {
    await deleteDoc(doc(db, collectionName, templateId));
};

// Board Templates
export const createBoardTemplate = (data: Omit<BoardTemplate, 'id'>) => createTemplate<BoardTemplate>('boardTemplates', data);
export const updateBoardTemplate = (template: BoardTemplate) => updateTemplate<BoardTemplate>('boardTemplates', template);
export const deleteBoardTemplate = async (templateId: string) => {
    await deleteTemplate('boardTemplates', templateId);
    // Unlink from restaurants
    const q = query(collection(db, 'restaurants'), where('boardTemplateId', '==', templateId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { boardTemplateId: null });
    });
    await batch.commit();
};

// Menu Item Templates
export const createMenuItemTemplate = (data: Omit<MenuItemTemplate, 'id'>) => createTemplate<MenuItemTemplate>('menuItemTemplates', data);
export const updateMenuItemTemplate = (item: MenuItemTemplate) => updateTemplate<MenuItemTemplate>('menuItemTemplates', item);
export const deleteMenuItemTemplate = async (itemId: string): Promise<void> => {
    const batch = writeBatch(db);
    
    // 1. Delete the item itself
    batch.delete(doc(db, 'menuItemTemplates', itemId));

    // 2. Query all menu templates to find ones containing the item and remove it
    const menuTemplatesSnapshot = await getDocs(collection(db, 'menuTemplates'));
    
    menuTemplatesSnapshot.forEach(menuDoc => {
        const menu = menuDoc.data() as MenuTemplate;
        let needsUpdate = false;
        const newSections = menu.sections.map(section => {
            if (section.itemIds.includes(itemId)) {
                needsUpdate = true;
                return { ...section, itemIds: section.itemIds.filter(id => id !== itemId) };
            }
            return section;
        });

        if (needsUpdate) {
            batch.update(menuDoc.ref, { sections: newSections });
        }
    });

    await batch.commit();
};

// Menu Templates
export const createMenuTemplate = (data: Omit<MenuTemplate, 'id'>) => createTemplate<MenuTemplate>('menuTemplates', data);
export const updateMenuTemplate = (template: MenuTemplate) => updateTemplate<MenuTemplate>('menuTemplates', template);
export const deleteMenuTemplate = async (templateId: string) => {
    await deleteTemplate('menuTemplates', templateId);
    // Unlink from restaurants
    const q = query(collection(db, 'restaurants'), where('assignedMenuTemplateIds', 'array-contains', templateId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        const currentIds = d.data().assignedMenuTemplateIds || [];
        const newIds = currentIds.filter((id: string) => id !== templateId);
        batch.update(d.ref, { assignedMenuTemplateIds: newIds });
    });
    await batch.commit();
};
