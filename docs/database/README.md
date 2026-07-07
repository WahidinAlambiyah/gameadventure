# Database

Schemas:

- `gameadventure_auth`: users, accounts, sessions, verification tokens.
- `gameadventure`: business data.
- `gameadventure_audit`: audit and security events.

Business tables must not be created in `public`.

Migrations:

```bash
npm run db:migrate
npm run db:deploy
```

Seed:

```bash
npm run db:seed
```

The seed is idempotent and guarded against `APP_ENV=production`.
