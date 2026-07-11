# PRD: Login

**Nama Fitur:** Login
**Status:** `[Pending Integration]`
**Pemilik:** @product-management
**Modul:** General (G1)

---

## 1. Deskripsi

Halaman login adalah pintu masuk aplikasi Kamsiber. Autentikasi pengguna akan ditangani oleh **sistem pihak ketiga** yang belum ditentukan.

> [!WARNING]
> **Status: Pending Integration**
> Sistem autentikasi pihak ketiga belum ditentukan. Untuk saat ini, halaman login menggunakan **tombol placeholder** yang langsung mengarahkan pengguna ke Dashboard tanpa proses autentikasi sesungguhnya.

---

## 2. User Stories

- Sebagai **Pengguna**, saya ingin masuk ke aplikasi Kamsiber melalui sistem autentikasi pihak ketiga, agar identitas saya terverifikasi secara aman.

---

## 3. Persyaratan Sementara (Placeholder)

### Halaman Login (`/login`)
- Menampilkan logo Kamsiber.
- Menampilkan judul "Selamat Datang di Kamsiber".
- Menampilkan **satu tombol login placeholder** bertuliskan "Masuk" yang langsung redirect ke `/dashboard`.
- Tidak ada form input username/password saat ini.
- Layout: Auth Layout (centered, tanpa sidebar).

### Perilaku Routing
- Pengguna yang belum login (session kosong) dialihkan ke `/login`.
- Pengguna yang sudah login (session aktif) dialihkan ke `/dashboard`.
- Untuk sementara, klik tombol "Masuk" langsung set session dummy dan redirect.

---

## 4. Catatan Integrasi (Untuk Fase Selanjutnya)

Ketika sistem autentikasi pihak ketiga telah ditentukan, dokumen ini harus diperbarui dengan:
- [ ] Nama dan tipe sistem autentikasi (SSO, OAuth2, SAML, dll.)
- [ ] Endpoint autentikasi
- [ ] Alur token (access token, refresh token)
- [ ] Pemetaan peran/hak akses dari sistem pihak ketiga ke peran Kamsiber
- [ ] Alur logout
