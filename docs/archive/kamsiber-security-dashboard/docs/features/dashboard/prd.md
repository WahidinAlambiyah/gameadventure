# PRD: Main Dashboard

**Nama Fitur:** Main Dashboard
**Status:** `[Pending Requirements]`
**Pemilik:** @product-management
**Modul:** General (G2)

---

## 1. Deskripsi

Halaman Dashboard adalah landing page utama setelah pengguna berhasil login. Halaman ini akan menampilkan ringkasan metrik dan informasi keamanan penting dari seluruh modul Kamsiber.

> [!IMPORTANT]
> **Status: Pending Requirements**
> Konten dan layout dashboard belum ditentukan. Halaman ini akan dirancang setelah modul-modul data utama selesai dibangun, agar widget dan metrik yang ditampilkan didasarkan pada data yang sudah tersedia.

---

## 2. User Stories

- Sebagai **Operator**, saya ingin melihat ringkasan metrik keamanan pada halaman utama, agar saya dapat memantau kondisi keamanan secara cepat.
- Sebagai **Auditor**, saya ingin melihat status kepatuhan dan temuan terbuka pada dashboard, agar saya tahu area yang memerlukan perhatian.

---

## 3. Kandidat Widget (Tentatif)

Berikut adalah kandidat widget yang mungkin ditampilkan di dashboard. Daftar ini akan difinalisasi setelah modul data terkait selesai:

- [ ] Jumlah total perangkat/server terdaftar (dari modul Technology)
- [ ] Jumlah OS mendekati/melewati EOS/EOL (dari Master Data)
- [ ] Status permintaan layanan keamanan terbuka (dari Operations)
- [ ] Ringkasan temuan VA/Pentest terbuka (dari Operations)
- [ ] Skor awareness rata-rata (dari Security Awareness)
- [ ] Status integrasi pihak ketiga (dari Integration)
- [ ] Kegiatan terbaru (activity feed)

---

## 4. Catatan

Dokumen ini akan diperbarui secara signifikan setelah persyaratan dashboard difinalisasi. Developer **tidak perlu** mengimplementasikan halaman ini sampai status berubah dari `[Pending Requirements]`.
