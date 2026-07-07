CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS bacangaji;
CREATE SCHEMA IF NOT EXISTS bacangaji_audit;

-- This hand-authored migration mirrors prisma/schema.prisma.
-- It intentionally creates no application business tables in the public schema.
CREATE TYPE bacangaji."RoleName" AS ENUM ('PARENT','CONTENT_EDITOR','CONTENT_REVIEWER','PUBLISHER','SUPPORT','AUDITOR','ADMIN','SUPER_ADMIN');
CREATE TYPE bacangaji."ContentStatus" AS ENUM ('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED');
CREATE TYPE bacangaji."RewardTransactionType" AS ENUM ('LEVEL_COMPLETION','DAILY_BONUS','ACHIEVEMENT','ADMIN_ADJUSTMENT','REVERSAL');
CREATE TYPE bacangaji."EnergyTransactionType" AS ENUM ('DAILY_GRANT','SESSION_START','PARENT_GRANT','ADMIN_ADJUSTMENT','REVERSAL');

CREATE TABLE auth."User" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth."Account" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES auth."User"(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Account_provider_account_unique" UNIQUE ("providerId", "accountId")
);

CREATE TABLE auth."Session" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tokenHash" text NOT NULL UNIQUE,
  "expiresAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "revokedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "userId" uuid NOT NULL REFERENCES auth."User"(id) ON DELETE CASCADE
);

CREATE TABLE auth."Verification" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  "valueHash" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Verification_identifier_hash_unique" UNIQUE (identifier, "valueHash")
);

CREATE TABLE bacangaji."ParentProfile" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE REFERENCES auth."User"(id) ON DELETE CASCADE,
  "displayName" text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE TABLE bacangaji."ParentSecuritySetting" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL UNIQUE REFERENCES bacangaji."ParentProfile"(id) ON DELETE CASCADE,
  "pinHash" text,
  "failedPinAttempts" integer NOT NULL DEFAULT 0,
  "pinLockedUntil" timestamptz,
  "lastPinVerifiedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."ParentalSetting" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL UNIQUE REFERENCES bacangaji."ParentProfile"(id) ON DELETE CASCADE,
  "dailyLimitSeconds" integer NOT NULL DEFAULT 1200,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  "energyEnabled" boolean NOT NULL DEFAULT true,
  "parentOverrideUntil" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."ChildProfile" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES bacangaji."ParentProfile"(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  "birthYear" integer,
  "ageRange" text,
  "avatarKey" text,
  "learningPreferences" jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE TABLE bacangaji."Role" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name bacangaji."RoleName" NOT NULL UNIQUE,
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."Permission" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."UserRole" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES auth."User"(id) ON DELETE CASCADE,
  "roleId" uuid NOT NULL REFERENCES bacangaji."Role"(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("userId", "roleId")
);

CREATE TABLE bacangaji."RolePermission" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "roleId" uuid NOT NULL REFERENCES bacangaji."Role"(id) ON DELETE CASCADE,
  "permissionId" uuid NOT NULL REFERENCES bacangaji."Permission"(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("roleId", "permissionId")
);

CREATE TABLE bacangaji."LearningTrack" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  status bacangaji."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE TABLE bacangaji."LearningZone" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "trackId" uuid NOT NULL REFERENCES bacangaji."LearningTrack"(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  status bacangaji."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  UNIQUE ("trackId", slug)
);

CREATE TABLE bacangaji."LearningLevel" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "trackId" uuid NOT NULL REFERENCES bacangaji."LearningTrack"(id) ON DELETE CASCADE,
  "zoneId" uuid NOT NULL REFERENCES bacangaji."LearningZone"(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "energyCost" integer NOT NULL DEFAULT 1,
  status bacangaji."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  UNIQUE ("trackId", slug)
);

CREATE TABLE bacangaji."LearningLesson" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "levelId" uuid NOT NULL REFERENCES bacangaji."LearningLevel"(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("levelId", slug)
);

CREATE TABLE bacangaji."LearningQuestion" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId" uuid NOT NULL REFERENCES bacangaji."LearningLesson"(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  "answerRule" jsonb NOT NULL DEFAULT '{}',
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."QuestionOption" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "questionId" uuid NOT NULL REFERENCES bacangaji."LearningQuestion"(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."LearningAsset" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  path text NOT NULL,
  "mimeType" text NOT NULL,
  "byteSize" integer NOT NULL,
  "ownerId" uuid,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  UNIQUE (bucket, path)
);

CREATE TABLE bacangaji."GameSession" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "childProfileId" uuid NOT NULL REFERENCES bacangaji."ChildProfile"(id) ON DELETE CASCADE,
  "levelId" uuid NOT NULL REFERENCES bacangaji."LearningLevel"(id) ON DELETE RESTRICT,
  "startedAt" timestamptz NOT NULL DEFAULT now(),
  "completedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."QuestionAttempt" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "gameSessionId" uuid NOT NULL REFERENCES bacangaji."GameSession"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES bacangaji."ChildProfile"(id) ON DELETE CASCADE,
  "questionId" uuid NOT NULL REFERENCES bacangaji."LearningQuestion"(id) ON DELETE RESTRICT,
  "selectedOptionId" uuid REFERENCES bacangaji."QuestionOption"(id) ON DELETE RESTRICT,
  "clientSequence" integer NOT NULL,
  "serverSequence" integer NOT NULL,
  "isCorrect" boolean NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("gameSessionId", "clientSequence")
);

CREATE TABLE bacangaji."LevelProgress" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "childProfileId" uuid NOT NULL REFERENCES bacangaji."ChildProfile"(id) ON DELETE CASCADE,
  "levelId" uuid NOT NULL REFERENCES bacangaji."LearningLevel"(id) ON DELETE CASCADE,
  "completedAt" timestamptz,
  "bestScore" integer NOT NULL DEFAULT 0,
  "idempotencyKey" text UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("childProfileId", "levelId")
);

CREATE TABLE bacangaji."TrackProgress" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "childProfileId" uuid NOT NULL REFERENCES bacangaji."ChildProfile"(id) ON DELETE CASCADE,
  "trackId" uuid NOT NULL REFERENCES bacangaji."LearningTrack"(id) ON DELETE CASCADE,
  "completedCount" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("childProfileId", "trackId")
);

CREATE TABLE bacangaji."DailyPlayUsage" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES bacangaji."ParentProfile"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES bacangaji."ChildProfile"(id) ON DELETE CASCADE,
  "usageDate" date NOT NULL,
  "activePlaySeconds" integer NOT NULL DEFAULT 0,
  "sessionCount" integer NOT NULL DEFAULT 0,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  "lastHeartbeatAt" timestamptz,
  "dailyLimitSeconds" integer NOT NULL DEFAULT 1200,
  "parentOverride" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("childProfileId", "usageDate")
);

CREATE TABLE bacangaji."RewardLedger" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES bacangaji."ParentProfile"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES bacangaji."ChildProfile"(id) ON DELETE CASCADE,
  type bacangaji."RewardTransactionType" NOT NULL,
  amount integer NOT NULL,
  reason text,
  "idempotencyKey" text UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji."EnergyLedger" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES bacangaji."ParentProfile"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES bacangaji."ChildProfile"(id) ON DELETE CASCADE,
  type bacangaji."EnergyTransactionType" NOT NULL,
  amount integer NOT NULL,
  reason text,
  "idempotencyKey" text UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji_audit."AuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" uuid,
  action text NOT NULL,
  "targetType" text,
  "targetId" text,
  metadata jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bacangaji_audit."SecurityEvent" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" uuid,
  "eventType" text NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  metadata jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "ChildProfile_parent_idx" ON bacangaji."ChildProfile" ("parentProfileId");
CREATE INDEX "GameSession_child_started_idx" ON bacangaji."GameSession" ("childProfileId", "startedAt");
CREATE INDEX "DailyPlayUsage_parent_date_idx" ON bacangaji."DailyPlayUsage" ("parentProfileId", "usageDate");
CREATE INDEX "RewardLedger_child_created_idx" ON bacangaji."RewardLedger" ("childProfileId", "createdAt");
CREATE INDEX "EnergyLedger_child_created_idx" ON bacangaji."EnergyLedger" ("childProfileId", "createdAt");
CREATE INDEX "AuditLog_actor_created_idx" ON bacangaji_audit."AuditLog" ("actorUserId", "createdAt");
CREATE INDEX "SecurityEvent_type_created_idx" ON bacangaji_audit."SecurityEvent" ("eventType", "createdAt");
