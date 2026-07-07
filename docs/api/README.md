# API Foundation

All product API routes live under `/api/v1`.

Response envelope:

```json
{ "success": true, "data": {}, "meta": {} }
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not allowed to perform this action."
  }
}
```

Implemented endpoints:

- `GET /api/health`
- `GET /api/ready`
- `GET /api/v1/me`
- `GET /api/v1/admin/roles`
- `GET /api/v1/children/:childId`

Remaining endpoints are structured placeholders.
