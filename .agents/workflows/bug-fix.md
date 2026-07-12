# Workflow Bug Fix

1. Reproduksi masalah atau catat mengapa reproduksi belum memungkinkan.
2. Nyatakan expected versus actual behavior dan scope terdampak.
3. Identifikasi root cause dari implementation evidence, bukan gejala saja.
4. Pilih perbaikan terkecil yang tidak memperluas behavior tanpa kebutuhan.
5. Tambahkan regression test pada layer paling tepat, termasuk negative/security case bila relevan.
6. Jalankan focused validation dan checks tambahan sesuai risiko.
7. Laporkan file, behavior, root cause, hasil test/manual validation, impact, dan limitation.
