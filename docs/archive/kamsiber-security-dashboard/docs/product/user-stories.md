# User Stories — Kamsiber

**Versi:** 1.0
**Terakhir Diperbarui:** 2026-06-18
**Status:** Draft

---

## Daftar Singkatan Peran

| Kode | Peran |
|:-----|:------|
| **Admin** | Administrator sistem Kamsiber |
| **Operator** | Staf operasional keamanan siber |
| **Viewer** | Pengguna dengan akses baca-saja |
| **Auditor** | Peninjau kepatuhan dan pelaporan |

> [!NOTE]
> Peran-peran di atas bersifat tentatif. Manajemen peran dan hak akses akan didefinisikan lebih detail pada fase integrasi autentikasi.

---

## A. General

### G1 — Login `[Pending Integration]`
- Sebagai **Pengguna**, saya ingin masuk ke aplikasi Kamsiber melalui sistem autentikasi pihak ketiga, agar identitas saya terverifikasi secara aman.

### G2 — Main Dashboard `[Pending Requirements]`
- Sebagai **Operator**, saya ingin melihat ringkasan metrik keamanan pada halaman utama, agar saya dapat memantau kondisi keamanan secara cepat.

### G3 — Master Data
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Sertifikasi**, agar daftar sertifikasi keamanan selalu mutakhir.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Lokasi** secara hierarkis (Site → Ruangan → Rak), agar inventaris lokasi fisik perangkat terdokumentasi dengan benar.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Detail Perangkat** (jenis, merk, model, status, tipe), agar klasifikasi perangkat konsisten di seluruh aplikasi.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Fungsi Server**, agar setiap server dapat dikategorikan berdasarkan fungsinya.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Operating System** beserta tanggal EOS/EOL, agar risiko kedaluwarsa OS terpantau.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Application Environment**, agar pembagian lingkungan aplikasi (dev, staging, production, dll.) terstandardisasi.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Awareness Type**, agar tipe kampanye awareness dapat dikategorikan.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Layanan Keamanan**, agar daftar layanan keamanan yang tersedia selalu terbarui.
- Sebagai **Admin**, saya ingin mengelola (CRUD) data **Range Nilai Kuis** dengan skema pewarnaan, agar hasil scoring kuis awareness dapat divisualisasikan dengan jelas.

### G4 — Compliance `[Next Phase]`
- Sebagai **Auditor**, saya ingin mengelola kategori dan standar kepatuhan keamanan, agar audit kepatuhan dapat dilakukan secara terstruktur.

---

## B. Human Resources

### H1 — Struktur Organisasi
- Sebagai **Admin**, saya ingin mengelola (CRUD) struktur organisasi dengan 6 level hierarki (L0–L5), agar pemetaan organisasi PLN tercermin secara akurat di aplikasi.
- Sebagai **Operator**, saya ingin melihat struktur organisasi secara hierarkis, agar saya memahami cakupan tanggung jawab setiap unit.

### H2 — Jabatan
- Sebagai **Admin**, saya ingin mengelola (CRUD) data jabatan yang terhubung ke badan organisasi, agar setiap jabatan terpetakan ke unit organisasi yang tepat.
- Sebagai **Operator**, saya ingin mencari jabatan berdasarkan nama atau organisasi, agar saya dapat menemukan PIC yang bertanggung jawab.

### H3 — People `[Next Phase]`
- Sebagai **Admin**, saya ingin mengelola daftar sumber daya manusia beserta informasi detail mereka, agar data personel keamanan selalu mutakhir.

### H4 — Security Awareness `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola program, event, dan kampanye awareness keamanan, agar partisipasi dan efektivitas awareness terpantau.
- Sebagai **Operator**, saya ingin melihat scoring keamanan per aset/personel, agar area risiko tinggi dapat diprioritaskan.

---

## C. Technology

### T1 — Bare Metal `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola inventaris perangkat fisik server (bare metal), agar aset fisik infrastruktur terdokumentasi.

### T2 — Server `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola server logis yang berjalan di atas bare metal, agar pemetaan server-ke-hardware tersedia.

### T3 — Domain `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola domain aplikasi yang berjalan di server, agar pemetaan domain-ke-server terdokumentasi.

### T4 — Aplikasi `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola aplikasi yang berjalan di berbagai environment, agar setiap aplikasi beserta domain terkaitnya dapat dipantau.

---

## D. Integration

### I1 — Integration `[Next Phase]`
- Sebagai **Admin**, saya ingin mengonfigurasi koneksi ke sistem pihak ketiga (Fortify, Nessus, Gophish, UEM, dll.), agar data keamanan dari berbagai sumber dapat diambil secara otomatis.

---

## E. Operations

### O1 — Security Service `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola permintaan layanan keamanan (Port Open, VPN access, dll.), agar setiap permintaan terdokumentasi dan dapat dilacak.
- Sebagai **Operator**, saya ingin membuat dokumen/email terkait permintaan layanan keamanan secara otomatis, agar proses administratif lebih efisien.

### O2 — VA (Vulnerability Assessment) `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola operasi VA yang dilakukan terhadap aplikasi, agar hasil assessment terdokumentasi.

### O3 — Pentest (Penetration Testing) `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola operasi pentest terhadap aplikasi, agar hasil pengujian terdokumentasi.

### O4 — Follow Up `[Next Phase]`
- Sebagai **Operator**, saya ingin mengelola tindak lanjut mitigasi untuk setiap temuan dari VA/Pentest, agar proses remediasi dapat dipantau hingga selesai.
