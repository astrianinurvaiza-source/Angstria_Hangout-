import React from 'react';
import { motion } from 'motion/react';
import { Coffee, Heart, Globe, Sparkles, MapPin, Instagram, Facebook, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-cafe-beige min-h-screen pt-12 pb-24 px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative mb-32">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] aspect-square bg-cafe-cream rounded-full blur-3xl opacity-50 -z-10"></div>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-cafe-brown mb-8">
              Diseduh dengan <span className="italic text-cafe-mocha">Semangat</span>
            </h1>
            <p className="text-lg text-cafe-mocha/70 leading-relaxed">
              Angstria Hangout dimulai dari perbincangan hangat antara dua sahabat yang mencari tempat sempurna untuk berkolaborasi dan berkarya.
              Kami menyadari bahwa menemukan "vibe" yang tepat bukan sekadar mencari alamat, melainkan tentang menghidupkan suasana, menjalin koneksi, dan menikmati secangkir kopi berkualitas.
            </p>
          </div>
        </div>

        {/* Vision/Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center mb-32">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-cafe-brown text-cafe-cream px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                <Globe size={16} /> Visi Kami
              </div>
              <h2 className="text-4xl font-serif font-bold text-cafe-brown">Mendefinisikan Ulang Eksplorasi Lokal</h2>
              <p className="text-cafe-mocha/80 leading-loose">
                Kami bertujuan untuk membangun komunitas tempat penemuan estetika berpadu dengan kemudahan akses. Baik Anda seorang digital nomad yang mendambakan Wi-Fi kencang, ataupun sekelompok teman yang mencari latar foto Instagrammable berikutnya, kami siap memandu Anda.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-cafe-pastel flex flex-col gap-4">
                <div className="w-12 h-12 bg-cafe-beige rounded-2xl flex items-center justify-center text-cafe-brown">
                  <Coffee size={24} />
                </div>
                <h4 className="font-bold text-cafe-brown">Kualitas Terpilih</h4>
                <p className="text-xs text-cafe-mocha/60">Setiap kafe diulas langsung demi kualitas rasa dan atmosfer yang otentik.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-cafe-pastel flex flex-col gap-4">
                <div className="w-12 h-12 bg-cafe-beige rounded-2xl flex items-center justify-center text-cafe-brown">
                  <Heart size={24} />
                </div>
                <h4 className="font-bold text-cafe-brown">Dukungan Komunitas</h4>
                <p className="text-xs text-cafe-mocha/60">Ulasan nyata dari orang-orang asli yang menghargai keindahan tempat nongkrong.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden rotate-3 shadow-2xl border-8 border-white/50">
              <img 
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800" 
                alt="Cafe Interior" 
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cafe-mocha rounded-[3rem] -rotate-6 -z-10 flex items-center justify-center p-8 text-cafe-cream">
              <Sparkles size={40} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Creators Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-cafe-brown mb-4">Temui Para Kreator</h2>
          <p className="text-cafe-mocha/60">Pikiran kreatif dan hati hangat di balik indahnya Angstria Hangout.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {[
            { name: 'Astriani', role: 'Product Designer & Coffee Enthusiast', bio: 'Bersemangat merancang produk digital yang berkesan hangat laksana sapaan sore hari.', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' },
            { name: 'Dewi Anggraini', role: 'Tech Lead & Aesthetic Purist', bio: 'Percaya bahwa baris kode yang baik adalah seni tersembunyi, dan kafe impian berawal dari pencahayaan indah.', img: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=400' },
          ].map((creator, idx) => (
            <motion.div 
              key={creator.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="bg-white rounded-[3rem] p-10 border border-cafe-pastel shadow-lg flex flex-col items-center text-center group hover:-translate-y-2 transition-transform"
            >
              <div className="w-32 h-32 rounded-3xl overflow-hidden mb-8 border-4 border-cafe-pastel group-hover:rotate-6 transition-transform">
                <img src={creator.img} alt={creator.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-cafe-brown mb-2">{creator.name}</h3>
              <p className="text-xs font-bold text-cafe-mocha uppercase tracking-widest mb-6">{creator.role}</p>
              <p className="text-cafe-mocha/70 text-sm leading-relaxed mb-8">
                {creator.bio}
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-cafe-beige flex items-center justify-center text-cafe-brown hover:bg-cafe-brown hover:text-cafe-cream transition-all">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-cafe-beige flex items-center justify-center text-cafe-brown hover:bg-cafe-brown hover:text-cafe-cream transition-all">
                  <Twitter size={18} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-40 bg-cafe-brown rounded-[4rem] px-8 py-24 text-center text-cafe-cream relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Siap menemukan sudut <span className="italic text-cafe-pastel">terfavorit</span> selanjutnya?</h2>
            <Link to="/places" className="btn-primary bg-white text-cafe-brown hover:bg-cafe-pastel border-none">
              Mulai Menjelajah
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default About;
