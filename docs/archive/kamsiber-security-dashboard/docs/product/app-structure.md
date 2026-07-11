# Struktur Aplikasi & Navigasi — Kamsiber

**Versi:** 1.0
**Terakhir Diperbarui:** 2026-06-18
**Status:** Draft

---

## 1. Navigasi Global (Sitemap)

### A. Halaman Publik

| Nama Halaman | Route | Layout | Akses |
|:-------------|:------|:-------|:------|
| **Login** | `/login` | Auth Layout (Centered) | Publik |

### B. Halaman Private — General

| Nama Halaman | Route | Layout | Akses |
|:-------------|:------|:-------|:------|
| **Dashboard** | `/dashboard` | Sidebar Layout | Private |
| **Master Data — Sertifikasi** | `/master/sertifikasi` | Sidebar Layout | Private |
| **Master Data — Lokasi** | `/master/lokasi` | Sidebar Layout | Private |
| **Master Data — Detail Perangkat** | `/master/detail-perangkat` | Sidebar Layout | Private |
| **Master Data — Fungsi Server** | `/master/fungsi-server` | Sidebar Layout | Private |
| **Master Data — Operating System** | `/master/operating-system` | Sidebar Layout | Private |
| **Master Data — Application Environment** | `/master/app-environment` | Sidebar Layout | Private |
| **Master Data — Awareness Type** | `/master/awareness-type` | Sidebar Layout | Private |
| **Master Data — Layanan Keamanan** | `/master/layanan-keamanan` | Sidebar Layout | Private |
| **Master Data — Range Nilai Kuis** | `/master/range-nilai-kuis` | Sidebar Layout | Private |
| **Compliance** | `/compliance` | Sidebar Layout | Private |

### C. Halaman Private — Human Resources

| Nama Halaman | Route | Layout | Akses |
|:-------------|:------|:-------|:------|
| **Struktur Organisasi** | `/organisasi` | Sidebar Layout | Private |
| **Jabatan** | `/jabatan` | Sidebar Layout | Private |
| **People** | `/people` | Sidebar Layout | Private |
| **Security Awareness** | `/awareness` | Sidebar Layout | Private |

### D. Halaman Private — Technology

| Nama Halaman | Route | Layout | Akses |
|:-------------|:------|:-------|:------|
| **Bare Metal** | `/bare-metal` | Sidebar Layout | Private |
| **Server** | `/server` | Sidebar Layout | Private |
| **Domain** | `/domain` | Sidebar Layout | Private |
| **Aplikasi** | `/aplikasi` | Sidebar Layout | Private |

### E. Halaman Private — Integration

| Nama Halaman | Route | Layout | Akses |
|:-------------|:------|:-------|:------|
| **Integration** | `/integrasi` | Sidebar Layout | Private |

### F. Halaman Private — Operations

| Nama Halaman | Route | Layout | Akses |
|:-------------|:------|:-------|:------|
| **Security Service** | `/security-service` | Sidebar Layout | Private |
| **VA** | `/va` | Sidebar Layout | Private |
| **Pentest** | `/pentest` | Sidebar Layout | Private |
| **Follow Up** | `/follow-up` | Sidebar Layout | Private |

---

## 2. Hierarki Navigasi Sidebar

```
📊 General
   ├── Dashboard
   ├── Master Data ▸ (Sub-menu / Expandable)
   │   ├── Sertifikasi
   │   ├── Lokasi
   │   ├── Detail Perangkat
   │   ├── Fungsi Server
   │   ├── Operating System
   │   ├── Application Environment
   │   ├── Awareness Type
   │   ├── Layanan Keamanan
   │   └── Range Nilai Kuis
   └── Compliance

👥 Human Resources
   ├── Struktur Organisasi
   ├── Jabatan
   ├── People
   └── Security Awareness

💻 Technology
   ├── Bare Metal
   ├── Server
   ├── Domain
   └── Aplikasi

🔌 Integration
   └── Integration

⚙️ Operations
   ├── Security Service
   ├── VA
   ├── Pentest
   └── Follow Up
```

---

## 3. Definisi Layout

### A. Auth Layout (Login)
*Layout terpusat tanpa sidebar, digunakan hanya untuk halaman login.*
- **Konten**: Form login di tengah layar.
- **Branding**: Logo Kamsiber di bagian atas form.
- **Background**: Gradient atau ilustrasi keamanan.

### B. Sidebar Layout (Semua halaman private)
*Sidebar tetap di sisi kiri, konten scrollable di sisi kanan.*
- **Sidebar (Lebar: 260px)**:
  - Logo Kamsiber (Atas)
  - Grup Navigasi dengan heading (Tengah): General, HR, Technology, Integration, Operations.
  - Sub-menu expandable untuk Master Data.
  - Profil Pengguna (Bawah): Avatar + Nama + Tombol Logout.
- **Main Content**:
  - Container: `max-w-7xl mx-auto p-4`
  - Breadcrumb navigation di atas setiap halaman detail.
- **Perilaku Mobile**: Sidebar menjadi hamburger menu drawer.

---

## 4. Kebijakan Bahasa

| Aspek | Bahasa |
|:------|:-------|
| **Label UI** (tombol, menu, judul halaman, placeholder) | Bahasa Indonesia |
| **Pesan error & notifikasi** | Bahasa Indonesia |
| **Dokumentasi proyek** | Bahasa Indonesia |
| **Kode sumber** (variabel, fungsi, komentar kode) | Bahasa Inggris |
| **Nama endpoint API** | Bahasa Inggris |

---

## 5. Spesifikasi Zona Halaman

### Pola Umum — Halaman Daftar (List View)

Digunakan oleh sebagian besar modul (Master Data, Organisasi, Jabatan, dll.)

#### Zona 1: Header Halaman
- **Judul**: Nama modul (H1), `text-slate-900 font-bold`
- **Sub-judul**: Deskripsi singkat, `text-slate-500 text-sm`
- **Tombol Aksi**: Kanan-aligned — "Tambah [Item]" (Primary), "Ekspor" (Secondary)

#### Zona 2: Filter Bar
- **Pencarian**: Input teks dengan ikon search.
- **Filter**: Dropdown filter kontekstual (Status, Kategori, dll.)

#### Zona 3: Tabel Data
- Header: `bg-slate-50`, `border-b border-slate-200`, teks uppercase kecil.
- Baris: Hover effect, border bawah.
- Aksi per baris: Edit, Hapus (icon buttons).

#### Zona 4: Pagination
- Informasi jumlah data.
- Kontrol Sebelumnya / Selanjutnya.

### Pola Umum — Form (Create/Edit)

#### Metode: SlideOver / Drawer
- Panel dari sisi kanan layar.
- Header: Judul form + Tombol tutup.
- Body: Form fields dengan label.
- Footer: Tombol "Simpan" (Primary) + "Batal" (Secondary).

---

## 6. Aturan Interaksi

- **Modal Konfirmasi**: Gunakan komponen `Dialog` untuk konfirmasi hapus data.
- **Toast Notification**: Tampilkan pesan sukses/error di pojok kanan atas setelah aksi CRUD.
- **Loading State**: Skeleton loader saat memuat data tabel.
- **Empty State**: Ilustrasi + pesan "Belum ada data" + tombol "Tambah [Item]".
