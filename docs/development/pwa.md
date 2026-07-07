# PWA Notes

The app includes a manifest and a public-only service worker foundation.

The service worker must not cache:

- Authenticated API responses.
- Parent dashboard data.
- Child profile data.
- Progress data.
- Admin data.

Only safe public shell resources and public assets may be cached.
