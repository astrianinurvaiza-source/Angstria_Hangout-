# Panduan Migrasi Angstria Hangout ke phpMyadmin (MySQL) ☕

Panduan ini menjelaskan cara memindahkan penyimpanan data aplikasi **Angstria Hangout** dari Firebase Firestore ke **MySQL** dengan antarmuka **phpMyAdmin** (misalnya menggunakan hosting cPanel atau XAMPP lokal).

---

## 💡 Mengapa Memerlukan PHP API (`api.php`)?
Aplikasi React berjalan di browser pengguna (*client-side*). Browser tidak dapat terhubung langsung ke server database MySQL karena alasan keamanan dan keterbatasan protokol. 

Oleh karena itu, kami telah membuat jembatan berupa **PHP REST API** (`api.php`) yang aman. Aliran datanya adalah:
```
React App (Browser) ──[HTTP Fetch]──> api.php (Hosting / XAMPP) ──[PDO Query]──> MySQL (phpMyAdmin)
```

---

## 🛠️ Langkah Demi Langkah Migrasi

### Langkah 1: Siapkan Server Database & phpMyAdmin (XAMPP Lokal)
Jika Anda menggunakan komputer lokal:
1. Unduh dan jalankan **XAMPP** (atau aplikasi serupa seperti Laragon / WAMP).
2. Aktifkan modul **Apache** dan **MySQL** di Control Panel XAMPP Anda.
3. Buka browser Anda dan akses: `http://localhost/phpmyadmin`

---

### Langkah 2: Mengimpor Database (`database.sql`)
Kami telah menyiapkan file skema database lengkap dengan data kafe di Pangkal Pinang yang estetik.
1. Di halaman **phpMyAdmin**, klik tab **Import** (Impor) di bagian atas menu.
2. Klik tombol **Choose File** (Pilih File) dan pilih file `database.sql` yang kami buat di folder proyek ini.
3. Gulir ke bawah dan klik tombol **Import** (atau **Go**).
4. phpMyAdmin akan otomatis membuat database baru bernama `angstria_hangout` beserta tabel `places` (tempat kafe) dan `comments` (ulasan pengguna), lengkap dengan isi datanya.

---

### Langkah 3: Menyiapkan File Backend API (`api.php`)
1. Salin file `api.php` dari proyek ini ke dalam folder root server PHP Anda:
   - Jika menggunakan **XAMPP**, taruh file ini di folder `C:\xampp\htdocs\api.php`.
   - Jika menggunakan **Hosting Online**, unggah file ini ke dalam folder `public_html/api.php`.
2. Buka file `api.php` menggunakan editor kode, lalu sesuaikan konfigurasi koneksi database Anda di bagian atas jika ada perbedaan:
   ```php
   $db_host = "localhost";
   $db_user = "root";       // Username bawaan XAMPP adalah root
   $db_pass = "";           // Password bawaan XAMPP adalah kosong
   $db_name = "angstria_hangout";
   ```

---

### Langkah 4: Hubungkan Aplikasi React ke MySQL
Kami telah menyediakan file pengganti integrasi jaringan MySQL bernama `dbService_mysql.ts` di folder `/src/services/`. Untuk mengaktifkannya, lakukan langkah berikut:

1. Buka file `/src/services/dbService_mysql.ts` dan ubah `API_BASE_URL` sesuai lokasi file `api.php` Anda:
   ```typescript
   const API_BASE_URL = 'http://localhost/api.php'; // Ganti dengan domain online jika sudah di-upload ke hosting
   ```

2. Cari baris impor di halaman-halaman berikut ini di kode Anda untuk mengalihkan ke MySQL:
   
   - **`/src/pages/PlaceList.tsx`**
     Ganti impor:
     ```typescript
     import { placesService } from '../services/dbService';
     ```
     Menjadi:
     ```typescript
     import { placesService } from '../services/dbService_mysql';
     ```
     
   - **`/src/pages/PlaceDetails.tsx`**
     Ganti impor:
     ```typescript
     import { placesService, commentsService } from '../services/dbService';
     ```
     Menjadi:
     ```typescript
     import { placesService, commentsService } from '../services/dbService_mysql';
     ```

   - **`/src/pages/AdminDashboard.tsx`**
     Ganti impor:
     ```typescript
     import { placesService } from '../services/dbService';
     ```
     Menjadi:
     ```typescript
     import { placesService } from '../services/dbService_mysql';
     ```

---

## 🎉 Selamat!
Sekarang aplikasi Angstria Hangout Anda sudah berjalan di atas database **MySQL** nyata yang dikelola menggunakan **phpMyAdmin** dengan penuh performa dan fleksibilitas untuk peluncuran skala nyata!
