import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Local DB mock definitions have been removed for pure phpMyAdmin connectivity.

// Middleware to parse bodies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Enable CORS for all requests just to match php headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Path to persist custom phpMyAdmin api.php target
const PHP_CONFIG_FILE = path.join(process.cwd(), "php_config.json");

function readPhpConfig() {
  let config = {
    target_api_url: "http://localhost/Angstria_Hangout--/api.php",
    use_live: true // Default to true as the user wants PHPMyAdmin connectivity prioritised!
  };
  if (fs.existsSync(PHP_CONFIG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(PHP_CONFIG_FILE, "utf-8"));
      config = {
        ...config,
        ...parsed
      };
    } catch (e) {
      // Ignore
    }
  }
  return config;
}

function savePhpConfig(config: any) {
  try {
    fs.writeFileSync(PHP_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan konfigurasi PHP:", e);
  }
}

// API Endpoint to manage live phpMyAdmin config from the user interface
app.get("/api/backend-url", (req, res) => {
  return res.json(readPhpConfig());
});

app.post("/api/backend-url", (req, res) => {
  const body = req.body || {};
  let config = readPhpConfig();
  if (body.target_api_url !== undefined) {
    config.target_api_url = body.target_api_url.trim();
  }
  if (body.use_live !== undefined) {
    config.use_live = !!body.use_live;
  }
  savePhpConfig(config);
  return res.json({ success: true, config });
});

// Local DB mock definitions have been set up for robust local fallback when phpMyAdmin is unreachable.
const LOCAL_DB_FILE = path.join(process.cwd(), "local_db.json");

function getLocalDB() {
  let db = {
    places: [] as any[],
    comments: [] as any[],
    reservations: [] as any[],
    owners: [] as any[],
    payments: [] as any[],
    users: [] as any[]
  };
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, "utf-8"));
    } catch (e) {
      // Ignore
    }
  }
  // Ensure lists exist
  if (!Array.isArray(db.places)) db.places = [];
  if (!Array.isArray(db.comments)) db.comments = [];
  if (!Array.isArray(db.reservations)) db.reservations = [];
  if (!Array.isArray(db.owners)) db.owners = [];
  if (!Array.isArray(db.payments)) db.payments = [];
  if (!Array.isArray(db.users)) db.users = [];
  return db;
}

function saveLocalDB(db: any) {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Gagal menyimpan local DB emulator:", e);
  }
}

function handleLocalDBEmulator(req: any, res: any) {
  const action = (req.query.action || req.body?.action || "").trim();
  const db = getLocalDB();

  switch (action) {
    case 'reset_db': {
      db.places = [];
      db.comments = [];
      db.reservations = [];
      db.payments = [];
      saveLocalDB(db);
      return res.json({ success: true, message: "Database emulator berhasil di-reset menjadi kosong.", fallback_used: true });
    }

    case 'login': {
      const data = req.body || {};
      const username = (data.username || data.email || "").trim();
      const password = (data.password || "").trim();

      if (!username || !password) {
        return res.json({ success: false, message: "Username dan password wajib diisi", fallback_used: true });
      }

      if (username === 'admin' || username === 'admin@angstria.com') {
        if (password === 'admin' || password === 'admin123') {
          return res.json({
            success: true,
            fallback_used: true,
            user: {
              id: 1,
              username: 'admin',
              name: 'Administrator',
              email: 'admin@angstria.com',
              displayName: 'Administrator',
              uid: 'admin_uid_1'
            }
          });
        } else {
          return res.json({ success: false, message: "Password salah", fallback_used: true });
        }
      }
      return res.json({ success: false, message: "Username tidak ditemukan", fallback_used: true });
    }

    case 'places': {
      return res.json({ success: true, data: db.places, fallback_used: true });
    }

    case 'place': {
      const id = req.query.id || "";
      if (!id) {
        return res.json({ success: false, message: "ID tidak ditemukan", fallback_used: true });
      }
      const place = db.places.find((p: any) => p.id === id);
      if (!place) {
        return res.json({ success: false, message: "Tempat tidak ditemukan", fallback_used: true });
      }
      const comments = db.comments.filter((c: any) => c.placeId === id);
      return res.json({ success: true, data: place, comments, fallback_used: true });
    }

    case 'add_comment': {
      const data = req.body || {};
      const placeId = (data.placeId || "").trim();
      const username = (data.username || "").trim();
      const comment = (data.comment || "").trim();
      const rating = parseInt(data.rating || "5", 10);

      if (!placeId || !username || !comment) {
        return res.json({ success: false, message: "Data tidak lengkap", fallback_used: true });
      }

      const newComment = {
        id: db.comments.length + 1,
        placeId,
        username,
        comment,
        rating,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      db.comments.push(newComment);
      
      // Also update place rating average
      const place = db.places.find((p: any) => p.id === placeId);
      if (place) {
        const placeComments = db.comments.filter((c: any) => c.placeId === placeId);
        const avg = placeComments.reduce((acc, c) => acc + c.rating, 0) / placeComments.length;
        place.rating = parseFloat(avg.toFixed(1));
      }

      saveLocalDB(db);
      return res.json({ success: true, message: "Komentar berhasil ditambahkan", fallback_used: true });
    }

    case 'create_place': {
      const data = req.body || {};
      const id = data.id || "";
      const name = data.name || "";
      const location = data.location || "";

      if (!id || !name || !location) {
        return res.json({ success: false, message: "Data wajib diisi", fallback_used: true });
      }

      const newPlace = {
        id,
        name,
        description: data.description || "",
        location,
        lat: data.lat || null,
        lng: data.lng || null,
        openingHours: data.openingHours || "09:00 - 22:00",
        facilities: data.facilities || "",
        priceRange: data.priceRange || "$$",
        featured: data.featured ? 1 : 0,
        tags: data.tags || "",
        image: data.image || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
        images: Array.isArray(data.images) ? JSON.stringify(data.images) : (data.images || "[]"),
        socials: data.socials ? (typeof data.socials === 'string' ? data.socials : JSON.stringify(data.socials)) : "{}",
        views: 0,
        rating: 0,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      db.places.push(newPlace);

      // Link to owner if provided
      if (data.ownerEmail) {
        const ownerEmail = data.ownerEmail.trim().toLowerCase();
        const owner = db.owners.find((o: any) => o.email === ownerEmail);
        if (owner) {
          owner.cafeId = id;
        }
      }

      saveLocalDB(db);
      return res.json({ success: true, id, message: "Tempat berhasil ditambahkan", fallback_used: true });
    }

    case 'update_place': {
      const data = req.body || {};
      const id = data.id || "";
      const name = data.name || "";
      const location = data.location || "";

      if (!id || !name || !location) {
        return res.json({ success: false, message: "ID, nama, dan lokasi wajib diisi", fallback_used: true });
      }

      const placeIndex = db.places.findIndex((p: any) => p.id === id);
      if (placeIndex === -1) {
        return res.json({ success: false, message: "Tempat tidak ditemukan", fallback_used: true });
      }

      db.places[placeIndex] = {
        ...db.places[placeIndex],
        name,
        description: data.description || "",
        location,
        lat: data.lat || null,
        lng: data.lng || null,
        openingHours: data.openingHours || "09:00 - 22:00",
        facilities: data.facilities || "",
        priceRange: data.priceRange || "$$",
        featured: data.featured ? 1 : 0,
        tags: data.tags || "",
        image: data.image || db.places[placeIndex].image,
        images: Array.isArray(data.images) ? JSON.stringify(data.images) : (data.images || db.places[placeIndex].images),
        socials: data.socials ? (typeof data.socials === 'string' ? data.socials : JSON.stringify(data.socials)) : db.places[placeIndex].socials
      };

      saveLocalDB(db);
      return res.json({ success: true, message: "Tempat berhasil diperbarui", fallback_used: true });
    }

    case 'delete_place': {
      const id = req.query.id || req.body?.id || "";
      if (!id) {
        return res.json({ success: false, message: "ID kafe tidak boleh kosong", fallback_used: true });
      }

      db.places = db.places.filter((p: any) => p.id !== id);
      db.comments = db.comments.filter((c: any) => c.placeId !== id);
      db.reservations = db.reservations.filter((r: any) => r.placeId !== id);

      saveLocalDB(db);
      return res.json({ success: true, message: "Tempat berhasil dihapus", fallback_used: true });
    }

    case 'increment_views': {
      const id = req.query.id || req.body?.id || "";
      if (!id) {
        return res.json({ success: false, message: "ID kafe tidak boleh kosong", fallback_used: true });
      }
      const place = db.places.find((p: any) => p.id === id);
      if (place) {
        place.views = (place.views || 0) + 1;
        saveLocalDB(db);
      }
      return res.json({ success: true, message: "Views berhasil ditambahkan", fallback_used: true });
    }

    case 'owner_register': {
      const data = req.body || {};
      const name = (data.name || "").trim();
      const email = (data.email || "").trim().toLowerCase();
      const password = (data.password || "").trim();

      if (!name || !email || !password) {
        return res.json({ success: false, message: "Semua field wajib diisi", fallback_used: true });
      }

      const exists = db.owners.some((o: any) => o.email === email);
      if (exists) {
        return res.json({ success: false, message: "Email sudah terdaftar", fallback_used: true });
      }

      const newOwner = {
        id: db.owners.length + 1,
        name,
        email,
        password,
        cafeId: null,
        createdAt: new Date().toISOString()
      };

      db.owners.push(newOwner);
      saveLocalDB(db);

      return res.json({
        success: true,
        message: "Pendaftaran pemilik kafe berhasil",
        fallback_used: true,
        owner: {
          id: newOwner.id,
          name: newOwner.name,
          email: newOwner.email
        }
      });
    }

    case 'owner_login': {
      const data = req.body || {};
      const email = (data.email || "").trim().toLowerCase();
      const password = (data.password || "").trim();

      if (!email || !password) {
        return res.json({ success: false, message: "Email dan password wajib diisi", fallback_used: true });
      }

      const owner = db.owners.find((o: any) => o.email === email && o.password === password);
      if (!owner) {
        return res.json({ success: false, message: "Kombinasi email atau password salah", fallback_used: true });
      }

      let place = null;
      if (owner.cafeId) {
        const placeData = db.places.find((p: any) => p.id === owner.cafeId);
        if (placeData) {
          const rawFacilities = placeData.facilities || "";
          const facilities = typeof rawFacilities === 'string' ? rawFacilities.split(',').map((f: string) => f.trim()) : [];
          const rawTags = placeData.tags || "";
          const tags = typeof rawTags === 'string' ? rawTags.split(',').map((t: string) => t.trim()) : [];
          
          let images = [];
          if (placeData.images) {
            try {
              images = JSON.parse(placeData.images);
            } catch {
              images = [placeData.image];
            }
          } else {
            images = [placeData.image];
          }

          let socials = null;
          if (placeData.socials) {
            try {
              socials = JSON.parse(placeData.socials);
            } catch {}
          }

          place = {
            id: placeData.id,
            name: placeData.name,
            description: placeData.description,
            location: placeData.location,
            openingHours: placeData.openingHours,
            facilities,
            rating: placeData.rating,
            image: placeData.image,
            images,
            tags,
            socials,
            views: placeData.views,
            priceRange: placeData.priceRange,
            featured: placeData.featured === 1,
            lat: placeData.lat,
            lng: placeData.lng,
            createdAt: placeData.createdAt
          };
        }
      }

      return res.json({
        success: true,
        message: "Login berhasil",
        fallback_used: true,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          cafeId: owner.cafeId || null,
          place
        }
      });
    }

    case 'user_register': {
      const data = req.body || {};
      const name = (data.name || "").trim();
      const email = (data.email || "").trim().toLowerCase();
      const password = (data.password || "").trim();

      if (!name || !email || !password) {
        return res.json({ success: false, message: "Semua field wajib diisi", fallback_used: true });
      }

      const exists = db.users.some((u: any) => u.email === email);
      if (exists) {
        return res.json({ success: false, message: "Email sudah terdaftar", fallback_used: true });
      }

      const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password,
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveLocalDB(db);

      return res.json({
        success: true,
        message: "Pendaftaran pengguna berhasil",
        fallback_used: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        }
      });
    }

    case 'user_login': {
      const data = req.body || {};
      const email = (data.email || "").trim().toLowerCase();
      const password = (data.password || "").trim();

      if (!email || !password) {
        return res.json({ success: false, message: "Email dan password wajib diisi", fallback_used: true });
      }

      const user = db.users.find((u: any) => u.email === email && u.password === password);
      if (!user) {
        return res.json({ success: false, message: "Kombinasi email atau password salah", fallback_used: true });
      }

      return res.json({
        success: true,
        message: "Login berhasil",
        fallback_used: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }

    case 'get_owner': {
      const email = (req.query.email || "").trim().toLowerCase();
      if (!email) {
        return res.json({ success: false, message: "Email wajib diisi", fallback_used: true });
      }

      const owner = db.owners.find((o: any) => o.email === email);
      if (!owner) {
        return res.json({ success: false, message: "Pemilik tidak ditemukan", fallback_used: true });
      }

      let place = null;
      if (owner.cafeId) {
        const placeData = db.places.find((p: any) => p.id === owner.cafeId);
        if (placeData) {
          const rawFacilities = placeData.facilities || "";
          const facilities = typeof rawFacilities === 'string' ? rawFacilities.split(',').map((f: string) => f.trim()) : [];
          const rawTags = placeData.tags || "";
          const tags = typeof rawTags === 'string' ? rawTags.split(',').map((t: string) => t.trim()) : [];

          let images = [];
          if (placeData.images) {
            try {
              images = JSON.parse(placeData.images);
            } catch {
              images = [placeData.image];
            }
          } else {
            images = [placeData.image];
          }

          let socials = null;
          if (placeData.socials) {
            try {
              socials = JSON.parse(placeData.socials);
            } catch {}
          }

          place = {
            id: placeData.id,
            name: placeData.name,
            description: placeData.description,
            location: placeData.location,
            openingHours: placeData.openingHours,
            facilities,
            rating: placeData.rating,
            image: placeData.image,
            images,
            tags,
            socials,
            views: placeData.views,
            priceRange: placeData.priceRange,
            featured: placeData.featured === 1,
            lat: placeData.lat,
            lng: placeData.lng,
            createdAt: placeData.createdAt
          };
        }
      }

      return res.json({
        success: true,
        fallback_used: true,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          cafeId: owner.cafeId || null,
          place
        }
      });
    }

    case 'get_reservations': {
      const placeId = req.query.placeId || "";
      const ownerEmail = (req.query.ownerEmail || "").trim().toLowerCase();
      const customerEmail = (req.query.customerEmail || "").trim().toLowerCase();

      let reservations = [...db.reservations];

      if (customerEmail) {
        reservations = reservations.filter((r: any) => r.customerEmail?.toLowerCase() === customerEmail);
      } else if (ownerEmail) {
        const owner = db.owners.find((o: any) => o.email === ownerEmail);
        if (owner && owner.cafeId) {
          reservations = reservations.filter((r: any) => r.placeId === owner.cafeId);
        } else {
          return res.json({ success: true, data: [], fallback_used: true });
        }
      } else if (placeId) {
        reservations = reservations.filter((r: any) => r.placeId === placeId);
      }

      // Add placeName to result
      const decorated = reservations.map((r: any) => {
        const pl = db.places.find((p: any) => p.id === r.placeId);
        return {
          ...r,
          placeName: pl ? pl.name : "Café"
        };
      });

      return res.json({ success: true, data: decorated, fallback_used: true });
    }

    case 'add_reservation': {
      const data = req.body || {};
      const placeId = data.placeId || "";
      const customerName = data.customerName || "";
      const customerPhone = data.customerPhone || "";
      const bookingDate = data.bookingDate || "";
      const bookingTime = data.bookingTime || "";
      const guests = parseInt(data.guests || "1", 10);

      if (!placeId || !customerName || !customerPhone || !bookingDate || !bookingTime) {
        return res.json({ success: false, message: "Gagal mengirim reservasi: Data tidak lengkap", fallback_used: true });
      }

      const newRes = {
        id: db.reservations.length + 1,
        placeId,
        customerName,
        customerEmail: data.customerEmail || "",
        customerPhone,
        bookingDate,
        bookingTime,
        guests,
        notes: data.notes || "",
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      db.reservations.push(newRes);
      saveLocalDB(db);

      return res.json({ success: true, data: newRes, fallback_used: true });
    }

    case 'update_reservation_status': {
      const data = req.body || {};
      const reservationId = parseInt(data.reservationId || "0", 10);
      const status = data.status || "";

      if (!reservationId || !status) {
        return res.json({ success: false, message: "Data tidak lengkap", fallback_used: true });
      }

      const resIndex = db.reservations.findIndex((r: any) => r.id === reservationId);
      if (resIndex !== -1) {
        db.reservations[resIndex].status = status;
        saveLocalDB(db);
        return res.json({ success: true, message: "Status reservasi berhasil diperbarui", fallback_used: true });
      }

      return res.json({ success: false, message: "Reservasi tidak ditemukan", fallback_used: true });
    }

    case 'get_payments': {
      const ownerEmail = (req.query.ownerEmail || "").trim().toLowerCase();
      const all = (req.query.all === "true" || (req.body && req.body.all === "true"));

      let filteredPays = [];
      if (all || !ownerEmail) {
        filteredPays = [...db.payments];
      } else {
        filteredPays = db.payments.filter((p: any) => p.ownerEmail?.toLowerCase() === ownerEmail);
      }

      // Sort by createdAt desc
      filteredPays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Add cafeName and proper fields
      const decoratedPays = filteredPays.map((p: any) => {
        let cafeName = null;
        if (p.cafeId) {
          const cafe = db.places.find((pl: any) => pl.id === p.cafeId);
          if (cafe) {
            cafeName = cafe.name;
          }
        }
        return {
          id: p.id || String(p.id),
          ownerEmail: p.ownerEmail,
          cafeId: p.cafeId,
          cafeName,
          amount: parseFloat(p.amount) || 0,
          type: p.type,
          method: p.method,
          status: p.status || 'pending',
          proof: p.proof || null,
          createdAt: p.createdAt
        };
      });

      return res.json({ success: true, data: decoratedPays, fallback_used: true });
    }

    case 'add_payment': {
      const data = req.body || {};
      const ownerEmail = (data.ownerEmail || "").trim().toLowerCase();
      const cafeId = data.cafeId || null;
      const amount = parseFloat(data.amount || "0");
      const type = data.type || "registration";
      const method = data.method || "QRIS";
      const proof = data.proof || "";
      const status = data.status || "pending"; // default to pending for Admin review

      if (!ownerEmail || !amount) {
        return res.json({ success: false, message: "Data tidak lengkap", fallback_used: true });
      }

      const invId = 'INV-' + Date.now();
      const newPay = {
        id: invId,
        ownerEmail,
        cafeId,
        amount,
        type,
        method,
        status,
        proof: proof || null,
        createdAt: new Date().toISOString()
      };

      db.payments.push(newPay);

      // Feature the cafe if approved immediately and is promotion
      if (status === 'success' && type === 'promotion' && cafeId) {
        const place = db.places.find((p: any) => p.id === cafeId);
        if (place) {
          place.featured = 1;
        }
      }

      saveLocalDB(db);

      return res.json({
        success: true,
        message: "Pembayaran berhasil disimpan, menunggu verifikasi Admin",
        fallback_used: true,
        data: newPay
      });
    }

    case 'approve_payment': {
      const data = req.body || {};
      const id = String(data.id || "").trim();
      const status = String(data.status || "success").trim();

      if (!id) {
        return res.json({ success: false, message: "ID Pembayaran wajib diisi", fallback_used: true });
      }

      const payment = db.payments.find((p: any) => String(p.id) === id);
      if (!payment) {
        return res.json({ success: false, message: "Transaksi pembayaran tidak ditemukan", fallback_used: true });
      }

      payment.status = status;

      // If approved and is promotion, feature the cafe
      if (status === 'success' && payment.type === 'promotion' && payment.cafeId) {
        const place = db.places.find((p: any) => p.id === payment.cafeId);
        if (place) {
          place.featured = 1;
        }
      }

      saveLocalDB(db);
      return res.json({ success: true, message: "Status pembayaran berhasil diperbarui", fallback_used: true });
    }

    case 'get_admin_stats': {
      const usersCount = db.users.length;
      const ownersCount = db.owners.length;
      const placesCount = db.places.length;
      const reservationsCount = db.reservations.length;
      const commentsCount = db.comments.length;
      const paymentsCount = db.payments.length;
      
      const revenue = db.payments
        .filter((p: any) => p.status === 'success')
        .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

      return res.json({
        success: true,
        fallback_used: true,
        data: {
          usersCount,
          ownersCount,
          placesCount,
          reservationsCount,
          commentsCount,
          revenue,
          paymentsCount
        }
      });
    }

    default: {
      return res.status(400).json({ success: false, message: `Aksi emulator ${action} tidak dikenal`, fallback_used: true });
    }
  }
}

// Implement the exactly action mapping matching api.php or PROXY to actual phpMyAdmin database
app.all("/api.php", async (req, res) => {
  const config = readPhpConfig();
  let fallbackReason = "";

  if (config.use_live && config.target_api_url && config.target_api_url !== "/api.php") {
    try {
      const targetUrl = new URL(config.target_api_url);
      
      // Fast check for localhost/private IP when accessed remotely
      let isLocalhost = false;
      try {
        const hostname = targetUrl.hostname;
        if (
          hostname === "localhost" || 
          hostname === "127.0.0.1" || 
          hostname.startsWith("192.168.") || 
          hostname.startsWith("10.") || 
          hostname.startsWith("172.")
        ) {
          isLocalhost = true;
        }
      } catch (e) {}

      // Allow localhost proxying if the request is originating from a local developer access as well
      const reqHost = req.headers.host || "";
      const isRequestFromLocal = reqHost.includes("localhost") || 
                                 reqHost.includes("127.0.0.1") || 
                                 reqHost.startsWith("192.168.") || 
                                 reqHost.startsWith("10.") || 
                                 reqHost.startsWith("172.");

      if (isLocalhost && !isRequestFromLocal) {
        fallbackReason = `Alamat database Anda saat ini adalah lokal (${config.target_api_url}) yang tidak dapat diakses langsung oleh server preview cloud kami.`;
        throw new Error("localhost_restricted_remote");
      }

      // Copy all query parameters from original request
      Object.keys(req.query).forEach((key) => {
        targetUrl.searchParams.set(key, String(req.query[key]));
      });

      const options: any = {
        method: req.method,
        headers: {
          "Accept": "application/json"
        }
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(req.body);
      }

      console.log(`[DATABASE PROXY] Forwarding request to live phpMyAdmin: ${targetUrl.toString()}`);
      
      // Fetch directly from their PHPMyAdmin web server
      const response = await fetch(targetUrl.toString(), options);
      
      if (!response.ok) {
        fallbackReason = `Server phpMyAdmin Anda gagal merespon (HTTP ${response.status} ${response.statusText}).`;
        throw new Error("remote_http_fail");
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (typeof json === "object" && json !== null) {
          json.fallback_used = false;
        }
        return res.json(json);
      } catch (err) {
        fallbackReason = "Database phpMyAdmin tidak mengembalikan tanggapan JSON yang valid.";
        throw new Error("invalid_json_response");
      }
    } catch (error: any) {
      console.log(`[DATABASE PROXY INFO] Menggunakan database emulator lokal karena server PHPMyAdmin belum terhubung: ${error.message}`);
      return handleLocalDBEmulator(req, res);
    }
  } else {
    // Falls back to local emulator when use_live is disabled or target_api_url points to local root api.php
    return handleLocalDBEmulator(req, res);
  }
});

// Configure Vite or Static Fallback
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
