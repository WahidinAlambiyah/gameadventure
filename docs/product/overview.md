# Overview Produk

BacaNgaji Adventure membantu anak usia 4–8 tahun berlatih membaca Bahasa Indonesia dan mengenal dasar huruf Hijaiyah melalui pengalaman belajar berbentuk petualangan.

## Pengguna dan aktor

- **Parent** memiliki akun, membuat `ChildProfile`, mengatur batas bermain, membuka parent gate, dan melihat progress.
- **Child Profile actor** memilih adventure dan menyelesaikan level dalam session parent; actor ini bukan auth user.
- **Admin dan content roles** disiapkan untuk pengelolaan platform dan content, tetapi operational flow-nya belum semuanya lengkap.

## Learning adventures

- **SastraNusantara**: latihan membaca Bahasa Indonesia berbasis suku kata dan phonics awal.
- **HijaiyahIsland**: pengenalan huruf Hijaiyah, harakat dasar, dan konsep awal membaca Al-Qur'an.

Content demo memungkinkan adventure map dan gameplay flow diverifikasi. Repository belum membuktikan curriculum produksi yang lengkap.

Prinsip produk adalah parent-owned identity, minimal child data, dan server-authoritative gameplay. Lihat [`feature-status.md`](feature-status.md) untuk kemampuan aktual dan [`roadmap.md`](roadmap.md) untuk riwayat phase.
