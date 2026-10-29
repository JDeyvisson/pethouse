ALTER TABLE "Pet" ADD COLUMN "requestKey" TEXT;
CREATE UNIQUE INDEX "Pet_requestKey_key" ON "Pet"("requestKey");
