import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Maximize2, Share2, Heart, Coffee, Send, MessageCircle, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { placesService } from '../services/dbService';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Gallery: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Tautan foto berhasil disalin!');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeShareItem, setActiveShareItem] = useState<{name: string, url: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [likedItems, setLikedItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('angstria_liked_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const allPlaces = await placesService.getAllPlaces();
        // Urutkan berdasarkan tanggal dibuat terbaru (createdAt)
        const sorted = [...allPlaces].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateB !== dateA) return dateB - dateA;
          return b.id.localeCompare(a.id);
        });
        setPlaces(sorted);
      } catch (err) {
        console.error("Gagal mendapatkan data galeri kafe:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setLikedItems(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('angstria_liked_gallery', JSON.stringify(updated));
      return updated;
    });
  };

  const handleShareClick = (name: string, url: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveShareItem({ name, url });
    setIsShareModalOpen(true);
  };

  const copyToClipboard = () => {
    if (!activeShareItem) return;
    const shareUrl = activeShareItem.url;
    try {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          setToastMessage('Tautan foto berhasil disalin! 📸');
          setShowShareToast(true);
          setTimeout(() => {
            setCopied(false);
            setShowShareToast(false);
          }, 3000);
        })
        .catch(() => {
          const textarea = document.createElement('textarea');
          textarea.value = shareUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopied(true);
          setToastMessage('Tautan foto berhasil disalin! 📸');
          setShowShareToast(true);
          setTimeout(() => {
            setCopied(false);
            setShowShareToast(false);
          }, 3000);
        });
    } catch (err) {
      console.warn("Clipboard API failed inside sandboxed environment", err);
    }
  };

  const handleWhatsAppShare = () => {
    if (!activeShareItem) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Lihat foto estetik "${activeShareItem.name}" ini di Angstria Hangout! 📸✨\n${activeShareItem.url}`)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    if (!activeShareItem) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(activeShareItem.url)}&text=${encodeURIComponent(`Lihat foto estetik "${activeShareItem.name}" ini di Angstria Hangout! 📸✨`)}`;
    window.open(url, '_blank');
  };

  const handleTwitterShare = () => {
    if (!activeShareItem) return;
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(activeShareItem.url)}&text=${encodeURIComponent(`Foto estetik cafe "${activeShareItem.name}" di Angstria Hangout! 📸✨`)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    if (!activeShareItem) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(activeShareItem.url)}`;
    window.open(url, '_blank');
  };

  // Construct dynamic gallery items from places
  const galleryItems = places.flatMap((place) => {
    const imagesList = place.images && place.images.length > 0 
      ? place.images 
      : (place.image ? [place.image] : []);
    
    // Filter duplicates and invalid items
    const uniqueImages = Array.from(new Set(imagesList)).filter(Boolean);

    return uniqueImages.map((url, idx) => ({
      id: `${place.id}-${idx}`,
      placeId: place.id,
      url,
      name: place.name,
      rating: place.rating
    }));
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-cafe-beige min-h-screen pt-12 pb-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-cafe-brown/10 text-cafe-brown px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Camera size={16} /> Inspirasi Visual
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-cafe-brown mb-4">Arsip Estetik</h1>
          <p className="text-cafe-mocha/70 max-w-2xl mx-auto">
            Sekilas pandang ke sudut-sudut tercantik dari lokasi nongkrong pilihan kami.
            Difoto, diabadikan, dan dibagikan langsung oleh komunitas kreatif kami.
          </p>
        </div>

        {/* Card Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : galleryItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-cafe-pastel p-8 max-w-md mx-auto">
            <Coffee size={40} className="mx-auto text-cafe-mocha/40 mb-4" />
            <p className="text-cafe-brown font-medium">Belum ada foto galeri tersedia.</p>
            <p className="text-sm text-cafe-mocha/70 mt-1">Tambahkan beberapa kafe dengan foto terlebih dahulu di dashboard admin!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {galleryItems.map((item) => {
              const isLiked = likedItems.includes(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[2rem] overflow-hidden group border border-cafe-pastel flex flex-col shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div 
                    onClick={() => setSelectedImage(item.url)}
                    className="relative h-72 overflow-hidden cursor-zoom-in"
                  >
                    <img 
                      src={item.url} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-sm text-cafe-brown px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Heart size={12} className="text-red-500 fill-red-500" /> {item.rating}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 transform scale-75 group-hover:scale-100 transition-transform">
                        <Maximize2 size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-serif font-bold text-cafe-brown group-hover:text-cafe-mocha transition-colors">{item.name}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => toggleLike(item.id, e)}
                          className={`transition-colors ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-cafe-mocha/40 hover:text-red-400'}`}
                          title={isLiked ? "Batal Suka" : "Suka Foto"}
                        >
                          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={(e) => handleShareClick(item.name, item.url, e)}
                          className="text-cafe-mocha/40 hover:text-cafe-brown transition-colors"
                          title="Bagikan Foto"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                    <Link to={`/places/${item.placeId}`} className="flex items-center justify-between group/link border-t border-cafe-beige pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cafe-mocha/50">Lihat Detail</span>
                      <div className="w-8 h-8 rounded-full bg-cafe-beige text-cafe-brown flex items-center justify-center group-hover/link:bg-cafe-brown group-hover/link:text-white transition-colors">
                        <Coffee size={14} />
                      </div>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State / More Button */}
        <div className="mt-20 text-center">
          <div className="w-16 h-16 bg-cafe-cream rounded-full flex items-center justify-center mx-auto mb-6 text-cafe-pastel shadow-inner">
            <Coffee size={32} />
          </div>
          <p className="text-cafe-mocha/60 italic mb-8">Lebih banyak foto estetik sedang disiapkan setiap hari...</p>
          <Link to="/places" className="btn-primary">Temukan Tempat Favorit Anda</Link>
        </div>
      </div>

      {/* Modal / Lightbox */}
      <AnimatePresence>
        {selectedImage && (() => {
          const item = galleryItems.find(it => it.url === selectedImage) || { id: 'fallback', name: 'Foto Estetik', url: selectedImage, rating: 5, placeId: '' };
          const isLiked = likedItems.includes(item.id);
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-cafe-brown/95 flex items-center justify-center p-6 md:p-12"
              onClick={() => setSelectedImage(null)}
            >
              <button 
                className="absolute top-6 right-6 text-cafe-cream p-3 hover:bg-white/10 rounded-full transition-colors"
                onClick={() => setSelectedImage(null)}
                title="Tutup"
              >
                <X size={32} />
              </button>

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative max-w-5xl w-full max-h-full flex items-center justify-center rounded-3xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={selectedImage} 
                  alt={item.name} 
                  className="max-w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl z-20">
                  <button 
                    onClick={(e) => toggleLike(item.id, e)}
                    className={`flex items-center gap-2 transition-colors ${
                      isLiked ? 'text-red-500 font-bold' : 'text-white hover:text-red-400'
                    }`}
                  >
                    <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} /> 
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {isLiked ? 'Disukai' : 'Sangat Estetik'}
                    </span>
                  </button>
                  <div className="w-px h-6 bg-white/20"></div>
                  <button 
                    onClick={(e) => handleShareClick(item.name, item.url, e)}
                    className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
                  >
                    <Share2 size={20} /> 
                    <span className="text-xs font-bold uppercase tracking-widest">Bagikan Vibe</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Share Modal & Toast for Gallery */}
      <AnimatePresence>
        {isShareModalOpen && activeShareItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsShareModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 relative z-10 border border-cafe-pastel shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-6 right-6 text-cafe-mocha/60 hover:text-cafe-brown p-2 hover:bg-cafe-beige rounded-full transition-colors"
                title="Tutup"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-cafe-beige text-cafe-brown rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share2 size={24} />
                </div>
                <h4 className="font-serif font-bold text-lg text-cafe-brown">Bagikan Foto</h4>
                <p className="text-xs text-cafe-mocha/70 mt-1">Bagikan keindahan "{activeShareItem.name}" kepada teman Anda!</p>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100/80 text-green-700 font-bold text-sm rounded-2xl transition-all border border-green-100"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  Bagikan ke WhatsApp
                </button>

                <button
                  onClick={handleTelegramShare}
                  className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-sm rounded-2xl transition-all border border-blue-100"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
                  </div>
                  Bagikan ke Telegram
                </button>

                <button
                  onClick={handleTwitterShare}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-sm rounded-2xl transition-all border border-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  Bagikan ke Twitter / X
                </button>

                <button
                  onClick={handleFacebookShare}
                  className="w-full flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-sm rounded-2xl transition-all border border-indigo-100"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-base">
                    f
                  </div>
                  Bagikan ke Facebook
                </button>
              </div>

              <div className="pt-4 border-t border-cafe-pastel flex items-center gap-2">
                <div className="bg-cafe-beige px-3 py-2.5 rounded-xl border border-cafe-pastel text-[10px] text-cafe-mocha truncate flex-1 font-mono select-all">
                  {activeShareItem.url}
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`flex-shrink-0 p-3 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                    copied 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-cafe-brown text-white hover:bg-cafe-mocha'
                  }`}
                  title="Salin Link Gambar"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showShareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[250] bg-cafe-brown text-cafe-cream px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl border border-cafe-mocha"
          >
            <Check size={18} className="text-green-400" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Gallery;
