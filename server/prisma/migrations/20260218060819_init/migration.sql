-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "warehouseId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
