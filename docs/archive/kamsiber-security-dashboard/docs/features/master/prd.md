# PRD: Master Data

**Nama Fitur:** Master Data
**Status:** Draft
**Pemilik:** @product-management
**Modul:** General (G3)

---

## 1. Deskripsi Masalah

Aplikasi Kamsiber membutuhkan data referensi dinamis yang digunakan di berbagai modul. Data-data ini harus dapat dikelola (CRUD) oleh administrator agar dapat disesuaikan dengan kebutuhan organisasi tanpa memerlukan perubahan kode.

---

## 2. Tujuan & Metrik Keberhasilan

| Tipe Metrik | Nama Metrik | Target |
|:------------|:------------|:-------|
| **Produk** | Kelengkapan data referensi | 100% sub-modul CRUD berfungsi |
| **Teknis** | Waktu respons API | < 500ms untuk operasi CRUD |
| **UX** | Waktu penyelesaian task CRUD | < 30 detik per operasi |

---

## 3. User Stories

- Sebagai **Admin**, saya ingin menambah, mengubah, dan menghapus data sertifikasi keamanan, agar daftar sertifikasi selalu terkini.
- Sebagai **Admin**, saya ingin mengelola lokasi secara hierarkis (Site → Ruangan → Rak), agar inventaris lokasi fisik akurat.
- Sebagai **Admin**, saya ingin mengelola detail perangkat dengan model yang bergantung pada jenis dan merk, agar klasifikasi perangkat konsisten.
- Sebagai **Admin**, saya ingin mengelola data fungsi server, agar pengkategorian server terstandar.
- Sebagai **Admin**, saya ingin mengelola data operating system dengan tanggal EOS/EOL, agar risiko OS kedaluwarsa terpantau.
- Sebagai **Admin**, saya ingin mengelola data application environment, agar pembagian lingkungan terstandar.
- Sebagai **Admin**, saya ingin mengelola data awareness type, agar tipe awareness terkategorisasi.
- Sebagai **Admin**, saya ingin mengelola data layanan keamanan, agar daftar layanan selalu mutakhir.
- Sebagai **Admin**, saya ingin mengelola skema range nilai kuis beserta warna indikator, agar scoring kuis tervisualisasi.

---

## 4. Persyaratan Fungsional

### Sub-Modul 1: Sertifikasi (`/master/sertifikasi`)

**Field data:**
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Sertifikasi | Text | Ya | Nama sertifikat keamanan |
| Penerbit | Text | Ya | Lembaga penerbit sertifikasi |
| Durasi Aktif | Number (bulan) | Ya | Masa berlaku sertifikasi dalam bulan |
| Deskripsi | Textarea | Tidak | Keterangan tambahan |

**Pola UI:** Tabel sederhana + SlideOver form untuk Create/Edit.

---

### Sub-Modul 2: Lokasi (`/master/lokasi`)

**Struktur hierarkis 3 level:**

#### Level 1 — Site
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Site | Text | Ya | Nama lokasi fisik |
| Deskripsi | Textarea | Tidak | Keterangan tambahan |

#### Level 2 — Ruangan (child of Site)
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Ruangan | Text | Ya | Nama ruangan dalam site |
| Site (FK) | Reference | Ya | Relasi ke site induk |
| Deskripsi | Textarea | Tidak | Keterangan tambahan |

#### Level 3 — Rak (child of Ruangan)
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Rak | Text | Ya | Nama rak dalam ruangan |
| Ruangan (FK) | Reference | Ya | Relasi ke ruangan induk |
| Deskripsi | Textarea | Tidak | Keterangan tambahan |

**Pola UI:** Tabel hierarki / Tree view dengan expand-collapse. Klik site menampilkan ruangan, klik ruangan menampilkan rak. Masing-masing level memiliki tombol CRUD sendiri.

---

### Sub-Modul 3: Detail Perangkat (`/master/detail-perangkat`)

**Data yang dikelola:**

#### a. Jenis Perangkat
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Jenis | Text | Ya |
| Deskripsi | Textarea | Tidak |

#### b. Merk Perangkat
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Merk | Text | Ya |
| Deskripsi | Textarea | Tidak |

#### c. Model Perangkat
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Model | Text | Ya | |
| Jenis Perangkat (FK) | Reference | Ya | Bergantung pada jenis |
| Merk Perangkat (FK) | Reference | Ya | Bergantung pada merk |
| Deskripsi | Textarea | Tidak | |

#### d. Status Perangkat
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Status | Text | Ya |
| Deskripsi | Textarea | Tidak |

#### e. Tipe Perangkat
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Tipe | Text | Ya |
| Deskripsi | Textarea | Tidak |

**Pola UI:** Halaman dengan tab terpisah untuk setiap kategori (Jenis, Merk, Model, Status, Tipe). Tab Model memiliki filter cascade berdasarkan Jenis dan Merk.

---

### Sub-Modul 4: Fungsi Server (`/master/fungsi-server`)

**Field data:**
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Fungsi | Text | Ya |
| Deskripsi | Textarea | Tidak |

**Pola UI:** Tabel sederhana + SlideOver form.

---

### Sub-Modul 5: Operating System (`/master/operating-system`)

**Field data:**
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama OS | Text | Ya | |
| Penerbit | Text | Ya | |
| Versi | Text | Ya | |
| Tanggal EOS/EOL | Date | Tidak | End of Support / End of Life |
| Deskripsi | Textarea | Tidak | |

**Pola UI:** Tabel dengan kolom tanggal EOS/EOL yang diberi warna badge (merah jika sudah lewat, kuning jika < 6 bulan, hijau jika > 6 bulan). SlideOver form dengan date picker.

---

### Sub-Modul 6: Application Environment (`/master/app-environment`)

**Field data:**
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Environment | Text | Ya |
| Deskripsi | Textarea | Tidak |

**Pola UI:** Tabel sederhana + SlideOver form.

---

### Sub-Modul 7: Awareness Type (`/master/awareness-type`)

**Field data:**
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Tipe | Text | Ya |
| Deskripsi | Textarea | Tidak |

**Pola UI:** Tabel sederhana + SlideOver form.

---

### Sub-Modul 8: Layanan Keamanan (`/master/layanan-keamanan`)

**Field data:**
| Field | Tipe | Wajib |
|:------|:-----|:------|
| Nama Layanan | Text | Ya |
| Deskripsi | Textarea | Tidak |

**Pola UI:** Tabel sederhana + SlideOver form.

---

### Sub-Modul 9: Range Nilai Kuis (`/master/range-nilai-kuis`)

**Struktur master-detail:**

#### Master — Skema Range
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Skema | Text | Ya | Nama skema penilaian |
| Deskripsi | Textarea | Tidak | |

#### Detail — Range Nilai (child of Skema)
| Field | Tipe | Wajib | Keterangan |
|:------|:-----|:------|:-----------|
| Nama Range | Text | Ya | Contoh: "Baik", "Cukup", "Kurang" |
| Nilai Minimum | Number | Ya | Batas bawah range |
| Nilai Maksimum | Number | Ya | Batas atas range |
| Warna | Color (Hex) | Ya | Dipilih via color picker |
| Skema (FK) | Reference | Ya | Relasi ke skema induk |
| Deskripsi | Textarea | Tidak | |

**Pola UI:** Halaman utama menampilkan daftar skema. Klik skema membuka detail view dengan tabel range nilai di dalamnya. Form range nilai memiliki komponen **Color Picker** untuk memilih warna indikator. Preview warna ditampilkan sebagai badge berwarna di tabel.

**Validasi khusus:**
- Range nilai tidak boleh tumpang tindih (overlap) dalam satu skema.
- Nilai minimum harus lebih kecil dari nilai maksimum.

---

## 5. Persyaratan Non-Fungsional

- **Validasi**: Semua field wajib harus divalidasi di sisi klien dan server.
- **Konfirmasi Hapus**: Operasi hapus harus menampilkan dialog konfirmasi.
- **Pesan Error**: Semua pesan error ditampilkan dalam Bahasa Indonesia.
- **Pagination**: Tabel dengan > 10 baris harus menggunakan pagination.
- **Pencarian**: Setiap tabel harus memiliki fungsi pencarian teks.

---

## 6. Mitigasi Risiko

| Risiko | Strategi Fallback |
|:-------|:-----------------|
| Data master dihapus yang masih digunakan modul lain | Soft delete + pesan error "Data sedang digunakan" |
| Duplikasi data (nama yang sama) | Validasi unique constraint + pesan "Data sudah ada" |
| Input range nilai yang overlap | Validasi overlap di frontend dan backend |

---

## 7. Catatan Implementasi

> [!NOTE]
> Semua sub-modul Master Data mengikuti pola CRUD yang sama. Developer disarankan membuat **komponen generik reusable** (GenericCrudTable, GenericCrudForm) yang dapat dikonfigurasi untuk setiap sub-modul, kecuali sub-modul dengan pola khusus (Lokasi, Detail Perangkat, Range Nilai Kuis).
