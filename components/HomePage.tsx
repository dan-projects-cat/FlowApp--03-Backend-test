import React, { memo } from 'react';
import { Restaurant, User, UserRole } from '../types';
import { QRCodeWrapper } from './Shared';

interface HomePageProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (id: string) => void;
  currentUser: User;
}

const RestaurantCard: React.FC<{ restaurant: Restaurant; onClick: () => void }> = memo(({ restaurant, onClick }) => (
  <div
    className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300"
    onClick={onClick}
  >
    <img src={restaurant.bannerUrl} alt={restaurant.name} className="w-full h-40 object-cover" />
    <div className="p-4">
      <h3 className="text-xl font-bold text-secondary">{restaurant.name}</h3>
      <p className="text-gray-600 mt-1 text-sm">{restaurant.description}</p>
    </div>
  </div>
));

const ConsumerHomePage: React.FC<{
    restaurants: Restaurant[];
    linkedRestaurantIds: string[];
    onSelectRestaurant: (id: string) => void;
}> = ({ restaurants, linkedRestaurantIds, onSelectRestaurant }) => {
    
    const linkedRestaurants = restaurants.filter(r => linkedRestaurantIds.includes(r.id));

    if (linkedRestaurants.length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <h2 className="text-4xl font-extrabold text-secondary mb-4">Welcome to FlowApp!</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    To get started, simply visit one of our partner restaurants and scan their unique QR code with your phone's camera. This will add them to your personal list right here!
                </p>
                <div className="mt-8">
                     <QRCodeWrapper value={window.location.href.split('#')[0]}/>
                     <p className="mt-2 text-sm text-gray-500">Scan QR codes at restaurants to begin.</p>
                </div>
            </div>
        )
    }

    return (
         <section>
            <h2 className="text-3xl font-extrabold text-secondary mb-6">Your Restaurants</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {linkedRestaurants.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => onSelectRestaurant(restaurant.id)} />
              ))}
            </div>
          </section>
    )
}


const HomePage: React.FC<HomePageProps> = ({ restaurants, onSelectRestaurant, currentUser }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {currentUser.role === UserRole.Consumer ? (
            <ConsumerHomePage
                restaurants={restaurants}
                linkedRestaurantIds={currentUser.linkedRestaurantIds || []}
                onSelectRestaurant={onSelectRestaurant}
            />
        ) : (
            <section>
                <h2 className="text-3xl font-extrabold text-secondary mb-6">All Restaurants</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {restaurants.map(restaurant => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => onSelectRestaurant(restaurant.id)} />
                ))}
                </div>
            </section>
        )}
    </div>
  );
};

export default HomePage;
