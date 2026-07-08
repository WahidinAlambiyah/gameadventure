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

Prisma client generation:

- The project uses the standard `prisma-client-js` generator.
- Generated runtime output is written to `node_modules/@prisma/client`.
- `npm run db:generate` and the package `postinstall` script regenerate the client from `prisma/schema.prisma`.
- Server code imports `PrismaClient`, `Prisma`, and generated model enums from `@prisma/client`.
- The `PrismaPg` adapter is still passed when constructing `PrismaClient`, so PostgreSQL driver-adapter behavior is unchanged.
- Better Auth uses the same singleton Prisma client through `better-auth/adapters/prisma`.
