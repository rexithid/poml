# Preorder MLBB — Website Distribusi Pre Order

Website MEVN (MongoDB, Express, Vue, Node) untuk mengelola distribusi pre order produk Mobile Legends,
dengan 3 akun: **admin**, **worker AR**, **worker DR**. Ada halaman live publik untuk customer memantau progres,
dashboard admin untuk kelola sesi/produk/order + kalkulator pembayaran worker, dan dashboard worker untuk
mengerjakan jatah masing-masing.

> Proyek ini awalnya dibangun dengan stack MERN (React) lalu dikonversi ke MEVN (Vue 3). Backend
> (Express + MongoDB) tidak berubah sama sekali — hanya frontend yang diganti dari React ke Vue 3
> (Composition API + `<script setup>`) beserta Vue Router menggantikan React Router.

## Struktur folder

```
preorder-mlbb/
├── server/   # Express + MongoDB (API) — tidak berubah dari versi MERN
└── client/   # Vue 3 + Vite + Tailwind (frontend)
```

## Menjalankan secara lokal

### 1. Backend

```bash
cd server
cp .env.example .env
# edit .env: isi MONGO_URI, JWT_SECRET, dan 3 akun login (admin/AR/DR)
npm install
npm run dev
```

Backend jalan di `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend jalan di `http://localhost:5173` (proxy otomatis ke backend saat development).

Buka `http://localhost:5173`:
- **Halaman utama (`/`)** — halaman live, publik, tanpa login. Customer pilih tab sesi lalu cari ID/server.
- **`/login`** — login admin atau worker pakai akun dari `.env`.
- **`/admin`** — dashboard admin.
- **`/worker`** — dashboard worker (otomatis sesuai akun AR/DR yang login).

## Alur kerja singkat

1. **Admin** buat tab **sesi** (mis. "Batch 12 September"), lalu buat tab **produk** di dalam sesi itu
   (mis. "59 Diamond", "Weekly Diamond Pass") — bisa dibuat/dihapus kapan saja.
2. Admin **tambah order**: pilih produk, isi ID, server, kuantitas, lalu bagi jatahnya ke worker AR/DR
   (boleh semua ke satu worker, atau dibagi ke keduanya).
3. **Worker** login, hanya melihat order yang ada jatah untuknya, lengkap dengan counter (`+1 Done`,
   `+1 Reffund`, tombol batal, tombol "ID Salah", tombol "Update").
4. Progress bar otomatis:
   - **kuning** = masih ada sisa yang belum diproses,
   - **hijau** = porsi yang sudah `done`,
   - **merah** = porsi `reffund`, atau seluruh bar merah kalau ditandai **ID Salah**.
5. **Halaman live** (customer) menampilkan tabel antrian per sesi dengan progress bar gabungan (AR+DR),
   kolom worker AR/DR, status, dan waktu update terakhir — plus kolom pencarian ID/server. Refresh otomatis
   tiap 8 detik.
6. Admin mengatur **harga satuan per produk** (tidak terlihat oleh worker), lalu di panel **Pembayaran worker**
   klik **Cek** untuk menghitung total (`done × harga` per produk), dan **Kirim ke worker** untuk menyimpan
   totalan itu supaya muncul di dashboard worker yang bersangkutan.

## Catatan implementasi / asumsi

- Status order (`antri`, `proses`, `done`, `reffund`, `salah id`) dihitung otomatis dari counter
  `done`/`refund` dan flag `salahId`, bukan diisi manual — supaya tidak bisa tidak sinkron dengan progress bar.
- "Update" adalah tombol terpisah yang menyetel stempel waktu (`lastUpdate`) yang tampil di halaman live,
  sesuai permintaan agar customer tahu kapan terakhir dicek/diproses.
- Login memakai 3 akun tetap dari `.env` (bukan koleksi user di database) sesuai permintaan.
- Worker hanya bisa mengubah progres miliknya sendiri (dicek juga di backend, bukan cuma disembunyikan di UI).
- Deploy: backend bisa di-deploy ke layanan Node apa saja (Render/Railway/VPS) + MongoDB Atlas; frontend
  bisa di-deploy ke Vercel/Netlify dengan environment variable proxy diarahkan ke URL backend produksi
  (`vite.config.js` proxy hanya untuk development).

## Catatan migrasi MERN → MEVN

- `AuthContext`/`ToastContext` (React Context API) → `stores/auth.js` dan `stores/toast.js`, composable
  sederhana berbasis `reactive()` dari Vue (bukan Pinia, supaya dependensinya tetap minim seperti versi asli).
- React Router (`<Routes>`, `<Route>`, komponen `Protected`) → Vue Router dengan `meta.roles` per rute dan
  `router.beforeEach` sebagai pengganti guard `Protected`.
- Komponen fungsi React (`.jsx`) → Single File Component Vue (`.vue`) dengan Composition API `<script setup>`;
  `useState`/`useEffect`/`useMemo`/`useCallback` → `ref`/`reactive`/`computed`/`watch`/`onMounted`/`onUnmounted`.
- Sub-komponen yang tadinya didefinisikan di dalam file yang sama (mis. `SimpleForm`, `HargaInput`, `OrderForm`,
  `PayoutPanel` di `AdminDashboard.jsx`) dipisah jadi file `.vue` tersendiri di `components/`, karena SFC Vue
  hanya berisi satu komponen per file.
- `src/api/client.js` (axios + interceptor token) dan seluruh isi `server/` **tidak diubah** — keduanya
  framework-agnostic.
