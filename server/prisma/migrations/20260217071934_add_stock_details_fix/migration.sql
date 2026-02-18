/*
  Warnings:

  - You are about to drop the column `quantity` on the `StockTransfer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CreditDebitNote" ADD COLUMN     "boxQuantity" INTEGER DEFAULT 0,
ADD COLUMN     "itemQuantity" INTEGER DEFAULT 0,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "StockTransfer" DROP COLUMN "quantity",
ADD COLUMN     "boxQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "itemQuantity" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "CreditDebitNote" ADD CONSTRAINT "CreditDebitNote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditDebitNote" ADD CONSTRAINT "CreditDebitNote_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
