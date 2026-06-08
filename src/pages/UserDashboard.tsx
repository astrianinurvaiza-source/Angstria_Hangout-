import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  User, Mail, Lock, Coffee, AlertCircle, Sparkles, LogIn,
  Calendar, Star, Heart, MapPin, Phone, MessageSquare, LogOut, CheckCircle2, ChevronRight, Eye,
  Plus, X
} from 'lucide-react';
import { userService, reservationsService, placesService } from '../services/dbService';
import { useFavorites } from '../context/FavoritesContext';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites } = useFavorites();
  
  // Session State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Authentication states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Dashboard States
  const [activeTab, setActiveTab] = useState<'reservations' | 'favorites' | 'explore'>('reservations');
  const [reservations, setReservations] = useState<any[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // New Booking State
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    placeId: '',
    customerPhone: '',
    bookingDate: '',
    bookingTime: '',
    guests: 2,
    notes: ''
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Cancel Reservation States
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load User Session
  useEffect(() => {
    const checkUserSession = () => {
      const saved = localStorage.getItem('angstria_user_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
        } catch {
          localStorage.removeItem('angstria_user_session');
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingSession(false);
    };
    checkUserSession();
  }, []);

  // Fetch Dashboard items
  useEffect(() => {
    if (currentUser) {
      fetchUserDashboardData();
    }
  }, [currentUser]);

  const fetchUserDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      // 1. Fetch user reservations
      const resList = await reservationsService.getReservations({ customerEmail: currentUser.email });
      setReservations(resList);
      
      // 2. Fetch all cafes to match with favorites & suggestions
      const placesList = await placesService.getAllPlaces();
      setPlaces(placesList);
    } catch (err: any) {
      console.warn("Gagal memuat data dasbor pengguna:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Pre-select placeId from URL search params if provided
  useEffect(() => {
    if (currentUser && places.length > 0) {
      const params = new URLSearchParams(location.search);
      const preselectId = params.get('bookingPlaceId');
      if (preselectId && places.some(p => p.id === preselectId)) {
        setBookingForm(prev => ({ ...prev, placeId: preselectId }));
        setIsBookingFormOpen(true);
        setActiveTab('reservations');
        
        // Clean up the URL so reloads don't keep opening it
        const cleanSearch = params.toString().replace(`bookingPlaceId=${preselectId}`, '').replace(/^&|&$/, '');
        navigate({
          pathname: location.pathname,
          search: cleanSearch ? `?${cleanSearch}` : ''
        }, { replace: true });
      }
    }
  }, [currentUser, places, location.search]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.placeId) {
      setBookingError('Silakan pilih salah satu kafe terlebih dahulu.');
      return;
    }
    setSubmittingBooking(true);
    setBookingSuccess('');
    setBookingError('');

    try {
      await reservationsService.createReservation({
        placeId: bookingForm.placeId,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerPhone: bookingForm.customerPhone,
        bookingDate: bookingForm.bookingDate,
        bookingTime: bookingForm.bookingTime,
        guests: Number(bookingForm.guests),
        notes: bookingForm.notes
      });

      setBookingSuccess('Pengajuan reservasi meja Anda berhasil dikirim! Menunggu konfirmasi dari pengelola kafe.');
      setBookingForm({
        placeId: '',
        customerPhone: '',
        bookingDate: '',
        bookingTime: '',
        guests: 2,
        notes: ''
      });

      // Refresh list of reservations
      await fetchUserDashboardData();

      // Close modal gracefully after 3 seconds
      setTimeout(() => {
        setIsBookingFormOpen(false);
        setBookingSuccess('');
      }, 3000);
    } catch (error: any) {
      setBookingError(error.message || 'Gagal mengirimkan data pengajuan reservasi.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmittingAuth(true);

    try {
      if (authMode === 'register') {
        if (!name.trim()) throw new Error('Nama lengkap wajib diisi');
        const newUser = await userService.register(name, email, password);
        setSuccessMsg('Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.');
        setAuthMode('login');
        // Clear password helper, stay on login form
        setPassword('');
      } else {
        const loggedUser = await userService.login(email, password);
        localStorage.setItem('angstria_user_session', JSON.stringify(loggedUser));
        setCurrentUser(loggedUser);
        setSuccessMsg(`Selamat datang kembali, ${loggedUser.name}!`);
        // Dispatch custom event to notify navbar etc.
        window.dispatchEvent(new Event('user-auth-changed'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('angstria_user_session');
    setCurrentUser(null);
    setReservations([]);
    setSuccessMsg('Anda telah berhasil keluar akun.');
    window.dispatchEvent(new Event('user-auth-changed'));
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCancelReservation = async (reservationId: number) => {
    setIsCancelling(true);
    try {
      await reservationsService.updateReservationStatus(reservationId, 'cancelled');
      setSuccessMsg('Reservasi Anda berhasil dibatalkan.');
      setCancellingId(null);
      // Refresh list of reservations
      await fetchUserDashboardData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membatalkan reservasi.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter favorite places
  const favoritePlaces = places.filter(p => favorites.includes(p.id));

  if (loadingSession) {
    return <LoadingSpinner fullScreen />;
  }

  // --- RENDERING AUTHENTICATION SCREEN FOR SIGNED-OUT VISITOR ---
  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-cafe-beige flex items-center justify-center p-6 md:p-12"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cafe-brown via-cafe-mocha to-cafe-pastel"></div>
        
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-cafe-pastel relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-cafe-beige rounded-full -z-10 opacity-50"></div>
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-cafe-brown rounded-2xl flex items-center justify-center text-cafe-cream mx-auto mb-6 shadow-lg rotate-3">
              <Coffee size={32} />
            </div>
            <h1 className="text-3xl font-serif font-black text-cafe-brown mb-2 tracking-tight">Portal Pengguna</h1>
            <p className="text-cafe-mocha/60 text-sm font-medium">Reservasi meja, simpan kafe estetik favorit, & kelola agenda kuliner Anda.</p>
          </div>

          {/* Form Tabs */}
          <div className="flex bg-cafe-beige p-1.5 rounded-2xl mb-8 border border-cafe-pastel">
            <button
              onClick={() => { setAuthMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-white text-cafe-brown shadow-sm' : 'text-cafe-mocha/50 hover:text-cafe-brown'
              }`}
            >
              Masuk Akun
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMsg(''); }}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-white text-cafe-brown shadow-sm' : 'text-cafe-mocha/50 hover:text-cafe-brown'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-red-50 text-red-600 p-4 rounded-2xl mb-6 border border-red-100 text-xs font-medium"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-emerald-50 text-emerald-800 p-4 rounded-2xl mb-6 border border-emerald-100 text-xs font-medium"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            {authMode === 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-cafe-mocha/70 tracking-[0.2em] ml-2">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={18} />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-cafe-brown focus:ring-4 focus:ring-cafe-brown/5 transition-all text-cafe-brown"
                    placeholder="Masukkan nama lengkap Anda..."
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-cafe-mocha/70 tracking-[0.2em] ml-2">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-cafe-brown focus:ring-4 focus:ring-cafe-brown/5 transition-all text-cafe-brown"
                  placeholder="Contoh: astriani@design.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-cafe-mocha/70 tracking-[0.2em] ml-2">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-cafe-brown focus:ring-4 focus:ring-cafe-brown/5 transition-all text-cafe-brown"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submittingAuth}
              className="w-full btn-primary mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {submittingAuth ? 'Sedang Diproses...' : authMode === 'login' ? 'Masuk Portal Pengguna' : 'Daftar Akun Baru'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-cafe-mocha/50">
            Ingin bermitra mendaftarkan Cafe?{' '}
            <Link to="/owner" className="font-bold text-cafe-brown hover:underline">
              Portal Pemilik disini.
            </Link>
          </p>

          <div className="mt-10 text-center border-t border-cafe-pastel pt-6">
            <Link to="/" className="text-xs font-bold text-cafe-mocha/60 hover:text-cafe-brown transition-colors inline-flex items-center gap-2">
              <Sparkles size={14} /> Kembali ke Beranda Utama
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- RENDERING MAIN USER DASHBOARD COMPONENT ---
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-7xl mx-auto px-6 py-12 md:py-24"
    >
      {/* Header Profile Summary */}
      <div className="bg-cafe-brown text-cafe-cream rounded-[3rem] p-8 md:p-14 mb-12 shadow-xl border border-cafe-brown/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-cafe-beige/20 text-cafe-cream rounded-3xl flex items-center justify-center font-serif font-black text-3xl border border-white/10 uppercase">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3.5 py-1 bg-white/25 backdrop-blur-md text-white font-bold text-[10px] uppercase rounded-full">
                👑 Member Explorer
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight">{currentUser.name}</h1>
            <p className="text-cafe-cream/70 text-sm mt-1">{currentUser.email}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={fetchUserDashboardData}
            className="px-6 py-3 bg-white/10 border border-white/20 rounded-full font-bold text-sm text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            Refresh Data
          </button>
          <button 
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-bold text-sm text-white flex items-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <LogOut size={16} /> Keluar Akun
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl mb-8 border border-emerald-100 flex items-center gap-3 text-sm font-medium animate-pulse">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-cafe-pastel gap-8 mb-8 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'reservations' ? 'border-cafe-brown text-cafe-brown' : 'border-transparent text-cafe-mocha/50'
          }`}
        >
          <Calendar size={16} /> Reservasi Meja ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'favorites' ? 'border-cafe-brown text-cafe-brown' : 'border-transparent text-cafe-mocha/50'
          }`}
        >
          <Heart size={16} className={favorites.length > 0 ? 'text-red-500 fill-red-500' : ''} /> Kafe Tersimpan ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'explore' ? 'border-cafe-brown text-cafe-brown' : 'border-transparent text-cafe-mocha/50'
          }`}
        >
          <Coffee size={16} /> Rekomendasi Kafe
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="min-h-[300px]"
        >
          {loadingDashboard ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* RESERVATIONS TAB */}
              {activeTab === 'reservations' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-cafe-pastel/40 pb-6 mb-6">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-cafe-brown">Daftar Reservasi Meja</h2>
                      <p className="text-xs text-cafe-mocha/60 mt-1">Kelola dan pantau seluruh status pemesanan meja kafe Anda.</p>
                    </div>
                    <button
                      onClick={() => {
                        setBookingError('');
                        setBookingSuccess('');
                        setIsBookingFormOpen(true);
                      }}
                      className="px-6 py-2.5 bg-cafe-brown text-cafe-cream hover:bg-cafe-mocha rounded-full font-bold text-sm flex items-center justify-center gap-2 self-start cursor-pointer transition-all shadow-sm active:scale-95"
                    >
                      <Plus size={16} /> Buat Reservasi Baru
                    </button>
                  </div>

                  {reservations.length === 0 ? (
                    <div className="bg-cafe-cream/40 rounded-[2rem] border border-dashed border-cafe-pastel p-16 text-center">
                      <div className="w-16 h-16 bg-cafe-beige/40 rounded-full flex items-center justify-center text-cafe-mocha/60 mx-auto mb-4">
                        <Calendar size={28} />
                      </div>
                      <h3 className="font-serif font-black text-xl text-cafe-brown mb-2">Belum Ada Reservasi</h3>
                      <p className="text-cafe-mocha/60 text-sm max-w-md mx-auto mb-6">
                        Anda belum pernah membuat reservasi meja apa pun. Jelajahi kafe-kafe estetik kami atau ajukan reservasi baru sekarang secara instan!
                      </p>
                      <button
                        onClick={() => setIsBookingFormOpen(true)}
                        className="btn-primary inline-flex items-center gap-2 cursor-pointer"
                      >
                        Buat Reservasi Baru Sekarang <ChevronRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reservations.map((res) => (
                        <div key={res.id} className="bg-cafe-cream border border-cafe-pastel rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black uppercase text-cafe-mocha tracking-wider">
                                Booking #{res.id}
                              </span>
                              <div>
                                {res.status === 'approved' ? (
                                  <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                                    Disetujui
                                  </span>
                                ) : res.status === 'rejected' ? (
                                  <span className="px-3.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200">
                                    Ditolak
                                  </span>
                                ) : res.status === 'cancelled' || res.status === 'canceled' ? (
                                  <span className="px-3.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full border border-gray-200">
                                    Dibatalkan
                                  </span>
                                ) : (
                                  <span className="px-3.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 animate-pulse">
                                    Menunggu
                                  </span>
                                )}
                              </div>
                            </div>
 
                            <Link to={`/places/${res.placeId}`} className="group hover:underline text-cafe-brown">
                              <h3 className="font-serif font-black text-xl mb-3 flex items-center gap-2">
                                {res.placeName || 'Kafe'}
                                <ChevronRight size={16} className="text-cafe-mocha opacity-35 group-hover:opacity-100 transition-opacity" />
                              </h3>
                            </Link>
 
                            <div className="space-y-2.5 my-4 border-t border-b border-cafe-pastel/60 py-4">
                              <div className="flex items-center gap-2 text-xs text-cafe-mocha">
                                <Calendar size={14} className="text-cafe-brown" />
                                <span className="font-bold">{res.bookingDate}</span> di jam <span className="font-bold">{res.bookingTime}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-cafe-mocha">
                                <User size={14} className="text-cafe-brown" />
                                <span>Kapasitas: <strong className="text-cafe-brown">{res.guests} Kursi</strong></span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-cafe-mocha">
                                <Phone size={14} className="text-cafe-brown" />
                                <span>Telepon: {res.customerPhone}</span>
                              </div>
                            </div>
                            
                            {res.notes && (
                              <div className="bg-cafe-beige/45 rounded-xl p-3.5 border border-cafe-pastel text-[11px] leading-relaxed text-cafe-mocha italic">
                                "{res.notes}"
                              </div>
                            )}
                          </div>
 
                          <div className="pt-6 mt-4 border-t border-cafe-pastel/40 flex flex-col gap-3">
                            {res.status !== 'rejected' && res.status !== 'cancelled' && res.status !== 'canceled' ? (
                              cancellingId === res.id ? (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                                  <p className="text-xs font-medium text-red-700">Yakin ingin membatalkan reservasi ini?</p>
                                  <div className="flex gap-2">
                                    <button
                                      disabled={isCancelling}
                                      onClick={() => handleCancelReservation(res.id)}
                                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      {isCancelling ? 'Memproses...' : 'Ya, Batalkan'}
                                    </button>
                                    <button
                                      disabled={isCancelling}
                                      onClick={() => setCancellingId(null)}
                                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                    >
                                      Tutup
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setCancellingId(res.id)}
                                  className="w-full text-center py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 cursor-pointer"
                                >
                                  ❌ Batalkan Reservasi
                                </button>
                              )
                            ) : null}

                            <div className="flex justify-end pt-1">
                              <Link 
                                to={`/places/${res.placeId}`} 
                                className="text-xs font-bold text-cafe-brown hover:underline inline-flex items-center gap-1"
                              >
                                Detail Kafe & Kontak <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SAVED CAFE / FAVORITES TAB */}
              {activeTab === 'favorites' && (
                <div>
                  {favoritePlaces.length === 0 ? (
                    <div className="bg-cafe-cream/40 rounded-[2rem] border border-dashed border-cafe-pastel p-16 text-center">
                      <div className="w-16 h-16 bg-cafe-beige/40 rounded-full flex items-center justify-center text-cafe-mocha/60 mx-auto mb-4">
                        <Heart size={28} />
                      </div>
                      <h3 className="font-serif font-black text-xl text-cafe-brown mb-2">Kafe Favorit Kosong</h3>
                      <p className="text-cafe-mocha/60 text-sm max-w-sm mx-auto mb-6">
                        Belum ada kafe yang Anda tandai sebagai favorit. Klik ikon hati saat menjelajah untuk menyimpannya di sini.
                      </p>
                      <Link to="/places" className="btn-primary inline-flex items-center gap-2">
                        Jelajahi Kafe Terbaik <ChevronRight size={16} />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {favoritePlaces.map((place) => (
                        <div key={place.id} className="bg-white rounded-[2.5rem] border border-cafe-pastel overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group">
                          <div className="relative h-56 overflow-hidden">
                            <img 
                              src={place.image} 
                              alt={place.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur shadow-sm px-3 py-1 rounded-full text-xs font-black text-cafe-brown flex items-center gap-1">
                              <Star size={12} className="fill-yellow-500 text-yellow-500" />
                              {place.rating || '0.0'}
                            </div>
                          </div>
                          <div className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                              <h3 className="font-serif font-black text-lg text-cafe-brown group-hover:text-amber-700 transition-colors">{place.name}</h3>
                              <p className="text-xs text-cafe-mocha/70 flex items-center gap-1 mt-2 mb-4">
                                <MapPin size={12} className="text-cafe-brown/60" /> {place.location}
                              </p>
                              {place.tags && place.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {place.tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="bg-cafe-beige text-cafe-mocha text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="pt-6 mt-6 border-t border-cafe-pastel flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-cafe-mocha/50 bg-cafe-beige px-2.5 py-1 rounded-full">
                                {place.priceRange}
                              </span>
                              <Link to={`/places/${place.id}`} className="text-xs font-bold text-cafe-brown hover:underline flex items-center gap-1">
                                Kunjungi Kafe <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RECOMMENDED / EXPLORE TAB */}
              {activeTab === 'explore' && (
                <div>
                  <div className="mb-8 max-w-lg">
                    <h2 className="font-serif font-black text-2xl text-cafe-brown mb-2">Kafe Rekomendasi Terpopuler</h2>
                    <p className="text-cafe-mocha/60 text-xs text-cafe-mocha leading-relaxed">
                      Kurasi kafe-kafe premium di Pangkal Pinang yang sedang tren saat ini untuk melengkapi liburan serta kerja produktif Anda.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {places.slice(0, 3).map((place) => (
                      <div key={place.id} className="bg-cafe-cream/35 rounded-[2.5rem] border border-cafe-pastel overflow-hidden flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all">
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={place.image} 
                            alt={place.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-6 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="font-serif font-black text-lg text-cafe-brown">{place.name}</h3>
                            <p className="text-xs text-cafe-mocha/70 flex items-center gap-1 mt-2 mb-4">
                              <MapPin size={12} className="text-cafe-brown/60" /> {place.location}
                            </p>
                          </div>
                          <div className="pt-6 mt-6 border-t border-cafe-pastel/60 flex justify-between items-center">
                            <div className="flex items-center gap-4 text-xs font-bold text-cafe-mocha">
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Star size={14} className="fill-yellow-500" /> {place.rating}
                              </span>
                              <span className="flex items-center gap-1 text-blue-500">
                                <Eye size={14} /> {place.views}
                              </span>
                            </div>
                            <button 
                              onClick={() => {
                                setBookingForm(prev => ({ ...prev, placeId: place.id }));
                                setIsBookingFormOpen(true);
                                setBookingError('');
                                setBookingSuccess('');
                              }}
                              className="text-xs font-bold text-cafe-brown hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              Booking Meja <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Elegant Reservation Modal overlay */}
      <AnimatePresence>
        {isBookingFormOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsBookingFormOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] max-w-md w-full p-8 md:p-10 relative z-10 border border-cafe-pastel shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-cafe-brown"
            >
              <button 
                onClick={() => setIsBookingFormOpen(false)}
                className="absolute top-6 right-6 text-cafe-mocha/60 hover:text-cafe-brown p-2 hover:bg-cafe-beige rounded-full transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-cafe-beige text-cafe-brown rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar size={24} />
                </div>
                <h4 className="font-serif font-black text-xl text-cafe-brown">Reservasi Meja Baru</h4>
                <p className="text-xs text-cafe-mocha/70 mt-1">Pilih kafe favorit Anda & amankan meja premium secara cuma-cuma.</p>
              </div>

              {bookingSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl mb-6">
                  {bookingSuccess}
                </div>
              )}

              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl mb-6 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cafe-mocha/60">Pilih Kafe</label>
                  <select
                    required
                    value={bookingForm.placeId}
                    onChange={(e) => setBookingForm({ ...bookingForm, placeId: e.target.value })}
                    className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                  >
                    <option value="">-- Silakan Pilih Kafe --</option>
                    {places.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cafe-mocha/60">Nomor Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                    className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                    placeholder="Contoh: 08123456789"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-cafe-mocha/60">Tanggal Kunjungan</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.bookingDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                      className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-cafe-mocha/60">Waktu / Jam</label>
                    <input
                      type="time"
                      required
                      value={bookingForm.bookingTime}
                      onChange={(e) => setBookingForm({ ...bookingForm, bookingTime: e.target.value })}
                      className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cafe-mocha/60">Kapasitas Tamu</label>
                  <select
                    value={bookingForm.guests}
                    onChange={(e) => setBookingForm({ ...bookingForm, guests: Number(e.target.value) })}
                    className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((num) => (
                      <option key={num} value={num}>{num} Orang</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cafe-mocha/60">Catatan Khusus</label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    className="w-full bg-cafe-beige border border-cafe-pastel rounded-xl p-4 text-xs focus:outline-none focus:border-cafe-brown resize-none"
                    placeholder="Contoh: Area outdoor bebas rokok, colokan dekat meja..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingBooking || !!bookingSuccess}
                  className="w-full bg-cafe-brown hover:bg-cafe-mocha text-white text-xs font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-center mt-2"
                >
                  {submittingBooking ? 'Mengirimkan Permintaan...' : 'Ajukan Reservasi Sekarang'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserDashboard;
