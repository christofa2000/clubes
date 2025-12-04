-- AddColumn
ALTER TABLE "Club" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AddColumn
ALTER TABLE "Club" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AddColumn
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);



