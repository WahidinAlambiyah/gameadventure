# Database Migration Guide — ERD v2 vs Python Models

> **Tanggal:** 2026-06-23
> **Sumber ERD:** `zpic/ERD v 2/ERD Kamsiber v.2.sql`
> **Target Model:** `backend/models/scaffolded_models.py`
> **Tujuan:** Dokumen ini memetakan semua perbedaan antara ERD terbaru (v2) dengan implementasi Python yang ada. AI yang membaca dokumen ini harus melakukan perubahan di bawah agar model Python selaras dengan ERD.

---

## Konvensi Penting

Sebelum mengerjakan migrasi, perhatikan pola yang sudah ada di Python models:
- **Primary Key:** Semua PK sudah dimigrasikan ke `UUID` dengan `server_default=uuid_generate_v7()` — jangan kembalikan ke `SERIAL`/`INT`
- **Kolom `uuid`:** Setiap tabel yang sudah ada di Python menambahkan kolom `uuid VARCHAR(36) UNIQUE` sebagai external-facing ID — pertahankan pola ini di tabel baru
- **`created_at`:** Gunakan `server_default=text('now()')` — jangan hardcode timestamp
- **`status_perangkat` / `tipe_bare_metal` / `environment`:** Python sudah memisahkan ini menjadi tabel master tersendiri (bukan string kode), lanjutkan pola ini

---

## A. MASTER TABLES

### A1. Tabel yang Perlu DIBUAT (ada di ERD, tidak ada di Python)

#### `master_sertifikat`
```sql
-- ERD Definition
CREATE TABLE "master_sertifikat" (
  "id" uuid PRIMARY KEY,
  "nama_sertifikat" varchar(255) NOT NULL,  -- Certificate name
  "penerbit" varchar(255) NOT NULL,          -- Publisher / issuing body
  "durasi_berlaku" int NOT NULL,             -- Expiry duration in months
  "deskripsi" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid
);
```
**Yang harus dibuat:** Class `MasterSertifikat` di `scaffolded_models.py`
**Relasi yang terdampak:** `history_sertifikasi.id_sertifikat` → FK ke tabel ini (saat ini FK sudah dihapus di Python — lihat Bagian B5)
**Modul terdampak:** `SDM / People` → tab Sertifikasi

---

#### `master_layanan_keamanan`
```sql
-- ERD Definition
CREATE TABLE "master_layanan_keamanan" (
  "id" uuid PRIMARY KEY,
  "kode_layanan" varchar(25) UNIQUE NOT NULL,
  "nama_layanan" varchar(255),
  "deskripsi" text,
  "mapping_flow" int,
  "is_email" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT 'now()',
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid
);
```
**Yang harus dibuat:** Class `MasterLayananKeamanan` di `scaffolded_models.py`
**Modul terdampak:** `Request Layanan` — tabel `request_layanan` kemungkinan akan merujuk ke sini

---

#### `threshold` dan `threshold_detail`
```sql
-- ERD Definition
CREATE TABLE "threshold" (
  "id" uuid PRIMARY KEY,
  "nama_threshold" varchar(255),
  "deskripsi" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT 'now()',
  "created_by" uuid, "updated_at" timestamp, "updated_by" uuid
);

CREATE TABLE "threshold_detail" (
  "id" uuid PRIMARY KEY,
  "threshold_id" uuid,   -- FK ke threshold
  "nama_range" varchar(255),
  "deskripsi" text,
  "min_nilai" int,
  "max_nilai" int,
  "warna" varchar(50),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT 'now()',
  "created_by" uuid, "updated_at" timestamp, "updated_by" uuid
);
```
**Yang harus dibuat:** Class `Threshold` dan `ThresholdDetail`
**Modul terdampak:** Dashboard / Monitoring (digunakan untuk rating/scoring visual)

---

### A2. Kolom yang Ditambah di Python (tidak ada di ERD — sudah ada, pertahankan)

| Tabel | Kolom Tambahan | Tipe | Keterangan |
|---|---|---|---|
| `master_site` | `uuid` | `VARCHAR(36)` UNIQUE | External ID pattern |
| `master_site` | `kode` | `VARCHAR(50)` UNIQUE NOT NULL | Kode unik site |
| `master_site` | `tipe` | `VARCHAR(50)` DEFAULT `'Data Center'` | Jenis site |
| `master_room` | `uuid` | `VARCHAR(36)` UNIQUE | External ID pattern |
| `master_rack` | `uuid` | `VARCHAR(36)` UNIQUE | External ID pattern |
| `master_kategori` | `is_parent` | `BOOLEAN` | Penanda kategori induk |
| `master_kategori` | `nama_item` | `VARCHAR(100)` | Nama tampilan item |
| `master_kategori` | `warna_bg` | `VARCHAR(50)` | Warna background (UI) |
| `master_kategori` | `warna_text` | `VARCHAR(50)` | Warna teks (UI) |

> Kolom-kolom ini **tidak perlu dihapus** — merupakan kebutuhan fungsional yang ditambahkan selama development.

---

### A3. Tabel Master BARU di Python (tidak ada di ERD — sudah ada, pertahankan)

Tabel-tabel berikut dibuat di Python sebagai pengganti string kode (master_kategori lookup):

| Class Python | Tabel DB | Menggantikan |
|---|---|---|
| `Environment` | `environment` | `aplikasi_environment.kode_environment` (string) |
| `StatusPerangkat` | `status_perangkat` | `bare_metal.kode_status`, `server.status_perangkat`, `perangkat_keamanan.status_perangkat` |
| `TipeBareMetal` | `tipe_bare_metal` | `bare_metal.tipe_baremetal_kode` (int via master_kategori) |

---

## B. NON-MASTER TABLES

### B1. Tabel yang Perlu DIBUAT (ada di ERD, tidak ada di Python)

#### `ssl_certificate`
```sql
CREATE TABLE "ssl_certificate" (
  "id" uuid PRIMARY KEY,
  "nama" varchar(255) NOT NULL,            -- Certificate name or alias
  "master_sertifikat_id" int NOT NULL,     -- Publisher/type from master data
  "common_name" varchar(500) NOT NULL,     -- Primary domain name (CN)
  "subject_alternative_names" text,        -- Comma-separated SANs
  "serial_number" varchar(255),
  "tanggal_terbit" date,
  "tanggal_kedaluwarsa" date NOT NULL,
  "auto_renew" boolean NOT NULL DEFAULT false,
  "deskripsi" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "created_by" int, "updated_at" timestamp, "updated_by" int
);
```
**Index:** `common_name`, `tanggal_kedaluwarsa`, `master_sertifikat_id`
**Relasi:** `master_sertifikat_id` → FK ke `master_sertifikat`; `domain.ssl_certificate_id` → FK ke sini
**Modul terdampak:** `Inventori Aplikasi` → Domain Management, SSL Monitoring

---

#### `domain`
```sql
CREATE TABLE "domain" (
  "id" uuid PRIMARY KEY,
  "aplikasi_environment_id" uuid NOT NULL,   -- FK ke aplikasi_environment
  "fqdn" varchar(500) NOT NULL,              -- Fully Qualified Domain Name
  "port" int DEFAULT 443,
  "protokol" domain_protocol NOT NULL DEFAULT 'HTTPS',
  "is_public" boolean NOT NULL DEFAULT false,
  "ssl_certificate_id" int,                  -- FK ke ssl_certificate
  "deskripsi" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "created_by" int, "updated_at" timestamp, "updated_by" int
);
```
**Enum diperlukan:** `domain_protocol` (`HTTP`, `HTTPS`, `TCP`, `UDP`, `GRPC`, `WSS`, `OTHER`)
**Modul terdampak:** `Inventori Aplikasi` → Detail Environment

---

#### `domain_ip`
```sql
CREATE TABLE "domain_ip" (
  "id" uuid PRIMARY KEY,
  "domain_id" uuid NOT NULL,  -- FK ke domain
  "server_id" uuid,           -- FK ke server (nullable jika external/CDN)
  "ip_address" varchar(45) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "created_by" int, "updated_at" timestamp, "updated_by" int
);
```
**Unique:** `(domain_id, ip_address)`
**Modul terdampak:** `Inventori Aplikasi` → DNS / IP Mapping

---

#### `staff`
```sql
CREATE TABLE "staff" (
  "id" uuid PRIMARY KEY,
  "sub_bidang_id" uuid NOT NULL,  -- FK ke sub_bidang
  "nama" varchar(255) NOT NULL,
  "kode" varchar(50) UNIQUE NOT NULL,
  "deskripsi" text,
  "source_system" varchar(50) DEFAULT 'LOCAL',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "created_by" uuid, "updated_at" timestamp, "updated_by" uuid
);
```
**Modul terdampak:** `SDM` → Hierarki Organisasi (level paling bawah)

---

#### `aplikasi_staff_pengelola`
```sql
CREATE TABLE "aplikasi_staff_pengelola" (
  "id" uuid PRIMARY KEY,
  "id_aplikasi" uuid NOT NULL,  -- FK ke aplikasi
  "staff_id" uuid NOT NULL,     -- FK ke staff
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "created_by" uuid, "updated_at" timestamp, "updated_by" uuid
);
```
**Unique:** `(id_aplikasi, staff_id)`
**Modul terdampak:** `Inventori Aplikasi` → Pengelola Staff

---

### B2. Enum yang Ada di ERD tapi Belum Digunakan di Python

| Enum ERD | Digunakan di Tabel | Status di Python |
|---|---|---|
| `domain_protocol` | `domain.protokol` | ❌ Belum (karena `domain` belum dibuat) |
| `organisasi_level` | `jabatan`, `aplikasi`, `security_awareness_program` | ⚠️ Di Python diganti `String(50)` — bisa dipertimbangkan migrasi ke enum |

> `organisasi_level` di ERD didefinisikan sebagai ENUM (`ORGANISASI`, `DIREKTORAT`, `DIVISI`, `BIDANG`, `SUB_BIDANG`, `STAFF`). Python menggunakan `String(50)` untuk kolom yang sama. Ini fungsional tetapi kehilangan validasi DB-level.

---

### B3. Kolom yang DIHAPUS dari ERD (ada di ERD, tidak ada di Python)

#### `security_awareness_program`
| Kolom ERD | Alasan Hilang |
|---|---|
| `tipe_campaign_id` | Dipindah ke level `campaign` (tabel baru di Python) |
| `metric_target_score` | Dipindah ke `campaign` |
| `metric_actual_score` | Dipindah ke `campaign` |
| `metric_target_completion_rate` | Dipindah ke `campaign` |
| `metric_actual_completion_rate` | Dipindah ke `campaign` |
| `metric_total_participants` | Dipindah ke `campaign` |
| `kode_status_program` | Dihilangkan (belum jelas penggantinya) |

**Kolom DITAMBAH di Python (tidak di ERD):**
- `tipe` `VARCHAR(50)` — pengganti `tipe_campaign_id`
- `deskripsi` `TEXT`

> **Catatan AI:** Jika `kode_status_program` diperlukan, tambahkan ke Python. Jika `tipe_campaign_id` diperlukan, revert ke FK daripada string.

---

#### `VA_temuan` — Struktur Berubah Total
| Kolom ERD | Status di Python |
|---|---|
| `nama_temuan` varchar(255) | ❌ Dihapus |
| `kode_prioritas` varchar(25) | ❌ Dihapus → diganti `kode_jenis_temuan` |
| `bentuk_perbaikan` text | ❌ Dihapus |
| `pertimbangan_dampak` text | ❌ Dihapus |
| — | ✅ `kondisi` VARCHAR(255) ditambah |
| — | ✅ `penyebab` VARCHAR(255) ditambah |
| — | ✅ `dampak` VARCHAR(255) ditambah |

> **Catatan AI:** Kolom `nama_temuan`, `bentuk_perbaikan`, `pertimbangan_dampak` di ERD v2 tidak tersedia di Python. Jika bisnis memerlukan ini, tambahkan kembali.

---

#### `VA_terdampak` — Belum Ada di Python
```sql
-- Ada di ERD, belum di Python
CREATE TABLE "VA_terdampak" (
  "id" uuid PRIMARY KEY,
  "id_temuan" uuid,         -- FK ke VA_temuan
  "ref_id_asset" uuid,      -- polymorphic: aplikasi / server / perangkat_keamanan
  "jenis_asset" varchar(25),
  ...
);
```
**Modul terdampak:** `VA Aplikasi` → Asset Terdampak

---

#### `pentest_temuan` — Struktur Berubah
| Kolom ERD | Status di Python |
|---|---|
| `nama_temuan` varchar(255) | ❌ Dihapus |
| `penjelasan` text | ❌ Dihapus |
| `tingkat_bahaya` varchar(25) | ❌ Dihapus → diganti `kode_jenis_temuan` |
| `bentuk_perbaikan` text | ❌ Dihapus |
| — | ✅ `kondisi` VARCHAR(255) ditambah |
| — | ✅ `penyebab` VARCHAR(255) ditambah |

---

### B4. Kolom yang DITAMBAH di Python (tidak ada di ERD — sudah ada, pertahankan)

#### `CTI`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `is_active` | `BOOLEAN` | Soft delete |
| `kode` | `VARCHAR(50)` | Kode CTI |
| `referensi_standar` | `VARCHAR(100)` | Referensi standar keamanan |
| `referensi_kode` | `VARCHAR(200)` | Kode referensi |
| `keterangan` | `TEXT` | Keterangan tambahan |

#### `compliance` (di Python)
| Kolom | Keterangan |
|---|---|
| `is_active` | Ditambah di Python |

#### `compliance_kategori`
| Kolom | Keterangan |
|---|---|
| `is_active` | Ditambah di Python |

#### `history_sertifikasi` — Restrukturisasi Signifikan
| Kolom ERD | Status |
|---|---|
| `id` (PK) | ⚠️ Diganti nama jadi `id_tahapan` di Python |
| `id_sertifikat` (FK ke master_sertifikat) | ❌ Dihapus di Python |
| — | ✅ `nama_sertifikasi` VARCHAR(100) ditambah |
| — | ✅ `penerbit` VARCHAR(100) ditambah |
| — | ✅ `kode_status_sertifikat` VARCHAR(25) ditambah |

> **Catatan AI:** `id_sertifikat` yang menghubungkan ke `master_sertifikat` **dihapus** di Python. Artinya data sertifikat (nama, penerbit) diinput langsung ke `history_sertifikasi` tanpa lookup master. Ini berimplikasi pada inkonsistensi nama sertifikat antar pegawai. **Rekomendasikan mengembalikan FK ini** setelah `master_sertifikat` dibuat.

---

#### `jabatan` — Kolom Tambahan di Python
| Kolom | Tipe | Keterangan |
|---|---|---|
| `level` | `VARCHAR(50)` | Level jabatan (tidak di ERD) |
| `atasan_id` | `UUID` FK self-reference | Hierarki jabatan (tidak di ERD) |

---

#### `bare_metal` — Perubahan FK
| Kolom ERD | Python |
|---|---|
| `tipe_baremetal_kode` INT (via master_kategori) | → `tipe_bare_metal_id` UUID FK ke `tipe_bare_metal` |
| `kode_status` INT (via master_kategori) | → `status_perangkat_id` UUID FK ke `status_perangkat` |
| `merk_perangkat_id` INT | → `merk_perangkat_id` UUID FK ke `merk_perangkat` |

---

#### `perangkat_keamanan` — Perubahan FK
| Kolom ERD | Python |
|---|---|
| `status_perangkat` VARCHAR(25) (string) | → `status_perangkat_id` UUID FK ke `status_perangkat` |

---

#### `aplikasi_environment` — Perubahan FK
| Kolom ERD | Python |
|---|---|
| `kode_environment` VARCHAR(25) (string) | → `environment_id` UUID FK ke `environment` |
| `kode_status` VARCHAR(25) (string) | → `status_perangkat_id` UUID FK ke `status_perangkat` |

---

#### `arsip_relasi_kepatuhan` — BUG TYPO
| Kolom ERD | Python | Status |
|---|---|---|
| `nomor_dokumen` VARCHAR(100) | `nomor_dokuemn` VARCHAR(100) | 🐛 **TYPO** di Python — harus difix |

**Action:** Rename kolom `nomor_dokuemn` → `nomor_dokumen` di model dan migration.

---

#### `compliance_point_kategori` — Rename Tabel
| ERD | Python |
|---|---|
| `compliance_point_kategori` | `point_kategori` |

Class Python `PointKategori` merujuk ke tabel `point_kategori`. Jika database production masih menggunakan nama lama, perlu `ALTER TABLE` rename.

---

#### Tabel BARU di Python (tidak ada di ERD)

| Class Python | Tabel | Tujuan |
|---|---|---|
| `Campaign` | `campaign` | Sub-program dari `security_awareness_program`, menggantikan `konten` |
| `Environment` | `environment` | Master lookup environment (Production, Staging, UAT, dll.) |
| `StatusPerangkat` | `status_perangkat` | Master lookup status perangkat |
| `TipeBareMetal` | `tipe_bare_metal` | Master lookup tipe bare metal |

> `konten` dari ERD **tidak diimplementasikan** di Python — digantikan oleh `campaign`. Jika fungsionalitas `konten` (materi pelatihan) berbeda dari `campaign` (event), mungkin keduanya perlu ada.

---

### B5. Tabel di ERD yang Sudah Diimplementasikan dengan Perbedaan Minor

| Tabel | Perbedaan |
|---|---|
| `RASCI_inisiatif` | ERD: `id_people VARCHAR(100)` → Python: `id_people UUID` FK ke `people` |
| `server` | ERD: `kode_envirenment` UNIQUE → Python: sudah ada (typo dipertahankan dari ERD) |
| `patching_history` | ERD: enum `patching_asset_type`, `patching_status` belum dideklarasikan di ERD SQL → Python: `String(50)` |

---

## C. RINGKASAN — DAFTAR PEKERJAAN MIGRASI

### 🔴 Prioritas Tinggi (Blocking / Ada FK yang rusak)

1. **Buat `master_sertifikat`** → `history_sertifikasi.id_sertifikat` bergantung padanya
2. **Fix typo `nomor_dokuemn` → `nomor_dokumen`** di `arsip_relasi_kepatuhan`
3. **Buat `ssl_certificate`** → `domain.ssl_certificate_id` bergantung padanya
4. **Buat `domain` dan `domain_ip`** → Modul inventori aplikasi

### 🟡 Prioritas Sedang (Fitur Belum Lengkap)

5. **Buat `master_layanan_keamanan`** → Modul request layanan
6. **Buat `threshold` dan `threshold_detail`** → Dashboard monitoring
7. **Buat `staff` dan `aplikasi_staff_pengelola`** → Hierarki org & pengelola aplikasi
8. **Buat `VA_terdampak`** → VA Aplikasi asset mapping
9. **Tambah kembali `id_sertifikat` FK di `history_sertifikasi`** setelah `master_sertifikat` dibuat

### 🟢 Opsional / Pertimbangan

10. **`konten` vs `campaign`:** Tentukan apakah `konten` (materi) perlu terpisah dari `campaign` (event)
11. **`security_awareness_program.kode_status_program`:** Tambahkan jika tracking status program diperlukan
12. **`organisasi_level` enum:** Pertimbangkan migrasi dari `String(50)` ke enum PostgreSQL untuk validasi DB-level
13. **`compliance_point_kategori` vs `point_kategori`:** Pastikan nama tabel di DB production sesuai dengan yang di Python

---

## D. MODUL YANG TERDAMPAK

| Modul | Perubahan |
|---|---|
| **Master Data** | Tambah: `master_sertifikat`, `master_layanan_keamanan`, `threshold`, `threshold_detail` |
| **Inventori Infrastruktur** | Tambah: `staff`, `aplikasi_staff_pengelola`; Update FK `bare_metal`, `perangkat_keamanan` |
| **Inventori Aplikasi** | Tambah: `ssl_certificate`, `domain`, `domain_ip`, `VA_terdampak`; Update FK `aplikasi_environment` |
| **SDM / People** | Fix FK `history_sertifikasi.id_sertifikat`; Tambah `staff` |
| **Security Awareness** | Restrukturisasi: `security_awareness_program` + `campaign` (baru) menggantikan `konten` |
| **VA Aplikasi** | Kolom `VA_temuan` berbeda dari ERD; `VA_terdampak` belum ada |
| **Pentest** | Kolom `pentest_temuan` berbeda dari ERD |
| **Arsip Kamsiber** | Fix typo `nomor_dokuemn` |
| **Compliance** | Rename tabel `compliance_point_kategori` → `point_kategori` di Python |
| **Request Layanan** | Tambah FK ke `master_layanan_keamanan` setelah dibuat |
