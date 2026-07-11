# Spesifikasi Fitur: Master Kategori dan Status

**Path URL:** `http://localhost:3000/master/kategori-dan-status`  
**Modul:** Master Data → Kategori dan Status  
**Sumber Referensi:** FE `app/(dashboard)/master/kategori-dan-status/page.tsx`, model DB `scaffolded_models.py` (`master_kategori`)

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola daftar kategori dan status yang digunakan sebagai nilai referensi (*lookup*) di seluruh aplikasi Kamsiber. Data ini dikelompokkan berdasarkan konteks penggunaan (grup), misalnya Status Kebijakan, Status Proyek, Prioritas Umum, Status Insiden, Status Tiket, Status Arsip, Status Integrasi, dan Status Aplikasi.

Setiap item kategori/status memiliki kode unik, nama tampilan, urutan, dan warna badge visual. Modul lain (Kebijakan, Proyek, Insiden, Tiket, Arsip, Integrasi, Aplikasi) akan membaca data dari tabel ini sebagai nilai dropdown atau badge status — sehingga keakuratan dan kelengkapan data berdampak langsung pada konsistensi tampilan di seluruh aplikasi.

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **1 tabel tunggal** (`master_kategori`) yang bersifat **generik dan flat** — tidak ada hierarki induk-anak antar-baris. Pengelompokan dilakukan lewat kolom `group_kategori`, bukan lewat relasi FK.

```
master_kategori                ← Tabel 1 (SATU-SATUNYA tabel dalam fitur ini)
  (tidak ada tabel anak dalam fitur ini)
  (tabel-tabel modul lain mereferensikan kode_kategori sebagai lookup)
```

> **Catatan arsitektur:** Tabel ini adalah tabel lookup generik. Tabel-tabel di modul lain (misalnya `kebijakan`, `proyek`, `insiden`) menyimpan `kode_kategori` sebagai nilai status/prioritas. Tidak ada FK formal — referensi bersifat *soft reference* lewat nilai string `kode_kategori`.

---

### Tabel 1: `master_kategori`

Tabel utama yang menyimpan semua item kategori dan status. Satu baris mewakili satu item (misalnya "Draft", "Aktif", "Kritis").

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_kategori` | UUID (PK) | Auto-generate `uuid_generate_v7()`, non-nullable |
| `kode_kategori` | VARCHAR(25) UNIQUE | Kode unik item, non-nullable. Misal `"STS-DRF"`, `"PRJ-PLN"`, `"PRT-KRT"`. Format: `[PREFIKS_GRUP]-[KODE_ITEM]` |
| `sort_order` | INTEGER | Urutan tampil dalam grup, non-nullable |
| `group_kategori` | VARCHAR(100) | Nama grup dalam format UPPER_SNAKE_CASE, nullable. Misal `"STATUS_KEBIJAKAN"`, `"PRIORITAS_UMUM"` |
| `value_kategori` | VARCHAR(10) | Nilai/kode pendek opsional, nullable. **Perhatian: hanya 10 karakter — lihat Gap #1** |
| `is_active` | BOOLEAN | Status aktif item. `true` = tampil di dropdown modul lain, `false` = tersembunyi. Default: `true`, nullable |
| `keterangan` | VARCHAR(100) | Dipakai sementara sebagai nama tampilan item (label badge). Nullable. **Lihat Gap #3** |
| `is_parent` | BOOLEAN | Menandai apakah item ini adalah induk hierarki. Nullable. Tidak digunakan oleh FE saat ini |
| `created_at` | TIMESTAMP | Waktu buat, non-nullable |
| `created_by` | UUID | User yang membuat, nullable |
| `updated_at` | TIMESTAMP | Waktu update terakhir, nullable |
| `updated_by` | UUID | User yang mengupdate terakhir, nullable |

**Kolom yang perlu ditambahkan (rekomendasi augmentasi — lihat Bagian 7):**

| Kolom Baru | Tipe Usulan | Alasan |
|------------|-------------|--------|
| `nama_item` | VARCHAR(100) | Label tampil yang eksplisit — menggantikan peran ganda `keterangan` |
| `warna_bg` | VARCHAR(50) | Tailwind CSS class untuk background badge. Misal `"bg-slate-50"` |
| `warna_text` | VARCHAR(50) | Tailwind CSS class untuk warna teks badge. Misal `"text-slate-500"` |

**Unique Constraint:**
- `kode_kategori` — satu kode hanya boleh ada satu baris

**Mapping FE → DB (kondisi saat ini sebelum augmentasi):**

| Field FE | Kolom DB | Catatan |
|----------|----------|---------|
| `group` (judul kartu grup) | `group_kategori` | Disimpan uppercase, ditampilkan dengan format judul di FE |
| `kode` (misal `STS-DRF`) | `kode_kategori` | — |
| `nama` (misal `"Draft"`) | `keterangan` | Karena `value_kategori` terlalu pendek (10 char) |
| `urutan` | `sort_order` | — |
| `styleClass` (misal `"bg-slate-50 text-slate-500"`) | **TIDAK ADA** | Perlu kolom `warna_bg` + `warna_text` baru |
| `is_active` | `is_active` | — |

---

## 3. Aturan Delete (Penghapusan)

`master_kategori` adalah tabel **lookup flat** — tidak memiliki tabel anak dalam fitur ini. Namun, modul lain (Kebijakan, Proyek, Insiden, dsb.) dapat menyimpan `kode_kategori` sebagai nilai status. Penghapusan tanpa validasi berpotensi menyebabkan nilai status "yatim" di modul-modul tersebut.

| Yang Dihapus | Boleh Dihapus Jika | Jika Direferensikan Modul Lain |
|---|---|---|
| `master_kategori` (item) | `is_active = false` (sudah dinonaktifkan) **dan** tidak ada data aktif di modul lain yang menggunakan `kode_kategori` ini | Direkomendasikan: Tolak `409 Conflict` dengan pesan "Kode kategori masih digunakan di [nama modul]" |

**Aturan bisnis tambahan:**
- Item berstatus **Aktif** (`is_active = true`) harus dinonaktifkan terlebih dahulu sebelum dapat dihapus — UI menampilkan tombol "Nonaktifkan" sebagai langkah wajib sebelum "Hapus".
- Tombol **Hapus** wajib memunculkan dialog konfirmasi sebelum eksekusi.
- Backend **wajib memvalidasi** apakah `kode_kategori` masih direferensikan di modul lain sebelum menjalankan `DELETE`.
- Item yang merupakan **data bawaan sistem** (seeded data, `is_parent = true` atau kode standar sistem) sebaiknya tidak dapat dihapus dari UI — hanya bisa dinonaktifkan.

**Catatan soft delete:**
- Tabel `master_kategori` **tidak memiliki kolom `is_active`** — saat ini semua penghapusan bersifat **hard delete** permanen. Lihat rekomendasi di Bagian 7.

---

## 4. Alur Lengkap FE → BE → DB

Alur kerja ini mencakup semua operasi CRUD yang tersedia di halaman Master Kategori dan Status.

---

### Operasi 1 — Memuat Daftar Kategori (Tampilan Grup)

```
FE: Halaman pertama kali dibuka → GET /api/v1/master/kategori
  BE:
    SELECT * FROM master_kategori
    WHERE is_active IS NOT FALSE
    ORDER BY group_kategori, sort_order ASC
    → Kelompokkan hasil per group_kategori di layer BE (atau FE)
    → Kembalikan struktur: [{ group: "STATUS_KEBIJAKAN", items: [...] }, ...]
  FE:
    → Tampilkan dalam Group View: satu card per grup
    → Setiap item tampil sebagai badge berwarna menggunakan warna_bg + warna_text
    → Tombol toggle "List View" untuk beralih ke tampilan tabel
```

---

### Operasi 2 — Beralih ke Tampilan Tabel (List View)

```
FE: Klik toggle "List View"
  → Tidak ada request BE baru — data sudah dimuat saat Operasi 1
  → FE merender ulang data yang sama dalam format tabel flat
  → Kolom tabel: Grup | Nama | Kode | Urutan | Status | Aksi
```

---

### Operasi 3 — Tambah Item Kategori/Status Baru

```
FE: Klik tombol "Tambah" → form slide-in / modal muncul
    Form berisi:
      - Grup Kategori (dropdown/select dari grup yang sudah ada atau input bebas)
      - Nama Kategori/Status (text input)
      - Kode Kategori (text input, validasi format dan uniqueness)
      - Urutan (number input)
      - Warna Badge (color picker: 8 pilihan warna, simpan sebagai pasangan warna_bg + warna_text)
    → Submit
  → POST /api/v1/master/kategori
    Body: {
      group_kategori: "STATUS_KEBIJAKAN",
      kode_kategori: "STS-ABC",
      nama_item: "Nama Baru",          ← kolom baru (setelah augmentasi)
      sort_order: 5,
      warna_bg: "bg-blue-50",          ← kolom baru (setelah augmentasi)
      warna_text: "text-blue-600",     ← kolom baru (setelah augmentasi)
      is_active: true
    }
    BE:
      1. Validasi: kode_kategori tidak boleh duplikat (cek UNIQUE constraint)
      2. Validasi: group_kategori wajib diisi
      3. INSERT INTO master_kategori (kode_kategori, group_kategori, nama_item,
                                       sort_order, warna_bg, warna_text, is_active,
                                       created_at, created_by)
      4. Kembalikan baris yang baru dibuat
  FE: Item baru muncul di kartu grup yang sesuai (atau grup baru terbentuk jika grup belum ada)
```

---

### Operasi 4 — Edit Item Kategori/Status

```
FE: Klik tombol "Edit" pada item → form terisi data item yang dipilih
    Field yang dapat diubah: Grup, Nama, Kode, Urutan, Warna Badge, Status Aktif
    → Submit
  → PUT /api/v1/master/kategori/{id_kategori}
    Body: { field yang berubah }
    BE:
      1. Validasi: jika kode_kategori diubah, pastikan kode baru tidak duplikat
      2. Jika kode_kategori diubah: periksa apakah kode lama sudah digunakan di modul lain
         → Jika ya: tolak 409 dengan pesan "Kode digunakan di [modul]"
      3. UPDATE master_kategori SET ... WHERE id_kategori = ?
      4. Kembalikan baris yang diperbarui
  FE: Item diperbarui di tampilan (grup berubah jika group_kategori diubah)
```

---

### Operasi 5 — Nonaktifkan / Aktifkan Item (Toggle Status)

```
FE: Klik toggle status pada item (aktif/nonaktif)
  → PATCH /api/v1/master/kategori/{id_kategori}/status
    Body: { is_active: false }
    BE:
      UPDATE master_kategori SET is_active = ?, updated_at = NOW(), updated_by = ?
      WHERE id_kategori = ?
  FE: Badge status item berubah; item nonaktif masih tampil di halaman Master
      tetapi tidak muncul di dropdown modul lain
```

---

### Operasi 6 — Hapus Item Kategori/Status

```
FE: Klik tombol "Hapus" pada item → dialog konfirmasi muncul
    → Konfirmasi "Ya, Hapus"
  → DELETE /api/v1/master/kategori/{id_kategori}
    BE:
      1. Validasi: pastikan is_active = false (sudah dinonaktifkan)
         → Jika masih aktif: tolak 400 "Nonaktifkan item terlebih dahulu"
      2. Validasi: cek apakah kode_kategori masih digunakan di tabel modul lain
         (kebijakan, proyek, insiden, tiket, arsip, integrasi, aplikasi)
         → Jika masih digunakan: tolak 409 "Kode masih digunakan di [nama modul]"
      3. DELETE FROM master_kategori WHERE id_kategori = ?
  FE: Item hilang dari tampilan, notifikasi sukses ditampilkan
```

---

### Operasi 7 — Filter dan Pencarian (List View)

```
FE: Di tampilan tabel, pengguna mengetik di search box atau memilih filter grup
  → GET /api/v1/master/kategori?group={group_kategori}&q={keyword}&is_active={true|false}
    BE:
      SELECT * FROM master_kategori
      WHERE (group_kategori = :group OR :group IS NULL)
        AND (kode_kategori ILIKE :q OR keterangan ILIKE :q OR nama_item ILIKE :q
             OR :q IS NULL)
        AND (is_active = :is_active OR :is_active IS NULL)
      ORDER BY group_kategori, sort_order ASC
  FE: Tabel diperbarui sesuai hasil filter
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/master/kategori` | SELECT semua, dikelompokkan per grup | `master_kategori` |
| GET | `/api/v1/master/kategori?group=&q=&is_active=` | SELECT dengan filter | `master_kategori` |
| POST | `/api/v1/master/kategori` | INSERT item baru | `master_kategori` |
| GET | `/api/v1/master/kategori/{id}` | SELECT satu item by id | `master_kategori` |
| PUT | `/api/v1/master/kategori/{id}` | UPDATE semua field item | `master_kategori` |
| PATCH | `/api/v1/master/kategori/{id}/status` | UPDATE `is_active` saja | `master_kategori` |
| DELETE | `/api/v1/master/kategori/{id}` | DELETE (validasi dulu) | `master_kategori` |
| GET | `/api/v1/master/kategori/groups` | SELECT DISTINCT `group_kategori` | `master_kategori` |

> **Catatan endpoint groups:** Endpoint `GET /groups` mengembalikan daftar nama grup unik yang tersedia — digunakan FE untuk mengisi dropdown "Grup Kategori" saat form tambah/edit.

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Halaman

Menampilkan judul "Kategori dan Status", deskripsi singkat modul, dan tombol utama "Tambah Kategori/Status". Baris ringkasan menampilkan:

| Card Ringkasan | Cara Hitung |
|----------------|-------------|
| **Total Grup** | `COUNT(DISTINCT group_kategori)` dari hasil query |
| **Total Item** | `COUNT(*)` seluruh item aktif |
| **Item Nonaktif** | `COUNT(*) WHERE is_active = false` |

### 6.2. Toggle Tampilan

Dua tombol ikon (Group View / List View) di pojok kanan atas konten. State disimpan di `useState` FE — tidak mempengaruhi request BE.

- **Group View** — satu card per grup; item ditampilkan sebagai daftar badge berwarna secara horizontal
- **List View** — tabel dengan kolom: Grup | Nama | Kode | Urutan | Warna | Status | Aksi

### 6.3. Tampilan Group View (Card per Grup)

Setiap kartu grup menampilkan:
- **Judul kartu** — nama grup (misal "Status Kebijakan") dengan format Title Case dari `group_kategori`
- **Jumlah item** — badge angka di sudut kartu
- **Daftar item** — setiap item ditampilkan sebagai badge berwarna menggunakan `warna_bg` dan `warna_text`
- **Tombol Edit dan Hapus** per item (saat ini belum ada handler di FE — lihat Gap #5)
- **Tombol "Tambah Item"** per kartu grup untuk menambah item langsung ke grup tersebut (pre-fill dropdown grup)

### 6.4. Tampilan List View (Tabel)

Tabel datar seluruh item dengan:
- **Kolom sortable:** Grup, Nama, Kode, Urutan
- **Kolom Warna:** preview badge berwarna aktual menggunakan `warna_bg` + `warna_text`
- **Kolom Status:** toggle aktif/nonaktif
- **Kolom Aksi:** tombol Edit dan Hapus per baris

### 6.5. Form Tambah / Edit (Modal atau Slide Panel)

Form digunakan untuk operasi tambah dan edit. Field-field:

| Field | Tipe Input | Validasi |
|-------|-----------|---------|
| Grup Kategori | Select (dari data existing) + opsi "Buat grup baru" | Wajib diisi |
| Nama Kategori/Status | Text input | Wajib, maks 100 karakter |
| Kode Kategori | Text input | Wajib, unik, maks 25 karakter, format `[A-Z]{2,4}-[A-Z]{2,4}` |
| Urutan | Number input (min 1) | Wajib, bilangan bulat positif |
| Warna Badge | Color picker (8 pilihan preset) | Opsional; setiap pilihan memetakan ke pasangan `warna_bg` + `warna_text` |
| Status Aktif | Toggle/checkbox | Default: aktif |

**Pemetaan color picker → Tailwind class (8 warna preset):**

| Pilihan Warna | `warna_bg` | `warna_text` |
|---------------|-----------|-------------|
| Abu-abu (default) | `bg-slate-50` | `text-slate-500` |
| Biru | `bg-blue-50` | `text-blue-600` |
| Hijau | `bg-green-50` | `text-green-600` |
| Kuning | `bg-yellow-50` | `text-yellow-600` |
| Merah | `bg-red-50` | `text-red-600` |
| Ungu | `bg-purple-50` | `text-purple-600` |
| Oranye | `bg-orange-50` | `text-orange-600` |
| Teal | `bg-teal-50` | `text-teal-600` |-------|--------------------------|
| `master_kategori` 
Pola query setelah soft delete ditambahkan:

```sql
-- Semua SELECT wajib menambahkan filter ini
WHERE is_active IS NULL

-- Soft delete (ganti DELETE dengan UPDATE)
UPDATE master_kategori
SET is_active = false
WHERE id_kategori = :id
```

---

**Gap 7 — Tidak ada validasi referential integrity ke modul lain**

Karena referensi `kode_kategori` dari tabel modul lain bersifat *soft reference* (tidak ada FK formal), DB tidak akan mencegah penghapusan item yang masih digunakan. Validasi ini sepenuhnya menjadi tanggung jawab BE.

**Rekomendasi:** BE wajib melakukan pengecekan eksplisit ke tabel-tabel modul (kebijakan, proyek, insiden, tiket, arsip, integrasi, aplikasi) sebelum menjalankan DELETE. Jika ada data yang merujuk, kembalikan `409 Conflict` dengan daftar modul yang masih menggunakan kode tersebut.

---

**Ringkasan Status Implementasi:**

| Komponen | Status |
|----------|--------|
| Skema tabel dasar (`master_kategori`) | ✓ Selesai |
| Kolom `nama_item` | ✓ Sudah ada di DB |
| Kolom `warna_bg` + `warna_text` | ✓ Sudah ada di DB |
| Endpoint BE (GET, POST, PUT, PATCH, DELETE) | ✓ Selesai |
| Handler Edit/Hapus di FE | ✓ Selesai |
| Integrasi FE–BE | ✓ Selesai |

**Catatan implementasi:**
- `kode_kategori` di-generate otomatis oleh BE dari `group_kategori` (pola `XX-XXXXXX`) — user tidak perlu mengisi kode.
- Delete diimplementasikan sebagai **soft delete** (`is_active = false`), bukan hard delete.
- Grup yang didukung BE: 15 grup (Status Kebijakan, Status Proyek, Status Aplikasi, Status Server, Status Perangkat, Kategori CTI, Kategori DFIR, Status Insiden, Status Arsip, Prioritas Umum, Kategori Layanan, Status Tiket, Kategori Awareness, Status Integrasi, Kustom).
- GET mendukung parameter `view=grouped` (default) dan `view=list`.

> **Status keseluruhan:** **Selesai.**
