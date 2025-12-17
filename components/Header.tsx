
import React, { memo, useState } from 'react';
import { User, UserRole, CartItem, Order, NotificationMessage } from '../types';
import { ShoppingCartIcon, UserIcon, BellIcon, XIcon } from './Shared';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onAdminLogin: () => void;
  onExitToGuestView: () => void;
  cart: CartItem[];
  onNavigate: (view: 'home' | 'vendorDashboard' | 'superAdminDashboard' | 'orderStatus') => void;
  onCartToggle: () => void;
  activeOrderCount: number;
  notifications: NotificationMessage[];
  onClearNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onAdminLogin, onExitToGuestView, cart, onNavigate, onCartToggle, activeOrderCount, notifications, onClearNotifications }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const getDashboardView = () => {
    if (!currentUser) return 'home';
    if (currentUser.role === UserRole.Vendor || currentUser.role === UserRole.RestaurantAdmin) return 'vendorDashboard';
    if (currentUser.role === UserRole.SuperAdmin) return 'superAdminDashboard';
    return 'home';
  }
  
  const isGuest = currentUser?.role === UserRole.Consumer;

  const toggleNotifications = () => {
    setIsNotifOpen(!isNotifOpen);
  };

  return (
    <header className="bg-secondary text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <span className="text-2xl font-bold text-primary group-hover:text-accent transition-colors">FlowApp</span>
            <span className="text-xs sm:text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors">by FlowSync</span>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser && !isGuest && (
              <button
                onClick={() => onNavigate(getDashboardView())}
                className="px-3 py-2 text-sm font-medium rounded-md hover:bg-primary/20 transition-colors"
              >
                Dashboard
              </button>
            )}

            {currentUser && !isGuest ? (
                <div className="flex items-center space-x-4">
                    <button onClick={onExitToGuestView} className="text-sm font-medium hover:text-primary transition-colors">Exit to Guest View</button>
                    <div className="flex items-center space-x-2 bg-slate-700 px-3 py-1.5 rounded-md">
                        <UserIcon className="w-5 h-5 text-accent"/>
                        <span className="text-sm font-medium">{currentUser.name} ({currentUser.role})</span>
                    </div>
                    <button onClick={onLogout} className="text-sm font-medium hover:text-primary transition-colors">Logout</button>
                </div>
            ) : (
                 <div className="flex items-center space-x-4">
                    {/* NOTIFICATION CENTER */}
                    <div className="relative">
                        <button onClick={toggleNotifications} className="relative p-2 rounded-full hover:bg-primary/20 transition-colors" aria-label="Notifications">
                            <BellIcon className="w-6 h-6"/>
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse" aria-hidden="true">
                                    {notifications.length}
                                </span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 text-gray-800 border border-gray-200">
                                <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-sm text-gray-700">Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button onClick={onClearNotifications} className="text-xs text-red-500 hover:underline">Clear All</button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">No new notifications.</div>
                                    ) : (
                                        <ul>
                                            {notifications.map((n) => (
                                                <li key={n.id} className="p-3 border-b hover:bg-gray-50 last:border-b-0">
                                                    <p className="text-sm">{n.message}</p>
                                                    <span className="text-xs text-gray-400 mt-1 block">{new Date(n.id).toLocaleTimeString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Overlay to close notifications when clicking outside */}
                        {isNotifOpen && (
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsNotifOpen(false)}></div>
                        )}
                    </div>

                    {activeOrderCount > 0 && (
                       <button
                        onClick={() => onNavigate('orderStatus')}
                        className="px-3 py-2 text-sm font-medium rounded-md bg-primary/80 hover:bg-primary transition-colors flex items-center space-x-2"
                      >
                        <span>My Orders</span>
                        <span className="bg-white text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{activeOrderCount}</span>
                      </button>
                    )}
                    <button onClick={onCartToggle} className="relative p-2 rounded-full hover:bg-primary/20 transition-colors" aria-label={`Shopping cart with ${cartItemCount} items`}>
                      <ShoppingCartIcon className="w-6 h-6"/>
                      {cartItemCount > 0 && (
                        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center" aria-hidden="true">
                          {cartItemCount}
                        </span>
                      )}
                    </button>
                    <button onClick={onAdminLogin} className="text-sm font-medium bg-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-600 transition-colors">Admin Login</button>
                 </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default memo(Header);
