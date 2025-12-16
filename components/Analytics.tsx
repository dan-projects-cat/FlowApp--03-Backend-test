import React, { useMemo, memo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Restaurant, Order, User } from '../types';
import { UserIcon } from './Shared';

// --- DATE HELPER FUNCTIONS ---
const getStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const getEndOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};
const getStartOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getStartOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

const getWeekOfYear = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
// --- END DATE HELPERS ---

type FilterType = 'day' | 'week' | 'month' | 'year';

const Analytics: React.FC<{restaurant: Restaurant, orders: Order[], users: User[]}> = memo(({ restaurant, orders, users }) => {
    const [filterType, setFilterType] = useState<FilterType>('day');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const restaurantManagers = useMemo(() => 
        users.filter(u => u.restaurantId === restaurant.id), 
    [users, restaurant.id]);

    const { 
        kpis, 
        itemSalesData, 
        salesOverTimeData,
        managerStats 
    } = useMemo(() => {
        const restaurantOrders = orders.filter(o => o.restaurantId === restaurant.id);
        
        const now = selectedDate;
        const startOfPeriod = 
            filterType === 'day' ? getStartOfDay(now) :
            filterType === 'week' ? getStartOfWeek(getStartOfDay(now)) :
            filterType === 'month' ? getStartOfMonth(now) :
            getStartOfYear(now);
        
        const endOfPeriod = new Date(startOfPeriod);
        if (filterType === 'day') endOfPeriod.setDate(endOfPeriod.getDate() + 1);
        else if (filterType === 'week') endOfPeriod.setDate(endOfPeriod.getDate() + 7);
        else if (filterType === 'month') endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
        else if (filterType === 'year') endOfPeriod.setFullYear(endOfPeriod.getFullYear() + 1);

        const filteredOrders = restaurantOrders.filter(o => o.orderTime >= startOfPeriod && o.orderTime < endOfPeriod);
        const completedOrders = filteredOrders.filter(o => o.status === 'completed');

        // KPIs
        const kpis = {
            received: filteredOrders.length,
            completed: completedOrders.length,
            rejected: filteredOrders.filter(o => o.status === 'rejected').length,
            income: completedOrders.reduce((sum, order) => sum + order.total, 0),
        };

        // Top selling items
        const itemSales = completedOrders.flatMap(o => o.items).reduce((acc, item) => {
            const existing = acc[item.id] || { name: item.name, sold: 0, revenue: 0};
            existing.sold += item.quantity;
            existing.revenue += item.quantity * item.price;
            acc[item.id] = existing;
            return acc;
        }, {} as Record<string, {name: string, sold: number, revenue: number}>);
        const itemSalesData = Object.values(itemSales).sort((a: { sold: number }, b: { sold: number }) => b.sold - a.sold).slice(0, 5);
        
        // Sales over time data
        let salesOverTimeData: { name: string; income: number }[] = [];
        if (filterType === 'day') {
            const hourly = completedOrders.reduce((acc, order) => {
                const hour = order.orderTime.getHours();
                const key = `${String(hour).padStart(2, '0')}:00`;
                acc[key] = (acc[key] || 0) + order.total;
                return acc;
            }, {} as Record<string, number>);
            salesOverTimeData = Array.from({ length: 24 }, (_, i) => {
                const key = `${String(i).padStart(2, '0')}:00`;
                return { name: key, income: hourly[key] || 0 };
            });
        } else if (filterType === 'week') {
            const daily = completedOrders.reduce((acc, order) => {
                const day = order.orderTime.toLocaleDateString('en-US', { weekday: 'short' });
                acc[day] = (acc[day] || 0) + order.total;
                return acc;
            }, {} as Record<string, number>);
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            salesOverTimeData = weekDays.map(day => ({ name: day, income: daily[day] || 0 }));
        } else if (filterType === 'month') {
             const weekly = completedOrders.reduce((acc, order) => {
                const week = `Week ${getWeekOfYear(order.orderTime)}`;
                acc[week] = (acc[week] || 0) + order.total;
                return acc;
            }, {} as Record<string, number>);
            salesOverTimeData = Object.keys(weekly).map(week => ({ name: week, income: weekly[week] })).sort();
        } else { // year
            const monthly = completedOrders.reduce((acc, order) => {
                const month = order.orderTime.toLocaleDateString('en-US', { month: 'short' });
                acc[month] = (acc[month] || 0) + order.total;
                return acc;
            }, {} as Record<string, number>);
            const yearMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            salesOverTimeData = yearMonths.map(month => ({ name: month, income: monthly[month] || 0 }));
        }

        // Manager stats
        const managerStats = filteredOrders.reduce((acc, order) => {
            if (order.processedByUserId) {
                const manager = acc[order.processedByUserId] || { completed: 0, rejected: 0 };
                if(order.status === 'completed') manager.completed++;
                if(order.status === 'rejected') manager.rejected++;
                acc[order.processedByUserId] = manager;
            }
            return acc;
        }, {} as Record<string, { completed: number, rejected: number }>);
        

        return { kpis, itemSalesData, salesOverTimeData, managerStats };
    }, [orders, restaurant.id, filterType, selectedDate]);

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    const pieTooltipFormatter = (value: number, name: string) => [`${value} units`, name];

    const FilterControls = () => (
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-white p-3 rounded-lg shadow">
            {(['day', 'week', 'month', 'year'] as FilterType[]).map(type => (
                <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${filterType === type ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
            ))}
            <input 
                type="date" 
                value={selectedDate.toISOString().split('T')[0]}
                onChange={e => setSelectedDate(new Date(e.target.value))}
                className="p-2 border rounded-md bg-gray-100 text-gray-700 text-sm"
            />
        </div>
    );

    return (
        <div className="space-y-8">
            <h3 className="text-2xl font-bold text-gray-800">Analytics for: <span className="text-primary">{restaurant.name}</span></h3>
            
            <FilterControls />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">Income</p><p className="text-3xl font-bold text-green-600">${kpis.income.toFixed(2)}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">Orders Received</p><p className="text-3xl font-bold text-blue-600">{kpis.received}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">Orders Completed</p><p className="text-3xl font-bold text-green-500">{kpis.completed}</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">Orders Rejected</p><p className="text-3xl font-bold text-red-500">{kpis.rejected}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow">
                    <h4 className="font-bold text-lg mb-4 text-secondary">Sales Over Time</h4>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesOverTimeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`}/>
                            <Legend />
                            <Bar dataKey="income" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                    <h4 className="font-bold text-lg mb-4 text-secondary">Top Selling Items</h4>
                    {itemSalesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={itemSalesData} dataKey="sold" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                    {itemSalesData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={pieTooltipFormatter}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-center text-gray-500 h-[300px] flex items-center justify-center">No sales data for this period.</p>}
                </div>
            </div>

             <div className="bg-white p-6 rounded-lg shadow">
                <h4 className="font-bold text-lg mb-4 text-secondary">Manager Performance</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders Completed</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders Rejected</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {restaurantManagers.map(user => {
                               const stats = managerStats[user.id] || { completed: 0, rejected: 0 };
                               return (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <UserIcon className="w-6 h-6 text-gray-400 mr-2"/>
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.completed}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stats.rejected}</td>
                                    </tr>
                               )
                           })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});

export default Analytics;