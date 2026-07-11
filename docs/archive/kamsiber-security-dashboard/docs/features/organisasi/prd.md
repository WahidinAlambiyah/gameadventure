# PRD: Struktur Organisasi

**Nama Fitur:** Struktur Organisasi
**Status:** Draft
**Pemilik:** @product-management
**Modul:** Human Resources (H1)

---

## 1. Deskripsi Masalah

PLN memiliki struktur organisasi yang kompleks dengan 6 level hierarki. Aplikasi Kamsiber membutuhkan pemetaan akurat dari struktur ini agar data keamanan dapat dikaitkan dengan unit organisasi yang tepat, serta mendukung pelaporan dan akuntabilitas per unit.

---

## 2. Tujuan & Metrik Keberhasilan

| Tipe Metrik | Nama Metrik | Target |
|:------------|:------------|:-------|
| **Produk** | Kelengkapan data organisasi | 100% unit organisasi PLN terpetakan |
| **Teknis** | Waktu respons API | < 500ms untuk operasi CRUD |
| **UX** | Kemudahan navigasi hierarki | Pengguna dapat menelusuri hierarki dalam 3 klik |

---

## 3. User Stories

- Sebagai **Admin**, saya ingin menambah, mengubah, dan menghapus data unit organisasi di setiap level hierarki, agar struktur organisasi selalu mencerminkan kondisi terkini.
- Sebagai **Operator**, saya ingin melihat struktur organisasi secara hierarkis, agar saya memahami cakupan tanggung jawab setiap unit.
- Sebagai **Operator**, saya ingin mencari unit organisasi berdasarkan nama atau kode, agar saya dapat menemukan unit yang relevan dengan cepat.

---

## 4. Persyaratan Fungsional

### Definisi Level Organisasi

| Level | Kode Level | Nama Level | Setara | Contoh |
|:------|:-----------|:-----------|:-------|:-------|
| **L0** | Kantor Pusat | Kantor Pusat | Top Level | PLN Pusat |
| **L1** | Direktorat | Direktorat, Unit Induk Distribusi | DIR Level | Direktorat Keuangan |
| **L2** | Divisi | Divisi, Unit Induk Pelaksana | EVP Level | Divisi Keamanan Siber |
| **L3** | Bidang | Bidang, Unit Induk Wilayah | VP Level | Bidang Infrastruktur |
| **L4** | Sub Bidang | Sub Bidang | MSB Level | Sub Bidang Monitoring |
| **L5** | Staff | Staff, PIC | PIC Level | Staff Operasional |

### Model Data

Setiap instance organisasi di setiap level memiliki field berikut:

| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama | Text | Ya | Nama unit organisasi |
| Kode | Text | Ya | Kode unik unit organisasi |
| Level | Enum (L0–L5) | Ya | Level hierarki |
| Parent (FK) | Reference | Tidak* | Relasi ke unit organisasi induk |
| Deskripsi | Textarea | Tidak | Keterangan tambahan |

> *Parent bersifat wajib untuk level L1–L5, dan null untuk L0 (Kantor Pusat).

### Aturan Hierarki

- **L0** adalah root (tidak memiliki parent).
- **L1** hanya boleh menjadi child dari **L0**.
- **L2** hanya boleh menjadi child dari **L1**.
- **L3** hanya boleh menjadi child dari **L2**.
- **L4** hanya boleh menjadi child dari **L3**.
- **L5** hanya boleh menjadi child dari **L4**.
- Satu parent dapat memiliki banyak child.

### Alur Pengguna

1. **Halaman Utama (`/organisasi`)**: Menampilkan daftar semua unit organisasi dalam format tabel dengan kolom Nama, Kode, Level, dan Parent.
2. **Filter & Pencarian**: Filter berdasarkan level (dropdown L0–L5) + pencarian teks berdasarkan nama/kode.
3. **Tambah Unit**: Tombol "Tambah Organisasi" membuka SlideOver form. Field Parent menampilkan dropdown yang difilter sesuai level yang dipilih (misal: jika level L2 dipilih, parent dropdown hanya menampilkan unit L1).
4. **Edit Unit**: Klik tombol edit pada baris tabel membuka SlideOver form yang terisi data.
5. **Hapus Unit**: Klik tombol hapus menampilkan dialog konfirmasi. Jika unit memiliki child, tampilkan pesan "Unit ini memiliki [N] sub-unit. Hapus semua sub-unit terlebih dahulu."

---

## 5. Persyaratan Non-Fungsional

- **Validasi**: Kode organisasi harus unik secara global.
- **Cascade Protection**: Unit yang masih memiliki child tidak boleh dihapus langsung (restrict delete).
- **Pesan Error**: Semua pesan dalam Bahasa Indonesia.
- **Pagination**: Tabel menggunakan pagination (10 baris per halaman).

---

## 6. Mitigasi Risiko

| Risiko | Strategi Fallback |
|:-------|:-----------------|
| Hapus unit yang masih memiliki child | Restrict delete + pesan "Hapus sub-unit terlebih dahulu" |
| Duplikasi kode organisasi | Unique constraint + pesan "Kode sudah digunakan" |
| Perubahan struktur organisasi besar-besaran | Mendukung bulk update melalui fitur impor (fase selanjutnya) |

---

## 7. Catatan Implementasi

> [!NOTE]
> Meskipun data organisasi memiliki hierarki, tampilan utama menggunakan **tabel flat** dengan kolom Parent (bukan tree view). Tree view dapat dipertimbangkan sebagai enhancement di fase selanjutnya.

> [!NOTE]
> Modul **Jabatan** (`/jabatan`) memiliki FK ke modul ini. Pastikan API organisasi menyediakan endpoint untuk listing data secara ringkas (ID + Nama + Level) guna mendukung dropdown di form Jabatan.
