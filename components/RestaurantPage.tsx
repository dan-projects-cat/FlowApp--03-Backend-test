

import React, { useState, memo } from 'react';
import { Restaurant, MenuItemTemplate, CartItem, MediaContent, MediaType, Allergen, Intolerance, MenuTemplate } from '../types';
import { QRCodeWrapper, GlutenFreeIcon, VegetarianIcon, SpicyIcon, LactoseIcon, NutsIcon, XIcon } from './Shared';

interface RestaurantPageProps {
  restaurant: Restaurant;
  menuTemplates: MenuTemplate[];
  allItems: MenuItemTemplate[];
  onAddToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
  onBack: () => void;
}

const AllergenIcon: React.FC<{ allergen: Allergen }> = ({ allergen }) => {
    const iconMap: { [key: string]: React.ReactNode } = {
        'gf': <GlutenFreeIcon className="w-5 h-5 text-blue-500" title={allergen.name}/>,
        'v': <VegetarianIcon className="w-5 h-5 text-green-500" title={allergen.name}/>,
        's': <SpicyIcon className="w-5 h-5 text-red-500" title={allergen.name}/>,
    };
    return <span className="tooltip" title={allergen.name}>{iconMap[allergen.id]}</span>;
}

const IntoleranceIcon: React.FC<{ intolerance: Intolerance }> = ({ intolerance }) => {
    const iconMap: { [key: string]: React.ReactNode } = {
        'LactoseIcon': <LactoseIcon className="w-5 h-5 text-indigo-500" title={intolerance.name} />,
        'NutsIcon': <NutsIcon className="w-5 h-5 text-amber-700" title={intolerance.name} />,
    };
    return <span className="tooltip" title={intolerance.name}>{iconMap[intolerance.icon]}</span>;
};

const MediaCard: React.FC<{ item: MediaContent }> = memo(({ item }) => {
  const renderMedia = () => {
    switch (item.type) {
      case MediaType.Video:
        return <video controls src={item.source} className="w-full h-48 object-cover rounded-t-lg bg-black"></video>;
      case MediaType.Audio:
        return <div className="p-4"><audio controls src={item.source} className="w-full"></audio></div>;
      case MediaType.Text:
        return <p className="p-4 text-gray-700 h-full overflow-y-auto">{item.source}</p>;
      case MediaType.Link:
        return (
          <a href={item.source} target="_blank" rel="noopener noreferrer" className="block p-4 text-primary hover:underline">
            {item.description || 'Learn More'}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
      <div className="h-48 flex items-center justify-center">{renderMedia()}</div>
      <div className="p-4 flex-grow">
        <h3 className="font-bold text-lg text-secondary">{item.title}</h3>
        {item.type !== MediaType.Link && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
      </div>
    </div>
  );
});

const CustomizationModal: React.FC<{
    item: MenuItemTemplate;
    restaurantId: string;
    onAddToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
    onClose: () => void;
}> = ({ item, restaurantId, onAddToCart, onClose }) => {
    const [quantity, setQuantity] = useState(1);
    const [course, setCourse] = useState<'first' | 'second' | undefined>(undefined);
    const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(new Set());

    const handleIngredientToggle = (ingredient: string) => {
        setRemovedIngredients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ingredient)) {
                newSet.delete(ingredient);
            } else {
                newSet.add(ingredient);
            }
            return newSet;
        });
    };

    const handleSubmit = () => {
        onAddToCart({
            ...item,
            restaurantId,
            quantity,
            course,
            removedIngredients: Array.from(removedIngredients),
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold text-secondary">{item.name}</h3>
                    <button onClick={onClose} className="p-1 -mt-2 -mr-2"><XIcon className="w-6 h-6"/></button>
                </div>

                <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Quantity</h4>
                    <div className="flex items-center space-x-3">
                        <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-gray-200 text-gray-800 font-bold text-xl flex items-center justify-center hover:bg-gray-300 transition-colors">-</button>
                        <span className="text-xl font-bold text-gray-900 w-10 text-center">{quantity}</span>
                        <button type="button" onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-gray-200 text-gray-800 font-bold text-xl flex items-center justify-center hover:bg-gray-300 transition-colors">+</button>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Course (Optional)</h4>
                    <div className="flex space-x-2">
                        <button onClick={() => setCourse('first')} className={`px-4 py-2 rounded-lg border ${course === 'first' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700'}`}>First Plate</button>
                        <button onClick={() => setCourse('second')} className={`px-4 py-2 rounded-lg border ${course === 'second' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700'}`}>Second Plate</button>
                    </div>
                </div>

                {item.composition && item.composition.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Customize Ingredients</h4>
                        <div className="space-y-2">
                            {item.composition.map(ingredient => (
                                <label key={ingredient} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 cursor-pointer">
                                    <input type="checkbox" defaultChecked onChange={() => handleIngredientToggle(ingredient)} className="h-5 w-5 text-primary rounded focus:ring-primary" />
                                    <span className="text-black">{ingredient}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end items-center pt-4 border-t space-x-3">
                    <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-orange-600 transition-colors">Add to Cart</button>
                </div>
            </div>
        </div>
    );
};


const MenuItemCard: React.FC<{ item: MenuItemTemplate; onCustomize: (item: MenuItemTemplate) => void; restaurantId: string }> = memo(({ item, onCustomize, restaurantId }) => {
  const discountedPrice = item.discount ? item.price * (1 - item.discount.percentage / 100) : null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
      <img src={item.imageUrl} alt={item.name} className="w-full md:w-1/3 h-48 md:h-auto object-cover"/>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between">
            <h4 className="text-xl font-bold text-secondary">{item.name}</h4>
            <div className="flex items-center space-x-2">
                {item.allergens?.map(a => <AllergenIcon key={a.id} allergen={a} />)}
                {item.intolerances?.map(i => <IntoleranceIcon key={i.id} intolerance={i} />)}
            </div>
        </div>
        <p className="text-gray-600 mt-1">{item.description}</p>
        
        {item.composition && item.composition.length > 0 && (
            <div className="mt-2">
                <p className="text-sm font-semibold text-gray-700">Contains:</p>
                <p className="text-sm text-gray-500 italic">{item.composition.join(', ')}</p>
            </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onCustomize(item)}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                    Add to Cart
                </button>
            </div>
          <div className="text-right">
              {discountedPrice && item.discount?.showToConsumer ? (
                  <>
                      <span className="text-lg font-bold text-red-600">${discountedPrice.toFixed(2)}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">${item.price.toFixed(2)}</span>
                  </>
              ) : (
                  <span className="text-lg font-bold text-secondary">${item.price.toFixed(2)}</span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
});

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};

const formatOpeningHours = (hours: Restaurant['openingHours']): string[] => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const grouped: { [key: string]: string[] } = {};

    days.forEach(day => {
        const dayInfo = hours[day as keyof typeof hours];
        const time = dayInfo.isOpen ? `${formatTime(dayInfo.open)} - ${formatTime(dayInfo.close)}` : 'Closed';
        if (!grouped[time]) {
            grouped[time] = [];
        }
        grouped[time].push(day.charAt(0).toUpperCase() + day.slice(1, 3));
    });

    return Object.entries(grouped).map(([time, dayArr]) => {
        if (dayArr.length === 1) {
            return `${dayArr[0]}: ${time}`;
        }
        if (dayArr.length > 2 && (dayArr.indexOf('Sun') === -1 || dayArr.indexOf('Sat') === -1 )) {
             const first = dayArr[0];
             const last = dayArr[dayArr.length - 1];
             return `${first}-${last}: ${time}`;
        }
        return `${dayArr.join(', ')}: ${time}`;
    });
};


const RestaurantPage: React.FC<RestaurantPageProps> = ({ restaurant, menuTemplates, allItems, onAddToCart, onBack }) => {
  const restaurantUrl = `${window.location.href.split('#')[0]}#restaurant/${restaurant.id}`;
  const [customizingItem, setCustomizingItem] = useState<MenuItemTemplate | null>(null);
  const formattedHours = formatOpeningHours(restaurant.openingHours);
  
  return (
    <div>
      {/* Banner */}
      <div className="h-64 md:h-80 relative">
        <img src={restaurant.bannerUrl} alt={`${restaurant.name} banner`} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-white">
            <button onClick={onBack} className="text-sm mb-2 hover:underline">
              &larr; Back to all restaurants
            </button>
            <h2 className="text-4xl md:text-5xl font-extrabold">{restaurant.name}</h2>
            <p className="mt-2 max-w-2xl">{restaurant.description}</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Media Section */}
        {restaurant.media && restaurant.media.length > 0 && (
          <section className="mb-12">
            <h3 className="text-3xl font-extrabold text-secondary mb-6">What's New</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurant.media.map(item => <MediaCard key={item.id} item={item} />)}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2 space-y-10">
            {menuTemplates.map(template => (
                <div key={template.id}>
                    <h3 className="text-3xl font-extrabold text-secondary mb-6">{template.name}</h3>
                    <div className="space-y-8">
                        {template.sections.map(section => (
                            <div key={section.id}>
                                <h4 className="text-2xl font-bold text-gray-800 border-b-2 border-primary pb-2 mb-4">{section.title}</h4>
                                <div className="space-y-6">
                                    {section.itemIds.map(itemId => {
                                        const item = allItems.find(i => i.id === itemId);
                                        return item ? <MenuItemCard key={item.id} item={item} onCustomize={setCustomizingItem} restaurantId={restaurant.id} /> : null;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
          </div>
          {/* Details & QR Code */}
          <div className="lg:col-span-1">
             <div className="sticky top-24 bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold border-b pb-2 mb-4 text-secondary">Restaurant Info</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Address:</strong> {restaurant.contact.address}</p>
                    <p><strong>Phone:</strong> {restaurant.contact.phone}</p>
                    <p><strong>Email:</strong> {restaurant.contact.email}</p>
                    <div>
                        <p><strong>Hours:</strong></p>
                        <ul className="pl-4">
                            {formattedHours.map((line, index) => <li key={index}>{line}</li>)}
                        </ul>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <h4 className="font-semibold mb-2 text-secondary">Scan for Direct Access!</h4>
                    <div className="flex justify-center">
                      <QRCodeWrapper value={restaurantUrl} />
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
      {customizingItem && (
          <CustomizationModal 
            item={customizingItem}
            restaurantId={restaurant.id}
            onAddToCart={onAddToCart}
            onClose={() => setCustomizingItem(null)}
          />
      )}
    </div>
  );
};

export default RestaurantPage;