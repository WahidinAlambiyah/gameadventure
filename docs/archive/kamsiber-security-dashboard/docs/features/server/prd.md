# PRD: Server

**Nama Fitur:** Server
**Status:** `[Next Phase]`
**Pemilik:** @product-management
**Modul:** Technology (T2)

---

## 1. Deskripsi Singkat

Modul Server mengelola server logis yang berjalan di atas perangkat bare metal. Setiap server memiliki operating system dan dapat menjadi host untuk satu atau beberapa domain aplikasi.

---

## 2. User Stories

- Sebagai **Operator**, saya ingin mengelola server logis yang berjalan di atas bare metal, agar pemetaan server-ke-hardware tersedia.

---

## 3. Ketergantungan Modul

- **Bare Metal (T1)**: Server berjalan di atas bare metal.
- **Master Data — Operating System**: Untuk referensi OS yang digunakan server.
- **Master Data — Fungsi Server**: Untuk referensi fungsi server.
- **Domain (T3)**: Domain akan mereferensikan server sebagai host.

---

> [!NOTE]
> **Status: Next Phase**
> Detail persyaratan akan dilengkapi oleh developer yang ditugaskan. File `design.md` yang sudah ada di folder ini berisi spesifikasi awal UI.
