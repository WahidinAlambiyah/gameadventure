# PWA

Status: **Partial**.

Repository menyediakan manifest, icon references, service-worker registration, offline page, dan tests untuk public-only caching foundation. Authenticated API responses dan parent/child private data tidak boleh di-cache oleh service worker.

Status Partial dipakai karena source foundation tidak membuktikan installability, update behavior, offline UX, cache invalidation, dan production browser compatibility secara lengkap. Klaim production-ready memerlukan manual browser/device validation dan deployment evidence.
