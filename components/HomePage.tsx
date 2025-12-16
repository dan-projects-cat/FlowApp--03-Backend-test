
import React, { memo } from 'react';
import { Restaurant, User, UserRole, MediaType } from '../types';
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
    <div className="relative h-40">
        <img src={restaurant.bannerUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
             <h3 className="text-xl font-bold text-white shadow-sm">{restaurant.name}</h3>
        </div>
    </div>
    <div className="p-4">
      <p className="text-gray-600 text-sm line-clamp-2">{restaurant.description}</p>
      <p className="text-xs text-gray-400 mt-2">{restaurant.contact.address}</p>
    </div>
  </div>
));

const FeaturedMediaSection: React.FC<{ restaurants: Restaurant[] }> = ({ restaurants }) => {
    // Extract interesting media (Video only for the top section) from all restaurants
    const videos = restaurants.flatMap(r => 
        (r.media || []).filter(m => m.type === MediaType.Video).map(m => ({...m, restaurantName: r.name, restaurantId: r.id}))
    );

    if (videos.length === 0) return null;

    return (
        <section className="mb-10">
            <h2 className="text-2xl font-extrabold text-secondary mb-4 flex items-center">
                <span className="bg-red-600 w-2 h-8 mr-3 rounded-full"></span>
                Featured Videos & Updates
            </h2>
            <div className="flex space-x-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {videos.map((media, idx) => (
                    <div key={idx} className="flex-shrink-0 w-80 h-48 bg-black rounded-xl overflow-hidden shadow-md snap-center relative group border border-gray-200">
                        <video src={media.source} controls className="w-full h-full object-cover" poster="https://via.placeholder.com/320x190/000000/FFFFFF?text=Video+Preview" />
                        <div className="absolute top-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-br-lg">
                            {media.restaurantName}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pointer-events-none">
                            <p className="text-white font-bold text-sm truncate">{media.title}</p>
                            <p className="text-gray-300 text-xs truncate">{media.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

const ConsumerHomePage: React.FC<{
    restaurants: Restaurant[];
    linkedRestaurantIds: string[];
    onSelectRestaurant: (id: string) => void;
}> = ({ restaurants, linkedRestaurantIds, onSelectRestaurant }) => {
    
    const linkedRestaurants = restaurants.filter(r => linkedRestaurantIds.includes(r.id));
    const hasLinked = linkedRestaurants.length > 0;

    return (
         <section>
            <FeaturedMediaSection restaurants={restaurants} />
            
            {hasLinked ? (
                <>
                    <h2 className="text-3xl font-extrabold text-secondary mb-6">Your Restaurants</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                      {linkedRestaurants.map(restaurant => (
                        <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => onSelectRestaurant(restaurant.id)} />
                      ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-10 px-4 bg-white rounded-lg shadow-sm border border-gray-100 mb-12">
                    <h2 className="text-3xl font-extrabold text-secondary mb-4">Welcome to FlowApp!</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                        You haven't scanned any restaurant QR codes yet. 
                        To add a restaurant to your list, simply visit one and scan their code.
                    </p>
                    <div className="inline-block p-4 bg-white rounded-xl shadow-md">
                         <QRCodeWrapper value={window.location.href.split('#')[0]}/>
                         <p className="mt-2 text-xs text-gray-500 font-mono">Scan to start</p>
                    </div>
                </div>
            )}
            
            {/* Show all restaurants section for demo purposes so users aren't stuck */}
             <div className="mt-12 pt-12 border-t">
                <h2 className="text-2xl font-bold text-gray-400 mb-6 uppercase tracking-wider text-sm">Discover Nearby (Demo)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {restaurants.filter(r => !linkedRestaurantIds.includes(r.id)).map(restaurant => (
                         <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => onSelectRestaurant(restaurant.id)} />
                    ))}
                </div>
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
                <FeaturedMediaSection restaurants={restaurants} />
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
