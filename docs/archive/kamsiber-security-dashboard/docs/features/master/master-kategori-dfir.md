# Spesifikasi Fitur: Master Kategori DFIR

**Path URL:** `http://localhost:3000/master/kategori-dfir`  
**Modul:** Master Data  
**Sumber Referensi:** Desain lama `zpic/daskam` (`KategoriDfirPage`), tabel `CTI` dan `DFIR` dari `scaffolded_models.py`

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola **Kategori DFIR** (*Digital Forensics and Incident Response*). Setiap kategori mewakili satu entri intelijen ancaman siber (*Cyber Threat Intelligence* — CTI) yang dapat diklasifikasikan berdasarkan tingkat keparahan (*severity*), dilengkapi referensi deskripsi ancaman, dan dikaitkan ke sejumlah insiden DFIR yang pernah terjadi.

Karena **tidak ada tabel `kategori_dfir` tersendiri di database**, fitur ini dipetakan langsung ke tabel `CTI` yang sudah ada. Tabel `CTI` adalah master data ancaman (*threat intelligence*) yang memiliki relasi **One-to-Many** ke tabel `DFIR` (tabel insiden). Kolom `insiden` yang tampil di UI adalah nilai agregat dari relasi tersebut, dihitung secara dinamis di backend via `COUNT`.

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **2 tabel** utama:

- **1 tabel induk** (`CTI`) yang menjadi data master kategori
- **1 tabel anak** (`DFIR`) yang merupakan tabel insiden, digunakan hanya untuk menghitung jumlah insiden per kategori

```
CTI                          ← Tabel 1: Master Kategori DFIR (induk)
  └── DFIR                   ← Tabel 2: Insiden DFIR (anak, hanya untuk COUNT)
        └── DokumenTindakanDfir  ← Di luar scope fitur ini (milik modul DFIR)
```

> **Catatan:** Tabel `DFIR` **tidak dikelola** dari halaman ini. Halaman ini hanya **membaca** jumlah baris `DFIR` yang berelasi ke setiap entri `CTI` untuk mengisi kolom `insiden` di UI.

---

### Tabel 1: `CTI`

Tabel induk yang menyimpan data master kategori ancaman. Setiap baris di tabel ini merepresentasikan satu "Kategori DFIR" di UI.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `kode` | VARCHAR | Auto-generate dari judul (`"CAT-" + 3 karakter acak`), ditampilkan di UI |
| `judul` | VARCHAR(100) | Nama kategori ancaman |
| `kode_saverity` | VARCHAR(25) | Tingkat keparahan: `"Critical"`, `"High"`, `"Medium"`, `"Low"` |
| `deskripsi` | VARCHAR(255) | Deskripsi ancaman |
| `referensi_standar` | VARCHAR | Standar referensi, misal `"MITRE ATT&CK"`, `"ISO 27035"` |
| `referensi_kode` | VARCHAR | Kode referensi, misal `"T1486"` |
| `keterangan` | VARCHAR | Catatan tambahan (opsional) |
| `eksploit_table` | BOOLEAN | Penanda apakah ancaman ini sudah dieksploitasi |
| `is_active` | BOOLEAN | Status aktif/nonaktif (soft delete) |
| `created_at` | TIMESTAMP | Waktu pembuatan baris |
| `created_by` | UUID | UUID pengguna yang membuat |
| `updated_at` | TIMESTAMP | Waktu pembaruan terakhir |
| `updated_by` | UUID | UUID pengguna yang memperbarui |

> **Catatan — Kolom Turunan (Computed Field):**
> Kolom `insiden` yang tampil di UI **tidak ada** di tabel `CTI`. Nilainya dihitung dinamis di backend:
> ```sql
> SELECT COUNT(*) FROM "DFIR" WHERE id_cti = CTI.id
> ```
> Backend menyertakan nilai ini sebagai field `insiden_count` di setiap respons GET.

---

### Tabel 2: `DFIR`

Tabel insiden yang berelasi ke `CTI`. Dari halaman Master Kategori DFIR, tabel ini **hanya dibaca untuk keperluan COUNT** — tidak ada operasi tulis ke tabel ini dari halaman ini.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `id_cti` | UUID (FK → `CTI.id`) | Relasi ke kategori CTI induk |
| `judul` | VARCHAR(100) | Judul insiden |
| `kode_saverity` | VARCHAR(25) | Tingkat keparahan insiden |
| `deskripsi` | VARCHAR(255) | Deskripsi insiden |
| `tanggal` | TIMESTAMP | Tanggal insiden |
| `tanggal_deteksi` | TIMESTAMP | Tanggal insiden terdeteksi |
| `pic` | UUID (FK → `people.id_people`) | Penanggung jawab insiden |
| `eksploit_table` | BOOLEAN | Penanda eksploitasi |
| `created_at` | TIMESTAMP | |
| `created_by` | UUID | |
| `updated_at` | TIMESTAMP | |
| `updated_by` | UUID | |

---

### Pemetaan Interface UI → Kolom Database

| Field UI (`KategoriDfir`) | Kolom di DB | Tabel | Catatan |
|--------------------------|-------------|-------|---------|
| `kode` | `id` | `CTI` | UUID, bisa disingkat di tampilan |
| `nama` | `judul` | `CTI` | |
| `klasifikasi` | `kode_saverity` | `CTI` | Nilai: `"High"`, `"Medium"`, `"Low"` |
| `referensi` | `deskripsi` | `CTI` | |
| `insiden` | *(tidak ada kolom)* | `DFIR` | `COUNT(*)` via JOIN agregat |
| `status` | *(tidak ada kolom)* | `CTI` | **GAP** — kolom belum ada di DB |

---

## 3. Aturan Delete (Penghapusan)

FK di tabel `DFIR` ke `CTI` **tidak memakai CASCADE** — jika masih ada baris `DFIR` yang mereferensikan `CTI.id`, database akan RESTRICT dan menolak penghapusan. Backend wajib memvalidasi kondisi ini sebelum mengeksekusi DELETE.

| Yang Dihapus | Boleh Dihapus Jika | Jika Ada Anak |
|---|---|---|
| `CTI` | Tidak ada `DFIR` yang berelasi (`id_cti = CTI.id`) | Tolak 409 Conflict |
| `DFIR` | Tidak ada `DokumenTindakanDfir` yang berelasi | Di luar scope halaman ini |

**Aturan bisnis tambahan:**
- Penghapusan `CTI` dari halaman Master Kategori DFIR hanya diizinkan jika `insiden_count = 0`.
- Tombol **Hapus** di UI harus dinonaktifkan (*disabled*) atau disembunyikan jika nilai kolom `insiden` > 0.
- Delete diimplementasikan sebagai **soft delete** (`is_active = false`), bukan hard delete.

---

## 4. Alur Lengkap FE → BE → DB

---

### Operasi 1 — Tampilkan Daftar Kategori DFIR (READ)

```
FE: Halaman dimuat → fetch daftar kategori
  → GET /api/v1/cti
    BE: SELECT CTI.id, CTI.judul, CTI.kode_saverity, CTI.deskripsi,
               CTI.eksploit_table, CTI.created_at,
               COUNT(DFIR.id) AS insiden_count
        FROM "CTI"
        LEFT JOIN "DFIR" ON DFIR.id_cti = CTI.id
        GROUP BY CTI.id
        ORDER BY CTI.created_at DESC
    DB: Kembalikan semua baris CTI beserta jumlah insiden per kategori
  → FE: Render tabel dengan kolom kode, nama, klasifikasi, referensi, insiden, status
        Kolom status dikosongkan atau ditampilkan "-" karena belum ada di DB
```

---

### Operasi 2 — Tambah Kategori DFIR Baru (CREATE)

```
FE: Klik tombol "Tambah" / "Add" → isi form modal:
    - Nama (judul)
    - Klasifikasi / Severity (kode_saverity): dropdown High / Medium / Low
    - Referensi (deskripsi)
    → klik "Simpan"
  → POST /api/v1/cti
    Body: { judul, kode_saverity, deskripsi, eksploit_table? }
    BE: INSERT INTO "CTI" (judul, kode_saverity, deskripsi, eksploit_table, created_by)
        VALUES (?, ?, ?, ?, ?)
    DB: Simpan baris baru, kembalikan id dan data lengkap CTI
  → FE: Tutup modal, reload / tambahkan baris baru ke tabel,
        nilai insiden = 0 karena baru dibuat
```

---

### Operasi 3 — Edit Kategori DFIR (UPDATE)

```
FE: Klik ikon edit / tombol "Edit" pada baris kategori → buka form modal
    dengan data yang sudah terisi (pre-filled):
    - Nama (judul)
    - Klasifikasi (kode_saverity)
    - Referensi (deskripsi)
    → ubah data → klik "Simpan"
  → PUT /api/v1/cti/{id}
    Body: { judul?, kode_saverity?, deskripsi?, eksploit_table? }
    BE: UPDATE "CTI"
        SET judul = ?, kode_saverity = ?, deskripsi = ?,
            updated_at = NOW(), updated_by = ?
        WHERE id = ?
    DB: Perbarui baris, kembalikan data terbaru
  → FE: Tutup modal, perbarui data baris di tabel secara lokal atau re-fetch
```

---

### Operasi 4 — Hapus Kategori DFIR (DELETE)

```
FE: Klik ikon hapus / tombol "Hapus" pada baris kategori
    (tombol hanya aktif jika insiden = 0)
    → tampilkan konfirmasi dialog "Yakin ingin menghapus kategori ini?"
    → klik "Ya, Hapus"
  → DELETE /api/v1/cti/{id}
    BE (sebelum DELETE):
      1. SELECT COUNT(*) FROM "DFIR" WHERE id_cti = ?
         → jika count > 0: kembalikan 409 Conflict
           { "error": "Kategori tidak dapat dihapus karena masih memiliki insiden DFIR" }
      2. Jika count = 0:
         DELETE FROM "CTI" WHERE id = ?
    DB: Hapus baris CTI secara permanen (hard delete)
  → FE: Jika 409 → tampilkan pesan error di toast/alert
        Jika 200 → tutup dialog, hapus baris dari tabel secara lokal atau re-fetch
```

---

### Operasi 5 — Filter / Pencarian (READ dengan filter)

```
FE: Pengguna mengetik di kotak pencarian atau memilih filter klasifikasi
  → GET /api/v1/cti?search={keyword}&severity={kode_saverity}
    BE: SELECT ... FROM "CTI" LEFT JOIN "DFIR" ...
        WHERE (CTI.judul ILIKE '%keyword%' OR CTI.deskripsi ILIKE '%keyword%')
          AND (CTI.kode_saverity = ? -- jika filter severity diisi)
        GROUP BY CTI.id
    DB: Kembalikan subset baris yang cocok
  → FE: Perbarui tabel dengan hasil filter
```

---

## 5. Ringkasan Endpoint API

Semua endpoint berada di bawah prefix `/api/v1/cti`, **bukan** `/api/v1/master/kategori-dfir`, karena fitur ini dipetakan langsung ke entitas `CTI` yang sudah ada di backend.

| Method | Endpoint | Aksi BE | Tabel Terdampak |
|--------|----------|---------|-----------------|
| GET | `/api/v1/cti/enums` | Kembalikan enum `klasifikasi` dan `referensi_standar` | — |
| GET | `/api/v1/cti` | SELECT semua CTI + COUNT DFIR per CTI (paginated) | `CTI`, `DFIR` |
| GET | `/api/v1/cti?search=&klasifikasi=&is_active=` | SELECT dengan filter keyword, severity, dan status | `CTI`, `DFIR` |
| GET | `/api/v1/cti/{id}` | SELECT satu CTI by id + COUNT DFIR | `CTI`, `DFIR` |
| POST | `/api/v1/cti` | INSERT baris baru ke CTI (kode auto-generate) | `CTI` |
| PUT | `/api/v1/cti/{id}` | UPDATE baris CTI by id | `CTI` |
| PATCH | `/api/v1/cti/{id}/status` | Toggle `is_active` | `CTI` |
| DELETE | `/api/v1/cti/{id}` | Validasi COUNT DFIR, lalu soft delete (`is_active=false`) | `CTI`, `DFIR` (read only) |

> **Catatan:** Endpoint `GET /api/v1/cti` perlu **dimodifikasi** (jika sebelumnya sudah ada) agar selalu menyertakan field `insiden_count` dari hasil agregasi JOIN ke tabel `DFIR`. Jika endpoint belum ada, perlu di-scaffold baru sesuai desain di atas.

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Cards (Ringkasan Statistik)

| Card | Cara Hitung | Sumber Data |
|------|-------------|-------------|
| **Total Kategori** | `CTI.length` (total baris) | Response GET `/api/v1/cti` |
| **Severity High** | `CTI.filter(k => k.kode_saverity === 'High').length` | Client-side dari data yang sudah di-fetch |
| **Severity Medium** | `CTI.filter(k => k.kode_saverity === 'Medium').length` | Client-side dari data yang sudah di-fetch |
| **Total Insiden** | `SUM(insiden_count)` dari semua baris | Dihitung dari field `insiden_count` di response |

### 6.2. Tabel Utama (Data Grid)

Tabel utama menampilkan daftar kategori DFIR dengan kolom-kolom berikut:

| Kolom Tampilan | Field Data | Keterangan |
|----------------|------------|-----------|
| **Kode** | `id` (disingkat) | Tampilkan 8 karakter pertama UUID, atau ikon copy |
| **Nama** | `judul` | Nama kategori ancaman |
| **Klasifikasi** | `kode_saverity` | Badge berwarna: Merah (High), Kuning (Medium), Hijau (Low) |
| **Referensi** | `deskripsi` | Teks deskripsi, potong jika terlalu panjang (tooltip full text) |
| **Insiden** | `insiden_count` | Angka, link ke halaman DFIR dengan filter kategori ini |
| **Status** | *(belum ada di DB)* | Tampilkan "-" atau kosongkan hingga kolom `is_active` tersedia |
| **Aksi** | — | Tombol Edit, Tombol Hapus (disabled jika insiden > 0) |

### 6.3. Form Modal — Tambah / Edit Kategori DFIR

Form modal yang digunakan untuk operasi CREATE dan UPDATE:

| Field Form | Kolom DB | Tipe Input | Validasi |
|------------|----------|------------|---------|
| Nama Kategori | `judul` | Text input | Wajib diisi, maks 100 karakter |
| Klasifikasi Severity | `kode_saverity` | Dropdown/Select | Wajib dipilih; opsi: `Critical`, `High`, `Medium`, `Low` |
| Deskripsi | `deskripsi` | Textarea | Opsional, maks 255 karakter |
| Referensi Standar | `referensi_standar` | Dropdown/Select | Opsional |
| Referensi Kode | `referensi_kode` | Text input | Opsional |
| Keterangan | `keterangan` | Text input | Opsional |
| Sudah Dieksploitasi? | `eksploit_table` | Checkbox/Toggle | Opsional, default `false` |

---

### Status Implementasi

| Komponen | Status | Keterangan |
|----------|--------|-----------|
| Tabel `CTI` (DB) + kolom `is_active` | ✓ Selesai | Termasuk soft delete |
| Tabel `DFIR` (DB) | ✓ Selesai | |
| Endpoint BE `/api/v1/cti` (lengkap) | ✓ Selesai | Semua CRUD + toggle status + enums |
| Route FE slug `kategori-dfir` | ✓ Selesai | |
| Form CRUD di FE | ✓ Selesai | Modal tambah/edit, dialog hapus dengan validasi insiden |

> **Status Keseluruhan: Selesai.**
