import React from 'react';
import { Coffee, Instagram, Facebook, Twitter, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-cafe-brown text-cafe-cream pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-cafe-cream rounded-xl flex items-center justify-center text-cafe-brown">
              <Coffee size={24} />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">
              Angstria Hangout
            </span>
          </Link>
          <p className="text-cafe-pastel/80 text-sm leading-relaxed">
            Temukan tempat nongkrong yang paling estetik dan nyaman di kota Anda.
            Dikurasi untuk kalangan muda modern yang mencari suasana terbaik.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif font-bold text-lg mb-6 text-cafe-cream">Tautan Pintas</h4>
          <ul className="space-y-4 text-sm text-cafe-pastel/70">
            <li><Link to="/" className="hover:text-cafe-cream transition-colors">Beranda</Link></li>
            <li><Link to="/places" className="hover:text-cafe-cream transition-colors">Kafe Terbaik</Link></li>
            <li><Link to="/gallery" className="hover:text-cafe-cream transition-colors">Galeri</Link></li>
            <li><Link to="/about" className="hover:text-cafe-cream transition-colors">Tentang Kami</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-serif font-bold text-lg mb-6 text-cafe-cream">Hubungi Kami</h4>
          <ul className="space-y-4 text-sm text-cafe-pastel/70">
            <li className="flex items-center gap-3">
              <Mail size={16} /> angstria@example.com
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} /> +62 812-3456-7890
            </li>
            <li className="flex items-center gap-3">
              <MapPin size={16} /> Pangkal Pinang, Indonesia
            </li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h4 className="font-serif font-bold text-lg mb-6 text-cafe-cream">Ikuti Kami</h4>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-cafe-mocha flex items-center justify-center hover:bg-cafe-cream hover:text-cafe-brown transition-all">
              <Instagram size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-cafe-mocha flex items-center justify-center hover:bg-cafe-cream hover:text-cafe-brown transition-all">
              <Facebook size={20} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-cafe-mocha flex items-center justify-center hover:bg-cafe-cream hover:text-cafe-brown transition-all">
              <Twitter size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-cafe-mocha flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-cafe-pastel/50">
          © {new Date().getFullYear()} Angstria Hangout. Hak cipta dilindungi undang-undang.
        </p>
        <p className="text-xs text-cafe-pastel/50">
          Didesain oleh Astriani & Dewi Anggraini
        </p>
      </div>
    </footer>
  );
};

export default Footer;
