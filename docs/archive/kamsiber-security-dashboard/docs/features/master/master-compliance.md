# Spesifikasi Fitur: Master Standar Keamanan (Compliance)

**Path URL:** `http://localhost:3000/master/standar-keamanan`  
**Modul:** Master Data  
**Sumber Referensi:** Desain lama `zpic/daskam` (`StandarKeamananPage`)

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola berbagai kerangka kerja standar keamanan (*Security Frameworks*) seperti OWASP ASVS, ISO 27001, atau standar internal perusahaan. Pengguna dapat membuat Kategori Induk, mengatur Versi (Draft/Aktif), menyusun Kategori/Domain kendali, merinci Poin/Kontrol teknis, dan melampirkan bukti pemenuhan (*evidence*).

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **6 tabel** yang terbagi menjadi dua kelompok:

- **4 tabel inti** membentuk hierarki vertikal (satu ke banyak ke bawah)
- **1 tabel bukti** menggantung di bawah poin
- **1 tabel pivot** menghubungkan compliance ke modul Arsip (many-to-many)

```
compliance                        ← Tabel 1: Standar/Framework induk
  ├── compliance_version          ← Tabel 2: Versi dari standar
  │     └── compliance_kategori   ← Tabel 3: Domain/Kategori dalam satu versi
  │           └── point_kategori  ← Tabel 4: Kontrol teknis dalam satu kategori
  │                 └── evidence_point ← Tabel 5: Bukti pemenuhan per kontrol
  │
  └── arsip_relasi_kepatuhan      ← Tabel 6: Pivot ke modul Arsip (many-to-many)
        └── (FK) arsip_dokumen_kontrol  ← Tabel di modul Arsip, BUKAN bagian fitur ini
```

---

### Tabel 1: `compliance`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_compliance` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `nama_compliance` | VARCHAR(255) | Nama standar, misal "OWASP ASVS v4.0.3" |
| `deskripsi` | VARCHAR(255) | Deskripsi singkat |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

---

### Tabel 2: `compliance_version`
Satu standar bisa punya banyak versi. Hanya boleh ada **satu** `is_active = true` per `id_compliance`.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_version` | UUID (PK) | |
| `id_compliance` | UUID (FK → `compliance.id_compliance`) | |
| `versi` | VARCHAR(25) | Misal `"v1.0"`, `"v1.1-draft"` |
| `Tanggal_versi` | DATE | Tanggal efektif |
| `is_active` | BOOLEAN | `true` = Aktif, `false`/`null` = Draft |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

---

### Tabel 3: `compliance_kategori`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_kategori` | UUID (PK) | |
| `id_version` | UUID (FK → `compliance_version.id_version`) | |
| `nama_kategori` | VARCHAR(100) | Misal "V2: Authentication" |
| `deskripsi` | VARCHAR(255) | |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

> **Catatan:** Kolom `total_poin` **tidak ada** di tabel ini. Nilainya dihitung dinamis di backend: `COUNT(*) FROM point_kategori WHERE id_kategori = ?`

---

### Tabel 4: `point_kategori`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_point` | UUID (PK) | |
| `id_kategori` | UUID (FK → `compliance_kategori.id_kategori`) | |
| `kode_kontrol` | VARCHAR(255) | Misal `"2.1.1"` |
| `kode_level` | VARCHAR(25) | Misal `"Level 1"`, `"Level 2"` |
| `framework` | VARCHAR(100) | Misal `"NIST"`, `"OWASP"` |
| `nama_standar` | TEXT | Deskripsi teknis kontrol |
| `tindak_lanjut` | VARCHAR(255) | Opsional |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

---

### Tabel 5: `evidence_point`
Bukti pemenuhan yang dilampirkan ke suatu kontrol. Satu poin bisa punya banyak evidence.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id_evidence` | UUID (PK) | |
| `id_point` | UUID (FK → `point_kategori.id_point`) | Kontrol yang dibuktikan |
| `nama_file` | VARCHAR(255) | Nama file bukti |
| `path_file` | TEXT | Path/URL penyimpanan file |
| `tipe_file` | VARCHAR(50) | Misal `"pdf"`, `"png"` |
| `ukuran_file` | INTEGER | Ukuran dalam bytes |
| `dasar_revisi` | TEXT | Alasan/dasar revisi dokumen |
| `catatan` | TEXT | Catatan tambahan |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

---

### Tabel 6: `arsip_relasi_kepatuhan`
Tabel **pivot many-to-many** yang memetakan satu `compliance` ke satu `arsip_dokumen_kontrol` dari modul Arsip. Artinya satu standar keamanan bisa dikaitkan ke banyak dokumen arsip operasional, dan satu dokumen arsip bisa dikaitkan ke banyak standar.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | |
| `uuid` | VARCHAR(36) | |
| `id_compliance` | UUID (FK → `compliance.id_compliance`) | Standar yang dikaitkan |
| `id_arsip_dokumen` | UUID (FK → `arsip_dokumen_kontrol.id`) | Dokumen arsip dari modul Arsip |
| `nomor_dokuemn` | VARCHAR(100) | Nomor dokumen referensi *(typo di DB: "dokuemn")* |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

---

### Tabel 7: `arsip_dokumen_kontrol` — Di Luar Scope Fitur Ini

Tabel ini **bukan bagian dari Master Compliance**, melainkan milik modul **Arsip Kamsiber**. Tabel ini menyimpan versi dokumen operasional/kebijakan internal (SOP, kebijakan keamanan, dsb.) yang dikelola di halaman terpisah.

Fitur Master Compliance hanya **membaca** `id` dari tabel ini untuk mengisi FK di `arsip_relasi_kepatuhan`. UI-nya berupa dropdown atau pencarian dari daftar dokumen yang sudah ada di modul Arsip — bukan form create baru.

```
Modul Arsip (halaman lain)          Modul Master Compliance (halaman ini)
arsip_kamsiber                      compliance
  └── arsip_dokumen_kontrol   ←──── arsip_relasi_kepatuhan ────→ compliance
```

---

## 3. Aturan Delete (Penghapusan)

FK di semua tabel ini **tidak memakai CASCADE** — database akan RESTRICT (tolak) jika masih ada data anak. Backend wajib memvalidasi sebelum eksekusi DELETE.

| Yang Dihapus | Boleh Dihapus Jika | Jika Ada Anak |
|---|---|---|
| `compliance` | Tidak ada `compliance_version` & tidak ada `arsip_relasi_kepatuhan` | Tolak 409 |
| `compliance_version` | `is_active = false` (Draft) **dan** tidak ada `compliance_kategori` | Tolak 409 |
| `compliance_kategori` | Tidak ada `point_kategori` | Tolak 409 |
| `point_kategori` | Tidak ada `evidence_point` | Tolak 409 |
| `evidence_point` | Selalu boleh dihapus (tidak punya anak) | — |
| `arsip_relasi_kepatuhan` | Selalu boleh dihapus (tabel pivot, bukan induk) | — |

**Aturan bisnis tambahan:**
- Versi `is_active = true` tidak boleh dihapus langsung — harus ada versi lain yang di-Release terlebih dahulu.
- Tombol **Hapus** di UI hanya muncul untuk versi berstatus Draft.

---

## 4. Alur Lengkap FE → BE → DB

Alur kerja ini berurutan dari atas ke bawah. Setiap langkah bergantung pada langkah sebelumnya.

---

### Langkah 1 — Buat Kategori Induk (Compliance)

```
FE: Klik "Add" di sidebar → isi nama & deskripsi → Submit
  → POST /api/v1/compliance
    BE: INSERT INTO compliance (nama_compliance, deskripsi, created_by)
    DB: Simpan, kembalikan id_compliance baru
  → FE: Item baru muncul di sidebar, otomatis terpilih
```

---

### Langkah 2 — Buat Draft Versi

```
FE: Isi form "Versi Draft Baru" (versi, Tanggal_versi) → klik "Buat Draft"
  → POST /api/v1/compliance/{id_compliance}/versions
    BE: INSERT INTO compliance_version (id_compliance, versi, Tanggal_versi, is_active=false)
    DB: Simpan versi baru dengan is_active = false
  → FE: Versi muncul dengan badge "Draft"
```

---

### Langkah 3 — Release Draft → Aktif

```
FE: Pilih versi Draft → klik "Release Draft"
  → PUT /api/v1/compliance/versions/{id_version}/release
    BE (satu transaksi atomik):
      1. UPDATE compliance_version SET is_active = false
         WHERE id_compliance = ? AND is_active = true   ← nonaktifkan Aktif lama
      2. UPDATE compliance_version SET is_active = true
         WHERE id_version = ?                           ← aktifkan versi ini
    DB: Commit — hanya 1 versi Aktif per compliance, jika salah satu gagal keduanya dibatalkan
  → FE: Badge versi lama → "Draft", versi ini → "Aktif"
```

---

### Langkah 4 — Tambah Kategori Standar

```
FE: Pilih versi → klik "Add Kategori" → isi nama & deskripsi → Submit
  → POST /api/v1/compliance/versions/{id_version}/kategori
    BE: INSERT INTO compliance_kategori (id_version, nama_kategori, deskripsi, created_by)
    DB: Simpan, kembalikan id_kategori baru
  → FE: Kategori baru muncul di grid, total_poin = 0 (belum ada poin)
```

---

### Langkah 5 — Tambah Poin/Kontrol

```
FE: Klik kategori → klik "Add Poin" → isi form → Submit
  → POST /api/v1/compliance/kategori/{id_kategori}/poin
    BE: INSERT INTO point_kategori
        (id_kategori, kode_kontrol, kode_level, framework, nama_standar, tindak_lanjut, created_by)
    DB: Simpan, kembalikan id_point baru
  → FE: Poin muncul di list, dikelompokkan otomatis per kode_level
        total_poin di grid kategori naik +1
```

---

### Langkah 6 (Terakhir) — Lampirkan Evidence ke Poin

Ini adalah langkah akhir: membuktikan bahwa setiap kontrol sudah dipenuhi dengan melampirkan dokumen/file sebagai bukti.

```
FE: Klik poin → klik "Lampirkan Evidence" → upload file / isi form → Submit
  → POST /api/v1/compliance/poin/{id_point}/evidence
    Body: { nama_file, path_file, tipe_file, ukuran_file, dasar_revisi, catatan }
    BE: INSERT INTO evidence_point (id_point, nama_file, path_file, ...)
    DB: Simpan bukti, terhubung ke point_kategori
  → FE: Ikon bukti/badge "Ada Evidence" muncul di samping poin
```

> **Catatan upload file:** Path file (`path_file`) diisi setelah file berhasil diupload ke storage (S3 / local storage). Endpoint upload file dan endpoint simpan evidence bisa dipisah: FE upload dulu → dapat URL → baru POST ke endpoint evidence.

---

### Opsional — Kaitkan Compliance ke Dokumen Arsip

Ini bukan bagian dari alur utama, tapi tersedia sebagai fitur tambahan untuk menghubungkan standar ke dokumen kebijakan internal yang ada di modul Arsip.

```
FE: Di halaman detail compliance → section "Dokumen Terkait"
    → cari/pilih dokumen dari modul Arsip (dropdown dari arsip_dokumen_kontrol)
    → klik "Kaitkan"
  → POST /api/v1/compliance/{id_compliance}/relasi-arsip
    Body: { id_arsip_dokumen, nomor_dokuemn }
    BE: INSERT INTO arsip_relasi_kepatuhan (id_compliance, id_arsip_dokumen, nomor_dokuemn, ...)
    DB: Simpan baris pivot
  → FE: Dokumen muncul di list "Dokumen Terkait" standar ini
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/compliance` | SELECT semua | `compliance` |
| POST | `/api/v1/compliance` | INSERT | `compliance` |
| GET | `/api/v1/compliance/{id}/versions` | SELECT by compliance | `compliance_version` |
| POST | `/api/v1/compliance/{id}/versions` | INSERT draft | `compliance_version` |
| PUT | `/api/v1/compliance/versions/{vid}` | UPDATE (draft only) | `compliance_version` |
| DELETE | `/api/v1/compliance/versions/{vid}` | DELETE (draft, no children) | `compliance_version` |
| PUT | `/api/v1/compliance/versions/{vid}/release` | UPDATE 2 baris, 1 transaksi | `compliance_version` |
| GET | `/api/v1/compliance/versions/{vid}/kategori` | SELECT + COUNT poin | `compliance_kategori`, `point_kategori` |
| POST | `/api/v1/compliance/versions/{vid}/kategori` | INSERT | `compliance_kategori` |
| PUT | `/api/v1/compliance/kategori/{kid}` | UPDATE | `compliance_kategori` |
| GET | `/api/v1/compliance/kategori/{kid}/poin` | SELECT ORDER BY level | `point_kategori` |
| POST | `/api/v1/compliance/kategori/{kid}/poin` | INSERT | `point_kategori` |
| PUT | `/api/v1/compliance/poin/{pid}` | UPDATE | `point_kategori` |
| GET | `/api/v1/compliance/poin/{pid}/evidence` | SELECT by point | `evidence_point` |
| POST | `/api/v1/compliance/poin/{pid}/evidence` | INSERT | `evidence_point` |
| DELETE | `/api/v1/compliance/evidence/{eid}` | DELETE | `evidence_point` |
| POST | `/api/v1/compliance/{id}/relasi-arsip` | INSERT pivot | `arsip_relasi_kepatuhan` |
| DELETE | `/api/v1/compliance/relasi-arsip/{rid}` | DELETE pivot | `arsip_relasi_kepatuhan` |

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Cards
| Card | Cara Hitung |
|------|-------------|
| **Kategori Induk** | `compliance.length` |
| **Kategori** | Jumlah `compliance_kategori` dari versi terpilih |
| **Versi Aktif** | `compliance_version.filter(v => v.is_active).length` |
| **Checklist Aktif** | Total `total_poin` dari semua kategori dalam versi terpilih |

### 6.2. Left Sidebar
- Tombol **Add** → form tambah standar baru.
- List item vertikal; item terpilih di-highlight (`bg-blue-50`).

### 6.3. Main Content
1. **Header** — judul, deskripsi, badge ringkasan.
2. **Section "Versi Template"** — list versi + badge (Aktif/Draft), form input versi, tombol: `Buat Draft`, `Simpan Draft`, `Hapus` *(Draft only)*, `Release Draft`.
3. **Section "Kategori Standar"** — grid kategori + angka poin masing-masing; tombol Add & Edit.
4. **Section "Poin Standar"** — list kontrol dikelompokkan per `kode_level`; tombol Add, Edit, dan **Lampirkan Evidence** per poin.
5. **Section "Dokumen Terkait"** *(opsional)* — list dokumen arsip yang sudah dikaitkan; tombol Kaitkan & Lepas.

---

## 7. Ringkasan & Kekurangan Skema Database Saat Ini

### ✓ Sudah Ada
- Hierarki 4 lapisan (compliance → version → kategori → poin) sudah lengkap di DB.
- `is_active` di `compliance_version` cukup untuk logika Draft/Aktif.
- `evidence_point` sudah siap untuk lampiran bukti per kontrol.
- `arsip_relasi_kepatuhan` sudah tersedia sebagai pivot ke modul Arsip.

### Status `is_active` per Tabel

`is_active` digunakan sebagai **penanda soft delete**: `true` = aktif/ada, `false` = sudah dihapus (tersembunyi dari UI).

| Tabel | `is_active` saat ini | Keterangan |
|-------|:--------------------:|:----------:|
| `compliance` | ✓ sudah ada | Migrasi selesai, dipakai di BE |
| `compliance_version` | ✓ sudah ada | Dipakai untuk logika Draft/Aktif |
| `compliance_kategori` | ✓ sudah ada | Migrasi selesai, dipakai di BE |
| `point_kategori` | ✓ sudah ada | Migrasi selesai, dipakai di BE |
| `evidence_point` | ✗ belum ada | Belum dipakai (endpoint evidence belum diimplementasi) |

> Tabel `arsip_relasi_kepatuhan` (pivot) dan `arsip_dokumen_kontrol` (milik modul Arsip) tidak perlu — tabel pivot boleh hard delete.

### ✗ Endpoint Belum Diimplementasi

5 endpoint berikut belum ada di backend (planned/TODO):

| Endpoint | Keterangan |
|----------|-----------|
| `GET /api/v1/compliance/poin/{pid}/evidence` | Belum ada |
| `POST /api/v1/compliance/poin/{pid}/evidence` | Belum ada |
| `DELETE /api/v1/compliance/evidence/{eid}` | Belum ada |
| `POST /api/v1/compliance/{id}/relasi-arsip` | Belum ada |
| `DELETE /api/v1/compliance/relasi-arsip/{rid}` | Belum ada |

---

## 8. Panduan Migrasi — Tambah `is_active`

### Urutan Pengerjaan

```
1. Jalankan migration SQL  →  kolom is_active masuk ke DB
2. Jalankan scafold.ps1    →  scaffolded_models.py ter-regenerate dengan kolom baru
3. Update compliance.py    →  ganti hard delete menjadi soft delete via is_active = false
```

### File Migrasi

| File | Lokasi | Fungsi |
|------|--------|--------|
| `001_add_is_active_compliance.sql` | `backend/migrations/sql/` | Apply migrasi |
| `001_rollback.sql` | `backend/migrations/sql/` | Undo migrasi |

### Cara Menjalankan (Langkah 1)

```bash
# Apply
psql $DATABASE_URL -f backend/migrations/sql/001_add_is_active_compliance.sql

# Rollback jika perlu dibatalkan
psql $DATABASE_URL -f backend/migrations/sql/001_rollback.sql
```

Script menggunakan `ADD COLUMN IF NOT EXISTS` — **idempotent**, aman dijalankan berkali-kali. Baris lama mendapat `is_active = true` dari DEFAULT, tidak ada data yang berubah.

### Verifikasi Setelah Migrasi

```sql
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN (
    'compliance','compliance_kategori','point_kategori','evidence_point'
)
AND column_name = 'is_active'
ORDER BY table_name;
-- Hasil yang diharapkan: 4 baris
```

### Pola Implementasi Setelah Scaffold (Langkah 3)

**Filter SELECT — hanya tampilkan record aktif:**
```python
.filter(Model.is_active == True)
```

**Soft delete — ganti `db.delete()` dengan set `is_active = false`:**
```python
record.is_active = False
db.commit()
```

**Aturan khusus `compliance_version`:** `is_active` sudah ada dan bermakna Draft/Aktif (bukan penanda hapus). Untuk "hapus" versi, tetap gunakan hard delete selama versi berstatus Draft (`is_active = false`).
