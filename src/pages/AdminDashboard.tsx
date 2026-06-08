import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, LayoutDashboard, Coffee, 
  MapPin, Clock, Camera, Save, X, LogOut, 
  Star, Eye, Sparkles, CheckCircle, AlertCircle, Download, RefreshCcw,
  Calendar, MessageSquare, User, Phone, Shield, CreditCard, TrendingUp, Image as ImageIcon
} from 'lucide-react';
import { placesService, reservationsService, commentsService, paymentsService, adminService } from '../services/dbService';
import { Place } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

interface AdminDashboardProps {
  user: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlace, setEditingPlace] = useState<Partial<Place> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'places' | 'reservations' | 'comments' | 'payments'>('places');
  const [reservations, setReservations] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // New admin states for payments and general database analytics (data keseluruhan)
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'gallery') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Firestore has 1MB limit per document. 800KB is a safe buffer for Base64.
    if (file.size > 800 * 1024) {
      setStatus({ type: 'error', message: 'Image too large! Use a file under 800KB.' });
      setTimeout(() => setStatus(null), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (target === 'image') {
        setEditingPlace(prev => ({ ...prev, image: base64String }));
      } else {
        setEditingPlace(prev => ({ 
          ...prev, 
          images: prev?.images ? [...prev.images, base64String] : [base64String] 
        }));
      }
      setStatus({ type: 'success', message: 'Image processed successfully!' });
      setTimeout(() => setStatus(null), 3000);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  useEffect(() => {
    if (user) {
      fetchPlaces();
    }
  }, [user]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const data = await placesService.getAllPlaces();
      setPlaces(data);
      // Fetch reservations in background
      fetchReservations(data);
      // Fetch comments in background
      fetchComments(data);
      // Fetch admin stats (data keseluruhan)
      fetchAdminStats();
      // Fetch payments (bukti pembayaran kafe promosi)
      fetchPayments();
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Gagal memuat data dari database MySQL.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const stats = await adminService.getStats();
      setAdminStats(stats);
    } catch (e) {
      console.warn("Gagal memuat statistik platform:", e);
    }
  };

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const payList = await paymentsService.getAllPayments();
      setPayments(payList);
    } catch (e) {
      console.warn("Gagal memuat daftar pembayaran:", e);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleApprovePayment = async (id: string, newStatus: 'success' | 'rejected') => {
    try {
      setStatus({ type: 'success', message: 'Sedang memproses verifikasi transaksi...' });
      await paymentsService.approvePayment(id, newStatus);
      setStatus({ 
        type: 'success', 
        message: `Pembayaran ${id} berhasil ${newStatus === 'success' ? 'DISETUJUI (LUNAS) & Kafe otomatis dipromosikan!' : 'DITOLAK'}!` 
      });
      // Refresh all data
      await fetchPlaces();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Gagal mengubah status verifikasi pembayaran.' });
    } finally {
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const fetchReservations = async (currentPlaces: Place[]) => {
    setLoadingReservations(true);
    try {
      const results: any[] = [];
      const promises = currentPlaces.map(async (place) => {
        try {
          const resList = await reservationsService.getReservations({ placeId: place.id });
          return resList.map((r: any) => ({ ...r, placeName: place.name }));
        } catch (e) {
          return [];
        }
      });
      const resolvedList = await Promise.all(promises);
      resolvedList.forEach(list => results.push(...list));
      results.sort((a, b) => b.id - a.id);
      setReservations(results);
    } catch (err) {
      console.warn("Gagal memuat daftar reservasi:", err);
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchComments = async (currentPlaces: Place[]) => {
    setLoadingComments(true);
    try {
      const results: any[] = [];
      const promises = currentPlaces.map(async (place) => {
        try {
          const placeDetail = await placesService.getPlaceById(place.id);
          if (placeDetail && placeDetail.comments) {
            return placeDetail.comments.map((c: any) => ({ ...c, placeId: place.id, placeName: place.name }));
          }
          return [];
        } catch (e) {
          return [];
        }
      });
      const resolvedList = await Promise.all(promises);
      resolvedList.forEach(list => results.push(...list));
      results.sort((a, b) => b.id - a.id);
      setComments(results);
    } catch (err) {
      console.warn("Gagal memuat ulasan komunitas:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpdateReservationStatus = async (id: number, newStatus: 'approved' | 'rejected') => {
    try {
      setStatus({ type: 'success', message: 'Sedang memperbarui status...' });
      await reservationsService.updateReservationStatus(id, newStatus);
      setStatus({ type: 'success', message: `Status reservasi berhasil diubah menjadi ${newStatus === 'approved' ? 'Disetujui' : 'Ditolak'}!` });
      fetchPlaces();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Gagal memperbarui status reservasi.' });
    } finally {
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('angstria_admin_session');
    window.dispatchEvent(new Event('admin-auth-changed'));
    navigate('/login');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace) return;

    try {
      if (editingPlace.id) {
        await placesService.updatePlace(editingPlace.id, editingPlace);
        setStatus({ type: 'success', message: 'Kafe berhasil diperbarui!' });
      } else {
        await placesService.createPlace(editingPlace as any);
        setStatus({ type: 'success', message: 'Kafe baru berhasil ditambahkan!' });
      }
      setIsModalOpen(false);
      setEditingPlace(null);
      fetchPlaces();
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Gagal menyimpan perubahan. Silakan periksa koneksi database Anda.' });
    } finally {
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kafe ini secara permanen dari database MySQL?')) {
      try {
        await placesService.deletePlace(id);
        fetchPlaces();
        setStatus({ type: 'success', message: 'Kafe berhasil dihapus secara permanen.' });
      } catch (err: any) {
        setStatus({ type: 'error', message: err.message || 'Gagal menghapus kafe.' });
      }
      setTimeout(() => setStatus(null), 5000);
    }
  };

  const exportToCSV = () => {
    if (places.length === 0) {
      setStatus({ type: 'error', message: 'Tidak ada data kafe untuk diekspor.' });
      return;
    }
    const headers = ['Nama', 'Deskripsi', 'Lokasi', 'Rating', 'Rentang Harga', 'Jam Operasional', 'Total Kunjungan', 'Fasilitas'];
    const rows = places.map(p => [
      p.name,
      p.description?.replace(/"/g, '""') || '',
      p.location,
      p.rating,
      p.priceRange,
      p.openingHours,
      p.views,
      p.facilities?.join(', ') || ''
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.setAttribute("download", "ekspor_kafe_pangkal_pinang.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setStatus({ type: 'success', message: 'Data kafe Pangkal Pinang berhasil diekspor ke CSV!' });
    setTimeout(() => setStatus(null), 5000);
  };

  const exportToJSON = () => {
    if (places.length === 0) {
      setStatus({ type: 'error', message: 'Tidak ada data kafe untuk diekspor.' });
      return;
    }
    const blob = new Blob([JSON.stringify(places, null, 2)], { type: 'application/json;charset=utf-8;' });
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.setAttribute("download", "ekspor_kafe_pangkal_pinang.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setStatus({ type: 'success', message: 'Data kafe Pangkal Pinang berhasil diekspor ke JSON!' });
    setTimeout(() => setStatus(null), 5000);
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-cafe-beige min-h-screen pt-12 pb-24 px-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cafe-brown text-cafe-cream rounded-2xl">
                <LayoutDashboard size={24} />
              </div>
              <h1 className="text-4xl font-serif font-bold text-cafe-brown tracking-tight">Dasbor Admin</h1>
            </div>
            <p className="text-cafe-mocha/70 max-w-xl">
              Masuk sebagai <span className="font-bold text-cafe-brown">{user.email}</span>. Kelola daftar kafe, pantau interaksi, dan perbarui ulasan komunitas.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={exportToCSV}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg text-sm"
              title="Ekspor daftar kafe ke format Microsoft Excel / CSV"
            >
              <Download size={18} /> Ekspor CSV
            </button>
            <button 
              onClick={exportToJSON}
              className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-amber-700 transition-all shadow-lg text-sm"
              title="Ekspor daftar kafe ke format JSON"
            >
              <Download size={18} /> Ekspor JSON
            </button>

            <button 
              onClick={() => { setEditingPlace({}); setIsModalOpen(true); }}
              className="px-6 py-3 bg-cafe-brown text-cafe-cream rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg text-sm cursor-pointer"
            >
              <Plus size={18} /> Tambah Kafe Baru
            </button>
            <button 
              onClick={handleLogout}
              className="p-3 bg-white text-red-500 rounded-2xl hover:bg-red-50 transition-all shadow-sm border border-cafe-pastel"
              title="Keluar"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 font-medium ${
                status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
              }`}
            >
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {status.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row - Data Keseluruhan Platform */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Kafe', value: places.length, icon: <Coffee size={20} />, color: 'text-orange-500' },
            { label: 'Total Reservasi', value: reservations.length, icon: <Calendar size={20} />, color: 'text-blue-500' },
            { label: 'Rating Rata-rata', value: (places.reduce((acc, p) => acc + (p.rating || 0), 0) / (places.length || 1)).toFixed(1), icon: <Star size={20} />, color: 'text-yellow-500' },
            { label: 'Total Ulasan', value: comments.length, icon: <MessageSquare size={20} />, color: 'text-purple-500' },
            { label: 'Pemilik Kafe Terdaftar', value: adminStats?.ownersCount ?? 0, icon: <Shield size={20} />, color: 'text-amber-600' },
            { label: 'Pengguna Aktif', value: adminStats?.usersCount ?? 0, icon: <User size={20} />, color: 'text-indigo-500' },
            { label: 'Total Transaksi', value: adminStats?.paymentsCount ?? payments.length, icon: <CreditCard size={20} />, color: 'text-teal-500' },
            { label: 'Pendapatan (Verified)', value: `Rp ${(adminStats?.revenue ?? 0).toLocaleString('id-ID')}`, icon: <TrendingUp size={20} />, color: 'text-emerald-500' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-cafe-cream p-5 rounded-2xl border border-cafe-pastel flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-cafe-beige rounded-xl flex items-center justify-center shrink-0">
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-bold text-cafe-mocha/50 tracking-wider truncate">{stat.label}</p>
                <h4 className="text-base font-bold text-cafe-brown truncate">{stat.value}</h4>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cafe-pastel gap-6 mb-8 overflow-x-auto pb-1 scrollbar-thin">
          <button 
            onClick={() => setActiveTab('places')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'places' ? 'border-cafe-brown text-cafe-brown' : 'border-transparent text-cafe-mocha/60'
            }`}
          >
            📋 Daftar Kafe ({places.length})
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'reservations' ? 'border-cafe-brown text-cafe-brown' : 'border-transparent text-cafe-mocha/60'
            }`}
          >
            📅 Reservasi Meja ({reservations.length})
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'comments' ? 'border-cafe-brown text-cafe-brown' : 'border-transparent text-cafe-mocha/60'
            }`}
          >
            💬 Ulasan Komunitas ({comments.length})
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'payments' ? 'border-cafe-brown text-cafe-brown' : 'border-transparent text-cafe-mocha/60'
            }`}
          >
            💳 Bukti Pembayaran ({payments.length})
          </button>
        </div>

        {/* Table/List Area */}
        <div className="bg-cafe-cream rounded-[2rem] border border-cafe-pastel overflow-hidden shadow-lg">
          {activeTab === 'places' && (
            <table className="w-full text-left">
              <thead className="bg-cafe-beige/50 border-b border-cafe-pastel">
                <tr>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Informasi Kafe</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Status</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Metrik</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-pastel">
                {loading ? (
                  <tr><td colSpan={4}><LoadingSpinner /></td></tr>
                ) : places.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-16 px-8 text-cafe-mocha">
                      <p className="italic opacity-60 mb-2">Kafe tidak ditemukan di database phpMyAdmin Anda.</p>
                      <p className="text-xs opacity-50">Silakan tambahkan kafe baru menggunakan tombol <strong>Tambah Kafe Baru</strong> di atas.</p>
                    </td>
                  </tr>
                ) : (
                  places.map((place) => (
                    <tr key={place.id} className="hover:bg-cafe-beige/20 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img src={place.image} className="w-16 h-16 rounded-xl object-cover border border-cafe-pastel" alt={place.name} />
                          <div>
                            <h4 className="font-bold text-cafe-brown mb-1">{place.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-cafe-mocha/60">
                              <MapPin size={12} /> {place.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          {place.featured ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-full w-max border border-yellow-200">
                               <Sparkles size={10} /> Unggulan
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cafe-beige text-cafe-mocha text-[10px] font-bold rounded-full w-max border border-cafe-pastel">
                            Diterbitkan
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cafe-brown">
                            <Eye size={14} className="text-blue-400" /> {place.views}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-cafe-brown">
                            <Star size={14} className="text-yellow-400 fill-yellow-400" /> {place.rating}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => { setEditingPlace(place); setIsModalOpen(true); }}
                            className="p-2 text-cafe-mocha hover:text-cafe-brown bg-cafe-beige rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(place.id)}
                            className="p-2 text-red-300 hover:text-red-500 bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'reservations' && (
            <table className="w-full text-left">
              <thead className="bg-cafe-beige/50 border-b border-cafe-pastel">
                <tr>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Kafe & Pemesan</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Detail Kontak</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Jadwal & Tamu</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha text-right">Status / Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-pastel">
                {loadingReservations ? (
                  <tr><td colSpan={4}><LoadingSpinner /></td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-20 text-cafe-mocha opacity-40 italic">Belum ada pemesanan meja masuk saat ini.</td></tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-cafe-beige/20 transition-colors">
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="font-serif font-black text-xs text-cafe-mocha uppercase tracking-wider">{res.placeName || 'Kafe'}</p>
                          <h4 className="font-bold text-cafe-brown text-base">{res.customerName}</h4>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-xs text-cafe-mocha">
                          <Phone size={14} className="text-cafe-mocha/60" />
                          <span>{res.customerPhone}</span>
                        </div>
                        {res.notes && (
                          <p className="text-[11px] leading-relaxed italic bg-amber-500/5 text-cafe-brown px-3 py-1 bg-cafe-beige rounded-lg border border-cafe-pastel w-max mt-2">
                             "{res.notes}"
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-6 text-sm text-cafe-brown">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <Calendar size={14} className="text-cafe-brown/60" /> {res.bookingDate} pada {res.bookingTime}
                        </div>
                        <p className="text-xs text-cafe-mocha/70">Jumlah Tamu: <strong className="text-cafe-brown">{res.guests} Kursi</strong></p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end gap-2.5">
                          <div>
                            {res.status === 'approved' ? (
                              <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                                 Disetujui
                              </span>
                            ) : res.status === 'rejected' ? (
                              <span className="px-3.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200">
                                 Ditolak
                              </span>
                            ) : (
                              <span className="px-3.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 animate-pulse">
                                 Menunggu
                              </span>
                            )}
                          </div>
                          
                          {res.status === 'pending' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateReservationStatus(res.id, 'approved')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
                              >
                                Setujui
                              </button>
                              <button 
                                onClick={() => handleUpdateReservationStatus(res.id, 'rejected')}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'comments' && (
            <table className="w-full text-left">
              <thead className="bg-cafe-beige/50 border-b border-cafe-pastel">
                <tr>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Nama Kafe</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Reviewer & Waktu</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Bintang</th>
                  <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Komentar Masukan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-pastel">
                {loadingComments ? (
                  <tr><td colSpan={4}><LoadingSpinner /></td></tr>
                ) : comments.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-20 text-cafe-mocha opacity-40 italic">Belum ada komentar/ulasan dari petualang kuliner.</td></tr>
                ) : (
                  comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-cafe-beige/20 transition-colors">
                      <td className="px-8 py-6">
                        <span className="font-serif font-black text-xs text-cafe-brown block mb-1 uppercase tracking-wider">{comment.placeName || 'Kafe'}</span>
                      </td>
                      <td className="px-8 py-6">
                        <h4 className="font-bold text-cafe-brown text-sm mb-1">{comment.username}</h4>
                        <p className="text-[11px] text-cafe-mocha/60">{new Date(comment.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-1 text-yellow-500 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-yellow-200/40 w-max">
                          <Star size={12} className="fill-yellow-500" />
                          <span className="text-xs font-bold text-cafe-brown">{comment.rating}.0</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-cafe-mocha leading-relaxed italic max-w-xl">
                          "{comment.comment}"
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-cafe-beige/50 border-b border-cafe-pastel">
                  <tr>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">ID Transaksi</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Nama Kafe / Pemilik</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Tipe Transaksi</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Jumlah</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Bukti Transfer</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha">Status</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-cafe-mocha text-right">Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cafe-pastel">
                  {loadingPayments ? (
                    <tr><td colSpan={7}><LoadingSpinner /></td></tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-cafe-mocha opacity-40 italic">
                        Belum ada riwayat pendaftaran atau promosi yang masuk dari para owner.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const isPromotion = p.type === 'promotion';
                      return (
                        <tr key={p.id} className="hover:bg-cafe-beige/20 transition-colors">
                          <td className="px-8 py-6 font-mono font-bold text-xs text-cafe-brown">
                            {p.id}
                          </td>
                          <td className="px-8 py-6">
                            <h4 className="font-bold text-cafe-brown text-sm mb-1">
                              {p.cafeName || 'Pendaftaran Owner'}
                            </h4>
                            <p className="text-[11px] text-cafe-mocha/60 truncate max-w-[180px]" title={p.ownerEmail}>
                              {p.ownerEmail}
                            </p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                              isPromotion 
                                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {isPromotion ? '📢 Promosi Utama (Featured)' : '🔑 Registrasi Akun Kafe'}
                            </span>
                            <span className="text-[9.5px] text-cafe-mocha/70 block mt-1">
                              Metode: <strong className="text-cafe-brown font-mono">{p.method}</strong>
                            </span>
                          </td>
                          <td className="px-8 py-6 font-black text-xs text-cafe-brown">
                            Rp {parseFloat(p.amount).toLocaleString('id-ID')}
                          </td>
                          <td className="px-8 py-6">
                            {p.proof ? (
                              <button 
                                onClick={() => setSelectedProofUrl(p.proof)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cafe-brown text-cafe-cream hover:bg-cafe-mocha hover:scale-105 transition-all rounded-lg text-[10px] font-bold shadow-sm cursor-pointer"
                              >
                                <ImageIcon size={13} /> Lihat Bukti
                              </button>
                            ) : (
                              <span className="text-xs text-cafe-mocha/40 italic">Tidak ada bukti</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            {p.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-250">
                                ✓ Lunas (Verified)
                              </span>
                            ) : p.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-250">
                                ✕ Ditolak
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-250 animate-pulse">
                                ● Pending Review
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            {p.status === 'pending' ? (
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleApprovePayment(p.id, 'success')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm hover:scale-105 transition-all"
                                  title="Konfirmasi pembayaran sah & lunas"
                                >
                                  Konfirmasi
                                </button>
                                <button 
                                  onClick={() => handleApprovePayment(p.id, 'rejected')}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm hover:scale-105 transition-all"
                                  title="Tolak pembayaran (bukti palsu atau tidak sesuai)"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-cafe-mocha/50">Sudah Selesai</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-cafe-brown/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-cafe-cream w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl relative"
            >
              <div className="p-8 md:p-12 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-serif font-bold text-cafe-brown">
                    {editingPlace?.id ? 'Edit Kafe Estetik' : 'Tambah Kafe Baru'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-cafe-beige rounded-full text-cafe-mocha hover:text-cafe-brown transition-all">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Nama Kafe</label>
                      <input 
                        type="text" 
                        required
                        value={editingPlace?.name || ''}
                        onChange={(e) => setEditingPlace({ ...editingPlace, name: e.target.value })}
                        className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                        placeholder="Nama Kafe Estetik"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Alamat Lengkap Lokasi</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/30" size={18} />
                        <input 
                          type="text" 
                          required
                          value={editingPlace?.location || ''}
                          onChange={(e) => setEditingPlace({ ...editingPlace, location: e.target.value })}
                          className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-cafe-brown transition-all"
                          placeholder="Jl. Soekarno Hatta No.7, Pangkal Pinang"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">URL Foto Utama atau Unggah</label>
                        <div className="flex gap-2">
                          <div className="relative flex-grow">
                            <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/30" size={18} />
                            <input 
                              type="text" 
                              required
                              value={editingPlace?.image || ''}
                              onChange={(e) => setEditingPlace({ ...editingPlace, image: e.target.value })}
                              className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 pl-12 pr-6 focus:outline-none focus:border-cafe-brown transition-all"
                              placeholder="https://images.unsplash.com/..."
                            />
                          </div>
                          <label className="cursor-pointer bg-cafe-brown text-white p-4 rounded-2xl hover:scale-105 transition-all shadow-sm flex items-center justify-center">
                            <Plus size={20} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'image')}
                            />
                          </label>
                        </div>
                        {editingPlace?.image && (
                          <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-cafe-pastel shadow-sm">
                            <img src={editingPlace.image} className="w-full h-full object-cover" alt="Preview" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Galeri Foto</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editingPlace?.images?.map((img, idx) => (
                            <div key={idx} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-cafe-pastel">
                              <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                              <button 
                                type="button"
                                onClick={() => setEditingPlace({
                                  ...editingPlace,
                                  images: editingPlace.images?.filter((_, i) => i !== idx)
                                })}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <label className="w-16 h-16 rounded-xl border-2 border-dashed border-cafe-pastel flex items-center justify-center text-cafe-mocha/40 hover:border-cafe-brown hover:text-cafe-brown cursor-pointer transition-all">
                            <Plus size={20} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'gallery')}
                            />
                          </label>
                        </div>
                        <textarea 
                          rows={2}
                          value={editingPlace?.images?.join(', ') || ''}
                          onChange={(e) => setEditingPlace({ ...editingPlace, images: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                          className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 px-6 focus:outline-none focus:border-cafe-brown transition-all text-xs"
                          placeholder="Tempel tautan URL foto dipisahkan koma..."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Jam Operasional</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/30" size={16} />
                          <input 
                            type="text" 
                            value={editingPlace?.openingHours || ''}
                            onChange={(e) => setEditingPlace({ ...editingPlace, openingHours: e.target.value })}
                            className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3 pl-10 pr-4 focus:outline-none focus:border-cafe-brown text-sm"
                            placeholder="08:00 - 22:00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Rentang Harga</label>
                        <select 
                          value={editingPlace?.priceRange || '$$'}
                          onChange={(e) => setEditingPlace({ ...editingPlace, priceRange: e.target.value })}
                          className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3 px-4 focus:outline-none focus:border-cafe-brown text-sm appearance-none"
                        >
                          <option value="$">$ (Ekonomis - Terjangkau)</option>
                          <option value="$$">$$ (Sedang - Umum)</option>
                          <option value="$$$">$$$ (Premium - Eksklusif)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Garis Lintang / Latitude (opsional)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={editingPlace?.lat || ''}
                        onChange={(e) => setEditingPlace({ ...editingPlace, lat: parseFloat(e.target.value) })}
                        className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                        placeholder="-2.1283"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Garis Bujur / Longitude (opsional)</label>
                      <input 
                        type="number" 
                        step="any"
                        value={editingPlace?.lng || ''}
                        onChange={(e) => setEditingPlace({ ...editingPlace, lng: parseFloat(e.target.value) })}
                        className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                        placeholder="106.1130"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Deskripsi Kafe</label>
                    <textarea 
                      required
                      rows={4}
                      value={editingPlace?.description || ''}
                      onChange={(e) => setEditingPlace({ ...editingPlace, description: e.target.value })}
                      className="w-full bg-cafe-beige border border-cafe-pastel rounded-3xl p-6 focus:outline-none focus:border-cafe-brown transition-all"
                      placeholder="Ceritakan keistimewaan, suasana, atau menu wajib di kafe ini..."
                    ></textarea>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Fasilitas (pisahkan dengan koma)</label>
                    <input 
                      type="text" 
                      value={editingPlace?.facilities?.join(', ') || ''}
                      onChange={(e) => setEditingPlace({ ...editingPlace, facilities: e.target.value.split(',').map(f => f.trim()) })}
                      className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                      placeholder="WiFi, AC, Area Outdoor, Live Music, Tempat Parkir"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-cafe-beige/20 p-6 rounded-[2rem] border border-cafe-pastel/30">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Tautan Instagram</label>
                      <input 
                        type="text" 
                        value={editingPlace?.socials?.instagram || ''}
                        onChange={(e) => setEditingPlace({ ...editingPlace, socials: { ...editingPlace?.socials, instagram: e.target.value } })}
                        className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                        placeholder="https://instagram.com/akun"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Tautan TikTok</label>
                      <input 
                        type="text" 
                        value={editingPlace?.socials?.tiktok || ''}
                        onChange={(e) => setEditingPlace({ ...editingPlace, socials: { ...editingPlace?.socials, tiktok: e.target.value } })}
                        className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                        placeholder="https://tiktok.com/@akun"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Tautan Website</label>
                      <input 
                        type="text" 
                        value={editingPlace?.socials?.website || ''}
                        onChange={(e) => setEditingPlace({ ...editingPlace, socials: { ...editingPlace?.socials, website: e.target.value } })}
                        className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                        placeholder="https://namawebsite.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-cafe-mocha/60 tracking-widest pl-2">Tagar / Kategori Pencarian (pisahkan dengan koma)</label>
                    <input 
                      type="text" 
                      value={editingPlace?.tags?.join(', ') || ''}
                      onChange={(e) => setEditingPlace({ ...editingPlace, tags: e.target.value.split(',').map(t => t.trim()) })}
                      className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-4 px-6 focus:outline-none focus:border-cafe-brown transition-all"
                      placeholder="Aesthetic Cafe, Work From Cafe, Budget Places, Night Hangout"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-cafe-beige rounded-2xl border border-cafe-pastel">
                    <input 
                      type="checkbox" 
                      id="featured"
                      checked={editingPlace?.featured || false}
                      onChange={(e) => setEditingPlace({ ...editingPlace, featured: e.target.checked })}
                      className="w-5 h-5 accent-cafe-brown"
                    />
                    <label htmlFor="featured" className="font-bold text-cafe-brown flex items-center gap-2">
                      <Sparkles size={18} className="text-yellow-500" /> Tampilkan di slider halaman utama (Rekomendasi Utama)
                    </label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-grow btn-primary flex items-center justify-center gap-2">
                      <Save size={20} /> Simpan Perubahan
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-grow py-4 bg-cafe-pastel text-cafe-mocha font-bold rounded-full hover:bg-cafe-beige transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Preview Modal Bukti dan Transaksi */}
      <AnimatePresence>
        {selectedProofUrl && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cafe-cream rounded-[2rem] border border-cafe-pastel max-w-2xl w-full p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedProofUrl(null)}
                className="absolute top-4 right-4 bg-cafe-beige text-cafe-mocha rounded-full p-2.5 hover:text-cafe-brown hover:scale-105 transition-all shadow-sm cursor-pointer"
                title="Tutup Preview"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-bold text-cafe-brown mb-4 font-serif">Aktivitas Verifikasi Bukti Transfer Kafe</h3>
              <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-cafe-pastel p-2 bg-cafe-beige/45 text-center">
                <img src={selectedProofUrl} alt="Bukti Transfer Lunas" className="max-w-full h-auto mx-auto rounded-xl shadow-md border border-cafe-pastel" />
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setSelectedProofUrl(null)}
                  className="px-6 py-2.5 bg-cafe-brown hover:bg-cafe-mocha text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Tutup Pratonton
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
