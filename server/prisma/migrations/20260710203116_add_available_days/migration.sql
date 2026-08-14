-- AlterTable
ALTER TABLE "HostProfile" ADD COLUMN     "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[];
