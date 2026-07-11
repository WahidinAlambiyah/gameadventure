# Spesifikasi Fitur: Master Penyelenggara Sertifikasi

**Path URL:** `http://localhost:3000/master/penyelenggara-sertifikasi`  
**Modul:** Master Data  
**Sumber Referensi:** Desain lama `zpic` (`PenyelenggaraSertifikasiPage`), analisis tabel `history_sertifikasi` dan `history_pelatihan`

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola daftar lembaga/badan penyelenggara sertifikasi dan pelatihan yang diakui oleh organisasi. Contoh data: BNSP, ISO, CompTIA, EC-Council, ISACA.

Data master ini nantinya digunakan sebagai **referensi terstruktur (FK)** untuk kolom `penerbit` di `history_sertifikasi` dan kolom `penyelenggara` di `history_pelatihan`, menggantikan input teks bebas (*free-text*) yang saat ini digunakan. Dengan adanya tabel master ini, organisasi dapat:

- Menjaga konsistensi nama penyelenggara di seluruh data sertifikasi dan pelatihan.
- Mengaktifkan atau menonaktifkan penyelenggara tanpa menghapus data historis.
- Menyediakan sumber data terpusat untuk dropdown di form input sertifikasi dan pelatihan.

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **1 tabel baru** (master) dan **2 tabel yang sudah ada** yang akan dihubungkan ke master tersebut pada tahap migrasi lanjutan.

```
penyelenggara_sertifikasi            ← Tabel 1 (BARU): Master daftar penyelenggara
  ├── history_sertifikasi            ← Tabel 2 (sudah ada): Referensi via penerbit_id (lanjutan)
  └── history_pelatihan             ← Tabel 3 (sudah ada): Referensi via penyelenggara_id (lanjutan)
```

> **Catatan:** Hubungan FK dari `history_sertifikasi` dan `history_pelatihan` ke `penyelenggara_sertifikasi` adalah **tahap migrasi lanjutan** dan bukan bagian dari implementasi awal. Implementasi awal hanya mencakup CRUD pada tabel `penyelenggara_sertifikasi`.

---

### Tabel 1: `penyelenggara_sertifikasi` — TABEL BARU (Belum Ada di DB)

Tabel ini belum ada di database dan harus dibuat via migrasi sebelum implementasi dapat dimulai.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) | Unique identifier tambahan, `NOT NULL UNIQUE` |
| `nama` | VARCHAR(255) | Nama penyelenggara, misal "BNSP", "CompTIA" — `NOT NULL` |
| `deskripsi` | TEXT | Deskripsi singkat tentang penyelenggara, nullable |
| `is_active` | BOOLEAN | `true` = Aktif, `false` = Nonaktif — `NOT NULL DEFAULT TRUE` |
| `created_at` | TIMESTAMP | Waktu data dibuat, nullable |
| `created_by` | UUID | ID pengguna yang membuat, nullable |
| `updated_at` | TIMESTAMP | Waktu data terakhir diubah, nullable |
| `updated_by` | UUID | ID pengguna yang mengubah, nullable |

---

### Tabel 2: `history_sertifikasi` — Tabel Sudah Ada (Relasi Lanjutan)

Tabel ini sudah ada di database. Kolom `penerbit` saat ini bertipe `VARCHAR(100)` free-text. Pada **tahap lanjutan**, kolom ini akan diganti dengan FK ke `penyelenggara_sertifikasi.id`.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_tahapan` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `id_people` | UUID (FK → `people.id_people`) | Pegawai pemilik sertifikasi |
| `nama_sertifikasi` | VARCHAR(100) | Nama sertifikasi, `NOT NULL` |
| `penerbit` | VARCHAR(100) | **Saat ini: free-text.** Lanjutan: akan menjadi FK `penerbit_id → penyelenggara_sertifikasi.id` |
| `nomor_sertifikat` | VARCHAR(100) | Nomor unik sertifikat, nullable |
| `tanggal_terbit` | DATE | Tanggal sertifikat diterbitkan, nullable |
| `kadaluarsa` | DATE | Tanggal kedaluwarsa sertifikat, nullable |
| `kode_status_sertifikat` | VARCHAR(25) | Kode status dinamis dari master kategori, nullable |
| `created_at` | TIMESTAMP | nullable |
| `created_by` | UUID | nullable |
| `updated_at` | TIMESTAMP | nullable |
| `updated_by` | UUID | nullable |

---

### Tabel 3: `history_pelatihan` — Tabel Sudah Ada (Relasi Lanjutan)

Tabel ini sudah ada di database. Kolom `penyelenggara` saat ini bertipe `VARCHAR(100)` free-text. Pada **tahap lanjutan**, kolom ini akan diganti dengan FK ke `penyelenggara_sertifikasi.id`.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_pelatihan` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `id_people` | UUID (FK → `people.id_people`) | Pegawai peserta pelatihan |
| `nama_pelatihan` | VARCHAR(100) | Nama pelatihan, `NOT NULL` |
| `penyelenggara` | VARCHAR(100) | **Saat ini: free-text.** Lanjutan: akan menjadi FK `penyelenggara_id → penyelenggara_sertifikasi.id` |
| `tanggal_mulai` | DATE | Tanggal mulai pelatihan, nullable |
| `durasi` | VARCHAR(50) | Durasi pelatihan, misal "3 Hari", nullable |
| `kode_status_pelatihan` | VARCHAR(25) | Kode status dinamis dari master kategori, nullable |
| `created_at` | TIMESTAMP | nullable |
| `created_by` | UUID | nullable |
| `updated_at` | TIMESTAMP | nullable |
| `updated_by` | UUID | nullable |

---

## 3. Aturan Delete (Penghapusan)

Pada implementasi awal, tabel `penyelenggara_sertifikasi` **belum memiliki anak (FK ke tabel lain)** karena migrasi relasi lanjutan belum dilakukan. Namun aturan berikut harus dirancang sejak awal untuk mempersiapkan kondisi setelah migrasi lanjutan.

| Yang Dihapus | Boleh Dihapus Jika | Jika Ada Anak |
|---|---|---|
| `penyelenggara_sertifikasi` | **Implementasi awal:** selalu boleh (belum ada FK anak) | — |
| `penyelenggara_sertifikasi` | **Setelah migrasi lanjutan:** tidak ada referensi di `history_sertifikasi.penerbit_id` dan `history_pelatihan.penyelenggara_id` | Tolak 409 Conflict |

**Aturan bisnis tambahan:**
- Penyelenggara berstatus **Aktif** (`is_active = true`) sebaiknya **tidak boleh dihapus langsung** untuk menjaga integritas data historis. UI harus menampilkan konfirmasi peringatan.
- Alternatif yang lebih aman daripada hapus adalah **menonaktifkan** (`is_active = false`) — penyelenggara tidak akan muncul di dropdown form baru, tetapi data historis tetap terjaga.
- **Tidak ada soft delete** (`is_active`) pada rancangan awal tabel ini — lihat bagian Kekurangan untuk rekomendasi.
- Operasi hapus adalah **hard delete permanen**.

---

## 4. Alur Lengkap FE → BE → DB

---

### Operasi 1 — Lihat Daftar Penyelenggara (READ ALL)

```
FE: Halaman dimuat → komponen memanggil data saat mount
  → GET /api/v1/master/penyelenggara-sertifikasi
    BE: SELECT id, nama, deskripsi, is_active FROM penyelenggara_sertifikasi
        ORDER BY nama ASC
        WHERE is_active IS NULL  ← (setelah soft delete ditambahkan)
    DB: Kembalikan semua baris
  → FE: Tabel ditampilkan dengan kolom Nama, Deskripsi, Status (Aktif/Nonaktif), Aksi
```

---

### Operasi 2 — Tambah Penyelenggara Baru (CREATE)

```
FE: Klik tombol "Tambah Penyelenggara" → form modal/inline muncul
    Isi field: nama (wajib), deskripsi (opsional), status (default: Aktif)
    Klik "Simpan"
  → POST /api/v1/master/penyelenggara-sertifikasi
    Body: { "nama": "BNSP", "deskripsi": "Badan Nasional Sertifikasi Profesi", "is_active": true }
    BE:
      1. Validasi: nama tidak boleh kosong, nama belum terdaftar (cek duplikat)
      2. Generate uuid baru
      3. INSERT INTO penyelenggara_sertifikasi (uuid, nama, deskripsi, is_active, created_at, created_by)
         VALUES (gen_uuid(), :nama, :deskripsi, :is_active, NOW(), :user_id)
    DB: Simpan baris baru, kembalikan data lengkap termasuk id baru
  → FE: Form ditutup, baris baru muncul di tabel tanpa reload penuh
```

---

### Operasi 3 — Edit Penyelenggara (UPDATE)

```
FE: Klik tombol "Edit" pada baris terpilih → form modal/inline terisi data lama
    Ubah field yang diperlukan → klik "Simpan"
  → PUT /api/v1/master/penyelenggara-sertifikasi/{id}
    Body: { "nama": "BNSP Updated", "deskripsi": "...", "is_active": true }
    BE:
      1. Validasi: id ada di DB, nama tidak duplikat dengan entri lain
      2. UPDATE penyelenggara_sertifikasi
         SET nama = :nama, deskripsi = :deskripsi, is_active = :is_active,
             updated_at = NOW(), updated_by = :user_id
         WHERE id = :id
    DB: Baris diperbarui, kembalikan data terbaru
  → FE: Baris di tabel diperbarui dengan data baru, modal ditutup
```

---

### Operasi 4 — Ubah Status Aktif/Nonaktif (TOGGLE STATUS)

Ini adalah operasi khusus yang lebih aman daripada hapus. Penyelenggara dinonaktifkan agar tidak muncul di dropdown, tetapi data historis tetap utuh.

```
FE: Klik toggle/switch "Aktif" atau tombol "Nonaktifkan" pada baris terpilih
  → PATCH /api/v1/master/penyelenggara-sertifikasi/{id}/status
    Body: { "is_active": false }
    BE:
      1. UPDATE penyelenggara_sertifikasi
         SET is_active = :is_active, updated_at = NOW(), updated_by = :user_id
         WHERE id = :id
    DB: Kolom is_active diperbarui
  → FE: Badge status di baris berubah (Aktif → Nonaktif atau sebaliknya)
```

---

### Operasi 5 — Hapus Penyelenggara (DELETE)

```
FE: Klik tombol "Hapus" pada baris terpilih → dialog konfirmasi muncul
    Pengguna konfirmasi → klik "Ya, Hapus"
  → DELETE /api/v1/master/penyelenggara-sertifikasi/{id}
    BE:
      1. Cek apakah ada referensi di history_sertifikasi atau history_pelatihan
         (setelah migrasi lanjutan — pada implementasi awal lewati langkah ini)
      2. Jika ada referensi: kembalikan 409 Conflict dengan pesan error
      3. Jika tidak ada: DELETE FROM penyelenggara_sertifikasi WHERE id = :id
    DB: Baris dihapus permanen (hard delete)
  → FE: Baris hilang dari tabel, notifikasi sukses ditampilkan
       Jika 409: notifikasi error ditampilkan, data tidak berubah
```

---

### Operasi 6 — Lihat Satu Penyelenggara (READ ONE) — Opsional

```
FE: Klik nama penyelenggara di tabel → halaman/panel detail terbuka
  → GET /api/v1/master/penyelenggara-sertifikasi/{id}
    BE: SELECT * FROM penyelenggara_sertifikasi WHERE id = :id
    DB: Kembalikan satu baris
  → FE: Detail penyelenggara ditampilkan (nama, deskripsi, status, tanggal dibuat)
        Setelah migrasi lanjutan: tampilkan juga jumlah sertifikasi dan pelatihan yang merujuk ke penyelenggara ini
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/master/penyelenggara-sertifikasi` | SELECT semua, ORDER BY nama | `penyelenggara_sertifikasi` |
| POST | `/api/v1/master/penyelenggara-sertifikasi` | INSERT baris baru | `penyelenggara_sertifikasi` |
| GET | `/api/v1/master/penyelenggara-sertifikasi/{id}` | SELECT satu baris by ID | `penyelenggara_sertifikasi` |
| PUT | `/api/v1/master/penyelenggara-sertifikasi/{id}` | UPDATE semua field | `penyelenggara_sertifikasi` |
| PATCH | `/api/v1/master/penyelenggara-sertifikasi/{id}/status` | UPDATE is_active saja | `penyelenggara_sertifikasi` |
| DELETE | `/api/v1/master/penyelenggara-sertifikasi/{id}` | DELETE (cek FK dulu) | `penyelenggara_sertifikasi` |

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Cards

| Card | Cara Hitung |
|------|-------------|
| **Total Penyelenggara** | `COUNT(*) FROM penyelenggara_sertifikasi` |
| **Penyelenggara Aktif** | `COUNT(*) FROM penyelenggara_sertifikasi WHERE is_active = true` |
| **Penyelenggara Nonaktif** | `COUNT(*) FROM penyelenggara_sertifikasi WHERE is_active = false` |

### 6.2. Tabel Data Utama

Kolom yang ditampilkan:

| Kolom Tampil | Sumber Data |
|---|---|
| No | Index urut |
| Nama | `penyelenggara_sertifikasi.nama` |
| Deskripsi | `penyelenggara_sertifikasi.deskripsi` |
| Status | Badge berdasarkan `is_active`: hijau = "Aktif", abu = "Nonaktif" |
| Aksi | Tombol Edit, Tombol Hapus |

- **Fitur pencarian/filter:** input teks untuk filter by `nama` (client-side atau query param `?search=`).
- **Fitur filter status:** dropdown "Semua / Aktif / Nonaktif" yang memfilter berdasarkan `is_active`.
- **Pagination:** jika data lebih dari 20 baris.

### 6.3. Form Tambah / Edit (Modal atau Inline)

Field yang tersedia:

| Field | Tipe Input | Validasi |
|---|---|---|
| Nama Penyelenggara | Text input | Wajib diisi, maks 255 karakter, unik |
| Deskripsi | Textarea | Opsional |
| Status | Toggle/Select (Aktif / Nonaktif) | Default: Aktif |

Tombol aksi di form:
- **Simpan** — submit data ke endpoint POST (tambah) atau PUT (edit).
- **Batal** — tutup form tanpa menyimpan.

### 6.4. Dialog Konfirmasi Hapus

- Muncul saat tombol "Hapus" diklik.
- Menampilkan nama penyelenggara yang akan dihapus.
- Dua tombol: **"Ya, Hapus"** (merah) dan **"Batal"**.
- Jika BE mengembalikan 409 Conflict: tampilkan pesan error "Penyelenggara ini masih digunakan dalam data sertifikasi/pelatihan dan tidak dapat dihapus."

---

## 7. Ringkasan & Kekurangan

### ✓ Sudah Ada

- Tabel `history_sertifikasi` sudah ada dengan kolom `penerbit` (VARCHAR 100) sebagai placeholder nama penyelenggara.
- Tabel `history_pelatihan` sudah ada dengan kolom `penyelenggara` (VARCHAR 100) sebagai placeholder nama penyelenggara.
- Interface FE sudah dibuat dengan struktur data yang benar (`id`, `nama`, `deskripsi`, `status`).
- Daftar awal data contoh sudah tersedia di FE (BNSP, ISO, CompTIA, EC-Council, ISACA).

---

### ✗ Kekurangan

#### Gap 1 — Tabel `penyelenggara_sertifikasi` Belum Ada di Database

Tabel master ini **sama sekali belum ada** di skema database. Seluruh implementasi backend dan frontend bergantung pada tabel ini. Migrasi pembuatan tabel wajib dilakukan sebelum implementasi apapun dapat dimulai.

DDL yang perlu dijalankan:

```sql
CREATE TABLE penyelenggara_sertifikasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  uuid VARCHAR(36) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMP,
  updated_by UUID
);
```


Pola query setelah soft delete ditambahkan:
```sql
-- Semua SELECT wajib filter ini
WHERE is_active IS NULL

-- Soft delete (ganti DELETE dengan UPDATE)
UPDATE penyelenggara_sertifikasi
SET is_active = false
WHERE id = :id
```

#### Gap 3 — FE Masih Hardcoded, Belum Terhubung ke API

- Data saat ini di-*hardcode* di `useState` — tidak diambil dari API.
- Tombol **Edit** dan **Hapus** belum memiliki handler — masih fungsi kosong.
- Form belum merupakan *controlled component* — nilai input tidak terikat ke state React.
- Semua state management perlu direfaktor untuk memanggil endpoint API yang akan dibuat.

#### Gap 4 — Kolom Free-Text di Tabel Referensi (Migrasi Lanjutan)

Kolom `penerbit` di `history_sertifikasi` dan `penyelenggara` di `history_pelatihan` masih bertipe `VARCHAR(100)` free-text. Setelah tabel master tersedia, diperlukan migrasi lanjutan untuk:

1. Menambahkan kolom FK baru: `penerbit_id UUID` di `history_sertifikasi` dan `penyelenggara_id UUID` di `history_pelatihan`.
2. Mengisi FK baru dengan mencocokkan nilai teks lama ke `penyelenggara_sertifikasi.nama`.
3. Kolom free-text lama (`penerbit`, `penyelenggara`) dapat dipertahankan sementara sebagai fallback, lalu di-*deprecate* setelah migrasi data selesai diverifikasi.

| Tabel | Kolom Saat Ini | Perubahan Migrasi Lanjutan |
|---|---|---|
| `history_sertifikasi` | `penerbit VARCHAR(100)` free-text | Tambah `penerbit_id UUID FK → penyelenggara_sertifikasi.id` |
| `history_pelatihan` | `penyelenggara VARCHAR(100)` free-text | Tambah `penyelenggara_id UUID FK → penyelenggara_sertifikasi.id` |

---

### Status Implementasi

| Tahap | Deskripsi | Status |
|---|---|---|
| **Tahap 1** | Migrasi DB: buat tabel `penyelenggara_sertifikasi` (dengan soft delete) | **Wajib selesai dulu** |
| **Tahap 2** | Implementasi BE: CRUD endpoint `/api/v1/master/penyelenggara-sertifikasi` | Bisa dimulai setelah Tahap 1 |
| **Tahap 3** | Implementasi FE: koneksi ke API, controlled form, handler Edit & Hapus | Bisa dimulai setelah Tahap 2 |
| **Tahap 4** | Migrasi lanjutan: tambah FK `penerbit_id` dan `penyelenggara_id` di tabel history | Opsional, setelah Tahap 3 stabil |

> **Status Keseluruhan:** Menunggu migrasi DB (Tahap 1). Implementasi backend dan frontend **belum boleh dimulai** sebelum tabel `penyelenggara_sertifikasi` tersedia di skema database.
