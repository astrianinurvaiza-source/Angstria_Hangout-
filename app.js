/**
 * Angstria Hangout - Inisialisasi Aplikasi & Konfigurasi Ekspor
 * 
 * File ini menyediakan utilitas pembantu eksternal jika Anda memerlukan
 * integrasi data kafe Pangkal Pinang di lingkungan luar.
 */

console.log("Angstria Hangout App Helper initialized");

export const appConfig = {
  appName: "Angstria Hangout",
  city: "Pangkal Pinang",
  language: "id_ID",
  timezone: "Asia/Jakarta"
};

export const getExportMetadata = () => {
  return {
    exportDate: new Date().toISOString(),
    supportedFormats: ["CSV", "JSON"],
    author: "Astriani & Dewi Anggraini"
  };
};
