

import React, { useState, memo } from 'react';
import { CartItem, Restaurant, PaymentMethod } from '../types';
import { CreditCardIcon, PayPalIcon, CashIcon } from './Shared';

interface CheckoutPageProps {
  cart: CartItem[];
  restaurant: Restaurant | null;
  onPlaceOrder: () => void;
  onBack: () => void;
}

const PaymentOption: React.FC<{
    method: PaymentMethod;
    children: React.ReactNode;
    isSelected: boolean;
    onSelect: () => void;
}> = memo(({ method, children, isSelected, onSelect }) => {
    const ICONS: Record<PaymentMethod, React.ReactNode> = {
        [PaymentMethod.CreditCard]: <CreditCardIcon className="w-6 h-6 mr-3"/>,
        [PaymentMethod.Stripe]: <CreditCardIcon className="w-6 h-6 mr-3"/>,
        [PaymentMethod.PayPal]: <PayPalIcon className="w-6 h-6 mr-3 text-blue-800"/>,
        [PaymentMethod.Cash]: <CashIcon className="w-6 h-6 mr-3"/>,
        [PaymentMethod.Bizum]: <span className="font-bold text-lg mr-3">B</span>,
    }
    return (
         <div className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${!isSelected ? 'opacity-50' : 'opacity-100'}`}>
            <label className="flex items-center cursor-pointer">
                <input 
                    type="radio" 
                    name="paymentMethod" 
                    value={method} 
                    checked={isSelected}
                    onChange={onSelect}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                <span className="ml-3 flex items-center font-medium text-gray-800">
                    {ICONS[method]}
                    {method}
                </span>
            </label>
            {isSelected && children}
        </div>
    )
});

const CreditCardForm: React.FC<{isRequired: boolean}> = ({ isRequired }) => (
    <div className="mt-4 pl-8 space-y-4">
        <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name on Card</label>
            <input type="text" id="name" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required={isRequired} />
        </div>
        <div>
            <label htmlFor="card-number" className="block text-sm font-medium text-gray-700">Card Number</label>
            <input type="text" id="card-number" placeholder="•••• •••• •••• 4242" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required={isRequired} />
        </div>
        <div className="flex space-x-4">
            <div className="flex-1">
            <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
            <input type="text" id="expiry" placeholder="01/25" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required={isRequired} />
            </div>
            <div className="flex-1">
            <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
            <input type="text" id="cvc" placeholder="123" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" required={isRequired} />
            </div>
        </div>
    </div>
);


const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, restaurant, onPlaceOrder, onBack }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(restaurant?.paymentMethods[0] || null);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = subtotal * 0.08;
  const deliveryFee = 5.00;
  const total = subtotal + taxes + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceOrder();
  };
  
  if (!restaurant) {
      return <div>Loading restaurant details...</div>
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="text-sm text-primary mb-4 hover:underline">
        &larr; Back to Restaurant
      </button>
      <h2 className="text-3xl font-extrabold text-secondary mb-6">Checkout</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Payment Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold border-b pb-2 mb-4 text-gray-800">Payment Details</h3>
            <div className="space-y-4">
                {restaurant.paymentMethods.includes(PaymentMethod.CreditCard) && <PaymentOption method={PaymentMethod.CreditCard} isSelected={selectedMethod === PaymentMethod.CreditCard} onSelect={() => setSelectedMethod(PaymentMethod.CreditCard)}><CreditCardForm isRequired={selectedMethod === PaymentMethod.CreditCard}/></PaymentOption>}
                {restaurant.paymentMethods.includes(PaymentMethod.Stripe) && <PaymentOption method={PaymentMethod.Stripe} isSelected={selectedMethod === PaymentMethod.Stripe} onSelect={() => setSelectedMethod(PaymentMethod.Stripe)}><CreditCardForm isRequired={selectedMethod === PaymentMethod.Stripe}/></PaymentOption>}
                {restaurant.paymentMethods.includes(PaymentMethod.PayPal) && <PaymentOption method={PaymentMethod.PayPal} isSelected={selectedMethod === PaymentMethod.PayPal} onSelect={() => setSelectedMethod(PaymentMethod.PayPal)}><p className="text-sm text-gray-500 mt-2 pl-8">You will be redirected to PayPal to complete your payment.</p></PaymentOption>}
                {restaurant.paymentMethods.includes(PaymentMethod.Bizum) && <PaymentOption method={PaymentMethod.Bizum} isSelected={selectedMethod === PaymentMethod.Bizum} onSelect={() => setSelectedMethod(PaymentMethod.Bizum)}><p className="text-sm text-gray-500 mt-2 pl-8">Instructions will be provided after placing the order.</p></PaymentOption>}
                {restaurant.paymentMethods.includes(PaymentMethod.Cash) && <PaymentOption method={PaymentMethod.Cash} isSelected={selectedMethod === PaymentMethod.Cash} onSelect={() => setSelectedMethod(PaymentMethod.Cash)}><p className="text-sm text-gray-500 mt-2 pl-8">Please have exact change ready upon pickup.</p></PaymentOption>}
            </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h3 className="text-xl font-bold border-b pb-2 mb-4 text-gray-800">Your Order from {restaurant.name}</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.cartItemId}>
                <div className="flex justify-between">
                  <span className="text-gray-800">{item.quantity} x {item.name}</span>
                  <span className="text-gray-800">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                {item.course && <p className="text-xs text-blue-600 capitalize pl-2"> - Course: {item.course} Plate</p>}
                {item.removedIngredients && item.removedIngredients.length > 0 && (
                    <p className="text-xs text-red-600 pl-2"> - No: {item.removedIngredients.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxes & Fees</span>
              <span>${taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
           <button
              type="submit"
              className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              Place Order
            </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
