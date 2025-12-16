
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
    const [currentUser, setCurrentUser] = useState<User | null>(null);
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

    const [currentView, setCurrentView] = useState<View>('login');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    
    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    // --- DATA FETCHING ---
    const fetchData = useCallback(async () => {
        try {
            const [fetchedUsers, fetchedVendors, fetchedRestaurants, fetchedOrders, fetchedBoards, fetchedMenus, fetchedItems] = await Promise.all([
                api.fetchUsers(),
                api.fetchVendors(),
                api.fetchRestaurants(),
                api.fetchOrders(),
                api.fetchBoardTemplates(),
                api.fetchMenuTemplates(),
                api.fetchMenuItemTemplates(),
            ]);
            setUsers(fetchedUsers);
            setVendors(fetchedVendors);
            setRestaurants(fetchedRestaurants);
            setOrders(fetchedOrders);
            setBoardTemplates(fetchedBoards);
            setMenuTemplates(fetchedMenus);
            setMenuItemTemplates(fetchedItems);
        } catch (error) {
            console.error("Failed to fetch data", error);
            addNotification("Could not load application data. Check your network.", "error");
        }
    }, [addNotification]);

    useEffect(() => {
        setIsLoading(true);
        
        // Safety timeout to ensure we don't get stuck on "Loading..." forever
        const safetyTimeout = setTimeout(() => {
            setIsLoading(loading => {
                if (loading) {
                    console.warn("Data fetch timed out. Forcing app load.");
                    addNotification("Data loading timed out. Some data may be missing.", "error");
                    return false;
                }
                return loading;
            });
        }, 8000); // 8 seconds timeout

        fetchData().finally(() => {
            clearTimeout(safetyTimeout);
            setIsLoading(false);
        });

        return () => clearTimeout(safetyTimeout);
    }, [fetchData]);

    // --- AUTH STATE LISTENER (SUPABASE) ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                api.fetchUsers().then(allUsers => {
                    const found = allUsers.find(u => u.id === session.user.id);
                    if (found) setCurrentUser(found);
                });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                 const { data: userProfile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                 if (userProfile) setCurrentUser(userProfile as User);
            } else {
                setCurrentUser(null);
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

            if (currentUser) {
                 if (currentUser.role === UserRole.Vendor || currentUser.role === UserRole.RestaurantAdmin) setCurrentView('vendorDashboard');
                else if (currentUser.role === UserRole.SuperAdmin) setCurrentView('superAdminDashboard');
                else if (currentUser.role === UserRole.Consumer) setCurrentView('home');
            } else {
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
        setCurrentUser(null);
        window.location.hash = '';
        setCurrentView('login');
        addNotification(`Logged out.`, 'info');
    }, [addNotification]);
    
    const handleExitToGuestView = useCallback(async () => {
        await api.signOutUser(); 
        setCurrentUser(GUEST_USER); 
        addNotification(`Exiting admin session. Now viewing as a guest.`, 'info');
        const firstRestaurantId = restaurants[0]?.id;
        if (firstRestaurantId) {
            window.location.hash = `restaurant/${firstRestaurantId}`;
        } else {
            window.location.hash = '';
            setCurrentView('login');
        }
    }, [addNotification, restaurants]);

    const handleAdminLoginNav = useCallback(() => {
        handleLogout();
    }, [handleLogout]);

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
            fetchData();
            addNotification('Vendor deleted.', 'success');
        } else {
            addNotification("Failed to delete vendor.", "error");
        }
    }, [fetchData, addNotification]);

    const handleDeleteRestaurant = useCallback(async (restaurantId: string) => {
        const success = await api.deleteRestaurant(restaurantId);
        if (success) {
            fetchData();
            addNotification('Restaurant deleted.', 'success');
        } else {
            addNotification("Failed to delete restaurant.", "error");
        }
    }, [fetchData, addNotification]);

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
        
        if (currentView === 'login' || !currentUser) return <LoginPage onLogin={handleLogin} />;
        
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
                navigateTo('home');
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
