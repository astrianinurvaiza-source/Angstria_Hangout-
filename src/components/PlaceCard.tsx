import React from 'react';
import { MapPin, Star, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Place } from '../types';
import { useFavorites } from '../context/FavoritesContext';

interface PlaceCardProps {
  place: Place;
  index?: number;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, index = 0 }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(place.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="cafe-card group relative"
    >
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(place.id);
        }}
        className={`absolute top-4 left-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          favorite 
            ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
            : 'bg-cafe-cream/80 backdrop-blur-sm text-cafe-mocha hover:text-red-500 hover:bg-cafe-cream'
        }`}
      >
        <Heart size={20} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'animate-pulse' : ''} />
      </button>

      <Link to={`/places/${place.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <img 
            src={place.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'} 
            alt={place.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {place.featured && (
            <div className="absolute top-12 left-4 bg-cafe-brown text-cafe-cream text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-lg border border-white/20">
              Pilihan Editor
            </div>
          )}
          <div className="absolute top-4 right-4 bg-cafe-cream/90 backdrop-blur-md text-cafe-brown flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            <Star size={12} className="fill-yellow-500 text-yellow-500" />
            {place.rating || 'N/A'}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2 gap-3">
            <h3 className="font-serif font-bold text-lg text-cafe-brown group-hover:text-sage transition-colors leading-tight line-clamp-1">
              {place.name}
            </h3>
            <span className="text-[9px] font-bold text-sage bg-soft-green/30 px-2.5 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
              {place.priceRange}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-cafe-mocha/60 text-xs mb-4">
            <MapPin size={12} className="flex-shrink-0 text-sage" />
            <span className="truncate">{place.location}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-cafe-pastel/50">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cafe-mocha/40">
              <Eye size={12} />
              {place.views || 0}
            </div>
            <div className="flex gap-1.5">
              {place.facilities?.slice(0, 3).map((f) => (
                <span key={f} className="text-[9px] font-bold uppercase tracking-tighter bg-cafe-beige text-cafe-mocha/60 px-2 py-1 rounded-full border border-cafe-pastel">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PlaceCard;
