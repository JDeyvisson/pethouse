-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TUTOR', 'CUIDADOR');

-- CreateEnum
CREATE TYPE "ReservaStatus" AS ENUM ('PROXIMA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TUTOR',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3),
    "photoUrl" TEXT,
    "vaccinesUpToDate" BOOLEAN NOT NULL DEFAULT false,
    "usesMedication" BOOLEAN NOT NULL DEFAULT false,
    "medicationDesc" TEXT,
    "healthCondition" TEXT,
    "foodRestriction" BOOLEAN NOT NULL DEFAULT false,
    "foodRestDesc" TEXT,
    "foodBrand" TEXT,
    "behaviorDogs" TEXT,
    "behaviorCats" TEXT,
    "behaviorKids" TEXT,
    "energyLevel" INTEGER,
    "hasEscaped" BOOLEAN NOT NULL DEFAULT false,
    "escapeDesc" TEXT,
    "fearOfNoise" BOOLEAN NOT NULL DEFAULT false,
    "staysAlone" BOOLEAN NOT NULL DEFAULT false,
    "sleepsAlone" BOOLEAN NOT NULL DEFAULT false,
    "neutered" BOOLEAN NOT NULL DEFAULT false,
    "behaviorNotes" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "emergencyRelation" TEXT,
    "vetClinic" TEXT,
    "vetPhone" TEXT,
    "vetAddress" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "housingType" TEXT NOT NULL,
    "fencedYard" BOOLEAN NOT NULL DEFAULT false,
    "spaceSize" TEXT NOT NULL,
    "spaceDesc" TEXT,
    "spacePhotos" TEXT[],
    "hasOtherAnimals" BOOLEAN NOT NULL DEFAULT false,
    "otherAnimalsDesc" TEXT,
    "hasChildren" BOOLEAN NOT NULL DEFAULT false,
    "childrenAge" TEXT,
    "worksOutside" BOOLEAN NOT NULL DEFAULT false,
    "maxPets" TEXT NOT NULL DEFAULT '1',
    "acceptedSizes" TEXT[],
    "acceptedSpecies" TEXT[],
    "canAdminMeds" BOOLEAN NOT NULL DEFAULT false,
    "specialNeedsExp" BOOLEAN NOT NULL DEFAULT false,
    "hasHostedBefore" BOOLEAN NOT NULL DEFAULT false,
    "hostingTime" TEXT,
    "experiencedBreeds" TEXT,
    "bio" TEXT,
    "cpf" TEXT,
    "docPhotoUrl" TEXT,
    "housePhotos" TEXT[],
    "pricePerDay" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "averageRating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "status" "ReservaStatus" NOT NULL DEFAULT 'PROXIMA',
    "service" TEXT NOT NULL DEFAULT 'Hospedagem',
    "price" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "petId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HostProfile_userId_key" ON "HostProfile"("userId");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostProfile" ADD CONSTRAINT "HostProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "HostProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
