# SPK Content Creator - Frontend

Frontend Sistem Pendukung Keputusan (SPK) untuk perankingan strategi content creator menggunakan metode AHP dan MARCOS.

## Teknologi

- React 18 + Vite
- TypeScript
- Ant Design
- React Router v6
- Axios
- Zustand
- Recharts
- Day.js

## Struktur Folder
src/ components/ -> Komponen reusable (table, chart, form, layout, common) layouts/ -> Layout per role (Admin, Verificator, Operator, Public, Auth) pages/ -> Halaman aplikasi per modul routes/ -> Routing, protected route, role route services/ -> Layer API dengan Axios instance store/ -> Zustand store (auth, ui) types/ -> TypeScript interfaces utils/ -> Helper functions constants/ -> Konstanta aplikasi

## Instalasi & Menjalankan

1. Clone repository
2. Salin file environment:
   ```bash
   cp .env.example .env
Sesuaikan VITE_API_BASE_URL dengan URL backend FastAPI Anda.
Install dependensi:
npm install
Jalankan development server:
npm run dev
Build untuk production:
npm run build
Integrasi Backend
Pastikan backend FastAPI menyediakan endpoint sesuai yang didefinisikan di src/services/. Semua request menggunakan base URL dari environment variable VITE_API_BASE_URL.

Fitur per Role
IT_Admin: Dashboard, Manajemen User, Manajemen Kriteria
Verificator: Input Matriks AHP, Hasil AHP, Finalize Bobot
Data_Admin: Manajemen Alternatif, Decision Matrix, Perhitungan MARCOS, Hasil Ranking, Export PDF/Excel
Public: Ranking Publik, Simulasi Bobot Real-time (frontend only)
Catatan
Simulasi pada halaman publik tidak mengirim data ke backend.
Perhitungan AHP dan MARCOS utama dilakukan di backend; frontend hanya menampilkan hasil.
Token JWT disimpan di localStorage (via Zustand persist) dan di-attach secara otomatis ke setiap request.
Auto-redirect setelah login berdasarkan role pengguna.