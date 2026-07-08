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
- `GET /api/v1/children/:childId/play-status`
- `GET /api/v1/parent/security`
- `PUT /api/v1/parent/security/pin`
- `POST /api/v1/auth/parent-gate/verify`
- `DELETE /api/v1/auth/parent-gate`
- `GET /api/v1/parent/settings`
- `PATCH /api/v1/parent/settings`

Remaining endpoints are structured placeholders.

`POST /api/v1/children` never accepts `parentProfileId` from the client. The parent scope is resolved from the authenticated server session.

Child profile creation accepts:

- `nickname`: trimmed, 2-30 characters.
- exactly one of `birthYear` or `ageRange`.
- `avatarKey`: allowlisted starter avatar.
- `learningPreferences.focus`: one of `reading`, `hijaiyah`, or `both`.

Parent security endpoints:

- `PUT /api/v1/parent/security/pin` sets the initial PIN with `{ "pin": "1234", "confirmPin": "1234" }`.
- `PUT /api/v1/parent/security/pin` changes an existing PIN with `{ "currentPin": "1234", "pin": "5678", "confirmPin": "5678" }`.
- `POST /api/v1/auth/parent-gate/verify` verifies a PIN and returns a sanitized local `returnTo`.
- `GET /api/v1/parent/security` returns safe status fields only.
- PIN plaintext and PIN hashes are never returned.

Parent settings endpoints require a valid parent-gate cookie:

- `GET /api/v1/parent/settings`
- `PATCH /api/v1/parent/settings` with `dailyLimitMinutes`, `timezone`, and `energyEnabled`.
