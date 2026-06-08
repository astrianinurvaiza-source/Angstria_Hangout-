import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Coffee, LayoutDashboard, User, Phone, Calendar, Clock, Users, LogOut, 
  Settings, Check, X, AlertCircle, Sparkles, CreditCard, Receipt, MapPin, 
  Lock, Mail, Landmark, Compass, Eye, Star, CheckCircle2, ChevronRight,
  Award, Info, Camera
} from 'lucide-react';
import { ownerService, placesService, reservationsService, paymentsService } from '../services/dbService';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const OwnerDashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'reservasi' | 'keuangan'>('profil');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Local state for logged-in owner
  const [ownerData, setOwnerData] = useState<any>(null);
  const [ownerCafe, setOwnerCafe] = useState<Place | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Auth fields
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Cafe creation fields
  const [cafeForm, setCafeForm] = useState({
    name: '',
    description: '',
    location: '',
    openingHours: '09:00 - 22:00',
    facilities: 'WiFi, AC, Indoor, Kopi Bagus',
    priceRange: '$$',
    image: '',
    tags: 'Aesthetic Cafe, Work From Cafe',
    lat: '',
    lng: '',
    instagram: '',
    tiktok: '',
    website: '',
    galleryImages: ''
  });

  // Handle uploading of images (cover or gallery) securely as Base64 encoded payload matching MySQL blob update mechanism
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      setErrorMsg('File gambar terlalu besar! Harap gunakan file di bawah 800KB agar aman disimpan.');
      setTimeout(() => setErrorMsg(''), 6000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'image') {
        setCafeForm(prev => ({ ...prev, image: base64String }));
      } else {
        setCafeForm(prev => {
          const current = prev.galleryImages ? prev.galleryImages.split(',').map(s => s.trim()).filter(Boolean) : [];
          current.push(base64String);
          return { ...prev, galleryImages: current.join(', ') };
        });
      }
      setSuccessMsg('Gambar berhasil diproses dan siap disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Payment UI State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'registration' | 'promotion'>('registration');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'Transfer Bank'>('QRIS');
  const [payAmount, setPayAmount] = useState(0);
  const [paymentProof, setPaymentProof] = useState<string>('');

  // Check session on load and listen to changes
  useEffect(() => {
    const checkOwner = () => {
      const savedOwner = localStorage.getItem('angstria_owner_session');
      if (savedOwner) {
        try {
          const parsed = JSON.parse(savedOwner);
          setOwnerData(parsed);
          setIsLoggedIn(true);
          fetchOwnerDashboardData(parsed.email);
        } catch (e) {
          localStorage.removeItem('angstria_owner_session');
          setOwnerData(null);
          setIsLoggedIn(false);
        }
      } else {
        setOwnerData(null);
        setIsLoggedIn(false);
      }
    };
    checkOwner();
    window.addEventListener('storage', checkOwner);
    window.addEventListener('owner-auth-changed', checkOwner);
    return () => {
      window.removeEventListener('storage', checkOwner);
      window.removeEventListener('owner-auth-changed', checkOwner);
    };
  }, []);

  const fetchOwnerDashboardData = async (email: string) => {
    setLoading(true);
    try {
      // 1. Ambil data profil pemilik terbaru langsung dari server database MySQL
      let activeCafeId = ownerData?.cafeId;
      try {
        const freshProfile = await ownerService.getProfile(email);
        if (freshProfile) {
          activeCafeId = freshProfile.cafeId;
          const updated = { ...ownerData, ...freshProfile };
          setOwnerData(updated);
          localStorage.setItem('angstria_owner_session', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Gagal menyelaraskan profil pemilik dari server:", err);
      }

      // 2. Cari kafe yang dimiliki sesuai data relasi di tabel owners
      const allPlaces = await placesService.getAllPlaces();
      const matchedCafe = allPlaces.find(p => p.id === activeCafeId || p.ownerEmail === email);
      
      if (matchedCafe) {
        setOwnerCafe(matchedCafe);
        
        // Isikan nilai formulir draf dari database yang ada
        setCafeForm({
          name: matchedCafe.name,
          description: matchedCafe.description || '',
          location: matchedCafe.location,
          openingHours: matchedCafe.openingHours || '09:00 - 22:00',
          facilities: matchedCafe.facilities ? matchedCafe.facilities.join(', ') : '',
          priceRange: matchedCafe.priceRange || '$$',
          image: matchedCafe.image || '',
          tags: matchedCafe.tags ? matchedCafe.tags.join(', ') : '',
          lat: matchedCafe.lat !== null && matchedCafe.lat !== undefined ? matchedCafe.lat.toString() : '',
          lng: matchedCafe.lng !== null && matchedCafe.lng !== undefined ? matchedCafe.lng.toString() : '',
          instagram: matchedCafe.socials?.instagram || '',
          tiktok: matchedCafe.socials?.tiktok || '',
          website: matchedCafe.socials?.website || '',
          galleryImages: matchedCafe.images ? matchedCafe.images.join(', ') : ''
        });

        // 3. Ambil data reservasi
        const bookingList = await reservationsService.getReservations({ placeId: matchedCafe.id });
        setReservations(bookingList);
      } else {
        setOwnerCafe(null);
        setReservations([]);
      }

      // 4. Ambil histori transaksi
      const payList = await paymentsService.getPayments(email);
      setPayments(payList);

    } catch (err) {
      console.error("Gagal sinkron data dasbor pemilik:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (authMode === 'register') {
        await ownerService.register(authForm.name, authForm.email, authForm.password);
        setSuccessMsg('Pendaftaran berhasil! Silakan masuk menggunakan akun baru Anda.');
        setAuthMode('login');
        setSubmitting(false);
        return;
      }

      // Login Mode
      const res = await ownerService.login(authForm.email, authForm.password);
      setOwnerData(res);
      setIsLoggedIn(true);
      localStorage.setItem('angstria_owner_session', JSON.stringify(res));
      window.dispatchEvent(new Event('owner-auth-changed'));
      await fetchOwnerDashboardData(res.email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Proses otentikasi gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerData) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const facilitiesArray = cafeForm.facilities ? cafeForm.facilities.split(',').map((f: string) => f.trim()).filter(Boolean) : [];
      const tagsArray = cafeForm.tags ? cafeForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      const galleryArray = cafeForm.galleryImages ? cafeForm.galleryImages.split(',').map((img: string) => img.trim()).filter(Boolean) : [];

      if (galleryArray.length === 0 && cafeForm.image) {
        galleryArray.push(cafeForm.image);
      }

      // Create fresh Cafe place listing
      const newCafeId = await placesService.createPlace({
        name: cafeForm.name,
        description: cafeForm.description,
        location: cafeForm.location,
        lat: cafeForm.lat ? parseFloat(cafeForm.lat) : null,
        lng: cafeForm.lng ? parseFloat(cafeForm.lng) : null,
        openingHours: cafeForm.openingHours,
        facilities: facilitiesArray,
        priceRange: cafeForm.priceRange,
        tags: tagsArray,
        image: cafeForm.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800',
        images: galleryArray.length > 0 ? galleryArray : ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800'],
        socials: { 
          instagram: cafeForm.instagram || '', 
          website: cafeForm.website || '', 
          tiktok: cafeForm.tiktok || '' 
        },
        ownerEmail: ownerData.email,
        featured: false
      } as any);

      if (newCafeId) {
        const updatedOwner = { ...ownerData, cafeId: newCafeId };
        setOwnerData(updatedOwner);
        localStorage.setItem('angstria_owner_session', JSON.stringify(updatedOwner));
      }

      setSuccessMsg('Kafe Anda berhasil didaftarkan di portal Angstria Hangout!');
      await fetchOwnerDashboardData(ownerData.email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan profil kafe.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerCafe) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const facilitiesArray = cafeForm.facilities ? cafeForm.facilities.split(',').map((f: string) => f.trim()).filter(Boolean) : [];
      const tagsArray = cafeForm.tags ? cafeForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      const galleryArray = cafeForm.galleryImages ? cafeForm.galleryImages.split(',').map((img: string) => img.trim()).filter(Boolean) : [];

      if (galleryArray.length === 0 && cafeForm.image) {
        galleryArray.push(cafeForm.image);
      }

      await placesService.updatePlace(ownerCafe.id, {
        name: cafeForm.name,
        description: cafeForm.description,
        location: cafeForm.location,
        openingHours: cafeForm.openingHours,
        facilities: facilitiesArray,
        priceRange: cafeForm.priceRange,
        tags: tagsArray,
        image: cafeForm.image,
        images: galleryArray,
        socials: { 
          instagram: cafeForm.instagram || '', 
          website: cafeForm.website || '', 
          tiktok: cafeForm.tiktok || '' 
        },
        lat: cafeForm.lat ? parseFloat(cafeForm.lat) : null,
        lng: cafeForm.lng ? parseFloat(cafeForm.lng) : null
      });

      setSuccessMsg('Profil kafe berhasil diperbarui secara langsung!');
      if (ownerData) {
        await fetchOwnerDashboardData(ownerData.email);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui profil kafe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReservationDecision = async (id: number, decision: 'approved' | 'rejected' | 'completed') => {
    try {
      await reservationsService.updateReservationStatus(id, decision);
      setSuccessMsg(`Status reservasi berhasil diperbarui menjadi: ${decision === 'approved' ? 'Disetujui' : decision === 'rejected' ? 'Ditolak' : 'Selesai'}`);
      if (ownerData) {
        await fetchOwnerDashboardData(ownerData.email);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui reservasi.');
    }
  };

  const openCheckout = (type: 'registration' | 'promotion') => {
    setPaymentType(type);
    const amount = type === 'registration' ? 150000 : 250000; // Rp 150.000 or Rp 250.000 promotion
    setPayAmount(amount);
    setShowPaymentModal(true);
  };

  const processPaymentSubmit = async () => {
    if (!ownerData) return;
    if (!paymentProof) {
      setErrorMsg('Harap unggah bukti pembayaran terlebih dahulu untuk proses verifikasi.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await paymentsService.addPayment({
        ownerEmail: ownerData.email,
        cafeId: ownerCafe?.id || undefined,
        amount: payAmount,
        type: paymentType,
        method: paymentMethod,
        proof: paymentProof,
        status: 'pending' // Admin must review and approve
      });

      setShowPaymentModal(false);
      setPaymentProof('');
      setSuccessMsg(
        paymentType === 'promotion' 
          ? 'Pembayaran berhasil dikirim! Menunggu verifikasi bukti transfer oleh Admin untuk mengaktifkan status Rekomendasi Utama.' 
          : 'Pendaftaran berhasil dikirim! Menunggu verifikasi bukti transfer oleh Admin untuk mendaftarkan kafe.'
      );
      
      await fetchOwnerDashboardData(ownerData.email);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melakukan konfirmasi pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('angstria_owner_session');
    setOwnerData(null);
    setOwnerCafe(null);
    setReservations([]);
    setPayments([]);
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('owner-auth-changed'));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-cafe-beige/40 pb-24"
    >
      {/* Banner */}
      <div className="bg-cafe-brown text-cafe-cream py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#E3D3C4] bg-white/10 px-3 py-1 rounded-full">
              Halaman Mitra Usaha
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight text-white">
              Dasbor Pemilik Kafe
            </h1>
            <p className="text-sm text-cafe-pastel max-w-xl">
              Daftarkan kafe estetik Anda, terima reservasi meja pelanggan, dan promosikan usaha kuliner Anda ke jangkauan terluas di Pangkal Pinang.
            </p>
          </div>
          
          {isLoggedIn && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all self-start md:self-auto border border-white/10 cursor-pointer"
            >
              <LogOut size={16} /> Keluar Akun
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        {/* Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl mb-8 flex items-start gap-3 text-xs leading-relaxed"
            >
              <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Aksi Berhasil</p>
                <p>{successMsg}</p>
              </div>
              <button onClick={() => setSuccessMsg('')} className="text-emerald-800 hover:opacity-70 p-1">✕</button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl mb-8 flex items-start gap-3 text-xs leading-relaxed"
            >
              <AlertCircle size={18} className="text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Mengalami Hambatan</p>
                <p>{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg('')} className="text-rose-800 hover:opacity-70 p-1">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoggedIn ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto bg-cafe-cream border border-cafe-pastel rounded-3xl p-8 shadow-xl mt-6">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-cafe-brown text-cafe-cream rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={24} />
              </div>
              <h2 className="text-2xl font-serif font-black text-cafe-brown">
                {authMode === 'login' ? 'Masuk Pemilik' : 'Pendaftaran Pemilik'}
              </h2>
              <p className="text-xs text-cafe-mocha/70 mt-1">
                {authMode === 'login' ? 'Silakan masuk untuk mengelola reservasi dan profile kafe' : 'Buat akun pemilik kafe Anda secara gratis'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-cafe-mocha/50 block">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={16} />
                    <input 
                      type="text"
                      required
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      placeholder="Nama mitra pemilik"
                      className="w-full bg-cafe-beige/50 border border-cafe-pastel rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-cafe-brown"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-cafe-mocha/50 block">Surel / Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={16} />
                  <input 
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    placeholder="Contoh: pemilik@cafe.com"
                    className="w-full bg-cafe-beige/50 border border-cafe-pastel rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-cafe-brown"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-cafe-mocha/50 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={16} />
                  <input 
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    placeholder="Sandi keamanan"
                    className="w-full bg-cafe-beige/50 border border-cafe-pastel rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-cafe-brown"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-cafe-brown hover:bg-cafe-mocha text-white py-3.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center disabled:opacity-50 mt-6 cursor-pointer animate-pulse-slow"
              >
                {submitting ? 'Sedang Diproses...' : authMode === 'login' ? 'Masuk Dasbor Pemilik' : 'Selesaikan Pendaftaran'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-cafe-pastel text-center text-xs text-cafe-mocha/70">
              {authMode === 'login' ? (
                <p>
                  Belum bermitra?{' '}
                  <button onClick={() => setAuthMode('register')} className="text-cafe-brown font-bold underline">
                    Daftar di Sini
                  </button>
                </p>
              ) : (
                <p>
                  Sudah memiliki akun?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-cafe-brown font-bold underline">
                    Masuk di Sini
                  </button>
                </p>
              )}
            </div>

            {/* Hint Box for verification */}
            <div className="mt-6 bg-cafe-beige border border-cafe-pastel p-4 rounded-xl text-[11px] leading-relaxed text-cafe-brown/80">
              <span className="font-bold block mb-1">💡 Petunjuk Demo Mode:</span>
              Gunakan email <strong className="font-mono">pemilik@cafe.com</strong> dan kata sandi <strong className="font-mono">cafe123</strong> untuk langsung masuk dan melihat simulasi dasbor cafe yang lengkap secara instan.
            </div>
          </div>
        ) : (
          /* Logged-In Portal Dashboard Layout */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar Menu */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-cafe-cream rounded-3xl p-6 border border-cafe-pastel shadow-sm text-center">
                <div className="w-16 h-16 bg-cafe-brown text-cafe-cream rounded-full flex items-center justify-center mx-auto mb-4 font-serif text-2xl font-extrabold shadow-md">
                  {ownerData?.name[0].toUpperCase()}
                </div>
                <h3 className="font-serif font-black text-cafe-brown text-lg">{ownerData?.name}</h3>
                <p className="text-xs text-cafe-mocha/60 truncate font-medium">{ownerData?.email}</p>
                
                {ownerCafe && (
                  <div className="flex items-center justify-center gap-1.5 mt-3 px-3 py-1 bg-amber-50 rounded-full w-fit mx-auto border border-amber-100/60">
                    <Award size={14} className="text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">{ownerCafe.name}</span>
                  </div>
                )}
              </div>

              {/* Sidebar Menu Buttons */}
              <div className="bg-cafe-cream rounded-3xl p-3 border border-cafe-pastel shadow-sm flex flex-col gap-1">
                <button
                  onClick={() => setActiveTab('profil')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'profil' 
                      ? 'bg-cafe-brown text-white shadow-md' 
                      : 'text-cafe-mocha/80 hover:bg-cafe-beige/60'
                  }`}
                >
                  <Coffee size={16} /> Kelola Profil Kafe
                </button>

                <button
                  onClick={() => setActiveTab('reservasi')}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'reservasi' 
                      ? 'bg-cafe-brown text-white shadow-md' 
                      : 'text-cafe-mocha/80 hover:bg-cafe-beige/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Calendar size={16} /> Kelola Reservasi Meja
                  </span>
                  {reservations.filter(r => r.status === 'pending').length > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-serif">
                      {reservations.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('keuangan')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'keuangan' 
                      ? 'bg-cafe-brown text-white shadow-md' 
                      : 'text-cafe-mocha/80 hover:bg-cafe-beige/60'
                  }`}
                >
                  <Receipt size={16} /> Keuangan &amp; Promosi
                </button>
              </div>

              {/* Help Widget in Sidebar */}
              {ownerCafe && (
                <div className="bg-amber-950/5 border border-cafe-pastel rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
                  <div className="w-12 h-12 bg-white/50 backdrop-blur rounded-full flex items-center justify-center text-amber-800 mx-auto mb-3 shadow-sm">
                    <Sparkles size={20} />
                  </div>
                  <h4 className="font-serif font-black text-sm text-cafe-brown">Tampilkan Cafe Di Beranda!</h4>
                  <p className="text-[10px] text-cafe-mocha/70 mt-1.5 leading-relaxed">Promosikan kafe Anda sebagai <strong>"Promosi Paling Direkomendasikan"</strong> agar langsung terlihat oleh ribuan pengguna!</p>
                  <button 
                    onClick={() => setActiveTab('keuangan')}
                    className="mt-4 px-4 py-2 bg-cafe-brown text-white hover:bg-cafe-mocha text-[10px] font-bold rounded-lg tracking-wider block mx-auto cursor-pointer"
                  >
                    Promosikan Sekarang
                  </button>
                </div>
              )}
            </div>

            {/* Right Container Panels */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="p-24 bg-cafe-cream border border-cafe-pastel rounded-[2rem] flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* TAB 1: PROFILE MANAGEMENT */}
                  {activeTab === 'profil' && (
                    <motion.div
                      key="profil"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-cafe-cream border border-cafe-pastel rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8"
                    >
                      {!ownerCafe ? (
                        /* No Cafe Registered Form */
                        <div className="space-y-6">
                          <div className="flex items-center gap-2 text-cafe-brown border-b border-cafe-pastel pb-4">
                            <Plus size={24} />
                            <h2 className="text-xl font-serif font-bold">Registrasi Kafe Baru</h2>
                          </div>

                          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-xs flex gap-3 border border-amber-200 leading-relaxed">
                            <Info size={18} className="flex-shrink-0 text-amber-600" />
                            <span>Anda belum mendaftarkan kafe Anda. Silakan isi form di bawah ini agar data kafe Anda langsung muncul secara resmi untuk pencarian pengunjung!</span>
                          </div>

                          <form onSubmit={handleCreateCafe} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Nama Kafe *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.name}
                                  onChange={(e) => setCafeForm({ ...cafeForm, name: e.target.value })}
                                  placeholder="Contoh: Kini Kawa Vol 3"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Jam Operasional *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.openingHours}
                                  onChange={(e) => setCafeForm({ ...cafeForm, openingHours: e.target.value })}
                                  placeholder="Contoh: 09:00 - 23:00"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Alamat Lengkap Kafe *</label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={16} />
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.location}
                                  onChange={(e) => setCafeForm({ ...cafeForm, location: e.target.value })}
                                  placeholder="Contoh: Jl. Ahmad Yani No. 5, Pangkal Pinang"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Deskripsi Ringkas Kafe *</label>
                              <textarea 
                                required
                                rows={4}
                                value={cafeForm.description}
                                onChange={(e) => setCafeForm({ ...cafeForm, description: e.target.value })}
                                placeholder="Beri gambaran suasana, desain interior, kopi andalan, atau target kenyamanan utama..."
                                className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Fasilitas Utama (pisahkan dengan koma) *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.facilities}
                                  onChange={(e) => setCafeForm({ ...cafeForm, facilities: e.target.value })}
                                  placeholder="WiFi, AC, Parkir, Live Music, Halal, Indoor"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Tingkat Budget Harga ($, $$, $$$) *</label>
                                <select 
                                  value={cafeForm.priceRange}
                                  onChange={(e) => setCafeForm({ ...cafeForm, priceRange: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                >
                                  <option value="$">$ (Ekonomis - di bawah Rp 20rb)</option>
                                  <option value="$$">$$ (Menengah - Rp 20rb s/d 50rb)</option>
                                  <option value="$$$">$$$ (Premium - di atas Rp 50rb)</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Foto Utama Kafe (Tautan URL atau Pilih File) *</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.image}
                                  onChange={(e) => setCafeForm({ ...cafeForm, image: e.target.value })}
                                  placeholder="https://images.unsplash.com/photo-... atau unggah file di kanan"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-mono flex-grow"
                                />
                                <label className="cursor-pointer bg-cafe-brown text-cafe-cream px-4 rounded-xl hover:bg-cafe-mocha transition-all flex items-center justify-center text-xs font-bold shrink-0">
                                  <span>Pilih File</span>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'image')}
                                  />
                                </label>
                              </div>
                              {cafeForm.image && (
                                <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-cafe-pastel">
                                  <img src={cafeForm.image} className="w-full h-full object-cover" alt="Cover Preview" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Galeri Foto Tambahan (Pisahkan dengan koma atau Pilih File tambahan)</label>
                              <div className="flex gap-2">
                                <textarea 
                                  rows={2}
                                  value={cafeForm.galleryImages}
                                  onChange={(e) => setCafeForm({ ...cafeForm, galleryImages: e.target.value })}
                                  placeholder="Tempel tautan-tautan URL foto dipisahkan koma..."
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-mono resize-none leading-relaxed flex-grow"
                                />
                                <label className="cursor-pointer bg-cafe-brown text-cafe-cream px-4 rounded-xl hover:bg-cafe-mocha transition-all flex items-center justify-center text-xs font-bold shrink-0 py-4 self-center">
                                  <span>+ Foto</span>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'gallery')}
                                  />
                                </label>
                              </div>
                              {cafeForm.galleryImages && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {cafeForm.galleryImages.split(',').map(s => s.trim()).filter(Boolean).map((img, idx) => (
                                    <div key={idx} className="relative w-14 h-11 rounded-lg overflow-hidden border border-cafe-pastel group">
                                      <img src={img} className="w-full h-full object-cover" alt="Gallery Preview" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const current = cafeForm.galleryImages.split(',').map(s => s.trim()).filter(Boolean).filter((_, i) => i !== idx);
                                          setCafeForm({ ...cafeForm, galleryImages: current.join(', ') });
                                        }}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] transition-opacity"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Label Tags / Slogan (pisahkan dengan koma) *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.tags}
                                  onChange={(e) => setCafeForm({ ...cafeForm, tags: e.target.value })}
                                  placeholder="Contoh: Aesthetic Cafe, Instagrammable, Kopi Nusantara"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-medium"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Akun/Tautan Instagram (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.instagram}
                                  onChange={(e) => setCafeForm({ ...cafeForm, instagram: e.target.value })}
                                  placeholder="Contoh: @kinikawa"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Akun/Tautan TikTok (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.tiktok}
                                  onChange={(e) => setCafeForm({ ...cafeForm, tiktok: e.target.value })}
                                  placeholder="Contoh: @kinikawa"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Tautan Website Ke Menu (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.website}
                                  onChange={(e) => setCafeForm({ ...cafeForm, website: e.target.value })}
                                  placeholder="Contoh: https://kinikawa.id"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Latitude Peta (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.lat}
                                  onChange={(e) => setCafeForm({ ...cafeForm, lat: e.target.value })}
                                  placeholder="Contoh: -2.1283"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Longitude Peta (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.lng}
                                  onChange={(e) => setCafeForm({ ...cafeForm, lng: e.target.value })}
                                  placeholder="Contoh: 106.1130"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={submitting}
                              className="w-full bg-cafe-brown hover:bg-cafe-mocha text-white py-4 rounded-xl text-xs font-bold tracking-wider transition-all disabled:opacity-50 mt-4 cursor-pointer"
                            >
                              {submitting ? 'Sedang Mendaftarkan...' : 'Daftarkan Profil Cafe Sekarang'}
                            </button>
                          </form>
                        </div>
                      ) : (
                        /* Edit Existing Cafe Form */
                        <div className="space-y-8">
                          <div className="flex items-center justify-between border-b border-cafe-pastel pb-4">
                            <h2 className="text-xl font-serif font-bold text-cafe-brown">Menu Pengaturan Kafe</h2>
                            <span className="text-[10px] font-bold font-mono text-cafe-mocha/60 uppercase">ID: {ownerCafe.id}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center p-6 bg-cafe-beige/30 border border-cafe-pastel rounded-2xl">
                            <div className="md:col-span-1 w-24 h-24 rounded-2xl overflow-hidden bg-cafe-pastel">
                              <img src={ownerCafe.image} alt={ownerCafe.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="md:col-span-3 space-y-1.5">
                              <h4 className="text-lg font-serif font-bold text-cafe-brown">{ownerCafe.name}</h4>
                              <p className="text-xs text-cafe-mocha font-medium flex items-center gap-1.5"><MapPin size={14} /> {ownerCafe.location}</p>
                              
                              <div className="flex items-center gap-4 text-xs font-bold text-cafe-mocha/80 mt-2">
                                <span className="flex items-center gap-1"><Eye size={14} /> {ownerCafe.views} Kunjungan</span>
                                <span className="flex items-center gap-1"><Star size={14} className="fill-yellow-500 text-yellow-500" /> {ownerCafe.rating} Bintang</span>
                                {ownerCafe.featured ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 text-[10px]"><Sparkles size={11} /> Promosi Aktif</span>
                                ) : (
                                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50 flex items-center gap-1 text-[10px]">Tingkat Reguler</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <form onSubmit={handleUpdateCafe} className="space-y-6 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Nama Kafe</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.name}
                                  onChange={(e) => setCafeForm({ ...cafeForm, name: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-semibold text-cafe-brown"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Jam Operasional</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.openingHours}
                                  onChange={(e) => setCafeForm({ ...cafeForm, openingHours: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown text-cafe-mocha"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Alamat Penuh</label>
                              <input 
                                type="text" 
                                required
                                value={cafeForm.location}
                                onChange={(e) => setCafeForm({ ...cafeForm, location: e.target.value })}
                                className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown text-cafe-mocha"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Deskripsi Suasana</label>
                              <textarea 
                                required
                                rows={4}
                                value={cafeForm.description}
                                onChange={(e) => setCafeForm({ ...cafeForm, description: e.target.value })}
                                className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown resize-none text-cafe-mocha leading-relaxed"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Fasilitas Fasilitas</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.facilities}
                                  onChange={(e) => setCafeForm({ ...cafeForm, facilities: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown text-cafe-mocha"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Tingkat Budget</label>
                                <select 
                                  value={cafeForm.priceRange}
                                  onChange={(e) => setCafeForm({ ...cafeForm, priceRange: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown"
                                >
                                  <option value="$">$ (Ekonomis)</option>
                                  <option value="$$">$$ (Menengah)</option>
                                  <option value="$$$">$$$ (Premium)</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Foto Sampul Kafe (Tautan URL atau Pilih File)</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.image}
                                  onChange={(e) => setCafeForm({ ...cafeForm, image: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown text-cafe-mocha font-mono flex-grow"
                                  placeholder="https://images.unsplash.com/photo-..."
                                />
                                <label className="cursor-pointer bg-cafe-brown text-cafe-cream px-4 rounded-xl hover:bg-cafe-mocha transition-all flex items-center justify-center text-xs font-bold shrink-0">
                                  <span>Pilih File</span>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'image')}
                                  />
                                </label>
                              </div>
                              {cafeForm.image && (
                                <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-cafe-pastel">
                                  <img src={cafeForm.image} className="w-full h-full object-cover" alt="Cover Preview" />
                                </div>
                              )}
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Galeri Foto Tambahan (Pisahkan dengan koma atau Pilih File tambahan)</label>
                              <div className="flex gap-2">
                                <textarea 
                                  rows={2}
                                  value={cafeForm.galleryImages}
                                  onChange={(e) => setCafeForm({ ...cafeForm, galleryImages: e.target.value })}
                                  placeholder="Tempel tautan-tautan URL foto tambahan dipisahkan koma..."
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-mono resize-none leading-relaxed flex-grow text-cafe-mocha"
                                />
                                <label className="cursor-pointer bg-cafe-brown text-cafe-cream px-4 rounded-xl hover:bg-cafe-mocha transition-all flex items-center justify-center text-xs font-bold shrink-0 py-4 self-center">
                                  <span>+ Foto</span>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'gallery')}
                                  />
                                </label>
                              </div>
                              {cafeForm.galleryImages && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {cafeForm.galleryImages.split(',').map(s => s.trim()).filter(Boolean).map((img, idx) => (
                                    <div key={idx} className="relative w-14 h-11 rounded-lg overflow-hidden border border-cafe-pastel group">
                                      <img src={img} className="w-full h-full object-cover" alt="Gallery Preview" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const current = cafeForm.galleryImages.split(',').map(s => s.trim()).filter(Boolean).filter((_, i) => i !== idx);
                                          setCafeForm({ ...cafeForm, galleryImages: current.join(', ') });
                                        }}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] transition-opacity"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Label Tags / Jenis Kafe *</label>
                                <input 
                                  type="text" 
                                  required
                                  value={cafeForm.tags}
                                  onChange={(e) => setCafeForm({ ...cafeForm, tags: e.target.value })}
                                  placeholder="Contoh: Aesthetic Cafe, Instagrammable"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-medium text-cafe-mocha"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Akun/Tautan Instagram (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.instagram}
                                  onChange={(e) => setCafeForm({ ...cafeForm, instagram: e.target.value })}
                                  placeholder="Contoh: @kinikawa"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown text-cafe-mocha"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Akun/Tautan TikTok (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.tiktok}
                                  onChange={(e) => setCafeForm({ ...cafeForm, tiktok: e.target.value })}
                                  placeholder="Contoh: @kinikawa"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown text-cafe-mocha"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Tautan Website Ke Menu (Opsional)</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.website}
                                  onChange={(e) => setCafeForm({ ...cafeForm, website: e.target.value })}
                                  placeholder="Contoh: https://kinikawa.id"
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown text-cafe-mocha"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Latitude</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.lat}
                                  onChange={(e) => setCafeForm({ ...cafeForm, lat: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-mono text-cafe-mocha"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-cafe-mocha/60">Longitude</label>
                                <input 
                                  type="text" 
                                  value={cafeForm.lng}
                                  onChange={(e) => setCafeForm({ ...cafeForm, lng: e.target.value })}
                                  className="w-full bg-cafe-beige/40 border border-cafe-pastel rounded-xl p-3 text-xs focus:outline-none focus:border-cafe-brown font-mono text-cafe-mocha"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={submitting}
                              className="w-full bg-cafe-brown hover:bg-cafe-mocha text-white py-4 rounded-xl text-xs font-bold tracking-wider transition-all disabled:opacity-50 mt-4 cursor-pointer shadow-md"
                            >
                              {submitting ? 'Sedang Memperbarui...' : 'Simpan Profil Kafe'}
                            </button>
                          </form>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 2: RESERVATIONS BOOKINGS */}
                  {activeTab === 'reservasi' && (
                    <motion.div
                      key="reservasi"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-cafe-cream border border-cafe-pastel rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8"
                    >
                      <div className="flex items-center justify-between border-b border-cafe-pastel pb-4">
                        <h2 className="text-xl font-serif font-bold text-cafe-brown">
                          Daftar Reservasi Meja ({reservations.length})
                        </h2>
                        <span className="text-xs text-cafe-mocha font-bold uppercase">Atur Pemesanan</span>
                      </div>

                      {!ownerCafe ? (
                        <div className="text-center py-16 text-cafe-mocha opacity-60 bg-cafe-beige/30 rounded-2xl">
                          <Coffee size={40} className="mx-auto mb-3 text-cafe-pastel" />
                          <p className="text-xs font-bold">Harap daftarkan kafe Anda terlebih dahulu di Tab Profil.</p>
                        </div>
                      ) : reservations.length === 0 ? (
                        <div className="text-center py-20 text-cafe-mocha opacity-50 bg-cafe-beige/20 rounded-2xl">
                          <Calendar size={40} className="mx-auto mb-3 text-cafe-pastel" />
                          <p className="text-xs font-bold">Belum ada pemesanan masuk untuk {ownerCafe.name}.</p>
                          <p className="text-[10px] block mt-1 text-cafe-mocha/70">Waktu luang ini pas untuk mengatur promosi!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reservations.map((resItem) => (
                            <div 
                              key={resItem.id}
                              className="border border-cafe-pastel rounded-2xl p-6 bg-cafe-beige/20 hover:bg-cafe-beige/40 transition-colors space-y-4 relative"
                            >
                              {/* Status Badge */}
                              <div className="absolute top-6 right-6">
                                <span className={`text-[9px] uppercase font-serif tracking-wider px-3 py-1 rounded-full border ${
                                  resItem.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                  resItem.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  resItem.status === 'rejected' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                  'bg-gray-100 text-gray-700 border-gray-200/50'
                                }`}>
                                  {resItem.status === 'pending' ? 'Pending' :
                                   resItem.status === 'approved' ? 'Disetujui' :
                                   resItem.status === 'rejected' ? 'Ditolak' : 'Selesai'}
                                </span>
                              </div>

                              <div className="space-y-1 pr-16">
                                <h4 className="font-bold text-cafe-brown">{resItem.customerName}</h4>
                                <p className="text-xs text-cafe-mocha font-medium flex items-center gap-1.5"><Phone size={12} /> {resItem.customerPhone}</p>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 py-3 border-y border-cafe-pastel/60 text-xs">
                                <div>
                                  <span className="text-[9px] font-bold text-cafe-mocha/50 block uppercase tracking-wide">Tanggal Booking</span>
                                  <span className="font-semibold text-cafe-brown flex items-center gap-1.5 mt-1">
                                    <Calendar size={13} /> {resItem.bookingDate}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-cafe-mocha/50 block uppercase tracking-wide">Waktu Kedatangan</span>
                                  <span className="font-semibold text-cafe-brown flex items-center gap-1.5 mt-1">
                                    <Clock size={13} /> {resItem.bookingTime}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-cafe-mocha/50 block uppercase tracking-wide">Jumlah Anggota</span>
                                  <span className="font-semibold text-cafe-brown flex items-center gap-1.5 mt-1">
                                    <Users size={13} /> {resItem.guests} Orang
                                  </span>
                                </div>
                              </div>

                              {resItem.notes && (
                                <div className="text-xs bg-white/70 p-3 rounded-lg border border-cafe-pastel mt-2 text-cafe-mocha">
                                  <strong>Catatan Tamu:</strong> &quot;{resItem.notes}&quot;
                                </div>
                              )}

                              {/* Action buttons */}
                              {resItem.status === 'pending' && (
                                <div className="flex gap-2 pt-2 justify-end">
                                  <button
                                    onClick={() => handleReservationDecision(resItem.id, 'rejected')}
                                    className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <X size={14} /> Tolak
                                  </button>
                                  <button
                                    onClick={() => handleReservationDecision(resItem.id, 'approved')}
                                    className="px-4 py-2 bg-cafe-brown hover:bg-cafe-mocha text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Check size={14} /> Setujui Reservasi
                                  </button>
                                </div>
                              )}

                              {resItem.status === 'approved' && (
                                <div className="flex justify-end pt-2">
                                  <button
                                    onClick={() => handleReservationDecision(resItem.id, 'completed')}
                                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Check size={14} /> Selesaikan Pemesanan
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: BILLINGS & PREMIUM PROMOTION CHECKOUT */}
                  {activeTab === 'keuangan' && (
                    <motion.div
                      key="keuangan"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-cafe-cream border border-cafe-pastel rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8"
                    >
                      <div className="flex items-center justify-between border-b border-cafe-pastel pb-4">
                        <h2 className="text-xl font-serif font-bold text-cafe-brown">Keuangan &amp; Layanan Promosi</h2>
                        <span className="text-xs text-cafe-mocha font-bold uppercase">Membership</span>
                      </div>

                      {/* Promotion Boost Box */}
                      <div className="bg-gradient-to-br from-cafe-brown to-[#3E2510] text-cafe-cream rounded-3xl p-8 relative overflow-hidden shadow-lg border border-[#523A28]">
                        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 text-white">
                          <Compass size={240} />
                        </div>

                        <div className="relative z-10 max-w-lg space-y-4">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <Sparkles size={24} />
                            <span className="text-[10px] uppercase tracking-widest font-bold">Layanan Boost Paling Direkomendasikan</span>
                          </div>
                          
                          <h3 className="text-2xl md:text-3xl font-serif font-black text-white leading-tight">
                            Promosikan Kafe Anda Sebagai &quot;Rekomendasi Utama&quot;!
                          </h3>
                          <p className="text-xs text-cafe-pastel/80 leading-relaxed">
                            Peringkat teratas secara estetika memiliki jangkauan 8x lebih luas. Cafe Anda otomatis disematkan fitur bintang rekomendasi di barisan pertama beranda untuk menjamin kedatangan puluhan pelanggan setia.
                          </p>

                          <div className="flex items-baseline gap-2 pt-2">
                            <span className="text-sm font-bold text-cafe-pastel">Tarif Promosi Utama:</span>
                            <span className="text-2xl font-serif font-black text-white">Rp 250.000</span>
                            <span className="text-[10px] text-cafe-pastel/60">/ bulan masa aktif penuh</span>
                          </div>

                          {ownerCafe ? (
                            ownerCafe.featured ? (
                              <button 
                                disabled
                                className="mt-4 px-6 py-3 bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-emerald-600/50 shadow-inner"
                              >
                                <Check size={16} /> Promosi Aktif (Terbintang)
                              </button>
                            ) : (
                              <button 
                                onClick={() => openCheckout('promotion')}
                                className="mt-4 px-6 py-3 bg-white text-cafe-brown hover:bg-cafe-pastel text-xs font-black rounded-xl transition-all shadow-md cursor-pointer animate-bounce-slow"
                              >
                                Aktifkan Boost Promosi Sekarang
                              </button>
                            )
                          ) : (
                            <button 
                              disabled
                              className="mt-4 px-6 py-3 bg-white/20 text-white/50 text-xs font-bold rounded-xl"
                            >
                              Daftarkan Cafe Anda terlebih dahulu
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Transaction Log History */}
                      <div className="space-y-4">
                        <h4 className="font-serif font-bold text-cafe-brown text-base flex items-center gap-2">
                          <Receipt size={18} /> Riwayat Pembayaran &amp; Invoice
                        </h4>

                        {payments.length === 0 ? (
                          <div className="text-center py-10 text-cafe-mocha/50 bg-cafe-beige/10 rounded-2xl border border-cafe-pastel/55">
                            <Receipt size={32} className="mx-auto mb-2 text-cafe-pastel" />
                            <p className="text-xs text-cafe-mocha font-bold">Belum ada riwayat transaksi pembayaran.</p>
                          </div>
                        ) : (
                          <div className="border border-cafe-pastel rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-cafe-beige border-b border-cafe-pastel text-cafe-brown font-bold text-[10px] tracking-wider uppercase">
                                  <th className="p-4">ID Transaksi</th>
                                  <th className="p-4">Tipe Pembayaran</th>
                                  <th className="p-4">Metode</th>
                                  <th className="p-4">Tanggal Tagihan</th>
                                  <th className="p-4">Jumlah</th>
                                  <th className="p-4">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-cafe-pastel/65">
                                {payments.map((p) => (
                                  <tr key={p.id} className="hover:bg-cafe-beige/25">
                                    <td className="p-4 font-mono font-bold text-cafe-brown">{p.id}</td>
                                    <td className="p-4 text-cafe-mocha font-medium">
                                      {p.type === 'registration' ? 'Registrasi Pendaftaran Kafe' : 'Premium Boost / Promosi Rekomendasi'}
                                    </td>
                                    <td className="p-4 text-cafe-mocha">{p.method}</td>
                                    <td className="p-4 text-cafe-mocha/80">{new Date(p.createdAt).toLocaleDateString('id-ID')}</td>
                                    <td className="p-4 font-bold text-cafe-brown">Rp {p.amount.toLocaleString('id-ID')}</td>
                                    <td className="p-4">
                                      {p.status === 'success' ? (
                                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                          Lunas (Verified)
                                        </span>
                                      ) : p.status === 'rejected' ? (
                                        <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                          Ditolak
                                        </span>
                                      ) : (
                                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                                          Menunggu Verifikasi
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Checkout Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-cafe-cream border border-cafe-pastel rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-cafe-pastel transition-colors text-cafe-brown"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-1">
                <h3 className="font-serif font-black text-xl text-cafe-brown">Checkout Layanan</h3>
                <p className="text-xs text-cafe-mocha/70">Selesaikan transaksi lunas secara instan &amp; aman.</p>
              </div>

              <div className="bg-cafe-beige/50 border border-cafe-pastel p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-cafe-mocha">Nama Layanan:</span>
                  <span className="font-bold text-cafe-brown">
                    {paymentType === 'promotion' ? 'Promosi Paling Direkomendasikan' : 'Registrasi Akun Kafe'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cafe-mocha">Email Pemilik:</span>
                  <span className="font-mono text-cafe-brown">{ownerData?.email}</span>
                </div>
                <div className="h-px bg-cafe-pastel my-2 w-full"></div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-cafe-brown">Total Pembayaran:</span>
                  <span className="font-serif font-black text-cafe-brown">Rp {payAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-cafe-brown uppercase block">Pilih Cara Pembayaran</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-4 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'QRIS' 
                        ? 'bg-cafe-brown text-white border-cafe-brown shadow-md' 
                        : 'bg-white border-cafe-pastel text-cafe-mocha hover:bg-cafe-beige/65'
                    }`}
                  >
                    <CreditCard size={18} />
                    QRIS (Instan)
                  </button>

                  <button
                    onClick={() => setPaymentMethod('Transfer Bank')}
                    className={`p-4 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === 'Transfer Bank' 
                        ? 'bg-cafe-brown text-white border-cafe-brown shadow-md' 
                        : 'bg-white border-cafe-pastel text-cafe-mocha hover:bg-cafe-beige/65'
                    }`}
                  >
                    <Landmark size={18} />
                    Transfer Bank
                  </button>
                </div>
              </div>

              {/* Instan QRIS screen display */}
              {paymentMethod === 'QRIS' ? (
                <div className="bg-white p-6 rounded-2xl text-center space-y-3 shadow-inner border border-cafe-pastel/60">
                  <div className="w-40 h-40 mx-auto bg-gray-50 flex items-center justify-center rounded-xl p-2 select-none border">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=412411&data=qris-angstria-hangout-pangkalpinang" 
                      alt="Real-time QRIS Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="font-bold text-cafe-brown text-xs">QRIS Wajib Angstria Hangout</p>
                  <div className="text-[10px] text-cafe-mocha leading-relaxed max-w-sm mx-auto">
                    Pindai kode QRIS di atas menggunakan dompet digital Anda (GOPAY, OVO, DANA, LinkAja, atau m-Banking) saat proses simulasi.
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl text-xs space-y-3 border border-cafe-pastel/65">
                  <p className="text-center font-bold text-cafe-brown uppercase text-[10px]">Detail Pengiriman Rekening</p>
                  
                  <div className="space-y-1 text-center bg-cafe-beige/30 p-3 rounded-lg">
                    <span className="text-[10px] text-cafe-mocha block">Nomor Rekening Bank (Dummy)</span>
                    <strong className="text-sm font-mono text-cafe-brown select-all">120-00-1123456-7</strong>
                    <span className="text-[10px] block text-cafe-mocha font-bold mt-1">Bank Mandiri a/n Angstria Hangout</span>
                  </div>
                </div>
              )}

              {/* Upload Proof Area */}
              <div className="space-y-2 border-t border-cafe-pastel pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-cafe-brown uppercase block">Unggah Bukti Transaksi</span>
                  <span className="text-[9px] text-rose-600 font-extrabold uppercase bg-rose-50 px-2 py-0.5 rounded">Wajib</span>
                </div>
                <div className="border-2 border-dashed border-cafe-pastel hover:border-cafe-brown/50 rounded-2xl p-4 bg-white text-center transition-all relative">
                  {paymentProof ? (
                    <div className="space-y-2">
                      <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border border-cafe-pastel">
                        <img src={paymentProof} alt="Bukti Pembayaran" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setPaymentProof('')}
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                          title="Hapus Bukti"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                        ✓ Bukti berhasil dimuat
                      </p>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-3">
                      <Camera size={26} className="text-cafe-mocha/60 hover:scale-110 transition-transform" />
                      <span className="text-xs font-black text-cafe-brown">Pilih Gambar / Ambil Foto Bukti</span>
                      <span className="text-[9px] text-cafe-mocha/50">PNG, JPG, JPEG (Maks. 800KB)</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 850 * 1024) {
                            alert('File gambar bukti pembayaran terlalu besar! Harap gunakan file di bawah 800KB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPaymentProof(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                onClick={processPaymentSubmit}
                disabled={submitting || !paymentProof}
                className={`w-full text-xs font-black py-4 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                  !paymentProof 
                    ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                    : 'bg-cafe-brown hover:bg-cafe-mocha text-white hover:scale-[1.02]'
                }`}
              >
                {submitting ? 'Menyimpan Bukti...' : !paymentProof ? 'Unggah Bukti Bayar Terlebih Dahulu' : 'Kirim Bukti Pembayaran'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OwnerDashboard;
