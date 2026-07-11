# Spesifikasi Fitur: Master Jabatan

**Path URL:** `http://localhost:3000/master/jabatan`  
**Modul:** Master Data  
**Sumber Referensi:** Analisis desain lama `zpic` (`JabatanPage`), model `scaffolded_models.py` (tabel `jabatan` dan `people`)

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola data jabatan (posisi/role) dalam struktur organisasi keamanan siber. Pengguna dapat mendefinisikan jabatan, mengaitkannya ke satuan organisasi (unit/direktorat), melihat siapa yang sedang menduduki jabatan tersebut, serta mengelola status keaktifan jabatan.

Status jabatan bersifat **tiga keadaan** (three-state) yang diturunkan secara logis dari dua sumber data:

| Status Tampil | Kondisi DB |
|---|---|
| **Aktif** | `jabatan.is_active = true` **DAN** ada baris `people` dengan `jabatan_id` = id jabatan ini |
| **Kosong** | `jabatan.is_active = true` **TETAPI** tidak ada `people` yang mengisi jabatan ini |
| **Nonaktif** | `jabatan.is_active = false` (apapun kondisi people) |

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **2 tabel utama** dengan relasi satu-ke-banyak:

```
jabatan                      ← Tabel 1: Master daftar jabatan
  └── people                 ← Tabel 2: Individu yang menduduki jabatan
```

Tabel `jabatan` menggunakan **polymorphic reference** ke satuan organisasi (bukan FK biasa), sehingga satu jabatan dapat dikaitkan ke berbagai jenis unit organisasi (direktorat, divisi, bagian, dsb.) tanpa mengubah skema tabel.

---

### Tabel 1: `jabatan`

Tabel induk yang mendefinisikan jabatan beserta kaitannya ke satuan organisasi.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate, primary key |
| `kode` | VARCHAR(50) | Kode unik jabatan (UNIQUE constraint + index) |
| `nama` | VARCHAR(255) | Nama jabatan, misal "Analis Keamanan Siber" |
| `level` | VARCHAR(50) | Level/jenjang jabatan (nullable) |
| `atasan_id` | UUID (FK → `jabatan.id`) | Self-referential, jabatan atasan (nullable) |
| `organisasi_type` | VARCHAR(50) | Jenis tabel organisasi target (polimorfik), misal `"direktorat"` |
| `organisasi_ref_id` | INTEGER | PK di tabel organisasi target (polimorfik) |
| `is_active` | BOOLEAN | Status aktif/nonaktif jabatan |
| `deskripsi` | TEXT | Deskripsi tugas jabatan (nullable) |
| `source_system` | VARCHAR(50) | Asal data jika diimpor dari sistem eksternal (nullable) |
| `created_at` | TIMESTAMP | Waktu pembuatan data |
| `created_by` | UUID | UUID pengguna yang membuat (nullable) |
| `updated_at` | TIMESTAMP | Waktu pembaruan terakhir (nullable) |
| `updated_by` | UUID | UUID pengguna yang memperbarui (nullable) |

**Constraint & Index:**
- `PrimaryKeyConstraint('id', name='jabatan_pkey')`
- `UniqueConstraint('kode', name='jabatan_kode_key')`
- `Index('idx_jabatan_org_poly', 'organisasi_type', 'organisasi_ref_id')` — composite, non-unique
- `Index('jabatan_kode_idx', 'kode', unique=True)`

**Catatan Polimorfik:** Kolom `organisasi_type` dan `organisasi_ref_id` bersama-sama membentuk referensi ke tabel organisasi yang bervariasi. Tidak ada FK constraint standar. Backend wajib melakukan validasi eksistensi secara manual sebelum INSERT/UPDATE.

**Relasi ke tabel lain:**
- `people` — one-to-many (satu jabatan bisa diduduki banyak orang, meskipun aturan bisnis idealnya satu orang per jabatan)
- `perangkat_keamanan` — one-to-many (jabatan bisa menjadi pengelola perangkat keamanan)

---

### Tabel 2: `people`

Tabel individu yang terdaftar di sistem. Relasi ke jabatan melalui FK `jabatan_id`. Tabel ini **bukan milik modul Master Jabatan** secara penuh — ia adalah entitas tersendiri (modul Master People/SDM). Modul Master Jabatan hanya **membaca** data people untuk menentukan status dan menampilkan pemegang jabatan.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_people` | UUID (PK) | Primary key people |
| `nip` | VARCHAR(50) | Nomor induk pegawai (UNIQUE) |
| `name` | VARCHAR(255) | Nama lengkap |
| `email` | VARCHAR(255) | Email (UNIQUE) |
| `username` | VARCHAR(100) | Username (UNIQUE) |
| `is_active` | BOOLEAN | Status aktif pegawai |
| `jabatan_id` | UUID (FK → `jabatan.id`) | Jabatan yang sedang dijabat (nullable) |
| `tanggal_mulai_jabatan` | DATE | Tanggal mulai menjabat (nullable) |
| `lokasi_kerja` | VARCHAR(255) | Lokasi kerja (nullable) |
| `nama_proyek` | VARCHAR(100) | Nama proyek terkait (nullable) |
| `source_system` | VARCHAR(50) | Asal data jika diimpor (nullable) |
| `created_at` | TIMESTAMP | (nullable) |
| `created_by` | UUID | (nullable) |
| `updated_at` | TIMESTAMP | (nullable) |
| `updated_by` | UUID | (nullable) |

**FK Constraint:** `people_jabatan_id_fkey` → `jabatan.id`

**Catatan:** Kolom `jabatan_id` di tabel `people` adalah nullable. Satu individu bisa tidak memiliki jabatan (`jabatan_id = NULL`), yang berarti jabatan terkait berstatus **Kosong**.

---

### Field Turunan (Computed/Derived) — Tidak Ada di DB

| Field di UI | Cara Hitung | Sumber |
|---|---|---|
| `status` ("Aktif"/"Kosong"/"Nonaktif") | Logika tiga-keadaan (lihat Tujuan Fitur) | `jabatan.is_active` + EXISTS query ke `people` |
| `unit` (nama organisasi) | JOIN/lookup polimorfik berdasarkan `organisasi_type` + `organisasi_ref_id` | Tabel organisasi terkait |
| `people` (pemegang jabatan) | JOIN ke `people` WHERE `jabatan_id = jabatan.id` | `people` |

> **Catatan Kritis — Kolom yang Belum Ada di DB:**
> Antarmuka lama meminta field `level` (tingkatan jabatan) dan `atasan` (jabatan atasan langsung via self-referencing FK `atasan_id`). **Kedua kolom ini TIDAK ADA di tabel `jabatan` saat ini.** Implementasi penuh membutuhkan migrasi DB terlebih dahulu.

---

## 3. Aturan Delete (Penghapusan)

### Tabel `jabatan`

FK di tabel `people` ke `jabatan` **tidak menggunakan CASCADE** — database akan RESTRICT (tolak) jika masih ada people yang mengisi jabatan tersebut.

| Yang Dihapus | Boleh Dihapus Jika | Jika Ada Anak |
|---|---|---|
| `jabatan` | `is_active = false` **DAN** tidak ada `people` dengan `jabatan_id` = id ini | Tolak 409 |
| `jabatan` | `is_active = false` **DAN** tidak ada `perangkat_keamanan` yang mengacu ke jabatan ini | Tolak 409 |

**Aturan bisnis tambahan:**
- Jabatan dengan status **Aktif** (ada people yang menjabat) **tidak boleh dihapus** — harus dialihkan atau dikosongkan dahulu.
- Jabatan dengan status **Kosong** tapi `is_active = true` hanya boleh dihapus setelah di-nonaktifkan terlebih dahulu.
- Tombol **Hapus** di UI hanya aktif untuk jabatan berstatus **Nonaktif** dan tidak memiliki people terkait.
- Operasi hapus `jabatan` bukan cascade — BE wajib memvalidasi ketiadaan relasi sebelum eksekusi DELETE.

### Soft Delete

Tabel `jabatan` dan `people` **tidak memiliki kolom `is_active`**. Semua hapus adalah **hard delete** permanen. Lihat bagian Kekurangan untuk rekomendasi migrasi.

---

## 4. Alur Lengkap FE → BE → DB

### Operasi 1 — Baca Daftar Jabatan (GET All)

```
FE: Halaman /master/jabatan dimuat
  → GET /api/v1/jabatan?page=1&limit=20
    BE:
      SELECT j.id, j.kode, j.nama, j.organisasi_type, j.organisasi_ref_id,
             j.is_active, j.deskripsi,
             p.id_people, p.name, p.nip, p.email, p.tanggal_mulai_jabatan
      FROM jabatan j
      LEFT JOIN people p ON p.jabatan_id = j.id AND p.is_active = true
      ORDER BY j.kode ASC
      LIMIT 20 OFFSET 0

    BE (logika status):
      is_active=false                        → status = "Nonaktif"
      is_active=true AND p.id_people IS NULL → status = "Kosong"
      is_active=true AND p.id_people IS NOT NULL → status = "Aktif"

    DB: Kembalikan daftar jabatan dengan data people dan status terkomputasi
  → FE: Render tabel jabatan dengan badge status, nama pemegang jabatan
```

---

### Operasi 2 — Baca Detail Jabatan (GET Single)

```
FE: Klik baris jabatan di tabel → buka panel detail / dialog
  → GET /api/v1/jabatan/{jabatan_id}
    BE:
      SELECT j.*, p.* FROM jabatan j
      LEFT JOIN people p ON p.jabatan_id = j.id AND p.is_active = true
      WHERE j.id = :jabatan_id

    BE: lookup nama unit dari tabel organisasi berdasarkan organisasi_type + organisasi_ref_id
    DB: Kembalikan satu jabatan + data pemegang + nama unit
  → FE: Tampilkan form detail / drawer dengan semua field
```

---

### Operasi 3 — Tambah Jabatan Baru (POST)

```
FE: Klik tombol "Tambah Jabatan" → isi form:
    - kode (wajib, harus unik)
    - nama (wajib)
    - organisasi_type + organisasi_ref_id (pilih dari dropdown unit organisasi)
    - deskripsi (opsional)
    → Submit

  → POST /api/v1/jabatan
    Body: { kode, nama, organisasi_type, organisasi_ref_id, deskripsi }
    BE:
      1. Validasi kode belum ada di tabel (cek UNIQUE)
      2. Validasi kombinasi organisasi_type + organisasi_ref_id merujuk ke entitas yang ada
      3. INSERT INTO jabatan (kode, nama, organisasi_type, organisasi_ref_id, is_active=true,
                              deskripsi, created_by, created_at)
         RETURNING id, kode, nama, ...
    DB: Simpan jabatan baru, status otomatis = "Kosong" (is_active=true, belum ada people)
  → FE: Jabatan baru muncul di tabel dengan badge "Kosong"
```

---

### Operasi 4 — Edit Jabatan (PUT)

```
FE: Klik ikon "Edit" di baris jabatan → form pre-filled → ubah field → Submit
  → PUT /api/v1/jabatan/{jabatan_id}
    Body: { kode, nama, organisasi_type, organisasi_ref_id, deskripsi }
    BE:
      1. Validasi jabatan exists
      2. Jika kode diubah: cek UNIQUE bukan milik jabatan lain
      3. Validasi kombinasi organisasi_type + organisasi_ref_id jika diubah
      4. UPDATE jabatan SET kode=?, nama=?, organisasi_type=?, organisasi_ref_id=?,
                           deskripsi=?, updated_at=NOW(), updated_by=?
         WHERE id = :jabatan_id
    DB: Update baris jabatan
  → FE: Baris tabel diperbarui, badge status tidak berubah (tergantung relasi people)
```

---

### Operasi 5 — Nonaktifkan Jabatan (Toggle is_active)

```
FE: Klik toggle "Nonaktifkan" pada jabatan → konfirmasi dialog → Confirm
  → PATCH /api/v1/jabatan/{jabatan_id}/toggle-active
    BE:
      1. GET jabatan saat ini
      2. Jika akan di-nonaktifkan (is_active true → false):
         VALIDASI: tidak ada people dengan jabatan_id = jabatan_id ini dan is_active = true
         Jika masih ada → tolak 409 dengan pesan "Jabatan masih dijabat oleh [nama people]"
      3. UPDATE jabatan SET is_active = NOT is_active, updated_at=NOW(), updated_by=?
         WHERE id = :jabatan_id
    DB: Flip nilai is_active
  → FE: Badge status berubah: "Aktif"/"Kosong" → "Nonaktif" atau sebaliknya
```

---

### Operasi 6 — Hapus Jabatan (DELETE)

```
FE: Klik ikon "Hapus" (hanya aktif jika status = "Nonaktif") → konfirmasi dialog → Confirm
  → DELETE /api/v1/jabatan/{jabatan_id}
    BE:
      1. Validasi jabatan.is_active = false
      2. Validasi tidak ada people dengan jabatan_id = jabatan_id (ANY status)
      3. Validasi tidak ada perangkat_keamanan yang mengacu ke jabatan ini
      4. DELETE FROM jabatan WHERE id = :jabatan_id
    DB: Hard delete baris jabatan
  → FE: Baris hilang dari tabel, snackbar konfirmasi
```

---

### Operasi 7 — Tetapkan Pemegang Jabatan (Assign People)

Operasi ini mengubah `people.jabatan_id` — bukan membuat record baru di `jabatan`, melainkan mengaitkan individu yang sudah ada ke jabatan ini. Ini mengubah status jabatan dari "Kosong" menjadi "Aktif".

```
FE: Klik tombol "Tetapkan Pemegang" di detail jabatan berstatus "Kosong"
    → dropdown/search people (filter: is_active=true dan jabatan_id IS NULL atau jabatan lain)
    → pilih individu → Submit

  → PATCH /api/v1/jabatan/{jabatan_id}/assign-people
    Body: { people_id, tanggal_mulai_jabatan }
    BE (satu transaksi):
      1. Validasi jabatan exists dan is_active = true
      2. Validasi people exists dan is_active = true
      3. Jika people saat ini sudah punya jabatan_id lain:
         UPDATE jabatan lama statusnya akan berubah ke "Kosong" secara otomatis
      4. UPDATE people SET jabatan_id = :jabatan_id,
                           tanggal_mulai_jabatan = :tanggal_mulai_jabatan,
                           updated_at = NOW(), updated_by = ?
         WHERE id_people = :people_id
    DB: Commit — people terkait ke jabatan, status jabatan otomatis jadi "Aktif"
  → FE: Badge jabatan berubah "Kosong" → "Aktif", nama pemegang muncul di baris tabel
```

---

### Operasi 8 — Lepas Pemegang Jabatan (Unassign People)

```
FE: Klik tombol "Lepas Pemegang" di detail jabatan berstatus "Aktif" → konfirmasi → Confirm
  → PATCH /api/v1/jabatan/{jabatan_id}/unassign-people
    BE:
      1. Validasi jabatan exists
      2. Cari people dengan jabatan_id = jabatan_id
      3. UPDATE people SET jabatan_id = NULL, tanggal_mulai_jabatan = NULL,
                           updated_at = NOW(), updated_by = ?
         WHERE jabatan_id = :jabatan_id AND is_active = true
    DB: jabatan_id di people dikosongkan
  → FE: Badge jabatan berubah "Aktif" → "Kosong", kolom pemegang dikosongkan
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/jabatan` | SELECT semua + LEFT JOIN people, hitung status | `jabatan`, `people` |
| GET | `/api/v1/jabatan/{id}` | SELECT satu + JOIN people + lookup organisasi | `jabatan`, `people` |
| POST | `/api/v1/jabatan` | INSERT jabatan baru | `jabatan` |
| PUT | `/api/v1/jabatan/{id}` | UPDATE data jabatan | `jabatan` |
| PATCH | `/api/v1/jabatan/{id}/toggle-active` | UPDATE is_active (validasi people dulu) | `jabatan` |
| DELETE | `/api/v1/jabatan/{id}` | DELETE (validasi no children) | `jabatan` |
| PATCH | `/api/v1/jabatan/{id}/assign-people` | UPDATE jabatan_id di people (1 transaksi) | `people` |
| PATCH | `/api/v1/jabatan/{id}/unassign-people` | UPDATE jabatan_id = NULL di people | `people` |
| GET | `/api/v1/jabatan/options` | SELECT id, kode, nama untuk dropdown | `jabatan` |

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Cards

| Card | Cara Hitung |
|------|-------------|
| **Total Jabatan** | `COUNT(*) FROM jabatan` |
| **Jabatan Aktif** | `COUNT(*) FROM jabatan j JOIN people p ON p.jabatan_id = j.id WHERE j.is_active = true AND p.is_active = true` |
| **Jabatan Kosong** | `COUNT(*) FROM jabatan j LEFT JOIN people p ON p.jabatan_id = j.id WHERE j.is_active = true AND p.id_people IS NULL` |
| **Jabatan Nonaktif** | `COUNT(*) FROM jabatan WHERE is_active = false` |

### 6.2. Tabel Utama Jabatan

Kolom yang ditampilkan:

| Kolom UI | Sumber Data |
|---|---|
| Kode | `jabatan.kode` |
| Nama Jabatan | `jabatan.nama` |
| Unit/Organisasi | lookup polimorfik via `organisasi_type` + `organisasi_ref_id` |
| Level | `jabatan.level` *(kolom sudah ada di DB)* |
| Pemegang | `people.name` + `people.nip` (dari JOIN) |
| Status | Badge tiga-keadaan: `Aktif` / `Kosong` / `Nonaktif` |
| Aksi | Tombol Edit, Toggle Aktif, Hapus (kondisional) |

### 6.3. Form Tambah / Edit Jabatan

| Field | Input Type | Validasi |
|---|---|---|
| Kode Jabatan | Text | Wajib, max 50 karakter, unik |
| Nama Jabatan | Text | Wajib, max 255 karakter |
| Unit Organisasi | Dropdown | Wajib, pilih dari daftar satuan organisasi |
| Deskripsi | Textarea | Opsional |
| Level | Text / Dropdown | Opsional |
| Jabatan Atasan | Dropdown (self-ref) | Opsional; validasi: tidak boleh pilih diri sendiri |

### 6.4. Panel Detail / Drawer

Menampilkan:
- Informasi lengkap jabatan
- Section **Pemegang Jabatan**: nama, NIP, email, tanggal mulai jabatan
- Tombol **Tetapkan Pemegang** (jika status Kosong)
- Tombol **Lepas Pemegang** (jika status Aktif)

### 6.5. Badge Status

| Status | Warna | Kondisi |
|---|---|---|
| Aktif | Hijau (`bg-green-100 text-green-700`) | `is_active=true` AND ada people |
| Kosong | Kuning (`bg-yellow-100 text-yellow-700`) | `is_active=true` AND tidak ada people |
| Nonaktif | Abu-abu (`bg-gray-100 text-gray-500`) | `is_active=false` |

---

## 7. Ringkasan & Kekurangan Skema Database Saat Ini

### ✓ Sudah Ada

- Tabel `jabatan` sudah tersedia lengkap: `id`, `kode`, `nama`, `level`, `atasan_id`, `is_active`, `deskripsi`, `organisasi_type`, `organisasi_ref_id`.
- Tabel `people` sudah memiliki FK `jabatan_id → jabatan.id` — relasi one-to-many sudah terhubung.
- Kolom `tanggal_mulai_jabatan` di `people` sudah ada untuk mencatat riwayat penugasan.
- Index polimorfik `idx_jabatan_org_poly` sudah terpasang untuk query berdasarkan unit organisasi.
- Kolom audit (`created_at`, `created_by`, `updated_at`, `updated_by`) sudah ada di kedua tabel.
- Semua endpoint BE sudah diimplementasi.
- FE sudah terhubung ke API.

### ⚠ Gap Implementasi yang Perlu Diperhatikan

| Gap | Keterangan |
|-----|-----------|
| Assign people tidak handle jabatan lama | Jika people sudah punya jabatan lain, jabatan lama seharusnya otomatis berubah ke "Kosong" — belum diimplementasi di BE |
| Delete tidak check `perangkat_keamanan` | Docs mengharuskan validasi relasi ke `perangkat_keamanan` sebelum delete, belum ada di BE |

---

### Status Implementasi

| Komponen | Status | Catatan |
|---|---|---|
| Tabel `jabatan` lengkap (incl. `level`, `atasan_id`) | ✓ Selesai | Migrasi sudah dilakukan |
| Relasi `people.jabatan_id` | ✓ Selesai | FK sudah valid |
| Endpoint BE (`/api/v1/master/jabatan`) | ✓ Selesai | Semua 9 endpoint ada |
| Frontend (fetch API) | ✓ Selesai | Terhubung ke API |

> **Status Keseluruhan:** **Selesai.** Ada 2 gap implementasi minor yang perlu ditindaklanjuti (lihat tabel gap di atas).
