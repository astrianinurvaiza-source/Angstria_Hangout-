import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, X, SlidersHorizontal, MapPin, Coffee, Star, Heart } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { placesService } from '../services/dbService';
import { Place } from '../types';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFavorites } from '../context/FavoritesContext';

const PlaceList: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('');
  const [amenityFilter, setAmenityFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { isFavorite } = useFavorites();

  useEffect(() => {
    const tag = searchParams.get('tag');
    if (tag) setTagFilter(tag);
    
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);

    const favs = searchParams.get('favorites');
    if (favs === 'true') setShowFavoritesOnly(true);
  }, [searchParams]);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const data = await placesService.getAllPlaces();
        setPlaces(data);
        setFilteredPlaces(data);
      } catch (error) {
        console.error("Gagal memuat kafe:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  useEffect(() => {
    let result = places;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const nameMatch = p.name ? p.name.toLowerCase().includes(q) : false;
        const descMatch = p.description ? p.description.toLowerCase().includes(q) : false;
        const locMatch = p.location ? p.location.toLowerCase().includes(q) : false;
        const facilityMatch = p.facilities ? p.facilities.some(f => f.toLowerCase().includes(q)) : false;
        const tagMatch = p.tags ? p.tags.some(t => t.toLowerCase().includes(q)) : false;
        return nameMatch || descMatch || locMatch || facilityMatch || tagMatch;
      });
    }

    // Favorites filter
    if (showFavoritesOnly) {
      result = result.filter(p => isFavorite(p.id));
    }

    // Tag filter (from homepage categories)
    if (tagFilter) {
      result = result.filter(p => p.tags?.includes(tagFilter));
    }

    // Price range filter
    if (priceFilter) {
      result = result.filter(p => p.priceRange === priceFilter);
    }

    // Amenities filter
    if (amenityFilter.length > 0) {
      result = result.filter(p => 
        amenityFilter.every(amenity => p.facilities?.includes(amenity))
      );
    }

    setFilteredPlaces(result);
  }, [searchQuery, priceFilter, amenityFilter, tagFilter, showFavoritesOnly, places, isFavorite]);

  const toggleAmenity = (amenity: string) => {
    setAmenityFilter(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setPriceFilter('');
    setAmenityFilter([]);
    setSearchQuery('');
    setTagFilter(null);
    setShowFavoritesOnly(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-cafe-beige pt-12 pb-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-cafe-brown mb-4">
            Rekomendasi Terpilih
          </h1>
          <p className="text-cafe-mocha/70 max-w-2xl">
            Jelajahi daftar lengkap kafe pilihan terbaik kami di Pangkal Pinang. Gunakan filter untuk menemukan tempat nongkrong yang Anda impikan, baik itu sudut tenang untuk belajar maupun area luar yang sejuk.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40 group-focus-within:text-cafe-brown transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama, lokasi, fasilitas, atau suasana..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-cafe-cream border border-cafe-pastel rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cafe-brown/20 focus:border-cafe-brown transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border transition-all ${
              showFilters || amenityFilter.length > 0 || priceFilter 
                ? 'bg-cafe-brown text-cafe-cream border-cafe-brown' 
                : 'bg-cafe-cream text-cafe-brown border-cafe-pastel hover:border-cafe-brown'
            }`}
          >
            <SlidersHorizontal size={20} />
            <span>Filter</span>
            {(amenityFilter.length > 0 || priceFilter) && (
              <span className="w-5 h-5 bg-cafe-cream text-cafe-brown text-[10px] rounded-full flex items-center justify-center font-bold">
                {amenityFilter.length + (priceFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Extended Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-cafe-cream border border-cafe-pastel rounded-3xl p-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {/* Price Filter */}
                  <div>
                    <h4 className="font-bold text-cafe-brown mb-4 text-sm uppercase tracking-widest">Rentang Harga</h4>
                    <div className="flex gap-2">
                      {['$', '$$', '$$$'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPriceFilter(priceFilter === p ? '' : p)}
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold transition-all ${
                            priceFilter === p 
                              ? 'bg-cafe-brown text-cafe-cream border-cafe-brown' 
                              : 'bg-cafe-beige text-cafe-brown border-cafe-pastel hover:border-cafe-mocha'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities Filter */}
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-cafe-brown mb-4 text-sm uppercase tracking-widest">Fasilitas</h4>
                    <div className="flex flex-wrap gap-2">
                      {['WiFi', 'AC', 'Outdoor', 'Halal', 'Indoor', 'Live Music'].map((amenity) => (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                            amenityFilter.includes(amenity)
                              ? 'bg-cafe-brown text-cafe-cream border-cafe-brown' 
                              : 'bg-cafe-beige text-cafe-brown border-cafe-pastel hover:border-cafe-mocha'
                          }`}
                        >
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Favorites Filter */}
                  <div>
                    <h4 className="font-bold text-cafe-brown mb-4 text-sm uppercase tracking-widest">Preferensi Saya</h4>
                    <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`w-full py-4 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                        showFavoritesOnly 
                          ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200' 
                          : 'bg-cafe-beige text-cafe-brown border-cafe-pastel hover:border-red-300'
                      }`}
                    >
                      <Heart size={18} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                      {showFavoritesOnly ? 'Menampilkan Terfavorit' : 'Tampilkan Favorit Saja'}
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-cafe-pastel flex justify-end gap-4">
                  <button onClick={clearFilters} className="text-cafe-mocha text-sm underline px-4 py-2 decoration-cafe-pastel underline-offset-4 hover:text-cafe-brown">
                    Atur ulang semua filter
                  </button>
                  <button onClick={() => setShowFilters(false)} className="bg-cafe-brown text-cafe-cream px-6 py-2 rounded-xl text-sm font-bold">
                    Terapkan Filter
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <p className="text-sm text-cafe-mocha">
              Menampilkan <span className="font-bold text-cafe-brown">{filteredPlaces.length}</span> hasil
            </p>
            {tagFilter && (
              <span className="bg-cafe-brown text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-2">
                Kategori: {tagFilter}
                <button onClick={() => setTagFilter(null)} className="hover:text-red-300">
                  <X size={12} />
                </button>
              </span>
            )}
            {showFavoritesOnly && (
              <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-2">
                Hanya Favorit
                <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-red-200">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
          {(searchQuery || priceFilter || amenityFilter.length > 0 || tagFilter || showFavoritesOnly) && (
            <button onClick={clearFilters} className="text-xs flex items-center gap-1 text-red-500 font-bold uppercase tracking-wider">
              <X size={14} /> Bersihkan Pencarian
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlaces.map((place, idx) => (
              <PlaceCard key={place.id} place={place} index={idx} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-cafe-cream rounded-3xl border border-dashed border-cafe-pastel">
            <div className="w-20 h-20 bg-cafe-beige rounded-full flex items-center justify-center mx-auto mb-6 text-cafe-mocha/30">
              <Coffee size={40} />
            </div>
            <h3 className="text-xl font-serif font-bold text-cafe-brown mb-2">Kafe impian tidak ditemukan</h3>
            <p className="text-cafe-mocha/60">Coba sesuaikan filter pencarian atau kata kunci pencarian Anda.</p>
            <button onClick={clearFilters} className="mt-8 btn-primary">
              Bersihkan Semua Filter
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlaceList;
