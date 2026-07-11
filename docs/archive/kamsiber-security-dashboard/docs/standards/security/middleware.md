# Spesifikasi Middleware & Security Layer — Kamsiber

**Referensi standar:** CADAS (`zpic/cadas/cadas-service`) — Go/Gin  
**Target implementasi:** Kamsiber Backend (FastAPI/Python) + Frontend (Next.js/React)  
**Standar yang dipenuhi:** OWASP Top 10, PLN Security Standard

---

## Status Saat Ini

| Layer | CADAS (Referensi) | Kamsiber (Saat Ini) | Gap |
|-------|:-----------------:|:-------------------:|:---:|
| CORS | ✓ Allowlist ketat | ⚠ `allow_origins=["*"]` | Kritis |
| Security Headers | ✓ Lengkap | ✗ Belum ada | Kritis |
| Rate Limiting | ✓ 3 tier | ✗ Belum ada | Tinggi |
| JWT Auth Middleware | ✓ Cookie + DB session | ⚠ Config ada, belum jalan | Tinggi |
| CSRF Protection | ✓ One-time token | ✗ Belum ada | Tinggi |
| Content-Type Validation | ✓ Per-method | ✗ Belum ada | Sedang |
| Request Size Limits | ✓ Header/query/body | ✗ Belum ada | Sedang |
| Injection Detection | ✓ SQL/XSS/LDAP/OS/LFI | ✗ Belum ada | Sedang |
| CRLF Sanitization | ✓ Header + query | ✗ Belum ada | Sedang |
| File Type Validation | ✓ Extension + MIME | ✗ Belum ada | Sedang |
| Request Timeout | ✓ 20 detik | ✗ Belum ada | Sedang |
| UTF-8 Validation | ✓ Body | ✗ Belum ada | Rendah |
| Response Encryption | ✓ AES-256-GCM (prod) | ✗ Belum ada | Prod-only |
| FE: Security Headers | ✓ via next.config | ✗ Tidak ada | Kritis |
| FE: DOMPurify | ✓ Semua payload | ⚠ Manual replaceAll | Tinggi |
| FE: CSRF Store | ✓ Axios interceptor | ✗ Belum ada | Tinggi |
| FE: Auth Middleware | ✓ Route protection | ✗ Belum ada | Tinggi |
| Docs disabled (prod) | ✓ | ✗ /api/docs terbuka | Sedang |

---

## 1. CORS

### Referensi CADAS
File: `cadas-service/cmd/main.go`

```go
corsHandler := cors.New(cors.Config{
    AllowOriginFunc:  isAllowed,             // env: ALLOW_ORIGIN=https://a.pln.co.id;https://b.pln.co.id
    AllowMethods:     []string{"POST", "GET", "OPTIONS"},
    AllowHeaders:     []string{"Content-Type", "Authorization", "X-CSRF-Token", "X-Visitor-Key"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
})
// Origin tidak di allowlist → log ke DB + return 403
```

### Implementasi Kamsiber (FastAPI)

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # Dari env CORS_ORIGINS (comma-separated)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"],
    max_age=43200,  # 12 jam
)
```

```env
# .env
CORS_ORIGINS=http://localhost:3000,https://kamsiber.pln.co.id
# JANGAN pernah set ke "*" di staging/production
```

**Aturan:** `CORS_ORIGINS=*` hanya boleh di environment `local`. Staging dan production WAJIB menggunakan domain spesifik.

---

## 2. Security Headers

### Referensi CADAS
File: `cadas-service/middleware/middleware.go`

```go
c.Header("Content-Security-Policy",
    "default-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests")
c.Header("Referrer-Policy",           "no-referrer")
c.Header("X-Content-Type-Options",    "nosniff")
c.Header("X-Frame-Options",           "deny")
c.Header("Strict-Transport-Security", "max-age=15724800; includeSubDomains; preload")
c.Header("X-XSS-Protection",          "1; mode=block")
c.Header("X-Permitted-Cross-Domain-Policies", "none")
c.Header("Cross-Origin-Embedder-Policy",  "require-corp")
c.Header("Cross-Origin-Opener-Policy",    "same-origin")
c.Header("Cross-Origin-Resource-Policy",  "same-origin")
c.Header("Permission-Policy",         "geolocation=(), microphone=(), camera=(), payment=(), ...")
c.Header("Cache-Control",             "no-cache, no-store, must-revalidate")
c.Header("Pragma",                    "no-cache")
c.Header("Expires",                   "0")
```

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/security_headers.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; form-action 'self'; base-uri 'self'; "
            "object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
        )
        response.headers["Referrer-Policy"]             = "no-referrer"
        response.headers["X-Content-Type-Options"]      = "nosniff"
        response.headers["X-Frame-Options"]             = "deny"
        response.headers["Strict-Transport-Security"]   = "max-age=15724800; includeSubDomains; preload"
        response.headers["X-XSS-Protection"]            = "1; mode=block"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Opener-Policy"]  = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        response.headers["Cache-Control"]               = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"]                      = "no-cache"
        response.headers["Expires"]                     = "0"
        return response
```

```python
# backend/main.py
app.add_middleware(SecurityHeadersMiddleware)
```

### Frontend (Next.js) — `next.config.ts`

```typescript
const securityHeaders = [
  { key: "Content-Security-Policy",
    value: "default-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'" },
  { key: "Referrer-Policy",           value: "no-referrer" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "deny" },
  { key: "Strict-Transport-Security", value: "max-age=15724800; includeSubDomains; preload" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Permissions-Policy",        value: "geolocation=(), microphone=(), camera=()" },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
  // ...
}
```

---

## 3. Rate Limiting

### Referensi CADAS
File: `cadas-service/middleware/rate_limit.go`

- Algoritma: Token bucket, per IP (unauthenticated) atau per User ID (authenticated)
- **GET:** 100 req/menit
- **POST/PUT/DELETE (Mutate):** 20 req/menit
- **Auth endpoints** (`/api/auth/login`, `/api/auth/refresh`): 100 req/menit (terpisah)
- Header response: `X-Rate-Limit-Limit`, `X-Rate-Limit-Remaining`, `X-Rate-Limit-Reset`
- Cleanup stale entries: setiap 5 menit

### Implementasi Kamsiber (FastAPI)

Gunakan library `slowapi` (wrapper `limits` untuk FastAPI):

```bash
pip install slowapi
```

```python
# backend/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"status": "error", "message": "Too many requests. Please try again later."},
        headers={"Retry-After": str(exc.retry_after)},
    )
```

```python
# backend/main.py
from slowapi import _rate_limit_exceeded_handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Per-endpoint via decorator:
@router.get("")
@limiter.limit("100/minute")
def get_list(request: Request, ...):
    ...

@router.post("")
@limiter.limit("20/minute")
def create(request: Request, ...):
    ...
```

```env
# .env
GET_RATE_LIMIT=100/minute
MUTATE_RATE_LIMIT=20/minute
AUTH_RATE_LIMIT=10/minute   # Auth lebih ketat dari CADAS untuk brute force protection
```

---

## 4. JWT Authentication Middleware

### Referensi CADAS
File: `cadas-service/middleware/middleware.go`

- Signing: HMAC-SHA256
- Access token: 15 menit (env: `JWT_EXPIRATION_TIME_IN_MINUTE`)
- Refresh token: 30 hari (env: `REFRESH_JWT_EXPIRATION_TIME_IN_DAYS`)
- Storage: HttpOnly Cookie (`cadas_token`, `cadas_refresh_token`)
- Validasi: Audience + TokenType + session lookup ke DB
- Cookie flags: `HttpOnly=true`, `Secure=true` (staging/prod), `SameSite=Strict`

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/auth.py
from datetime import datetime, timezone, timedelta
from fastapi import Depends, HTTPException, Cookie
from jose import JWTError, jwt
from core.config import settings

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_ACCESS_TOKEN_EXPIRES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access", "aud": "kamsiber-api"},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

def get_current_user(kamsiber_token: str | None = Cookie(default=None)):
    if not kamsiber_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(
            kamsiber_token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            audience="kamsiber-api",
        )
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

```python
# Penggunaan di endpoint:
@router.get("")
def get_list(current_user=Depends(get_current_user), ...):
    ...
```

```env
# .env
JWT_SECRET_KEY=<min 32 karakter acak>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRES=900    # 15 menit dalam detik
JWT_REFRESH_TOKEN_EXPIRES=2592000  # 30 hari dalam detik
```

**Cookie saat login (set di response):**
```python
response.set_cookie(
    key="kamsiber_token",
    value=access_token,
    httponly=True,
    secure=settings.APP_ENV != "local",  # False hanya di local
    samesite="strict",
    max_age=settings.JWT_ACCESS_TOKEN_EXPIRES,
)
```

---

## 5. CSRF Protection

### Referensi CADAS
File: `cadas-service/middleware/csrf.go`

- Flow: FE → `GET /api/csrf` → BE set cookie `cadas_csrf_token` → FE kirim POST → BE validasi dan hapus cookie (one-time use)
- Method yang diproteksi: POST, PUT, PATCH (bukan GET/OPTIONS/HEAD)
- Dikecualikan: pre-auth endpoints (login, refresh, logout, otp)
- Aktif hanya di: production (disabled di local dan staging)

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/csrf.py
import secrets
from fastapi import Request, HTTPException, Cookie
from starlette.middleware.base import BaseHTTPMiddleware

CSRF_EXCLUDED_PATHS = {
    "/api/v1/auth/login", "/api/v1/auth/refresh",
    "/api/v1/auth/logout", "/api/v1/csrf",
}
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if settings.APP_ENV in ("local", "staging"):
            return await call_next(request)
        if request.method in CSRF_SAFE_METHODS:
            return await call_next(request)
        if request.url.path in CSRF_EXCLUDED_PATHS:
            return await call_next(request)

        csrf_cookie = request.cookies.get("kamsiber_csrf_token")
        if not csrf_cookie:
            raise HTTPException(status_code=403, detail="CSRF token missing")
        # Validasi token via redis/db (lookup by user_id)
        # ... validasi ...
        response = await call_next(request)
        # Hapus cookie setelah digunakan (one-time)
        response.delete_cookie("kamsiber_csrf_token")
        return response

# Endpoint untuk generate token:
@router.get("/csrf")
def get_csrf_token(response: Response, current_user=Depends(get_current_user)):
    token = secrets.token_urlsafe(32)
    # Simpan token ke redis/db dengan user_id sebagai key
    response.set_cookie("kamsiber_csrf_token", token, httponly=False, samesite="strict", secure=True)
    return {"status": "ok"}
```

### Frontend (Next.js) — Axios/Fetch Interceptor

```typescript
// src/utils/api.ts
// Sebelum POST/PUT/PATCH (kecuali auth), ambil CSRF token:
async function getCsrfToken() {
  await fetch("/api/csrf", { credentials: "include" })
}

// Tambahkan ke setiap mutating request via interceptor
```

---

## 6. Content-Type Validation

### Referensi CADAS
File: `cadas-service/middleware/middleware.go`

- POST/PUT/PATCH tanpa Content-Type → 400 Bad Request
- Endpoint reguler: wajib `application/json`
- Endpoint upload (`/upload`, `/import`): wajib `multipart/form-data`

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/content_type.py
from starlette.middleware.base import BaseHTTPMiddleware

MUTATE_METHODS = {"POST", "PUT", "PATCH"}

class ContentTypeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in MUTATE_METHODS:
            ct = request.headers.get("content-type", "")
            path = request.url.path
            is_upload = path.endswith("/upload") or path.endswith("/import")

            if is_upload and not ct.startswith("multipart/form-data"):
                return JSONResponse(status_code=415,
                    content={"status": "error", "message": "multipart/form-data required"})
            elif not is_upload and not ct.startswith("application/json"):
                return JSONResponse(status_code=415,
                    content={"status": "error", "message": "application/json required"})
        return await call_next(request)
```

---

## 7. Request Size Limits

### Referensi CADAS
File: `cadas-service/middleware/middleware.go`

| Limit | Nilai |
|-------|-------|
| Header value | 8.192 bytes |
| Query parameter | 2.048 bytes |
| Path parameter | 512 bytes |
| JSON body | 1 MB |
| Multipart body | 10 MB |

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/request_size.py
MAX_HEADER_VALUE  = 8_192      # 8 KB
MAX_QUERY_PARAM   = 2_048      # 2 KB
MAX_PATH_PARAM    = 512        # 512 bytes
MAX_JSON_BODY     = 1_048_576  # 1 MB
MAX_UPLOAD_BODY   = 10_485_760 # 10 MB

class RequestSizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Validate header values
        for key, val in request.headers.items():
            if len(val) > MAX_HEADER_VALUE:
                return JSONResponse(status_code=431,
                    content={"status": "error", "message": f"Header {key} exceeds max length"})

        # Validate query params
        for key, val in request.query_params.items():
            if len(val) > MAX_QUERY_PARAM:
                return JSONResponse(status_code=400,
                    content={"status": "error", "message": f"Query param {key} exceeds max length"})

        # Validate body size
        content_length = request.headers.get("content-length")
        if content_length:
            cl = int(content_length)
            ct = request.headers.get("content-type", "")
            limit = MAX_UPLOAD_BODY if ct.startswith("multipart") else MAX_JSON_BODY
            if cl > limit:
                return JSONResponse(status_code=413,
                    content={"status": "error", "message": "Request body too large"})

        return await call_next(request)
```

---

## 8. Injection Detection

### Referensi CADAS
File: `cadas-service/middleware/middleware.go`

Setiap pattern diperiksa pada: URL, query params, dan request body. Jika terdeteksi → 400 + log.

| Tipe Serangan | OWASP | Contoh Pattern |
|---------------|-------|----------------|
| SQL Injection | A03 | `' OR 1=1`, `UNION SELECT`, `--`, `xp_cmdshell` |
| XSS | A03 | `<script>`, `javascript:`, `onerror=`, `onload=` |
| LDAP Injection | A03 | `)(`, `*)(uid=*)`, `\00` |
| OS Command Injection | A03 | `; rm -rf`, `| cat /etc/passwd`, `$(id)` |
| LFI/RFI/Path Traversal | A01 | `../`, `..\\`, `file://`, `http://evil.com/shell.php` |

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/injection_guard.py
import re
from starlette.middleware.base import BaseHTTPMiddleware

SQL_PATTERNS = re.compile(
    r"(\bOR\b\s+\d+=\d+|UNION\s+SELECT|DROP\s+TABLE|'--|xp_cmdshell|;\s*DELETE|SLEEP\s*\()",
    re.IGNORECASE
)
XSS_PATTERNS = re.compile(
    r"(<script|javascript:|onerror\s*=|onload\s*=|eval\s*\(|document\.cookie)",
    re.IGNORECASE
)
LFI_PATTERNS = re.compile(r"(\.\./|\.\.\\\\|file://|/etc/passwd|/proc/self)")
CMD_PATTERNS = re.compile(r"(;\s*rm\s+-|;\s*cat\s+/|\|\s*sh\b|\$\(|`[^`]+`)")

class InjectionGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Cek query params
        for key, val in request.query_params.items():
            for pattern in [SQL_PATTERNS, XSS_PATTERNS, LFI_PATTERNS, CMD_PATTERNS]:
                if pattern.search(val):
                    return JSONResponse(status_code=400,
                        content={"status": "error", "message": "Invalid request"})

        # Cek URL path
        path = str(request.url.path)
        if LFI_PATTERNS.search(path):
            return JSONResponse(status_code=400,
                content={"status": "error", "message": "Invalid request path"})

        return await call_next(request)
```

> **Catatan:** Pemeriksaan body JSON harus dilakukan setelah body dibaca, bisa menggunakan route-level dependency agar tidak memblok streaming requests.

---

## 9. CRLF / Header Sanitization

### Referensi CADAS
File: `cadas-service/middleware/header_sanitizer.go`

- Tolak jika ada header dengan nilai mengandung `\r` atau `\n`
- Tolak jika ada `Transfer-Encoding` header
- Tolak query param yang mengandung CRLF

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/header_sanitizer.py
class HeaderSanitizerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Reject Transfer-Encoding (chunked smuggling)
        if "transfer-encoding" in request.headers:
            return JSONResponse(status_code=400,
                content={"status": "error", "message": "Invalid request headers"})

        # Reject CRLF in header values
        for key, val in request.headers.items():
            if "\r" in val or "\n" in val:
                return JSONResponse(status_code=400,
                    content={"status": "error", "message": "Invalid header value"})

        # Reject CRLF in query params
        for key, val in request.query_params.items():
            if "\r" in val or "\n" in val:
                return JSONResponse(status_code=400,
                    content={"status": "error", "message": "Invalid query parameter"})

        return await call_next(request)
```

---

## 10. File Upload Validation

### Referensi CADAS
File: `cadas-service/middleware/middleware.go`

- Validasi ekstensi file: allowlist-based
- Validasi MIME type: cek header `Content-Type` dari setiap file part

### Implementasi Kamsiber (FastAPI)

```python
# backend/utils/file_validation.py
ALLOWED_EXTENSIONS = {".pdf", ".xlsx", ".xls", ".csv", ".png", ".jpg", ".jpeg", ".docx"}
ALLOWED_MIMETYPES = {
    "application/pdf", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv", "image/png", "image/jpeg",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

def validate_upload_file(file: UploadFile) -> None:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed")
    if file.content_type not in ALLOWED_MIMETYPES:
        raise HTTPException(status_code=400, detail=f"MIME type {file.content_type} not allowed")

# Penggunaan di endpoint upload:
@router.post("/upload")
def upload(file: UploadFile = File(...)):
    validate_upload_file(file)
    ...
```

---

## 11. Request Timeout

### Referensi CADAS
File: `cadas-service/middleware/middleware.go`

- Global: 20 detik
- Dikecualikan: upload, import, dashboard, download

### Implementasi Kamsiber (FastAPI)

```python
# backend/middleware/timeout.py
import asyncio
from starlette.middleware.base import BaseHTTPMiddleware

TIMEOUT_EXCLUDED = {"/upload", "/import", "/download", "/export"}
REQUEST_TIMEOUT = 20.0  # detik

class TimeoutMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(exc in path for exc in TIMEOUT_EXCLUDED):
            return await call_next(request)
        try:
            return await asyncio.wait_for(call_next(request), timeout=REQUEST_TIMEOUT)
        except asyncio.TimeoutError:
            return JSONResponse(status_code=504,
                content={"status": "error", "message": "Request timeout"})
```

---

## 12. Disable API Docs di Production

### Referensi CADAS
CADAS menggunakan mode `gin.ReleaseMode` di production yang secara otomatis menyembunyikan debug info.

### Implementasi Kamsiber (FastAPI)

```python
# backend/main.py
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.APP_ENV != "production" else None,
    docs_url="/api/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/api/redoc" if settings.APP_ENV != "production" else None,
)
```

---

## 13. Frontend: DOMPurify (XSS Sanitization)

### Referensi CADAS
File: `cadas-fe/src/utils/sanitize.ts`

```typescript
import DOMPurify from 'dompurify'
export const sanitizePayload = (data: any): any => {
    if (typeof data === 'string') return DOMPurify.sanitize(data)
    // ... recursive untuk object/array
}
```

### Implementasi Kamsiber (Next.js)

```bash
npm install dompurify @types/dompurify
```

```typescript
// src/utils/sanitize.ts  — ganti manual replace dengan DOMPurify
import DOMPurify from 'dompurify'

export const sanitizeString = (input: string | null | undefined): string => {
    if (!input) return ''
    return DOMPurify.sanitize(input)
}

export const sanitizePayload = (data: unknown): unknown => {
    if (typeof data === 'string') return DOMPurify.sanitize(data)
    if (Array.isArray(data)) return data.map(sanitizePayload)
    if (data && typeof data === 'object') {
        return Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, sanitizePayload(v)])
        )
    }
    return data
}
```

---

## 14. Frontend: Auth Route Protection (Next.js Middleware)

### Referensi CADAS
CADAS menggunakan Vue Router guard + axios interceptor untuk redirect ke login saat 401.

### Implementasi Kamsiber (Next.js)

```typescript
// src/middleware.ts  (di root src/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']

export function middleware(request: NextRequest) {
    const token = request.cookies.get('kamsiber_token')
    const isPublic = PUBLIC_PATHS.some(p => request.nextUrl.pathname.startsWith(p))

    if (!isPublic && !token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 15. Response Encryption (Production Only)

### Referensi CADAS
File: `cadas-service/middleware/response_encryption.go` dan `cadas-fe/src/stores/encrypt.ts`

- Algoritma: AES-256-GCM
- Aktif: production only
- BE: mengenkripsi response JSON → `{ data: "<encrypted_string>" }`
- FE: mendekripsi via WASM (Rust compiled to WebAssembly)

### Implementasi Kamsiber

Ini adalah middleware paling kompleks dan merupakan prioritas terakhir. Akan diimplementasikan sebagai:
- BE: `cryptography` library Python (`pip install cryptography`)
- FE: WebCrypto API (built-in browser) atau WASM

> **Status:** Belum perlu di sprint awal. Implementasikan setelah autentikasi berjalan.

---

## Urutan Implementasi (Prioritas)

| Prioritas | Middleware | Alasan |
|-----------|-----------|--------|
| 🔴 1 | CORS (restrict origins) | `allow_origins=["*"]` saat ini sangat berbahaya |
| 🔴 2 | Security Headers (BE + FE) | OWASP minimum requirement |
| 🔴 3 | JWT Auth Middleware | Semua endpoint saat ini terbuka |
| 🔴 4 | FE Auth Middleware | Halaman tidak terproteksi |
| 🟠 5 | CSRF Protection | Wajib untuk POST/PUT/PATCH |
| 🟠 6 | Rate Limiting | Brute force protection |
| 🟠 7 | DOMPurify (ganti manual) | XSS defense-in-depth |
| 🟡 8 | Content-Type Validation | Validasi input dasar |
| 🟡 9 | Request Size Limits | DoS mitigation |
| 🟡 10 | Injection Detection | OWASP A03 |
| 🟡 11 | CRLF Sanitization | Header injection |
| 🟡 12 | File Upload Validation | Malicious upload |
| 🟡 13 | Request Timeout | Resource exhaustion |
| 🟢 14 | Disable /docs (prod) | Info disclosure |
| 🟢 15 | Response Encryption | E2E confidentiality |

---

## Environment Variables yang Dibutuhkan

```env
# .env
APP_ENV=local|staging|production

# CORS
CORS_ORIGINS=http://localhost:3000  # comma-separated, JANGAN "*" di prod

# JWT
JWT_SECRET_KEY=<min 32 karakter, gunakan: openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRES=900       # 15 menit (detik)
JWT_REFRESH_TOKEN_EXPIRES=2592000  # 30 hari (detik)

# Rate Limiting
GET_RATE_LIMIT=100/minute
MUTATE_RATE_LIMIT=20/minute
AUTH_RATE_LIMIT=10/minute

# Encryption (nanti, production only)
ENCRYPTION_KEY=<32-byte hex>
```

---

## Referensi

- CADAS Backend: `zpic/cadas/cadas-service/middleware/` (Go/Gin)
- CADAS Frontend: `zpic/cadas/cadas-fe/src/plugins/axios.ts`, `src/utils/sanitize.ts`
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- FastAPI Security: `python-jose`, `slowapi`, `starlette`
