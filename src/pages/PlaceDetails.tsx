import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Star, Clock, Eye, Share2, 
  ChevronLeft, Coffee, Wifi, Wind, 
  Music, User, Send, Smartphone, MessageCircle,
  Camera, Sparkles, Heart, Instagram, Globe, Video,
  Copy, Check, Calendar, X,
} from 'lucide-react';
import { placesService, commentsService, reservationsService } from '../services/dbService';
import { Place, Comment } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFavorites } from '../context/FavoritesContext';

const PlaceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [place, setPlace] = useState<Place | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommendations, setRecommendations] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentForm, setCommentForm] = useState({ username: '', comment: '', rating: 5 });
  const [showShareToast, setShowShareToast] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reservation states
  const [reservationForm, setReservationForm] = useState({
    customerName: '',
    customerPhone: '',
    bookingDate: '',
    bookingTime: '',
    guests: 2,
    notes: ''
  });
  const [submittingReservation, setSubmittingReservation] = useState(false);
  const [reservationSuccessMessage, setReservationSuccessMessage] = useState('');
  const [reservationErrorMessage, setReservationErrorMessage] = useState('');

  const favorite = id ? isFavorite(id) : false;

  useEffect(() => {
    const savedUserSession = localStorage.getItem('angstria_user_session');
    if (savedUserSession) {
      try {
        const u = JSON.parse(savedUserSession);
        if (u && u.name) {
          setReservationForm(prev => ({
            ...prev,
            customerName: u.name
          }));
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReservation(true);
    setReservationSuccessMessage('');
    setReservationErrorMessage('');

    let customerEmail: string | undefined;
    const savedUserSession = localStorage.getItem('angstria_user_session');
    if (savedUserSession) {
      try {
        const u = JSON.parse(savedUserSession);
        if (u && u.email) {
          customerEmail = u.email;
        }
      } catch (err) {
        // ignore
      }
    }

    try {
      await reservationsService.createReservation({
        placeId: id,
        customerName: reservationForm.customerName,
        customerEmail,
        customerPhone: reservationForm.customerPhone,
        bookingDate: reservationForm.bookingDate,
        bookingTime: reservationForm.bookingTime,
        guests: Number(reservationForm.guests),
        notes: reservationForm.notes
      });
      setReservationSuccessMessage('Reservasi meja berhasil diajukan! Menunggu konfirmasi pemilik kafe.');
      setReservationForm({
        customerName: savedUserSession ? JSON.parse(savedUserSession).name || '' : '',
        customerPhone: '',
        bookingDate: '',
        bookingTime: '',
        guests: 2,
        notes: ''
      });
    } catch (err: any) {
      setReservationErrorMessage(err.message || 'Gagal mengirimkan reservasi.');
    } finally {
      setSubmittingReservation(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      if (!place) {
        setLoading(true);
      }
      window.scrollTo(0, 0);
      try {
        const [placeData, commentsData, allPlaces] = await Promise.all([
          placesService.getPlaceById(id),
          commentsService.getCommentsByPlaceId(id),
          placesService.getAllPlaces().catch(() => [])
        ]);
        
        if (placeData) {
          setPlace(placeData);
          setComments(commentsData);
          setRecommendations(allPlaces.filter(p => p.id !== id).slice(0, 3));
          // Increment views
          placesService.incrementViews(id);
        } else {
          navigate('/places');
        }
      } catch (error) {
        console.error("Gagal mengambil detail kafe:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentForm.username || !commentForm.comment) return;
    
    setSubmittingComment(true);
    await commentsService.addComment(id, commentForm.username, commentForm.comment, commentForm.rating);
    
    // Refresh comments and place rating
    const [updatedComments, updatedPlace] = await Promise.all([
      commentsService.getCommentsByPlaceId(id),
      placesService.getPlaceById(id)
    ]);
    setComments(updatedComments);
    setPlace(updatedPlace);
    
    setCommentForm({ username: '', comment: '', rating: 5 });
    setSubmittingComment(false);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const copyToClipboard = () => {
    const shareUrl = window.location.href;
    try {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          setShowShareToast(true);
          setTimeout(() => {
            setCopied(false);
            setShowShareToast(false);
          }, 3000);
        })
        .catch(() => {
          // Native copy failed (some browser sandbox limitations), use legacy command or simple prompt
          const textarea = document.createElement('textarea');
          textarea.value = shareUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopied(true);
          setShowShareToast(true);
          setTimeout(() => {
            setCopied(false);
            setShowShareToast(false);
          }, 3000);
        });
    } catch (err) {
      console.warn("Clipboard API not fully supported inside sandboxed environments", err);
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`Temukan tempat nongkrong estetik ini: *${place?.name}* di Pangkal Pinang! ☕✨\n${window.location.href}`)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Temukan tempat nongkrong estetik ini: ${place?.name} di Pangkal Pinang! ☕✨`)}`;
    window.open(url, '_blank');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Rekomendasi cafe estetik di Pangkal Pinang: ${place?.name}! ☕✨`)}`;
    window.open(url, '_blank');
  };

  if (loading && !place) return <LoadingSpinner fullScreen />;
  if (!place) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      {/* Header Overlay */}
      <div className="relative h-[60vh] md:h-[70vh] group">
        <img 
          src={place.image} 
          alt={place.name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cafe-beige via-black/10 to-black/30"></div>
        
        <div className="absolute top-6 left-6 flex gap-3">
          <Link to="/places" className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all border border-white/20">
            <ChevronLeft size={24} />
          </Link>
        </div>

        <div className="absolute top-6 right-6 flex gap-2">
          <button 
            onClick={() => id && toggleFavorite(id)}
            className={`p-3 backdrop-blur-md rounded-full transition-all border border-white/20 ${
              favorite ? 'bg-red-500 text-white border-red-400' : 'bg-white/20 text-white hover:bg-white/40'
            }`}
            title="Suka / Favorit"
          >
            <Heart size={24} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleShare} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all border border-white/20" title="Bagikan">
            <Share2 size={24} />
          </button>
          <a 
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Temukan tempat nongkrong estetik ini: *${place?.name}* di Pangkal Pinang! ☕✨\n${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-green-500/80 backdrop-blur-md rounded-full text-white hover:bg-green-600 transition-all border border-white/20 flex items-center justify-center"
            title="Bagikan ke WhatsApp"
          >
            <MessageCircle size={24} />
          </a>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="text-cafe-brown">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-cafe-brown text-cafe-cream px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {place.priceRange}
                </span>
                <span className="flex items-center gap-1 bg-cafe-cream/80 backdrop-blur shadow-sm px-3 py-1 rounded-full text-xs font-bold text-cafe-brown">
                  <Star size={14} className="fill-yellow-500 text-yellow-500" />
                  {place.rating || 'N/A'}
                </span>
                {place.socials && (
                  <div className="flex gap-2">
                    {place.socials.instagram && (
                      <a href={place.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-cafe-cream/80 backdrop-blur rounded-full text-cafe-mocha hover:text-cafe-brown transition-colors shadow-sm">
                        <Instagram size={14} />
                      </a>
                    )}
                    {place.socials.website && (
                      <a href={place.socials.website} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-cafe-cream/80 backdrop-blur rounded-full text-cafe-mocha hover:text-cafe-brown transition-colors shadow-sm">
                        <Globe size={14} />
                      </a>
                    )}
                    {place.socials.tiktok && (
                      <a href={place.socials.tiktok} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-cafe-cream/80 backdrop-blur rounded-full text-cafe-mocha hover:text-cafe-brown transition-colors shadow-sm">
                        <Video size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-sm text-cafe-brown">
                {place.name}
              </h1>
              <div className="flex items-center gap-2 text-cafe-mocha font-medium">
                <MapPin size={18} />
                {place.location}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Photo Gallery */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-cafe-brown mb-8 flex items-center gap-3">
                <Camera /> Galeri Foto
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(place.images && place.images.length > 0 ? place.images : [
                  place.image,
                  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
                  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
                  "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=800",
                  "https://images.unsplash.com/photo-1507133750040-4c8b5bad92dd?auto=format&fit=crop&q=80&w=800"
                ]).map((img, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className={`rounded-2xl overflow-hidden shadow-md h-48 ${i === 0 ? 'md:col-span-2 md:h-[400px]' : ''}`}
                  >
                    <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Description */}
            <section className="bg-cafe-cream rounded-3xl p-8 md:p-12 shadow-sm border border-cafe-pastel">
              <h2 className="text-2xl font-serif font-bold text-cafe-brown mb-6 flex items-center gap-3">
                <Coffee /> Tentang Tempat ini
              </h2>
              <div className="text-cafe-mocha leading-loose whitespace-pre-wrap">
                {place.description}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-cafe-pastel">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-cafe-mocha/50 mb-2">Jam Operasional</h4>
                  <p className="font-medium text-cafe-brown flex items-center gap-2">
                    <Clock size={16} /> {place.openingHours}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-cafe-mocha/50 mb-2">Total Kunjungan</h4>
                  <p className="font-medium text-cafe-brown flex items-center gap-2">
                    <Eye size={16} /> {place.views}
                  </p>
                </div>
              </div>
            </section>

            {/* Amenities */}
            <section>
              <h2 className="text-2xl font-serif font-bold text-cafe-brown mb-8">Fasilitas & Fitur</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {place.facilities?.map((f) => (
                  <div key={f} className="bg-cafe-cream border border-cafe-pastel p-6 rounded-2xl flex flex-col items-center gap-3 text-center group hover:border-cafe-brown transition-all">
                    <div className="w-12 h-12 bg-cafe-beige rounded-xl flex items-center justify-center text-cafe-brown group-hover:bg-cafe-brown group-hover:text-cafe-cream transition-colors">
                      {f.toLowerCase().includes('wifi') ? <Wifi size={24} /> : 
                       f.toLowerCase().includes('ac') ? <Wind size={24} /> :
                       f.toLowerCase().includes('music') ? <Music size={24} /> :
                       <Coffee size={24} />}
                    </div>
                    <span className="font-medium text-sm text-cafe-mocha">{f}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Location / Map */}
            <section className="space-y-4">
              <h2 className="text-2xl font-serif font-bold text-cafe-brown mb-6 flex items-center gap-3">
                <MapPin /> Temukan Kami Di Sini
              </h2>
              <div className="rounded-3xl overflow-hidden border border-cafe-pastel shadow-lg h-[400px] relative">
                <iframe
                  title={`Peta Lokasi ${place.name}`}
                  src={
                    place.lat !== null && place.lat !== undefined && !isNaN(place.lat) && 
                    place.lng !== null && place.lng !== undefined && !isNaN(place.lng) && 
                    (place.lat !== 0 || place.lng !== 0)
                      ? `https://maps.google.com/maps?q=${place.lat},${place.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(place.name + ', ' + place.location)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                ></iframe>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-cafe-cream rounded-2xl border border-cafe-pastel mt-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-cafe-brown">{place.name}</h4>
                  <p className="text-xs text-cafe-mocha">{place.location}</p>
                </div>
                <a
                  href={
                    place.lat !== null && place.lat !== undefined && !isNaN(place.lat) && 
                    place.lng !== null && place.lng !== undefined && !isNaN(place.lng) && 
                    (place.lat !== 0 || place.lng !== 0)
                      ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.location)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <MapPin size={18} />
                  Buka di Google Maps
                </a>
              </div>
            </section>

            {/* Comments Section */}
            <section className="bg-cafe-cream rounded-3xl p-8 md:p-12 border border-cafe-pastel">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <h2 className="text-2xl font-serif font-bold text-cafe-brown">
                  Cerita Pelanggan ({comments.length})
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-serif font-bold text-cafe-brown">{place.rating || '0.0'}</span>
                    <span className="text-[10px] uppercase font-bold text-cafe-mocha/50">Rating Rata-rata</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={16} 
                        className={s <= Math.round(place.rating) ? "fill-cafe-brown text-cafe-brown" : "text-cafe-pastel"} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="bg-cafe-beige border border-cafe-pastel rounded-3xl p-8 shadow-sm mb-12">
                <h3 className="font-bold text-cafe-brown mb-6 flex items-center gap-2">
                  <MessageCircle size={20} /> Bagikan pengalaman Anda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Nama Anda</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={16} />
                      <input 
                        type="text" 
                        required
                        value={commentForm.username}
                        onChange={(e) => setCommentForm({ ...commentForm, username: e.target.value })}
                        className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-cafe-brown"
                        placeholder="Contoh: Astriani"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Rating (1-5)</label>
                    <div className="flex items-center gap-4 py-3">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setCommentForm({ ...commentForm, rating: s })}
                            className="transition-transform active:scale-90"
                          >
                            <Star 
                              size={24} 
                              className={s <= commentForm.rating ? "fill-cafe-brown text-cafe-brown" : "text-cafe-pastel hover:text-cafe-mocha"} 
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xl font-bold font-serif text-cafe-brown">{commentForm.rating}.0</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Ulasan Anda</label>
                  <textarea 
                    required
                    rows={4}
                    value={commentForm.comment}
                    onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                    className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl p-4 focus:outline-none focus:border-cafe-brown"
                    placeholder="Ceritakan apa yang paling Anda sukai dari tempat ini..."
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={submittingComment}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingComment ? 'Mengirim...' : <><Send size={18} /> Kirim Ulasan</>}
                </button>
              </form>

              {/* List of Comments */}
              <div className="space-y-8">
                {comments.length > 0 ? (
                  comments.map((comment, idx) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border-b border-cafe-pastel pb-8 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cafe-brown rounded-full flex items-center justify-center text-cafe-cream font-bold">
                            {comment.username[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-cafe-brown">{comment.username}</h4>
                            <span className="text-[10px] text-cafe-mocha opacity-60">
                              Hari Ini
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={12} 
                              className={s <= comment.rating ? "fill-cafe-mocha text-cafe-mocha" : "text-cafe-pastel"} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-cafe-mocha leading-relaxed pl-13">
                        {comment.comment}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-cafe-mocha opacity-40">
                    Belum ada ulasan berjalan. Jadilah yang pertama memberikan ulasan hangat!
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-cafe-brown rounded-3xl p-8 text-cafe-cream shadow-xl">
              <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-yellow-400" /> Cek Vibe
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="mt-1"><Smartphone size={20} className="text-cafe-pastel" /></div>
                  <div>
                    <h5 className="font-bold text-sm">Sangat Instagrammable</h5>
                    <p className="text-xs text-cafe-pastel/70 mt-1">Pencahayaan yang sangat baik serta dekorasi estetik yang dikurasi dengan indah.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="mt-1"><Clock size={20} className="text-cafe-pastel" /></div>
                  <div>
                    <h5 className="font-bold text-sm">Waktu Terbaik</h5>
                    <p className="text-xs text-cafe-pastel/70 mt-1">Kunjungi menjelang matahari terbenam untuk mendapatkan atmosfer yang paling estetik.</p>
                  </div>
                </li>
              </ul>
              
              <button 
                onClick={handleShare}
                className="w-full mt-12 bg-white text-cafe-brown py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-cafe-pastel transition-all"
              >
                <Share2 size={18} /> Bagikan ke Teman
              </button>
            </div>

            {/* Reservasi Meja Online */}
            <div className="bg-cafe-cream border border-cafe-pastel rounded-3xl p-8 shadow-sm">
              <h3 className="font-serif font-bold text-lg text-cafe-brown mb-2 flex items-center gap-2">
                <Coffee size={20} /> Reservasi Meja
              </h3>
              <p className="text-xs text-cafe-mocha/70 mb-6">Untuk meningkatkan keamanan & kemudahan Anda, kini pengajuan reservasi dipusatkan sepenuhnya secara aman melalui portal akun pelanggan.</p>
              
              <Link
                to={`/dashboard?bookingPlaceId=${place.id}`}
                className="w-full bg-cafe-brown hover:bg-cafe-mocha text-white text-xs font-bold py-3.5 rounded-xl transition-colors shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar size={14} /> Ajukan Reservasi Online
              </Link>
            </div>

            <div className="bg-cafe-beige border border-cafe-pastel rounded-3xl p-8">
              <h3 className="font-serif font-bold text-lg text-cafe-brown mb-6">Rekomendasi</h3>
              <div className="space-y-6">
                {recommendations.length > 0 ? (
                  recommendations.map((recPlace) => (
                    <Link key={recPlace.id} to={`/places/${recPlace.id}`} className="flex gap-4 group cursor-pointer">
                      <div className="w-20 h-20 bg-cafe-pastel rounded-2xl overflow-hidden flex-shrink-0">
                        <img 
                          src={recPlace.image} 
                          alt={recPlace.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-cafe-brown group-hover:text-cafe-mocha transition-colors truncate">
                          {recPlace.name}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-cafe-mocha mt-1">
                          <MapPin size={10} className="flex-shrink-0" />
                          <span className="truncate">{recPlace.location}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Star size={10} className="fill-cafe-brown text-cafe-brown flex-shrink-0" />
                          <span className="text-[10px] font-bold">{recPlace.rating}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-cafe-mocha/60 italic">Tidak ada rekomendasi lain saat ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Toast and Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
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
                <h4 className="font-serif font-bold text-lg text-cafe-brown">Bagikan Tempat</h4>
                <p className="text-xs text-cafe-mocha/70 mt-1">Bagikan vibe estetik {place?.name} dengan teman Anda!</p>
              </div>

              <div className="space-y-3 mb-6">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Temukan tempat nongkrong estetik ini: *${place?.name}* di Pangkal Pinang! ☕✨\n${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100/80 text-green-700 font-bold text-sm rounded-2xl transition-all border border-green-100 text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <span>Bagikan ke WhatsApp</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Temukan tempat nongkrong estetik ini: *${place?.name}* di Pangkal Pinang! ☕✨`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-sm rounded-2xl transition-all border border-blue-100 text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                    <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
                  </div>
                  <span>Bagikan ke Telegram</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Rekomendasi cafe estetik di Pangkal Pinang: ${place?.name}! ☕✨`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-sm rounded-2xl transition-all border border-gray-100 text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span>Bagikan ke Twitter / X</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-bold text-sm rounded-2xl transition-all border border-indigo-100 text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-base flex-shrink-0">
                    f
                  </div>
                  <span>Bagikan ke Facebook</span>
                </a>
              </div>

              <div className="pt-4 border-t border-cafe-pastel flex items-center gap-2">
                <div className="bg-cafe-beige px-3 py-2.5 rounded-xl border border-cafe-pastel text-xs text-cafe-mocha truncate flex-1 font-mono">
                  {window.location.href}
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`flex-shrink-0 p-3 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                    copied 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-cafe-brown text-white hover:bg-cafe-mocha'
                  }`}
                  title="Salin Link"
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
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-cafe-brown text-cafe-cream px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl border border-cafe-mocha"
          >
            <Check size={18} className="text-green-400" /> Tautan berhasil disalin ke papan klip!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PlaceDetails;
