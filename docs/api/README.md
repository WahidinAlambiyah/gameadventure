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

Validation errors use HTTP `422` with code `VALIDATION_ERROR`.

Implemented endpoints:

- `GET /api/health`
- `GET /api/ready`
- `GET /api/v1/me`
- `POST /api/v1/auth/bootstrap-parent`
- `GET /api/v1/admin/roles`
- `GET /api/v1/children`
- `POST /api/v1/children`
- `GET /api/v1/children/:childId`

Remaining endpoints are structured placeholders.

`POST /api/v1/children` never accepts `parentProfileId` from the client. The parent scope is resolved from the authenticated server session.

Child profile creation accepts:

- `nickname`: trimmed, 2-30 characters.
- exactly one of `birthYear` or `ageRange`.
- `avatarKey`: allowlisted starter avatar.
- `learningPreferences.focus`: one of `reading`, `hijaiyah`, or `both`.
