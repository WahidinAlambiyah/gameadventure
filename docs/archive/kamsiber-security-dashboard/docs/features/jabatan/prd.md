# PRD: Jabatan

**Nama Fitur:** Jabatan
**Status:** Draft
**Pemilik:** @product-management
**Modul:** Human Resources (H2)

---

## 1. Deskripsi Masalah

Setiap unit organisasi dalam PLN memiliki berbagai jabatan/posisi. Aplikasi Kamsiber membutuhkan pengelolaan data jabatan yang terhubung ke struktur organisasi agar penugasan tanggung jawab keamanan siber dapat dilacak hingga ke level jabatan.

---

## 2. Tujuan & Metrik Keberhasilan

| Tipe Metrik | Nama Metrik | Target |
|:------------|:------------|:-------|
| **Produk** | Kelengkapan pemetaan jabatan | 100% jabatan terpetakan ke organisasi |
| **Teknis** | Waktu respons API | < 500ms untuk operasi CRUD |

---

## 3. User Stories

- Sebagai **Admin**, saya ingin menambah, mengubah, dan menghapus data jabatan yang terhubung ke unit organisasi, agar setiap jabatan terpetakan ke badan organisasi yang tepat.
- Sebagai **Operator**, saya ingin mencari jabatan berdasarkan nama, kode, atau organisasi, agar saya dapat menemukan PIC yang bertanggung jawab dengan cepat.

---

## 4. Persyaratan Fungsional

### Model Data

| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Jabatan | Text | Ya | Nama posisi/jabatan |
| Kode Jabatan | Text | Ya | Kode unik jabatan |
| Badan Organisasi (FK) | Reference | Ya | Relasi ke modul Struktur Organisasi |
| Deskripsi | Textarea | Tidak | Keterangan tambahan |

### Alur Pengguna

1. **Halaman Utama (`/jabatan`)**: Menampilkan daftar semua jabatan dalam format tabel dengan kolom Nama Jabatan, Kode, Badan Organisasi, dan Deskripsi.
2. **Filter & Pencarian**: Filter berdasarkan badan organisasi (dropdown) + pencarian teks berdasarkan nama/kode jabatan.
3. **Tambah Jabatan**: Tombol "Tambah Jabatan" membuka SlideOver form. Field Badan Organisasi menggunakan dropdown yang menampilkan daftar organisasi dari modul Struktur Organisasi (ID + Nama + Level).
4. **Edit Jabatan**: Klik tombol edit pada baris tabel membuka SlideOver form terisi data.
5. **Hapus Jabatan**: Klik tombol hapus menampilkan dialog konfirmasi.

### Ketergantungan Modul

- **Struktur Organisasi (H1)**: Modul ini bergantung pada data organisasi. API organisasi harus menyediakan endpoint listing ringkas untuk dropdown.

---

## 5. Persyaratan Non-Fungsional

- **Validasi**: Kode jabatan harus unik.
- **Pesan Error**: Semua pesan dalam Bahasa Indonesia.
- **Pagination**: Tabel menggunakan pagination (10 baris per halaman).
- **Referential Integrity**: Jika unit organisasi yang direferensikan dihapus, jabatan terkait harus ditangani (restrict delete di sisi organisasi atau cascade update).

---

## 6. Mitigasi Risiko

| Risiko | Strategi Fallback |
|:-------|:-----------------|
| Organisasi yang direferensikan dihapus | Restrict delete di sisi organisasi + pesan "Data organisasi masih digunakan oleh jabatan" |
| Duplikasi kode jabatan | Unique constraint + pesan "Kode jabatan sudah digunakan" |
