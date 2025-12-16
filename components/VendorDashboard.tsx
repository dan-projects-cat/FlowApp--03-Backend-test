// FIX: Imported `useEffect` from react.
import React, { useState, useMemo, useEffect, memo } from 'react';
import { Vendor, Restaurant, MenuItemTemplate, MediaContent, Order, User, MediaType, UserRole, PaymentMethod, RestaurantPermissions, PermissionSchedule, ActiveHours, OrderManagementConfig, OrderStatusConfig, KanbanColumn, RejectionReason, BoardTemplate, MenuTemplate, Allergen, Intolerance, MenuSection, DayOpeningHours } from '../types';
import { fileToBase64 } from './Shared';
import { 
    ChartIcon, SettingsIcon, MenuBookIcon, VideoIcon, PlusIcon, EditIcon, TrashIcon,
    ClipboardListIcon,
    UserIcon as PeopleIcon,
    ChefHatIcon,
    ShoppingBagIcon,
    CheckCircleIcon,
    HourglassIcon,
    ThumbsUpIcon,
    XCircleIcon,
    FlagCheckeredIcon,
} from './Shared';
import { ALLERGENS, INTOLERANCES } from '../data';
import Analytics from './Analytics';

const ICON_MAP: Record<string, React.FC<{className?: string}>> = {
    ClipboardListIcon,
    ChefHatIcon,
    ShoppingBagIcon,
    CheckCircleIcon,
    HourglassIcon,
    ThumbsUpIcon,
    XCircleIcon,
    ChartIcon,
    SettingsIcon,
    MenuBookIcon,
    VideoIcon,
    PeopleIcon,
    FlagCheckeredIcon,
};

const isUserActive = (user: User): boolean => {
    if (user.role !== UserRole.RestaurantAdmin || !user.permissionSchedule) {
        return true; // Non-admins or those without a schedule are always "active"
    }

    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()] as keyof PermissionSchedule;
    
    const scheduleForToday = user.permissionSchedule[dayOfWeek];

    if (!scheduleForToday || !scheduleForToday.isActive) {
        return false;
    }

    const { startTime, endTime } = scheduleForToday;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
};


const ConfirmationModal: React.FC<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
}> = memo(({ title, message, onConfirm, onCancel, confirmText }) => {
    const [confirmationInput, setConfirmationInput] = useState('');
    
    // If confirmText is provided, user must type it. Otherwise, button is always enabled.
    const canConfirm = !confirmText || confirmationInput === confirmText;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4">
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
                        className={`px-4 py-2 text-white rounded-lg font-semibold ${confirmText ? 'bg-red-600 disabled:bg-red-300' : 'bg-primary'}`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
});

const BoardTemplateModal: React.FC<{
    template: Partial<BoardTemplate>;
    onSave: (template: Partial<BoardTemplate>) => void;
    onClose: () => void;
}> = ({ template, onSave, onClose }) => {
    const [name, setName] = useState(template.name || 'New Board Template');
    const [boardConfig, setBoardConfig] = useState<OrderManagementConfig>(template.config || { statuses: [], columns: [], rejectionReasons: [], statusTransitions: {} });

    const handleConfigChange = <T extends keyof OrderManagementConfig>(field: T, value: OrderManagementConfig[T]) => {
        setBoardConfig(prev => ({...prev, [field]: value}));
    }

    const handleTransitionChange = (fromStatusId: string, toStatusId: string, isAllowed: boolean) => {
        setBoardConfig(prev => {
            const newTransitions = { ...prev.statusTransitions };
            const allowed = new Set(newTransitions[fromStatusId] || []);
            if (isAllowed) allowed.add(toStatusId);
            else allowed.delete(toStatusId);
            newTransitions[fromStatusId] = Array.from(allowed);
            return { ...prev, statusTransitions: newTransitions };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...template, name, config: boardConfig });
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-secondary">Edit Board Template</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XCircleIcon className="w-6 h-6"/></button>
                </div>
                
                <div className="p-4 flex-grow overflow-y-auto space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-800">Template Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800 placeholder-gray-500" required />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Statuses and Rejection Reasons */}
                        <div className="space-y-6">
                            {/* Statuses */}
                            <div>
                                <h4 className="font-semibold mb-2 text-gray-800">Statuses</h4>
                                <div className="space-y-2 p-2 border rounded-md max-h-60 overflow-y-auto">
                                    {boardConfig.statuses.map((status, index) => (
                                        <div key={status.id} className="flex items-center space-x-2">
                                            <input value={status.label} onChange={e => handleConfigChange('statuses', boardConfig.statuses.map(s => s.id === status.id ? {...s, label: e.target.value} : s))} placeholder="Label" className="p-1 border rounded bg-gray-100 text-gray-800 w-1/2" />
                                            <input type="color" value={status.color} onChange={e => handleConfigChange('statuses', boardConfig.statuses.map(s => s.id === status.id ? {...s, color: e.target.value} : s))} className="p-1 border rounded h-8 w-10" />
                                            <input value={status.id} readOnly className="p-1 border rounded bg-gray-200 text-gray-500 flex-grow" />
                                            <button type="button" onClick={() => handleConfigChange('statuses', boardConfig.statuses.filter(s => s.id !== status.id))} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => { const id = `status-${Date.now()}`; handleConfigChange('statuses', [...boardConfig.statuses, {id, label: '', color: '#CCCCCC'}]);}} className="mt-2 text-sm text-primary">+ Add Status</button>
                            </div>
                            
                            {/* Rejection Reasons */}
                            <div>
                                <h4 className="font-semibold mb-2 text-gray-800">Rejection Reasons</h4>
                                <div className="space-y-2 p-2 border rounded-md max-h-60 overflow-y-auto">
                                    {boardConfig.rejectionReasons.map((reason, index) => (
                                         <div key={reason.id} className="flex items-center space-x-2">
                                            <input value={reason.message} onChange={e => handleConfigChange('rejectionReasons', boardConfig.rejectionReasons.map(r => r.id === reason.id ? {...r, message: e.target.value} : r))} placeholder="Rejection Message" className="p-1 border rounded bg-gray-100 text-gray-800 flex-grow" />
                                            <button type="button" onClick={() => handleConfigChange('rejectionReasons', boardConfig.rejectionReasons.filter(r => r.id !== reason.id))} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => handleConfigChange('rejectionReasons', [...boardConfig.rejectionReasons, {id: `reason-${Date.now()}`, message: ''}])} className="mt-2 text-sm text-primary">+ Add Reason</button>
                            </div>
                        </div>

                        {/* Columns */}
                        <div>
                             <h4 className="font-semibold mb-2 text-gray-800">Columns</h4>
                             <div className="space-y-3 p-2 border rounded-md max-h-[400px] overflow-y-auto">
                                {boardConfig.columns.map(col => (
                                    <div key={col.id} className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input value={col.title} onChange={e => handleConfigChange('columns', boardConfig.columns.map(c => c.id === col.id ? {...c, title: e.target.value} : c))} placeholder="Column Title" className="p-1 border rounded bg-gray-100 text-gray-800" />
                                            <select value={col.icon} onChange={e => handleConfigChange('columns', boardConfig.columns.map(c => c.id === col.id ? {...c, icon: e.target.value} : c))} className="p-1 border rounded bg-gray-100 text-gray-800">
                                                <option value="">No Icon</option>
                                                {Object.keys(ICON_MAP).map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                                            </select>
                                            <div className="flex items-center">
                                                <label className="text-xs mr-2 text-gray-800">Title</label>
                                                <input type="color" value={col.titleColor || '#000000'} onChange={e => handleConfigChange('columns', boardConfig.columns.map(c => c.id === col.id ? {...c, titleColor: e.target.value} : c))} className="p-1 border rounded h-8 w-10" />
                                            </div>
                                            <div className="flex items-center">
                                                <label className="text-xs mr-2 text-gray-800">Background</label>
                                                <input type="color" value={col.columnColor || '#FFFFFF'} onChange={e => handleConfigChange('columns', boardConfig.columns.map(c => c.id === col.id ? {...c, columnColor: e.target.value} : c))} className="p-1 border rounded h-8 w-10" />
                                            </div>
                                        </div>
                                        <h5 className="text-sm font-medium mb-1 text-gray-800">Assigned Statuses</h5>
                                        <div className="max-h-24 overflow-y-auto">
                                            {boardConfig.statuses.map(status => (
                                                <div key={status.id} className="text-xs">
                                                    <label className="flex items-center text-gray-800">
                                                        <input type="checkbox" checked={col.statusIds.includes(status.id)} onChange={e => {
                                                            const newStatusIds = e.target.checked ? [...col.statusIds, status.id] : col.statusIds.filter(id => id !== status.id);
                                                            handleConfigChange('columns', boardConfig.columns.map(c => c.id === col.id ? {...c, statusIds: newStatusIds} : c));
                                                        }} className="mr-2"/>
                                                        {status.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                         <button type="button" onClick={() => handleConfigChange('columns', boardConfig.columns.filter(c => c.id !== col.id))} className="text-red-500 mt-2 text-xs">Remove Column</button>
                                    </div>
                                ))}
                             </div>
                             <button type="button" onClick={() => handleConfigChange('columns', [...boardConfig.columns, {id: `col-${Date.now()}`, title: 'New Column', statusIds: []}])} className="mt-2 text-sm text-primary">+ Add Column</button>
                        </div>
                    </div>

                    {/* Workflow */}
                    <div>
                         <h4 className="font-semibold mb-2 text-gray-800">Workflow (Status Transitions)</h4>
                         <div className="overflow-x-auto border rounded-md">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-2 text-left text-gray-600 font-semibold uppercase tracking-wider">From Status</th>
                                        {boardConfig.statuses.map(s => <th key={s.id} className="p-2 text-center text-gray-600 font-semibold uppercase tracking-wider">{s.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {boardConfig.statuses.map(fromStatus => (
                                        <tr key={fromStatus.id} className="border-t">
                                            <td className="p-2 font-medium text-gray-800">{fromStatus.label}</td>
                                            {boardConfig.statuses.map(toStatus => (
                                                <td key={toStatus.id} className="p-2 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        checked={boardConfig.statusTransitions[fromStatus.id]?.includes(toStatus.id) || false}
                                                        onChange={e => handleTransitionChange(fromStatus.id, toStatus.id, e.target.checked)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save Template</button>
                </div>
            </form>
        </div>
    )
};

const RestaurantAdminModal: React.FC<{
    user: Partial<User>;
    restaurant: Restaurant;
    onSave: (user: Partial<User>) => void;
    onClose: () => void;
}> = ({ user, restaurant, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<User>>(user);
    const [schedule, setSchedule] = useState<PermissionSchedule>(user.permissionSchedule || {
        monday: { isActive: false, startTime: '09:00', endTime: '17:00' },
        tuesday: { isActive: false, startTime: '09:00', endTime: '17:00' },
        wednesday: { isActive: false, startTime: '09:00', endTime: '17:00' },
        thursday: { isActive: false, startTime: '09:00', endTime: '17:00' },
        friday: { isActive: false, startTime: '09:00', endTime: '17:00' },
        saturday: { isActive: false, startTime: '09:00', endTime: '17:00' },
        sunday: { isActive: false, startTime: '09:00', endTime: '17:00' },
    });
    
    const isNewUser = !user.id;
    const allPermissions: Record<keyof RestaurantPermissions, string> = {
        canManageOrders: 'Manage Orders',
        canViewAnalytics: 'View Analytics',
        canManageMenu: 'Manage Menu',
        canManageSettings: 'Manage Settings',
    };
    
    const handlePermissionChange = (perm: keyof RestaurantPermissions, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [perm]: value }
        }));
    };
    
    const handleScheduleChange = (day: keyof PermissionSchedule, field: keyof ActiveHours, value: any) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, permissionSchedule: schedule, restaurantId: restaurant.id });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="text-xl font-bold text-secondary">{isNewUser ? 'Create' : 'Edit'} Restaurant Admin</h3>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-800">Name</label><input value={formData.name || ''} onChange={e => setFormData(p => ({...p, name: e.target.value}))} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" required /></div>
                        <div><label className="block text-sm font-medium text-gray-800">Username</label><input value={formData.username || ''} onChange={e => setFormData(p => ({...p, username: e.target.value}))} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" required readOnly={!isNewUser} /></div>
                        <div><label className="block text-sm font-medium text-gray-800">Password</label><input type="text" value={formData.password || ''} onChange={e => setFormData(p => ({...p, password: e.target.value}))} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" placeholder={isNewUser ? 'Set a password' : 'Enter new password'} required={isNewUser} /></div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-gray-800">Permissions for {restaurant.name}</h4>
                        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border">
                           {Object.keys(allPermissions).map(p => {
                                const permKey = p as keyof RestaurantPermissions;
                                return (
                                    <label key={permKey} className="flex items-center space-x-2">
                                        <input type="checkbox" checked={formData.permissions?.[permKey] || false} onChange={e => handlePermissionChange(permKey, e.target.checked)} className="h-4 w-4 text-primary rounded focus:ring-primary"/>
                                        <span className="text-gray-800">{allPermissions[permKey]}</span>
                                    </label>
                                )
                           })}
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2 text-gray-800">Active Hours Schedule</h4>
                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                            {Object.keys(schedule).map(day => {
                                const dayKey = day as keyof PermissionSchedule;
                                return (
                                    <div key={dayKey} className="grid grid-cols-4 gap-2 items-center">
                                        <label className="flex items-center col-span-1">
                                            <input type="checkbox" checked={schedule[dayKey].isActive} onChange={e => handleScheduleChange(dayKey, 'isActive', e.target.checked)} className="mr-2" />
                                            <span className="capitalize text-gray-800">{dayKey}</span>
                                        </label>
                                        <div className="col-span-3 grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-800">Start Time</label>
                                                <input type="time" disabled={!schedule[dayKey].isActive} value={schedule[dayKey].startTime} onChange={e => handleScheduleChange(dayKey, 'startTime', e.target.value)} className="w-full p-1 border rounded bg-gray-100 text-gray-800 disabled:bg-gray-200"/>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-800">End Time</label>
                                                <input type="time" disabled={!schedule[dayKey].isActive} value={schedule[dayKey].endTime} onChange={e => handleScheduleChange(dayKey, 'endTime', e.target.value)} className="w-full p-1 border rounded bg-gray-100 text-gray-800 disabled:bg-gray-200"/>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save Changes</button>
                </div>
            </form>
        </div>
    )
};

const MenuItemTemplateModal: React.FC<{
    item: Partial<MenuItemTemplate>;
    vendorId: string;
    onSave: (item: Partial<MenuItemTemplate>) => void;
    onClose: () => void;
}> = ({ item, vendorId, onSave, onClose }) => {
    const isNewItem = !item.id;
    const [formData, setFormData] = useState<Partial<MenuItemTemplate>>({
        name: '', description: '', price: 0, imageUrl: '',
        composition: [], allergens: [], intolerances: [],
        discount: { percentage: 0, showToConsumer: false },
        ...item
    });
    const [newIngredient, setNewIngredient] = useState('');
    const imageInputRef = React.useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setFormData(prev => ({ ...prev, imageUrl: base64 }));
            } catch (error) {
                console.error("Failed to convert file to Base64", error);
            }
        }
    };
    
    const handleDiscountChange = (field: 'percentage' | 'showToConsumer', value: number | boolean) => {
        setFormData(prev => ({
            ...prev,
            discount: { ...prev.discount!, [field]: value }
        }));
    };
    
    const handleAddIngredient = () => {
        if (newIngredient.trim()) {
            setFormData(prev => ({ ...prev, composition: [...(prev.composition || []), newIngredient.trim()]}));
            setNewIngredient('');
        }
    };
    
    const handleRemoveIngredient = (index: number) => {
        setFormData(prev => ({ ...prev, composition: prev.composition?.filter((_, i) => i !== index)}));
    };
    
    const handleToggle = (type: 'allergens' | 'intolerances', value: Allergen | Intolerance) => {
        setFormData(prev => {
            const current = prev[type] as any[] || [];
            const isSelected = current.some(i => i.id === value.id);
            const newSelection = isSelected ? current.filter(i => i.id !== value.id) : [...current, value];
            return { ...prev, [type]: newSelection };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, vendorId });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-secondary">{isNewItem ? 'Create' : 'Edit'} Menu Item</h3>
                    <button type="button" onClick={onClose} className="p-1"><XCircleIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-800">Name</label>
                        <input id="name" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800 placeholder-gray-500" required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-800">Description</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800 placeholder-gray-500" required />
                    </div>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-800">Price</label>
                        <input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800 placeholder-gray-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-800">Image</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <input name="imageUrl" value={formData.imageUrl?.startsWith('data:') ? '' : formData.imageUrl} onChange={handleChange} placeholder="Paste Image URL" className="w-full p-2 border rounded-md bg-gray-100 text-gray-800 placeholder-gray-500" />
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm">Upload</button>
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </div>
                        {formData.imageUrl && <img src={formData.imageUrl} alt="preview" className="mt-2 h-24 w-24 object-cover rounded-md"/>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-800">Ingredients (for customization)</label>
                        <div className="p-2 border rounded-md mt-1">
                            <ul className="space-y-1 mb-2 max-h-24 overflow-y-auto">
                                {formData.composition?.map((ing, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm bg-gray-100 p-1 rounded">
                                        <span className="text-gray-800">{ing}</span>
                                        <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex space-x-2">
                                <input value={newIngredient} onChange={e => setNewIngredient(e.target.value)} placeholder="Add ingredient" className="w-full p-2 border rounded-md bg-gray-100 text-gray-800 placeholder-gray-500" />
                                <button type="button" onClick={handleAddIngredient} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm">Add</button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-800">Allergens</label>
                            <div className="p-2 border rounded-md mt-1 space-y-1">
                                {ALLERGENS.map(allergen => (
                                    <label key={allergen.id} className="flex items-center"><input type="checkbox" checked={formData.allergens?.some(a => a.id === allergen.id)} onChange={() => handleToggle('allergens', allergen)} className="mr-2"/> <span className="text-gray-800">{allergen.name}</span></label>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-800">Intolerances</label>
                            <div className="p-2 border rounded-md mt-1 space-y-1">
                                {INTOLERANCES.map(intolerance => (
                                    <label key={intolerance.id} className="flex items-center"><input type="checkbox" checked={formData.intolerances?.some(i => i.id === intolerance.id)} onChange={() => handleToggle('intolerances', intolerance)} className="mr-2"/> <span className="text-gray-800">{intolerance.name}</span></label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-800">Discount</label>
                        <div className="flex items-center space-x-4 p-2 border rounded-md mt-1">
                            <input type="number" value={formData.discount?.percentage || 0} onChange={e => handleDiscountChange('percentage', parseInt(e.target.value))} className="w-24 p-2 border rounded-md bg-gray-100 text-gray-800" placeholder="%" />
                            <label className="flex items-center"><input type="checkbox" checked={formData.discount?.showToConsumer || false} onChange={e => handleDiscountChange('showToConsumer', e.target.checked)} className="mr-2"/> <span className="text-gray-800">Show to consumer</span></label>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save Item</button>
                </div>
            </form>
        </div>
    );
};

const MenuTemplateModal: React.FC<{
    template: Partial<MenuTemplate>;
    allItems: MenuItemTemplate[];
    onSave: (template: Partial<MenuTemplate>) => void;
    onClose: () => void;
}> = ({ template, allItems, onSave, onClose }) => {
    const [name, setName] = useState(template.name || 'New Menu');
    const [sections, setSections] = useState<MenuSection[]>(template.sections || []);
    const [newSectionName, setNewSectionName] = useState('');

    const handleAddSection = () => {
        if (newSectionName.trim()) {
            setSections(prev => [...prev, { id: `sec-${Date.now()}`, title: newSectionName.trim(), itemIds: [] }]);
            setNewSectionName('');
        }
    };
    
    const handleRenameSection = (sectionId: string, newTitle: string) => {
        setSections(prev => prev.map(s => s.id === sectionId ? {...s, title: newTitle} : s));
    };

    const handleDeleteSection = (sectionId: string) => {
        setSections(prev => prev.filter(s => s.id !== sectionId));
    };
    
    const handleToggleItemInSection = (sectionId: string, itemId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id === sectionId) {
                const hasItem = s.itemIds.includes(itemId);
                const newItemIds = hasItem ? s.itemIds.filter(id => id !== itemId) : [...s.itemIds, itemId];
                return {...s, itemIds: newItemIds};
            }
            return s;
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...template, name, sections });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="text-xl font-bold text-secondary">Edit Menu Template</h3>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-800">Menu Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-800">Menu Sections</label>
                        <div className="space-y-3 mt-1">
                            {sections.map(section => (
                                <div key={section.id} className="p-3 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <input value={section.title} onChange={e => handleRenameSection(section.id, e.target.value)} className="font-semibold text-lg p-1 border rounded bg-gray-100 text-gray-800" />
                                        <button type="button" onClick={() => handleDeleteSection(section.id)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                                        {allItems.map(item => (
                                            <label key={item.id} className="text-sm flex items-center">
                                                <input type="checkbox" checked={section.itemIds.includes(item.id)} onChange={() => handleToggleItemInSection(section.id, item.id)} className="mr-2"/>
                                                <span className="text-gray-800">{item.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex space-x-2 mt-2">
                            <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)} placeholder="New section name" className="w-full p-2 border rounded-md bg-gray-100 text-gray-800" />
                            <button type="button" onClick={handleAddSection} className="px-4 py-2 bg-green-500 text-white rounded-md">Add Section</button>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save Menu</button>
                </div>
            </form>
        </div>
    );
};

const MenuManager: React.FC<{
    vendorId: string;
    menuTemplates: MenuTemplate[];
    menuItemTemplates: MenuItemTemplate[];
    onCreateMenuTemplate: (templateData: Omit<MenuTemplate, 'id'>) => void;
    onUpdateMenuTemplate: (template: MenuTemplate) => void;
    onDeleteMenuTemplate: (templateId: string) => void;
    onCreateMenuItemTemplate: (itemData: Omit<MenuItemTemplate, 'id'>) => void;
    onUpdateMenuItemTemplate: (item: MenuItemTemplate) => void;
    onDeleteMenuItemTemplate: (itemId: string) => void;
}> = (props) => {
    const [editingItem, setEditingItem] = useState<Partial<MenuItemTemplate> | null>(null);
    const [editingMenu, setEditingMenu] = useState<Partial<MenuTemplate> | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{type: 'item' | 'menu', id: string, name: string} | null>(null);
    
    const handleSaveItem = (item: Partial<MenuItemTemplate>) => {
        if (item.id) props.onUpdateMenuItemTemplate(item as MenuItemTemplate);
        else props.onCreateMenuItemTemplate(item as Omit<MenuItemTemplate, 'id'>);
        setEditingItem(null);
    };

    const handleSaveMenu = (menu: Partial<MenuTemplate>) => {
        if (menu.id) props.onUpdateMenuTemplate(menu as MenuTemplate);
        else props.onCreateMenuTemplate({ ...menu, vendorId: props.vendorId } as Omit<MenuTemplate, 'id'>);
        setEditingMenu(null);
    };
    
    const handleDelete = () => {
        if (!deleteConfirmation) return;
        if (deleteConfirmation.type === 'item') props.onDeleteMenuItemTemplate(deleteConfirmation.id);
        else props.onDeleteMenuTemplate(deleteConfirmation.id);
        setDeleteConfirmation(null);
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-xl font-bold text-secondary">Menu Item Library</h3>
                    <button onClick={() => setEditingItem({ vendorId: props.vendorId })} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">+ Add Item</button>
                </div>
                 <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
                    {props.menuItemTemplates.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => setEditingItem(item)} className="p-1 text-blue-500"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={() => setDeleteConfirmation({type: 'item', id: item.id, name: item.name})} className="p-1 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-xl font-bold text-secondary">Menu Templates</h3>
                    <button onClick={() => setEditingMenu({ vendorId: props.vendorId })} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">+ Add Menu</button>
                </div>
                 <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
                    {props.menuTemplates.map(menu => (
                        <div key={menu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <p className="font-semibold text-gray-900">{menu.name}</p>
                             <div className="flex space-x-2">
                                <button onClick={() => setEditingMenu(menu)} className="p-1 text-blue-500"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={() => setDeleteConfirmation({type: 'menu', id: menu.id, name: menu.name})} className="p-1 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
            {editingItem && <MenuItemTemplateModal item={editingItem} vendorId={props.vendorId} onSave={handleSaveItem} onClose={() => setEditingItem(null)} />}
            {editingMenu && <MenuTemplateModal template={editingMenu} allItems={props.menuItemTemplates} onSave={handleSaveMenu} onClose={() => setEditingMenu(null)} />}
            {deleteConfirmation && <ConfirmationModal title={`Delete ${deleteConfirmation.type}`} message={`Are you sure you want to delete "${deleteConfirmation.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteConfirmation(null)} confirmText="DELETE" />}
        </div>
    );
};

const RestaurantSettings: React.FC<{
    restaurant: Restaurant;
    boardTemplates: BoardTemplate[];
    menuTemplates: MenuTemplate[];
    onUpdateRestaurant: (updated: Restaurant) => void;
}> = ({ restaurant, boardTemplates, menuTemplates, onUpdateRestaurant }) => {
    const [formData, setFormData] = useState<Partial<Restaurant>>(restaurant);
    const [activeMedia, setActiveMedia] = useState<Partial<MediaContent> | null>(null);

    // Sync formData with props
    useEffect(() => {
        setFormData(restaurant);
    }, [restaurant]);


    const handleUpdate = () => {
        onUpdateRestaurant(formData as Restaurant);
    };

    const handleMediaSave = (media: Partial<MediaContent>) => {
        const newMediaArray = media.id
            ? formData.media!.map(m => m.id === media.id ? media as MediaContent : m)
            : [...(formData.media || []), { ...media, id: String(Date.now()) } as MediaContent];
        setFormData(prev => ({...prev, media: newMediaArray}));
        setActiveMedia(null);
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Restaurant Settings: <span className="text-primary">{restaurant.name}</span></h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2 text-gray-800">Assign Board Template</h4>
                    <select
                        value={formData.boardTemplateId || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(p => ({...p, boardTemplateId: e.target.value ? e.target.value : undefined }))}
                        className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800"
                    >
                        <option value="">-- Select a Board --</option>
                        {boardTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2 text-gray-800">Assign Menu Templates</h4>
                    <select
                        multiple
                        value={formData.assignedMenuTemplateIds?.map(String) || []}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const selectedIds = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                            setFormData(p => ({...p, assignedMenuTemplateIds: selectedIds}));
                        }}
                        className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800 h-24"
                    >
                        {menuTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

             <div>
                <h4 className="font-semibold mb-2 text-gray-800">Accepted Payment Methods</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.values(PaymentMethod).map(method => (
                        <label key={method} className="flex items-center space-x-2">
                             <input type="checkbox" checked={formData.paymentMethods?.includes(method)} onChange={e => {
                                 const newMethods = e.target.checked
                                     ? [...(formData.paymentMethods || []), method]
                                     : formData.paymentMethods?.filter(p => p !== method);
                                 setFormData(p => ({...p, paymentMethods: newMethods}));
                             }}/>
                             <span className="text-gray-800">{method}</span>
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="flex justify-end">
                <button onClick={handleUpdate} className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-600">Save Settings</button>
            </div>
        </div>
    );
};

const defaultOpeningHours: Restaurant['openingHours'] = {
    monday: { isOpen: true, open: '09:00', close: '22:00' },
    tuesday: { isOpen: true, open: '09:00', close: '22:00' },
    wednesday: { isOpen: true, open: '09:00', close: '22:00' },
    thursday: { isOpen: true, open: '09:00', close: '22:00' },
    friday: { isOpen: true, open: '09:00', close: '22:00' },
    saturday: { isOpen: true, open: '09:00', close: '22:00' },
    sunday: { isOpen: false, open: '09:00', close: '22:00' },
};

const RestaurantModal: React.FC<{
    restaurant: Partial<Restaurant>;
    vendorId: string;
    onSave: (restaurant: Partial<Restaurant>) => void;
    onClose: () => void;
}> = ({ restaurant, vendorId, onSave, onClose }) => {
    const isNew = !restaurant.id;
    const imageInputRef = React.useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<Partial<Restaurant>>({
        name: '', description: '', bannerUrl: '', 
        contact: { phone: '', email: '', address: '' },
        openingHours: defaultOpeningHours,
        branding: { primaryColor: '#F97316', logoUrl: '' },
        paymentMethods: [],
        media: [],
        ...restaurant
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, group?: keyof Restaurant) => {
        const { name, value } = e.target;
        if (group) {
            setFormData(prev => ({
                ...prev,
                [group]: { ...(prev[group] as object), [name]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setFormData(prev => ({ ...prev, bannerUrl: base64 }));
            } catch (error) {
                console.error("Failed to convert file to Base64", error);
            }
        }
    };

    const handleOpeningHoursChange = (day: keyof Restaurant['openingHours'], field: keyof DayOpeningHours, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            openingHours: {
                ...prev.openingHours,
                [day]: { ...(prev.openingHours as any)[day], [field]: value }
            }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, vendorId });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-secondary">{isNew ? 'Create' : 'Edit'} Restaurant</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XCircleIcon className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-800">Name</label><input name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" required /></div>
                        <div>
                            <label className="block text-sm font-medium text-gray-800">Banner Image</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <input name="bannerUrl" value={formData.bannerUrl?.startsWith('data:') ? 'Uploaded Image' : formData.bannerUrl} onChange={handleChange} placeholder="Paste Image URL" className="w-full p-2 border rounded-md bg-gray-100 text-gray-800" />
                                <button type="button" onClick={() => imageInputRef.current?.click()} className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm whitespace-nowrap">Upload</button>
                                <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>
                        </div>
                    </div>
                     {formData.bannerUrl && <img src={formData.bannerUrl} alt="Banner Preview" className="mt-2 h-32 w-full object-cover rounded-md"/>}
                    <div><label className="block text-sm font-medium text-gray-800">Description</label><textarea name="description" value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} rows={3} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" /></div>
                    <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold text-gray-800">Contact Info</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-800">Phone</label><input name="phone" value={formData.contact?.phone} onChange={(e) => handleChange(e, 'contact')} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" /></div>
                            <div><label className="block text-sm font-medium text-gray-800">Email</label><input name="email" type="email" value={formData.contact?.email} onChange={(e) => handleChange(e, 'contact')} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" /></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-800">Address</label><input name="address" value={formData.contact?.address} onChange={(e) => handleChange(e, 'contact')} className="w-full mt-1 p-2 border rounded-md bg-gray-100 text-gray-800" /></div>
                        </div>
                    </fieldset>
                     <fieldset className="border p-4 rounded-md">
                        <legend className="px-2 font-semibold text-gray-800">Opening Hours</legend>
                        <div className="space-y-2">
                            {Object.keys(formData.openingHours || {}).map(day => {
                                const dayKey = day as keyof Restaurant['openingHours'];
                                const dayData = formData.openingHours![dayKey];
                                return (
                                <div key={dayKey} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                    <label className="flex items-center col-span-1">
                                        <input type="checkbox" checked={dayData.isOpen} onChange={e => handleOpeningHoursChange(dayKey, 'isOpen', e.target.checked)} className="mr-2 h-4 w-4" />
                                        <span className="capitalize text-gray-800 font-medium">{dayKey}</span>
                                    </label>
                                    <div className="col-span-3 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-600">Open</label>
                                            <input type="time" disabled={!dayData.isOpen} value={dayData.open} onChange={e => handleOpeningHoursChange(dayKey, 'open', e.target.value)} className="w-full p-1 border rounded bg-gray-100 text-gray-800 disabled:bg-gray-200"/>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">Close</label>
                                            <input type="time" disabled={!dayData.isOpen} value={dayData.close} onChange={e => handleOpeningHoursChange(dayKey, 'close', e.target.value)} className="w-full p-1 border rounded bg-gray-100 text-gray-800 disabled:bg-gray-200"/>
                                        </div>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    </fieldset>
                </div>
                <div className="p-4 border-t flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">Save Changes</button>
                </div>
            </form>
        </div>
    );
};

const RestaurantManager: React.FC<{
    restaurants: Restaurant[];
    onAdd: () => void;
    onEdit: (restaurant: Restaurant) => void;
    onDelete: (restaurant: Restaurant) => void;
}> = memo(({ restaurants, onAdd, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="text-xl font-bold text-secondary">Manage Restaurants</h3>
                <button onClick={onAdd} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">+ Add Restaurant</button>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {restaurants.map(restaurant => (
                    <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                            <p className="font-semibold text-gray-900">{restaurant.name}</p>
                            <p className="text-sm text-gray-500">{restaurant.contact.address}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => onEdit(restaurant)} className="p-1 text-blue-500"><EditIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDelete(restaurant)} className="p-1 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});


const SettingsManager: React.FC<{
    restaurant: Restaurant;
    boardTemplates: BoardTemplate[];
    menuTemplates: MenuTemplate[];
    vendorId: string;
    onUpdateRestaurant: (updated: Restaurant) => void;
    onCreateBoardTemplate: (templateData: Omit<BoardTemplate, 'id'>) => void;
    onUpdateBoardTemplate: (template: BoardTemplate) => void;
    onDeleteBoardTemplate: (templateId: string) => void;
}> = (props) => {
    const [editingBoard, setEditingBoard] = useState<Partial<BoardTemplate> | null>(null);
    const [deletingBoard, setDeletingBoard] = useState<BoardTemplate | null>(null);

    const handleSaveBoard = (template: Partial<BoardTemplate>) => {
        if (template.id) {
            props.onUpdateBoardTemplate(template as BoardTemplate);
        } else {
            props.onCreateBoardTemplate({ ...template, vendorId: props.vendorId } as Omit<BoardTemplate, 'id'>);
        }
        setEditingBoard(null);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-xl font-bold text-secondary">Order Board Templates</h3>
                    <button onClick={() => setEditingBoard({})} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">+ Add Template</button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {props.boardTemplates.map(template => (
                         <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <p className="font-semibold text-gray-900">{template.name}</p>
                             <div className="flex space-x-2">
                                <button onClick={() => setEditingBoard(template)} className="p-1 text-blue-500"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={() => setDeletingBoard(template)} className="p-1 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <RestaurantSettings 
                restaurant={props.restaurant}
                boardTemplates={props.boardTemplates}
                menuTemplates={props.menuTemplates}
                onUpdateRestaurant={props.onUpdateRestaurant}
            />

            {editingBoard && <BoardTemplateModal template={editingBoard} onSave={handleSaveBoard} onClose={() => setEditingBoard(null)} />}
            {deletingBoard && <ConfirmationModal title="Delete Board Template" message={`Are you sure you want to delete "${deletingBoard.name}"? This will also unlink it from any restaurants using it.`} onConfirm={() => { props.onDeleteBoardTemplate(deletingBoard.id); setDeletingBoard(null); }} onCancel={() => setDeletingBoard(null)} confirmText="DELETE" />}
        </div>
    );
};


const OrderManagement: React.FC<{
    orders: Order[],
    boardConfig: OrderManagementConfig,
    onUpdateStatus: (orderId: string, status: string, reason?: string) => void
}> = ({ orders, boardConfig, onUpdateStatus }) => {
    const [draggingOrder, setDraggingOrder] = useState<string | null>(null);
    const [showRejected, setShowRejected] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [rejectionModal, setRejectionModal] = useState<{orderId: string, status: string} | null>(null);
    const [moveBackConfirmation, setMoveBackConfirmation] = useState<{order: Order, targetStatus: OrderStatusConfig} | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: string) => {
        setDraggingOrder(orderId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, column: KanbanColumn) => {
        e.preventDefault();
        if (!draggingOrder) return;

        const order = orders.find(o => o.id === draggingOrder);
        if (!order) return;

        const currentStatus = boardConfig.statuses.find(s => s.id === order.status);
        if (!currentStatus) return;

        const targetStatuses = column.statusIds.map(id => boardConfig.statuses.find(s => s.id === id)).filter(Boolean) as OrderStatusConfig[];
        
        // Find if a valid transition exists from current status to any of the column's statuses
        const validTransitions = boardConfig.statusTransitions[currentStatus.id] || [];
        const possibleTarget = targetStatuses.find(ts => validTransitions.includes(ts.id));

        if (possibleTarget) {
            onUpdateStatus(draggingOrder, possibleTarget.id);
        } else {
             const fromColumnIndex = boardConfig.columns.findIndex(c => c.statusIds.includes(order.status));
             const toColumnIndex = boardConfig.columns.findIndex(c => c.id === column.id);

            if (toColumnIndex < fromColumnIndex) {
                 const targetStatus = targetStatuses[0];
                 if (targetStatus) {
                    setMoveBackConfirmation({order, targetStatus});
                 }
            }
        }
        setDraggingOrder(null);
    };
    
     const handleRejection = (reason: string) => {
        if (!rejectionModal) return;
        onUpdateStatus(rejectionModal.orderId, rejectionModal.status, reason);
        setRejectionModal(null);
    };

    const getStatusById = (id: string) => boardConfig.statuses.find(s => s.id === id);

    const displayedOrders = useMemo(() => {
        return orders.filter(o => {
            if (!showRejected && o.status === 'rejected') return false;
            if (!showCompleted && o.status === 'completed') return false;
            return true;
        });
    }, [orders, showRejected, showCompleted]);

    const columns = useMemo(() => {
        let cols = [...boardConfig.columns];
        if (showRejected) {
            cols.push({ id: 'col-rejected', title: 'Rejected', statusIds: ['rejected'], icon: 'XCircleIcon', titleColor: '#DC2626', columnColor: '#FEF2F2' });
        }
        if (showCompleted) {
            cols.push({ id: 'col-completed', title: 'Completed', statusIds: ['completed'], icon: 'FlagCheckeredIcon', titleColor: '#16A34A', columnColor: '#F0FDF4' });
        }
        return cols;
    }, [boardConfig.columns, showRejected, showCompleted]);
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Orders</h3>
                <div className="flex space-x-2">
                    <button onClick={() => setShowCompleted(!showCompleted)} className="px-4 py-2 bg-gray-200 text-sm font-semibold rounded-lg">{showCompleted ? 'Hide Completed' : 'Show Completed'}</button>
                    <button onClick={() => setShowRejected(!showRejected)} className="px-4 py-2 bg-gray-200 text-sm font-semibold rounded-lg">{showRejected ? 'Hide Rejected' : 'Show Rejected'}</button>
                </div>
            </div>
            <div className="flex-grow grid gap-4 auto-cols-[minmax(300px,_1fr)] grid-flow-col overflow-x-auto p-2">
                {columns.map(col => (
                    <div
                        key={col.id}
                        onDrop={(e) => handleDrop(e, col)}
                        onDragOver={(e) => e.preventDefault()}
                        className="rounded-lg flex flex-col"
                        style={{backgroundColor: col.columnColor || '#F9FAFB'}}
                    >
                        <div className="p-3 font-bold flex items-center space-x-2 border-b-4" style={{borderColor: col.titleColor || '#6B7280', color: col.titleColor}}>
                            {col.icon && ICON_MAP[col.icon] && React.createElement(ICON_MAP[col.icon], { className: 'w-5 h-5'})}
                            <span>{col.title}</span>
                        </div>
                        <div className="p-2 space-y-3 overflow-y-auto">
                            {displayedOrders
                                .filter(order => col.statusIds.includes(order.status))
                                .sort((a,b) => a.orderTime.getTime() - b.orderTime.getTime())
                                .map(order => {
                                const status = getStatusById(order.status);
                                const validTransitions = boardConfig.statusTransitions[order.status] || [];
                                return (
                                <div key={order.id} draggable onDragStart={(e) => handleDragStart(e, order.id)} className="bg-white p-3 rounded-md shadow cursor-move">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-gray-800">{order.id}</p>
                                        <span className="text-xs text-gray-500">{order.orderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className="my-2 space-y-1">
                                        {order.items.map(item => (
                                            <div key={item.cartItemId} className="text-sm">
                                                <p className="text-gray-700">{item.quantity}x {item.name}</p>
                                                 {item.course && <p className="text-xs text-blue-600 capitalize pl-2 font-semibold">- {item.course} Plate</p>}
                                                {item.removedIngredients && item.removedIngredients.length > 0 && (
                                                    <p className="text-xs text-red-600 pl-2">- No: {item.removedIngredients.join(', ')}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                     <div className="flex justify-between items-center mt-2">
                                        <span style={{backgroundColor: status?.color || '#ccc'}} className="px-2 py-0.5 text-xs font-semibold text-white rounded-full">{status?.label}</span>
                                        <div className="flex space-x-1">
                                            {validTransitions.map(nextStatusId => {
                                                const nextStatus = getStatusById(nextStatusId)!;
                                                return (
                                                    <button 
                                                        key={nextStatusId} 
                                                        onClick={() => {
                                                            if (nextStatus.id === 'rejected') setRejectionModal({orderId: order.id, status: 'rejected'});
                                                            else onUpdateStatus(order.id, nextStatusId)
                                                        }}
                                                        style={{backgroundColor: nextStatus.color}} 
                                                        className="px-2 py-1 text-xs text-white rounded"
                                                    >
                                                        {nextStatus.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
            </div>
             {rejectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Select Rejection Reason</h3>
                        <div className="space-y-2">
                            {boardConfig.rejectionReasons.map(reason => (
                                <button key={reason.id} onClick={() => handleRejection(reason.message)} className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded text-gray-800">
                                    {reason.message}
                                </button>
                            ))}
                        </div>
                         <button onClick={() => setRejectionModal(null)} className="mt-4 w-full text-center p-2 bg-gray-300 rounded text-gray-800 font-semibold">Cancel</button>
                    </div>
                </div>
            )}
            {moveBackConfirmation && (
                <ConfirmationModal
                    title="Move Order Backwards"
                    message={`Are you sure you want to move order ${moveBackConfirmation.order.id} back to "${moveBackConfirmation.targetStatus.label}"?`}
                    onConfirm={() => {
                        onUpdateStatus(moveBackConfirmation.order.id, moveBackConfirmation.targetStatus.id);
                        setMoveBackConfirmation(null);
                    }}
                    onCancel={() => setMoveBackConfirmation(null)}
                    confirmText="CONFIRM"
                />
            )}
        </div>
    );
};

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
}> = (props) => {
    const { currentUser, restaurants, orders, users } = props;
    const [activeTab, setActiveTab] = useState('orders');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(
        currentUser.role === UserRole.RestaurantAdmin ? currentUser.restaurantId! : (restaurants[0]?.id || null)
    );
    const [editingAdmin, setEditingAdmin] = useState<Partial<User> | null>(null);
    const [editingRestaurant, setEditingRestaurant] = useState<Partial<Restaurant> | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{type: 'user' | 'restaurant', data: any} | null>(null);
    const [isRestaurantManagerOpen, setIsRestaurantManagerOpen] = useState(false);
    
    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    const restaurantUsers = users.filter(u => u.role === UserRole.RestaurantAdmin && u.restaurantId === selectedRestaurantId);
    
    const handleSaveAdmin = (user: Partial<User>) => {
        if (user.id) {
            props.onUpdateUser(user as User);
        } else {
            props.onCreateRestaurantAdmin(user.name!, user.username!, user.password!, selectedRestaurantId!);
        }
        setEditingAdmin(null);
    };

    const handleSaveRestaurant = (restaurant: Partial<Restaurant>) => {
        if (restaurant.id) {
            props.onUpdateRestaurant(restaurant as Restaurant);
        } else {
            const newRestaurantData: Omit<Restaurant, 'id'> = {
                vendorId: props.vendor.id,
                name: restaurant.name || 'New Restaurant',
                description: restaurant.description || '',
                bannerUrl: restaurant.bannerUrl || '',
                contact: restaurant.contact || { phone: '', email: '', address: '' },
                openingHours: restaurant.openingHours || defaultOpeningHours,
                paymentMethods: [],
                branding: { primaryColor: '#D97706', logoUrl: '' },
                media: [],
                ...restaurant
            };
            props.onCreateRestaurant(newRestaurantData);
        }
        setEditingRestaurant(null);
    };


    const handleDelete = () => {
        if (!deleteConfirmation) return;
        if (deleteConfirmation.type === 'user') {
            props.onDeleteUser(deleteConfirmation.data.id);
        } else if (deleteConfirmation.type === 'restaurant') {
            props.onDeleteRestaurant(deleteConfirmation.data.id);
        }
        setDeleteConfirmation(null);
    };
    
    const activeBoardTemplate = props.boardTemplates.find(t => t.id === selectedRestaurant?.boardTemplateId);

    const tabs = useMemo(() => [
        { id: 'orders', label: 'Orders', icon: ClipboardListIcon, visible: currentUser.permissions?.canManageOrders ?? true },
        { id: 'analytics', label: 'Analytics', icon: ChartIcon, visible: currentUser.permissions?.canViewAnalytics ?? true },
        { id: 'menu', label: 'Menu Library', icon: MenuBookIcon, visible: currentUser.permissions?.canManageMenu ?? true },
        { id: 'settings', label: 'Restaurant Config', icon: SettingsIcon, visible: currentUser.permissions?.canManageSettings ?? true },
        { id: 'users', label: 'Users & Permissions', icon: PeopleIcon, visible: currentUser.role === UserRole.Vendor },
    ].filter(tab => tab.visible), [currentUser.role, currentUser.permissions]);

    const renderContent = () => {
        if (!selectedRestaurant && activeTab !== 'menu') {
             return <div className="p-8 text-center text-gray-500">Please create or select a restaurant to manage.</div>;
        }
        
        switch (activeTab) {
            case 'orders':
                 if (!selectedRestaurant) return <p>Please select a restaurant to view orders.</p>
                return activeBoardTemplate ? <OrderManagement orders={orders.filter(o => o.restaurantId === selectedRestaurantId)} boardConfig={activeBoardTemplate.config} onUpdateStatus={props.onUpdateOrderStatus}/> : <p>No order board configured for this restaurant.</p>;
            case 'users':
                if (currentUser.role !== UserRole.Vendor) return <p>Access Denied.</p>
                if (!selectedRestaurant) return <p>Please select a restaurant to manage users.</p>
                return (
                    <div className="bg-white p-6 rounded-lg shadow">
                         <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h3 className="text-xl font-bold text-secondary">Restaurant Admins for {selectedRestaurant?.name}</h3>
                            <button onClick={() => setEditingAdmin({})} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">+ Add Admin</button>
                        </div>
                        <div className="space-y-3">
                            {restaurantUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.username}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => setEditingAdmin(user)} className="p-1 text-blue-500"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setDeleteConfirmation({type: 'user', data: user})} className="p-1 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'analytics':
                return selectedRestaurant ? <Analytics restaurant={selectedRestaurant} orders={orders} users={users} /> : null;
            case 'menu':
                 if (currentUser.role !== UserRole.Vendor) return <p>Access Denied.</p>;
                 return <MenuManager 
                    vendorId={currentUser.vendorId!} 
                    menuTemplates={props.menuTemplates}
                    menuItemTemplates={props.menuItemTemplates}
                    {...props}
                 />;
            case 'settings':
                return selectedRestaurant ? <SettingsManager
                    restaurant={selectedRestaurant}
                    boardTemplates={props.boardTemplates}
                    menuTemplates={props.menuTemplates}
                    vendorId={props.vendor.id}
                    onUpdateRestaurant={props.onUpdateRestaurant}
                    onCreateBoardTemplate={props.onCreateBoardTemplate}
                    onUpdateBoardTemplate={props.onUpdateBoardTemplate}
                    onDeleteBoardTemplate={props.onDeleteBoardTemplate}
                /> : <p>Please select a restaurant to configure its settings.</p>;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                         <div className="flex items-center space-x-4">
                            <h2 className="text-2xl font-bold text-secondary">Dashboard</h2>
                             {currentUser.role === UserRole.Vendor && (
                                <button onClick={() => setIsRestaurantManagerOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
                                    Manage Restaurants
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <label htmlFor="restaurant-select" className="text-sm font-medium text-gray-700">Managing:</label>
                            <select 
                                id="restaurant-select"
                                value={selectedRestaurantId || ''} 
                                onChange={e => setSelectedRestaurantId(e.target.value)}
                                className="p-2 border rounded-md bg-gray-100 text-gray-800"
                                disabled={currentUser.role === UserRole.RestaurantAdmin}
                            >
                                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <nav className="flex space-x-6 border-b">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                <tab.icon className="w-5 h-5"/>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent()}
            </main>
            {isRestaurantManagerOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-secondary">Restaurant Management</h3>
                            <button type="button" onClick={() => setIsRestaurantManagerOpen(false)} className="p-1 rounded-full hover:bg-gray-200">
                               <XCircleIcon className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors"/>
                            </button>
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto">
                            <RestaurantManager
                                restaurants={restaurants}
                                onAdd={() => {
                                    setIsRestaurantManagerOpen(false);
                                    setEditingRestaurant({});
                                }}
                                onEdit={(r) => {
                                    setIsRestaurantManagerOpen(false);
                                    setEditingRestaurant(r);
                                }}
                                onDelete={(r) => setDeleteConfirmation({ type: 'restaurant', data: r })}
                            />
                        </div>
                    </div>
                </div>
            )}
            {editingAdmin && selectedRestaurant && <RestaurantAdminModal user={editingAdmin} restaurant={selectedRestaurant} onSave={handleSaveAdmin} onClose={() => setEditingAdmin(null)} />}
            {editingRestaurant && <RestaurantModal restaurant={editingRestaurant} vendorId={props.vendor.id} onSave={handleSaveRestaurant} onClose={() => setEditingRestaurant(null)}/>}
            {deleteConfirmation && <ConfirmationModal title={`Delete ${deleteConfirmation.type}`} message={`Are you sure you want to delete "${deleteConfirmation.data.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteConfirmation(null)} confirmText="DELETE" />}
        </div>
    );
};

export default VendorDashboard;