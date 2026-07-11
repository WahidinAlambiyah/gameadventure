# Spesifikasi Fitur: Master Server

**Path URL:** `http://localhost:3000/master/server`  
**Modul:** Master Data → Server  
**Sumber Referensi:** FE lama `zpic/daskam` & `backend/models/scaffolded_models.py`

---

## 1. Tujuan Fitur

Halaman ini berfungsi sebagai **Master Data Management** terpusat untuk mengelola ekosistem aset Server (Virtual & Fisik) beserta data pendukungnya (Operating System, Fungsi, dan Status). 

Berdasarkan *tracker requirement*, fitur Master Server ini menyatukan pengelolaan **5 tabel Database** ke dalam satu antarmuka terpadu (Sistem Tab), yaitu:
1. `server` (Virtual Machine / Logical Host)
2. `bare_metal` (Physical Host)
3. `operating_system` (Data Master - OS)
4. `fungsi_server` (Data Master - Fungsi/Peran)
5. `status_perangkat` (Data Master - Status Aset)

Menyatukan kelima entitas ini dalam satu halaman mempermudah admin infrastruktur (IT/DevOps) mengkonfigurasi referensi OS/Fungsi sebelum akhirnya membuat instansi Server atau Bare Metal baru.

---

## 2. Hirarki Entitas Data & Tabel Database

Secara arsitektur, kelima tabel ini saling berelasi. Data Referensi (OS, Fungsi, Status) merupakan fondasi yang harus diisi lebih dulu, karena akan dirujuk (FK) oleh tabel Operasional (Server, Bare Metal).

### 2.1. Tabel Referensi / Lookup (Data Master)

Tabel berikut memiliki skema dasar yang mirip: `id`, `uuid`, `nama_...`, `deskripsi`, `is_active`.

- **`operating_system`**: Menyimpan sistem operasi (Ubuntu 22.04, CentOS 7, Windows Server 2022).
- **`fungsi_server`**: Menyimpan peran server (Web Server, Database Server, Application).
- **`status_perangkat`**: Menyimpan daftar status (Active, Maintenance, Decommissioned). 

### 2.2. Tabel Operasional (Aset Infrastruktur)

**Tabel `bare_metal` (Physical Host)**
- Menyimpan aset server dalam bentuk fisik / sasis.
- Kolom Penting: `hostname`, `kode` (Asset Code), `serial_number`, `cpu_cores`, `ram_gb`, `storage_gb`, `management_ip`.
- Foreign Keys: `merk_perangkat_id`, `rack_id`, `status_perangkat_id` (wajib), `tipe_bare_metal_id`.

**Tabel `server` (Virtual Machine / Logical Server)**
- Menyimpan server yang menjalankan *workload* aktual (berjalan di atas bare_metal atau berdiri sendiri di Cloud).
- Kolom Penting: `host_name`, `management_ip`, `cpu_cores`, `ram_gb`, `storage_gb`.
- Foreign Keys:
  - `bare_metal_id` (Relasi ke Host fisik, opsional/nullable jika server ada di Cloud publik).
  - `os_id` (Relasi ke tabel `operating_system`).
  - `fungsi_server_id` (Relasi ke tabel `fungsi_server`).
  - `status_perangkat_id` (Relasi ke tabel `status_perangkat`).

---

## 3. Aturan Validasi & Relasi (Backend)

Karena saling mengikat melalui constraint Foreign Key, aturan berikut wajib diimplementasikan di Backend:

1. **Aturan Hapus (Strict Soft Delete):**  
   **SEMUA penghapusan data bersifat Soft Delete.** Tidak ada data di kelima tabel ini (`server`, `bare_metal`, `operating_system`, `fungsi_server`, `status_perangkat`) yang boleh di-*Hard Delete* dari database, demi menjaga integritas data riwayat infrastruktur.
   - Jika pengguna memilih untuk menghapus, API hanya boleh melakukan `UPDATE tabel SET is_active = false`.
   - Di antarmuka pengguna (Frontend), modal konfirmasi hapus harus memperjelas bahwa data akan dinonaktifkan: *"Apakah Anda yakin? Data ini akan dinonaktifkan (Soft Delete) dan disembunyikan dari daftar aktif."*
   - Semua *query* `GET` (Fetch) wajib mem-filter data dengan `WHERE is_active = true` agar data yang telah terhapus tidak muncul lagi di antarmuka (kecuali ada filter eksplisit untuk melihat *recycle bin* atau *history*).

2. **Aturan Validasi Unik (Unique Constraint):**
   - Di `bare_metal`, kolom `kode` wajib bersifat unik (asset tag tidak boleh kembar). Pastikan mengecualikan data dengan `is_active = false` saat mengecek duplikasi (tergantung implementasi *Unique Index* di DB).
   - Di `server`, kolom `host_name` wajib bersifat unik di jaringan.

---

## 4. Alur Lengkap FE → BE → DB

Antarmuka ini dirancang menggunakan komponen navigasi Tab (misalnya `Tabs` dari shadcn/ui). Saat tab di-klik, FE akan memanggil API dari tabel yang bersangkutan.

### Tab A: Server Logis (Virtual Machine)

```
FE: Klik Tab "Server" → GET /api/v1/master/server
    → Render tabel: Hostname, IP, OS, Fungsi, Status, RAM, CPU.
FE: Klik "Tambah Server" → Form Server Terbuka
    → FE Fetch Dropdowns: GET /os/lookup, GET /fungsi/lookup, GET /status/lookup, GET /bare-metal/lookup
    → POST /api/v1/master/server
      Body: { host_name, management_ip, os_id, fungsi_server_id, status_perangkat_id, bare_metal_id, ram_gb, cpu_cores... }
      BE: Validasi host_name unik. Insert ke tabel server.
```

### Tab B: Bare Metal (Fisik)

```
FE: Klik Tab "Bare Metal" → GET /api/v1/master/bare-metal
    → Render tabel: Kode Asset, Hostname, Management IP, Status, Kapasitas (CPU/RAM).
FE: Klik "Tambah Bare Metal"
    → FE Fetch Dropdowns: GET /status/lookup, GET /merk/lookup
    → POST /api/v1/master/bare-metal
      Body: { kode, hostname, management_ip, status_perangkat_id, ram_gb, cpu_cores, storage_gb }
      BE: Validasi kode unik. Insert ke tabel bare_metal.
```

### Tab C: Operating System

```
FE: Klik Tab "Operating System" → GET /api/v1/master/os
    → Render tabel sederhana: Nama OS, Deskripsi, Status Aktif, Aksi.
FE: Klik Edit → Form OS Terbuka
    → PUT /api/v1/master/os/{id}
      Body: { nama_os, deskripsi, is_active }
      BE: Update tabel operating_system.
```

### Tab D & E: Fungsi Server & Status Perangkat

Alur CRUD untuk Fungsi Server dan Status Perangkat identik dengan alur pada Tab OS. Hanya berbeda pada tabel tujuan (Tabel `fungsi_server` dan tabel `status_perangkat`) dan endpoint (`/api/v1/master/fungsi-server` & `/api/v1/master/status-perangkat`).

---

## 5. Ringkasan Endpoint API

| Method | Endpoint | Aksi BE | Tabel Terlibat |
|---|---|---|---|
| GET | `/api/v1/master/server` | Menampilkan data server lengkap (+ join nama OS, fungsi, status). Filter `is_active=true` | `server`, `operating_system`, `fungsi_server`, `status_perangkat` |
| POST | `/api/v1/master/server` | Buat logical server baru | `server` |
| PUT | `/api/v1/master/server/{id}` | Edit logical server | `server` |
| DELETE | `/api/v1/master/server/{id}` | Soft Delete (`is_active = false`) | `server` |
| GET | `/api/v1/master/bare-metal` | Menampilkan aset perangkat keras host. Filter `is_active=true` | `bare_metal`, `status_perangkat` |
| POST | `/api/v1/master/bare-metal` | Buat host fisik baru | `bare_metal` |
| PUT | `/api/v1/master/bare-metal/{id}` | Edit host fisik | `bare_metal` |
| DELETE | `/api/v1/master/bare-metal/{id}` | Soft Delete (`is_active = false`) | `bare_metal` |
| GET/POST/PUT | `/api/v1/master/os` | CRUD daftar sistem operasi | `operating_system` |
| DELETE | `/api/v1/master/os/{id}` | Soft Delete OS (`is_active = false`) | `operating_system` |
| GET/POST/PUT | `/api/v1/master/fungsi-server`| CRUD peran/fungsi node | `fungsi_server` |
| DELETE | `/api/v1/master/fungsi-server/{id}` | Soft Delete Fungsi (`is_active = false`) | `fungsi_server` |
| GET/POST/PUT | `/api/v1/master/status-perangkat`| CRUD data status | `status_perangkat` |
| DELETE | `/api/v1/master/status-perangkat/{id}` | Soft Delete Status (`is_active = false`) | `status_perangkat` |

*(Tambahan: Semua GET mendukung query `?search=keyword` dan pagination `?page=1&limit=10`)*

---

## 6. Komponen Antarmuka (UI Components)

### 6.1. Header Halaman
- **Ikon:** `Server` / `Database`
- **Judul:** `Master Server & Bare Metal`
- **Subjudul:** `Kelola referensi aset fisik dan logis infrastruktur TI secara terpusat.`

### 6.2. Tab Navigator
Menggunakan tata letak horizontal untuk beralih antar tabel:
1. `💻 Server (Logis)` — Menampilkan data tabel `server`
2. `🗄️ Bare Metal (Fisik)` — Menampilkan data tabel `bare_metal`
3. `💿 Operating System` — Menampilkan data tabel `operating_system`
4. `⚙️ Fungsi Server` — Menampilkan data tabel `fungsi_server`
5. `🚥 Status Perangkat` — Menampilkan data tabel `status_perangkat`

### 6.3. Tabel Utama & Panel Kanan (Sticky Form)
- **Kiri:** Tabel Data. Menampilkan kolom yang relevan berdasarkan Tab yang aktif. Di bagian atas tabel terdapat Search bar dan Pagination.
- **Kanan:** Form Panel statis. Judulnya akan berubah sesuai entitas (misal: "Tambah Server Baru" atau "Edit Operating System").
- **Modal Hapus:** Jika user meng-klik icon `Trash`, tampilkan dialog overlay konfirmasi.

---

## 7. Status Kesiapan (Gap Analysis)
- **Database:** Seluruh 5 tabel (`server`, `bare_metal`, `operating_system`, `fungsi_server`, `status_perangkat`) beserta relasi Foreign Key-nya **SUDAH ADA** di skema Database saat ini (`scaffolded_models.py`). Model SQLAlchemy telah terbentuk dengan benar.
- **Backend:** Perlu dibuatkan struktur Router & Controller yang membungkus ke-5 CRUD tabel ini di bawah satu *module* route besar Server (semua endpoint di atas wajib diimplementasikan).
- **Frontend:** Perlu merevisi *page* di `zpic/daskam` agar bisa memuat arsitektur 5 Tab ini serta formulir form relasi *Dropdown* yang memanggil API Lookup.

> **Status Keseluruhan:** ✅ **Siap Implementasi (Ready for Development)**. Masalah database yang sebelumnya memblokir telah diselesaikan. Tim developer (Backend & Frontend) sudah bisa memulai iterasi koding berdasarkan dokumen spesifikasi ini.
