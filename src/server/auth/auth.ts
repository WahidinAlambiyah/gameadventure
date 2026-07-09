import "server-only";

import { hashSecret, verifySecret } from "@/server/security/password";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { env } from "@/config/env";
import { prisma } from "@/server/database/prisma";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    password: {
      hash: hashSecret,
      verify: ({ hash, password }) => verifySecret(hash, password)
    }
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET
          }
        }
      : undefined,
  session: {
    fields: {
      token: "tokenHash"
    },
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24
  },
  verification: {
    fields: {
      value: "valueHash"
    }
  },
  advanced: {
    cookiePrefix: "bacangaji",
    useSecureCookies: env.APP_ENV === "production",
    database: {
      generateId: "uuid"
    },
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure: env.APP_ENV === "production"
    }
  }
});
