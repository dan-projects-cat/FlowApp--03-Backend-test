
import React, { useState, useMemo } from 'react';
import { Vendor, Restaurant, MenuItemTemplate, Order, User, UserRole, BoardTemplate, MenuTemplate, MenuSection, PaymentMethod } from '../types';
import { 
    ChartIcon, SettingsIcon, MenuBookIcon, PlusIcon, EditIcon, TrashIcon,
    ClipboardListIcon, UserIcon as PeopleIcon, SparklesIcon, XIcon, StoreIcon
} from './Shared';
import Analytics from './Analytics';

// --- Helper Components ---

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
                <h3 className="text-xl font-bold">{title}</h3>
                <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
            </div>
            <div className="p-4">{children}</div>
        </div>
    </div>
);

const ConfirmationModal: React.FC<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ title, message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-red-600">{title}</h3>
            <p className="mb-6 text-gray-700">{message}</p>
            <div className="flex justify-end space-x-3">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Confirm</button>
            </div>
        </div>
    </div>
);

// --- Sub-Managers ---

const OrderManager: React.FC<{ orders: Order[]; onUpdateStatus: (id: string, status: string) => void }> = ({ orders, onUpdateStatus }) => {
    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Manage Orders</h3>
            {sortedOrders.length === 0 ? <p className="text-gray-500">No orders found.</p> : (
                <div className="grid gap-4">
                    {sortedOrders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded shadow border-l-4 border-primary flex justify-between items-center">
                            <div>
                                <p className="font-bold">Order #{order.id.slice(0, 8)}</p>
                                <p className="text-sm text-gray-600">{new Date(order.orderTime).toLocaleString()}</p>
                                <p className="text-sm mt-1">{order.items.length} items - ${order.total.toFixed(2)}</p>
                                <span className={`inline-block px-2 py-1 text-xs rounded mt-2 font-bold ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {order.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="space-x-2">
                                {order.status === 'pending' && (
                                    <>
                                        <button onClick={() => onUpdateStatus(order.id, 'accepted')} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Accept</button>
                                        <button onClick={() => onUpdateStatus(order.id, 'rejected')} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
                                    </>
                                )}
                                {order.status === 'accepted' && (
                                    <button onClick={() => onUpdateStatus(order.id, 'in-progress')} className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">Start Prep</button>
                                )}
                                {order.status === 'in-progress' && (
                                    <button onClick={() => onUpdateStatus(order.id, 'ready-for-pickup')} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Ready</button>
                                )}
                                {order.status === 'ready-for-pickup' && (
                                    <button onClick={() => onUpdateStatus(order.id, 'completed')} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Complete</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MenuManager: React.FC<{ 
    templates: MenuTemplate[]; 
    items: MenuItemTemplate[]; 
    onCreateTemplate: (t: Omit<MenuTemplate, 'id'>) => void;
    onDeleteTemplate: (id: string) => void;
}> = ({ templates, items, onCreateTemplate, onDeleteTemplate }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const handleCreate = () => {
        if (newName) {
            onCreateTemplate({ vendorId: templates[0]?.vendorId || '', name: newName, sections: [] });
            setNewName('');
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Menu Libraries</h3>
                <button onClick={() => setIsCreating(true)} className="flex items-center space-x-1 bg-primary text-white px-3 py-2 rounded hover:bg-orange-600"><PlusIcon className="w-5 h-5"/> <span>New Menu</span></button>
            </div>
            
            {isCreating && (
                <div className="bg-gray-100 p-4 rounded flex space-x-2 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium">Menu Name</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2 border rounded" />
                    </div>
                    <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                    <button onClick={() => setIsCreating(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded shadow">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-lg">{t.name}</h4>
                            <button onClick={() => onDeleteTemplate(t.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                        <p className="text-sm text-gray-500">{t.sections.length} Sections</p>
                        <div className="mt-2 text-sm text-gray-600">
                            {t.sections.map(s => s.title).join(', ')}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-bold mb-4">All Items ({items.length})</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded border flex items-center space-x-3">
                             <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded object-cover" />
                             <div className="overflow-hidden">
                                 <p className="font-semibold truncate">{item.name}</p>
                                 <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                             </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

const UserManager: React.FC<{ users: User[]; onCreateUser: (name: string, username: string, pass: string) => void; onDeleteUser: (id: string) => void }> = ({ users, onCreateUser, onDeleteUser }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ name: '', username: '', password: '' });

    const handleCreate = () => {
        if (form.name && form.username && form.password) {
            onCreateUser(form.name, form.username, form.password);
            setForm({ name: '', username: '', password: '' });
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Restaurant Users</h3>
                <button onClick={() => setIsCreating(true)} className="flex items-center space-x-1 bg-primary text-white px-3 py-2 rounded hover:bg-orange-600"><PlusIcon className="w-5 h-5"/> <span>New User</span></button>
            </div>

            {isCreating && (
                <div className="bg-gray-100 p-4 rounded space-y-3">
                    <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded" />
                    <input placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full p-2 border rounded" />
                    <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-2 border rounded" />
                    <div className="flex space-x-2">
                        <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
                        <button onClick={() => setIsCreating(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{u.name} <span className="text-gray-400 text-sm">({u.username})</span></td>
                                <td className="px-6 py-4 whitespace-nowrap">{u.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button onClick={() => onDeleteUser(u.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SettingsManager: React.FC<{ restaurant: Restaurant; onUpdate: (r: Restaurant) => void }> = ({ restaurant, onUpdate }) => {
    const [formData, setFormData] = useState(restaurant);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <h3 className="text-xl font-bold mb-4">Restaurant Settings</h3>
            <div>
                <label className="block text-sm font-medium">Restaurant Name</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" rows={3} />
            </div>
            <div>
                <label className="block text-sm font-medium">Phone</label>
                <input value={formData.contact.phone} onChange={e => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})} className="w-full p-2 border rounded" />
            </div>
             <div>
                <label className="block text-sm font-medium">Address</label>
                <input value={formData.contact.address} onChange={e => setFormData({...formData, contact: {...formData.contact, address: e.target.value}})} className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded hover:bg-orange-600">Save Changes</button>
        </form>
    );
};

const RestaurantManager: React.FC<{ 
    vendorId: string;
    restaurants: Restaurant[];
    onCreate: (data: Omit<Restaurant, 'id'>) => void;
    onDelete: (id: string) => void;
}> = ({ vendorId, restaurants, onCreate, onDelete }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        address: '',
        phone: '',
        email: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newRest: Omit<Restaurant, 'id'> = {
            vendorId,
            name: form.name,
            description: form.description,
            bannerUrl: `https://picsum.photos/1200/400?random=${Date.now()}`,
            contact: {
                address: form.address,
                phone: form.phone,
                email: form.email
            },
            openingHours: {
                monday: { isOpen: true, open: '11:00', close: '22:00' },
                tuesday: { isOpen: true, open: '11:00', close: '22:00' },
                wednesday: { isOpen: true, open: '11:00', close: '22:00' },
                thursday: { isOpen: true, open: '11:00', close: '22:00' },
                friday: { isOpen: true, open: '11:00', close: '23:00' },
                saturday: { isOpen: true, open: '11:00', close: '23:00' },
                sunday: { isOpen: true, open: '11:00', close: '22:00' },
            },
            paymentMethods: [PaymentMethod.CreditCard, PaymentMethod.Cash],
            branding: {
                primaryColor: '#F97316',
                logoUrl: `https://picsum.photos/200/200?random=${Date.now()}`
            },
            media: []
        };
        onCreate(newRest);
        setIsCreating(false);
        setForm({ name: '', description: '', address: '', phone: '', email: '' });
    };

    return (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">My Restaurants</h3>
                <button onClick={() => setIsCreating(true)} className="flex items-center space-x-1 bg-primary text-white px-3 py-2 rounded hover:bg-orange-600">
                    <PlusIcon className="w-5 h-5"/> <span>Add Restaurant</span>
                </button>
            </div>

            {isCreating && (
                <div className="bg-gray-100 p-6 rounded-lg shadow-inner">
                    <h4 className="font-bold mb-4">New Restaurant Details</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded" placeholder="Restaurant Name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded" placeholder="contact@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border rounded" placeholder="555-0123" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <input required value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-2 border rounded" placeholder="123 Main St" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border rounded" rows={3} placeholder="Short description..." />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create Restaurant</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map(r => (
                    <div key={r.id} className="bg-white rounded-lg shadow overflow-hidden border">
                         <div className="h-32 bg-gray-200 relative">
                             <img src={r.bannerUrl} alt={r.name} className="w-full h-full object-cover" />
                             <div className="absolute top-2 right-2">
                                 <button onClick={() => { if(window.confirm(`Delete ${r.name}?`)) onDelete(r.id); }} className="p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-600">
                                     <TrashIcon className="w-5 h-5"/>
                                 </button>
                             </div>
                         </div>
                         <div className="p-4">
                             <h4 className="font-bold text-lg">{r.name}</h4>
                             <p className="text-sm text-gray-500 line-clamp-2">{r.description}</p>
                             <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                                 <p>{r.contact.address}</p>
                             </div>
                         </div>
                    </div>
                ))}
                {restaurants.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded border border-dashed">
                        No restaurants found. Click "Add Restaurant" to get started.
                    </div>
                )}
            </div>
         </div>
    );
}


// --- Main Component ---

const VendorDashboard: React.FC<{
  currentUser: User;
  vendor: Vendor;
  restaurants: Restaurant[];
  orders: Order[];
  users: User[];
  boardTemplates: BoardTemplate[];
  menuTemplates: MenuTemplate[];
  menuItemTemplates: MenuItemTemplate[];
  onUpdateRestaurant: (updated: Restaurant) => void;
  onCreateRestaurant: (newRestaurantData: Omit<Restaurant, 'id'>) => void;
  onDeleteRestaurant: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: string, reason?: string) => void;
  onCreateRestaurantAdmin: (name: string, username: string, password: string, restaurantId: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateBoardTemplate: (templateData: Omit<BoardTemplate, 'id'>) => void;
  onUpdateBoardTemplate: (template: BoardTemplate) => void;
  onDeleteBoardTemplate: (templateId: string) => void;
  onCreateMenuTemplate: (templateData: Omit<MenuTemplate, 'id'>) => void;
  onUpdateMenuTemplate: (template: MenuTemplate) => void;
  onDeleteMenuTemplate: (templateId: string) => void;
  onCreateMenuItemTemplate: (itemData: Omit<MenuItemTemplate, 'id'>) => void;
  onUpdateMenuItemTemplate: (item: MenuItemTemplate) => void;
  onDeleteMenuItemTemplate: (itemId: string) => void;
  onSendPushNotification: (message: string) => void;
}> = (props) => {
    const { currentUser, restaurants, orders, users, vendor } = props;
    const [activeTab, setActiveTab] = useState(currentUser.role === UserRole.Vendor ? 'restaurants' : 'orders');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(
        currentUser.role === UserRole.RestaurantAdmin ? currentUser.restaurantId! : (restaurants[0]?.id || null)
    );
    const [pushMessage, setPushMessage] = useState('');

    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    
    // Filter data for selected restaurant
    const filteredOrders = useMemo(() => orders.filter(o => o.restaurantId === selectedRestaurantId), [orders, selectedRestaurantId]);
    const filteredUsers = useMemo(() => users.filter(u => u.restaurantId === selectedRestaurantId), [users, selectedRestaurantId]);

    const tabs = useMemo(() => [
        { id: 'restaurants', label: 'My Restaurants', icon: StoreIcon, visible: currentUser.role === UserRole.Vendor },
        { id: 'orders', label: 'Orders', icon: ClipboardListIcon, visible: currentUser.permissions?.canManageOrders ?? true },
        { id: 'analytics', label: 'Analytics', icon: ChartIcon, visible: currentUser.permissions?.canViewAnalytics ?? true },
        { id: 'marketing', label: 'Marketing', icon: SparklesIcon, visible: true },
        { id: 'menu', label: 'Menu Library', icon: MenuBookIcon, visible: currentUser.permissions?.canManageMenu ?? true },
        { id: 'settings', label: 'Restaurant Config', icon: SettingsIcon, visible: currentUser.permissions?.canManageSettings ?? true },
        { id: 'users', label: 'Users & Permissions', icon: PeopleIcon, visible: currentUser.role === UserRole.Vendor },
    ].filter(tab => tab.visible), [currentUser.role, currentUser.permissions]);

    const handleSendPush = () => {
        if (!pushMessage.trim()) return;
        props.onSendPushNotification(`📢 [${selectedRestaurant?.name}]: ${pushMessage}`);
        setPushMessage('');
        alert("Push notification sent to all active users!");
    };

    const renderContent = () => {
        // Allow access to 'menu' and 'restaurants' tabs even without a selected restaurant
        if (!selectedRestaurant && !['menu', 'restaurants'].includes(activeTab)) {
             return <div className="p-8 text-center text-gray-500">Please select a restaurant to manage.</div>;
        }

        switch (activeTab) {
            case 'restaurants':
                return <RestaurantManager 
                    vendorId={vendor.id}
                    restaurants={restaurants}
                    onCreate={props.onCreateRestaurant}
                    onDelete={props.onDeleteRestaurant}
                />;

            case 'orders':
                return <OrderManager orders={filteredOrders} onUpdateStatus={props.onUpdateOrderStatus} />;
            
            case 'analytics':
                 return <Analytics restaurant={selectedRestaurant!} orders={props.orders} users={props.users} />;

            case 'marketing':
                return (
                    <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
                        <div className="flex items-center space-x-3 border-b pb-4 mb-4">
                            <SparklesIcon className="w-8 h-8 text-purple-600" />
                            <h3 className="text-xl font-bold text-gray-800">Push Notifications & Marketing</h3>
                        </div>
                        <p className="text-gray-600 mb-6">Send instant alerts to all users currently using the app. Use this for flash sales, order updates, or general announcements.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1">Message</label>
                                <textarea 
                                    value={pushMessage} 
                                    onChange={e => setPushMessage(e.target.value)} 
                                    className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none" 
                                    rows={3}
                                    placeholder="e.g. Flash Sale! 20% off all Burgers for the next hour!"
                                />
                            </div>
                            <button 
                                onClick={handleSendPush}
                                disabled={!pushMessage.trim()}
                                className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Send Push Notification
                            </button>
                        </div>
                    </div>
                );
            
            case 'menu':
                 return <MenuManager 
                    templates={props.menuTemplates} 
                    items={props.menuItemTemplates} 
                    onCreateTemplate={props.onCreateMenuTemplate} 
                    onDeleteTemplate={props.onDeleteMenuTemplate} 
                 />;
            
            case 'settings':
                 return <SettingsManager restaurant={selectedRestaurant!} onUpdate={props.onUpdateRestaurant} />;

            case 'users':
                 return <UserManager 
                    users={filteredUsers} 
                    onCreateUser={(name, username, password) => props.onCreateRestaurantAdmin(name, username, password, selectedRestaurantId!)} 
                    onDeleteUser={props.onDeleteUser} 
                 />;

            default: return <div>Select a tab</div>;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 p-6">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-secondary">Vendor Dashboard</h2>
                {currentUser.role === UserRole.Vendor && restaurants.length > 0 && (
                    <select 
                        value={selectedRestaurantId || ''} 
                        onChange={e => setSelectedRestaurantId(e.target.value)}
                        className="p-2 border rounded-md shadow-sm"
                    >
                        {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-white border-b-2 border-primary text-primary' : 'text-gray-600 hover:bg-white/50'}`}
                    >
                        <tab.icon className="w-5 h-5"/>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
};

export default VendorDashboard;
