# Kamsiber Backend Architecture Log

## Konfigurasi Infrastruktur & Dependensi *(18 Juni 2026)*

### Pembaruan *Stack* Teknologi Terkini
- **FastAPI & Uvicorn**: Peningkatan modul ke `fastapi==0.115.6` dan `uvicorn[standard]==0.34.0` guna memastikan performa paling *up-to-date*.
- **Psycopg 3**: Beralih dari modul lawas `psycopg2-binary` menjadi `psycopg[binary]==3.3.4` (Psycopg generasi 3). Pembaruan ini sukses menuntaskan masalah *error compile* C++ (`Microsoft Visual C++ 14.0 or greater is required`) saat menginstal modul *database* menggunakan Python 3.14 di Windows.
- **SQLModel**: Dipertahankan keberadaannya (`>=0.0.19`) untuk memastikan integrasi modul bawaan `database.py` tetap berjalan normal bersama `sqlalchemy==2.0.50`.

### Integrasi Keamanan (Security & CORS)
- **Migrasi .env**: Melakukan pemulihan (*recovery*) konfigurasi rahasia (*secrets*) dari *backend* versi lama. Mengimpor serangkaian variabel JWT (seperti `SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES`, dll.) dan daftar URL `CORS_ORIGINS`.
- **Driver Database**: Melakukan penyesuaian URI pada `.env` dan `.env.example` dari `postgresql://` menjadi `postgresql+psycopg://` mengikuti perpindahan dari Psycopg2 ke Psycopg3.
- **Schema Pydantic Settings (`config.py`)**: Memodifikasi arsitektur `BaseSettings` di `backend/core/config.py` untuk sanggup membaca konfigurasi JWT dan mem- *parsing* daftar String CORS secara dinamis melalui properti pembantu (`@property def cors_origins_list`).
- **Penerapan Middleware (`main.py`)**: Menanamkan *whitelist* CORS dinamis langsung ke dalam pengatur `CORSMiddleware`, menggeser parameter statis `["*"]` lama, memastikan *frontend* lama maupun baru bisa mengakses secara legal.

### Skrip Eksekusi (*Runners*) & Editor
- **`run_app_be.ps1`**: Diciptakan skrip PowerShell otomatis di *root* yang bertugas membangun *Virtual Environment* (`venv`), menginstal dependensi (`requirements.txt`), menyalin berkas `.env`, dan mengeksekusi `uvicorn` di **port 8000** (`http://127.0.0.1:8000`). Penggunaan IP `127.0.0.1` dipilih agar tautan *API* bisa di-klik (*CTRL+Click*) langsung dari Terminal Windows.
- **`run_app_fe.ps1`**: Diciptakan skrip kembaran untuk mengecek ketersediaan `node_modules` (mengeksekusi `npm install` bila belum ada) lalu memutar *server* Next.js di **port 3000**.
- **.vscode/settings.json**: Mendaftarkan lintasan `backend/venv/Scripts/python.exe` pada `python.defaultInterpreterPath` untuk menumpas keluhan "Import could not be resolved" dari Pylance (VS Code).

---

## Scaffold Model Otomatis dari Database *(18 Juni 2026)*

### Latar Belakang
Alih-alih menulis model SQLAlchemy secara manual setiap kali skema database berubah, backend kini menggunakan `sqlacodegen` untuk men-*generate* model langsung dari PostgreSQL. Pendekatan ini memastikan model di kode selalu sinkron dengan kondisi tabel di database tanpa kerja manual.

### Struktur yang Ditambahkan
- **`backend/models/base.py`**: Mendefinisikan `Base(DeclarativeBase)` tunggal yang dipakai bersama oleh seluruh model — baik model buatan tangan maupun hasil scaffold. Memisahkan `Base` ke file ini mencegah konflik metadata saat Alembic melakukan *autogenerate*.
- **`backend/models/scaffolded_models.py`**: File hasil *generate* otomatis oleh `sqlacodegen` — **jangan diedit secara manual**. Berisi 107 class (±2.800 baris) yang mewakili seluruh tabel di database `dashboard_kamsiber`.
- **`backend/models/__init__.py`**: Re-export seluruh model via `from models.scaffolded_models import *` sehingga bisa diimpor langsung dengan `from models import NamaModel`.
- **`backend/models/run_scafold.ps1`**: Skrip PowerShell untuk regenerasi model. Letaknya di dalam folder `models/` agar mudah ditemukan dan bisa di-*push* ke repositori.

### Cara Kerja Skrip `run_scafold.ps1`
Script dibuat dengan `Set-Location "$PSScriptRoot\.."` sehingga selalu berjalan relatif terhadap root `backend/` meskipun dijalankan dari dalam folder `models/`. Setelah `sqlacodegen` selesai, tiga *post-processing* dijalankan otomatis:
1. **Fix `uuid` namespace**: `import uuid` diganti `import uuid as python_uuid` dan seluruh anotasi `uuid.UUID` diganti `python_uuid.UUID`. Tanpa ini, 47 kolom bernama `uuid` di model akan menimpa (*shadow*) modul `uuid` Python dan menyebabkan error.
2. **Fix duplikasi `Base`**: Definisi `class Base(DeclarativeBase): pass` bawaan sqlacodegen dihapus dan diganti `from models.base import Base` agar semua model terdaftar di satu metadata yang sama.
3. **Guard regex CRLF**: Penggantian string menggunakan `.Replace("import uuid\`r\`n", ...)` untuk menangani *line ending* Windows (CRLF), dan lookbehind `(?<!python_)uuid\.UUID` untuk mencegah *double-replace* yang menghasilkan `python_python_uuid`.

### Dependensi Baru
- **`sqlacodegen==3.0.0`**: Ditambahkan ke `requirements.txt`. Hanya diperlukan saat menjalankan scaffold (bukan saat runtime produksi).

### Cara Menggunakan Model
```python
from models.scaffolded_models import CTI, Compliance, AbacPolicy
# atau
from models import CTI, Compliance
```

### Kapan Jalankan Ulang Scaffold
Jalankan `.\models\run_scafold.ps1` dari direktori `backend/` setiap kali:
- Ada migrasi database baru (tabel/kolom baru atau perubahan tipe).
- Memulai implementasi fitur yang bergantung pada tabel yang baru dibuat.

### Catatan Pylance
File `scaffolded_models.py` dikecualikan dari analisis Pylance via `.vscode/settings.json` (`python.analysis.ignore`) karena merupakan file *auto-generated* yang tidak perlu diperiksa *type-check* secara manual.
