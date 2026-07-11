# Spesifikasi Fitur: Master Range Nilai Quiz

**Path URL:** `http://localhost:3000/master/range-nilai`
**Modul:** Master Data → Range Nilai
**Sumber Referensi:** FE aktif `zpic/daskam/dashboard-kamsiber-fe-nextjs/src/app/(main)/master/range-nilai/page.tsx` & `backend/models/scaffolded_models.py`

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola konfigurasi penilaian hasil Quiz Keamanan Siber. Data yang dikelola terdiri atas dua lapisan:

- **Threshold** — wadah/nama kelompok penilaian (misal: "Standar", "Advanced"), yang menentukan keseluruhan skema klasifikasi nilai.
- **Threshold Detail (Range Nilai)** — anak dari Threshold; mendefinisikan batas bawah (`min_nilai`) dan batas atas (`max_nilai`) setiap kategori kelulusan beserta warna labelnya.

Set Threshold yang telah dibuat dapat dipakai ulang oleh modul **Security Awareness Program** dan **Campaign Quiz** sebagai acuan interpretasi skor peserta. Pengelolaan dilakukan sepenuhnya melalui antarmuka CRUD berbasis modal dialog, tanpa navigasi pindah halaman.

---

## 2. Hirarki Entitas Data & Tabel Database

Sesuai dengan database terbaru, fitur ini mengelola **2 tabel utama**:

```
threshold                        <- Tabel 1: Induk (Wadah Penilaian)
  └── threshold_detail           <- Tabel 2: Anak (Batasan Nilai)

security_awareness_program       <- Tabel yang sudah ada
  └── threshold_id (FK)          <- Menunjuk ke threshold.id
```

---

### Tabel 1: `threshold`

Menyimpan satu set/skema penilaian quiz. Satu set bisa dipakai oleh banyak program atau campaign.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) UNIQUE | Identifier sekunder untuk API |
| `nama_threshold` | VARCHAR(255) | Nama set, misal "Standar", "Advanced" |
| `deskripsi` | TEXT | Penjelasan opsional mengenai set ini |
| `is_active` | BOOLEAN | Default `true` (Status aktif/nonaktif) |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `created_by` | UUID | UUID pengguna yang membuat |
| `updated_at` | TIMESTAMP | Waktu terakhir diubah |
| `updated_by` | UUID | UUID pengguna yang mengubah |

---

### Tabel 2: `threshold_detail`

Menyimpan satu segmen rentang nilai di dalam sebuah Threshold Induk.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID (PK) | Auto-generate `uuid_generate_v7()` |
| `uuid` | VARCHAR(36) UNIQUE | Identifier sekunder untuk API |
| `threshold_id` | UUID NOT NULL | FK → `threshold.id` |
| `nama_range` | VARCHAR(255) | Nama range, misal "Kurang", "Baik" |
| `min_nilai` | INTEGER | Batas nilai bawah (inklusif), ex: 0 |
| `max_nilai` | INTEGER | Batas nilai atas (inklusif), ex: 50 |
| `warna` | VARCHAR(50) | Tailwind CSS class warna, misal `bg-red-500` |
| `deskripsi` | TEXT | Deskripsi tambahan opsional |
| `is_active` | BOOLEAN | Default `true` |
| `created_at` | TIMESTAMP | Waktu pembuatan |
| `created_by` | UUID | UUID pengguna yang membuat |
| `updated_at` | TIMESTAMP | Waktu terakhir diubah |
| `updated_by` | UUID | UUID pengguna yang mengubah |

**Aturan Validasi Logical (Backend):**
- Batas bawah tidak boleh lebih besar dari batas atas (`min_nilai <= max_nilai`).
- Validasi **non-overlap** antar range dalam satu `threshold_id` wajib dilakukan di Backend.

---

## 3. Aturan Delete (Penghapusan - Soft Delete)

Sesuai aturan bisnis, **semua penghapusan data bersifat Soft Delete**. Tidak ada data yang benar-benar dihapus secara fisik (Hard Delete) dari database.

| Entitas yang Dihapus | Kondisi Boleh Hapus | Implementasi |
|---|---|---|
| `threshold` | Selalu bisa dihapus, namun tidak akan hilang secara fisik. | Melakukan Soft Delete dengan cara `UPDATE threshold SET is_active = false`. Semua `threshold_detail` di bawahnya juga otomatis di-Soft Delete (`is_active = false`). |
| `threshold_detail` | Selalu dapat dihapus secara individual | Melakukan Soft Delete `UPDATE threshold_detail SET is_active = false`. |

**Peringatan di UI (konfirmasi hapus Threshold):**
- Modal konfirmasi menampilkan teks: *"Apakah Anda yakin? Data ini beserta range di dalamnya akan di non-aktifkan dan tidak ditampilkan lagi."*
- Jika Threshold ini sedang digunakan oleh tabel lain (contoh: program kamsiber), maka relasi data di masa lalu tetap terjaga karena data hanya berubah status menjadi `is_active = false`.

---

## 4. Alur Lengkap FE → BE → DB

### Operasi A — Buat Threshold Baru (Induk)

```
FE: Klik tombol "Tambah Set Threshold" (pojok kanan atas)
    → Modal dialog terbuka (FormFlex, title: "Tambah Set Threshold")
    → Pengguna isi: Nama Threshold (wajib), Deskripsi (opsional)
    → Klik "Simpan"

    → POST /api/v1/master/range-nilai/threshold
      Body: { nama_threshold, deskripsi }
      BE:
        1. Validasi: nama tidak boleh kosong.
        2. INSERT INTO threshold (uuid, nama_threshold, deskripsi, is_active, created_by, created_at)
      DB: Simpan baris baru, kembalikan id & uuid
    → FE: kartu set baru muncul di grid, dalam keadaan kosong (belum ada range)
```

### Operasi B — Edit Threshold

```
FE: Klik tombol PenLine (ikon edit) di header kartu set
    → selectedSetId = set.id
    → Form terisi nilai saat ini (nama, deskripsi)
    → Pengguna ubah nilai → Klik "Simpan"

    → PUT /api/v1/master/range-nilai/threshold/{id}
      Body: { nama_threshold, deskripsi }
      BE:
        1. UPDATE threshold SET nama_threshold=?, deskripsi=?, updated_at=NOW(), updated_by=? WHERE id = ?
      DB: Baris diperbarui
    → FE: Nama dan deskripsi di kartu diperbarui langsung
```

### Operasi C — Hapus Threshold

```
FE: Klik tombol Trash2 (ikon hapus) di header kartu set
    → Pengguna klik "Ya, Hapus"

    → DELETE /api/v1/master/range-nilai/threshold/{id}
      BE:
        1. Cek keberadaan data.
        2. Lakukan Soft Delete pada detail: UPDATE threshold_detail SET is_active = false WHERE threshold_id = ?
        3. Lakukan Soft Delete pada induk: UPDATE threshold SET is_active = false, updated_at=NOW(), updated_by=? WHERE id = ?
      DB: Status is_active berubah menjadi false
    → FE: Kartu set menghilang dari grid
```

### Operasi D — Tambah Threshold Detail (Range Nilai)

```
FE: Klik tombol "+ Tambah Range" di footer kartu
    → selectedSetId = set.id, selectedRangeId = null
    → Form: Nama Range, Min Nilai, Max Nilai, Warna Label, Deskripsi
    → Klik "Simpan"

    → POST /api/v1/master/range-nilai/threshold/{id}/detail
      Body: { nama_range, min_nilai, max_nilai, warna, deskripsi }
      BE:
        1. Validasi: min_nilai <= max_nilai.
        2. Validasi non-overlap: query semua detail dalam threshold_id ini, pastikan [min_baru, max_baru] tidak beririsan dengan existing.
        3. Kondisi overlap: NOT (max_baru < min_lama OR min_baru > max_lama)
        4. INSERT INTO threshold_detail (...)
      DB: Simpan baris baru
    → FE: Baris range baru muncul di tabel dalam kartu
```

### Operasi E — Edit & Hapus Threshold Detail

- **Edit (PUT):** Kirim payload baru ke `/api/v1/master/range-nilai/threshold/{id}/detail/{detailId}`. Validasi overlap tetap jalan dengan mengecualikan ID yang sedang diedit (pastikan abaikan data yang `is_active = false`).
- **Delete (DELETE):** Hapus menggunakan Soft Delete: `UPDATE threshold_detail SET is_active = false, updated_at=NOW(), updated_by=? WHERE id = ?`.

### Operasi F — Fetch Semua Data

```
FE: Halaman pertama kali dimuat
    → GET /api/v1/master/range-nilai/threshold?include_detail=true
      BE:
        SELECT t.*, td.* FROM threshold t 
        LEFT JOIN threshold_detail td ON td.threshold_id = t.id AND td.is_active = true
        WHERE t.is_active = true
        ORDER BY t.created_at DESC, td.min_nilai ASC
      DB: Kembalikan data bertingkat (hanya yang aktif)
    → FE: Render grid kartu dan tabel detail di dalamnya.
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel Terlibat |
|---|---|---|---|
| GET | `/api/v1/master/range-nilai/threshold` | Ambil semua threshold (+ join detail jika filter ada) | `threshold`, `threshold_detail` |
| POST | `/api/v1/master/range-nilai/threshold` | Buat threshold induk baru | `threshold` |
| PUT | `/api/v1/master/range-nilai/threshold/{id}` | Edit nama & deskripsi threshold | `threshold` |
| DELETE | `/api/v1/master/range-nilai/threshold/{id}` | Soft Delete threshold & detailnya | `threshold`, `threshold_detail` |
| POST | `/api/v1/master/range-nilai/threshold/{id}/detail` | Buat range baru (Validasi overlap) | `threshold_detail` |
| PUT | `/api/v1/master/range-nilai/threshold/{id}/detail/{detailId}` | Edit range (Validasi overlap) | `threshold_detail` |
| DELETE | `/api/v1/master/range-nilai/threshold/{id}/detail/{detailId}` | Soft Delete satu rentang nilai | `threshold_detail` |

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Halaman
- **Ikon:** `SlidersHorizontal`
- **Judul:** `Master Range Nilai Quiz`
- **Subjudul:** `Kelola set threshold dan skala penilaian untuk hasil quiz awareness.`
- **Tombol Aksi:** `Tambah Set Threshold` — membuka Form modal dialog induk.

### 6.2. Grid Kartu Threshold (Card Grid)
- Ditampilkan dalam format Grid (`grid-cols-1 lg:grid-cols-2`).
- **Header Kartu:** Nama threshold (bold), ikon Edit, ikon Delete.
- **Body Kartu:** Berisi sub-tabel `Threshold Detail`.
  - Kolom: Nama Range, Min, Max, Warna (bentuk kotak kecil/pill css), Aksi.
  - Urutkan dari nilai terkecil ke terbesar secara visual.
- **Footer Kartu:** Link button `+ Tambah Range Nilai` untuk memanggil modal form anak.

### 6.3. Dialog Form Flex (Modal Utama)
- **Modal Induk:** Field `Nama Threshold` (text), `Deskripsi` (textarea).
- **Modal Anak:** Field `Nama Range` (text), `Min Nilai` (number), `Max Nilai` (number), `Warna Label` (Select dropdown khusus Tailwind misal Merah/Kuning/Hijau).

---

## 7. Status Kesiapan (Gap Analysis)
1. **Database:** Tabel `threshold` dan `threshold_detail` **SUDAH ADA** di skema DB (`scaffolded_models.py`).
2. **Backend API:** Seluruh 7 endpoint CRUD di atas **BELUM ADA**, wajib dibuat di FastAPI. Logic pencegahan rentang yang bertabrakan (*Overlap Constraint*) juga harus dikoding di Backend.
3. **Frontend:** Sudah ada referensi lama, namun endpoint pemanggilan API wajib disesuaikan menjadi `/api/v1/master/range-nilai/...` dan struktur JSON responsenya.

> **Status Keseluruhan:** ✅ **Siap Implementasi (Ready for Development)**. Kendala skema database (tabel kosong) sudah diselesaikan. Tim Backend dapat langsung mulai membuat struktur API/Router-nya, dan Tim Frontend dapat memulai integrasinya.
