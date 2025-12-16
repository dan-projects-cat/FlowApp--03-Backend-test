import React, { useState, memo } from 'react';
import { Vendor, User, Restaurant } from '../types';
import { UserIcon, TrashIcon, EditIcon } from './Shared';

const ConfirmationModal: React.FC<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
}> = memo(({ title, message, onConfirm, onCancel, confirmText }) => {
    const [confirmationInput, setConfirmationInput] = useState('');
    
    const canConfirm = !confirmText || confirmationInput === confirmText;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-red-600">{title}</h3>
                <p className="mb-4 text-gray-700">{message}</p>
                 {confirmText && (
                    <>
                        <p className="mb-2 text-sm font-medium text-gray-800">To confirm, please type "{confirmText}" below:</p>
                        <input
                            type="text"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mb-4"
                        />
                    </>
                )}
                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg font-semibold">Cancel</button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!canConfirm}
                         className={`px-4 py-2 text-white rounded-lg font-semibold ${canConfirm ? (confirmText ? 'bg-red-600' : 'bg-primary') : 'bg-gray-400'}`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
});


const VendorModal: React.FC<{ vendor: Vendor, onSave: (v: Vendor) => void, onClose: () => void }> = memo(({ vendor, onSave, onClose }) => {
    const [name, setName] = useState(vendor.name);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...vendor, name });
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-xl font-bold text-secondary">Edit Vendor</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-800">Vendor Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-gray-800" />
                </div>
                <div className="flex justify-end space-x-3"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save</button></div>
            </form>
        </div>
    );
});

const UserModal: React.FC<{ user: User, onSave: (u: User) => void, onClose: () => void }> = memo(({ user, onSave, onClose }) => {
    const [name, setName] = useState(user.name);
    const [password, setPassword] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...user, name, password: password || undefined });
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
                <h3 className="text-xl font-bold text-secondary">Edit User</h3>
                <div><label className="block text-sm font-medium text-gray-800">Name</label><input value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded bg-gray-100 text-gray-800" /></div>
                <div><label className="text-sm font-medium text-gray-800">Username (read-only)</label><input value={user.username} readOnly className="w-full p-2 border rounded bg-gray-200 text-gray-500" /></div>
                <div><label className="block text-sm font-medium text-gray-800">New Password</label><input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep unchanged" className="w-full p-2 border rounded bg-gray-100 text-gray-800" /></div>
                <div className="flex justify-end space-x-3"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save Changes</button></div>
            </form>
        </div>
    );
});

interface SuperAdminDashboardProps {
  vendors: Vendor[];
  restaurants: Restaurant[];
  users: User[];
  onCreateVendor: (vendorName: string, adminUsername: string, adminPassword: string) => void;
  onUpdateVendor: (updated: Vendor) => void;
  onUpdateUser: (updated: User) => void;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onDeleteVendor: (vendorId: string) => void;
  onDeleteRestaurant: (restaurantId: string) => void;
  onDeleteUser: (userId: string) => void;
  onSelectRestaurant: (id: string) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ vendors, restaurants, users, onCreateVendor, onUpdateVendor, onUpdateUser, onUpdateRestaurant, onDeleteVendor, onDeleteRestaurant, onDeleteUser, onSelectRestaurant }) => {
    const [vendorName, setVendorName] = useState('');
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'vendor' | 'restaurant' | 'user', data: any } | null>(null);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateVendor(vendorName, adminUsername, adminPassword);
        setVendorName('');
        setAdminUsername('');
        setAdminPassword('');
    };
    
    const handleDelete = () => {
        if (!deleteConfirmation) return;
        
        switch (deleteConfirmation.type) {
            case 'vendor':
                onDeleteVendor(deleteConfirmation.data.id);
                break;
            case 'restaurant':
                onDeleteRestaurant(deleteConfirmation.data.id);
                break;
            case 'user':
                onDeleteUser(deleteConfirmation.data.id);
                break;
        }
        setDeleteConfirmation(null);
    }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-extrabold text-secondary mb-6">Super Admin Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-secondary border-b pb-2 mb-4">All Vendors</h3>
                    <ul className="space-y-3 max-h-60 overflow-y-auto">
                        {vendors.map(vendor => (
                            <li key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <p className="font-semibold text-gray-900">{vendor.name} (ID: {vendor.id})</p>
                                <div className="flex space-x-1">
                                    <button onClick={() => setEditingVendor(vendor)} className="p-1 text-blue-500 hover:bg-blue-100 rounded-full"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setDeleteConfirmation({ type: 'vendor', data: vendor })} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-bold text-secondary border-b pb-2 mb-4">All Users</h3>
                    <ul className="space-y-3 max-h-60 overflow-y-auto">
                        {users.map(user => (
                            <li key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                               <div className="flex items-center space-x-3">
                                   <UserIcon className="w-5 h-5 text-gray-400" />
                                   <div>
                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.role}{user.vendorId ? ` (Vendor ID: ${user.vendorId})` : ''}</p>
                                   </div>
                               </div>
                               <div className="flex space-x-1">
                                    <button onClick={() => setEditingUser(user)} className="p-1 text-blue-500 hover:bg-blue-100 rounded-full"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setDeleteConfirmation({ type: 'user', data: user })} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-secondary border-b pb-2 mb-4">All Restaurants</h3>
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                    {restaurants.map(restaurant => (
                        <li key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                                <a href={`#restaurant/${restaurant.id}`} onClick={(e) => { e.preventDefault(); onSelectRestaurant(restaurant.id); }} className="font-semibold text-primary hover:underline cursor-pointer">{restaurant.name}</a>
                                <p className="text-sm text-gray-500">Managed by Vendor ID: {restaurant.vendorId}</p>
                            </div>
                            <div className="flex space-x-1">
                                <button onClick={() => alert('Please log in as the vendor to edit restaurant details.')} className="p-1 text-blue-500 hover:bg-blue-100 rounded-full"><EditIcon className="w-4 h-4"/></button>
                                <button onClick={() => setDeleteConfirmation({ type: 'restaurant', data: restaurant })} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-secondary border-b pb-2 mb-4">Create New Vendor</h3>
            <p className="text-sm text-gray-600 mb-4">This will create a vendor company and an associated admin user. The vendor can then log in to add their restaurants.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="vendorName" className="block text-sm font-medium text-gray-800">Vendor Company Name</label>
                    <input id="vendorName" name="name" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g. Burger Queen Group" required className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800"/>
                </div>
                 <div>
                    <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-800">Admin Username</label>
                    <input id="adminUsername" name="adminUsername" value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} placeholder="e.g. vendor_bq" required className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800"/>
                </div>
                 <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-800">Admin Password</label>
                    <input id="adminPassword" name="adminPassword" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Set a secure password" required className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800"/>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-orange-600">Create Vendor</button>
            </form>
        </div>
      </div>
       {deleteConfirmation && (
            <ConfirmationModal 
                title={`Delete ${deleteConfirmation.type.charAt(0).toUpperCase() + deleteConfirmation.type.slice(1)}`}
                message={`Are you sure you want to permanently delete "${deleteConfirmation.data.name}"? This action cannot be undone.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmation(null)}
                confirmText="DELETE"
            />
        )}
        {editingVendor && <VendorModal vendor={editingVendor} onSave={onUpdateVendor} onClose={() => setEditingVendor(null)} />}
        {editingUser && <UserModal user={editingUser} onSave={onUpdateUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
};

export default SuperAdminDashboard;