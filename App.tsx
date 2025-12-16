
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Vendor, Restaurant, CartItem, NotificationMessage, View, Order, BoardTemplate, MenuTemplate, MenuItemTemplate } from './types';
import * as api from './services/apiService'; 
import { supabase } from './supabaseClient';

import Header from './components/Header';
import HomePage from './components/HomePage';
import RestaurantPage from './components/RestaurantPage';
import Cart from './components/Cart';
import CheckoutPage from './components/CheckoutPage';
import VendorDashboard from './components/VendorDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ConsumerOrderPage from './components/ConsumerOrderPage';
import LoginPage from './components/LoginPage';
import { Notification } from './components/Shared';

const GUEST_USER: User = { id: '0', name: 'Guest', username: 'guest', role: UserRole.Consumer, linkedRestaurantIds: [] };

const App: React.FC = () => {
    // START CHANGE: Default to GUEST_USER instead of null to allow instant browsing (Uber Eats style)
    const [currentUser, setCurrentUser] = useState<User | null>(GUEST_USER);
    // END CHANGE
    const [users, setUsers] = useState<User[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [boardTemplates, setBoardTemplates] = useState<BoardTemplate[]>([]);
    const [menuTemplates, setMenuTemplates] = useState<MenuTemplate[]>([]);
    const [menuItemTemplates, setMenuItemTemplates] = useState<MenuItemTemplate[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
    const [activeOrderIds, setActiveOrderIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default view is 'home' now that we default to Guest
    const [currentView, setCurrentView] = useState<View>('home');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    
    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    // --- DATA FETCHING (Public) ---
    const fetchPublicData = useCallback(async () => {
        try {
            // Only fetch public/non-sensitive data initially to speed up load
            const [fetchedRestaurants, fetchedBoards, fetchedMenus, fetchedItems] = await Promise.all([
                api.fetchRestaurants(),
                api.fetchBoardTemplates(),
                api.fetchMenuTemplates(),
                api.fetchMenuItemTemplates(),
            ]);
            setRestaurants(fetchedRestaurants);
            setBoardTemplates(fetchedBoards);
            setMenuTemplates(fetchedMenus);
            setMenuItemTemplates(fetchedItems);
        } catch (error) {
            console.error("Failed to fetch public data", error);
            addNotification("Could not load application data. Check your network.", "error");
        }
    }, [addNotification]);

    // --- DATA FETCHING (Protected) ---
    const fetchProtectedData = useCallback(async () => {
        if (!currentUser || currentUser.role === UserRole.Consumer) return;

        try {
            console.log("Fetching protected data for admin...");
            const [fetchedUsers, fetchedVendors, fetchedOrders] = await Promise.all([
                api.fetchUsers(),
                api.fetchVendors(),
                api.fetchOrders(),
            ]);
            setUsers(fetchedUsers);
            setVendors(fetchedVendors);
            setOrders(fetchedOrders);
        } catch (error) {
            console.error("Failed to fetch protected data", error);
        }
    }, [currentUser]);

    // Initial Load
    useEffect(() => {
        setIsLoading(true);
        const safetyTimeout = setTimeout(() => {
            setIsLoading(loading => {
                if (loading) {
                    console.warn("Data fetch timed out. Forcing app load.");
                    return false;
                }
                return loading;
            });
        }, 8000);

        fetchPublicData().finally(() => {
            clearTimeout(safetyTimeout);
            setIsLoading(false);
        });

        return () => clearTimeout(safetyTimeout);
    }, [fetchPublicData]);

    // Protected Load trigger
    useEffect(() => {
        if (currentUser && currentUser.role !== UserRole.Consumer) {
            fetchProtectedData();
        }
    }, [currentUser, fetchProtectedData]);

    // --- AUTH STATE LISTENER (SUPABASE) ---
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                 // Only fetch if we don't have the user, or if it's a different user
                 // Note: we check vs currentUser inside the setter to avoid dependency loops if possible,
                 // but here we need the ID.
                 setCurrentUser(prev => {
                     if (!prev || prev.id !== session.user.id) {
                         // Fetch profile async (side effect inside setter is bad, but we just trigger fetch)
                         // Better: trigger a separate effect or promise.
                         // For now, let's just do the fetch here as it's the listener callback.
                         api.fetchUsers().then(users => {
                             const found = users.find(u => u.id === session.user.id);
                             if (found) setCurrentUser(found);
                         });
                         // Return current temporarily until fetch updates it, or keep null/guest
                         return prev;
                     }
                     return prev;
                 });
            } else {
                // START CHANGE: Fix for refresh loop
                // If session is null (logged out), ONLY set to null if we aren't explicitly in Guest mode.
                // If we are Guest (id 0), we stay Guest.
                setCurrentUser(prev => {
                    if (prev?.id === '0') return prev; // Keep Guest
                    return null; // Force to Login screen for Admins who logged out
                });
                // END CHANGE
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- SIMULATED PUSH MESSAGES ---
    useEffect(() => {
        const marketingTimer = setTimeout(() => {
            if (currentUser && restaurants.length > 0) {
                const randomRest = restaurants[Math.floor(Math.random() * restaurants.length)];
                addNotification(`📢 Flash Deal: 20% off at ${randomRest.name} for the next hour!`, 'info');
            }
        }, 8000);
        return () => clearTimeout(marketingTimer);
    }, [currentUser, restaurants, addNotification]);

    
     useEffect(() => {
        const handleNavigation = () => {
            const hash = window.location.hash;
            
            // 1. Priority: Hash Navigation (e.g. #restaurant/123)
            if (hash.startsWith('#restaurant/')) {
                const restaurantId = hash.split('/')[1];
                if (restaurants.some(v => v.id === restaurantId)) {
                    setSelectedRestaurantId(restaurantId);
                    setCurrentView('restaurant');
                    
                    if (!currentUser || currentUser.role === UserRole.Consumer) {
                        setCurrentUser(prevUser => {
                            const isNew = !prevUser || !prevUser.linkedRestaurantIds?.includes(restaurantId);
                            if (isNew) {
                                const updatedGuest = {
                                    ...GUEST_USER,
                                    linkedRestaurantIds: [...(prevUser?.linkedRestaurantIds || []), restaurantId]
                                };
                                return updatedGuest;
                            }
                            return prevUser;
                        });
                    }
                    return;
                }
            }

            // 2. Auth State Navigation
            if (currentUser) {
                 // If authenticated
                 if (currentUser.role === UserRole.Vendor || currentUser.role === UserRole.RestaurantAdmin) {
                     // Vendors always go to dashboard
                     setCurrentView('vendorDashboard');
                 } else if (currentUser.role === UserRole.SuperAdmin) {
                     setCurrentView('superAdminDashboard');
                 } else {
                     // Consumers (Guest):
                     // If we are at Login, go Home.
                     // Otherwise, stay where we are (Checkout, Status, Restaurant, etc)
                     setCurrentView(prevView => {
                         if (prevView === 'login') return 'home';
                         return prevView;
                     });
                 }
            } else {
                 // Not authenticated AND not Guest -> Login
                 setCurrentView('login');
            }
        };

        if (!isLoading) {
            handleNavigation();
        }
        
        window.addEventListener('hashchange', handleNavigation);
        return () => window.removeEventListener('hashchange', handleNavigation);
    }, [currentUser, restaurants, addNotification, isLoading]);


    useEffect(() => {
        if (currentUser?.role !== UserRole.Consumer) {
             setIsCartOpen(false);
             setCart([]);
             setActiveOrderIds([]);
        }
    }, [currentUser]);


    const dismissNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const handleLogin = useCallback(async (username: string, password: string): Promise<{success: boolean, error?: string}> => {
        const { user, error } = await api.signInUser(username, password);
        if (user) {
            // Optimistically set user to avoid waiting for Auth Listener roundtrip
            setCurrentUser(user);
            window.location.hash = '';
            addNotification(`Welcome back, ${user.name}!`, 'success');
            return { success: true };
        }
        const errorMsg = error || 'Invalid credentials.';
        addNotification(errorMsg, 'error');
        return { success: false, error: errorMsg };
    }, [addNotification]);

    const handleLogout = useCallback(async () => {
        try {
            await api.signOutUser();
        } catch(e) {
            console.error("Logout error", e);
        }
        // Explicit logout -> Force null to show Login Screen
        setCurrentUser(null);
        window.location.hash = '';
        setCurrentView('login');
        addNotification(`Logged out.`, 'info');
    }, [addNotification]);
    
    const handleExitToGuestView = useCallback(async () => {
        // Explicitly switch to Guest Mode
        await api.signOutUser(); 
        setCurrentUser(GUEST_USER); 
        addNotification(`Exiting admin session. Now viewing as a guest.`, 'info');
        const firstRestaurantId = restaurants[0]?.id;
        if (firstRestaurantId) {
            // This will trigger hashchange -> handleNavigation -> sets view to Restaurant
            window.location.hash = `restaurant/${firstRestaurantId}`;
        } else {
            window.location.hash = '';
            setCurrentView('home'); 
        }
    }, [addNotification, restaurants]);

    const handleAdminLoginNav = useCallback(() => {
        // Just switch view to login, don't necessarily logout Guest yet
        setCurrentView('login');
    }, []);

    const handleAddToCart = useCallback((item: Omit<CartItem, 'cartItemId'>) => {
        if (cart.length > 0 && cart[0].restaurantId !== item.restaurantId) {
            addNotification("You can only order from one restaurant at a time.", "error"); return;
        }
        const newCartItem: CartItem = { ...item, cartItemId: Date.now() };
        setCart(prev => [...prev, newCartItem]);
        addNotification(`${item.name} added to cart!`, "success");
        setIsCartOpen(true);
    }, [cart, addNotification]);

    const handleRemoveFromCart = useCallback((cartItemId: number) => setCart(cart => cart.filter(item => item.cartItemId !== cartItemId)), []);

    const handleUpdateCartQuantity = useCallback((cartItemId: number, quantity: number) => {
        if(quantity < 1) { handleRemoveFromCart(cartItemId); return; }
        setCart(cart => cart.map(item => item.cartItemId === cartItemId ? {...item, quantity} : item));
    }, [handleRemoveFromCart]);
    
    const navigateTo = useCallback((view: View) => {
        setCurrentView(view);
        setIsCartOpen(false);
        if (['home', 'vendorDashboard', 'superAdminDashboard'].includes(view)) {
            window.location.hash = '';
            setSelectedRestaurantId(null);
        }
        
        if (view === 'checkout' || view === 'orderStatus') {
            if (window.location.hash) {
                 // Replaced pushState with direct assignment to avoid SecurityError in blob environments
                 window.location.hash = '';
            }
        }
    }, []);

    const handlePlaceOrder = useCallback(async () => {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const taxes = subtotal * 0.08;
        const deliveryFee = 5.00;
        const total = subtotal + taxes + deliveryFee;

        const newOrderData = {
            restaurantId: cart[0].restaurantId,
            items: cart,
            subtotal,
            taxes,
            deliveryFee,
            total,
        };
        const newOrder = await api.createOrder(newOrderData);
        if (newOrder) {
            setOrders(prev => [newOrder, ...prev]);
            setCart([]);
            setActiveOrderIds(prev => [...prev, newOrder.id]);
            addNotification(`Order ${newOrder.id.slice(0,8)}... placed!`, "success");
            navigateTo('orderStatus');
        } else {
            addNotification("Sorry, we couldn't place your order. Please try again.", "error");
        }
    }, [cart, addNotification, navigateTo]);
    
    const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string, reason?: string) => {
        const updatedOrder = await api.updateOrderStatus(orderId, status, reason, currentUser?.id);
        if (updatedOrder) {
            setOrders(orders => orders.map(o => o.id === orderId ? updatedOrder : o));
            addNotification(`Order updated.`, "info");
        } else {
            addNotification(`Failed to update order.`, "error");
        }
    }, [addNotification, currentUser]);

    const handleUpdateRestaurant = useCallback(async (updated: Restaurant) => {
        const result = await api.updateRestaurant(updated);
        if (result) {
            setRestaurants(restaurants => restaurants.map(r => r.id === updated.id ? result : r));
            addNotification("Restaurant details updated!", "success");
        } else {
            addNotification("Failed to update restaurant details.", "error");
        }
    }, [addNotification]);

    const handleUpdateVendor = useCallback(async (updated: Vendor) => {
        const result = await api.updateVendor(updated);
        if (result) {
            setVendors(vendors => vendors.map(v => v.id === updated.id ? result : v));
            addNotification("Vendor details updated!", "success");
        } else {
            addNotification("Failed to update vendor details.", "error");
        }
    }, [addNotification]);

    const handleUpdateUser = useCallback(async (updated: User) => {
        const result = await api.updateUser(updated);
        if (result) {
            setUsers(users => users.map(u => u.id === updated.id ? result : u));
            addNotification("User details updated!", "success");
            if (currentUser?.id === updated.id) setCurrentUser(result);
        } else {
            addNotification("Failed to update user details.", "error");
        }
    }, [users, currentUser, addNotification]);

    const handleCreateVendor = useCallback(async (vendorName: string, adminUsername: string, adminPassword: string) => {
        const result = await api.createVendor(vendorName, adminUsername, adminPassword);
        if (result) {
            setVendors(prev => [...prev, result.newVendor]);
            setUsers(prev => [...prev, result.newVendorAdmin]);
            addNotification(`Vendor "${result.newVendor.name}" created!`, "success");
        } else {
            addNotification("Failed to create vendor.", "error");
        }
    }, [addNotification]);
    
    const handleCreateRestaurantAdmin = useCallback(async (name: string, username: string, password: string, restaurantId: string) => {
        const result = await api.createRestaurantAdmin(name, username, password, restaurantId, currentUser?.vendorId);
        if (result) {
            setUsers(prev => [...prev, result]);
            addNotification(`Admin created!`, 'success');
        } else {
            addNotification("Failed to create admin.", "error");
        }
    }, [currentUser, addNotification]);

    const handleCreateRestaurant = useCallback(async (newRestaurantData: Omit<Restaurant, 'id'>) => {
        const newRestaurant = await api.createRestaurant(newRestaurantData);
        if (newRestaurant) {
            setRestaurants(prev => [...prev, newRestaurant]);
            addNotification(`Restaurant "${newRestaurant.name}" created!`, "success");
        } else {
            addNotification("Failed to create restaurant.", "error");
        }
    }, [addNotification]);

    const handleDeleteVendor = useCallback(async (vendorId: string) => {
        const success = await api.deleteVendor(vendorId);
        if (success) {
            // Refresh data not trivial for delete, assume manual refresh or update list
            setVendors(prev => prev.filter(v => v.id !== vendorId));
            addNotification('Vendor deleted.', 'success');
        } else {
            addNotification("Failed to delete vendor.", "error");
        }
    }, [addNotification]);

    const handleDeleteRestaurant = useCallback(async (restaurantId: string) => {
        const success = await api.deleteRestaurant(restaurantId);
        if (success) {
            setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
            addNotification('Restaurant deleted.', 'success');
        } else {
            addNotification("Failed to delete restaurant.", "error");
        }
    }, [addNotification]);

    const handleDeleteUser = useCallback(async (userId: string) => {
        if (currentUser?.id === userId) { addNotification("You cannot delete yourself.", "error"); return; }
        const success = await api.deleteUser(userId);
        if (success) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            addNotification('User deleted.', 'success');
        } else {
            addNotification("Failed to delete user.", "error");
        }
    }, [currentUser, addNotification]);
    
    const handleSelectRestaurant = useCallback((id: string) => {
        setSelectedRestaurantId(id);
        setCurrentView('restaurant');
        window.location.hash = `restaurant/${id}`;
    }, []);

    const handleOrderFinished = useCallback((orderId: string) => {
        setActiveOrderIds(prevIds => prevIds.filter(id => id !== orderId));
    }, []);
    
    const handleSendPushNotification = useCallback((message: string) => {
        // In a real app, this would call an API. Here we simulate it by adding a notification immediately.
        addNotification(message, 'info');
    }, [addNotification]);

    // --- TEMPLATE HANDLERS (Same as before) ---
    const handleCreateBoardTemplate = useCallback(async (templateData: Omit<BoardTemplate, 'id'>) => {
        const newTemplate = await api.createBoardTemplate(templateData);
        if (newTemplate) { setBoardTemplates(p => [...p, newTemplate]); addNotification('Board template created!', 'success'); }
        else { addNotification('Failed to create board template.', 'error'); }
    }, [addNotification]);
    const handleUpdateBoardTemplate = useCallback(async (template: BoardTemplate) => {
        const updated = await api.updateBoardTemplate(template);
        if (updated) { setBoardTemplates(p => p.map(t => t.id === template.id ? updated : t)); addNotification('Board template updated!', 'success'); }
        else { addNotification('Failed to update board template.', 'error'); }
    }, [addNotification]);
    const handleDeleteBoardTemplate = useCallback(async (templateId: string) => {
        const success = await api.deleteBoardTemplate(templateId);
        if (success) {
            setBoardTemplates(p => p.filter(t => t.id !== templateId));
            addNotification('Board template deleted.', 'success');
        } else {
            addNotification('Failed to delete board template.', 'error');
        }
    }, [addNotification]);
    const handleCreateMenuTemplate = useCallback(async (templateData: Omit<MenuTemplate, 'id'>) => {
        const newTemplate = await api.createMenuTemplate(templateData);
        if (newTemplate) { setMenuTemplates(p => [...p, newTemplate]); addNotification('Menu template created!', 'success'); }
        else { addNotification('Failed to create menu template.', 'error'); }
    }, [addNotification]);
    const handleUpdateMenuTemplate = useCallback(async (template: MenuTemplate) => {
        const updated = await api.updateMenuTemplate(template);
        if (updated) { setMenuTemplates(p => p.map(t => t.id === template.id ? updated : t)); addNotification('Menu template updated!', 'success'); }
        else { addNotification('Failed to update menu template.', 'error'); }
    }, [addNotification]);
    const handleDeleteMenuTemplate = useCallback(async (templateId: string) => {
        const success = await api.deleteMenuTemplate(templateId);
        if (success) {
            setMenuTemplates(p => p.filter(t => t.id !== templateId));
            addNotification('Menu template deleted.', 'success');
        } else {
            addNotification('Failed to delete menu template.', 'error');
        }
    }, [addNotification]);
    const handleCreateMenuItemTemplate = useCallback(async (itemData: Omit<MenuItemTemplate, 'id'>) => {
        const newItem = await api.createMenuItemTemplate(itemData);
        if (newItem) { setMenuItemTemplates(p => [...p, newItem]); addNotification('Menu item created!', 'success'); }
        else { addNotification('Failed to create menu item.', 'error'); }
    }, [addNotification]);
    const handleUpdateMenuItemTemplate = useCallback(async (item: MenuItemTemplate) => {
        const updated = await api.updateMenuItemTemplate(item);
        if (updated) { setMenuItemTemplates(p => p.map(i => i.id === item.id ? updated : i)); addNotification('Menu item updated!', 'success'); }
        else { addNotification('Failed to update menu item.', 'error'); }
    }, [addNotification]);
    const handleDeleteMenuItemTemplate = useCallback(async (itemId: string) => {
        const success = await api.deleteMenuItemTemplate(itemId);
        if (success) {
            setMenuItemTemplates(p => p.filter(i => i.id !== itemId));
            addNotification('Menu item deleted.', 'success');
        } else {
            addNotification('Failed to delete menu item.', 'error');
        }
    }, [addNotification]);
    
    const renderView = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col justify-center items-center h-screen space-y-4">
                    <div className="text-xl font-semibold text-gray-700">Loading Application...</div>
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-400">Connecting to database...</p>
                </div>
            );
        }
        
        // Show Login Page ONLY if specifically in 'login' view
        if (currentView === 'login') return <LoginPage onLogin={handleLogin} />;
        
        // If current user is null (logged out admin), but we aren't in 'login' view yet, we should probably be in login view
        // But since we default to Guest, currentUser is usually not null unless explicitly set to null.
        if (!currentUser) return <LoginPage onLogin={handleLogin} />;
        
        switch (currentView) {
            case 'restaurant':
                const restaurant = restaurants.find(v => v.id === selectedRestaurantId);
                const assignedMenuTemplates = restaurant?.assignedMenuTemplateIds?.map(id => menuTemplates.find(m => m.id === id)).filter(Boolean) as MenuTemplate[] || [];
                return restaurant ? <RestaurantPage restaurant={restaurant} menuTemplates={assignedMenuTemplates} allItems={menuItemTemplates} onAddToCart={handleAddToCart} onBack={() => navigateTo('home')} /> : <HomePage currentUser={currentUser} restaurants={restaurants} onSelectRestaurant={handleSelectRestaurant} />;
            
            case 'checkout':
                const restaurantForCheckout = restaurants.find(r => r.id === cart[0]?.restaurantId);
                const backToRestaurant = () => { if (cart[0]?.restaurantId) handleSelectRestaurant(cart[0].restaurantId); else navigateTo('home'); }
                return <CheckoutPage cart={cart} restaurant={restaurantForCheckout || null} onPlaceOrder={handlePlaceOrder} onBack={backToRestaurant} />;

            case 'vendorDashboard':
                const vendorForDashboard = vendors.find(v => v.id === currentUser.vendorId);
                const restaurantsForVendor = currentUser.role === UserRole.RestaurantAdmin 
                    ? restaurants.filter(r => r.id === currentUser.restaurantId)
                    : restaurants.filter(r => r.vendorId === currentUser.vendorId);
                const templatesForVendor = {
                    board: boardTemplates.filter(t => t.vendorId === currentUser.vendorId),
                    menu: menuTemplates.filter(t => t.vendorId === currentUser.vendorId),
                    menuItem: menuItemTemplates.filter(t => t.vendorId === currentUser.vendorId),
                };
                
                return vendorForDashboard || currentUser.role === UserRole.RestaurantAdmin ? <VendorDashboard 
                    currentUser={currentUser} vendor={vendorForDashboard!} restaurants={restaurantsForVendor} orders={orders} users={users} 
                    boardTemplates={templatesForVendor.board} menuTemplates={templatesForVendor.menu} menuItemTemplates={templatesForVendor.menuItem}
                    onUpdateRestaurant={handleUpdateRestaurant} onCreateRestaurant={handleCreateRestaurant} onDeleteRestaurant={handleDeleteRestaurant} 
                    onUpdateOrderStatus={handleUpdateOrderStatus} onCreateRestaurantAdmin={handleCreateRestaurantAdmin} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} 
                    onCreateBoardTemplate={handleCreateBoardTemplate} onUpdateBoardTemplate={handleUpdateBoardTemplate} onDeleteBoardTemplate={handleDeleteBoardTemplate}
                    onCreateMenuTemplate={handleCreateMenuTemplate} onUpdateMenuTemplate={handleUpdateMenuTemplate} onDeleteMenuTemplate={handleDeleteMenuTemplate}
                    onCreateMenuItemTemplate={handleCreateMenuItemTemplate} onUpdateMenuItemTemplate={handleUpdateMenuItemTemplate} onDeleteMenuItemTemplate={handleDeleteMenuItemTemplate}
                    onSendPushNotification={handleSendPushNotification}
                    /> : <div>Dashboard access denied.</div>;

            case 'superAdminDashboard':
                return <SuperAdminDashboard vendors={vendors} restaurants={restaurants} users={users} onCreateVendor={handleCreateVendor} onUpdateVendor={handleUpdateVendor} onUpdateUser={handleUpdateUser} onUpdateRestaurant={handleUpdateRestaurant} onDeleteVendor={handleDeleteVendor} onDeleteRestaurant={handleDeleteRestaurant} onDeleteUser={handleDeleteUser} onSelectRestaurant={handleSelectRestaurant} />;
            
            case 'orderStatus':
                const activeOrders = orders.filter(o => activeOrderIds.includes(o.id));
                if (activeOrders.length > 0) {
                    return <ConsumerOrderPage
                        activeOrders={activeOrders}
                        allOrders={orders}
                        onOrderFinished={handleOrderFinished}
                        onBackToRestaurant={() => handleSelectRestaurant(activeOrders[0].restaurantId)}
                    />;
                }
                // Redirect if no active orders. Side effect safe here because we return null immediately after.
                // However, strictly speaking, we should use useEffect to redirect. 
                // But for simplicity in this synchronous render pass:
                setTimeout(() => navigateTo('home'), 0);
                return null;
            
            case 'home':
            default:
                return <HomePage currentUser={currentUser} restaurants={restaurants} onSelectRestaurant={handleSelectRestaurant} />;
        }
    };

    return (
        <div className="min-h-screen bg-neutral flex flex-col">
             {currentView !== 'login' && (
                <Header
                    currentUser={currentUser} onLogout={handleLogout} cart={cart}
                    onNavigate={(view) => navigateTo(view as View)}
                    onCartToggle={() => setIsCartOpen(!isCartOpen)}
                    activeOrderCount={activeOrderIds.length}
                    onAdminLogin={handleAdminLoginNav}
                    onExitToGuestView={handleExitToGuestView}
                />
            )}
            <main className="flex-grow">{renderView()}</main>
            {currentUser?.role === UserRole.Consumer && (
                <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} onRemoveItem={handleRemoveFromCart} onUpdateQuantity={handleUpdateCartQuantity} onCheckout={() => navigateTo('checkout')} />
            )}
            <div className="fixed top-24 right-5 z-50 space-y-2">{notifications.map(n => (<Notification key={n.id} notification={n} onDismiss={dismissNotification} />))}</div>
             {currentView !== 'login' && !isLoading && (
                <footer className="bg-secondary text-white text-center p-4"><p>&copy; {new Date().getFullYear()} FlowApp. All rights reserved.</p></footer>
            )}
        </div>
    );
};

export default App;
