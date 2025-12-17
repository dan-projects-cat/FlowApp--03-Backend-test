
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
        <section className="mb-12">
            <h2 className="text-3xl font-extrabold text-secondary mb-6 flex items-center">
                <span className="bg-gradient-to-r from-primary to-red-500 w-2 h-10 mr-4 rounded-full"></span>
                Top Stories & Reels
            </h2>
            <div className="flex space-x-6 overflow-x-auto pb-6 snap-x hide-scrollbar px-2">
                {videos.map((media, idx) => (
                    <div key={idx} className="flex-shrink-0 w-64 h-96 rounded-2xl overflow-hidden shadow-xl snap-center relative group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-white cursor-pointer">
                        <video 
                            src={media.source} 
                            controls={false}
                            autoPlay={false} // Autoplay disabled by default for UX, can be enabled if muted
                            muted
                            loop
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                            poster="https://via.placeholder.com/256x384/000000/FFFFFF?text=Loading..." 
                            onMouseOver={event => (event.target as HTMLVideoElement).play()}
                            onMouseOut={event => (event.target as HTMLVideoElement).pause()}
                        />
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                             <div className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold border border-white/20">
                                {media.restaurantName}
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5">
                            <h3 className="text-white font-bold text-lg mb-1 leading-tight shadow-sm">{media.title}</h3>
                            <p className="text-gray-200 text-xs line-clamp-2 opacity-90">{media.description}</p>
                        </div>
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                             <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                 <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                             </div>
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
