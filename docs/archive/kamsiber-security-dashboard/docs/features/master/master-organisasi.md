# Spesifikasi Fitur: Master Organisasi

**Path URL:** `http://localhost:3000/master/organisasi`  
**Modul:** Master Data  
**Sumber Referensi:** Analisis desain lama `zpic/daskam` (`MasterOrganisasiPage`), `scaffolded_models.py`

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola struktur organisasi perusahaan secara hierarkis. Pengguna dapat melihat dan mengelola lima lapisan hirarki organisasi: Organisasi (unit induk) → Direktorat → Divisi → Bidang → Sub Bidang.

Data organisasi ini digunakan sebagai referensi di seluruh aplikasi Kamsiber, terutama untuk mengaitkan Aplikasi/Sistem ke unit organisasi pengelolanya (melalui FK `sub_bidang_id` di tabel `aplikasi`). Setiap Organisasi wajib dikaitkan ke satu **Site** (lokasi fisik) yang dikelola di tabel pendukung `master_site`.

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **6 tabel** yang membentuk satu rantai hierarki vertikal tunggal:

- **1 tabel pendukung** (`master_site`) sebagai root referensi lokasi
- **5 tabel inti** yang membentuk hirarki organisasi dari induk ke cabang terdalam

```
master_site                        ← Tabel 0: Lokasi/Site (pendukung, root referensi)
  └── organisasi                   ← Tabel 1: Unit Organisasi induk (FK ke master_site)
        └── direktorat             ← Tabel 2: Direktorat dalam satu Organisasi
              └── divisi           ← Tabel 3: Divisi dalam satu Direktorat
                    └── bidang     ← Tabel 4: Bidang dalam satu Divisi
                          └── sub_bidang  ← Tabel 5: Sub Bidang dalam satu Bidang
                                └── (FK) aplikasi  ← Tabel di modul Aplikasi, BUKAN bagian fitur ini
```

---

### Tabel 0: `master_site` (Tabel Pendukung)

Tabel ini bukan bagian utama fitur Master Organisasi, namun **wajib ada** karena kolom `site_id` di tabel `organisasi` adalah FK NOT NULL ke tabel ini. Pengguna harus dapat memilih site saat membuat Organisasi baru.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) NOT NULL UNIQUE | Surrogate UUID string |
| `nama_site` | VARCHAR(255) NOT NULL | Nama lokasi, misal "Kantor Pusat Jakarta" |
| `kode` | VARCHAR(50) NOT NULL UNIQUE | Kode unik site |
| `is_active` | BOOLEAN NOT NULL | `true` = Aktif |
| `alamat` | TEXT | Alamat lengkap (nullable) |
| `kota` | VARCHAR(255) | Nama kota (nullable) |
| `tipe` | VARCHAR(50) | Tipe site, misal "Pusat"/"Cabang" (nullable) |
| `deskripsi` | TEXT | Deskripsi tambahan (nullable) |
| `created_at` | TIMESTAMP NOT NULL | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

> **Catatan:** Tabel `master_site` dikelola oleh modul terpisah (Master Lokasi/Site). Fitur Master Organisasi hanya **membaca** daftar site aktif (`is_active = true`) untuk mengisi dropdown `site_id` saat form tambah/edit Organisasi.

---

### Tabel 1: `organisasi`

Unit organisasi paling atas. Setiap Organisasi wajib terikat ke satu Site.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) NOT NULL UNIQUE | Surrogate UUID string |
| `nama` | VARCHAR(255) NOT NULL | Nama unit organisasi |
| `kode` | VARCHAR(50) NOT NULL UNIQUE | Kode unik organisasi |
| `site_id` | UUID NOT NULL (FK → `master_site.id`) | Lokasi organisasi, wajib diisi |
| `is_active` | BOOLEAN NOT NULL | `true` = Aktif, `false` = Nonaktif |
| `deskripsi` | TEXT | Deskripsi (nullable) |
| `source_system` | VARCHAR(50) | Sistem sumber data (nullable), misal "SAP", "Manual" |
| `created_at` | TIMESTAMP NOT NULL | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

**FK Constraint:** `organisasi_site_id_fkey` → `master_site.id`  
**Index:** `organisasi_kode_idx` (unique), `organisasi_site_id_idx`

---

### Tabel 2: `direktorat`

Satu Organisasi dapat memiliki banyak Direktorat.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) NOT NULL UNIQUE | Surrogate UUID string |
| `organisasi_id` | UUID NOT NULL (FK → `organisasi.id`) | Induk Organisasi |
| `nama` | VARCHAR(255) NOT NULL | Nama direktorat |
| `kode` | VARCHAR(50) NOT NULL UNIQUE | Kode unik direktorat |
| `is_active` | BOOLEAN NOT NULL | `true` = Aktif |
| `deskripsi` | TEXT | Deskripsi (nullable) |
| `source_system` | VARCHAR(50) | Sistem sumber data (nullable) |
| `created_at` | TIMESTAMP NOT NULL | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

**FK Constraint:** `direktorat_organisasi_id_fkey` → `organisasi.id`  
**Index:** `direktorat_kode_idx` (unique), `direktorat_organisasi_id_idx`

---

### Tabel 3: `divisi`

Satu Direktorat dapat memiliki banyak Divisi.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) NOT NULL UNIQUE | Surrogate UUID string |
| `direktorat_id` | UUID NOT NULL (FK → `direktorat.id`) | Induk Direktorat |
| `nama` | VARCHAR(255) NOT NULL | Nama divisi |
| `kode` | VARCHAR(50) NOT NULL UNIQUE | Kode unik divisi |
| `is_active` | BOOLEAN NOT NULL | `true` = Aktif |
| `deskripsi` | TEXT | Deskripsi (nullable) |
| `source_system` | VARCHAR(50) | Sistem sumber data (nullable) |
| `created_at` | TIMESTAMP NOT NULL | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

**FK Constraint:** `divisi_direktorat_id_fkey` → `direktorat.id`  
**Index:** `divisi_kode_idx` (unique), `divisi_direktorat_id_idx`

---

### Tabel 4: `bidang`

Satu Divisi dapat memiliki banyak Bidang.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) NOT NULL UNIQUE | Surrogate UUID string |
| `divisi_id` | UUID NOT NULL (FK → `divisi.id`) | Induk Divisi |
| `nama` | VARCHAR(255) NOT NULL | Nama bidang |
| `kode` | VARCHAR(50) NOT NULL UNIQUE | Kode unik bidang |
| `is_active` | BOOLEAN NOT NULL | `true` = Aktif |
| `deskripsi` | TEXT | Deskripsi (nullable) |
| `source_system` | VARCHAR(50) | Sistem sumber data (nullable) |
| `created_at` | TIMESTAMP NOT NULL | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

**FK Constraint:** `bidang_divisi_id_fkey` → `divisi.id`  
**Index:** `bidang_kode_idx` (unique), `bidang_divisi_id_idx`

---

### Tabel 5: `sub_bidang`

Lapisan terdalam hierarki. Sub Bidang adalah unit operasional yang langsung menggunakan dan mengelola aplikasi/sistem. FK dari tabel `aplikasi` mengarah ke tabel ini.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) NOT NULL UNIQUE | Surrogate UUID string |
| `bidang_id` | UUID NOT NULL (FK → `bidang.id`) | Induk Bidang |
| `nama` | VARCHAR(255) NOT NULL | Nama sub bidang |
| `kode` | VARCHAR(50) NOT NULL UNIQUE | Kode unik sub bidang |
| `is_active` | BOOLEAN NOT NULL | `true` = Aktif |
| `deskripsi` | TEXT | Deskripsi (nullable) |
| `source_system` | VARCHAR(50) | Sistem sumber data (nullable) |
| `created_at` | TIMESTAMP NOT NULL | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

**FK Constraint:** `sub_bidang_bidang_id_fkey` → `bidang.id`  
**Index:** `sub_bidang_kode_idx` (unique), `sub_bidang_bidang_id_idx`

> **Catatan:** Tabel `aplikasi` (modul Aplikasi/Sistem) memiliki FK ke `sub_bidang.id` untuk mengidentifikasi unit pengelola. Penghapusan Sub Bidang yang masih memiliki Aplikasi terdaftar harus ditolak.

---

### Field yang Dihitung (Derived/Computed) — Tidak Ada di DB

Tidak ada kolom kalkulasi di skema DB. Nilai-nilai berikut dihitung oleh BE saat merakit respons:

| Field (di Respons API) | Cara Hitung |
|------------------------|-------------|
| `status` (string FE) | Konversi dari `is_active` boolean: `true` → `"Aktif"`, `false` → `"Nonaktif"` |
| `children` (array rekursif) | BE merakit tree dari 5 query terpisah setelah semua data diambil |
| `nama_site` | JOIN `master_site` saat query `organisasi` untuk tampil di FE |

---

## 3. Aturan Delete (Penghapusan)

FK di semua tabel hierarki ini **tidak memakai CASCADE** — database akan RESTRICT (tolak) jika masih ada data anak. Backend wajib memvalidasi keberadaan data anak sebelum mengeksekusi DELETE.

| Yang Dihapus | Boleh Dihapus Jika | Jika Ada Anak |
|---|---|---|
| `organisasi` | Tidak ada `direktorat` yang merujuk ke organisasi ini | Tolak 409 Conflict |
| `direktorat` | Tidak ada `divisi` yang merujuk ke direktorat ini | Tolak 409 Conflict |
| `divisi` | Tidak ada `bidang` yang merujuk ke divisi ini | Tolak 409 Conflict |
| `bidang` | Tidak ada `sub_bidang` yang merujuk ke bidang ini | Tolak 409 Conflict |
| `sub_bidang` | Tidak ada `aplikasi` yang merujuk ke sub bidang ini | Tolak 409 Conflict |

**Aturan bisnis tambahan:**
- Node manapun dengan `is_active = true` yang memiliki anak aktif tidak boleh dinonaktifkan secara langsung — anak-anak harus dinonaktifkan dulu, atau nonaktifkan secara rekursif melalui satu operasi yang atomik.
- Tombol **Hapus** di UI harus menampilkan konfirmasi modal (bukan `window.confirm()`) yang menyebutkan jumlah data anak yang akan terdampak.
- Tidak ada **soft delete** (`is_active`) di tabel manapun saat ini. Semua hapus adalah **hard delete permanen** — lihat bagian Kekurangan.

---

## 4. Alur Lengkap FE → BE → DB

### Operasi: GET Tree Hierarki (Tampil Awal)

Ini adalah operasi paling kompleks. BE harus menjalankan 5 query dan merakit struktur nested JSON.

```
FE: Halaman dimuat → render tree kosong dengan skeleton loader
  → GET /api/v1/organisasi/tree?site_id=&search=&status=
    BE:
      1. SELECT * FROM organisasi WHERE is_active berdasar filter
      2. SELECT * FROM direktorat WHERE organisasi_id IN (ids dari langkah 1)
      3. SELECT * FROM divisi WHERE direktorat_id IN (ids dari langkah 2)
      4. SELECT * FROM bidang WHERE divisi_id IN (ids dari langkah 3)
      5. SELECT * FROM sub_bidang WHERE bidang_id IN (ids dari langkah 4)
      6. Rakit struktur TreeNode bersarang di Python:
         - Untuk setiap organisasi, tempelkan direktorat sebagai children[]
         - Untuk setiap direktorat, tempelkan divisi sebagai children[]
         - dst. sampai sub_bidang
         - Konversi is_active boolean → status string "Aktif"/"Nonaktif"
         - Map nama → name, kode → code sesuai interface FE
    DB: 5x SELECT, tidak ada transaksi
  → FE: Render pohon hierarki, simpan di state, aktifkan filter dan pencarian
```

---

### Operasi: Tambah Node Baru (POST per Level)

Setiap level memiliki endpoint sendiri. Contoh alur untuk setiap level:

**Tambah Organisasi (level 1):**
```
FE: Klik "Tambah Organisasi" → isi form (nama, kode, site_id, deskripsi, is_active) → Submit
  → POST /api/v1/organisasi
    Body: { nama, kode, site_id, deskripsi, source_system, is_active }
    BE:
      1. Validasi kode tidak duplikat: SELECT id FROM organisasi WHERE kode = ?
      2. Validasi site_id ada dan aktif: SELECT id FROM master_site WHERE id = ? AND is_active = true
      3. INSERT INTO organisasi (nama, kode, site_id, is_active, deskripsi, source_system, created_by, created_at)
    DB: Simpan baris baru, kembalikan id organisasi baru
  → FE: Node baru muncul di root tree, form ditutup
```

**Tambah Direktorat (level 2):**
```
FE: Klik kanan / tombol "+" pada node Organisasi → isi form (nama, kode, deskripsi) → Submit
  → POST /api/v1/organisasi/{organisasi_id}/direktorat
    Body: { nama, kode, deskripsi, source_system, is_active }
    BE:
      1. Validasi organisasi_id ada: SELECT id FROM organisasi WHERE id = ?
      2. Validasi kode tidak duplikat: SELECT id FROM direktorat WHERE kode = ?
      3. INSERT INTO direktorat (organisasi_id, nama, kode, is_active, deskripsi, source_system, created_by, created_at)
    DB: Simpan baris baru
  → FE: Node Direktorat baru muncul sebagai anak dari Organisasi yang dipilih
```

**Tambah Divisi (level 3):**
```
FE: Klik tombol "+" pada node Direktorat → isi form → Submit
  → POST /api/v1/direktorat/{direktorat_id}/divisi
    Body: { nama, kode, deskripsi, source_system, is_active }
    BE:
      1. Validasi direktorat_id ada
      2. Validasi kode tidak duplikat di tabel divisi
      3. INSERT INTO divisi (direktorat_id, nama, kode, is_active, deskripsi, source_system, created_by, created_at)
    DB: Simpan baris baru
  → FE: Node Divisi baru muncul sebagai anak dari Direktorat yang dipilih
```

**Tambah Bidang (level 4):**
```
FE: Klik tombol "+" pada node Divisi → isi form → Submit
  → POST /api/v1/divisi/{divisi_id}/bidang
    Body: { nama, kode, deskripsi, source_system, is_active }
    BE:
      1. Validasi divisi_id ada
      2. Validasi kode tidak duplikat di tabel bidang
      3. INSERT INTO bidang (divisi_id, nama, kode, is_active, deskripsi, source_system, created_by, created_at)
    DB: Simpan baris baru
  → FE: Node Bidang baru muncul sebagai anak dari Divisi yang dipilih
```

**Tambah Sub Bidang (level 5):**
```
FE: Klik tombol "+" pada node Bidang → isi form → Submit
  → POST /api/v1/bidang/{bidang_id}/sub-bidang
    Body: { nama, kode, deskripsi, source_system, is_active }
    BE:
      1. Validasi bidang_id ada
      2. Validasi kode tidak duplikat di tabel sub_bidang
      3. INSERT INTO sub_bidang (bidang_id, nama, kode, is_active, deskripsi, source_system, created_by, created_at)
    DB: Simpan baris baru
  → FE: Node Sub Bidang baru muncul sebagai anak dari Bidang yang dipilih
```

---

### Operasi: Edit Node (PUT per Level)

Pola yang sama berlaku untuk semua 5 level. Contoh untuk Organisasi:

```
FE: Klik ikon edit pada node Organisasi → form pre-filled → ubah data → Submit
  → PUT /api/v1/organisasi/{id}
    Body: { nama, kode, site_id, deskripsi, source_system, is_active }
    BE:
      1. Validasi organisasi ada: SELECT id FROM organisasi WHERE id = ?
      2. Jika kode berubah: validasi tidak duplikat dengan kode lain
      3. Jika site_id berubah: validasi site_id ada dan aktif
      4. UPDATE organisasi SET nama=?, kode=?, site_id=?, is_active=?, deskripsi=?,
         source_system=?, updated_at=NOW(), updated_by=?
         WHERE id = ?
    DB: Update baris, kembalikan data terbaru
  → FE: Node di tree diperbarui in-place
```

Endpoint edit untuk level lain mengikuti pola yang sama dengan validasi FK induk masing-masing.

---

### Operasi: Hapus Node (DELETE per Level)

```
FE: Klik ikon hapus → modal konfirmasi muncul ("Anda yakin menghapus [nama]?
    Node ini memiliki X anak yang juga akan terdampak.")
    → Klik "Ya, Hapus" di modal → kirim request
  → DELETE /api/v1/organisasi/{id}   (atau level lain sesuai node yang dipilih)
    BE:
      1. Cek apakah ada data anak:
         SELECT COUNT(*) FROM direktorat WHERE organisasi_id = ?
      2. Jika COUNT > 0: kembalikan 409 Conflict
         { "error": "Tidak dapat menghapus: masih memiliki N direktorat" }
      3. Jika COUNT = 0: DELETE FROM organisasi WHERE id = ?
    DB: Hapus baris (hard delete permanen)
  → FE: Node dihapus dari tree, tampilkan notifikasi sukses
       Jika 409: tampilkan pesan error di modal
```

---

### Operasi: Toggle Status Aktif/Nonaktif

```
FE: Klik toggle/badge status pada node → konfirmasi singkat → kirim request
  → PATCH /api/v1/organisasi/{id}/status   (atau level lain)
    Body: { is_active: true/false }
    BE:
      1. Jika is_active = false (menonaktifkan):
         Opsional — cek apakah ada anak aktif dan beri peringatan
      2. UPDATE [tabel] SET is_active=?, updated_at=NOW(), updated_by=? WHERE id = ?
    DB: Update kolom is_active
  → FE: Badge status node berubah antara "Aktif" dan "Nonaktif"
```

---

### Operasi: Filter & Pencarian Tree

```
FE: User mengetik di kolom pencarian atau memilih filter status/site
  → GET /api/v1/master/organisasi/tree?search=keyword&status=aktif&site_id=uuid
    BE:
      1. Terapkan filter pada query organisasi:
         WHERE (nama ILIKE '%keyword%' OR kode ILIKE '%keyword%')
         AND (is_active = true jika status=aktif)
         AND (site_id = ? jika filter site dipilih)
      2. Ambil semua anak dari organisasi yang lolos filter
      3. Rakit tree seperti operasi GET biasa
    DB: 5x SELECT dengan WHERE clause
  → FE: Tree dirender ulang hanya menampilkan node yang sesuai filter
```

---

## 5. Ringkasan Endpoint API

Semua endpoint berada di bawah prefix `/api/v1/master/organisasi`.

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/master/organisasi/tree` | Lazy-load node; query param `level`, `parent_id`, `parent_level`, `page`, `limit`, `search`, `status`, `site_id` | 5 tabel hierarki |
| GET | `/api/v1/master/organisasi/sites` | SELECT site aktif (untuk dropdown site) | `master_site` |
| GET | `/api/v1/master/organisasi/bidang-options` | SELECT bidang aktif (untuk dropdown) | `bidang` |
| GET | `/api/v1/master/organisasi/sub-bidang-options` | SELECT sub-bidang aktif (untuk dropdown) | `sub_bidang` |
| GET | `/api/v1/master/organisasi` | SELECT list flat dengan pagination | `organisasi` |
| POST | `/api/v1/master/organisasi` | INSERT + validasi kode unik + validasi site_id | `organisasi` |
| PUT | `/api/v1/master/organisasi/{id}` | UPDATE + validasi kode unik + validasi site_id | `organisasi` |
| PATCH | `/api/v1/master/organisasi/{id}/status` | UPDATE is_active | `organisasi` |
| DELETE | `/api/v1/master/organisasi/{id}` | Cek anak direktorat, DELETE jika kosong | `organisasi` |
| POST | `/api/v1/master/organisasi/{org_id}/direktorat` | INSERT + validasi kode unik | `direktorat` |
| PUT | `/api/v1/master/organisasi/direktorat/{dir_id}` | UPDATE + validasi kode unik | `direktorat` |
| PATCH | `/api/v1/master/organisasi/direktorat/{dir_id}/status` | UPDATE is_active | `direktorat` |
| DELETE | `/api/v1/master/organisasi/direktorat/{dir_id}` | Cek anak divisi, DELETE jika kosong | `direktorat` |
| POST | `/api/v1/master/organisasi/direktorat/{dir_id}/divisi` | INSERT + validasi kode unik | `divisi` |
| PUT | `/api/v1/master/organisasi/divisi/{div_id}` | UPDATE + validasi kode unik | `divisi` |
| PATCH | `/api/v1/master/organisasi/divisi/{div_id}/status` | UPDATE is_active | `divisi` |
| DELETE | `/api/v1/master/organisasi/divisi/{div_id}` | Cek anak bidang, DELETE jika kosong | `divisi` |
| POST | `/api/v1/master/organisasi/divisi/{div_id}/bidang` | INSERT + validasi kode unik | `bidang` |
| PUT | `/api/v1/master/organisasi/bidang/{bid_id}` | UPDATE + validasi kode unik | `bidang` |
| PATCH | `/api/v1/master/organisasi/bidang/{bid_id}/status` | UPDATE is_active | `bidang` |
| DELETE | `/api/v1/master/organisasi/bidang/{bid_id}` | Cek anak sub_bidang, DELETE jika kosong | `bidang` |
| POST | `/api/v1/master/organisasi/bidang/{bid_id}/sub-bidang` | INSERT + validasi kode unik | `sub_bidang` |
| PUT | `/api/v1/master/organisasi/sub-bidang/{sub_id}` | UPDATE + validasi kode unik | `sub_bidang` |
| PATCH | `/api/v1/master/organisasi/sub-bidang/{sub_id}/status` | UPDATE is_active | `sub_bidang` |
| DELETE | `/api/v1/master/organisasi/sub-bidang/{sub_id}` | Cek FK di tabel aplikasi, DELETE jika kosong | `sub_bidang` |

> **Catatan tree lazy-load:** Tree tidak mengambil semua level sekaligus. FE mengirim `parent_id` + `parent_level` untuk memuat anak suatu node secara on-demand. Tanpa `parent_id`, endpoint mengembalikan root nodes (level organisasi) dengan indikator `has_children`.

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Cards

| Card | Cara Hitung |
|------|-------------|
| **Total Organisasi** | `COUNT(*) FROM organisasi WHERE is_active = true` |
| **Total Direktorat** | `COUNT(*) FROM direktorat WHERE is_active = true` |
| **Total Divisi** | `COUNT(*) FROM divisi WHERE is_active = true` |
| **Total Unit (Bidang + Sub Bidang)** | `COUNT(*) FROM bidang` + `COUNT(*) FROM sub_bidang` |

### 6.2. Tab Navigasi

| Tab | Status | Keterangan |
|-----|--------|-----------|
| Organisasi | Aktif (sudah ada UI) | Tab utama, menampilkan tree hierarki |
| Personal Subarea | Diimplementasi tapi kosong | Konten belum ada, perlu implementasi terpisah |
| Direktorat | Disabled di FE lama | Bisa diaktifkan jika diperlukan tampilan flat |
| Divisi | Disabled di FE lama | Bisa diaktifkan jika diperlukan tampilan flat |
| Bidang | Disabled di FE lama | Bisa diaktifkan jika diperlukan tampilan flat |
| Sub Bidang | Disabled di FE lama | Bisa diaktifkan jika diperlukan tampilan flat |

### 6.3. Toolbar & Filter

- **Input pencarian** — filter berdasar `nama` atau `kode` node (semua level)
- **Dropdown Status** — filter `is_active`: Semua / Aktif / Nonaktif
- **Dropdown Site** — filter organisasi berdasarkan `site_id` (isi dari `master_site`)
- **Tombol "Tambah Organisasi"** — buka modal form untuk membuat unit organisasi root baru

### 6.4. Tampilan Tree Hierarki

- **Render rekursif** menggunakan komponen `TreeNode` yang dapat di-expand/collapse
- Setiap node menampilkan: nama, kode (badge), badge status Aktif/Nonaktif
- Setiap node memiliki tombol aksi: **Edit**, **Hapus**, **Tambah Anak** (kecuali Sub Bidang tidak punya "Tambah Anak")
- Indentasi visual yang jelas untuk setiap level hirarki

### 6.5. Modal Form Tambah/Edit

Form yang sama digunakan untuk Tambah dan Edit dengan perbedaan judul modal. Field form berbeda per level:

| Level | Field Wajib | Field Opsional |
|-------|-------------|----------------|
| Organisasi | nama, kode, site_id (dropdown), is_active | deskripsi, source_system |
| Direktorat | nama, kode, is_active | deskripsi, source_system |
| Divisi | nama, kode, is_active | deskripsi, source_system |
| Bidang | nama, kode, is_active | deskripsi, source_system |
| Sub Bidang | nama, kode, is_active | deskripsi, source_system |

> **Catatan:** Form Organisasi menampilkan dropdown `site_id` yang diisi dari endpoint `GET /api/v1/master/organisasi/sites`.

### 6.6. Modal Konfirmasi Hapus

- **Bukan** `window.confirm()` — harus menggunakan komponen modal standar Kamsiber
- Menampilkan nama node yang akan dihapus
- Menampilkan peringatan jika node memiliki anak
- Dua tombol: "Batal" dan "Ya, Hapus" (merah)

---

## 7. Status Implementasi

| Komponen | Status | Catatan |
|----------|--------|---------|
| DB: 5 tabel hierarki + `is_active` di semua tabel | ✓ Selesai | Kolom `kode` UNIQUE, audit columns lengkap |
| BE: Endpoint CRUD semua level | ✓ Selesai | Prefix `/api/v1/master/organisasi` |
| BE: `GET /tree` dengan lazy-load + filter | ✓ Selesai | Param: `level`, `parent_id`, `parent_level`, `page`, `limit` |
| BE: Dropdown endpoints (`/sites`, `/bidang-options`, `/sub-bidang-options`) | ✓ Selesai | |
| BE: Soft delete (`is_active = false`) | ✓ Selesai | |
| FE: Tree hierarki + CRUD terhubung ke API | ✓ Selesai | |
| FE: Pagination di tree (spinner lokal per node) | ✓ Selesai | |

> **Status keseluruhan: Selesai.**
