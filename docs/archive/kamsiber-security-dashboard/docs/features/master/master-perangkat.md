# Spesifikasi Fitur: Master Perangkat

**Path URL:** `http://localhost:3000/master/perangkat`  
**Modul:** Master Data  
**Sumber Referensi:** Desain lama `zpic/daskam` (`MasterPerangkatPage`), `scaffolded_models.py`

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** untuk mengelola data referensi/kamus (*lookup data*) yang digunakan oleh seluruh modul aset fisik (Teknologi Perangkat). Data di halaman ini bukan aset fisik itu sendiri, melainkan **definisi standar** yang akan dipilih saat mencatat aset nyata.

Terdapat empat jenis data referensi yang dikelola:
1. **Jenis Perangkat** — kategori/klasifikasi perangkat (misal: Server, Firewall, Switch)
2. **Merk Perangkat** — nama produsen/vendor (misal: Cisco, HPE, Dell)
3. **Model Perangkat** — model spesifik suatu merk dengan jenis tertentu (misal: Cisco ASA 5505)
4. **Status Perangkat** — kondisi operasional aset (misal: Aktif, Tidak Aktif, Maintenance) beserta kode warna tampilannya

---

## 2. Hirarki Entitas Data & Tabel Database

Fitur ini melibatkan **4 tabel** yang berelasi sebagai berikut:

```
jenis_perangkat                    ← Tabel 1: Klasifikasi/jenis perangkat
  └── model_perangkat              ← Tabel 3: Model spesifik (FK ke jenis & merk)

merk_perangkat                     ← Tabel 2: Produsen/vendor perangkat
  └── model_perangkat              ← Tabel 3: Model spesifik (FK ke jenis & merk)

status_perangkat                   ← Tabel 4: Status operasional aset (berdiri sendiri)
```

> **Catatan:** `model_perangkat` memiliki dua FK sekaligus — ke `jenis_perangkat` dan `merk_perangkat`. Artinya satu model selalu terikat pada satu jenis dan satu merk tertentu.

---

### Tabel 1: `jenis_perangkat`

Tabel referensi untuk klasifikasi/kategori perangkat.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate, primary key |
| `uuid` | VARCHAR(36) | UUID alternatif, unik |
| `nama_jenis` | VARCHAR(255) | Nama jenis perangkat, misal "Server", "Firewall" |
| `is_active` | BOOLEAN | Status aktif/nonaktif data referensi |
| `created_at` | TIMESTAMP | Waktu pembuatan record |
| `deskripsi` | TEXT | Deskripsi jenis perangkat (nullable) |
| `created_by` | UUID | UUID pengguna pembuat (nullable) |
| `updated_at` | TIMESTAMP | Waktu pembaruan terakhir (nullable) |
| `updated_by` | UUID | UUID pengguna yang memperbarui (nullable) |

**Constraints:**
- PrimaryKey: `id` (`jenis_perangkat_pkey`)
- Unique: `uuid` (`jenis_perangkat_uuid_key`)

**Relasi keluar:**
- Satu `jenis_perangkat` dapat memiliki banyak `model_perangkat`

---

### Tabel 2: `merk_perangkat`

Tabel referensi untuk nama produsen/vendor perangkat.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate, primary key |
| `uuid` | VARCHAR(36) | UUID alternatif, unik |
| `nama_merk` | VARCHAR(255) | Nama merk/vendor, misal "Cisco", "HPE", "Dell" |
| `is_active` | BOOLEAN | Status aktif/nonaktif data referensi |
| `created_at` | TIMESTAMP | Waktu pembuatan record |
| `deskripsi` | TEXT | Deskripsi merk (nullable) |
| `created_by` | UUID | UUID pengguna pembuat (nullable) |
| `updated_at` | TIMESTAMP | Waktu pembaruan terakhir (nullable) |
| `updated_by` | UUID | UUID pengguna yang memperbarui (nullable) |

**Constraints:**
- PrimaryKey: `id` (`merk_perangkat_pkey`)
- Unique: `uuid` (`merk_perangkat_uuid_key`)

**Relasi keluar:**
- Satu `merk_perangkat` dapat memiliki banyak `model_perangkat`
- Satu `merk_perangkat` dapat digunakan oleh banyak `bare_metal` (modul aset fisik, luar scope fitur ini)

---

### Tabel 3: `model_perangkat`

Tabel referensi untuk model spesifik perangkat. Selalu terikat ke satu jenis dan satu merk.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate, primary key |
| `uuid` | VARCHAR(36) | UUID alternatif, unik |
| `jenis_perangkat_id` | UUID (FK → `jenis_perangkat.id`) | Jenis perangkat model ini |
| `merk_perangkat_id` | UUID (FK → `merk_perangkat.id`) | Merk/vendor model ini |
| `nama_model` | VARCHAR(255) | Nama model, misal "Cisco ASA 5505", "HPE ProLiant DL360" |
| `is_active` | BOOLEAN | Status aktif/nonaktif data referensi |
| `created_at` | TIMESTAMP | Waktu pembuatan record |
| `deskripsi` | TEXT | Deskripsi model (nullable) |
| `created_by` | UUID | UUID pengguna pembuat (nullable) |
| `updated_at` | TIMESTAMP | Waktu pembaruan terakhir (nullable) |
| `updated_by` | UUID | UUID pengguna yang memperbarui (nullable) |

**Constraints:**
- PrimaryKey: `id` (`model_perangkat_pkey`)
- Unique: `uuid` (`model_perangkat_uuid_key`)
- Index: `model_perangkat_jenis_perangkat_id_idx` pada `jenis_perangkat_id`
- Index: `model_perangkat_merk_perangkat_id_idx` pada `merk_perangkat_id`

**Foreign Keys:**
- `jenis_perangkat_id` → `jenis_perangkat.id` (`model_perangkat_jenis_perangkat_id_fkey`)
- `merk_perangkat_id` → `merk_perangkat.id` (`model_perangkat_merk_perangkat_id_fkey`)

**Relasi keluar:**
- Satu `model_perangkat` dapat digunakan oleh banyak `perangkat_keamanan` (modul aset fisik, luar scope fitur ini)

---

### Tabel 4: `status_perangkat`

Tabel referensi untuk status operasional aset. Berdiri sendiri tanpa FK ke tabel master perangkat lainnya, namun digunakan oleh banyak modul aset fisik.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| `id` | UUID (PK) | Auto-generate, primary key |
| `uuid` | VARCHAR(36) | UUID alternatif, unik |
| `nama_status` | VARCHAR(255) | Nama status, misal "Aktif", "Maintenance", "Pensiun" |
| `is_active` | BOOLEAN | Status aktif/nonaktif data referensi ini sendiri |
| `created_at` | TIMESTAMP | Waktu pembuatan record |
| `deskripsi` | TEXT | Deskripsi status (nullable) |
| `created_by` | UUID | UUID pengguna pembuat (nullable) |
| `updated_at` | TIMESTAMP | Waktu pembaruan terakhir (nullable) |
| `updated_by` | UUID | UUID pengguna yang memperbarui (nullable) |

**Constraints:**
- PrimaryKey: `id` (`status_perangkat_pkey`)
- Unique: `uuid` (`status_perangkat_uuid_key`)

> **Catatan Gap UI:** Desain lama menampilkan dua kolom warna (`warna_background`, `warna_text`) untuk badge status. Kolom-kolom ini **tidak ada** di skema DB saat ini. Lihat bagian 7 untuk detail kekurangan dan rekomendasi.

**Relasi keluar (semua luar scope fitur ini):**
- Digunakan oleh: `bare_metal`, `perangkat_keamanan`, `server`, `aplikasi_environment`

---

## 3. Aturan Delete (Penghapusan)

Semua tabel master perangkat menggunakan **soft delete via `is_active`**. Operasi hapus dilakukan dengan set `is_active = False` — data tidak dihapus fisik dari database. Data dengan `is_active = false` tidak muncul di daftar maupun dropdown.

| Tabel | Validasi Sebelum Soft Delete | Jika Ada Data Anak Aktif |
|---|---|---|
| `jenis_perangkat` | Cek `model_perangkat` aktif yang merujuk id ini | Tolak 409 Conflict |
| `merk_perangkat` | Cek `model_perangkat` aktif yang merujuk id ini | Tolak 409 Conflict |
| `model_perangkat` | Tidak ada cek (soft delete langsung) | — |
| `status_perangkat` | Tidak ada cek (soft delete langsung) | — |

Pola implementasi backend:
```python
item.is_active = False
db.commit()
```

---

## 4. Alur Lengkap FE → BE → DB

### Tab 1 — Jenis Perangkat

#### CREATE — Tambah Jenis Perangkat Baru

```
FE: Klik tombol "Tambah" → isi form (nama_jenis, deskripsi) → Submit
  → POST /api/v1/master/perangkat/jenis
    BE: Validasi nama_jenis tidak kosong
        INSERT INTO jenis_perangkat (id, uuid, nama_jenis, deskripsi, is_active=true, created_at, created_by)
    DB: Simpan, kembalikan id + uuid baru
  → FE: Baris baru muncul di tabel, form ditutup/direset
```

#### READ — Tampil Daftar Jenis Perangkat

```
FE: Halaman dibuka / tab "Jenis Perangkat" dipilih
  → GET /api/v1/master/perangkat/jenis?page=1&limit=10
    BE: SELECT id, uuid, nama_jenis, deskripsi, is_active, created_at FROM jenis_perangkat
        WHERE is_active = true   ← (opsional: bisa tampilkan semua lalu filter di FE)
        ORDER BY created_at DESC
        LIMIT 10 OFFSET 0
    DB: Kembalikan list
  → FE: Render tabel dengan kolom: Nama Jenis, Deskripsi, Status, Aksi
```

#### UPDATE — Edit Jenis Perangkat

```
FE: Klik ikon "Edit" pada baris → form terisi data existing → ubah → Submit
  → PUT /api/v1/master/perangkat/jenis/{uuid}
    Body: { nama_jenis, deskripsi, is_active }
    BE: Validasi uuid ada di DB
        UPDATE jenis_perangkat
        SET nama_jenis=?, deskripsi=?, is_active=?, updated_at=NOW(), updated_by=?
        WHERE id = (SELECT id FROM jenis_perangkat WHERE uuid = ?)
    DB: Simpan perubahan
  → FE: Baris diperbarui di tabel, form ditutup
```

#### DELETE — Hapus Jenis Perangkat

```
FE: Klik ikon "Hapus" → konfirmasi dialog → Konfirmasi
  → DELETE /api/v1/master/perangkat/jenis/{uuid}
    BE: Cek apakah ada model_perangkat dengan jenis_perangkat_id = id ini
        Jika ada → return 409 Conflict: "Jenis perangkat masih digunakan oleh X model"
        Jika tidak ada → DELETE FROM jenis_perangkat WHERE uuid = ?
    DB: Hard delete permanen
  → FE: Baris dihapus dari tabel
        Jika 409 → tampilkan pesan error, tawarkan "Nonaktifkan saja"
```

---

### Tab 2 — Merk Perangkat

#### CREATE — Tambah Merk Perangkat Baru

```
FE: Klik tombol "Tambah" → isi form (nama_merk, deskripsi) → Submit
  → POST /api/v1/master/perangkat/merk
    BE: Validasi nama_merk tidak kosong
        INSERT INTO merk_perangkat (id, uuid, nama_merk, deskripsi, is_active=true, created_at, created_by)
    DB: Simpan, kembalikan id + uuid baru
  → FE: Baris baru muncul di tabel, form ditutup/direset
```

#### READ — Tampil Daftar Merk Perangkat

```
FE: Tab "Merk Perangkat" dipilih
  → GET /api/v1/master/perangkat/merk?page=1&limit=10
    BE: SELECT id, uuid, nama_merk, deskripsi, is_active, created_at FROM merk_perangkat
        ORDER BY nama_merk ASC
        LIMIT 10 OFFSET 0
    DB: Kembalikan list
  → FE: Render tabel dengan kolom: Nama Merk, Deskripsi, Status, Aksi
```

#### UPDATE — Edit Merk Perangkat

```
FE: Klik ikon "Edit" → form terisi data existing → ubah → Submit
  → PUT /api/v1/master/perangkat/merk/{uuid}
    Body: { nama_merk, deskripsi, is_active }
    BE: Validasi uuid ada di DB
        UPDATE merk_perangkat
        SET nama_merk=?, deskripsi=?, is_active=?, updated_at=NOW(), updated_by=?
        WHERE id = (SELECT id FROM merk_perangkat WHERE uuid = ?)
    DB: Simpan perubahan
  → FE: Baris diperbarui di tabel, form ditutup
```

#### DELETE — Hapus Merk Perangkat

```
FE: Klik ikon "Hapus" → konfirmasi dialog → Konfirmasi
  → DELETE /api/v1/master/perangkat/merk/{uuid}
    BE: Cek apakah ada model_perangkat dengan merk_perangkat_id = id ini
        Atau bare_metal dengan merk_perangkat_id = id ini
        Jika ada → return 409 Conflict: "Merk masih digunakan"
        Jika tidak ada → DELETE FROM merk_perangkat WHERE uuid = ?
    DB: Hard delete permanen
  → FE: Baris dihapus dari tabel
        Jika 409 → tampilkan pesan error, tawarkan "Nonaktifkan saja"
```

---

### Tab 3 — Model Perangkat

#### CREATE — Tambah Model Perangkat Baru

```
FE: Klik tombol "Tambah" → isi form:
      - Dropdown "Jenis Perangkat" (dari GET /jenis, filter is_active=true)
      - Dropdown "Merk Perangkat" (dari GET /merk, filter is_active=true)
      - Input nama_model
      - Textarea deskripsi (opsional)
    → Submit
  → POST /api/v1/master/perangkat/model
    Body: { jenis_perangkat_id, merk_perangkat_id, nama_model, deskripsi }
    BE: Validasi jenis_perangkat_id dan merk_perangkat_id ada di DB dan is_active=true
        INSERT INTO model_perangkat
        (id, uuid, jenis_perangkat_id, merk_perangkat_id, nama_model, deskripsi, is_active=true, created_at, created_by)
    DB: Simpan, kembalikan id + uuid baru
  → FE: Baris baru muncul di tabel, form ditutup/direset
```

#### READ — Tampil Daftar Model Perangkat

```
FE: Tab "Model Perangkat" dipilih
  → GET /api/v1/master/perangkat/model?page=1&limit=10
    BE: SELECT mp.id, mp.uuid, mp.nama_model, mp.deskripsi, mp.is_active,
               jp.nama_jenis, mk.nama_merk
        FROM model_perangkat mp
        JOIN jenis_perangkat jp ON mp.jenis_perangkat_id = jp.id
        JOIN merk_perangkat mk ON mp.merk_perangkat_id = mk.id
        ORDER BY mk.nama_merk ASC, mp.nama_model ASC
        LIMIT 10 OFFSET 0
    DB: Kembalikan list beserta nama jenis dan merk
  → FE: Render tabel: Nama Model, Jenis, Merk, Deskripsi, Status, Aksi
```

#### UPDATE — Edit Model Perangkat

```
FE: Klik ikon "Edit" → form terisi data existing (termasuk dropdown jenis & merk) → ubah → Submit
  → PUT /api/v1/master/perangkat/model/{uuid}
    Body: { jenis_perangkat_id, merk_perangkat_id, nama_model, deskripsi, is_active }
    BE: Validasi uuid ada, validasi FK jenis & merk masih ada di DB
        UPDATE model_perangkat
        SET jenis_perangkat_id=?, merk_perangkat_id=?, nama_model=?,
            deskripsi=?, is_active=?, updated_at=NOW(), updated_by=?
        WHERE id = (SELECT id FROM model_perangkat WHERE uuid = ?)
    DB: Simpan perubahan
  → FE: Baris diperbarui di tabel, form ditutup
```

#### DELETE — Hapus Model Perangkat

```
FE: Klik ikon "Hapus" → konfirmasi dialog → Konfirmasi
  → DELETE /api/v1/master/perangkat/model/{uuid}
    BE: Cek apakah ada perangkat_keamanan dengan model_perangkat_id = id ini
        Jika ada → return 409 Conflict: "Model masih digunakan oleh X aset"
        Jika tidak ada → DELETE FROM model_perangkat WHERE uuid = ?
    DB: Hard delete permanen
  → FE: Baris dihapus dari tabel
        Jika 409 → tampilkan pesan error, tawarkan "Nonaktifkan saja"
```

---

### Tab 4 — Status Perangkat

#### CREATE — Tambah Status Perangkat Baru

```
FE: Klik tombol "Tambah" → isi form:
      - Input nama_status
      - Textarea deskripsi (opsional)
    → Submit
  → POST /api/v1/master/perangkat/status
    Body: { nama_status, deskripsi }
    BE: Validasi nama_status tidak kosong
        INSERT INTO status_perangkat
        (id, uuid, nama_status, deskripsi, is_active=true, created_at, created_by)
    DB: Simpan, kembalikan id + uuid baru
  → FE: Baris baru muncul di tabel, form ditutup/direset
```

#### READ — Tampil Daftar Status Perangkat

```
FE: Tab "Status Perangkat" dipilih
  → GET /api/v1/master/perangkat/status?page=1&limit=10
    BE: SELECT id, uuid, nama_status, deskripsi, is_active, created_at
        FROM status_perangkat
        ORDER BY nama_status ASC
        LIMIT 10 OFFSET 0
    DB: Kembalikan list
  → FE: Render tabel: Nama Status, Deskripsi, Status (is_active), Aksi
```

#### UPDATE — Edit Status Perangkat

```
FE: Klik ikon "Edit" → form terisi data existing → ubah → Submit
  → PUT /api/v1/master/perangkat/status/{uuid}
    Body: { nama_status, deskripsi, is_active }
    BE: Validasi uuid ada di DB
        UPDATE status_perangkat
        SET nama_status=?, deskripsi=?, is_active=?, updated_at=NOW(), updated_by=?
        WHERE id = (SELECT id FROM status_perangkat WHERE uuid = ?)
    DB: Simpan perubahan
  → FE: Baris diperbarui di tabel, form ditutup
```

#### DELETE — Hapus Status Perangkat

```
FE: Klik ikon "Hapus" → konfirmasi dialog → Konfirmasi
  → DELETE /api/v1/master/perangkat/status/{uuid}
    BE: Cek apakah ada data di bare_metal, perangkat_keamanan, server,
        atau aplikasi_environment dengan status_perangkat_id = id ini
        Jika ada → return 409 Conflict: "Status masih digunakan oleh X aset"
        Jika tidak ada → DELETE FROM status_perangkat WHERE uuid = ?
    DB: Hard delete permanen
  → FE: Baris dihapus dari tabel
        Jika 409 → tampilkan pesan error, tawarkan "Nonaktifkan saja"
```

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel |
|--------|----------|---------|-------|
| GET | `/api/v1/master/perangkat/jenis` | SELECT semua jenis (paginated) | `jenis_perangkat` |
| POST | `/api/v1/master/perangkat/jenis` | INSERT jenis baru | `jenis_perangkat` |
| PUT | `/api/v1/master/perangkat/jenis/{uuid}` | UPDATE jenis | `jenis_perangkat` |
| DELETE | `/api/v1/master/perangkat/jenis/{uuid}` | DELETE jika tidak ada anak | `jenis_perangkat` |
| GET | `/api/v1/master/perangkat/merk` | SELECT semua merk (paginated) | `merk_perangkat` |
| POST | `/api/v1/master/perangkat/merk` | INSERT merk baru | `merk_perangkat` |
| PUT | `/api/v1/master/perangkat/merk/{uuid}` | UPDATE merk | `merk_perangkat` |
| DELETE | `/api/v1/master/perangkat/merk/{uuid}` | DELETE jika tidak ada anak | `merk_perangkat` |
| GET | `/api/v1/master/perangkat/model` | SELECT semua model + JOIN jenis & merk | `model_perangkat`, `jenis_perangkat`, `merk_perangkat` |
| POST | `/api/v1/master/perangkat/model` | INSERT model baru | `model_perangkat` |
| PUT | `/api/v1/master/perangkat/model/{uuid}` | UPDATE model | `model_perangkat` |
| DELETE | `/api/v1/master/perangkat/model/{uuid}` | DELETE jika tidak ada anak | `model_perangkat` |
| GET | `/api/v1/master/perangkat/status` | SELECT semua status (paginated) | `status_perangkat` |
| POST | `/api/v1/master/perangkat/status` | INSERT status baru | `status_perangkat` |
| PUT | `/api/v1/master/perangkat/status/{uuid}` | UPDATE status | `status_perangkat` |
| DELETE | `/api/v1/master/perangkat/status/{uuid}` | DELETE jika tidak ada anak | `status_perangkat` |

> **Endpoint untuk dropdown di form Model Perangkat** (read-only, tidak perlu paginasi penuh):
> - `GET /api/v1/master/perangkat/jenis?active=true&limit=100` — untuk mengisi pilihan dropdown jenis
> - `GET /api/v1/master/perangkat/merk?active=true&limit=100` — untuk mengisi pilihan dropdown merk

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Cards / Ringkasan

| Card | Cara Hitung |
|------|-------------|
| **Total Jenis** | `COUNT(*) FROM jenis_perangkat WHERE is_active = true` |
| **Total Merk** | `COUNT(*) FROM merk_perangkat WHERE is_active = true` |
| **Total Model** | `COUNT(*) FROM model_perangkat WHERE is_active = true` |
| **Total Status** | `COUNT(*) FROM status_perangkat WHERE is_active = true` |

### 6.2. Navigasi Tab

Halaman menggunakan layout tab horizontal dengan empat tab:
1. **Jenis Perangkat** — tabel data jenis
2. **Merk Perangkat** — tabel data merk
3. **Model Perangkat** — tabel data model (dengan kolom jenis & merk)
4. **Status Perangkat** — tabel data status

### 6.3. Per Tab — Komponen Tabel Data

Setiap tab memiliki struktur yang seragam:

- **Toolbar atas:** tombol "Tambah", input pencarian (search by nama), filter status (Aktif/Nonaktif/Semua)
- **Tabel data:** kolom bervariasi per tab (lihat detail di bawah), dengan aksi Edit dan Hapus/Nonaktifkan di setiap baris
- **Paginasi:** navigasi halaman di bawah tabel

**Kolom tabel per tab:**

| Tab | Kolom Tabel |
|-----|-------------|
| Jenis Perangkat | Nama Jenis, Deskripsi, Status (badge Aktif/Nonaktif), Aksi |
| Merk Perangkat | Nama Merk, Deskripsi, Status (badge Aktif/Nonaktif), Aksi |
| Model Perangkat | Nama Model, Jenis Perangkat, Merk Perangkat, Deskripsi, Status, Aksi |
| Status Perangkat | Nama Status, Deskripsi, Status (badge Aktif/Nonaktif), Aksi |

### 6.4. Form Tambah/Edit (Modal atau Drawer)

**Form Jenis Perangkat:**
- Input: `nama_jenis` (wajib), `deskripsi` (opsional)
- Toggle: `is_active` (saat edit)

**Form Merk Perangkat:**
- Input: `nama_merk` (wajib), `deskripsi` (opsional)
- Toggle: `is_active` (saat edit)

**Form Model Perangkat:**
- Dropdown: `jenis_perangkat_id` (wajib, source dari API jenis aktif)
- Dropdown: `merk_perangkat_id` (wajib, source dari API merk aktif)
- Input: `nama_model` (wajib)
- Textarea: `deskripsi` (opsional)
- Toggle: `is_active` (saat edit)

**Form Status Perangkat:**
- Input: `nama_status` (wajib)
- Textarea: `deskripsi` (opsional)
- Toggle: `is_active` (saat edit)

### 6.5. Dialog Konfirmasi Hapus

- Muncul sebelum operasi delete
- Menampilkan nama data yang akan dihapus
- Jika data masih digunakan (respons 409), tampilkan pesan error dan tombol alternatif "Nonaktifkan Saja"

---

## 7. Ringkasan & Kekurangan

### Sudah Ada

- Keempat tabel (`jenis_perangkat`, `merk_perangkat`, `model_perangkat`, `status_perangkat`) sudah terdefinisi di skema DB.
- Relasi FK antara `model_perangkat` ke `jenis_perangkat` dan `merk_perangkat` sudah ada dan terindeks.
- Kolom `is_active` tersedia di semua tabel — memungkinkan nonaktifkan tanpa hard delete.
- Kolom audit (`created_at`, `created_by`, `updated_at`, `updated_by`) tersedia di semua tabel.
- Endpoint CRUD untuk `jenis_perangkat` sudah selesai (status: tersedia).

### Status Endpoint

| Tabel | Status |
|-------|--------|
| `jenis_perangkat` | ✓ Selesai |
| `merk_perangkat` | ✓ Selesai |
| `model_perangkat` | ✓ Selesai |
| `status_perangkat` | ✓ Selesai |

### Catatan Implementasi Aktual

**1. Field `kode` auto-generate**

Semua 4 entitas memiliki field `kode` yang di-generate otomatis di BE jika tidak diisi (pola: `PREFIX-3CHAR`). Field ini ada di DB dan dikembalikan di response.

**2. Warna status perangkat — disimpan sementara dalam JSON**

Kolom `warna_background` dan `warna_text` **belum ada sebagai kolom terpisah** di tabel `status_perangkat`. Sementara ini, BE menyimpannya sebagai JSON di dalam kolom `deskripsi`:
```json
{ "warna_bg": "#f0fdf4", "warna_text": "#16a34a", "text": "deskripsi aktual" }
```
Migrasi untuk menambah kolom terpisah masih diperlukan agar data lebih bersih.

**3. Path parameter menggunakan `id`, bukan `uuid`**

Endpoint di-implementasikan menggunakan `id` (UUID primary key) sebagai path parameter, bukan `uuid` surrogate seperti yang tertulis di tabel endpoint section 5.

**4. Delete diimplementasikan sebagai soft delete**

Semua DELETE di BE diimplementasikan sebagai `is_active = false`, bukan hard delete. Validasi anak aktif tetap dilakukan sebelum soft delete.

---

### Status Implementasi

> Urutan implementasi:
> 1. **Migrasi DB** — jalankan `002_add_is_active_perangkat.sql` (idempotent, aman dijalankan berulang).
> 2. **Implementasi BE** — endpoint CRUD untuk keempat tabel via `perangkat.py` (selesai).
> 3. **Integrasi FE** — halaman `/master/perangkat` dengan tab Jenis, Merk, Model, Status (selesai).
