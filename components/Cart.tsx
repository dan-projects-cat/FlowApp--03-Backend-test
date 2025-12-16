


import React, { memo } from 'react';
import { CartItem } from '../types';
import { XIcon } from './Shared';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (cartItemId: number) => void;
  onUpdateQuantity: (cartItemId: number, quantity: number) => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, cart, onRemoveItem, onUpdateQuantity, onCheckout }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-secondary">Your Order</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XIcon className="w-6 h-6 text-gray-600"/>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
              <div key={item.cartItemId} className="flex space-x-4">
                <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-md object-cover flex-shrink-0"/>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                  {item.course && <p className="text-xs text-blue-600 capitalize">Course: {item.course} Plate</p>}
                  {item.removedIngredients && item.removedIngredients.length > 0 && (
                      <p className="text-xs text-red-600">No: {item.removedIngredients.join(', ')}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                          onUpdateQuantity(item.cartItemId, val);
                      }
                    }}
                    className="w-16 p-1 border rounded-md text-center"
                  />
                  <button onClick={() => onRemoveItem(item.cartItemId)} className="text-red-500 hover:text-red-700">
                    <XIcon className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="p-4 border-t space-y-4 text-gray-800">
            <div className="flex justify-between font-bold text-lg">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Cart);