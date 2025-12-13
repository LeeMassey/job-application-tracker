-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Applied',
    "source" TEXT NOT NULL DEFAULT 'Other',
    "jobUrl" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "companyPhone" TEXT,
    "payMin" INTEGER,
    "payMax" INTEGER,
    "payPeriod" TEXT,
    "shift" TEXT,
    "hoursPerWeek" INTEGER,
    "jobType" TEXT,
    "workplace" TEXT,
    "datePosted" DATETIME,
    "dateApplied" DATETIME,
    "lastFollowedUpOn" DATETIME,
    "nextFollowUpOn" DATETIME,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "jobDescription" TEXT,
    "resumeVersion" TEXT,
    "coverLetterVersion" TEXT,
    "notes" TEXT
);
INSERT INTO "new_Application" ("companyName", "companyPhone", "contactEmail", "contactName", "coverLetterVersion", "createdAt", "dateApplied", "datePosted", "hoursPerWeek", "id", "jobDescription", "jobType", "jobUrl", "lastFollowedUpOn", "location", "nextFollowUpOn", "notes", "payMax", "payMin", "payPeriod", "positionTitle", "resumeVersion", "shift", "source", "status", "updatedAt", "workplace") SELECT "companyName", "companyPhone", "contactEmail", "contactName", "coverLetterVersion", "createdAt", "dateApplied", "datePosted", "hoursPerWeek", "id", "jobDescription", "jobType", "jobUrl", "lastFollowedUpOn", "location", "nextFollowUpOn", "notes", "payMax", "payMin", "payPeriod", "positionTitle", "resumeVersion", "shift", "source", "status", "updatedAt", "workplace" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
