# PRD: Aplikasi

**Nama Fitur:** Aplikasi
**Status:** `[Next Phase]`
**Pemilik:** @product-management
**Modul:** Technology (T4)

---

## 1. Deskripsi Singkat

Modul Aplikasi mengelola aplikasi-aplikasi yang berjalan di berbagai environment (development, staging, production, dll.). Setiap environment dari suatu aplikasi memiliki satu atau beberapa domain terkait.

---

## 2. User Stories

- Sebagai **Operator**, saya ingin mengelola aplikasi yang berjalan di berbagai environment, agar setiap aplikasi beserta domain terkaitnya dapat dipantau.

---

## 3. Ketergantungan Modul

- **Master Data — Application Environment**: Untuk referensi environment.
- **Domain (T3)**: Setiap environment aplikasi memiliki domain terkait.
- **VA (O2) & Pentest (O3)**: Operasi VA/Pentest dilakukan terhadap aplikasi.

---

> [!NOTE]
> **Status: Next Phase**
> Detail persyaratan akan dilengkapi oleh developer yang ditugaskan. File `design.md` yang sudah ada di folder ini berisi spesifikasi awal UI.
