-- CreateTable
CREATE TABLE `legal_instruments` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `type` ENUM('UUD1945', 'TAP_MPR', 'UU', 'PERPPU', 'PP', 'PERPRES', 'PERMEN', 'PERDA_PROV', 'PERDA_KABKOT') NOT NULL,
    `number` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `shortTitle` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `status` ENUM('BERLAKU', 'DIUBAH', 'DICABUT', 'TIDAK_BERLAKU_SEBAGIAN') NOT NULL DEFAULT 'BERLAKU',
    `enactedAt` DATETIME(3) NOT NULL,
    `promulgatedAt` DATETIME(3) NOT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `expiredAt` DATETIME(3) NULL,
    `lnNumber` INTEGER NULL,
    `tlnNumber` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `legal_instruments_slug_key`(`slug`),
    UNIQUE INDEX `legal_instruments_type_number_year_key`(`type`, `number`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `source_documents` (
    `id` VARCHAR(191) NOT NULL,
    `legalInstrumentId` VARCHAR(191) NOT NULL,
    `originalUrl` VARCHAR(191) NOT NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL DEFAULT 'application/pdf',
    `fileHashSha256` VARCHAR(191) NOT NULL,
    `fileSizeBytes` INTEGER NOT NULL,
    `sourceInstitution` VARCHAR(191) NOT NULL,
    `ingestMethod` ENUM('MANUAL_UPLOAD', 'SCRAPER', 'OFFICIAL_FEED') NOT NULL DEFAULT 'MANUAL_UPLOAD',
    `downloadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provisions` (
    `id` VARCHAR(191) NOT NULL,
    `legalInstrumentId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `type` ENUM('BAB', 'BAGIAN', 'PARAGRAF', 'PASAL', 'AYAT', 'HURUF', 'ANGKA', 'PENJELASAN_UMUM', 'PENJELASAN_PASAL') NOT NULL,
    `orderIndex` DOUBLE NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `canonicalPath` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `provisions_canonicalPath_idx`(`canonicalPath`),
    UNIQUE INDEX `provisions_legalInstrumentId_canonicalPath_key`(`legalInstrumentId`, `canonicalPath`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provision_revisions` (
    `id` VARCHAR(191) NOT NULL,
    `provisionId` VARCHAR(191) NOT NULL,
    `versionTag` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `explanation` TEXT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `effectiveUntil` DATETIME(3) NULL,
    `changeSetId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `change_sets` (
    `id` VARCHAR(191) NOT NULL,
    `amendingInstrumentId` VARCHAR(191) NOT NULL,
    `targetInstrumentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `legalBasisNote` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `change_operations` (
    `id` VARCHAR(191) NOT NULL,
    `changeSetId` VARCHAR(191) NOT NULL,
    `targetProvisionId` VARCHAR(191) NOT NULL,
    `operationType` ENUM('ADD_PROVISION', 'REPLACE_PROVISION', 'REPEAL_PROVISION', 'PARTIAL_REPEAL', 'RENUMBER', 'JUDICIAL_OVERRIDE') NOT NULL,
    `sourceReference` VARCHAR(191) NOT NULL,
    `previousContent` TEXT NULL,
    `newContent` TEXT NULL,
    `payloadJson` JSON NULL,
    `orderInSet` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publications` (
    `id` VARCHAR(191) NOT NULL,
    `legalInstrumentId` VARCHAR(191) NOT NULL,
    `versionName` VARCHAR(191) NOT NULL,
    `asOfDate` DATETIME(3) NOT NULL,
    `snapshotJson` JSON NOT NULL,
    `isCurrentActive` BOOLEAN NOT NULL DEFAULT false,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `judicial_annotations` (
    `id` VARCHAR(191) NOT NULL,
    `provisionId` VARCHAR(191) NOT NULL,
    `court` ENUM('MK', 'MA') NOT NULL DEFAULT 'MK',
    `caseNumber` VARCHAR(191) NOT NULL,
    `rulingDate` DATETIME(3) NOT NULL,
    `effect` ENUM('BATAL_SELURUHNYA', 'INKONSTITUSIONAL_BERSYARAT', 'KONSTITUSIONAL_BERSYARAT', 'TIDAK_DITERIMA_NO', 'DITOLAK') NOT NULL,
    `affectedPhrase` VARCHAR(191) NULL,
    `ratioDecidendi` TEXT NOT NULL,
    `rulingVerdict` TEXT NOT NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_records` (
    `id` VARCHAR(191) NOT NULL,
    `changeSetId` VARCHAR(191) NOT NULL,
    `reviewerName` VARCHAR(191) NOT NULL,
    `reviewerRole` VARCHAR(191) NOT NULL,
    `decision` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('MAHASISWA', 'DOSEN', 'KURATOR', 'ADMIN') NOT NULL DEFAULT 'MAHASISWA',
    `isDemo` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_token_key`(`token`),
    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `source_documents` ADD CONSTRAINT `source_documents_legalInstrumentId_fkey` FOREIGN KEY (`legalInstrumentId`) REFERENCES `legal_instruments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provisions` ADD CONSTRAINT `provisions_legalInstrumentId_fkey` FOREIGN KEY (`legalInstrumentId`) REFERENCES `legal_instruments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provisions` ADD CONSTRAINT `provisions_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `provisions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provision_revisions` ADD CONSTRAINT `provision_revisions_provisionId_fkey` FOREIGN KEY (`provisionId`) REFERENCES `provisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provision_revisions` ADD CONSTRAINT `provision_revisions_changeSetId_fkey` FOREIGN KEY (`changeSetId`) REFERENCES `change_sets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `change_sets` ADD CONSTRAINT `change_sets_amendingInstrumentId_fkey` FOREIGN KEY (`amendingInstrumentId`) REFERENCES `legal_instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `change_sets` ADD CONSTRAINT `change_sets_targetInstrumentId_fkey` FOREIGN KEY (`targetInstrumentId`) REFERENCES `legal_instruments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `change_operations` ADD CONSTRAINT `change_operations_changeSetId_fkey` FOREIGN KEY (`changeSetId`) REFERENCES `change_sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `change_operations` ADD CONSTRAINT `change_operations_targetProvisionId_fkey` FOREIGN KEY (`targetProvisionId`) REFERENCES `provisions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `publications` ADD CONSTRAINT `publications_legalInstrumentId_fkey` FOREIGN KEY (`legalInstrumentId`) REFERENCES `legal_instruments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `judicial_annotations` ADD CONSTRAINT `judicial_annotations_provisionId_fkey` FOREIGN KEY (`provisionId`) REFERENCES `provisions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_records` ADD CONSTRAINT `review_records_changeSetId_fkey` FOREIGN KEY (`changeSetId`) REFERENCES `change_sets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

