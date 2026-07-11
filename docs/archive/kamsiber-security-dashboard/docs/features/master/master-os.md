# Spesifikasi Fitur: Master Operasi Sistem (OS)

**Path URL:** `http://localhost:3000/master/os`  
**Modul:** Master Data  
**Sumber Referensi:** Implementasi BE `api/v1/master/os.py`, model `OperatingSystem` di `scaffolded_models.py`

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola daftar Sistem Operasi (OS) yang digunakan di lingkungan infrastruktur Kamsiber. Setiap entri menyimpan nama OS, versi, dan tanggal End-of-Support (EOS). FE menggunakan tanggal EOS untuk memberikan peringatan dini kepada admin sebelum OS mencapai masa akhir dukungan dari vendor.

---

## 2. Entitas Data & Tabel Database

Fitur ini menggunakan **1 tabel** tunggal: `operating_system`.

### Tabel: `operating_system`

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate |
| `uuid` | VARCHAR(36) | Identifier sekunder, unique |
| `nama_os` | VARCHAR | Nama OS, misal `"Windows Server"`, `"Ubuntu"` |
| `versi` | VARCHAR | Versi OS, misal `"2022"`, `"22.04 LTS"` |
| `tanggal_eos` | DATE | Tanggal End-of-Support dari vendor. Nullable |
| `deskripsi` | TEXT | Keterangan tambahan. Nullable |
| `is_active` | BOOLEAN | Status aktif. Default `true` |
| `created_at` | TIMESTAMP | Waktu buat |
| `updated_at` | TIMESTAMP | Waktu update terakhir. Nullable |

> **Tidak ada kolom `kode`** — berbeda dengan modul Perangkat, OS tidak memiliki kode unik.

> **Status "End of Life"** dihitung di FE: jika `is_active = true` dan `tanggal_eos < today`, FE menampilkan badge "End of Life" pada baris tersebut.

---

## 3. Aturan Delete

| Aksi | Implementasi |
|------|-------------|
| DELETE `/{os_id}` | Soft delete — set `is_active = false`. Data tidak hilang dari DB |

---

## 4. Alur Lengkap FE → BE → DB

### Operasi 1 — Memuat Daftar OS (READ / List)

```
FE: Halaman /master/os dibuka
  → GET /api/v1/master/os?page=1&size=10&filter_status=&filter_os=&search=&sort_by=nama_os&sort_order=asc
    BE: SELECT * FROM operating_system
        WHERE (filter is_active jika filter_status diisi)
          AND (nama_os = ? jika filter_os diisi)
          AND (nama_os ILIKE '%search%' OR versi ILIKE '%search%' jika search diisi)
        ORDER BY <sort_by> <sort_order>
        LIMIT size OFFSET (page-1)*size
    DB: Kembalikan array OS + metadata pagination
  → FE: Render tabel; hitung status EOS client-side dari tanggal_eos
```

### Operasi 2 — Tambah OS Baru (CREATE)

```
FE: Klik "Tambah OS" → isi form modal: nama_os, versi, tanggal_eos, deskripsi, is_active
    → Klik "Simpan"
  → POST /api/v1/master/os
    Body: { nama_os, versi, tanggal_eos?, deskripsi?, is_active? }
    BE: INSERT INTO operating_system (uuid, nama_os, versi, tanggal_eos, deskripsi, is_active, created_at)
    DB: Simpan baris baru
  → FE: Tutup modal, reload tabel, tampilkan notifikasi "OS berhasil ditambahkan"
```

### Operasi 3 — Edit OS (UPDATE)

```
FE: Klik ikon Edit → form terisi data OS terpilih → ubah field → Klik "Simpan"
  → PUT /api/v1/master/os/{os_id}
    Body: { nama_os, versi, tanggal_eos?, deskripsi?, is_active? }
    BE: UPDATE operating_system SET ... WHERE id = os_id
    DB: Perbarui baris, updated_at = now()
  → FE: Tutup modal, perbarui baris di tabel
```

### Operasi 4 — Hapus OS (DELETE / Soft)

```
FE: Klik ikon Hapus → dialog konfirmasi
  → DELETE /api/v1/master/os/{os_id}
    BE: UPDATE operating_system SET is_active = false, updated_at = now()
        WHERE id = os_id
    DB: Tandai record sebagai nonaktif (tidak dihapus permanen)
  → FE: Hapus baris dari tampilan tabel
```

### Operasi 5 — EOS Reminder Card

```
FE: Di bagian atas halaman, render "Reminder Card" berisi daftar OS
    yang tanggal_eos-nya dalam 365 hari ke depan dari hari ini.
    Data diambil dari hasil GET list (client-side filter), bukan endpoint terpisah.
  → FE: Tampilkan kartu peringatan per OS dengan countdown hari tersisa
```

---

## 5. Ringkasan Endpoint API

Semua endpoint berada di bawah prefix `/api/v1/master/os`.

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/master/os` | SELECT list dengan filter + pagination | `operating_system` |
| GET | `/api/v1/master/os/dropdown` | SELECT OS aktif, format `{id, label}` untuk dropdown di modul lain | `operating_system` |
| GET | `/api/v1/master/os/unique-names` | SELECT nama OS unik (untuk filter `filter_os`) | `operating_system` |
| POST | `/api/v1/master/os` | INSERT OS baru | `operating_system` |
| PUT | `/api/v1/master/os/{os_id}` | UPDATE semua field OS | `operating_system` |
| DELETE | `/api/v1/master/os/{os_id}` | Soft delete (`is_active = false`) | `operating_system` |

> **Tidak ada endpoint PATCH /status** — toggle status dilakukan via PUT dengan field `is_active` di body.

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. EOS Reminder Card

Kartu peringatan di atas tabel, menampilkan OS dengan `tanggal_eos` dalam 365 hari ke depan:

| Kolom Card | Sumber Data |
|-----------|-------------|
| Nama OS | `nama_os + " " + versi` |
| Tanggal EOS | `tanggal_eos` (format tampilan) |
| Sisa hari | Dihitung client-side: `tanggal_eos - today` |

### 6.2. Toolbar & Filter

| Komponen | Keterangan |
|----------|-----------|
| Input pencarian | Filter `nama_os` atau `versi` via `search` |
| Dropdown filter OS | Diisi dari `GET /unique-names`; nilai dikirim via `filter_os` |
| Dropdown filter Status | `Semua` / `Aktif` / `Nonaktif` via `filter_status` |
| Tombol "Tambah OS" | Membuka modal form |

### 6.3. Tabel Data OS

| Kolom Tampil | Sumber | Keterangan |
|---|---|---|
| Nama OS | `nama_os` | |
| Versi | `versi` | |
| Tanggal EOS | `tanggal_eos` | Tampilkan "-" jika null |
| Status | `is_active` + `tanggal_eos` | "Aktif", "Nonaktif", atau "End of Life" (FE computed) |
| Aksi | — | Ikon Edit dan Hapus |

### 6.4. Modal Form Tambah / Edit

| Field | Tipe Input | Validasi |
|-------|-----------|---------|
| Nama OS | Text input | Wajib diisi |
| Versi | Text input | Wajib diisi |
| Tanggal EOS | Date picker | Opsional |
| Deskripsi | Textarea | Opsional |
| Status | Toggle | Default: Aktif |

---

## 7. Status Implementasi

| Komponen | Status | Catatan |
|----------|--------|---------|
| Tabel `operating_system` (DB) | ✓ Selesai | |
| Endpoint BE (GET list, dropdown, unique-names, POST, PUT, DELETE) | ✓ Selesai | Prefix: `/api/v1/master/os` |
| Frontend | ✓ Selesai | Terhubung ke API |

**Catatan implementasi:**
- Delete diimplementasikan sebagai **soft delete** (`is_active = false`).
- Status "End of Life" dihitung di FE, bukan disimpan di DB.
- EOS Reminder Card menggunakan data dari GET list (filter client-side), bukan endpoint terpisah.

> **Status keseluruhan: Selesai.**
