import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Coffee, MapPin, Star, Search, Filter, Camera, Info, LayoutDashboard, LogIn, LogOut, ChevronRight, Share2, Instagram, Facebook, Twitter, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Home from './pages/Home';
import PlaceList from './pages/PlaceList';
import PlaceDetails from './pages/PlaceDetails';
import Gallery from './pages/Gallery';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import UserDashboard from './pages/UserDashboard';

import { FavoritesProvider } from './context/FavoritesContext';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const savedSession = localStorage.getItem('angstria_admin_session');
      if (savedSession) {
        try {
          setUser(JSON.parse(savedSession));
        } catch (e) {
          localStorage.removeItem('angstria_admin_session');
        }
      } else {
        setUser(null);
      }
    };

    checkUser();

    // Listen to custom event or storage change to keep in sync
    window.addEventListener('storage', checkUser);
    window.addEventListener('admin-auth-changed', checkUser);

    // Check for dark mode preference
    if (localStorage.getItem('theme') === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('admin-auth-changed', checkUser);
    };
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <FavoritesProvider>
      <Router>
        <div className="min-h-screen flex flex-col transition-colors duration-300">
          <Navbar user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/places" element={<PlaceList />} />
                <Route path="/places/:id" element={<PlaceDetails />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<AdminDashboard user={user} />} />
                <Route path="/login" element={<Login user={user} />} />
                <Route path="/owner" element={<OwnerDashboard />} />
                <Route path="/dashboard" element={<UserDashboard />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </Router>
    </FavoritesProvider>
  );
};

export default App;
