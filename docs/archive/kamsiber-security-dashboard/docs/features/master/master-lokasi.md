# Spesifikasi Fitur: Master Lokasi

**Path URL:** `http://localhost:3000/master/lokasi`  
**Modul:** Master Data  
**Sumber Referensi:** Desain lama `zpic/daskam` (`MasterLokasiPage`), analisis gap `master_site` vs kebutuhan FE

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola data lokasi yang digunakan sebagai referensi di seluruh aplikasi Kamsiber. Lokasi mencakup hierarki geografis (Negara, Provinsi, Kota) maupun lokasi fisik infrastruktur (Data Center). Pengguna dapat membuat, mengubah, dan menghapus entri lokasi beserta atribut seperti kode unik, tipe, alamat lengkap, dan status aktif/nonaktif.

Data dari tabel ini direferensikan oleh modul lain — antara lain `master_room` (ruangan dalam satu lokasi) dan `organisasi` (organisasi yang beralamat di satu lokasi) — sehingga keakuratan data lokasi berdampak langsung pada integritas data di modul-modul tersebut.

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **1 tabel utama** (`master_site`) yang juga menjadi **tabel induk** bagi dua tabel di modul lain.

```
master_site                    ← Tabel 1 (SATU-SATUNYA tabel dalam fitur ini)
  ├── master_room              ← Tabel di modul lain (bukan bagian fitur ini)
  └── organisasi               ← Tabel di modul lain (bukan bagian fitur ini)
```

> **Catatan nama tabel:** Tabel fisik di database bernama `master_site`. Antarmuka FE menyebutnya "Lokasi". Tidak ada rename fisik di tahap ini — BE memetakan nama kolom `nama_site` → field `nama` dan `is_active` → field `status` saat serialisasi respons ke FE.

---

### Tabel 1: `master_site`

Tabel utama yang menyimpan seluruh data lokasi. Berfungsi sebagai lookup/referensi root — tidak memiliki FK keluar ke tabel lain dalam fitur ini.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()`, non-nullable |
| `uuid` | VARCHAR(36) | Identifier sekunder, unique, non-nullable |
| `kode` | VARCHAR(50) | Kode unik lokasi, unique, non-nullable. Misal `"LOC-001"`, `"DC-JKT-01"` |
| `nama_site` | VARCHAR(255) | Nama lengkap lokasi, non-nullable. Di FE ditampilkan sebagai field `nama` |
| `tipe` | VARCHAR(50) | Tipe lokasi: `"Negara"` / `"Provinsi"` / `"Kota"` / `"Data Center"`. Default server: `'Data Center'`, nullable |
| `is_active` | BOOLEAN | Status aktif. `true` = "Aktif", `false` = "Nonaktif". Default server: `true`, non-nullable |
| `alamat` | TEXT | Alamat lengkap, nullable. Komentar DB: `'Full address'` |
| `kota` | VARCHAR(255) | Nama kota (informasi tambahan), nullable. Komentar DB: `'City'` |
| `deskripsi` | TEXT | Deskripsi bebas, nullable |
| `created_at` | TIMESTAMP | Waktu buat, non-nullable |
| `created_by` | UUID | User yang membuat, nullable |
| `updated_at` | TIMESTAMP | Waktu update terakhir, nullable |
| `updated_by` | UUID | User yang mengupdate terakhir, nullable |

**Unique Constraints:**
- `kode` — satu kode hanya boleh dimiliki satu lokasi
- `uuid` — identifier sekunder harus unik

**Relasi ke luar (tabel lain mereferensikan tabel ini):**

| Tabel Anak | Kolom FK | Keterangan |
|------------|----------|-----------|
| `master_room` | FK → `master_site.id` | Ruangan yang berada di lokasi ini |
| `organisasi` | FK → `master_site.id` | Organisasi yang berlokasi di sini |

> **Field turunan (computed):** Field `status` yang ditampilkan di FE (`"Aktif"` / `"Nonaktif"`) **tidak disimpan** sebagai string di DB. Nilainya diturunkan oleh BE dari kolom `is_active` (boolean) saat serialisasi respons.

---

## 3. Aturan Delete (Penghapusan)

`master_site` adalah tabel **root/induk**. Tabel `master_room` dan `organisasi` memiliki FK yang merujuk ke `master_site.id`. Kondisi FK tersebut menentukan apakah sebuah lokasi boleh dihapus.

| Yang Dihapus | Boleh Dihapus Jika | Jika Ada Anak |
|---|---|---|
| `master_site` | Tidak ada `master_room` yang merujuk ke lokasi ini **dan** tidak ada `organisasi` yang merujuk ke lokasi ini | Tolak `409 Conflict` |

**Aturan bisnis tambahan:**
- Lokasi berstatus **Aktif** (`is_active = true`) sebaiknya dinonaktifkan terlebih dahulu sebelum dihapus — UI dapat menampilkan konfirmasi peringatan.
- Tombol **Hapus** di UI wajib memunculkan dialog konfirmasi sebelum eksekusi.
- Backend **wajib memvalidasi** keberadaan data anak sebelum menjalankan `DELETE` karena database tidak menggunakan `ON DELETE CASCADE`.

**Catatan soft delete:**
- Tabel `master_site` **tidak memiliki kolom `is_active`** — saat ini semua penghapusan bersifat **hard delete** permanen.
- Lihat bagian 7 untuk rekomendasi penambahan soft delete.

---

## 4. Alur Lengkap FE → BE → DB

### Operasi 1 — Memuat Daftar Lokasi (READ / List)

```
FE: Halaman /master/lokasi dibuka
  → GET /api/v1/master/lokasi?page=1&limit=20&search=&tipe=&status=
    BE: SELECT id, kode, nama_site AS nama, tipe,
               CASE WHEN is_active THEN 'Aktif' ELSE 'Nonaktif' END AS status,
               alamat, deskripsi
        FROM master_site
        WHERE (search filter pada kode / nama_site)
          AND (tipe filter jika diisi)
          AND (is_active filter jika diisi)
        ORDER BY nama_site ASC
        LIMIT 20 OFFSET 0
    DB: Kembalikan array lokasi + total count untuk pagination
  → FE: Render tabel dengan kolom: Kode, Nama, Tipe, Alamat, Status, Aksi
```

---

### Operasi 2 — Tambah Lokasi Baru (CREATE)

```
FE: Klik tombol "Tambah Lokasi" → muncul modal/form
    Isi field: kode, nama, tipe (dropdown), alamat, deskripsi, status (toggle)
    → Klik "Simpan"
  → POST /api/v1/master/lokasi
    Body: { kode, nama, tipe, alamat, deskripsi, status }
    BE:
      1. Validasi: kode tidak boleh duplikat (cek UNIQUE constraint)
      2. Validasi: tipe harus salah satu dari ["Negara","Provinsi","Kota","Data Center"]
      3. Konversi: status "Aktif" → is_active=true, "Nonaktif" → is_active=false
      4. INSERT INTO master_site
           (uuid, kode, nama_site, tipe, is_active, alamat, deskripsi, created_by, created_at)
         VALUES
           (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, NOW())
    DB: Simpan baris baru, kembalikan record lengkap
  → FE: Tutup modal, tambahkan baris baru ke tabel (atau reload halaman pertama),
        tampilkan notifikasi "Lokasi berhasil ditambahkan"
```

> **Catatan:** Jika `kode` sudah ada, BE kembalikan `422 Unprocessable Entity` dengan pesan `"Kode lokasi sudah digunakan"`.

---

### Operasi 3 — Edit Lokasi (UPDATE)

```
FE: Klik ikon Edit pada baris lokasi → form terisi data lokasi terpilih
    Ubah field yang diinginkan → Klik "Simpan"
  → PUT /api/v1/master/lokasi/{id}
    Body: { kode, nama, tipe, alamat, deskripsi, status }
    BE:
      1. Validasi: pastikan lokasi dengan {id} ada (404 jika tidak)
      2. Validasi: kode baru tidak duplikat dengan lokasi LAIN
         (SELECT id FROM master_site WHERE kode = ? AND id != ?)
      3. Validasi: tipe valid
      4. Konversi: status → is_active (boolean)
      5. UPDATE master_site
         SET kode=?, nama_site=?, tipe=?, is_active=?, alamat=?, deskripsi=?,
             updated_by=?, updated_at=NOW()
         WHERE id = ?
    DB: Update baris, kembalikan record terbaru
  → FE: Tutup modal, perbarui baris di tabel,
        tampilkan notifikasi "Lokasi berhasil diperbarui"
```

---

### Operasi 4 — Ubah Status Aktif/Nonaktif (TOGGLE STATUS)

```
FE: Klik toggle/switch Status pada baris lokasi
  → PATCH /api/v1/master/lokasi/{id}/status
    Body: { status: "Aktif" | "Nonaktif" }
    BE:
      1. Validasi: lokasi dengan {id} ada
      2. Konversi: status → is_active
      3. UPDATE master_site SET is_active=?, updated_by=?, updated_at=NOW()
         WHERE id = ?
    DB: Update kolom is_active saja
  → FE: Toggle berubah seketika (optimistic update),
        tampilkan notifikasi singkat "Status diperbarui"
```

---

### Operasi 5 — Hapus Lokasi (DELETE)

```
FE: Klik ikon Hapus → muncul dialog konfirmasi
    "Lokasi ini akan dihapus permanen. Yakin?"
    → Klik "Ya, Hapus"
  → DELETE /api/v1/master/lokasi/{id}
    BE:
      1. Validasi: lokasi dengan {id} ada (404 jika tidak)
      2. Cek anak master_room:
         SELECT COUNT(*) FROM master_room WHERE site_id = ?
         Jika > 0 → kembalikan 409: "Lokasi masih memiliki data ruangan"
      3. Cek anak organisasi:
         SELECT COUNT(*) FROM organisasi WHERE site_id = ?
         Jika > 0 → kembalikan 409: "Lokasi masih digunakan oleh organisasi"
      4. DELETE FROM master_site WHERE id = ?
    DB: Hapus permanen (hard delete)
  → FE: Hapus baris dari tabel,
        tampilkan notifikasi "Lokasi berhasil dihapus"
        Jika 409 → tampilkan pesan error dari BE
```

---

### Operasi 6 — Cari & Filter (SEARCH / FILTER)

```
FE: Ketik di kolom pencarian (debounce 300ms) atau pilih filter Tipe / Status
  → GET /api/v1/master/lokasi?search={keyword}&tipe={tipe}&status={status}&page=1
    BE: Tambahkan WHERE clause sesuai parameter:
        - search: ILIKE '%keyword%' pada kode ATAU nama_site
        - tipe: WHERE tipe = ?
        - status: WHERE is_active = (status == 'Aktif')
    DB: SELECT dengan filter, kembalikan hasil + total count
  → FE: Render ulang tabel dengan hasil filter, reset ke halaman 1
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/master/lokasi` | SELECT semua + filter + pagination | `master_site` |
| POST | `/api/v1/master/lokasi` | INSERT lokasi baru | `master_site` |
| GET | `/api/v1/master/lokasi/{id}` | SELECT satu record by id | `master_site` |
| PUT | `/api/v1/master/lokasi/{id}` | UPDATE semua field lokasi | `master_site` |
| PATCH | `/api/v1/master/lokasi/{id}/status` | UPDATE is_active saja | `master_site` |
| DELETE | `/api/v1/master/lokasi/{id}` | DELETE setelah validasi anak | `master_site` |

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Cards (Ringkasan Statistik)

| Card | Cara Hitung |
|------|-------------|
| **Total Lokasi** | `COUNT(*) FROM master_site` |
| **Lokasi Aktif** | `COUNT(*) FROM master_site WHERE is_active = true` |
| **Lokasi Nonaktif** | `COUNT(*) FROM master_site WHERE is_active = false` |
| **Data Center** | `COUNT(*) FROM master_site WHERE tipe = 'Data Center'` |

### 6.2. Toolbar / Filter Bar

- Input pencarian teks (cari berdasarkan `kode` atau `nama`)
- Dropdown filter **Tipe**: semua pilihan dropdown — `Negara` / `Provinsi` / `Kota` / `Data Center`
- Dropdown filter **Status**: `Semua` / `Aktif` / `Nonaktif`
- Tombol **Tambah Lokasi** (membuka modal form)

### 6.3. Tabel Data Lokasi

Kolom tabel:

| Kolom Tampil | Sumber Kolom DB | Keterangan |
|---|---|---|
| Kode | `kode` | Dapat diurutkan |
| Nama | `nama_site` | Dapat diurutkan |
| Tipe | `tipe` | Badge berwarna per tipe |
| Alamat | `alamat` | Teks pendek, truncated jika panjang |
| Status | `is_active` | Badge: "Aktif" (hijau) / "Nonaktif" (abu) |
| Aksi | — | Ikon Edit dan Hapus |

- Pagination bawah (pilihan 10 / 20 / 50 per halaman)
- Klik baris membuka panel detail atau modal edit

### 6.4. Modal Form Tambah / Edit Lokasi

Field dalam form:

| Field | Tipe Input | Validasi |
|-------|-----------|---------|
| Kode | Text input | Wajib diisi, max 50 karakter, harus unik |
| Nama | Text input | Wajib diisi, max 255 karakter |
| Tipe | Dropdown | Wajib dipilih: `Negara` / `Provinsi` / `Kota` / `Data Center` |
| Alamat | Textarea | Opsional |
| Kota | Text input | Opsional, max 255 karakter |
| Deskripsi | Textarea | Opsional |
| Status | Toggle / Radio | Default: Aktif |-------|--------------------------|
| `master_site` 
Pola query setelah soft delete ditambahkan:

```sql
-- Semua SELECT wajib tambahkan filter ini
WHERE is_active IS NULL

-- Ganti DELETE dengan UPDATE
UPDATE master_site
SET is_active = false
WHERE id = :id
```

#### 3. Kolom `kota` Tumpang Tindih dengan Tipe Lokasi

Saat `tipe = 'Kota'`, kolom `nama_site` sudah menyimpan nama kota. Kolom `kota` (VARCHAR 255, nullable) kemungkinan dimaksudkan sebagai informasi kota tempat lokasi berada — bukan nama kota lokasi itu sendiri. Ini perlu diklarifikasi dengan tim produk agar tidak membingungkan pengguna.

Rekomendasi: tambahkan `comment` pada kolom `kota` di migrasi berikutnya untuk memperjelas semantiknya.

---

**Status Implementasi:**

| Komponen | Status | Catatan |
|----------|--------|---------|
| Kolom `is_active` di `master_site` | ✓ Selesai | Migrasi sudah dilakukan |
| Endpoint BE (GET, POST, PUT, PATCH, DELETE) | ✓ Selesai | Prefix: `/api/v1/master/lokasi` |
| Frontend | ✓ Selesai | Terhubung ke API |

**Catatan implementasi:**
- Delete diimplementasikan sebagai **soft delete** (`is_active = false`), bukan hard delete.
- GET response menyertakan objek `stats` (`aktif`, `nonaktif`, `total`).
- Opsi tipe di FE dan BE harus konsisten: gunakan `"Kota"`, bukan `"Kota/Kabupaten"`.

> **Status keseluruhan:** **Selesai.**
