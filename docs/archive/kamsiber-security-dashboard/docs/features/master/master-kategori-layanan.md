# Spesifikasi Fitur: Master Kategori Layanan Permintaan

**Path URL:** `http://localhost:3000/master/kategori-layanan`
**Modul:** Master Data → Kategori Layanan
**Sumber Referensi:** FE `zpic/daskam/dashboard-kamsiber-fe-nextjs/src/app/(main)/master/kategori-layanan/page.tsx` · DB `scaffolded_models.py` (`master_kategori`, `request_layanan`)

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola daftar jenis-jenis tiket permohonan layanan IT dan Security (*Service Request Category*) yang dapat diajukan oleh pengguna maupun tim internal. Setiap kategori mendefinisikan kode unik otomatis, nama deskriptif, tingkat prioritas penanganan (Kritis/Tinggi/Sedang/Rendah), modul terkait (IT/Security/Network/Infrastruktur/Aplikasi), serta status aktif/nonaktif. Fitur ini menjadi fondasi modul tiket layanan — setiap `request_layanan` yang dibuat oleh pengguna wajib memiliki referensi ke salah satu kategori di tabel ini. Halaman juga menampilkan agregat jumlah permintaan aktif per kategori sebagai indikator beban layanan.

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini memerlukan **2 tabel utama**. Tabel `kategori_layanan` adalah tabel baru yang harus dibuat via migrasi; tabel `request_layanan` adalah tabel yang sudah ada dan perlu ditambahkan kolom FK.

```
kategori_layanan                      ← Tabel 1 (BARU): Master kategori tiket layanan
  └── request_layanan                 ← Tabel 2 (SUDAH ADA, perlu migrasi): Tiket layanan
        FK: kategori_id → kategori_layanan.id
```

> **Catatan migrasi kritis:** Tabel `kategori_layanan` belum ada di database. Tabel `master_kategori` yang sudah ada bersifat terlalu generik (tidak punya kolom `prioritas` dan `modul`) dan **tidak dapat digunakan** sebagai pengganti tabel ini. Harus dibuat tabel baru terpisah.

---

### Tabel 1: `kategori_layanan` — TABEL BARU (wajib dibuat via migrasi)

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `kode` | VARCHAR(25) UNIQUE NOT NULL | Kode unik kategori, contoh: `LAY-NWACC` — di-generate otomatis oleh BE |
| `nama` | VARCHAR(255) NOT NULL | Nama lengkap kategori layanan |
| `prioritas` | VARCHAR(10) NOT NULL | Nilai: `KRITIS`, `TINGGI`, `SEDANG`, `RENDAH` — constraint CHECK di DB |
| `modul` | VARCHAR(50) NOT NULL | Nilai: `IT`, `SECURITY`, `NETWORK`, `INFRASTRUKTUR`, `APLIKASI` |
| `deskripsi` | TEXT | Penjelasan rinci tentang kategori layanan |
| `keterangan` | VARCHAR(100) | Catatan tambahan opsional |
| `is_active` | BOOLEAN DEFAULT TRUE | `true` = Aktif, `false` = Nonaktif |
| `created_at` | TIMESTAMP | Waktu data dibuat |
| `created_by` | UUID | ID pengguna yang membuat |
| `updated_at` | TIMESTAMP | Waktu data terakhir diubah |
| `updated_by` | UUID | ID pengguna yang mengubah |

---

### Tabel 2: `request_layanan` — TABEL SUDAH ADA (perlu migrasi tambah kolom)

Tabel ini sudah ada di database. Kolom di bawah adalah seluruh kolom yang tercatat di `scaffolded_models.py`. Kolom `kategori_id` **belum ada** dan wajib ditambahkan via `ALTER TABLE`.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id_request` | UUID (PK) | Auto-generate |
| `kode_request` | VARCHAR(25) | Kode tiket layanan |
| `kode_integrasi` | VARCHAR(25) | Kode untuk integrasi sistem eksternal |
| `id_pemohon` | UUID (FK → `people.id_people`) | Pengguna yang mengajukan tiket |
| `id_unit` | INTEGER | Referensi ke tabel unit organisasi |
| `id_server` | UUID (FK → `server.id_server`) | Server terkait permintaan |
| `port` | VARCHAR(10) | Port jaringan terkait (jika ada) |
| `tanggal_mulai` | DATE | Tanggal efektif permintaan mulai |
| `tanggal_selesai` | DATE | Tanggal efektif permintaan selesai |
| `deskripsi` | VARCHAR(255) | Deskripsi isi permintaan |
| `kategori_id` | UUID (FK → `kategori_layanan.id`) | **KOLOM BARU — belum ada, wajib ditambah via ALTER TABLE** |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

---

### DDL Migrasi yang Diperlukan

```sql
-- Langkah 1: Buat tabel kategori_layanan
CREATE TABLE kategori_layanan (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  kode            VARCHAR(25)  UNIQUE NOT NULL,
  nama            VARCHAR(255) NOT NULL,
  prioritas       VARCHAR(10)  NOT NULL CHECK (prioritas IN ('KRITIS', 'TINGGI', 'SEDANG', 'RENDAH')),
  modul           VARCHAR(50)  NOT NULL CHECK (modul IN ('IT', 'SECURITY', 'NETWORK', 'INFRASTRUKTUR', 'APLIKASI')),
  deskripsi       TEXT,
  keterangan      VARCHAR(100),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  created_by      UUID,
  updated_at      TIMESTAMP,
  updated_by      UUID
);

-- Langkah 2: Tambahkan FK di request_layanan
ALTER TABLE request_layanan
  ADD COLUMN kategori_id UUID REFERENCES kategori_layanan(id);
```

---

## 3. Aturan Delete (Penghapusan)

FK di `request_layanan.kategori_id` **tidak memakai CASCADE** — database akan RESTRICT (tolak penghapusan) jika masih ada tiket yang mereferensikannya. Backend wajib memvalidasi jumlah tiket terkait sebelum mengeksekusi DELETE.

| Yang Dihapus | Boleh Dihapus Jika | Jika Ada Anak |
|---|---|---|
| `kategori_layanan` | `is_active = false` **dan** tidak ada `request_layanan` dengan `kategori_id` yang menunjuk ke baris ini | Tolak 409 Conflict — kembalikan pesan: "Kategori tidak dapat dihapus karena masih memiliki N permintaan terkait." |
| `request_layanan` | Selalu boleh dihapus (tidak punya anak dalam hierarki ini) | — |

**Aturan bisnis tambahan:**
- Kategori berstatus `Aktif` tidak boleh langsung dihapus — pengguna harus menonaktifkannya terlebih dahulu (ubah `is_active = false`) sebelum penghapusan diizinkan.
- Tombol **Hapus** di UI hanya dapat diklik jika kategori berstatus Nonaktif dan kolom `permintaan` (jumlah tiket aktif) bernilai 0.

---

## 4. Alur Lengkap FE → BE → DB

### Operasi 1 — Baca Daftar Kategori (Halaman Awal)

```
FE: Halaman dimuat → kirim permintaan dengan parameter opsional
  → GET /api/v1/master/kategori-layanan?page=1&limit=10&search=&prioritas=&modul=&status=
    BE:
      1. Parse query params (page, limit, search, prioritas, modul, status)

      3. SELECT COUNT(*) untuk total data (mendukung pagination)
    DB: Kembalikan rows + total count
  → BE: Serialisasi ke JSON { data: [...], total: N, page: 1, limit: 10 }
  → FE: Render tabel + hitung summary cards dari response
```

---

### Operasi 3 — Tambah Kategori Baru

```
FE: Isi form panel kanan → klik "Simpan Kategori"
    Validasi FE sebelum kirim:
      - nama: wajib isi, max 255 karakter
      - prioritas: wajib pilih
      - modul: wajib pilih
      - deskripsi: wajib isi
      - status: default Aktif
  → POST /api/v1/master/kategori-layanan
    Body: { nama, prioritas, modul, deskripsi, status, keterangan }
    BE:
      1. Validasi input (schema validation)
      2. Generate kode unik otomatis:
         - Format: LAY-{prefix 4–6 huruf berdasarkan nama} contoh: nama "VPN Access" → LAY-VPNACC
         - Pastikan kode belum ada di DB (SELECT COUNT WHERE kode = ?)
         - Jika bentrok, tambahkan suffix angka: LAY-VPNACC2, LAY-VPNACC3
      3. INSERT INTO kategori_layanan
         (kode, nama, prioritas, modul, deskripsi, keterangan, is_active, created_by)
         VALUES (:kode, :nama, :prioritas, :modul, :deskripsi, :keterangan, :is_active, :user_id)
    DB: Simpan baris baru, kembalikan id + kode yang ter-generate
  → BE: 201 Created { id, kode, nama, ... }
  → FE: Reset form, refresh tabel dan summary cards, tampilkan toast sukses
```

---



---


---

### Operasi 6 — Filter dan Pencarian

```
FE: Pengguna mengetik di kolom pencarian atau memilih dropdown filter
    (search, filterPrioritas, filterModul, filterStatus)
  → GET /api/v1/master/kategori-layanan?search=vpn&prioritas=TINGGI&modul=SECURITY&status=aktif&page=1&limit=10
    BE: Terapkan WHERE clause dinamis (lihat Operasi 1)
    DB: Kembalikan hasil yang difilter
  → FE: Render ulang tabel dengan hasil filter, perbarui teks "X–Y dari Z kategori"
```

---

### Operasi 7 — Pagination

```
FE: Pengguna klik nomor halaman atau tombol ChevronLeft/ChevronRight
  → GET /api/v1/master/kategori-layanan?page=2&limit=10&[...filter aktif]
    BE: Hitung OFFSET = (page - 1) * limit, terapkan semua filter yang sama
    DB: Kembalikan slice data sesuai halaman
  → FE: Render tabel halaman baru, perbarui state pagination
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/master/kategori-layanan` | SELECT + COUNT permintaan + filter + pagination | `kategori_layanan`, `request_layanan` |
| GET | `/api/v1/master/kategori-layanan/summary` | SELECT COUNT agregat untuk summary cards | `kategori_layanan`, `request_layanan` |
| GET | `/api/v1/master/kategori-layanan/{id}` | SELECT satu baris by ID | `kategori_layanan` |
| POST | `/api/v1/master/kategori-layanan` | INSERT + auto-generate kode | `kategori_layanan` |
| PUT | `/api/v1/master/kategori-layanan/{id}` | UPDATE (nama, prioritas, modul, deskripsi, keterangan, is_active) | `kategori_layanan` |
| DELETE | `/api/v1/master/kategori-layanan/{id}` | Soft delete — validasi anak terlebih dahulu | `kategori_layanan` |

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Halaman

Menampilkan judul "Master Kategori Layanan Permintaan" dengan ikon `ListChecks` (sky-500) dan deskripsi: *"Modul pengelola jenis-jenis tiket permohonan atau layanan IT/Security yang dapat diajukan oleh pengguna atau tim internal."*

---

### 6.2. Summary Cards (3 kartu statistik)

Grid 3 kolom (`md:grid-cols-3`), masing-masing kartu berupa `rounded-xl` putih dengan border dan shadow tipis.

| Kartu | Ikon | Warna | Nilai | Sumber Data |
|-------|------|-------|-------|-------------|
| Kategori Aktif | `CheckCircle` | Hijau (`green-600`) | Jumlah baris `is_active = true` | `GET /summary` → `kategori_aktif` |
| Kategori Nonaktif | `Tag` | Abu (`slate-500`) | Jumlah baris `is_active = false` | `GET /summary` → `kategori_nonaktif` |
| Total Permintaan Aktif | `Zap` (fill) | Merah (`red-600`) | COUNT tiket di kategori aktif | `GET /summary` → `total_permintaan_aktif` |

---

### 6.3. Toolbar Filter dan Pencarian

Panel `rounded-xl` putih di atas tabel, berisi elemen horizontal (flex wrap):
- **Input pencarian** (`w-70`) — placeholder "Cari kategori, kode, modul..." — filter terhadap `kode`, `nama`, `modul`
- **Dropdown Prioritas** (`w-35`) — opsi: Semua Prioritas | Kritis | Tinggi | Sedang | Rendah
- **Dropdown Modul** (`w-35`) — opsi: Semua Modul | IT | Security | Network | Infrastruktur | Aplikasi
- **Dropdown Status** (`w-35`) — opsi: Semua Status | Aktif | Nonaktif
- **Teks info** (`ml-auto`, xs, slate-400) — "X–Y dari Z kategori"

---

### 6.4. Tabel Data Kategori

Tabel responsif `overflow-x-auto` dengan `min-w-200`. Header baris menggunakan `bg-slate-50` dengan teks uppercase `text-[11px] font-semibold text-slate-500`.

| Kolom | Lebar | Tampilan |
|-------|-------|----------|
| Kode | auto | `font-bold text-sky-700`, contoh: `LAY-NWACC` |
| Nama Kategori | `max-w-55` | `font-bold text-slate-800` dengan `truncate` dan `title` tooltip |
| Prioritas | auto | Badge pill berwarna (lihat 6.4.1) |
| Modul | auto | Badge pill berwarna (lihat 6.4.2) |
| Permintaan | center | Badge bulat `w-6.5 h-6.5` — merah jika > 0, abu jika = 0 |
| Status | auto | Badge pill hijau (Aktif) atau abu (Nonaktif) |
| Aksi | center | Tombol Edit (`PenLine`, sky) + Hapus (`Trash2`, red) |

#### 6.4.1. Badge Prioritas
| Nilai | Warna Latar | Warna Teks | Warna Dot |
|-------|-------------|------------|-----------|
| Kritis | `red-50` | `red-600` | `red-600` |
| Tinggi | `orange-50` | `orange-600` | `orange-600` |
| Sedang | `amber-50` | `amber-600` | `amber-600` |
| Rendah | `blue-50` | `blue-600` | `blue-600` |

#### 6.4.2. Badge Modul
| Nilai | Warna Latar | Warna Teks |
|-------|-------------|------------|
| Network | `green-50` | `green-600` |
| Security | `red-50` | `red-600` |
| IT | `blue-50` | `blue-600` |
| Infrastruktur | `amber-50` | `amber-600` |
| Aplikasi | `slate-50` | `slate-600` |

---

### 6.5. Pagination

Panel `rounded-xl` putih di bawah tabel. Kiri: teks "Halaman X dari Y". Kanan: tombol navigasi:
- `ChevronLeft` — dinonaktifkan di halaman pertama (`cursor-not-allowed`, `text-slate-300`)
- Nomor halaman — halaman aktif ditandai `bg-sky-500 text-white border-sky-500`
- `ChevronRight` — dinonaktifkan di halaman terakhir

---

### 6.6. Panel Form Tambah Kategori (Sidebar Kanan)

Panel `rounded-xl` putih di sebelah kanan tabel (`xl:w-[380px]`, `sticky top-4`). Berisi form dengan field berikut:

| Field | Tipe Input | Wajib | Keterangan |
|-------|-----------|-------|------------|
| Nama Kategori | `input text` | Ya | Placeholder: "Contoh: Permintaan VPN Access" |
| Prioritas | `select` | Ya | Opsi: Kritis, Tinggi, Sedang, Rendah |
| Modul | `select` | Ya | Opsi: IT, Security, Network, Infrastruktur, Aplikasi |
| Deskripsi | `textarea` (3 baris) | Ya | Placeholder: "Jelaskan kategori layanan secara rinci..." |
| Status | `select` | Tidak | Opsi: Aktif (default), Nonaktif |
| Keterangan | `textarea` (2 baris) | Tidak | Placeholder: "Catatan tambahan..." |

Tombol submit: `Simpan Kategori` (ikon `Save`, `bg-sky-500 hover:bg-sky-600`).

Panel juga memuat dua info box di bawah tombol:
- **Info abu** (`bg-slate-50`): Penjelasan fungsi kategori layanan
- **Info biru** (`bg-blue-50`): Contoh pengisian: `LAY-NWACC — Permintaan Akses Jaringan | Modul: Network`

> **Catatan:** Saat ini panel hanya mendukung mode **Tambah**. Untuk mode **Edit**, UI harus dapat menerima data baris terpilih, mengganti judul panel menjadi "Edit Kategori", men-disable field `Kode`, dan mengganti tombol menjadi "Perbarui Kategori". Implementasi ini **belum ada** di FE saat ini.

---

## 7. Ringkasan & Kekurangan

### Sudah Ada

- Desain UI halaman sudah lengkap di FE: header, 3 summary cards, toolbar filter, tabel dengan 7 kolom, pagination, dan panel form tambah.
- Semua opsi filter FE sudah terdefinisi (Prioritas: 4 opsi, Modul: 5 opsi, Status: 2 opsi).
- Logika rendering badge berwarna untuk Prioritas, Modul, Permintaan, dan Status sudah terimplementasi di FE.
- Tabel `request_layanan` sudah ada di database sebagai tabel target untuk relasi agregat.
- Rekomendasi DDL migrasi sudah disusun dan siap dieksekusi.

### Kekurangan — Gap Database

| Gap | Dampak | Solusi |
|-----|--------|--------|
| Tabel `kategori_layanan` **belum ada** | Seluruh FE dan BE tidak bisa berfungsi | Jalankan DDL `CREATE TABLE kategori_layanan` |
| Kolom `kategori_id` di `request_layanan` **belum ada** | Kolom `permintaan` di tabel tidak bisa dihitung via JOIN | Jalankan `ALTER TABLE request_layanan ADD COLUMN kategori_id UUID` |
| Tabel `master_kategori` yang ada **tidak dapat dipakai** sebagai pengganti | Tidak ada kolom `prioritas`, `modul`, `nama` khusus layanan | Biarkan `master_kategori` untuk keperluan lain; buat tabel baru |

### Kekurangan — Frontend

| Gap | Dampak | Solusi |
|-----|--------|--------|
| Data tabel menggunakan `useState` hardcoded — **belum terhubung ke API** | Halaman tidak menampilkan data nyata dari DB | Implementasi `useEffect` + `fetch` / `axios` / `SWR` ke endpoint GET |
| Summary cards menampilkan angka statis (11, 1, 44) | Tidak mencerminkan data DB | Fetch dari endpoint `/summary` |
| Tombol Edit **tidak memiliki handler** (`onClick` tidak ada) | Fungsi edit sama sekali tidak berjalan | Tambahkan handler yang membuka panel dalam mode edit dengan data baris terpilih |
| Tombol Hapus **tidak memiliki handler** (`onClick` tidak ada) | Fungsi hapus sama sekali tidak berjalan | Tambahkan handler dengan dialog konfirmasi dan pemanggilan endpoint DELETE |
| Filter search, prioritas, modul, status **hanya mengubah state lokal** tanpa efek ke data | Filtering tidak berfungsi | Hubungkan state filter ke query param API saat `useEffect` dipanggil ulang |
| Pagination menampilkan "Halaman 1 dari 2" secara statis — **dummy** | Navigasi halaman tidak berfungsi | Hubungkan ke total count dari API dan implementasi logika halaman |
| Kode kategori (`LAY-NWACC`) ditampilkan di tabel tapi **tidak ada field kode di form tambah** | Pengguna tidak bisa tahu kode yang akan di-generate | Tambahkan logika auto-generate kode di BE dan tampilkan kode hasil generate setelah simpan berhasil |

### Status Implementasi

> **Status: Menunggu migrasi DB.** Implementasi backend dan koneksi FE ke API **belum boleh dimulai** sebelum dua langkah berikut selesai:
> 1. `CREATE TABLE kategori_layanan` dengan kolom `is_active` dan ``
> 2. `ALTER TABLE request_layanan ADD COLUMN kategori_id UUID REFERENCES kategori_layanan(id)`
