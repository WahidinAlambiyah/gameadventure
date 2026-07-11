# SonarQube Standards & Prohibited Rules

> Dokumen ini menjadi **acuan wajib** bagi semua AI agent saat menulis kode untuk proyek kamsiber.
> Setiap rule di bawah ini **harus dipatuhi** agar kode lolos analisis SonarQube tanpa issue baru.
> Rule diambil dari SonarQube Server v26 dan diperkaya dari violation history proyek ini.

---

## Cara Membaca Dokumen Ini

- **Rule ID** — kode S-number dari SonarQube (contoh: `S3776`)
- **Severity** — BLOCKER > CRITICAL > MAJOR > MINOR
- **Type** — BUG / CODE_SMELL / VULNERABILITY / SECURITY_HOTSPOT

---

## FRONTEND (TypeScript / React / Next.js)

### 1. Kompleksitas Kognitif

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S3776 | CRITICAL | CODE_SMELL | Cognitive Complexity fungsi **maksimal 15**. Pecah fungsi besar menjadi fungsi-fungsi kecil. |
| S1067 | CRITICAL | CODE_SMELL | Ekspresi kondisional tidak boleh terlalu panjang/bercabang. |

**Cara fix:** Ekstrak logika bercabang ke fungsi terpisah. Hindari nested ternary lebih dari 1 level.

---

### 2. React Hooks

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S6440 | MAJOR | BUG | Hooks **harus dipanggil di urutan yang sama** setiap render — jangan dalam kondisi/loop. |
| S6442 | MAJOR | BUG | `useState` tidak boleh dipanggil di dalam body render secara kondisional. |
| S6443 | MAJOR | BUG | Jangan panggil state setter dengan nilai state itu sendiri (no-op). |
| S6481 | MAJOR | CODE_SMELL | Nilai `Context.Provider` harus memiliki identitas stabil (gunakan `useMemo`). |
| S6756 | MAJOR | BUG | `setState` yang mereferensi state sebelumnya **harus gunakan callback form** `setState(prev => ...)`. |
| S6759 | MINOR | CODE_SMELL | Props komponen React **harus bertipe read-only** (`Readonly<Props>`). |
| S6754 | MINOR | CODE_SMELL | Return `useState` harus didestrukturisasi simetris: `const [value, setValue]`. |
| S6957 | MINOR | CODE_SMELL | Jangan gunakan deprecated React API (`componentWillMount`, dll). |

---

### 3. Aksesibilitas (a11y)

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S1082 | MAJOR | CODE_SMELL | Setiap event mouse (`onClick`) **harus ada pasangan keyboard event** (`onKeyDown`/`onKeyPress`). |
| S6847 | MAJOR | CODE_SMELL | Elemen non-interaktif (`div`, `span`) **tidak boleh memiliki event handler** kecuali ada `role` yang sesuai. |
| S6848 | MAJOR | CODE_SMELL | DOM element non-interaktif tidak boleh memiliki interactive handler tanpa role. |
| S6852 | MAJOR | CODE_SMELL | Elemen dengan interactive role **harus mendukung fokus** (keyboard navigable). |
| S6853 | MAJOR | CODE_SMELL | `<label>` **harus memiliki teks label** dan dihubungkan ke kontrolnya (`htmlFor` atau wrap). |
| S6821 | MAJOR | CODE_SMELL | ARIA role harus valid dan non-abstract. |
| S6822 | MAJOR | CODE_SMELL | Jangan tambahkan ARIA role yang sudah implisit dari tag HTML-nya. |
| S6843 | MAJOR | CODE_SMELL | Elemen interaktif tidak boleh mendapat non-interactive ARIA role. |
| S6844 | MAJOR | CODE_SMELL | Tag `<a>` tidak boleh dipakai sebagai tombol — gunakan `<button>`. |
| S6819 | MAJOR | CODE_SMELL | Gunakan tag semantik HTML (`<button>`, `<nav>`) daripada `role="button"`. |
| S6825 | MAJOR | CODE_SMELL | Elemen yang bisa difokus tidak boleh memiliki `aria-hidden="true"`. |
| S6827 | MINOR | CODE_SMELL | Tag `<a>` harus memiliki konten yang dapat diakses (teks atau `aria-label`). |

---

### 4. Kondisi & Logika Boolean

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S7735 | MINOR | CODE_SMELL | Jangan gunakan kondisi negasi jika ada `else` — balik urutannya agar positif duluan. |
| S7736 | MINOR | CODE_SMELL | Jangan gunakan ekspresi negasi dalam equality check. |
| S2589 | MAJOR | CODE_SMELL | Ekspresi boolean tidak boleh selalu true/false (gratuitous). |
| S1125 | MINOR | CODE_SMELL | Jangan bandingkan dengan literal boolean: `if (x === true)` → `if (x)`. |
| S6509 | MINOR | CODE_SMELL | Hapus double boolean cast: `!!x` dalam konteks yang sudah boolean. |

**Panduan tambahan:**
- Nested ternary **dilarang** — ekstrak ke variabel atau `if/else` terpisah.
- Hindari leaked value di JSX: `{count && <Component/>}` → `{count > 0 && <Component/>}`.

---

### 5. Optional Chaining & Null Safety

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S6582 | MAJOR | CODE_SMELL | Gunakan optional chaining `?.` daripada `&&` untuk null check berantai. |
| S6523 | MAJOR | CODE_SMELL | Jangan gunakan optional chaining jika `undefined` pada titik itu akan throw error. |

---

### 6. Import & Variabel

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S1128 | MINOR | CODE_SMELL | Hapus import yang tidak digunakan. |
| S2208 | CRITICAL | CODE_SMELL | Jangan gunakan wildcard import `import * from`. |
| S3353 | CRITICAL | CODE_SMELL | Variabel yang tidak pernah di-reassign harus dideklarasi `const`. |
| S1854 | MAJOR | CODE_SMELL | Hapus assignment yang tidak berguna (nilai tidak pernah dibaca setelah di-assign). |
| S4165 | MAJOR | CODE_SMELL | Hapus assignment yang redundan (assign nilai yang sama berulang). |
| S1656 | MAJOR | CODE_SMELL | Jangan assign variabel ke dirinya sendiri. |

---

### 7. Kode Mati & Komentar

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S125 | MAJOR | CODE_SMELL | **Hapus kode yang dikomentar** — gunakan git jika perlu menyimpan history. |
| S6438 | MAJOR | CODE_SMELL | Komentar di dalam JSX harus dalam curly brace `{/* komentar */}`. |

---

### 8. String & Array

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S7781 | MAJOR | CODE_SMELL | Gunakan `String.replaceAll()` daripada `String.replace()` dengan regex global (`/pattern/g`). |
| S6959 | MAJOR | BUG | `Array.reduce()` **harus menyertakan initial value** sebagai argumen kedua. |

**Panduan tambahan:**
- Untuk sort alfabetis, gunakan `array.sort((a, b) => a.localeCompare(b))` — jangan `sort()` tanpa comparator.
- Jangan gunakan array index sebagai `key` di React list — gunakan ID unik yang stabil.
- Gunakan `.at(-1)` daripada `[array.length - 1]`.

---

### 9. Browser Global & Environment

**Panduan:**
- Gunakan `globalThis.window` atau `globalThis` daripada akses langsung `window` untuk kompatibilitas SSR/Next.js.
- Saat membuat `Error`, selalu sertakan pesan: `new Error("pesan deskriptif")`.

---

### 10. Class Members

**Panduan:**
- Member class yang tidak pernah di-reassign harus ditandai `readonly`.
- Contoh: `readonly timeoutDuration`, `readonly onTimeoutCallback`, `readonly events`.

---

## BACKEND (Python / FastAPI)

### 1. DateTime — Wajib Gunakan Timezone-Aware

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S6903 | CRITICAL | BUG | **Jangan** gunakan `datetime.utcnow()` atau `datetime.utcfromtimestamp()`. Gunakan `datetime.now(timezone.utc)`. |
| S6887 | CRITICAL | BUG | Jangan lewatkan `pytz.timezone` langsung ke constructor `datetime.datetime`. |
| S6890 | CRITICAL | CODE_SMELL | Gunakan `zoneinfo` (stdlib Python 3.9+) daripada `pytz`. |
| S6886 | CRITICAL | BUG | Jangan bandingkan offset-naive dan offset-aware datetime object. |

```python
# SALAH
from datetime import datetime
now = datetime.utcnow()

# BENAR
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
```

---

### 2. FastAPI — Dependency Injection & Route

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S8410 | MINOR | CODE_SMELL | Gunakan `Annotated` type hints untuk FastAPI dependency injection. |
| S8411 | BLOCKER | BUG | Path parameter **harus tercantum** dalam signature fungsi route. |
| S8409 | MINOR | CODE_SMELL | Jangan cantumkan `response_model` yang redundan jika sudah ada return type annotation. |
| S8415 | MAJOR | CODE_SMELL | **Semua HTTPException harus didokumentasikan** di parameter `responses` endpoint. |

```python
# SALAH
@router.get("/items/{id}")
async def get_item(db: Session = Depends(get_db)):
    ...

# BENAR
from typing import Annotated
@router.get("/items/{id}", responses={404: {"description": "Not found"}})
async def get_item(id: int, db: Annotated[Session, Depends(get_db)]):
    ...
```

---

### 3. Duplikasi Literal String

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S1192 | CRITICAL | CODE_SMELL | String literal yang muncul **3+ kali** harus dijadikan konstanta. |

```python
# SALAH — string muncul berkali-kali
raise HTTPException(404, "Lokasi tidak ditemukan")
...
raise HTTPException(404, "Lokasi tidak ditemukan")

# BENAR
LOKASI_NOT_FOUND = "Lokasi tidak ditemukan"
raise HTTPException(status_code=404, detail=LOKASI_NOT_FOUND)
```

---

### 4. Keamanan — Secrets & Credentials

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S6418 | BLOCKER | VULNERABILITY | **Jangan hardcode secrets/token** dalam kode. Gunakan environment variable. |
| S2068 | MAJOR | VULNERABILITY | Jangan hardcode credentials (password, API key) di kode sumber. |

---

### 5. Exception Handling

| Rule | Severity | Type | Aturan |
|------|----------|------|--------|
| S112 | MAJOR | CODE_SMELL | Jangan raise `Exception` atau `BaseException` langsung — buat custom exception class. |
| S5632 | BLOCKER | BUG | Exception yang di-raise harus turunan dari `BaseException`. |
| S5708 | BLOCKER | BUG | Exception yang di-catch harus turunan dari `BaseException`. |
| S5709 | CRITICAL | BUG | Custom exception class harus inherit dari `Exception` atau subclass-nya. |
| S5714 | BLOCKER | BUG | Jangan gunakan ekspresi boolean dalam `except`: `except (TypeError or ValueError)` → `except (TypeError, ValueError)`. |
| S3984 | MAJOR | CODE_SMELL | Exception yang dibuat tapi tidak di-raise adalah bug. |

---

## LOG VIOLATION HISTORY

> Daftar issue yang pernah muncul di proyek ini — untuk referensi agar tidak terulang.

### kamsiber-frontend

| Tanggal | Issue |
|---------|-------|
| 2026-06-19 | Nested ternary — ekstrak ke variabel/fungsi terpisah |
| 2026-06-19 | Props komponen tidak bertipe read-only (`Readonly<Props>`) |
| 2026-06-19 | Elemen non-interaktif dengan onClick tanpa keyboard listener |
| 2026-06-19 | Elemen non-native interaktif tanpa role + keyboard support |
| 2026-06-19 | Useless assignment ke variable "loading" |
| 2026-06-19 | Unexpected negated condition |
| 2026-06-19 | Form label tidak terhubung ke kontrol |
| 2026-06-19 | Unknown CSS property `wrap-break-word` |
| 2026-06-19 | Cognitive Complexity 19 (maks 15) |
| 2026-06-19 | `new Error()` tanpa pesan |
| 2026-06-19 | `sort()` tanpa `localeCompare` comparator |
| 2026-06-18 | Useless assignment ke variable "setUser" |
| 2026-06-18 | Kode dikomentar — harus dihapus |
| 2026-06-18 | `React.useMemo` dipanggil secara kondisional |
| 2026-06-18 | Gunakan `String.replaceAll()` bukan `String.replace()` |
| 2026-06-18 | Cognitive Complexity 20 (maks 15) |
| 2026-06-18 | Array index sebagai `key` di React list |
| 2026-06-18 | Gunakan optional chaining `?.` |
| 2026-06-18 | Leaked value di kondisi JSX |
| 2026-06-18 | Import `Layers`, `useMemo`, `Bookmark` tidak digunakan |
| 2026-06-18 | `FormEvent` deprecated |
| 2026-06-18 | `timeoutDuration`, `onTimeoutCallback`, `events` harus `readonly` |
| 2026-06-18 | Gunakan `globalThis.window` / `globalThis` bukan `window` |
| 2026-06-17 | Ambiguous spacing setelah elemen span |
| 2026-06-17 | Redundant assignment — `variant` sudah memiliki nilai tersebut |
| 2026-06-17 | Cognitive Complexity 22 (maks 15) |
| 2026-06-17 | Gunakan `.at(-1)` bukan `[array.length - 1]` |

### kamsiber-backend

| Tanggal | Issue |
|---------|-------|
| 2026-06-19 | SonarQube token ter-hardcode di kode — harus dicabut dan dihapus |
| 2026-06-19 | Gunakan `Annotated` type hints untuk FastAPI dependency injection |
| 2026-06-19 | `datetime.datetime.utcnow()` deprecated — gunakan `datetime.now(timezone.utc)` |
| 2026-06-19 | HTTPException 404, 409, 422 tidak didokumentasikan di `responses` |
| 2026-06-19 | Literal "Lokasi tidak ditemukan" duplikat 4x — buat konstanta |
| 2026-06-19 | Literal "Version not found" duplikat 3x — buat konstanta |
| 2026-06-18 | Literal `'uuid_generate_v7()'` duplikat 107x dalam SQL migration |
| 2026-06-18 | Literal `'now()'` duplikat 21x dalam SQL migration |
| 2026-06-18 | Berbagai literal SQL lain duplikat 3-27x — buat konstanta |
