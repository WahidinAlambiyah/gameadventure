# Phase 1A Parent Onboarding

Phase 1A implements the parent onboarding vertical slice.

## Flow

1. Parent registers through `/register` with email, password, and display name.
2. Better Auth creates the auth user and session under `/api/auth`.
3. The client calls `POST /api/v1/auth/bootstrap-parent`.
4. The server creates or updates the parent profile, default security setting, default parental setting, and assigns only the `PARENT` role.
5. Parent creates one active child profile from `/parent/children/new`.
6. Child selection at `/child/select-profile` lists only child profiles owned by the authenticated parent session.

## API Boundaries

- `GET /api/v1/me` returns the authenticated user, roles, permissions, parent profile id, onboarding status, and active child count.
- `POST /api/v1/children` validates child data and derives `parentProfileId` from the server session.
- Client-provided ownership fields are rejected by strict request validation.
- MVP child creation is limited to one non-deleted child profile per parent.

## Security Notes

- Child profiles are not auth users.
- Admin-only users are not treated as parents.
- Parent pages require both the `PARENT` role and a persisted parent profile.
- Better Auth uses configured field mapping for the existing auth columns rather than editing the applied initial migration.
