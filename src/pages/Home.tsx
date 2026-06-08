import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ArrowRight, 
  Coffee, 
  Star, 
  MapPin, 
  Search, 
  Laptop, 
  Moon, 
  Wallet, 
  Trees, 
  Plus, 
  Map as MapIcon,
  Quote,
  Sparkles,
  Database
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { placesService, isDatabaseDemoMode } from '../services/dbService';
import { Place } from '../types';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home: React.FC = () => {
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchPlaces = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const places = await placesService.getFeaturedPlaces();
      setFeaturedPlaces(places);
    } catch (error: any) {
      console.error("Error fetching featured places:", error);
      setErrorMsg(error.message || 'Gagal memuat data dari database MySQL phpMyAdmin Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (featuredPlaces.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredPlaces.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featuredPlaces]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/places?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % featuredPlaces.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + featuredPlaces.length) % featuredPlaces.length);

  const categories = [
    { name: 'Aesthetic Cafe', label: 'Kafe Estetik', icon: <Sparkles />, color: 'bg-orange-50 text-orange-600' },
    { name: 'Work From Cafe', label: 'Kerja di Kafe', icon: <Laptop />, color: 'bg-blue-50 text-blue-600' },
    { name: 'Night Hangout', label: 'Nongkrong Malam', icon: <Moon />, color: 'bg-purple-50 text-purple-600' },
    { name: 'Budget Places', label: 'Ramah Kantong', icon: <Wallet />, color: 'bg-green-50 text-green-600' },
    { name: 'Outdoor Spots', label: 'Area Luar', icon: <Trees />, color: 'bg-emerald-50 text-emerald-600' },
  ];

  const testimonials = [
    {
      name: "Astriani",
      role: "Desainer Grafis",
      text: "Warung Kopi Tung Tau adalah tempat favorit saya untuk kerja fokus. Suasananya tenang dan kopinya legendaris!",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
      name: "Marcus Chen",
      role: "Blogger Kopi",
      text: "Menemukan latte art yang paling fotogenik di Pangkal Pinang berkat situs ini. Benar-benar dikurasi untuk jiwa pencinta estetika.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
      name: "Dewi Anggraini",
      role: "Digital Nomad",
      text: "Filter ramah kantong di sini sangat menghemat waktu saya. Banyak rekomendasi kafe bagus yang tidak membuat dompet tipis.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-cafe-cream min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative min-h-[65vh] md:min-h-[75vh] flex items-center pt-16 pb-12 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-soft-green/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cafe-pastel/30 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4 -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-black text-cafe-brown leading-[1.15] tracking-tight">
              Temukan Tempat <br />
              <span className="text-sage italic">Nongkrong Estetik</span> <br />
              di Pangkal Pinang
            </h1>
            
            <p className="text-sm md:text-base text-cafe-mocha leading-relaxed max-w-lg">
              Ucapkan selamat tinggal pada sore yang membosankan. Temukan suasana sempurna untuk bekerja, kencan, atau santai akhir pekan bersama teman.
            </p>

            <form onSubmit={handleSearch} className="relative max-w-lg group">
              <input 
                type="text" 
                placeholder="Cari nama kafe, suasana, atau fasilitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-14 pr-32 h-16"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-cafe-mocha/40 group-focus-within:text-cafe-brown transition-colors" size={24} />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-cafe-brown text-white h-12 px-6 rounded-xl font-medium hover:bg-cafe-mocha transition-all">
                Cari
              </button>
            </form>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="user" />
                ))}
              </div>
              <p className="text-xs text-cafe-mocha/60">
                <span className="font-bold text-cafe-mocha">10rb+</span> orang mengeksplorasi minggu ini
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-cafe-cream aspect-[4/5]">
              <img 
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000" 
                alt="Cozy Cafe" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Float cards */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -left-12 top-1/4 z-20 bg-cafe-cream/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-cafe-pastel/50 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Coffee />
              </div>
              <div>
                <p className="text-xs font-bold text-cafe-brown">Espreso Terbaik</p>
                <div className="flex text-yellow-400">
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                  <Star size={10} fill="currentColor" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -right-8 bottom-1/4 z-20 bg-cafe-cream/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-cafe-pastel/50 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Laptop />
              </div>
              <div>
                <p className="text-xs font-bold text-cafe-brown">Ramah Laptop</p>
                <p className="text-[10px] text-cafe-mocha/60 italic">WiFi Kencang Gratis</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20 px-6 bg-cafe-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-black text-cafe-brown mb-3">Pilih Vibe Anda</h2>
            <p className="text-sm text-cafe-mocha/70">Sudut-sudut estetik yang dipilih khusus sesuai suasana hati Anda.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="group p-5 md:p-6 rounded-3xl border border-cafe-pastel bg-cafe-beige hover:border-sage hover:bg-soft-green/20 transition-all text-center cursor-pointer"
                onClick={() => navigate(`/places?tag=${cat.name}`)}
              >
                <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                  {React.cloneElement(cat.icon as React.ReactElement, { size: 24 })}
                </div>
                <h3 className="font-bold text-cafe-brown text-xs md:text-sm">{cat.label}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Slides Section */}
      <section className="py-24 px-6 bg-cafe-cream overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-cafe-brown mb-4 tracking-tight">
                Pilihan <span className="text-sage">Editor</span>
              </h2>
              <p className="text-cafe-mocha/70">
                Destinasi pilihan terbaik yang mendefinisikan estetika kota keindahan visual.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={prevSlide}
                className="w-12 h-12 rounded-full border border-cafe-pastel flex items-center justify-center text-cafe-brown hover:bg-cafe-brown hover:text-white transition-all"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <button 
                onClick={nextSlide}
                className="w-12 h-12 rounded-full border border-cafe-pastel flex items-center justify-center text-cafe-brown hover:bg-cafe-brown hover:text-white transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : featuredPlaces.length > 0 ? (
            <div className="relative h-[280px] sm:h-[340px] md:h-[400px] rounded-3xl overflow-hidden shadow-xl border border-cafe-pastel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <img 
                    src={featuredPlaces[currentSlide].image} 
                    alt={featuredPlaces[currentSlide].name}
                    className="w-full h-full object-cover animate-pulse-subtle"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="max-w-2xl space-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-sage text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                          Rekomendasi Utama
                        </span>
                        <div className="flex items-center gap-1 text-white/90 text-xs font-bold bg-black/20 backdrop-blur px-2 py-0.5 rounded-full">
                          <Star size={12} className="fill-yellow-500 text-yellow-500" />
                          {featuredPlaces[currentSlide].rating}
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black text-white leading-tight">
                        {featuredPlaces[currentSlide].name}
                      </h3>
                      <p className="text-white/85 text-xs sm:text-sm max-w-xl line-clamp-2 leading-relaxed">
                        {featuredPlaces[currentSlide].description}
                      </p>
                      <div className="flex flex-wrap gap-2.5 pt-1.5">
                        <Link 
                           to={`/places/${featuredPlaces[currentSlide].id}`}
                           className="btn-primary bg-white text-cafe-brown hover:bg-sage hover:text-white border-0 px-5 py-2.5 text-xs shadow"
                        >
                           Explore Details
                        </Link>
                        <button 
                          onClick={() => navigate(`/places?search=${featuredPlaces[currentSlide].location}`)}
                          className="px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-full font-bold border border-white/20 hover:bg-white/20 text-xs"
                        >
                          View Map
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress Dots */}
              <div className="absolute bottom-8 right-8 md:right-16 flex gap-2">
                {featuredPlaces.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-cafe-cream border border-cafe-pastel rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto animate-bounce-subtle">
                <Coffee size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg text-cafe-brown">Belum Ada Rekomendasi Kafe</h3>
              {errorMsg ? (
                <div className="p-4 bg-orange-50/60 text-orange-850 text-xs rounded-2xl text-left border border-orange-200/50 space-y-1.5 font-sans">
                  <p className="font-bold text-orange-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Status Sinkronisasi:
                  </p>
                  <p className="leading-relaxed text-[11px] font-medium">{errorMsg}</p>
                </div>
              ) : (
                <p className="text-xs text-cafe-mocha leading-relaxed">
                  Data kafe saat ini sedang kosong. Silakan masuk ke <strong>Dasbor Admin</strong> untuk mendaftarkan kafe baru.
                </p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={fetchPlaces}
                  className="px-6 py-2.5 border border-cafe-pastel hover:bg-cafe-pastel text-xs font-semibold rounded-full transition-all text-cafe-brown cursor-pointer"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Popular Places Section */}
      <section className="py-16 md:py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-serif font-black text-cafe-brown mb-3">
              Sedang Tren
            </h2>
            <p className="text-sm text-cafe-mocha/70">
              Favorit mutlak komunitas bulan ini. Kopi berkualitas tinggi, suasana nyaman, dan pelayanan ramah.
            </p>
          </div>
          <Link to="/places" className="btn-secondary flex items-center gap-2 group text-sm px-6 py-2.5">
            Browse All Spots <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : featuredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredPlaces.map((place, idx) => (
              <PlaceCard key={place.id} place={place} index={idx} />
            ))}
          </div>
        ) : (
          <div className="bg-cafe-cream border border-cafe-pastel rounded-3xl p-10 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <span className="inline-block p-4 bg-orange-50 text-orange-700 rounded-full animate-pulse-subtle">
              <Coffee size={32} />
            </span>
            <h3 className="font-serif font-black text-xl text-cafe-brown">Daftar Kafe Belum Tersedia</h3>
            {errorMsg ? (
              <div className="p-4 bg-orange-50/60 text-orange-850 text-xs rounded-2xl text-left border border-orange-200/50 space-y-1.5 font-sans max-w-md mx-auto">
                <p className="font-bold text-orange-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Status Sinkronisasi:
                </p>
                <p className="leading-relaxed text-[11px] font-medium">{errorMsg}</p>
              </div>
            ) : (
              <p className="text-xs text-cafe-mocha leading-relaxed font-medium">
                Belum ada data kafe yang tersedia di database Anda. Anda dapat mendaftarkan kafe baru melalui <strong>Dasbor Admin</strong>.
              </p>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button 
                onClick={fetchPlaces}
                className="px-6 py-2 border border-cafe-pastel hover:bg-cafe-pastel text-xs font-bold rounded-full transition-all text-cafe-brown cursor-pointer"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Nearby Places & Map Section */}
      <section className="py-16 md:py-20 px-6 bg-cafe-brown text-cafe-cream relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black leading-tight">
              Temukan Cafe <br />
              <span className="text-soft-green">Terdekat Dari Anda</span>
            </h2>
            <p className="text-cafe-cream/70 text-sm md:text-base">
              Kami menggunakan lokasi Anda untuk menemukan sudut-sudut estetik tersembunyi terdekat. Nikmati suasana yang sempurna di wilayah Pangkal Pinang.
            </p>
            
            <div className="space-y-4">
              {featuredPlaces.length > 0 ? (
                featuredPlaces.slice(0, 3).map((place, i) => (
                  <div 
                    key={place.id} 
                    onClick={() => navigate(`/places/${place.id}`)}
                    className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-soft-green rounded-xl flex items-center justify-center text-cafe-brown">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="font-bold">{place.name}</p>
                        <p className="text-xs text-cafe-cream/50">{place.location || 'Di Pangkal Pinang'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-soft-green">{i === 0 ? '0.5 km' : i === 1 ? '1.2 km' : '2.1 km'}</p>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Star size={10} className="fill-yellow-400 text-yellow-400 animate-pulse-subtle" /> {place.rating || '4.5'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center space-y-2">
                  <Coffee className="mx-auto text-soft-green opacity-60 animate-bounce" size={32} />
                  <p className="font-bold text-sm">Tidak ada cafe terdekat aktif</p>
                  <p className="text-xs text-cafe-cream/60">Silakan tambahkan cafe baru lewat menu Dasbor Admin agar tampil sebagai cafe terdekat.</p>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/places')} className="btn-primary bg-soft-green text-cafe-brown hover:bg-white w-full sm:w-auto">
              Lihat Semua Terdekat
            </button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-soft-green/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden border-8 border-cafe-cream shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
                alt="Map Preview" 
                className="w-full h-full object-cover grayscale brightness-50 contrast-125"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-cafe-cream/90 backdrop-blur-md p-8 rounded-full shadow-2xl animate-pulse">
                  <MapIcon size={48} className="text-cafe-brown" />
                </div>
              </div>
              <div className="absolute bottom-8 left-8 right-8 bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                <p className="text-xs font-bold text-soft-green uppercase tracking-widest mb-2">Peta Interaktif</p>
                <p className="text-sm font-light text-white">Pelacakan interaktif dan indikator ketersediaan tempat real-time segera hadir.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-cafe-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold text-cafe-brown mb-4">Dicintai oleh Komunitas</h2>
            <p className="text-cafe-mocha/70 italic max-w-lg mx-auto">Bergabunglah dengan ribuan pencinta kopi dalam menemukan ruang favorit mereka.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-cafe-beige p-8 rounded-[2.5rem] border border-cafe-pastel shadow-sm relative"
              >
                <Quote className="absolute top-8 right-8 text-cafe-pastel" size={40} />
                <div className="flex items-center gap-4 mb-8">
                  <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full border-2 border-cafe-pastel" />
                  <div>
                    <h4 className="font-bold text-cafe-brown">{t.name}</h4>
                    <p className="text-xs text-cafe-mocha/60">{t.role}</p>
                  </div>
                </div>
                <p className="text-cafe-mocha leading-relaxed italic">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-soft-green/20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-cafe-brown rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
                Punya Kafe Estetik yang Wajib Diketahui Banyak Orang?
              </h2>
              <p className="text-white/70 text-lg">
                Bergabunglah dengan direktori pilihan kami dan biarkan tempat Anda ditemukan oleh ribuan pencinta kopi dan petualang aktif setiap bulan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link to="/owner" className="btn-primary bg-white text-cafe-brown hover:bg-soft-green px-12 flex items-center justify-center gap-2">
                  <Plus size={20} /> Daftarkan Kafe Anda
                </Link>
                <Link to="/about" className="px-12 py-3 bg-white/10 backdrop-blur-md text-white rounded-full font-bold border border-white/20 hover:bg-white/20 text-center">
                  Pelajari Lebih Lanjut
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;
