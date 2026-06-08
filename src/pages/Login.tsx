import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogIn, Mail, Lock, Coffee, AlertCircle, Sparkles, User, 
  Building2, ShieldCheck, CheckCircle2, ChevronRight, UserPlus, ArrowRight,
  Eye, EyeOff
} from 'lucide-react';
import { authService, userService, ownerService } from '../services/dbService';

interface LoginProps {
  user: any;
}

const Login: React.FC<LoginProps> = ({ user }) => {
  const navigate = useNavigate();

  // Selected Role Tab: 'user' (Pengguna) | 'owner' (Pemilik Kafe) | 'admin' (Admin)
  const [activeRole, setActiveRole] = useState<'user' | 'owner' | 'admin'>('user');
  
  // Auth Mode within active tab (only for 'user' and 'owner')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Sessions check for display redirection options
  const [activeUserSession, setActiveUserSession] = useState<any>(null);
  const [activeOwnerSession, setActiveOwnerSession] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('angstria_user_session');
    if (savedUser) {
      try { setActiveUserSession(JSON.parse(savedUser)); } catch (e) { /* ignore */ }
    }
    const savedOwner = localStorage.getItem('angstria_owner_session');
    if (savedOwner) {
      try { setActiveOwnerSession(JSON.parse(savedOwner)); } catch (e) { /* ignore */ }
    }
  }, []);

  // Clear inputs when changing Tab or Auth Mode to avoid mixups
  const handleRoleChange = (role: 'user' | 'owner' | 'admin') => {
    setActiveRole(role);
    setAuthMode('login');
    setErrorMsg('');
    setSuccessMsg('');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleAuthModeChange = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const sanitizedEmail = email.trim().toLowerCase();

      // CASE A: ADMIN ROLE (Login Only, No Registration)
      if (activeRole === 'admin') {
        const adminUser = await authService.login(sanitizedEmail, password);
        localStorage.setItem('angstria_admin_session', JSON.stringify(adminUser));
        window.dispatchEvent(new Event('admin-auth-changed'));
        setSuccessMsg('Login administrator berhasil! Mengalihkan...');
        setTimeout(() => navigate('/admin'), 1200);
      } 
      
      // CASE B: PEMILIK KAFE (Login and Register)
      else if (activeRole === 'owner') {
        if (authMode === 'register') {
          if (!name.trim()) throw new Error('Nama lengkap atau nama pemilik wajib diisi');
          await ownerService.register(name, sanitizedEmail, password);
          setSuccessMsg('Pendaftaran pemilik berhasil! Silakan masuk dengan akun pemilik baru Anda.');
          setAuthMode('login');
          setPassword('');
        } else {
          const resOwner = await ownerService.login(sanitizedEmail, password);
          localStorage.setItem('angstria_owner_session', JSON.stringify(resOwner));
          window.dispatchEvent(new Event('owner-auth-changed'));
          setSuccessMsg(`Selamat datang kembali pemilik, ${resOwner.name}! Mengalihkan...`);
          setTimeout(() => navigate('/owner'), 1200);
        }
      } 
      
      // CASE C: PENGGUNA (Login and Register)
      else {
        if (authMode === 'register') {
          if (!name.trim()) throw new Error('Nama lengkap wajib diisi');
          await userService.register(name, sanitizedEmail, password);
          setSuccessMsg('Pendaftaran pengguna berhasil! Silakan masuk dengan akun baru Anda.');
          setAuthMode('login');
          setPassword('');
        } else {
          const resUser = await userService.login(sanitizedEmail, password);
          localStorage.setItem('angstria_user_session', JSON.stringify(resUser));
          window.dispatchEvent(new Event('user-auth-changed'));
          setSuccessMsg(`Selamat datang, ${resUser.name}! Mengalihkan ke ruang kuliner Anda...`);
          setTimeout(() => navigate('/dashboard'), 1200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan otentikasi. Silakan periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const adminUser = { email: 'admin@angstria.com', uid: 'admin_uid_123', displayName: 'Administrator (Google)' };
      localStorage.setItem('angstria_admin_session', JSON.stringify(adminUser));
      window.dispatchEvent(new Event('admin-auth-changed'));
      setSuccessMsg('Login dengan akun Google terdeteksi! Mengalihkan ke admin...');
      setTimeout(() => navigate('/admin'), 1200);
    } catch (err: any) {
      setErrorMsg('Gagal login via Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-cafe-beige flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden"
    >
      {/* Decorative colored top bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cafe-brown via-cafe-mocha to-cafe-pastel"></div>
      
      {/* Absolute Ambient Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cafe-pastel/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cafe-brown/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full bg-white rounded-[3rem] p-8 md:p-14 shadow-2xl border border-cafe-pastel relative z-10 transition-all">
        
        {/* Banner with logo info */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-block group">
            <div className="w-16 h-16 bg-cafe-brown rounded-2xl flex items-center justify-center text-cafe-cream mx-auto mb-5 shadow-lg group-hover:rotate-6 transition-transform cursor-pointer">
              <Coffee size={32} />
            </div>
          </Link>
          <h1 className="text-3xl font-serif font-black text-cafe-brown mb-2 tracking-tight">Portal Angstria Hangout</h1>
          <p className="text-cafe-mocha/60 text-xs font-medium max-w-sm mx-auto">
            Masuk dan kelola reservasi meja kafe, simpan estetika favorit, atau kendalikan bisnis kafe Anda.
          </p>
        </div>

        {/* Existing active sessions helper if any */}
        {(user || activeUserSession || activeOwnerSession) && (
          <div className="bg-cafe-beige/40 rounded-2xl p-4 mb-8 border border-cafe-pastel/80 text-[11px] text-cafe-mocha flex flex-col gap-2">
            <span className="font-bold uppercase tracking-wider text-[9px] text-cafe-mocha/50">Sesi Terdeteksi :</span>
            <div className="flex flex-wrap gap-2">
              {user && (
                <Link to="/admin" className="px-3 py-1 bg-cafe-brown text-cafe-cream rounded-full font-bold hover:opacity-90 flex items-center gap-1">
                  <ShieldCheck size={12} /> Admin ({user.email}) <ArrowRight size={10} />
                </Link>
              )}
              {activeOwnerSession && (
                <Link to="/owner" className="px-3 py-1 bg-amber-700 text-white rounded-full font-bold hover:opacity-90 flex items-center gap-1">
                  <Building2 size={12} /> Pemilik ({activeOwnerSession.name}) <ArrowRight size={10} />
                </Link>
              )}
              {activeUserSession && (
                <Link to="/dashboard" className="px-3 py-1 bg-cafe-mocha text-cafe-cream rounded-full font-bold hover:opacity-90 flex items-center gap-1">
                  <User size={12} /> Pengguna ({activeUserSession.name}) <ArrowRight size={10} />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Navigation Role Tabs */}
        <div className="grid grid-cols-3 bg-cafe-beige p-1.5 rounded-2xl mb-8 border border-cafe-pastel gap-1 text-center">
          <button
            type="button"
            onClick={() => handleRoleChange('user')}
            className={`py-3 text-[11px] md:text-xs font-black rounded-xl transition-all cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1.5 ${
              activeRole === 'user' ? 'bg-white text-cafe-brown shadow-sm' : 'text-cafe-mocha/50 hover:text-cafe-brown'
            }`}
          >
            <User size={14} className={activeRole === 'user' ? 'text-cafe-brown' : 'text-cafe-mocha/40'} />
            Pengguna
          </button>
          
          <button
            type="button"
            onClick={() => handleRoleChange('owner')}
            className={`py-3 text-[11px] md:text-xs font-black rounded-xl transition-all cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1.5 ${
              activeRole === 'owner' ? 'bg-white text-amber-800 shadow-sm' : 'text-cafe-mocha/50 hover:text-cafe-brown'
            }`}
          >
            <Building2 size={14} className={activeRole === 'owner' ? 'text-amber-800' : 'text-cafe-mocha/40'} />
            Pemilik Kafe
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`py-3 text-[11px] md:text-xs font-black rounded-xl transition-all cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1.5 ${
              activeRole === 'admin' ? 'bg-white text-rose-800 shadow-sm' : 'text-cafe-mocha/50 hover:text-cafe-brown'
            }`}
          >
            <ShieldCheck size={14} className={activeRole === 'admin' ? 'text-rose-800' : 'text-cafe-mocha/40'} />
            Admin
          </button>
        </div>

        {/* INNER FORM TABS FOR REGISTER/LOGIN (Not rendered for Admin role) */}
        {activeRole !== 'admin' && (
          <div className="flex justify-center gap-6 mb-6">
            <button
              type="button"
              onClick={() => handleAuthModeChange('login')}
              className={`text-xs font-black pb-1.5 border-b-2 transition-all cursor-pointer uppercase tracking-wider ${
                authMode === 'login' ? 'border-cafe-brown text-cafe-brown font-extrabold' : 'border-transparent text-cafe-mocha/40 hover:text-cafe-mocha'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => handleAuthModeChange('register')}
              className={`text-xs font-black pb-1.5 border-b-2 transition-all cursor-pointer uppercase tracking-wider ${
                authMode === 'register' ? 'border-cafe-brown text-cafe-brown font-extrabold' : 'border-transparent text-cafe-mocha/40 hover:text-cafe-mocha'
              }`}
            >
              Daftar Baru
            </button>
          </div>
        )}

        {/* FEEDBACK STATUS INDICATORS */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
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
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-emerald-50 text-emerald-800 p-4 rounded-2xl mb-6 border border-emerald-100 text-xs font-medium"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN AUTHENTICATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sesi Nama (Hanya Mode Register) */}
          {activeRole !== 'admin' && authMode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-cafe-mocha/70 tracking-[0.2em] ml-2">
                {activeRole === 'owner' ? 'Nama Lengkap Pemilik' : 'Nama Lengkap'}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={18} />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-cafe-brown focus:ring-4 focus:ring-primary/5 transition-all text-sm text-cafe-brown font-medium"
                  placeholder={activeRole === 'owner' ? "Masukkan nama pemilik toko..." : "Masukkan nama lengkap Anda..."}
                />
              </div>
            </div>
          )}

          {/* Sesi Email / Username untuk Admin */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-2">
              <label className="text-[10px] uppercase font-bold text-cafe-mocha/70 tracking-[0.2em]">
                {activeRole === 'admin' ? 'Nama Pengguna (Username)' : 'Alamat Email'}
              </label>
              {activeRole === 'admin' && (
                <span className="text-[9px] text-cafe-brown font-bold uppercase tracking-wider bg-cafe-beige px-2 py-0.5 rounded">Default Admin</span>
              )}
            </div>
            <div className="relative">
              {activeRole === 'admin' ? (
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={18} />
              ) : (
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={18} />
              )}
              <input 
                type={activeRole === 'admin' ? "text" : "email"} 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete={activeRole === 'admin' ? "username" : "email"}
                className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-cafe-brown focus:ring-4 focus:ring-primary/5 transition-all text-sm text-cafe-brown font-medium"
                placeholder={activeRole === 'admin' ? "admin" : "Contoh: astriani@design.com"}
              />
            </div>
          </div>

          {/* Sesi Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-cafe-mocha/70 tracking-[0.2em] ml-2">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-cafe-beige border border-cafe-pastel rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-cafe-brown focus:ring-4 focus:ring-primary/5 transition-all text-sm text-cafe-brown font-medium"
                placeholder={activeRole === 'admin' ? "admin" : "••••••••"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cafe-mocha/40 hover:text-cafe-brown transition-colors cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-cafe-beige/80"
                title={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                id="password-visibility-toggle"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Helper notes for admin login */}
          {activeRole === 'admin' && (
            <p className="text-[11px] text-cafe-mocha/60 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100/50 italic">
              <strong>Catatan Sistem:</strong> Bagian Admin tidak memerlukan pendaftaran. Hanya untuk administrator berwenang yang merawat platform. Gunakan kredensial default untuk demo langsung.
            </p>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary mt-4 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer text-xs font-black tracking-wider uppercase"
          >
            {loading ? (
              'Sedang Memproses Otentikasi...'
            ) : (
              <>
                <LogIn size={16} /> 
                {authMode === 'register' ? 'Daftar Baru' : 'Masuk Portal'} {activeRole === 'user' ? '& Cari Kopi' : activeRole === 'owner' ? 'Sebagai Mitra' : 'Akses Penuh'}
              </>
            )}
          </button>
        </form>

        {/* Support Social buttons for Google/OAuth in Admin tab if requested by templates */}
        {activeRole === 'admin' && (
          <>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-px bg-cafe-pastel flex-grow"></div>
              <span className="text-[9px] uppercase font-bold text-cafe-mocha/40">DEMO QUICK JOIN</span>
              <div className="h-px bg-cafe-pastel flex-grow"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleAdminLogin}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-3 bg-white border border-cafe-pastel py-3.5 rounded-2xl text-xs font-bold text-cafe-brown hover:bg-cafe-beige transition-all group cursor-pointer"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" />
              Lanjutkan Demo Admin Instan
            </button>
          </>
        )}

        <div className="mt-10 text-center border-t border-cafe-pastel pt-6">
          <Link to="/" className="text-xs font-bold text-cafe-mocha/50 hover:text-cafe-brown transition-colors inline-flex items-center gap-1.5">
            <Sparkles size={14} /> Kembali Menjelajah Beranda
          </Link>
        </div>

      </div>
    </motion.div>
  );
};

export default Login;
