CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS gameadventure_auth;
CREATE SCHEMA IF NOT EXISTS gameadventure;
CREATE SCHEMA IF NOT EXISTS gameadventure_audit;

-- This hand-authored migration mirrors prisma/schema.prisma.
-- It intentionally creates no application business tables in the public schema.
CREATE TYPE gameadventure."RoleName" AS ENUM ('PARENT','CONTENT_EDITOR','CONTENT_REVIEWER','PUBLISHER','SUPPORT','AUDITOR','ADMIN','SUPER_ADMIN');
CREATE TYPE gameadventure."ContentStatus" AS ENUM ('DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED');
CREATE TYPE gameadventure."RewardTransactionType" AS ENUM ('LEVEL_COMPLETION','DAILY_BONUS','ACHIEVEMENT','ADMIN_ADJUSTMENT','REVERSAL');
CREATE TYPE gameadventure."EnergyTransactionType" AS ENUM ('DAILY_GRANT','SESSION_START','PARENT_GRANT','ADMIN_ADJUSTMENT','REVERSAL');

CREATE TABLE gameadventure_auth."User" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure_auth."Account" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES gameadventure_auth."User"(id) ON DELETE CASCADE,
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

CREATE TABLE gameadventure_auth."Session" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tokenHash" text NOT NULL UNIQUE,
  "expiresAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "revokedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "userId" uuid NOT NULL REFERENCES gameadventure_auth."User"(id) ON DELETE CASCADE
);

CREATE TABLE gameadventure_auth."Verification" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  "valueHash" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Verification_identifier_hash_unique" UNIQUE (identifier, "valueHash")
);

CREATE TABLE gameadventure."ParentProfile" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE REFERENCES gameadventure_auth."User"(id) ON DELETE CASCADE,
  "displayName" text NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE TABLE gameadventure."ParentSecuritySetting" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL UNIQUE REFERENCES gameadventure."ParentProfile"(id) ON DELETE CASCADE,
  "pinHash" text,
  "failedPinAttempts" integer NOT NULL DEFAULT 0,
  "pinLockedUntil" timestamptz,
  "lastPinVerifiedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."ParentalSetting" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL UNIQUE REFERENCES gameadventure."ParentProfile"(id) ON DELETE CASCADE,
  "dailyLimitSeconds" integer NOT NULL DEFAULT 1200,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  "energyEnabled" boolean NOT NULL DEFAULT true,
  "parentOverrideUntil" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."ChildProfile" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES gameadventure."ParentProfile"(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  "birthYear" integer,
  "ageRange" text,
  "avatarKey" text,
  "learningPreferences" jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE TABLE gameadventure."Role" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name gameadventure."RoleName" NOT NULL UNIQUE,
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."Permission" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."UserRole" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES gameadventure_auth."User"(id) ON DELETE CASCADE,
  "roleId" uuid NOT NULL REFERENCES gameadventure."Role"(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("userId", "roleId")
);

CREATE TABLE gameadventure."RolePermission" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "roleId" uuid NOT NULL REFERENCES gameadventure."Role"(id) ON DELETE CASCADE,
  "permissionId" uuid NOT NULL REFERENCES gameadventure."Permission"(id) ON DELETE CASCADE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("roleId", "permissionId")
);

CREATE TABLE gameadventure."LearningTrack" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  status gameadventure."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz
);

CREATE TABLE gameadventure."LearningZone" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "trackId" uuid NOT NULL REFERENCES gameadventure."LearningTrack"(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  status gameadventure."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  UNIQUE ("trackId", slug)
);

CREATE TABLE gameadventure."LearningLevel" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "trackId" uuid NOT NULL REFERENCES gameadventure."LearningTrack"(id) ON DELETE CASCADE,
  "zoneId" uuid NOT NULL REFERENCES gameadventure."LearningZone"(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "energyCost" integer NOT NULL DEFAULT 1,
  status gameadventure."ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "deletedAt" timestamptz,
  UNIQUE ("trackId", slug)
);

CREATE TABLE gameadventure."LearningLesson" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "levelId" uuid NOT NULL REFERENCES gameadventure."LearningLevel"(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("levelId", slug)
);

CREATE TABLE gameadventure."LearningQuestion" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId" uuid NOT NULL REFERENCES gameadventure."LearningLesson"(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  "answerRule" jsonb NOT NULL DEFAULT '{}',
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."QuestionOption" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "questionId" uuid NOT NULL REFERENCES gameadventure."LearningQuestion"(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."LearningAsset" (
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

CREATE TABLE gameadventure."GameSession" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "childProfileId" uuid NOT NULL REFERENCES gameadventure."ChildProfile"(id) ON DELETE CASCADE,
  "levelId" uuid NOT NULL REFERENCES gameadventure."LearningLevel"(id) ON DELETE RESTRICT,
  "startedAt" timestamptz NOT NULL DEFAULT now(),
  "completedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."QuestionAttempt" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "gameSessionId" uuid NOT NULL REFERENCES gameadventure."GameSession"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES gameadventure."ChildProfile"(id) ON DELETE CASCADE,
  "questionId" uuid NOT NULL REFERENCES gameadventure."LearningQuestion"(id) ON DELETE RESTRICT,
  "selectedOptionId" uuid REFERENCES gameadventure."QuestionOption"(id) ON DELETE RESTRICT,
  "clientSequence" integer NOT NULL,
  "serverSequence" integer NOT NULL,
  "isCorrect" boolean NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("gameSessionId", "clientSequence")
);

CREATE TABLE gameadventure."LevelProgress" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "childProfileId" uuid NOT NULL REFERENCES gameadventure."ChildProfile"(id) ON DELETE CASCADE,
  "levelId" uuid NOT NULL REFERENCES gameadventure."LearningLevel"(id) ON DELETE CASCADE,
  "completedAt" timestamptz,
  "bestScore" integer NOT NULL DEFAULT 0,
  "idempotencyKey" text UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("childProfileId", "levelId")
);

CREATE TABLE gameadventure."TrackProgress" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "childProfileId" uuid NOT NULL REFERENCES gameadventure."ChildProfile"(id) ON DELETE CASCADE,
  "trackId" uuid NOT NULL REFERENCES gameadventure."LearningTrack"(id) ON DELETE CASCADE,
  "completedCount" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("childProfileId", "trackId")
);

CREATE TABLE gameadventure."DailyPlayUsage" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES gameadventure."ParentProfile"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES gameadventure."ChildProfile"(id) ON DELETE CASCADE,
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

CREATE TABLE gameadventure."RewardLedger" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES gameadventure."ParentProfile"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES gameadventure."ChildProfile"(id) ON DELETE CASCADE,
  type gameadventure."RewardTransactionType" NOT NULL,
  amount integer NOT NULL,
  reason text,
  "idempotencyKey" text UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure."EnergyLedger" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "parentProfileId" uuid NOT NULL REFERENCES gameadventure."ParentProfile"(id) ON DELETE CASCADE,
  "childProfileId" uuid NOT NULL REFERENCES gameadventure."ChildProfile"(id) ON DELETE CASCADE,
  type gameadventure."EnergyTransactionType" NOT NULL,
  amount integer NOT NULL,
  reason text,
  "idempotencyKey" text UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure_audit."AuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" uuid,
  action text NOT NULL,
  "targetType" text,
  "targetId" text,
  metadata jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gameadventure_audit."SecurityEvent" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" uuid,
  "eventType" text NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  metadata jsonb NOT NULL DEFAULT '{}',
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "ChildProfile_parent_idx" ON gameadventure."ChildProfile" ("parentProfileId");
CREATE INDEX "GameSession_child_started_idx" ON gameadventure."GameSession" ("childProfileId", "startedAt");
CREATE INDEX "DailyPlayUsage_parent_date_idx" ON gameadventure."DailyPlayUsage" ("parentProfileId", "usageDate");
CREATE INDEX "RewardLedger_child_created_idx" ON gameadventure."RewardLedger" ("childProfileId", "createdAt");
CREATE INDEX "EnergyLedger_child_created_idx" ON gameadventure."EnergyLedger" ("childProfileId", "createdAt");
CREATE INDEX "AuditLog_actor_created_idx" ON gameadventure_audit."AuditLog" ("actorUserId", "createdAt");
CREATE INDEX "SecurityEvent_type_created_idx" ON gameadventure_audit."SecurityEvent" ("eventType", "createdAt");
