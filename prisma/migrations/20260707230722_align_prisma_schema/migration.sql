-- DropForeignKey
ALTER TABLE "gameadventure"."ChildProfile" DROP CONSTRAINT "ChildProfile_parentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."DailyPlayUsage" DROP CONSTRAINT "DailyPlayUsage_childProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."DailyPlayUsage" DROP CONSTRAINT "DailyPlayUsage_parentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."EnergyLedger" DROP CONSTRAINT "EnergyLedger_childProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."EnergyLedger" DROP CONSTRAINT "EnergyLedger_parentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."GameSession" DROP CONSTRAINT "GameSession_childProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."GameSession" DROP CONSTRAINT "GameSession_levelId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."LearningLesson" DROP CONSTRAINT "LearningLesson_levelId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."LearningLevel" DROP CONSTRAINT "LearningLevel_trackId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."LearningLevel" DROP CONSTRAINT "LearningLevel_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."LearningQuestion" DROP CONSTRAINT "LearningQuestion_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."LearningZone" DROP CONSTRAINT "LearningZone_trackId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."LevelProgress" DROP CONSTRAINT "LevelProgress_childProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."LevelProgress" DROP CONSTRAINT "LevelProgress_levelId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."ParentProfile" DROP CONSTRAINT "ParentProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."ParentSecuritySetting" DROP CONSTRAINT "ParentSecuritySetting_parentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."ParentalSetting" DROP CONSTRAINT "ParentalSetting_parentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" DROP CONSTRAINT "QuestionAttempt_childProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" DROP CONSTRAINT "QuestionAttempt_gameSessionId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" DROP CONSTRAINT "QuestionAttempt_questionId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" DROP CONSTRAINT "QuestionAttempt_selectedOptionId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."QuestionOption" DROP CONSTRAINT "QuestionOption_questionId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."RewardLedger" DROP CONSTRAINT "RewardLedger_childProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."RewardLedger" DROP CONSTRAINT "RewardLedger_parentProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."RolePermission" DROP CONSTRAINT "RolePermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."RolePermission" DROP CONSTRAINT "RolePermission_roleId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."TrackProgress" DROP CONSTRAINT "TrackProgress_childProfileId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."TrackProgress" DROP CONSTRAINT "TrackProgress_trackId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure"."UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure_auth"."Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "gameadventure_auth"."Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "gameadventure"."ChildProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."DailyPlayUsage" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."GameSession" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."LearningAsset" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."LearningLesson" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."LearningLevel" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."LearningQuestion" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."LearningTrack" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."LearningZone" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."LevelProgress" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."ParentProfile" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."ParentSecuritySetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."ParentalSetting" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."Permission" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."QuestionOption" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."Role" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure"."TrackProgress" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure_auth"."Account" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure_auth"."Session" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure_auth"."User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gameadventure_auth"."Verification" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "GameSession_levelId_idx" ON "gameadventure"."GameSession"("levelId");

-- CreateIndex
CREATE INDEX "LearningAsset_ownerId_idx" ON "gameadventure"."LearningAsset"("ownerId");

-- CreateIndex
CREATE INDEX "LearningLesson_levelId_idx" ON "gameadventure"."LearningLesson"("levelId");

-- CreateIndex
CREATE INDEX "LearningLevel_zoneId_idx" ON "gameadventure"."LearningLevel"("zoneId");

-- CreateIndex
CREATE INDEX "LearningQuestion_lessonId_idx" ON "gameadventure"."LearningQuestion"("lessonId");

-- CreateIndex
CREATE INDEX "LearningZone_trackId_idx" ON "gameadventure"."LearningZone"("trackId");

-- CreateIndex
CREATE INDEX "ParentProfile_userId_idx" ON "gameadventure"."ParentProfile"("userId");

-- CreateIndex
CREATE INDEX "QuestionAttempt_childProfileId_createdAt_idx" ON "gameadventure"."QuestionAttempt"("childProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "gameadventure"."QuestionOption"("questionId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "gameadventure"."RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "gameadventure"."UserRole"("roleId");

-- CreateIndex
CREATE INDEX "SecurityEvent_actorUserId_createdAt_idx" ON "gameadventure_audit"."SecurityEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "gameadventure_auth"."Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "gameadventure_auth"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "gameadventure_auth"."Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Verification_expiresAt_idx" ON "gameadventure_auth"."Verification"("expiresAt");

-- AddForeignKey
ALTER TABLE "gameadventure_auth"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gameadventure_auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure_auth"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gameadventure_auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gameadventure_auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."ParentSecuritySetting" ADD CONSTRAINT "ParentSecuritySetting_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "gameadventure"."ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."ParentalSetting" ADD CONSTRAINT "ParentalSetting_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "gameadventure"."ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."ChildProfile" ADD CONSTRAINT "ChildProfile_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "gameadventure"."ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "gameadventure_auth"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "gameadventure"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "gameadventure"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "gameadventure"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."LearningZone" ADD CONSTRAINT "LearningZone_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "gameadventure"."LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."LearningLevel" ADD CONSTRAINT "LearningLevel_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "gameadventure"."LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."LearningLevel" ADD CONSTRAINT "LearningLevel_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "gameadventure"."LearningZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."LearningLesson" ADD CONSTRAINT "LearningLesson_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "gameadventure"."LearningLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."LearningQuestion" ADD CONSTRAINT "LearningQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "gameadventure"."LearningLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "gameadventure"."LearningQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."GameSession" ADD CONSTRAINT "GameSession_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "gameadventure"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."GameSession" ADD CONSTRAINT "GameSession_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "gameadventure"."LearningLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "gameadventure"."GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "gameadventure"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "gameadventure"."LearningQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."QuestionAttempt" ADD CONSTRAINT "QuestionAttempt_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "gameadventure"."QuestionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."LevelProgress" ADD CONSTRAINT "LevelProgress_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "gameadventure"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."LevelProgress" ADD CONSTRAINT "LevelProgress_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "gameadventure"."LearningLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."TrackProgress" ADD CONSTRAINT "TrackProgress_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "gameadventure"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."TrackProgress" ADD CONSTRAINT "TrackProgress_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "gameadventure"."LearningTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."DailyPlayUsage" ADD CONSTRAINT "DailyPlayUsage_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "gameadventure"."ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."DailyPlayUsage" ADD CONSTRAINT "DailyPlayUsage_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "gameadventure"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."RewardLedger" ADD CONSTRAINT "RewardLedger_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "gameadventure"."ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."RewardLedger" ADD CONSTRAINT "RewardLedger_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "gameadventure"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."EnergyLedger" ADD CONSTRAINT "EnergyLedger_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "gameadventure"."ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameadventure"."EnergyLedger" ADD CONSTRAINT "EnergyLedger_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "gameadventure"."ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "gameadventure"."ChildProfile_parent_idx" RENAME TO "ChildProfile_parentProfileId_idx";

-- RenameIndex
ALTER INDEX "gameadventure"."DailyPlayUsage_parent_date_idx" RENAME TO "DailyPlayUsage_parentProfileId_usageDate_idx";

-- RenameIndex
ALTER INDEX "gameadventure"."EnergyLedger_child_created_idx" RENAME TO "EnergyLedger_childProfileId_createdAt_idx";

-- RenameIndex
ALTER INDEX "gameadventure"."GameSession_child_started_idx" RENAME TO "GameSession_childProfileId_startedAt_idx";

-- RenameIndex
ALTER INDEX "gameadventure"."RewardLedger_child_created_idx" RENAME TO "RewardLedger_childProfileId_createdAt_idx";

-- RenameIndex
ALTER INDEX "gameadventure_audit"."AuditLog_actor_created_idx" RENAME TO "AuditLog_actorUserId_createdAt_idx";

-- RenameIndex
ALTER INDEX "gameadventure_audit"."SecurityEvent_type_created_idx" RENAME TO "SecurityEvent_eventType_createdAt_idx";

-- RenameIndex
ALTER INDEX "gameadventure_auth"."Account_provider_account_unique" RENAME TO "Account_providerId_accountId_key";

-- RenameIndex
ALTER INDEX "gameadventure_auth"."Verification_identifier_hash_unique" RENAME TO "Verification_identifier_valueHash_key";
