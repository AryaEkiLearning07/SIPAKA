-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InstrumentType" AS ENUM ('UUD1945', 'TAP_MPR', 'UU', 'PERPPU', 'PP', 'PERPRES', 'PERMEN', 'PERDA_PROV', 'PERDA_KABKOT');

-- CreateEnum
CREATE TYPE "InstrumentStatus" AS ENUM ('BERLAKU', 'DIUBAH', 'DICABUT', 'TIDAK_BERLAKU_SEBAGIAN');

-- CreateEnum
CREATE TYPE "IngestMethod" AS ENUM ('MANUAL_UPLOAD', 'SCRAPER', 'OFFICIAL_FEED');

-- CreateEnum
CREATE TYPE "ProvisionType" AS ENUM ('BAB', 'BAGIAN', 'PARAGRAF', 'PASAL', 'AYAT', 'HURUF', 'ANGKA', 'PENJELASAN_UMUM', 'PENJELASAN_PASAL');

-- CreateEnum
CREATE TYPE "ChangeSetStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('ADD_PROVISION', 'REPLACE_PROVISION', 'REPEAL_PROVISION', 'PARTIAL_REPEAL', 'RENUMBER', 'JUDICIAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('MK', 'MA');

-- CreateEnum
CREATE TYPE "RulingEffect" AS ENUM ('BATAL_SELURUHNYA', 'INKONSTITUSIONAL_BERSYARAT', 'KONSTITUSIONAL_BERSYARAT', 'TIDAK_DITERIMA_NO', 'DITOLAK');

-- CreateTable
CREATE TABLE "legal_instruments" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "type" "InstrumentType" NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "description" TEXT,
    "status" "InstrumentStatus" NOT NULL DEFAULT 'BERLAKU',
    "enactedAt" TIMESTAMP(3) NOT NULL,
    "promulgatedAt" TIMESTAMP(3) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "expiredAt" TIMESTAMP(3),
    "lnNumber" INTEGER,
    "tlnNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_documents" (
    "id" TEXT NOT NULL,
    "legalInstrumentId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "fileHashSha256" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "sourceInstitution" TEXT NOT NULL,
    "ingestMethod" "IngestMethod" NOT NULL DEFAULT 'MANUAL_UPLOAD',
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provisions" (
    "id" TEXT NOT NULL,
    "legalInstrumentId" TEXT NOT NULL,
    "parentId" TEXT,
    "type" "ProvisionType" NOT NULL,
    "orderIndex" DOUBLE PRECISION NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT,
    "canonicalPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provision_revisions" (
    "id" TEXT NOT NULL,
    "provisionId" TEXT NOT NULL,
    "versionTag" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "explanation" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "changeSetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provision_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_sets" (
    "id" TEXT NOT NULL,
    "amendingInstrumentId" TEXT NOT NULL,
    "targetInstrumentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "legalBasisNote" TEXT,
    "status" "ChangeSetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "change_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_operations" (
    "id" TEXT NOT NULL,
    "changeSetId" TEXT NOT NULL,
    "targetProvisionId" TEXT NOT NULL,
    "operationType" "OperationType" NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "previousContent" TEXT,
    "newContent" TEXT,
    "payloadJson" JSONB,
    "orderInSet" INTEGER NOT NULL,

    CONSTRAINT "change_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publications" (
    "id" TEXT NOT NULL,
    "legalInstrumentId" TEXT NOT NULL,
    "versionName" TEXT NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "isCurrentActive" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judicial_annotations" (
    "id" TEXT NOT NULL,
    "provisionId" TEXT NOT NULL,
    "court" "CourtType" NOT NULL DEFAULT 'MK',
    "caseNumber" TEXT NOT NULL,
    "rulingDate" TIMESTAMP(3) NOT NULL,
    "effect" "RulingEffect" NOT NULL,
    "affectedPhrase" TEXT,
    "ratioDecidendi" TEXT NOT NULL,
    "rulingVerdict" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "judicial_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_records" (
    "id" TEXT NOT NULL,
    "changeSetId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_instruments_slug_key" ON "legal_instruments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "legal_instruments_type_number_year_key" ON "legal_instruments"("type", "number", "year");

-- CreateIndex
CREATE INDEX "provisions_canonicalPath_idx" ON "provisions"("canonicalPath");

-- CreateIndex
CREATE UNIQUE INDEX "provisions_legalInstrumentId_canonicalPath_key" ON "provisions"("legalInstrumentId", "canonicalPath");

-- AddForeignKey
ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_legalInstrumentId_fkey" FOREIGN KEY ("legalInstrumentId") REFERENCES "legal_instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisions" ADD CONSTRAINT "provisions_legalInstrumentId_fkey" FOREIGN KEY ("legalInstrumentId") REFERENCES "legal_instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provisions" ADD CONSTRAINT "provisions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "provisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provision_revisions" ADD CONSTRAINT "provision_revisions_provisionId_fkey" FOREIGN KEY ("provisionId") REFERENCES "provisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provision_revisions" ADD CONSTRAINT "provision_revisions_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "change_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_amendingInstrumentId_fkey" FOREIGN KEY ("amendingInstrumentId") REFERENCES "legal_instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_sets" ADD CONSTRAINT "change_sets_targetInstrumentId_fkey" FOREIGN KEY ("targetInstrumentId") REFERENCES "legal_instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_operations" ADD CONSTRAINT "change_operations_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "change_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_operations" ADD CONSTRAINT "change_operations_targetProvisionId_fkey" FOREIGN KEY ("targetProvisionId") REFERENCES "provisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publications" ADD CONSTRAINT "publications_legalInstrumentId_fkey" FOREIGN KEY ("legalInstrumentId") REFERENCES "legal_instruments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judicial_annotations" ADD CONSTRAINT "judicial_annotations_provisionId_fkey" FOREIGN KEY ("provisionId") REFERENCES "provisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_records" ADD CONSTRAINT "review_records_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "change_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

