# PRD: Bare Metal

**Nama Fitur:** Bare Metal
**Status:** `[Next Phase]`
**Pemilik:** @product-management
**Modul:** Technology (T1)

---

## 1. Deskripsi Singkat

Modul Bare Metal mengelola inventaris perangkat fisik server (hardware). Mencakup informasi spesifikasi hardware, lokasi fisik (rak, ruangan, site), status operasional, dan pemetaan ke server logis yang berjalan di atasnya.

---

## 2. User Stories

- Sebagai **Operator**, saya ingin mengelola inventaris perangkat fisik server (bare metal), agar aset fisik infrastruktur terdokumentasi.

---

## 3. Ketergantungan Modul

- **Master Data — Lokasi**: Untuk referensi site, ruangan, dan rak tempat bare metal berada.
- **Master Data — Detail Perangkat**: Untuk referensi jenis, merk, dan model perangkat.
- **Server (T2)**: Modul Server akan mereferensikan bare metal sebagai host fisik.

---

> [!NOTE]
> **Status: Next Phase**
> Detail persyaratan akan dilengkapi oleh developer yang ditugaskan.
