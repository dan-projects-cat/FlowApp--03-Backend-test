import React, { useEffect, useMemo, memo } from 'react';
import { Order } from '../types';
import { CheckCircleIcon, ChefHatIcon, ShoppingBagIcon, XCircleIcon } from './Shared';

interface OrderCardProps {
    order: Order;
    allOrders: Order[];
    onOrderFinished: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = memo(({ order, allOrders, onOrderFinished }) => {
    useEffect(() => {
        if (order.status === 'completed' || order.status === 'rejected') {
            const timer = setTimeout(() => {
                onOrderFinished(order.id);
            }, 8000); // Auto-dismiss after 8 seconds
            return () => clearTimeout(timer);
        }
    }, [order.status, order.id, onOrderFinished]);

    const { ordersAhead, estimatedWaitTime } = useMemo(() => {
        const activeStatuses = ['in-progress', 'accepted', 'pending'];
        const ordersAhead = allOrders.filter(o => 
            o.restaurantId === order.restaurantId &&
            activeStatuses.includes(o.status) &&
            new Date(o.orderTime) < new Date(order.orderTime)
        ).length;
        
        const AVG_PREP_TIME_MINUTES = 7; // Average prep time per order
        const estimatedWaitTime = (ordersAhead + 1) * AVG_PREP_TIME_MINUTES;

        return { ordersAhead, estimatedWaitTime };
    }, [allOrders, order]);

    const steps = [
        { status: 'accepted', title: 'Order Accepted', icon: <CheckCircleIcon className="w-6 h-6" /> },
        { status: 'in-progress', title: 'In Progress', icon: <ChefHatIcon className="w-6 h-6" /> },
        { status: 'ready-for-pickup', title: 'Ready for Pickup', icon: <ShoppingBagIcon className="w-6 h-6" /> },
    ];
    
    const statusMap = ['pending', ...steps.map(s => s.status)];
    const currentStepIndex = statusMap.indexOf(order.status);

    return (
        <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg text-center">
            {order.status === 'completed' ? (
                <div>
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-secondary mb-2">Order {order.id} Completed!</h2>
                    <p className="text-gray-600">Thank you for your order. Enjoy your meal!</p>
                    <p className="text-sm text-gray-400 mt-4">(This card will disappear automatically)</p>
                </div>
            ) : order.status === 'rejected' ? (
                <div>
                    <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-secondary mb-2">Order {order.id} Rejected</h2>
                    <p className="text-gray-600">We're sorry, the restaurant could not accept this order.</p>
                    <p className="text-sm text-gray-500 mt-1">Reason: {order.rejectionReason}</p>
                    <p className="text-sm text-gray-400 mt-4">(This card will disappear automatically)</p>
                </div>
            ) : (
                <>
                    <p className="text-lg text-gray-500">Tracking Order</p>
                    <p className="text-4xl sm:text-5xl font-mono text-primary bg-neutral p-4 rounded-md inline-block my-2">{order.id}</p>
                    
                    <div className="my-6 w-full max-w-md mx-auto text-left border-t border-b py-4">
                        <h3 className="font-bold text-lg text-secondary mb-3 text-center">Your Items</h3>
                        <div className="space-y-2">
                            {order.items.map((item, index) => (
                                <div key={`${item.id}-${index}`}>
                                    <div className="flex justify-between text-gray-700">
                                        <span>{item.quantity} x {item.name}</span>
                                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    {item.course && <p className="text-xs text-blue-600 capitalize pl-2"> - Course: {item.course} Plate</p>}
                                    {item.removedIngredients && item.removedIngredients.length > 0 && (
                                        <p className="text-xs text-red-600 pl-2"> - No: {item.removedIngredients.join(', ')}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${order.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Taxes & Fees</span>
                                <span>${order.taxes.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery</span>
                                <span>${order.deliveryFee.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t text-gray-800">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-6 rounded-lg">
                        <div className="text-center border-r">
                            <p className="text-4xl sm:text-5xl font-bold text-secondary">{ordersAhead}</p>
                            <p className="text-gray-600 font-semibold">Orders ahead</p>
                        </div>
                        <div className="text-center">
                            <p className="text-4xl sm:text-5xl font-bold text-secondary">~{estimatedWaitTime}</p>
                            <p className="text-gray-600 font-semibold">Est. Mins</p>
                        </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="mt-12">
                        <div className="flex justify-between items-center relative">
                            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200" style={{ transform: 'translateY(-50%)' }}></div>
                            <div className="absolute left-0 top-1/2 h-1 bg-primary" style={{ transform: 'translateY(-50%)', width: `${Math.max(0, ((currentStepIndex - 1) / (steps.length - 1)) * 100)}%`, transition: 'width 0.5s ease' }}></div>
                            
                            {steps.map((step, index) => {
                                const isActive = (index + 1) <= currentStepIndex;
                                return (
                                    <div key={step.status} className="z-10 text-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                                            {step.icon}
                                        </div>
                                        <p className={`mt-2 font-semibold text-sm sm:text-base ${isActive ? 'text-primary' : 'text-gray-500'}`}>{step.title}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});


interface ConsumerOrderPageProps {
  activeOrders: Order[];
  allOrders: Order[];
  onOrderFinished: (orderId: string) => void;
  onBackToRestaurant: () => void;
}

const ConsumerOrderPage: React.FC<ConsumerOrderPageProps> = ({ activeOrders, allOrders, onOrderFinished, onBackToRestaurant }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-extrabold text-secondary mb-8 text-center">My Active Orders</h2>
      
      {activeOrders.length === 0 ? (
          <p className="text-center text-gray-500">You have no active orders.</p>
      ) : (
          <div className="space-y-8">
            {activeOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                allOrders={allOrders} 
                onOrderFinished={onOrderFinished} 
              />
            ))}
          </div>
      )}
      
      <div className="mt-12 text-center">
        <button
          onClick={onBackToRestaurant}
          className="bg-primary text-white py-3 px-8 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg transform hover:scale-105"
        >
          &larr; Back to Restaurant
        </button>
      </div>
    </div>
  );
};

export default ConsumerOrderPage;